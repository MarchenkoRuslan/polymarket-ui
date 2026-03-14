# Agent Instructions

Guide for AI agents working with the **Polymarket UI** project — the frontend dashboard for the [Polymarket ML Trading System](https://github.com/MarchenkoRuslan/polymarket).

## Project Context

This repository contains the **Telegram Mini App** (Web App) dashboard. It is a **frontend-only** project. The backend API, ML pipeline, data collection, and trading logic live in a [separate repository](https://github.com/MarchenkoRuslan/polymarket).

- **Backend repo:** https://github.com/MarchenkoRuslan/polymarket
- **Backend API base URL:** `https://polymarket-predictor.up.railway.app/api/v1`
- **Swagger docs:** https://polymarket-predictor.up.railway.app/docs

## Architecture

```
public/
├── index.html            — SPA entry point
├── manifest.json         — PWA manifest
├── sw.js                 — Service worker (cache-first for shell, stale-while-revalidate for CDN)
├── css/app.css           — All styles (CSS custom properties, mobile-first)
├── icons/                — SVG icons for PWA
└── js/
    ├── app.js            — Entry: nav setup, route registration, Telegram WebApp init
    ├── api.js            — Fetch-based API client with retries + AbortController
    ├── config.js         — API_BASE_URL constant
    ├── router.js         — Hash-based SPA router with scroll-to-top
    ├── theme.js          — Telegram theme / dark mode support
    ├── utils.js          — Sanitization (escapeHtml, escapeAttr, sanitizeUrl, stripHtml),
    │                       formatters, DOM helpers, loading/error states
    ├── charts.js         — Chart.js wrappers with crosshair plugin, tooltips
    └── screens/
        ├── home.js       — Dashboard: status, KPIs, signal summary, top markets, auto-refresh
        ├── markets.js    — Searchable/paginated market list with signals & volume
        ├── marketDetail.js — Price chart, orderbook strip, stats, technicals, signals, P&L
        ├── signals.js    — ML signals: doughnut, distribution, per-market bars, market names
        ├── performance.js — Cumulative P&L, profit by market, spread timeline
        └── news.js       — RSS news cards with HTML-stripped summaries
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vanilla JavaScript** | ES modules, no framework, no build step |
| **Chart.js 4.4.7** | Charts (loaded via CDN) |
| **Telegram Web App SDK** | Mini App integration, theme sync |
| **serve** | Static file server for dev and production |
| **Service Worker** | PWA, offline shell caching |

## Routes and Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `#home` | System status, KPIs, signal summary, top markets |
| Markets | `#markets` | Searchable market cards with price, signal, volume |
| Market Detail | `#market/{id}` | Price chart, trading stats, technicals, signal history, P&L |
| Signals | `#signals` | Buy/Hold/Sell summary, distribution histogram, per-market bars |
| Performance | `#performance` | Cumulative P&L, profit by market, bid-ask spread timeline |
| News | `#news` | RSS news cards with source and timestamp |

## Backend API Endpoints

The UI consumes these endpoints from the backend:

| Endpoint | Purpose |
|----------|---------|
| `/status` | Pipeline status, last run times, errors |
| `/analytics` | Aggregated KPIs (markets, trades, signals, P&L) |
| `/markets` | Paginated market list |
| `/markets/{id}` | Single market with trades, orderbook, features, signals |
| `/trades` | Trades for a market |
| `/orderbook` | Orderbook for a market |
| `/signals` | ML signals (buy/hold/sell) per market |
| `/features` | Technical features (MA, RSI, MACD, etc.) |
| `/news` | RSS news items |
| `/results` | Backtest results (P&L, profit by market) |

API configuration: `public/js/config.js` — `API_BASE_URL`. Can be overridden via `window.__POLYMARKET_CONFIG__.apiBaseUrl` for deployment.

## Code Change Rules

1. **All code, comments, and documentation must be in English.**
2. **No build step** — files are served as-is from `public/`. No TypeScript, no bundler.
3. **ES Modules** — all JS files use `import`/`export`. Entry loaded with `type="module"`.
4. **Hash routing** — routes: `#home`, `#markets`, `#market/{id}`, `#signals`, `#performance`, `#news`.
5. **Screen render pattern** — each screen exports `async function render(container, ...params)`.
6. **HTML escaping** — always use `escapeHtml()` / `escapeAttr()` from `utils.js` for user content. Use `sanitizeUrl()` for href attributes. Use `stripHtml()` to clean HTML from API text fields.
7. **AbortController** — call `getSignalController()` at the start of each screen render; check `err.name === 'AbortError'` in catch.
8. **Chart cleanup** — `destroyAllCharts()` is called automatically on route change via the router.
9. **Mobile-first CSS** — use CSS custom properties for theming (`var(--bg-primary)`, `var(--accent)`). Dark mode: `[data-theme="dark"]`.
10. **Batch DOM updates** — use `DocumentFragment` for lists; avoid per-item `appendChild`.
11. **Telegram integration** — app detects Telegram WebApp SDK and adapts theme, back button, viewport.
12. **CORS** — backend must allow this UI origin via `CORS_ORIGINS` in the backend config.

## Common Tasks

### Add a new screen

1. Create `public/js/screens/myScreen.js` with `export async function render(container, ...params) { ... }`
2. Register in `app.js`: `registerRoute('myscreen', myScreenRender)`
3. Add nav item to `NAV_ITEMS` if it should appear in bottom nav
4. Add to `sw.js` SHELL array for offline caching

### Add a new API endpoint

1. Add method to `api` object in `api.js`
2. Pass `signal` parameter through for AbortController support
3. Follow retry + error handling patterns from existing methods

### Styling

- Use CSS custom properties from `:root` (e.g., `var(--bg-primary)`, `var(--accent)`)
- Dark mode uses `[data-theme="dark"]` attribute
- Telegram theme colors override CSS variables at runtime
- Semantic class names; avoid inline styles for reusable patterns
- Accessibility: `aria-label`, `role`, `focus-visible` patterns

### Change API base URL

Edit `public/js/config.js` or set `window.__POLYMARKET_CONFIG__ = { apiBaseUrl: '...' }` before loading the app.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm start          # production (PORT env or 3000)
npm run lint       # ESLint
npm run lint:fix   # ESLint with auto-fix
```

## Deployment

- **Railway / Vercel / Netlify:** Publish directory `public/`, no build command. Start: `npm start` (Railway).
- **Docker:** `FROM node:20-alpine`, `COPY public ./public`, `CMD ["npm", "start"]`.

## Integration with Backend

When adding UI features that require new API endpoints or data structures:

1. **Backend first** — the API is defined in https://github.com/MarchenkoRuslan/polymarket. Add or change endpoints there.
2. **Update `api.js`** — add corresponding fetch methods in this repo.
3. **Update screens** — consume new data in the relevant screen(s).
4. **CORS** — ensure backend `CORS_ORIGINS` includes the deployed UI origin.

## Limitations

- Static hosting: no server-side rendering; SPA only.
- API must be CORS-enabled for the UI origin.
- Chart.js and Telegram SDK loaded from CDN — require network for first load (service worker caches for offline).
- No TypeScript or compile step — keep code simple and well-commented.

## Documentation

- **README.md** — quick start, architecture, deployment
- **.cursorrules** — project-specific Cursor rules (overlap with this file)
- **Backend AGENTS.md** — https://github.com/MarchenkoRuslan/polymarket/blob/main/AGENTS.md — for backend and pipeline tasks
