import { validate } from './dataset.js';
export function createModel(tf, config) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [2], units: config.neurons, activation: 'tanh', kernelInitializer: tf.initializers.glorotUniform({ seed: config.seed }) }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid', kernelInitializer: tf.initializers.glorotUniform({ seed: config.seed + 1 }) }));
  model.compile({ optimizer: tf.train.adam(config.rate), loss: 'binaryCrossentropy', metrics: ['accuracy'] });
  return model;
}
export async function train(tf, model, points, config, onEpoch) {
  validate(points, config);
  const xs = tf.tensor2d(points.map(p => [p.x, p.y])), ys = tf.tensor2d(points.map(p => [p.label]));
  try {
    await model.fit(xs, ys, { epochs: config.epochs, batchSize: points.length, shuffle: false,
      callbacks: { onEpochEnd: async (epoch) => {
        const values = tf.tidy(() => model.evaluate(xs, ys).map(t => t.dataSync()[0]));
        if (values.some(v => !Number.isFinite(v))) throw new Error('El entrenamiento produjo valores no válidos. Reduce la tasa de aprendizaje.');
        await onEpoch({ epoch: epoch + 1, loss: values[0], accuracy: values[1] });
        await tf.nextFrame();
      } }
    });
  } finally { xs.dispose(); ys.dispose(); }
}
export function predict(tf, model, points) {
  return tf.tidy(() => Array.from(model.predict(tf.tensor2d(points)).dataSync()));
}
export function evaluateExamples(tf, model, points) {
  const probabilities = predict(tf, model, points.map(p => [p.x, p.y]));
  const correct = probabilities.filter((p, i) => Number(p >= .5) === points[i].label).length;
  return { correct, total: points.length, accuracy: correct / points.length };
}
// Lectura de activaciones y pesos del mismo modelo que se está entrenando.
export function inspect(tf, model, points) {
  return tf.tidy(() => {
    const input = tf.tensor2d(points);
    const hidden = model.layers[0].apply(input);
    const output = model.layers[1].apply(hidden);
    return { hidden: hidden.arraySync(), probabilities: Array.from(output.dataSync()),
      weights: model.layers.map(layer => layer.getWeights()[0].arraySync()) };
  });
}
export function boundary(tf, model, size = 40) {
  const points = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) points.push([(x + .5) / size * 2 - 1, 1 - (y + .5) / size * 2]);
  return { size, values: predict(tf, model, points) };
}
