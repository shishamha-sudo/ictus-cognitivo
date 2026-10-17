
'use strict';
const ANON_RESULTS_KEY='cognitivo.results.anonymous.v1';
const MULTIUSER={adminEmail:String(window.ICTUS_ADMIN_EMAIL||'shishamha@gmail.com').toLowerCase(),auth:null,db:null,user:null,role:null,viewAsUser:false,wrapped:false,loginUid:null};
function fbReady(){const c=window.ICTUS_FIREBASE_CONFIG||{};return !!(c.apiKey&&c.projectId&&!String(c.apiKey).includes('__PENDIENTE__')&&!String(c.projectId).includes('__PENDIENTE__'))}
function authGate(msg){
  let g=document.getElementById('authGate');
  if(!g){g=document.createElement('div');g.id='authGate';g.className='auth-gate';document.body.appendChild(g)}
  const ok=fbReady();
  g.innerHTML='<section class="auth-card">'+
    '<div class="brand-mark" style="margin:auto;width:62px;height:62px;font-size:26px">◉</div>'+
    '<h1>Entrenamiento cognitivo</h1>'+
    '<p>'+escapeHTML(msg||(ok?'Accede con Google o entra como usuario anónimo.':'La versión multiusuario está desplegada, pero falta conectar Firebase.'))+'</p>'+
    (ok
      ? '<div class="auth-actions">'+
          '<button id="googleLoginBtn" class="btn btn-primary auth-google" type="button">Acceder con Google</button>'+
          '<button id="anonymousLoginBtn" class="btn btn-secondary auth-anonymous" type="button"><span aria-hidden="true">👤</span> Entrar como anonymous</button>'+
        '</div>'
      : '<div class="auth-status"><strong>Firebase pendiente</strong><div class="small">Completa la configuración para habilitar el acceso.</div></div>')+
    '<p class="small">El acceso anonymous no requiere contraseña y tiene permisos de usuario normal.</p>'+
  '</section>';
  document.getElementById('googleLoginBtn')?.addEventListener('click',loginGoogle);
  document.getElementById('anonymousLoginBtn')?.addEventListener('click',loginAnonymous);
}
function authHide(){document.getElementById('authGate')?.remove()}
function mobile(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints||0)>1}
async function loginGoogle(){try{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});if(mobile())await MULTIUSER.auth.signInWithRedirect(p);else await MULTIUSER.auth.signInWithPopup(p)}catch(e){authGate('No se pudo iniciar sesión: '+(e?.message||'error'))}}
async function loginAnonymous(){
  try{
    authGate('Entrando como anonymous…');
    await MULTIUSER.auth.signInAnonymously();
  }catch(e){
    const code=String(e?.code||'');
    const msg=code.includes('operation-not-allowed')
      ? 'El acceso anonymous no está habilitado en Firebase Authentication.'
      : 'No se pudo iniciar el acceso anonymous: '+(e?.message||'error');
    authGate(msg);
  }
}
async function logoutGoogle(){try{await usageLog('logout')}catch{}await MULTIUSER.auth?.signOut()}
function cloudDate(v){if(!v)return '—';const d=typeof v.toDate==='function'?v.toDate():new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})}
async function ensureProfile(u){
  const ref=MULTIUSER.db.collection('users').doc(u.uid);
  const snap=await ref.get();
  const isAnonymous=!!u.isAnonymous;
  const email=String(u.email||'').toLowerCase();
  const role=!isAnonymous&&email===MULTIUSER.adminEmail?'admin':'user';
  const displayName=isAnonymous?'anonymous':(u.displayName||'');
  const base={
    uid:u.uid,
    email:isAnonymous?'':(u.email||''),
    displayName,
    photoURL:isAnonymous?'':(u.photoURL||''),
    isAnonymous,
    lastLoginAt:firebase.firestore.FieldValue.serverTimestamp(),
    lastLoginClientAt:new Date().toISOString()
  };
  if(!snap.exists){
    await ref.set({...base,role,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdClientAt:new Date().toISOString()});
  }else if(role==='admin'){
    await ref.set({...base,role:'admin'},{merge:true});
  }else{
    await ref.set({...base,role:'user'},{merge:true});
  }
  return (await ref.get()).data();
}
function loadAnonymousResults(){
  try{
    const parsed=JSON.parse(localStorage.getItem(ANON_RESULTS_KEY)||'[]');
    state.results=Array.isArray(parsed)?parsed:[];
  }catch{
    state.results=[];
  }
}
function saveAnonymousResults(){
  try{
    localStorage.setItem(ANON_RESULTS_KEY,JSON.stringify((state.results||[]).slice(0,500)));
  }catch{}
}

async function loadUserResults(){const snap=await MULTIUSER.db.collection('users').doc(MULTIUSER.user.uid).collection('results').get();state.results=snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,500);localStorage.setItem(STORAGE_RESULTS,JSON.stringify(state.results))}
async function saveCloudResult(){if(!MULTIUSER.user||MULTIUSER.user.isAnonymous||!state.results?.length)return;const r=state.results[0];if(!r?.id)return;await MULTIUSER.db.collection('users').doc(MULTIUSER.user.uid).collection('results').doc(r.id).set({...r,uid:MULTIUSER.user.uid,email:MULTIUSER.user.email||'',savedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})}
async function usageLog(eventType,detail={}){if(!MULTIUSER.user||MULTIUSER.user.isAnonymous||!MULTIUSER.db)return;const safe={};['setId','setName','mode','score','total','durationMs','screen','module'].forEach(k=>{if(detail[k]!==undefined&&detail[k]!==null)safe[k]=detail[k]});await MULTIUSER.db.collection('usageLogs').add({eventType,uid:MULTIUSER.user.uid,email:MULTIUSER.user.email||'',displayName:MULTIUSER.user.isAnonymous?'anonymous':(MULTIUSER.user.displayName||''),role:MULTIUSER.role||'user',detail:safe,createdAt:firebase.firestore.FieldValue.serverTimestamp(),clientAt:new Date().toISOString()})}
function setAdminUserView(enabled){
  if(MULTIUSER.role!=='admin') return;
  MULTIUSER.viewAsUser=!!enabled;
  userChrome();
  renderHome();
  toast(MULTIUSER.viewAsUser?'Vista usuario activada.':'Vista administrador restaurada.');
}

function userChrome(){
  const isAdmin=MULTIUSER.role==='admin';
  const adminUi=isAdmin&&!MULTIUSER.viewAsUser;
  const cb=document.getElementById('adminBtn');
  if(cb){cb.style.display=adminUi?'':'none';cb.disabled=!adminUi;}

  ['muChip','muAdmin','muViewUser','muExitUserView','muLogout','adminViewBanner'].forEach(id=>document.getElementById(id)?.remove());
  if(!MULTIUSER.user)return;
  const a=document.querySelector('.top-actions');
  if(!a)return;

  const c=document.createElement('div');
  c.id='muChip';
  c.className='user-chip';
  const roleText=MULTIUSER.viewAsUser?'Vista usuario':(isAdmin?'Admin':'Usuario');
  c.innerHTML=(MULTIUSER.user.photoURL?'<img src="'+escapeHTML(MULTIUSER.user.photoURL)+'" alt="">':'')+
    '<span class="user-chip-name">'+escapeHTML(MULTIUSER.user.isAnonymous?'anonymous':(MULTIUSER.user.displayName||MULTIUSER.user.email||'Usuario'))+'</span>'+
    '<span class="role-badge '+(isAdmin&&!MULTIUSER.viewAsUser?'admin':'')+'">'+roleText+'</span>';
  a.prepend(c);

  if(isAdmin&&!MULTIUSER.viewAsUser){
    const v=document.createElement('button');
    v.id='muViewUser';v.className='btn btn-ghost nav-btn';
    v.title='Ver la aplicación como un usuario normal';
    v.setAttribute('aria-label','Vista usuario');
    v.innerHTML='<span class="nav-icon" aria-hidden="true">👁</span><span class="nav-label">Vista usuario</span>';
    v.onclick=()=>setAdminUserView(true);
    a.appendChild(v);

    const b=document.createElement('button');
    b.id='muAdmin';b.className='btn btn-secondary nav-btn';
    b.title='Administración de usuarios y actividad';
    b.setAttribute('aria-label','Administración');
    b.innerHTML='<span class="nav-icon" aria-hidden="true">⚙</span><span class="nav-label">Administración</span>';
    b.onclick=renderUserAdmin;
    a.appendChild(b);
  } else if(isAdmin&&MULTIUSER.viewAsUser){
    const v=document.createElement('button');
    v.id='muExitUserView';v.className='btn btn-secondary nav-btn';
    v.title='Volver a la vista de administrador';
    v.setAttribute('aria-label','Volver a vista administrador');
    v.innerHTML='<span class="nav-icon" aria-hidden="true">⚙</span><span class="nav-label">Volver a admin</span>';
    v.onclick=()=>setAdminUserView(false);
    a.appendChild(v);

    const banner=document.createElement('div');
    banner.id='adminViewBanner';
    banner.className='admin-view-banner';
    banner.innerHTML='<strong>Vista usuario activa</strong><span>Estás viendo la aplicación como un usuario normal. Tus permisos de administrador no han cambiado.</span>';
    document.querySelector('.topbar')?.insertAdjacentElement('afterend',banner);
  }

  const o=document.createElement('button');
  o.id='muLogout';o.className='btn btn-ghost nav-btn';
  o.title='Cerrar sesión';o.setAttribute('aria-label','Salir');
  o.innerHTML='<span class="nav-icon" aria-hidden="true">↪</span><span class="nav-label">Salir</span>';
  o.onclick=logoutGoogle;
  a.appendChild(o);
}

function wrapApp(){if(MULTIUSER.wrapped)return;MULTIUSER.wrapped=true;const sr=saveResults;saveResults=function(){sr();if(MULTIUSER.user?.isAnonymous){saveAnonymousResults();return;}saveCloudResult().catch(()=>toast('Resultado guardado localmente; sincronización pendiente.'))};const ss=startSession;startSession=function(id){const set=state.content.sets.find(x=>x.id===id);usageLog('test_started',{setId:id,setName:set?.name||'',mode:state.config.mode});return ss(id)};const fs=finishSession;finishSession=function(){const x=fs();const r=state.results?.[0];if(r)usageLog('test_completed',{setId:r.setId,setName:r.setName,mode:r.mode,score:r.score,total:r.total,durationMs:r.durationMs});return x};const ra=renderAdmin;renderAdmin=function(){if(MULTIUSER.role!=='admin'||MULTIUSER.viewAsUser){toast('Solo disponible en la vista de administrador.');return renderHome()}usageLog('content_admin_opened',{screen:'content'});return ra()}}
async function renderUserAdmin(){if(MULTIUSER.role!=='admin'||MULTIUSER.viewAsUser)return renderHome();state.screen='multi-admin';main.innerHTML='<section class="card"><h1>Administración</h1><p>Cargando usuarios y log…</p></section>';try{await usageLog('admin_opened',{screen:'administration'});const [us,ls]=await Promise.all([MULTIUSER.db.collection('users').get(),MULTIUSER.db.collection('usageLogs').orderBy('createdAt','desc').limit(100).get()]);const users=us.docs.map(d=>d.data()),logs=ls.docs.map(d=>d.data()),admins=users.filter(u=>u.role==='admin').length;main.innerHTML='<section class="card"><div class="section-title"><div><h1 style="margin:0">Administración</h1><p>Usuarios dados de alta y actividad reciente.</p></div><button id="muBack" class="btn btn-ghost">Volver</button></div><div class="admin-kpis"><div class="admin-kpi"><strong>'+users.length+'</strong><span>Usuarios</span></div><div class="admin-kpi"><strong>'+admins+'</strong><span>Administradores</span></div><div class="admin-kpi"><strong>'+logs.length+'</strong><span>Eventos mostrados</span></div></div><div class="privacy-note">El log no guarda las respuestas concretas de los ejercicios.</div><div class="section"><h2>Usuarios</h2><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Alta</th><th>Último acceso</th></tr></thead><tbody>'+users.map(u=>'<tr><td>'+escapeHTML(u.displayName||'—')+'</td><td>'+escapeHTML(u.email||'')+'</td><td><span class="role-badge '+(u.role==='admin'?'admin':'')+'">'+escapeHTML(u.role||'user')+'</span></td><td>'+escapeHTML(cloudDate(u.createdAt||u.createdClientAt))+'</td><td>'+escapeHTML(cloudDate(u.lastLoginAt||u.lastLoginClientAt))+'</td></tr>').join('')+'</tbody></table></div></div><div class="section"><h2>Log de uso</h2><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Evento</th><th>Detalle</th></tr></thead><tbody>'+logs.map(l=>'<tr><td>'+escapeHTML(cloudDate(l.createdAt||l.clientAt))+'</td><td>'+escapeHTML(l.displayName||l.email||'')+'</td><td>'+escapeHTML(l.eventType||'')+'</td><td>'+escapeHTML(Object.entries(l.detail||{}).map(([k,v])=>k+': '+v).join(' · '))+'</td></tr>').join('')+'</tbody></table></div></div></section>';document.getElementById('muBack').onclick=renderHome}catch(e){main.innerHTML='<section class="card"><h1>Administración</h1><p>'+escapeHTML(e?.message||String(e))+'</p></section>'}}
async function authChanged(u){
  if(!u){
    MULTIUSER.user=null;
    MULTIUSER.role=null;
    MULTIUSER.viewAsUser=false;
    MULTIUSER.loginUid=null;
    userChrome();
    authGate();
    return;
  }

  MULTIUSER.user=u;

  if(u.isAnonymous){
    MULTIUSER.role='user';
    loadAnonymousResults();
    authHide();
    userChrome();
    MULTIUSER.loginUid=u.uid;
    renderHome();
    return;
  }

  const p=await ensureProfile(u);
  MULTIUSER.role=p.role||(String(u.email||'').toLowerCase()===MULTIUSER.adminEmail?'admin':'user');
  await loadUserResults();
  authHide();
  userChrome();
  if(MULTIUSER.loginUid!==u.uid){
    MULTIUSER.loginUid=u.uid;
    usageLog('login');
  }
  renderHome();
}
function initAuth(){wrapApp();document.getElementById('adminBtn')?.style.setProperty('display','none');if(!fbReady()){authGate();return}try{if(!firebase.apps.length)firebase.initializeApp(window.ICTUS_FIREBASE_CONFIG);MULTIUSER.auth=firebase.auth();MULTIUSER.db=firebase.firestore();authGate('Comprobando sesión de Google…');MULTIUSER.auth.getRedirectResult().catch(()=>{}).finally(()=>MULTIUSER.auth.onAuthStateChanged(u=>authChanged(u).catch(e=>authGate('No se pudo cargar el perfil: '+(e?.message||e)))))}catch(e){authGate('No se pudo iniciar Firebase: '+(e?.message||e))}}
initAuth();
