import { applyTheme } from './theme.js';
import { initRouter, registerRoute, startRouter, navigate } from './router.js';
import { render as homeRender } from './screens/home.js';
import { render as marketsRender } from './screens/markets.js';
import { render as marketDetailRender } from './screens/marketDetail.js';
import { render as signalsRender } from './screens/signals.js';
import { render as performanceRender } from './screens/performance.js';
import { render as newsRender } from './screens/news.js';

const NAV_ITEMS = [
    { id: 'home',        icon: '🏠', label: 'Home' },
    { id: 'markets',     icon: '📊', label: 'Markets' },
    { id: 'signals',     icon: '📡', label: 'Signals' },
    { id: 'performance', icon: '📈', label: 'P&L' },
    { id: 'news',        icon: '📰', label: 'News' },
];

const DETAIL_SCREENS = new Set(['market']);

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();

    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        tg.onEvent('themeChanged', applyTheme);
    }

    const content = document.getElementById('content');
    const navBar = document.getElementById('nav-bar');

    initOfflineBanner();
    renderNav(navBar);

    registerRoute('home', homeRender);
    registerRoute('markets', marketsRender);
    registerRoute('market', marketDetailRender);
    registerRoute('signals', signalsRender);
    registerRoute('performance', performanceRender);
    registerRoute('news', newsRender);

    let _backHandler = null;

    initRouter(content, (screen) => {
        updateNavActive(screen);

        if (tg) {
            if (_backHandler) {
                tg.BackButton.offClick(_backHandler);
                _backHandler = null;
            }

            if (DETAIL_SCREENS.has(screen)) {
                _backHandler = () => {
                    window.history.back();
                    tg.BackButton.hide();
                };
                tg.BackButton.onClick(_backHandler);
                tg.BackButton.show();
            } else {
                tg.BackButton.hide();
            }
        }
    });

    startRouter();
});

function renderNav(navBar) {
    NAV_ITEMS.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        btn.dataset.screen = item.id;
        btn.setAttribute('aria-label', item.label);
        btn.innerHTML = `<span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span>`;
        btn.addEventListener('click', () => navigate(item.id));
        navBar.appendChild(btn);
    });
}

function updateNavActive(screen) {
    const mainScreen = DETAIL_SCREENS.has(screen) ? 'markets' : screen;
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.screen === mainScreen);
    });
}

function initOfflineBanner() {
    const banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.textContent = 'No internet connection';
    document.body.prepend(banner);

    const update = () => banner.classList.toggle('visible', !navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
}
