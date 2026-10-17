
'use strict';

const RAM_WORDS = [
  'CASA','MESA','PAN','SOL','MAR','GATO','LIBRO','CAFÉ','LLAVE','FLOR',
  'PERRO','VASO','TREN','MANO','LUNA','SILLA','VENTANA','RELOJ','CAMINO','NUBE'
];

const RAM_HOME_OBJECTS = [
  {id:'llave', label:'LLAVE'},
  {id:'puerta', label:'PUERTA'},
  {id:'cama', label:'CAMA'},
  {id:'taza', label:'TAZA'},
  {id:'libro', label:'LIBRO'},
  {id:'reloj', label:'RELOJ'},
  {id:'telefono', label:'TELÉFONO'},
  {id:'cuchara', label:'CUCHARA'}
];

const ramState = {
  type:null,
  direction:'forward',
  rounds:5,
  round:0,
  span:2,
  correctPositions:0,
  totalPositions:0,
  current:[],
  expected:[],
  answer:[],
  startedAt:0,
  phase:'idle',
  intervalSeconds:1.25
};

function ramShuffle(items) {
  return [...items].sort(() => Math.random() - .5);
}

function ramLog(eventType, detail={}) {
  if (typeof logUsage === 'function') return logUsage(eventType, detail).catch(()=>{});
  return Promise.resolve();
}

function installRamEntryPoints() {
  const actions = document.querySelector('.top-actions');
  if (!actions) return;
  let btn = document.getElementById('ramTopBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id='ramTopBtn';
    btn.type='button';
    btn.className='btn btn-secondary nav-btn';
    btn.innerHTML='<span class="nav-icon" aria-hidden="true">🧠</span><span class="nav-label">Memoria</span>';
    const history = document.getElementById('historyBtn');
    actions.insertBefore(btn, history || actions.firstChild);
  }
  btn.title='Memoria de trabajo: ver todas las actividades';
  btn.setAttribute('aria-label','Memoria de trabajo');
  if (btn.dataset.boundMemory !== '1') {
    btn.dataset.boundMemory='1';
    btn.addEventListener('click', () => typeof renderWmPanel === 'function' ? renderWmPanel() : renderRamPanel());
  }
}

function injectRamHomeCard() { return; }

function renderRamPanel() {
  state.screen='ram';
  state.session=null;
  main.innerHTML=`
    <section class="ram-hero">
      <span class="home-eyebrow">RAM · Memoria</span>
      <h1>Tareas RAM</h1>
      <p style="margin:0;color:var(--muted);font-size:18px">Selecciona una tarea. Se mostrarán secuencias cortas y después tendrás que reproducirlas. Puedes trabajar en orden directo o inverso.</p>
    </section>
    <section class="ram-grid">
      <article class="ram-card">
        <div class="ram-icon">Aa</div>
        <h2>RAM · Palabras</h2>
        <p>Memoriza una secuencia de palabras y selecciónalas después en el mismo orden o en orden inverso.</p>
        <button class="btn btn-primary btn-large" data-ram-task="words" type="button">Empezar palabras</button>
      </article>
      <article class="ram-card">
        <div class="ram-icon">🏠</div>
        <h2>RAM · Objetos de la casa</h2>
        <p>Memoriza fotografías de objetos cotidianos y reconstruye la secuencia. Las imágenes proceden de Wikimedia Commons.</p>
        <button class="btn btn-primary btn-large" data-ram-task="objects" type="button">Empezar objetos</button>
      </article>
    </section>
    <section class="card section">
      <strong>Cómo funciona</strong>
      <p class="small">Empieza con 2 elementos y aumenta progresivamente. El resultado se guarda en tu histórico personal. Esta función es de entrenamiento y no genera un diagnóstico clínico.</p>
      <div class="actions"><button id="ramBackHome" class="btn btn-ghost" type="button">Volver al inicio</button></div>
    </section>`;
  main.querySelectorAll('[data-ram-task]').forEach(b=>b.addEventListener('click',()=>renderRamConfig(b.dataset.ramTask)));
  document.getElementById('ramBackHome')?.addEventListener('click', renderHome);
  ramLog('ram_panel_opened',{screen:'ram'});
}

function renderRamConfig(type) {
  ramState.type=type;
  main.innerHTML=`
    <section class="card">
      <span class="badge">${type==='words'?'Aa':'🏠'} RAM</span>
      <h1>${type==='words'?'Palabras':'Objetos de la casa'}</h1>
      <div class="form-grid section">
        <div class="field">
          <label for="ramDirection">Orden de recuerdo</label>
          <select id="ramDirection">
            <option value="forward">Mismo orden</option>
            <option value="reverse">Orden inverso</option>
          </select>
          <span class="help">El orden inverso añade manipulación de la información.</span>
        </div>
        <div class="field">
          <label for="ramRounds">Número de rondas</label>
          <select id="ramRounds">
            <option value="3">3 rondas</option>
            <option value="5" selected>5 rondas</option>
          </select>
        </div>
        <div class="field">
          <label for="ramInterval">Tiempo entre elementos (segundos)</label>
          <input id="ramInterval" type="number" min="0.5" max="10" step="0.25" value="${ramState.intervalSeconds}" />
          <span class="help">Define cuánto tiempo permanece cada elemento antes de mostrar el siguiente. Entre 0,5 y 10 segundos.</span>
        </div>
      </div>
      <div class="actions">
        <button id="ramStartBtn" class="btn btn-primary btn-large" type="button">Comenzar</button>
        <button id="ramCancelBtn" class="btn btn-ghost btn-large" type="button">Volver</button>
      </div>
    </section>`;
  document.getElementById('ramStartBtn').addEventListener('click',()=>{
    ramState.direction=document.getElementById('ramDirection').value;
    ramState.rounds=Number(document.getElementById('ramRounds').value);
    const configuredInterval=Number(document.getElementById('ramInterval').value);
    ramState.intervalSeconds=Math.min(10,Math.max(0.5,Number.isFinite(configuredInterval)?configuredInterval:1.25));
    startRamSession();
  });
  document.getElementById('ramCancelBtn').addEventListener('click', renderRamPanel);
}

function startRamSession() {
  ramState.round=0;
  ramState.span=2;
  ramState.correctPositions=0;
  ramState.totalPositions=0;
  ramState.startedAt=Date.now();
  ramLog('test_started',{setId:'ram-'+ramState.type,setName:ramState.type==='words'?'RAM · Palabras':'RAM · Objetos de la casa',mode:ramState.direction,intervalSeconds:ramState.intervalSeconds});
  nextRamRound();
}

function makeRamSequence() {
  const pool=ramState.type==='words'?RAM_WORDS:RAM_HOME_OBJECTS;
  return ramShuffle(pool).slice(0, Math.min(ramState.span, pool.length));
}

function nextRamRound() {
  if (ramState.round>=ramState.rounds) return finishRamSession();
  ramState.round+=1;
  ramState.current=makeRamSequence();
  ramState.expected=ramState.direction==='reverse'?[...ramState.current].reverse():[...ramState.current];
  ramState.answer=[];
  ramState.phase='show';
  showRamStimulus(0);
}

function showRamStimulus(index) {
  if (index>=ramState.current.length) {
    setTimeout(renderRamRecall,450);
    return;
  }
  const item=ramState.current[index];
  main.innerHTML=`
    <section class="card">
      <div class="ram-progress"><strong>Ronda ${ramState.round} de ${ramState.rounds}</strong><span>Longitud: ${ramState.span}</span></div>
      <div class="progress"><span style="width:${((index+1)/ramState.current.length)*100}%"></span></div>
      <div class="ram-stage">
        ${ramState.type==='words'
          ? '<div class="ram-word-stimulus">'+escapeHTML(item)+'</div>'
          : '<svg class="ram-photo-stimulus ram-svg-stimulus" viewBox="0 0 160 120" role="img" aria-label="'+escapeHTML(item.label)+'"><use href="assets/figuras.svg#'+escapeHTML(item.id)+'"></use></svg>'
      </div>
      <p style="text-align:center;color:var(--muted)">Memoriza la secuencia.</p>
    </section>`;
  setTimeout(()=>showRamStimulus(index+1), Math.round(ramState.intervalSeconds*1000));
}

function renderRamRecall() {
  ramState.phase='recall';
  const base=ramState.type==='words'?RAM_WORDS:RAM_HOME_OBJECTS;
  const targetKeys=new Set(ramState.current.map(x=>ramState.type==='words'?x:x.id));
  const distractors=ramShuffle(base.filter(x=>!targetKeys.has(ramState.type==='words'?x:x.id))).slice(0, Math.max(2,5-ramState.current.length));
  const choices=ramShuffle([...ramState.current,...distractors]);
  main.innerHTML=`
    <section class="card">
      <div class="ram-progress"><strong>Ronda ${ramState.round} de ${ramState.rounds}</strong><span>${ramState.direction==='reverse'?'Orden inverso':'Mismo orden'}</span></div>
      <h1 style="text-align:center">Reproduce la secuencia</h1>
      <p style="text-align:center;color:var(--muted)">Selecciona ${ramState.expected.length} elementos en el orden correcto.</p>
      <div id="ramAnswer" class="ram-sequence-answer"></div>
      <div id="ramChoices" class="ram-choice-grid">
        ${choices.map((item,i)=>ramState.type==='words'
          ? '<button class="ram-choice" data-ram-choice="'+i+'" data-value="'+escapeHTML(item)+'" type="button">'+escapeHTML(item)+'</button>'
          : '<button class="ram-choice" data-ram-choice="'+i+'" data-value="'+escapeHTML(item.id)+'" type="button"><svg class="ram-choice-svg" viewBox="0 0 160 120" aria-hidden="true"><use href="assets/figuras.svg#'+escapeHTML(item.id)+'"></use></svg><span>'+escapeHTML(item.label)+'</span></button>'
        ).join('')}
      </div>
      <div class="actions" style="justify-content:center"><button id="ramAbort" class="btn btn-ghost" type="button">Finalizar</button></div>
    </section>`;
  main.querySelectorAll('[data-ram-choice]').forEach(btn=>btn.addEventListener('click',()=>selectRamAnswer(btn)));
  document.getElementById('ramAbort')?.addEventListener('click', finishRamSession);
}

function selectRamAnswer(btn) {
  if (ramState.answer.length>=ramState.expected.length) return;
  btn.classList.add('used');
  const value=btn.dataset.value;
  ramState.answer.push(value);
  const box=document.getElementById('ramAnswer');
  if (box) box.innerHTML=ramState.answer.map((x,i)=>'<span class="ram-sequence-chip">'+(i+1)+'. '+escapeHTML(ramLabel(x))+'</span>').join('');
  if (ramState.answer.length===ramState.expected.length) scoreRamRound();
}

function ramKey(item) {
  return ramState.type==='words'?item:item.id;
}
function ramLabel(value) {
  if (ramState.type==='words') return value;
  return RAM_HOME_OBJECTS.find(x=>x.id===value)?.label || value;
}

function scoreRamRound() {
  const expected=ramState.expected.map(ramKey);
  let correct=0;
  expected.forEach((x,i)=>{ if (ramState.answer[i]===x) correct+=1; });
  ramState.correctPositions+=correct;
  ramState.totalPositions+=expected.length;
  const pct=Math.round(correct/expected.length*100);
  const perfect=correct===expected.length;
  if (perfect && ramState.span<5) ramState.span+=1;

  main.innerHTML=`
    <section class="card" style="text-align:center">
      <span class="badge">Ronda ${ramState.round}</span>
      <div class="ram-result-score">${pct}%</div>
      <h1>${perfect?'Secuencia correcta':'Resultado de la ronda'}</h1>
      <p>Has colocado correctamente <strong>${correct} de ${expected.length}</strong> posiciones.</p>
      <div class="actions" style="justify-content:center">
        <button id="ramNextBtn" class="btn btn-primary btn-large" type="button">${ramState.round>=ramState.rounds?'Ver resultado':'Siguiente ronda'}</button>
      </div>
    </section>`;
  document.getElementById('ramNextBtn').addEventListener('click',nextRamRound);
}

function finishRamSession() {
  const total=ramState.totalPositions;
  const score=total?Math.round(ramState.correctPositions/total*100):0;
  const durationMs=Date.now()-ramState.startedAt;
  const setId=ramState.type==='words'?'ram-palabras':'ram-objetos-casa';
  const setName=ramState.type==='words'?'RAM · Palabras':'RAM · Objetos de la casa';
  const result={
    id:'ram_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),
    date:new Date().toISOString(),
    setId,setName,
    mode:ramState.direction,
    total:total,
    firstTryCorrect:ramState.correctPositions,
    wrongAttempts:Math.max(0,total-ramState.correctPositions),
    totalAttempts:total,
    durationMs,
    score,
    module:'RAM',
    rounds:ramState.round,
    intervalSeconds:ramState.intervalSeconds
  };
  state.results.unshift(result);
  state.results=state.results.slice(0,500);
  if (typeof saveResults==='function') saveResults();
  ramLog('test_completed',{setId,setName,mode:ramState.direction,score,total,durationMs});

  main.innerHTML=`
    <section class="card" style="text-align:center">
      <span class="badge">RAM completado</span>
      <div class="ram-result-score">${score}%</div>
      <h1>${escapeHTML(setName)}</h1>
      <p>Posiciones correctas: <strong>${ramState.correctPositions} de ${total}</strong> · ${ramState.direction==='reverse'?'orden inverso':'mismo orden'}.</p>
      <div class="actions" style="justify-content:center">
        <button id="ramAgain" class="btn btn-primary btn-large" type="button">Repetir</button>
        <button id="ramResults" class="btn btn-secondary btn-large" type="button">Ver resultados</button>
        <button id="ramHome" class="btn btn-ghost btn-large" type="button">Inicio</button>
      </div>
    </section>`;
  document.getElementById('ramAgain')?.addEventListener('click',()=>renderRamConfig(ramState.type));
  document.getElementById('ramResults')?.addEventListener('click',renderHistory);
  document.getElementById('ramHome')?.addEventListener('click',renderHome);
}

function bootRamModule() {
  installRamEntryPoints();
  setTimeout(()=>{ installRamEntryPoints(); injectRamHomeCard(); },250);
}
bootRamModule();
