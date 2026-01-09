import { eventStreamManager } from '@server/eventStream.js';

export type Mode = 'NORMAL' | 'SAFE' | 'CRASH' | 'DISABLED';

const MODE_ORDER: Mode[] = ['NORMAL', 'SAFE', 'CRASH', 'DISABLED'];

export class ModeFSM {
  private mode: Mode;
  private podId: string | null = null;

  constructor(initialMode: Mode = 'NORMAL', podId: string | null = null) {
    this.mode = initialMode;
    this.podId = podId;
  }

  get current(): Mode {
    return this.mode;
  }

  upgrade(next: Mode): boolean {
    if (next === this.mode) {
      return false;
    }
    const currentIndex = MODE_ORDER.indexOf(this.mode);
    const nextIndex = MODE_ORDER.indexOf(next);
    if (nextIndex >= currentIndex) {
      const oldMode = this.mode;
      this.mode = next;

      // Broadcast ModeChangeEvent
      eventStreamManager.broadcast({
        type: 'ModeChangeEvent',
        podId: this.podId,
        oldMode,
        newMode: next,
        timestamp: Date.now()
      });

      return true;
    }
    return false;
  }

  reset(): void {
    const oldMode = this.mode;
    this.mode = 'NORMAL';

    // Broadcast ModeChangeEvent for reset
    if (oldMode !== 'NORMAL') {
      eventStreamManager.broadcast({
        type: 'ModeChangeEvent',
        podId: this.podId,
        oldMode,
        newMode: 'NORMAL',
        timestamp: Date.now()
      });
    }
  }

  toJSON() {
    return { mode: this.mode };
  }
}
