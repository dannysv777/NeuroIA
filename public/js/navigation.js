const header = document.querySelector('header');
let queued = false;
function updateHeader() {
  // Umbrales separados evitan parpadeos al cruzar el punto de contracción.
  if (scrollY > 96) header.classList.add('compact');
  else if (scrollY < 32) header.classList.remove('compact');
  queued = false;
}
window.addEventListener('scroll', () => {
  if (!queued) { queued = true; requestAnimationFrame(updateHeader); }
}, { passive: true });
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--nav-height', `${header.getBoundingClientRect().height}px`);
}).observe(header);
updateHeader();
