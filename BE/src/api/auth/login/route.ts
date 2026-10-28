import { authenticate } from '../../../lib/auth';
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.username !== 'string' || typeof body?.password !== 'string' || !body.username.trim() || !body.password || body.password.length > 256) return Response.json({ status: 'error', message: 'Vui lòng nhập email/tên đăng nhập và mật khẩu.' }, { status: 400 });
  const user = authenticate(body.username, body.password);
  if (!user) return Response.json({ status: 'error', message: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, { status: 401 });
  return Response.json({ status: 'success', token: 'demo-session', user });
}
