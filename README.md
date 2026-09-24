# 默書小達人（中英雙語）

Kids dictation SPA with **English** and **Chinese** answer modes (toggle). Fork of https://dictation-kids.app.workbuddy.host/

## Modes
- **英文默書** — answer in English; hint in Chinese; CJK stripped from primary on import (original behavior).
- **中文默書** — answer in Chinese; hint in English; CJK kept; IME-friendly inputs; Chinese TTS.

Switching language reloads the app. Item banks use separate keys (`wb_dictation_en_*` / `wb_dictation_zh_*`) so one mode never wipes the other.

## Import formats (both accepted)
```
English = 中文
中文 = English
```

## Local
Open `index.html` or `npx serve .`

## Tests
Tests live under `test/` in the repo.
```
node test/ba-acceptance.test.js
node test/smoke-html.test.js
```

## Files
- `index.html` — UI + practice modes (slim: loads `core.js` + lang stub + `app.js`)
- `core.js` — pure bilingual helpers (DictCore)
- `app.js` — application logic
