(() => {
  const { api, el, toast, loadChannels } = window.iux;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const content = $('#tvh-content');
  let activeView = ''; let resource = ''; let page = 0; let generation = 0;
  let selected = new Set(); let hardwarePath = []; let editor = null; let settings = null;
  const pageSize = 50;
  const definitions = {
    hardware: { title: 'Adaptadores y frontends', description: 'Explora cada dispositivo para encontrar sus sintonizadores. Tvheadend debe tener permisos sobre /dev/dvb.', columns: [['Dispositivo', 'text'], ['Tipo', 'class'], ['Contenido', r => r.leaf ? 'Frontend / objeto final' : 'Explorable']] },
    networks: { title: 'Redes DVB', description: 'Define una red, asígnala a un frontend compatible y explora sus multiplexes.', columns: [['Nombre', 'networkname'], ['Multiplexes', 'num_mux'], ['Servicios', 'num_svc'], ['Canales', 'num_chn']] },
    muxes: { title: 'Multiplexes / transpondedores', description: 'Frecuencias y resultados tal como los informa el motor. Las unidades dependen del sistema DVB.', columns: [['Red', 'network'], ['Frecuencia (TVH)', 'frequency'], ['Sistema', 'delsys'], ['Exploración', 'scan_state'], ['Resultado', 'scan_result'], ['Servicios', 'num_svc']] },
    services: { title: 'Servicios encontrados', description: 'Selecciona servicios y mapéalos a canales dentro de Tvheadend. Después importa los canales a iux-zone.', select: true, columns: [['Servicio', 'svcname'], ['Proveedor', 'provider'], ['Red', 'network'], ['Multiplex', 'mux'], ['Cifrado', r => r.scrambled === undefined ? '—' : r.scrambled ? 'Sí' : 'No']] },
    channels: { title: 'Canales de Tvheadend', description: 'Importación explícita y sin duplicados por UUID. Las credenciales del motor no se incluyen en las listas M3U.', select: true, columns: [['Nº', 'number'], ['Canal', 'name'], ['Habilitado', r => r.enabled === false ? 'No' : 'Sí'], ['Servicios', r => Array.isArray(r.services) ? r.services.length : '—']] },
    epg: { title: 'Guía de programación', description: 'Eventos reales recogidos por Tvheadend; si no hay datos EPG, esta lista permanece vacía.', columns: [['Programa', 'title'], ['Canal', 'channelName'], ['Inicio', r => date(r.start)], ['Fin', r => date(r.stop)], ['Descripción', r => r.subtitle || r.summary || '—']] },
    inputs: { title: 'Entradas y señal', description: 'Valores y escalas originales de Tvheadend. No se interpretan como porcentajes o dB sin información del driver.', columns: [['Entrada', 'input'], ['Flujo', 'stream'], ['Suscripciones', 'subs'], ['Bits/s (TVH)', 'bps'], ['Señal (TVH)', 'signal'], ['SNR (TVH)', 'snr'], ['BER', 'ber'], ['UNC', 'unc']] },
    subscriptions: { title: 'Suscripciones activas', description: 'Clientes y tareas que consumen servicios del motor. No son las sesiones del relay local de iux-zone.', columns: [['ID', 'id'], ['Título', 'title'], ['Canal', 'channel'], ['Usuario', 'username'], ['Estado', 'state'], ['Entrada (TVH)', 'in'], ['Salida (TVH)', 'out']] },
    connections: { title: 'Conexiones al motor', description: 'Conexiones HTTP / HTSP conocidas por Tvheadend.', columns: [['ID', 'id'], ['Origen', 'peer'], ['Usuario', 'user'], ['Tipo', 'type'], ['Desde', r => date(r.started)]] },
  };
  const tabs = {
    'tvh-hardware': [['hardware', 'Dispositivos']],
    'tvh-networks': [['networks', 'Redes'], ['muxes', 'Multiplexes']],
    'tvh-services': [['services', 'Servicios'], ['channels', 'Canales del motor']],
    'tvh-epg': [['epg', 'Programación']],
    'tvh-activity': [['inputs', 'Entradas / señal'], ['subscriptions', 'Suscripciones'], ['connections', 'Conexiones']],
  };
  const rowsOf = response => Array.isArray(response) ? response : response.entries || [];
  const idOf = row => row.uuid || row.id;
  const date = value => value ? new Date(Number(value) * 1000).toLocaleString() : '—';
  const format = value => value === undefined || value === null || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  function button(text, handler, primary = false) { const node = el('button', 'button ' + (primary ? 'primary' : 'secondary'), text); node.type = 'button'; node.addEventListener('click', handler); return node; }
  function error(message) { $('#tvh-error').textContent = message; $('#tvh-error').hidden = !message; }
  function status(text, kind = '') { $('#tvh-status').textContent = text; $('#tvh-status').className = 'engine-status ' + kind; }
  function loading() { content.replaceChildren(el('div', 'tvh-loading', 'Consultando el motor…')); content.setAttribute('aria-busy', 'true'); }
  function finished() { content.setAttribute('aria-busy', 'false'); }
  async function action(body) { return api('/api/tvh/action', { method: 'POST', body: JSON.stringify(body) }); }
  async function confirmOperation(title, description) {
    $('#tvh-confirm-title').textContent = title; $('#tvh-confirm-description').textContent = description;
    return new Promise(resolve => { const dialog = $('#tvh-confirm'); dialog.returnValue = 'cancel'; dialog.addEventListener('close', () => resolve(dialog.returnValue === 'yes'), { once: true }); dialog.showModal(); });
  }
  function noEngine() {
    const panel = el('article', 'panel tvh-onboarding');
    panel.append(el('span', 'eyebrow', 'TU HARDWARE. TU MOTOR. TU CONTROL.'), el('div', 'engine-orbit', '◈'), el('h2', '', 'Una cabecera real empieza aquí.'), el('p', 'muted', 'Conecta un servidor Tvheadend para detectar tu TBS, administrar redes y convertir servicios DVB en canales de tu biblioteca.'));
    const path = el('div', 'signal-path');
    ['TBS / DVB', 'Tvheadend', 'iux-zone', 'Tu audiencia'].forEach((text, i) => { if (i) path.append(el('span', 'path-arrow', '→')); path.append(el('span', '', text)); });
    panel.append(path, button('Configurar conexión →', () => window.iux.setView('tvh-settings'), true), el('p', 'help-text', 'No hay dispositivos ni estadísticas de demostración. Tvheadend se instala por separado.'));
    content.replaceChildren(panel);
  }
  async function overview() {
    const current = ++generation; error(''); loading();
    try {
      settings = await api('/api/tvh/settings');
      if (current !== generation) return;
      $('#tvh-server-label').textContent = settings.url || 'Motor DVB externo · sin configurar';
      if (!settings.configured) { status('Sin configurar'); noEngine(); return; }
      const info = await api('/api/tvh/test', { method: 'POST', body: '{}' });
      if (current !== generation) return;
      status('Conectado', 'is-connected'); $('#tvh-server-label').textContent = `${info.name} · ${info.version}`;
      const types = ['hardware', 'networks', 'muxes', 'services', 'channels', 'subscriptions'];
      const results = await Promise.allSettled(types.map(type => api(`/api/tvh/resources/${type}?limit=1`)));
      if (current !== generation) return;
      const grid = el('div', 'engine-metrics');
      const titles = ['Dispositivos raíz', 'Redes', 'Multiplexes', 'Servicios', 'Canales del motor', 'Suscripciones'];
      types.forEach((type, i) => {
        const result = results[i]; const card = el('article', 'panel engine-metric');
        card.append(el('span', '', titles[i]), el('strong', '', result.status === 'fulfilled' ? result.value.total ?? result.value.totalCount ?? rowsOf(result.value).length : '—'), el('small', '', result.status === 'fulfilled' ? 'Informado por Tvheadend' : 'Sin permisos o no disponible'));
        grid.append(card);
      });
      const guide = el('article', 'panel engine-guide'); guide.append(el('p', 'eyebrow', 'DE LA FRECUENCIA AL PLAYLIST'), el('h2', '', 'Tu flujo de trabajo, conectado.'));
      [['01', 'Detecta tu hardware', 'Comprueba que Tvheadend ve los frontends de tu TBS.', 'tvh-hardware'], ['02', 'Configura y explora', 'Crea redes, ajusta multiplexes y lanza una exploración.', 'tvh-networks'], ['03', 'Mapea tus servicios', 'Crea canales en el motor e impórtalos a iux-zone.', 'tvh-services'], ['04', 'Distribuye la señal', 'Sirve las salidas HTTP-TS con tu lista M3U y token.', 'playlist']].forEach(([n, title, text, view]) => {
        const item = button('', () => window.iux.setView(view)); item.className = 'workflow-step';
        const copy = el('div'); copy.append(el('strong', '', title), el('small', '', text)); item.append(el('span', 'step-number', n), copy, el('span', '', '↗')); guide.append(item);
      });
      content.replaceChildren(grid, guide);
    } catch (err) { if (current === generation) { status('No disponible', 'is-error'); error(err.message); noEngine(); } }
    finally { if (current === generation) finished(); }
  }
  async function connectionForm() {
    const current = ++generation; loading(); error('');
    try {
      settings = await api('/api/tvh/settings'); if (current !== generation) return;
      status(settings.configured ? 'Configurado · sin comprobar' : 'Sin configurar');
      $('#tvh-server-label').textContent = settings.url || 'Motor DVB externo';
      const panel = el('article', 'panel engine-settings');
      panel.append(el('p', 'eyebrow', 'UNA CONEXIÓN. TODA TU CABECERA.'), el('h2', '', 'Tu motor, en tu infraestructura.'), el('p', 'muted', 'iux-zone se conecta desde su servidor, no desde tu navegador. Usa un usuario dedicado con permisos de administración, streaming y el perfil pass.'));
      const form = el('form'); form.id = 'tvh-settings-form';
      function field(name, title, type, value, placeholder) { const label = el('label', '', title); const input = el('input'); Object.assign(input, { name, type, value, placeholder, autocomplete: name === 'password' ? 'new-password' : 'off' }); if (name === 'url') input.required = true; label.append(input); form.append(label); return input; }
      field('url', 'URL del servidor', 'url', settings.url, 'http://192.168.1.10:9981');
      field('username', 'Usuario de Tvheadend', 'text', settings.username, 'iux-zone');
      const password = field('password', 'Contraseña de Tvheadend', 'password', '', settings.hasPassword ? 'Guardada · deja vacío para conservarla' : 'Contraseña del motor');
      form.append(el('p', 'help-text', 'La contraseña se guarda en tvheadend.json con permisos 0600. No se devuelve al navegador ni se incluye en las listas M3U. No está cifrada en disco: protege el directorio de datos. Al cambiar de servidor vuelve a introducirla.'));
      const warn = el('div', 'info-box', 'HTTP no cifra las credenciales ni el video. Usa una LAN confiable o HTTPS con un certificado válido. No se omite la validación TLS. Tvheadend y los drivers TBS se instalan por separado.'); form.append(warn);
      const controls = el('div', 'detail-actions'); const feedback = el('p', 'help-text'); feedback.id = 'tvh-settings-feedback'; feedback.setAttribute('role', 'status');
      const candidate = () => ({ url: form.elements.url.value, username: form.elements.username.value, ...(password.value ? { password: password.value } : {}) });
      const test = button('Comprobar conexión', async () => {
        if (!form.reportValidity()) return;
        test.disabled = true; feedback.textContent = 'Probando conexión…';
        try { const info = await api('/api/tvh/test', { method: 'POST', body: JSON.stringify(candidate()) }); status('Conectado', 'is-connected'); feedback.textContent = `${info.name} · ${info.version}. Conexión comprobada; pulsa Guardar para conservar los cambios.`; }
        catch (err) { status('Error de conexión', 'is-error'); feedback.textContent = err.message; }
        finally { test.disabled = false; }
      });
      const save = el('button', 'button primary', 'Guardar conexión'); save.type = 'submit';
      const disconnect = button('Desconectar', async () => {
        if (!await confirmOperation('¿Desconectar Tvheadend?', 'Se borrarán las credenciales guardadas y se detendrán los relays del motor. Los canales importados se conservarán.')) return;
        await guarded(async () => { await api('/api/tvh/settings', { method: 'PUT', body: JSON.stringify({ url: '' }) }); toast('Motor desconectado.'); connectionForm(); });
      }); controls.append(test, save); if (settings.configured) controls.append(disconnect); form.append(controls, feedback);
      form.addEventListener('submit', async event => { event.preventDefault(); save.disabled = true; try { settings = await api('/api/tvh/settings', { method: 'PUT', body: JSON.stringify(candidate()) }); password.value = ''; password.placeholder = settings.hasPassword ? 'Guardada · deja vacío para conservarla' : 'Sin contraseña'; status('Guardado · sin comprobar'); feedback.textContent = 'Configuración guardada. Usa Comprobar conexión para verificar el acceso.'; toast('Conexión guardada.'); } catch (err) { feedback.textContent = err.message; } finally { save.disabled = false; } });
      panel.append(form); content.replaceChildren(panel);
    } catch (err) { if (current === generation) { content.replaceChildren(); error(err.message); } }
    finally { if (current === generation) finished(); }
  }
  async function guarded(work) { try { await work(); } catch (err) { error(err.message); toast(err.message, true); } }
  function configureTabs() {
    $('#tvh-tabs').replaceChildren(...(tabs[activeView] || []).map(([type, label]) => {
      const node = button(label, () => { resource = type; page = 0; selected.clear(); configureTabs(); renderResource(); }); node.className = 'engine-tab' + (resource === type ? ' active' : ''); return node;
    }));
  }
  async function renderResource(quiet = false) {
    const current = ++generation; const type = resource; const definition = definitions[type]; if (!definition) return;
    error(''); if (!quiet) loading();
    try {
      const params = new URLSearchParams({ start: String(page * pageSize), limit: String(pageSize) });
      if (type === 'hardware') params.set('uuid', hardwarePath.at(-1)?.id || 'root');
      const data = await api(`/api/tvh/resources/${type}?${params}`); if (current !== generation) return;
      status('API disponible', 'is-connected');
      const rows = rowsOf(data); const total = data.total ?? data.totalCount;
      const panel = el('article', 'panel tvh-table-panel');
      const heading = el('div', 'panel-heading'); const copy = el('div'); copy.append(el('h2', '', definition.title), el('p', '', definition.description)); heading.append(copy);
      if (type === 'networks') heading.append(button('+ Nueva red', () => guarded(createNetwork), true));
      if (type === 'muxes') heading.append(button('+ Multiplex', () => guarded(createMux), true));
      panel.append(heading);
      const toolbar = el('div', 'tvh-table-tools');
      const selection = button(type === 'channels' ? 'Importar seleccionados' : 'Mapear seleccionados', async () => {
        if (!selected.size) return;
        const count = selected.size;
        if (!await confirmOperation(type === 'channels' ? 'Importar canales a iux-zone' : 'Mapear servicios en Tvheadend', `${count} elementos seleccionados. Esta operación modifica ${type === 'channels' ? 'tu biblioteca local' : 'el motor Tvheadend'}.`)) return;
        selection.disabled = true;
        await guarded(async () => {
          if (type === 'channels') { const result = await api('/api/tvh/import', { method: 'POST', body: JSON.stringify({ uuids: [...selected] }) }); await loadChannels(); toast(`${result.added} canales nuevos · ${result.updated} actualizados.`); }
          else { await action({ action: 'map-services', uuids: [...selected] }); toast('Mapeo solicitado al motor. Consulta la pestaña Canales.'); }
          selected.clear(); await renderResource();
        }); selection.disabled = !selected.size;
      }, true);
      selection.disabled = !selected.size;
      const count = el('span', 'muted', `${selected.size} seleccionados`);
      if (definition.select) toolbar.append(selection, count);
      if (type === 'hardware' && hardwarePath.length) toolbar.append(button('← Nivel anterior', () => { hardwarePath.pop(); renderResource(); }), el('span', 'muted', hardwarePath.map(p => p.text).join(' / ')));
      const search = el('input', 'tvh-search'); search.type = 'search'; search.placeholder = 'Buscar en esta página…'; search.setAttribute('aria-label', 'Buscar en esta página'); toolbar.append(search); panel.append(toolbar);
      const scroll = el('div', 'table-scroll'); const table = el('table'); const head = el('thead'); const headRow = el('tr');
      if (definition.select) headRow.append(el('th', '', 'SELECCIÓN'));
      definition.columns.forEach(([title]) => headRow.append(el('th', '', title.toLocaleUpperCase())));
      const editable = ['hardware', 'networks', 'muxes', 'services', 'channels'].includes(type);
      if (editable) headRow.append(el('th', '', 'ACCIONES'));
      head.append(headRow); const body = el('tbody');
      rows.forEach(row => {
        const tr = el('tr'); const id = idOf(row);
        if (definition.select) { const cell = el('td'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = selected.has(id); checkbox.setAttribute('aria-label', `Seleccionar ${row.name || row.svcname || id}`); checkbox.addEventListener('change', () => { if (checkbox.checked && selected.size >= 100) { checkbox.checked = false; toast('Máximo 100 elementos por operación.', true); return; } checkbox.checked ? selected.add(id) : selected.delete(id); count.textContent = `${selected.size} seleccionados`; selection.disabled = !selected.size; }); cell.append(checkbox); tr.append(cell); }
        definition.columns.forEach(([, key]) => { const value = typeof key === 'function' ? key(row) : row[key]; const cell = el('td', 'tvh-value', format(value)); cell.title = format(value); tr.append(cell); });
        if (editable) {
          const cell = el('td'); const controls = el('div', 'tvh-row-actions');
          if (type === 'hardware' && !row.leaf) controls.append(button('Explorar', () => { hardwarePath.push({ id, text: row.text || id }); renderResource(); }));
          controls.append(button('Editar', () => guarded(() => editNode(id, row.name || row.networkname || row.text || row.svcname || 'Parámetros'))));
          if (type === 'networks') controls.append(button('Explorar red', async () => { if (await confirmOperation('¿Explorar esta red?', 'Tvheadend intentará sintonizar sus multiplexes. Puede ocupar sintonizadores y afectar las transmisiones actuales.')) await guarded(async () => { await action({ action: 'scan', uuid: id }); toast('Exploración solicitada. Consulta los multiplexes.'); }); }));
          if (['networks', 'muxes'].includes(type)) controls.append(button('Eliminar', async () => { if (await confirmOperation('¿Eliminar del motor?', 'Se eliminará el objeto en Tvheadend. Puede afectar servicios, canales y emisiones. Esta operación no se puede deshacer.')) await guarded(async () => { await action({ action: 'delete', uuid: id }); selected.delete(id); await renderResource(); toast('Objeto eliminado del motor.'); }); }));
          cell.append(controls); tr.append(cell);
        }
        body.append(tr);
      });
      search.addEventListener('input', () => { const term = search.value.toLocaleLowerCase(); [...body.children].forEach(tr => { tr.hidden = !tr.textContent.toLocaleLowerCase().includes(term); }); });
      table.append(head, body); scroll.append(table); panel.append(scroll);
      if (!rows.length) { const empty = el('div', 'empty-state'); empty.append(el('span', 'empty-icon', '◇'), el('h3', '', 'Sin datos en esta sección'), el('p', '', type === 'hardware' ? 'Comprueba drivers, permisos de /dev/dvb y configuración de Tvheadend.' : 'El motor no devolvió elementos. No se generan datos de demostración.')); panel.append(empty); }
      const footer = el('div', 'table-footer'); footer.append(el('span', '', `Página ${page + 1} · ${rows.length} elementos${total !== undefined ? ' · total ' + total : ''}`));
      const pages = el('div', 'tvh-pagination'); const back = button('← Anterior', () => { page--; renderResource(); }); back.disabled = page === 0;
      const next = button('Siguiente →', () => { page++; renderResource(); }); next.disabled = type === 'hardware' || (total !== undefined ? (page + 1) * pageSize >= total : rows.length < pageSize); pages.append(back, next); footer.append(pages); panel.append(footer);
      content.replaceChildren(panel);
    } catch (err) { if (current === generation) { if (!quiet) content.replaceChildren(); error(err.message); status('No disponible', 'is-error'); if (err.message.includes('Conecta un servidor')) noEngine(); } }
    finally { if (current === generation) finished(); }
  }
  function openEditor(title, properties, submit, uuid) {
    const form = $('#tvh-editor-form'); form.reset(); $('#tvh-editor-title').textContent = title; $('#tvh-editor-error').textContent = '';
    const container = $('#tvh-editor-fields'); container.replaceChildren(); const fields = [];
    const hidden = new Set(['uuid', 'class', 'children']);
    for (const property of properties || []) {
      if (!property.id || hidden.has(property.id) || property.password || property.hidden || property.rdonly || property.nosave) continue;
      const value = property.value ?? property.default; const label = el('label', '', property.caption || property.id); let input; let parse;
      const options = Array.isArray(property.enum) ? property.enum : null;
      if (property.type === 'bool') { input = el('input'); input.type = 'checkbox'; input.checked = Boolean(value); label.classList.add('checkbox-label'); parse = () => input.checked; }
      else if (property.list || Array.isArray(value) || (value && typeof value === 'object')) { input = el('textarea'); input.rows = 3; input.value = JSON.stringify(value ?? [], null, 2); parse = () => JSON.parse(input.value); }
      else if (options) { input = el('select'); input.append(el('option', '', '')); options.forEach(option => { const key = typeof option === 'object' ? option.key ?? option.val ?? option.value : option; const node = el('option', '', typeof option === 'object' ? option.val ?? option.caption ?? key : option); node.value = String(key); input.append(node); }); input.value = value === undefined ? '' : String(value); parse = () => ['int', 'u32', 's64', 'dbl'].includes(property.type) && input.value !== '' ? Number(input.value) : input.value; }
      else { input = el('input'); input.type = ['int', 'u32', 's64', 'dbl'].includes(property.type) ? 'number' : 'text'; input.value = value === undefined ? '' : String(value); if (input.type === 'number') input.step = property.type === 'dbl' ? 'any' : '1'; parse = () => input.type === 'number' && input.value !== '' ? Number(input.value) : input.value; }
      input.name = property.id; const initial = input.type === 'checkbox' ? input.checked : input.value;
      label.append(input); if (property.description) label.append(el('small', '', String(property.description).replace(/<[^>]*>/g, '')));
      if (property.list) label.append(el('small', '', 'Lista JSON de valores o UUID. Usa los identificadores del motor.'));
      fields.push({ property, input, parse, initial }); container.append(label);
    }
    if (!fields.length) container.append(el('p', 'help-text', 'Este objeto no tiene propiedades editables disponibles en la API.'));
    editor = { fields, submit, uuid }; $('#tvh-editor').showModal();
  }
  async function editNode(uuid, title) {
    const data = await action({ action: 'load', uuid }); const entry = rowsOf(data)[0];
    if (!entry) throw new Error('Tvheadend no devolvió la configuración del objeto.');
    openEditor(title, entry.params || entry.meta?.props || [], node => action({ action: 'save', node }), uuid);
  }
  async function choose(title, choices) {
    const dialog = $('#tvh-confirm'); $('#tvh-confirm-title').textContent = title; const copy = $('#tvh-confirm-description'); copy.replaceChildren();
    const select = el('select', 'tvh-choice'); choices.forEach(([value, label]) => { const option = el('option', '', label); option.value = value; select.append(option); }); copy.append(select);
    dialog.returnValue = 'cancel'; const result = await new Promise(resolve => { dialog.addEventListener('close', () => resolve(dialog.returnValue === 'yes' ? select.value : null), { once: true }); dialog.showModal(); }); copy.replaceChildren(); return result;
  }
  async function createNetwork() {
    const builders = rowsOf(await api('/api/tvh/resources/builders?limit=500')).filter(b => /^mpegts_network_/.test(b.class || b.id || ''));
    if (!builders.length) throw new Error('El motor no ofrece clases de red. Revisa cómo se compiló Tvheadend.');
    const type = await choose('Tipo de red DVB', builders.map(b => [b.class || b.id, b.caption || b.class || b.id])); if (!type) return;
    const builder = builders.find(b => (b.class || b.id) === type);
    openEditor('Nueva red', builder.props || [], conf => action({ action: 'network-create', class: type, conf }));
  }
  async function createMux() {
    const networks = rowsOf(await api('/api/tvh/resources/networks?limit=500'));
    if (!networks.length) throw new Error('Crea primero una red DVB.');
    const uuid = await choose('Red del nuevo multiplex', networks.map(n => [n.uuid, n.networkname || n.uuid])); if (!uuid) return;
    const schema = await action({ action: 'mux-class', uuid });
    openEditor('Nuevo multiplex', schema.props || [], conf => action({ action: 'mux-create', uuid, conf }));
  }
  $('#tvh-editor-form').addEventListener('submit', async event => {
    event.preventDefault(); if (!editor) return;
    const save = event.currentTarget.querySelector('[type=submit]'); save.disabled = true; $('#tvh-editor-error').textContent = '';
    try {
      const node = editor.uuid ? { uuid: editor.uuid } : {};
      for (const { property, input, parse, initial } of editor.fields) {
        const current = input.type === 'checkbox' ? input.checked : input.value;
        if (editor.uuid && current === initial) continue;
        if (!editor.uuid && current === '' && property.type !== 'bool') continue;
        const value = parse(); if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Valor numérico inválido.'); node[property.id] = value;
      }
      await editor.submit(node); $('#tvh-editor').close(); toast('Configuración enviada a Tvheadend.'); await renderResource();
    } catch (err) { $('#tvh-editor-error').textContent = err instanceof SyntaxError ? 'Una de las listas no contiene JSON válido.' : err.message; }
    finally { save.disabled = false; }
  });
  $('#tvh-close-editor').addEventListener('click', () => $('#tvh-editor').close()); $('#tvh-cancel-editor').addEventListener('click', () => $('#tvh-editor').close());
  function refresh() { if (activeView === 'tvh-settings') return connectionForm(); if (activeView === 'tvh-dashboard') return overview(); return renderResource(); }
  $('#tvh-refresh').addEventListener('click', refresh);
  document.addEventListener('iux:view', event => {
    activeView = event.detail; generation++; error('');
    if (!activeView.startsWith('tvh-')) return;
    selected.clear(); hardwarePath = []; page = 0; resource = tabs[activeView]?.[0]?.[0] || ''; configureTabs(); refresh();
  });
  document.addEventListener('iux:logout', () => { generation++; settings = null; editor = null; content.replaceChildren(); });
  setInterval(() => { if (activeView === 'tvh-activity' && !document.hidden && !$('#app').hidden && !document.querySelector('dialog[open]')) renderResource(true); }, 10000);
})();
