'use client';
import type { DashboardModel } from '../hooks/useIotDashboard';
import { Icon } from '../components/ui';
import Pagination from '../components/Pagination';

type Props = Pick<
  DashboardModel,
  | 'setRefreshKey'
  | 'filteredActions'
  | 'query'
  | 'setQuery'
  | 'historyDevice'
  | 'setHistoryDevice'
  | 'devices'
  | 'historyState'
  | 'setHistoryState'
  | 'day'
  | 'setDay'
  | 'historyPage'
  | 'setPage'
>;

// Tra cứu và xuất lịch sử bật/tắt đèn.
export default function History({
  setRefreshKey,
  filteredActions,
  query,
  setQuery,
  historyDevice,
  setHistoryDevice,
  devices,
  historyState,
  setHistoryState,
  day,
  setDay,
  historyPage,
  setPage,
}: Props) {
  return (<>
    <div className="page-heading">
      <div>
        <div className="eyebrow">NHẬT KÝ HỆ THỐNG</div>
        <h1>Lịch sử hoạt động</h1>
        <p>Theo dõi mọi thay đổi trên các thiết bị của bạn.</p>
      </div>
      <button className="outline-button" onClick={() => setRefreshKey(key => key + 1)}>↻
        <span>Làm mới</span>
      </button>
    </div>
    <section className="panel table-panel history-panel">
      <div className="panel-heading">
        <div>
          <h2>Nhật ký thiết bị</h2>
          <p>
            {filteredActions.length}
            sự kiện trong hệ thống</p>
        </div>
        <button className="export-button" onClick={() => { const lines = ['ID,Thiết bị,Hành động,Thời gian', ...filteredActions.map((a) => `${a.id},${a.device},${a.action},${a.time}`)]; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); link.download = 'iot-actions.csv'; link.click(); }}>↓ Xuất CSV</button>
      </div>
      <div className="history-filters">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm thiết bị hoặc hành động..." />
        </div>
        <select value={historyDevice} onChange={(e) => setHistoryDevice(e.target.value)}>
          <option>Tất cả thiết bị</option>
          {devices.map((d) => <option key={d.id}>
            {d.name}
          </option>)}
        </select>
        <select value={historyState} onChange={(e) => setHistoryState(e.target.value)}>
          <option>Tất cả trạng thái</option>
          <option>Bật</option>
          <option>Tắt</option>
        </select>
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>MÃ SỰ KIỆN</th>
              <th>THIẾT BỊ</th>
              <th>HÀNH ĐỘNG</th>
              <th>TRẠNG THÁI</th>
              <th>THỜI GIAN</th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.slice((historyPage - 1) * 8, historyPage * 8).map((a, i) => <tr key={`${a.id}-${i}`}>
              <td className="mono">
                {a.id}
              </td>
              <td>
                <span className="device-table-icon">
                  <Icon name="sun" size={15} />
                </span>
                {a.device}
              </td>
              <td>
                {a.action}
              </td>
              <td>
                <span className={`status-badge ${a.status ? 'status-on' : 'status-off'}`}>
                  <i />
                  {a.status ? 'Đã bật' : 'Đã tắt'}
                </span>
              </td>
              <td className="muted">
                {a.time}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <Pagination page={historyPage} setPage={setPage} total={filteredActions.length} pageSize={8} />
    </section>
  </>);
}
