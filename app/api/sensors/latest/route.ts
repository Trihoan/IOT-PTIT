import { NextResponse } from 'next/server';
import { getSensors } from '@/lib/sensors';
export async function GET() {
  const records = await getSensors();
  const latest = [1, 2, 3].map((id) => records.filter((record) => record.sensorId === id).at(-1)).filter(Boolean);
  return NextResponse.json({ status: 'success', data: latest });
}

