export class Plane {
  constructor(canvas, onPoint) {
    this.canvas = canvas; this.points = []; this.field = null; this.probe = null;
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      onPoint({ x: (event.clientX - rect.left) / rect.width * 2 - 1, y: 1 - (event.clientY - rect.top) / rect.height * 2 });
    });
  }
  draw() {
    const { canvas, points, field, probe } = this, ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#0c101a'; ctx.fillRect(0, 0, w, h);
    if (field) {
      const n = field.size;
      field.values.forEach((p, i) => { ctx.fillStyle = `rgba(${Math.round(58 + p * 114)},${Math.round(190 - p * 93)},${Math.round(211 + p * 30)},${.13 + Math.abs(p - .5) * .38})`; ctx.fillRect(i % n * w / n, Math.floor(i / n) * h / n, w / n + 1, h / n + 1); });
    }
    for (let i = 1; i < 10; i++) {
      ctx.strokeStyle = i === 5 ? '#c6c7f028' : '#c6c7f00c'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i * w / 10, 0); ctx.lineTo(i * w / 10, h); ctx.moveTo(0, i * h / 10); ctx.lineTo(w, i * h / 10); ctx.stroke();
    }
    points.forEach(p => { ctx.beginPath(); ctx.arc((p.x + 1) / 2 * w, (1 - p.y) / 2 * h, 5, 0, Math.PI * 2); ctx.fillStyle = p.label ? '#ac83f8' : '#58dbed'; ctx.fill(); ctx.strokeStyle = '#0a0d16'; ctx.lineWidth = 1.5; ctx.stroke(); });
    if (this.selection) { const x = (this.selection.x+1)/2*w, y = (1-this.selection.y)/2*h; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x,y,11,0,Math.PI*2); ctx.stroke(); }
    if (probe) { const x = (probe.x + 1) / 2 * w, y = (1 - probe.y) / 2 * h; ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y); ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 16); ctx.stroke(); }
  }
}
