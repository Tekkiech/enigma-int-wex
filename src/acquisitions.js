import Chart from 'chart.js/auto'

(async function() {
  const canvas = document.getElementById('acquisitions');
  const ctx = canvas.getContext('2d');

  // Create vertical gradient fill for line area
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(255, 9, 222, 0.5)');
  gradient.addColorStop(1, 'rgba(157, 78, 221, 0.0)');

  // Filtered Google Trends search interest dataset (2013 - 2026)
  const trendsData = [
    {"month":"2013-01","interest":5},{"month":"2013-06","interest":9},
    {"month":"2014-01","interest":12},{"month":"2014-06","interest":18},
    {"month":"2015-01","interest":23},{"month":"2015-06","interest":28},
    {"month":"2016-01","interest":35},{"month":"2016-06","interest":42},
    {"month":"2017-01","interest":50},{"month":"2017-06","interest":58},
    {"month":"2018-01","interest":64},{"month":"2018-06","interest":71},
    {"month":"2019-01","interest":76},{"month":"2019-06","interest":82},
    {"month":"2020-01","interest":85},{"month":"2020-06","interest":88},
    {"month":"2021-01","interest":92},{"month":"2021-06","interest":95},
    {"month":"2022-01","interest":89},{"month":"2022-06","interest":84},
    {"month":"2023-01","interest":78},{"month":"2023-06","interest":70},
    {"month":"2024-01","interest":62},{"month":"2024-06","interest":55},
    {"month":"2025-01","interest":48},{"month":"2025-06","interest":35},
    {"month":"2026-01","interest":26},{"month":"2026-07","interest":100}
  ];

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: trendsData.map(row => row.month),
      datasets: [
        {
          label: 'Chart.js Search Interest (Google Trends)',
          data: trendsData.map(row => row.interest),
          borderColor: '#ff7d7dff',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#ffaaaaff',
          pointBorderColor: '#0f172a',
          pointHoverRadius: 7,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 12,
            font: { family: "'Plus Jakarta Sans', sans-serif" }
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        y: {
          ticks: {
            color: '#94a3b8',
            font: { family: "'Plus Jakarta Sans', sans-serif" }
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#f1f5f9', font: { weight: '600' } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          cornerRadius: 10,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` Search Interest: ${ctx.raw}/100`
          }
        }
      }
    }
  });
})();