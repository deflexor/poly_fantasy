mod gamma_client;
mod supabase_writer;

use std::time::Instant;
use futures::future::join_all;
use tracing_subscriber::EnvFilter;

#[tokio::main(flavor = "current_thread")]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let supabase_url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL must be set");
    let service_key = std::env::var("SUPABASE_SERVICE_KEY").expect("SUPABASE_SERVICE_KEY must be set");
    let writer = supabase_writer::SupabaseWriter::new(supabase_url, service_key);

    tracing::info!("Polymarket Fantasy Sync — Supabase REST");

    let start = Instant::now();
    let gamma = gamma_client::GammaClient::new();
    let markets = gamma.fetch_active_markets().await?;
    tracing::info!("Fetched {} raw markets", markets.len());

    let events: Vec<supabase_writer::ParsedEvent> = markets
        .into_iter()
        .filter_map(gamma_client::GammaClient::market_to_event)
        .collect();

    let total = events.len();
    let concurrency = 10;
    let mut synced = 0usize;
    let mut failed = 0usize;

    for chunk in events.chunks(concurrency) {
        let results = join_all(chunk.iter().map(|e| writer.upsert_event(e))).await;
        for r in &results {
            match r {
                Ok(()) => synced += 1,
                Err(e) => {
                    failed += 1;
                    if failed <= 5 {
                        tracing::error!("Write error: {}", e);
                    }
                }
            }
        }
    }

    tracing::info!(
        "Synced {}/{} (+{} errors) in {:.2}s",
        synced, total, failed, start.elapsed().as_secs_f64()
    );
    Ok(())
}
