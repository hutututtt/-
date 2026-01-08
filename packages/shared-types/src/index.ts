import { z } from 'zod';

export const ConfigItemSchema = z.object({
  key: z.string(),
  value: z.any(),
  frozen: z.boolean(),
  source: z.enum(['yaml', 'env', 'default', 'computed']),
  scope: z.string(),
  updatedAt: z.string(),
  description: z.string()
});

export const ConfigCollectionSchema = z.object({
  items: z.array(ConfigItemSchema)
});

export const EffectiveConfigSchema = z.object({
  items: z.array(ConfigItemSchema),
  configHash: z.string(),
  buildVersion: z.string()
});

export const ConfigSummarySchema = z.object({
  buildVersion: z.string(),
  tradingMode: z.enum(['DRY_RUN', 'PAPER', 'LIVE']),
  podsEnabled: z.array(z.string()),
  configHash: z.string(),
  loadedAt: z.string()
});

export type ConfigItem = z.infer<typeof ConfigItemSchema>;
export type ConfigCollection = z.infer<typeof ConfigCollectionSchema>;
export type EffectiveConfig = z.infer<typeof EffectiveConfigSchema>;
export type ConfigSummary = z.infer<typeof ConfigSummarySchema>;
