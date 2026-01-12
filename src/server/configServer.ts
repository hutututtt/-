import fastify from 'fastify';
import cors from '@fastify/cors';

import { ConfigRegistry, derivePodsEnabled } from '@config/registry.js';
import { eventStreamManager } from '@server/eventStream.js';
import { PodRuntime } from '@pods/podManager.js';
import { ModeFSM } from '@fsm/modeFsm.js';
import { ExchangeBroker } from '@exchange/types.js';
import { loadCredentials, saveCredentials, getMaskedCredentials, OkxCredentials } from '@config/credentials.js';

let podsRef: PodRuntime[] = [];
let globalModeRef: ModeFSM | null = null;
let brokerRef: ExchangeBroker | null = null;

export function setPodRuntimeReference(pods: PodRuntime[], globalMode: ModeFSM, broker?: ExchangeBroker) {
  podsRef = pods;
  globalModeRef = globalMode;
  if (broker) {
    brokerRef = broker;
  }
}

export async function startConfigServer(registry: ConfigRegistry, port = 3001) {
  const app = fastify({ logger: false });

  // Enable CORS for dashboard
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  app.get('/api/config/summary', async () => {
    let totalCapital = 0;

    // Try to fetch real balance from exchange
    if (brokerRef) {
      try {
        const balance = await brokerRef.fetchBalance();
        totalCapital = balance.total;
        console.log('[Config Server] Fetched balance from exchange:', totalCapital);
      } catch (error) {
        console.error('[Config Server] Failed to fetch balance from exchange:', error);
        // Fallback to config capitalPool
        totalCapital = podsRef.reduce((sum, pod) => sum + pod.config.capitalPool, 0);
        console.log('[Config Server] Using fallback capitalPool:', totalCapital);
      }
    } else {
      // No broker available, use config capitalPool
      totalCapital = podsRef.reduce((sum, pod) => sum + pod.config.capitalPool, 0);
      console.log('[Config Server] No broker available, using capitalPool:', totalCapital);
    }

    const totalPnL = podsRef.reduce((sum, pod) => {
      const pnl = pod.currentCapital - pod.config.capitalPool;
      return sum + pnl;
    }, 0);

    return {
      buildVersion: registry.buildVersion,
      tradingMode: registry.tradingMode,
      podsEnabled: derivePodsEnabled(registry.pods.values),
      configHash: registry.effective.configHash,
      loadedAt: registry.loadedAt,
      globalMode: globalModeRef?.current ?? 'NORMAL',
      totalCapital,
      totalPnL
    };
  });

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

  // New endpoints for Pod runtime status
  app.get('/api/pods', async () => {
    const pods = podsRef.map((pod) => ({
      id: pod.config.id,
      name: pod.config.name,
      mode: pod.mode.current,
      capitalPool: pod.config.capitalPool,
      currentCapital: pod.currentCapital,
      pnl: pod.currentCapital - pod.config.capitalPool,
      openPositions: pod.positions.snapshot().positions.length,
      activeOrders: pod.orders.snapshot().orders.filter((o) => o.status === 'ACK' || o.status === 'PARTIAL').length,
      errorBudget: pod.errorBudget
    }));
    return { pods };
  });

  app.get('/api/pods/:id/detail', async (request, reply) => {
    const { id } = request.params as { id: string };
    const pod = podsRef.find((p) => p.config.id === id);

    if (!pod) {
      reply.code(404);
      return { error: 'Pod not found' };
    }

    return {
      id: pod.config.id,
      name: pod.config.name,
      config: pod.config,
      aiProfile: pod.aiProfile,
      runtime: {
        mode: pod.mode.current,
        currentCapital: pod.currentCapital,
        pnl: pod.currentCapital - pod.config.capitalPool,
        positions: pod.positions.snapshot().positions,
        orders: pod.orders.snapshot().orders,
        errorBudget: pod.errorBudget,
        learningPaused: pod.learningPaused
      }
    };
  });

  // SSE endpoint for real-time events
  app.get('/api/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    });

    eventStreamManager.addClient(reply);

    // Keep connection alive
    request.raw.on('close', () => {
      eventStreamManager.removeClient(reply);
    });
  });

  // Credentials management endpoints
  app.get('/api/credentials', async () => {
    return { credentials: getMaskedCredentials() };
  });

  app.post('/api/credentials', async (request, reply) => {
    try {
      const credentials = request.body as OkxCredentials;
      
      // 验证必填字段
      if (!credentials.paperApiKey || !credentials.paperApiSecret || !credentials.paperApiPassphrase) {
        reply.code(400);
        return { error: '模拟盘 API 凭证不完整' };
      }

      saveCredentials(credentials);
      
      console.log(`[ADMIN ACTION] Credentials updated at ${new Date().toISOString()}`);
      
      return { 
        success: true, 
        message: '凭证已保存，请重启系统以应用新配置',
        credentials: getMaskedCredentials() 
      };
    } catch (error) {
      console.error('Failed to save credentials:', error);
      reply.code(500);
      return { error: '保存凭证失败' };
    }
  });

  // Emergency operations (controlled write operations)
  app.post('/api/pods/:id/pause', async (request, reply) => {
    const { id } = request.params as { id: string };
    const pod = podsRef.find((p) => p.config.id === id);

    if (!pod) {
      reply.code(404);
      return { error: 'Pod not found' };
    }

    const success = pod.mode.upgrade('DISABLED');

    // Log action
    console.log(`[ADMIN ACTION] Pod ${id} paused at ${new Date().toISOString()}`);

    return { success, currentMode: pod.mode.current };
  });

  app.post('/api/pods/:id/resume', async (request, reply) => {
    const { id } = request.params as { id: string };
    const pod = podsRef.find((p) => p.config.id === id);

    if (!pod) {
      reply.code(404);
      return { error: 'Pod not found' };
    }

    pod.mode.reset();

    // Log action
    console.log(`[ADMIN ACTION] Pod ${id} resumed at ${new Date().toISOString()}`);

    return { success: true, currentMode: pod.mode.current };
  });

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Config API listening on ${port}`);
  console.log(`SSE stream available at http://localhost:${port}/api/stream`);
}
