import { NextResponse } from 'next/server';
import { getDevices } from '@/lib/devices';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const device = (await getDevices()).find((item) => item.id === Number(id));
  return device ? NextResponse.json({ status: 'success', device }) : NextResponse.json({ status: 'error', message: 'Không tìm thấy thiết bị.' }, { status: 404 });
}

