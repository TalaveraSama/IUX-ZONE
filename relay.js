import http from 'node:http';
import https from 'node:https';
import dgram from 'node:dgram';
import { isIP } from 'node:net';

export function validateSource(value) {
  const url = new URL(value);
  if (!['http:', 'https:', 'udp:', 'rtp:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error('Origen no admitido. Usa HTTP-TS, UDP-TS o RTP/MP2T sin credenciales ni fragmentos.');
  if (['udp:', 'rtp:'].includes(url.protocol)) {
    if (isIP(url.hostname) !== 4 || !url.port || Number(url.port) < 1024 || url.search || !['', '/'].includes(url.pathname)) throw new Error('UDP/RTP requiere IPv4 y puerto de 1024 a 65535, sin ruta ni parámetros.');
  } else if (/\.m3u8?$/i.test(url.pathname)) throw new Error('Las listas M3U/HLS no son una entrada MPEG-TS directa.');
  return url;
}

export function rtpPayload(packet) {
  if (packet.length < 12 || packet[0] >> 6 !== 2 || (packet[1] & 127) !== 33) return null;
  let offset = 12 + (packet[0] & 15) * 4;
  if (packet.length < offset) return null;
  if (packet[0] & 16) {
    if (packet.length < offset + 4) return null;
    offset += 4 + packet.readUInt16BE(offset + 2) * 4;
  }
  const padding = packet[0] & 32 ? packet.at(-1) : 0;
  if ((packet[0] & 32) && !padding) return null;
  const end = packet.length - padding;
  if (offset >= end) return null;
  return packet.subarray(offset, end);
}

const isTS = data => {
  if (!data.length || data.length % 188) return false;
  for (let index = 0; index < data.length; index += 188) if (data[index] !== 0x47) return false;
  return true;
};

export class RelayManager {
  constructor({ timeout = 15000, maxStreams = 32, maxClients = 256, maxClientBuffer = 2 * 1024 * 1024, multicastInterface = '' } = {}) {
    Object.assign(this, { timeout, maxStreams, maxClients, maxClientBuffer, multicastInterface });
    this.active = new Map(); this.history = new Map();
  }
  snapshot() {
    return [...this.history.values()].map(state => {
      const live = this.active.get(state.id);
      return { ...state, clients: live?.clients.size || 0 };
    });
  }
  attach(channel, res) {
    let session = this.active.get(channel.id);
    const totalClients = [...this.active.values()].reduce((sum, s) => sum + s.clients.size, 0);
    if (totalClients >= this.maxClients || (!session && this.active.size >= this.maxStreams)) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Capacidad de retransmisión alcanzada.'); return;
    }
    if (!session) {
      const state = { id: channel.id, state: 'connecting', startedAt: new Date().toISOString(), bytes: 0, droppedPackets: 0, error: null };
      this.history.set(channel.id, state);
      session = { clients: new Set(), state, request: null, input: null, socket: null, timer: null, stopped: false };
      this.active.set(channel.id, session);
    }
    session.clients.add(res);
    res.on('close', () => {
      session.clients.delete(res);
      if (!session.clients.size) this.finish(session);
    });
    if (session.clients.size === 1 && !session.started) {
      session.started = true;
      try { this.start(channel, session); }
      catch { this.finish(session, 'No se pudo abrir el origen.'); }
    }
  }
  broadcast(session, data) {
    if (session.stopped) return;
    session.state.state = 'streaming'; session.state.bytes += data.length;
    this.armTimer(session);
    for (const client of session.clients) {
      if (client.destroyed) continue;
      // A slow reader is disconnected; it must not stall others or grow memory indefinitely.
      if (client.writableLength + data.length > this.maxClientBuffer) { client.destroy(); continue; }
      if (!client.headersSent) client.writeHead(200, {
        'Content-Type': 'video/mp2t', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no',
      });
      client.write(data);
    }
  }
  armTimer(session) {
    clearTimeout(session.timer);
    session.timer = setTimeout(() => this.finish(session, 'El origen no entregó MPEG-TS durante el tiempo de espera.'), this.timeout);
    session.timer.unref();
  }
  start(channel, session) {
    const url = validateSource(channel.source);
    this.armTimer(session);
    if (['http:', 'https:'].includes(url.protocol)) return this.startHTTP(url, session, 0);
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: false });
    session.socket = socket;
    const multicast = Number(url.hostname.split('.')[0]) >= 224 && Number(url.hostname.split('.')[0]) <= 239;
    let sequence;
    socket.on('message', message => {
      let payload = message;
      if (url.protocol === 'rtp:') {
        payload = rtpPayload(message);
        if (!payload) return;
        const next = message.readUInt16BE(2);
        if (sequence !== undefined && next !== ((sequence + 1) & 65535)) session.state.droppedPackets++;
        sequence = next;
      }
      if (payload.length <= this.maxClientBuffer && isTS(payload)) this.broadcast(session, payload);
    });
    socket.on('error', () => this.finish(session, 'Error UDP/RTP. Comprueba dirección local, puerto e interfaz multicast.'));
    socket.bind(Number(url.port), multicast ? '0.0.0.0' : url.hostname, () => {
      if (session.stopped) return;
      if (multicast) {
        try { socket.addMembership(url.hostname, this.multicastInterface || undefined); }
        catch { this.finish(session, 'No se pudo unir al grupo multicast.'); }
      }
    });
  }
  startHTTP(url, session, redirects) {
    const fail = message => this.finish(session, message);
    const request = (url.protocol === 'https:' ? https : http).get(url, {
      headers: { 'User-Agent': 'iux-zone/0.1.0', Accept: 'video/mp2t, application/octet-stream', 'Accept-Encoding': 'identity' },
    }, input => {
      if (session.stopped) { input.destroy(); return; }
      session.input = input;
      if ([301, 302, 303, 307, 308].includes(input.statusCode)) {
        const location = input.headers.location;
        input.destroy();
        if (!location || redirects >= 3) return fail('Redirección del origen inválida o excesiva.');
        try {
          const target = validateSource(new URL(location, url).href);
          if (!['http:', 'https:'].includes(target.protocol)) throw new Error();
          this.startHTTP(target, session, redirects + 1);
        } catch { fail('Redirección del origen no admitida.'); }
        return;
      }
      if (input.statusCode !== 200 || (input.headers['content-encoding'] && input.headers['content-encoding'] !== 'identity')) {
        input.destroy(); return fail('El origen rechazó la conexión o entregó contenido comprimido.');
      }
      let pending = Buffer.alloc(0);
      input.on('data', data => {
        if (session.stopped) return;
        const buffer = pending.length ? Buffer.concat([pending, data]) : data;
        const length = Math.floor(buffer.length / 188) * 188;
        pending = buffer.subarray(length);
        if (!length) return;
        const packets = buffer.subarray(0, length);
        // Keep all viewers packet-aligned, even when HTTP chunks split TS packets.
        if (!isTS(packets)) return fail('La respuesta no parece MPEG-TS de paquetes de 188 bytes.');
        this.broadcast(session, packets);
      });
      input.on('end', () => fail('La conexión del origen terminó.'));
      input.on('error', () => fail('Se interrumpió la lectura del origen.'));
      input.on('aborted', () => fail('El origen cerró la conexión inesperadamente.'));
    });
    session.request = request;
    request.setTimeout(this.timeout, () => fail('Tiempo de espera del origen agotado.'));
    request.on('error', () => { if (!session.stopped) fail('No se pudo conectar al origen HTTP/HTTPS.'); });
  }
  finish(session, error = null) {
    if (!session.stopped && this.active.get(session.state.id) === session) this.stop(session.state.id, error);
  }
  stop(id, error = null) {
    const session = this.active.get(id);
    if (!session) return;
    this.active.delete(id); session.stopped = true;
    clearTimeout(session.timer);
    session.state.state = error ? 'error' : 'idle'; session.state.error = error;
    session.state.stoppedAt = new Date().toISOString();
    session.request?.destroy(); session.input?.destroy();
    try { session.socket?.close(); } catch { /* socket may not have bound yet */ }
    for (const client of session.clients) {
      if (!client.headersSent) {
        client.writeHead(error ? 502 : 503, { 'Content-Type': 'text/plain; charset=utf-8' });
        client.end(error || 'Retransmisión detenida.');
      } else client.destroy();
    }
    session.clients.clear();
  }
  forget(id) { this.stop(id); this.history.delete(id); }
  close() { for (const id of this.active.keys()) this.stop(id); }
}
