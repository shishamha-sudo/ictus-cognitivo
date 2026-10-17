'use strict';

const WM_TASKS = [
  {id:'corsi', icon:'▦', name:'Secuencia visuoespacial', desc:'Recuerda posiciones que se iluminan y repítelas en orden directo o inverso.'},
  {id:'sounds', icon:'♪', name:'Secuencia de sonidos', desc:'Escucha una serie de tonos y repítelos en el mismo orden.'},
  {id:'nback', icon:'N', name:'N-back simplificado', desc:'Indica si el estímulo actual coincide con el de una o dos posiciones atrás.'},
  {id:'temporal', icon:'↕', name:'Ordenación temporal', desc:'Observa varios elementos y reconstruye el orden en que aparecieron.'},
  {id:'location', icon:'⌖', name:'Memoria de localización', desc:'Recuerda dónde estaba cada objeto dentro de una cuadrícula.'},
  {id:'updating', icon:'↻', name:'Actualización mental', desc:'Mantén activos únicamente los últimos elementos de una secuencia.'},
  {id:'dual', icon:'±', name:'Doble tarea', desc:'Clasifica números mientras mantienes en memoria los últimos elementos.'}
];

const wmState = { token:0, task:null, rounds:5, interval:900, span:3, direction:'forward', round:0, correct:0, total:0, startedAt:0 };

function wmWait(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }
function wmToken(){ wmState.token+=1; return wmState.token; }
function wmAlive(token){ return token===wmState.token; }
function wmShuffle(a){ return [...a].sort(()=>Math.random()-.5); }
function wmSample(a,n){ return wmShuffle(a).slice(0,n); }
function wmTask(id){ return WM_TASKS.find(t=>t.id===id); }

function wmSvgUse(id, cls='wm-object-svg'){
  return '<svg class="'+cls+'" viewBox="0 0 160 120" aria-hidden="true"><use href="assets/figuras.svg#'+escapeHTML(id)+'"></use></svg>';
}

function wmSave(taskId, score, extra={}){
  const task=wmTask(taskId);
  const total=Math.max(1,Number(extra.total||wmState.total||1));
  const correct=Number(extra.correct??wmState.correct??0);
  const result={
    id:'wm_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),
    date:new Date().toISOString(),
    setId:'wm-'+taskId,
    setName:'Memoria · '+task.name,
    mode:extra.mode||taskId,
    total,
    firstTryCorrect:correct,
    wrongAttempts:Math.max(0,total-correct),
    totalAttempts:total,
    durationMs:Date.now()-wmState.startedAt,
    score:Math.max(0,Math.min(100,Math.round(score))),
    module:'Memoria de trabajo',
    ...extra
  };
  state.results.unshift(result);
  state.results=state.results.slice(0,500);
  if(typeof saveResults==='function') saveResults();
  return result;
}

function wmFinish(taskId, score, extra={}){
  const task=wmTask(taskId);
  wmSave(taskId,score,extra);
  main.innerHTML=`
    <section class="card wm-result">
      <span class="badge">Memoria de trabajo</span>
      <div class="ram-result-score">${Math.round(score)}%</div>
      <h1>${escapeHTML(task.name)}</h1>
      <p>${escapeHTML(extra.summary||'Ejercicio completado.')}</p>
      <div class="actions" style="justify-content:center">
        <button id="wmAgain" class="btn btn-primary btn-large" type="button">Repetir</button>
        <button id="wmTasks" class="btn btn-secondary btn-large" type="button">Más tareas</button>
        <button id="wmHome" class="btn btn-ghost btn-large" type="button">Inicio</button>
      </div>
    </section>`;
  document.getElementById('wmAgain')?.addEventListener('click',()=>renderWmConfig(taskId));
  document.getElementById('wmTasks')?.addEventListener('click',renderWmPanel);
  document.getElementById('wmHome')?.addEventListener('click',renderHome);
}

function renderWmPanel(){
  wmToken();
  state.screen='working-memory';
  state.session=null;
  main.innerHTML=`
    <section class="ram-hero wm-hero">
      <span class="home-eyebrow">Memoria de trabajo</span>
      <h1>Nuevas tareas</h1>
      <p>Ejercicios breves de memoria de trabajo, atención y organización visuoespacial.</p>
    </section>
    <section class="wm-grid">
      ${WM_TASKS.map(t=>`
        <article class="wm-card">
          <div class="wm-card-icon">${t.icon}</div>
          <div class="wm-card-copy"><h2>${escapeHTML(t.name)}</h2><p>${escapeHTML(t.desc)}</p></div>
          <button class="btn btn-primary" data-wm-task="${t.id}" type="button">Configurar</button>
        </article>`).join('')}
    </section>
    <section class="card section"><div class="actions"><button id="wmBack" class="btn btn-ghost" type="button">Volver al inicio</button></div></section>`;
  main.querySelectorAll('[data-wm-task]').forEach(b=>b.addEventListener('click',()=>renderWmConfig(b.dataset.wmTask)));
  document.getElementById('wmBack')?.addEventListener('click',renderHome);
}

function renderWmConfig(taskId){
  wmToken();
  const task=wmTask(taskId);
  wmState.task=taskId;
  const special=taskId==='nback'
    ? `<div class="field"><label for="wmN">Nivel N</label><select id="wmN"><option value="1">1-back</option><option value="2">2-back</option></select></div>`
    : taskId==='corsi'
      ? `<div class="field"><label for="wmDirection">Orden</label><select id="wmDirection"><option value="forward">Directo</option><option value="reverse">Inverso</option></select></div>`
      : '';
  main.innerHTML=`
    <section class="card wm-config">
      <span class="badge">${task.icon} Memoria de trabajo</span>
      <h1>${escapeHTML(task.name)}</h1>
      <p class="muted">${escapeHTML(task.desc)}</p>
      <div class="form-grid section">
        <div class="field"><label for="wmRounds">Rondas</label><select id="wmRounds"><option value="3">3 rondas</option><option value="5" selected>5 rondas</option></select></div>
        <div class="field"><label for="wmInterval">Ritmo de presentación</label><select id="wmInterval"><option value="700">Rápido</option><option value="900" selected>Normal</option><option value="1200">Pausado</option></select></div>
        ${special}
      </div>
      <div class="actions"><button id="wmStart" class="btn btn-primary btn-large" type="button">Comenzar</button><button id="wmCancel" class="btn btn-ghost btn-large" type="button">Volver</button></div>
    </section>`;
  document.getElementById('wmCancel').addEventListener('click',renderWmPanel);
  document.getElementById('wmStart').addEventListener('click',()=>{
    wmState.rounds=Number(document.getElementById('wmRounds')?.value||5);
    wmState.interval=Number(document.getElementById('wmInterval')?.value||900);
    wmState.direction=document.getElementById('wmDirection')?.value||'forward';
    wmState.n=Number(document.getElementById('wmN')?.value||1);
    wmState.startedAt=Date.now();
    wmState.round=0; wmState.correct=0; wmState.total=0; wmState.span=3;
    startWmTask(taskId);
  });
}

function startWmTask(id){
  const token=wmToken();
  if(id==='corsi') return wmCorsi(token);
  if(id==='sounds') return wmSounds(token);
  if(id==='nback') return wmNback(token);
  if(id==='temporal') return wmTemporal(token);
  if(id==='location') return wmLocation(token);
  if(id==='updating') return wmUpdating(token);
  if(id==='dual') return wmDual(token);
}

function wmQuitButton(){
  return '<div class="actions wm-exit"><button id="wmAbort" class="btn btn-ghost" type="button">Finalizar</button></div>';
}
function wmBindAbort(){ document.getElementById('wmAbort')?.addEventListener('click',renderWmPanel); }

async function wmCorsi(token){
  for(let r=1;r<=wmState.rounds && wmAlive(token);r++){
    wmState.round=r;
    const len=Math.min(7,wmState.span);
    const seq=Array.from({length:len},()=>Math.floor(Math.random()*9));
    main.innerHTML=`
      <section class="card wm-stage-card">
        <div class="wm-progress"><strong>Ronda ${r} de ${wmState.rounds}</strong><span>Longitud ${len}</span></div>
        <h1>Observa las posiciones</h1>
        <div id="corsiGrid" class="wm-corsi-grid">${Array.from({length:9},(_,i)=>'<div class="wm-corsi-cell" data-cell="'+i+'"></div>').join('')}</div>
      </section>`;
    await wmWait(500);
    for(const pos of seq){
      if(!wmAlive(token)) return;
      const cell=document.querySelector('[data-cell="'+pos+'"]');
      cell?.classList.add('active'); await wmWait(Math.max(300,wmState.interval*.55)); cell?.classList.remove('active'); await wmWait(180);
    }
    if(!wmAlive(token)) return;
    const expected=wmState.direction==='reverse'?[...seq].reverse():seq;
    main.innerHTML=`
      <section class="card wm-stage-card">
        <div class="wm-progress"><strong>Ronda ${r} de ${wmState.rounds}</strong><span>${wmState.direction==='reverse'?'Orden inverso':'Orden directo'}</span></div>
        <h1>Repite la secuencia</h1>
        <div id="corsiGrid" class="wm-corsi-grid">${Array.from({length:9},(_,i)=>'<button class="wm-corsi-cell" data-pick="'+i+'" type="button" aria-label="Posición '+(i+1)+'"></button>').join('')}</div>
        <div id="wmCounter" class="wm-counter">0 / ${len}</div>${wmQuitButton()}
      </section>`;
    const answer=[];
    await new Promise(resolve=>{
      document.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{
        if(answer.length>=len) return;
        answer.push(Number(b.dataset.pick)); b.classList.add('picked'); setTimeout(()=>b.classList.remove('picked'),180);
        document.getElementById('wmCounter').textContent=answer.length+' / '+len;
        if(answer.length===len) resolve();
      }));
      wmBindAbort();
    });
    if(!wmAlive(token)) return;
    let good=0; expected.forEach((v,i)=>{if(answer[i]===v) good+=1;});
    wmState.correct+=good; wmState.total+=len;
    if(good===len) wmState.span=Math.min(7,wmState.span+1);
    await wmRoundFeedback(good===len,good,len);
  }
  if(!wmAlive(token)) return;
  wmFinish('corsi',wmState.correct/wmState.total*100,{mode:wmState.direction,correct:wmState.correct,total:wmState.total,summary:'Posiciones correctas: '+wmState.correct+' de '+wmState.total+'.'});
}

async function wmRoundFeedback(perfect,good,total){
  main.innerHTML=`<section class="card wm-mini-result"><div class="ram-result-score">${Math.round(good/total*100)}%</div><h1>${perfect?'Correcto':'Ronda completada'}</h1><p>${good} de ${total} posiciones correctas.</p></section>`;
  await wmWait(700);
}

const WM_TONES=[261.63,329.63,392,523.25,659.25,783.99];
let wmAudioCtx=null;
function wmTone(i,duration=330){
  try{
    wmAudioCtx=wmAudioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const o=wmAudioCtx.createOscillator(),g=wmAudioCtx.createGain();
    o.frequency.value=WM_TONES[i]; o.type='sine'; o.connect(g); g.connect(wmAudioCtx.destination);
    g.gain.setValueAtTime(.001,wmAudioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.18,wmAudioCtx.currentTime+.02);
    g.gain.exponentialRampToValueAtTime(.001,wmAudioCtx.currentTime+duration/1000);
    o.start(); o.stop(wmAudioCtx.currentTime+duration/1000+.03);
  }catch{}
}

async function wmSounds(token){
  for(let r=1;r<=wmState.rounds && wmAlive(token);r++){
    const len=Math.min(6,2+r);
    const seq=Array.from({length:len},()=>Math.floor(Math.random()*6));
    main.innerHTML=`<section class="card wm-stage-card"><div class="wm-progress"><strong>Ronda ${r} de ${wmState.rounds}</strong><span>${len} sonidos</span></div><h1>Escucha la secuencia</h1><div class="wm-listening">♪</div></section>`;
    await wmWait(450);
    for(const tone of seq){ if(!wmAlive(token))return; wmTone(tone); await wmWait(wmState.interval); }
    main.innerHTML=`<section class="card wm-stage-card"><h1>Repite los sonidos</h1><p class="muted">Puedes pulsar cada botón para escuchar el tono.</p><div class="wm-tone-grid">${WM_TONES.map((_,i)=>'<button class="wm-tone-btn" data-tone="'+i+'" type="button">♪ '+(i+1)+'</button>').join('')}</div><div id="wmCounter" class="wm-counter">0 / ${len}</div>${wmQuitButton()}</section>`;
    const answer=[];
    await new Promise(resolve=>{
      document.querySelectorAll('[data-tone]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.tone);wmTone(i);if(answer.length<len){answer.push(i);document.getElementById('wmCounter').textContent=answer.length+' / '+len;if(answer.length===len)resolve();}}));
      wmBindAbort();
    });
    if(!wmAlive(token))return;
    let good=0;seq.forEach((v,i)=>{if(answer[i]===v)good+=1;});wmState.correct+=good;wmState.total+=len;
    await wmRoundFeedback(good===len,good,len);
  }
  if(wmAlive(token)) wmFinish('sounds',wmState.correct/wmState.total*100,{correct:wmState.correct,total:wmState.total,summary:'Sonidos en posición correcta: '+wmState.correct+' de '+wmState.total+'.'});
}

async function wmNback(token){
  const n=wmState.n||1;
  const trials=wmState.rounds*4;
  const symbols=['●','■','▲','◆'];
  const seq=[];
  for(let i=0;i<trials;i++){
    if(i>=n && Math.random()<.35) seq.push(seq[i-n]); else seq.push(symbols[Math.floor(Math.random()*symbols.length)]);
  }
  let correct=0;
  for(let i=0;i<trials && wmAlive(token);i++){
    const should=i>=n && seq[i]===seq[i-n];
    main.innerHTML=`<section class="card wm-stage-card"><div class="wm-progress"><strong>${i+1} / ${trials}</strong><span>${n}-back</span></div><div class="wm-nback-symbol">${seq[i]}</div><p>¿Coincide con el elemento de hace ${n} posición${n>1?'es':''}?</p><div class="wm-binary"><button class="btn btn-primary btn-large" data-answer="yes" type="button">Sí</button><button class="btn btn-secondary btn-large" data-answer="no" type="button">No</button></div>${wmQuitButton()}</section>`;
    const ans=await new Promise(resolve=>{document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>resolve(b.dataset.answer==='yes')));wmBindAbort();});
    if(!wmAlive(token))return;
    if(ans===should)correct++;
  }
  wmState.correct=correct;wmState.total=trials;
  if(wmAlive(token))wmFinish('nback',correct/trials*100,{mode:n+'-back',correct,total:trials,summary:'Respuestas correctas: '+correct+' de '+trials+'.'});
}

const WM_OBJECT_IDS=['manzana','perro','casa','coche','gato','platano','telefono','llave','reloj','libro','pelota','flor','taza','pan','bicicleta','avion'];

async function wmTemporal(token){
  for(let r=1;r<=wmState.rounds && wmAlive(token);r++){
    const len=Math.min(6,2+r);
    const seq=wmSample(WM_OBJECT_IDS,len);
    for(let i=0;i<seq.length;i++){
      main.innerHTML=`<section class="card wm-stage-card"><div class="wm-progress"><strong>Ronda ${r} de ${wmState.rounds}</strong><span>${i+1} / ${len}</span></div><h1>Recuerda el orden</h1><div class="wm-big-object">${wmSvgUse(seq[i])}</div></section>`;
      await wmWait(wmState.interval);
      if(!wmAlive(token))return;
    }
    const choices=wmShuffle(seq);
    main.innerHTML=`<section class="card wm-stage-card"><h1>Reconstruye el orden</h1><div class="wm-object-grid">${choices.map(id=>'<button class="wm-object-btn" data-obj="'+id+'" type="button">'+wmSvgUse(id)+'</button>').join('')}</div><div id="wmCounter" class="wm-counter">0 / ${len}</div>${wmQuitButton()}</section>`;
    const answer=[];
    await new Promise(resolve=>{document.querySelectorAll('[data-obj]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;b.disabled=true;answer.push(b.dataset.obj);document.getElementById('wmCounter').textContent=answer.length+' / '+len;if(answer.length===len)resolve();}));wmBindAbort();});
    if(!wmAlive(token))return;
    let good=0;seq.forEach((v,i)=>{if(answer[i]===v)good+=1;});wmState.correct+=good;wmState.total+=len;await wmRoundFeedback(good===len,good,len);
  }
  if(wmAlive(token))wmFinish('temporal',wmState.correct/wmState.total*100,{correct:wmState.correct,total:wmState.total,summary:'Elementos en orden correcto: '+wmState.correct+' de '+wmState.total+'.'});
}

async function wmLocation(token){
  for(let r=1;r<=wmState.rounds && wmAlive(token);r++){
    const count=Math.min(5,2+Math.floor((r-1)/2));
    const objs=wmSample(WM_OBJECT_IDS,count);
    const cells=wmSample([0,1,2,3,4,5,6,7,8],count);
    const map=new Map(objs.map((o,i)=>[o,cells[i]]));
    main.innerHTML=`<section class="card wm-stage-card"><div class="wm-progress"><strong>Ronda ${r} de ${wmState.rounds}</strong><span>${count} objetos</span></div><h1>Recuerda dónde está cada objeto</h1><div class="wm-location-grid">${Array.from({length:9},(_,i)=>'<div class="wm-location-cell">'+(cells.includes(i)?wmSvgUse(objs[cells.indexOf(i)],'wm-location-svg'):'')+'</div>').join('')}</div></section>`;
    await wmWait(Math.max(1500,wmState.interval*2.2));
    if(!wmAlive(token))return;
    let good=0;
    for(const obj of objs){
      main.innerHTML=`<section class="card wm-stage-card"><h1>¿Dónde estaba?</h1><div class="wm-location-prompt">${wmSvgUse(obj)}</div><div class="wm-location-grid">${Array.from({length:9},(_,i)=>'<button class="wm-location-cell" data-loc="'+i+'" type="button"></button>').join('')}</div>${wmQuitButton()}</section>`;
      const pick=await new Promise(resolve=>{document.querySelectorAll('[data-loc]').forEach(b=>b.addEventListener('click',()=>resolve(Number(b.dataset.loc))));wmBindAbort();});
      if(!wmAlive(token))return;
      if(pick===map.get(obj))good++;
    }
    wmState.correct+=good;wmState.total+=count;await wmRoundFeedback(good===count,good,count);
  }
  if(wmAlive(token))wmFinish('location',wmState.correct/wmState.total*100,{correct:wmState.correct,total:wmState.total,summary:'Localizaciones correctas: '+wmState.correct+' de '+wmState.total+'.'});
}

async function wmUpdating(token){
  for(let r=1;r<=wmState.rounds && wmAlive(token);r++){
    const keep=Math.min(4,2+Math.floor((r-1)/2));
    const len=keep+3;
    const seq=Array.from({length:len},()=>Math.floor(Math.random()*10));
    for(let i=0;i<len;i++){
      main.innerHTML=`<section class="card wm-stage-card"><div class="wm-progress"><strong>Ronda ${r} de ${wmState.rounds}</strong><span>Recuerda los últimos ${keep}</span></div><div class="wm-digit">${seq[i]}</div></section>`;
      await wmWait(wmState.interval);if(!wmAlive(token))return;
    }
    const expected=seq.slice(-keep);
    main.innerHTML=`<section class="card wm-stage-card"><h1>Introduce los últimos ${keep}</h1><div class="wm-number-grid">${Array.from({length:10},(_,i)=>'<button class="wm-number-btn" data-num="'+i+'" type="button">'+i+'</button>').join('')}</div><div id="wmCounter" class="wm-counter">0 / ${keep}</div>${wmQuitButton()}</section>`;
    const answer=[];
    await new Promise(resolve=>{document.querySelectorAll('[data-num]').forEach(b=>b.addEventListener('click',()=>{answer.push(Number(b.dataset.num));document.getElementById('wmCounter').textContent=answer.length+' / '+keep;if(answer.length===keep)resolve();}));wmBindAbort();});
    if(!wmAlive(token))return;
    let good=0;expected.forEach((v,i)=>{if(answer[i]===v)good+=1;});wmState.correct+=good;wmState.total+=keep;await wmRoundFeedback(good===keep,good,keep);
  }
  if(wmAlive(token))wmFinish('updating',wmState.correct/wmState.total*100,{correct:wmState.correct,total:wmState.total,summary:'Últimos elementos correctos: '+wmState.correct+' de '+wmState.total+'.'});
}

async function wmDual(token){
  for(let r=1;r<=wmState.rounds && wmAlive(token);r++){
    const len=6,keep=2;
    const seq=Array.from({length:len},()=>Math.floor(Math.random()*10));
    let classGood=0;
    for(let i=0;i<len;i++){
      const n=seq[i];
      main.innerHTML=`<section class="card wm-stage-card"><div class="wm-progress"><strong>Ronda ${r} de ${wmState.rounds}</strong><span>Recuerda los últimos ${keep}</span></div><div class="wm-digit">${n}</div><h2>¿Par o impar?</h2><div class="wm-binary"><button class="btn btn-primary" data-parity="even" type="button">Par</button><button class="btn btn-secondary" data-parity="odd" type="button">Impar</button></div>${wmQuitButton()}</section>`;
      const ans=await new Promise(resolve=>{document.querySelectorAll('[data-parity]').forEach(b=>b.addEventListener('click',()=>resolve(b.dataset.parity)));wmBindAbort();});
      if(!wmAlive(token))return;
      if((n%2===0&&ans==='even')||(n%2===1&&ans==='odd'))classGood++;
    }
    const expected=seq.slice(-keep);
    main.innerHTML=`<section class="card wm-stage-card"><h1>¿Cuáles eran los dos últimos?</h1><div class="wm-number-grid">${Array.from({length:10},(_,i)=>'<button class="wm-number-btn" data-num="'+i+'" type="button">'+i+'</button>').join('')}</div><div id="wmCounter" class="wm-counter">0 / 2</div>${wmQuitButton()}</section>`;
    const answer=[];
    await new Promise(resolve=>{document.querySelectorAll('[data-num]').forEach(b=>b.addEventListener('click',()=>{answer.push(Number(b.dataset.num));document.getElementById('wmCounter').textContent=answer.length+' / 2';if(answer.length===2)resolve();}));wmBindAbort();});
    if(!wmAlive(token))return;
    let memGood=0;expected.forEach((v,i)=>{if(answer[i]===v)memGood+=1;});
    wmState.correct+=classGood+memGood;wmState.total+=len+keep;
    await wmRoundFeedback(classGood===len&&memGood===keep,classGood+memGood,len+keep);
  }
  if(wmAlive(token))wmFinish('dual',wmState.correct/wmState.total*100,{correct:wmState.correct,total:wmState.total,summary:'Aciertos combinados: '+wmState.correct+' de '+wmState.total+'.'});
}

function injectWmHomeCard(){
  if(document.getElementById('wmHomeEntry')) return;
  const ram=document.getElementById('ramHomeEntry');
  const dash=document.querySelector('.home-dashboard');
  const anchor=ram||dash;
  if(!anchor||!anchor.parentNode) return;
  const section=document.createElement('section');
  section.id='wmHomeEntry';section.className='section';
  section.innerHTML=`
    <div class="ram-hero wm-home-hero">
      <span class="home-eyebrow">Memoria de trabajo +</span>
      <h2>Nuevos ejercicios</h2>
      <p>Secuencias visuoespaciales, sonidos, N-back, localización, actualización mental y doble tarea.</p>
      <div class="actions"><button id="wmHomeOpenBtn" class="btn btn-primary btn-large" type="button">Abrir ejercicios</button></div>
    </div>`;
  anchor.parentNode.insertBefore(section,anchor.nextSibling);
  document.getElementById('wmHomeOpenBtn')?.addEventListener('click',renderWmPanel);
}

function bootWorkingMemory(){
  if(typeof renderHome==='function' && !renderHome._wmWrapped){
    const original=renderHome;
    const wrapped=function(){const out=original.apply(this,arguments);setTimeout(injectWmHomeCard,0);return out;};
    wrapped._wmWrapped=true;renderHome=wrapped;
  }
  setTimeout(injectWmHomeCard,350);
}
bootWorkingMemory();
