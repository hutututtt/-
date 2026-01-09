import { useEffect, useState, useRef } from 'react';

export type SystemEvent = {
    type: string;
    [key: string]: unknown;
};

export function useEventStream(url: string) {
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const connectEventSource = () => {
            const eventSource = new EventSource(url);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                setConnected(true);
                setError(null);
                console.log('[SSE] Connected to event stream');
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as SystemEvent;
                    setEvents((prev) => [...prev.slice(-49), data]); // Keep last 50 events
                } catch (err) {
                    console.error('[SSE] Failed to parse event:', err);
                }
            };

            eventSource.onerror = () => {
                setConnected(false);
                setError('Connection lost');
                console.error('[SSE] Connection error, will retry...');
                eventSource.close();

                // Retry connection after 3 seconds
                setTimeout(connectEventSource, 3000);
            };
        };

        connectEventSource();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [url]);

    return { events, connected, error };
}
