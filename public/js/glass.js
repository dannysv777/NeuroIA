// Un único listener delegado cubre también opciones creadas durante el entrenamiento.
const targets = 'button:not(:disabled), a[href], summary, select:not(:disabled), label:has(input[type="checkbox"])';
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let pending, frame = 0;
document.addEventListener('pointermove', event => {
  if (!pointer.matches || reducedMotion.matches) return;
  const element = event.target.closest?.(targets);
  if (!element) return;
  pending = { element, x: event.clientX, y: event.clientY };
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const { element, x, y } = pending;
    if (!element.isConnected) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--glass-x', `${x - rect.left}px`);
    element.style.setProperty('--glass-y', `${y - rect.top}px`);
  });
}, { passive: true });
