/* PK Elektro: foto's in formulieren automatisch verkleinen voor verzending */
(function(){
  var MAX=1600, Q=0.8, MAXN=5;
  function shrink(file){
    return new Promise(function(res){
      if(!/^image\//.test(file.type)||file.type==='image/gif'){res(file);return;}
      var url=URL.createObjectURL(file), img=new Image();
      img.onload=function(){
        var w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,MAX/Math.max(w,h));
        if(s===1&&file.size<600000){URL.revokeObjectURL(url);res(file);return;}
        var c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        c.toBlob(function(b){URL.revokeObjectURL(url);
          if(!b||b.size>=file.size){res(file);return;}
          try{res(new File([b],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'}));}catch(e){res(file);}
        },'image/jpeg',Q);
      };
      img.onerror=function(){URL.revokeObjectURL(url);res(file);};
      img.src=url;
    });
  }
  function init(inp){
    var info=inp.parentNode.querySelector('.pk-foto-info'), hint=info?info.textContent:'';
    inp._pk=Promise.resolve();
    inp.addEventListener('change',function(){
      var files=[].slice.call(inp.files||[]);
      if(!files.length){if(info)info.textContent=hint;return;}
      var teveel=files.length>MAXN; files=files.slice(0,MAXN);
      if(info)info.textContent='Foto\'s worden verwerkt…';
      inp._pk=Promise.all(files.map(shrink)).then(function(out){
        try{var dt=new DataTransfer();out.forEach(function(f){dt.items.add(f);});inp.files=dt.files;}catch(e){}
        if(info)info.textContent=out.length+(out.length===1?' foto':' foto\'s')+' toegevoegd'+(teveel?' (max. '+MAXN+')':'');
      });
    });
    if(inp.form)inp.form.addEventListener('reset',function(){inp._pk=Promise.resolve();if(info)info.textContent=hint;});
  }
  document.querySelectorAll('input.pk-foto').forEach(init);
  window.pkFotoKlaar=function(form){
    var p=[].map.call(form.querySelectorAll('input.pk-foto'),function(i){return i._pk||Promise.resolve();});
    return Promise.all(p);
  };
})();
