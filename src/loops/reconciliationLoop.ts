import { ExchangeBroker } from '@exchange/types.js';
import { ExecutionEngine } from '@execution/executionEngine.js';
import { OrderLifecycleEvent, RiskEvent } from '@events/schemas.js';
import { ModeFSM } from '@fsm/modeFsm.js';
import { executionAdmissionGate } from '@risk/gates.js';
import { PodRuntime } from '@pods/podManager.js';
import { appendEvent } from '@utils/eventStore.js';
import { writeTradeReport } from '@reports/tradeReport.js';
import { eventStreamManager } from '@server/eventStream.js';

export async function reconciliationLoop(
  broker: ExchangeBroker,
  executionEngine: ExecutionEngine,
  globalMode: ModeFSM,
  pods: PodRuntime[],
  thresholds: { safe: number; crash: number }
) {
  let discrepancies = 0;

  try {
    const [exchangeOrders, exchangePositions, exchangeBalance] = await Promise.all([
      broker.fetchOrders(),
      broker.fetchPositions(),
      broker.fetchBalance()
    ]);

    // Update pod capital from exchange balance
    console.log('[RECONCILIATION] Exchange balance:', exchangeBalance);
    
    // For now, distribute total balance proportionally across pods based on their capital pool
    const totalCapitalPool = pods.reduce((sum, pod) => sum + pod.config.capitalPool, 0);
    pods.forEach((pod) => {
      if (totalCapitalPool > 0) {
        const proportion = pod.config.capitalPool / totalCapitalPool;
        const newCapital = exchangeBalance.available * proportion;
        console.log(`[RECONCILIATION] Pod ${pod.config.id}: ${pod.currentCapital} -> ${newCapital}`);
        pod.currentCapital = newCapital;
      }
    });

    exchangeOrders.forEach((order) => {
      const pod = pods.find((p) => p.config.id === order.podId);
      if (!pod) {
        return;
      }
      if (!pod.orders.isDuplicate(order.clientOrderId)) {
        discrepancies++;
        broker.cancelOrder(order.clientOrderId).then(() => {
          const event: OrderLifecycleEvent = {
            type: 'OrderLifecycleEvent',
            clientOrderId: order.clientOrderId,
            status: 'CANCELED',
            filledQuantity: 0,
            timestamp: Date.now(),
            podId: order.podId,
            symbol: order.symbol,
            side: order.side
          };
          pod.orders.apply(event);
          appendEvent(event);
          writeTradeReport({
            timestamp: Date.now(),
            podId: order.podId,
            orderLifecycle: event,
            details: 'Canceled unknown order during reconciliation'
          });
        });
      }
    });

    exchangePositions.forEach((position) => {
      const pod = pods.find((p) => p.config.id === position.podId);
      if (!pod) {
        return;
      }
      const fsmPosition = pod.positions.getPosition(position.podId, position.symbol);
      if (!fsmPosition && position.quantity !== 0) {
        discrepancies++;
        const reduceIntent = executionAdmissionGate({
          podId: position.podId,
          symbol: position.symbol,
          side: position.quantity > 0 ? 'SELL' : 'BUY',
          quantity: Math.abs(position.quantity),
          reduceOnly: true,
          clientOrderId: `${pod.config.orderTagPrefix}-REC-${Date.now()}`,
          timestamp: Date.now()
        });
        if (reduceIntent) {
          executionEngine.execute(reduceIntent).then((result) => {
            pod.orders.apply(result.orderEvent);
            appendEvent(result.orderEvent);
            if (result.fillEvent) {
              pod.positions.apply(result.fillEvent);
              appendEvent(result.fillEvent);
            }
            writeTradeReport({
              timestamp: Date.now(),
              podId: pod.config.id,
              orderLifecycle: result.orderEvent,
              details: 'Reduce-only close from reconciliation'
            });
          });
        }
      }
    });

    // Broadcast successful reconciliation
    pods.forEach((pod) => {
      eventStreamManager.broadcast({
        type: 'ReconciliationEvent',
        podId: pod.config.id,
        status: 'SUCCESS',
        discrepancies,
        timestamp: Date.now()
      });
    });
  } catch (error) {
    pods.forEach((pod) => {
      pod.errorBudget.reconciliationFailures += 1;

      // Broadcast failed reconciliation
      eventStreamManager.broadcast({
        type: 'ReconciliationEvent',
        podId: pod.config.id,
        status: 'FAILURE',
        discrepancies: 0,
        timestamp: Date.now()
      });
    });
    if (pods.some((pod) => pod.errorBudget.reconciliationFailures >= thresholds.crash)) {
      globalMode.upgrade('CRASH');
    } else if (pods.some((pod) => pod.errorBudget.reconciliationFailures >= thresholds.safe)) {
      globalMode.upgrade('SAFE');
    }
    const event: RiskEvent = {
      type: 'RiskEvent',
      podId: null,
      level: 'CRITICAL',
      reason: `Reconciliation failure: ${(error as Error).message}`,
      timestamp: Date.now()
    };
    appendEvent(event);
    eventStreamManager.broadcast(event);
  }
}
