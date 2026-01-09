import { useEffect, useState } from 'react';
import { useEventStream } from '../hooks/useEventStream';

type PodConfig = {
    id: string;
    name: string;
    mode: string;
    capitalPool: number;
    riskLimits: {
        leverage: number;
        maxDailyLoss: number;
        maxDrawdown: number;
        maxOpenPositions: number;
        maxNotionalPerTrade: number;
        requireStopLoss: boolean;
        maxHoldingMinutes?: number;
        allowScaleIn: boolean;
    };
    strategy: string;
    orderTagPrefix: string;
};

type AiProfile = {
    podId: string;
    regimeWeight: number;
    auditorWeight: number;
    riskWeight: number;
    learningRate: number;
    minSamples: number;
    maxDeltaPercent: number;
};

type Position = {
    podId: string;
    symbol: string;
    quantity: number;
    averagePrice: number;
    entryTime: number;
};

type Order = {
    clientOrderId: string;
    status: string;
    filledQuantity: number;
    podId: string;
    symbol: string;
    side: string;
    lastUpdate: number;
};

type PodDetailData = {
    id: string;
    name: string;
    config: PodConfig;
    aiProfile: AiProfile;
    runtime: {
        mode: string;
        currentCapital: number;
        pnl: number;
        positions: Position[];
        orders: Order[];
        errorBudget: {
            apiErrors: number;
            reconciliationFailures: number;
        };
        learningPaused: boolean;
    };
};

type PodDetailProps = {
    podId: string;
    onBack: () => void;
};

export function PodDetail({ podId, onBack }: PodDetailProps) {
    const [pod, setPod] = useState<PodDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const { events } = useEventStream('http://localhost:3001/api/stream');

    const fetchPodDetail = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/pods/${podId}/detail`);
            const data = await response.json();
            setPod(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch pod detail:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPodDetail();
        const interval = setInterval(fetchPodDetail, 5000);
        return () => clearInterval(interval);
    }, [podId]);

    // Update pod data when relevant events arrive
    useEffect(() => {
        const relevantEvent = events.find((e) => {
            const event = e as { podId?: string };
            return event.podId === podId;
        });
        if (relevantEvent) {
            fetchPodDetail();
        }
    }, [events, podId]);

    if (loading) {
        return <div className="loading">Loading Pod Details...</div>;
    }

    if (!pod) {
        return <div className="error">Pod not found</div>;
    }

    const pnlPercent = ((pod.runtime.pnl / pod.config.capitalPool) * 100).toFixed(2);
    const isProfitable = pod.runtime.pnl >= 0;

    return (
        <div className="pod-detail">
            <div className="pod-detail-header">
                <button className="back-button" onClick={onBack}>
                    ← Back
                </button>
                <div>
                    <h1>{pod.name}</h1>
                    <span className={`mode-badge mode-${pod.runtime.mode.toLowerCase()}`}>
                        {pod.runtime.mode}
                    </span>
                </div>
            </div>

            <div className="pod-detail-grid">
                {/* Capital & P&L Section */}
                <div className="detail-section">
                    <h2>Capital & Performance</h2>
                    <div className="detail-stats">
                        <div className="detail-stat">
                            <label>Initial Capital</label>
                            <div className="stat-value">${pod.config.capitalPool.toFixed(2)}</div>
                        </div>
                        <div className="detail-stat">
                            <label>Current Capital</label>
                            <div className="stat-value">${pod.runtime.currentCapital.toFixed(2)}</div>
                        </div>
                        <div className="detail-stat">
                            <label>P&L</label>
                            <div className={`stat-value ${isProfitable ? 'positive' : 'negative'}`}>
                                {isProfitable ? '+' : ''}${pod.runtime.pnl.toFixed(2)} ({pnlPercent}%)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Limits Section */}
                <div className="detail-section">
                    <h2>Risk Limits</h2>
                    <div className="detail-table">
                        <div className="detail-row">
                            <span>Leverage</span>
                            <span>{pod.config.riskLimits.leverage}x</span>
                        </div>
                        <div className="detail-row">
                            <span>Max Daily Loss</span>
                            <span>${pod.config.riskLimits.maxDailyLoss}</span>
                        </div>
                        <div className="detail-row">
                            <span>Max Drawdown</span>
                            <span>${pod.config.riskLimits.maxDrawdown}</span>
                        </div>
                        <div className="detail-row">
                            <span>Max Open Positions</span>
                            <span>{pod.config.riskLimits.maxOpenPositions}</span>
                        </div>
                        <div className="detail-row">
                            <span>Max Notional Per Trade</span>
                            <span>${pod.config.riskLimits.maxNotionalPerTrade}</span>
                        </div>
                        <div className="detail-row">
                            <span>Require Stop Loss</span>
                            <span>{pod.config.riskLimits.requireStopLoss ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="detail-row">
                            <span>Allow Scale In</span>
                            <span>{pod.config.riskLimits.allowScaleIn ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>

                {/* AI Configuration Section */}
                <div className="detail-section">
                    <h2>AI Configuration</h2>
                    <div className="detail-table">
                        <div className="detail-row">
                            <span>Regime Weight</span>
                            <span>{pod.aiProfile.regimeWeight}</span>
                        </div>
                        <div className="detail-row">
                            <span>Auditor Weight</span>
                            <span>{pod.aiProfile.auditorWeight}</span>
                        </div>
                        <div className="detail-row">
                            <span>Risk Weight</span>
                            <span>{pod.aiProfile.riskWeight}</span>
                        </div>
                        <div className="detail-row">
                            <span>Learning Rate</span>
                            <span>{pod.aiProfile.learningRate}</span>
                        </div>
                        <div className="detail-row">
                            <span>Min Samples</span>
                            <span>{pod.aiProfile.minSamples}</span>
                        </div>
                        <div className="detail-row">
                            <span>Max Delta %</span>
                            <span>{pod.aiProfile.maxDeltaPercent}%</span>
                        </div>
                        <div className="detail-row">
                            <span>Learning Status</span>
                            <span className={pod.runtime.learningPaused ? 'negative' : 'positive'}>
                                {pod.runtime.learningPaused ? 'Paused' : 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Strategy & Config Section */}
                <div className="detail-section">
                    <h2>Strategy & Config</h2>
                    <div className="detail-table">
                        <div className="detail-row">
                            <span>Strategy</span>
                            <span>{pod.config.strategy}</span>
                        </div>
                        <div className="detail-row">
                            <span>Order Tag Prefix</span>
                            <span>{pod.config.orderTagPrefix}</span>
                        </div>
                        <div className="detail-row">
                            <span>API Errors</span>
                            <span className={pod.runtime.errorBudget.apiErrors > 0 ? 'negative' : ''}>
                                {pod.runtime.errorBudget.apiErrors}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span>Reconciliation Failures</span>
                            <span className={pod.runtime.errorBudget.reconciliationFailures > 0 ? 'negative' : ''}>
                                {pod.runtime.errorBudget.reconciliationFailures}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Positions Section */}
                <div className="detail-section full-width">
                    <h2>Open Positions ({pod.runtime.positions.length})</h2>
                    {pod.runtime.positions.length === 0 ? (
                        <p className="no-data">No open positions</p>
                    ) : (
                        <table className="detail-data-table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Quantity</th>
                                    <th>Avg Price</th>
                                    <th>Entry Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pod.runtime.positions.map((pos, index) => (
                                    <tr key={index}>
                                        <td>{pos.symbol}</td>
                                        <td className={pos.quantity > 0 ? 'positive' : 'negative'}>
                                            {pos.quantity > 0 ? '+' : ''}{pos.quantity}
                                        </td>
                                        <td>${pos.averagePrice.toFixed(2)}</td>
                                        <td>{new Date(pos.entryTime).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Orders Section */}
                <div className="detail-section full-width">
                    <h2>Recent Orders ({pod.runtime.orders.length})</h2>
                    {pod.runtime.orders.length === 0 ? (
                        <p className="no-data">No orders</p>
                    ) : (
                        <table className="detail-data-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Symbol</th>
                                    <th>Side</th>
                                    <th>Status</th>
                                    <th>Filled Qty</th>
                                    <th>Last Update</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pod.runtime.orders.slice(0, 10).map((order) => (
                                    <tr key={order.clientOrderId}>
                                        <td className="monospace">{order.clientOrderId.slice(-8)}</td>
                                        <td>{order.symbol}</td>
                                        <td className={order.side === 'BUY' ? 'positive' : 'negative'}>
                                            {order.side}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>{order.filledQuantity}</td>
                                        <td>{new Date(order.lastUpdate).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
