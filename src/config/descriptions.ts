const DESCRIPTION_MAP: Record<string, string> = {
  'trading.reconciliationIntervalMs': 'Interval for reconciliation loop (ms).',
  'trading.tradingIntervalMs': 'Interval for trading loop (ms).',
  'trading.heartbeatIntervalMs': 'Heartbeat log interval (ms).',
  'trading.checkpointIntervalMs': 'Checkpoint persistence interval (ms).',
  'risk.errorBudgetSafe': 'Error count threshold before SAFE mode.',
  'risk.errorBudgetCrash': 'Error count threshold before CRASH mode.',
  'riskLimits.leverage': 'Maximum leverage allowed for the pod.',
  'riskLimits.maxDailyLoss': 'Maximum daily loss limit.',
  'riskLimits.maxDrawdown': 'Maximum drawdown allowed.',
  'riskLimits.maxOpenPositions': 'Maximum concurrent open positions.',
  'riskLimits.maxNotionalPerTrade': 'Max notional per trade.',
  'riskLimits.requireStopLoss': 'Stop loss required for new positions.',
  'riskLimits.maxHoldingMinutes': 'Maximum holding time in minutes.',
  'riskLimits.allowScaleIn': 'Whether scaling into positions is allowed.',
  'strategy': 'Strategy identifier for the pod.',
  'orderTagPrefix': 'Order tag prefix used for broker tagging.',
  'capitalPool': 'Virtual capital pool for the pod.',
  'mode': 'Initial mode for the pod.',
  'regimeWeight': 'AI regime model vote weight.',
  'auditorWeight': 'AI auditor model vote weight.',
  'riskWeight': 'AI risk model vote weight.',
  'learningRate': 'AI learning rate (EMA).',
  'minSamples': 'Minimum samples before updates.',
  'maxDeltaPercent': 'Max update delta per learning step.'
};

export function describeKey(keyPath: string): string {
  return DESCRIPTION_MAP[keyPath] ?? '';
}
