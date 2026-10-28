const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const nextCli = require.resolve('next/dist/bin/next', { paths: [path.join(root, 'FE')] });
const fePort = process.env.FE_PORT || '3000';
const bePort = process.env.PORT || '4000';
const children = [];
let stopping = false;

// Dừng cả hai cây tiến trình, kể cả worker do Next.js và Node --watch tạo.
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Tiến trình đã dừng. */ }
    }
  }
  process.exit(code);
}

function start(folder, args) {
  const child = spawn(process.execPath, args, {
    cwd: path.join(root, folder),
    stdio: 'inherit',
    windowsHide: true,
    detached: process.platform !== 'win32',
  });
  children.push(child);
  child.on('error', error => { console.error(folder + ': ' + error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log('FE: http://localhost:' + fePort + ' | BE: http://127.0.0.1:' + bePort);
start('BE', ['--watch', '--env-file-if-exists=.env.local', 'scripts/dev.cjs']);
start('FE', [nextCli, 'dev', '-p', fePort]);
