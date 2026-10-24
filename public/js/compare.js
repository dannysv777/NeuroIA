import { dataset, validate } from './dataset.js';
import { Plane } from './canvas.js';

const $ = id => document.getElementById(id);
const modes = document.querySelector('#laboratorio > .lab-modes');
const tab = document.createElement('button');
tab.id = 'compare-tab'; tab.className = 'button secondary'; tab.textContent = 'Comparar dos IA'; tab.setAttribute('aria-pressed', 'false');
modes.append(tab);
const panel = document.createElement('section'); panel.id = 'comparison'; panel.hidden = true;
panel.innerHTML = `
  <div class="compare-heading"><div><h2>Comparación de modelos</h2><p>Cambia un parámetro y observa qué aprende cada una.</p></div><label>Elige un reto<select id="compare-task"><option value="xor">Separar esquinas</option><option value="rings">Reconocer círculos</option></select></label></div>
  <div class="challenge-brief"><p id="challenge-text">Consigue que al menos una IA acierte 72 de 80 ejemplos nuevos.</p><details><summary>Ver una pista</summary><p id="challenge-hint">Las esquinas del mismo color están en diagonal. Una línea recta no basta: prueba más neuronas.</p></details></div>
  <div class="compare-grid">${['a', 'b'].map((id, i) => `
    <article class="panel compare-model"><h3>IA ${id.toUpperCase()}</h3><div class="compare-settings"><label>Neuronas<select id="compare-neurons-${id}">${[4,8,16,32].map(n=>`<option${n===(i?16:4)?' selected':''}>${n}</option>`).join('')}</select></label><label>Aprendizaje<select id="compare-rate-${id}"><option>0.001</option><option selected>0.03</option><option>0.1</option></select></label></div>
    <canvas id="compare-plane-${id}" width="600" height="360" aria-label="Frontera aprendida por la IA ${id.toUpperCase()}"></canvas>
    <div class="compare-result"><strong id="compare-score-${id}">— / 80</strong><span>Aciertos en ejemplos nuevos</span></div><div class="compare-progress"><progress id="compare-progress-${id}" max="120" value="0"></progress><span id="compare-epoch-${id}">0 / 120 épocas</span></div>
    <details><summary>Detalles del entrenamiento</summary><p id="compare-metrics-${id}">Todavía no hay mediciones.</p></details></article>`).join('')}</div>
  <div class="compare-actions"><button id="compare-start" class="button primary">▶ Comparar</button><button id="compare-stop" class="button secondary" disabled>Detener</button><button id="compare-reset" class="button secondary">Reiniciar</button></div>
  <p id="compare-status" class="compare-status" role="status">Ambas reciben los mismos 80 ejemplos y entrenan durante 120 épocas.</p>
  <details class="compare-method"><summary>¿Qué estoy comparando?</summary><p>Los puntos son los ejemplos de entrenamiento y el fondo es la respuesta aprendida. Medimos aciertos con otros 80 puntos, que no se usan para ajustar los pesos. Datos y semilla son iguales para las dos IA. Si cambias el tamaño de la red, sus pesos iniciales tienen dimensiones distintas.</p><p>Una comparación no demuestra que una configuración siempre sea mejor. Repetir ajustes sobre estos ejemplos nuevos también puede sesgar la evaluación. Los resultados parciales pueden corresponder a épocas diferentes.</p><p>En «Separar esquinas», cada color agrupa dos esquinas opuestas. En «Reconocer círculos», un color está cerca del centro y el otro alrededor. El reto se comprueba solo cuando ambas IA terminan.</p></details>`;
modes.after(panel);
const planes = ['a','b'].map(id => new Plane($(`compare-plane-${id}`), () => {}));
let samples, validation, workers = [], results = [], done = [], busy = false, stopped = false, failed = false;
const hints = { xor: 'Las esquinas del mismo color están en diagonal. Una línea recta no basta: prueba más neuronas.', rings: 'La frontera debe rodear el centro. Prueba más neuronas y compara con una tasa de aprendizaje menor.' };
function controls() {
  panel.querySelectorAll('select').forEach(select => select.disabled = busy);
  $('compare-start').disabled = busy;
  $('compare-stop').disabled = !busy || stopped;
}
function reset() {
  workers.forEach(worker => worker?.terminate()); workers = []; results = []; done = [false,false]; busy = false; stopped = false; failed = false;
  samples = dataset($('compare-task').value, 42); validation = dataset($('compare-task').value, 2026);
  planes.forEach((plane, i) => {
    plane.points = samples; plane.field = null; plane.draw(); const id = i ? 'b' : 'a';
    $(`compare-score-${id}`).textContent = '— / 80'; $(`compare-progress-${id}`).value = 0; $(`compare-epoch-${id}`).textContent = '0 / 120 épocas'; $(`compare-metrics-${id}`).textContent = 'Todavía no hay mediciones.';
  });
  $('challenge-hint').textContent = hints[$('compare-task').value];
  $('compare-status').textContent = 'Ambas reciben los mismos 80 ejemplos y entrenan durante 120 épocas.';
  controls();
}
function finish() {
  if (!done.every(Boolean)) return;
  busy = false; controls();
  if (failed) return;
  if (stopped) { $('compare-status').textContent = 'Comparación detenida. Los resultados son parciales; vuelve a comparar para completar el reto.'; return; }
  const [a,b] = results.map(r => r.validation.correct);
  const success = Math.max(a,b) >= 72;
  const comparison = a === b ? `Empate: ambas acertaron ${a} de 80.` : `IA ${a > b ? 'A' : 'B'} acertó más: ${Math.max(a,b)} frente a ${Math.min(a,b)} de 80.`;
  $('compare-status').textContent = `${success ? 'Reto logrado.' : 'Todavía no se alcanza la meta. Prueba otra configuración.'} ${comparison}`;
}
$('compare-start').onclick = () => {
  reset();
  const configs = ['a','b'].map(id => ({ neurons: Number($(`compare-neurons-${id}`).value), rate: Number($(`compare-rate-${id}`).value), epochs: 120, seed: 42 }));
  try { configs.forEach(config => validate(samples, config)); } catch(error) { $('compare-status').textContent=error.message; return; }
  busy = true; controls(); $('compare-status').textContent='Las dos IA están aprendiendo. Observa cómo cambian sus fronteras.';
  function fail(message) { workers.forEach(w=>w?.terminate()); failed=true; busy=false; controls(); $('compare-status').textContent=`No se pudo completar: ${message}. Puedes intentarlo de nuevo.`; }
  try {
    configs.forEach((config,i) => {
      const id = i ? 'b' : 'a', worker = new Worker('/js/worker.js'); workers[i]=worker;
      worker.onerror = () => fail('el motor de IA no respondió');
      worker.onmessage = ({data}) => {
        if(failed) return;
        if(data.type==='error'){fail(data.message);return;}
        if(data.boundary){planes[i].field=data.boundary;planes[i].draw();}
        if(data.type==='epoch') {
          results[i]=data;
          $(`compare-score-${id}`).textContent=`${data.validation.correct} / ${data.validation.total}`;
          $(`compare-epoch-${id}`).textContent=`${data.epoch} / 120 épocas`; $(`compare-progress-${id}`).value=data.epoch;
          $(`compare-metrics-${id}`).textContent=`Pérdida: ${data.loss.toFixed(4)}. Aciertos en entrenamiento: ${(data.accuracy*100).toFixed(1)}%.`;
        }
        if(data.type==='done'){done[i]=true;worker.terminate();finish();}
      };
      worker.postMessage({type:'train',points:samples,validation,config,delay:25});
    });
  } catch(error){fail(error.message);}
};
$('compare-stop').onclick=()=>{stopped=true;workers.forEach((w,i)=>{if(!done[i])w?.postMessage({type:'stop'});});controls();$('compare-status').textContent='Deteniendo al terminar la época actual…';};
$('compare-reset').onclick=reset;
panel.querySelectorAll('select').forEach(select=>select.onchange=reset);
tab.onclick=()=>{
  for(const id of ['guide-stop','stop']) if(!$(id).disabled) $(id).click();
  $('guided').hidden=true;document.querySelector('.lab-layout').hidden=true;$('phase').hidden=true;panel.hidden=false;
  for(const id of ['guided-tab','free-tab','compare-tab']){const active=id==='compare-tab';$(id).className=`button ${active?'primary':'secondary'}`;$(id).setAttribute('aria-pressed',String(active));}
};
for(const id of ['guided-tab','free-tab']) $(id).addEventListener('click',()=>{if(busy&&!stopped)$('compare-stop').click();panel.hidden=true;tab.className='button secondary';tab.setAttribute('aria-pressed','false');});
reset();window.addEventListener('pagehide',()=>workers.forEach(w=>w?.terminate()));
