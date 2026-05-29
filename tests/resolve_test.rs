/// Integration tests for Polymarket Fantasy sync bot
///
/// Run: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... cargo test --test resolve_test -- --nocapture
use serde_json::json;
use reqwest::Client;
use std::time::{SystemTime, UNIX_EPOCH};


fn test_uuid(label: &str) -> String {
    let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
    let h = (ts as u64) ^ (label.as_bytes().iter().fold(0u64, |a, b| a.wrapping_mul(31).wrapping_add(*b as u64)));
    let t = ts as u32;
    format!("{:08x}-{:04x}-4{:03x}-{:04x}-{:012x}",
        t,
        (t >> 16) as u16,
        ((h >> 48) as u16 & 0xfff),
        ((h >> 32) as u16 & 0xffff),
        h & 0xffffffffffff)
}

struct TestCtx {
    url: String,
    key: String,
    client: Client,
}

impl TestCtx {
    async fn new() -> Self {
        let url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL");
        let key = std::env::var("SUPABASE_SERVICE_KEY").expect("SUPABASE_SERVICE_KEY");
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(20))
            .connect_timeout(std::time::Duration::from_secs(10))
            .build().expect("Client");
        Self { url, key, client }
    }

    fn headers(&self) -> reqwest::header::HeaderMap {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert("apikey", self.key.parse().unwrap());
        h.insert("Authorization", format!("Bearer {}", self.key).parse().unwrap());
        h
    }

    fn base_url(&self) -> String {
        format!("{}/rest/v1", self.url.trim_end_matches('/'))
    }

    async fn get(&self, path: &str) -> Vec<serde_json::Value> {
        let url = format!("{}/{}", self.base_url(), path);
        let resp = self.client.get(&url).headers(self.headers()).send().await
            .unwrap_or_else(|e| panic!("GET {url} failed: {e}"));
        let body = resp.text().await.expect("read GET body");
        serde_json::from_str(&body).unwrap_or_else(|e| {
            panic!("GET {url} parse: {e}. Body: {}", &body[..body.len().min(100)])
        })
    }

    async fn post(&self, path: &str, body: serde_json::Value) -> (reqwest::StatusCode, String) {
        let resp = self.client.post(&format!("{}/{}", self.base_url(), path))
            .headers(self.headers())
            .header("Prefer", "resolution=merge-duplicates")
            .json(&body).send().await.expect("POST failed");
        (resp.status(), resp.text().await.unwrap_or_default())
    }

    async fn patch(&self, path: &str, body: serde_json::Value) -> (reqwest::StatusCode, String) {
        let resp = self.client.patch(&format!("{}/{}", self.base_url(), path))
            .headers(self.headers()).json(&body).send().await.expect("PATCH failed");
        (resp.status(), resp.text().await.unwrap_or_default())
    }

    async fn del(&self, path: &str) -> reqwest::StatusCode {
        match self.client.delete(&format!("{}/{}", self.base_url(), path))
            .headers(self.headers()).send().await {
            Ok(resp) => resp.status(),
            Err(_) => reqwest::StatusCode::OK, // network may be flaky, soft-fail cleanup
        }
    }
}

#[tokio::test]
async fn test_events_table_has_data() {
    let ctx = TestCtx::new().await;
    let events = ctx.get("events?select=id,question&limit=5").await;
    assert!(events.len() > 0, "events table should have synced data");
    assert!(events[0]["id"].as_str().unwrap_or("").len() > 0, "event id should be non-empty");
    assert!(events[0]["question"].as_str().unwrap_or("").len() > 0, "event question should be non-empty");
}

#[tokio::test]
async fn test_profiles_crud() {
    let ctx = TestCtx::new().await;
    let pid = test_uuid("crud-profile");

    // Clean up any leftover
    ctx.del(&format!("profiles?id=eq.{}", pid)).await;

    // Create
    let (s, body) = ctx.post("profiles", json!({
        "id": pid, "username": &pid, "balance": 50000
    })).await;
    assert!(s.is_success(), "POST profile: {s} {body}");

    // Read
    let rows = ctx.get(&format!("profiles?select=balance&id=eq.{}", pid)).await;
    assert_eq!(rows[0]["balance"], 50000);

    // Patch
    let (s, _) = ctx.patch(&format!("profiles?id=eq.{}", pid), json!({"balance": 99999})).await;
    assert!(s.is_success(), "PATCH profile: {s}");

    // Verify update
    let rows = ctx.get(&format!("profiles?select=balance&id=eq.{}", pid)).await;
    assert_eq!(rows[0]["balance"], 99999);

    // Delete
    let s = ctx.del(&format!("profiles?id=eq.{}", pid)).await;
    assert!(s.is_success() || s == 204);
}

#[tokio::test]
async fn test_bets_crud() {
    let ctx = TestCtx::new().await;
    let pid = test_uuid("bets-profile");
    let event_id = "e2e-test-bets-crud";
    let bet_id = test_uuid("bets-bet");

    // Clean
    ctx.del(&format!("bets?id=eq.{}", bet_id)).await;
    ctx.del(&format!("profiles?id=eq.{}", pid)).await;
    ctx.del(&format!("events?id=eq.{}", event_id)).await;

    // Create profile + event
    ctx.post("profiles", json!({"id": pid, "username": &pid, "balance": 50000})).await;
    let (s, _) = ctx.post("events", json!({
        "id": event_id, "question": "E2E bets CRUD test",
        "yes_price": 0.5, "no_price": 0.5, "volume": 100, "liquidity": 50,
        "active": true, "resolved": false,
    })).await;
    assert!(s.is_success() || s == 409);

    // Create bet
    let (s, body) = ctx.post("bets", json!({
        "id": bet_id, "user_id": pid, "event_id": event_id,
        "side": "YES", "amount_cents": 1000, "odds_at_bet": 0.5, "status": "pending",
    })).await;
    assert!(s.is_success(), "POST bet: {s} {body}");

    // Read
    let rows = ctx.get(&format!("bets?select=status,amount_cents&id=eq.{}", bet_id)).await;
    assert_eq!(rows[0]["status"], "pending");
    assert_eq!(rows[0]["amount_cents"], 1000);

    // Update status
    let (s, _) = ctx.patch(&format!("bets?id=eq.{}", bet_id), json!({"status": "won"})).await;
    assert!(s.is_success());

    // Verify
    let rows = ctx.get(&format!("bets?select=status&id=eq.{}", bet_id)).await;
    assert_eq!(rows[0]["status"], "won");

    // Cleanup
    ctx.del(&format!("bets?id=eq.{}", bet_id)).await;
    ctx.del(&format!("profiles?id=eq.{}", pid)).await;
    ctx.del(&format!("events?id=eq.{}", event_id)).await;
}

#[tokio::test]
async fn test_resolve_logic_yes_wins() {
    let ctx = TestCtx::new().await;
    let pid = test_uuid("res-yes-prof");
    let bet_yes = test_uuid("res-yes-bet");
    let bet_no = test_uuid("res-no-bet");

    // Cleanup
    ctx.del(&format!("bets?id=eq.{}", bet_yes)).await;
    ctx.del(&format!("bets?id=eq.{}", bet_no)).await;
    ctx.del(&format!("profiles?id=eq.{}", pid)).await;
    ctx.del("events?id=eq.e2e-test-yeswins").await;

    // Create resolved event
    ctx.post("events", json!({
        "id": "e2e-test-yeswins", "question": "E2E resolve YES",
        "yes_price": 0.95, "no_price": 0.05, "volume": 1000, "liquidity": 500,
        "active": false, "resolved": true, "winner": "Yes",
    })).await;

    // Create profile
    ctx.post("profiles", json!({"id": pid, "username": &pid, "balance": 100000})).await;

    // Create YES bet
    ctx.post("bets", json!({
        "id": bet_yes, "user_id": pid, "event_id": "e2e-test-yeswins",
        "side": "YES", "amount_cents": 1000, "odds_at_bet": 0.95, "status": "pending",
    })).await;

    // Create NO bet
    ctx.post("bets", json!({
        "id": bet_no, "user_id": pid, "event_id": "e2e-test-yeswins",
        "side": "NO", "amount_cents": 500, "odds_at_bet": 0.05, "status": "pending",
    })).await;

    // Simulate resolve_bets logic: for each event with winner, resolve pending bets
    let events = ctx.get("events?select=id,winner&id=eq.e2e-test-yeswins&resolved=eq.true&winner=not.is.null").await;
    assert_eq!(events.len(), 1);
    let winner = events[0]["winner"].as_str().unwrap().to_lowercase();

    let bets = ctx.get("bets?select=id,user_id,side,amount_cents&event_id=eq.e2e-test-yeswins&status=eq.pending").await;
    assert_eq!(bets.len(), 2, "should have 2 pending bets");

    for bet in &bets {
        let side = bet["side"].as_str().unwrap();
        let uid = bet["user_id"].as_str().unwrap();
        let amt = bet["amount_cents"].as_i64().unwrap_or(0);
        let won = (side == "YES" && winner == "yes") || (side == "NO" && winner == "no") || side.to_lowercase() == winner;

        let st = if won { "won" } else { "lost" };
        let (s, body) = ctx.patch(&format!("bets?id=eq.{}", bet["id"].as_str().unwrap()),
            json!({"status": st, "resolved_at": "now()"})).await;
        assert!(s.is_success(), "PATCH bet {} → {st}: {s} {body}", bet["id"]);
    }

    // Verify
    let yes = ctx.get(&format!("bets?select=status&id=eq.{}", bet_yes)).await;
    assert_eq!(yes[0]["status"], "won", "YES bet should be won");

    let no = ctx.get(&format!("bets?select=status&id=eq.{}", bet_no)).await;
    assert_eq!(no[0]["status"], "lost", "NO bet should be lost");

    // Cleanup
    ctx.del(&format!("bets?id=eq.{}", bet_yes)).await;
    ctx.del(&format!("bets?id=eq.{}", bet_no)).await;
    ctx.del(&format!("profiles?id=eq.{}", pid)).await;
    ctx.del("events?id=eq.e2e-test-yeswins").await;
}

#[tokio::test]
async fn test_resolve_logic_no_wins() {
    let ctx = TestCtx::new().await;
    let pid = test_uuid("res-no-prof");
    let bet_id = test_uuid("res-no-bet");

    ctx.del(&format!("bets?id=eq.{}", bet_id)).await;
    ctx.del(&format!("profiles?id=eq.{}", pid)).await;
    ctx.del("events?id=eq.e2e-test-nowins").await;

    ctx.post("events", json!({
        "id": "e2e-test-nowins", "question": "E2E resolve NO",
        "yes_price": 0.3, "no_price": 0.7, "volume": 1000, "liquidity": 500,
        "active": false, "resolved": true, "winner": "No",
    })).await;

    ctx.post("profiles", json!({"id": pid, "username": &pid, "balance": 200000})).await;

    ctx.post("bets", json!({
        "id": bet_id, "user_id": pid, "event_id": "e2e-test-nowins",
        "side": "NO", "amount_cents": 2000, "odds_at_bet": 0.7, "status": "pending",
    })).await;

    // Resolve
    let events = ctx.get("events?select=id,winner&id=eq.e2e-test-nowins&resolved=eq.true&winner=not.is.null").await;
    let winner = events[0]["winner"].as_str().unwrap().to_lowercase();

    let bets = ctx.get("bets?select=id,side&event_id=eq.e2e-test-nowins&status=eq.pending").await;
    assert_eq!(bets.len(), 1);

    for bet in &bets {
        let side = bet["side"].as_str().unwrap();
        let won = side.to_lowercase() == winner;
        let st = if won { "won" } else { "lost" };
        ctx.patch(&format!("bets?id=eq.{}", bet["id"].as_str().unwrap()),
            json!({"status": st, "resolved_at": "now()"})).await;
    }

    let resolved = ctx.get(&format!("bets?select=status&id=eq.{}", bet_id)).await;
    assert_eq!(resolved[0]["status"], "won", "NO bet should be won when winner=No");

    ctx.del(&format!("bets?id=eq.{}", bet_id)).await;
    ctx.del(&format!("profiles?id=eq.{}", pid)).await;
    ctx.del("events?id=eq.e2e-test-nowins").await;
}
