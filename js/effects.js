/* effects.js - partikel, awan, latar (scenery), suara (WebAudio) */
(function (g) {
  const P = g.PA.Physics, W = P.W, GY = P.GROUND, R = Math.random;
  class Particles {
    constructor() { this.l = []; }
    add(p) { p = Object.assign({ g: 0, size: 4, vx: 0, vy: 0, kind: 'spark', color: '#fff', life: 1, age: 0 }, p); this.l.push(p); }
    burst(x, y, n, cols, sp, life, gr = 600) {
      for (let i = 0; i < n; i++) { const a = R() * 6.283, s = sp * (.3 + R() * .7);
        this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: gr, life: life * (.6 + R() * .6), size: 2 + R() * 4, color: cols[i % cols.length] }); }
    }
    smoke(x, y, n, dx = 0) { for (let i = 0; i < n; i++) this.add({ kind: 'smoke', x, y, vx: dx * (20 + R() * 60) + (R() - .5) * 50, vy: -20 - R() * 50, life: .8 + R() * .6, size: 8 + R() * 8 }); }
    ring(x, y, r) { this.add({ kind: 'ring', x, y, size: r, life: .35 }); }
    confetti() { const c = ['#ffb703', '#fb8500', '#ef476f', '#06d6a0', '#118ab2', '#fff']; for (let i = 0; i < 90; i++) this.add({ x: R() * W, y: -20, vx: (R() - .5) * 120, vy: 80 + R() * 200, g: 140, life: 3, size: 5 + R() * 4, color: c[i % 6] }); }
    update(dt) {
      for (const p of this.l) { p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'smoke') p.vx *= .98; }
      this.l = this.l.filter(p => p.age < p.life);
    }
    draw(c) {
      for (const p of this.l) {
        const k = p.age / p.life;
        if (p.kind === 'smoke') { c.fillStyle = `rgba(238,238,238,${(1 - k) * .55})`; c.beginPath(); c.arc(p.x, p.y, p.size + k * 22, 0, 7); c.fill(); }
        else if (p.kind === 'ring') { c.strokeStyle = `rgba(255,210,100,${1 - k})`; c.lineWidth = 7 * (1 - k); c.beginPath(); c.arc(p.x, p.y, p.size * k, 0, 7); c.stroke(); }
        else { c.globalAlpha = 1 - k * k; c.fillStyle = p.color; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); c.globalAlpha = 1; }
      }
    }
  }
  class Clouds {
    constructor() { this.l = Array.from({ length: 6 }, (_, i) => ({ x: i * 220 + R() * 100, y: 40 + R() * 140, s: .6 + R() * .8, v: 6 + R() * 10 })); }
    update(dt) { for (const c of this.l) { c.x += c.v * dt; if (c.x > W + 150) c.x = -150; } }
    draw(c) {
      c.fillStyle = 'rgba(255,255,255,.88)';
      for (const k of this.l) [[0, 0, 30], [34, -12, 38], [72, 0, 30], [36, 8, 34]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(k.x + dx * k.s, k.y + dy * k.s, r * k.s, 0, 7); c.fill(); });
    }
  }
  // Latar statis dirender sekali ke canvas offscreen: langit + lapisan darat
  class Scenery {
    constructor() {
      let s = 7; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
      const mk = () => { const e = document.createElement('canvas'); e.width = W; e.height = P.H; return e; };
      this.sky = mk(); this.land = mk();
      let c = this.sky.getContext('2d'), gr = c.createLinearGradient(0, 0, 0, GY);
      gr.addColorStop(0, '#2c7fd1'); gr.addColorStop(.6, '#7cc4f2'); gr.addColorStop(1, '#dff3ff');
      c.fillStyle = gr; c.fillRect(0, 0, W, P.H);
      gr = c.createRadialGradient(960, 120, 10, 960, 120, 300); gr.addColorStop(0, 'rgba(255,248,200,.85)'); gr.addColorStop(1, 'rgba(255,248,200,0)');
      c.fillStyle = gr; c.fillRect(0, 0, W, P.H);
      c.fillStyle = '#fffbe0'; c.beginPath(); c.arc(960, 120, 44, 0, 7); c.fill();
      c = this.land.getContext('2d');
      const ridge = (top, bot, base, amp, f1, f2, ph) => {
        const gg = c.createLinearGradient(0, base - amp, 0, base); gg.addColorStop(0, top); gg.addColorStop(1, bot);
        c.fillStyle = gg; c.beginPath(); c.moveTo(0, GY);
        for (let x = 0; x <= W; x += 8) c.lineTo(x, base - amp * (.5 * Math.abs(Math.sin(x * f1 + ph)) + .3 * Math.sin(x * f2 + ph * 2) + .4));
        c.lineTo(W, GY); c.fill();
      };
      ridge('#8fb0d8', '#d2e8f7', 440, 190, .004, .011, 1);
      ridge('#6f9fc2', '#a9d0d4', 470, 140, .006, .017, 3);
      ridge('#86c474', '#6fb366', 505, 50, .005, .013, 5);
      ridge('#5fa35a', '#4f9150', 520, 34, .008, .02, 2);
      const pine = (x, h) => {
        c.fillStyle = 'rgba(20,50,30,.25)'; c.beginPath(); c.ellipse(x - h * .3, GY - 2, h * .35, 5, 0, 0, 7); c.fill();
        c.fillStyle = '#5a3d27'; c.fillRect(x - 3, GY - h * .25, 6, h * .25);
        for (let i = 0; i < 3; i++) { const w = h * (.38 - i * .08), y = GY - h * .2 - i * h * .25;
          c.fillStyle = i % 2 ? '#2f7a4a' : '#256a40'; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h * .38); c.lineTo(x + w, y); c.fill(); }
      };
      [40, 215, 300, 440, 575, 760, 880, 1010, 1140].forEach((x, i) => pine(x, 70 + (i * 37 % 40)));
      gr = c.createLinearGradient(0, GY, 0, P.H); gr.addColorStop(0, '#78c14f'); gr.addColorStop(.12, '#5aa545'); gr.addColorStop(.13, '#7a5636'); gr.addColorStop(1, '#4b3321');
      c.fillStyle = gr; c.fillRect(0, GY, W, P.H - GY);
      c.fillStyle = '#9ddc6b'; c.fillRect(0, GY, W, 5);
      for (let i = 0; i < 70; i++) { const x = rnd() * W, y = GY + 3 + rnd() * 9; c.fillStyle = ['#c2f08c', '#ffd24a', '#fff'][i % 3]; c.fillRect(x, y, 3, 3); }
      c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 30; i++) c.fillRect(rnd() * W, GY + 30 + rnd() * 45, 20 + rnd() * 30, 3);
    }
  }
  const Sound = {
    on: true, ac: null,
    init() { if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (this.ac && this.ac.state === 'suspended') this.ac.resume(); },
    tone(f, d, type = 'square', v = .12, slide = 0) {
      if (!this.on || !this.ac) return; const a = this.ac, o = a.createOscillator(), gn = a.createGain(), t = a.currentTime;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
      gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(gn).connect(a.destination); o.start(t); o.stop(t + d);
    },
    noise(d, v = .3, fc = 800) {
      if (!this.on || !this.ac) return; const a = this.ac, n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), data = b.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = R() * 2 - 1;
      const s = a.createBufferSource(), f = a.createBiquadFilter(), gn = a.createGain(), t = a.currentTime;
      s.buffer = b; f.type = 'lowpass'; f.frequency.value = fc; gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.001, t + d);
      s.connect(f).connect(gn).connect(a.destination); s.start(t);
    },
    shoot() { this.noise(.35, .4, 600); this.tone(140, .25, 'sawtooth', .2, -100); },
    boom() { this.noise(.6, .5, 400); this.tone(90, .4, 'sine', .3, -60); },
    destroy() { this.tone(520, .12, 'square', .1, 300); setTimeout(() => this.tone(780, .15, 'square', .1, 300), 90); },
    click() { this.tone(660, .06, 'triangle', .1); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .2, 'triangle', .15), i * 120)); },
    lose() { this.tone(300, .5, 'sawtooth', .12, -200); }
  };
  g.PA.Effects = { Particles, Clouds, Scenery, Sound };
})(window);
