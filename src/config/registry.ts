import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import yaml from 'yaml';

import { frozenCopy } from '@config/frozen.js';
import { describeKey } from '@config/descriptions.js';
import { AiConfig, ConfigItem, ConfigSource, GlobalConfig, PodConfig } from '@config/types.js';
import { TradingMode } from '@exchange/types.js';

const CONFIG_DIR = path.resolve('config');

const DEFAULT_GLOBAL: GlobalConfig = {
  trading: {
    reconciliationIntervalMs: 2000,
    tradingIntervalMs: 8000,
    heartbeatIntervalMs: 15000,
    checkpointIntervalMs: 10000
  },
  risk: {
    errorBudgetSafe: 3,
    errorBudgetCrash: 6
  }
};

const DEFAULT_PODS: PodConfig[] = [
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
    strategy: 'SPEC_MOMENTUM',
    orderTagPrefix: 'SPEC'
  }
];

const DEFAULT_AI: AiConfig[] = [
  {
    podId: 'core',
    regimeWeight: 0.5,
    auditorWeight: 0.3,
    riskWeight: 0.2,
    learningRate: 0.02,
    minSamples: 50,
    maxDeltaPercent: 5
  },
  {
    podId: 'spec',
    regimeWeight: 0.4,
    auditorWeight: 0.4,
    riskWeight: 0.2,
    learningRate: 0.03,
    minSamples: 20,
    maxDeltaPercent: 5
  }
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function readYaml<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return yaml.parse(raw) as T;
}

function isFrozenPath(pathParts: string[], frozenPrefixes: string[]): boolean {
  return frozenPrefixes.some((prefix) => pathParts[0] === prefix);
}

function collectConfigItems(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
  scope: string,
  updatedAt: string,
  frozenPrefixes: string[],
  pathParts: string[] = []
): { values: Record<string, unknown>; items: ConfigItem[] } {
  const values: Record<string, unknown> = {};
  const items: ConfigItem[] = [];
  const keys = new Set([...Object.keys(defaults ?? {}), ...Object.keys(overrides ?? {})]);

  keys.forEach((key) => {
    const nextPath = [...pathParts, key];
    const defaultValue = defaults?.[key];
    const overrideValue = overrides?.[key];
    const hasOverride = overrideValue !== undefined;
    const source: ConfigSource = hasOverride ? 'yaml' : 'default';

    if (isObject(defaultValue) || isObject(overrideValue)) {
      const nestedDefaults = isObject(defaultValue) ? defaultValue : {};
      const nestedOverrides = isObject(overrideValue) ? overrideValue : {};
      const nested = collectConfigItems(
        nestedDefaults,
        nestedOverrides,
        scope,
        updatedAt,
        frozenPrefixes,
        nextPath
      );
      values[key] = nested.values;
      items.push(...nested.items);
    } else {
      const value = hasOverride ? overrideValue : defaultValue;
      values[key] = value;
      const keyPath = nextPath.join('.');
      items.push({
        key: keyPath,
        value,
        frozen: isFrozenPath(nextPath, frozenPrefixes),
        source,
        scope,
        updatedAt,
        description: describeKey(keyPath)
      });
    }
  });

  return { values, items };
}

function applyOverride(
  values: Record<string, unknown>,
  items: ConfigItem[],
  keyPath: string,
  value: unknown,
  source: ConfigSource
) {
  const parts = keyPath.split('.');
  let cursor: Record<string, unknown> = values;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!isObject(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;

  const idx = items.findIndex((item) => item.key === keyPath);
  if (idx >= 0) {
    items[idx] = { ...items[idx], value, source };
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (isObject(value)) {
    const keys = Object.keys(value).sort();
    const entries = keys.map((key) => `"${key}":${stableStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashConfig(value: unknown): string {
  const serialized = stableStringify(value);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

function readBuildVersion(): string {
  const pkgPath = path.resolve('package.json');
  if (!fs.existsSync(pkgPath)) {
    return 'unknown';
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string };
  return process.env.BUILD_VERSION ?? pkg.version ?? 'unknown';
}

export type ConfigRegistry = {
  loadedAt: string;
  tradingMode: TradingMode;
  buildVersion: string;
  global: { values: GlobalConfig; items: ConfigItem[] };
  pods: { values: Record<string, PodConfig>; itemsById: Record<string, ConfigItem[]> };
  ai: { values: Record<string, AiConfig>; itemsById: Record<string, ConfigItem[]> };
  effective: { values: Record<string, unknown>; items: ConfigItem[]; configHash: string };
};

export function loadConfigRegistry(tradingMode: TradingMode): ConfigRegistry {
  const loadedAt = new Date().toISOString();

  const globalOverrides = readYaml<Record<string, unknown>>(path.join(CONFIG_DIR, 'global.yaml')) ?? {};
  const global = collectConfigItems(
    DEFAULT_GLOBAL as Record<string, unknown>,
    globalOverrides,
    'global',
    loadedAt,
    ['risk']
  );
  if (process.env.RECONCILIATION_INTERVAL_MS) {
    applyOverride(
      global.values,
      global.items,
      'trading.reconciliationIntervalMs',
      Number(process.env.RECONCILIATION_INTERVAL_MS),
      'env'
    );
  }
  if (process.env.TRADING_INTERVAL_MS) {
    applyOverride(
      global.values,
      global.items,
      'trading.tradingIntervalMs',
      Number(process.env.TRADING_INTERVAL_MS),
      'env'
    );
  }

  const podValues: Record<string, PodConfig> = {};
  const podItems: Record<string, ConfigItem[]> = {};
  DEFAULT_PODS.forEach((pod) => {
    const overrides =
      readYaml<Record<string, unknown>>(path.join(CONFIG_DIR, 'pods', `${pod.id}.yaml`)) ?? {};
    const merged = collectConfigItems(
      pod as unknown as Record<string, unknown>,
      overrides,
      `pod:${pod.id}`,
      loadedAt,
      ['riskLimits']
    );
    podValues[pod.id] = frozenCopy(merged.values as PodConfig);
    podItems[pod.id] = merged.items;
  });

  const aiValues: Record<string, AiConfig> = {};
  const aiItems: Record<string, ConfigItem[]> = {};
  DEFAULT_AI.forEach((ai) => {
    const overrides =
      readYaml<Record<string, unknown>>(path.join(CONFIG_DIR, 'ai', `${ai.podId}.yaml`)) ?? {};
    const merged = collectConfigItems(
      ai as unknown as Record<string, unknown>,
      overrides,
      `ai:${ai.podId}`,
      loadedAt,
      []
    );
    aiValues[ai.podId] = merged.values as AiConfig;
    aiItems[ai.podId] = merged.items;
  });

  const effectiveValues = {
    global: global.values,
    pods: podValues,
    ai: aiValues
  };

  const effectiveItems: ConfigItem[] = [
    ...global.items.map((item) => ({ ...item, key: `global.${item.key}` })),
    ...Object.entries(podItems).flatMap(([id, items]) =>
      items.map((item) => ({ ...item, key: `pods.${id}.${item.key}` }))
    ),
    ...Object.entries(aiItems).flatMap(([id, items]) =>
      items.map((item) => ({ ...item, key: `ai.${id}.${item.key}` }))
    )
  ];

  const configHash = hashConfig(effectiveValues);

  return {
    loadedAt,
    tradingMode,
    buildVersion: readBuildVersion(),
    global: { values: global.values as GlobalConfig, items: global.items },
    pods: { values: podValues, itemsById: podItems },
    ai: { values: aiValues, itemsById: aiItems },
    effective: { values: effectiveValues, items: effectiveItems, configHash }
  };
}

export function derivePodsEnabled(podValues: Record<string, PodConfig>): string[] {
  return Object.values(podValues)
    .filter((pod) => pod.mode !== 'DISABLED')
    .map((pod) => pod.id);
}
