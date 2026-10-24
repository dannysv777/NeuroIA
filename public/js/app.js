import { dataset, validate } from './dataset.js';
import { Plane } from './canvas.js';
import { createChart } from './charts.js';
import { classificationSummary } from './results.js';
import { describePoint, installPointHelp } from './point-help.js';
const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
for (let i = 0; i < 30; i++) {
  const line = document.createElementNS(svgNS, 'path'); let d = '';
  for (let x = 0; x <= 1400; x += 8) { const y = 330 + Math.sin(x / 150 + i * .065) * (100 + i * 2.5) + Math.cos(x / 330) * 70 + i * 2; d += `${x ? 'L' : 'M'}${x},${y} `; }
  line.setAttribute('d', d); line.setAttribute('stroke', 'url(#wave-color)'); line.setAttribute('stroke-width', '.8'); line.setAttribute('fill', 'none'); line.setAttribute('opacity', '.48'); $('wave-lines').append(line);
}
let points = dataset(), mode = 'inspect', worker, training = false, trained = false, stopped = false, chart, exampleIndex = -1;
const plane = new Plane($('plane'), onPoint);
installPointHelp(() => {
  if (!points.length) { $('point-detail').textContent = 'No hay ejemplos. Carga un conjunto o añade piezas de los tipos A y B.'; return; }
  exampleIndex = (exampleIndex + 1) % points.length;
  showExample(points[exampleIndex]);
});
$('tool-hint').textContent = 'Toca un punto para ver sus datos. Esta herramienta no añade ni borra ejemplos.';
function showExample(point) {
  plane.selection = point; plane.draw();
  $('point-detail').textContent = `${describePoint(point)}. Tipo ${point.label ? 'B (violeta)' : 'A (cian)'}, indicado en el ejemplo; no es una predicción.`;
}
const resultSummary = document.createElement('p');
resultSummary.id = 'result-summary'; resultSummary.className = 'result-summary'; resultSummary.hidden = true; resultSummary.setAttribute('role', 'status');
document.querySelector('.metrics').before(resultSummary);
const config = () => ({ neurons: Number($('neurons').value), rate: Number($('rate').value), epochs: Number($('epochs').value), seed: Number($('seed').value) });
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
function render() { plane.points = points; plane.draw(); $('point-count').textContent = points.length; $('count-a').textContent = points.filter(p => p.label === 0).length; $('count-b').textContent = points.filter(p => p.label === 1).length; }
function controls() {
  for (const id of ['load', 'preset', 'clear', 'neurons', 'rate', 'epochs', 'seed', 'train']) $(id).disabled = training;
  document.querySelectorAll('[data-mode]').forEach(b => b.disabled = training);
  $('stop').disabled = !training || stopped;
}
function reset() {
  resultSummary.hidden = true; resultSummary.textContent = '';
  worker?.terminate(); worker = null; training = false; trained = false; stopped = false;
  plane.field = null; plane.probe = null;
  plane.selection = null; exampleIndex = -1;
  $('point-detail').textContent = 'Selecciona «Ver ejemplo» y toca un punto, o usa el botón para recorrer los ejemplos.';
  if (chart) { chart.data.labels = []; chart.data.datasets.forEach(d => d.data = []); chart.update(); }
  $('loss').textContent = '—'; $('accuracy').textContent = '—'; $('epoch').textContent = `0 / ${$('epochs').value}`;
  $('epoch-note').textContent = 'Esperando entrenamiento'; $('phase').textContent = 'Listo para explorar';
  $('prediction').textContent = '◎ Después de entrenar, elige «Probar» y toca el plano.';
  controls(); render();
}
function onPoint(p) {
  if (mode === 'inspect') {
    const nearest = points.reduce((best, point) => {
      const distance = Math.hypot(point.x-p.x, point.y-p.y);
      return distance < best.distance ? { point, distance } : best;
    }, { point: null, distance: .12 });
    if (nearest.point) showExample(nearest.point);
    else $('point-detail').textContent = 'Toca cerca de un punto coloreado o pulsa «Ver un ejemplo».';
    return;
  }
  if (training) return;
  if (mode === 'test') {
    if (!trained) { message('Entrena primero el modelo para probar sus predicciones.'); return; }
    plane.probe = p; plane.selection = null; plane.draw(); $('point-detail').textContent = `${describePoint(p)}. Pieza de prueba: su tipo no se entrega a la IA ni se añade al entrenamiento.`; worker.postMessage({ type: 'predict', ...p }); return;
  }
  if (mode === 'erase') {
    let index = -1, closest = .09;
    points.forEach((q, i) => { const distance = Math.hypot(p.x - q.x, p.y - q.y); if (distance < closest) { closest = distance; index = i; } });
    if (index < 0) return;
    points.splice(index, 1);
  } else {
    if (points.length >= 500) { message('El límite es de 500 ejemplos para mantener el experimento ligero.', true); return; }
    points.push({ ...p, label: Number(mode) });
  }
  reset(); message('Datos actualizados. Entrena la red con estos ejemplos.');
}
function network() {
  const count = Number($('neurons').value), visible = Math.min(count, 8); $('network').replaceChildren();
  const layers = [[45, [65, 110]], [140, Array.from({ length: visible }, (_, i) => 18 + i * 134 / (visible - 1))], [235, [85]]];
  const add = (tag, attrs) => { const el = document.createElementNS(svgNS, tag); Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v)); $('network').append(el); };
  layers.slice(0, 2).forEach(([x, ys], l) => ys.forEach(y => layers[l + 1][1].forEach(y2 => add('line', { x1: x, y1: y, x2: layers[l + 1][0], y2, stroke: '#8973bb', 'stroke-opacity': '.24' }))));
  layers.forEach(([x, ys], l) => ys.forEach(y => add('circle', { cx: x, cy: y, r: l === 1 ? 5 : 9, fill: '#211e32', stroke: l === 0 ? '#58dbed' : '#ac83f8', 'stroke-width': '1.5' })));
  $('hidden-label').textContent = `${count} ocultas${count > 8 ? ' (8 visibles)' : ''}`;
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  $('tool-hint').textContent = mode === 'inspect' ? 'Toca un punto para ver sus datos, sin modificarlo.' : mode === 'erase' ? 'Toca un punto para eliminar ese ejemplo.' : mode === 'test' ? 'Toca una posición: la IA predecirá el tipo de esa pieza, sin añadirla a los ejemplos.' : `Toca el plano: su posición define tamaño y peso. Le enseñarás a la IA que esa pieza es de tipo ${mode === '0' ? 'A' : 'B'}.`;
}));
$('load').onclick = () => { const seed = config().seed; if (!Number.isInteger(seed) || seed < 0 || seed > 999999) { message('La semilla debe ser un entero entre 0 y 999999.', true); return; } points = $('preset').value === 'empty' ? [] : dataset($('preset').value, seed); reset(); message('Ejemplos cargados. Puedes editarlos o iniciar el entrenamiento.'); };
$('clear').onclick = () => { points = []; reset(); message('Plano vacío. Agrega al menos dos puntos de cada categoría.'); };
$('reset').onclick = () => { reset(); message('Modelo reiniciado. Tus ejemplos se conservan.'); };
for (const id of ['neurons', 'rate', 'epochs', 'seed']) $(id).addEventListener('change', () => { reset(); network(); message('Configuración actualizada. Entrena para comenzar un nuevo experimento.'); });
$('stop').onclick = () => { stopped = true; worker?.postMessage({ type: 'stop' }); controls(); message('Deteniendo al finalizar la época actual…'); };
$('train').onclick = () => {
  const settings = config();
  try { validate(points, settings); } catch (error) { message(error.message, true); return; }
  reset(); training = true; controls(); $('phase').textContent = 'Entrenando'; $('epoch-note').textContent = 'Ajustando pesos'; message('La red está aprendiendo con tus ejemplos…');
  try { worker = new Worker('/js/worker.js'); } catch(error) { reset(); message(`No se pudo iniciar el entrenamiento: ${error.message}`, true); return; }
  const fail = text => { worker?.terminate(); worker = null; training = false; trained = false; controls(); $('phase').textContent = 'Error'; $('epoch-note').textContent = 'Entrenamiento interrumpido'; message(text, true); };
  worker.onerror = () => fail('No se pudo cargar el motor de IA. Recarga la página y comprueba que el servidor siga encendido.');
  worker.onmessage = ({ data }) => {
    if (data.type === 'error') { fail(data.message); return; }
    if (data.boundary) { plane.field = data.boundary; render(); }
    if (data.type === 'epoch') {
      $('loss').textContent = data.loss.toFixed(4); $('accuracy').textContent = `${(data.accuracy * 100).toFixed(1)}%`; $('epoch').textContent = `${data.epoch} / ${settings.epochs}`;
      chart.data.labels.push(data.epoch); chart.data.datasets[0].data.push(data.loss); chart.data.datasets[1].data.push(data.accuracy * 100);
      if (data.epoch % 5 === 0 || data.epoch === 1) chart.update();
    }
    if (data.type === 'done') { training = false; trained = true; controls(); chart.update(); $('phase').textContent = stopped ? 'Detenido' : 'Modelo entrenado'; $('epoch-note').textContent = stopped ? 'Detenido por ti' : 'Entrenamiento completado'; resultSummary.textContent = classificationSummary(data.evaluation.correct, data.evaluation.total, { partial: stopped }); resultSummary.hidden = false; message('Elige «Probar» y toca el plano para consultar una predicción nueva.'); }
    if (data.type === 'prediction') { const p = data.probability; $('prediction').textContent = `La IA predice tipo ${p >= .5 ? 'B' : 'A'}. Probabilidad de A: ${((1-p)*100).toFixed(1)}%; de B: ${(p*100).toFixed(1)}%. Es una estimación, puede equivocarse.`; }
  };
  worker.postMessage({ type: 'train', config: settings, points });
};
try { chart = createChart($('chart')); } catch { $('train').disabled = true; message('No se cargó Chart.js. Recarga la página con el servidor local activo.', true); }
render(); network();
window.addEventListener('pagehide', () => worker?.terminate());
import './guided.js';
import './inside.js';
import './glass.js';
import './navigation.js';
import './compare.js';
import './about.js';
import './routes.js';
import './presentation.js';
