import { db } from '../../lib/store';
export async function GET() { return Response.json({ status: 'success', data: db.schedules }); }
export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Number.isInteger(Number(body.deviceId)) || !body.time || !['ON', 'OFF'].includes(body.state)) return Response.json({ status: 'error', message: 'Cần có deviceId, time và state (ON/OFF).' }, { status: 400 });
  const schedule = { id: Date.now(), enabled: true, ...body }; db.schedules.push(schedule);
  return Response.json({ status: 'success', schedule }, { status: 201 });
}
