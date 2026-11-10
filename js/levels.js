/* levels.js - data 5 level + rumus skor */
(function (g) {
  const P = g.PA.Physics, G = P.GROUND;
  const T = (x, h) => ({ x, y: G - h, r: 26 });          // target: h = tinggi pusat dari tanah
  const Wl = (x, h, w = 36) => ({ x, y: G - h, w, h });  // dinding penghalang
  const levels = [
    { name: 'Warm Up',        shots: 5, targets: [T(780, 26)], walls: [] },
    { name: 'Double Trouble', shots: 5, targets: [T(600, 26), T(940, 26)], walls: [] },
    { name: 'High Ground',    shots: 6, targets: [T(820, 210), T(1060, 290)], walls: [] },
    { name: 'Behind the Wall',shots: 6, targets: [T(900, 26), T(1070, 26)], walls: [Wl(680, 240)] },
    { name: 'Fortress',       shots: 7, targets: [T(700, 26), T(960, 150), T(1090, 300)], walls: [Wl(520, 150), Wl(830, 280, 40)] }
  ];
  const BASE = 100, BONUS = 50;
  // Bonus: makin banyak sisa tembakan saat target hancur, makin besar poin.
  const scoreFor = shotsLeft => BASE + BONUS * shotsLeft;
  g.PA.Levels = { levels, scoreFor, BASE, BONUS };
  if (typeof module !== 'undefined') module.exports = g.PA.Levels;
})(typeof window !== 'undefined' ? window : globalThis);
