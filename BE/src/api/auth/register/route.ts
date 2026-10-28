import { users } from '../../../lib/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email || typeof body.password !== 'string' || body.password.length < 6) return Response.json({ status: 'error', message: 'Vui lòng nhập họ tên, email và mật khẩu tối thiểu 6 ký tự.' }, { status: 400 });
  if (body.password !== body.confirmPassword) return Response.json({ status: 'error', message: 'Mật khẩu xác nhận chưa khớp.' }, { status: 400 });
  const email = String(body.email).trim().toLowerCase();
  if (email === 'hoaniot' || users.has(email)) return Response.json({ status: 'error', message: 'Tên đăng nhập/email đã được đăng ký.' }, { status: 409 });
  const name = String(body.name).trim();
  users.set(email, { name, email, password: body.password });
  return Response.json({ status: 'success', token: 'demo-session', user: { id: users.size, username: email, name, email } }, { status: 201 });
}
