export function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function dataset(kind = 'clusters', seed = 42) {
  const rng = random(seed);
  return Array.from({ length: 80 }, (_, i) => {
    const label = i % 2;
    if (kind === 'rings') {
      const angle = rng() * Math.PI * 2, r = label ? .65 + rng() * .2 : .08 + rng() * .25;
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, label };
    }
    if (kind === 'xor') {
      const x = (rng() < .5 ? -1 : 1) * (.15 + rng() * .7);
      const y = (rng() < .5 ? -1 : 1) * (.15 + rng() * .7);
      return { x, y, label: x * y > 0 ? 1 : 0 };
    }
    return { x: (label ? .45 : -.45) + (rng() - .5) * .65, y: (label ? .3 : -.3) + (rng() - .5) * .8, label };
  });
}
export function validate(points, config) {
  if (!Array.isArray(points) || points.length < 4 || points.length > 500) throw new Error('Agrega entre 4 y 500 ejemplos.');
  if (points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || ![0, 1].includes(p.label))) throw new Error('Los ejemplos no son válidos.');
  if (![0, 1].every(label => points.filter(p => p.label === label).length >= 2)) throw new Error('Necesitas al menos dos ejemplos de cada categoría.');
  if (![4, 8, 16, 32].includes(config.neurons) || !Number.isInteger(config.epochs) || config.epochs < 1 || config.epochs > 1000 || !Number.isFinite(config.rate) || config.rate < .001 || config.rate > .1 || !Number.isInteger(config.seed) || config.seed < 0 || config.seed > 999999) throw new Error('Revisa los parámetros del entrenamiento.');
}
