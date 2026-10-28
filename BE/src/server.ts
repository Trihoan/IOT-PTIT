import { createServer, type IncomingMessage } from 'node:http';
import { startTelemetry } from './lib/telemetry';
import * as route0 from './api/actions/history/route';
import * as route1 from './api/auth/login/route';
import * as route2 from './api/auth/register/route';
import * as route3 from './api/devices/status/route';
import * as route4 from './api/leds/[id]/route';
import * as route5 from './api/leds/[id]/toggle/route';
import * as route6 from './api/leds/control-all/route';
import * as route7 from './api/leds/control/route';
import * as route8 from './api/schedules/[id]/route';
import * as route9 from './api/schedules/route';
import * as route10 from './api/sensors/[id]/chart/route';
import * as route11 from './api/sensors/history/route';
import * as route12 from './api/sensors/latest/route';
import * as route13 from './api/sensors/live/route';

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;
type Route = { pattern: RegExp; keys: string[]; handlers: object };

// Bảng định tuyến giữ nguyên các URL /api của ứng dụng.
const routes: Route[] = [
  { pattern: /^\/api\/actions\/history\/?$/, keys: [], handlers: route0 },
  { pattern: /^\/api\/auth\/login\/?$/, keys: [], handlers: route1 },
  { pattern: /^\/api\/auth\/register\/?$/, keys: [], handlers: route2 },
  { pattern: /^\/api\/devices\/status\/?$/, keys: [], handlers: route3 },
  { pattern: /^\/api\/leds\/control-all\/?$/, keys: [], handlers: route6 },
  { pattern: /^\/api\/leds\/control\/?$/, keys: [], handlers: route7 },
  { pattern: /^\/api\/schedules\/?$/, keys: [], handlers: route9 },
  { pattern: /^\/api\/sensors\/history\/?$/, keys: [], handlers: route11 },
  { pattern: /^\/api\/sensors\/latest\/?$/, keys: [], handlers: route12 },
  { pattern: /^\/api\/sensors\/live\/?$/, keys: [], handlers: route13 },
  { pattern: /^\/api\/leds\/([^\/]+)\/?$/, keys: ["id"], handlers: route4 },
  { pattern: /^\/api\/leds\/([^\/]+)\/toggle\/?$/, keys: ["id"], handlers: route5 },
  { pattern: /^\/api\/schedules\/([^\/]+)\/?$/, keys: ["id"], handlers: route8 },
  { pattern: /^\/api\/sensors\/([^\/]+)\/chart\/?$/, keys: ["id"], handlers: route10 },
];

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1024 * 1024) throw new Error('BODY_TOO_LARGE');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function createApiServer() {
  return createServer(async (incoming, outgoing) => {
    try {
      const url = new URL(incoming.url || '/', 'http://localhost');
      const route = routes.find(item => item.pattern.test(url.pathname));
      let response: Response;
      if (!route) {
        response = Response.json({ status: 'error', message: 'Không tìm thấy API.' }, { status: 404 });
      } else {
        const method = incoming.method || 'GET';
        const handlers = route.handlers as Record<string, Handler>;
        const allow = [...Object.keys(handlers), ...(handlers.GET ? ['HEAD'] : []), 'OPTIONS'].join(', ');
        const handler = handlers[method === 'HEAD' ? 'GET' : method];
        if (method === 'OPTIONS') {
          response = new Response(null, { status: 204, headers: { Allow: allow } });
        } else if (!handler) {
          response = Response.json({ status: 'error', message: 'Phương thức không được hỗ trợ.' }, { status: 405, headers: { Allow: allow } });
        } else {
          const match = route.pattern.exec(url.pathname)!;
          const params = Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])]));
          const headers = new Headers();
          for (const [key, value] of Object.entries(incoming.headers)) {
            if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
          const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(incoming);
          const request = new Request(url, { method, headers, body });
          response = await handler(request, { params: Promise.resolve(params) });
        }
      }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(incoming.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === 'BODY_TOO_LARGE';
      const malformedUrl = error instanceof URIError;
      if (!tooLarge && !malformedUrl) console.error(error);
      outgoing.writeHead(tooLarge ? 413 : malformedUrl ? 400 : 500, { 'Content-Type': 'application/json; charset=utf-8' });
      outgoing.end(JSON.stringify({ status: 'error', message: tooLarge ? 'Dữ liệu gửi lên quá lớn.' : malformedUrl ? 'URL không hợp lệ.' : 'Không xử lý được yêu cầu.' }));
    }
  });
}

export function startServer() {
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createApiServer();
  server.listen(port, host, () => {
    startTelemetry();
    console.log('BE: http://' + host + ':' + port);
  });
  server.on('error', error => { console.error(error.message); process.exit(1); });
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) startServer();
