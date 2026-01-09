export type PodStatus = {
    id: string;
    name: string;
    mode: string;
    capitalPool: number;
    currentCapital: number;
    pnl: number;
    openPositions: number;
    activeOrders: number;
    errorBudget: {
        apiErrors: number;
        reconciliationFailures: number;
    };
};

type PodCardProps = {
    pod: PodStatus;
    onClick: () => void;
};

export function PodCard({ pod, onClick }: PodCardProps) {
    const pnlPercent = ((pod.pnl / pod.capitalPool) * 100).toFixed(2);
    const isProfitable = pod.pnl >= 0;

    return (
        <div className="pod-card" onClick={onClick}>
            <div className="pod-card-header">
                <div className="pod-name-section">
                    <h3>{pod.name}</h3>
                    <span className="pod-id">#{pod.id}</span>
                </div>
                <span className={`mode-badge mode-${pod.mode.toLowerCase()}`}>{pod.mode}</span>
            </div>

            <div className="pod-card-stats">
                <div className="stat-row">
                    <span className="stat-label">当前资金</span>
                    <span className="stat-value">${pod.currentCapital.toFixed(2)}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">盈亏</span>
                    <span className={`stat-value ${isProfitable ? 'positive' : 'negative'}`}>
                        {isProfitable ? '+' : ''}${pod.pnl.toFixed(2)}
                        <span className="pnl-percent">({pnlPercent}%)</span>
                    </span>
                </div>
            </div>

            <div className="pod-card-footer">
                <div className="footer-item">
                    <span className="footer-label">持仓</span>
                    <span className="footer-value">{pod.openPositions}</span>
                </div>
                <div className="footer-item">
                    <span className="footer-label">订单</span>
                    <span className="footer-value">{pod.activeOrders}</span>
                </div>
                <div className="footer-item">
                    <span className="footer-label">错误</span>
                    <span className={`footer-value ${pod.errorBudget.apiErrors + pod.errorBudget.reconciliationFailures > 0 ? 'error' : ''}`}>
                        {pod.errorBudget.apiErrors + pod.errorBudget.reconciliationFailures}
                    </span>
                </div>
            </div>
        </div>
    );
}
