var assert = require('assert');
var http = require('http');
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname, '..');
var server = http.createServer(function(req,res){
  var f = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  var p = path.join(root, f);
  if(!p.startsWith(root) || !fs.existsSync(p)){ res.writeHead(404); res.end('no'); return; }
  var t = f.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8';
  res.writeHead(200, {'Content-Type': t});
  res.end(fs.readFileSync(p));
});
server.listen(0, async function(){
  var port = server.address().port;
  function get(u){
    return new Promise(function(resolve,reject){
      http.get('http://127.0.0.1:'+port+u, function(r){
        var b=''; r.on('data',function(d){b+=d}); r.on('end',function(){ resolve({status:r.statusCode, body:b}); });
      }).on('error', reject);
    });
  }
  try {
    var idx = await get('/');
    assert.strictEqual(idx.status, 200);
    assert.ok(idx.body.indexOf('data-edition="bilingual"')>=0);
    assert.ok(idx.body.indexOf('src="core.js"')>=0);
    assert.ok(idx.body.indexOf('id="langBar"')>=0);
    assert.ok(idx.body.indexOf('btnLangEn')>=0 && idx.body.indexOf('btnLangZh')>=0);
    assert.ok(idx.body.indexOf('DictCore')>=0);
    var core = await get('/core.js');
    assert.strictEqual(core.status, 200);
    assert.ok(core.body.indexOf('bulkSplitPrimaryHint')>=0);
    console.log('PASS http smoke on port', port);
    process.exitCode = 0;
  } catch(e){
    console.error('FAIL', e);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
