mod gamma_client;
mod supabase_writer;

use std::time::Instant;
use tracing_subscriber::EnvFilter;

#[tokio::main(flavor = "current_thread")]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let supabase_url = std::env::var("SUPABASE_URL")
        .expect("SUPABASE_URL must be set (e.g. https://xxxx.supabase.co)");
    let service_key = std::env::var("SUPABASE_SERVICE_KEY")
        .expect("SUPABASE_SERVICE_KEY must be set (service_role key)");

    let writer = supabase_writer::SupabaseWriter::new(supabase_url, service_key);

    // Run sync
    sync_once(&writer).await?;

    println!();
    println!("═══ Polymarket Fantasy Sync ═══");
    println!("Sync complete! Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env");
    println!("Runs every 15 min when scheduled via crontab:");
    println!("  */15 * * * * cd /path && cargo run --release 2>&1 | logger -t poly-fantasy");
    println!();

    Ok(())
}

async fn sync_once(writer: &supabase_writer::SupabaseWriter) -> anyhow::Result<()> {
    tracing::info!("Starting Polymarket sync → Supabase REST...");
    let start = Instant::now();

    let gamma = gamma_client::GammaClient::new();
    let markets = gamma.fetch_active_markets().await?;
    tracing::info!("Fetched {} raw markets", markets.len());

    let events: Vec<supabase_writer::ParsedEvent> = markets
        .into_iter()
        .filter_map(gamma_client::GammaClient::market_to_event)
        .collect();

    let total = events.len();
    let mut synced = 0;

    for event in &events {
        match writer.upsert_event(event).await {
            Ok(()) => synced += 1,
            Err(e) => tracing::error!("Failed to sync {}: {}", event.id, e),
        }
    }

    let elapsed = start.elapsed();
    tracing::info!(
        "Sync complete: {}/{} events synced in {:.2}s",
        synced, total, elapsed.as_secs_f64()
    );
    Ok(())
}
