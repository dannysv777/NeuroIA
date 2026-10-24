/* El cálculo vive fuera del hilo de la interfaz. No se ejecuta código del usuario. */
let model, busy = false, stopRequested = false;
const ready = (async () => {
  importScripts('/vendor/tf.min.js');
  await tf.setBackend('cpu'); await tf.ready();
  return import('./model.js');
})();
ready.catch(error => postMessage({ type: 'error', message: error.message }));
onmessage = async ({ data }) => {
  if (data.type === 'stop') { stopRequested = true; if (model) model.stopTraining = true; return; }
  try {
    const engine = await ready;
    if (data.type === 'predict' && model && !busy) {
      postMessage({ type: 'prediction', probability: engine.predict(tf, model, [[data.x, data.y]])[0] }); return;
    }
    if (data.type !== 'train' || busy) return;
    busy = true;
    if (model) { model.optimizer.dispose(); model.dispose(); }
    model = engine.createModel(tf, data.config);
    if (data.probes) postMessage({ type: 'initial', trace: engine.inspect(tf, model, data.probes) });
    if (data.probes && data.delay) await new Promise(resolve => setTimeout(resolve, 700));
    await engine.train(tf, model, data.points, data.config, async metrics => {
      if (stopRequested) model.stopTraining = true;
      if (data.validation) metrics.validation = engine.evaluateExamples(tf, model, data.validation);
      postMessage({ type: 'epoch', ...metrics, trace: data.probes ? engine.inspect(tf, model, data.probes) : null, boundary: !data.probes && (metrics.epoch % 5 === 0 || metrics.epoch === 1) ? engine.boundary(tf, model) : null });
      if (data.delay) await new Promise(resolve => setTimeout(resolve, Math.min(200, data.delay)));
    });
    postMessage({ type: 'done', boundary: engine.boundary(tf, model) });
  } catch (error) { postMessage({ type: 'error', message: error.message || 'No se pudo entrenar el modelo.' }); }
  finally { if (data.type === 'train') busy = false; }
};
