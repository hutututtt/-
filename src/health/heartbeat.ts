import { Mode } from '@fsm/modeFsm.js';
import { PodRuntime } from '@pods/podManager.js';

export function heartbeat(globalMode: Mode, pods: PodRuntime[]) {
  const status = {
    timestamp: new Date().toISOString(),
    globalMode,
    pods: pods.map((pod) => ({
      id: pod.config.id,
      mode: pod.mode.current,
      errors: pod.errorBudget
    }))
  };
  console.log('[heartbeat]', JSON.stringify(status));
}
