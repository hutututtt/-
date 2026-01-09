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

export function Dashboard() {
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
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    const totalPnLPercent = summary
        ? ((summary.totalPnL / summary.totalCapital) * 100).toFixed(2)
        : '0.00';

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Trading System Dashboard</h1>
                <div className="header-info">
                    <span>Mode: {summary?.tradingMode}</span>
                    <span>Build: {summary?.buildVersion}</span>
                </div>
            </div>

            <div className="system-overview">
                <div className="overview-card">
                    <label>Global Mode</label>
                    <div className={`overview-value mode-${summary?.globalMode.toLowerCase()}`}>
                        {summary?.globalMode}
                    </div>
                </div>
                <div className="overview-card">
                    <label>Total Capital</label>
                    <div className="overview-value">${summary?.totalCapital.toFixed(2)}</div>
                </div>
                <div className="overview-card">
                    <label>Total P&L</label>
                    <div className={`overview-value ${summary && summary.totalPnL >= 0 ? 'positive' : 'negative'}`}>
                        {summary && summary.totalPnL >= 0 ? '+' : ''}${summary?.totalPnL.toFixed(2)} ({totalPnLPercent}%)
                    </div>
                </div>
                <div className="overview-card">
                    <label>Active Pods</label>
                    <div className="overview-value">{pods.filter((p) => p.mode !== 'DISABLED').length}</div>
                </div>
            </div>

            <div className="pods-section">
                <h2>Risk Pods</h2>
                <div className="pods-grid">
                    {pods.map((pod) => (
                        <PodCard
                            key={pod.id}
                            pod={pod}
                            onClick={() => {
                                // Navigate to pod detail (will implement later)
                                console.log('Navigate to pod:', pod.id);
                            }}
                        />
                    ))}
                </div>
            </div>

            <EventLog events={events} connected={connected} />
        </div>
    );
}
