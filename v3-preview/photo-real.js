'use strict';

const PHOTO_REAL_SET={
  id:'fotos-reales',
  name:'Fotos reales',
  short:'Foto ↔ palabra',
  description:'Relaciona fotografías reales de objetos cotidianos con la palabra correspondiente.',
  icon:'icon-photo',
  menuOnly:false,
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
      type:'photo',
      value:'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=900',
      alt:'Fotografía real de '+target.toLowerCase()
    },
    target
  }))
};

function ensurePhotoRealSet(){
  if(typeof state==='undefined'||!state.content?.sets)return false;
  const index=state.content.sets.findIndex(s=>s.id===PHOTO_REAL_SET.id);
  if(index>=0){
    state.content.sets[index]=structuredClone(PHOTO_REAL_SET);
  }else{
    state.content.sets.push(structuredClone(PHOTO_REAL_SET));
  }
  document.getElementById('photoRealBtn')?.remove();
  return true;
}

function installPhotoRealHome(){
  if(!ensurePhotoRealSet())return;
  if(typeof state!=='undefined' && state.screen==='home' && typeof renderHome==='function'){
    renderHome();
  }
}

installPhotoRealHome();
setTimeout(installPhotoRealHome,300);
