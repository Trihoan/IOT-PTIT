import { getSensors } from '../../../lib/sensors';
export async function GET() {
  const records = await getSensors();
  const latest = [1, 2, 3].map((id) => records.filter((record) => record.sensorId === id).at(-1)).filter(Boolean);
  return Response.json({ status: 'success', data: latest });
}

