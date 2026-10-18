'use strict';

const PHOTO_REAL_SET={
  id:'fotos-reales',
  name:'Fotos reales',
  short:'Foto ↔ palabra',
  description:'Relaciona fotografías reales de objetos cotidianos con la palabra correspondiente.',
  icon:'icon-photo',
  menuOnly:true,
  sourceNote:'Fotografías procedentes de Wikimedia Commons. Las licencias y autorías se conservan en las páginas originales de cada archivo.',
  pairs:[
    ['manzana','Apple (1).jpg','MANZANA'],
    ['perro','Dog white.jpg','PERRO'],
    ['casa','White house.jpg','CASA'],
    ['coche','White car (13184963).jpg','COCHE'],
    ['platano','Banane à 45°.jpg','PLÁTANO'],
    ['llave','House key.jpg','LLAVE'],
    ['libro','Book book.jpg','LIBRO'],
    ['taza','Cup of tea isolated on white background - Petr Kratochvil.jpg','TAZA'],
    ['flor','Flower on white Background.jpg','FLOR'],
    ['bicicleta','White Bicycle.jpg','BICICLETA']
  ].map(([id,file,target])=>({
    id:'foto-'+id,
    visual:{
      type:'image',
      value:'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=800',
      alt:'Fotografía real de '+target.toLowerCase()
    },
    target
  }))
};

function ensurePhotoRealSet(){
  if(typeof state==='undefined'||!state.content?.sets)return;
  if(!state.content.sets.some(s=>s.id===PHOTO_REAL_SET.id)) state.content.sets.push(PHOTO_REAL_SET);
}

function installPhotoRealMenu(){
  ensurePhotoRealSet();
  const actions=document.querySelector('.top-actions');
  if(!actions||document.getElementById('photoRealBtn'))return;
  const button=document.createElement('button');
  button.id='photoRealBtn';
  button.type='button';
  button.className='btn btn-ghost nav-btn';
  button.title='Ejercicios con fotografías reales';
  button.setAttribute('aria-label','Fotos reales');
  button.innerHTML='<span class="nav-icon">'+iconHTML('icon-photo','nav-svg-icon')+'</span><span class="nav-label">Fotos reales</span>';
  button.addEventListener('click',()=>{
    ensurePhotoRealSet();
    renderConfig('fotos-reales');
  });
  const history=document.getElementById('historyBtn');
  actions.insertBefore(button,history||null);
}

installPhotoRealMenu();
setTimeout(installPhotoRealMenu,300);
