import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { ConfigCenter } from './pages/ConfigCenter';
import { PodDetail } from './pages/PodDetail';

type Page = 'dashboard' | 'config' | 'pod-detail';

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
        <div className="nav-brand">Autopilot Trader</div>
        <div className="nav-links">
          <button
            className={currentPage === 'dashboard' || currentPage === 'pod-detail' ? 'nav-link active' : 'nav-link'}
            onClick={navigateToDashboard}
          >
            Dashboard
          </button>
          <button
            className={currentPage === 'config' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('config')}
          >
            Config Center
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard onNavigateToPod={navigateToPodDetail} />}
        {currentPage === 'config' && <ConfigCenter />}
        {currentPage === 'pod-detail' && selectedPodId && (
          <PodDetail podId={selectedPodId} onBack={navigateToDashboard} />
        )}
      </main>
    </div>
  );
}
