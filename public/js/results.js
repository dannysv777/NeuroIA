// Explicaciones de resultados medidos, sin inferir certeza ni generalización.
export function classificationSummary(correct, total, { partial = false, training = true } = {}) {
  const failures = total - correct;
  return `${partial ? 'Resultado parcial. ' : ''}Acertó ${correct} de ${total} ${training ? 'ejemplos de entrenamiento' : 'ejemplos nuevos'}${failures ? `; falló en ${failures}` : ''}. ${training ? 'Esto no garantiza aciertos con otros datos.' : 'El resultado corresponde a esta evaluación.'}`;
}
export function sumSummary(exact, prediction, validationMAE, { partial = false } = {}) {
  const error = Math.abs(prediction - exact);
  const difference = error < .0001 ? 'menos de 0.0001' : error.toFixed(4);
  const evaluation = Number.isFinite(validationMAE) ? ` En 24 ejemplos nuevos, se desvió ${validationMAE < .0001 ? 'menos de 0.0001' : validationMAE.toFixed(4)} en promedio.` : '';
  return `${partial ? 'Resultado parcial. ' : ''}Para esta suma, la predicción se aleja ${difference} del resultado exacto.${evaluation}`;
}
