'use client';
import type { DashboardModel } from '../hooks/useIotDashboard';
import { Icon, StatCard, SensorTable } from '../components/ui';
import Pagination from '../components/Pagination';

type Props = Pick<
  DashboardModel,
  | 'filteredRows'
  | 'sensorValue'
  | 'name'
  | 'query'
  | 'setQuery'
  | 'sensorTime'
  | 'setSensorTime'
  | 'sensorFilter'
  | 'setSensorFilter'
  | 'sensorPage'
  | 'setPage'
>;

// Lọc, phân trang và xuất dữ liệu cảm biến.
export default function Sensors({
  filteredRows,
  sensorValue,
  name,
  query,
  setQuery,
  sensorTime,
  setSensorTime,
  sensorFilter,
  setSensorFilter,
  sensorPage,
  setPage,
}: Props) {
  return (<>
    <div className="page-heading">
      <div>
        <div className="eyebrow">PHÂN TÍCH DỮ LIỆU</div>
        <h1>Cảm biến dữ liệu</h1>
        <p>Theo dõi xu hướng môi trường và xem lại lịch sử đo.</p>
      </div>
      <button className="primary-button" onClick={() => { const blob = new Blob([['Thời gian,Cảm biến,Giá trị,Trạng thái', ...filteredRows.map((r) => `${r.time},${r.sensor},${r.value} ${r.unit},${r.status}`)].join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'iot-sensor-data.csv'; a.click(); }}>↓
        <span>Xuất dữ liệu</span>
      </button>
    </div>
    <div className="stats-grid sensor-stat-grid">
      <StatCard icon="temp" label="Nhiệt độ hiện tại" value={sensorValue(1)} note="°C" tone="orange" />
      <StatCard icon="drop" label="Độ ẩm hiện tại" value={sensorValue(2)} note="%" tone="cyan" />
      <StatCard icon="sun" label="Cường độ ánh sáng" value={sensorValue(3)} note="lux" tone="amber" />
    </div>
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>Bảng dữ liệu chi tiết</h2>
        </div>
        <div className="table-filters">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm thiết bị, giá trị..." />
          </div>
          <div className="search-box sensor-time-search">
            <Icon name="clock" size={16} />
            <input
              type="search"
              value={sensorTime}
              onChange={(e) => setSensorTime(e.target.value)}
              placeholder="Thời gian (HH:mm:ss)"
              aria-label="Tìm theo thời gian cảm biến"
            />
          </div>
          <select value={sensorFilter} onChange={(e) => setSensorFilter(e.target.value)}>
            <option>Tất cả</option>
            <option>nhiệt độ</option>
            <option>độ ẩm</option>
            <option>ánh sáng</option>
          </select>
        </div>
      </div>
      <SensorTable rows={filteredRows.slice((sensorPage - 1) * 5, sensorPage * 5)} />
      <Pagination page={sensorPage} setPage={setPage} total={filteredRows.length} pageSize={5} />
    </section>
  </>);
}
