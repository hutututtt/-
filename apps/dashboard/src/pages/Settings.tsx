import { useState, useEffect } from 'react';

type OkxCredentials = {
  paperApiKey: string;
  paperApiSecret: string;
  paperApiPassphrase: string;
  liveApiKey?: string;
  liveApiSecret?: string;
  liveApiPassphrase?: string;
};

const API_BASE = 'http://localhost:3001';

export function Settings() {
  const [credentials, setCredentials] = useState<OkxCredentials>({
    paperApiKey: '',
    paperApiSecret: '',
    paperApiPassphrase: '',
    liveApiKey: '',
    liveApiSecret: '',
    liveApiPassphrase: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLive, setShowLive] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/credentials`);
      const data = await response.json();
      if (data.credentials) {
        setCredentials({
          paperApiKey: data.credentials.paperApiKey || '',
          paperApiSecret: data.credentials.paperApiSecret || '',
          paperApiPassphrase: data.credentials.paperApiPassphrase || '',
          liveApiKey: data.credentials.liveApiKey || '',
          liveApiSecret: data.credentials.liveApiSecret || '',
          liveApiPassphrase: data.credentials.liveApiPassphrase || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || '保存成功' });
        // 更新为掩码后的凭证
        if (data.credentials) {
          setCredentials({
            ...credentials,
            ...data.credentials
          });
        }
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>系统设置</h1>
        <p className="settings-subtitle">配置 OKX API 凭证</p>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        <div className="settings-section">
          <div className="section-header">
            <h2>模拟盘 API 凭证</h2>
            <span className="badge badge-demo">DEMO</span>
          </div>
          <p className="section-description">
            用于模拟交易环境。获取凭证：
            <a href="https://www.okx.com/account/my-api" target="_blank" rel="noopener noreferrer">
              OKX 模拟盘 API 管理
            </a>
          </p>

          <div className="form-group">
            <label htmlFor="paperApiKey">API Key</label>
            <input
              id="paperApiKey"
              type="text"
              className="form-input"
              value={credentials.paperApiKey}
              onChange={(e) => setCredentials({ ...credentials, paperApiKey: e.target.value })}
              placeholder="请输入 API Key"
            />
          </div>

          <div className="form-group">
            <label htmlFor="paperApiSecret">API Secret</label>
            <input
              id="paperApiSecret"
              type="password"
              className="form-input"
              value={credentials.paperApiSecret}
              onChange={(e) => setCredentials({ ...credentials, paperApiSecret: e.target.value })}
              placeholder="请输入 API Secret"
            />
          </div>

          <div className="form-group">
            <label htmlFor="paperApiPassphrase">API Passphrase</label>
            <input
              id="paperApiPassphrase"
              type="password"
              className="form-input"
              value={credentials.paperApiPassphrase}
              onChange={(e) => setCredentials({ ...credentials, paperApiPassphrase: e.target.value })}
              placeholder="请输入 API Passphrase"
            />
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h2>实盘 API 凭证</h2>
            <span className="badge badge-live">LIVE</span>
            <button
              className="btn-toggle"
              onClick={() => setShowLive(!showLive)}
            >
              {showLive ? '隐藏' : '显示'}
            </button>
          </div>
          <p className="section-description warning">
            ⚠️ 实盘交易涉及真实资金，请谨慎配置！
          </p>

          {showLive && (
            <>
              <div className="form-group">
                <label htmlFor="liveApiKey">API Key</label>
                <input
                  id="liveApiKey"
                  type="text"
                  className="form-input"
                  value={credentials.liveApiKey || ''}
                  onChange={(e) => setCredentials({ ...credentials, liveApiKey: e.target.value })}
                  placeholder="请输入实盘 API Key"
                />
              </div>

              <div className="form-group">
                <label htmlFor="liveApiSecret">API Secret</label>
                <input
                  id="liveApiSecret"
                  type="password"
                  className="form-input"
                  value={credentials.liveApiSecret || ''}
                  onChange={(e) => setCredentials({ ...credentials, liveApiSecret: e.target.value })}
                  placeholder="请输入实盘 API Secret"
                />
              </div>

              <div className="form-group">
                <label htmlFor="liveApiPassphrase">API Passphrase</label>
                <input
                  id="liveApiPassphrase"
                  type="password"
                  className="form-input"
                  value={credentials.liveApiPassphrase || ''}
                  onChange={(e) => setCredentials({ ...credentials, liveApiPassphrase: e.target.value })}
                  placeholder="请输入实盘 API Passphrase"
                />
              </div>
            </>
          )}
        </div>

        <div className="settings-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>

        <div className="settings-info">
          <h3>说明</h3>
          <ul>
            <li>凭证将加密存储在本地 data/credentials.json 文件中</li>
            <li>保存后需要重启系统才能应用新的 API 凭证</li>
            <li>如果设置了环境变量，将优先使用环境变量中的凭证</li>
            <li>模拟盘凭证用于 PAPER 模式，实盘凭证用于 LIVE 模式</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
