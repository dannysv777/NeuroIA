import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classificationSummary, sumSummary } from '../public/js/results.js';
test('explica aciertos, fallos y datos de evaluación sin prometer generalización', () => {
  assert.match(classificationSummary(76,80,{training:false}),/Acertó 76 de 80 ejemplos nuevos; falló en 4/);
  assert.match(classificationSummary(4,4),/no garantiza/);
  assert.match(classificationSummary(0,4,{partial:true}),/^Resultado parcial.*falló en 4/);
});
test('explica el error de suma y no redondea un error diminuto a certeza', () => {
  assert.match(sumSummary(5,4.8,.1),/0.2000.*24 ejemplos nuevos.*0.1000/);
  assert.match(sumSummary(5,4.999999,0,{partial:true}),/^Resultado parcial.*menos de 0.0001/);
  assert.doesNotMatch(sumSummary(5,4.8,undefined),/24 ejemplos/);
});
