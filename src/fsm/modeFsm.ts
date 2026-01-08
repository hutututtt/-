export type Mode = 'NORMAL' | 'SAFE' | 'CRASH' | 'DISABLED';

const MODE_ORDER: Mode[] = ['NORMAL', 'SAFE', 'CRASH', 'DISABLED'];

export class ModeFSM {
  private mode: Mode;

  constructor(initialMode: Mode = 'NORMAL') {
    this.mode = initialMode;
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
      this.mode = next;
      return true;
    }
    return false;
  }

  reset(): void {
    this.mode = 'NORMAL';
  }

  toJSON() {
    return { mode: this.mode };
  }
}
