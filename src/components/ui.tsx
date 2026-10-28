'use client';
import { useState } from 'react';
import type { SensorRow } from '../types';

// Thành phần dùng chung giữa các trang.
export function Icon({ name, size = 18 }: {
  name: string;
  size?: number;
}) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const shapes: Record<string, React.ReactNode> = {
    grid: <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>,
    chart: <>
      <path d="M4 19V5M4 19h17" />
      <path d="m7 15 4-4 3 2 6-7" />
    </>,
    clock: <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
    user: <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>,
    cpu: <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
    </>,
    sun: <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
    drop: <>
      <path d="M12 3s7 8 7 12a7 7 0 0 1-14 0c0-4 7-12 7-12Z" />
      <path d="M9 16a3 3 0 0 0 3 2" />
    </>,
    temp: <>
      <path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z" />
      <path d="M11 11v6" />
    </>,
    search: <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4 4" />
    </>,
    logout: <>
      <path d="M10 17l5-5-5-5m5 5H3" />
      <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
    </>,
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    bolt: <path d="m13 2-3 8h7l-6 12 2-9H6l7-11Z" />,
  };
  return <svg {...common}>
    {shapes[name] || shapes.grid}
  </svg>;
}

export function Switch({ on, onClick, label, disabled = false }: {
  on: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return <button type="button" className={`switch ${on ? 'on' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={on} aria-label={`Bật tắt ${label}`}>
    <span />
  </button>;
}

export function StatCard({ icon, label, value, note, tone }: {
  icon: string;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return <div className="stat-card">
    <div className={`stat-icon ${tone}`}>
      <Icon name={icon} size={19} />
    </div>
    <span className="stat-label">
      {label}
    </span>
    <b className="stat-value">
      {value}
    </b>
    <span className="stat-note">
      {note}
    </span>
  </div>;
}

export function SensorMetric({ icon, label, value, unit, trend, color }: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  trend: string;
  color: string;
}) {
  return <div className="metric-row">
    <div className={`metric-icon ${color}`}>
      <Icon name={icon} size={18} />
    </div>
    <div className="metric-copy">
      <span>
        {label}
      </span>
      <b>
        {value}
        <small>
          {unit}
        </small>
      </b>
    </div>
    <span className="metric-trend">↗
      {trend}
    </span>
  </div>;
}

export function SensorTable({ rows }: {
  rows: SensorRow[];
}) {
  return <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>THỜI GIAN</th>
          <th>CẢM BIẾN</th>
          <th>GIÁ TRỊ ĐO</th>
          <th>TRẠNG THÁI</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => <tr key={`${r.id}-${i}`}>
          <td className="muted">
            {r.time}
          </td>
          <td>
            {r.sensor}
          </td>
          <td className="value-cell">
            {r.value}
            <small>
              {r.unit}
            </small>
          </td>
          <td>
            <span className="status-badge status-on">
              <i />
              {r.status}
            </span>
          </td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}

export function ToggleRow({ title, description }: {
  title: string;
  description: string;
}) {
  const [on, setOn] = useState(true);
  return <div className="toggle-row">
    <div>
      <b>
        {title}
      </b>
      <small>
        {description}
      </small>
    </div>
    <Switch on={on} onClick={() => setOn(!on)} label={title} />
  </div>;
}
