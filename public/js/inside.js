import { neuron, additionData, additionPrediction } from './arithmetic.js';
const section = document.createElement('section'); section.id = 'dentro'; section.className = 'inside-section';
section.innerHTML = `
<h2>Dentro de la IA</h2><p class="inside-intro">Primero calcula una neurona. Después descubre cómo el entrenamiento encuentra sus pesos para aproximar una suma.</p>
<section class="panel neuron-lesson"><div class="panel-title"><h3>Una neurona, paso a paso</h3></div><p>Aquí tú eliges los pesos: todavía no hay aprendizaje. Cada entrada se multiplica por un peso, se agrega un sesgo y se aplica una función llamada tanh.</p>
<div class="neuron-inputs">${[['n-a','Entrada A',2],['n-b','Entrada B',3],['n-w1','Peso 1',.5],['n-w2','Peso 2',.2],['n-bias','Sesgo',.1]].map(([id,label,value])=>`<label>${label}<input id="${id}" type="number" min="-10" max="10" step="0.1" value="${value}"></label>`).join('')}</div>
<div class="operation-layout"><div><div class="operation-steps" role="group" aria-label="Paso del cálculo"><button data-step="0" aria-pressed="true" class="active">1 · Multiplicar</button><button data-step="1" aria-pressed="false">2 · Sumar</button><button data-step="2" aria-pressed="false">3 · Activar</button></div><div id="neuron-result" class="operation-result" role="status"></div><p id="neuron-explanation"></p><button id="neuron-next" class="button secondary">Siguiente paso →</button></div><div><span class="code-label">Código JavaScript</span><pre id="neuron-code" class="code-view"></pre></div></div></section>
<section class="panel addition-lesson" id="addition-lesson"><div class="lesson-toolbar"><div><div class="panel-title"><h3>Enséñale a sumar</h3></div><p>Compara la suma exacta con la predicción de una red entrenada con 64 ejemplos.</p></div><div class="lesson-actions"><label class="slow-toggle"><input id="sum-slow" type="checkbox" checked> Ver con calma</label><button id="sum-train" class="button primary">▶ Entrenar suma</button><button id="sum-stop" class="button secondary" disabled>Detener</button><button id="sum-reset" class="button secondary">Reiniciar</button></div></div>
<div class="sum-question"><label>Número A<input id="sum-a" type="number" min="-10" max="10" step="0.1" value="2"></label><span>+</span><label>Número B<input id="sum-b" type="number" min="-10" max="10" step="0.1" value="3"></label><p>Prueba números entre −10 y 10. Puedes cambiarlos mientras aprende.</p></div>
<div class="sum-results"><div><span>RESULTADO EXACTO · A + B</span><strong id="sum-exact">5</strong><small>Calculadora: operación directa</small></div><div><span>PREDICCIÓN DE LA IA</span><strong id="sum-prediction">—</strong><small>Salida real de la neurona lineal</small></div><div><span>ERROR EN TU CASO</span><strong id="sum-error">—</strong><small>Distancia al resultado exacto</small></div></div>
<p id="sum-state" role="status">Pulsa «Entrenar suma» para ver la predicción inicial y cómo cambia.</p><div class="lesson-progress"><span id="sum-epoch">Época 0 / 180</span><progress id="sum-progress" max="180" value="0"></progress><span id="sum-validation">Error en 24 ejemplos nuevos: —</span></div>
<div class="sum-flow"><h3>La operación dentro del modelo, ahora mismo</h3><p id="sum-formula">Los pesos aparecerán al crear el modelo.</p><p>Para entrenar, dividimos las entradas entre 10 y las respuestas entre 20. Al predecir multiplicamos la salida por 20. Aquí usamos activación lineal: tanh limitaría la salida.</p></div>
<div class="guide-details"><div class="sum-chart-box"><h3>Tu resultado, durante el aprendizaje</h3><div class="chart-wrap"><canvas id="sum-chart" aria-label="Predicción de la suma y resultado exacto por época"></canvas></div><p class="hint">La línea cian procede de los pesos reales de cada época. Puede mejorar o empeorar momentáneamente.</p></div><div><h3>Código de este experimento</h3><div class="code-tabs" role="group" aria-label="Etapa del código"><button data-code="data" class="active" aria-pressed="true">Datos</button><button data-code="model" aria-pressed="false">Modelo</button><button data-code="train" aria-pressed="false">Entrenar</button><button data-code="predict" aria-pressed="false">Predecir</button></div><pre id="sum-code" class="code-view"></pre><p id="code-explanation" class="hint"></p></div></div>
<details><summary>Ver los ejemplos que enseñamos a la IA</summary><p>Etiqueta = suma exacta calculada para enseñar. Esta respuesta no se entrega al modelo al predecir tu caso.</p><div id="sum-examples" class="example-list"></div></details>
<details id="source-details"><summary>Ver el archivo real del motor de cálculo</summary><p>Lectura del archivo que usa esta aplicación. Los fragmentos de arriba omiten gestión de memoria y mensajes para facilitar la explicación.</p><pre id="source-code" class="code-view">Abre este apartado para cargar el archivo.</pre><a class="text-link" href="/js/arithmetic.js" target="_blank" rel="noopener">Abrir arithmetic.js ↗</a></details>
<p class="guide-explanation">Este experimento usa <strong>una neurona lineal</strong>: sumar es una relación lineal y no requiere una red grande. Aprender una aproximación no convierte a una red en una calculadora exacta. El error de validación usa 24 ejemplos que no se utilizaron para ajustar los pesos.</p></section>`;
document.getElementById('como-funciona').before(section);
const nav = document.createElement('a'); nav.href = '#dentro'; nav.textContent = 'Dentro de la IA'; document.querySelector('nav').append(nav);
const $ = id => document.getElementById(id), fmt = n => Number(n.toFixed(4)).toString();
let step = 0, snapshot, history = [], worker, busy = false, chart;
function renderNeuron() {
  const values = ['n-a','n-b','n-w1','n-w2','n-bias'].map(id => $(id).value === '' ? NaN : Number($(id).value));
  if (values.some(v => !Number.isFinite(v) || Math.abs(v)>10)) { $('neuron-result').textContent = 'Introduce números entre −10 y 10.'; $('neuron-code').textContent = ''; $('neuron-explanation').textContent = ''; return; }
  const [a,b,w1,w2,bias] = values, result = neuron({a,b,w1,w2,bias});
  const lines = [`const p1 = ${a} * ${w1}; // ${fmt(result.products[0])}\nconst p2 = ${b} * ${w2}; // ${fmt(result.products[1])}`, `const total = p1 + p2 + ${bias}; // ${fmt(result.total)}`, `const salida = Math.tanh(total); // ${fmt(result.output)}`];
  $('neuron-code').replaceChildren(); lines.forEach((line,i) => { const span = document.createElement('span'); span.className = i === step ? 'code-active' : ''; span.textContent = line + '\n'; $('neuron-code').append(span); });
  $('neuron-result').textContent = [ `${a} × ${w1} = ${fmt(result.products[0])}  ·  ${b} × ${w2} = ${fmt(result.products[1])}`, `${fmt(result.products[0])} + ${fmt(result.products[1])} + ${bias} = ${fmt(result.total)}`, `tanh(${fmt(result.total)}) = ${fmt(result.output)}` ][step];
  $('neuron-explanation').textContent = ['Los pesos determinan cuánto influye cada entrada. Un peso negativo invierte su contribución.', 'El sesgo añade un ajuste independiente de las entradas.', 'tanh transforma el total a un valor entre −1 y 1. Esta no linealidad ayuda a redes como la del reto XOR.'][step];
  document.querySelectorAll('[data-step]').forEach(b => { b.classList.toggle('active', Number(b.dataset.step)===step); b.setAttribute('aria-pressed', String(Number(b.dataset.step)===step)); });
  $('neuron-next').textContent = step === 2 ? 'Volver al primer paso ↺' : 'Siguiente paso →';
}
document.querySelectorAll('.neuron-inputs input').forEach(input => input.oninput = renderNeuron);
document.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { step = Number(b.dataset.step); renderNeuron(); });
$('neuron-next').onclick = () => { step=(step+1)%3; renderNeuron(); };
const snippets = {
  data: ['const ejemplos = additionData(42, 64);\nconst xs = tf.tensor2d(\n  ejemplos.map(p => [p.a / 10, p.b / 10])\n);\nconst ys = tf.tensor2d(\n  ejemplos.map(p => [p.sum / 20])\n);', 'Cada ejemplo tiene dos entradas y una respuesta correcta. Normalizamos para que el entrenamiento trabaje con números pequeños.'],
  model: ["const model = tf.sequential();\nmodel.add(tf.layers.dense({\n  inputShape: [2], units: 1,\n  activation: 'linear',\n  kernelInitializer:\n    tf.initializers.glorotUniform({seed: 42})\n}));\nmodel.compile({\n  optimizer: tf.train.adam(0.03),\n  loss: 'meanSquaredError'\n});", 'Dos pesos y un sesgo: tres parámetros aprendidos. Adam ajusta esos parámetros para reducir el error cuadrático medio.'],
  train: ['await model.fit(xs, ys, {\n  epochs: 180,\n  batchSize: 64,\n  shuffle: false,\n  callbacks: { onEpochEnd: mostrarResultados }\n});', 'Fragmento abreviado: mostrarResultados representa la lectura de métricas y pesos después de cada época. El archivo real está disponible abajo.'],
  predict: ['// Pesos aprendidos, no la etiqueta correcta:\nconst salida = (a / 10) * peso1\n             + (b / 10) * peso2 + sesgo;\nconst prediccion = salida * 20;', 'Esta fórmula equivale a la salida lineal del modelo. Usa sus pesos actuales. La suma exacta se calcula por separado para comparar.']
};
document.querySelectorAll('[data-code]').forEach(button => button.onclick = () => { const [code,text] = snippets[button.dataset.code]; $('sum-code').textContent = code; $('code-explanation').textContent = text; document.querySelectorAll('[data-code]').forEach(b => { b.classList.toggle('active', b===button); b.setAttribute('aria-pressed', String(b===button)); }); });
document.querySelector('[data-code="data"]').click();
$('sum-examples').textContent = additionData().map(p => `${p.a} + ${p.b} → ${fmt(p.sum)}`).join('\n');
$('source-details').addEventListener('toggle', async () => { if (!$('source-details').open) return; try { const response = await fetch('/js/arithmetic.js'); if (!response.ok) throw new Error(); $('source-code').textContent = await response.text(); } catch { $('source-code').textContent = 'No se pudo cargar el archivo. Comprueba el servidor y vuelve a abrir este apartado.'; } });
try { chart = new Chart($('sum-chart'), { type: 'line', data: {labels:[], datasets:[{ label:'Predicción IA',data:[],borderColor:'#58dbed',pointRadius:0,borderWidth:2 },{ label:'Suma exacta',data:[],borderColor:'#c8b2f4',borderDash:[5,5],pointRadius:0,borderWidth:1 }]}, options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{labels:{color:'#bbb5ce',boxWidth:12}}},scales:{x:{ticks:{maxTicksLimit:5,color:'#999fb4'},title:{display:true,text:'Época',color:'#999fb4'}},y:{ticks:{color:'#999fb4'}}}} }); } catch { $('sum-state').textContent = 'No se cargaron las gráficas. Recarga la página.'; }
function renderSum() {
  const a = $('sum-a').value === '' ? NaN : Number($('sum-a').value), b = $('sum-b').value === '' ? NaN : Number($('sum-b').value);
  if (![a,b].every(v => Number.isFinite(v) && Math.abs(v)<=10)) { $('sum-exact').textContent='—'; $('sum-prediction').textContent='—'; $('sum-error').textContent='—'; $('sum-formula').textContent='Introduce dos números entre −10 y 10.'; if(chart){chart.data.labels=[];chart.data.datasets.forEach(d=>d.data=[]);chart.update();} return; }
  $('sum-exact').textContent=fmt(a+b);
  const prediction = snapshot ? additionPrediction(snapshot,a,b) : null;
  $('sum-prediction').textContent=prediction===null?'—':prediction.toFixed(4);
  $('sum-error').textContent=prediction===null?'—':Math.abs(prediction-a-b).toFixed(4);
  $('sum-formula').textContent=snapshot ? `((${a} ÷ 10) × ${fmt(snapshot.weights[0])} + (${b} ÷ 10) × ${fmt(snapshot.weights[1])} + ${fmt(snapshot.bias)}) × 20 ≈ ${prediction.toFixed(4)} · pesos mostrados redondeados` : 'Los pesos aparecerán al crear el modelo.';
  if(chart){chart.data.labels=history.map(h=>h.epoch);chart.data.datasets[0].data=history.map(h=>additionPrediction(h,a,b));chart.data.datasets[1].data=history.map(()=>a+b);chart.update();}
}
function controls(){ $('sum-train').disabled=busy||!chart; $('sum-stop').disabled=!busy; $('sum-slow').disabled=busy; }
function reset(){worker?.terminate();worker=null;busy=false;snapshot=null;history=[];$('sum-epoch').textContent='Época 0 / 180';$('sum-progress').value=0;$('sum-validation').textContent='Error en 24 ejemplos nuevos: —';$('sum-state').textContent='Pulsa «Entrenar suma» para empezar desde los mismos pesos iniciales.';controls();renderSum();}
$('sum-a').oninput=renderSum;$('sum-b').oninput=renderSum;$('sum-reset').onclick=reset;
$('sum-stop').onclick=()=>{worker?.postMessage({type:'stop'});$('sum-stop').disabled=true;$('sum-state').textContent='Deteniendo después de la época actual…';};
$('sum-train').onclick=()=>{
  reset();busy=true;controls();$('sum-state').textContent='Preparando la neurona…';$('addition-lesson').scrollIntoView({block:'start',behavior:'instant'});
  const fail=text=>{worker?.terminate();busy=false;controls();$('sum-state').textContent=`No se pudo completar: ${text}`;};
  try{worker=new Worker('/js/arithmetic-worker.js');}catch(error){fail(error.message);return;}
  worker.onerror=()=>fail('comprueba que el servidor local esté activo y recarga.');
  worker.onmessage=({data})=>{
    if(data.type==='error'){fail(data.message);return;}
    if(data.type==='snapshot'){snapshot=data;history.push(data);$('sum-epoch').textContent=`Época ${data.epoch} / 180`;$('sum-progress').value=data.epoch;$('sum-state').textContent=data.epoch?'Aprendiendo: ajustando pesos para reducir el error.':'Antes de aprender: esta es la predicción inicial.';if(data.validationMAE!==undefined)$('sum-validation').textContent=`Error medio en 24 ejemplos nuevos: ${data.validationMAE.toFixed(4)}`;renderSum();}
    if(data.type==='done'){busy=false;controls();$('sum-state').textContent=data.stopped?'Entrenamiento detenido. Puedes probar otros números con los pesos actuales.':'Entrenamiento terminado. Prueba otros números y compara la aproximación.';worker.terminate();worker=null;}
  };
  worker.postMessage({type:'train',slow:$('sum-slow').checked});
};
renderNeuron();controls();renderSum();window.addEventListener('pagehide',()=>worker?.terminate());
