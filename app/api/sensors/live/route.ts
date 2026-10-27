import { NextResponse } from 'next/server';
import { getSensors } from '@/lib/sensors';
import { startTelemetry, telemetryStatus } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  startTelemetry();
  const hours = new URL(request.url).searchParams.get('hours') === '168' ? 168 : 24;
  const records = await getSensors();
  const latest = [1, 2, 3].map(id => records.filter(row => row.sensorId === id).at(-1)).filter(Boolean);
  const from = Date.now() - hours * 3600000;
  const chart = [1, 2, 3].flatMap(id => {
    const rows = records.filter(row => row.sensorId === id && Date.parse(row.timestamp) >= from);
    const step = Math.max(1, Math.ceil(rows.length / 300));
    return rows.filter((_, index) => index % step === 0 || index === rows.length - 1);
  });
  return NextResponse.json({ latest, chart, ...telemetryStatus() }, { headers: { 'Cache-Control': 'no-store' } });
}
