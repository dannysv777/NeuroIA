const bar = document.createElement('div');
bar.className = 'presentation-bar'; bar.hidden = true; bar.setAttribute('aria-label', 'Controles de exposición');
bar.innerHTML = '<strong>Modo exposición</strong><div><button class="button secondary" id="presentation-settings" aria-pressed="false">Mostrar controles</button><button class="button primary" id="presentation-exit">Salir <span aria-hidden="true">· Esc</span></button></div>';
document.body.append(bar);
let active = false, opener, previousScroll = 0, route;
function resize() {
  requestAnimationFrame(() => document.querySelectorAll('canvas').forEach(canvas => {
    if (canvas.getClientRects().length) window.Chart?.getChart(canvas)?.resize();
  }));
}
function leave({ restore = true } = {}) {
  if (!active) return;
  active = false; document.body.classList.remove('presenting', 'presentation-controls-open'); bar.hidden = true;
  document.querySelectorAll('.presentation-enter').forEach(button => button.setAttribute('aria-pressed', 'false'));
  if (restore) { window.scrollTo({ top: previousScroll, behavior: 'instant' }); opener?.focus({ preventScroll: true }); }
  resize();
}
for (const id of ['laboratorio','dentro']) {
  const button = document.createElement('button'); button.className = 'button secondary presentation-enter'; button.textContent = 'Modo exposición'; button.setAttribute('aria-pressed', 'false');
  const row = document.createElement('div'); row.className = 'presentation-entry'; row.append(button); document.getElementById(id).prepend(row);
  button.onclick = () => {
    active = true; opener = button; previousScroll = scrollY; route = location.hash;
    document.body.classList.add('presenting'); document.body.classList.remove('presentation-controls-open'); bar.hidden = false;
    document.getElementById('presentation-settings').textContent = 'Mostrar controles'; document.getElementById('presentation-settings').setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed','true'); window.scrollTo({ top: 0, behavior: 'instant' }); document.getElementById('presentation-exit').focus({ preventScroll: true }); resize();
  };
}
document.getElementById('presentation-settings').onclick = event => {
  const open = document.body.classList.toggle('presentation-controls-open');
  event.currentTarget.textContent = open ? 'Ocultar controles' : 'Mostrar controles'; event.currentTarget.setAttribute('aria-pressed',String(open)); resize();
};
document.getElementById('presentation-exit').onclick = () => leave();
document.addEventListener('keydown', event => { if(active && event.key === 'Escape') { event.preventDefault(); leave(); } });
document.addEventListener('neuroia:viewchange', () => { if(active && location.hash !== route) leave({ restore: false }); });
// Las explicaciones técnicas de la suma siguen disponibles, sin ocupar el escenario.
const flow = document.querySelector('.sum-flow');
const details = document.createElement('details'); details.className = 'sum-calculation-details';
const summary = document.createElement('summary'); summary.textContent = 'Ver el cálculo con los pesos actuales';
flow.before(details); details.append(summary, flow);
