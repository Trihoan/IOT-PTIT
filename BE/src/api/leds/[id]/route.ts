import { getDevices } from '../../../lib/devices';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const device = (await getDevices()).find((item) => item.id === Number(id));
  return device ? Response.json({ status: 'success', device }) : Response.json({ status: 'error', message: 'Không tìm thấy thiết bị.' }, { status: 404 });
}

