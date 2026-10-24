export function describePoint(point) {
  const size = Math.round((point.x + 1) * 50);
  const weight = Math.round((point.y + 1) * 50);
  return `Tamaño: ${size}/100 · Peso: ${weight}/100`;
}

export function installPointHelp(onExample) {
  const plot = document.querySelector('.plot-panel');
  const help = document.createElement('div'); help.className = 'point-intro';
  help.innerHTML = '<h3>Imagina que clasificas piezas</h3><p><strong>Cada punto es una pieza ficticia.</strong> Más a la derecha significa mayor tamaño; más arriba, mayor peso. El color A o B es el tipo que tú le enseñas a la IA.</p><ol><li><b>Observa</b> un ejemplo.</li><li><b>Entrena</b> con los colores conocidos.</li><li><b>Prueba</b> una pieza sin etiqueta.</li></ol><p class="point-scale">Tamaño y peso usan una escala relativa de 0 a 100. Son datos inventados para practicar, no medidas reales.</p>';
  plot.prepend(help);
  const readout = document.createElement('div'); readout.className = 'point-readout';
  readout.innerHTML = '<p id="point-detail" role="status">Selecciona «Ver ejemplo» y toca un punto para entenderlo.</p><button id="inspect-example" class="button secondary" type="button">Ver un ejemplo</button>';
  plot.querySelector('.plot-wrap').after(readout);
  document.getElementById('inspect-example').onclick = onExample;
  const inspect = document.createElement('button'); inspect.type = 'button'; inspect.dataset.mode = 'inspect'; inspect.textContent = '◎ Ver ejemplo'; inspect.className = 'selected'; inspect.setAttribute('aria-pressed','true');
  document.querySelectorAll('[data-mode]').forEach(button => { button.classList.remove('selected'); button.setAttribute('aria-pressed','false'); });
  document.querySelector('.tools').prepend(inspect);
  document.querySelector('.axis-x').textContent = 'Tamaño →'; document.querySelector('.axis-y').textContent = 'Peso ↑';
  document.querySelector('.boundary-key').textContent = 'Fondo = predicción de la IA';
}
