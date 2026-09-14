import Chart from 'chart.js/auto';

(async function() {
  const canvas = document.getElementById('acquisitions');
  const ctx = canvas.getContext('2d');

  // Gradient fills for both series
  const gradientChartJS = ctx.createLinearGradient(0, 0, 0, 400);
  gradientChartJS.addColorStop(0, 'rgba(255, 125, 125, 0.4)');
  gradientChartJS.addColorStop(1, 'rgba(255, 125, 125, 0.0)');

  const gradientChartGeneral = ctx.createLinearGradient(0, 0, 0, 400);
  gradientChartGeneral.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  gradientChartGeneral.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  // Shared monthly timeframe data
  const trendsData = [
    { month: '2013-01', chartJs: 5, chartGeneral: 35 },
    { month: '2015-01', chartJs: 23, chartGeneral: 38 },
    { month: '2017-01', chartJs: 50, chartGeneral: 42 },
    { month: '2019-01', chartJs: 76, chartGeneral: 48 },
    { month: '2021-01', chartJs: 92, chartGeneral: 55 },
    { month: '2023-01', chartJs: 78, chartGeneral: 62 },
    { month: '2025-01', chartJs: 48, chartGeneral: 70 },
    { month: '2026-07', chartJs: 100, chartGeneral: 85 }
  ];

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: trendsData.map(row => row.month),
      datasets: [
        {
          label: 'Chart.js',
          data: trendsData.map(row => row.chartJs),
          borderColor: '#ff7d7d',
          backgroundColor: gradientChartJS,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 7
        },
        {
          label: 'Chart (General)',
          data: trendsData.map(row => row.chartGeneral),
          borderColor: '#38bdf8',
          backgroundColor: gradientChartGeneral,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 7
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
          ticks: { color: '#94a3b8', font: { family: "'Plus Jakarta Sans', sans-serif" } },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        y: {
          ticks: { color: '#94a3b8', font: { family: "'Plus Jakarta Sans', sans-serif" } },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#f1f5f9', usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          cornerRadius: 10,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}/100 interest`
          }
        }
      }
    }
  });
})();