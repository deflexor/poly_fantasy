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
}
