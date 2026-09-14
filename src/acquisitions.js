import Chart from 'chart.js/auto'

(async function() {
  const data = [
    { year: 2010, count: 10 },
    { year: 2011, count: 20 },
    { year: 2012, count: 15 },
    { year: 2013, count: 25 },
    { year: 2014, count: 22 },
    { year: 2015, count: 30 },
    { year: 2016, count: 28 },
  ];

  new Chart(
    document.getElementById('acquisitions'),
    {
      type: 'line',
      data: {
        labels: data.map(row => row.year),
        datasets: [
          {
            label: 'Acquisitions by year',
            data: data.map(row => row.count),
            backgroundColor: "#ffffffff",
            borderColor: "#ff99AF"
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color: '#ffffff' // Legend text colour
            }
          }
        },
        scales: {
          x: {
            border: {
              color: '#ffffff' // X-axis main border line colour
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.2)' // X-axis gridlines colour
            },
            ticks: {
              color: '#ffffff' // X-axis numbers/labels colour
            }
          },
          y: {
            border: {
              color: '#ffffff' // Y-axis main border line colour
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.2)' // Y-axis gridlines colour
            },
            ticks: {
              color: '#ffffff' // Y-axis numbers/labels colour
            }
          }
        }
      }
    }
  );
})();