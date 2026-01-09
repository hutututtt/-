import { AiRecommendationSchema, MarketEventSchema, RiskEvent } from '@events/schemas.js';
import { ExecutionEngine } from '@execution/executionEngine.js';
import { ModeFSM } from '@fsm/modeFsm.js';
import { executionAdmissionGate, orderPermissionGate, preTradeRiskGate } from '@risk/gates.js';
import { PodRuntime } from '@pods/podManager.js';
import { runAiOrchestrator } from '@ai/orchestrator.js';
import { consensusEngine } from '@consensus/consensusEngine.js';
import { coreTrendStrategy } from '@strategies/coreTrend.js';
import { specMomentumStrategy } from '@strategies/specMomentum.js';
import { appendEvent } from '@utils/eventStore.js';
import { writeTradeReport } from '@reports/tradeReport.js';
import { eventStreamManager } from '@server/eventStream.js';

export type MarketSnapshotGenerator = () => {
  symbol: string;
  price: number;
  timestamp: number;
  dataQuality: 'GOOD' | 'DELAYED' | 'GAPPED';
  volatility: number;
};

export async function tradingLoop(
  globalMode: ModeFSM,
  pods: PodRuntime[],
  executionEngine: ExecutionEngine,
  snapshotGenerator: MarketSnapshotGenerator
) {
  const snapshot = snapshotGenerator();
  const marketEvent = MarketEventSchema.parse({
    type: 'MarketEvent',
    symbol: snapshot.symbol,
    timestamp: snapshot.timestamp,
    price: snapshot.price,
    volatility: snapshot.volatility,
    dataQuality: snapshot.dataQuality
  });
  appendEvent(marketEvent);

  if (snapshot.dataQuality !== 'GOOD') {
    globalMode.upgrade('SAFE');
    pods.forEach((pod) => {
      pod.learningPaused = true;
    });
    const riskEvent: RiskEvent = {
      type: 'RiskEvent',
      podId: null,
      level: 'WARN',
      reason: 'Market data degraded',
      timestamp: Date.now()
    };
    appendEvent(riskEvent);
    eventStreamManager.broadcast(riskEvent);
  }

  if (snapshot.volatility > 0.9) {
    globalMode.upgrade('CRASH');
    pods.forEach((pod) => {
      pod.learningPaused = true;
    });
    const riskEvent: RiskEvent = {
      type: 'RiskEvent',
      podId: null,
      level: 'CRITICAL',
      reason: 'Extreme volatility',
      timestamp: Date.now()
    };
    appendEvent(riskEvent);
    eventStreamManager.broadcast(riskEvent);
  }

  for (const pod of pods) {
    const openPositions = pod.positions.snapshot().positions.filter((pos) => pos.quantity !== 0).length;
    if (globalMode.current !== 'NORMAL' || pod.mode.current !== 'NORMAL') {
      if (openPositions > 0) {
        const pos = pod.positions.snapshot().positions.find((p) => p.quantity !== 0);
        if (pos) {
          const reduceIntent = executionAdmissionGate({
            podId: pod.config.id,
            symbol: pos.symbol,
            side: pos.quantity > 0 ? ('SELL' as const) : ('BUY' as const),
            quantity: Math.abs(pos.quantity),
            reduceOnly: true,
            clientOrderId: `${pod.config.orderTagPrefix}-SAFE-${Date.now()}`,
            timestamp: Date.now()
          });
          if (reduceIntent) {
            const result = await executionEngine.execute(reduceIntent);
            pod.orders.apply(result.orderEvent);
            appendEvent(result.orderEvent);
            if (result.fillEvent) {
              pod.positions.apply(result.fillEvent);
              appendEvent(result.fillEvent);

              // Broadcast TradeEvent
              eventStreamManager.broadcast({
                type: 'TradeEvent',
                podId: pod.config.id,
                symbol: result.fillEvent.symbol,
                side: result.fillEvent.side,
                quantity: result.fillEvent.quantity,
                price: result.fillEvent.price,
                timestamp: result.fillEvent.timestamp
              });
            }
            writeTradeReport({
              timestamp: Date.now(),
              podId: pod.config.id,
              orderLifecycle: result.orderEvent,
              details: 'Reduce-only due to SAFE/CRASH mode'
            });
          }
        }
      }
      continue;
    }

    const preTrade = preTradeRiskGate(globalMode.current, pod.mode.current, {
      symbol: snapshot.symbol,
      price: snapshot.price,
      timestamp: snapshot.timestamp,
      dataQuality: snapshot.dataQuality
    });
    if (!preTrade.allowed) {
      // Broadcast RiskEvent for blocked trade
      eventStreamManager.broadcast({
        type: 'RiskEvent',
        podId: pod.config.id,
        level: 'INFO',
        reason: `PreTrade gate blocked: ${preTrade.reason}`,
        timestamp: Date.now()
      });
      writeTradeReport({
        timestamp: Date.now(),
        podId: pod.config.id,
        snapshot: marketEvent,
        details: `PreTrade gate blocked: ${preTrade.reason}`
      });
      continue;
    }

    const signal =
      pod.config.strategy === 'CORE_TREND'
        ? coreTrendStrategy(pod.config.id, snapshot)
        : specMomentumStrategy(pod.config.id, snapshot);
    appendEvent(signal);

    const aiRecommendation = AiRecommendationSchema.parse(runAiOrchestrator(pod.config.id, pod.aiProfile));
    appendEvent(aiRecommendation);

    const consensus = consensusEngine(pod.config.id, signal, aiRecommendation);
    appendEvent(consensus);

    if (consensus.decision !== 'APPROVED') {
      writeTradeReport({
        timestamp: Date.now(),
        podId: pod.config.id,
        snapshot: marketEvent,
        signal,
        aiRecommendation,
        consensus,
        details: 'Consensus did not approve trade'
      });
      continue;
    }

    const intent = {
      podId: pod.config.id,
      symbol: signal.symbol,
      side: signal.action === 'BUY' ? ('BUY' as const) : ('SELL' as const),
      quantity: pod.config.riskLimits.maxNotionalPerTrade,
      reduceOnly: false,
      stopLossPrice: snapshot.price * 0.98,
      clientOrderId: `${pod.config.orderTagPrefix}-${Date.now()}`,
      timestamp: Date.now()
    };

    const permission = orderPermissionGate(pod.config, intent, openPositions);
    if (!permission.allowed) {
      // Broadcast RiskEvent for blocked order
      eventStreamManager.broadcast({
        type: 'RiskEvent',
        podId: pod.config.id,
        level: 'WARN',
        reason: `Order permission gate blocked: ${permission.reason}`,
        timestamp: Date.now()
      });
      writeTradeReport({
        timestamp: Date.now(),
        podId: pod.config.id,
        snapshot: marketEvent,
        signal,
        aiRecommendation,
        consensus,
        details: `Order permission gate blocked: ${permission.reason}`
      });
      continue;
    }

    const approved = executionAdmissionGate(intent);
    if (!approved) {
      continue;
    }

    const result = await executionEngine.execute(approved);
    pod.orders.apply(result.orderEvent);
    appendEvent(result.orderEvent);
    if (result.fillEvent) {
      pod.positions.apply(result.fillEvent);
      appendEvent(result.fillEvent);

      // Broadcast TradeEvent for successful trade
      const pnl = pod.currentCapital - pod.config.capitalPool;
      eventStreamManager.broadcast({
        type: 'TradeEvent',
        podId: pod.config.id,
        symbol: result.fillEvent.symbol,
        side: result.fillEvent.side,
        quantity: result.fillEvent.quantity,
        price: result.fillEvent.price,
        pnl,
        timestamp: result.fillEvent.timestamp
      });
    }
    pod.currentCapital -= intent.quantity;
    if (pod.config.id === 'spec' && pod.currentCapital <= 0) {
      pod.mode.upgrade('DISABLED');
    }

    writeTradeReport({
      timestamp: Date.now(),
      podId: pod.config.id,
      snapshot: marketEvent,
      signal,
      aiRecommendation,
      consensus,
      orderLifecycle: result.orderEvent,
      details: 'Executed trade'
    });
  }
}
