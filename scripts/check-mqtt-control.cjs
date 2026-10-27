const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Exercise the command protocol without publishing to a physical relay.
class Client extends EventEmitter {
  connected = true;
  mode = 'success';
  subscribed = false;
  subscribe(topics, callback) {
    // MQTT.js returns [] when an already cached subscription isn't forced.
    if (this.subscribed && !topics.resubscribe) { callback(null, []); return; }
    this.subscribed = true;
    callback(null, [{ qos: 0 }]);
  }
  publish(topic, payload, options, callback) {
    assert.equal(topic, 'hoan/device/control');
    assert.equal(options.retain, false);
    const command = JSON.parse(payload);
    callback(null);
    queueMicrotask(() => {
      this.emit('message', 'hoan/device/ack', Buffer.from(JSON.stringify({ ...command, status: 'SUCCESS', action: command.action === 'ON' ? 'OFF' : 'ON' })), { retain: false });
      if (this.mode === 'success' || this.mode === 'retained') this.emit('message', 'hoan/device/ack', Buffer.from(JSON.stringify({ ...command, status: 'SUCCESS' })), { retain: this.mode === 'retained' });
    });
  }
}
const client = new Client();
const realTimeout = global.setTimeout;
global.setTimeout = (callback, delay, ...args) => realTimeout(callback, delay === 8000 ? 30 : delay, ...args);
process.env.MQTT_URL = 'mqtt://test.invalid';

function load(relative, overrides) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  const originalRequire = instance.require.bind(instance);
  instance.require = name => name in overrides ? overrides[name] : originalRequire(name);
  instance._compile(compiled, filename);
  return instance.exports;
}

(async () => {
  const control = load('lib/mqtt-control.ts', { mqtt: { connect: () => client } });
  await control.commandDevice(1, true);
  await control.commandDevice(1, false);
  await control.commandDevice(2, true);
  client.mode = 'missing';
  const first = control.commandDevice(1, false);
  await assert.rejects(control.commandDevice(1, false), /một lệnh khác/);
  await assert.rejects(first, /8 giây/);
  client.mode = 'retained';
  await assert.rejects(control.commandDevice(2, true), /8 giây/);
  client.mode = 'success';
  await control.commandDevice(1, false);

  const db = { devices: [{ id: 1, name: 'LED 1', status: false }], actions: [] };
  const devices = load('lib/devices.ts', {
    './mqtt-control': { commandDevice: async () => { throw new Error('No ACK'); } },
    './mysql': { usesMysql: () => false },
    './store': { db, addAction: () => { throw new Error('Must not save an action without ACK'); } },
  });
  await assert.rejects(devices.controlDevice(1, true), /No ACK/);
  assert.equal(db.devices[0].status, false);
  assert.equal(db.actions.length, 0);
  console.log('Passed: matching ACK required, wrong/retained ACK ignored, concurrent command rejected, timeout released, no state/history changes without ACK.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { global.setTimeout = realTimeout; });
