import { ExchangeBroker } from '@exchange/types.js';
import { ApprovedOrderIntent } from '@risk/gates.js';
import { OrderLifecycleEvent, FillEvent } from '@events/schemas.js';

export type ExecutionResult = {
  orderEvent: OrderLifecycleEvent;
  fillEvent?: FillEvent;
};

export class ExecutionEngine {
  constructor(private broker: ExchangeBroker) {}

  async execute(intent: ApprovedOrderIntent): Promise<ExecutionResult> {
    const order = await this.broker.placeOrder({
      clientOrderId: intent.clientOrderId,
      podId: intent.podId,
      symbol: intent.symbol,
      side: intent.side,
      quantity: intent.quantity,
      price: 1,
      reduceOnly: intent.reduceOnly
    });

    const orderEvent: OrderLifecycleEvent = {
      type: 'OrderLifecycleEvent',
      clientOrderId: order.clientOrderId,
      status: order.status === 'PARTIAL' ? 'PARTIAL' : order.status === 'FILLED' ? 'FILLED' : 'REJECTED',
      filledQuantity: order.status === 'FILLED' ? order.quantity : 0,
      timestamp: order.timestamp,
      podId: order.podId,
      symbol: order.symbol,
      side: order.side
    };

    const fillEvent: FillEvent | undefined =
      order.status === 'FILLED'
        ? {
            type: 'FillEvent',
            clientOrderId: order.clientOrderId,
            podId: order.podId,
            symbol: order.symbol,
            side: order.side,
            quantity: order.quantity,
            price: order.price,
            timestamp: order.timestamp
          }
        : undefined;

    return { orderEvent, fillEvent };
  }
}
