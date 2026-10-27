'use client';

export default function Pagination({ page, setPage, total, pageSize }: {
  page: number; setPage: (page: number) => void; total: number; pageSize: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(pages, Math.max(1, page));
  const start = total ? (current - 1) * pageSize + 1 : 0;
  const end = Math.min(current * pageSize, total);
  const numbers = [...new Set([1, pages, current - 1, current, current + 1])]
    .filter(number => number >= 1 && number <= pages).sort((a, b) => a - b);
  return <div className="pagination">
    <span>Hiển thị <b>{start}–{end}</b> trong <b>{total}</b> bản ghi</span>
    <nav aria-label="Phân trang">
      <button className="page-button" onClick={() => setPage(current - 1)} disabled={current === 1}>Trước</button>
      {numbers.map((number, index) => <span key={number} style={{ display: 'contents' }}>
        {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
        <button className={`page-number${number === current ? ' active' : ''}`} aria-current={number === current ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>
      </span>)}
      <button className="page-button" onClick={() => setPage(current + 1)} disabled={current === pages}>Tiếp theo ›</button>
    </nav>
  </div>;
}
