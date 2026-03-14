import { API_BASE_URL } from './config.js';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

let _activeController = null;

export function abortPendingRequests() {
    if (_activeController) {
        _activeController.abort();
        _activeController = null;
    }
}

export function getSignalController() {
    abortPendingRequests();
    _activeController = new AbortController();
    return _activeController.signal;
}

async function request(path, params = {}, signal) {
    const url = new URL(API_BASE_URL + path);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(url.toString(), { signal });
            if (res.ok) return res.json();
            if (res.status >= 400 && res.status < 500) {
                throw new Error(`API ${res.status}: ${res.statusText}`);
            }
            lastError = new Error(`API ${res.status}: ${res.statusText}`);
        } catch (err) {
            if (err.name === 'AbortError') throw err;
            lastError = err;
            if (err.message.startsWith('API 4')) throw err;
        }
        if (attempt < MAX_RETRIES) {
            await sleep(BASE_DELAY * Math.pow(2, attempt));
        }
    }
    throw lastError;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export const api = {
    getStatus(signal)                          { return request('/status', {}, signal); },
    getAnalytics(signal)                       { return request('/analytics', {}, signal); },
    getMarkets(limit = 100, offset = 0, withSignals = false, signal) {
        return request('/markets', { limit, offset, with_signals: withSignals || undefined }, signal);
    },
    getMarket(id, signal)                      { return request(`/markets/${encodeURIComponent(id)}`, {}, signal); },
    getTrades(marketId, limit = 100, signal)    { return request('/trades', { market_id: marketId, limit }, signal); },
    getOrderbook(marketId, limit = 100, signal) { return request('/orderbook', { market_id: marketId, limit }, signal); },
    getSignals(marketId, limit = 100, signal)   { return request('/signals', { market_id: marketId, limit }, signal); },
    getFeatures(marketId, limit = 500, signal)  { return request('/features', { market_id: marketId, limit }, signal); },
    getNews(limit = 30, signal)                 { return request('/news', { limit }, signal); },
    getResults(marketId, limit = 200, signal)   { return request('/results', { market_id: marketId, limit }, signal); },
};
