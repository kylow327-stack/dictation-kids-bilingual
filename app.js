(function(){
  var n=5, parts=new Array(n), left=n;
  function go(){
    if(left) return;
    var code=parts.join("");
    (0,eval)(code);
  }
  for(var i=0;i<n;i++)(function(i){
    var x=new XMLHttpRequest();
    x.open("GET","app.c"+i+".js.txt",true);
    x.onload=function(){ parts[i]=x.responseText; left--; go(); };
    x.onerror=function(){ console.error("chunk",i); };
    x.send();
  })(i);
})();
