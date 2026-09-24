/**
 * DictCore — pure bilingual helpers for 默書小達人（中英雙語）
 * Browser: window.DictCore · Node: module.exports
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DictCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LANG_KEY = 'wb_dictation_lang';
  var PASS_KEY = 'wb_dictation_bi_pass';

  var CJK_RE = /[\u3400-\u9fff\uf900-\ufaff]/;
  var CJK_FIRST_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
  var CJK_STRIP_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/g;
  var PUNCT_TRAIL_RE = /^(.*?)([.,!?;:'"()\u3002\uff0c\uff01\uff1f\uff1b\uff1a、]+)$/;
  var PUNCT_CHAR_RE = /[.,!?;:'"()\u3002\uff0c\uff01\uff1f\uff1b\uff1a、]/;
  var PUNCT_STRIP_EN = /[.,!?;:'"()\u3002\uff0c\uff01\uff1f\uff1b\uff1a]/g;
  var PUNCT_STRIP_ZH = /[\s.,!?;:'"()\u3002\uff0c\uff01\uff1f\uff1b\uff1a、]/g;

  function hasCjk(s) {
    return CJK_RE.test(String(s || ''));
  }

  function normalizeMode(mode) {
    return mode === 'zh' ? 'zh' : 'en';
  }

  function lsPrefix(mode) {
    return normalizeMode(mode) === 'zh' ? 'wb_dictation_zh_' : 'wb_dictation_en_';
  }

  function buildLsKeys(mode) {
    var p = lsPrefix(mode);
    return {
      stars: p + 'stars',
      pass: PASS_KEY,
      admin: p + 'admin',
      date: p + 'date',
      items: p + 'items',
      cache: p + 'formcache',
      read: p + 'read',
      name: p + 'childname',
      task: p + 'task',
      wrong: p + 'wrong',
      cert: p + 'cert',
      points: p + 'points',
      rewards: p + 'rewards',
      prog: p + 'progress',
      device: p + 'did',
      statsPeak: p + 'statspeak',
      selfOnce: p + 'selfonce'
    };
  }

  function tokenizeEn(s) {
    s = String(s || '').trim();
    if (!s) return [];
    var toks = [];
    s.split(/\s+/).forEach(function (p) {
      if (!p) return;
      var m = p.match(PUNCT_TRAIL_RE);
      if (m) {
        if (m[1]) toks.push({ t: m[1], punct: false });
        if (m[2]) toks.push({ t: m[2], punct: true });
      } else {
        toks.push({ t: p, punct: false });
      }
    });
    return toks;
  }

  function tokenizeZh(s) {
    s = String(s || '').trim();
    if (!s) return [];
    if (/[\s|\/]/.test(s)) {
      var parts = s.split(/[\s|\/]+/).filter(Boolean);
      var toks = [];
      parts.forEach(function (p) {
        var m = p.match(PUNCT_TRAIL_RE);
        if (m) {
          if (m[1]) toks.push({ t: m[1], punct: false });
          if (m[2]) toks.push({ t: m[2], punct: true });
        } else {
          toks.push({ t: p, punct: false });
        }
      });
      if (toks.length > 1 || (toks.length === 1 && !hasCjk(toks[0].t))) return toks;
      if (toks.length === 1 && hasCjk(toks[0].t) && toks[0].t.length <= 4) return toks;
    }
    if (hasCjk(s)) {
      var out = [];
      var buf = '';
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (/\s/.test(ch)) continue;
        if (PUNCT_CHAR_RE.test(ch)) {
          if (buf) {
            out.push({ t: buf, punct: false });
            buf = '';
          }
          out.push({ t: ch, punct: true });
        } else if (/[A-Za-z0-9']/.test(ch)) {
          buf += ch;
        } else {
          if (buf) {
            out.push({ t: buf, punct: false });
            buf = '';
          }
          out.push({ t: ch, punct: false });
        }
      }
      if (buf) out.push({ t: buf, punct: false });
      return out;
    }
    return tokenizeEn(s);
  }

  function tokenize(mode, s) {
    return normalizeMode(mode) === 'zh' ? tokenizeZh(s) : tokenizeEn(s);
  }

  function normWord(mode, s) {
    s = String(s == null ? '' : s);
    s = s.replace(/[\uFF01-\uFF5E]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    });
    s = s.replace(/\u3000/g, ' ').trim();
    if (normalizeMode(mode) === 'zh' || hasCjk(s)) {
      return s.replace(PUNCT_STRIP_ZH, '');
    }
    return s.toLowerCase().replace(PUNCT_STRIP_EN, '').trim();
  }

  function stripPrimaryOnImport(mode, primary) {
    primary = String(primary == null ? '' : primary);
    if (normalizeMode(mode) === 'en') {
      return primary
        .replace(CJK_STRIP_RE, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[\s,，、;；:：=]+/, '')
        .replace(/[\s,，、;；:：=]+$/, '')
        .replace(/[（(【\[]+$/, '')
        .replace(/^[“”‘’「」『』]+/, '')
        .replace(/[“”‘’「」『』]+$/, '')
        .trim();
    }
    return primary
      .replace(/\s+/g, ' ')
      .replace(/^[\s,，、;；:：=]+/, '')
      .replace(/[\s,，、;；:：=]+$/, '')
      .replace(/^[“”‘’「」『』]+/, '')
      .replace(/[“”‘’「」『』]+$/, '')
      .trim();
  }

  function bulkSplitPrimaryHint(mode, line) {
    var str = String(line).replace(/\u3000/g, ' ').trim();
    var en = '';
    var zh = '';
    mode = normalizeMode(mode);

    var eq = str.indexOf('=');
    if (eq >= 0) {
      var left = str.slice(0, eq).trim();
      var right = str.slice(eq + 1).trim();
      left = left.replace(/^[\s,，、;；:：]+/, '').replace(/[\s,，、;；:：]+$/, '').trim();
      right = right
        .replace(/^[\s,，、;；:：]+/, '')
        .replace(/^[（(【\[]+/, '')
        .replace(/[）)】\]]+$/, '')
        .trim();
      if (mode === 'zh') {
        if (hasCjk(left) || !hasCjk(right)) {
          en = left;
          zh = right;
        } else {
          en = right;
          zh = left;
        }
      } else if (/[A-Za-z]/.test(left)) {
        en = left;
        zh = right;
      } else {
        en = right;
        zh = left;
      }
      en = stripPrimaryOnImport(mode, en);
      if (mode === 'en') {
        en = en.replace(/。$/, '.').replace(/？$/, '?').replace(/！$/, '!');
      }
      return { en: en, zh: zh };
    }

    var m = str.match(CJK_FIRST_RE);
    if (m) {
      var i = str.indexOf(m[0]);
      if (mode === 'zh' && i === 0) {
        var lat = str.search(/[A-Za-z]/);
        if (lat > 0) {
          en = str.slice(0, lat).trim();
          zh = str.slice(lat).trim();
        } else {
          en = str;
          zh = '';
        }
      } else {
        en = str.slice(0, i);
        zh = str.slice(i);
      }
    } else {
      en = str;
    }

    en = stripPrimaryOnImport(mode, en);
    zh = zh
      .replace(/^[\s,，、;；:：=]+/, '')
      .replace(/^[（(【\[]+/, '')
      .replace(/[）)】\]]+$/, '')
      .trim();
    if (mode === 'en') {
      en = en.replace(/。$/, '.').replace(/？$/, '?').replace(/！$/, '!');
    }
    return { en: en, zh: zh };
  }

  function isPrimaryItem(mode, en) {
    en = String(en || '');
    if (normalizeMode(mode) === 'zh') return hasCjk(en);
    return /[A-Za-z]/.test(en);
  }

  function ttsTl(mode, text) {
    var t = String(text == null ? '' : text).trim();
    if (normalizeMode(mode) === 'en') {
      return { google: 'en-GB', baidu: 'en', native: 'en-US' };
    }
    if (hasCjk(t)) {
      return { google: 'zh-TW', baidu: 'zh', native: 'zh-TW' };
    }
    return { google: 'en-GB', baidu: 'en', native: 'en-US' };
  }

  function modeLabels(mode) {
    if (normalizeMode(mode) === 'zh') {
      return {
        banner: '中文默書 · 主欄寫中文 · 提示欄寫英文 · 支援系統中文輸入法 · 朗讀優先中文語音',
        s3Name: '英文翻譯默書',
        s3Desc: '看英文提示寫中文',
        s3Title: '關卡 3 · 中文翻譯默書',
        s3HintLabel: '請寫出對應的中文句子',
        s3Msg: '看英文，在格子裏寫出每個中文詞／字（標點已幫你寫好）',
        w2Desc: '看英文意思寫中文詞',
        w2HintLabel: '英文意思 — 寫出中文詞',
        w2Msg: '看英文意思，寫出中文詞',
        w2Placeholder: '輸入中文…',
        wrongSentLabel: '錯句（看英文，寫整句中文）',
        zhEmpty: '（未填英文提示）',
        fEn: '中文內容',
        fZh: '英文提示'
      };
    }
    return {
      banner: '英文默書 · 主欄寫英文 · 提示欄寫中文 · 朗讀英式英語',
      s3Name: '中文翻譯默書',
      s3Desc: '看繁體中文，寫出整句英文',
      s3Title: '關卡 3 · 中文翻譯默書',
      s3HintLabel: '請寫出對應的英文句子',
      s3Msg: '看中文，在格子裏寫出每個英文單詞（標點已幫你寫好）',
      w2Desc: '看中文意思，拼出英文單詞',
      w2HintLabel: '中文意思 — 寫出英文單詞',
      w2Msg: '看中文意思，拼出英文單詞',
      w2Placeholder: '輸入英文…',
      wrongSentLabel: '錯句（看中文，寫整句）',
      zhEmpty: '（未填中文意思）',
      fEn: '英文內容',
      fZh: '中文意思'
    };
  }

  function bulkSample(mode) {
    if (normalizeMode(mode) === 'zh') {
      return [
        'sentence:',
        '1. 我最喜歡的地方是圖書館。 = My favourite place is the library.',
        '2. 我們可以爬上樹屋在那裏看書。 = We can climb up to the treehouse and read there.',
        '3. 你夢想中的學校有花園嗎？ = Is there a garden in your dream school?',
        '',
        'word:',
        '1. 禮堂 = hall',
        '2. 遊樂場 = playground',
        '3. 最愛的 = favourite'
      ].join('\n');
    }
    return [
      'sentence:',
      '1. My favourite place is the library. = 我最喜歡的地方是圖書館。',
      '2. We can climb up to the treehouse and read there. = 我們可以爬上樹屋在那裏看書。',
      '3. Is there a garden in your dream school?',
      '',
      'word:',
      '1. hall = 禮堂',
      '2. playground = 遊樂場',
      '3. favourite = 最愛的'
    ].join('\n');
  }

  function bulkPrompt(mode) {
    if (normalizeMode(mode) === 'zh') {
      return [
        '請把圖片中需要默書的內容轉寫成文字。主欄寫繁體中文，提示用英文，格式：中文 = English。',
        '',
        'sentence:',
        '1. 我最喜歡的地方是圖書館。 = My favourite place is the library.',
        '',
        'word:',
        '1. 禮堂 = hall',
        '',
        '要求：',
        '1. 一行只寫一條；',
        '2. 中文在前，英文提示在「=」後面；',
        '3. 不要漏掉內容。'
      ].join('\n');
    }
    return [
      '請把圖片中需要默書的內容轉寫成文字，只輸出英文，不要中文翻譯。',
      '',
      'sentence:',
      '1. My favourite place is the library.',
      '',
      'word:',
      '1. hall',
      '',
      '要求：',
      '1. 一行只寫一條，寫完就換行；',
      '2. 句子保留原文的大小寫和標點，單詞不加句號；',
      '3. 不要漏掉內容，也不要自己加解釋。'
    ].join('\n');
  }

  function seedItems(mode) {
    var enSeed = [
      { type: '句子', en: 'My favourite place is the library.', zh: '我最喜歡的地方是圖書館。', emoji: '📚', order: 1 },
      { type: '句子', en: 'We can climb up to the treehouse and read there.', zh: '我們可以爬上樹屋，在那裏看書。', emoji: '🌳', order: 2 },
      { type: '句子', en: 'Is there a garden in your dream school?', zh: '你的夢想學校裏有花園嗎？', emoji: '🌱', order: 3 },
      { type: '句子', en: 'We can grow fruit and vegetables on the fifth floor.', zh: '我們可以在五樓種水果和蔬菜。', emoji: '🍎', order: 4 },
      { type: '句子', en: 'Yes, there is a canteen on the fourth floor.', zh: '是的，四樓有一個食堂。', emoji: '🍜', order: 5 },
      { type: '句子', en: 'There is a slide to go back down.', zh: '有一條滑梯可以滑下來。', emoji: '🛝', order: 6 },
      { type: '單詞', en: 'hall', zh: '禮堂', emoji: '🏛️', order: 1 },
      { type: '單詞', en: 'playground', zh: '遊樂場', emoji: '🛝', order: 2 },
      { type: '單詞', en: 'classroom', zh: '課室', emoji: '🏫', order: 3 },
      { type: '單詞', en: 'first', zh: '第一', emoji: '1️⃣', order: 4 },
      { type: '單詞', en: 'second', zh: '第二', emoji: '2️⃣', order: 5 },
      { type: '單詞', en: 'third', zh: '第三', emoji: '3️⃣', order: 6 },
      { type: '單詞', en: 'sixth', zh: '第六', emoji: '6️⃣', order: 7 },
      { type: '單詞', en: 'seventh', zh: '第七', emoji: '7️⃣', order: 8 },
      { type: '單詞', en: 'computer', zh: '電腦', emoji: '💻', order: 9 },
      { type: '單詞', en: 'English corner', zh: '英語角', emoji: '🗣️', order: 10 }
    ];
    if (normalizeMode(mode) === 'zh') {
      return enSeed.map(function (s) {
        return { type: s.type, en: s.zh, zh: s.en, emoji: s.emoji, order: s.order };
      });
    }
    return enSeed.map(function (s) {
      return { type: s.type, en: s.en, zh: s.zh, emoji: s.emoji, order: s.order };
    });
  }

  function getStoredLang(storage) {
    storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!storage) return 'zh';
    try {
      var v = storage.getItem(LANG_KEY);
      if (v === 'en' || v === 'zh') return v;
      if (storage.getItem('wb_dictation_zh_items')) return 'zh';
      if (storage.getItem('wb_dictation_items') || storage.getItem('wb_dictation_en_items')) return 'en';
    } catch (e) {}
    return 'zh';
  }

  function setStoredLang(mode, storage) {
    storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    mode = normalizeMode(mode);
    if (!storage) return mode;
    try {
      storage.setItem(LANG_KEY, mode);
    } catch (e) {}
    return mode;
  }

  return {
    LANG_KEY: LANG_KEY,
    PASS_KEY: PASS_KEY,
    hasCjk: hasCjk,
    normalizeMode: normalizeMode,
    lsPrefix: lsPrefix,
    buildLsKeys: buildLsKeys,
    tokenizeEn: tokenizeEn,
    tokenizeZh: tokenizeZh,
    tokenize: tokenize,
    normWord: normWord,
    stripPrimaryOnImport: stripPrimaryOnImport,
    bulkSplitPrimaryHint: bulkSplitPrimaryHint,
    isPrimaryItem: isPrimaryItem,
    ttsTl: ttsTl,
    modeLabels: modeLabels,
    bulkSample: bulkSample,
    bulkPrompt: bulkPrompt,
    seedItems: seedItems,
    getStoredLang: getStoredLang,
    setStoredLang: setStoredLang
  };
});
