import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as tf from '@tensorflow/tfjs';
import { dataset, validate } from '../public/js/dataset.js';
import { createModel, train, predict, boundary, inspect } from '../public/js/model.js';
const config = { neurons: 8, rate: .03, epochs: 100, seed: 42 };
test('datos reproducibles y entradas inválidas rechazadas', () => {
  assert.deepEqual(dataset('xor', 42), dataset('xor', 42));
  assert.throws(() => validate([], config));
  assert.throws(() => validate(dataset().map(p => ({ ...p, label: 0 })), config));
  assert.throws(() => validate(dataset(), { ...config, epochs: NaN }));
});
test('aprende patrones lineales y no lineales; repite predicciones y libera tensores', async () => {
  await tf.setBackend('cpu');
  const initial = tf.memory().numTensors;
  let previous;
  for (const kind of ['clusters', 'clusters', 'xor', 'rings']) {
    const model = createModel(tf, config), metrics = [];
    await train(tf, model, dataset(kind), config, data => metrics.push(data));
    assert.equal(metrics.length, config.epochs);
    assert.ok(metrics.at(-1).loss < metrics[0].loss * .5, kind);
    assert.ok(metrics.at(-1).accuracy > .9, kind);
    const predictions = predict(tf, model, [[-.5, -.5], [.5, .5]]);
    const tensorsBefore = tf.memory().numTensors;
    const trace = inspect(tf, model, [[-.5, -.5], [.5, .5]]);
    assert.deepEqual(trace.probabilities, predictions);
    assert.equal(trace.hidden[0].length, config.neurons);
    assert.ok(trace.hidden.flat().every(value => value >= -1 && value <= 1));
    assert.equal(tf.memory().numTensors, tensorsBefore);
    assert.ok(predictions.every(p => p >= 0 && p <= 1));
    if (kind === 'clusters') { if (previous) assert.deepEqual(predictions, previous); previous = predictions; }
    assert.equal(boundary(tf, model).values.length, 1600);
    console.log(kind, metrics.at(-1));
    model.optimizer.dispose(); model.dispose();
  }
  assert.equal(tf.memory().numTensors, initial);
});
test('detener conserva un modelo utilizable', async () => {
  const model = createModel(tf, config); let epochs = 0;
  await train(tf, model, dataset(), config, () => { epochs++; if (epochs === 3) model.stopTraining = true; });
  assert.equal(epochs, 3); assert.equal(predict(tf, model, [[0, 0]]).length, 1);
  model.optimizer.dispose(); model.dispose();
});
