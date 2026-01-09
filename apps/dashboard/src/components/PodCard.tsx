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
                <h3>{pod.name}</h3>
                <span className={`mode-badge mode-${pod.mode.toLowerCase()}`}>{pod.mode}</span>
            </div>

            <div className="pod-card-stats">
                <div className="stat">
                    <label>Capital</label>
                    <div className="stat-value">${pod.currentCapital.toFixed(2)}</div>
                </div>
                <div className="stat">
                    <label>P&L</label>
                    <div className={`stat-value ${isProfitable ? 'positive' : 'negative'}`}>
                        {isProfitable ? '+' : ''}${pod.pnl.toFixed(2)} ({pnlPercent}%)
                    </div>
                </div>
            </div>

            <div className="pod-card-footer">
                <span>Positions: {pod.openPositions}</span>
                <span>Orders: {pod.activeOrders}</span>
                <span>Errors: {pod.errorBudget.apiErrors + pod.errorBudget.reconciliationFailures}</span>
            </div>
        </div>
    );
}
