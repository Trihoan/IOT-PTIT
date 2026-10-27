import { NextResponse } from 'next/server';
import { getSensors } from '@/lib/sensors';
import { startTelemetry, telemetryStatus } from '@/lib/telemetry';
import { demoReadings, hasFreshSensors } from '@/lib/demo-sensors';

export const dynamic = 'force-dynamic';
export async function GET() {
  startTelemetry();
  const now = Date.now();
  const status = telemetryStatus();
  const stored = await getSensors().catch(() => []);
  const real = status.connected && hasFreshSensors(stored, now);
  const records = real ? stored : demoReadings(now);
  const latest = [1, 2, 3].map(id => records.filter(row => row.sensorId === id).at(-1)).filter(Boolean);
  const from = Math.floor(now / 60000) * 60000 - 5 * 60000;
  const chart = records.filter(row => Date.parse(row.timestamp) >= from);
  return NextResponse.json({ latest, chart, ...status, source: real ? 'mqtt' : 'demo' }, { headers: { 'Cache-Control': 'no-store' } });
}
