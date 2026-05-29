mod db;
mod gamma_client;
mod models;

use anyhow::Result;
use sqlx::PgPool;
use std::env;
use std::time::Instant;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    // Connect to Supabase PostgreSQL
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set (get it from Supabase Project Settings → Database → Connection string)");

    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to Supabase PostgreSQL");

    tracing::info!("Connected to Supabase PostgreSQL");

    // Run initial sync
    sync_once(&pool).await?;

    // Print instructions
    println!();
    println!("═══ Polymarket Fantasy Sync Bot ═══");
    println!("Sync complete! Set DATABASE_URL in .env and run again to sync.");
    println!("Add to crontab for periodic sync:");
    println!("  */30 * * * * cd /path/to/polymarket-fantasy && cargo run --release 2>&1 | logger -t poly-fantasy");
    println!();

    Ok(())
}

async fn sync_once(pool: &PgPool) -> Result<()> {
    tracing::info!("Starting Polymarket sync...");
    let start = Instant::now();

    let gamma = gamma_client::GammaClient::new();
    let markets = gamma.fetch_active_markets().await?;
    tracing::info!("Fetched {} raw markets from Polymarket", markets.len());

    // Convert to events
    let events: Vec<models::Event> = markets
        .into_iter()
        .filter_map(gamma_client::GammaClient::market_to_event)
        .collect();

    tracing::info!("Converted {} events", events.len());

    // Sync to Supabase
    let (synced, total) = db::sync_events(pool, &events).await?;
    let elapsed = start.elapsed();

    tracing::info!(
        "Sync complete: {}/{} events synced in {:.2}s",
        synced,
        total,
        elapsed.as_secs_f64()
    );

    Ok(())
}
