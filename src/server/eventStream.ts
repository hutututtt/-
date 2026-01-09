import { FastifyReply } from 'fastify';
import { RiskEvent, OrderLifecycleEvent, FillEvent, TradeEvent } from '@events/schemas.js';

export type ModeChangeEvent = {
    type: 'ModeChangeEvent';
    podId: string | null;
    oldMode: string;
    newMode: string;
    timestamp: number;
};

export type ReconciliationEvent = {
    type: 'ReconciliationEvent';
    podId: string;
    status: 'SUCCESS' | 'FAILURE';
    discrepancies: number;
    timestamp: number;
};

export type HeartbeatEvent = {
    type: 'HeartbeatEvent';
    globalMode: string;
    activePods: number;
    timestamp: number;
};

export type SystemEvent =
    | RiskEvent
    | OrderLifecycleEvent
    | FillEvent
    | TradeEvent
    | ModeChangeEvent
    | ReconciliationEvent
    | HeartbeatEvent;

export class EventStreamManager {
    private clients: Set<FastifyReply> = new Set();

    addClient(reply: FastifyReply): void {
        this.clients.add(reply);

        // Send initial connection event
        this.sendToClient(reply, {
            type: 'HeartbeatEvent',
            globalMode: 'NORMAL',
            activePods: 0,
            timestamp: Date.now()
        });

        // Handle client disconnect
        reply.raw.on('close', () => {
            this.removeClient(reply);
        });
    }

    removeClient(reply: FastifyReply): void {
        this.clients.delete(reply);
    }

    broadcast(event: SystemEvent): void {
        const data = JSON.stringify(event);
        this.clients.forEach((client) => {
            this.sendToClient(client, event);
        });
    }

    private sendToClient(reply: FastifyReply, event: SystemEvent): void {
        try {
            const data = JSON.stringify(event);
            reply.raw.write(`data: ${data}\n\n`);
        } catch (error) {
            console.error('Failed to send event to client:', error);
            this.removeClient(reply);
        }
    }

    getClientCount(): number {
        return this.clients.size;
    }
}

export const eventStreamManager = new EventStreamManager();
