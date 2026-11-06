/* ============================================================
   特效层：烟花 / 爱心爆裂 / 鼠标拖尾 / 占位插画照片 / 2D 星空兜底
   全部绘制在 #fx 画布上，不拦截任何鼠标操作。
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("fx");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0;
  var parts = [];
  var running = false;
  var COLORS = ["#ff6b9d", "#ffd29d", "#9ad7ff", "#b388ff", "#8fffcc", "#ffb1c3"];

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function ensure() {
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += 1;
      p.x += p.vx; p.y += p.vy;
      if (p.g) p.vy += p.g;
      if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
      var k = 1 - p.life / p.maxLife;
      if (k <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, k) * (p.alpha || 1);
      if (p.type === "heart") {
        drawHeart(ctx, p.x, p.y, p.size * (0.8 + 0.4 * k), p.rot || 0, p.color);
      } else if (p.type === "star") {
        drawStar(ctx, p.x, p.y, p.size * (0.7 + 0.5 * k), p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size * k), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (parts.length) requestAnimationFrame(loop);
    else { running = false; ctx.clearRect(0, 0, W, H); }
  }

  /* ---------- 各种粒子发射器 ---------- */

  // 烟花：一次爆炸（若干火花 + 重力 + 阻力）
  function burst(x, y, color, n) {
    n = n || 46;
    color = color || pick(COLORS);
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI * 2 * i) / n + rand(-0.1, 0.1);
      var sp = rand(1.5, 5.5);
      parts.push({
        type: "dot", x: x, y: y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        g: 0.045, drag: 0.985,
        size: rand(1.2, 2.4), color: Math.random() < 0.75 ? color : pick(COLORS),
        life: 0, maxLife: rand(46, 84)
      });
    }
    ensure();
  }

  // 爱心爆裂：一圈小爱心向外飘散
  function heartBurst(x, y, n) {
    n = n || 14;
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI * 2 * i) / n + rand(-0.15, 0.15);
      var sp = rand(1.2, 3.6);
      parts.push({
        type: "heart", x: x, y: y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.8,
        g: 0.015, drag: 0.97,
        size: rand(7, 15), rot: rand(-0.6, 0.6),
        color: pick(["#ff6b9d", "#ff9ec1", "#ffd29d", "#ff4f87"]),
        life: 0, maxLife: rand(70, 110)
      });
    }
    ensure();
  }

  // 星星爆裂（勾选心愿等小庆祝）
  function starBurst(x, y, n) {
    n = n || 10;
    for (var i = 0; i < n; i++) {
      var ang = rand(0, Math.PI * 2);
      var sp = rand(0.8, 2.6);
      parts.push({
        type: "star", x: x, y: y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.6,
        g: 0.012, drag: 0.975,
        size: rand(3, 6),
        color: pick(COLORS),
        life: 0, maxLife: rand(46, 76)
      });
    }
    ensure();
  }

  // 鼠标拖尾：小爱心 / 小星星缓慢上飘
  var lastTrail = 0;
  function trail(x, y) {
    var now = Date.now();
    if (now - lastTrail < 36) return;
    lastTrail = now;
    parts.push({
      type: Math.random() < 0.5 ? "heart" : "star",
      x: x + rand(-6, 6), y: y + rand(-6, 6),
      vx: rand(-0.3, 0.3), vy: rand(-0.9, -0.3),
      g: 0, drag: 1,
      size: rand(4, 9), rot: rand(-0.5, 0.5),
      color: pick(COLORS), alpha: 0.9,
      life: 0, maxLife: rand(30, 52)
    });
    ensure();
  }

  // 烟花汇演：随机位置连放若干发
  function fireworksShow(durationMs) {
    var end = Date.now() + (durationMs || 2600);
    var timer = setInterval(function () {
      if (Date.now() > end) { clearInterval(timer); return; }
      burst(rand(W * 0.15, W * 0.85), rand(H * 0.12, H * 0.55), pick(COLORS), 40 + (Math.random() * 26 | 0));
    }, 330);
    burst(W * 0.5, H * 0.3, "#ff6b9d", 60);
  }

  /* ---------- 绘图基元 ---------- */
  function drawHeart(c, x, y, s, rot, color) {
    c.save();
    c.translate(x, y); c.rotate(rot || 0); c.scale(s / 16, s / 16);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, 5);
    c.bezierCurveTo(0, 1, -3, -4, -8, -4);
    c.bezierCurveTo(-14, -4, -14, 4, -14, 4);
    c.bezierCurveTo(-14, 9, -8, 14, 0, 19);
    c.bezierCurveTo(8, 14, 14, 9, 14, 4);
    c.bezierCurveTo(14, 4, 14, -4, 8, -4);
    c.bezierCurveTo(3, -4, 0, 1, 0, 5);
    c.fill();
    c.restore();
  }

  function drawStar(c, x, y, s, color) {
    c.save();
    c.translate(x, y);
    c.fillStyle = color;
    c.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
      var a2 = a + Math.PI / 5;
      c.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      c.lineTo(Math.cos(a2) * s * 0.45, Math.sin(a2) * s * 0.45);
    }
    c.closePath(); c.fill();
    c.restore();
  }

  /* ---------- 心形采样工具（3D 爱心 / 开场动画共用） ----------
     轮廓点按弧长均匀采样（避免两瓣顶尖处过密）；
     内部点在包围盒内均匀撒点 + 隐式心形方程 (x²+y²-1)³ - x²y³ ≤ 0 判定，
     避免参数方程缩放填充带来的"中缝"伪影。坐标均为 y 向上、已居中的单位空间。 */
  var HEART_TABLE = null;
  function heartTable() {
    if (HEART_TABLE) return HEART_TABLE;
    var N = 720, pts = [], lens = [0], total = 0;
    for (var i = 0; i <= N; i++) {
      var t = (Math.PI * 2 * i) / N;
      // 原始曲线 y 范围约 [-17, +11.9]，+2.54 使其上下居中（范围约 ±14.5）
      pts.push({
        x: 16 * Math.pow(Math.sin(t), 3),
        y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.54
      });
      if (i > 0) {
        var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
        total += Math.sqrt(dx * dx + dy * dy);
        lens.push(total);
      }
    }
    HEART_TABLE = { pts: pts, lens: lens, total: total };
    return HEART_TABLE;
  }

  function heartOutline(n) {
    var tb = heartTable(), out = [];
    for (var i = 0; i < n; i++) {
      var target = Math.random() * tb.total, lo = 0, hi = tb.lens.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (tb.lens[mid] < target) lo = mid + 1; else hi = mid; }
      var i1 = Math.max(1, lo);
      var p0 = tb.pts[i1 - 1], p1 = tb.pts[i1];
      var seg = (tb.lens[i1] - tb.lens[i1 - 1]) || 1;
      var f = (target - tb.lens[i1 - 1]) / seg;
      out.push({ x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f });
    }
    return out;
  }

  function heartInside(n) {
    // 隐式心形 (x²+y²-1)³ - x²y³ ≤ 0：包围盒 x∈[-1.13,1.13], y∈[-1.0,1.28]（中心 y≈0.14）
    // 非均匀映射到参数心形的包围盒（32 × 28.9），并留 6% 边距确保填充不越过轮廓
    var out = [], guard = 0;
    while (out.length < n && guard < n * 80) {
      guard++;
      var X = Math.random() * 2.34 - 1.17;
      var Y = Math.random() * 2.38 - 1.05;
      var a = X * X + Y * Y - 1;
      if (a * a * a - X * X * Y * Y * Y <= 0) {
        out.push({ x: X * 13.3, y: (Y - 0.14) * 11.6 });
      }
    }
    return out;
  }

  /* ---------- 2D 星空兜底（Three.js 加载失败时使用） ---------- */  function startStarFallback(el) {
    if (!el) return;
    var c2 = el.getContext("2d");
    var stars = [];
    var w, h;
    function init() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      el.width = w * dpr; el.height = h * dpr;
      el.style.width = w + "px"; el.style.height = h + "px";
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.min(260, (w * h) / 5200 | 0);
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: rand(0.4, 1.5), tw: rand(0.5, 2), ph: rand(0, 6.28) });
      }
    }
    init();
    window.addEventListener("resize", init);
    (function draw(t) {
      c2.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = 0.35 + 0.55 * Math.abs(Math.sin(t / 1000 * s.tw + s.ph));
        c2.globalAlpha = a;
        c2.fillStyle = "#dfe9ff";
        c2.beginPath(); c2.arc(s.x, s.y, s.r, 0, Math.PI * 2); c2.fill();
      }
      c2.globalAlpha = 1;
      requestAnimationFrame(draw);
    })(0);
  }

  /* ---------- 占位插画照片生成器 ----------
     没有真实照片时，为每个回忆生成一张和故事线气质匹配的小插画。 */
  var PALETTES = {
    sea:      { sky: ["#0b1e3d", "#1d4e7a", "#3f8fb0"], accent: "#9be2ff", sun: "#ffd9a0", scene: "sea" },
    sunset:   { sky: ["#2b1055", "#7b2d6e", "#ff8e6e"], accent: "#ffc2a0", sun: "#ffd29d", scene: "sea" },
    night:    { sky: ["#050915", "#0b1530", "#182a55"], accent: "#8fb3ff", sun: "#e8f0ff", scene: "city", moon: true },
    city:     { sky: ["#101b3f", "#27356e", "#4a4a8a"], accent: "#ffd28f", sun: "#e8f0ff", scene: "city", moon: true },
    sakura:   { sky: ["#2d1b3d", "#6e3b6e", "#f2a5b6"], accent: "#ffd7e2", sun: "#ffe9f0", scene: "sakura" },
    rose:     { sky: ["#2a0a1e", "#6b1030", "#c22e57"], accent: "#ff9ab3", sun: "#ffc2cf", scene: "rose" },
    firework: { sky: ["#060818", "#101538", "#232a5c"], accent: "#ffd28f", sun: "#fff2c8", scene: "firework" },
    cafe:     { sky: ["#2b1d12", "#6b4a2b", "#d9a45f"], accent: "#ffe0b0", sun: "#ffeacc", scene: "cafe" },
    aurora:   { sky: ["#04101c", "#0b2b3d", "#123a4d"], accent: "#8fffcc", sun: "#e8fff2", scene: "aurora" }
  };
  var photoCache = {};

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makePhoto(seed, paletteName, w, h) {
    var key = seed + "|" + paletteName + "|" + w + "x" + h;
    if (photoCache[key]) return photoCache[key];

    var pal = PALETTES[paletteName] || PALETTES.night;
    var rng = mulberry32(seed * 7919 + 13);
    var cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    var c = cv.getContext("2d");
    var horizon = h * (pal.scene === "sea" ? 0.62 : 0.78);

    // 天空渐变
    var sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(0.55, pal.sky[1]);
    sky.addColorStop(1, pal.sky[2]);
    c.fillStyle = sky; c.fillRect(0, 0, w, h);

    // 星点
    var starN = (w * h) / 2200 | 0;
    for (var i = 0; i < starN; i++) {
      var sy = rng() * horizon;
      c.globalAlpha = rng() * 0.8;
      c.fillStyle = "#eef4ff";
      c.beginPath(); c.arc(rng() * w, sy, rng() * 1.1 + 0.3, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // 月亮 / 太阳
    var sx = w * (0.2 + rng() * 0.6), sY = h * (pal.scene === "sea" ? 0.38 : 0.22), sR = w * 0.075;
    var halo = c.createRadialGradient(sx, sY, 0, sx, sY, sR * 3.2);
    halo.addColorStop(0, pal.sun + "cc"); halo.addColorStop(1, "transparent");
    c.fillStyle = halo; c.beginPath(); c.arc(sx, sY, sR * 3.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = pal.sun; c.beginPath(); c.arc(sx, sY, sR, 0, Math.PI * 2); c.fill();

    // 各场景
    if (pal.scene === "sea") {
      var sea = c.createLinearGradient(0, horizon, 0, h);
      sea.addColorStop(0, pal.sky[1]); sea.addColorStop(1, pal.sky[0]);
      c.fillStyle = sea; c.fillRect(0, horizon, w, h - horizon);
      c.strokeStyle = pal.accent; c.globalAlpha = 0.35;
      for (var wv = 0; wv < 9; wv++) {
        var wy = horizon + 8 + (h - horizon) * (wv / 9) + rng() * 6;
        c.lineWidth = 1; c.beginPath();
        c.moveTo(w * 0.1 * rng(), wy);
        for (var px = 0; px <= w; px += 12) c.lineTo(px, wy + Math.sin(px / 26 + wv) * 2.2);
        c.stroke();
      }
      // 太阳倒影：水面上渐隐的碎光
      c.fillStyle = pal.sun;
      for (var ri = 0; ri < 9; ri++) {
        var ry = horizon + 6 + (ri * (h - horizon) * 0.45) / 9;
        var rw = sR * (1.7 - ri * 0.13) * (0.5 + rng() * 0.9);
        c.globalAlpha = 0.26 * (1 - ri / 9);
        c.fillRect(sx - rw / 2 + (rng() - 0.5) * 8, ry, rw, 1.6);
      }
      c.globalAlpha = 1;
      // 海鸥
      c.globalAlpha = 0.8; c.strokeStyle = "#e8f0ff"; c.lineWidth = 1.4;
      for (var g = 0; g < 3; g++) {
        var gx = w * (0.25 + rng() * 0.5), gy = h * (0.2 + rng() * 0.2), gs = 5 + rng() * 4;
        c.beginPath();
        c.moveTo(gx - gs, gy); c.quadraticCurveTo(gx - gs / 2, gy - gs / 2, gx, gy);
        c.quadraticCurveTo(gx + gs / 2, gy - gs / 2, gx + gs, gy);
        c.stroke();
      }
      c.globalAlpha = 1;
    } else if (pal.scene === "city") {
      var bw = w / 9;
      for (var b = 0; b < 9; b++) {
        var bh = horizon * (0.28 + rng() * 0.62);
        var bx = b * bw - bw * 0.15;
        c.fillStyle = "rgba(6, 9, 26, 0.92)";
        c.fillRect(bx, horizon - bh, bw * 1.05, bh + (h - horizon));
        // 窗户
        for (var wy2 = horizon - bh + 8; wy2 < horizon - 6; wy2 += 12) {
          for (var wx = bx + 4; wx < bx + bw; wx += 10) {
            if (rng() < 0.34) {
              c.fillStyle = rng() < 0.75 ? pal.accent : "#9be2ff";
              c.globalAlpha = 0.5 + rng() * 0.5;
              c.fillRect(wx, wy2, 3.2, 4.4);
            }
          }
        }
      }
      c.globalAlpha = 1;
    } else if (pal.scene === "sakura") {
      // 花枝
      c.strokeStyle = "#3a2233"; c.lineWidth = w * 0.012;
      c.beginPath(); c.moveTo(-10, h * 0.16);
      c.bezierCurveTo(w * 0.3, h * 0.22, w * 0.5, h * 0.1, w * 0.82, h * 0.16);
      c.stroke();
      c.lineWidth = w * 0.007;
      for (var br = 0; br < 4; br++) {
        var bx2 = w * (0.2 + br * 0.18);
        c.beginPath(); c.moveTo(bx2, h * (0.16 + rng() * 0.04));
        c.quadraticCurveTo(bx2 + w * 0.04, h * 0.1, bx2 + w * 0.1, h * (0.12 + rng() * 0.06));
        c.stroke();
      }
      // 花朵
      for (var fl = 0; fl < 90; fl++) {
        var fx = w * (0.05 + rng() * 0.9), fy = h * (0.1 + rng() * 0.28);
        c.fillStyle = fl % 3 === 0 ? "#ffd7e2" : "#f6b6cb";
        c.globalAlpha = 0.85;
        for (var pt = 0; pt < 5; pt++) {
          var pa = (Math.PI * 2 * pt) / 5;
          c.beginPath(); c.arc(fx + Math.cos(pa) * 3.4, fy + Math.sin(pa) * 3.4, 2.6, 0, Math.PI * 2); c.fill();
        }
      }
      // 飘落花瓣
      for (var pe = 0; pe < 26; pe++) {
        c.globalAlpha = 0.5 + rng() * 0.5;
        c.fillStyle = "#ffd7e2";
        c.save();
        c.translate(rng() * w, h * (0.4 + rng() * 0.55));
        c.rotate(rng() * 6.28); c.scale(1, 0.55);
        c.beginPath(); c.arc(0, 0, 2.6 + rng() * 2.4, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      c.globalAlpha = 1;
    } else if (pal.scene === "rose") {
      for (var rs = 0; rs < 40; rs++) {
        c.globalAlpha = 0.4 + rng() * 0.6;
        c.fillStyle = rs % 2 ? "#ff9ab3" : "#e8486f";
        c.save();
        c.translate(rng() * w, h * (0.35 + rng() * 0.6));
        c.rotate(rng() * 6.28); c.scale(1, 0.5);
        c.beginPath(); c.arc(0, 0, 4 + rng() * 9, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      c.globalAlpha = 0.9;
      var rg = c.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, w * 0.4);
      rg.addColorStop(0, "rgba(255,120,160,0.5)"); rg.addColorStop(1, "transparent");
      c.fillStyle = rg; c.fillRect(0, 0, w, h);
      c.globalAlpha = 1;
    } else if (pal.scene === "firework") {
      // 城市剪影
      for (var sb = 0; sb < 10; sb++) {
        var sbh = h * (0.06 + rng() * 0.14);
        c.fillStyle = "rgba(4, 5, 16, 0.95)";
        c.fillRect(sb * (w / 10) - 2, h - sbh, w / 10 + 4, sbh);
      }
      // 三簇烟花
      var fwColors = ["#ff6b9d", "#ffd29d", "#9ad7ff", "#b388ff"];
      for (var fk = 0; fk < 3; fk++) {
        var fx2 = w * (0.25 + rng() * 0.5), fy2 = h * (0.2 + rng() * 0.25);
        var fc = fwColors[(rng() * fwColors.length) | 0];
        var rays = 18 + (rng() * 10 | 0);
        for (var r2 = 0; r2 < rays; r2++) {
          var ra = (Math.PI * 2 * r2) / rays;
          var len = w * (0.08 + rng() * 0.14);
          c.strokeStyle = fc; c.globalAlpha = 0.15 + rng() * 0.6;
          c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(fx2, fy2);
          c.lineTo(fx2 + Math.cos(ra) * len, fy2 + Math.sin(ra) * len);
          c.stroke();
          c.fillStyle = fc;
          c.beginPath(); c.arc(fx2 + Math.cos(ra) * len, fy2 + Math.sin(ra) * len, 1.8, 0, Math.PI * 2); c.fill();
        }
      }
      c.globalAlpha = 1;
    } else if (pal.scene === "cafe") {
      // 暖光光斑
      for (var bo = 0; bo < 16; bo++) {
        var bx3 = rng() * w, by3 = h * (0.15 + rng() * 0.5), br2 = w * (0.03 + rng() * 0.08);
        var bg = c.createRadialGradient(bx3, by3, 0, bx3, by3, br2);
        bg.addColorStop(0, "rgba(255, 214, 165, 0.4)"); bg.addColorStop(1, "transparent");
        c.fillStyle = bg;
        c.beginPath(); c.arc(bx3, by3, br2, 0, Math.PI * 2); c.fill();
      }
      // 两颗小爱心
      c.globalAlpha = 0.85;
      fxDrawHeartStatic(c, w * 0.32, h * 0.66, w * 0.09, "#ff8aa5");
      fxDrawHeartStatic(c, w * 0.62, h * 0.72, w * 0.06, "#ffd0a8");
      c.globalAlpha = 1;
    } else if (pal.scene === "aurora") {
      var bands = [["#57e6a0", 0.5], ["#6fd4e0", 0.35], ["#b388ff", 0.3]];
      for (var bd = 0; bd < bands.length; bd++) {
        c.globalAlpha = bands[bd][1];
        c.fillStyle = bands[bd][0];
        c.beginPath();
        c.moveTo(-20, h * 0.18);
        for (var ax = 0; ax <= w + 20; ax += 16) {
          c.lineTo(ax, h * 0.18 + Math.sin(ax / 90 + bd * 1.6) * h * 0.09 + bd * h * 0.06);
        }
        for (var ax2 = w + 20; ax2 >= -20; ax2 -= 16) {
          c.lineTo(ax2, h * 0.46 + Math.sin(ax2 / 70 + bd) * h * 0.08 + bd * h * 0.06);
        }
        c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
      // 远山
      c.fillStyle = "rgba(3, 10, 18, 0.9)";
      c.beginPath(); c.moveTo(0, h);
      c.lineTo(0, h * 0.82);
      c.lineTo(w * 0.3, h * 0.66); c.lineTo(w * 0.52, h * 0.8);
      c.lineTo(w * 0.74, h * 0.6); c.lineTo(w, h * 0.8);
      c.lineTo(w, h); c.closePath(); c.fill();
    }

    // 暗角
    var vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "transparent"); vg.addColorStop(1, "rgba(0,0,6,0.5)");
    c.fillStyle = vg; c.fillRect(0, 0, w, h);

    var url = cv.toDataURL("image/jpeg", 0.86);
    photoCache[key] = url;
    return url;
  }

  function fxDrawHeartStatic(c, x, y, s, color) {
    c.save();
    c.translate(x, y); c.scale(s / 16, s / 16);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, 5);
    c.bezierCurveTo(0, 1, -3, -4, -8, -4);
    c.bezierCurveTo(-14, -4, -14, 4, -14, 4);
    c.bezierCurveTo(-14, 9, -8, 14, 0, 19);
    c.bezierCurveTo(8, 14, 14, 9, 14, 4);
    c.bezierCurveTo(14, 4, 14, -4, 8, -4);
    c.bezierCurveTo(3, -4, 0, 1, 0, 5);
    c.fill();
    c.restore();
  }

  // 把照片挂到 img 上：真实文件存在就用真照片，否则自动用占位插画
  function attachPhoto(img, photo, seed, ratio) {
    var pal = photo.palette || "night";
    var r = ratio || photo.ratio || [3, 4];
    img.addEventListener("error", function handle() {
      img.removeEventListener("error", handle);
      img.src = makePhoto(seed, pal, 640, Math.round(640 * r[1] / r[0]));
    });
    if (photo.src) img.src = photo.src;
    else img.src = makePhoto(seed, pal, 640, Math.round(640 * r[1] / r[0]));
  }

  window.FX = {
    burst: burst,
    heartBurst: heartBurst,
    starBurst: starBurst,
    trail: trail,
    fireworksShow: fireworksShow,
    startStarFallback: startStarFallback,
    makePhoto: makePhoto,
    attachPhoto: attachPhoto,
    heartOutline: heartOutline,
    heartInside: heartInside,
    COLORS: COLORS
  };
})();
