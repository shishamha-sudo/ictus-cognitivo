'use strict';

(function(){
  let button=null;
  let focusActive=false;
  let scheduled=false;

  function testActive(){
    const normal=typeof state!=='undefined' && state.screen==='test';
    const ram=typeof ramState!=='undefined'
      && typeof state!=='undefined'
      && state.screen==='ram'
      && ramState.startedAt>0
      && (ramState.phase==='show'||ramState.phase==='recall');
    const wm=typeof state!=='undefined'
      && state.screen==='working-memory'
      && document.querySelector('.wm-stage-card');
    return !!(normal||ram||wm);
  }

  function svgIcon(id){
    return '<svg class="focus-mode-svg" viewBox="0 0 160 120" aria-hidden="true"><use href="#'+id+'"></use></svg>';
  }

  function syncButton(){
    if(!button)return;
    const active=focusActive||!!document.fullscreenElement;
    button.innerHTML=svgIcon(active?'icon-exit-fullscreen':'icon-fullscreen')+
      '<span class="focus-mode-label">'+(active?'Salir de pantalla completa':'Pantalla completa')+'</span>';
    button.title=active?'Salir de pantalla completa':'Usar la prueba a pantalla completa';
    button.setAttribute('aria-label',button.title);
  }

  async function setFocus(enabled){
    focusActive=!!enabled;
    document.body.classList.toggle('training-focus',focusActive);
    try{
      if(focusActive && !document.fullscreenElement && document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen();
      }else if(!focusActive && document.fullscreenElement && document.exitFullscreen){
        await document.exitFullscreen();
      }
    }catch{}
    syncButton();
  }

  function ensureButton(){
    const active=testActive();
    if(!active){
      if(focusActive)setFocus(false);
      button?.remove();
      button=null;
      return;
    }
    if(!button){
      button=document.createElement('button');
      button.id='trainingFocusBtn';
      button.type='button';
      button.className='btn btn-secondary training-focus-btn';
      button.addEventListener('click',()=>setFocus(!(focusActive||document.fullscreenElement)));
      document.body.appendChild(button);
    }
    syncButton();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      ensureButton();
    });
  }

  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement && focusActive){
      focusActive=false;
      document.body.classList.remove('training-focus');
    }
    syncButton();
  });

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',schedule);
  setTimeout(schedule,250);
})();
