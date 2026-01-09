import { useEffect, useMemo, useState } from 'react';

type ConfigItem = {
    key: string;
    value: unknown;
    frozen: boolean;
    source: 'yaml' | 'env' | 'default' | 'computed';
    scope: string;
    updatedAt: string;
    description: string;
};

type FilterState = {
    query: string;
    frozen: 'all' | 'true' | 'false';
    source: 'all' | 'yaml' | 'env' | 'default' | 'computed';
    scope: 'all' | string;
};

const defaultFilters: FilterState = {
    query: '',
    frozen: 'all',
    source: 'all',
    scope: 'all'
};

const tabs = ['Global Config', 'Pod Config', 'AI Config', 'Effective Config'] as const;
type Tab = (typeof tabs)[number];

const storageKey = 'config-center-effective-snapshot';

function filterItems(items: ConfigItem[], filters: FilterState) {
    return items.filter((item) => {
        if (filters.query && !item.key.toLowerCase().includes(filters.query.toLowerCase())) {
            return false;
        }
        if (filters.frozen !== 'all' && String(item.frozen) !== filters.frozen) {
            return false;
        }
        if (filters.source !== 'all' && item.source !== filters.source) {
            return false;
        }
        if (filters.scope !== 'all' && item.scope !== filters.scope) {
            return false;
        }
        return true;
    });
}

function ConfigTable({ items, onSelect }: { items: ConfigItem[]; onSelect: (item: ConfigItem) => void }) {
    const [ascending, setAscending] = useState(true);

    const sortedItems = useMemo(() => {
        const sorted = [...items].sort((a, b) => a.key.localeCompare(b.key));
        return ascending ? sorted : sorted.reverse();
    }, [items, ascending]);

    return (
        <table className="config-table">
            <thead>
                <tr>
                    <th>
                        <button className="sort-button" onClick={() => setAscending(!ascending)}>
                            Key {ascending ? '▲' : '▼'}
                        </button>
                    </th>
                    <th>Value</th>
                    <th>Badges</th>
                </tr>
            </thead>
            <tbody>
                {sortedItems.map((item) => (
                    <tr key={item.key} onClick={() => onSelect(item)}>
                        <td className="key-cell">{item.key}</td>
                        <td className="value-cell">{JSON.stringify(item.value)}</td>
                        <td>
                            <span className={item.frozen ? 'badge badge-frozen' : 'badge'}>
                                {item.frozen ? 'Frozen' : 'Mutable'}
                            </span>
                            <span className="badge badge-source">{item.source}</span>
                            <span className="badge badge-scope">{item.scope}</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Drawer({ item, onClose }: { item: ConfigItem | null; onClose: () => void }) {
    if (!item) return null;
    return (
        <div className="drawer">
            <div className="drawer-content">
                <button className="close-button" onClick={onClose}>
                    Close
                </button>
                <h3>{item.key}</h3>
                <p>{item.description || 'No description available.'}</p>
                <div className="drawer-grid">
                    <div>
                        <strong>Value</strong>
                        <pre>{JSON.stringify(item.value, null, 2)}</pre>
                    </div>
                    <div>
                        <strong>Metadata</strong>
                        <ul>
                            <li>Frozen: {String(item.frozen)}</li>
                            <li>Source: {item.source}</li>
                            <li>Scope: {item.scope}</li>
                            <li>Updated At: {item.updatedAt}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ConfigCenter() {
    const [activeTab, setActiveTab] = useState<Tab>('Global Config');
    const [selectedItem, setSelectedItem] = useState<ConfigItem | null>(null);
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [selectedPod, setSelectedPod] = useState('core');

    const [summary, setSummary] = useState<{ buildVersion: string; configHash: string } | null>(null);
    const [globalConfig, setGlobalConfig] = useState<{ items: ConfigItem[] } | null>(null);
    const [podsConfig, setPodsConfig] = useState<{ items: ConfigItem[] } | null>(null);
    const [effectiveConfig, setEffectiveConfig] = useState<{ items: ConfigItem[]; configHash: string; buildVersion: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, globalRes, podRes, effectiveRes] = await Promise.all([
                    fetch('http://localhost:3001/api/config/summary'),
                    fetch('http://localhost:3001/api/config/global'),
                    fetch(`http://localhost:3001/api/config/pods/${selectedPod}`),
                    fetch('http://localhost:3001/api/config/effective')
                ]);

                setSummary(await summaryRes.json());
                setGlobalConfig(await globalRes.json());
                setPodsConfig(await podRes.json());
                setEffectiveConfig(await effectiveRes.json());
            } catch (error) {
                console.error('Failed to fetch config:', error);
            }
        };

        fetchData();
    }, [selectedPod]);

    const filteredGlobal = useMemo(() => {
        if (!globalConfig) return [];
        return filterItems(globalConfig.items, filters);
    }, [globalConfig, filters]);

    const filteredPod = useMemo(() => {
        if (!podsConfig) return [];
        return filterItems(podsConfig.items, { ...filters, scope: 'all' });
    }, [podsConfig, filters]);

    const filteredAi = useMemo(() => {
        if (!effectiveConfig) return [];
        return effectiveConfig.items.filter((item) => item.scope === `ai:${selectedPod}`);
    }, [effectiveConfig, selectedPod]);

    const effectiveItems = effectiveConfig?.items ?? [];

    const diffResult = useMemo(() => {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return null;
        const previous = JSON.parse(stored) as Record<string, unknown>;
        const current = Object.fromEntries(effectiveItems.map((item) => [item.key, item.value]));
        const added = Object.keys(current).filter((key) => !(key in previous));
        const removed = Object.keys(previous).filter((key) => !(key in current));
        const changed = Object.keys(current).filter(
            (key) => key in previous && JSON.stringify(previous[key]) !== JSON.stringify(current[key])
        );
        return { added, removed, changed };
    }, [effectiveItems]);

    const saveSnapshot = () => {
        const snapshot = Object.fromEntries(effectiveItems.map((item) => [item.key, item.value]));
        localStorage.setItem(storageKey, JSON.stringify(snapshot));
        alert('Snapshot saved!');
    };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(effectiveItems, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'effective-config.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="config-center">
            <header>
                <div>
                    <h1>Config Center</h1>
                    <p>Build: {summary?.buildVersion ?? 'loading'} · Hash: {summary?.configHash}</p>
                </div>
            </header>

            <nav className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={tab === activeTab ? 'tab active' : 'tab'}
                        onClick={() => {
                            setActiveTab(tab);
                            setSelectedItem(null);
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {activeTab === 'Global Config' && (
                <section>
                    <div className="filters">
                        <input
                            placeholder="Search key"
                            value={filters.query}
                            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                        />
                        <select
                            value={filters.frozen}
                            onChange={(event) => setFilters({ ...filters, frozen: event.target.value as FilterState['frozen'] })}
                        >
                            <option value="all">Frozen: all</option>
                            <option value="true">Frozen: true</option>
                            <option value="false">Frozen: false</option>
                        </select>
                        <select
                            value={filters.source}
                            onChange={(event) => setFilters({ ...filters, source: event.target.value as FilterState['source'] })}
                        >
                            <option value="all">Source: all</option>
                            <option value="yaml">Source: yaml</option>
                            <option value="env">Source: env</option>
                            <option value="default">Source: default</option>
                            <option value="computed">Source: computed</option>
                        </select>
                    </div>
                    {globalConfig ? (
                        <ConfigTable items={filteredGlobal} onSelect={setSelectedItem} />
                    ) : (
                        <p>Loading...</p>
                    )}
                </section>
            )}

            {activeTab === 'Pod Config' && (
                <section>
                    <div className="filters">
                        <select value={selectedPod} onChange={(event) => setSelectedPod(event.target.value)}>
                            <option value="core">Core Pod</option>
                            <option value="spec">Speculative Pod</option>
                        </select>
                    </div>
                    {podsConfig ? (
                        <ConfigTable items={filteredPod} onSelect={setSelectedItem} />
                    ) : (
                        <p>Loading...</p>
                    )}
                </section>
            )}

            {activeTab === 'AI Config' && (
                <section>
                    <div className="filters">
                        <select value={selectedPod} onChange={(event) => setSelectedPod(event.target.value)}>
                            <option value="core">Core Pod</option>
                            <option value="spec">Speculative Pod</option>
                        </select>
                    </div>
                    {effectiveConfig ? (
                        <ConfigTable items={filteredAi} onSelect={setSelectedItem} />
                    ) : (
                        <p>Loading...</p>
                    )}
                </section>
            )}

            {activeTab === 'Effective Config' && (
                <section>
                    <div className="effective-header">
                        <div>
                            <p>Build Version: {effectiveConfig?.buildVersion ?? 'loading'}</p>
                            <p>Config Hash: {effectiveConfig?.configHash ?? 'loading'}</p>
                        </div>
                        <div className="button-group">
                            <button onClick={exportJson}>Export JSON</button>
                            <button onClick={saveSnapshot}>Save Snapshot</button>
                        </div>
                    </div>
                    {diffResult && (
                        <div className="diff-panel">
                            <div>
                                <h4>Added</h4>
                                <ul>{diffResult.added.map((key) => <li key={key}>{key}</li>)}</ul>
                            </div>
                            <div>
                                <h4>Removed</h4>
                                <ul>{diffResult.removed.map((key) => <li key={key}>{key}</li>)}</ul>
                            </div>
                            <div>
                                <h4>Changed</h4>
                                <ul>{diffResult.changed.map((key) => <li key={key}>{key}</li>)}</ul>
                            </div>
                        </div>
                    )}
                    {effectiveConfig ? (
                        <ConfigTable items={effectiveItems} onSelect={setSelectedItem} />
                    ) : (
                        <p>Loading...</p>
                    )}
                </section>
            )}

            <Drawer item={selectedItem} onClose={() => setSelectedItem(null)} />
        </div>
    );
}
