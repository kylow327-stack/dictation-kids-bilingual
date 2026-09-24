/**
 * BA acceptance bar for bilingual 默書小達人
 */
var assert = require('assert');
var C = require('../core.js');

var passed = 0;
function ok(name, cond, detail) {
  if (!cond) {
    console.error('FAIL', name, detail || '');
    process.exitCode = 1;
    return;
  }
  passed++;
  console.log('PASS', name);
}

// 1) banks don't clash
ok('lsPrefix en', C.lsPrefix('en') === 'wb_dictation_en_');
ok('lsPrefix zh', C.lsPrefix('zh') === 'wb_dictation_zh_');
ok('items keys differ', C.buildLsKeys('en').items !== C.buildLsKeys('zh').items);
ok('shared pass key', C.buildLsKeys('en').pass === C.buildLsKeys('zh').pass);

// 2) CJK strip EN yes / ZH no
var mixed = 'Hello 你好 world';
ok('EN strip CJK', C.stripPrimaryOnImport('en', mixed) === 'Hello world');
ok('ZH keep CJK', C.stripPrimaryOnImport('zh', '我最喜歡圖書館。') === '我最喜歡圖書館。');
ok('ZH keep mixed primary', C.hasCjk(C.stripPrimaryOnImport('zh', '圖書館 library')));

// 3) import both orders
var a = C.bulkSplitPrimaryHint('zh', '我最喜歡的地方是圖書館。 = My favourite place is the library.');
ok('ZH mode 中文=English primary', a.en.indexOf('圖書館') >= 0 && a.zh.indexOf('favourite') >= 0, JSON.stringify(a));
var b = C.bulkSplitPrimaryHint('zh', 'My favourite place is the library. = 我最喜歡的地方是圖書館。');
ok('ZH mode English=中文 primary', b.en.indexOf('圖書館') >= 0 && b.zh.indexOf('favourite') >= 0, JSON.stringify(b));
var c = C.bulkSplitPrimaryHint('en', 'My favourite place is the library. = 我最喜歡的地方是圖書館。');
ok('EN mode English=中文', /favourite/.test(c.en) && /喜歡/.test(c.zh), JSON.stringify(c));
var d = C.bulkSplitPrimaryHint('en', '我最喜歡的地方是圖書館。 = My favourite place is the library.');
ok('EN mode 中文=English flips', /favourite/.test(d.en) && /喜歡/.test(d.zh), JSON.stringify(d));
// EN rejects CJK left in primary after strip
var e = C.bulkSplitPrimaryHint('en', 'Hello 中文 leftover = 你好');
ok('EN primary no CJK after import', !C.hasCjk(e.en), JSON.stringify(e));

// 4) tokenize both
var te = C.tokenize('en', 'Hello, world!');
ok('EN tokenize words', te.filter(function(t){return !t.punct;}).map(function(t){return t.t;}).join('|') === 'Hello|world');
var tz = C.tokenize('zh', '圖書館');
ok('ZH char tiles', tz.length === 3 && tz[0].t === '圖');
var tpipe = C.tokenize('zh', '圖書|館');
ok('ZH pipe break', tpipe.length === 2 && tpipe[0].t === '圖書');

// 5) normWord
ok('EN norm lower', C.normWord('en', 'Hello!') === 'hello');
ok('ZH norm keep', C.normWord('zh', '圖書館。') === '圖書館');
ok('ZH fullwidth A', C.normWord('zh', 'Ａ') === 'A' || C.normWord('zh', 'Ａ') === 'a');

// 6) TTS matches mode
ok('TTS EN', C.ttsTl('en', 'hello').google === 'en-GB' && C.ttsTl('en', 'hello').baidu === 'en');
ok('TTS ZH CJK', C.ttsTl('zh', '你好').google === 'zh-TW' && C.ttsTl('zh', '你好').baidu === 'zh');
ok('TTS ZH latin gloss still en-capable', C.ttsTl('zh', 'hello').google === 'en-GB');

// 7) seeds exist both modes
ok('seed EN', C.seedItems('en').length >= 6);
ok('seed ZH', C.seedItems('zh').length >= 6);
ok('seed ZH primary CJK', C.seedItems('zh').every(function(it){ return C.hasCjk(it.en); }));
ok('seed EN primary Latin', C.seedItems('en').every(function(it){ return /[A-Za-z]/.test(it.en); }));

// 8) labels
ok('labels EN s3', /繁體中文/.test(C.modeLabels('en').s3Desc));
ok('labels ZH s3', /英文/.test(C.modeLabels('zh').s3Desc));

console.log('\n' + passed + ' assertions passed');
if (process.exitCode) process.exit(1);
