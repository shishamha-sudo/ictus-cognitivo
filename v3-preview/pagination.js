'use strict';

const LIST_PAGE_SIZE_DEFAULT = 10;
const LIST_PAGE_SIZE_OPTIONS = [5,10,20,50];

function createPager(items,onPage,label='registros',initialPageSize=LIST_PAGE_SIZE_DEFAULT){
  let data=Array.isArray(items)?items:[];
  let pageSize=LIST_PAGE_SIZE_OPTIONS.includes(initialPageSize)?initialPageSize:LIST_PAGE_SIZE_DEFAULT;
  let page=1;
  const wrap=document.createElement('div');
  wrap.className='pager';

  const pages=()=>Math.max(1,Math.ceil(data.length/pageSize));

  function emit(){
    page=Math.max(1,Math.min(pages(),page));
    const start=(page-1)*pageSize;
    onPage(data.slice(start,start+pageSize),page,pageSize);
  }

  function draw(){
    const total=data.length;
    const totalPages=pages();
    page=Math.max(1,Math.min(totalPages,page));
    const from=total?(page-1)*pageSize+1:0;
    const to=Math.min(page*pageSize,total);

    wrap.innerHTML=
      '<div class="pager-left">'+
        '<span class="pager-summary">'+(total?'Mostrando '+from+'–'+to+' de '+total+' '+label:'0 '+label)+'</span>'+
        '<label class="pager-size-label">Registros por página '+
          '<select class="pager-size" aria-label="Registros por página">'+
            LIST_PAGE_SIZE_OPTIONS.map(n=>'<option value="'+n+'" '+(n===pageSize?'selected':'')+'>'+n+'</option>').join('')+
          '</select>'+
        '</label>'+
      '</div>'+
      '<div class="pager-actions">'+
        '<button class="btn btn-ghost pager-first" type="button" '+(page===1?'disabled':'')+' title="Primera página">«</button>'+
        '<button class="btn btn-ghost pager-prev" type="button" '+(page===1?'disabled':'')+' title="Página anterior">‹</button>'+
        '<span class="pager-page">Página '+page+' de '+totalPages+'</span>'+
        '<button class="btn btn-ghost pager-next" type="button" '+(page===totalPages?'disabled':'')+' title="Página siguiente">›</button>'+
        '<button class="btn btn-ghost pager-last" type="button" '+(page===totalPages?'disabled':'')+' title="Última página">»</button>'+
      '</div>';

    wrap.querySelector('.pager-size')?.addEventListener('change',e=>{
      const next=Number(e.target.value);
      pageSize=LIST_PAGE_SIZE_OPTIONS.includes(next)?next:LIST_PAGE_SIZE_DEFAULT;
      page=1;draw();emit();
    });
    wrap.querySelector('.pager-first')?.addEventListener('click',()=>{page=1;draw();emit();});
    wrap.querySelector('.pager-prev')?.addEventListener('click',()=>{page--;draw();emit();});
    wrap.querySelector('.pager-next')?.addEventListener('click',()=>{page++;draw();emit();});
    wrap.querySelector('.pager-last')?.addEventListener('click',()=>{page=totalPages;draw();emit();});
  }

  wrap.setItems=next=>{
    data=Array.isArray(next)?next:[];
    page=1;
    draw();
    emit();
  };

  draw();
  emit();
  return wrap;
}

function paginateDomContainer(container,itemSelector,label='registros',initialPageSize=LIST_PAGE_SIZE_DEFAULT){
  if(!container || container.dataset.paginated==='1') return;
  const items=[...container.querySelectorAll(itemSelector)];
  if(items.length<=LIST_PAGE_SIZE_OPTIONS[0]) return;

  container.dataset.paginated='1';
  const host=document.createElement('div');
  host.className='pager-host';

  const pager=createPager(items,pageItems=>{
    const visible=new Set(pageItems);
    items.forEach(el=>{el.style.display=visible.has(el)?'':'none';});
  },label,initialPageSize);

  host.appendChild(pager);
  container.insertAdjacentElement('afterend',host);
}

function applyGlobalPagination(root=document){
  root.querySelectorAll('.table-wrap').forEach(wrap=>{
    const tbody=wrap.querySelector('tbody');
    if(tbody) paginateDomContainer(tbody,':scope > tr','registros');
  });
  root.querySelectorAll('.reference-grid').forEach(grid=>paginateDomContainer(grid,':scope > .reference-card','referencias',5));
  root.querySelectorAll('.evidence-activity-grid').forEach(grid=>paginateDomContainer(grid,':scope > .evidence-activity-card','actividades',5));
  root.querySelectorAll('.profile-activity-grid').forEach(grid=>paginateDomContainer(grid,':scope > .profile-activity-card','actividades',5));
  root.querySelectorAll('.recent-results-list').forEach(grid=>paginateDomContainer(grid,':scope > .recent-result','resultados',5));
  root.querySelectorAll('.wm-grid').forEach(grid=>paginateDomContainer(grid,':scope > .wm-card','actividades',5));
  root.querySelectorAll('.result-bars').forEach(grid=>paginateDomContainer(grid,':scope > .result-bar-row','ejercicios',5));
}

function logDateValue(log){
  const raw=log?.createdAt||log?.clientAt;
  if(!raw) return null;
  const d=typeof raw.toDate==='function'?raw.toDate():new Date(raw);
  return Number.isNaN(d.getTime())?null:d;
}

function adminTestLabel(log){
  return String(log?.detail?.setName||log?.detail?.setId||'');
}

async function renderUserAdminPaged(){
  if(MULTIUSER.role!=='admin') return renderHome();
  state.screen='multi-admin';
  main.innerHTML='<section class="card"><h1>Administración</h1><p>Cargando usuarios y actividad…</p></section>';

  try{
    await usageLog('admin_opened',{screen:'administration'});
    const [us,ls]=await Promise.all([
      MULTIUSER.db.collection('users').get(),
      MULTIUSER.db.collection('usageLogs').orderBy('createdAt','desc').get()
    ]);

    const users=us.docs.map(d=>({...d.data(),_id:d.id}));
    const logs=ls.docs.map(d=>({...d.data(),_id:d.id}));
    const admins=users.filter(u=>u.role==='admin').length;

    const userOptions=[...new Map(users.map(u=>[
      String(u.uid||u.email||u._id),
      String(u.displayName||u.email||u.uid||'Usuario')
    ])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'es'));

    const testOptions=[...new Set(logs.map(adminTestLabel).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));

    main.innerHTML=`
      <section class="card">
        <div class="section-title">
          <div><h1 style="margin:0">Administración</h1><p>Usuarios dados de alta y actividad registrada.</p></div>
          <button id="muBack" class="btn btn-ghost" type="button">Volver</button>
        </div>

        <div class="admin-kpis">
          <div class="admin-kpi"><strong>${users.length}</strong><span>Usuarios</span></div>
          <div class="admin-kpi"><strong>${admins}</strong><span>Administradores</span></div>
          <div class="admin-kpi"><strong>${logs.length}</strong><span>Eventos</span></div>
        </div>

        <div class="privacy-note">El log no guarda las respuestas concretas de los ejercicios.</div>

        <div class="section">
          <div class="section-title"><div><h2>Usuarios</h2><p>Listado paginado.</p></div></div>
          <div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Alta</th><th>Último acceso</th></tr></thead><tbody id="adminUsersBody"></tbody></table></div>
          <div id="adminUsersPager"></div>
        </div>

        <div class="section">
          <div class="section-title"><div><h2>Log de uso</h2><p>Filtra y pagina la actividad registrada.</p></div></div>

          <div class="log-filters">
            <div class="field"><label for="logFrom">Desde</label><input id="logFrom" type="date"></div>
            <div class="field"><label for="logTo">Hasta</label><input id="logTo" type="date"></div>
            <div class="field"><label for="logUser">Usuario</label><select id="logUser"><option value="">Todos</option>${userOptions.map(([id,name])=>'<option value="'+escapeHTML(id)+'">'+escapeHTML(name)+'</option>').join('')}</select></div>
            <div class="field"><label for="logTest">Tipo de test</label><select id="logTest"><option value="">Todos</option>${testOptions.map(name=>'<option value="'+escapeHTML(name)+'">'+escapeHTML(name)+'</option>').join('')}</select></div>
          </div>
          <div class="actions">
            <button id="logApply" class="btn btn-primary" type="button">Aplicar filtros</button>
            <button id="logClear" class="btn btn-ghost" type="button">Limpiar</button>
          </div>
          <div id="logFilterSummary" class="small"></div>

          <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Evento</th><th>Tipo de test</th><th>Detalle</th></tr></thead><tbody id="adminLogsBody"></tbody></table></div>
          <div id="adminLogsPager"></div>
        </div>
      </section>`;

    document.getElementById('muBack').onclick=renderHome;

    const usersBody=document.getElementById('adminUsersBody');
    const usersPager=createPager(users,pageItems=>{
      usersBody.innerHTML=pageItems.map(u=>`
        <tr>
          <td>${escapeHTML(u.displayName||'—')}</td>
          <td>${escapeHTML(u.email||'')}</td>
          <td><span class="role-badge ${u.role==='admin'?'admin':''}">${escapeHTML(u.role||'user')}</span></td>
          <td>${escapeHTML(cloudDate(u.createdAt||u.createdClientAt))}</td>
          <td>${escapeHTML(cloudDate(u.lastLoginAt||u.lastLoginClientAt))}</td>
        </tr>`).join('');
    },'usuarios');
    document.getElementById('adminUsersPager').appendChild(usersPager);

    const logsBody=document.getElementById('adminLogsBody');
    const logsPagerHost=document.getElementById('adminLogsPager');
    const summary=document.getElementById('logFilterSummary');
    let logsPager=null;

    function filteredLogs(){
      const fromVal=document.getElementById('logFrom').value;
      const toVal=document.getElementById('logTo').value;
      const userVal=document.getElementById('logUser').value;
      const testVal=document.getElementById('logTest').value;
      const from=fromVal?new Date(fromVal+'T00:00:00'):null;
      const to=toVal?new Date(toVal+'T23:59:59.999'):null;

      return logs.filter(l=>{
        const d=logDateValue(l);
        if(from&&(!d||d<from)) return false;
        if(to&&(!d||d>to)) return false;
        const userKey=String(l.uid||l.email||'');
        if(userVal&&userKey!==userVal) return false;
        const test=adminTestLabel(l);
        if(testVal&&test!==testVal) return false;
        return true;
      });
    }

    function renderLogPager(data){
      const renderRows=pageItems=>{
        logsBody.innerHTML=pageItems.length?pageItems.map(l=>`
          <tr>
            <td>${escapeHTML(cloudDate(l.createdAt||l.clientAt))}</td>
            <td>${escapeHTML(l.displayName||l.email||l.uid||'')}</td>
            <td>${escapeHTML(l.eventType||'')}</td>
            <td>${escapeHTML(adminTestLabel(l)||'—')}</td>
            <td>${escapeHTML(Object.entries(l.detail||{}).map(([k,v])=>k+': '+v).join(' · '))}</td>
          </tr>`).join(''):'<tr><td colspan="5"><div class="empty">No hay eventos que cumplan los filtros.</div></td></tr>';
      };

      if(!logsPager){
        logsPager=createPager(data,renderRows,'eventos');
        logsPagerHost.appendChild(logsPager);
      }else{
        logsPager.setItems(data);
      }
      summary.textContent='Resultados del filtro: '+data.length+' eventos.';
    }

    const apply=()=>renderLogPager(filteredLogs());
    document.getElementById('logApply').addEventListener('click',apply);
    document.getElementById('logClear').addEventListener('click',()=>{
      ['logFrom','logTo','logUser','logTest'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      renderLogPager(logs);
    });
    ['logFrom','logTo','logUser','logTest'].forEach(id=>document.getElementById(id)?.addEventListener('change',apply));

    renderLogPager(logs);

  }catch(e){
    main.innerHTML='<section class="card"><h1>Administración</h1><p>'+escapeHTML(e?.message||String(e))+'</p></section>';
  }
}

function bootGlobalPagination(){
  if(typeof renderUserAdmin==='function') renderUserAdmin=renderUserAdminPaged;

  const observer=new MutationObserver(mutations=>{
    if(!mutations.some(m=>m.addedNodes.length)) return;
    clearTimeout(bootGlobalPagination._timer);
    bootGlobalPagination._timer=setTimeout(()=>applyGlobalPagination(main),20);
  });
  observer.observe(main,{childList:true,subtree:true});
  setTimeout(()=>applyGlobalPagination(main),300);
}

bootGlobalPagination();
