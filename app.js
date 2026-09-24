(function(){
  var n=8, parts=new Array(n), left=n;
  function go(){
    if(left) return;
    (0,eval)(parts.join(""));
  }
  for(var i=0;i<n;i++)(function(i){
    var x=new XMLHttpRequest();
    x.open("GET","app.c"+i+".js.txt",true);
    x.onload=function(){ parts[i]=x.responseText; left--; go(); };
    x.onerror=function(){ console.error("chunk",i); };
    x.send();
  })(i);
})();
