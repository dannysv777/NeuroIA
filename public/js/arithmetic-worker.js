let stopped = false;
onmessage = async ({ data }) => {
  if (data.type === 'stop') { stopped = true; return; }
  if (data.type !== 'train') return;
  let model;
  try {
    importScripts('/vendor/tf.min.js');
    await tf.setBackend('cpu'); await tf.ready();
    const engine = await import('./arithmetic.js');
    model = engine.createAdditionModel(tf);
    postMessage({ type: 'snapshot', epoch: 0, ...engine.additionSnapshot(tf, model) });
    const delay = data.slow ? 65 : 0;
    if (delay) await new Promise(resolve => setTimeout(resolve, 650));
    await engine.trainAddition(tf, model, async snapshot => {
      postMessage({ type: 'snapshot', ...snapshot });
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    }, () => stopped);
    postMessage({ type: 'done', stopped });
  } catch (error) { postMessage({ type: 'error', message: error.message }); }
  finally { if (model) { model.optimizer.dispose(); model.dispose(); } }
};
