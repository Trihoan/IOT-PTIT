import { getSensors } from '../../../../lib/sensors';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sensorId = Number(id);
  if (![1, 2, 3].includes(sensorId)) return Response.json({ status: 'error', message: 'Không tìm thấy cảm biến.' }, { status: 404 });
  const url = new URL(request.url); const from = url.searchParams.get('from'); const to = url.searchParams.get('to');
  const data = (await getSensors()).filter((row) => row.sensorId === sensorId && (!from || row.timestamp >= new Date(from).toISOString()) && (!to || row.timestamp <= new Date(`${to}T23:59:59.999Z`).toISOString()));
  const sensor = data.at(-1);
  return Response.json({ status: 'success', sensor: { id: sensorId, name: sensor?.sensor, unit: sensor?.unit }, chartData: data.map((row) => ({ time: row.timestamp, value: row.value })) });
}

