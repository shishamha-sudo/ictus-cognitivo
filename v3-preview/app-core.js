'use strict';

const STORAGE_CONTENT = 'cognitivo.content.v1';
const STORAGE_RESULTS = 'cognitivo.results.v1';
const STORAGE_SETTINGS = 'cognitivo.settings.v1';
const APP_FALLBACK_META = { app: 'ICTUS Cognitivo Web', version: '4.17', date: '—' };

const palette = {
  rojo: '#e53935', azul: '#1e66f5', verde: '#2e9d57', amarillo: '#f2c94c', naranja: '#f28c28',
  morado: '#7e57c2', rosa: '#e8659a', negro: '#222222', gris: '#87909a', marron: '#8b5e3c',
  turquesa: '#2bbbad', celeste: '#5bb9e8', lima: '#8bc34a', beige: '#d6c5a3', granate: '#8e244d',
  violeta: '#9c4dcc', coral: '#f26b5e', mostaza: '#c89b2c', oliva: '#7a8b3a', azulmarino: '#253b80'
};

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const SET_ICON_BY_ID={
  'figuras-palabras':'icon-figures',
  'colores-palabras':'icon-colors',
  'formas-colores':'icon-shapes',
  'figuras-complejas':'icon-complex'
};
function iconHTML(id, cls='ui-svg-icon', label=''){
  const safe=escapeHTML(String(id||'icon-custom').replace(/^#/,''));
  const aria=label?' role="img" aria-label="'+escapeHTML(label)+'"':' aria-hidden="true"';
  return '<svg class="'+escapeHTML(cls)+'" viewBox="0 0 160 120"'+aria+'><use href="#'+safe+'"></use></svg>';
}
function setIconId(set){
  return SET_ICON_BY_ID[set?.id] || (String(set?.icon||'').startsWith('icon-')?set.icon:'icon-custom');
}


function complexFigureData(index) {
  const variants = [
    ['Rectángulo con diagonales, círculo y cruz', '<rect x="30" y="28" width="140" height="96"/><line x1="30" y1="28" x2="170" y2="124"/><line x1="170" y1="28" x2="30" y2="124"/><circle cx="100" cy="76" r="19"/><line x1="100" y1="10" x2="100" y2="142"/><line x1="16" y1="76" x2="184" y2="76"/>'],
    ['Dos cuadrados superpuestos y triángulo superior', '<rect x="30" y="42" width="88" height="82"/><rect x="80" y="30" width="88" height="82"/><path d="M58 42 L100 8 L142 42 Z"/><line x1="30" y1="124" x2="168" y2="30"/>'],
    ['Rombo central con círculo y líneas laterales', '<path d="M100 20 L158 76 L100 132 L42 76 Z"/><circle cx="100" cy="76" r="22"/><line x1="10" y1="40" x2="70" y2="76"/><line x1="130" y1="76" x2="190" y2="112"/><line x1="100" y1="20" x2="100" y2="132"/>'],
    ['Figura escalonada con dos círculos', '<path d="M24 118 L24 72 L64 72 L64 38 L112 38 L112 18 L172 18 L172 118 Z"/><circle cx="52" cy="96" r="13"/><circle cx="138" cy="64" r="17"/><line x1="24" y1="118" x2="172" y2="18"/>'],
    ['Hexágono con cruz interior y triángulo', '<path d="M55 24 L145 24 L180 76 L145 128 L55 128 L20 76 Z"/><line x1="100" y1="24" x2="100" y2="128"/><line x1="20" y1="76" x2="180" y2="76"/><path d="M72 101 L100 50 L128 101 Z"/>']
  ];
  const [label, body] = variants[index % variants.length];
  const extra = index >= 5 ? `<circle cx="${30 + (index * 17) % 140}" cy="${24 + (index * 23) % 100}" r="${5 + index % 9}" fill="none"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 200 150"><rect width="200" height="150" fill="white"/><g fill="none" stroke="#17212b" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${body}${extra}</g></svg>`;
  return { value: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, label: `${label}${index >= 5 ? ` · variante ${index + 1}` : ''}` };
}

const complexPairs = Array.from({ length: 20 }, (_, i) => {
  const figure = complexFigureData(i);
  return {
    id: `figura-compleja-${i + 1}`,
    visual: { type: 'image', value: figure.value, alt: `Figura geométrica compleja ${i + 1}` },
    target: figure.label.toUpperCase()
  };
});


const FIGURE_PHOTOS = [
  ['manzana','MANZANA'],['perro','PERRO'],['casa','CASA'],['coche','COCHE'],
  ['gato','GATO'],['platano','PLÁTANO'],['telefono','TELÉFONO'],['llave','LLAVE'],
  ['reloj','RELOJ'],['libro','LIBRO'],['pelota','PELOTA'],['flor','FLOR'],
  ['taza','TAZA'],['pan','PAN'],['bicicleta','BICICLETA'],['avion','AVIÓN'],
  ['sol','SOL'],['luna','LUNA'],['pez','PEZ'],['pajaro','PÁJARO'],
  ['zapato','ZAPATO'],['camisa','CAMISETA'],['paraguas','PARAGUAS'],['regalo','REGALO'],
  ['arbol','ÁRBOL'],['queso','QUESO'],['leche','LECHE'],['cuchara','CUCHARA'],
  ['puerta','PUERTA'],['cama','CAMA']
].map(([id,target]) => ({
  id,
  visual:{
    type:'svg',
    value:`#${id}`,
    alt:`Figura de ${target.toLowerCase()}`,
    builtin:true
  },
  target
}));

const defaultContent = {
  version: 1,
  sets: [
    {
      id: 'figuras-palabras',
      name: 'Figuras y palabras',
      short: 'Figura ↔ palabra',
      description: 'Relaciona cada figura con la palabra que le corresponde.',
      icon: 'icon-figures',
      pairs: FIGURE_PHOTOS
    },
    {
      id: 'colores-palabras',
      name: 'Colores y palabras',
      short: 'Color ↔ palabra',
      description: 'Relaciona cada muestra de color con su nombre.',
      icon: 'icon-colors',
      pairs: Object.entries(palette).map(([id, value]) => ({ id, visual: { type: 'color', value }, target: id === 'marron' ? 'MARRÓN' : id === 'azulmarino' ? 'AZUL MARINO' : id.toUpperCase() }))
    },
    {
      id: 'formas-colores',
      name: 'Formas, colores y palabras',
      short: 'Forma + color ↔ descripción',
      description: 'Relaciona la figura de color con su descripción completa.',
      icon: 'icon-shapes',
      pairs: [
        ['circulo-rojo','circle','#e53935','CÍRCULO ROJO'],['circulo-azul','circle','#1e66f5','CÍRCULO AZUL'],
        ['circulo-verde','circle','#2e9d57','CÍRCULO VERDE'],['circulo-amarillo','circle','#f2c94c','CÍRCULO AMARILLO'],
        ['cuadrado-rojo','square','#e53935','CUADRADO ROJO'],['cuadrado-azul','square','#1e66f5','CUADRADO AZUL'],
        ['cuadrado-verde','square','#2e9d57','CUADRADO VERDE'],['cuadrado-amarillo','square','#f2c94c','CUADRADO AMARILLO'],
        ['triangulo-rojo','triangle','#e53935','TRIÁNGULO ROJO'],['triangulo-azul','triangle','#1e66f5','TRIÁNGULO AZUL'],
        ['triangulo-verde','triangle','#2e9d57','TRIÁNGULO VERDE'],['triangulo-amarillo','triangle','#f2c94c','TRIÁNGULO AMARILLO'],
        ['rombo-rojo','diamond','#e53935','ROMBO ROJO'],['rombo-azul','diamond','#1e66f5','ROMBO AZUL'],
        ['rombo-verde','diamond','#2e9d57','ROMBO VERDE'],['rombo-amarillo','diamond','#f2c94c','ROMBO AMARILLO'],
        ['rectangulo-rojo','rectangle','#e53935','RECTÁNGULO ROJO'],['rectangulo-azul','rectangle','#1e66f5','RECTÁNGULO AZUL'],
        ['rectangulo-verde','rectangle','#2e9d57','RECTÁNGULO VERDE'],['rectangulo-amarillo','rectangle','#f2c94c','RECTÁNGULO AMARILLO']
      ].map(([id, shape, color, target]) => ({ id, visual: { type: 'shape', shape, color }, target }))
    },
    {
      id: 'figuras-complejas',
      name: 'Figuras complejas',
      short: 'Discriminación visual compleja',
      description: 'Relaciona una figura geométrica compleja con su descripción. Estímulos originales para entrenamiento; no sustituye una prueba neuropsicológica validada.',
      icon: 'icon-complex',
      pairs: complexPairs
    }
  ]
};

function ensureBuiltinSets(content) {
  const safe = content && Array.isArray(content.sets) ? content : structuredClone(defaultContent);
  const existing = new Set(safe.sets.map(set => set.id));
  for (const builtIn of defaultContent.sets) {
    if (!existing.has(builtIn.id)) safe.sets.push(structuredClone(builtIn));
  }

  // Migra automáticamente la colección base antigua de emojis a fotografías.
  // Se conservan las imágenes personalizadas que haya subido el usuario.
  const figures = safe.sets.find(set => set.id === 'figuras-palabras');
  if (figures) {
    const photoById = new Map(FIGURE_PHOTOS.map(pair => [pair.id, pair]));
    figures.pairs = figures.pairs.map(pair => {
      const replacement = photoById.get(pair.id);
      if (!replacement) return pair;
      const value = String(pair?.visual?.value || '');
      const isOldBuiltin = pair?.visual?.type === 'emoji'
        || pair?.visual?.type === 'svg'
        || value.includes('loremflickr.com/')
        || value.includes('openmoji')
        || pair?.visual?.builtin === true;
      return isOldBuiltin ? structuredClone(replacement) : pair;
    });
  }

  safe.version = Math.max(Number(safe.version || 1), 3);
  return safe;
}

const state = {
  content: ensureBuiltinSets(loadJSON(STORAGE_CONTENT, defaultContent)),
  results: loadJSON(STORAGE_RESULTS, []),
  settings: loadJSON(STORAGE_SETTINGS, { roundSize: 4 }),
  selectedSetId: null,
  config: { count: 10, mode: 'link' },
  session: null,
  editing: null,
  screen: 'home'
};

const main = document.getElementById('main');
const toastEl = document.getElementById('toast');
const importFile = document.getElementById('importFile');
const syncStatusEl = document.getElementById('syncStatus');
const syncState = { server: false, contentVersion: 0, resultsVersion: 0, appVersion: 0, checking: false, versionInfo: { local: APP_FALLBACK_META, status: 'pending', updateAvailable: false } };


function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function setSyncStatus(text, kind = '') {
  if (!syncStatusEl) return;
  syncStatusEl.textContent = text;
  syncStatusEl.className = `sync-status ${kind}`.trim();
}

async function putServer(path, payload) {
  const response = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function saveContent() {
  localStorage.setItem(STORAGE_CONTENT, JSON.stringify(state.content));
  if (!syncState.server) return;
  setSyncStatus('Guardando…', 'working');
  putServer('/api/content', state.content)
    .then(info => {
      syncState.contentVersion = info.version || syncState.contentVersion;
      setSyncStatus('Sincronizado', 'ok');
    })
    .catch(() => setSyncStatus('Sin conexión', 'bad'));
}

function saveResults() {
  localStorage.setItem(STORAGE_RESULTS, JSON.stringify(state.results));
  if (!syncState.server) return;
  putServer('/api/results', state.results)
    .then(info => { syncState.resultsVersion = info.version || syncState.resultsVersion; })
    .catch(() => setSyncStatus('Sin conexión', 'bad'));
}
function saveSettings() { localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(state.settings)); }

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

function visualHTML(visual) {
  if (!visual) return '<span class="visual">?</span>';
  if (visual.type === 'emoji') return `<span class="visual svg-visual">${iconHTML('icon-custom','stimulus-svg','Símbolo')}</span>`;
  if (visual.type === 'color') return `<span class="visual svg-visual"><svg class="stimulus-svg" viewBox="0 0 100 100" role="img" aria-label="Muestra de color"><rect x="10" y="10" width="80" height="80" rx="18" fill="${escapeHTML(visual.value)}"/></svg></span>`;
  if (visual.type === 'shape') {
    const shape = visual.shape || 'circle';
    const color = escapeHTML(visual.color || '#333333');
    const body = shape === 'triangle'
      ? `<polygon points="50,8 92,88 8,88" fill="${color}"/>`
      : shape === 'diamond'
        ? `<polygon points="50,7 93,50 50,93 7,50" fill="${color}"/>`
        : shape === 'rectangle'
          ? `<rect x="8" y="24" width="84" height="52" rx="7" fill="${color}"/>`
          : shape === 'square'
            ? `<rect x="12" y="12" width="76" height="76" rx="8" fill="${color}"/>`
            : `<circle cx="50" cy="50" r="40" fill="${color}"/>`;
    return `<span class="visual svg-visual"><svg class="stimulus-svg" viewBox="0 0 100 100" role="img" aria-label="Forma geométrica">${body}</svg></span>`;
  }
  if (visual.type === 'svg') return `<span class="visual svg-visual"><svg class="stimulus-svg" viewBox="0 0 160 120" role="img" aria-label="${escapeHTML(visual.alt || 'Figura')}"><use href="${escapeHTML(visual.value)}"></use></svg></span>`;
  if (visual.type === 'photo') {
    const src=String(visual.value||'');
    return `<span class="visual photo-visual real-photo-visual"><img class="stimulus-photo real-photo-img" src="${escapeHTML(src)}" alt="${escapeHTML(visual.alt || 'Fotografía real')}" loading="eager" decoding="async" referrerpolicy="no-referrer"></span>`;
  }
  if (visual.type === 'image') {
    const src=String(visual.value||'');
    const isSvg=src.startsWith('data:image/svg+xml') || /\.svg(?:$|[?#])/i.test(src);
    return isSvg ? `<span class="visual photo-visual"><img class="stimulus-photo" src="${escapeHTML(src)}" alt="${escapeHTML(visual.alt || 'Imagen SVG')}" loading="lazy"></span>` : `<span class="visual svg-visual">${iconHTML('icon-custom','stimulus-svg','Imagen no disponible')}</span>`;
  }
  if (visual.type === 'text') return `<span class="word">${escapeHTML(visual.value)}</span>`;
  return `<span class="visual">${escapeHTML(visual.value || '?')}</span>`;
}

function resultTrendSVG(results, compact = false) {
  const recent = [...results].slice(0, compact ? 8 : 12).reverse();
  if (!recent.length) return '<div class="chart-empty">Aún no hay sesiones para mostrar.</div>';
  const w = compact ? 640 : 760;
  const h = compact ? 180 : 250;
  const pad = compact ? 28 : 42;
  const plotW = w - pad * 2;
  const plotH = h - pad * 2;
  const x = i => recent.length === 1 ? w/2 : pad + (i * plotW / (recent.length - 1));
  const y = score => pad + ((100 - score) * plotH / 100);
  const points = recent.map((r,i) => `${x(i)},${y(r.score)}`).join(' ');
  const circles = recent.map((r,i) => `<circle cx="${x(i)}" cy="${y(r.score)}" r="${compact ? 5 : 6}"><title>${escapeHTML(r.setName)}: ${r.score}% · ${escapeHTML(formatDate(r.date))}</title></circle>`).join('');
  const labels = compact ? '' : recent.map((r,i) => `<text x="${x(i)}" y="${h - 12}" text-anchor="middle">${new Date(r.date).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'})}</text>`).join('');
  return `<svg class="result-chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolución de puntuación de los últimos tests">
    <g class="chart-grid">
      <line x1="${pad}" y1="${y(100)}" x2="${w-pad}" y2="${y(100)}"></line>
      <line x1="${pad}" y1="${y(75)}" x2="${w-pad}" y2="${y(75)}"></line>
      <line x1="${pad}" y1="${y(50)}" x2="${w-pad}" y2="${y(50)}"></line>
      <line x1="${pad}" y1="${y(25)}" x2="${w-pad}" y2="${y(25)}"></line>
      <line x1="${pad}" y1="${y(0)}" x2="${w-pad}" y2="${y(0)}"></line>
    </g>
    <g class="chart-axis-labels"><text x="6" y="${y(100)+4}">100%</text><text x="12" y="${y(50)+4}">50%</text><text x="22" y="${y(0)+4}">0%</text>${labels}</g>
    <polyline class="chart-line" points="${points}" fill="none"></polyline>
    <g class="chart-points">${circles}</g>
  </svg>`;
}

function resultByExerciseBars(results) {
  if (!results.length) return '<div class="chart-empty">Aún no hay resultados por ejercicio.</div>';
  const grouped = new Map();
  results.forEach(r => {
    const g = grouped.get(r.setName) || { sum: 0, count: 0, latest: r };
    g.sum += Number(r.score || 0); g.count += 1;
    if (new Date(r.date) > new Date(g.latest.date)) g.latest = r;
    grouped.set(r.setName, g);
  });
  return [...grouped.entries()].map(([name,g]) => {
    const avg = Math.round(g.sum/g.count);
    return `<div class="result-bar-row">
      <div class="result-bar-label"><strong>${escapeHTML(name)}</strong><span>${g.count} ${g.count === 1 ? 'test' : 'tests'} · último ${g.latest.score}%</span></div>
      <div class="result-bar-track" aria-label="Media ${avg}%"><span style="width:${avg}%"></span></div>
      <strong class="result-bar-value">${avg}%</strong>
    </div>`;
  }).join('');
}

function recentResultsHTML(results, limit = 4) {
  if (!results.length) return '<div class="empty compact-empty">Todavía no hay tests realizados.</div>';
  return results.slice(0, limit).map(r => `
    <article class="recent-result">
      <div class="recent-result-icon">${iconHTML(setIconId(state.content.sets.find(s=>s.id===r.setId)),'recent-result-svg')}</div>
      <div class="recent-result-main"><strong>${escapeHTML(r.setName)}</strong><span>${escapeHTML(formatDate(r.date))} · ${formatDuration(r.durationMs)}</span></div>
      <div class="score-pill">${r.score}%</div>
    </article>`).join('');
}

function versionPanelHTML() {
  const info = syncState.versionInfo || {};
  const local = info.local || APP_FALLBACK_META;
  const remote = info.remote || null;
  const deployed = info.status === 'ok' && remote && String(remote.version) === String(local.version) ? remote : local;
  const version = escapeHTML(deployed.version || APP_FALLBACK_META.version);
  const date = escapeHTML(deployed.date || '—');
  let statusClass = 'version-neutral';
  let statusText = 'Comprobando actualizaciones...';

  if (info.status === 'ok' && info.updateAvailable) {
    statusClass = 'version-update';
    statusText = `Nueva versión v${escapeHTML(remote?.version || '')} disponible${remote?.date ? ` · ${escapeHTML(remote.date)}` : ''}`;
  } else if (info.status === 'ok') {
    statusClass = 'version-current';
    statusText = 'Aplicación actualizada';
  } else if (info.status === 'unavailable') {
    statusText = 'No se pudo comprobar la versión publicada. La aplicación puede usarse con normalidad.';
  } else if (info.status === 'not_configured') {
    statusText = 'Canal de actualizaciones pendiente de configurar.';
  }

  return `<div class="home-version-panel ${statusClass}">
    <div class="home-version-main">
      <span class="home-version-label">Versión instalada</span>
      <strong>v${version} <span>· ${date}</span></strong>
      <small>${statusText}</small>
    </div>
  </div>`;
}

function renderHome() {
  state.screen = 'home';
  state.session = null;

  const trainingCards = state.content.sets.filter(set => !set.menuOnly).map(set => `
    <article class="app-option-card">
      <div class="app-option-icon" aria-hidden="true">${iconHTML(setIconId(set),'app-svg-icon')}</div>
      <div class="app-option-copy">
        <span class="app-option-kicker">${set.pairs.length} elementos</span>
        <h3>${escapeHTML(set.name)}</h3>
        <p>${escapeHTML(set.description)}</p>
      </div>
      <button class="btn btn-primary btn-large app-option-action" data-start-set="${escapeHTML(set.id)}" type="button">Entrar</button>
    </article>`).join('');

  const memoryCards = [
    { icon:'icon-ram-words', name:'RAM · Palabras', desc:'Memoriza una secuencia de palabras y reprodúcela en orden directo o inverso.', action:'ram', task:'words' },
    { icon:'icon-ram-objects', name:'RAM · Objetos', desc:'Memoriza una secuencia de objetos cotidianos y reconstruye el orden.', action:'ram', task:'objects' },
    ...(typeof WM_TASKS !== 'undefined' ? WM_TASKS.map(t => ({
      icon:t.icon, name:t.name, desc:t.desc, action:'wm', task:t.id
    })) : [])
  ];

  const memoryHTML = memoryCards.map(item => `
    <article class="app-option-card memory-task-card">
      <div class="app-option-icon memory-task-icon" aria-hidden="true">${iconHTML(item.icon,'app-svg-icon')}</div>
      <div class="app-option-copy">
        <span class="app-option-kicker">Memoria de trabajo</span>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.desc)}</p>
      </div>
      <button class="btn btn-primary btn-large app-option-action"
        data-memory-action="${item.action}"
        data-memory-task="${escapeHTML(item.task)}"
        type="button">Entrar</button>
    </article>`).join('');

  main.innerHTML = `
    <section class="home-intro training-home-intro home-intro-compact">
      <h1>Entrenamientos</h1>
    </section>

    <section class="section home-training-group">
      <div class="section-title">
        <div>
          <h2>Asociación y discriminación</h2>
          <p>Ejercicios visuales, semánticos y de asociación.</p>
        </div>
      </div>
      <div class="app-options-grid">${trainingCards}</div>
    </section>

    <section class="section home-training-group memory-training-group">
      <div class="section-title">
        <div>
          <h2>${iconHTML('icon-memory','section-title-svg')} Memoria de trabajo</h2>
          <p>RAM, secuencias, localización, actualización mental y atención dividida.</p>
        </div>
      </div>
      <div class="app-options-grid memory-options-grid">${memoryHTML}</div>
    </section>
    <section class="home-version-compact">
      ${versionPanelHTML()}
    </section>`;

  main.querySelectorAll('[data-start-set]').forEach(btn =>
    btn.addEventListener('click', () => renderConfig(btn.dataset.startSet))
  );

  main.querySelectorAll('[data-memory-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.memoryAction;
      const task = btn.dataset.memoryTask;
      if (action === 'ram' && typeof renderRamConfig === 'function') renderRamConfig(task);
      if (action === 'wm' && typeof renderWmConfig === 'function') renderWmConfig(task);
    });
  });
}

