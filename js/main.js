/* main.js - state game, input, loop, render */
(function () {
  const PA = window.PA, P = PA.Physics, LV = PA.Levels, { Particles, Clouds, Scenery, Sound } = PA.Effects;
  const { Cannon, Target, drawWall } = PA;
  const $ = id => document.getElementById(id), cv = $('cv'), ctx = cv.getContext('2d');
  const cannon = new Cannon(), parts = new Particles(), clouds = new Clouds(), scenery = new Scenery();
  const BLAST = 40;
  const S = { mode: 'menu', lv: 0, score: 0, kills: 0, shots: 0, power: 60, targets: [], walls: [], proj: null,
    after: null, pops: [], t: 0, shake: 0, banner: 0, fade: 0, base: { score: 0, kills: 0 }, hitKills: 0 };
  const show = (id, on) => $(id).classList.toggle('hidden', !on);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function setMode(m) {
    S.mode = m; const inGame = m === 'play' || m === 'paused' || m === 'over';
    show('hud', inGame); show('controls', inGame); show('menu', m === 'menu'); show('pause', m === 'paused'); show('result', m === 'over');
  }
  function hud() {
    $('hLevel').textContent = S.lv + 1; $('hScore').textContent = S.score; $('hShots').textContent = S.shots;
    $('hTargets').textContent = S.targets.filter(t => t.state !== 'alive').length + '/' + S.targets.length;
  }
  function setAngle(v) { cannon.angle = clamp(Math.round(v), 0, 90); $('angle').value = cannon.angle; $('angle').style.setProperty('--v', cannon.angle / .9 + '%'); $('vAngle').textContent = cannon.angle + '°'; }
  function setPower(v) { S.power = clamp(Math.round(v), 0, 100); $('power').value = S.power; $('power').style.setProperty('--v', S.power + '%'); $('vPower').textContent = S.power + '%'; }

  function load(i) {
    const d = LV.levels[i]; S.lv = i; S.shots = d.shots; S.targets = d.targets.map(t => new Target(t)); S.walls = d.walls;
    S.proj = null; S.after = null; S.pops = []; S.base = { score: S.score, kills: S.kills }; S.banner = 1.8; S.fade = 1; parts.l.length = 0; hud();
  }
  function start(i) { setMode('play'); load(i); }
  function toMenu() { S.score = 0; S.kills = 0; setMode('menu'); load(0); }

  function shoot() {
    if (S.mode !== 'play' || S.proj || S.after || S.shots <= 0) return;
    S.shots--; const m = cannon.muzzle(), v = P.velocity(cannon.angle, S.power);
    S.proj = { x: m.x, y: m.y, vx: v.vx, vy: v.vy, r: P.PROJ_R, trail: [] };
    cannon.fire(); parts.smoke(m.x, m.y, 10, 1); parts.burst(m.x, m.y, 8, ['#ffd24a', '#ff8a3d'], 260, .3, 0);
    Sound.shoot(); S.shake = 5; S.hitKills = 0; hud();
  }
  function kill(t) {
    t.destroy(); S.kills++; S.hitKills++; const pts = LV.scoreFor(S.shots); S.score += pts;
    parts.burst(t.x, t.y, 28, ['#d94a3d', '#fff', '#ffd24a'], 340, .9); S.pops.push({ x: t.x, y: t.y - 30, text: '+' + pts, t: 0 });
    Sound.destroy(); hud();
  }
  function impact(ev) {
    S.proj = null; const lethal = ev.type === 'target';
    parts.ring(ev.x, ev.y, lethal ? 85 : 50); parts.burst(ev.x, ev.y, lethal ? 24 : 12, ['#ffd24a', '#ff8a3d', '#fff3b0'], 360, .7); parts.smoke(ev.x, ev.y, 6);
    Sound.boom(); S.shake = lethal ? 10 : 5;
    if (lethal) for (const t of S.targets) if (t.state === 'alive' && P.circleCircle({ x: ev.x, y: ev.y, r: BLAST }, t)) kill(t);
    S.after = { t: S.hitKills || S.shots <= 0 ? .8 : .3 };
  }
  function resolve() {
    if (S.targets.every(t => t.state !== 'alive')) { Sound.win(); parts.confetti(); S.after = { t: 1.4, final: 'win' }; }
    else if (S.shots <= 0) { Sound.lose(); S.after = { t: .9, final: 'lose' }; }
  }
  function result(win) {
    setMode('over'); S.win = win; const last = S.lv === LV.levels.length - 1;
    $('rTitle').textContent = win ? (last ? 'ALL LEVELS CLEARED!' : 'LEVEL COMPLETED') : 'GAME OVER';
    $('rScore').textContent = S.score; $('rKills').textContent = (S.kills - S.base.kills) + ' / ' + S.targets.length; $('rTotal').textContent = S.kills;
    $('btnNext').textContent = win ? (last ? 'PLAY AGAIN' : 'NEXT LEVEL') : 'TRY AGAIN';
  }
  function restoreAndStart(i) { S.score = S.base.score; S.kills = S.base.kills; start(i); }

  function update(dt) {
    S.t += dt; clouds.update(dt); parts.update(dt); cannon.update(dt); S.targets.forEach(t => t.update(dt));
    S.shake = Math.max(0, S.shake - dt * 30); S.banner = Math.max(0, S.banner - dt); S.fade = Math.max(0, S.fade - dt * 2);
    S.pops.forEach(p => p.t += dt); S.pops = S.pops.filter(p => p.t < 1.1);
    if (S.mode === 'menu') cannon.angle = 40 + 14 * Math.sin(S.t * .8);
    $('btnShoot').disabled = !!(S.mode !== 'play' || S.proj || S.after);
    const p = S.proj;
    if (p) {
      for (let i = 0; i < 4 && S.proj; i++) { const ev = P.stepShot(p, dt / 4, S.targets, S.walls); if (ev) impact(ev); }
      if (S.proj) { p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 16) p.trail.shift(); }
    }
    if (S.after && (S.after.t -= dt) <= 0) { const a = S.after; S.after = null; a.final ? result(a.final === 'win') : resolve(); }
  }

  function draw() {
    const c = ctx; c.save();
    if (S.shake > 0) c.translate((Math.random() - .5) * S.shake, (Math.random() - .5) * S.shake);
    c.drawImage(scenery.sky, 0, 0); clouds.draw(c); c.drawImage(scenery.land, 0, 0);
    S.walls.forEach(w => drawWall(c, w)); S.targets.forEach(t => t.draw(c)); cannon.draw(c);
    if (S.mode === 'play') {
      const m = cannon.muzzle(), { x, y } = P.CANNON;
      if (!S.proj && !S.after) {                       // trajectory preview (hilang setelah menembak)
        const pts = P.trajectory(m.x, m.y, cannon.angle, S.power, 60, .04, (S.t * 2) % 1);
        pts.forEach((q, i) => { c.globalAlpha = 1 - i / 70; c.fillStyle = '#fff4a8'; c.strokeStyle = 'rgba(15,30,70,.65)'; c.lineWidth = 2;
          c.beginPath(); c.arc(q.x, q.y, 5, 0, 7); c.fill(); c.stroke(); });
        c.globalAlpha = 1;
      }
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.arc(x, y, 96, -cannon.angle * Math.PI / 180, 0); c.stroke();
      c.setLineDash([]); c.fillStyle = '#fff'; c.font = '700 22px "Trebuchet MS",sans-serif'; c.strokeStyle = 'rgba(10,30,60,.7)'; c.lineWidth = 4;
      c.strokeText(cannon.angle + '°', x + 108, y + 6); c.fillText(cannon.angle + '°', x + 108, y + 6);
    }
    const p = S.proj;
    if (p) {
      const h = clamp((P.GROUND - p.y) / 400, 0, 1);
      c.fillStyle = `rgba(20,40,30,${.3 - h * .15})`; c.beginPath(); c.ellipse(p.x, P.GROUND + 4, 10 - h * 4, 3, 0, 0, 7); c.fill();
      p.trail.forEach((q, i) => { c.fillStyle = `rgba(255,220,140,${i / 32})`; c.beginPath(); c.arc(q.x, q.y, 2 + i / 3, 0, 7); c.fill(); });
      const gr = c.createRadialGradient(p.x - 3, p.y - 3, 1, p.x, p.y, p.r); gr.addColorStop(0, '#8a96a6'); gr.addColorStop(1, '#14191f');
      c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
    }
    parts.draw(c);
    c.font = '900 28px "Trebuchet MS",sans-serif'; c.textAlign = 'center';
    S.pops.forEach(q => { c.globalAlpha = 1 - q.t / 1.1; c.fillStyle = '#ffe066'; c.strokeStyle = '#6b3300'; c.lineWidth = 5; c.strokeText(q.text, q.x, q.y - q.t * 50); c.fillText(q.text, q.x, q.y - q.t * 50); });
    c.globalAlpha = 1;
    if (S.mode === 'play' && S.banner > 0) {
      c.globalAlpha = Math.min(1, S.banner); c.fillStyle = '#fff'; c.strokeStyle = 'rgba(10,30,60,.8)'; c.lineWidth = 8;
      c.font = '900 64px "Trebuchet MS",sans-serif'; const t1 = 'LEVEL ' + (S.lv + 1);
      c.strokeText(t1, P.W / 2, 220); c.fillText(t1, P.W / 2, 220);
      c.font = '700 28px "Trebuchet MS",sans-serif'; c.strokeText(LV.levels[S.lv].name, P.W / 2, 262); c.fillText(LV.levels[S.lv].name, P.W / 2, 262); c.globalAlpha = 1;
    }
    c.textAlign = 'start'; c.restore();
    if (S.fade > 0) { c.fillStyle = `rgba(10,24,44,${S.fade})`; c.fillRect(0, 0, P.W, P.H); }   // transisi level
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.033, (now - last) / 1000); last = now;
    if (S.mode !== 'paused') update(dt);
    draw(); requestAnimationFrame(frame);
  }

  // ---- UI wiring ----
  const on = (id, fn) => $(id).addEventListener('click', () => { Sound.init(); Sound.click(); fn(); });
  const syncSound = () => { $('btnSoundM').textContent = 'SOUND: ' + (Sound.on ? 'ON' : 'OFF'); $('btnSoundH').textContent = Sound.on ? '🔊' : '🔇'; };
  const toggleSound = () => { Sound.on = !Sound.on; syncSound(); Sound.click(); };
  on('btnPlay', () => { S.score = 0; S.kills = 0; start(0); });
  on('btnHow', () => show('how', true)); on('btnBack', () => show('how', false));
  $('btnSoundM').addEventListener('click', () => { Sound.init(); toggleSound(); }); $('btnSoundH').addEventListener('click', toggleSound);
  on('btnPause', () => { if (S.mode === 'play') setMode('paused'); });
  on('btnResume', () => setMode('play'));
  on('btnRestart', () => restoreAndStart(S.lv));
  on('btnMenuP', toMenu); on('btnMenuR', toMenu);
  on('btnNext', () => {
    const last = S.lv === LV.levels.length - 1;
    if (S.win && !last) start(S.lv + 1); else if (S.win) { S.score = 0; S.kills = 0; start(0); } else restoreAndStart(S.lv);
  });
  $('btnShoot').addEventListener('click', () => { Sound.init(); shoot(); });
  $('angle').addEventListener('input', e => setAngle(+e.target.value));
  $('power').addEventListener('input', e => setPower(+e.target.value));

  addEventListener('keydown', e => {
    const k = e.key, step = e.shiftKey ? 5 : 1;
    if (S.mode === 'play') {
      const used = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'];
      if (used.includes(k)) { e.preventDefault(); if (document.activeElement) document.activeElement.blur(); }
      if (k === 'ArrowUp') setAngle(cannon.angle + step); else if (k === 'ArrowDown') setAngle(cannon.angle - step);
      else if (k === 'ArrowRight') setPower(S.power + step); else if (k === 'ArrowLeft') setPower(S.power - step);
      else if ((k === ' ' || k === 'Enter') && !e.repeat) { Sound.init(); shoot(); }
      else if (k === 'p' || k === 'P' || k === 'Escape') setMode('paused');
      else if (k === 'r' || k === 'R') restoreAndStart(S.lv);
    } else if (S.mode === 'paused' && (k === 'p' || k === 'P' || k === 'Escape')) setMode('play');
  });

  setAngle(45); setPower(60); syncSound(); toMenu(); S.fade = 0;
  requestAnimationFrame(frame);
  PA.debug = { S, shoot, setAngle, setPower };
})();
