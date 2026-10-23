import { random } from './dataset.js';

export function neuron({ a, b, w1, w2, bias }) {
  if (![a, b, w1, w2, bias].every(Number.isFinite)) throw new Error('Todos los valores deben ser números finitos.');
  const products = [a * w1, b * w2];
  const total = products[0] + products[1] + bias;
  return { products, total, output: Math.tanh(total) };
}

export function additionData(seed = 42, count = 64) {
  const rng = random(seed);
  return Array.from({ length: count }, () => {
    const a = Math.round((rng() * 20 - 10) * 10) / 10;
    const b = Math.round((rng() * 20 - 10) * 10) / 10;
    return { a, b, sum: a + b };
  });
}

export function createAdditionModel(tf) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [2], units: 1, activation: 'linear',
    kernelInitializer: tf.initializers.glorotUniform({ seed: 42 }) }));
  model.compile({ optimizer: tf.train.adam(0.03), loss: 'meanSquaredError' });
  return model;
}

export function additionSnapshot(tf, model) {
  return tf.tidy(() => {
    const [kernel, bias] = model.layers[0].getWeights();
    return { weights: Array.from(kernel.dataSync()), bias: bias.dataSync()[0] };
  });
}

// Equivale a la salida lineal del modelo, convirtiéndola a unidades originales.
export function additionPrediction(snapshot, a, b) {
  return ((a / 10) * snapshot.weights[0] + (b / 10) * snapshot.weights[1] + snapshot.bias) * 20;
}

export async function trainAddition(tf, model, onEpoch, shouldStop = () => false) {
  const examples = additionData();
  const validation = additionData(2026, 24);
  const xs = tf.tensor2d(examples.map(p => [p.a / 10, p.b / 10]));
  const ys = tf.tensor2d(examples.map(p => [p.sum / 20]));
  const vx = tf.tensor2d(validation.map(p => [p.a / 10, p.b / 10]));
  const vy = tf.tensor2d(validation.map(p => [p.sum / 20]));
  try {
    await model.fit(xs, ys, { epochs: 180, batchSize: examples.length, shuffle: false,
      callbacks: { onEpochEnd: async epoch => {
        const metrics = tf.tidy(() => ({
          loss: model.evaluate(xs, ys).dataSync()[0],
          // Error absoluto medio en unidades de la suma sobre ejemplos no usados para entrenar.
          validationMAE: model.predict(vx).sub(vy).abs().mean().mul(20).dataSync()[0]
        }));
        if (!Object.values(metrics).every(Number.isFinite)) throw new Error('El entrenamiento produjo valores no válidos.');
        await onEpoch({ epoch: epoch + 1, ...metrics, ...additionSnapshot(tf, model) });
        if (shouldStop()) model.stopTraining = true;
        await tf.nextFrame();
      } }
    });
  } finally { xs.dispose(); ys.dispose(); vx.dispose(); vy.dispose(); }
}
