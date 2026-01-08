# Autopilot Multi-Pod Trader

A 24/7 unattended trading system skeleton with multi-pod isolation, dual-loop control (reconciliation + trading), strict risk gates, and auditable event streams.

## Quick Start

```bash
npm install
npm run dry-run
```

Run PAPER mode:

```bash
npm run paper
```

### LIVE mode (disabled by default)

LIVE mode is stubbed for now. To enable, set:

```bash
TRADING_MODE=LIVE
```

…and provide OKX credentials in environment variables. **Start with PAPER mode before any LIVE run and use small size.**

## Scripts

- `npm run dry-run` – local mock exchange loop
- `npm run paper` – mock exchange loop with PAPER mode flag
- `npm run start` – default start (respects TRADING_MODE)
- `npm run test` – vitest suite
- `npm run lint` – eslint
- `npm run reset-modes` – reset FSM mode back to NORMAL

## 24/7 Operation

- Docker: `docker-compose up --build`
- PM2: `pm2 start ecosystem.config.cjs`
- Checkpoints stored in `data/state.json`
- Audits stored in `data/events.jsonl` and `data/trade-reports.jsonl`

## Safety Notes

- The AI module does not place orders; it only returns validated JSON recommendations.
- All orders pass through three gates (PreTradeRiskGate, OrderPermissionGate, ExecutionAdmissionGate).
- Risk modes only upgrade (NORMAL → SAFE → CRASH). Downgrade via `npm run reset-modes`.
- SAFE/CRASH default to reduce-only behavior.

