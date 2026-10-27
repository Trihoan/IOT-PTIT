import { NextResponse } from 'next/server';
import { page } from '@/lib/store';
import { getActions } from '@/lib/devices';
export async function GET(request: Request) { return NextResponse.json({ status: 'success', ...page(await getActions(), request) }); }

