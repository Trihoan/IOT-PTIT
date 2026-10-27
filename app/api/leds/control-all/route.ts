import { NextResponse } from 'next/server';
import { controlAllDevices } from '@/lib/devices';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!['ON', 'OFF'].includes(body?.state)) return NextResponse.json({ status: 'error', message: 'state phải là ON hoặc OFF.' }, { status: 400 });
  try {
    const result = await controlAllDevices(body.state === 'ON');
    return NextResponse.json({ status: 'success', ...result, mqtt: { published: false } });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Không thể lưu lệnh điều khiển tất cả thiết bị.' }, { status: 500 });
  }
}
