'use strict';

const NEWS_STATE={items:[],loaded:false,error:null};

function newsFormatDate(value){
  if(!value)return '—';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return String(value);
  return d.toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});
}

function newsPlainText(value){
  return String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}

async function loadNews(){
  if(NEWS_STATE.loaded)return NEWS_STATE.items;
  try{
    const response=await fetch('news.json?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const payload=await response.json();
    NEWS_STATE.items=Array.isArray(payload.items)?payload.items:[];
    NEWS_STATE.loaded=true;
    NEWS_STATE.error=null;
  }catch(error){
    NEWS_STATE.error=error;
    NEWS_STATE.items=[];
  }
  return NEWS_STATE.items;
}

function newsRows(items){
  if(!items.length)return '<tr><td colspan="6"><div class="empty">No hay noticias que cumplan los filtros.</div></td></tr>';
  return items.map(item=>`
    <tr>
      <td>${escapeHTML(newsFormatDate(item.publishedAt))}</td>
      <td>${escapeHTML(newsFormatDate(item.loadedAt))}</td>
      <td>${escapeHTML(item.source||'—')}</td>
      <td><strong>${escapeHTML(item.title||'')}</strong></td>
      <td class="news-description">${escapeHTML(newsPlainText(item.description||''))}</td>
      <td><a class="btn btn-ghost news-link" href="${escapeHTML(item.url||'#')}" target="_blank" rel="noopener">Abrir</a></td>
    </tr>`).join('');
}

async function renderNews(){
  state.screen='news';
  main.innerHTML='<section class="card"><h1>News cognitivas</h1><p>Cargando noticias…</p></section>';
  const items=await loadNews();

  main.innerHTML=`
    <section class="card news-hero">
      <div class="section-title">
        <div>
          <span class="home-eyebrow">Actualización diaria</span>
          <h1>News sobre cognición y neurorehabilitación</h1>
          <p>Novedades sobre memoria, atención, ictus, rehabilitación cognitiva, neurociencia y tecnologías de apoyo.</p>
        </div>
        <button id="newsBack" class="btn btn-ghost" type="button">Inicio</button>
      </div>
      <div class="news-note">Las entradas se actualizan automáticamente una vez al día. La fecha “Cargada” indica cuándo se incorporó por primera vez cada noticia a la aplicación.</div>
    </section>

    <section class="card section">
      <div class="news-filters">
        <div class="field">
          <label for="newsSearch">Buscar</label>
          <input id="newsSearch" type="search" placeholder="Ej.: memoria, ictus, rehabilitación">
        </div>
        <div class="field">
          <label for="newsFrom">Desde</label>
          <input id="newsFrom" type="date">
        </div>
        <div class="field">
          <label for="newsTo">Hasta</label>
          <input id="newsTo" type="date">
        </div>
        <div class="field">
          <label for="newsSource">Fuente</label>
          <select id="newsSource">
            <option value="">Todas</option>
            ${[...new Set(items.map(n=>n.source).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')).map(s=>'<option value="'+escapeHTML(s)+'">'+escapeHTML(s)+'</option>').join('')}
          </select>
        </div>
      </div>
      <div class="actions">
        <button id="newsApply" class="btn btn-primary" type="button">Aplicar filtros</button>
        <button id="newsClear" class="btn btn-ghost" type="button">Limpiar</button>
      </div>
      <div id="newsSummary" class="small"></div>
    </section>

    <section class="card section">
      <div class="section-title"><div><h2>Noticias</h2><p>Listado paginado y ordenado por fecha de publicación.</p></div></div>
      <div class="table-wrap">
        <table class="news-table">
          <thead><tr><th>Publicada</th><th>Cargada</th><th>Fuente</th><th>Titular</th><th>Descripción</th><th>Enlace</th></tr></thead>
          <tbody id="newsBody"></tbody>
        </table>
      </div>
      <div id="newsPager"></div>
    </section>`;

  document.getElementById('newsBack')?.addEventListener('click',renderHome);

  const body=document.getElementById('newsBody');
  const pagerHost=document.getElementById('newsPager');
  const summary=document.getElementById('newsSummary');
  let pager=null;

  function currentFiltered(){
    const query=(document.getElementById('newsSearch')?.value||'').trim().toLowerCase();
    const fromValue=document.getElementById('newsFrom')?.value||'';
    const toValue=document.getElementById('newsTo')?.value||'';
    const source=document.getElementById('newsSource')?.value||'';
    const from=fromValue?new Date(fromValue+'T00:00:00'):null;
    const to=toValue?new Date(toValue+'T23:59:59.999'):null;

    return items.filter(item=>{
      const date=item.publishedAt?new Date(item.publishedAt):null;
      if(from&&(!date||date<from))return false;
      if(to&&(!date||date>to))return false;
      if(source&&item.source!==source)return false;
      if(query){
        const haystack=[item.title,item.description,item.source,...(item.tags||[])].join(' ').toLowerCase();
        if(!haystack.includes(query))return false;
      }
      return true;
    });
  }

  function renderFiltered(){
    const filtered=currentFiltered();
    const renderPage=pageItems=>{body.innerHTML=newsRows(pageItems);};

    if(typeof createPager==='function'){
      if(!pager){
        pager=createPager(filtered,renderPage,'noticias');
        pagerHost.appendChild(pager);
      }else{
        pager.setItems(filtered);
      }
    }else{
      renderPage(filtered.slice(0,10));
    }

    summary.textContent=NEWS_STATE.error
      ? 'No se pudo leer el fichero de noticias en esta carga.'
      : 'Resultados: '+filtered.length+' noticias.';
  }

  document.getElementById('newsApply')?.addEventListener('click',renderFiltered);
  document.getElementById('newsClear')?.addEventListener('click',()=>{
    ['newsSearch','newsFrom','newsTo','newsSource'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    renderFiltered();
  });
  document.getElementById('newsSearch')?.addEventListener('input',renderFiltered);
  ['newsFrom','newsTo','newsSource'].forEach(id=>document.getElementById(id)?.addEventListener('change',renderFiltered));

  renderFiltered();
}

function installNewsMenu(){
  const actions=document.querySelector('.top-actions');
  if(!actions||document.getElementById('newsBtn'))return;
  const button=document.createElement('button');
  button.id='newsBtn';
  button.className='btn btn-ghost nav-btn';
  button.type='button';
  button.title='News sobre cognición, memoria, ictus y neurorehabilitación';
  button.setAttribute('aria-label','News cognitivas');
  button.innerHTML='<span class="nav-icon" aria-hidden="true">📰</span><span class="nav-label">News</span>';
  button.addEventListener('click',renderNews);
  const history=document.getElementById('historyBtn');
  actions.insertBefore(button,history||null);
}

installNewsMenu();
setTimeout(installNewsMenu,300);
