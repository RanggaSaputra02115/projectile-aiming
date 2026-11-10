# PROJECTILE AIMING: TARGET STRIKE

Game browser 2D (HTML + CSS + JavaScript + Canvas). Tanpa library eksternal, tanpa file aset: semua grafis digambar lewat Canvas dan semua suara disintesis dengan WebAudio, sehingga ukuran proyek hanya puluhan KB.

## Cara menjalankan
Buka `index.html` langsung di browser (desktop atau HP). Tidak perlu instalasi atau server. Semua path bersifat relatif.

## Kontrol
- Mouse/sentuh: slider **Angle** (0–90°) dan **Power** (0–100%), tombol **SHOOT**, **PAUSE**, **SOUND**.
- Keyboard: ↑/↓ angle, ←/→ power (Shift = ×5), Spasi/Enter tembak, P/Esc pause, R ulang level.
- Di HP, putar ke landscape agar arena lebih besar; panel kontrol pindah ke sisi kanan.

## Struktur file
```
projectile-aiming/
├── index.html          struktur halaman, menu, overlay, panel kontrol
├── css/style.css       tampilan, slider besar untuk sentuhan, layout responsif
├── js/
│   ├── physics.js      fisika & collision (murni, tanpa DOM)
│   ├── levels.js       data 5 level + rumus skor
│   ├── targets.js      kelas Target & dinding penghalang
│   ├── cannon.js       meriam: sudut, animasi laras, recoil
│   ├── effects.js      partikel, awan, latar (scenery), suara
│   └── main.js         state game, input, loop, render, UI
├── tests/physics.test.js
└── README.md
```
Skrip dimuat dengan tag `<script>` biasa (bukan ES module) agar bisa dibuka lewat `file://`. Modul berbagi namespace global `PA`.

## Penjelasan file JavaScript
- **physics.js**: kecepatan awal, integrasi gravitasi, trajectory, tabrakan, `stepShot` (satu langkah + deteksi) dan `simulateShot` (simulasi penuh untuk test).
- **levels.js**: 5 level (Warm Up, Double Trouble, High Ground, Behind the Wall, Fortress) dan `scoreFor()`.
- **targets.js**: target bullseye dengan animasi hancur (getar, berputar, mengecil) dan dinding batu.
- **cannon.js**: laras mengikuti sudut dengan easing, recoil saat menembak.
- **effects.js**: partikel (asap, percikan, cincin ledakan, confetti), awan bergerak, langit/gunung/bukit/pohon/tanah yang dirender sekali ke canvas offscreen, dan efek suara.
- **main.js**: state machine (`menu`, `play`, `paused`, `over`), skor, tembakan, level, pause/restart, kontrol, dan render.

## Cara kerja fisika proyektil
Sumbu y layar mengarah ke bawah. Dari `power` (0–100%) dan `angle`:
```
v  = VMAX * power / 100           (VMAX = 1100 px/s)
vx =  v * cos(angle)
vy = -v * sin(angle)
```
Setiap frame (dibagi 4 sub-langkah agar tidak menembus objek), `vy += g*dt` (g = 900 px/s²), lalu `x += vx*dt`, `y += vy*dt` (semi-implicit Euler). Trajectory preview memakai rumus analitik `x = x0 + vx·t`, `y = y0 + vy·t + ½·g·t²` dengan nilai awal yang sama, sehingga cocok dengan gerak aktual (diuji). Preview disembunyikan saat proyektil terbang.

## Cara kerja collision detection
Proyektil berupa lingkaran (r = 9). Urutan pengecekan tiap sub-langkah:
1. **Dinding** (persegi): titik terdekat pada persegi ke pusat lingkaran, tabrakan bila jaraknya ≤ r.
2. **Target** (lingkaran): jarak pusat ≤ jumlah jari-jari.
3. **Tanah**: `y + r ≥ GROUND`.
4. **Keluar arena**: `x` di luar batas layar.

Kena target menimbulkan ledakan berjari-jari 40 px yang menghancurkan target di dalamnya. Menabrak dinding atau tanah hanya menimbulkan ledakan kosmetik.

## Skor
Tiap target hancur = `100 + 50 × sisa tembakan` (bonus lebih besar bila lebih hemat). Semua target hancur = LEVEL COMPLETED. Tembakan habis dan target tersisa = GAME OVER. TRY AGAIN/RESTART mengembalikan skor ke awal level.

## Cara menguji
Test otomatis logika (butuh Node.js):
```
node tests/physics.test.js
```
Isi test: komponen kecepatan, kesesuaian integrasi dengan rumus analitik, pengaruh power dan angle, trajectory, collision, skor, dan **setiap target di semua level dapat dikenai** (brute-force sudut × power).

Checklist manual: menu terbuka; PLAY GAME; slider angle/power mengubah laras dan garis titik; SHOOT mengurangi tembakan; target hancur dan skor bertambah; LEVEL COMPLETED, NEXT LEVEL; GAME OVER, TRY AGAIN; PAUSE/RESUME/RESTART/MAIN MENU; coba di HP (sentuh slider dan tombol, portrait dan landscape).

## Library eksternal
Tidak ada. Musik latar opsional tidak disertakan; efek suara disintesis dengan WebAudio API.
