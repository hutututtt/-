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
        return <div className="loading">加载策略详情...</div>;
    }

    if (!pod) {
        return <div className="error">未找到策略</div>;
    }

    const pnlPercent = ((pod.runtime.pnl / pod.config.capitalPool) * 100).toFixed(2);
    const isProfitable = pod.runtime.pnl >= 0;

    return (
        <div className="pod-detail">
            <div className="pod-detail-header">
                <button className="back-button" onClick={onBack}>
                    ← 返回
                </button>
                <div>
                    <h1>{pod.name}</h1>
                    <span className={`mode-badge mode-${pod.runtime.mode.toLowerCase()}`}>
                        {pod.runtime.mode}
                    </span>
                </div>
            </div>

            <div className="pod-detail-grid">
                {/* 资金与绩效 */}
                <div className="detail-section">
                    <h2>资金与绩效</h2>
                    <div className="detail-stats">
                        <div className="detail-stat">
                            <label>初始资金</label>
                            <div className="stat-value">${pod.config.capitalPool.toFixed(2)}</div>
                        </div>
                        <div className="detail-stat">
                            <label>当前资金</label>
                            <div className="stat-value">${pod.runtime.currentCapital.toFixed(2)}</div>
                        </div>
                        <div className="detail-stat">
                            <label>盈亏</label>
                            <div className={`stat-value ${isProfitable ? 'positive' : 'negative'}`}>
                                {isProfitable ? '+' : ''}${pod.runtime.pnl.toFixed(2)} ({pnlPercent}%)
                            </div>
                        </div>
                    </div>
                </div>

                {/* 风险限制 */}
                <div className="detail-section">
                    <h2>风险限制</h2>
                    <div className="detail-table">
                        <div className="detail-row">
                            <span>杠杆倍数</span>
                            <span>{pod.config.riskLimits.leverage}x</span>
                        </div>
                        <div className="detail-row">
                            <span>最大日损失</span>
                            <span>${pod.config.riskLimits.maxDailyLoss}</span>
                        </div>
                        <div className="detail-row">
                            <span>最大回撤</span>
                            <span>${pod.config.riskLimits.maxDrawdown}</span>
                        </div>
                        <div className="detail-row">
                            <span>最大持仓数</span>
                            <span>{pod.config.riskLimits.maxOpenPositions}</span>
                        </div>
                        <div className="detail-row">
                            <span>单笔最大名义金额</span>
                            <span>${pod.config.riskLimits.maxNotionalPerTrade}</span>
                        </div>
                        <div className="detail-row">
                            <span>要求止损</span>
                            <span>{pod.config.riskLimits.requireStopLoss ? '是' : '否'}</span>
                        </div>
                        <div className="detail-row">
                            <span>允许加仓</span>
                            <span>{pod.config.riskLimits.allowScaleIn ? '是' : '否'}</span>
                        </div>
                    </div>
                </div>

                {/* AI 配置 */}
                <div className="detail-section">
                    <h2>AI 配置</h2>
                    <div className="detail-table">
                        <div className="detail-row">
                            <span>市场状态权重</span>
                            <span>{pod.aiProfile.regimeWeight}</span>
                        </div>
                        <div className="detail-row">
                            <span>审计权重</span>
                            <span>{pod.aiProfile.auditorWeight}</span>
                        </div>
                        <div className="detail-row">
                            <span>风险权重</span>
                            <span>{pod.aiProfile.riskWeight}</span>
                        </div>
                        <div className="detail-row">
                            <span>学习率</span>
                            <span>{pod.aiProfile.learningRate}</span>
                        </div>
                        <div className="detail-row">
                            <span>最小样本数</span>
                            <span>{pod.aiProfile.minSamples}</span>
                        </div>
                        <div className="detail-row">
                            <span>最大变化百分比</span>
                            <span>{pod.aiProfile.maxDeltaPercent}%</span>
                        </div>
                        <div className="detail-row">
                            <span>学习状态</span>
                            <span className={pod.runtime.learningPaused ? 'negative' : 'positive'}>
                                {pod.runtime.learningPaused ? '已暂停' : '活跃'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 策略与配置 */}
                <div className="detail-section">
                    <h2>策略与配置</h2>
                    <div className="detail-table">
                        <div className="detail-row">
                            <span>策略类型</span>
                            <span>{pod.config.strategy}</span>
                        </div>
                        <div className="detail-row">
                            <span>订单标签前缀</span>
                            <span>{pod.config.orderTagPrefix}</span>
                        </div>
                        <div className="detail-row">
                            <span>API 错误</span>
                            <span className={pod.runtime.errorBudget.apiErrors > 0 ? 'negative' : ''}>
                                {pod.runtime.errorBudget.apiErrors}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span>对账失败</span>
                            <span className={pod.runtime.errorBudget.reconciliationFailures > 0 ? 'negative' : ''}>
                                {pod.runtime.errorBudget.reconciliationFailures}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 持仓列表 */}
                <div className="detail-section full-width">
                    <h2>持仓 ({pod.runtime.positions.length})</h2>
                    {pod.runtime.positions.length === 0 ? (
                        <p className="no-data">暂无持仓</p>
                    ) : (
                        <table className="detail-data-table">
                            <thead>
                                <tr>
                                    <th>交易对</th>
                                    <th>数量</th>
                                    <th>平均价格</th>
                                    <th>入场时间</th>
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
                                        <td>{new Date(pos.entryTime).toLocaleString('zh-CN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 订单列表 */}
                <div className="detail-section full-width">
                    <h2>最近订单 ({pod.runtime.orders.length})</h2>
                    {pod.runtime.orders.length === 0 ? (
                        <p className="no-data">暂无订单</p>
                    ) : (
                        <table className="detail-data-table">
                            <thead>
                                <tr>
                                    <th>订单 ID</th>
                                    <th>交易对</th>
                                    <th>方向</th>
                                    <th>状态</th>
                                    <th>成交数量</th>
                                    <th>最后更新</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pod.runtime.orders.slice(0, 10).map((order) => (
                                    <tr key={order.clientOrderId}>
                                        <td className="monospace">{order.clientOrderId.slice(-8)}</td>
                                        <td>{order.symbol}</td>
                                        <td className={order.side === 'BUY' ? 'positive' : 'negative'}>
                                            {order.side === 'BUY' ? '买入' : '卖出'}
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>{order.filledQuantity}</td>
                                        <td>{new Date(order.lastUpdate).toLocaleString('zh-CN')}</td>
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
