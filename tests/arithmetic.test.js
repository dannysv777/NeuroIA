import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as tf from '@tensorflow/tfjs';
import { neuron, additionData, createAdditionModel, additionSnapshot, additionPrediction, trainAddition } from '../public/js/arithmetic.js';
test('neurona: productos, sesgo y activación reales', () => {
  const result = neuron({ a:2,b:3,w1:.5,w2:.2,bias:.1 });
  assert.ok(Math.abs(result.total-1.7)<1e-12);
  assert.equal(result.output, Math.tanh(result.total));
  assert.throws(()=>neuron({a:NaN,b:1,w1:1,w2:1,bias:0}));
});
test('aprende suma, valida datos separados y libera memoria', async () => {
  await tf.setBackend('cpu'); const baseline=tf.memory().numTensors;
  const model=createAdditionModel(tf); const metrics=[];
  assert.deepEqual(additionData(),additionData());
  const trainingPairs=new Set(additionData().map(p=>`${p.a},${p.b}`));
  assert.ok(additionData(2026,24).every(p=>!trainingPairs.has(`${p.a},${p.b}`)));
  await trainAddition(tf,model, data=>metrics.push(data));
  const last=metrics.at(-1);
  console.log('Addition validation MAE:',last.validationMAE);
  assert.equal(metrics.length,180); assert.ok(last.loss<metrics[0].loss*.01); assert.ok(last.validationMAE<.05);
  const snapshot=additionSnapshot(tf,model);
  for(const [a,b] of [[2,3],[-5,8],[0,0],[10,-10]]) {
    const actual=tf.tidy(()=>model.predict(tf.tensor2d([[a/10,b/10]])).dataSync()[0]*20);
    assert.ok(Math.abs(actual-additionPrediction(snapshot,a,b))<1e-5);
    assert.ok(Math.abs(actual-a-b)<.05);
  }
  model.optimizer.dispose();model.dispose();assert.equal(tf.memory().numTensors,baseline);
});
test('la suma se puede detener después de una época',async()=>{
  const model=createAdditionModel(tf);let epochs=0;
  await trainAddition(tf,model,()=>epochs++,()=>true);
  assert.equal(epochs,1);model.optimizer.dispose();model.dispose();
});
