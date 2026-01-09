import { describe, expect, it } from 'vitest';
import { ExecutionEngine } from '@execution/executionEngine.js';
import { ModeFSM } from '@fsm/modeFsm.js';
import { reconciliationLoop } from '@loops/reconciliationLoop.js';
import { tradingLoop } from '@loops/tradingLoop.js';
import { createPods } from '@pods/podManager.js';
import { loadConfigRegistry } from '@config/registry.js';
class FailingBroker {
    async placeOrder() {
        throw new Error('placeOrder should not be called');
    }
    async cancelOrder() {
        return null;
    }
    async fetchOrders() {
        throw new Error('API down');
    }
    async fetchPositions() {
        throw new Error('API down');
    }
    async fetchBalance() {
        return { total: 0, available: 0 };
    }
}
class TrackingBroker {
    placed = [];
    positions = [];
    async placeOrder(order) {
        const created = { ...order, status: 'FILLED', timestamp: Date.now() };
        this.placed.push(created);
        return created;
    }
    async cancelOrder() {
        return null;
    }
    async fetchOrders() {
        return [];
    }
    async fetchPositions() {
        return this.positions;
    }
    async fetchBalance() {
        return { total: 0, available: 0 };
    }
}
describe('Risk drills', () => {
    it('API连续失败 → SAFE MODE', async () => {
        const broker = new FailingBroker();
        const engine = new ExecutionEngine(broker);
        const globalMode = new ModeFSM('NORMAL');
        const registry = loadConfigRegistry('DRY_RUN');
        const pods = createPods(Object.values(registry.pods.values), registry.ai.values, null);
        await reconciliationLoop(broker, engine, globalMode, pods, {
            safe: registry.global.values.risk.errorBudgetSafe,
            crash: registry.global.values.risk.errorBudgetCrash
        });
        await reconciliationLoop(broker, engine, globalMode, pods, {
            safe: registry.global.values.risk.errorBudgetSafe,
            crash: registry.global.values.risk.errorBudgetCrash
        });
        await reconciliationLoop(broker, engine, globalMode, pods, {
            safe: registry.global.values.risk.errorBudgetSafe,
            crash: registry.global.values.risk.errorBudgetCrash
        });
        expect(globalMode.current).toBe('SAFE');
    });
    it('行情延迟 → SAFE MODE，禁止新开仓', async () => {
        const broker = new TrackingBroker();
        const engine = new ExecutionEngine(broker);
        const globalMode = new ModeFSM('NORMAL');
        const registry = loadConfigRegistry('DRY_RUN');
        const pods = createPods(Object.values(registry.pods.values), registry.ai.values, null);
        await tradingLoop(globalMode, pods, engine, () => ({
            symbol: 'BTC-USDT',
            price: 30000,
            timestamp: Date.now(),
            dataQuality: 'DELAYED',
            volatility: 0.2
        }));
        expect(globalMode.current).toBe('SAFE');
        expect(broker.placed.length).toBe(0);
    });
    it('对账不一致 → reduce-only 平仓', async () => {
        const broker = new TrackingBroker();
        broker.positions = [
            { podId: 'core', symbol: 'BTC-USDT', quantity: 1, averagePrice: 30000 }
        ];
        const engine = new ExecutionEngine(broker);
        const globalMode = new ModeFSM('NORMAL');
        const registry = loadConfigRegistry('DRY_RUN');
        const pods = createPods(Object.values(registry.pods.values), registry.ai.values, null);
        await reconciliationLoop(broker, engine, globalMode, pods, {
            safe: registry.global.values.risk.errorBudgetSafe,
            crash: registry.global.values.risk.errorBudgetCrash
        });
        expect(broker.placed.length).toBe(1);
        expect(broker.placed[0]?.reduceOnly).toBe(true);
    });
    it('极端波动触发 → CRASH MODE + pause_learning', async () => {
        const broker = new TrackingBroker();
        const engine = new ExecutionEngine(broker);
        const globalMode = new ModeFSM('NORMAL');
        const registry = loadConfigRegistry('DRY_RUN');
        const pods = createPods(Object.values(registry.pods.values), registry.ai.values, null);
        await tradingLoop(globalMode, pods, engine, () => ({
            symbol: 'BTC-USDT',
            price: 30000,
            timestamp: Date.now(),
            dataQuality: 'GOOD',
            volatility: 0.95
        }));
        expect(globalMode.current).toBe('CRASH');
        expect(pods.every((pod) => pod.learningPaused)).toBe(true);
    });
});
