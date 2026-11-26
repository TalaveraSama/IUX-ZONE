import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';

export const tvhResources = Object.freeze({
  hardware: 'hardware/tree', networks: 'mpegts/network/grid', muxes: 'mpegts/mux/grid',
  services: 'mpegts/service/grid', channels: 'channel/grid', epg: 'epg/events/grid',
  inputs: 'status/inputs', subscriptions: 'status/subscriptions', connections: 'status/connections',
  builders: 'mpegts/network/builders',
});
const uuidPattern = /^[a-f0-9]{32}$/i;
export const checkUuid = value => { if (typeof value !== 'string' || !uuidPattern.test(value)) throw Object.assign(new Error('UUID de Tvheadend inválido.'), { status: 400 }); return value; };
const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
const upstream = message => Object.assign(new Error(message), { status: 502 });
const digestHash = (algorithm, text) => createHash(algorithm).update(text).digest('hex');
const quote = text => '"' + String(text).replace(/["\\]/g, '\\$&') + '"';

export function digestAuthorization(challenge, username, password, method, uri) {
  const start = challenge.search(/\bDigest\s+/i);
  if (start < 0) throw upstream('Tvheadend no ofrece autenticación Digest compatible.');
  const fields = {};
  for (const match of challenge.slice(start + 7).matchAll(/([\w-]+)\s*=\s*(?:"((?:\\.|[^"])*)"|([^,\s]+))/g)) fields[match[1].toLowerCase()] = (match[2] ?? match[3]).replace(/\\(.)/g, '$1');
  const algorithm = (fields.algorithm || 'MD5').toUpperCase();
  const hashName = algorithm.startsWith('SHA-256') ? 'sha256' : algorithm.startsWith('MD5') ? 'md5' : null;
  if (!hashName || !['MD5', 'MD5-SESS', 'SHA-256', 'SHA-256-SESS'].includes(algorithm) || !fields.nonce || fields.realm === undefined) throw upstream('Variante Digest de Tvheadend no compatible. Usa MD5 o SHA-256.');
  const qop = fields.qop ? fields.qop.split(',').map(s => s.trim()).includes('auth') ? 'auth' : null : '';
  if (qop === null) throw upstream('Tvheadend requiere un modo Digest distinto de auth.');
  const cnonce = randomBytes(16).toString('hex'); const nc = '00000001';
  let ha1 = digestHash(hashName, `${username}:${fields.realm}:${password}`);
  if (algorithm.endsWith('-SESS')) ha1 = digestHash(hashName, `${ha1}:${fields.nonce}:${cnonce}`);
  const ha2 = digestHash(hashName, `${method}:${uri}`);
  const response = digestHash(hashName, qop ? `${ha1}:${fields.nonce}:${nc}:${cnonce}:${qop}:${ha2}` : `${ha1}:${fields.nonce}:${ha2}`);
  const pairs = [`username=${quote(username)}`, `realm=${quote(fields.realm)}`, `nonce=${quote(fields.nonce)}`, `uri=${quote(uri)}`, `response=${quote(response)}`, `algorithm=${algorithm}`];
  if (fields.opaque) pairs.push(`opaque=${quote(fields.opaque)}`);
  if (qop) pairs.push(`qop=auth`, `nc=${nc}`, `cnonce=${quote(cnonce)}`);
  else if (algorithm.endsWith('-SESS')) pairs.push(`cnonce=${quote(cnonce)}`);
  return 'Digest ' + pairs.join(', ');
}

export function validateTvhSettings(input, previous = {}) {
  const rawUrl = typeof input.url === 'string' ? input.url.trim() : '';
  if (!rawUrl) return { url: '', username: '', password: '' };
  let url;
  try { url = new URL(rawUrl); } catch { invalid('URL de Tvheadend inválida.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') invalid('Usa solo el origen de Tvheadend, por ejemplo http://192.168.1.10:9981, sin ruta ni credenciales.');
  const username = typeof input.username === 'string' ? input.username.trim() : '';
  const password = input.password === undefined ? (url.origin === previous.url ? previous.password || '' : '') : input.password;
  if (typeof password !== 'string' || password.length > 1024 || username.length > 200 || /[\r\n\x00]/.test(username + password) || username.includes(':')) invalid('Credenciales de Tvheadend inválidas.');
  return { url: url.origin, username, password };
}

export class TvheadendClient {
  constructor(dataDir, { timeout = 10000 } = {}) {
    this.file = join(dataDir, 'tvheadend.json'); this.timeout = timeout;
    this.settings = existsSync(this.file) ? validateTvhSettings(JSON.parse(readFileSync(this.file, 'utf8'))) : { url: '', username: '', password: '' };
  }
  publicSettings() { const { url, username, password } = this.settings; return { url, username, hasPassword: Boolean(password), configured: Boolean(url) }; }
  save(input) {
    const next = validateTvhSettings(input, this.settings);
    writeFileSync(this.file + '.tmp', JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    renameSync(this.file + '.tmp', this.file); this.settings = next;
    return this.publicSettings();
  }
  async open(path, { params = {}, signal, streaming = false, settings = this.settings } = {}) {
    if (!settings.url) throw Object.assign(new Error('Conecta un servidor Tvheadend en Configuración.'), { status: 409 });
    const url = new URL(path, settings.url);
    if (url.origin !== settings.url) invalid('Ruta de Tvheadend inválida.');
    const method = streaming ? 'GET' : 'POST';
    const body = streaming ? undefined : new URLSearchParams(Object.entries(params).map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]));
    if (streaming) url.searchParams.set('profile', 'pass');
    const timeout = AbortSignal.timeout(this.timeout);
    const requestSignal = signal ? streaming ? signal : AbortSignal.any([signal, timeout]) : timeout;
    const headers = { Accept: streaming ? 'video/mp2t' : 'application/json', 'Accept-Encoding': 'identity' };
    if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    let response;
    // A stream has an external inactivity timeout in RelayManager; do not time-limit its whole body.
    const connect = async authorization => {
      const options = { method, body, redirect: 'manual', headers: { ...headers, ...(authorization ? { Authorization: authorization } : {}) } };
      if (!streaming) return fetch(url, { ...options, signal: requestSignal });
      const controller = new AbortController();
      const abort = () => controller.abort(requestSignal.reason);
      requestSignal.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => controller.abort(), this.timeout); timer.unref();
      if (requestSignal.aborted) abort();
      try {
        return await fetch(url, { method, body, signal: controller.signal, redirect: 'manual', headers: { ...headers, ...(authorization ? { Authorization: authorization } : {}) } });
      } finally {
        clearTimeout(timer);
        // For streaming, keep external abort attached until the response body closes.
        if (!streaming) requestSignal.removeEventListener('abort', abort);
      }
    };
    try {
      response = await connect();
      if (response.status === 401 && settings.username) {
        const challenge = response.headers.get('www-authenticate') || '';
        await response.body?.cancel();
        const auth = /\bDigest\s/i.test(challenge) ? digestAuthorization(challenge, settings.username, settings.password, method, url.pathname + url.search) : /\bBasic\b/i.test(challenge) ? 'Basic ' + Buffer.from(`${settings.username}:${settings.password}`).toString('base64') : null;
        if (!auth) throw upstream('Método de autenticación de Tvheadend no compatible.');
        response = await connect(auth);
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw upstream([401, 403].includes(response.status) ? 'Tvheadend rechazó las credenciales o los permisos de esta operación.' : `Tvheadend respondió HTTP ${response.status}. No se siguen redirecciones.`);
      }
      return response;
    } catch (error) {
      if (error.status) throw error;
      throw upstream('No se pudo comunicar con Tvheadend. Revisa URL, red, TLS y tiempo de espera.');
    }
  }
  async call(path, params = {}, settings) {
    const response = await this.open('/api/' + path, { params, settings });
    if (!response.body) return { success: true };
    const reader = response.body.getReader(); let size = 0; const chunks = [];
    try {
      for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 8 * 1024 * 1024) throw upstream('Respuesta demasiado grande. Usa paginación.'); chunks.push(Buffer.from(value)); }
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) return { success: true };
      let result;
      try { result = JSON.parse(text); } catch { throw upstream('Tvheadend no devolvió JSON válido. Comprueba el puerto HTTP, normalmente 9981.'); }
      if (!result || typeof result !== 'object') throw upstream('Tvheadend devolvió una respuesta JSON inesperada.');
      if (result?.success === false || result?.error) throw upstream('Tvheadend no pudo completar la operación. Revisa permisos y parámetros.');
      return result;
    } catch (error) { await reader.cancel().catch(() => {}); throw error.status ? error : upstream('Lectura de Tvheadend interrumpida.'); }
  }
  async test(input) {
    const settings = input ? validateTvhSettings(input, this.settings) : this.settings;
    const result = await this.call('serverinfo', {}, settings);
    await this.call('hardware/tree', { uuid: 'root' }, settings);
    return { connected: true, name: result.servername || result.name || 'Tvheadend', version: result.sw_version || result.version || 'No informada', capabilities: result.capabilities || [] };
  }
  resource(name, query) {
    const path = tvhResources[name]; if (!path) throw Object.assign(new Error('Recurso de Tvheadend no permitido.'), { status: 404 });
    const params = { start: Math.max(0, Math.min(100000, Number(query.get('start')) || 0)), limit: Math.max(1, Math.min(500, Number(query.get('limit')) || 50)) };
    if (name === 'hardware') params.uuid = query.get('uuid') === 'root' || !query.get('uuid') ? 'root' : checkUuid(query.get('uuid'));
    if (query.get('query')) params.query = query.get('query').slice(0, 150);
    return this.call(path, params);
  }
  async action(input) {
    const object = value => { if (!value || Array.isArray(value) || typeof value !== 'object') invalid('Configuración inválida.'); return value; };
    switch (input.action) {
      case 'load': return this.call('idnode/load', { uuid: checkUuid(input.uuid), meta: 1 });
      case 'save': {
        const node = object(input.node); checkUuid(node.uuid);
        if (Object.keys(node).some(key => ['__proto__', 'constructor', 'prototype'].includes(key))) invalid('Propiedad inválida.');
        return this.call('idnode/save', { node });
      }
      case 'delete': return this.call('idnode/delete', { uuid: checkUuid(input.uuid) });
      case 'scan': return this.call('mpegts/network/scan', { uuid: checkUuid(input.uuid) });
      case 'network-create': {
        if (typeof input.class !== 'string' || !/^mpegts_network_[a-z0-9_]+$/.test(input.class)) invalid('Clase de red inválida.');
        return this.call('mpegts/network/create', { class: input.class, conf: object(input.conf) });
      }
      case 'mux-class': return this.call('mpegts/network/mux_class', { uuid: checkUuid(input.uuid) });
      case 'mux-create': return this.call('mpegts/network/mux_create', { uuid: checkUuid(input.uuid), conf: object(input.conf) });
      case 'map-services': {
        if (!Array.isArray(input.uuids) || !input.uuids.length || input.uuids.length > 100) invalid('Selecciona entre 1 y 100 servicios.');
        return this.call('service/mapper/save', { node: { services: input.uuids.map(checkUuid), check_availability: true, merge_same_name: true } });
      }
      default: throw Object.assign(new Error('Acción de Tvheadend no permitida.'), { status: 400 });
    }
  }
  stream(uuid, signal) { return this.open('/stream/channel/' + checkUuid(uuid), { streaming: true, signal }); }
}
