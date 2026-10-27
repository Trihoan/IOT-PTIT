'use client';

import { useState } from 'react';
import { apiExamples } from '@/lib/api-docs';
import './docs.css';

export default function ApiDocs() {
  const [selected, setSelected] = useState(0);
  const [path, setPath] = useState<string>(apiExamples[0].path);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('Chọn API rồi bấm Gửi yêu cầu để xem kết quả.');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const endpoint = apiExamples[selected];
  function select(index: number) {
    const item = apiExamples[index];
    setSelected(index); setPath(item.path);
    setBody('body' in item ? JSON.stringify(item.body, null, 2) : '');
    setStatus(''); setResponse('Chưa gửi yêu cầu.');
  }
  async function send() {
    if (!path.startsWith('/api/') || path.includes('\\') || path.includes('#')) {
      setStatus('Đường dẫn phải bắt đầu bằng /api/.'); return;
    }
    if (body.trim()) {
      try { JSON.parse(body); } catch { setStatus('Body JSON không hợp lệ.'); return; }
    }
    setBusy(true); setStatus('Đang gửi…');
    const start = performance.now();
    try {
      const result = await fetch(path, {
        method: endpoint.method, cache: 'no-store',
        headers: body.trim() ? { 'Content-Type': 'application/json' } : undefined,
        body: endpoint.method !== 'GET' && body.trim() ? body : undefined,
        signal: AbortSignal.timeout(30000),
      });
      const text = await result.text();
      try { setResponse(JSON.stringify(JSON.parse(text), null, 2)); } catch { setResponse(text); }
      setStatus(`HTTP ${result.status} · ${Math.round(performance.now() - start)} ms`);
    } catch (error) {
      setStatus('Không gửi được yêu cầu'); setResponse(error instanceof Error ? error.message : 'Lỗi kết nối.');
    } finally { setBusy(false); }
  }
  return <main className="api-docs">
    <header><a href="/">← Dashboard</a><h1>Tài liệu API IoT</h1><p>Thử API trên server đang chạy. Các yêu cầu chỉ được gửi khi bạn bấm nút.</p><a href="/iot.postman_collection.json" download>Tải Postman Collection</a></header>
    <div className="api-docs-layout">
      <aside aria-label="Danh sách API">{apiExamples.map((item, index) => <button disabled={busy} key={item.method + item.path} className={selected === index ? 'selected' : ''} onClick={() => select(index)}><small>{item.group}</small><span><b>{item.method}</b> {item.path.split('?')[0]}</span></button>)}</aside>
      <section>
        <h2>{endpoint.method} {endpoint.path.split('?')[0]}</h2><p>{endpoint.description}</p>
        {endpoint.group === 'Điều khiển' && <p className="api-docs-note">Yêu cầu này tác động đến relay thật. Cần ESP và MQTT đang kết nối; không có chế độ giả lập bật/tắt.</p>}
        <label>Đường dẫn, tham số truy vấn<input value={path} disabled={busy} onChange={event => setPath(event.target.value)}/></label>
        {endpoint.method !== 'GET' && <label>Body JSON<textarea rows={9} value={body} disabled={busy} placeholder="Không cần body nếu API không yêu cầu" onChange={event => setBody(event.target.value)} spellCheck={false}/></label>}
        <button className="primary-button" disabled={busy} onClick={send}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
        <p role="status">{status}</p><h3>Response</h3><pre>{response}</pre>
        <p className="api-docs-footnote">API hiện chưa bắt buộc Bearer token. Đăng nhập trả token demo; lịch hẹn chỉ lưu cấu hình và chưa tự chạy.</p>
      </section>
    </div>
  </main>;
}
