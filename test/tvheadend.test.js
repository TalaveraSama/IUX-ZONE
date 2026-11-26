import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server.js';
import { TvheadendClient, validateTvhSettings, digestAuthorization } from '../tvheadend.js';
import { mockTvheadend, tvhIds } from './helpers/tvh-fixture.js';

async function fixture(t, options = {}) {
  const remote = await mockTvheadend(options);
  const dataDir = mkdtempSync(join(tmpdir(), 'iux-tvh-'));
  const app = createApp({ dataDir, password: options.adminPassword || '', streamToken: 'playback-only-token-with-24-characters', production: false, relayOptions: { timeout: 250 } });
  app.listen(0, '127.0.0.1'); await once(app, 'listening');
  const base = `http://127.0.0.1:${app.address().port}`;
  const request = (path, method = 'GET', body, headers = {}) => fetch(base + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  t.after(async () => { app.shutdownRelay(); app.closeAllConnections(); await new Promise(resolve => app.close(resolve)); await remote.close(); rmSync(dataDir, { force: true, recursive: true }); });
  const save = (password = 'test-upstream-secret') => request('/api/tvh/settings', 'PUT', { url: remote.url, username: 'tvh-admin', password });
  return { remote, dataDir, request, save };
}

test('valida origen, evita credenciales embebidas y no traslada contraseñas a otro host', () => {
  for (const url of ['file:///etc/passwd', 'http://user:pass@host:9981', 'http://host/path', 'http://host/?x=1']) assert.throws(() => validateTvhSettings({ url }));
  const previous = { url: 'http://old:9981', username: 'user', password: 'secret' };
  assert.equal(validateTvhSettings({ url: previous.url }, previous).password, 'secret');
  assert.equal(validateTvhSettings({ url: 'http://new:9981' }, previous).password, '');
  assert.throws(() => digestAuthorization('Digest realm="x", nonce="n", algorithm=SHA-512', 'u', 'p', 'POST', '/api/serverinfo'));
});

test('configuración protegida: permisos 0600, contraseña omitida en API y persistencia', async t => {
  const { request, save, dataDir } = await fixture(t);
  assert.equal((await request('/api/tvh/resources/hardware')).status, 409);
  const response = await save(); assert.equal(response.status, 200);
  const settings = await response.json(); assert.equal(settings.hasPassword, true); assert.equal(settings.password, undefined);
  assert.equal(statSync(join(dataDir, 'tvheadend.json')).mode & 0o777, 0o600);
  assert.match(readFileSync(join(dataDir, 'tvheadend.json'), 'utf8'), /test-upstream-secret/);
  const restarted = new TvheadendClient(dataDir); assert.equal((await restarted.test()).connected, true);
  const publicSettings = await (await request('/api/tvh/settings')).text(); assert.ok(!publicSettings.includes('test-upstream-secret'));
});

for (const auth of ['basic', 'digest']) {
  test(`${auth}: API y stream autenticados, importación idempotente y fan-out real`, { timeout: 5000 }, async t => {
    const { request, save, remote } = await fixture(t, { auth }); await save();
    const probe = await request('/api/tvh/test', 'POST', {}); assert.equal(probe.status, 200); assert.equal((await probe.json()).connected, true);
    for (const resource of ['hardware', 'networks', 'muxes', 'services', 'channels', 'epg', 'inputs', 'subscriptions', 'connections', 'builders']) {
      const response = await request(`/api/tvh/resources/${resource}?limit=20`); assert.equal(response.status, 200, resource);
    }
    const imported = await request('/api/tvh/import', 'POST', { uuids: [tvhIds.channel] }); assert.deepEqual(await imported.json(), { added: 1, updated: 0, total: 1 });
    assert.deepEqual(await (await request('/api/tvh/import', 'POST', { uuids: [tvhIds.channel] })).json(), { added: 0, updated: 1, total: 1 });
    const channels = await (await request('/api/channels')).json(); assert.equal(channels[0].source, `tvh://channel/${tvhIds.channel}`);
    const playlist = await (await request('/playlist.m3u')).text(); assert.ok(!playlist.includes('test-upstream-secret')); assert.ok(!playlist.includes(remote.url));
    const response = await request(`/stream/${channels[0].id}.ts`); assert.equal(response.status, 200);
    const first = response.body.getReader(); const data = await first.read(); assert.deepEqual(Buffer.from(data.value.subarray(0, 188)), remote.packet);
    const secondResponse = await request(`/stream/${channels[0].id}.ts`); const second = secondResponse.body.getReader(); assert.equal((await second.read()).value[0], 0x47);
    assert.equal(remote.streamConnections(), 1);
    await request('/api/tvh/settings', 'PUT', { url: '' });
    const states = await (await request('/api/relay')).json(); assert.equal(states[0].clients, 0);
    await first.cancel().catch(() => {}); await second.cancel().catch(() => {});
  });
}

test('serverinfo anónimo no permite validar credenciales incorrectas', async t => {
  const { request, save } = await fixture(t); await save('incorrecta');
  const response = await request('/api/tvh/test', 'POST', {}); assert.equal(response.status, 502);
  const body = await response.json(); assert.match(body.error, /credenciales/); assert.ok(!JSON.stringify(body).includes('incorrecta'));
});

test('acciones usan endpoints y estructuras oficiales y rechazan operaciones desconocidas', async t => {
  const { request, save, remote } = await fixture(t); await save();
  for (const body of [
    { action: 'load', uuid: tvhIds.frontend }, { action: 'save', node: { uuid: tvhIds.frontend, enabled: true, networks: [tvhIds.network] } },
    { action: 'network-create', class: 'mpegts_network_dvbs', conf: { networkname: 'Red' } },
    { action: 'mux-class', uuid: tvhIds.network }, { action: 'mux-create', uuid: tvhIds.network, conf: { frequency: 11000000 } },
    { action: 'scan', uuid: tvhIds.network }, { action: 'map-services', uuids: [tvhIds.service] }, { action: 'delete', uuid: tvhIds.mux },
  ]) assert.equal((await request('/api/tvh/action', 'POST', body)).status, 200, body.action);
  assert.ok(remote.calls.some(c => c.path === '/api/idnode/save' && c.params.node.networks[0] === tvhIds.network));
  assert.ok(remote.calls.some(c => c.path === '/api/service/mapper/save' && c.params.node.services[0] === tvhIds.service));
  assert.equal((await request('/api/tvh/action', 'POST', { action: 'shell', command: 'id' })).status, 400);
  assert.equal((await request('/api/tvh/action', 'POST', { action: 'save', node: { uuid: '../bad' } })).status, 400);
  assert.equal((await request('/api/tvh/resources/access')).status, 404);
  assert.equal((await request('/api/tvh/import', 'POST', { uuids: [] })).status, 400);
  assert.equal((await request('/api/tvh/import', 'POST', { uuids: ['0'.repeat(32)] })).status, 400);
});

test('token de reproducción no da acceso a credenciales ni administración del motor', async t => {
  const { request } = await fixture(t, { adminPassword: 'admin-long-password' });
  const token = 'playback-only-token-with-24-characters';
  for (const path of ['/api/tvh/settings', '/api/tvh/resources/hardware']) assert.equal((await request(path + '?token=' + token)).status, 401);
  assert.equal((await request('/api/tvh/settings?token=' + token, 'PUT', { url: '' })).status, 401);
  const login = await request('/api/session', 'POST', { password: 'admin-long-password' }); const Cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/tvh/settings', 'PUT', { url: '' }, { Cookie, Origin: 'https://evil.example' })).status, 403);
});

test('un origen Tvheadend sin datos termina con timeout en lugar de colgar clientes', { timeout: 5000 }, async t => {
  const { request, save } = await fixture(t, { streamIdle: true }); await save();
  await request('/api/tvh/import', 'POST', { uuids: [tvhIds.channel] });
  const [channel] = await (await request('/api/channels')).json();
  assert.equal((await request(`/stream/${channel.id}.ts`)).status, 502);
});
