import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { ConfigCenter } from './pages/ConfigCenter';
import { PodDetail } from './pages/PodDetail';
import { Settings } from './pages/Settings';

type Page = 'dashboard' | 'config' | 'pod-detail' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);

  const navigateToPodDetail = (podId: string) => {
    setSelectedPodId(podId);
    setCurrentPage('pod-detail');
  };

  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedPodId(null);
  };

  return (
    <div className="app">
      <nav className="main-nav">
        <div className="nav-left">
          <div className="nav-brand">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">自动交易系统</span>
          </div>
        </div>
        <div className="nav-center">
          <button
            className={currentPage === 'dashboard' || currentPage === 'pod-detail' ? 'nav-link active' : 'nav-link'}
            onClick={navigateToDashboard}
          >
            <span className="nav-icon">📊</span>
            <span>仪表盘</span>
          </button>
          <button
            className={currentPage === 'config' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('config')}
          >
            <span className="nav-icon">⚙️</span>
            <span>配置中心</span>
          </button>
          <button
            className={currentPage === 'settings' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('settings')}
          >
            <span className="nav-icon">🔐</span>
            <span>系统设置</span>
          </button>
        </div>
        <div className="nav-right">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">系统运行中</span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard onNavigateToPod={navigateToPodDetail} />}
        {currentPage === 'config' && <ConfigCenter />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'pod-detail' && selectedPodId && (
          <PodDetail podId={selectedPodId} onBack={navigateToDashboard} />
        )}
      </main>
    </div>
  );
}
