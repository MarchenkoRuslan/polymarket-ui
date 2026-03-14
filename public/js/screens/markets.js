import { api, getSignalController } from '../api.js';
import { formatPrice, formatNumber, signalBadge, truncate, showLoading, showEmpty, showError, escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

const PAGE_SIZE = 20;

let _state = {
    visibleCount: PAGE_SIZE,
    filter: '',
    items: null,
    volume: {},
    price: {},
    signals: {},
};

function _resetState() {
    _state = {
        visibleCount: PAGE_SIZE,
        filter: '',
        items: null,
        volume: {},
        price: {},
        signals: {},
    };
}

export async function render(container) {
    _resetState();

    container.innerHTML = `
        <div class="screen">
            <div class="screen-title">Markets</div>
            <div class="search-bar">
                <span class="search-icon">🔍</span>
                <input class="search-input" id="market-search" type="text" placeholder="Search markets…" autocomplete="off" aria-label="Search markets"/>
            </div>
            <div id="markets-list"></div>
            <div id="markets-more" style="padding:12px 0"></div>
        </div>`;

    const searchInput = container.querySelector('#market-search');
    let debounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            _state.filter = searchInput.value.trim().toLowerCase();
            _state.visibleCount = PAGE_SIZE;
            _renderPage(container);
        }, 300);
    });

    await _fetchAndRender(container);
}

async function _fetchAndRender(container) {
    const listEl = container.querySelector('#markets-list');
    showLoading(listEl);

    const signal = getSignalController();

    try {
        const [marketsData, analyticsData, signalsData] = await Promise.all([
            api.getMarkets(200, 0, false, signal),
            api.getAnalytics(signal).catch(() => null),
            api.getSignals(undefined, 500, signal).catch(() => ({ items: [] })),
        ]);

        _state.signals = {};
        (signalsData.items || []).forEach(s => {
            if (!_state.signals[s.market_id] || s.ts > _state.signals[s.market_id].ts) {
                _state.signals[s.market_id] = s;
            }
        });

        _state.volume = {};
        _state.price = {};
        (analyticsData?.trade_stats || []).forEach(t => {
            _state.volume[t.market_id] = t.total_volume;
            _state.price[t.market_id] = t.avg_price;
        });

        _state.items = (marketsData.items || []).slice();
        _state.items.sort((a, b) => (_state.volume[b.market_id] || 0) - (_state.volume[a.market_id] || 0));

        _renderPage(container);
    } catch (err) {
        if (err.name === 'AbortError') return;
        showError(listEl, err.message);
    }
}

function _getFiltered() {
    if (!_state.items) return [];
    if (!_state.filter) return _state.items;
    return _state.items.filter(m =>
        (m.question || '').toLowerCase().includes(_state.filter) ||
        (m.event || '').toLowerCase().includes(_state.filter) ||
        m.market_id.toLowerCase().includes(_state.filter)
    );
}

function _renderPage(container) {
    const listEl = container.querySelector('#markets-list');
    const moreEl = container.querySelector('#markets-more');
    if (!listEl || !moreEl) return;

    const items = _getFiltered();
    const page = items.slice(0, _state.visibleCount);

    listEl.innerHTML = '';

    if (page.length === 0) {
        showEmpty(listEl, '📊', 'No markets found', _state.filter ? 'Try a different search' : 'Markets will appear after data collection');
        moreEl.innerHTML = '';
        return;
    }

    const fragment = document.createDocumentFragment();
    page.forEach(m => {
        const sig = _state.signals[m.market_id];
        const card = document.createElement('div');
        card.className = 'market-card';
        card.innerHTML = `
            <div class="market-card-body">
                <div class="market-card-question">${escapeHtml(truncate(m.question || m.market_id, 70))}</div>
                <div class="market-card-meta">
                    ${_state.volume[m.market_id] ? `<span>Vol: ${formatNumber(_state.volume[m.market_id])}</span>` : ''}
                    ${sig ? signalBadge(sig.signal_label) : ''}
                    ${m.outcome_settled ? '<span class="badge badge-info">Settled</span>' : ''}
                </div>
            </div>
            <div class="market-card-right">
                ${_state.price[m.market_id] != null ? `<div class="market-card-price">${formatPrice(_state.price[m.market_id])}</div>` : ''}
                <div class="card-chevron">›</div>
            </div>`;
        card.addEventListener('click', () => navigate(`market/${encodeURIComponent(m.market_id)}`));
        fragment.appendChild(card);
    });
    listEl.appendChild(fragment);

    const remaining = items.length - page.length;
    if (remaining > 0) {
        moreEl.innerHTML = `<button class="btn btn-secondary" id="btn-load-more">Load more (${remaining} remaining)</button>`;
        moreEl.querySelector('#btn-load-more').addEventListener('click', () => {
            _state.visibleCount += PAGE_SIZE;
            _renderPage(container);
        });
    } else {
        moreEl.innerHTML = `<div class="text-center text-secondary" style="font-size:13px;padding:8px">${items.length} market${items.length !== 1 ? 's' : ''}</div>`;
    }
}
