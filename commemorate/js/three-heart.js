/* ============================================================
   3D 背景：Three.js 星空 + 粒子爱心
   CDN 加载失败或 WebGL 不可用时，自动降级为 2D 星空。
   ============================================================ */
(function () {
  "use strict";
  var canvasEl = document.getElementById("bg3d");

  if (!window.THREE) {
    if (window.FX && window.FX.startStarFallback) window.FX.startStarFallback(canvasEl);
    return;
  }

  try {
    var isMobile = window.matchMedia("(max-width: 768px)").matches;
    var renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
    camera.position.set(0, 0, isMobile ? 34 : 28);

    /* ---------- 柔光圆点贴图：让所有粒子呈圆形光晕而非方块 ---------- */
    var dotTex = (function makeDotTexture() {
      var c = document.createElement("canvas");
      c.width = c.height = 64;
      var g = c.getContext("2d");
      var grad = g.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.3, "rgba(255,255,255,0.9)");
      grad.addColorStop(0.7, "rgba(255,255,255,0.22)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();

    /* ---------- 星空（两层，视差旋转） ---------- */
    function makeStars(n, rMin, rMax, size, opacity) {
      var geo = new THREE.BufferGeometry();
      var pos = new Float32Array(n * 3);
      var col = new Float32Array(n * 3);
      var palette = [new THREE.Color(0xdfe9ff), new THREE.Color(0x9ad7ff), new THREE.Color(0xffb1c3), new THREE.Color(0xffd9a0)];
      for (var i = 0; i < n; i++) {
        // 球壳分布
        var r = rMin + Math.random() * (rMax - rMin);
        var th = Math.random() * Math.PI * 2;
        var ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph);
        var c = palette[(Math.random() * palette.length) | 0];
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      var mat = new THREE.PointsMaterial({
        size: size, vertexColors: true, transparent: true, opacity: opacity,
        sizeAttenuation: true, depthWrite: false, map: dotTex,
        blending: THREE.AdditiveBlending
      });
      return new THREE.Points(geo, mat);
    }

    var starsFar = makeStars(isMobile ? 700 : 1500, 60, 160, 1.0, 0.85);
    var starsNear = makeStars(isMobile ? 220 : 460, 34, 80, 1.7, 0.75);
    scene.add(starsFar);
    scene.add(starsNear);

    /* ---------- 3D 粒子爱心 ----------
       轮廓按弧长均匀采样，内部用隐式方程均匀填充（FX.heartInside），
       55% 粒子勾轮廓 + 45% 填充内部，形成有体积的心。 */
    var heartN = isMobile ? 2600 : 5400;
    var s = isMobile ? 0.44 : 0.58;           // 整体缩放
    var outlinePts = FX.heartOutline(Math.floor(heartN * 0.55));
    var insidePts = FX.heartInside(heartN - outlinePts.length);
    var positions = new Float32Array(heartN * 3);
    var colors = new Float32Array(heartN * 3);
    var pink = new THREE.Color(0xff6b9d);
    var violet = new THREE.Color(0x9f7bff);
    var sparkle = new THREE.Color(0xffe0ec);

    for (var i = 0; i < heartN; i++) {
      var p = i < outlinePts.length ? outlinePts[i] : insidePts[i - outlinePts.length];
      var isOutline = i < outlinePts.length;
      positions[i * 3] = p.x * s;
      positions[i * 3 + 1] = p.y * s;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.6 * (isOutline ? 1 : 0.7);
      // 颜色：按 z 由粉到紫渐变，混入 4% 高亮闪点
      var zn = (positions[i * 3 + 2] + 1.3) / 2.6;
      var cc = pink.clone().lerp(violet, Math.min(1, Math.abs(zn)));
      if (Math.random() < 0.04) cc = sparkle;
      colors[i * 3] = cc.r; colors[i * 3 + 1] = cc.g; colors[i * 3 + 2] = cc.b;
    }

    var heartGeo = new THREE.BufferGeometry();
    heartGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    heartGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    var heartMat = new THREE.PointsMaterial({
      size: isMobile ? 0.15 : 0.13, vertexColors: true, transparent: true,
      opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
      sizeAttenuation: true, map: dotTex
    });
    var heart = new THREE.Points(heartGeo, heartMat);
    scene.add(heart);

    /* ---------- 交互状态 ---------- */
    var scrollY = 0, mouseX = 0, mouseY = 0, pulse = 1, targetOpacity = 1;
    window.addEventListener("scroll", function () { scrollY = window.scrollY || 0; }, { passive: true });
    window.addEventListener("pointermove", function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();

    var hidden = false;
    document.addEventListener("visibilitychange", function () { hidden = document.hidden; });

    var clock = new THREE.Clock();
    (function tick() {
      requestAnimationFrame(tick);
      if (hidden) return;
      var el = clock.getElapsedTime();

      starsFar.rotation.y = el * 0.006;
      starsNear.rotation.y = el * 0.011;
      starsNear.position.y = scrollY * 0.0006;

      heart.rotation.y += 0.0032;
      heart.rotation.z = Math.sin(el * 0.5) * 0.05;
      pulse += (1 - pulse) * 0.055;
      var sc = pulse;
      heart.scale.set(sc, sc, sc);

      // 随页面滚动：爱心淡出上移，相机轻微视差
      var fade = Math.max(0, Math.min(1, 1 - scrollY / (window.innerHeight * 0.9)));
      heartMat.opacity = 0.95 * fade;
      heart.position.y = fade * 3 - 3 + Math.sin(el * 0.8) * 0.35;
      camera.position.x = mouseX * 1.4;
      camera.position.y = -scrollY * 0.0035 + mouseY * -0.6;

      renderer.render(scene, camera);
    })();

    window.Heart3D = {
      pulse: function () { pulse = 1.35; }
    };
  } catch (e) {
    // WebGL 初始化失败 → 2D 星空兜底
    if (window.FX && window.FX.startStarFallback) window.FX.startStarFallback(canvasEl);
  }
})();
