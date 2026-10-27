'use client';

import { useEffect, useMemo, useState } from 'react';
import LiveChart, { type Reading } from './LiveChart';

type Device = { id: number; name: string; status: boolean };
type Action = { id: string; device: string; action: string; status: boolean; time: string };
type SensorRow = { id: number; sensor: string; value: number; unit: string; time: string; status: string };
type View = 'dashboard' | 'sensors' | 'history' | 'profile';

const initialDevices: Device[] = [{ id: 1, name: 'Đèn LED 1', status: true }, { id: 2, name: 'Đèn LED 2', status: false }, { id: 3, name: 'Đèn LED 3', status: true }];
const initialRows: SensorRow[] = [
  { id: 1, sensor: 'Cảm biến nhiệt độ', value: 27.5, unit: '°C', time: '10:38:00', status: 'Ổn định' },
  { id: 2, sensor: 'Cảm biến độ ẩm', value: 65, unit: '%', time: '10:39:00', status: 'Ổn định' },
  { id: 3, sensor: 'Cảm biến ánh sáng', value: 750, unit: 'lux', time: '10:40:00', status: 'Ổn định' },
  { id: 4, sensor: 'Cảm biến nhiệt độ', value: 28, unit: '°C', time: '10:41:00', status: 'Ổn định' },
  { id: 5, sensor: 'Cảm biến độ ẩm', value: 64, unit: '%', time: '10:42:00', status: 'Ổn định' },
];
const paths: Record<View, string> = { dashboard: 'Bảng điều khiển', sensors: 'Cảm biến dữ liệu', history: 'Lịch sử hoạt động', profile: 'Hồ sơ cá nhân' };

function mapActions(records: Array<Record<string, unknown>>): Action[] {
  return records.map((record) => {
    const status = record.actionType === 'ON';
    const timestamp = String(record.timestamp || '');
    return { id: `EV-${String(record.id).padStart(4, '0')}`, device: String(record.device || `LED ${record.deviceId}`).replace(/^LED /, 'Đèn LED '), action: status ? 'Bật thiết bị' : 'Tắt thiết bị', status, time: timestamp ? new Date(timestamp).toLocaleTimeString('vi-VN') : '' };
  });
}

function mapSensors(records: Array<Record<string, unknown>>): SensorRow[] {
  return records.map((record, index) => {
    const sensor = String(record.sensor || 'Cảm biến');
    const timestamp = String(record.timestamp || '');
    return { id: Number(record.id || index), sensor: sensor.startsWith('Cảm biến') ? sensor : `Cảm biến ${sensor.toLowerCase()}`, value: Number(record.value), unit: String(record.unit || ''), time: timestamp ? new Date(timestamp).toLocaleTimeString('vi-VN') : '', status: 'Ổn định' };
  });
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const shapes: Record<string, React.ReactNode> = {
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></>,
    cpu: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    drop: <><path d="M12 3s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12Z"/><path d="M9 16a3 3 0 0 0 3 2"/></>,
    temp: <><path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 11v6"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    bolt: <path d="m13 2-3 8h7l-6 12 2-9H6l7-11Z"/>,
  };
  return <svg {...common}>{shapes[name] || shapes.grid}</svg>;
}

function Switch({ on, onClick, label, disabled = false }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return <button type="button" className={`switch ${on ? 'on' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={on} aria-label={`Bật tắt ${label}`}><span /></button>;
}

export default function Home() {
  const [liveRecords, setLiveRecords] = useState<Reading[]>([]);
  const [latest, setLatest] = useState<Reading[]>([]);
  const [chartHours, setChartHours] = useState('24');
  const [sensorMessage, setSensorMessage] = useState('Đang kết nối dữ liệu cảm biến…');
  const [view, setView] = useState<View>('dashboard');
  const [authed, setAuthed] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('Ngô Trí Hoàn');
  const [email, setEmail] = useState('HoanIOT');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devices, setDevices] = useState(initialDevices);
  const [actions, setActions] = useState<Action[]>([]);
  const [rows, setRows] = useState(initialRows);
  const [busyDevice, setBusyDevice] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(false);
  const [links, setLinks] = useState({ github: '', figma: '', postman: '', report: '' });
  const [storedProfile, setStoredProfile] = useState({ name: 'Ngô Trí Hoàn', email: 'HoanIOT', links: { github: '', figma: '', postman: '', report: '' } });
  const [editingLinks, setEditingLinks] = useState(true);
  const [day, setDay] = useState('2026-09-23');
  const [sensorFilter, setSensorFilter] = useState('Tất cả');
  const [historyDevice, setHistoryDevice] = useState('Tất cả thiết bị');
  const [historyState, setHistoryState] = useState('Tất cả trạng thái');
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('iot-profile');
      if (raw) {
        const profile = JSON.parse(raw);
        if (typeof profile.name === 'string' && typeof profile.email === 'string' && profile.links && ['github', 'figma', 'postman', 'report'].every(key => typeof profile.links[key] === 'string')) {
          setName(profile.name); setEmail(profile.email); setLinks(profile.links); setStoredProfile(profile); setEditingLinks(false);
        }
      }
    } catch { /* Ignore invalid browser storage. */ }
    const token = localStorage.getItem('iot-token');
    if (token) setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    let active = true;
    async function loadApiData() {
      try {
        const [deviceResponse, actionResponse, sensorResponse] = await Promise.all([
          fetch('/api/devices/status'), fetch('/api/actions/history?limit=100'), fetch('/api/sensors/history?limit=100'),
        ]);
        if (!deviceResponse.ok || !actionResponse.ok || !sensorResponse.ok) throw new Error('Không thể tải dữ liệu hệ thống.');
        const [deviceBody, actionBody, sensorBody] = await Promise.all([deviceResponse.json(), actionResponse.json(), sensorResponse.json()]);
        if (!active) return;
        setDevices(deviceBody.devices.map((device: { id: number; name: string; status: boolean }) => ({ ...device, name: device.name.replace(/^LED /, 'Đèn LED ') })));
        setActions(mapActions(actionBody.data));
        setRows(mapSensors(sensorBody.data));
      } catch {
        if (active) setNotice('Không tải được dữ liệu API. Đang hiển thị dữ liệu mẫu.');
      }
    }
    void loadApiData();
    return () => { active = false; };
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    let active = true;
    let loading = false;
    const controller = new AbortController();
    async function refreshSensors() {
      if (loading) return;
      loading = true;
      try {
        const response = await fetch(`/api/sensors/live?hours=${chartHours}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error();
        const body = await response.json();
        if (!active) return;
        setLiveRecords(body.chart); setLatest(body.latest);
        const newest = Math.max(0, ...body.latest.map((r: Reading) => Date.parse(r.timestamp)));
        setSensorMessage(body.error || (body.source === 'demo' ? 'Dữ liệu demo · Chưa cấu hình MQTT' : Date.now() - newest > 15000 ? 'Đang chờ dữ liệu mới từ cảm biến' : 'Dữ liệu mới · Cập nhật mỗi 5 giây'));
      } catch {
        if (active) setSensorMessage('Mất kết nối dữ liệu · Đang thử lại mỗi 5 giây');
      } finally { loading = false; }
    }
    void refreshSensors();
    const timer = window.setInterval(refreshSensors, 5000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [authed, chartHours]);
  const sensorValue = (id: number) => latest.find(r => r.sensorId === id)?.value.toFixed(1) ?? '—';
  const filteredRows = useMemo(() => rows.filter((row) => (sensorFilter === 'Tất cả' || row.sensor.includes(sensorFilter)) && `${row.sensor} ${row.value} ${row.time}`.toLowerCase().includes(query.toLowerCase())), [rows, query, sensorFilter]);
  const filteredActions = useMemo(() => actions.filter((action) => (historyDevice === 'Tất cả thiết bị' || action.device === historyDevice) && (historyState === 'Tất cả trạng thái' || (historyState === 'Bật' ? action.status : !action.status)) && `${action.device} ${action.action} ${action.id}`.toLowerCase().includes(query.toLowerCase())), [actions, query, historyDevice, historyState]);
  const onlineCount = devices.filter((device) => device.status).length;

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'register' && confirmPassword !== password) { setNotice('Mật khẩu xác nhận chưa khớp.'); return; }
    try {
      const response = await fetch(mode === 'register' ? '/api/auth/register' : '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mode === 'register' ? { username: email, email, name, password, confirmPassword } : { username: email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Đăng nhập không thành công.');
      localStorage.setItem('iot-token', result.token); setAuthed(true); setNotice('Đăng nhập thành công. Chào mừng bạn quay lại!');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không kết nối được máy chủ.'); }
  }
  async function toggleDevice(device: Device) {
    if (busyDevice !== null) return;
    setBusyDevice(device.id);
    try {
      const response = await fetch('/api/leds/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ led_id: device.id, state: device.status ? 'OFF' : 'ON' }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Không điều khiển được thiết bị.');
      const nextStatus = result.device.status;
      setDevices((old) => old.map((item) => item.id === device.id ? { ...item, status: nextStatus } : item));
      setActions((old) => [mapActions([result.action])[0], ...old]);
      setNotice(`${device.name} đã được ${nextStatus ? 'bật' : 'tắt'}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không điều khiển được thiết bị.'); }
    finally { setBusyDevice(null); }
  }
  function saveProfile() {
    const normalized = { ...links };
    for (const key of Object.keys(normalized) as Array<keyof typeof links>) {
      const value = normalized[key].trim();
      if (!value) { normalized[key] = ''; continue; }
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        normalized[key] = url.href;
      } catch { setNotice('Liên kết phải là địa chỉ http:// hoặc https:// hợp lệ.'); return; }
    }
    const profile = { name, email, links: normalized };
    try { localStorage.setItem('iot-profile', JSON.stringify(profile)); }
    catch { setNotice('Không thể lưu hồ sơ trên trình duyệt này.'); return; }
    setLinks(normalized); setStoredProfile(profile); setEditingLinks(false); setSaved(true); setNotice('Thông tin hồ sơ đã được lưu.');
  }
  function cancelProfile() {
    setName(storedProfile.name); setEmail(storedProfile.email); setLinks(storedProfile.links); setEditingLinks(false); setSaved(false); setNotice('Đã hủy thay đổi.');
  }
  async function controlAll(state: 'ON' | 'OFF') {
    if (busyDevice !== null) return;
    setBusyDevice(0);
    try {
      const response = await fetch('/api/leds/control-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Không điều khiển được tất cả thiết bị.');
      setDevices(result.devices.map((device: Device) => ({ ...device, name: device.name.replace(/^LED /, 'Đèn LED ') })));
      setActions(old => [...mapActions(result.actions), ...old]);
      setNotice(state === 'ON' ? 'Đã bật tất cả thiết bị.' : 'Đã tắt tất cả thiết bị.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không kết nối được máy chủ.'); }
    finally { setBusyDevice(null); }
  }
  function logout() { localStorage.removeItem('iot-token'); setAuthed(false); setView('dashboard'); }

  if (!authed) return <main className="login-screen">
    <form className="login-card" onSubmit={signIn}>
      <div className="brand-mark"><Icon name="cpu" size={25} /></div><div className="login-brand">IoT</div>
      <h1>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h1>
      <p className="login-subtitle">Giám sát không gian sống của bạn</p>
      {mode === 'register' && <label>HỌ VÀ TÊN<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn An" /></label>}
      <label>{mode === 'login' ? 'TÊN ĐĂNG NHẬP / EMAIL' : 'EMAIL'}<input required type={mode === 'login' ? 'text' : 'email'} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nhap.email@vi.du.com" /></label>
      <label>MẬT KHẨU<div className="password-wrap"><input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn' : 'Hiện'}</button></div></label>
      {mode === 'register' && <label>XÁC NHẬN MẬT KHẨU<input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" /></label>}
      {notice && <p className="login-message" role="status">{notice}</p>}
      <button className="primary-button login-submit" type="submit">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}<Icon name="chevron" size={16} /></button>
      <div className="login-divider"><span /></div>
      <p className="login-switch">{mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}</button></p>
      <p className="demo-hint">Đăng nhập bằng tài khoản đã được tạo trong hệ thống</p>
    </form><div className="login-decoration decor-one"/><div className="login-decoration decor-two"/>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark small"><Icon name="cpu" size={18}/></div><div><b>IoT<span>.</span></b><small>SMART MONITORING</small></div></div>
      <div className="workspace-label">KHÔNG GIAN CỦA BẠN</div>
      <nav className="nav-list">
        {(['dashboard', 'sensors', 'history', 'profile'] as View[]).map((item) => <button key={item} className={`nav-item ${view === item ? 'active' : ''}`} onClick={() => { setView(item); setQuery(''); }}><Icon name={{ dashboard: 'grid', sensors: 'chart', history: 'clock', profile: 'user' }[item]} /><span>{paths[item]}</span>{view === item && <i/>}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="connection"><span className="online-dot"/><div><b>Thiết bị trực tuyến</b><small>MQTT · Kết nối ổn định</small></div><span className="connection-bars">▂▄▆</span></div><div className="user-mini"><div className="avatar">H</div><div className="user-mini-copy"><b>{name}</b><small>Quản trị viên</small></div><button className="icon-button" title="Đăng xuất" onClick={logout}><Icon name="logout" size={17}/></button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Trang chủ <Icon name="chevron" size={13}/><b>{paths[view]}</b></div><div className="top-actions"><div className="live-label"><span className="online-dot"/>Hệ thống đang hoạt động</div><button className="top-avatar" onClick={() => setView('profile')}>H</button></div></header>
      <div className={`page-content ${view === 'dashboard' ? 'dashboard-page' : ''}`}>
        {notice && <div className="toast"><Icon name="check" size={16}/>{notice}<button onClick={() => setNotice('')}>×</button></div>}
        {view === 'dashboard' && <>
          <div className="page-heading"><div><div className="eyebrow">TỔNG QUAN HỆ THỐNG <span className="heading-pulse"/></div><h1>Chào buổi sáng, {name.split(' ').slice(-1)[0]} <span className="wave">✦</span></h1><p>Đây là tình hình không gian của bạn ngay lúc này.</p></div><button className="outline-button" onClick={() => setNotice('Dữ liệu đã được làm mới.')}>↻ <span>Làm mới</span></button></div>
          <div className="stats-grid dashboard-stats"><StatCard icon="cpu" label="Tổng thiết bị" value="05" note="3 thiết bị · 2 cảm biến" tone="blue"/><StatCard icon="bolt" label="Đang hoạt động" value={String(onlineCount + 2).padStart(2, '0')} note="Tất cả hệ thống ổn định" tone="green"/></div>
          <div className="dashboard-grid"><section className="panel devices-panel"><div className="panel-heading"><div><h2>Điều khiển thiết bị</h2><p>Quản lý thiết bị trong không gian</p></div><button className="text-button" onClick={() => setView('history')}>Xem lịch sử <Icon name="chevron" size={14}/></button></div><div className="all-device-controls"><span>Điều khiển tất cả</span><Switch on={devices.length > 0 && onlineCount === devices.length} disabled={busyDevice !== null || !devices.length} onClick={() => controlAll(onlineCount === devices.length ? 'OFF' : 'ON')} label="tất cả thiết bị"/></div><div className="device-grid">{devices.map((device) => <div className={`device-card ${device.status ? 'device-active' : ''}`} key={device.id}><div className="device-card-top"><div className={`device-icon ${device.status ? 'lit' : ''}`}><Icon name="sun" size={21}/></div><Switch on={device.status} onClick={() => toggleDevice(device)} label={device.name} disabled={busyDevice !== null}/></div><h3>{device.name}</h3><div className="device-status"><span className={device.status ? 'online-dot' : 'offline-dot'}/>{device.status ? 'Đang bật' : 'Đang tắt'}<span className="device-watt">{device.status ? '● 12W' : '—'}</span></div></div>)}</div><div className="device-footer"><span><span className="online-dot"/> {onlineCount} thiết bị đang bật</span><span>Lần cập nhật gần nhất: vừa xong</span></div></section>
          <section className="panel environment-panel"><div className="panel-heading"><div><h2>Thông tin cảm biến</h2><p>Cập nhật mỗi 5 giây</p></div><span className="live-pill">5 GIÂY</span></div><SensorMetric icon="temp" label="Nhiệt độ" value={sensorValue(1)} unit="°C" trend="5 giây" color="orange"/><SensorMetric icon="drop" label="Độ ẩm" value={sensorValue(2)} unit="%" trend="5 giây" color="cyan"/><SensorMetric icon="sun" label="Ánh sáng" value={sensorValue(3)} unit="lux" trend="5 giây" color="yellow"/><div className="environment-note"><span>✳</span> {sensorMessage}</div></section>
          <section className="panel chart-panel"><div className="panel-heading"><div><h2>Biến động môi trường</h2><p>{sensorMessage}</p></div><select aria-label="Khoảng thời gian" value={chartHours} onChange={e => setChartHours(e.target.value)}><option value="24">24 giờ qua</option><option value="168">7 ngày qua</option></select></div><div className="chart-legend"><span><i className="legend-yellow"/>Ánh sáng</span><span><i className="legend-red"/>Độ ẩm</span><span><i className="legend-blue"/>Nhiệt độ</span></div><LiveChart records={liveRecords}/></section>
          </div>
        </>}
        {view === 'sensors' && <><div className="page-heading"><div><div className="eyebrow">PHÂN TÍCH DỮ LIỆU</div><h1>Cảm biến dữ liệu</h1><p>Theo dõi xu hướng môi trường và xem lại lịch sử đo.</p></div><button className="primary-button" onClick={() => { const blob = new Blob([['Thời gian,Cảm biến,Giá trị,Trạng thái', ...filteredRows.map((r) => `${r.time},${r.sensor},${r.value} ${r.unit},${r.status}`)].join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'iot-sensor-data.csv'; a.click(); }}>↓ <span>Xuất dữ liệu</span></button></div><div className="stats-grid sensor-stat-grid"><StatCard icon="temp" label="Nhiệt độ hiện tại" value="27.5°" note="−0.8° trong 1 giờ" tone="orange"/><StatCard icon="drop" label="Độ ẩm hiện tại" value="65%" note="+2.4% trong 1 giờ" tone="cyan"/><StatCard icon="sun" label="Cường độ ánh sáng" value="750" note="lux · ánh sáng tốt" tone="amber"/><StatCard icon="chart" label="Tổng bản ghi" value="1,284" note="Hôm nay" tone="purple"/></div><section className="panel table-panel"><div className="panel-heading"><div><h2>Bảng dữ liệu chi tiết</h2><p>{filteredRows.length} bản ghi được tìm thấy</p></div><div className="table-filters"><div className="search-box"><Icon name="search" size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm thiết bị, giá trị..."/></div><select value={sensorFilter} onChange={(e) => setSensorFilter(e.target.value)}><option>Tất cả</option><option>nhiệt độ</option><option>độ ẩm</option><option>ánh sáng</option></select></div></div><SensorTable rows={filteredRows}/><Pagination page={page} setPage={setPage}/></section></>}
        {view === 'history' && <><div className="page-heading"><div><div className="eyebrow">NHẬT KÝ HỆ THỐNG</div><h1>Lịch sử hoạt động</h1><p>Theo dõi mọi thay đổi trên các thiết bị của bạn.</p></div><button className="outline-button" onClick={() => setNotice('Nhật ký đã được cập nhật.')}>↻ <span>Làm mới</span></button></div><section className="panel table-panel history-panel"><div className="panel-heading"><div><h2>Nhật ký thiết bị</h2><p>{filteredActions.length} sự kiện trong hệ thống</p></div><button className="export-button" onClick={() => { const lines = ['ID,Thiết bị,Hành động,Thời gian', ...filteredActions.map((a) => `${a.id},${a.device},${a.action},${a.time}`)]; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); link.download = 'iot-actions.csv'; link.click(); }}>↓ Xuất CSV</button></div><div className="history-filters"><div className="search-box"><Icon name="search" size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm thiết bị hoặc hành động..."/></div><select value={historyDevice} onChange={(e) => setHistoryDevice(e.target.value)}><option>Tất cả thiết bị</option>{devices.map((d) => <option key={d.id}>{d.name}</option>)}</select><select value={historyState} onChange={(e) => setHistoryState(e.target.value)}><option>Tất cả trạng thái</option><option>Bật</option><option>Tắt</option></select><input type="date" value={day} onChange={(e) => setDay(e.target.value)}/></div><div className="table-scroll"><table><thead><tr><th>MÃ SỰ KIỆN</th><th>THIẾT BỊ</th><th>HÀNH ĐỘNG</th><th>TRẠNG THÁI</th><th>THỜI GIAN</th></tr></thead><tbody>{filteredActions.slice((page - 1) * 8, page * 8).map((a, i) => <tr key={`${a.id}-${i}`}><td className="mono">{a.id}</td><td><span className="device-table-icon"><Icon name="sun" size={15}/></span>{a.device}</td><td>{a.action}</td><td><span className={`status-badge ${a.status ? 'status-on' : 'status-off'}`}><i/>{a.status ? 'Đã bật' : 'Đã tắt'}</span></td><td className="muted">{a.time}</td></tr>)}</tbody></table></div><Pagination page={page} setPage={setPage}/></section><div className="history-footnote"><span className="online-dot"/> Nhật ký được lưu tự động khi có thay đổi thiết bị.</div></>}
        {view === 'profile' && <><div className="page-heading"><div><div className="eyebrow">TÀI KHOẢN CỦA BẠN</div><h1>Hồ sơ cá nhân</h1><p>Quản lý thông tin và tùy chọn tài khoản.</p></div><span className="profile-status"><i/> Tài khoản đang hoạt động</span></div><div className="profile-layout"><section className="panel profile-main"><div className="profile-banner"><div className="profile-avatar">{name.charAt(0)}</div><div><h2>{name}</h2><p>{email}</p><span className="role-pill">✦ Quản trị viên</span></div><button className="outline-button" onClick={() => document.getElementById('profile-name')?.focus()}>Chỉnh sửa hồ sơ</button></div><div className="profile-section"><div className="section-title"><div><h3>Thông tin cá nhân</h3><p>Các thông tin cơ bản của tài khoản</p></div><span className="section-number">01</span></div><div className="profile-fields"><label>HỌ VÀ TÊN<input id="profile-name" value={name} onChange={(e) => setName(e.target.value)}/></label><label>ĐỊA CHỈ EMAIL<input type="email" value={email} onChange={(e) => setEmail(e.target.value)}/></label><label>VAI TRÒ<input value="Quản trị viên" readOnly/></label><label>NGÀY THAM GIA<input value="Tháng 9, 2026" readOnly/></label></div></div><div className="profile-section"><div className="section-title"><div><h3>Liên kết dự án</h3><p>Tài nguyên liên quan đến đồ án IoT</p></div><span className="section-number">02</span></div><div className="project-links-heading"><button className="text-button" onClick={() => { setEditingLinks(!editingLinks); setSaved(false); }}>{editingLinks ? 'Xem liên kết đã lưu' : 'Chỉnh sửa liên kết'}</button></div><div className="profile-fields links-fields">{([{ key: 'github', label: 'GITHUB' }, { key: 'figma', label: 'FIGMA' }, { key: 'postman', label: 'POSTMAN' }, { key: 'report', label: 'LINK BÁO CÁO' }] as const).map(({ key, label }) => <div className="project-link-field" key={key}><label htmlFor={editingLinks ? 'link-' + key : undefined}>{label}</label>{editingLinks ? <input id={'link-' + key} type="url" placeholder="https://..." value={links[key]} onChange={e => { setLinks(old => ({ ...old, [key]: e.target.value })); setSaved(false); }}/> : /^https?:$/.test((() => { try { return new URL(storedProfile.links[key]).protocol; } catch { return ''; } })()) ? <a className="project-link" href={storedProfile.links[key]} target="_blank" rel="noopener noreferrer">{storedProfile.links[key]} ↗</a> : <span className="empty-project-link">Chưa thêm liên kết</span>}</div>)}</div></div><div className="profile-actions"><button className="outline-button" onClick={cancelProfile}>Hủy thay đổi</button><button className="primary-button" onClick={saveProfile}>✓ <span>{saved ? 'Đã lưu thay đổi' : 'Lưu thay đổi'}</span></button></div></section><aside className="profile-side"><section className="panel profile-security"><div className="side-icon"><Icon name="cpu"/></div><h3>Bảo mật tài khoản</h3><p>Tài khoản của bạn được bảo vệ bằng phiên đăng nhập demo an toàn.</p><button className="outline-button" onClick={logout}><Icon name="logout" size={15}/> Đăng xuất</button></section><section className="panel notification-panel"><h3>Cài đặt thông báo</h3><p>Chọn cách bạn muốn nhận cập nhật.</p><ToggleRow title="Thông báo Email" description="Nhận cập nhật qua email"/><ToggleRow title="Thông báo trong ứng dụng" description="Cảnh báo trực tiếp khi có sự kiện"/></section><section className="profile-help"><span>✳</span><div><b>Cần hỗ trợ?</b><p>Liên hệ quản trị viên nếu bạn cần trợ giúp.</p></div></section></aside></div></>}
      </div>
    </main>
  </div>;
}

function StatCard({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} size={19}/></div><span className="stat-label">{label}</span><b className="stat-value">{value}</b><span className="stat-note">{note}</span></div>; }
function SensorMetric({ icon, label, value, unit, trend, color }: { icon: string; label: string; value: string; unit: string; trend: string; color: string }) { return <div className="metric-row"><div className={`metric-icon ${color}`}><Icon name={icon} size={18}/></div><div className="metric-copy"><span>{label}</span><b>{value}<small>{unit}</small></b></div><span className="metric-trend">↗ {trend}</span></div>; }
function ActivityItem({ action }: { action: Action }) { return <div className="activity-item"><div className={`activity-icon ${action.status ? 'active' : 'inactive'}`}><Icon name="sun" size={17}/></div><div className="activity-copy"><b>{action.device} <span>{action.status ? 'đã được bật' : 'đã được tắt'}</span></b><small>{action.time}</small></div><span className={`status-badge ${action.status ? 'status-on' : 'status-off'}`}>{action.status ? 'Đã bật' : 'Đã tắt'}</span></div>; }
function SensorTable({ rows }: { rows: SensorRow[] }) { return <div className="table-scroll"><table><thead><tr><th>THỜI GIAN</th><th>CẢM BIẾN</th><th>GIÁ TRỊ ĐO</th><th>TRẠNG THÁI</th></tr></thead><tbody>{rows.map((r, i) => <tr key={`${r.id}-${i}`}><td className="muted">{r.time}</td><td>{r.sensor}</td><td className="value-cell">{r.value} <small>{r.unit}</small></td><td><span className="status-badge status-on"><i/>{r.status}</span></td></tr>)}</tbody></table></div>; }
function Pagination({ page, setPage }: { page: number; setPage: (page: number) => void }) { return <div className="pagination"><span>Hiển thị <b>1–5</b> trong <b>128</b> bản ghi</span><div><button className="page-button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Trước</button><button className="page-number active" onClick={() => setPage(1)}>1</button><button className="page-number" onClick={() => setPage(2)}>2</button><button className="page-number" onClick={() => setPage(3)}>3</button><span>…</span><button className="page-number" onClick={() => setPage(26)}>26</button><button className="page-button" onClick={() => setPage(page + 1)}>Tiếp theo <Icon name="chevron" size={13}/></button></div></div>; }
function ToggleRow({ title, description }: { title: string; description: string }) { const [on, setOn] = useState(true); return <div className="toggle-row"><div><b>{title}</b><small>{description}</small></div><Switch on={on} onClick={() => setOn(!on)} label={title}/></div>; }







