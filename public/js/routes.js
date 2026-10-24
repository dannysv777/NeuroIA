// Vistas con URL propia, sin recargar ni perder modelos al navegar.
const views = new Map([
  ['inicio', 'Inicio'], ['laboratorio', 'Laboratorio'],
  ['dentro', 'Dentro de la IA'], ['como-funciona', 'Cómo funciona'], ['acerca-de-mi', 'Acerca de mí']
]);
const homeCards = document.createElement('div');
homeCards.className = 'home-cards';
homeCards.innerHTML = `
  <a class="destination-card" href="#laboratorio"><span>01 / EXPERIMENTA</span><h2>Enseña a tu IA <b>↗</b></h2><p>Empieza con los interruptores o crea tus propios ejemplos en el plano.</p><strong>Entrar al laboratorio →</strong></a>
  <a class="destination-card" href="#dentro"><span>02 / DESCUBRE</span><h2>Mira el código <b>↗</b></h2><p>Calcula una neurona paso a paso y entrena un modelo que aprenda a sumar.</p><strong>Explorar por dentro →</strong></a>
  <a class="destination-card" href="#como-funciona"><span>03 / COMPRENDE</span><h2>Conecta las ideas <b>↗</b></h2><p>Qué son los datos, cómo guía el error y qué significa una predicción.</p><strong>Conocer los conceptos →</strong></a>`;
document.getElementById('inicio').append(homeCards);
const aboutAccess = document.createElement('div');
aboutAccess.className = 'home-about-link';
aboutAccess.innerHTML = '<a class="text-link" href="#acerca-de-mi">Acerca de mí <span aria-hidden="true">↗</span></a>';
homeCards.after(aboutAccess);

// Dentro de la IA también se divide en experiencias, para evitar otro recorrido largo.
const inside = document.getElementById('dentro');
const neuron = inside.querySelector('.neuron-lesson');
const addition = inside.querySelector('.addition-lesson');
const choices = document.createElement('div'); choices.className = 'lab-modes inside-modes';
choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Experiencia de código');
choices.innerHTML = '<button id="neuron-tab" class="button primary" aria-pressed="true" aria-controls="neuron-lesson">Una neurona paso a paso</button><button id="addition-tab" class="button secondary" aria-pressed="false" aria-controls="addition-lesson">Enséñale a sumar</button>';
neuron.id = 'neuron-lesson'; neuron.before(choices); addition.hidden = true;
function stopButton(id) {
  const button = document.getElementById(id);
  if (button && !button.disabled) button.click();
}
function resizeCharts(view) {
  requestAnimationFrame(() => view.querySelectorAll('canvas').forEach(canvas => {
    if (canvas.getClientRects().length) window.Chart?.getChart(canvas)?.resize();
  }));
}
choices.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const showNeuron = button.id === 'neuron-tab';
  if (showNeuron) stopButton('sum-stop');
  neuron.hidden = !showNeuron; addition.hidden = showNeuron;
  for (const child of choices.querySelectorAll('button')) {
    const selected = child === button;
    child.className = `button ${selected ? 'primary' : 'secondary'}`;
    child.setAttribute('aria-pressed', String(selected));
  }
  resizeCharts(inside);
});
let current;
function renderRoute({ focus = true } = {}) {
  let route = location.hash.slice(1) || 'inicio';
  if (route === 'sobre-mi') { route = 'acerca-de-mi'; history.replaceState(null, '', '#acerca-de-mi'); }
  if (!views.has(route)) { route = 'inicio'; history.replaceState(null, '', '#inicio'); }
  if (current && route !== current) {
    if (current === 'laboratorio') { stopButton('guide-stop'); stopButton('stop'); stopButton('compare-stop'); }
    if (current === 'dentro') stopButton('sum-stop');
  }
  current = route;
  for (const [id] of views) document.getElementById(id).hidden = id !== route;
  for (const link of document.querySelectorAll('header nav a')) {
    if (link.hash === `#${route}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = `${views.get(route)} · NeuroIA`;
  const view = document.getElementById(route);
  if (focus) {
    const heading = view.querySelector('h1, h2');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  resizeCharts(view);
}
// Controlar el clic evita que el navegador desplace hacia una vista aún oculta.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]');
  if (!link || !views.has(link.hash.slice(1))) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  renderRoute();
});
window.addEventListener('popstate', () => renderRoute());
window.addEventListener('hashchange', () => renderRoute());
renderRoute({ focus: false });
