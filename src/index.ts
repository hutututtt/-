import { MockExchange } from '@exchange/mockExchange.js';
import { OkxBroker } from '@exchange/okxBroker.js';
import { ExchangeBroker, TradingMode } from '@exchange/types.js';
import { ExecutionEngine } from '@execution/executionEngine.js';
import { ModeFSM } from '@fsm/modeFsm.js';
import { heartbeat } from '@health/heartbeat.js';
import { reconciliationLoop } from '@loops/reconciliationLoop.js';
import { tradingLoop } from '@loops/tradingLoop.js';
import { createPods, snapshotPods } from '@pods/podManager.js';
import { loadConfigRegistry } from '@config/registry.js';
import { loadCheckpoint, saveCheckpoint } from '@state/checkpoint.js';
import { startConfigServer, setPodRuntimeReference } from '@server/configServer.js';
import { eventStreamManager } from '@server/eventStream.js';

const tradingMode = (process.env.TRADING_MODE ?? 'DRY_RUN') as TradingMode;

const configRegistry = loadConfigRegistry(tradingMode);
const checkpoint = loadCheckpoint();
const globalMode = new ModeFSM(checkpoint?.globalMode ?? 'NORMAL');
const pods = createPods(Object.values(configRegistry.pods.values), configRegistry.ai.values, checkpoint);

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

const tradingIntervals = configRegistry.global.values.trading;
const riskThresholds = configRegistry.global.values.risk;

setInterval(() => {
  reconciliationLoop(broker, executionEngine, globalMode, pods, {
    safe: riskThresholds.errorBudgetSafe,
    crash: riskThresholds.errorBudgetCrash
  });
}, tradingIntervals.reconciliationIntervalMs);

setInterval(() => {
  tradingLoop(globalMode, pods, executionEngine, snapshotGenerator);
  cycleId += 1;
}, tradingIntervals.tradingIntervalMs);

setInterval(() => {
  heartbeat(globalMode.current, pods);

  // Broadcast heartbeat event
  eventStreamManager.broadcast({
    type: 'HeartbeatEvent',
    globalMode: globalMode.current,
    activePods: pods.filter((p) => p.mode.current !== 'DISABLED').length,
    timestamp: Date.now()
  });
}, tradingIntervals.heartbeatIntervalMs);

setInterval(() => {
  saveCheckpoint({
    globalMode: globalMode.current,
    pods: snapshotPods(pods),
    lastCycleId: cycleId
  });
}, tradingIntervals.checkpointIntervalMs);

// Set pod runtime references for API access
setPodRuntimeReference(pods, globalMode);

startConfigServer(configRegistry, Number(process.env.CONFIG_PORT ?? 3001));

console.log(`Autopilot trader started in ${tradingMode} mode.`);
