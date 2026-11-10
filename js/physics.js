/* physics.js - fisika proyektil & collision (murni, tanpa DOM, bisa dites di Node) */
(function (g) {
  const W = 1200, H = 600, GROUND = 520, GRAVITY = 900, VMAX = 1100, PROJ_R = 9;
  const CANNON = { x: 120, y: 476, len: 64 };
  const rad = d => d * Math.PI / 180;
  const alive = t => t.state === undefined || t.state === 'alive';

  // Kecepatan awal dari power (0-100%) dan sudut (derajat). Sumbu y layar mengarah ke bawah.
  function velocity(angle, power) {
    const v = VMAX * power / 100, a = rad(angle);
    return { vx: v * Math.cos(a), vy: -v * Math.sin(a) };
  }
  function muzzle(angle) {
    const a = rad(angle);
    return { x: CANNON.x + Math.cos(a) * CANNON.len, y: CANNON.y - Math.sin(a) * CANNON.len };
  }
  // Posisi analitik: x = x0 + vx t ; y = y0 + vy t + 1/2 g t^2  (dipakai trajectory preview)
  function pointAt(x0, y0, vx, vy, t) {
    return { x: x0 + vx * t, y: y0 + vy * t + 0.5 * GRAVITY * t * t };
  }
  function trajectory(x0, y0, angle, power, n = 60, dt = 0.04, phase = 0) {
    const v = velocity(angle, power), pts = [];
    for (let i = 0; i < n; i++) {
      const p = pointAt(x0, y0, v.vx, v.vy, (i + phase) * dt);
      if (p.y >= GROUND - 2) break;
      pts.push(p);
    }
    return pts;
  }
  // Integrasi per frame (semi-implicit Euler)
  function integrate(p, dt) { p.vy += GRAVITY * dt; p.x += p.vx * dt; p.y += p.vy * dt; }

  function circleCircle(a, b) { const dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r; return dx * dx + dy * dy <= r * r; }
  function circleRect(c, r) {
    const nx = Math.max(r.x, Math.min(c.x, r.x + r.w)), ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
    const dx = c.x - nx, dy = c.y - ny; return dx * dx + dy * dy <= c.r * c.r;
  }
  // Satu langkah simulasi + deteksi tabrakan. Mengembalikan event atau null.
  function stepShot(p, dt, targets, walls) {
    integrate(p, dt);
    for (const w of walls) if (circleRect(p, w)) return { type: 'wall', x: p.x, y: p.y };
    for (const t of targets) if (alive(t) && circleCircle(p, t)) return { type: 'target', x: p.x, y: p.y, target: t };
    if (p.y + p.r >= GROUND) return { type: 'ground', x: p.x, y: GROUND - 2 };
    if (p.x < -60 || p.x > W + 60) return { type: 'out', x: p.x, y: p.y };
    return null;
  }
  function simulateShot(x0, y0, angle, power, targets, walls, dt = 1 / 240) {
    const p = Object.assign({ x: x0, y: y0, r: PROJ_R }, velocity(angle, power));
    for (let i = 0; i < 6000; i++) { const ev = stepShot(p, dt, targets, walls); if (ev) return ev; }
    return { type: 'out', x: p.x, y: p.y };
  }

  g.PA = g.PA || {};
  g.PA.Physics = { W, H, GROUND, GRAVITY, VMAX, PROJ_R, CANNON, velocity, muzzle, pointAt, trajectory,
    integrate, circleCircle, circleRect, stepShot, simulateShot };
  if (typeof module !== 'undefined') module.exports = g.PA.Physics;
})(typeof window !== 'undefined' ? window : globalThis);
