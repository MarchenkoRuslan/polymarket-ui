# Polymarket UI

Telegram Mini App dashboard для [Polymarket ML Trading System](https://github.com/MarchenkoRuslan/polymarket).

Mobile-first PWA: обзор рынков, ML-сигналы, графики производительности, новости — работает как standalone веб-приложение или как Telegram Mini App.

## Быстрый старт

```bash
npm install
npm run dev        # http://localhost:3000
```

## Архитектура

```
public/
├── index.html              SPA entry point
├── manifest.json           PWA manifest
├── sw.js                   Service Worker (cache-first + stale-while-revalidate)
├── css/app.css             Стили (CSS custom properties, mobile-first)
├── icons/                  SVG-иконки для PWA
└── js/
    ├── app.js              Инициализация: навигация, роуты, Telegram WebApp
    ├── api.js              API-клиент (fetch + retry + AbortController)
    ├── config.js           API_BASE_URL
    ├── router.js           Hash-роутер (#home, #markets, #market/{id})
    ├── theme.js            Темы Telegram / dark mode
    ├── utils.js            DOM-хелперы, форматирование, escapeHtml
    ├── charts.js           Обёртки Chart.js (line, bar, doughnut)
    └── screens/
        ├── home.js         Дашборд: статус, KPI, топ-рынки
        ├── markets.js      Список рынков с поиском и пагинацией
        ├── marketDetail.js Детали рынка: цена, стакан, сигналы, P&L
        ├── signals.js      ML-сигналы: buy/hold/sell, распределение
        ├── performance.js  P&L: кумулятивный график, прибыль по рынкам
        └── news.js         Новости из RSS
```

## Экраны

| Экран | Роут | Описание |
|-------|------|----------|
| Home | `#home` | Статус системы, KPI, сводка сигналов, топ-рынки |
| Markets | `#markets` | Поиск по рынкам, карточки с ценой/сигналом/объёмом |
| Market Detail | `#market/{id}` | График цены, торговая статистика, тех. индикаторы, история сигналов |
| Signals | `#signals` | Buy/Hold/Sell сводка, гистограмма распределения, бары по рынкам |
| Performance | `#performance` | Кумулятивный P&L, прибыль по рынкам, спред |
| News | `#news` | Карточки новостей из RSS |

## Backend API

Бэкенд находится в [отдельном репозитории](https://github.com/MarchenkoRuslan/polymarket).

- **Base URL:** `https://polymarket-predictor.up.railway.app/api/v1`
- **Swagger:** https://polymarket-predictor.up.railway.app/docs
- **Эндпоинты:** `/status`, `/analytics`, `/markets`, `/markets/{id}`, `/trades`, `/orderbook`, `/signals`, `/features`, `/news`, `/results`

### Конфигурация API

Отредактируйте `public/js/config.js`:

```js
export const API_BASE_URL = 'https://your-api-domain.com/api/v1';
```

> Backend должен разрешать CORS для origin UI (настройка `CORS_ORIGINS` в бэкенде).

## Деплой

### Railway

1. Создайте проект из этого репозитория
2. Railway автоматически определит Node.js через `package.json`
3. Start command: `npm start` (автоматически)
4. `PORT` устанавливается Railway автоматически

### Vercel / Netlify

- **Publish directory:** `public/`
- **Build command:** не требуется
- `serve` не нужен на статическом хостинге

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

## Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Установите URL: BotFather → ваш бот → Bot Settings → Menu Button → укажите URL деплоя
3. Приложение автоматически определяет Telegram и адаптирует тему

## Стек технологий

| Технология | Назначение |
|-----------|-----------|
| Vanilla JS (ES modules) | Без фреймворка, без шага сборки |
| Chart.js 4.4.7 | Графики (CDN) |
| Telegram Web App SDK | Интеграция с Telegram |
| `serve` | Dev-сервер и продакшен (Railway) |
| Service Worker | PWA, офлайн-кэширование |

## Ключевые решения

- **Без фреймворка** — минимальный размер бандла, мгновенная загрузка в Telegram
- **Hash-роутинг** — работает без серверной конфигурации, совместим со статическим хостингом
- **AbortController** — отмена запросов при навигации, предотвращение устаревших рендеров
- **Экранирование HTML** — все пользовательские данные проходят через `escapeHtml()` для защиты от XSS
- **Retry с exponential backoff** — устойчивость к сетевым сбоям (до 3 попыток)
- **Адаптивная тема** — автоматическое определение Telegram-темы или системных настроек
- **PWA** — установка на домашний экран, офлайн-доступ к оболочке приложения

## Лицензия

MIT
