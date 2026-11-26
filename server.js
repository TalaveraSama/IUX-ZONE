import http from 'node:http';
import { RelayManager, validateSource } from './relay.js';
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const protocols = new Set(['http:', 'https:', 'udp:', 'rtp:']);
const clean = (value, max = 150) => typeof value === 'string' ? value.trim().replace(/[\r\n\x00-\x1f\x7f]/g, '').slice(0, max) : '';
const hash = value => createHash('sha256').update(value).digest();

export function validateChannel(input) {
  const name = clean(input.name);
  if (!name) throw new Error('Escribe un nombre para el canal.');
  const source = clean(input.source, 2048);
  let url;
  try { url = new URL(source); } catch { throw new Error('La URL de origen no es válida.'); }
  if (!protocols.has(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('Usa HTTP, HTTPS, UDP o RTP sin credenciales en la URL.');
  }
  validateSource(source);
  const logo = clean(input.logo, 2048);
  if (logo) {
    let parsed;
    try { parsed = new URL(logo); } catch { throw new Error('La URL del logo no es válida.'); }
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('El logo debe usar HTTP o HTTPS sin credenciales.');
  }
  if (input.enabled !== undefined && typeof input.enabled !== 'boolean') throw new Error('Estado inválido.');
  return { name, source, group: clean(input.group) || 'General', tvgId: clean(input.tvgId), logo, enabled: input.enabled ?? true };
}

export function makePlaylist(channels, sourceFor = channel => channel.source) {
  const attr = value => String(value).replace(/["\r\n]/g, '');
  return '#EXTM3U\n' + channels.filter(c => c.enabled).map(c =>
    `#EXTINF:-1 tvg-id="${attr(c.tvgId)}" tvg-name="${attr(c.name)}" tvg-logo="${attr(c.logo)}" group-title="${attr(c.group)}",${c.name}\n${sourceFor(c)}\n`
  ).join('');
}

export function createApp({ dataDir = process.env.DATA_DIR || join(root, 'data'), password = process.env.ADMIN_PASSWORD || '', production = process.env.NODE_ENV === 'production', streamToken = process.env.STREAM_TOKEN || '', publicUrl = process.env.PUBLIC_URL || '', relayOptions = {} } = {}) {
  if (production && password.length < 12) throw new Error('En producción configura ADMIN_PASSWORD con al menos 12 caracteres.');
  if (streamToken && streamToken.length < 24) throw new Error('STREAM_TOKEN requiere al menos 24 caracteres.');
  if (publicUrl) {
    const parsed = new URL(publicUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('PUBLIC_URL debe ser un origen HTTP/HTTPS sin ruta ni credenciales.');
  }
  const relay = new RelayManager({ multicastInterface: process.env.MULTICAST_INTERFACE || '', ...relayOptions });
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const file = join(dataDir, 'channels.json');
  let channels = [];
  if (existsSync(file)) {
    const stored = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(stored)) throw new Error('channels.json debe contener una lista.');
    const ids = new Set();
    channels = stored.map(c => {
      if (typeof c.id !== 'string' || ids.has(c.id)) throw new Error('Identificador de canal inválido o duplicado.');
      ids.add(c.id);
      return { ...validateChannel(c), id: c.id, createdAt: c.createdAt, updatedAt: c.updatedAt };
    });
  }
  const sessions = new Map();
  const attempts = new Map();
  const startedAt = new Date().toISOString();
  function save(next) {
    writeFileSync(file + '.tmp', JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    renameSync(file + '.tmp', file);
    channels = next;
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (production) res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    // Development can be embedded in the workspace's live preview; production cannot.
    res.setHeader('Content-Security-Policy', `default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' https: http: data:; frame-ancestors ${production ? "'self'" : '*'}`);
    res.setHeader('Cache-Control', 'no-store');
    const reply = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    try {
      const requestUrl = new URL(req.url, 'http://internal');
      const path = requestUrl.pathname;
      const write = !['GET', 'HEAD'].includes(req.method);
      if (write && req.headers.origin) {
        let originHost;
        try { originHost = new URL(req.headers.origin).host; } catch { return reply(403, { error: 'Origen no permitido.' }); }
        if (originHost !== req.headers.host) return reply(403, { error: 'Origen no permitido.' });
      }
      const readBody = async () => {
        if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('Se requiere JSON.'), { status: 415 });
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 16384) throw Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 });
        }
        try {
          const parsed = JSON.parse(body);
          if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
          return parsed;
        } catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
      };
      const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('iux_session='))?.slice(12);
      const authenticated = !password || (sessions.get(cookie) || 0) > Date.now();
      if (path === '/api/session' && req.method === 'GET') return reply(200, { authenticated, authRequired: Boolean(password) });
      if (path === '/api/session' && req.method === 'POST') {
        const ip = req.socket.remoteAddress;
        const now = Date.now();
        for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
        for (const [key, expiry] of sessions) if (expiry < now) sessions.delete(key);
        const attempt = attempts.get(ip) || { count: 0, until: now + 900000 };
        if (attempt.count >= 10) return reply(429, { error: 'Demasiados intentos. Espera 15 minutos.' });
        const body = await readBody();
        if (password && !timingSafeEqual(hash(String(body.password || '')), hash(password))) {
          attempt.count++; attempts.set(ip, attempt);
          return reply(401, { error: 'Contraseña incorrecta.' });
        }
        attempts.delete(ip);
        const token = randomBytes(32).toString('hex');
        sessions.set(token, now + 8 * 3600000);
        res.setHeader('Set-Cookie', `iux_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${production ? '; Secure' : ''}`);
        return reply(200, { authenticated: true });
      }
      if (path === '/api/session' && req.method === 'DELETE') {
        sessions.delete(cookie);
        res.setHeader('Set-Cookie', 'iux_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return reply(200, { ok: true });
      }
      const suppliedToken = requestUrl.searchParams.get('token') || '';
      const tokenAccess = Boolean(streamToken) && timingSafeEqual(hash(suppliedToken), hash(streamToken));
      const playbackAccess = authenticated || tokenAccess;
      const streamMatch = path.match(/^\/stream\/([a-f0-9-]+)\.ts$/);
      if (streamMatch && req.method === 'GET') {
        if (!playbackAccess) return reply(401, { error: 'Token de reproducción o sesión requerido.' });
        const channel = channels.find(c => c.id === streamMatch[1]);
        if (!channel || !channel.enabled) return reply(404, { error: 'Canal no disponible.' });
        relay.attach(channel, res); return;
      }
      if ((path.startsWith('/api/') || (path === '/playlist.m3u' && !tokenAccess)) && !authenticated) return reply(401, { error: 'Inicia sesión para continuar.' });
      if (path === '/api/system' && req.method === 'GET') return reply(200, {
        name: 'iux-zone', version: '0.1.0', startedAt, authRequired: Boolean(password),
        capabilities: { channelManagement: true, m3uExport: true, relay: true, dvb: false, epg: false },
      });
      if (path === '/api/relay' && req.method === 'GET') return reply(200, relay.snapshot());
      if (path === '/api/playback' && req.method === 'GET') {
        const base = publicUrl || `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
        const url = new URL('/playlist.m3u', base);
        if (streamToken) url.searchParams.set('token', streamToken);
        return reply(200, { playlistUrl: url.href, tokenConfigured: Boolean(streamToken), sessionOnly: Boolean(password) && !streamToken });
      }
      if (path === '/api/channels' && req.method === 'GET') return reply(200, channels);
      if (path === '/api/channels' && req.method === 'POST') {
        if (channels.length >= 10000) return reply(409, { error: 'Límite de 10 000 canales alcanzado.' });
        let channel;
        try { channel = validateChannel(await readBody()); } catch (err) { return reply(err.status || 400, { error: err.message }); }
        channel = { ...channel, id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        save([...channels, channel]);
        return reply(201, channel);
      }
      const match = path.match(/^\/api\/channels\/([a-f0-9-]+)$/);
      if (match && ['PATCH', 'DELETE'].includes(req.method)) {
        const existing = channels.find(c => c.id === match[1]);
        if (!existing) return reply(404, { error: 'Canal no encontrado.' });
        if (req.method === 'DELETE') { save(channels.filter(c => c.id !== existing.id)); relay.forget(existing.id); return reply(200, { ok: true }); }
        let updated;
        try { updated = { ...existing, ...validateChannel({ ...existing, ...await readBody() }), updatedAt: new Date().toISOString() }; }
        catch (err) { return reply(err.status || 400, { error: err.message }); }
        save(channels.map(c => c.id === existing.id ? updated : c));
        if (!updated.enabled || updated.source !== existing.source) relay.stop(existing.id);
        return reply(200, updated);
      }
      if (path === '/playlist.m3u' && req.method === 'GET') {
        const base = publicUrl || `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
        const direct = requestUrl.searchParams.get('direct') === '1';
        if (direct && !authenticated) return reply(403, { error: 'Solo el administrador puede exportar orígenes.' });
        res.writeHead(200, { 'Content-Type': 'audio/x-mpegurl; charset=utf-8', 'Content-Disposition': 'attachment; filename="iux-zone.m3u"' });
        return res.end(makePlaylist(channels, channel => {
          if (direct) return channel.source;
          const url = new URL(`/stream/${channel.id}.ts`, base);
          if (streamToken) url.searchParams.set('token', streamToken);
          return url.href;
        }));
      }
      const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'], '/favicon.svg': ['favicon.svg', 'image/svg+xml'] };
      if (assets[path] && ['GET', 'HEAD'].includes(req.method)) {
        const [name, type] = assets[path];
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
        return res.end(req.method === 'HEAD' ? undefined : readFileSync(join(root, 'public', name)));
      }
      reply(404, { error: 'Ruta no encontrada.' });
    } catch (err) {
      console.error('Request failed:', err.message);
      if (!res.headersSent) reply(err.status || 500, { error: err.status ? err.message : 'Error interno. No se pudo completar la operación.' });
      else res.end();
    }
  });
  server.shutdownRelay = () => relay.close();
  server.on('close', () => relay.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApp();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  server.listen(port, host, () => {
    console.log(`iux-zone disponible en ${host}:${port}`);
    if (!process.env.ADMIN_PASSWORD) console.warn('MODO DESARROLLO: sin contraseña. No publicar en Internet. Configura ADMIN_PASSWORD.');
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { server.shutdownRelay(); server.close(() => process.exit(0)); });
}
