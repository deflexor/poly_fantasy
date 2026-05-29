#!/usr/bin/env python3
"""Sync Polymarket events to Supabase REST API."""
import json
import os
import sys
import urllib.request
import time

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://vunkecnlysfuqlxnbqjq.supabase.co")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
GAMMA_API = "https://gamma-api.polymarket.com/markets"

def gamma_headers():
    return {"User-Agent": "Mozilla/5.0"}

def supabase_headers():
    return {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

def fetch_markets(limit=100, offset=0):
    url = f"{GAMMA_API}?active=true&closed=false&limit={limit}&offset={offset}"
    req = urllib.request.Request(url, headers=gamma_headers())
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 422:
            return None  # hit max offset
        raise

def sync_batch(events):
    url = f"{SUPABASE_URL}/rest/v1/events"
    payload = json.dumps(events).encode()
    req = urllib.request.Request(url, data=payload, headers=supabase_headers(), method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        return True
    except Exception as e:
        print(f"  Batch error: {e}", file=sys.stderr)
        return False

def main():
    print("Starting Polymarket sync → Supabase REST...", flush=True)
    start = time.time()
    all_events = []
    offset = 0
    limit = 100

    # Fetch all markets
    while True:
        markets = fetch_markets(limit, offset)
        if markets is None:
            print(f"Hit max offset ({offset}) — stopping", flush=True)
            break
        if not markets:
            break
        all_events.extend(markets)
        print(f"  Fetched {len(markets)} at offset {offset} (total: {len(all_events)})", flush=True)
        offset += limit

    print(f"Fetched {len(all_events)} raw markets", flush=True)

    # Convert to clean events
    events = []
    for m in all_events:
        try:
            vol = float(m.get("volume", 0) or 0)
            liq = float(m.get("liquidity", 0) or 0)

            # Extract prices from outcomePrices
            yes_price, no_price = 0.5, 0.5
            prices_str = m.get("outcomePrices")
            if prices_str:
                try:
                    prices = json.loads(prices_str)
                    if len(prices) > 0: yes_price = float(prices[0])
                    if len(prices) > 1: no_price = float(prices[1])
                except: pass

            events.append({
                "id": m.get("id", ""),
                "question": m.get("question", ""),
                "slug": m.get("slug"),
                "category": m.get("category"),
                "subcategory": m.get("subcategory"),
                "yes_price": yes_price,
                "no_price": no_price,
                "volume": vol,
                "liquidity": liq,
                "spread": None,
                "start_date": m.get("startDate"),
                "end_date": m.get("endDate"),
                "clob_token_ids": m.get("clobTokenIds"),
                "neg_risk": bool(m.get("negRisk", False)),
                "outcomes": m.get("outcomes"),
                "active": m.get("active", True) and not m.get("closed", False),
                "resolved": bool(m.get("closed") and m.get("winner")),
                "winner": m.get("winner"),
            })
        except Exception as e:
            print(f"  Skip event {m.get('id', '?')}: {e}", file=sys.stderr)

    # Write in batches
    batch_size = 10
    synced = 0
    for i in range(0, len(events), batch_size):
        batch = events[i:i+batch_size]
        if sync_batch(batch):
            synced += len(batch)
        sys.stdout.write(f"\r  Synced {synced}/{len(events)}")
        sys.stdout.flush()

    elapsed = time.time() - start
    print(f"\nDone! {synced}/{len(events)} synced in {elapsed:.1f}s", flush=True)

if __name__ == "__main__":
    main()
