use anyhow::{Context, Result};
use sqlx::PgPool;

use crate::models::Event;

/// Insert or update an event in Supabase
pub async fn upsert_event(pool: &PgPool, event: &Event) -> Result<()> {
    let clob_json = event
        .clob_token_ids
        .as_ref()
        .map(|ids| serde_json::to_value(ids).unwrap_or(serde_json::Value::Null))
        .unwrap_or(serde_json::Value::Null);

    let outcomes_json = event
        .outcomes
        .as_ref()
        .map(|o| serde_json::to_value(o).unwrap_or(serde_json::Value::Null))
        .unwrap_or(serde_json::Value::Null);

    let end_date = event.end_date.as_ref().and_then(|d| {
        chrono::DateTime::parse_from_rfc3339(d)
            .ok()
            .map(|dt| dt.to_utc())
    });

    sqlx::query(
        r#"
        INSERT INTO events (
            id, question, slug, category, subcategory,
            yes_price, no_price, volume, liquidity, spread,
            start_date, end_date, clob_token_ids, neg_risk, outcomes,
            active, resolved, winner, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17, $18, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            yes_price = EXCLUDED.yes_price,
            no_price = EXCLUDED.no_price,
            volume = EXCLUDED.volume,
            liquidity = EXCLUDED.liquidity,
            spread = EXCLUDED.spread,
            active = EXCLUDED.active,
            resolved = EXCLUDED.resolved,
            winner = EXCLUDED.winner,
            updated_at = NOW()
        "#,
    )
    .bind(&event.id)
    .bind(&event.question)
    .bind(&event.slug)
    .bind(&event.category)
    .bind(&event.subcategory)
    .bind(event.yes_price)
    .bind(event.no_price)
    .bind(event.volume)
    .bind(event.liquidity)
    .bind(event.spread)
    .bind(&event.start_date)
    .bind(end_date)
    .bind(&clob_json)
    .bind(event.neg_risk)
    .bind(&outcomes_json)
    .bind(event.active)
    .bind(event.resolved)
    .bind(&event.winner)
    .execute(pool)
    .await
    .context("Failed to upsert event")?;

    Ok(())
}

/// Sync all events from Polymarket into Supabase
pub async fn sync_events(pool: &PgPool, events: &[Event]) -> Result<(usize, usize)> {
    let total = events.len();
    let mut synced = 0;

    for event in events {
        match upsert_event(pool, event).await {
            Ok(()) => synced += 1,
            Err(e) => {
                tracing::error!("Failed to sync event {}: {}", event.id, e);
            }
        }
    }

    // Mark events as inactive if they're no longer in the feed
    // (Only if we actually synced some events - don't wipe on empty feed)
    if total > 0 {
        let active_ids: Vec<String> = events.iter().map(|e| e.id.clone()).collect();
        sqlx::query(
            r#"
            UPDATE events SET active = false, updated_at = NOW()
            WHERE active = true AND id != ALL($1)
            "#,
        )
        .bind(&active_ids)
        .execute(pool)
        .await
        .context("Failed to deactivate stale events")?;
    }

    Ok((synced, total))
}
