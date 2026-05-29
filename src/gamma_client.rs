use anyhow::{Context, Result};
use reqwest::Client;
use serde::Deserialize;
use tracing;

use crate::models::{Event, GammaMarket};

/// Fetches active markets from Polymarket Gamma API
pub struct GammaClient {
    client: Client,
}

impl GammaClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
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

            let markets: Vec<GammaMarket> = self
                .client
                .get(&url)
                .send()
                .await
                .context(format!("Failed to fetch markets at offset {}", offset))?
                .json()
                .await
                .context(format!("Failed to parse markets at offset {}", offset))?;

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

    /// Convert a GammaMarket into our clean Event model
    pub fn market_to_event(m: GammaMarket) -> Option<Event> {
        let active = m.active.unwrap_or(true);
        let closed = m.closed.unwrap_or(false);
        let resolved = closed && m.winner.is_some();
        let id = m.id;
        let question = m.question.unwrap_or_else(|| "Unknown".to_string());

        // Parse prices from outcomes if available
        let (yes_price, no_price) = Self::parse_prices(&m.outcomes);

        // Parse token IDs
        let clob_token_ids = m.clob_token_ids.as_ref().and_then(|raw| {
            serde_json::from_str::<Vec<String>>(raw).ok()
        });

        // Parse outcome names
        let outcomes = m.outcomes.as_ref().and_then(|raw| {
            // Outcomes JSON is like: [{"name":"Yes","price":"0.014"},{"name":"No","price":"0.986"}]
            #[derive(Deserialize)]
            struct Outcome {
                name: Option<String>,
            }
            serde_json::from_str::<Vec<Outcome>>(raw)
                .ok()
                .map(|v| v.into_iter().filter_map(|o| o.name).collect::<Vec<_>>())
                .filter(|v| !v.is_empty())
        });

        let end_date = m.end_date.or(m.end_date_iso);

        Some(Event {
            id,
            question,
            slug: m.slug,
            category: m.category,
            subcategory: m.subcategory,
            yes_price,
            no_price,
            volume: m.volume.unwrap_or(0.0),
            liquidity: m.liquidity.unwrap_or(0.0),
            spread: m.spread,
            start_date: m.start_date,
            end_date,
            clob_token_ids,
            neg_risk: m.neg_risk.unwrap_or(false),
            outcomes,
            active: active && !closed,
            resolved,
            winner: m.winner,
        })
    }

    fn parse_prices(outcomes_json: &Option<String>) -> (f64, f64) {
        let raw = match outcomes_json {
            Some(s) => s,
            None => return (0.0, 0.0),
        };

        #[derive(Deserialize)]
        struct OutcomePrice {
            price: Option<String>,
        }

        let outcomes: Vec<OutcomePrice> = match serde_json::from_str(raw) {
            Ok(v) => v,
            Err(_) => return (0.0, 0.0),
        };

        let mut prices = outcomes
            .iter()
            .filter_map(|o| o.price.as_ref())
            .filter_map(|p| p.parse::<f64>().ok());

        let yes_price = prices.next().unwrap_or(0.0);
        let no_price = prices.next().unwrap_or(0.0);
        (yes_price, no_price)
    }
}
