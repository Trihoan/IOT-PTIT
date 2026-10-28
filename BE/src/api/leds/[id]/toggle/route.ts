import { controlDevice } from '../../../../lib/devices';
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (![1, 2, 3].includes(Number(id))) return Response.json({ status: 'error', message: 'Không tìm thấy thiết bị.' }, { status: 404 });
  try {
    const result = await controlDevice(Number(id));
    if (!result) return Response.json({ status: 'error', message: 'Không tìm thấy thiết bị.' }, { status: 404 });
    return Response.json({ status: 'success', ...result, mqtt: { published: process.env.MQTT_SIMULATION !== 'true', acknowledged: process.env.MQTT_SIMULATION !== 'true' } });
  } catch (error) {
    return Response.json({ status: 'error', message: error instanceof Error ? error.message : 'Không điều khiển được thiết bị.' }, { status: 503 });
  }
}
