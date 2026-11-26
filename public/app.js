const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let channels = [];
let relayStates = [];
let filter = 'all';
let view = 'overview';
let deleteId = null;
let toastTimer;
const views = {
  overview: ['Vista general', 'Tu cabecera, en un vistazo', 'Un solo lugar para organizar tus canales y sus fuentes.'],
  channels: ['Canales', 'Cada canal, bajo tu control', 'Agrega, organiza y administra tus fuentes de contenido.'],
  playlist: ['Lista M3U', 'Tu biblioteca, sin fronteras', 'Exporta tus canales para usarlos en tu reproductor.'],
  system: ['Sistema', 'Conoce tu iux-zone', 'Capacidades reales, sin métricas simuladas.'],
  'tvh-dashboard': ['Cabecera DVB', 'El control empieza en la señal', 'Tu motor Tvheadend y tu distribución, en un mismo workspace.'],
  'tvh-hardware': ['Adaptadores / TBS', 'El origen de tu señal', 'Hardware detectado por Tvheadend. No se simulan sintonizadores.'],
  'tvh-networks': ['Redes y frecuencias', 'Encuentra tu próxima señal', 'Redes DVB, multiplexes y exploración de servicios.'],
  'tvh-services': ['Servicios y canales', 'Del servicio al canal', 'Mapea servicios en Tvheadend e impórtalos a tu biblioteca.'],
  'tvh-epg': ['Guía EPG', 'Lo que viene, en pantalla', 'Programación recibida por tu motor Tvheadend.'],
  'tvh-activity': ['Actividad en vivo', 'La señal, en movimiento', 'Entradas, suscripciones y conexiones observadas en Tvheadend.'],
  'tvh-settings': ['Conexión al motor', 'Conecta tu cabecera', 'Credenciales protegidas en el servidor, nunca en el reproductor.'],
};

function toast(message, error = false) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.toggle('toast-error', error);
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
function showLogin() {
  document.dispatchEvent(new Event('iux:logout'));
  $('#subscription-url').value = ''; $('#subscription-label').hidden = true;
  $('#playlist-preview').textContent = '';
  $('#app').hidden = true;
  $('#login').hidden = false;
  $$('dialog[open]').forEach(d => d.close());
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  if (response.status === 401 && url !== '/api/session') showLogin();
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'No se pudo completar la solicitud.');
  }
  return response.json();
}
function setView(next) {
  if (!views[next]) return;
  view = next;
  const [label, title, description] = views[next];
  $('#breadcrumb').textContent = label;
  const dot = document.createElement('span'); dot.textContent = '.';
  $('#page-title').replaceChildren(document.createTextNode(title), dot);
  $('#page-description').textContent = description;
  $('#overview-view').hidden = next !== 'overview';
  $('#channel-section').hidden = !['overview', 'channels'].includes(next);
  $('#playlist-view').hidden = next !== 'playlist';
  $('#system-view').hidden = next !== 'system';
  $('#tvh-view').hidden = !next.startsWith('tvh-');
  document.dispatchEvent(new CustomEvent('iux:view', { detail: next }));
  $('#add-channel').hidden = !['overview', 'channels'].includes(next);
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === next));
  localStorage.setItem('iux-view', next);
}
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function render() {
  const enabled = channels.filter(c => c.enabled).length;
  const http = channels.filter(c => ['http:', 'https:', 'tvh:'].includes(new URL(c.source).protocol)).length;
  $('#stat-total').textContent = channels.length;
  $('#stat-enabled').textContent = enabled;
  $('#stat-http').textContent = http;
  $('#stat-groups').textContent = new Set(channels.map(c => c.group)).size;
  $('#nav-count').textContent = channels.length;
  $('#table-count').textContent = channels.length;
  $('#all-count').textContent = channels.length;
  $('#ring-total').textContent = channels.length;
  $('#legend-http').textContent = http;
  $('#legend-udp').textContent = channels.length - http;
  const percent = channels.length ? http / channels.length * 100 : 0;
  $('#protocol-ring').style.background = channels.length ? `conic-gradient(#b4f374 ${percent}%, #82b7d1 ${percent}% 100%)` : '#2b3335';
  const term = $('#search').value.trim().toLocaleLowerCase();
  const filtered = channels.filter(c =>
    (filter === 'all' || c.enabled === (filter === 'enabled')) &&
    `${c.name} ${c.group} ${c.source}`.toLocaleLowerCase().includes(term));
  $('#channel-rows').replaceChildren(...filtered.map(channelRow));
  renderRelay();
  $('#empty-state').hidden = filtered.length > 0;
  $('#empty-state h3').textContent = channels.length ? 'No hay coincidencias.' : 'Todo empieza con una señal.';
  $('#empty-state p').textContent = channels.length ? 'Prueba con otra búsqueda o cambia el filtro.' : 'Agrega tu primer canal y empieza a organizar tu cabecera.';
  $('#empty-add').hidden = channels.length > 0;
  $('#table-summary').textContent = `${filtered.length} de ${channels.length} canales · ${enabled} habilitados`;
  $('#playlist-preview').hidden = true;
}
function channelRow(channel) {
  const row = el('tr');
  const nameCell = el('td');
  const nameWrap = el('div', 'channel-name');
  const initials = channel.name.split(/\s+/).slice(0, 2).map(s => [...s][0]).join('').toLocaleUpperCase();
  const title = el('div');
  title.append(el('strong', '', channel.name), el('small', '', channel.tvgId || 'Sin ID de guía'));
  nameWrap.append(el('span', 'channel-monogram', initials), title); nameCell.append(nameWrap);
  const source = el('td', 'source-cell');
  const url = new URL(channel.source);
  // Avoid exposing query tokens in the table; full URL is only in the edit form / export.
  source.append(el('span', 'protocol-tag', url.protocol.slice(0, -1).toUpperCase()), el('span', 'source-url', `${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}`));
  const group = el('td'); group.append(el('span', 'group-tag', channel.group));
  const state = el('td'); const toggleWrap = el('div', 'toggle-wrap');
  const toggle = el('button', 'toggle-button');
  toggle.type = 'button'; toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', String(channel.enabled));
  toggle.setAttribute('aria-label', `Incluir ${channel.name} en la lista M3U`);
  toggle.addEventListener('click', async () => {
    toggle.disabled = true;
    try { await api(`/api/channels/${channel.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !channel.enabled }) }); await loadChannels(); toast('Estado del canal actualizado.'); }
    catch (err) { toast(err.message, true); }
    finally { toggle.disabled = false; }
  });
  toggleWrap.append(toggle, el('span', '', channel.enabled ? 'Sí' : 'No')); state.append(toggleWrap);
  const actions = el('td'); const actionWrap = el('div', 'row-actions');
  const edit = el('button', 'icon-button', '✎'); edit.type = 'button'; edit.title = `Editar ${channel.name}`; edit.setAttribute('aria-label', edit.title);
  edit.addEventListener('click', () => openChannel(channel));
  const remove = el('button', 'icon-button delete-button', '×'); remove.type = 'button'; remove.title = `Eliminar ${channel.name}`; remove.setAttribute('aria-label', remove.title);
  remove.addEventListener('click', () => {
    deleteId = channel.id;
    $('#delete-description').textContent = `Se eliminará «${channel.name}» de tu biblioteca y de la lista M3U.`;
    $('#delete-error').textContent = '';
    $('#delete-dialog').showModal();
  });
  actionWrap.append(edit, remove); actions.append(actionWrap);
  const relayCell = el('td', 'relay-cell'); relayCell.dataset.channelId = channel.id;
  row.append(nameCell, source, group, state, relayCell, actions);
  return row;
}
function renderRelay() {
  const labels = { idle: 'Sin demanda', connecting: 'Conectando', streaming: 'Retransmitiendo', error: 'Error de origen' };
  $$('.relay-cell').forEach(cell => {
    const state = relayStates.find(s => s.id === cell.dataset.channelId);
    const status = state?.state || 'idle';
    const title = el('span', `relay-status relay-${status}`, labels[status]);
    const detail = el('small', 'source-url', `${state?.clients || 0} clientes · ${((state?.bytes || 0) / 1048576).toFixed(2)} MiB recibidos`);
    cell.title = state?.error || 'Estado del relay bajo demanda. MiB recibidos en la última sesión.';
    cell.replaceChildren(title, detail);
  });
  $('#relay-streams').textContent = relayStates.filter(s => s.state === 'streaming').length;
  $('#relay-clients').textContent = relayStates.reduce((n, s) => n + s.clients, 0);
}
async function refreshRelay() {
  relayStates = await api('/api/relay'); renderRelay();
  $('#relay-updated').textContent = '· actualizado ' + new Date().toLocaleTimeString();
}
async function loadChannels() {
  const [list, metrics] = await Promise.all([api('/api/channels'), api('/api/relay')]);
  channels = list; relayStates = metrics; render();
  $('#relay-updated').textContent = '· actualizado ' + new Date().toLocaleTimeString();
}
function openChannel(channel) {
  $('#channel-form').reset();
  for (const key of ['id', 'name', 'source', 'group', 'tvgId', 'logo']) $('#channel-form').elements[key].value = channel?.[key] || '';
  $('#channel-form').elements.enabled.checked = channel?.enabled ?? true;
  $('#modal-title').textContent = channel ? 'Editar canal' : 'Nuevo canal';
  $('#form-error').textContent = '';
  $('#channel-dialog').showModal();
  $('#channel-form').elements.name.focus();
}
async function getPlaylist() {
  const response = await fetch('/playlist.m3u');
  if (!response.ok) {
    if (response.status === 401) showLogin();
    throw new Error('No se pudo obtener la lista. Comprueba tu sesión.');
  }
  return response.text();
}
async function downloadPlaylist() {
  try {
    const text = await getPlaylist();
    const url = URL.createObjectURL(new Blob([text], { type: 'audio/x-mpegurl' }));
    const link = el('a'); link.href = url; link.download = 'iux-zone.m3u';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Lista M3U exportada.');
  } catch (err) { toast(err.message, true); }
}
async function boot() {
  try {
    const session = await api('/api/session');
    if (!session.authenticated) return showLogin();
    $('#notice').hidden = session.authRequired;
    $('#logout').hidden = !session.authRequired;
    $('#system-auth').textContent = session.authRequired ? 'Autenticación activa · sesión de administración de 8 horas.' : 'Modo desarrollo: sin contraseña. No apto para exposición pública.';
    await loadChannels();
    $('#app').hidden = false; $('#login').hidden = true;
    setView(localStorage.getItem('iux-view') || 'overview');
  } catch (err) {
    // Keep the login form available so initialization failures are recoverable.
    showLogin(); $('#login-error').textContent = err.message;
  }
}
$$('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  $$('[data-filter]').forEach(b => b.classList.toggle('active', b === button));
  render();
}));
$('#search').addEventListener('input', render);
$('#add-channel').addEventListener('click', () => openChannel());
$('#empty-add').addEventListener('click', () => openChannel());
$('#close-dialog').addEventListener('click', () => $('#channel-dialog').close());
$('#cancel-dialog').addEventListener('click', () => $('#channel-dialog').close());
$('#cancel-delete').addEventListener('click', () => $('#delete-dialog').close());
$('#refresh').addEventListener('click', async () => {
  $('#refresh').disabled = true;
  try { await loadChannels(); toast('Biblioteca actualizada.'); } catch (err) { toast(err.message, true); }
  finally { $('#refresh').disabled = false; }
});
$('#channel-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const id = data.id; delete data.id; data.enabled = form.elements.enabled.checked;
  $('#save-channel').disabled = true; $('#form-error').textContent = '';
  try {
    const saved = await api(id ? `/api/channels/${id}` : '/api/channels', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) });
    // Update from the successful mutation before a later refresh can fail.
    channels = id ? channels.map(c => c.id === id ? saved : c) : [...channels, saved];
    render(); $('#channel-dialog').close(); toast(id ? 'Cambios guardados.' : 'Canal agregado a tu biblioteca.');
  } catch (err) { $('#form-error').textContent = err.message; }
  finally { $('#save-channel').disabled = false; }
});
$('#delete-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('[type=submit]'); button.disabled = true;
  try {
    await api(`/api/channels/${deleteId}`, { method: 'DELETE' });
    channels = channels.filter(c => c.id !== deleteId); render();
    $('#delete-dialog').close(); toast('Canal eliminado.');
  } catch (err) { $('#delete-error').textContent = err.message; }
  finally { button.disabled = false; }
});
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button'); button.disabled = true;
  $('#login-error').textContent = '';
  try {
    await api('/api/session', { method: 'POST', body: JSON.stringify({ password: form.elements.password.value }) });
    form.reset(); await boot();
  } catch (err) { $('#login-error').textContent = err.message; }
  finally { button.disabled = false; }
});
$('#logout').addEventListener('click', async () => {
  try { await api('/api/session', { method: 'DELETE' }); channels = []; render(); showLogin(); }
  catch (err) { toast(err.message, true); }
});
$('#quick-download').addEventListener('click', downloadPlaylist);
$('#download-playlist').addEventListener('click', downloadPlaylist);
$('#preview-playlist').addEventListener('click', async () => {
  try { $('#playlist-preview').textContent = await getPlaylist(); $('#playlist-preview').hidden = false; }
  catch (err) { toast(err.message, true); }
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(event.target.tagName) && !document.querySelector('dialog[open]') && !$('#app').hidden) {
    event.preventDefault(); if (!['overview', 'channels'].includes(view)) setView('channels'); $('#search').focus();
  }
});
$('#show-playlist-link').addEventListener('click', async () => {
  try {
    const playback = await api('/api/playback');
    $('#subscription-url').value = playback.playlistUrl;
    $('#subscription-label').hidden = false;
    $('#subscription-help').textContent = playback.sessionOnly ? 'Falta STREAM_TOKEN. Este enlace requiere sesión y no funcionará como suscripción externa.' : playback.tokenConfigured ? 'Enlace secreto de reproducción. Rotar STREAM_TOKEN revoca todos los enlaces existentes.' : 'Sin autenticación: accesible a cualquiera con conectividad al servidor. Solo desarrollo.';
    $('#subscription-url').select();
  } catch (err) { toast(err.message, true); }
});
window.iux = { api, el, toast, loadChannels, setView };
setInterval(() => {
  if (!document.hidden && !$('#app').hidden) refreshRelay().catch(() => { $('#relay-updated').textContent = '· no se pudo actualizar'; });
}, 5000);
boot();
