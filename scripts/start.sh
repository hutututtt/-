#!/usr/bin/env bash
set -euo pipefail

MODE=${TRADING_MODE:-DRY_RUN}
node_modules/.bin/tsx src/index.ts
