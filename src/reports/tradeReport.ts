import fs from 'node:fs';
import path from 'node:path';

import { AiRecommendationEvent, ConsensusDecisionEvent, MarketEvent, OrderLifecycleEvent, RiskEvent, SignalEvent } from '@events/schemas.js';

export type TradeReport = {
  timestamp: number;
  podId: string | null;
  snapshot?: MarketEvent;
  signal?: SignalEvent;
  aiRecommendation?: AiRecommendationEvent;
  consensus?: ConsensusDecisionEvent;
  orderLifecycle?: OrderLifecycleEvent;
  riskEvent?: RiskEvent;
  details: string;
};

const REPORT_PATH = path.join('data', 'trade-reports.jsonl');

export function writeTradeReport(report: TradeReport) {
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data', { recursive: true });
  }
  fs.appendFileSync(REPORT_PATH, `${JSON.stringify(report)}\n`);
}
