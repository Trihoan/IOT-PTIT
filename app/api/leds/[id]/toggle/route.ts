import { NextResponse } from 'next/server';
import { controlDevice } from '@/lib/devices';
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const result = await controlDevice(Number(id));
  if (!result) return NextResponse.json({ status: 'error', message: 'Không tìm thấy thiết bị.' }, { status: 404 });
  
  return NextResponse.json({ status: 'success', ...result });
}

