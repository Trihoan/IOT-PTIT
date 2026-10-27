export type Reading = { id: number; sensorId: number; value: number; timestamp: string; sensor: string; unit: string };

export default function LiveChart({ records }: { records: Reading[] }) {
  const valid = records.filter(r => Number.isFinite(r.value) && Number.isFinite(Date.parse(r.timestamp)));
  if (!valid.length) return <div className="chart-empty">Đang chờ dữ liệu cảm biến…</div>;
  const start = Math.min(...valid.map(r => Date.parse(r.timestamp)));
  const end = Math.max(start + 5000, ...valid.map(r => Date.parse(r.timestamp)));
  const series = [{ id: 3, color: '#e8ad3b', unit: 'lux' }, { id: 2, color: '#f1787c', unit: '%' }, { id: 1, color: '#4f8df7', unit: '°C' }];
  return <svg className="line-chart" viewBox="0 0 590 220" preserveAspectRatio="none" role="img" aria-label="Biểu đồ cảm biến cập nhật mỗi 5 giây; mỗi đường có thang đo riêng">
    {[0, 1, 2, 3].map(i => <line key={i} x1="30" x2="570" y1={30 + i * 50} y2={30 + i * 50} stroke="#26334b" strokeDasharray="3 5"/>)}
    {series.map(s => {
      const rows = valid.filter(r => r.sensorId === s.id).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      if (!rows.length) return null;
      const min = Math.min(...rows.map(r => r.value));
      const max = Math.max(...rows.map(r => r.value));
      const pad = Math.max((max - min) * .1, 1);
      const x = (r: Reading) => 30 + (Date.parse(r.timestamp) - start) / (end - start) * 540;
      const y = (r: Reading) => 180 - (r.value - min + pad) / (max - min + 2 * pad) * 150;
      return <g key={s.id}><text x={30 + series.indexOf(s) * 180} y="15" fill={s.color} fontSize="9">{min.toFixed(1)}–{max.toFixed(1)} {s.unit}</text><polyline points={rows.map(r => `${x(r)},${y(r)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2"/>{rows.map(r => <circle key={r.id} cx={x(r)} cy={y(r)} r="2" fill={s.color}><title>{new Date(r.timestamp).toLocaleTimeString('vi-VN')}: {r.value} {s.unit}</title></circle>)}</g>;
    })}
    {[0, 1, 2, 3, 4].map(i => <text key={i} x={30 + i * 135} y="210" textAnchor="middle" fill="#8290a7" fontSize="9">{new Date(start + (end - start) * i / 4).toLocaleTimeString('vi-VN')}</text>)}
  </svg>;
}
