import { frozenCopy } from '@config/frozen.js';
import { POD_CONFIGS, PodConfig } from '@config/riskPods.js';
import { ModeFSM } from '@fsm/modeFsm.js';
import { OrderFSM } from '@fsm/orderFsm.js';
import { PositionFSM } from '@fsm/positionFsm.js';
import { GlobalCheckpoint, PodCheckpoint } from '@state/checkpoint.js';

export type ErrorBudget = {
  apiErrors: number;
  reconciliationFailures: number;
};

export type PodRuntime = {
  config: PodConfig;
  mode: ModeFSM;
  orders: OrderFSM;
  positions: PositionFSM;
  errorBudget: ErrorBudget;
  learningPaused: boolean;
  currentCapital: number;
};

export function createPods(checkpoint: GlobalCheckpoint | null): PodRuntime[] {
  const frozenConfigs = frozenCopy(POD_CONFIGS);
  return frozenConfigs.map((config) => {
    const podCheckpoint = checkpoint?.pods.find((pod) => pod.podId === config.id) ?? null;
    const mode = new ModeFSM(podCheckpoint?.mode ?? config.mode);
    const orders = new OrderFSM();
    const positions = new PositionFSM();
    if (podCheckpoint) {
      orders.hydrate({ orders: podCheckpoint.orders, dedupe: podCheckpoint.dedupe });
      positions.hydrate({ positions: podCheckpoint.positions });
    }
    const errorBudget = {
      apiErrors: podCheckpoint?.errorBudget.apiErrors ?? 0,
      reconciliationFailures: podCheckpoint?.errorBudget.reconciliationFailures ?? 0
    };
    return {
      config,
      mode,
      orders,
      positions,
      errorBudget,
      learningPaused: false,
      currentCapital: config.capitalPool
    };
  });
}

export function snapshotPods(pods: PodRuntime[]): PodCheckpoint[] {
  return pods.map((pod) => ({
    podId: pod.config.id,
    mode: pod.mode.current,
    orders: pod.orders.snapshot().orders,
    dedupe: pod.orders.snapshot().dedupe,
    positions: pod.positions.snapshot().positions,
    errorBudget: pod.errorBudget
  }));
}
