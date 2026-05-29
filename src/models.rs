use anyhow::Result;
use serde::Deserialize;

/// Raw market from Polymarket Gamma API
#[derive(Debug, Clone, Deserialize)]
pub struct GammaMarket {
    #[serde(default)]
    pub id: String,
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
    pub clob_token_ids: Option<String>,
    #[serde(default)]
    pub neg_risk: Option<bool>,
    #[serde(default)]
    pub volume: Option<f64>,
    #[serde(default)]
    pub liquidity: Option<f64>,
    #[serde(default)]
    pub spread: Option<f64>,
    #[serde(default)]
    pub start_date: Option<String>,
    #[serde(default)]
    pub end_date: Option<String>,
    #[serde(default)]
    pub end_date_iso: Option<String>,
    #[serde(default)]
    pub active: Option<bool>,
    #[serde(default)]
    pub closed: Option<bool>,
    #[serde(default)]
    pub winner: Option<String>,
}

/// Our clean event model for Supabase
#[derive(Debug, Clone)]
pub struct Event {
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
    pub clob_token_ids: Option<Vec<String>>,
    pub neg_risk: bool,
    pub outcomes: Option<Vec<String>>,
    pub active: bool,
    pub resolved: bool,
    pub winner: Option<String>,
}
