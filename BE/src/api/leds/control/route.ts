import { controlDevice } from '../../../lib/devices';
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = Number(body?.led_id);
  const state = body?.state;
  if (![1, 2, 3].includes(id) || !['ON', 'OFF'].includes(state)) return Response.json({ status: 'error', message: 'led_id (1–3) và state (ON/OFF) không hợp lệ.' }, { status: 400 });
  try {
    const result = await controlDevice(id, state === 'ON');
    if (!result) return Response.json({ status: 'error', message: 'Không tìm thấy thiết bị.' }, { status: 404 });
    return Response.json({ status: 'success', ...result, mqtt: { published: process.env.MQTT_SIMULATION !== 'true', acknowledged: process.env.MQTT_SIMULATION !== 'true', topic: 'hoan/device/control' } });
  } catch (error) {
    return Response.json({ status: 'error', message: error instanceof Error ? error.message : 'Không điều khiển được thiết bị.' }, { status: 503 });
  }
}
