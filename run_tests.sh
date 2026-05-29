#!/bin/bash
set -a
source "$(dirname "$0")/.env"
set +a

cd "$(dirname "$0")"

echo "=== Running Rust integration tests ==="
timeout 60 cargo test --test resolve_test -- --nocapture 2>&1

echo ""
echo "=== Running frontend tests ==="
cd frontend
npx playwright test 2>&1
