import { NextResponse } from 'next/server';
import { controlAllDevices } from '@/lib/devices';
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!['ON', 'OFF'].includes(body?.state)) return NextResponse.json({ status: 'error', message: 'state phải là ON hoặc OFF.' }, { status: 400 });
  try {
    const result = await controlAllDevices(body.state === 'ON');
    return NextResponse.json({ status: 'success', ...result, mqtt: { published: process.env.MQTT_SIMULATION !== 'true', acknowledged: process.env.MQTT_SIMULATION !== 'true' } });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: (error instanceof Error ? error.message : 'Không điều khiển được thiết bị.') + ' Một số thiết bị có thể đã đổi trạng thái; hãy kiểm tra lại.' }, { status: 503 });
  }
}
