import { api, getSignalController } from '../api.js';
import { formatDate, showLoading, showEmpty, showError, escapeHtml, sanitizeUrl } from '../utils.js';

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
                <div class="screen-subtitle">${items.length} article${items.length !== 1 ? 's' : ''}</div>
                <div id="news-list"></div>
            </div>`;

        const listEl = container.querySelector('#news-list');

        items.forEach(item => {
            const card = document.createElement('a');
            card.className = 'news-card';
            card.href = sanitizeUrl(item.link);
            card.target = '_blank';
            card.rel = 'noopener';

            card.innerHTML = `
                <div class="news-card-title">${escapeHtml(item.title || 'Untitled')}</div>
                ${item.summary ? `<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(item.summary)}</div>` : ''}
                <div class="news-card-footer">
                    <span class="news-card-source">${escapeHtml(item.source || 'Unknown')}</span>
                    <span>${formatDate(item.ts)}</span>
                </div>`;

            listEl.appendChild(card);
        });
    } catch (err) {
        if (err.name === 'AbortError') return;
        showError(container, err.message);
    }
}

