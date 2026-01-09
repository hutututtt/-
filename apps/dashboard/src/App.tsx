import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { ConfigCenter } from './pages/ConfigCenter';

type Page = 'dashboard' | 'config';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      <nav className="main-nav">
        <div className="nav-brand">Autopilot Trader</div>
        <div className="nav-links">
          <button
            className={currentPage === 'dashboard' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('dashboard')}
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
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'config' && <ConfigCenter />}
      </main>
    </div>
  );
}
