import { getDevices } from '../../../lib/devices';
export async function GET() { return Response.json({ status: 'success', devices: await getDevices() }); }

