import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const library = join(root, 'scripts/install-lib.sh');
function shell(command, ...args) {
  const result = spawnSync('bash', ['-euc', 'source "$1"; ' + command, 'test', library, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'iux-install-'));
  mkdirSync(join(base, 'releases/0.1.1'), { recursive: true });
  writeFileSync(join(base, 'releases/0.1.1/server.js'), '');
  t.after(() => rmSync(base, { force: true, recursive: true }));
  return base;
}

test('rollback: un enlace inexistente no se guarda como versión anterior', t => {
  const base = fixture(t);
  assert.equal(shell('previous_release "$2"', base), '');
});

test('rollback: enlaces cíclicos, rotos y externos no se guardan', t => {
  for (const target of ['current', 'releases/missing', tmpdir()]) {
    const base = fixture(t); symlinkSync(target, join(base, 'current'));
    assert.equal(shell('previous_release "$2"', base), '', target);
  }
});

test('activación repara un enlace cíclico y conserva rollback solo a código real', t => {
  const base = fixture(t); symlinkSync('current', join(base, 'current'));
  const release = join(base, 'releases/0.1.1');
  shell('switch_release "$2" "$3"', base, release);
  assert.equal(realpathSync(join(base, 'current')), release);
  assert.equal(shell('previous_release "$2"', base), release);
  const next = join(base, 'releases/0.1.2'); mkdirSync(next); writeFileSync(join(next, 'server.js'), '');
  const previous = shell('previous_release "$2"', base);
  shell('switch_release "$2" "$3"', base, next);
  shell('switch_release "$2" "$3"', base, previous);
  assert.equal(realpathSync(join(base, 'current')), release);
});

test('el servidor inicia de verdad al invocarlo mediante current/server.js', { timeout: 10000 }, async t => {
  const base = fixture(t);
  symlinkSync(root, join(base, 'app'));
  const child = spawn(process.execPath, [join(base, 'app/server.js')], {
    env: { ...process.env, NODE_ENV: 'development', PORT: '0', HOST: '127.0.0.1', DATA_DIR: join(base, 'data'), ADMIN_PASSWORD: '', STREAM_TOKEN: '', PUBLIC_URL: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    await exited;
  });
  const address = await new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    child.stderr.on('data', chunk => { errors += chunk; });
    const timeout = setTimeout(() => reject(new Error('El servidor no anunció un puerto. ' + errors)), 5000);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('exit', code => { clearTimeout(timeout); reject(new Error(`El servidor salió prematuramente (${code}). ${errors}`)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); }
    });
  });
  const response = await fetch(address + '/api/system');
  assert.equal(response.status, 200);
  const system = await response.json();
  assert.equal(system.name, 'iux-zone');
  assert.equal(system.version, '0.1.1');
});
