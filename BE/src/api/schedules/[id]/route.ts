import { db } from '../../../lib/store';
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const before = db.schedules.length; db.schedules = db.schedules.filter((item) => String(item.id) !== id);
  return before === db.schedules.length ? Response.json({ status: 'error', message: 'Không tìm thấy lịch.' }, { status: 404 }) : Response.json({ status: 'success', deleted: Number(id) });
}
