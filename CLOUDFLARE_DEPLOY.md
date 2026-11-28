# NOVA AI — Деплой на Cloudflare Workers / Cloudflare Deploy Guide

## Почему возникала ошибка «Фреймворк: Водород» (Hydrogen)
Без файлов `wrangler.jsonc` и `worker.ts` автодетектор Cloudflare ошибочно определял проект (Vite + React) как **Hydrogen (Водород)**, пытался запустить `npx remix vite:build` с папкой `dist/client` и падал с ошибкой:
`Обнаруженная структура ("Водород") не может быть автоматически сконфигурирована`.

Теперь в проект добавлены:
- **`wrangler.jsonc`** — явная конфигурация **Cloudflare Workers + Static Assets** (`main: "worker.ts"`, `build.command: "npm run build:cf"`, `assets.directory: "./dist"`).
- **`worker.ts`** — серверный Worker для Cloudflare (Web Crypto подпись сессий + Gemini REST API `/api/chat/turn`, `/api/tts`, `/api/session`, `/api/health`, `/api/settings` + раздача `./dist` через `env.ASSETS` с `run_worker_first`).
- **`dist/.assetsignore`** — автоматически генерируется при сборке и исключает тяжелые архивы (`bundle/`, `singlefile/`, `assets/aistudio/Screenrecording_*`), чтобы все 72 видео (`public/videos/*.mp4`, макс. 4 MB каждое) загрузились в Cloudflare без превышения лимита 25 MiB на файл.

---

## Пошаговый деплой через CLI (Wrangler)

1. Распакуйте `nova-ai-code.zip` и положите все 72 видео из `nova-ai-videos.zip` в папку `public/videos/`.
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Авторизуйтесь в Cloudflare (если еще не авторизованы):
   ```bash
   npx wrangler login
   ```
4. Соберите фронтенд:
   ```bash
   npm run build:cf
   ```
5. Добавьте секретный ключ Gemini API в Cloudflare Workers:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```
   *(Опционально для Telegram Mini App: `npx wrangler secret put TELEGRAM_BOT_TOKEN` и `npx wrangler secret put SESSION_SECRET`)*
6. Задеплойте Worker и статику (`./dist` + все 72 `.mp4` видео):
   ```bash
   npx wrangler deploy
   ```

---

## Если деплоите через Cloudflare Dashboard (Git)
В настройках **Build & Deploy** выберите:
- **Framework preset**: `None` (отключить автоопределение, не Hydrogen)
- **Build command**: `npm run build:cf`
- **Deploy command**: `npx wrangler deploy`
- **Variables and Secrets**: добавьте Secret `GEMINI_API_KEY`
