function renderConfig(setId) {
  state.screen = 'config';
  const set = state.content.sets.find(s => s.id === setId);
  if (!set) return renderHome();
  state.selectedSetId = setId;
  const max = Math.min(20, set.pairs.length);
  const options = [5, 10, 15, 20].filter(n => n <= max);
  if (!options.includes(state.config.count)) state.config.count = options.at(-1) || max;

  main.innerHTML = `
    <section class="card">
      <span class="badge">${escapeHTML(set.icon || '◉')} ${escapeHTML(set.short || set.name)}</span>
      <h1 style="margin-bottom:8px">Configurar ejercicio</h1>
      <p style="color:var(--muted);margin-top:0">${escapeHTML(set.description)}</p>
      <div class="form-grid section">
        <div class="field">
          <label for="countSelect">Número total de elementos</label>
          <select id="countSelect">${options.map(n => `<option value="${n}" ${n === state.config.count ? 'selected' : ''}>${n}</option>`).join('')}</select>
          <span class="help">Se muestran en grupos pequeños para no sobrecargar la pantalla.</span>
        </div>
        <div class="field">
          <label for="modeSelect">Forma de relacionar</label>
          <select id="modeSelect">
            <option value="link" ${state.config.mode === 'link' ? 'selected' : ''}>Relacionar pulsando</option>
            <option value="drag" ${state.config.mode === 'drag' ? 'selected' : ''}>Arrastrar y soltar</option>
          </select>
          <span class="help">En modo arrastrar también se permite pulsar como alternativa.</span>
        </div>
      </div>
      <div class="actions">
        <button id="beginBtn" class="btn btn-primary btn-large" type="button">Comenzar</button>
        <button id="cancelBtn" class="btn btn-ghost btn-large" type="button">Volver</button>
      </div>
    </section>`;

  document.getElementById('countSelect').addEventListener('change', e => state.config.count = Number(e.target.value));
  document.getElementById('modeSelect').addEventListener('change', e => state.config.mode = e.target.value);
  document.getElementById('cancelBtn').addEventListener('click', renderHome);
  document.getElementById('beginBtn').addEventListener('click', () => startSession(setId));
}

function startSession(setId) {
  const set = state.content.sets.find(s => s.id === setId);
  const count = Math.min(state.config.count, 20, set.pairs.length);
  const selected = shuffle(set.pairs).slice(0, count).map(p => structuredClone(p));
  state.session = {
    id: uid('session'), setId, setName: set.name, mode: state.config.mode,
    pairs: selected, total: selected.length, roundIndex: 0, roundSize: Math.min(state.settings.roundSize || 4, 5),
    matched: 0, wrongAttempts: 0, attemptsById: {}, firstTryCorrect: 0, startedAt: Date.now(), selectedSourceId: null,
    roundMatchedIds: new Set(), lines: []
  };
  renderRound();
}

function getRoundPairs() {
  const s = state.session;
  const start = s.roundIndex * s.roundSize;
  return s.pairs.slice(start, start + s.roundSize);
}

function renderRound() {
  state.screen = 'test';
  const s = state.session;
  if (!s) return renderHome();
  const roundPairs = getRoundPairs();
  if (!roundPairs.length) return finishSession();
  s.roundMatchedIds = new Set();
  s.selectedSourceId = null;
  s.lines = [];
  const targets = shuffle(roundPairs);
  const modeText = s.mode === 'drag' ? 'Arrastra cada elemento hasta su pareja. También puedes pulsar uno y después el otro.' : 'Pulsa un elemento de la izquierda y después su pareja de la derecha.';

  main.innerHTML = `
    <section class="test-header card compact-test-header">
      <div class="progress-row"><span>${escapeHTML(s.setName)}</span><span id="progressText">${s.matched} / ${s.total}</span></div>
      <div class="progress" aria-label="Progreso"><span id="progressBar" style="width:${(s.matched/s.total)*100}%"></span></div>
      <h1 class="instruction">Relaciona los elementos</h1>
      <p style="margin:0;color:var(--muted);font-size:17px">${escapeHTML(modeText)}</p>
    </section>
    <section class="card section compact-test-card">
      <div id="board" class="test-board compact-test-board">
        <svg id="matchSvg" class="match-svg" aria-hidden="true"></svg>
        <p class="column-title">Figuras</p>
        <p class="column-title">Palabras</p>
        ${roundPairs.map((p,i) => `
          <button class="match-card source" type="button" data-source="${escapeHTML(p.id)}" aria-label="Seleccionar elemento">${visualHTML(p.visual)}</button>
          <button class="match-card target" type="button" data-target="${escapeHTML(targets[i].id)}"><span class="word">${escapeHTML(targets[i].target)}</span></button>
        `).join('')}
      </div>
      <div id="feedback" class="feedback" aria-live="polite"></div>
      <div class="actions" style="justify-content:center"><button id="quitBtn" class="btn btn-ghost" type="button">Finalizar sin guardar</button></div>
    </section>`;

  bindRoundInteractions();
  document.getElementById('quitBtn').addEventListener('click', renderHome);
  fitTestBoardToViewport();
  requestAnimationFrame(fitTestBoardToViewport);
  window.addEventListener('resize', fitTestBoardToViewport, { once: true });
  window.addEventListener('resize', drawLines, { once: true });
}


function fitTestBoardToViewport() {
  const board = document.getElementById('board');
  if (!board || !state.session) return;
  const rows = Math.max(1, getRoundPairs().length);
  const rect = board.getBoundingClientRect();
  const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;

  // Espacio inferior reservado para feedback, botón y margen de seguridad.
  const reservedBottom = viewportH <= 720 ? 72 : 88;
  const titleHeight = viewportH <= 720 ? 22 : 26;
  const gap = viewportH <= 720 ? 6 : 8;
  const available = Math.max(260, viewportH - rect.top - reservedBottom - titleHeight);
  const calculated = Math.floor((available - gap * (rows - 1)) / rows);
  const rowHeight = Math.max(62, Math.min(112, calculated));
  const visualHeight = Math.max(50, Math.floor(rowHeight * 0.72));
  const visualWidth = Math.max(72, Math.min(150, Math.floor(visualHeight * 1.45)));

  board.style.setProperty('--fit-row-h', rowHeight + 'px');
  board.style.setProperty('--fit-visual-h', visualHeight + 'px');
  board.style.setProperty('--fit-visual-w', visualWidth + 'px');
  board.style.setProperty('--fit-gap', gap + 'px');

  requestAnimationFrame(drawLines);
}

function bindRoundInteractions() {
  const s = state.session;
  const sources = [...main.querySelectorAll('[data-source]')];
  const targets = [...main.querySelectorAll('[data-target]')];

  sources.forEach(source => {
    source.addEventListener('click', e => {
      if (source.classList.contains('matched')) return;
      selectSource(source.dataset.source);
    });
    if (s.mode === 'drag') source.addEventListener('pointerdown', beginPointerDrag);
  });
  targets.forEach(target => target.addEventListener('click', () => {
    if (target.classList.contains('matched')) return;
    if (!s.selectedSourceId) {
      flashFeedback('Selecciona primero una figura.', false);
      return;
    }
    attemptMatch(s.selectedSourceId, target.dataset.target);
  }));
}

function selectSource(id) {
  const s = state.session;
  if (s.roundMatchedIds.has(id)) return;
  s.selectedSourceId = id;
  main.querySelectorAll('[data-source]').forEach(el => el.classList.toggle('selected', el.dataset.source === id));
  const el = main.querySelector(`[data-source="${cssEscape(id)}"]`);
  if (el) el.focus({ preventScroll: true });
}

function beginPointerDrag(event) {
  if (event.button !== undefined && event.button !== 0) return;
  const source = event.currentTarget;
  if (source.classList.contains('matched')) return;
  event.preventDefault();
  selectSource(source.dataset.source);
  const rect = source.getBoundingClientRect();
  const clone = source.cloneNode(true);
  clone.classList.add('drag-float');
  clone.style.width = `${rect.width}px`;
  document.body.appendChild(clone);
  document.body.classList.add('dragging');

  const pointerId = event.pointerId;
  source.setPointerCapture?.(pointerId);
  move(event);

  function move(e) {
    clone.style.left = `${e.clientX}px`;
    clone.style.top = `${e.clientY}px`;
    document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const target = under?.closest?.('[data-target]');
    if (target && !target.classList.contains('matched')) target.classList.add('drop-hover');
  }

  function end(e) {
    source.releasePointerCapture?.(pointerId);
    source.removeEventListener('pointermove', move);
    source.removeEventListener('pointerup', end);
    source.removeEventListener('pointercancel', end);
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const target = under?.closest?.('[data-target]');
    document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
    clone.remove();
    document.body.classList.remove('dragging');
    if (target && !target.classList.contains('matched')) attemptMatch(source.dataset.source, target.dataset.target);
  }

  source.addEventListener('pointermove', move);
  source.addEventListener('pointerup', end);
  source.addEventListener('pointercancel', end);
}

function attemptMatch(sourceId, targetId) {
  const s = state.session;
  if (!s || s.roundMatchedIds.has(sourceId)) return;
  s.attemptsById[sourceId] = (s.attemptsById[sourceId] || 0) + 1;

  const sourceEl = main.querySelector(`[data-source="${cssEscape(sourceId)}"]`);
  const targetEl = main.querySelector(`[data-target="${cssEscape(targetId)}"]`);

  if (sourceId === targetId) {
    if (s.attemptsById[sourceId] === 1) s.firstTryCorrect += 1;
    s.roundMatchedIds.add(sourceId);
    s.matched += 1;
    s.selectedSourceId = null;
    sourceEl?.classList.remove('selected');
    sourceEl?.classList.add('matched');
    targetEl?.classList.add('matched');
    sourceEl && (sourceEl.disabled = true);
    targetEl && (targetEl.disabled = true);
    s.lines.push({ sourceId, targetId });
    drawLines();
    updateProgress();
    flashFeedback('Correcto', true);

    if (s.roundMatchedIds.size === getRoundPairs().length) {
      setTimeout(() => {
        s.roundIndex += 1;
        if (s.matched >= s.total) finishSession(); else renderRound();
      }, 650);
    }
  } else {
    s.wrongAttempts += 1;
    sourceEl?.classList.add('wrong');
    targetEl?.classList.add('wrong');
    setTimeout(() => { sourceEl?.classList.remove('wrong'); targetEl?.classList.remove('wrong'); }, 350);
    flashFeedback('Prueba otra vez', false);
  }
}

function updateProgress() {
  const s = state.session;
  const text = document.getElementById('progressText');
  const bar = document.getElementById('progressBar');
  if (text) text.textContent = `${s.matched} / ${s.total}`;
  if (bar) bar.style.width = `${(s.matched / s.total) * 100}%`;
}

function flashFeedback(text, good) {
  const el = document.getElementById('feedback');
  if (!el) return;
  el.textContent = text;
  el.className = `feedback ${good ? 'good' : 'bad'}`;
  clearTimeout(flashFeedback._t);
  flashFeedback._t = setTimeout(() => { if (el) { el.textContent = ''; el.className = 'feedback'; } }, 900);
}

function drawLines() {
  const s = state.session;
  const board = document.getElementById('board');
  const svg = document.getElementById('matchSvg');
  if (!s || !board || !svg) return;
  const boardRect = board.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
  svg.innerHTML = s.lines.map(line => {
    const a = main.querySelector(`[data-source="${cssEscape(line.sourceId)}"]`)?.getBoundingClientRect();
    const b = main.querySelector(`[data-target="${cssEscape(line.targetId)}"]`)?.getBoundingClientRect();
    if (!a || !b) return '';
    const x1 = a.right - boardRect.left;
    const y1 = a.top + a.height / 2 - boardRect.top;
    const x2 = b.left - boardRect.left;
    const y2 = b.top + b.height / 2 - boardRect.top;
    return `<line class="match-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
  }).join('');
}

function finishSession() {
  const s = state.session;
  if (!s) return;
  const endedAt = Date.now();
  const result = {
    id: s.id,
    date: new Date().toISOString(),
    setId: s.setId,
    setName: s.setName,
    mode: s.mode,
    total: s.total,
    firstTryCorrect: s.firstTryCorrect,
    wrongAttempts: s.wrongAttempts,
    totalAttempts: Object.values(s.attemptsById).reduce((a,b) => a+b,0),
    durationMs: endedAt - s.startedAt,
    score: Math.round((s.firstTryCorrect / s.total) * 100)
  };
  state.results.unshift(result);
  state.results = state.results.slice(0, 500);
  saveResults();
  state.session = null;
  renderResult(result);
}

function renderResult(result) {
  state.screen = 'result';
  main.innerHTML = `
    <section class="card" style="text-align:center">
      <span class="badge">Ejercicio completado</span>
      <div class="score-big">${result.score}%</div>
      <h1 style="margin:8px 0 6px">${result.firstTryCorrect} de ${result.total} al primer intento</h1>
      <p style="margin:0;color:var(--muted)">La puntuación pertenece a este ejercicio y no es una valoración clínica.</p>
      <div class="stat-grid section" style="text-align:left">
        <div class="stat"><strong>${result.firstTryCorrect}</strong><span>Primer intento correcto</span></div>
        <div class="stat"><strong>${result.wrongAttempts}</strong><span>Intentos incorrectos</span></div>
        <div class="stat"><strong>${result.totalAttempts}</strong><span>Intentos totales</span></div>
        <div class="stat"><strong>${formatDuration(result.durationMs)}</strong><span>Tiempo</span></div>
      </div>
      <div class="actions" style="justify-content:center">
        <button id="repeatBtn" class="btn btn-primary btn-large" type="button">Repetir ejercicio</button>
        <button id="historyResultBtn" class="btn btn-secondary btn-large" type="button">Ver evolución</button>
        <button id="homeResultBtn" class="btn btn-ghost btn-large" type="button">Inicio</button>
      </div>
    </section>`;
  document.getElementById('repeatBtn').addEventListener('click', () => startSession(result.setId));
  document.getElementById('historyResultBtn').addEventListener('click', renderHistory);
  document.getElementById('homeResultBtn').addEventListener('click', renderHome);
}

function renderHistory() {
  state.screen = 'history';
  const rows = state.results.map(r => `
    <tr>
      <td>${escapeHTML(formatDate(r.date))}</td>
      <td>${escapeHTML(r.setName)}</td>
      <td>${r.mode === 'drag' ? 'Arrastrar' : 'Relacionar'}</td>
      <td><strong>${r.score}%</strong></td>
      <td>${r.firstTryCorrect}/${r.total}</td>
      <td>${r.wrongAttempts}</td>
      <td>${formatDuration(r.durationMs)}</td>    </tr>`).join('');
  const avg = state.results.length ? Math.round(state.results.reduce((sum,r) => sum + r.score,0) / state.results.length) : 0;
  const totalMinutes = Math.round(state.results.reduce((sum,r)=>sum + Number(r.durationMs||0),0)/60000);

  main.innerHTML = `
    <section class="results-hero card">
      <div class="section-title"><div><span class="home-eyebrow">Seguimiento</span><h1 style="margin:5px 0 0">Resultados y evolución</h1><p>${syncState.server ? 'Histórico centralizado en este PC y disponible para los dispositivos conectados.' : 'Histórico guardado en este navegador. En esta primera prueba no se sincroniza entre dispositivos.'}</p></div></div>
      ${state.results.length ? `
        <div class="stat-grid results-stat-grid">
          <div class="stat"><strong>${state.results.length}</strong><span>Tests realizados</span></div>
          <div class="stat"><strong>${avg}%</strong><span>Media de puntuación</span></div>
          <div class="stat"><strong>${Math.max(...state.results.map(r=>r.score))}%</strong><span>Mejor puntuación</span></div>
          <div class="stat"><strong>${totalMinutes} min</strong><span>Tiempo acumulado</span></div>
        </div>
      ` : ''}
    </section>

    ${state.results.length ? `
      <section class="section results-charts-grid">
        <article class="card chart-card">
          <div class="chart-heading"><h2>Evolución de puntuación</h2><p>Últimas ${Math.min(state.results.length,12)} sesiones. Cada punto representa un test completado.</p></div>
          ${resultTrendSVG(state.results, false)}
        </article>
        <article class="card chart-card">
          <div class="chart-heading"><h2>Resultado por tipo de ejercicio</h2><p>Media de puntuación y último resultado registrado.</p></div>
          <div class="result-bars">${resultByExerciseBars(state.results)}</div>
        </article>
      </section>

      <section class="section card">
        <div class="section-title"><div><h2>Tests realizados</h2><p>Detalle de cada sesión guardada.</p></div></div>
        <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Ejercicio</th><th>Modo</th><th>Puntuación</th><th>1.er intento</th><th>Errores</th><th>Tiempo</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="actions"><button id="exportCsvBtn" class="btn btn-secondary" type="button">Exportar CSV</button><button id="clearHistoryBtn" class="btn btn-danger" type="button">Borrar resultados</button></div>
      </section>
    ` : '<section class="section card"><div class="empty">Todavía no hay resultados guardados. Completa un ejercicio para que aquí aparezcan los gráficos de evolución.</div></section>'}`;

  document.getElementById('exportCsvBtn')?.addEventListener('click', exportResultsCSV);
  document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    if (!confirm('¿Borrar todo el histórico de resultados?')) return;
    state.results = []; saveResults(); renderHistory();
  });
}

function exportResultsCSV() {
  const header = ['fecha','ejercicio','modo','total','primer_intento_correcto','intentos_incorrectos','intentos_totales','tiempo_segundos','puntuacion'];
  const lines = state.results.map(r => [r.date,r.setName,r.mode,r.total,r.firstTryCorrect,r.wrongAttempts,r.totalAttempts,Math.round(r.durationMs/1000),r.score]);
  const csv = [header, ...lines].map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(';')).join('\n');
  downloadBlob(new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'}), 'resultados-cognitivos.csv');
}

function renderAdmin() {
  if (typeof MULTIUSER !== 'undefined' && MULTIUSER.role !== 'admin') {
    toast('Solo el administrador puede modificar el contenido.');
    return renderHome();
  }
  state.screen = 'admin';
  state.editing = null;
  main.innerHTML = `
    <section class="card">
      <div class="section-title"><div><h1 style="margin:0">Contenido</h1><p>Añade, modifica o elimina elementos sin tocar el código.</p></div></div>
      <div class="actions" style="margin-top:0;margin-bottom:18px">
        <button id="newCollectionBtn" class="btn btn-primary" type="button">Nueva colección</button>
        <button id="exportContentBtn" class="btn btn-secondary" type="button">Exportar contenido JSON</button>
        <button id="importContentBtn" class="btn btn-secondary" type="button">Importar JSON</button>
        <button id="resetContentBtn" class="btn btn-danger" type="button">Restaurar contenido inicial</button>
      </div>
      <div class="admin-tabs" id="adminTabs">
        ${state.content.sets.map((set,i) => `<button type="button" class="pill ${i===0?'active':''}" data-admin-set="${escapeHTML(set.id)}">${escapeHTML(set.name)}</button>`).join('')}
      </div>
      <div id="adminBody"></div>
    </section>`;
  document.getElementById('newCollectionBtn').addEventListener('click', createCollection);
  document.getElementById('exportContentBtn').addEventListener('click', exportContentJSON);
  document.getElementById('importContentBtn').addEventListener('click', () => importFile.click());
  document.getElementById('resetContentBtn').addEventListener('click', resetContent);
  main.querySelectorAll('[data-admin-set]').forEach(btn => btn.addEventListener('click', () => selectAdminSet(btn.dataset.adminSet)));
  selectAdminSet(state.content.sets[0]?.id);
}

function createCollection() {
  const name = prompt('Nombre de la nueva colección (por ejemplo: Fotografías familiares)');
  if (!name?.trim()) return;
  const description = prompt('Descripción breve del ejercicio', 'Relaciona cada imagen con su palabra o descripción.') || '';
  const set = {
    id: uid('coleccion'),
    name: name.trim(),
    short: name.trim(),
    description: description.trim(),
    icon: '🖼️',
    pairs: []
  };
  state.content.sets.push(set);
  saveContent();
  renderAdmin();
  setTimeout(() => selectAdminSet(set.id), 0);
  toast('Colección creada. Ya puedes cargar fotografías o figuras.');
}

function selectAdminSet(setId) {
  main.querySelectorAll('[data-admin-set]').forEach(btn => btn.classList.toggle('active', btn.dataset.adminSet === setId));
  renderAdminSet(setId);
}

function renderAdminSet(setId, editId = null) {
  const set = state.content.sets.find(s => s.id === setId);
  if (!set) return;
  const item = editId ? set.pairs.find(p => p.id === editId) : null;
  state.editing = item ? { setId, editId } : null;
  const type = item?.visual?.type || (setId === 'colores-palabras' ? 'color' : setId === 'formas-colores' ? 'shape' : 'emoji');
  const tableRows = set.pairs.map(p => `
    <tr>
      <td>${visualHTML(p.visual)}</td>
      <td>${escapeHTML(p.target)}</td>
      <td>${escapeHTML(p.visual.type)}</td>
      <td><button class="btn btn-ghost" type="button" data-edit-item="${escapeHTML(p.id)}">Editar</button> <button class="btn btn-danger" type="button" data-delete-item="${escapeHTML(p.id)}">Eliminar</button></td>
    </tr>`).join('');

  document.getElementById('adminBody').innerHTML = `
    <div class="grid grid-2">
      <div>
        <h2>${item ? 'Editar elemento' : 'Añadir elemento'}</h2>
        <form id="contentForm">
          <div class="field">
            <label for="visualType">Tipo visual</label>
            <select id="visualType">
              <option value="emoji" ${type==='emoji'?'selected':''}>Emoji / símbolo</option>
              <option value="color" ${type==='color'?'selected':''}>Color</option>
              <option value="shape" ${type==='shape'?'selected':''}>Forma geométrica</option>
              <option value="image" ${type==='image'?'selected':''}>Imagen SVG propia</option>
              <option value="text" ${type==='text'?'selected':''}>Texto</option>
            </select>
          </div>
          <div id="visualFields" style="margin-top:14px"></div>
          <div class="field" style="margin-top:14px">
            <label for="targetText">Palabra / respuesta</label>
            <input id="targetText" maxlength="80" value="${escapeHTML(item?.target || '')}" placeholder="Ej.: MANZANA" required />
          </div>
          <div class="actions">
            <button class="btn btn-primary" type="submit">${item ? 'Guardar cambios' : 'Añadir'}</button>
            ${item ? '<button id="cancelEditBtn" class="btn btn-ghost" type="button">Cancelar edición</button>' : ''}
          </div>
        </form>
        <p class="help">${syncState.server ? 'Las imágenes y cambios se guardan automáticamente en el PC servidor y se actualizan en los demás dispositivos.' : 'Las imágenes se guardan en este navegador. Para sincronización automática inicia el servidor local incluido.'}</p>
      </div>
      <div>
        <h2>Vista previa</h2>
        <div id="previewBox" class="preview-box"></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title"><div><h2>Elementos actuales</h2><p>${set.pairs.length} elementos disponibles. Para test de 20 conviene mantener al menos 20.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Visual</th><th>Respuesta</th><th>Tipo</th><th>Acciones</th></tr></thead><tbody>${tableRows}</tbody></table></div>
    </div>`;

  const typeSelect = document.getElementById('visualType');
  typeSelect.addEventListener('change', () => renderVisualFields(typeSelect.value, null));
  renderVisualFields(type, item?.visual || null);
  document.getElementById('contentForm').addEventListener('submit', e => saveContentItem(e, setId));
  document.getElementById('cancelEditBtn')?.addEventListener('click', () => renderAdminSet(setId));
  document.querySelectorAll('[data-edit-item]').forEach(btn => btn.addEventListener('click', () => renderAdminSet(setId, btn.dataset.editItem)));
  document.querySelectorAll('[data-delete-item]').forEach(btn => btn.addEventListener('click', () => deleteContentItem(setId, btn.dataset.deleteItem)));
}

function renderVisualFields(type, visual) {
  const wrap = document.getElementById('visualFields');
  if (!wrap) return;
  if (type === 'emoji' || type === 'text') {
    wrap.innerHTML = `<div class="field"><label for="visualValue">${type === 'emoji' ? 'Emoji o símbolo' : 'Texto visual'}</label><input id="visualValue" value="${escapeHTML(visual?.value || '')}" placeholder="${type === 'emoji' ? '🍎' : 'CASA'}" required /></div>`;
  } else if (type === 'color') {
    wrap.innerHTML = `<div class="field"><label for="visualColor">Color</label><input id="visualColor" type="color" value="${escapeHTML(visual?.value || '#1e66f5')}" /></div>`;
  } else if (type === 'shape') {
    wrap.innerHTML = `<div class="form-grid"><div class="field"><label for="shapeType">Forma</label><select id="shapeType"><option value="circle">Círculo</option><option value="square">Cuadrado</option><option value="triangle">Triángulo</option><option value="diamond">Rombo</option><option value="rectangle">Rectángulo</option></select></div><div class="field"><label for="shapeColor">Color</label><input id="shapeColor" type="color" value="${escapeHTML(visual?.color || '#e53935')}" /></div></div>`;
    document.getElementById('shapeType').value = visual?.shape || 'circle';
  } else if (type === 'image') {
    wrap.innerHTML = `<div class="field"><label for="imageFile">Imagen SVG</label><input id="imageFile" type="file" accept=".svg,image/svg+xml" ${visual?.value ? '' : 'required'} /><input id="existingImage" type="hidden" value="${escapeHTML(visual?.value || '')}" /></div><div class="field" style="margin-top:10px"><label for="imageAlt">Descripción accesible</label><input id="imageAlt" value="${escapeHTML(visual?.alt || '')}" placeholder="Ej.: foto de una taza" /></div>`;
  }
  const update = () => updatePreview(type);
  wrap.querySelectorAll('input,select').forEach(el => el.addEventListener('input', update));
  document.getElementById('targetText')?.addEventListener('input', update);
  updatePreview(type, visual);
}

function currentVisualFromForm(type, fallbackVisual = null) {
  if (type === 'emoji' || type === 'text') return { type, value: document.getElementById('visualValue')?.value || '' };
  if (type === 'color') return { type, value: document.getElementById('visualColor')?.value || '#1e66f5' };
  if (type === 'shape') return { type, shape: document.getElementById('shapeType')?.value || 'circle', color: document.getElementById('shapeColor')?.value || '#e53935' };
  if (type === 'image') return fallbackVisual || { type, value: document.getElementById('existingImage')?.value || '', alt: document.getElementById('imageAlt')?.value || '' };
  return { type: 'text', value: '?' };
}

function updatePreview(type, fallbackVisual = null) {
  const box = document.getElementById('previewBox');
  if (!box) return;
  const visual = currentVisualFromForm(type, fallbackVisual);
  const target = document.getElementById('targetText')?.value || 'RESPUESTA';
  box.innerHTML = `<div class="match-card" style="max-width:360px">${visualHTML(visual)}<span class="word">${escapeHTML(target)}</span></div>`;
}

async function saveContentItem(event, setId) {
  event.preventDefault();
  const set = state.content.sets.find(s => s.id === setId);
  const type = document.getElementById('visualType').value;
  const target = document.getElementById('targetText').value.trim();
  if (!target) return;
  let visual;
  if (type === 'image') {
    const file = document.getElementById('imageFile').files[0];
    if (file && file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
      toast('Selecciona un archivo SVG.');
      return;
    }
    const existing = document.getElementById('existingImage').value;
    const value = file ? await fileToDataURL(file) : existing;
    if (!value) { toast('Selecciona una imagen.'); return; }
    visual = { type: 'image', value, alt: document.getElementById('imageAlt').value.trim() };
  } else {
    visual = currentVisualFromForm(type);
  }

  if (state.editing?.setId === setId) {
    const item = set.pairs.find(p => p.id === state.editing.editId);
    if (item) { item.visual = visual; item.target = target; }
    toast('Elemento actualizado.');
  } else {
    set.pairs.push({ id: uid('item'), visual, target });
    toast('Elemento añadido.');
  }
  saveContent();
  renderAdminSet(setId);
}

function deleteContentItem(setId, itemId) {
  const set = state.content.sets.find(s => s.id === setId);
  if (!set) return;
  if (!confirm('¿Eliminar este elemento?')) return;
  set.pairs = set.pairs.filter(p => p.id !== itemId);
  saveContent();
  renderAdminSet(setId);
}

function exportContentJSON() {
  const blob = new Blob([JSON.stringify(state.content, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'contenido-cognitivo.json');
}

importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  importFile.value = '';
  if (!file) return;
  try {
    const json = JSON.parse(await file.text());
    validateContent(json);
    state.content = json;
    saveContent();
    toast('Contenido importado.');
    renderAdmin();
  } catch (err) {
    alert(`No se pudo importar el archivo: ${err.message}`);
  }
});

function validateContent(json) {
  if (!json || !Array.isArray(json.sets) || !json.sets.length) throw new Error('formato de contenido no válido');
  json.sets.forEach(set => {
    if (!set.id || !set.name || !Array.isArray(set.pairs)) throw new Error('falta una colección o sus elementos');
    set.pairs.forEach(p => { if (!p.id || !p.visual || !p.target) throw new Error('hay un elemento incompleto'); });
  });
}

function resetContent() {
  if (!confirm('¿Restaurar el contenido inicial? Se perderán las modificaciones de contenido, pero no los resultados.')) return;
  state.content = structuredClone(defaultContent);
  saveContent();
  toast('Contenido restaurado.');
  renderAdmin();
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

async function loadServerContent() {
  const response = await fetch('/api/content', { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.exists && data.content) {
    validateContent(data.content);
    const originalCount = data.content.sets.length;
    state.content = ensureBuiltinSets(data.content);
    localStorage.setItem(STORAGE_CONTENT, JSON.stringify(state.content));
    syncState.contentVersion = data.version || 0;
    if (state.content.sets.length !== originalCount) {
      const saved = await putServer('/api/content', state.content);
      syncState.contentVersion = saved.version || syncState.contentVersion;
    }
  } else {
    const info = await putServer('/api/content', state.content);
    syncState.contentVersion = info.version || 0;
  }
}

async function loadServerResults() {
  const response = await fetch('/api/results', { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  state.results = Array.isArray(data.results) ? data.results : [];
  localStorage.setItem(STORAGE_RESULTS, JSON.stringify(state.results));
  syncState.resultsVersion = data.version || 0;
}

async function checkAppVersion(force = false) {
  // En modo servidor local, la API hace la comprobacion. En modo web estatico,
  // se consulta version.json directamente para detectar una publicacion nueva.
  if (syncState.server) {
    try {
      const response = await fetch(`/api/version${force ? '?force=1' : ''}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const info = await response.json();
      syncState.versionInfo = info;
      if (state.screen === 'home') renderHome();
      if (force) {
        if (info.updateAvailable) toast(`Nueva version v${info.remote?.version || ''} disponible.`);
        else if (info.status === 'ok') toast('Ya tienes la version mas reciente.');
        else toast('No se pudo comprobar la version remota.');
      }
    } catch {
      syncState.versionInfo = { local: syncState.versionInfo?.local || APP_FALLBACK_META, status: 'unavailable', updateAvailable: false };
      if (state.screen === 'home') renderHome();
    }
    return;
  }

  const compare = (a, b) => {
    const pa = String(a || '0').split('.').map(n => Number(n) || 0);
    const pb = String(b || '0').split('.').map(n => Number(n) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    }
    return 0;
  };

  try {
    const cacheBust = `${force ? 'force' : 'startup'}-${Date.now()}`;
    let response = await fetch(`version.json?v=${encodeURIComponent(cacheBust)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remote = await response.json();
    const updateAvailable = compare(remote.version, APP_FALLBACK_META.version) > 0;
    syncState.versionInfo = {
      local: APP_FALLBACK_META,
      remote,
      status: 'ok',
      updateAvailable,
      releaseUrl: remote.releaseUrl || remote.repositoryUrl || 'https://github.com/shishamha-sudo/ictus-cognitivo'
    };
    if (state.screen === 'home') renderHome();
    if (force) toast(updateAvailable ? `Nueva version v${remote.version} disponible.` : 'Ya tienes la version mas reciente.');
  } catch {
    // Si la pagina aun no esta publicada o no hay red, la app continua funcionando.
    syncState.versionInfo = { local: APP_FALLBACK_META, status: 'unavailable', updateAvailable: false };
    if (state.screen === 'home') renderHome();
    if (force) toast('No se pudo comprobar la version remota.');
  }
}

async function connectLocalServer() {
  if (!location.protocol.startsWith('http')) {
    setSyncStatus('Solo dispositivo');
    return;
  }
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    if (!response.ok) throw new Error('Servidor sin API');
    const info = await response.json();
    if (!info.ok) throw new Error('API no disponible');
    syncState.server = true;
    syncState.appVersion = info.appVersion || 0;
    syncState.versionInfo = { local: info.version || APP_FALLBACK_META, status: 'pending', updateAvailable: false };
    setSyncStatus('Sincronizado', 'ok');
    await Promise.all([loadServerContent(), loadServerResults()]);
    if (state.screen === 'home') renderHome();
    checkAppVersion(false);
    setInterval(checkServerUpdates, 3500);
  } catch {
    syncState.server = false;
    setSyncStatus(location.protocol.startsWith('http') ? 'Web' : 'Dispositivo');
    checkAppVersion(false);
  }
}

async function checkServerUpdates() {
  if (syncState.checking || !syncState.server) return;
  syncState.checking = true;
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    if (!response.ok) throw new Error('offline');
    const info = await response.json();
    setSyncStatus('Sincronizado', 'ok');

    if (syncState.appVersion && info.appVersion && info.appVersion !== syncState.appVersion) {
      if (!state.session && state.screen !== 'admin') {
        location.reload();
        return;
      }
      setSyncStatus('Actualización pendiente', 'working');
    }

    if (info.contentVersion && info.contentVersion !== syncState.contentVersion) {
      await loadServerContent();
      if (state.screen === 'home') renderHome();
      else if (state.screen === 'admin' && !document.activeElement?.matches('input, textarea, select')) renderAdmin();
      toast('Contenido actualizado automáticamente.');
    }

    if (info.resultsVersion && info.resultsVersion !== syncState.resultsVersion) {
      await loadServerResults();
      if (state.screen === 'history') renderHistory();
    }
  } catch {
    setSyncStatus('Sin conexión', 'bad');
  } finally {
    syncState.checking = false;
  }
}

// Esta versión prioriza siempre los archivos actuales del PC; elimina caches PWA antiguos.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(reg => reg.unregister())).catch(() => {});
}

document.getElementById('homeBtn').addEventListener('click', renderHome);
document.getElementById('historyBtn').addEventListener('click', renderHistory);
document.getElementById('adminBtn').addEventListener('click', renderAdmin);

renderHome();
connectLocalServer();
