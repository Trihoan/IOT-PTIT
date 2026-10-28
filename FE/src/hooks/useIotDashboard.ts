'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Reading } from '../components/LiveChart';
import type { Device, Action, SensorRow, View } from '../types';
import { initialDevices } from '../constants';
import { mapActions, mapSensors } from './mappers';

// Quản lý dữ liệu và thao tác chung; giữ trạng thái khi chuyển trang.
export function useIotDashboard() {
  // Dữ liệu cảm biến, thiết bị và trạng thái giao diện.
  const [liveRecords, setLiveRecords] = useState<Reading[]>([]);
  const [latest, setLatest] = useState<Reading[]>([]);
  const [mqttConnected, setMqttConnected] = useState(false);
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
  const [rows, setRows] = useState<SensorRow[]>([]);
  const [busyDevice, setBusyDevice] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(false);
  const [links, setLinks] = useState({ github: '', figma: '', postman: '', report: '' });
  const [storedProfile, setStoredProfile] = useState({ name: 'Ngô Trí Hoàn', email: 'HoanIOT', links: { github: '', figma: '', postman: '', report: '' } });
  const [editingLinks, setEditingLinks] = useState(true);
  const [day, setDay] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sensorFilter, setSensorFilter] = useState('Tất cả');
  const [sensorTime, setSensorTime] = useState('');
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [historyDevice, setHistoryDevice] = useState('Tất cả thiết bị');
  const [historyState, setHistoryState] = useState('Tất cả trạng thái');
  const [page, setPage] = useState(1);
  // Tự ẩn thông báo sau 3 giây.
  useEffect(() => {
    if (!notice)
      return;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  // Khôi phục hồ sơ và phiên đăng nhập từ trình duyệt.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('iot-profile');
      if (raw) {
        const profile = JSON.parse(raw);
        if (typeof profile.name === 'string' && typeof profile.email === 'string' && profile.links && ['github', 'figma', 'postman', 'report'].every(key => typeof profile.links[key] === 'string')) {
          setName(profile.name);
          setEmail(profile.email);
          setLinks(profile.links);
          setStoredProfile(profile);
          setEditingLinks(false);
        }
      }
    }
    catch { /* Ignore invalid browser storage. */ }
    const token = localStorage.getItem('iot-token');
    if (token)
      setAuthed(true);
  }, []);
  // Tải thiết bị, lịch sử và dữ liệu cảm biến.
  useEffect(() => {
    if (!authed)
      return;
    let active = true;
    async function loadApiData() {
      try {
        const [deviceResponse, actionResponse, sensorResponse] = await Promise.all([
          fetch('/api/devices/status'), fetch('/api/actions/history?limit=100'), fetch('/api/sensors/history?limit=100'),
        ]);
        if (!deviceResponse.ok || !actionResponse.ok || !sensorResponse.ok)
          throw new Error('Không thể tải dữ liệu hệ thống.');
        const [deviceBody, actionBody, sensorBody] = await Promise.all([deviceResponse.json(), actionResponse.json(), sensorResponse.json()]);
        if (!active)
          return;
        setDevices(deviceBody.devices.map((device: {
          id: number;
          name: string;
          status: boolean;
        }) => ({ ...device, name: device.name.replace(/^LED /, 'Đèn LED ') })));
        setActions(mapActions(actionBody.data));
        setRows(mapSensors(sensorBody.data));
      }
      catch {
        if (active)
          setNotice('Không tải được dữ liệu hệ thống. Vui lòng thử lại.');
      }
    }
    void loadApiData();
    return () => { active = false; };
  }, [authed, refreshKey]);
  // Cập nhật cảm biến mỗi 5 giây; offline vẫn có dữ liệu để sử dụng.
  useEffect(() => {
    if (!authed)
      return;
    let active = true;
    let loading = false;
    const controller = new AbortController();
    async function refreshSensors() {
      if (loading)
        return;
      loading = true;
      try {
        const response = await fetch('/api/sensors/live', { cache: 'no-store', signal: controller.signal });
        if (!response.ok)
          throw new Error();
        const body = await response.json();
        if (!active)
          return;
        setLiveRecords(body.chart);
        setLatest(body.latest);
        setMqttConnected(body.connected === true);
        if (body.source === "demo")
          setRows(mapSensors(body.chart));
      }
      catch {
        if (active) {
          setMqttConnected(false);
        }
      }
      finally {
        loading = false;
      }
    }
    void refreshSensors();
    const timer = window.setInterval(refreshSensors, 5000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [authed, refreshKey]);
  // Lọc và phân trang dữ liệu.
  const sensorValue = (id: number) => latest.find(r => r.sensorId === id)?.value.toFixed(1) ?? '—';
  const filteredRows = useMemo(() => rows.filter((row) => row.time.includes(sensorTime.trim()) && (sensorFilter === 'Tất cả' || row.sensor.includes(sensorFilter)) && `${row.sensor} ${row.value} ${row.time}`.toLowerCase().includes(query.toLowerCase())), [rows, query, sensorFilter, sensorTime]);
  const filteredActions = useMemo(() => actions.filter((action) => (!day || action.date === day) && (historyDevice === 'Tất cả thiết bị' || action.device === historyDevice) && (historyState === 'Tất cả trạng thái' || (historyState === 'Bật' ? action.status : !action.status)) && `${action.device} ${action.action} ${action.id}`.toLowerCase().includes(query.toLowerCase())), [actions, query, day, historyDevice, historyState]);
  const sensorPage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / 5)));
  const historyPage = Math.min(page, Math.max(1, Math.ceil(filteredActions.length / historyPageSize)));
  useEffect(() => { setPage(1); }, [view, query, day, sensorFilter, sensorTime, historyDevice, historyState, historyPageSize]);
  const onlineCount = devices.filter((device) => device.status).length;
  // Đăng nhập hoặc đăng ký.
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'register' && confirmPassword !== password) {
      setNotice('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    try {
      const response = await fetch(mode === 'register' ? '/api/auth/register' : '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mode === 'register' ? { username: email, email, name, password, confirmPassword } : { username: email, password }) });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Đăng nhập không thành công.');
      localStorage.setItem('iot-token', result.token);
      setAuthed(true);
    }
    catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không kết nối được máy chủ.');
    }
  }
  // Bật/tắt một đèn qua API; offline lưu trạng thái trong RAM.
  async function toggleDevice(device: Device) {
    if (busyDevice !== null)
      return;
    setBusyDevice(device.id);
    try {
      const response = await fetch('/api/leds/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ led_id: device.id, state: device.status ? 'OFF' : 'ON' }) });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Không điều khiển được thiết bị.');
      const nextStatus = result.device.status;
      setDevices((old) => old.map((item) => item.id === device.id ? { ...item, status: nextStatus } : item));
      setActions((old) => [mapActions([result.action])[0], ...old]);
      setNotice(`${device.name} đã được ${nextStatus ? 'bật' : 'tắt'}.`);
    }
    catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không điều khiển được thiết bị.');
    }
    finally {
      setBusyDevice(null);
    }
  }
  // Lưu hồ sơ và kiểm tra liên kết.
  function saveProfile() {
    const normalized = { ...links };
    for (const key of Object.keys(normalized) as Array<keyof typeof links>) {
      const value = normalized[key].trim();
      if (!value) {
        normalized[key] = '';
        continue;
      }
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol))
          throw new Error();
        normalized[key] = url.href;
      }
      catch {
        setNotice('Liên kết phải là địa chỉ http:// hoặc https:// hợp lệ.');
        return;
      }
    }
    const profile = { name, email, links: normalized };
    try {
      localStorage.setItem('iot-profile', JSON.stringify(profile));
    }
    catch {
      setNotice('Không thể lưu hồ sơ trên trình duyệt này.');
      return;
    }
    setLinks(normalized);
    setStoredProfile(profile);
    setEditingLinks(false);
    setSaved(true);
    setNotice('Thông tin hồ sơ đã được lưu.');
  }
  function cancelProfile() {
    setName(storedProfile.name);
    setEmail(storedProfile.email);
    setLinks(storedProfile.links);
    setEditingLinks(false);
    setSaved(false);
    setNotice('Đã hủy thay đổi.');
  }
  // Bật/tắt toàn bộ đèn.
  async function controlAll(state: 'ON' | 'OFF') {
    if (busyDevice !== null)
      return;
    setBusyDevice(0);
    try {
      const response = await fetch('/api/leds/control-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Không điều khiển được tất cả thiết bị.');
      setDevices(result.devices.map((device: Device) => ({ ...device, name: device.name.replace(/^LED /, 'Đèn LED ') })));
      setActions(old => [...mapActions(result.actions), ...old]);
      setNotice(state === 'ON' ? 'Đã bật tất cả thiết bị.' : 'Đã tắt tất cả thiết bị.');
    }
    catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không kết nối được máy chủ.');
    }
    finally {
      setBusyDevice(null);
    }
  }
  function logout() { localStorage.removeItem('iot-token'); setAuthed(false); setView('dashboard'); }
  return {
    authed,
    view,
    setView,
    setQuery,
    mqttConnected,
    name,
    logout,
    notice,
    setNotice,
    signIn,
    mode,
    setName,
    email,
    setEmail,
    showPassword,
    password,
    setPassword,
    setShowPassword,
    confirmPassword,
    setConfirmPassword,
    setMode,
    setRefreshKey,
    onlineCount,
    devices,
    busyDevice,
    controlAll,
    toggleDevice,
    sensorValue,
    liveRecords,
    filteredRows,
    rows,
    query,
    sensorTime,
    setSensorTime,
    sensorFilter,
    setSensorFilter,
    sensorPage,
    setPage,
    filteredActions,
    historyDevice,
    setHistoryDevice,
    historyState,
    setHistoryState,
    day,
    setDay,
    historyPage,
    historyPageSize,
    setHistoryPageSize,
    setEditingLinks,
    editingLinks,
    setSaved,
    links,
    setLinks,
    storedProfile,
    cancelProfile,
    saveProfile,
    saved,
  };
}

export type DashboardModel = ReturnType<typeof useIotDashboard>;
