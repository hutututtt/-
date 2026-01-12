# Autopilot Multi-Pod Trader

A 24/7 unattended trading system skeleton with multi-pod isolation, dual-loop control (reconciliation + trading), strict risk gates, and auditable event streams.

## Quick Start

```bash
npm install
npm run dry-run
```

### OKX Paper Trading Setup

系统支持两种方式配置 OKX API 凭证：

#### 方式 1：UI 界面配置（推荐）

1. **启动系统**
   ```bash
   npm install
   npm start
   ```

2. **启动 Dashboard**（另一个终端）
   ```bash
   npm run dashboard:dev
   ```

3. **在浏览器中配置凭证**
   - 访问 http://localhost:5173
   - 点击顶部导航栏的 **🔐 系统设置**
   - 填写 OKX 模拟盘 API 凭证
   - 点击保存
   - 重启系统

详细指南：[UI 配置快速指南](./docs/ui-credentials-guide.md)

#### 方式 2：环境变量配置

1. **创建 OKX 模拟账户**
   - 访问 https://www.okx.com
   - 注册模拟交易账户
   - 在账户设置中进入 API 管理

2. **生成 API 密钥**
   - 创建具有交易权限的新 API 密钥
   - 复制以下凭证：
     - API Key
     - Secret Key
     - Passphrase
   - **重要**：妥善保管这些凭证，切勿提交到版本控制

3. **配置环境变量**
   - 复制 `.env.example` 到 `.env`
   - 添加你的模拟账户凭证：
     ```bash
     TRADING_MODE=PAPER
     OKX_PAPER_API_KEY=your-demo-api-key
     OKX_PAPER_API_SECRET=your-demo-api-secret
     OKX_PAPER_API_PASSPHRASE=your-demo-passphrase
     ```

4. **运行 PAPER 模式**
   ```bash
   npm run paper
   ```

详细指南：[完整凭证配置指南](./docs/credentials-setup.md)

Start dashboard (in another terminal):

```bash
npm run dashboard:dev
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
- `npm run dashboard:dev` – run the dashboard in dev mode
- `npm run test` – vitest suite
- `npm run lint` – eslint
- `npm run reset-modes` – reset FSM mode back to NORMAL

## Config Center

The dashboard includes a Config Center at `http://localhost:5173` once the dashboard dev server is running. It provides:

- Global / Pod / AI / Effective config tabs with searchable, sortable tables.
- Config metadata (source, scope, frozen, updatedAt) and per-field descriptions.
- Effective config hash and build version for audit tracking.
- Diff view between the current effective config and the previous snapshot stored in localStorage.

`configHash` is derived from a stable, sorted stringify of the effective config values and hashed with SHA-256. `buildVersion` defaults to the package version unless overridden by `BUILD_VERSION`.
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

