import fastify from 'fastify';

import { ConfigRegistry, derivePodsEnabled } from '@config/registry.js';

export async function startConfigServer(registry: ConfigRegistry, port = 3001) {
  const app = fastify();

  app.get('/api/config/summary', async () => ({
    buildVersion: registry.buildVersion,
    tradingMode: registry.tradingMode,
    podsEnabled: derivePodsEnabled(registry.pods.values),
    configHash: registry.effective.configHash,
    loadedAt: registry.loadedAt
  }));

  app.get('/api/config/global', async () => ({ items: registry.global.items }));

  app.get('/api/config/pods', async () => ({
    items: Object.values(registry.pods.itemsById).flat()
  }));

  app.get('/api/config/pods/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const items = registry.pods.itemsById[id];
    if (!items) {
      reply.code(404);
      return { items: [] };
    }
    return { items };
  });

  app.get('/api/config/effective', async () => ({
    items: registry.effective.items,
    configHash: registry.effective.configHash,
    buildVersion: registry.buildVersion
  }));

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Config API listening on ${port}`);
}
