const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
process.env.MQTT_SIMULATION = 'true';
process.env.DB_DRIVER = 'mysql';
require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(compiled, filename);
};

(async () => {
  const { createApiServer } = require('../src/server.ts');
  const server = createApiServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(path, method = 'GET', body, status = 200) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    assert.equal(response.status, status, method + ' ' + path);
    return response.json();
  }
  try {
    const credentials = { name: 'Test HTTP', email: 'http-test@example.test', password: 'test-password', confirmPassword: 'test-password' };
    assert.ok((await request('/api/auth/register', 'POST', credentials, 201)).token);
    assert.ok((await request('/api/auth/login', 'POST', { username: credentials.email, password: credentials.password })).token);
    await request('/api/auth/login', 'POST', { username: credentials.email, password: 'incorrect' }, 401);
    assert.equal((await request('/api/devices/status')).devices.length, 3);
    assert.equal((await request('/api/leds/control', 'POST', { led_id: 1, state: 'ON' })).device.status, true);
    assert.equal((await request('/api/leds/1')).device.status, true);
    assert.equal((await request('/api/leds/1/toggle', 'PATCH')).device.status, false);
    const all = await request('/api/leds/control-all', 'POST', { state: 'ON' });
    assert.ok(all.devices.every(device => device.status));
    assert.equal(all.mqtt.published, false);
    assert.equal((await request('/api/actions/history?limit=2')).total, 5);
    const live = await request('/api/sensors/live');
    assert.equal(live.connected, false);
    assert.equal(live.source, 'demo');
    assert.equal((await request('/api/sensors/latest')).data.length, 3);
    assert.equal((await request('/api/sensors/history?limit=4')).data.length, 4);
    assert.equal((await request('/api/sensors/1/chart')).chartData.length, 61);
    await request('/api/sensors/99/chart', 'GET', undefined, 404);
    const created = await request('/api/schedules', 'PUT', { deviceId: 1, time: '20:30', state: 'OFF' }, 201);
    assert.equal((await request('/api/schedules')).data.length, 1);
    await request('/api/schedules/' + created.schedule.id, 'DELETE');
    await request('/api/schedules/' + created.schedule.id, 'DELETE', undefined, 404);
    await request('/api/leds/control', 'POST', { led_id: 99, state: 'ON' }, 400);
    await request('/api/unknown', 'GET', undefined, 404);
    await request('/api/devices/status', 'POST', {}, 405);
    assert.equal((await fetch(base + '/api/devices/status', { method: 'HEAD' })).status, 200);
    assert.equal((await fetch(base + '/api/devices/status', { method: 'OPTIONS' })).status, 204);
    console.log('Passed: all API routes over HTTP, auth, controls, sensors, history, schedules and error responses.');
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
