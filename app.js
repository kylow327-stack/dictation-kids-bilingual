(function(){
  var n=15, parts=new Array(n), left=n;
  function go(){
    if(left) return;
    (0,eval)(atob(parts.join("")));
  }
  for(var i=0;i<n;i++)(function(i){
    var x=new XMLHttpRequest();
    x.open("GET","app.b64."+i+".txt",true);
    x.onload=function(){ parts[i]=x.responseText; left--; go(); };
    x.onerror=function(){ console.error("b64",i); };
    x.send();
  })(i);
})();
