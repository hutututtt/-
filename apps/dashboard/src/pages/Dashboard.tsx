import { useEffect, useState } from 'react';
import { useEventStream } from '../hooks/useEventStream';
import { PodCard, PodStatus } from '../components/PodCard';
import { EventLog } from '../components/EventLog';

type SystemSummary = {
    buildVersion: string;
    tradingMode: string;
    globalMode: string;
    totalCapital: number;
    totalPnL: number;
};

type DashboardProps = {
    onNavigateToPod: (podId: string) => void;
};

export function Dashboard({ onNavigateToPod }: DashboardProps) {
    const [summary, setSummary] = useState<SystemSummary | null>(null);
    const [pods, setPods] = useState<PodStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const { events, connected } = useEventStream('http://localhost:3001/api/stream');

    const fetchData = async () => {
        try {
            const [summaryRes, podsRes] = await Promise.all([
                fetch('http://localhost:3001/api/config/summary'),
                fetch('http://localhost:3001/api/pods')
            ]);

            const summaryData = await summaryRes.json();
            const podsData = await podsRes.json();

            setSummary(summaryData);
            setPods(podsData.pods);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="loading">加载中...</div>;
    }

    const totalPnLPercent = summary
        ? ((summary.totalPnL / summary.totalCapital) * 100).toFixed(2)
        : '0.00';

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>交易系统总览</h1>
                    <div className="header-info">
                        <span className="info-item">
                            <span className="info-label">交易模式:</span>
                            <span className="info-value">{summary?.tradingMode}</span>
                        </span>
                        <span className="info-item">
                            <span className="info-label">版本:</span>
                            <span className="info-value">{summary?.buildVersion}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="system-overview">
                <div className="overview-card">
                    <div className="card-header">
                        <span className="card-icon">🌐</span>
                        <span className="card-label">全局模式</span>
                    </div>
                    <div className={`card-value mode-${summary?.globalMode.toLowerCase()}`}>
                        {summary?.globalMode}
                    </div>
                </div>
                <div className="overview-card">
                    <div className="card-header">
                        <span className="card-icon">💰</span>
                        <span className="card-label">总资金</span>
                    </div>
                    <div className="card-value">${summary?.totalCapital.toFixed(2)}</div>
                </div>
                <div className="overview-card">
                    <div className="card-header">
                        <span className="card-icon">📈</span>
                        <span className="card-label">总盈亏</span>
                    </div>
                    <div className={`card-value ${summary && summary.totalPnL >= 0 ? 'positive' : 'negative'}`}>
                        {summary && summary.totalPnL >= 0 ? '+' : ''}${summary?.totalPnL.toFixed(2)}
                        <span className="pnl-percent">({totalPnLPercent}%)</span>
                    </div>
                </div>
                <div className="overview-card">
                    <div className="card-header">
                        <span className="card-icon">🤖</span>
                        <span className="card-label">活跃策略</span>
                    </div>
                    <div className="card-value">{pods.filter((p) => p.mode !== 'DISABLED').length}</div>
                </div>
            </div>

            <div className="pods-section">
                <div className="section-header">
                    <h2>策略池</h2>
                    <span className="section-count">{pods.length} 个策略</span>
                </div>
                <div className="pods-grid">
                    {pods.map((pod) => (
                        <PodCard
                            key={pod.id}
                            pod={pod}
                            onClick={() => onNavigateToPod(pod.id)}
                        />
                    ))}
                </div>
            </div>

            <EventLog events={events} connected={connected} />
        </div>
    );
}
