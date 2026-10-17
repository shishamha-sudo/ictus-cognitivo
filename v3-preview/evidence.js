'use strict';

const EVIDENCE_REFS = [
  {
    id:'aha2026',
    title:'2026 Guideline for Adult Stroke Rehabilitation and Recovery',
    authors:'American Heart Association / American Stroke Association',
    year:'2026',
    url:'https://pubmed.ncbi.nlm.nih.gov/42657476/',
    note:'Guía clínica actualizada sobre rehabilitación y recuperación tras ictus.'
  },
  {
    id:'wmmeta',
    title:'Post-Stroke Working Memory Dysfunction: A Meta-Analysis and Systematic Review',
    authors:'Lugtmeijer et al.',
    year:'2021',
    url:'https://pubmed.ncbi.nlm.nih.gov/33230717/',
    note:'Describe alteraciones de memoria de trabajo verbal y no verbal después del ictus.'
  },
  {
    id:'computer',
    title:'The Effects of Computer Based Cognitive Rehabilitation in Stroke Patients with Working Memory Impairment',
    authors:'Niemeijer et al.',
    year:'2020',
    url:'https://pubmed.ncbi.nlm.nih.gov/32992171/',
    note:'Revisión sistemática sobre rehabilitación cognitiva informatizada de memoria de trabajo.'
  },
  {
    id:'multiwm',
    title:'Rehabilitation of working memory after acquired brain injury and multiple sclerosis: A systematic review',
    authors:'Revisión sistemática',
    year:'2024',
    url:'https://pubmed.ncbi.nlm.nih.gov/38430123/',
    note:'Apoya programas multitarea, aunque la evidencia de transferencia a la vida diaria sigue siendo limitada.'
  },
  {
    id:'corsi',
    title:'The Corsi block-tapping task: methodological and theoretical considerations',
    authors:'Berch et al.',
    year:'1998',
    url:'https://pubmed.ncbi.nlm.nih.gov/9841789/',
    note:'Referencia metodológica clásica de la tarea Corsi y la memoria visuoespacial.'
  },
  {
    id:'aphasia',
    title:'The Methodological Quality of Short-Term/Working Memory Treatments in Poststroke Aphasia',
    authors:'Zakariás et al.',
    year:'2019',
    url:'https://pubmed.ncbi.nlm.nih.gov/31120801/',
    note:'Revisión de tratamientos de memoria a corto plazo y memoria de trabajo en afasia postictus.'
  },
  {
    id:'memory2025',
    title:'Impact of cognitive rehabilitation interventions on memory improvement in patients after stroke',
    authors:'Systematic review',
    year:'2025',
    url:'https://pubmed.ncbi.nlm.nih.gov/40881216/',
    note:'Revisión reciente de intervenciones tecnológicas y no tecnológicas orientadas a memoria.'
  }
];

const ACTIVITY_GUIDE = {
  'ram-palabras':{
    domain:'Memoria de trabajo verbal',
    meaning:'Entrena mantener y reproducir información verbal durante unos segundos.',
    interpret:'Observa principalmente si con el tiempo aumenta la longitud de secuencia tolerada, mejora la precisión y se mantiene el rendimiento con ritmos similares.',
    refs:['wmmeta','computer','multiwm']
  },
  'ram-objetos-casa':{
    domain:'Memoria de trabajo visual',
    meaning:'Entrena el mantenimiento temporal de objetos visuales y su orden.',
    interpret:'Compara sesiones con condiciones parecidas. Una mejora sostenida en precisión y longitud es más informativa que una puntuación aislada.',
    refs:['wmmeta','computer','multiwm']
  },
  'wm-corsi':{
    domain:'Memoria visuoespacial',
    meaning:'Entrena recordar posiciones y secuencias espaciales.',
    interpret:'Revisa longitud alcanzada, precisión y diferencia entre orden directo e inverso. Esta versión es de entrenamiento y no equivale a una administración clínica estandarizada de Corsi.',
    refs:['corsi','wmmeta','multiwm']
  },
  'wm-sounds':{
    domain:'Memoria auditiva secuencial',
    meaning:'Entrena mantener y ordenar estímulos auditivos breves.',
    interpret:'Busca estabilidad y mejora de la precisión con secuencias de longitud semejante. Factores auditivos, fatiga o distracción pueden cambiar el resultado.',
    refs:['wmmeta','aphasia','multiwm']
  },
  'wm-nback':{
    domain:'Actualización de memoria de trabajo',
    meaning:'Entrena mantener información reciente y actualizarla continuamente.',
    interpret:'Compara 1-back con 1-back y 2-back con 2-back. El nivel N cambia mucho la dificultad; no deben mezclarse sus porcentajes como si fueran equivalentes.',
    refs:['aphasia','multiwm','computer']
  },
  'wm-temporal':{
    domain:'Orden temporal y secuenciación',
    meaning:'Entrena recordar el orden de aparición de estímulos.',
    interpret:'Valora la tendencia de aciertos por posición y la capacidad de mantener secuencias progresivamente más largas.',
    refs:['wmmeta','multiwm']
  },
  'wm-location':{
    domain:'Memoria de localización',
    meaning:'Entrena asociación entre objetos y posiciones espaciales.',
    interpret:'Compara precisión con el mismo número de objetos. Un aumento de objetos manteniendo la precisión indica mayor carga tolerada.',
    refs:['wmmeta','corsi','multiwm']
  },
  'wm-updating':{
    domain:'Actualización mental',
    meaning:'Entrena conservar solo la información más reciente mientras se descarta la anterior.',
    interpret:'Observa si mejora el recuerdo de los últimos elementos con igual cantidad a mantener. Es sensible a atención y velocidad de presentación.',
    refs:['wmmeta','multiwm','computer']
  },
  'wm-dual':{
    domain:'Atención dividida y memoria de trabajo',
    meaning:'Combina una clasificación sencilla con mantenimiento simultáneo de información.',
    interpret:'Es más exigente que una tarea única. Interpreta la evolución dentro de esta actividad y evita compararla directamente con tareas simples.',
    refs:['multiwm','computer','aha2026']
  },
  'figuras-palabras':{
    domain:'Asociación visual-semántica',
    meaning:'Entrena emparejamiento entre estímulos visuales y palabras.',
    interpret:'Observa precisión, errores y tiempo a lo largo de sesiones similares. El resultado puede verse afectado por lenguaje, visión y familiaridad con los estímulos.',
    refs:['aha2026','memory2025']
  },
  'colores-palabras':{
    domain:'Procesamiento visual y acceso semántico',
    meaning:'Entrena discriminación de color y asociación con su denominación.',
    interpret:'Compara precisión y tiempo entre sesiones semejantes. No es una prueba diagnóstica de percepción del color ni de lenguaje.',
    refs:['aha2026','memory2025']
  },
  'formas-colores':{
    domain:'Discriminación visual combinada',
    meaning:'Entrena integrar forma, color y descripción verbal.',
    interpret:'La tendencia personal es más útil que el porcentaje aislado. Observa si disminuyen los errores manteniendo el mismo número de elementos.',
    refs:['aha2026','memory2025']
  },
  'figuras-complejas':{
    domain:'Discriminación visuoespacial',
    meaning:'Entrena análisis visual de configuraciones más complejas.',
    interpret:'Valora la evolución personal de precisión y tiempo. Estas figuras son estímulos de entrenamiento y no reproducen un test neuropsicológico estandarizado.',
    refs:['aha2026','memory2025']
  }
};

function evidenceGuideFor(setId){
  return ACTIVITY_GUIDE[setId] || {
    domain:'Entrenamiento cognitivo',
    meaning:'Actividad diseñada para práctica cognitiva estructurada.',
    interpret:'Interpreta el resultado como seguimiento personal de entrenamiento, no como diagnóstico ni baremo clínico.',
    refs:['aha2026','memory2025']
  };
}

function evidenceRefsHTML(ids){
  return ids.map(id=>EVIDENCE_REFS.find(r=>r.id===id)).filter(Boolean).map(r=>`
    <article class="reference-card">
      <div><strong>${escapeHTML(r.title)}</strong><span>${escapeHTML(r.authors)} · ${escapeHTML(r.year)}</span></div>
      <p>${escapeHTML(r.note)}</p>
      <a class="btn btn-ghost" href="${escapeHTML(r.url)}" target="_blank" rel="noopener">Ver referencia</a>
    </article>`).join('');
}

function renderEvidence(setId=null){
  state.screen='evidence';
  const guide=setId?evidenceGuideFor(setId):null;
  main.innerHTML=`
    <section class="card evidence-hero">
      <span class="home-eyebrow">Bibliografía y ayuda</span>
      <h1>${guide?escapeHTML(guide.domain):'Cómo interpretar los ejercicios'}</h1>
      <p>${guide?escapeHTML(guide.meaning):'Información para entender qué trabaja cada actividad y cómo leer la evolución de los resultados.'}</p>
      <div class="evidence-warning"><strong>Importante:</strong> las puntuaciones de esta aplicación son métricas de entrenamiento. No son puntuaciones normativas ni permiten diagnosticar deterioro cognitivo, recuperación o pronóstico.</div>
    </section>
    ${guide?`
      <section class="card section">
        <h2>Cómo interpretar este resultado</h2>
        <p class="evidence-interpret">${escapeHTML(guide.interpret)}</p>
        <div class="evidence-principles">
          <div><strong>1</strong><span>Compara contigo mismo</span><small>Misma actividad y condiciones parecidas.</small></div>
          <div><strong>2</strong><span>Mira la tendencia</span><small>Varias sesiones son más útiles que una sola.</small></div>
          <div><strong>3</strong><span>Considera el contexto</span><small>Fatiga, atención, visión, audición y lenguaje influyen.</small></div>
        </div>
      </section>
      <section class="section"><div class="section-title"><div><h2>Referencias relacionadas</h2><p>Lecturas que ayudan a contextualizar esta actividad.</p></div></div><div class="reference-grid">${evidenceRefsHTML(guide.refs)}</div></section>
    `:`
      <section class="section evidence-activity-grid">
        ${Object.entries(ACTIVITY_GUIDE).map(([id,g])=>`<button class="evidence-activity-card" data-evidence-id="${escapeHTML(id)}" type="button"><strong>${escapeHTML(g.domain)}</strong><span>${escapeHTML(g.meaning)}</span></button>`).join('')}
      </section>
      <section class="section"><div class="section-title"><div><h2>Bibliografía general</h2><p>Guías y revisiones utilizadas para contextualizar el entrenamiento.</p></div></div><div class="reference-grid">${evidenceRefsHTML(EVIDENCE_REFS.map(r=>r.id))}</div></section>
    `}
    <section class="card section"><div class="actions"><button id="evidenceBack" class="btn btn-ghost" type="button">Volver</button></div></section>`;
  main.querySelectorAll('[data-evidence-id]').forEach(b=>b.addEventListener('click',()=>renderEvidence(b.dataset.evidenceId)));
  document.getElementById('evidenceBack')?.addEventListener('click',()=>setId?renderEvidence():renderHome());
}

function profileStats(){
  const results=Array.isArray(state.results)?state.results:[];
  const count=results.length;
  const scores=results.map(r=>Number(r.score)).filter(Number.isFinite);
  const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
  const best=scores.length?Math.max(...scores):0;
  const minutes=Math.round(results.reduce((s,r)=>s+Number(r.durationMs||0),0)/60000);
  const daySet=new Set(results.map(r=>String(r.date||'').slice(0,10)).filter(Boolean));
  const grouped=new Map();
  results.forEach(r=>{
    const key=r.setId||r.setName||'otro';
    const g=grouped.get(key)||{name:r.setName||key,count:0,sum:0,best:0,last:null};
    g.count++;g.sum+=Number(r.score||0);g.best=Math.max(g.best,Number(r.score||0));
    if(!g.last||new Date(r.date)>new Date(g.last.date))g.last=r;
    grouped.set(key,g);
  });
  return {results,count,avg,best,minutes,days:daySet.size,groups:[...grouped.entries()].map(([id,g])=>({id,...g,avg:Math.round(g.sum/g.count)})).sort((a,b)=>b.count-a.count)};
}

function profileTrendSVG(results){
  const recent=[...results].slice(0,12).reverse();
  if(!recent.length)return '<div class="chart-empty">Todavía no hay sesiones para mostrar.</div>';
  const w=760,h=220,p=36,x=i=>recent.length===1?w/2:p+i*(w-2*p)/(recent.length-1),y=v=>p+(100-v)*(h-2*p)/100;
  return `<svg class="profile-trend-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolución de resultados">
    <g class="profile-grid"><line x1="${p}" y1="${y(100)}" x2="${w-p}" y2="${y(100)}"/><line x1="${p}" y1="${y(50)}" x2="${w-p}" y2="${y(50)}"/><line x1="${p}" y1="${y(0)}" x2="${w-p}" y2="${y(0)}"/></g>
    <polyline points="${recent.map((r,i)=>x(i)+','+y(Number(r.score||0))).join(' ')}" fill="none" class="profile-line"/>
    <g class="profile-points">${recent.map((r,i)=>'<circle cx="'+x(i)+'" cy="'+y(Number(r.score||0))+'" r="6"><title>'+escapeHTML(r.setName||'Ejercicio')+': '+Number(r.score||0)+'%</title></circle>').join('')}</g>
  </svg>`;
}

function renderMyProgress(){
  state.screen='my-progress';
  const s=profileStats();
  const person=window.MULTIUSER?.user?.displayName || window.MULTIUSER?.user?.email || 'Mi progreso';
  main.innerHTML=`
    <section class="card profile-hero">
      <div class="section-title"><div><span class="home-eyebrow">Perfil personal</span><h1>${escapeHTML(person)}</h1><p>Estadísticas calculadas únicamente con tus sesiones guardadas.</p></div><button id="progressBack" class="btn btn-ghost" type="button">Inicio</button></div>
      <div class="profile-kpis">
        <div><strong>${s.count}</strong><span>Sesiones</span></div>
        <div><strong>${s.count?s.avg+'%':'—'}</strong><span>Media</span></div>
        <div><strong>${s.count?s.best+'%':'—'}</strong><span>Mejor resultado</span></div>
        <div><strong>${s.minutes}</strong><span>Minutos</span></div>
        <div><strong>${s.days}</strong><span>Días activos</span></div>
      </div>
    </section>
    <section class="card section">
      <div class="section-title"><div><h2>Evolución reciente</h2><p>Últimas 12 sesiones. Úsala como tendencia personal, no como baremo clínico.</p></div></div>
      ${profileTrendSVG(s.results)}
    </section>
    <section class="section">
      <div class="section-title"><div><h2>Por actividad</h2><p>Media, mejor resultado y número de sesiones.</p></div></div>
      <div class="profile-activity-grid">${s.groups.length?s.groups.map(g=>`
        <article class="profile-activity-card">
          <div><strong>${escapeHTML(g.name)}</strong><span>${g.count} ${g.count===1?'sesión':'sesiones'}</span></div>
          <div class="profile-activity-score">${g.avg}%</div>
          <div class="profile-bar"><span style="width:${Math.max(0,Math.min(100,g.avg))}%"></span></div>
          <small>Mejor: ${g.best}% · Último: ${Number(g.last?.score||0)}%</small>
          <button class="btn btn-ghost" data-profile-evidence="${escapeHTML(g.id)}" type="button">Interpretar actividad</button>
        </article>`).join(''):'<div class="empty">Completa algún ejercicio para empezar a ver tus estadísticas.</div>'}</div>
    </section>
    <section class="card section profile-note"><strong>Cómo leer estos datos</strong><p>La información es útil para seguir constancia y tendencia dentro de la aplicación. Una puntuación alta o baja aislada no demuestra mejoría, empeoramiento ni diagnóstico clínico.</p></section>`;
  document.getElementById('progressBack')?.addEventListener('click',renderHome);
  main.querySelectorAll('[data-profile-evidence]').forEach(b=>b.addEventListener('click',()=>renderEvidence(b.dataset.profileEvidence)));
}

function addEvidenceButtons(){
  const configSetId=state?.selectedSetId;
  if(state.screen==='config' && configSetId && !document.getElementById('activityEvidenceBtn')){
    const actions=main.querySelector('.actions');
    if(actions){
      const b=document.createElement('button');b.id='activityEvidenceBtn';b.className='btn btn-secondary btn-large';b.type='button';b.textContent='Interpretar actividad';b.addEventListener('click',()=>renderEvidence(configSetId));actions.appendChild(b);
    }
  }
  if((state.screen==='ram'||wmState?.task) && !document.getElementById('activityEvidenceBtn')){
    const taskId=wmState?.task ? 'wm-'+wmState.task : (ramState?.type==='words'?'ram-palabras':ramState?.type==='objects'?'ram-objetos-casa':null);
    const actions=main.querySelector('.actions');
    if(actions&&taskId){
      const b=document.createElement('button');b.id='activityEvidenceBtn';b.className='btn btn-secondary';b.type='button';b.textContent='Bibliografía';b.addEventListener('click',()=>renderEvidence(taskId));actions.appendChild(b);
    }
  }
}

function installEvidenceChrome(){
  const top=document.querySelector('.top-actions');
  if(top&&!document.getElementById('myProgressBtn')){
    const p=document.createElement('button');p.id='myProgressBtn';p.className='btn btn-ghost nav-btn';p.type='button';p.title='Mi progreso: estadísticas personales';p.setAttribute('aria-label','Mi progreso');p.innerHTML='<span class="nav-icon" aria-hidden="true">📈</span><span class="nav-label">Mi progreso</span>';p.addEventListener('click',renderMyProgress);
    const h=document.getElementById('historyBtn');top.insertBefore(p,h||null);
  }
  if(top&&!document.getElementById('bibliographyBtn')){
    const b=document.createElement('button');b.id='bibliographyBtn';b.className='btn btn-ghost nav-btn';b.type='button';b.title='Bibliografía y ayuda para interpretar actividades';b.setAttribute('aria-label','Bibliografía');b.innerHTML='<span class="nav-icon" aria-hidden="true">📚</span><span class="nav-label">Bibliografía</span>';b.addEventListener('click',()=>renderEvidence());
    const h=document.getElementById('historyBtn');top.insertBefore(b,h||null);
  }
}

function bootEvidence(){
  installEvidenceChrome();
  const wrap=(name,after)=>{
    const fn=window[name];if(typeof fn!=='function'||fn._evidenceWrapped)return;
    const wrapped=function(){const out=fn.apply(this,arguments);setTimeout(after,0);return out;};wrapped._evidenceWrapped=true;window[name]=wrapped;
  };
  wrap('renderConfig',addEvidenceButtons);
  wrap('renderRamConfig',addEvidenceButtons);
  wrap('renderWmConfig',addEvidenceButtons);
  setTimeout(()=>{installEvidenceChrome();addEvidenceButtons();},500);
}
bootEvidence();
