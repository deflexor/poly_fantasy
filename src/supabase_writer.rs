use anyhow::{Context, Result};
use reqwest::Client;
use serde_json::json;
use std::time::Duration;

#[derive(Debug, Clone, serde::Serialize)]
pub struct ParsedEvent {
    pub id: String,
    pub question: String,
    pub slug: Option<String>,
    pub category: Option<String>,
    pub subcategory: Option<String>,
    pub yes_price: f64,
    pub no_price: f64,
    pub volume: f64,
    pub liquidity: f64,
    pub spread: Option<f64>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub clob_token_ids: Option<String>,
    pub neg_risk: bool,
    pub outcomes: Option<String>,
    pub active: bool,
    pub resolved: bool,
    pub winner: Option<String>,
}

pub struct SupabaseWriter {
    client: Client,
    base_url: String,
    service_key: String,
}

impl SupabaseWriter {
    pub fn new(supabase_url: String, service_key: String) -> Self {
        Self {
            client: Client::builder()
                .user_agent("polyfantasy-sync/1.0")
                .timeout(Duration::from_secs(30))
                .connect_timeout(Duration::from_secs(10))
                .build()
                .expect("Failed to build HTTP client"),
            base_url: supabase_url.trim_end_matches('/').to_string() + "/rest/v1",
            service_key,
        }
    }

    fn headers(&self) -> reqwest::header::HeaderMap {
        use reqwest::header;
        let mut h = header::HeaderMap::new();
        h.insert(header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", self.service_key)).unwrap());
        h.insert(header::HeaderName::from_static("apikey"),
            header::HeaderValue::from_str(&self.service_key).unwrap());
        h.insert(header::HeaderName::from_static("prefer"),
            header::HeaderValue::from_static("resolution=merge-duplicates"));
        h
    }

    pub async fn upsert_event(&self, event: &ParsedEvent) -> Result<()> {
        let body = json!({
            "id": event.id,
            "question": event.question,
            "slug": event.slug,
            "category": event.category,
            "subcategory": event.subcategory,
            "yes_price": event.yes_price,
            "no_price": event.no_price,
            "volume": event.volume,
            "liquidity": event.liquidity,
            "spread": event.spread,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "clob_token_ids": event.clob_token_ids,
            "neg_risk": event.neg_risk,
            "outcomes": event.outcomes,
            "active": event.active,
            "resolved": event.resolved,
            "winner": event.winner,
        });

        let resp = self.client
            .post(&format!("{}/events", self.base_url))
            .headers(self.headers())
            .json(&body)  // .json() sets Content-Type — no manual Content-Type header!
            .send().await
            .context(format!("event {}", event.id))?;

        if !resp.status().is_success() {
            anyhow::bail!("Supabase {}: {}", resp.status(), resp.text().await.unwrap_or_default());
        }
        Ok(())
    }

    /// GET from Supabase REST, parses as JSON array
    pub async fn get<T: serde::de::DeserializeOwned>(&self, path: &str) -> Result<Vec<T>> {
        let url = format!("{}/{}", self.base_url, path);
        let mut h = self.headers();
        h.remove("prefer");
        let resp = self.client
            .get(&url)
            .headers(h)
            .send()
            .await
            .context(format!("GET {}", path))?;
        let body = resp.text().await.context("read GET body")?;
        serde_json::from_str(&body).context(format!("parse GET: {}..", &body[..body.len().min(60)]))
    }

    /// PATCH rows
    pub async fn patch(&self, path: &str, body: serde_json::Value) -> Result<()> {
        let url = format!("{}/{}", self.base_url, path);
        let resp = self.client
            .patch(&url)
            .headers(self.headers())
            .json(&body)
            .send()
            .await
            .context(format!("PATCH {}", path))?;
        if !resp.status().is_success() {
            anyhow::bail!("PATCH {}: {} {}", path, resp.status(), resp.text().await.unwrap_or_default());
        }
        Ok(())
    }

    /// Find resolved events and resolve pending bets
    /// Find resolved events and resolve pending bets
    pub async fn resolve_bets(&self) -> Result<usize> {
        #[derive(serde::Deserialize)]
        struct ResolvedEvent { id: String, winner: Option<String> }

        let events: Vec<ResolvedEvent> = self
            .get("events?select=id,winner&resolved=eq.true&not.winner=is.null&limit=1000")
            .await?;

        #[derive(serde::Deserialize)]
        struct PendingBet {
            id: String, user_id: String, side: String, amount_cents: i64,
        }

        let mut n = 0usize;
        for ev in &events {
            let winner = match &ev.winner { Some(w) => w.to_lowercase(), None => continue };
            let bets: Vec<PendingBet> = self
                .get(&format!("bets?select=id,user_id,side,amount_cents&event_id=eq.{}&status=eq.pending&limit=1000", ev.id))
                .await?;

            for bet in &bets {
                let won = (bet.side == "YES" && winner == "yes")
                    || (bet.side == "NO" && winner == "no")
                    || bet.side.to_lowercase() == winner;

                self.patch(
                    &format!("bets?id=eq.{}", bet.id),
                    json!({"status": if won { "won" } else { "lost" }, "resolved_at": "now()"}),
                ).await?;

                if won {
                    // Call Supabase RPC to add winnings to balance
                    let url = format!("{}/rpc/award_winnings", self.base_url);
                    let resp = self.client
                        .post(&url)
                        .headers(self.headers())
                        .json(&json!({"p_id": bet.user_id, "p_amount": bet.amount_cents * 2}))
                        .send()
                        .await?;
                    if !resp.status().is_success() {
                        tracing::warn!("award_winnings failed for {}: {}", bet.user_id, resp.text().await.unwrap_or_default());
                    }
                }
                n += 1;
            }
        }
        Ok(n)
    }
}
