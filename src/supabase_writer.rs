use anyhow::{Context, Result};
use reqwest::Client;
use serde_json::json;

/// Parsed event from Gamma API, ready for Supabase
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

/// Writes events to Supabase REST API
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
                .build()
                .expect("Failed to build HTTP client"),
            base_url: supabase_url.trim_end_matches('/').to_string() + "/rest/v1",
            service_key,
        }
    }

    fn headers(&self) -> reqwest::header::HeaderMap {
        use reqwest::header;
        let mut headers = header::HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", self.service_key))
                .unwrap(),
        );
        headers.insert(
            header::HeaderName::from_static("apikey"),
            header::HeaderValue::from_str(&self.service_key).unwrap(),
        );
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/json"),
        );
        headers.insert(
            header::HeaderName::from_static("prefer"),
            header::HeaderValue::from_static("resolution=merge-duplicates"),
        );
        headers
    }

    /// Upsert an event via POST /rest/v1/events
    pub async fn upsert_event(&self, event: &ParsedEvent) -> Result<()> {
        let url = format!("{}/events", self.base_url);

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

        let response = self
            .client
            .post(&url)
            .headers(self.headers())
            .json(&body)
            .send()
            .await
            .context(format!("Failed to send event {}", event.id))?;

        let status = response.status();
        if !status.is_success() {
            let body_text = response.text().await.unwrap_or_default();
            anyhow::bail!(
                "Supabase REST returned {} for event {}: {}",
                status,
                event.id,
                body_text
            );
        }

        Ok(())
    }
}
