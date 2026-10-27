'use client';

import { useState } from 'react';

export type Reading = { id: number; sensorId: number; value: number; timestamp: string; sensor: string; unit: string };

export default function LiveChart({ records }: { records: Reading[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const latestTime = records.reduce((time, r) => Math.max(time, Date.parse(r.timestamp) || 0), 0);
  const start = Math.floor(latestTime / 60000) * 60000 - 5 * 60000;
  const end = start + 6 * 60000;
  const valid = records.filter(r => Number.isFinite(r.value) && Date.parse(r.timestamp) >= start && Date.parse(r.timestamp) <= end);
  if (!valid.length) return <div className="chart-empty">Đang chờ dữ liệu cảm biến…</div>;
  const times = [...new Set(valid.map(r => Date.parse(r.timestamp)))].sort((a, b) => a - b);
  const minutes = (end - start) / 60000;
  const width = 590;
  const x = (time: number) => 30 + (time - start) / (end - start) * (width - 60);
  const series = [
    { id: 3, name: 'Ánh sáng', color: '#e8ad3b', unit: 'lux', min: 0, max: 1000, dash: '7 3' },
    { id: 2, name: 'Độ ẩm', color: '#f1787c', unit: '%', min: 0, max: 100, dash: '3 3' },
    { id: 1, name: 'Nhiệt độ', color: '#4f8df7', unit: '°C', min: -10, max: 60, dash: undefined },
  ];
  const selected = series.map(s => {
    if (hover === null) return { ...s, reading: undefined };
    const reading = valid.filter(r => r.sensorId === s.id && Math.abs(Date.parse(r.timestamp) - hover) <= 2500)
      .reduce<Reading | undefined>((nearest, r) => !nearest || Math.abs(Date.parse(r.timestamp) - hover) < Math.abs(Date.parse(nearest.timestamp) - hover) ? r : nearest, undefined);
    return { ...s, reading };
  });
  const tooltipX = hover === null ? 0 : Math.max(30, Math.min(x(hover) + 10, width - 240));
  return <div className="live-chart-frame"><svg className="line-chart" viewBox={`0 0 ${width} 220`} preserveAspectRatio="none" role="img" aria-label="Biểu đồ cảm biến: trục thời gian cách 1 phút, rê chuột để xem từng mẫu 5 giây; mỗi đường có thang đo riêng" onMouseLeave={() => setHover(null)} onMouseMove={event => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const time = start + ((event.clientX - bounds.left) / bounds.width * width - 30) / (width - 60) * (end - start);
    let low = 0, high = times.length - 1;
    while (low < high) { const mid = Math.floor((low + high) / 2); if (times[mid] < time) low = mid + 1; else high = mid; }
    setHover(low > 0 && Math.abs(times[low - 1] - time) < Math.abs(times[low] - time) ? times[low - 1] : times[low]);
  }}>
    {[0, 1, 2, 3].map(i => <line key={i} x1="30" x2={width - 30} y1={30 + i * 50} y2={30 + i * 50} stroke="#26334b" strokeDasharray="3 5"/>)}
    {series.map(s => {
      const rows = valid.filter(r => r.sensorId === s.id).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      if (!rows.length) return null;
      const min = rows.reduce((lowest, r) => Math.min(lowest, r.value), s.min);
      const max = rows.reduce((highest, r) => Math.max(highest, r.value), s.max);
      const y = (r: Reading) => 180 - (r.value - min) / (max - min) * 150;
      return <g key={s.id}><polyline points={rows.map(r => `${x(Date.parse(r.timestamp))},${y(r)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash}/>{rows.map(r => <circle key={r.id} cx={x(Date.parse(r.timestamp))} cy={y(r)} r="2" fill={s.color}/>)}</g>;
    })}
    {Array.from({ length: minutes + 1 }, (_, i) => <text key={i} x={x(start + i * 60000)} y="210" textAnchor="middle" fill="#8290a7" fontSize="9">{new Date(start + i * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</text>)}
    {hover !== null && <g pointerEvents="none"><line x1={x(hover)} x2={x(hover)} y1="25" y2="185" stroke="#8290a7" strokeDasharray="3 3"/><g transform={`translate(${tooltipX}, 35)`}><rect width="210" height={32 + selected.length * 18} rx="6" fill="#101a2b" stroke="#385171"/><text x="10" y="19" fill="#e8edf7" fontSize="10">{new Date(hover).toLocaleString('vi-VN')}</text>{selected.map((s, i) => <text key={s.id} x="10" y={39 + i * 18} fill={s.color} fontSize="10">{s.name}: {s.reading ? `${s.reading.value} ${s.unit}` : 'Chưa có dữ liệu'}</text>)}</g></g>}
  </svg></div>;
}
