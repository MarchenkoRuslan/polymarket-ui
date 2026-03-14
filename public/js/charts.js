import { getChartColors } from './theme.js';

const active = [];

export function destroyAllCharts() {
    active.forEach(c => c.destroy());
    active.length = 0;
}

const crosshairPlugin = {
    id: 'crosshair',
    afterDraw(chart) {
        if (!chart._active?.length) return;
        const { ctx, chartArea: { top, bottom } } = chart;
        const x = chart._active[0].element.x;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = getChartColors().secondary + '60';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
    },
};

function baseOpts(colors) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: colors.bg,
                titleColor: colors.text,
                bodyColor: colors.secondary,
                borderColor: colors.grid,
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
                titleFont: { weight: '600' },
                displayColors: false,
                caretSize: 6,
            },
        },
        scales: {
            x: {
                ticks: { color: colors.secondary, font: { size: 10 }, maxTicksLimit: 6, maxRotation: 0 },
                grid: { display: false },
                border: { display: false },
            },
            y: {
                ticks: { color: colors.secondary, font: { size: 10 }, maxTicksLimit: 5 },
                grid: { color: colors.grid },
                border: { display: false },
            },
        },
    };
}

export function createLineChart(canvas, labels, datasets, extraOpts = {}) {
    const c = getChartColors();
    const dsets = datasets.map(ds => ({
        borderColor: ds.color || c.accent,
        backgroundColor: (ds.color || c.accent) + '18',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 12,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: ds.color || c.accent,
        pointHoverBorderColor: c.bg,
        pointHoverBorderWidth: 2,
        tension: 0.3,
        fill: ds.fill !== false,
        ...ds,
    }));

    const opts = { ...baseOpts(c), ...extraOpts };

    const chart = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets: dsets },
        options: opts,
        plugins: [crosshairPlugin],
    });
    active.push(chart);
    return chart;
}

export function createBarChart(canvas, labels, datasets, extraOpts = {}) {
    const c = getChartColors();
    const dsets = datasets.map(ds => ({
        backgroundColor: ds.color || c.accent,
        borderRadius: 4,
        maxBarThickness: 32,
        ...ds,
    }));
    const chart = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: dsets },
        options: { ...baseOpts(c), ...extraOpts },
    });
    active.push(chart);
    return chart;
}

export function createDoughnutChart(canvas, labels, data, colors) {
    const c = getChartColors();
    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors || [c.positive, c.warning, c.negative], borderWidth: 0, hoverOffset: 6 }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            animation: { duration: 400 },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: c.text, padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } },
                },
                tooltip: {
                    backgroundColor: c.bg,
                    titleColor: c.text,
                    bodyColor: c.secondary,
                    borderColor: c.grid,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label(ctx) {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0';
                            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                        },
                    },
                },
            },
        },
    });
    active.push(chart);
    return chart;
}
