'use client';
import type { DashboardModel } from '../hooks/useIotDashboard';
import { Icon, Switch, StatCard, SensorMetric } from '../components/ui';
import LiveChart from '../components/LiveChart';

type Props = Pick<
  DashboardModel,
  | 'name'
  | 'setRefreshKey'
  | 'onlineCount'
  | 'setView'
  | 'devices'
  | 'busyDevice'
  | 'controlAll'
  | 'toggleDevice'
  | 'sensorValue'
  | 'liveRecords'
>;

// Điều khiển đèn và xem biểu đồ cảm biến.
export default function Dashboard({
  name,
  setRefreshKey,
  onlineCount,
  setView,
  devices,
  busyDevice,
  controlAll,
  toggleDevice,
  sensorValue,
  liveRecords,
}: Props) {
  return (<>
    <div className="page-heading">
      <div>
        <h1>Chào {" "}
          {name.split(' ').slice(-1)[0]}
          <span className="wave">✦</span>
        </h1>
      </div>
      <button className="outline-button" onClick={() => setRefreshKey(key => key + 1)}>↻
        <span>Làm mới</span>
      </button>
    </div>

    {/* Hai cảm biến luôn hoạt động; đèn được tính theo trạng thái bật/tắt. */}
    <div className="stats-grid dashboard-stats">
      <StatCard icon="cpu" label="Tổng thiết bị" value="05" note="3 đèn · 2 cảm biến" tone="blue" />
      <StatCard icon="bolt" label="Đang hoạt động" value={String(onlineCount + 2).padStart(2, '0')} note="2 cảm biến luôn hoạt động" tone="green" />
    </div>

    <div className="dashboard-grid">
      <section className="panel devices-panel">
        <div className="panel-heading">
          <div>
            <h2>Điều khiển thiết bị</h2>
          </div>
          <button className="text-button" onClick={() => setView('history')}>Xem lịch sử
            <Icon name="chevron" size={14} />
          </button>
        </div>
        <div className="all-device-controls">
          <span>Điều khiển tất cả</span>
          <Switch on={devices.length > 0 && onlineCount === devices.length} disabled={busyDevice !== null || !devices.length} onClick={() => controlAll(onlineCount === devices.length ? 'OFF' : 'ON')} label="tất cả thiết bị" />
        </div>
        <div className="device-grid">
          {devices.map((device) => <div className={`device-card ${device.status ? 'device-active' : ''}`} key={device.id}>
            <div className="device-card-top">
              <div className={`device-icon ${device.status ? 'lit' : ''}`}>
                <Icon name="sun" size={21} />
              </div>
              <Switch on={device.status} onClick={() => toggleDevice(device)} label={device.name} disabled={busyDevice !== null} />
            </div>
            <h3>
              {device.name}
            </h3>
            <div className="device-status">
              <span className={device.status ? 'online-dot' : 'offline-dot'} />
              {device.status ? 'Đang bật' : 'Đang tắt'}
              <span className="device-watt">
                {device.status ? '● 12W' : '—'}
              </span>
            </div>
          </div>)}
        </div>
        <div className="device-footer">
          <span>
            <span className="online-dot" />
            {onlineCount}
            thiết bị đang bật</span>
        </div>
      </section>

      <section className="panel environment-panel">
        <div className="panel-heading">
          <div>
            <h2>Thông tin cảm biến</h2>
            <p>Cập nhật mỗi 5 giây</p>
          </div>
          <span className="live-pill">5 GIÂY</span>
        </div>
        <SensorMetric icon="temp" label="Nhiệt độ" value={sensorValue(1)} unit="°C" trend="5 giây" color="orange" />
        <SensorMetric icon="drop" label="Độ ẩm" value={sensorValue(2)} unit="%" trend="5 giây" color="cyan" />
        <SensorMetric icon="sun" label="Ánh sáng" value={sensorValue(3)} unit="lux" trend="5 giây" color="yellow" />
      </section>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Biến động môi trường</h2>
          </div>
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-yellow" />
            Ánh sáng</span>
          <span>
            <i className="legend-red" />
            Độ ẩm</span>
          <span>
            <i className="legend-blue" />
            Nhiệt độ</span>
        </div>
        <LiveChart records={liveRecords} />
      </section>
    </div>
  </>);
}
