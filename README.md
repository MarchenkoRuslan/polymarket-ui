# Polymarket UI

Telegram Mini App dashboard for the [Polymarket ML Trading System](https://github.com/MarchenkoRuslan/polymarket).

Mobile-first PWA: market overview, ML signals, performance charts, news feed — works as a standalone web app or inside Telegram as a Mini App.

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
```

## Architecture

```
public/
├── index.html              SPA entry point
├── manifest.json           PWA manifest
├── sw.js                   Service Worker (cache-first + stale-while-revalidate)
├── css/app.css             Styles (CSS custom properties, mobile-first)
├── icons/                  SVG icons for PWA
└── js/
    ├── app.js              Entry: navigation, route registration, Telegram WebApp init
    ├── api.js              API client (fetch + retry + AbortController)
    ├── config.js           API_BASE_URL constant
    ├── router.js           Hash-based SPA router
    ├── theme.js            Telegram theme / dark mode support
    ├── utils.js            DOM helpers, formatters, escapeHtml, sanitizeUrl
    ├── charts.js           Chart.js wrappers (line, bar, doughnut)
    └── screens/
        ├── home.js         Dashboard: status, KPIs, top markets, signal summary
        ├── markets.js      Searchable/paginated market list
        ├── marketDetail.js Market detail: price chart, stats, technicals, signals, P&L
        ├── signals.js      ML signals: buy/hold/sell distribution, per-market bars
        ├── performance.js  Cumulative P&L, profit by market, spread timeline
        └── news.js         RSS news cards
```

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `#home` | System status, KPIs, signal summary, top markets |
| Markets | `#markets` | Searchable market cards with price, signal, volume |
| Market Detail | `#market/{id}` | Price chart, trading stats, technicals, signal history, P&L |
| Signals | `#signals` | Buy/Hold/Sell summary, distribution histogram, per-market bars |
| Performance | `#performance` | Cumulative P&L, profit by market, bid-ask spread timeline |
| News | `#news` | RSS news cards with source and timestamp |

## Backend API

The backend lives in a [separate repository](https://github.com/MarchenkoRuslan/polymarket).

- **Base URL:** `https://polymarket-predictor.up.railway.app/api/v1`
- **Swagger docs:** https://polymarket-predictor.up.railway.app/docs
- **Endpoints:** `/status`, `/analytics`, `/markets`, `/markets/{id}`, `/trades`, `/orderbook`, `/signals`, `/features`, `/news`, `/results`

### API Configuration

Edit `public/js/config.js` to point to your backend:

```js
export const API_BASE_URL = 'https://your-api-domain.com/api/v1';
```

> The backend must allow CORS for the UI origin (set `CORS_ORIGINS` in the backend config).

## Deployment

### Railway

1. Create a new project from this repo
2. Railway auto-detects Node.js via `package.json`
3. Start command: `npm start` (automatic)
4. `PORT` is set by Railway automatically

### Vercel / Netlify

- **Publish directory:** `public/`
- **Build command:** none required
- `serve` is not needed on static hosting platforms

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

## Telegram Mini App Setup

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Set the Web App URL: BotFather → your bot → Bot Settings → Menu Button → set URL to the deployed app
3. The app auto-detects the Telegram environment and adapts theme colors

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Vanilla JS (ES modules) | No framework, no build step |
| Chart.js 4.4.7 | Charts (CDN) |
| Telegram Web App SDK | Telegram integration |
| `serve` | Dev server and production hosting (Railway) |
| Service Worker | PWA, offline caching |

## Key Design Decisions

- **No framework** — minimal bundle size, instant load inside Telegram
- **Hash routing** — works without server-side configuration, compatible with static hosting
- **AbortController** — cancels in-flight requests on navigation, prevents stale renders
- **HTML escaping** — all user-controlled data passes through `escapeHtml()` to prevent XSS
- **Retry with exponential backoff** — resilience against transient network errors (up to 3 retries)
- **Adaptive theming** — auto-detects Telegram theme or system dark/light mode
- **PWA** — installable to home screen, offline access to the app shell

## License

MIT
