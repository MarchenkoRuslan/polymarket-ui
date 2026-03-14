import { api, getSignalController } from '../api.js';
import { formatDate, showLoading, showEmpty, showError, escapeHtml, sanitizeUrl, stripHtml } from '../utils.js';

export async function render(container) {
    showLoading(container);
    const signal = getSignalController();

    try {
        const data = await api.getNews(50, signal);
        const items = data.items || [];

        if (items.length === 0) {
            showEmpty(container, '📰', 'No News Yet', 'News will appear after RSS collection');
            return;
        }

        container.innerHTML = `
            <div class="screen">
                <div class="screen-title">News</div>
                <div class="screen-subtitle">${items.length} article${items.length !== 1 ? 's' : ''} from ${_uniqueSources(items)} source${_uniqueSources(items) !== 1 ? 's' : ''}</div>
                <div id="news-list"></div>
            </div>`;

        const listEl = container.querySelector('#news-list');
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const cleanSummary = stripHtml(item.summary);
            const card = document.createElement('a');
            card.className = 'news-card';
            card.href = sanitizeUrl(item.link);
            card.target = '_blank';
            card.rel = 'noopener';

            card.innerHTML = `
                <div class="news-card-title">${escapeHtml(item.title || 'Untitled')}</div>
                ${cleanSummary ? `<div class="news-card-summary">${escapeHtml(cleanSummary)}</div>` : ''}
                <div class="news-card-footer">
                    <span class="news-card-source">${escapeHtml(item.source || 'Unknown')}</span>
                    <span>${formatDate(item.ts)}</span>
                </div>`;

            fragment.appendChild(card);
        });

        listEl.appendChild(fragment);
    } catch (err) {
        if (err.name === 'AbortError') return;
        showError(container, err.message);
    }
}

function _uniqueSources(items) {
    return new Set(items.map(i => i.source)).size;
}
