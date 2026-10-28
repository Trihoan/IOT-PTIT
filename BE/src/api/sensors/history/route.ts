import { page } from '../../../lib/store';
import { getSensors } from '../../../lib/sensors';
export async function GET(request: Request) {
  const url = new URL(request.url); const from = url.searchParams.get('from'); const to = url.searchParams.get('to');
  const rows = (await getSensors()).filter((row) => (!from || row.timestamp >= new Date(from).toISOString()) && (!to || row.timestamp <= new Date(`${to}T23:59:59.999Z`).toISOString()));
  return Response.json({ status: 'success', ...page(rows, request) });
}

