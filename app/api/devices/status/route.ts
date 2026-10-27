import { NextResponse } from 'next/server';
import { getDevices } from '@/lib/devices';
export async function GET() { return NextResponse.json({ status: 'success', devices: await getDevices() }); }

