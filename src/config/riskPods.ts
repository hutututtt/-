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

export type AiProfile = {
  regimeWeight: number;
  auditorWeight: number;
  riskWeight: number;
  learningRate: number;
  minSamples: number;
};

export type PodConfig = {
  id: string;
  name: string;
  mode: 'NORMAL' | 'SAFE' | 'CRASH' | 'DISABLED';
  capitalPool: number;
  riskLimits: RiskLimits;
  aiProfile: AiProfile;
  strategy: 'CORE_TREND' | 'SPEC_MOMENTUM';
  orderTagPrefix: string;
};

export const POD_CONFIGS: PodConfig[] = [
  {
    id: 'core',
    name: 'Core Pod',
    mode: 'NORMAL',
    capitalPool: 1000,
    riskLimits: {
      leverage: 1,
      maxDailyLoss: 50,
      maxDrawdown: 100,
      maxOpenPositions: 3,
      maxNotionalPerTrade: 100,
      requireStopLoss: true,
      maxHoldingMinutes: 1440,
      allowScaleIn: false
    },
    aiProfile: {
      regimeWeight: 0.5,
      auditorWeight: 0.3,
      riskWeight: 0.2,
      learningRate: 0.02,
      minSamples: 50
    },
    strategy: 'CORE_TREND',
    orderTagPrefix: 'CORE'
  },
  {
    id: 'spec',
    name: 'Speculative Pod',
    mode: 'NORMAL',
    capitalPool: 200,
    riskLimits: {
      leverage: 10,
      maxDailyLoss: 200,
      maxDrawdown: 200,
      maxOpenPositions: 1,
      maxNotionalPerTrade: 0.8,
      requireStopLoss: true,
      maxHoldingMinutes: 60,
      allowScaleIn: false
    },
    aiProfile: {
      regimeWeight: 0.4,
      auditorWeight: 0.4,
      riskWeight: 0.2,
      learningRate: 0.03,
      minSamples: 20
    },
    strategy: 'SPEC_MOMENTUM',
    orderTagPrefix: 'SPEC'
  }
];
