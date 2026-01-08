import { MockExchange } from '@exchange/mockExchange.js';
import { OkxBroker } from '@exchange/okxBroker.js';
import { ExchangeBroker, TradingMode } from '@exchange/types.js';
import { ExecutionEngine } from '@execution/executionEngine.js';
import { ModeFSM } from '@fsm/modeFsm.js';
import { heartbeat } from '@health/heartbeat.js';
import { reconciliationLoop } from '@loops/reconciliationLoop.js';
import { tradingLoop } from '@loops/tradingLoop.js';
import { createPods, snapshotPods } from '@pods/podManager.js';
import { loadCheckpoint, saveCheckpoint } from '@state/checkpoint.js';

const tradingMode = (process.env.TRADING_MODE ?? 'DRY_RUN') as TradingMode;

const checkpoint = loadCheckpoint();
const globalMode = new ModeFSM(checkpoint?.globalMode ?? 'NORMAL');
const pods = createPods(checkpoint);

const broker: ExchangeBroker = tradingMode === 'LIVE' ? new OkxBroker() : new MockExchange();
const executionEngine = new ExecutionEngine(broker);

let cycleId = checkpoint?.lastCycleId ?? 0;

const snapshotGenerator = () => ({
  symbol: 'BTC-USDT',
  price: Number((Math.random() * 10000 + 20000).toFixed(2)),
  timestamp: Date.now(),
  dataQuality: Math.random() > 0.9 ? 'DELAYED' : 'GOOD',
  volatility: Math.random()
});

setInterval(() => {
  reconciliationLoop(broker, executionEngine, globalMode, pods);
}, 2000);

setInterval(() => {
  tradingLoop(globalMode, pods, executionEngine, snapshotGenerator);
  cycleId += 1;
}, 8000);

setInterval(() => {
  heartbeat(globalMode.current, pods);
}, 15000);

setInterval(() => {
  saveCheckpoint({
    globalMode: globalMode.current,
    pods: snapshotPods(pods),
    lastCycleId: cycleId
  });
}, 10000);

console.log(`Autopilot trader started in ${tradingMode} mode.`);
