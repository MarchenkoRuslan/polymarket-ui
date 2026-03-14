import { api, getSignalController } from '../api.js';
import { signalBadge, truncate, formatDate, showLoading, showEmpty, showError, escapeHtml } from '../utils.js';
import { createBarChart, createDoughnutChart } from '../charts.js';
import { getChartColors } from '../theme.js';
import { navigate } from '../router.js';

export async function render(container) {
    showLoading(container);
    const signal = getSignalController();

    try {
        const [analytics, signalsData, marketsData] = await Promise.all([
            api.getAnalytics(signal),
            api.getSignals(undefined, 500, signal),
            api.getMarkets(200, 0, false, signal).catch(() => ({ items: [] })),
        ]);

        const signals = signalsData.items || [];
        if (signals.length === 0) {
            showEmpty(container, '📡', 'No Signals Yet', 'ML signals will appear after model training');
            return;
        }

        const marketQuestions = {};
        (marketsData.items || []).forEach(m => {
            marketQuestions[m.market_id] = m.question || m.market_id;
        });

        const latestByMarket = {};
        signals.forEach(s => {
            if (!latestByMarket[s.market_id] || s.ts > latestByMarket[s.market_id].ts) {
                latestByMarket[s.market_id] = s;
            }
        });

        const marketSignals = Object.values(latestByMarket);
        const buyCount = marketSignals.filter(s => s.signal_label === 'buy').length;
        const sellCount = marketSignals.filter(s => s.signal_label === 'sell').length;
        const holdCount = marketSignals.filter(s => s.signal_label === 'hold').length;

        const sortedMarkets = marketSignals.sort((a, b) => b.prediction - a.prediction);

        const distribution = analytics.signal_distribution || [];

        const latestTs = signals.length > 0
            ? signals.reduce((max, s) => s.ts > max ? s.ts : max, signals[0].ts)
            : null;

        container.innerHTML = `
            <div class="screen">
                <div class="screen-title">Signals</div>
                <div class="screen-subtitle">ML predictions across ${marketSignals.length} market${marketSignals.length !== 1 ? 's' : ''}${latestTs ? ` · updated ${formatDate(latestTs)}` : ''}</div>

                <div class="signal-summary">
                    <div class="signal-summary-item buy">
                        ${buyCount}<div class="signal-label">Buy</div>
                    </div>
                    <div class="signal-summary-item hold">
                        ${holdCount}<div class="signal-label">Hold</div>
                    </div>
                    <div class="signal-summary-item sell">
                        ${sellCount}<div class="signal-label">Sell</div>
                    </div>
                </div>

                ${(buyCount + sellCount + holdCount) > 0 ? `
                <div class="chart-card">
                    <div class="chart-card-title">Signal Breakdown</div>
                    <div class="chart-container" style="height:180px"><canvas id="signals-donut"></canvas></div>
                </div>` : ''}

                ${sortedMarkets.length > 0 ? `
                <div class="chart-card">
                    <div class="chart-card-title">Prediction by Market</div>
                    <div class="chart-container tall"><canvas id="signals-bar"></canvas></div>
                </div>` : ''}

                ${distribution.length > 0 ? `
                <div class="chart-card">
                    <div class="chart-card-title">Prediction Distribution</div>
                    <div class="chart-container"><canvas id="signals-dist"></canvas></div>
                </div>` : ''}

                <div class="section-header">
                    <span class="section-title">All Signals</span>
                </div>
                <div id="signals-list"></div>
            </div>`;

        const c = getChartColors();

        if ((buyCount + sellCount + holdCount) > 0) {
            const donutCanvas = container.querySelector('#signals-donut');
            if (donutCanvas) {
                createDoughnutChart(donutCanvas, ['Buy', 'Hold', 'Sell'], [buyCount, holdCount, sellCount]);
            }
        }

        if (sortedMarkets.length > 0) {
            const top = sortedMarkets.slice(0, 20);
            const labels = top.map(s => truncate(marketQuestions[s.market_id] || s.market_id, 24));
            const data = top.map(s => s.prediction);
            const colors = top.map(s =>
                s.signal_label === 'buy' ? c.positive : s.signal_label === 'sell' ? c.negative : c.warning
            );
            const canvas = container.querySelector('#signals-bar');
            if (canvas) {
                createBarChart(canvas, labels, [{ label: 'Prediction', data, backgroundColor: colors }], {
                    indexAxis: 'y',
                    scales: {
                        x: {
                            min: 0, max: 1,
                            ticks: { color: c.secondary, font: { size: 10 } },
                            grid: { color: c.grid },
                            border: { display: false },
                        },
                        y: {
                            ticks: { color: c.secondary, font: { size: 10 } },
                            grid: { display: false },
                            border: { display: false },
                        },
                    },
                });
            }
        }

        if (distribution.length > 0) {
            const canvas = container.querySelector('#signals-dist');
            if (canvas) {
                const distLabels = distribution.map(d => d.bucket.toFixed(1));
                const distData = distribution.map(d => d.count);
                const distColors = distribution.map(d =>
                    d.bucket >= 0.55 ? c.positive : d.bucket < 0.35 ? c.negative : c.warning
                );
                createBarChart(canvas, distLabels, [{ label: 'Count', data: distData, backgroundColor: distColors }]);
            }
        }

        const listEl = container.querySelector('#signals-list');
        const fragment = document.createDocumentFragment();
        sortedMarkets.forEach(s => {
            const question = marketQuestions[s.market_id] || s.market_id;
            const card = document.createElement('div');
            card.className = 'market-card';
            card.innerHTML = `
                <div class="market-card-body">
                    <div class="market-card-question">${escapeHtml(truncate(question, 60))}</div>
                    <div class="market-card-meta">
                        <span class="font-mono">${s.prediction.toFixed(3)}</span>
                        <span>${formatDate(s.ts)}</span>
                    </div>
                </div>
                <div class="market-card-right">
                    ${signalBadge(s.signal_label)}
                </div>`;
            card.addEventListener('click', () => navigate(`market/${encodeURIComponent(s.market_id)}`));
            fragment.appendChild(card);
        });
        listEl.appendChild(fragment);
    } catch (err) {
        if (err.name === 'AbortError') return;
        showError(container, err.message);
    }
}
