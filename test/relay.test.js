import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import dgram from 'node:dgram';
import { once, EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createApp } from '../server.js';
import { validateSource, rtpPayload, RelayManager } from '../relay.js';

const packet = Buffer.alloc(188, 0xff);
packet.set([0x47, 0x1f, 0xff, 0x10]); // Valid TS null-packet framing (not an audiovisual programme).
const chunk = Buffer.concat([packet, packet, packet]);

async function setup(t, options = {}) {
  let connections = 0;
  const origin = http.createServer((req, res) => {
    if (req.url === '/redirect') { res.writeHead(302, { Location: '/ts' }); return res.end(); }
    if (req.url === '/loop') { res.writeHead(302, { Location: '/loop' }); return res.end(); }
    if (req.url === '/html') return res.end('<html>' + 'x'.repeat(500) + '</html>');
    if (req.url === '/split') {
      res.writeHead(200, { 'Content-Type': 'video/mp2t' });
      res.write(chunk.subarray(0, 97));
      const timer = setTimeout(() => {
        res.write(chunk.subarray(97));
        const repeat = setInterval(() => res.write(chunk), 20);
        res.on('close', () => clearInterval(repeat));
      }, 20);
      res.on('close', () => clearTimeout(timer)); return;
    }
    if (req.url === '/denied') { res.writeHead(403); return res.end(); }
    connections++;
    res.writeHead(200, { 'Content-Type': 'video/mp2t' });
    res.write(chunk);
    const timer = setInterval(() => res.write(chunk), 20);
    res.on('close', () => clearInterval(timer));
  });
  origin.listen(0, '127.0.0.1'); await once(origin, 'listening');
  const source = `http://127.0.0.1:${origin.address().port}`;
  const dataDir = mkdtempSync(join(tmpdir(), 'iux-relay-'));
  const app = createApp({ dataDir, password: '', production: false, ...options });
  app.listen(0, '127.0.0.1'); await once(app, 'listening');
  const base = `http://127.0.0.1:${app.address().port}`;
  const request = (path, method = 'GET', body, headers = {}) => fetch(base + path, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const add = async (url = source + '/ts', headers = {}) => {
    const response = await request('/api/channels', 'POST', { name: 'Relay test', source: url }, headers);
    assert.equal(response.status, 201); return response.json();
  };
  t.after(async () => {
    app.shutdownRelay(); app.closeAllConnections(); origin.closeAllConnections();
    await Promise.all([new Promise(resolve => app.close(resolve)), new Promise(resolve => origin.close(resolve))]);
    rmSync(dataDir, { recursive: true, force: true });
  });
  return { request, add, base, source, connections: () => connections };
}

async function readPacket(response) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /video\/mp2t/);
  const reader = response.body.getReader();
  const { value } = await reader.read();
  assert.ok(value.length >= 188); assert.deepEqual(Buffer.from(value.subarray(0, 188)), packet);
  return reader;
}

test('HTTP-TS: comparte un origen entre clientes y libera al desconectar', { timeout: 5000 }, async t => {
  const { request, add, connections } = await setup(t);
  const channel = await add();
  const first = await readPacket(await request(`/stream/${channel.id}.ts`));
  const second = await readPacket(await request(`/stream/${channel.id}.ts`));
  assert.equal(connections(), 1);
  const metrics = await (await request('/api/relay')).json();
  assert.equal(metrics[0].clients, 2); assert.ok(metrics[0].bytes >= 188);
  assert.equal(metrics[0].state, 'streaming');
  await first.cancel(); await second.cancel();
  await delay(60);
  const stopped = await (await request('/api/relay')).json();
  assert.equal(stopped[0].clients, 0); assert.equal(stopped[0].state, 'idle');
  // A fresh viewer reconnects rather than leaving a dead upstream session.
  const fresh = await readPacket(await request(`/stream/${channel.id}.ts`));
  assert.equal(connections(), 2); await fresh.cancel();
});

test('token de reproducción no permite administrar ni revelar URLs originales', { timeout: 5000 }, async t => {
  const token = 'stream-secret-with-at-least-24-characters';
  const { request, add } = await setup(t, { password: 'admin-strong-password', streamToken: token, publicUrl: 'https://tv.example.com' });
  const login = await request('/api/session', 'POST', { password: 'admin-strong-password' });
  const Cookie = login.headers.get('set-cookie').split(';')[0];
  const channel = await add(undefined, { Cookie });
  assert.equal((await request(`/stream/${channel.id}.ts`)).status, 401);
  assert.equal((await request(`/stream/${channel.id}.ts?token=wrong`)).status, 401);
  assert.equal((await request(`/api/channels?token=${token}`)).status, 401);
  const exported = await (await request(`/playlist.m3u?token=${token}`)).text();
  assert.ok(exported.includes(`https://tv.example.com/stream/${channel.id}.ts?token=${token}`));
  assert.equal((await request(`/playlist.m3u?direct=1&token=${token}`)).status, 403);
  const reader = await readPacket(await request(`/stream/${channel.id}.ts?token=${token}`));
  await reader.cancel();
  await request(`/api/channels/${channel.id}`, 'PATCH', { enabled: false }, { Cookie });
  assert.equal((await request(`/stream/${channel.id}.ts?token=${token}`)).status, 404);
});

test('maneja redirects, errores HTTP, no-TS y bucles sin entregar falso video', { timeout: 5000 }, async t => {
  const { request, add, source } = await setup(t);
  const redirected = await add(source + '/redirect');
  const reader = await readPacket(await request(`/stream/${redirected.id}.ts`)); await reader.cancel();
  for (const suffix of ['/html', '/denied', '/loop']) {
    const channel = await add(source + suffix);
    const response = await request(`/stream/${channel.id}.ts`);
    assert.equal(response.status, 502, suffix); await response.text();
  }
  const metrics = await (await request('/api/relay')).json();
  assert.ok(metrics.some(m => m.state === 'error' && m.error));
});

for (const protocol of ['udp', 'rtp']) {
  test(`${protocol.toUpperCase()}: recibe datagramas reales y retransmite MPEG-TS por HTTP`, { timeout: 5000 }, async t => {
    const { request, add } = await setup(t);
    const probe = dgram.createSocket('udp4'); probe.bind(0, '127.0.0.1'); await once(probe, 'listening');
    const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
    const channel = await add(`${protocol}://127.0.0.1:${port}`);
    const sender = dgram.createSocket('udp4');
    let seq = 0;
    const timer = setInterval(() => {
      let data = chunk;
      if (protocol === 'rtp') {
        const header = Buffer.alloc(12); header[0] = 0x80; header[1] = 33; header.writeUInt16BE(seq++ & 65535, 2);
        data = Buffer.concat([header, chunk]);
      }
      sender.send(data, port, '127.0.0.1');
    }, 20);
    try {
      const reader = await readPacket(await request(`/stream/${channel.id}.ts`)); await reader.cancel();
    } finally { clearInterval(timer); sender.close(); }
  });
}

test('límites de capacidad y timeout no dejan entradas activas eternamente', { timeout: 5000 }, async t => {
  const { request, add } = await setup(t, { relayOptions: { timeout: 150, maxClients: 1, maxStreams: 1 } });
  const active = await add();
  const reader = await readPacket(await request(`/stream/${active.id}.ts`));
  assert.equal((await request(`/stream/${active.id}.ts`)).status, 503);
  await reader.cancel(); await delay(40);
  const silent = await add('udp://127.0.0.1:49381');
  const response = await request(`/stream/${silent.id}.ts`);
  assert.equal(response.status, 502);
  assert.match(await response.text(), /tiempo de espera/);
});

test('validación RTP y URLs rechaza formatos o destinos no compatibles', () => {
  for (const url of ['http://example.com/a.m3u8', 'udp://example.com:5000', 'udp://127.0.0.1:80', 'rtp://239.1.1.1:1234/path', 'http://example.com/#secret']) assert.throws(() => validateSource(url));
  assert.equal(rtpPayload(Buffer.alloc(4)), null);
  const header = Buffer.alloc(12); header[0] = 0x80; header[1] = 33;
  assert.deepEqual(rtpPayload(Buffer.concat([header, packet])), packet);
  header[0] = 0xb0; // extension plus padding, but no extension payload
  assert.equal(rtpPayload(header), null);
});

test('un cliente lento se desconecta sin detener otros ni acumular memoria sin límite', () => {
  const manager = new RelayManager({ maxClientBuffer: 1024 });
  let slowClosed = false; let received = 0;
  const slow = { destroyed: false, writableLength: 1024, destroy() { slowClosed = true; } };
  const fast = { destroyed: false, writableLength: 0, headersSent: true, write(data) { received += data.length; } };
  const session = { clients: new Set([slow, fast]), state: { id: 'test', bytes: 0 }, stopped: false };
  manager.broadcast(session, chunk); clearTimeout(session.timer);
  assert.equal(slowClosed, true); assert.equal(received, chunk.length);
});


test('HTTP con paquetes divididos entre chunks mantiene sincronización TS', { timeout: 5000 }, async t => {
  const { request, add, source } = await setup(t);
  const channel = await add(source + '/split');
  const reader = await readPacket(await request(`/stream/${channel.id}.ts`));
  await reader.cancel();
});

test('deshabilitar o cambiar origen cierra la sesión activa', { timeout: 5000 }, async t => {
  const { request, add, source } = await setup(t);
  const channel = await add();
  const reader = await readPacket(await request(`/stream/${channel.id}.ts`));
  await request(`/api/channels/${channel.id}`, 'PATCH', { source: source + '/redirect' });
  const metrics = await (await request('/api/relay')).json();
  assert.equal(metrics[0].clients, 0); assert.equal(metrics[0].state, 'idle');
  await reader.cancel().catch(() => {});
  const next = await readPacket(await request(`/stream/${channel.id}.ts`));
  await request(`/api/channels/${channel.id}`, 'PATCH', { enabled: false });
  assert.equal((await request(`/stream/${channel.id}.ts`)).status, 404);
  await next.cancel().catch(() => {});
});

test('eventos tardíos de clientes antiguos no cierran una sesión nueva', () => {
  class Client extends EventEmitter {
    headersSent = false;
    writeHead() { this.headersSent = true; }
    end() {}
    destroy() {}
  }
  const manager = new RelayManager(); manager.start = () => {};
  const channel = { id: 'same-channel', source: 'http://example.com/ts' };
  const oldClient = new Client(); manager.attach(channel, oldClient);
  const oldSession = manager.active.get(channel.id);
  manager.stop(channel.id);
  const currentClient = new Client(); manager.attach(channel, currentClient);
  oldClient.emit('close'); manager.finish(oldSession, 'old timeout');
  assert.equal(manager.active.get(channel.id).clients.has(currentClient), true);
  manager.close();
});
