# assyl.tech — сайт студии + админка

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Three.js / React Three Fiber · GSAP + Lenis · next-intl (RU / KZ / EN) · Drizzle ORM + PostgreSQL

## Быстрый старт (локально)

```bash
npm install
npm run dev
```

- Сайт: http://localhost:3000 (казахский — `/kz`, английский — `/en`)
- Админка: http://localhost:3000/admin

Docker для разработки **не нужен**: если `DATABASE_URL` не задан, поднимается встроенный PostgreSQL (PGlite)
в папке `.data/pglite`. Миграции применяются автоматически.

Первый вход в админку в dev-режиме: `admin@assyl.tech` / `admin12345`
(или значения `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env.local`). В production задайте свои.

> `npm run dev` заметно медленнее (анимации и 3D могут подтормаживать). Чтобы оценить реальную скорость,
> запускайте production-сборку: создайте `.env.local` с `AUTH_SECRET=<длинная случайная строка>`, затем
> `npm run build` и `npm start`.

## Где что менять

| Что | Файл |
|---|---|
| Контакты (Instagram, Telegram, WhatsApp, email, телефон) | `src/lib/site.ts` |
| Портфолио (работы, тексты, видео) | `src/content/projects.ts` + файлы в `public/media/` |
| Тексты сайта на 3 языках | `src/messages/{ru,kz,en}/*.json` |
| Дизайн-токены (цвета, шрифты, эффекты) | `src/app/globals.css`, описание — `docs/DESIGN.md` |
| 3D-сцена со смартфоном и ноутбуком | `src/components/three/showcase-scene.tsx` |
| Частицы-логотип на первом экране | `src/components/three/particle-logo.tsx` |

### Как добавить новую работу

1. Подготовьте видео (без звука, H.264) и постер:
   ```bash
   ffmpeg -i source.mp4 -t 40 -vf "fps=30,scale=1280:-2" -c:v libx264 -crf 29 -preset slow -pix_fmt yuv420p -movflags +faststart -an public/media/my-project.mp4
   ffmpeg -ss 5 -i source.mp4 -frames:v 1 -vf "scale=1280:-2" -q:v 3 public/media/my-project.jpg
   ```
   Для мобильных записей используйте `scale=540:1200`.
2. Добавьте объект в массив `projects` в `src/content/projects.ts`.

## Уведомления в Telegram

1. Создайте бота через [@BotFather](https://t.me/BotFather) → получите токен.
2. Напишите боту любое сообщение (или добавьте его в группу).
3. Откройте `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и найдите `chat.id`.
4. Впишите токен и chat id в админке → **Настройки** (или в `.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) и нажмите «Отправить тест».

## Аналитика

Собственная, без сторонних сервисов и cookie-баннеров: визиты, уникальные посетители, источники (Instagram, Google, Telegram, UTM-метки),
гео, устройства, глубина скролла, просмотр секций, клики по кнопкам, воронка до заявки, «онлайн сейчас».
IP-адреса не хранятся — только солёный хэш.

Для рекламы используйте UTM-ссылки, например: `https://assyl.tech/?utm_source=instagram&utm_medium=bio&utm_campaign=profile`.

## Деплой

### Вариант 1 — свой VPS (Docker Compose)

```bash
cp .env.example .env         # заполните AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ANALYTICS_SALT, NEXT_PUBLIC_SITE_URL
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env
docker compose up -d --build
```

Сайт поднимется на порту 3000 — поставьте перед ним Nginx/Caddy с HTTPS. Пример для Caddy:

```
assyl.tech {
  reverse_proxy localhost:3000
}
```

Если используете Cloudflare или Nginx с GeoIP — страна/город берутся из заголовков; иначе используется встроенная офлайн-база GeoIP.

### Вариант 2 — Vercel + Neon

1. Создайте бесплатную базу на [neon.tech](https://neon.tech), скопируйте connection string.
2. Импортируйте репозиторий в Vercel, добавьте переменные окружения из `.env.example` (`DATABASE_URL` = строка Neon).
3. Deploy. Гео подтягивается из заголовков Vercel автоматически.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` / `npm start` | production-сборка и запуск |
| `npm run lint` | ESLint |
| `npx drizzle-kit generate` | создать миграцию после изменения `src/lib/db/schema.ts` |
