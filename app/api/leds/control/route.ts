import { NextResponse } from 'next/server';
import { controlDevice } from '@/lib/devices';
export async function POST(request: Request) {
  const body = await request.json().catch(() => null); const id = Number(body?.led_id); const state = body?.state;
  if (!Number.isInteger(id) || !['ON', 'OFF'].includes(state)) return NextResponse.json({ status: 'error', message: 'led_id và state (ON/OFF) không hợp lệ.' }, { status: 400 });
  const result = await controlDevice(id, state === 'ON');
  if (!result) return NextResponse.json({ status: 'error', message: 'Không tìm thấy thiết bị.' }, { status: 404 });
  const { device, action } = result;
  
  return NextResponse.json({ status: 'success', device, action, mqtt: { published: false, topic: 'hoan/device/control', message: { deviceId: id, action: state, historyId: action.id }, note: 'Chưa kết nối MQTT broker; lệnh hiện được mô phỏng.' } });
}


