'use strict';

(function(){
  let toolbar=null;
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

  function fullscreenElement(){
    return document.fullscreenElement
      || document.webkitFullscreenElement
      || document.msFullscreenElement
      || null;
  }

  function fullscreenTarget(){
    return document.getElementById('app') || document.documentElement;
  }

  function svgIcon(id){
    return '<svg class="focus-mode-svg" viewBox="0 0 160 120" aria-hidden="true"><use href="#'+id+'"></use></svg>';
  }

  function notify(message){
    if(typeof toast==='function'){
      toast(message);
      return;
    }
    console.info(message);
  }

  function syncButton(){
    if(!button)return;
    const active=focusActive||!!fullscreenElement();
    button.innerHTML=svgIcon(active?'icon-exit-fullscreen':'icon-fullscreen')+
      '<span class="focus-mode-label">'+(active?'Salir de pantalla completa':'Pantalla completa')+'</span>';
    button.title=active?'Salir de pantalla completa':'Usar la prueba a pantalla completa';
    button.setAttribute('aria-label',button.title);
    button.setAttribute('aria-pressed',active?'true':'false');
  }

  function refit(){
    if(typeof fitTestBoardToViewport==='function'){
      requestAnimationFrame(()=>fitTestBoardToViewport());
    }
  }

  async function enterNativeFullscreen(){
    const target=fullscreenTarget();
    const request=target.requestFullscreen
      || target.webkitRequestFullscreen
      || target.msRequestFullscreen;
    if(!request)return false;
    try{
      const result=request.call(target);
      if(result&&typeof result.then==='function')await result;
      return true;
    }catch(error){
      console.warn('No se pudo activar fullscreen nativo',error);
      return false;
    }
  }

  async function exitNativeFullscreen(){
    const exit=document.exitFullscreen
      || document.webkitExitFullscreen
      || document.msExitFullscreen;
    if(!exit)return false;
    try{
      const result=exit.call(document);
      if(result&&typeof result.then==='function')await result;
      return true;
    }catch(error){
      console.warn('No se pudo salir de fullscreen nativo',error);
      return false;
    }
  }

  async function setFocus(enabled){
    const want=!!enabled;
    focusActive=want;
    document.body.classList.toggle('training-focus',want);
    syncButton();
    refit();

    if(want){
      const nativeOk=fullscreenElement()?true:await enterNativeFullscreen();
      if(!nativeOk){
        notify('El navegador no permitió pantalla completa nativa. Se ha activado la vista ampliada.');
      }
    }else if(fullscreenElement()){
      await exitNativeFullscreen();
    }

    syncButton();
    refit();
  }

  function toggleFromUserEvent(event){
    const trigger=event.target.closest?.('#trainingFocusBtn');
    if(!trigger)return;
    event.preventDefault();
    event.stopPropagation();
    const active=focusActive||!!fullscreenElement();
    setFocus(!active);
  }

  function ensureToolbar(){
    const active=testActive();
    if(!active){
      toolbar?.remove();
      toolbar=null;
      button=null;
      if(focusActive||fullscreenElement())setFocus(false);
      return;
    }

    const host=typeof main!=='undefined' ? main : document.querySelector('main');
    if(!host)return;

    if(!toolbar){
      toolbar=document.createElement('div');
      toolbar.id='trainingFocusToolbar';
      toolbar.className='training-focus-toolbar';

      button=document.createElement('button');
      button.id='trainingFocusBtn';
      button.type='button';
      button.className='btn btn-secondary training-focus-btn';
      toolbar.appendChild(button);
    }

    if(toolbar.parentElement!==host){
      host.prepend(toolbar);
    }

    syncButton();
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      ensureToolbar();
      refit();
    });
  }

  document.addEventListener('click',toggleFromUserEvent,true);

  const onFullscreenChange=()=>{
    if(!fullscreenElement() && focusActive){
      focusActive=false;
      document.body.classList.remove('training-focus');
    }else if(fullscreenElement()){
      focusActive=true;
      document.body.classList.add('training-focus');
    }
    syncButton();
    refit();
  };

  document.addEventListener('fullscreenchange',onFullscreenChange);
  document.addEventListener('webkitfullscreenchange',onFullscreenChange);
  document.addEventListener('MSFullscreenChange',onFullscreenChange);

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',schedule);
  setTimeout(schedule,250);

  window.ICTUS_FULLSCREEN={
    enter:()=>setFocus(true),
    exit:()=>setFocus(false),
    toggle:()=>setFocus(!(focusActive||fullscreenElement()))
  };
})();
