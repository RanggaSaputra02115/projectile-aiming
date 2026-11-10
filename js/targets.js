/* targets.js - target (bullseye) dan dinding penghalang */
(function (g) {
  const P = g.PA.Physics;
  class Target {
    constructor(d) { Object.assign(this, { x: d.x, y: d.y, r: d.r, state: 'alive', t: 0, bob: Math.random() * 6 }); }
    destroy() { if (this.state === 'alive') { this.state = 'dying'; this.t = 0; } }
    update(dt) { this.bob += dt * 3; if (this.state === 'dying' && (this.t += dt) >= 0.4) this.state = 'dead'; }
    draw(c) {
      if (this.state === 'dead') return;
      const k = this.state === 'dying' ? this.t / 0.4 : 0, gy = P.GROUND;
      c.fillStyle = 'rgba(20,40,30,.28)'; c.beginPath(); c.ellipse(this.x - 10, gy + 4, this.r * 1.1, 6, 0, 0, 7); c.fill();
      if (gy - this.y - this.r > 8) { c.fillStyle = '#6b4a2f'; c.fillRect(this.x - 5, this.y + this.r * .8, 10, gy - this.y - this.r * .8); }
      c.save(); c.translate(this.x, this.y + Math.sin(this.bob) * 1.5);
      if (k) { c.translate(Math.sin(k * 40) * 4, 0); c.rotate(k * 2.2); c.scale(1 - k * .8, 1 - k * .8); c.globalAlpha = 1 - k * .6; }
      [[1, '#d94a3d'], [.75, '#fff'], [.5, '#d94a3d'], [.25, '#fff']].forEach(([f, col]) => {
        c.fillStyle = col; c.beginPath(); c.arc(0, 0, this.r * f, 0, 7); c.fill();
      });
      c.strokeStyle = '#7d1f18'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, this.r, 0, 7); c.stroke();
      c.restore();
    }
  }
  function drawWall(c, w) {
    c.fillStyle = 'rgba(20,40,30,.28)'; c.beginPath(); c.ellipse(w.x + w.w / 2 - 14, P.GROUND + 4, w.w * .9, 6, 0, 0, 7); c.fill();
    const gr = c.createLinearGradient(w.x, 0, w.x + w.w, 0); gr.addColorStop(0, '#a3a9b1'); gr.addColorStop(1, '#6a707a');
    c.fillStyle = gr; c.fillRect(w.x, w.y, w.w, w.h);
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 2;
    for (let y = w.y + 30, i = 0; y < w.y + w.h; y += 30, i++) {
      c.beginPath(); c.moveTo(w.x, y); c.lineTo(w.x + w.w, y);
      const vx = w.x + w.w / (i % 2 ? 3 : 1.5); c.moveTo(vx, y - 30); c.lineTo(vx, y); c.stroke();
    }
    c.fillStyle = '#c0c6ce'; c.fillRect(w.x - 3, w.y - 6, w.w + 6, 8);
  }
  g.PA.Target = Target; g.PA.drawWall = drawWall;
})(window);
