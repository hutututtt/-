import { SystemEvent } from '../hooks/useEventStream';

type EventLogProps = {
    events: SystemEvent[];
    connected: boolean;
};

const eventTypeNames: Record<string, string> = {
    'RiskEvent': '风控事件',
    'TradeEvent': '交易事件',
    'FillEvent': '成交事件',
    'ModeChangeEvent': '模式变更',
    'ReconciliationEvent': '对账事件',
    'HeartbeatEvent': '心跳'
};

export function EventLog({ events, connected }: EventLogProps) {
    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('zh-CN');
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'RiskEvent':
                return 'event-risk';
            case 'TradeEvent':
            case 'FillEvent':
                return 'event-trade';
            case 'ModeChangeEvent':
                return 'event-mode';
            case 'HeartbeatEvent':
                return 'event-heartbeat';
            default:
                return 'event-default';
        }
    };

    return (
        <div className="event-log">
            <div className="event-log-header">
                <h3>实时事件流</h3>
                <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
                    {connected ? '● 已连接' : '○ 已断开'}
                </span>
            </div>

            <div className="event-log-content">
                {events.length === 0 ? (
                    <p className="no-events">等待事件...</p>
                ) : (
                    events.slice().reverse().map((event, index) => (
                        <div key={index} className={`event-item ${getEventColor(event.type)}`}>
                            <span className="event-time">
                                {formatTimestamp((event.timestamp as number) || Date.now())}
                            </span>
                            <span className="event-type">{eventTypeNames[event.type] || event.type}</span>
                            <span className="event-data">
                                {JSON.stringify(event, null, 0).slice(0, 100)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
