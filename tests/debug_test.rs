/// Dedicated debug test
use reqwest::Client;

struct TestCtx {
    url: String,
    key: String,
    client: Client,
}

impl TestCtx {
    async fn new() -> Self {
        let url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL");
        let key = std::env::var("SUPABASE_SERVICE_KEY").expect("SUPABASE_SERVICE_KEY");
        let client = Client::new();
        Self { url, key, client }
    }

    fn headers(&self) -> reqwest::header::HeaderMap {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert("apikey", self.key.parse().unwrap());
        h.insert("Authorization", format!("Bearer {}", self.key).parse().unwrap());
        h
    }

    async fn rest_get(&self, path: &str) -> Vec<serde_json::Value> {
        let url = format!("{}/rest/v1/{}", self.url, path);
        eprintln!("DEBUG GET: {}", url);
        let resp = self.client
            .get(&url)
            .headers(self.headers())
            .send()
            .await
            .expect("GET failed");
        let status = resp.status();
        let body = resp.text().await.expect("read body");
        eprintln!("DEBUG status: {}, body[:100]: {}", status, &body[..body.len().min(100)]);
        serde_json::from_str(&body).expect("parse body")
    }
}

#[tokio::test]
async fn test_debug_basic() {
    let ctx = TestCtx::new().await;
    let events: Vec<serde_json::Value> = ctx.rest_get("events?select=id,question&limit=2").await;
    eprintln!("DEBUG got {} events", events.len());
    assert!(events.len() > 0);
}
