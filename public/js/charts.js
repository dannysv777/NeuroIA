export function createChart(canvas) {
  return new Chart(canvas, { type: 'line', data: { labels: [], datasets: [
    { label: 'Pérdida', data: [], borderColor: '#ac83f8', borderWidth: 2, pointRadius: 0, yAxisID: 'y' },
    { label: 'Precisión %', data: [], borderColor: '#58dbed', borderWidth: 2, pointRadius: 0, yAxisID: 'accuracy' }
  ] }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { color: '#9c9eb1', boxWidth: 12, boxHeight: 2, font: { size: 9 } } } }, scales: {
    x: { grid: { display: false }, ticks: { color: '#71788e', maxTicksLimit: 5, font: { size: 9 } }, title: { display: true, text: 'Época', color: '#71788e', font: { size: 9 } } },
    y: { min: 0, grid: { color: '#242634' }, ticks: { color: '#a18abe', maxTicksLimit: 4, font: { size: 9 } } },
    accuracy: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { color: '#63adb9', stepSize: 50, font: { size: 9 } } }
  } } });
}
