/* cannon.js - meriam: sudut, animasi laras, recoil */
(function (g) {
  const P = g.PA.Physics;
  class Cannon {
    constructor() { this.angle = 45; this.shown = 45; this.recoil = 0; }
    muzzle() { return P.muzzle(this.angle); }
    fire() { this.recoil = 16; this.shown = this.angle; }
    update(dt) { this.shown += (this.angle - this.shown) * Math.min(1, dt * 14); this.recoil = Math.max(0, this.recoil - dt * 60); }
    draw(c) {
      const { x, y, len } = P.CANNON, gy = P.GROUND;
      c.fillStyle = 'rgba(20,40,30,.3)'; c.beginPath(); c.ellipse(x - 6, gy + 4, 56, 8, 0, 0, 7); c.fill();
      c.fillStyle = '#5b3d24'; c.beginPath(); c.moveTo(x - 36, gy - 6); c.lineTo(x - 14, y + 4); c.lineTo(x + 14, y + 4); c.lineTo(x + 36, gy - 6); c.fill();
      c.save(); c.translate(x, y); c.rotate(-this.shown * Math.PI / 180); c.translate(-this.recoil, 0);
      const gr = c.createLinearGradient(0, -13, 0, 13); gr.addColorStop(0, '#7b8a9c'); gr.addColorStop(.5, '#2e3a48'); gr.addColorStop(1, '#1a222c');
      c.fillStyle = gr; c.beginPath(); c.arc(-16, 0, 13, 0, 7); c.fill(); c.fillRect(-16, -12, len + 16, 24);
      c.fillStyle = '#1a222c'; c.fillRect(len - 10, -15, 12, 30);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(-10, -9, len - 14, 4);
      c.restore();
      c.fillStyle = '#7a4e2b'; c.strokeStyle = '#3b2514'; c.lineWidth = 5; c.beginPath(); c.arc(x, y + 18, 26, 0, 7); c.fill(); c.stroke();
      c.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(x + Math.cos(a) * 24, y + 18 + Math.sin(a) * 24); c.lineTo(x - Math.cos(a) * 24, y + 18 - Math.sin(a) * 24); c.stroke(); }
      c.fillStyle = '#c9a15b'; c.beginPath(); c.arc(x, y + 18, 7, 0, 7); c.fill();
      c.fillStyle = '#3a4654'; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill();
    }
  }
  g.PA.Cannon = Cannon;
})(window);
