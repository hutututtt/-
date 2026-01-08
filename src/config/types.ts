export type ConfigSource = 'yaml' | 'env' | 'default' | 'computed';

export type ConfigItem = {
  key: string;
  value: unknown;
  frozen: boolean;
  source: ConfigSource;
  scope: string;
  updatedAt: string;
  description: string;
};

export type GlobalConfig = {
  trading: {
    reconciliationIntervalMs: number;
    tradingIntervalMs: number;
    heartbeatIntervalMs: number;
    checkpointIntervalMs: number;
  };
  risk: {
    errorBudgetSafe: number;
    errorBudgetCrash: number;
  };
};

export type RiskLimits = {
  leverage: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxOpenPositions: number;
  maxNotionalPerTrade: number;
  requireStopLoss: boolean;
  maxHoldingMinutes?: number;
  allowScaleIn: boolean;
};

export type PodConfig = {
  id: string;
  name: string;
  mode: 'NORMAL' | 'SAFE' | 'CRASH' | 'DISABLED';
  capitalPool: number;
  riskLimits: RiskLimits;
  strategy: 'CORE_TREND' | 'SPEC_MOMENTUM';
  orderTagPrefix: string;
};

export type AiConfig = {
  podId: string;
  regimeWeight: number;
  auditorWeight: number;
  riskWeight: number;
  learningRate: number;
  minSamples: number;
  maxDeltaPercent: number;
};
