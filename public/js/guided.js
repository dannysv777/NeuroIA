const cases = [[0, 0], [0, 1], [1, 0], [1, 1]];
const probes = cases.map(row => row.map(v => v ? .7 : -.7));
const expected = cases.map(([a, b]) => a !== b ? 1 : 0);
const points = probes.map(([x, y], i) => ({ x, y, label: expected[i] }));
const section = document.querySelector('.lab-section');
const free = document.querySelector('.lab-layout');
const modes = document.createElement('div');
modes.className = 'lab-modes';
modes.innerHTML = '<button class="button primary" id="guided-tab" aria-pressed="true">Prueba lógica guiada</button><button class="button secondary" id="free-tab" aria-pressed="false">Explorar con puntos</button>';
const guide = document.createElement('div'); guide.id = 'guided';
guide.innerHTML = `
  <div class="guide-intro"><h2>Dos interruptores y una lámpara</h2><p><strong>La lámpara se enciende si los interruptores están en posiciones distintas.</strong> La red aprende esta regla a partir de cuatro ejemplos. Cambia los interruptores para comparar su predicción con la respuesta correcta.</p></div>
  <div class="guide-inputs panel"><div><h3>1. Elige qué caso quieres observar</h3><p>Cambia los interruptores, incluso durante el entrenamiento.</p></div><label>Interruptor 1<select id="switch-a"><option value="0">Abajo · 0</option><option value="1">Arriba · 1</option></select></label><label>Interruptor 2<select id="switch-b"><option value="0">Abajo · 0</option><option value="1" selected>Arriba · 1</option></select></label></div>
  <section class="panel live-lesson" id="live-lesson" aria-label="Entrenamiento visual de la lámpara">
    <div class="lesson-toolbar"><div><h3>2. Observa cómo cambia su respuesta</h3><span id="guide-state" role="status">Lista para aprender · todavía no hay un modelo</span></div><div class="lesson-actions"><label class="speed-label">Ritmo<select id="guide-speed"><option value="60">Visible · 12 s aprox.</option><option value="200">Paso lento · 40 s aprox.</option><option value="0">Rápido</option></select></label><button id="guide-train" class="button primary">▶ Enseñar a la IA</button><button id="guide-stop" class="button secondary" disabled>Detener</button><button id="guide-reset" class="button secondary">Reiniciar</button></div></div>
    <div class="lesson-visual"><div class="expected-result"><span>LA REGLA DICE</span><div id="expected-lamp" class="lamp on">☀</div><strong id="expected-answer">Encendida</strong><p id="case-explanation">0 y 1 son distintos.</p></div><div class="live-network"><svg id="guide-network" viewBox="0 0 460 220" role="img" aria-label="Activaciones de la red para los interruptores elegidos"></svg><div class="network-labels"><span>Entradas</span><span>8 neuronas que aprenden</span><span>P(encendida)</span></div><p>Brillo = magnitud de la activación. Cian: positiva; violeta: negativa. Grosor de conexión = magnitud del peso. Pasa el cursor para ver valores.</p></div><div class="model-result"><span>LA IA RESPONDE</span><div id="model-lamp" class="lamp">?</div><strong id="model-answer">Sin entrenar</strong><div class="probability-track"><div id="probability-fill"></div></div><p id="guide-probability">Pulsa «Enseñar a la IA».</p><span id="guide-match">Aún no hay predicción</span></div></div>
    <div class="lesson-progress"><span id="guide-epoch">Época 0 / 200</span><progress id="guide-progress" max="200" value="0"></progress><span id="guide-score">Aciertos: — / 4</span><span id="guide-loss">Error: —</span></div>
    <p class="lesson-caption" id="guide-caption" role="status">Al empezar verás la respuesta inicial de la red, antes de aprender. Después compara cómo cambia.</p>
  </section>
  <div class="guide-details"><section class="panel"><h3>3. Comprueba los cuatro ejemplos</h3><p>La misma red aprende todos a la vez. Toca una fila para observarla.</p><div id="truth-table"></div><p class="hint">Son los cuatro casos de entrenamiento, no una evaluación con datos nuevos.</p></section><section class="panel"><h3>La respuesta a tu caso, época a época</h3><div class="chart-wrap"><canvas id="guide-chart" aria-label="Probabilidad real de lámpara encendida y respuesta esperada"></canvas></div><p class="hint">La línea cian es la predicción; la punteada es la respuesta esperada. Puede retroceder o equivocarse durante el aprendizaje.</p></section></div>
  <p class="guide-explanation"><strong>¿Y los puntos?</strong> Un punto es un ejemplo: su posición horizontal representa la primera entrada, la vertical la segunda y su color la respuesta correcta. Aquí sustituimos esos puntos abstractos por interruptores y una lámpara. Esta regla se llama <strong>XOR</strong>.</p>`;
free.before(modes, guide); free.hidden = true;
const explanation = document.createElement('p'); explanation.className = 'guide-explanation';
explanation.textContent = 'Cada punto es un ejemplo que tú enseñas: X e Y son dos características numéricas y su color es la categoría correcta (A o B). No representan objetos concretos en este modo libre. El fondo aparece al entrenar y muestra qué categoría predice la red para cada posición. Las gráficas y métricas están debajo del plano.';
free.prepend(explanation);
const $ = id => document.getElementById(id);
let worker, trace, history = [], busy = false, stopped = false, index = 1, epoch = 0;
let chart;
try { chart = new Chart($('guide-chart'), { type: 'line', data: { labels: [], datasets: [
  { label: 'P(encendida) %', data: [], borderColor: '#58dbed', borderWidth: 2, pointRadius: 0 },
  { label: 'Respuesta esperada', data: [], borderColor: '#c8b2f4', borderDash: [5, 5], borderWidth: 1, pointRadius: 0 }
] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { min: 0, max: 100, ticks: { color: '#999fb4' } }, x: { ticks: { maxTicksLimit: 6, color: '#999fb4' }, title: { display: true, text: 'Época (0 = antes de entrenar)', color: '#999fb4' } } }, plugins: { legend: { labels: { color: '#bbb5ce', boxWidth: 12 } } } } }); } catch { $('guide-train').disabled = true; $('guide-state').textContent = 'No se cargaron las gráficas. Recarga con el servidor activo.'; }
function network() {
  const svg = $('guide-network'); svg.replaceChildren();
  const layers = [[40, [75, 145]], [230, Array.from({ length: 8 }, (_, i) => 20 + i * 26)], [420, [110]]];
  const values = [probes[index], trace?.hidden[index], trace ? [trace.probabilities[index]] : null];
  function add(tag, attributes, title) { const el = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value)); if (title) { const t = document.createElementNS(svg.namespaceURI, 'title'); t.textContent = title; el.append(t); } svg.append(el); return el; }
  layers.slice(0, 2).forEach(([x, ys], layer) => ys.forEach((y, a) => layers[layer + 1][1].forEach((endY, b) => {
    const weight = trace?.weights[layer][a][b];
    add('line', { x1: x, y1: y, x2: layers[layer+1][0], y2: endY, stroke: weight >= 0 ? '#58dbed' : '#ac83f8', 'stroke-opacity': weight === undefined ? .12 : .45, 'stroke-width': weight === undefined ? .7 : .5 + Math.min(Math.abs(weight), 4) }, weight === undefined ? 'Todavía sin pesos' : `Peso: ${weight.toFixed(3)}`);
  })));
  layers.forEach(([x, ys], layer) => ys.forEach((y, i) => {
    const value = values[layer]?.[i];
    add('circle', { cx: x, cy: y, r: layer === 1 ? 9 : 17, fill: value === undefined ? '#252435' : value >= 0 ? '#58dbed' : '#ac83f8', 'fill-opacity': value === undefined ? 1 : .15 + .85 * Math.abs(value), stroke: '#d6d0e8', 'stroke-opacity': .4 }, value === undefined ? 'Todavía sin activación' : `Activación: ${value.toFixed(3)}`);
    if (layer !== 1) { const text = add('text', { x, y: y + 4, 'text-anchor': 'middle', fill: '#fff', 'font-size': 11 }); text.textContent = layer === 0 ? cases[index][i] : value === undefined ? '?' : value.toFixed(2); }
  }));
}
function render() {
  const target = expected[index], p = trace?.probabilities[index];
  $('expected-answer').textContent = target ? 'Encendida' : 'Apagada'; $('expected-lamp').classList.toggle('on', !!target);
  $('case-explanation').textContent = `${cases[index].join(' y ')} son ${target ? 'distintos' : 'iguales'}.`;
  $('model-answer').textContent = p === undefined ? 'Sin entrenar' : p >= .5 ? 'Encendida' : 'Apagada';
  $('model-lamp').textContent = p === undefined ? '?' : '☀'; $('model-lamp').classList.toggle('on', p >= .5);
  $('guide-probability').textContent = p === undefined ? 'Pulsa «Enseñar a la IA».' : `${(p*100).toFixed(1)}% de probabilidad de encenderse`;
  $('probability-fill').style.width = `${(p ?? 0)*100}%`;
  $('guide-match').textContent = p === undefined ? 'Aún no hay predicción' : Number(p >= .5) === target ? '✓ Coincide con la regla' : '× Todavía se equivoca en este caso';
  $('truth-table').replaceChildren();
  cases.forEach((row, i) => { const button = document.createElement('button'); button.className = 'truth-row' + (i === index ? ' active' : ''); button.setAttribute('aria-pressed', String(i === index)); const probability = trace?.probabilities[i]; button.textContent = `${row[0]} + ${row[1]} → ${expected[i] ? 'Encendida' : 'Apagada'}   |   IA: ${probability === undefined ? '—' : (probability*100).toFixed(1)+'% encendida'}`; button.onclick = () => { $('switch-a').value = row[0]; $('switch-b').value = row[1]; index = i; render(); }; $('truth-table').append(button); });
  if (chart) { chart.data.labels = history.map(h => h.epoch); chart.data.datasets[0].data = history.map(h => h.probabilities[index]*100); chart.data.datasets[1].data = history.map(() => target*100); chart.update(); }
  network();
}
function controls() { $('guide-train').disabled = busy || !chart; $('guide-stop').disabled = !busy || stopped; $('guide-speed').disabled = busy; }
function reset() { worker?.terminate(); worker = null; busy = false; stopped = false; trace = null; history = []; epoch = 0; $('guide-progress').value = 0; $('guide-epoch').textContent = 'Época 0 / 200'; $('guide-loss').textContent = 'Error: —'; $('guide-score').textContent = 'Aciertos: — / 4'; $('guide-state').textContent = 'Lista para aprender · todavía no hay un modelo'; $('guide-caption').textContent = 'Compara la respuesta antes y después de aprender. Los interruptores seleccionan un caso; no cambian los ejemplos.'; controls(); render(); }
for (const id of ['switch-a', 'switch-b']) $(id).onchange = () => { index = Number($('switch-a').value)*2 + Number($('switch-b').value); render(); };
$('guide-reset').onclick = reset;
$('guide-stop').onclick = () => { stopped = true; worker?.postMessage({ type: 'stop' }); controls(); $('guide-state').textContent = 'Deteniendo…'; };
$('guide-train').onclick = () => {
  reset(); busy = true; controls(); $('guide-state').textContent = 'Preparando el modelo…';
  $('live-lesson').scrollIntoView({ behavior: 'instant', block: 'start' });
  function fail(text) { worker?.terminate(); busy = false; controls(); $('guide-state').textContent = 'No se pudo completar el entrenamiento'; $('guide-caption').textContent = text; }
  try { worker = new Worker('/js/worker.js'); } catch(error) { fail(error.message); return; }
  worker.onerror = () => fail('No se pudo cargar TensorFlow.js. Comprueba que el servidor local siga activo y recarga.');
  worker.onmessage = ({ data }) => {
    if (data.type === 'error') { fail(data.message); return; }
    if (data.trace) {
      trace = data.trace; epoch = data.epoch ?? 0;
      history.push({ epoch, probabilities: trace.probabilities });
      $('guide-epoch').textContent = `Época ${epoch} / 200`; $('guide-progress').value = epoch;
      $('guide-score').textContent = `Aciertos: ${trace.probabilities.filter((p, i) => Number(p >= .5) === expected[i]).length} / 4`;
      $('guide-loss').textContent = data.loss === undefined ? 'Error: aún sin medir' : `Error: ${data.loss.toFixed(4)}`;
      $('guide-state').textContent = epoch ? 'Aprendiendo · ajustando conexiones' : 'Respuesta inicial · aún sin aprender';
      $('guide-caption').textContent = epoch ? 'La red predice, compara con la regla y ajusta sus pesos. Cambia los interruptores para seguir otro caso.' : 'Estos son los pesos iniciales. Una respuesta correcta aquí puede ser casualidad.';
      render();
    }
    if (data.type === 'done') { busy = false; controls(); $('guide-state').textContent = stopped ? `Detenido en la época ${epoch}` : 'Entrenamiento terminado'; $('guide-caption').textContent = 'Prueba las cuatro combinaciones. El modelo aprende de ejemplos; no comprende una lámpara física. La probabilidad no es una garantía.'; }
  };
  worker.postMessage({ type: 'train', points, probes, delay: Number($('guide-speed').value), config: { neurons: 8, rate: .03, epochs: 200, seed: 42 } });
};
function setMode(guided) {
  guide.hidden = !guided; free.hidden = guided;
  // No dejar entrenamientos ocultos al cambiar de laboratorio.
  if (!guided && busy) $('guide-stop').click();
  if (guided && !$('stop').disabled) $('stop').click();
  $('guided-tab').setAttribute('aria-pressed', String(guided)); $('free-tab').setAttribute('aria-pressed', String(!guided));
  $('guided-tab').className = `button ${guided ? 'primary' : 'secondary'}`; $('free-tab').className = `button ${guided ? 'secondary' : 'primary'}`;
  $('phase').hidden = guided;
}
$('guided-tab').onclick = () => setMode(true); $('free-tab').onclick = () => setMode(false);
setMode(true); render();
window.addEventListener('pagehide', () => worker?.terminate());
