import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp, validateChannel, makePlaylist } from '../server.js';

async function fixture(t, options = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), 'iux-test-'));
  const server = createApp({ dataDir, password: '', production: false, ...options });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.shutdownRelay();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    rmSync(dataDir, { recursive: true, force: true });
  });
  const request = (path, method = 'GET', body, extra = {}) => fetch(base + path, {
    method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extra },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { dataDir, server, base, request };
}
const sample = { name: 'Canal Uno', source: 'https://media.example/one.ts', group: 'Noticias', tvgId: 'uno', enabled: true };

test('valida protocolos y rechaza URLs no admitidas', () => {
  for (const source of ['https://media.example/live', 'http://192.168.1.2/live', 'udp://239.1.1.1:1234', 'rtp://239.1.1.2:5004']) {
    assert.equal(validateChannel({ ...sample, source }).source, source);
  }
  for (const source of ['file:///etc/passwd', 'javascript:alert(1)', 'ftp://example.com/video', 'no-url', 'https://admin:secret@example.com']) {
    assert.throws(() => validateChannel({ ...sample, source }));
  }
  assert.throws(() => validateChannel({ ...sample, name: ' ' }));
  assert.throws(() => validateChannel({ ...sample, logo: 'javascript:alert(1)' }));
  assert.throws(() => validateChannel({ ...sample, enabled: 'false' }));
  assert.equal(validateChannel({ ...sample, group: '' }).group, 'General');
});

test('M3U omite canales deshabilitados y evita inyección de líneas y atributos', () => {
  const channel = validateChannel({ ...sample, name: 'Nombre\n#EXTINF:injection', group: '" extra="x' });
  const list = makePlaylist([channel, { ...sample, enabled: false, name: 'No exportar' }]);
  assert.ok(list.startsWith('#EXTM3U\n'));
  assert.equal(list.split('\n').length, 4);
  assert.ok(!list.includes('No exportar'));
  assert.ok(!list.includes('group-title="" extra='));
});

test('CRUD, filtros de exportación y persistencia en disco', async t => {
  const { request, dataDir } = await fixture(t);
  assert.deepEqual(await (await request('/api/channels')).json(), []);
  const createdResponse = await request('/api/channels', 'POST', sample);
  assert.equal(createdResponse.status, 201);
  const channel = await createdResponse.json();
  assert.ok(channel.id);
  assert.equal(JSON.parse(readFileSync(join(dataDir, 'channels.json')))[0].name, sample.name);
  const list = await request('/playlist.m3u');
  assert.match(list.headers.get('content-disposition'), /iux-zone.m3u/);
  assert.ok((await list.text()).includes(`/stream/${channel.id}.ts`));
  assert.match(await (await request('/playlist.m3u?direct=1')).text(), /https:\/\/media.example\/one.ts/);
  const edited = await request(`/api/channels/${channel.id}`, 'PATCH', { name: 'Renombrado', enabled: false, id: 'override' });
  assert.equal(edited.status, 200);
  const changed = await edited.json();
  assert.equal(changed.id, channel.id);
  assert.equal(changed.name, 'Renombrado');
  assert.equal(await (await request('/playlist.m3u')).text(), '#EXTM3U\n');
  const restored = createApp({ dataDir, password: '', production: false });
  restored.listen(0, '127.0.0.1'); await once(restored, 'listening');
  try {
    const restoredChannels = await (await fetch(`http://127.0.0.1:${restored.address().port}/api/channels`)).json();
    assert.deepEqual(restoredChannels, [changed]);
  } finally { restored.closeAllConnections(); await new Promise(resolve => restored.close(resolve)); }
  assert.equal((await request(`/api/channels/${channel.id}`, 'DELETE')).status, 200);
  assert.deepEqual(await (await request('/api/channels')).json(), []);
  assert.equal((await request(`/api/channels/${channel.id}`, 'DELETE')).status, 404);
});

test('autenticación: protege API y lista, inicia y cierra sesión', async t => {
  const { request } = await fixture(t, { password: 'Una-clave-larga-2026' });
  assert.equal((await request('/api/channels')).status, 401);
  assert.equal((await request('/playlist.m3u')).status, 401);
  assert.equal((await request('/')).status, 200);
  assert.equal((await request('/api/session', 'POST', { password: 'incorrecta' })).status, 401);
  const login = await request('/api/session', 'POST', { password: 'Una-clave-larga-2026' });
  assert.equal(login.status, 200);
  assert.match(login.headers.get('set-cookie'), /HttpOnly/);
  const Cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/channels', 'GET', undefined, { Cookie })).status, 200);
  assert.equal((await request('/playlist.m3u', 'GET', undefined, { Cookie })).status, 200);
  assert.equal((await request('/api/session', 'DELETE', undefined, { Cookie })).status, 200);
  assert.equal((await request('/api/channels', 'GET', undefined, { Cookie })).status, 401);
});

test('limita intentos de autenticación', async t => {
  const { request } = await fixture(t, { password: 'Una-clave-larga-2026' });
  for (let i = 0; i < 10; i++) assert.equal((await request('/api/session', 'POST', { password: 'x' })).status, 401);
  assert.equal((await request('/api/session', 'POST', { password: 'Una-clave-larga-2026' })).status, 429);
});

test('rechaza entradas inválidas, orígenes externos y rutas privadas', async t => {
  const { request, base } = await fixture(t);
  assert.equal((await request('/api/channels', 'POST', { name: 'Vacío' })).status, 400);
  assert.equal((await request('/api/channels', 'POST', null)).status, 400);
  assert.equal((await request('/api/channels', 'POST', sample, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/api/channels', 'POST', sample, { Origin: base })).status, 201);
  assert.equal((await fetch(base + '/api/channels', { method: 'POST', body: 'oops', headers: { 'Content-Type': 'application/json' } })).status, 400);
  assert.equal((await request('/api/channels', 'POST', sample, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await request('/api/channels', 'POST', { ...sample, name: 'x'.repeat(17000) })).status, 413);
  for (const path of ['/server.js', '/data/channels.json', '/.env', '/missing']) assert.equal((await request(path)).status, 404);
  const system = await (await request('/api/system')).json();
  assert.equal(system.capabilities.relay, true);
  assert.equal(system.capabilities.dvb, false);
  const page = await request('/');
  assert.match(page.headers.get('content-security-policy'), /default-src 'self'/);
});

test('producción exige contraseña y datos corruptos no se sobrescriben', () => {
  assert.throws(() => createApp({ production: true, password: '' }), /ADMIN_PASSWORD/);
  const dataDir = mkdtempSync(join(tmpdir(), 'iux-corrupt-'));
  try {
    writeFileSync(join(dataDir, 'channels.json'), 'corrupt');
    assert.throws(() => createApp({ dataDir, password: '', production: false }));
    assert.equal(readFileSync(join(dataDir, 'channels.json'), 'utf8'), 'corrupt');
  } finally { rmSync(dataDir, { recursive: true, force: true }); }
});
