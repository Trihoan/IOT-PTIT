const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Verify offline behavior without connecting to MQTT or MySQL.
process.env.MQTT_SIMULATION = 'true';
process.env.DB_DRIVER = 'mysql';
require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(compiled, filename);
};

(async () => {
  const { getDevices, getActions, controlDevice, controlAllDevices } = require('../src/lib/devices.ts');
  const { getSensors } = require('../src/lib/sensors.ts');
  const { startTelemetry, telemetryStatus } = require('../src/lib/telemetry.ts');
  startTelemetry();
  assert.equal(telemetryStatus().connected, false);
  assert.equal((await controlDevice(1, true)).device.status, true);
  assert.equal((await controlDevice(1)).device.status, false);
  assert.equal((await controlAllDevices(true)).devices.every(d => d.status), true);
  assert.equal((await controlAllDevices(false)).devices.every(d => !d.status), true);
  assert.equal((await getDevices()).length, 3);
  assert.equal((await getActions()).length, 8);
  assert.equal((await getSensors()).length, 183);
  assert.equal(await controlDevice(99, true), null);
  assert.equal(telemetryStatus().connected, false);
  console.log('Passed: offline controls, toggle, control-all, history and sensor data; MQTT disconnected, no database required.');
})().catch(error => { console.error(error); process.exitCode = 1; });
