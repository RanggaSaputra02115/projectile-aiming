// Jalankan: node tests/physics.test.js
const assert = require('assert');
require('../js/physics.js'); require('../js/levels.js');
const { Physics: P, Levels: LV } = globalThis.PA;
let n = 0; const t = (name, fn) => { fn(); n++; console.log('  ok  ' + name); };
const near = (a, b, e, m) => assert(Math.abs(a - b) <= e, `${m}: ${a} vs ${b}`);

t('velocity: komponen vx/vy dari sudut & power', () => {
  let v = P.velocity(0, 100); near(v.vx, P.VMAX, 1e-9, 'vx0'); near(v.vy, 0, 1e-9, 'vy0');
  v = P.velocity(90, 50); near(v.vx, 0, 1e-6, 'vx90'); near(v.vy, -P.VMAX / 2, 1e-9, 'vy90');
  v = P.velocity(30, 0); assert.strictEqual(Math.hypot(v.vx, v.vy), 0);
});
t('integrasi per-frame cocok dengan rumus analitik (preview)', () => {
  const v = P.velocity(50, 70), p = { x: 100, y: 400, vx: v.vx, vy: v.vy }, dt = 1 / 480;
  for (let i = 0; i < 480; i++) P.integrate(p, dt);
  const a = P.pointAt(100, 400, v.vx, v.vy, 1); near(p.x, a.x, 1e-6, 'x'); near(p.y, a.y, 3, 'y');
});
t('power lebih besar => jarak lebih jauh', () => {
  let prev = 0;
  for (const pw of [30, 50, 70, 90]) { const m = P.muzzle(45), ev = P.simulateShot(m.x, m.y, 45, pw, [], []); assert(ev.x > prev); prev = ev.x; }
});
t('sudut mengubah hasil (45° terjauh dibanding 15° & 75°)', () => {
  const r = a => { const m = P.muzzle(a); return P.simulateShot(m.x, m.y, a, 60, [], []).x; };
  assert(r(45) > r(15) && r(45) > r(75));
});
t('trajectory preview berakhir di tanah & berubah saat angle/power berubah', () => {
  const m = P.muzzle(45), a = P.trajectory(m.x, m.y, 45, 60), b = P.trajectory(m.x, m.y, 60, 60), c = P.trajectory(m.x, m.y, 45, 80);
  assert(a.length > 5 && a.every(p => p.y < P.GROUND)); assert(a[10].y !== b[10].y && a[10].x !== c[10].x);
});
t('collision circle-circle & circle-rect', () => {
  assert(P.circleCircle({ x: 0, y: 0, r: 10 }, { x: 15, y: 0, r: 10 })); assert(!P.circleCircle({ x: 0, y: 0, r: 5 }, { x: 15, y: 0, r: 5 }));
  assert(P.circleRect({ x: 5, y: 15, r: 6 }, { x: 0, y: 0, w: 10, h: 10 })); assert(!P.circleRect({ x: 30, y: 30, r: 6 }, { x: 0, y: 0, w: 10, h: 10 }));
});
t('tanpa target: proyektil berhenti di tanah', () => {
  const m = P.muzzle(30); assert.strictEqual(P.simulateShot(m.x, m.y, 30, 40, [], []).type, 'ground');
});
t('skor: bonus naik bila sisa tembakan lebih banyak', () => {
  assert(LV.scoreFor(4) > LV.scoreFor(1)); assert.strictEqual(LV.scoreFor(0), LV.BASE);
});
t('minimal 5 level, tiap level punya target dalam arena', () => {
  assert(LV.levels.length >= 5);
  LV.levels.forEach(l => { assert(l.targets.length && l.shots > 0); l.targets.forEach(x => assert(x.x > 0 && x.x < P.W && x.y < P.GROUND)); });
});
t('setiap target di setiap level bisa dikenai langsung (level solvable)', () => {
  LV.levels.forEach((lv, i) => {
    const hits = new Map(lv.targets.map(x => [x, 0]));
    for (let a = 0; a <= 90; a++) for (let pw = 0; pw <= 100; pw++) {
      const m = P.muzzle(a), ev = P.simulateShot(m.x, m.y, a, pw, lv.targets, lv.walls);
      if (ev.type === 'target') hits.set(ev.target, hits.get(ev.target) + 1);
    }
    const counts = [...hits.values()]; console.log(`      level ${i + 1} kombinasi (angle,power) yg mengenai tiap target:`, counts.join(', '));
    counts.forEach(c => assert(c >= 15, `level ${i + 1} terlalu sulit/tidak bisa`));
  });
});
console.log(`\n${n} test lulus`);
