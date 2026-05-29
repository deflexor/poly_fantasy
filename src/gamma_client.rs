use anyhow::{Context, Result};
use reqwest::Client;
use serde::Deserialize;
use tracing;

pub use crate::supabase_writer::ParsedEvent;

/// Raw market from Polymarket Gamma API
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GammaMarket {
    #[serde(default)]
    pub id: serde_json::Value,
    #[serde(default)]
    pub question: Option<String>,
    #[serde(default)]
    pub slug: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub subcategory: Option<String>,
    #[serde(default)]
    pub outcomes: Option<String>,
    #[serde(default)]
    pub outcome_prices: Option<String>,
    #[serde(default)]
    pub clob_token_ids: Option<String>,
    #[serde(default)]
    pub neg_risk: Option<bool>,
    #[serde(default)]
    pub volume: Option<serde_json::Value>,
    #[serde(default)]
    pub liquidity: Option<serde_json::Value>,
    #[serde(default)]
    pub spread: Option<f64>,
    #[serde(default)]
    pub start_date: Option<String>,
    #[serde(default)]
    pub end_date: Option<String>,
    #[serde(default)]
    pub active: Option<bool>,
    #[serde(default)]
    pub closed: Option<bool>,
    #[serde(default)]
    pub winner: Option<String>,
}

/// Fetches active markets from Polymarket Gamma API
pub struct GammaClient {
    client: Client,
}

fn parse_json_number(v: &serde_json::Value) -> Option<f64> {
    match v {
        serde_json::Value::Number(n) => n.as_f64(),
        serde_json::Value::String(s) => s.parse::<f64>().ok(),
        _ => None,
    }
}

impl GammaClient {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .build()
                .expect("Failed to build HTTP client"),
        }
    }

    /// Fetch all active markets with pagination
    pub async fn fetch_active_markets(&self) -> Result<Vec<GammaMarket>> {
        let mut all_markets = Vec::new();
        let mut offset = 0;
        let limit = 100;

        loop {
            let url = format!(
                "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit={}&offset={}",
                limit, offset
            );

            let response = self
                .client
                .get(&url)
                .send()
                .await
                .context(format!("Failed to send request at offset {}", offset))?;

            let status = response.status();
            if !status.is_success() {
                let body = response.text().await.unwrap_or_default();
                // If offset too large, we've hit the max
                if status.as_u16() == 422 {
                    tracing::info!("Hit max offset ({}) — stopping pagination", offset);
                    break;
                }
                anyhow::bail!("Gamma API returned {}: {}", status, body);
            }

            let text = response
                .text()
                .await
                .context("Failed to read response body")?;

            let markets: Vec<GammaMarket> = serde_json::from_str(&text)
                .context("Failed to parse GammaMarket response")?;

            let count = markets.len();
            tracing::info!("Fetched page (offset {}): {} markets", offset, count);
            all_markets.extend(markets);

            if count < limit {
                break;
            }
            offset += limit;
        }

        Ok(all_markets)
    }

    /// Convert a GammaMarket into our clean ParsedEvent
    pub fn market_to_event(m: GammaMarket) -> Option<ParsedEvent> {
        let active = m.active.unwrap_or(true);
        let closed = m.closed.unwrap_or(false);
        let resolved = closed && m.winner.is_some();
        let question = m.question.unwrap_or_else(|| "Unknown".to_string());

        let (yes_price, no_price) = parse_prices(&m.outcome_prices);

        Some(ParsedEvent {
            id: format!("{}", m.id),
            question,
            slug: m.slug,
            category: m.category,
            subcategory: m.subcategory,
            yes_price,
            no_price,
            volume: m.volume.as_ref().and_then(parse_json_number).unwrap_or(0.0),
            liquidity: m.liquidity.as_ref().and_then(parse_json_number).unwrap_or(0.0),
            spread: m.spread,
            start_date: m.start_date,
            end_date: m.end_date,
            clob_token_ids: m.clob_token_ids,
            neg_risk: m.neg_risk.unwrap_or(false),
            outcomes: m.outcomes,
            active: active && !closed,
            resolved,
            winner: m.winner,
        })
    }
}

fn parse_prices(prices: &Option<String>) -> (f64, f64) {
    let json_str = match prices {
        Some(s) => s,
        None => return (0.0, 0.0),
    };
    let prices: Vec<String> = serde_json::from_str(json_str).unwrap_or_default();
    let yes = prices.first().and_then(|p| p.parse::<f64>().ok()).unwrap_or(0.0);
    let no = prices.get(1).and_then(|p| p.parse::<f64>().ok()).unwrap_or(0.0);
    (yes, no)
}
