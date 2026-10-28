'use client';
import { useIotDashboard } from './hooks/useIotDashboard';
import { paths } from './constants';
import type { View } from './types';
import { Icon } from './components/ui';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Sensors from './screens/Sensors';
import History from './screens/History';
import Profile from './screens/Profile';

// Khung ứng dụng và chuyển màn hình.
export default function App() {
  const model = useIotDashboard();
  const { authed, view, setView, setQuery, mqttConnected, name, logout, notice, setNotice } = model;
  if (!authed) return <Login {...model} />;
  return (<div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark small">
          <Icon name="cpu" size={18} />
        </div>
        <div>
          <b>IOT
            <span>.</span>
          </b>
        </div>
      </div>
      <nav className="nav-list">
        {(['dashboard', 'sensors', 'history', 'profile'] as View[]).map((item) => <button key={item} className={`nav-item ${view === item ? 'active' : ''}`} onClick={() => { setView(item); setQuery(''); }}>
          <Icon name={{ dashboard: 'grid', sensors: 'chart', history: 'clock', profile: 'user' }[item]} />
          <span>
            {paths[item]}
          </span>
          {view === item && <i />}
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="connection">
          <span className={mqttConnected ? "online-dot" : "offline-dot"} />
          <div>
            <b>MQTT</b>
            <small>
              {mqttConnected ? "Đã kết nối" : "Chưa kết nối MQTT"}
            </small>
          </div>
        </div>
        <div className="user-mini">
          <div className="avatar">H</div>
          <div className="user-mini-copy">
            <b>
              {name}
            </b>
            <small>Quản trị viên</small>
          </div>
          <button className="icon-button" title="Đăng xuất" onClick={logout}>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumb">Trang chủ
          <Icon name="chevron" size={13} />
          <b>
            {paths[view]}
          </b>
        </div>
        <div className="top-actions">
          <div className="live-label">
            <span className={mqttConnected ? "online-dot" : "offline-dot"} />
            {mqttConnected ? "MQTT" : "Chưa kết nối MQTT"}
          </div>
          <button className="top-avatar" onClick={() => setView('profile')}>H</button>
        </div>
      </header>
      <div className={`page-content ${view === 'dashboard' ? 'dashboard-page' : ''}`}>
        {notice && <div className="toast">
          <Icon name="check" size={16} />
          {notice}
          <button onClick={() => setNotice('')}>×</button>
        </div>}
        {/* Bảng điều khiển */}
        {view === 'dashboard' && <Dashboard {...model} />}
        {/* Dữ liệu cảm biến */}
        {view === 'sensors' && <Sensors {...model} />}
        {/* Lịch sử bật/tắt */}
        {view === 'history' && <History {...model} />}
        {/* Hồ sơ cá nhân */}
        {view === 'profile' && <Profile {...model} />}
      </div>
    </main>
  </div>);
}
