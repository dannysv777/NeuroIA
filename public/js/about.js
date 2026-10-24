const about = document.createElement('section');
about.id = 'acerca-de-mi'; about.className = 'about-section';
about.innerHTML = `
  <div class="about-card">
    <div class="about-monogram" aria-hidden="true">DS<span>✳</span></div>
    <div class="about-content"><p class="about-kicker">ACERCA DE MÍ</p><h2>Hola, soy <span>Dany S</span>.</h2><p class="about-role">Estudiante de Ingeniería en Sistemas</p><p>Tarea de Sistemas Operativos</p><dl><dt>Carné</dt><dd>0904-24-17049</dd></dl>
    <a class="button primary instagram-link" href="https://www.instagram.com/danny_sv7" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg> @danny_sv7 <span aria-hidden="true">↗</span><span class="sr-only"> en Instagram (abre otra pestaña)</span></a></div>
  </div>`;
document.querySelector('main').append(about);
