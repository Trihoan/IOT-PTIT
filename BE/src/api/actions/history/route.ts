import { page } from '../../../lib/store';
import { getActions } from '../../../lib/devices';
export async function GET(request: Request) { return Response.json({ status: 'success', ...page(await getActions(), request) }); }

