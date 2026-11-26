import http from 'node:http';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

export const tvhIds = { hardware: 'a'.repeat(32), frontend: 'b'.repeat(32), channel: 'c'.repeat(32), service: 'd'.repeat(32), network: 'e'.repeat(32), mux: 'f'.repeat(32) };
export async function mockTvheadend({ auth = 'basic', username = 'tvh-admin', password = 'test-upstream-secret', streamIdle = false } = {}) {
  const calls = []; let streamConnections = 0;
  const packet = Buffer.alloc(188, 255); packet.set([0x47, 0x1f, 0xff, 0x10]);
  const channels = [{ uuid: tvhIds.channel, name: 'Canal de prueba DVB', number: 1, enabled: true, services: [tvhIds.service] }];
  const network = { uuid: tvhIds.network, networkname: 'Satélite de prueba', num_mux: 1, num_svc: 1, num_chn: 1 };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://tvh.test');
    const json = body => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    const basicOK = req.headers.authorization === 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    let digestOK = false;
    if (auth === 'digest' && req.headers.authorization?.startsWith('Digest ')) {
      const p = {};
      for (const m of req.headers.authorization.matchAll(/(\w+)=(?:"([^"]*)"|([^,\s]+))/g)) p[m[1]] = m[2] ?? m[3];
      const hash = text => createHash('sha256').update(text).digest('hex');
      const expected = hash(`${hash(`${username}:test-realm:${password}`)}:test-nonce:${p.nc}:${p.cnonce}:auth:${hash(`${req.method}:${p.uri}`)}`);
      digestOK = p.username === username && p.uri === url.pathname + url.search && p.response === expected;
    }
    // serverinfo can be anonymous on a real Tvheadend. Checking it alone must not validate credentials.
    if (url.pathname !== '/api/serverinfo' && auth !== 'none' && !(auth === 'digest' ? digestOK : basicOK)) {
      res.writeHead(401, { 'WWW-Authenticate': auth === 'digest' ? 'Digest realm="test-realm", nonce="test-nonce", algorithm=SHA-256, qop="auth,auth-int"' : 'Basic realm="tvh-test"' }); return res.end();
    }
    if (url.pathname.startsWith('/stream/channel/')) {
      streamConnections++;
      res.writeHead(200, { 'Content-Type': 'video/mp2t' }); res.flushHeaders();
      if (streamIdle) return;
      res.write(packet.subarray(0, 91));
      const first = setTimeout(() => res.write(packet.subarray(91)), 5);
      const timer = setInterval(() => res.write(packet), 20);
      res.on('close', () => { clearTimeout(first); clearInterval(timer); }); return;
    }
    let body = ''; for await (const chunk of req) body += chunk;
    const params = Object.fromEntries(new URLSearchParams(body));
    for (const key of ['node', 'conf', 'uuid']) if (params[key]?.startsWith('{') || params[key]?.startsWith('[')) params[key] = JSON.parse(params[key]);
    calls.push({ path: url.pathname, method: req.method, params });
    switch (url.pathname) {
      case '/api/serverinfo': return json({ name: 'Tvheadend test fixture', sw_version: 'test-only', capabilities: ['linuxdvb'] });
      case '/api/hardware/tree': return json(params.uuid === 'root' ? [{ id: tvhIds.hardware, text: 'TBS (fixture de prueba)', leaf: false }] : [{ id: tvhIds.frontend, text: 'DVB-S2 frontend (fixture)', leaf: true }]);
      case '/api/mpegts/network/grid': return json({ entries: [network], total: 1 });
      case '/api/mpegts/mux/grid': return json({ entries: [{ uuid: tvhIds.mux, network: network.networkname, frequency: 11000000, delsys: 'DVB-S2', scan_state: 'IDLE', scan_result: 'OK', num_svc: 1 }], total: 1 });
      case '/api/mpegts/service/grid': return json({ entries: [{ uuid: tvhIds.service, svcname: 'Servicio de prueba', provider: 'Fixture', network: network.networkname, mux: 'Mux de prueba', scrambled: false }], total: 1 });
      case '/api/channel/grid': return json({ entries: channels, total: channels.length });
      case '/api/epg/events/grid': return json({ entries: [{ eventId: 1, title: 'Programa de prueba', channelName: channels[0].name, start: Math.floor(Date.now() / 1000), stop: Math.floor(Date.now() / 1000) + 1800 }], totalCount: 1 });
      case '/api/status/inputs': return json({ entries: [{ input: 'Frontend fixture', stream: 'Mux fixture', subs: 1, bps: 1000, signal: 42000, snr: 30000, ber: 0, unc: 0 }], totalCount: 1 });
      case '/api/status/subscriptions': return json({ entries: [], totalCount: 0 });
      case '/api/status/connections': return json({ entries: [], totalCount: 0 });
      case '/api/mpegts/network/builders': return json({ entries: [{ class: 'mpegts_network_dvbs', caption: 'DVB-S2', props: [{ id: 'networkname', caption: 'Nombre de red', type: 'str', default: '' }] }] });
      case '/api/mpegts/network/mux_class': return json({ props: [{ id: 'frequency', caption: 'Frecuencia', type: 'int' }] });
      case '/api/idnode/load': return json({ entries: [{ uuid: params.uuid, params: [{ id: 'enabled', caption: 'Habilitado', type: 'bool', value: true }, { id: 'name', caption: 'Nombre', type: 'str', value: 'Nombre de prueba' }, { id: 'networks', caption: 'Redes', type: 'str', list: true, value: [tvhIds.network] }] }] });
      case '/api/idnode/save': case '/api/idnode/delete': case '/api/mpegts/network/create': case '/api/mpegts/network/mux_create': case '/api/mpegts/network/scan': case '/api/service/mapper/save': return json({ success: true });
      default: res.writeHead(404); return res.end();
    }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}`, calls, channels, packet, streamConnections: () => streamConnections, close: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
