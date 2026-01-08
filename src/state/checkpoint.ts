import fs from 'node:fs';
import path from 'node:path';

import { Mode } from '@fsm/modeFsm.js';
import { OrderState } from '@fsm/orderFsm.js';
import { PositionState } from '@fsm/positionFsm.js';

export type ErrorBudgetState = {
  apiErrors: number;
  reconciliationFailures: number;
};

export type PodCheckpoint = {
  podId: string;
  mode: Mode;
  orders: OrderState[];
  dedupe: string[];
  positions: PositionState[];
  errorBudget: ErrorBudgetState;
};

export type GlobalCheckpoint = {
  globalMode: Mode;
  pods: PodCheckpoint[];
  lastCycleId: number;
};

const DATA_DIR = path.resolve('data');
const CHECKPOINT_PATH = path.join(DATA_DIR, 'state.json');

export function loadCheckpoint(): GlobalCheckpoint | null {
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    return null;
  }
  const raw = fs.readFileSync(CHECKPOINT_PATH, 'utf-8');
  return JSON.parse(raw) as GlobalCheckpoint;
}

export function saveCheckpoint(state: GlobalCheckpoint) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(state, null, 2));
}
