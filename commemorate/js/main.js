/* ============================================================
   主逻辑：开场 → 密码 → 计时/数据 → 时间轴 → 相册 → 地图
          → 心愿 → 情书 → 问答 → 信箱 → 心情 → 海报 → 彩蛋 → 音乐
   依赖：js/data.js (window.SITE)、js/effects.js (window.FX)
   ============================================================ */
(function () {
  "use strict";

  /* ================= 工具 ================= */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };

  function fmtDate(d) { return d.getFullYear() + "." + pad2(d.getMonth() + 1) + "." + pad2(d.getDate()); }
  function dayKey(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }

  var A = SITE.couple.a, B = SITE.couple.b;
  var anniv = new Date(SITE.anniversary);

  /* 把真实照片挂到 img：文件不存在时自动换成交互式占位插画 */
  function photoInto(img, photo, seed, ratio) {
    var pal = (photo && photo.palette) || "night";
    var r = ratio || (photo && photo.ratio) || [3, 4];
    img.onerror = function () {
      img.onerror = null;
      img.src = FX.makePhoto(seed, pal, 640, Math.round(640 * r[1] / r[0]));
    };
    img.src = (photo && photo.src) ? photo.src : FX.makePhoto(seed, pal, 640, Math.round(640 * r[1] / r[0]));
  }

  /* ================= 轻提示 ================= */
  var toastEl = $("#toast"), toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    toastEl.style.animation = "none";
    void toastEl.offsetWidth;
    toastEl.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.add("hidden"); }, 2400);
  }

  /* ================= 基础信息填充 ================= */
  function fillBasics() {
    $("#name-a").textContent = A.name;
    $("#name-b").textContent = B.name;
    $("#name-a2").textContent = A.name;
    $("#name-b2").textContent = B.name;
    $("#sign-a").textContent = A.sign;
    $("#sign-b").textContent = B.sign;
    $("#avatar-a").textContent = A.emoji;
    $("#avatar-b").textContent = B.emoji;
    $("#timer-since").textContent = "SINCE " + fmtDate(anniv) + " " + pad2(anniv.getHours()) + ":" + pad2(anniv.getMinutes());
    $("#gate-hint").textContent = SITE.password.hint || "";
    $("#year").textContent = new Date().getFullYear();
    document.title = A.name + " ❤ " + B.name + " · 我们的宇宙";
    [["letter-from", "letter-to"], ["mb-from", "mb-to"]].forEach(function (pair) {
      var f = $("#" + pair[0]), t = $("#" + pair[1]);
      f.innerHTML = ""; t.innerHTML = "";
      [A, B].forEach(function (p, i) {
        f.appendChild(new Option(p.name, p.name, i === 0, i === 0));
        t.appendChild(new Option(p.name, p.name, i === 1, i === 1));
      });
    });
  }

  /* ================= 浮现动画 ================= */
  function initReveal() {
    $$(".reveal").forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 0.07 + "s";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* ================= 开场动画 ================= */
  var introDone = false;
  function initIntro() {
    var cv = $("#intro-canvas"), c = cv.getContext("2d");
    var W, H, parts = [], ht = null, converged = false, running = true;
    var t0 = performance.now();
    // 支持"减少动态效果"偏好：粒子直接以汇聚完成状态出现
    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) t0 = -1e7;
    var STAR_COLORS = ["#ff6b9d", "#ff9ec1", "#ffd29d", "#b388ff"];

    function heartTargets() {
      var cx = W / 2, cy = H * 0.30;
      var size = Math.min(W * 0.44, H * 0.30, 400) / 32;
      var pts = [];
      FX.heartOutline(150).forEach(function (p) {
        pts.push({ x: cx + p.x * size, y: cy - p.y * size });
      });
      FX.heartInside(90).forEach(function (p) {
        pts.push({ x: cx + p.x * size, y: cy - p.y * size });
      });
      return { pts: pts, cx: cx, cy: cy, size: size };
    }

    function build(fast) {
      ht = heartTargets();
      parts = [];
      for (var i = 0; i < ht.pts.length; i++) {
        parts.push({
          sx: fast ? ht.pts[i].x : Math.random() * W,
          sy: fast ? ht.pts[i].y : Math.random() * H,
          tx: ht.pts[i].x, ty: ht.pts[i].y,
          delay: fast ? 0 : Math.random() * 600,
          r: 0.9 + Math.random() * 1.7,
          color: pick(STAR_COLORS),
          tw: Math.random() * 6.28
        });
      }
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(converged);
    }
    window.addEventListener("resize", resize);
    resize();

    var bgStars = [];
    for (var i = 0; i < 70; i++) {
      bgStars.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.2, tw: Math.random() * 6.28 });
    }

    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      c.clearRect(0, 0, W, H);

      // 背景微星
      c.fillStyle = "#dfe9ff";
      for (var s = 0; s < bgStars.length; s++) {
        var st = bgStars[s];
        c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(now / 900 + st.tw));
        c.beginPath(); c.arc(st.x * W, st.y * H, st.r, 0, 6.283); c.fill();
      }

      // 粒子汇聚成心
      c.globalCompositeOperation = "lighter";
      var el = now - t0, allDone = true;
      for (var p = 0; p < parts.length; p++) {
        var q = parts[p];
        var pr = converged ? 1 : clamp((el - q.delay) / 2100, 0, 1);
        if (pr < 1) allDone = false;
        var ease = 1 - Math.pow(1 - pr, 3);
        var x = q.sx + (q.tx - q.sx) * ease;
        var y = q.sy + (q.ty - q.sy) * ease;
        var twk = 0.5 + 0.5 * Math.sin(now / 380 + q.tw);
        c.globalAlpha = clamp(pr * 2, 0, 1) * (0.55 + 0.45 * twk);
        c.fillStyle = q.color;
        c.beginPath(); c.arc(x, y, q.r, 0, 6.283); c.fill();
      }

      // 汇聚完成 → 心中浮现两人名字缩写
      var ip = clamp((el - 2600) / 800, 0, 1);
      if (ip > 0) {
        var fs = clamp(W * 0.055, 26, 52);
        c.globalAlpha = ip;
        c.font = "700 " + fs + "px 'PingFang SC','Microsoft YaHei',sans-serif";
        c.textAlign = "center"; c.textBaseline = "middle";
        c.shadowColor = "rgba(255,120,170,0.9)"; c.shadowBlur = 26;
        var grad = c.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
        grad.addColorStop(0, "#ff9ec1"); grad.addColorStop(0.5, "#ffd29d"); grad.addColorStop(1, "#9ad7ff");
        c.fillStyle = grad;
        c.fillText(A.initial + " ❤ " + B.initial, ht.cx, ht.cy - ht.size * 2);
        c.shadowBlur = 0;
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";

      if (!converged && allDone && el > 2200) converged = true;
    }
    requestAnimationFrame(frame);

    // 打字机文案
    var line = "欢迎来到只属于我们的宇宙";
    var typedEl = $("#typed"), subEl = $("#intro-sub"), btn = $("#enter-btn");
    var ti = 0;
    var typeTimer = setInterval(function () {
      typedEl.textContent = line.slice(0, ++ti);
      if (ti >= line.length) {
        clearInterval(typeTimer);
        var days = Math.max(1, Math.floor((Date.now() - anniv.getTime()) / 86400000));
        subEl.textContent = "✨ 这里收藏了我们的 " + days + " 天 ✨";
        setTimeout(function () { btn.classList.add("show"); }, 500);
        introDone = true;
      }
    }, 135);

    // 点击空白可跳过打字动画
    $("#intro").addEventListener("click", function (e) {
      if (e.target === btn || btn.contains(e.target)) return;
      if (introDone) return;
      clearInterval(typeTimer);
      typedEl.textContent = line;
      var days = Math.max(1, Math.floor((Date.now() - anniv.getTime()) / 86400000));
      subEl.textContent = "✨ 这里收藏了我们的 " + days + " 天 ✨";
      btn.classList.add("show");
      introDone = true;
    });

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var cx = W / 2, cy = H * 0.3;
      FX.heartBurst(cx, cy, 18);
      FX.burst(cx, cy, "#ff6b9d", 50);
      $("#intro").classList.add("leave");
      setTimeout(function () { running = false; }, 1200);
      if (sessionStorage.getItem("unlocked") === "1") {
        setTimeout(unlockMain, 500);
      } else {
        setTimeout(function () { $("#gate").classList.remove("hidden"); }, 700);
      }
    });
  }

  /* ================= 访问密码 ================= */
  function initGate() {
    var input = $("#pwd-input"), msg = $("#pwd-msg"), card = $("#gate-card");
    var wrongCount = 0;

    function check() {
      var v = (input.value || "").trim();
      var ok = v === SITE.password.value || (SITE.password.also || []).indexOf(v) >= 0;
      if (!v) { msg.textContent = "总要说点什么呀～"; return; }
      if (ok) {
        msg.textContent = "✨ 暗号正确，正在为你开门…";
        FX.heartBurst(window.innerWidth / 2, window.innerHeight / 2, 20);
        FX.fireworksShow(2000);
        sessionStorage.setItem("unlocked", "1");
        setTimeout(function () {
          $("#gate").classList.add("leave");
          setTimeout(function () { $("#gate").classList.add("hidden"); }, 950);
          unlockMain();
        }, 850);
      } else {
        wrongCount++;
        msg.textContent = wrongCount <= 1 ? "暗号不对哦，再想想我们的纪念日 💭"
          : wrongCount <= 3 ? "还是不对…提示一下：" + (SITE.password.hint || "再想想～")
          : "算了，偷看你一眼：是 " + SITE.password.value + " 🤫";
        card.classList.remove("shake");
        void card.offsetWidth;
        card.classList.add("shake");
        input.value = "";
        input.focus();
      }
    }
    $("#pwd-btn").addEventListener("click", check);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
    setTimeout(function () { input.focus(); }, 1200);
  }

  function unlockMain() {
    document.body.classList.remove("locked");
    $("#main").classList.remove("hidden");
    resizeMap();
    MUSIC.start();
  }

  /* ================= 背景音乐（外部文件优先，否则实时生成温柔小曲） ================= */
  var MUSIC = {
    on: false, mode: null, audio: null, ctx: null, master: null, schedTimer: null, genStarted: false,
    btn: null,

    start: function () {
      if (this.on) return;
      this.on = true;
      this.btn.classList.add("playing");
      this.btn.textContent = "🔊";
      var self = this;
      var a = new Audio(SITE.musicFile);
      a.loop = true; a.volume = 0.45;
      var failed = false;
      a.addEventListener("error", function () {
        failed = true;
        if (!self.audio) { self.mode = "gen"; self.startGen(); toast("已开启星空小曲 🎵（放入 assets/music.mp3 可换成你们的歌）"); }
      });
      a.play().then(function () {
        if (failed) return;
        self.audio = a; self.mode = "file";
        toast("背景音乐已开启 🎵");
      }).catch(function () {
        if (!self.audio && !failed) { self.mode = "gen"; self.startGen(); toast("已开启星空小曲 🎵（放入 assets/music.mp3 可换成你们的歌）"); }
      });
    },

    startGen: function () {
      if (this.genStarted) { if (this.ctx) this.ctx.resume(); return; }
      this.genStarted = true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = this.ctx = new AC();
      var master = this.master = ctx.createGain();
      master.gain.value = 0.0;
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2300;
      master.connect(lp); lp.connect(ctx.destination);
      // 简单回声
      var delay = ctx.createDelay(1); delay.delayTime.value = 0.42;
      var fb = ctx.createGain(); fb.gain.value = 0.3;
      var wet = ctx.createGain(); wet.gain.value = 0.35;
      lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);

      master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2);

      var chords = [
        [261.63, 329.63, 392.00, 493.88],
        [196.00, 246.94, 293.66, 392.00],
        [220.00, 261.63, 329.63, 440.00],
        [174.61, 220.00, 261.63, 349.23]
      ];
      var bells = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.5];
      var idx = 0, nextT = ctx.currentTime + 0.15;
      var self = this;

      function padNote(t, f) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.045, t + 1.3);
        g.gain.linearRampToValueAtTime(0.0001, t + 3.9);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 4);
      }
      function arpNote(t, f) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.6);
      }
      function bellNote(t, f) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.035, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 1.7);
      }

      this.schedTimer = setInterval(function () {
        if (document.hidden || !self.on) return;
        while (nextT < ctx.currentTime + 2.5) {
          var ch = chords[idx % chords.length];
          ch.forEach(function (f) { padNote(nextT, f); });
          for (var n = 0; n < 8; n++) {
            arpNote(nextT + n * 0.5, ch[n % 3] * 2);
          }
          if (Math.random() < 0.8) bellNote(nextT + Math.random() * 3.5, pick(bells));
          nextT += 4; idx++;
        }
      }, 900);
    },

    toggle: function () {
      if (!this.on) { this.start(); return; }
      this.on = false;
      this.btn.classList.remove("playing");
      this.btn.textContent = "🔈";
      if (this.mode === "file" && this.audio) this.audio.pause();
      if (this.mode === "gen" && this.ctx) this.ctx.suspend();
      toast("音乐已关闭 🔈");
      // 标记成已初始化但关闭：再次点击只恢复
      var self = this;
      this.start = function () {
        this.on = true;
        this.btn.classList.add("playing");
        this.btn.textContent = "🔊";
        if (this.mode === "file" && this.audio) this.audio.play();
        else if (this.mode === "gen" && this.ctx) this.ctx.resume();
        else { this.on = false; MUSIC.start.call(MUSIC); }
        toast("背景音乐已开启 🎵");
      };
    }
  };

  /* ================= 恋爱计时 ================= */
  function initTimer() {
    function tick() {
      var diff = Date.now() - anniv.getTime();
      if (diff < 0) diff = 0;
      $("#t-d").textContent = Math.floor(diff / 86400000);
      $("#t-h").textContent = pad2(Math.floor(diff / 3600000) % 24);
      $("#t-m").textContent = pad2(Math.floor(diff / 60000) % 60);
      $("#t-s").textContent = pad2(Math.floor(diff / 1000) % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ================= 恋爱数据 + 倒计时 + 每日情话 ================= */
  function loveNumbers() {
    var diff = Math.max(0, Date.now() - anniv.getTime());
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor(diff / 3600000);
    var minutes = Math.floor(diff / 60000);
    var wishes = wishList();
    var doneCount = wishes.list.filter(function (w) { return w.done; }).length;
    return { days: days, hours: hours, minutes: minutes, beats: minutes * 75, photos: SITE.photos.length, cities: SITE.places.length, wishDone: doneCount, wishTotal: wishes.list.length };
  }

  function animateNum(el, target, fmt) {
    var t0 = performance.now(), dur = 1400;
    function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = fmt ? fmt(v) : v.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function fmtCN(n) {
    if (n >= 1e8) return (n / 1e8).toFixed(2) + " 亿";
    if (n >= 1e4) return (n / 1e4).toFixed(1) + " 万";
    return n.toLocaleString();
  }

  function initStats() {
    var grid = $("#stat-grid");
    function render() {
      var n = loveNumbers();
      var cards = [
        { ico: "💗", label: "在一起天数", val: n.days, fmt: null },
        { ico: "⏳", label: "累计小时", val: n.hours, fmt: null },
        { ico: "💓", label: "两颗心一起跳动", val: n.beats, fmt: fmtCN },
        { ico: "📸", label: "收藏的瞬间", val: n.photos, fmt: null },
        { ico: "🧭", label: "一起抵达的城市", val: n.cities, fmt: null },
        { ico: "✅", label: "点亮的心愿", val: n.wishDone, fmt: function (v) { return v + " / " + n.wishTotal; } }
      ];
      grid.innerHTML = "";
      cards.forEach(function (cd) {
        var d = document.createElement("div");
        d.className = "stat-card glass";
        d.innerHTML = '<div class="stat-ico">' + cd.ico + '</div><div class="stat-num">0</div><div class="stat-label">' + cd.label + '</div>';
        grid.appendChild(d);
        animateNum(d.querySelector(".stat-num"), cd.val, cd.fmt);
      });
    }
    render();
    // 心愿变化后刷新
    window.addEventListener("wishchange", render);
  }

  function initCountdowns() {
    var grid = $("#countdown-grid");
    grid.innerHTML = "";
    var today = new Date(); today.setHours(0, 0, 0, 0);
    SITE.countdowns.forEach(function (cd) {
      var target, isRecur = !!cd.recurring;
      if (isRecur) {
        var md = cd.recurring.split("-");
        target = new Date(today.getFullYear(), parseInt(md[0], 10) - 1, parseInt(md[1], 10));
        if (target < today) target.setFullYear(target.getFullYear() + 1);
      } else {
        var p = cd.date.split("-");
        target = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      }
      var left = Math.round((target - today) / 86400000);
      var period = isRecur ? 365 : 60;
      var progress = isRecur ? clamp(1 - left / period, 0, 1) : clamp((60 - left) / 60, 0, 1);
      var dateText = isRecur ? "每年 " + pad2(target.getMonth() + 1) + "." + pad2(target.getDate()) : fmtDate(target);
      var daysHtml = left === 0 ? "就是今天 ✨" : "<b>" + left + "</b><i>天后</i>";

      var d = document.createElement("div");
      d.className = "cd-card glass reveal";
      d.innerHTML =
        '<div class="cd-emoji">' + (cd.emoji || "✨") + '</div>' +
        '<div class="cd-label">' + cd.label + '</div>' +
        '<div class="cd-days">' + daysHtml + '</div>' +
        '<div class="cd-bar"><div style="width:0%"></div></div>' +
        '<span class="cd-date">' + dateText + '</span>';
      grid.appendChild(d);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          d.querySelector(".cd-bar div").style.width = Math.round(progress * 100) + "%";
        });
      });
    });
    // 与 .reveal 观察器衔接：手动补观
    $$("#countdown-grid .reveal").forEach(function (el) { el.classList.add("in"); });
  }

  function initQuote() {
    var now = new Date();
    var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var idx = doy % SITE.quotes.length;
    var el = $("#daily-quote");
    function show() { el.textContent = "「 " + SITE.quotes[idx % SITE.quotes.length] + " 」"; }
    show();
    $("#quote-btn").addEventListener("click", function () {
      idx++;
      show();
      FX.starBurst(window.innerWidth / 2, window.innerHeight / 2, 8);
    });
  }

  /* ================= 回忆时间轴 ================= */
  function initTimeline() {
    var list = $("#timeline-list");
    SITE.events.forEach(function (ev, i) {
      var item = document.createElement("div");
      item.className = "tl-item " + (i % 2 === 0 ? "left" : "right") + " reveal";
      item.innerHTML =
        '<div class="tl-dot"></div>' +
        '<div class="tl-card glass">' +
        '  <div class="tl-photo"><img alt=""><span class="tl-tag">' + (ev.tag || "我们的回忆") + '</span></div>' +
        '  <div class="tl-body">' +
        '    <span class="tl-date">' + ev.date.replace(/-/g, ".") + (ev.city ? " · " + ev.city : "") + '</span>' +
        '    <h3>' + ev.title + '</h3>' +
        '    <p>' + ev.text + '</p>' +
        '  </div>' +
        '</div>';
      list.appendChild(item);
      photoInto(item.querySelector("img"), ev, i + 1, [16, 10]);
    });
  }

  /* ================= 照片墙 + 灯箱 ================= */
  var lbIndex = 0;
  function initGallery() {
    var grid = $("#gallery-grid");
    $("#gal-count").textContent = "共 " + SITE.photos.length + " 张 · 未完待续";
    SITE.photos.forEach(function (ph, i) {
      var fig = document.createElement("figure");
      fig.className = "gal-item reveal";
      fig.innerHTML = '<img alt="' + ph.title + '"><figcaption><b>' + ph.title + '</b><span>' + ph.date + '</span></figcaption>';
      grid.appendChild(fig);
      photoInto(fig.querySelector("img"), ph, 100 + i, ph.ratio);
      fig.addEventListener("click", function () { openLightbox(i); });
    });

    $("#random-btn").addEventListener("click", function (e) {
      var i = (Math.random() * SITE.photos.length) | 0;
      FX.starBurst(e.clientX, e.clientY, 12);
      openLightbox(i);
    });

    $("#lb-close").addEventListener("click", closeLightbox);
    $("#lb-prev").addEventListener("click", function () { openLightbox((lbIndex - 1 + SITE.photos.length) % SITE.photos.length); });
    $("#lb-next").addEventListener("click", function () { openLightbox((lbIndex + 1) % SITE.photos.length); });
    $("#lightbox").addEventListener("click", function (e) { if (e.target === $("#lightbox")) closeLightbox(); });

    // 触屏左右滑动
    var sx = null;
    $("#lightbox").addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    $("#lightbox").addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (dx > 50) openLightbox((lbIndex - 1 + SITE.photos.length) % SITE.photos.length);
      else if (dx < -50) openLightbox((lbIndex + 1) % SITE.photos.length);
      sx = null;
    }, { passive: true });
  }

  function openLightbox(i) {
    lbIndex = i;
    var ph = SITE.photos[i];
    photoInto($("#lb-img"), ph, 100 + i, ph.ratio);
    $("#lb-title").textContent = ph.title;
    $("#lb-date").textContent = ph.date;
    $("#lb-note").textContent = ph.note || "";
    $("#lb-counter").textContent = (i + 1) + " / " + SITE.photos.length;
    $("#lightbox").classList.remove("hidden");
  }
  function closeLightbox() { $("#lightbox").classList.add("hidden"); }

  /* ================= 星图足迹 ================= */
  var mapPlaces = [];
  function resizeMap() {
    var cv = $("#map-canvas");
    var w = cv.clientWidth || cv.parentNode.clientWidth;
    var h = 360;
    if (window.innerWidth <= 768) h = 300; else h = 430;
    cv.style.height = h + "px";
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = w * dpr; cv.height = h * dpr;
    cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    mapPlaces = SITE.places.map(function (p) {
      return {
        d: p,
        x: 50 + ((p.lng - 103) / (124.5 - 103)) * (w - 110),
        y: h - 50 - ((p.lat - 16) / (38.5 - 16)) * (h - 100)
      };
    });
  }

  var mapInView = false, popupOpen = -1;
  function initMap() {
    var cv = $("#map-canvas"), c = cv.getContext("2d");
    var chips = $("#map-chips");

    SITE.places.forEach(function (p, i) {
      var chip = document.createElement("button");
      chip.className = "chip";
      chip.textContent = "📍 " + p.name;
      chip.addEventListener("click", function () { openPlace(i, true); FX.starBurst(window.innerWidth / 2, window.innerHeight / 2, 6); });
      chips.appendChild(chip);
    });

    // 点击画布上的星点
    cv.addEventListener("click", function (e) {
      var r = cv.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      var best = -1, bd = 26;
      mapPlaces.forEach(function (p, i) {
        var d = Math.hypot(p.x - mx, p.y - my);
        if (d < bd) { bd = d; best = i; }
      });
      if (best >= 0) openPlace(best, false);
    });

    new IntersectionObserver(function (ens) {
      ens.forEach(function (en) { mapInView = en.isIntersecting; });
    }, { threshold: 0.05 }).observe($("#map"));

    window.addEventListener("resize", function () { if (!document.getElementById("main").classList.contains("hidden")) resizeMap(); });

    var t = 0;
    (function draw() {
      requestAnimationFrame(draw);
      if (!mapInView) return;
      t += 0.016;
      var w = cv.clientWidth, h = parseFloat(cv.style.height) || 360;
      c.clearRect(0, 0, w, h);

      // 经纬网格
      c.strokeStyle = "rgba(255,255,255,0.05)"; c.lineWidth = 1;
      for (var lg = 105; lg <= 125; lg += 5) {
        var gx = 50 + ((lg - 103) / 21.5) * (w - 110);
        c.beginPath(); c.moveTo(gx, 12); c.lineTo(gx, h - 12); c.stroke();
      }
      for (var lt = 18; lt <= 38; lt += 5) {
        var gy = h - 50 - ((lt - 16) / 22.5) * (h - 100);
        c.beginPath(); c.moveTo(12, gy); c.lineTo(w - 12, gy); c.stroke();
      }

      // 足迹连线（按顺序的发光弧线）
      c.setLineDash([7, 9]);
      c.lineDashOffset = -t * 26;
      for (var i = 0; i < mapPlaces.length - 1; i++) {
        var a = mapPlaces[i], b = mapPlaces[i + 1];
        var mx2 = (a.x + b.x) / 2, my2 = Math.min(a.y, b.y) - Math.abs(a.x - b.x) * 0.18 - 18;
        var grad = c.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, "rgba(255,158,193,0.75)");
        grad.addColorStop(1, "rgba(154,215,255,0.75)");
        c.strokeStyle = grad; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(a.x, a.y);
        c.quadraticCurveTo(mx2, my2, b.x, b.y);
        c.stroke();
      }
      c.setLineDash([]);

      // 城市星点
      mapPlaces.forEach(function (p, i) {
        var pulse = 3 + Math.sin(t * 2.2 + i * 1.3) * 1.1;
        var glow = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
        glow.addColorStop(0, i === popupOpen ? "rgba(255,210,157,0.85)" : "rgba(255,107,157,0.6)");
        glow.addColorStop(1, "transparent");
        c.fillStyle = glow;
        c.beginPath(); c.arc(p.x, p.y, 16, 0, 6.283); c.fill();
        c.fillStyle = i === popupOpen ? "#ffd29d" : "#ff9ec1";
        c.beginPath(); c.arc(p.x, p.y, 3.4, 0, 6.283); c.fill();
        c.fillStyle = "rgba(238,242,255,0.75)";
        c.font = "12px 'PingFang SC','Microsoft YaHei',sans-serif";
        c.textAlign = "center";
        c.fillText(p.d.name, p.x, p.y - 13);
      });
    })();

    $("#pp-close").addEventListener("click", function () { closePlace(); });
  }

  function openPlace(i, center) {
    var p = mapPlaces[i];
    popupOpen = i;
    var pop = $("#place-popup");
    $("#pp-name").textContent = p.d.name;
    $("#pp-date").textContent = p.d.date;
    $("#pp-story").textContent = p.d.story;
    photoInto($("#pp-img"), p.d, 200 + i, [16, 9]);
    pop.classList.remove("hidden");
    var chips = $$("#map-chips .chip");
    chips.forEach(function (ch, k) { ch.classList.toggle("active", k === i); });
    if (!center && window.innerWidth > 768) {
      var wrap = $(".map-wrap");
      var wr = wrap.getBoundingClientRect();
      pop.style.left = clamp(p.x + 18, 10, wr.width - 290) + "px";
      pop.style.top = clamp(p.y - 150, 10, wr.height - 240) + "px";
    } else {
      pop.style.left = ""; pop.style.top = "";
    }
  }
  function closePlace() {
    popupOpen = -1;
    $("#place-popup").classList.add("hidden");
    $$("#map-chips .chip").forEach(function (ch) { ch.classList.remove("active"); });
  }

  /* ================= 心愿清单 ================= */
  // 合并 data.js 里的基础心愿（含 localStorage 勾选状态）和网页上新增的自定义心愿
  function wishList() {
    var st = store.get("our_wishes_v1", { doneMap: {}, custom: [] });
    var list = SITE.wishes.map(function (w, i) {
      return { t: w.t, done: !!(w.done || st.doneMap[i]), baseIndex: i, custom: false };
    });
    (st.custom || []).forEach(function (cw, k) {
      list.push({ t: cw.t, done: !!cw.done, custom: true, customKey: k });
    });
    return { st: st, list: list };
  }

  function initWishes() {
    var listBox = $("#wish-list");
    function render() {
      var w = wishList();
      listBox.innerHTML = "";
      w.list.forEach(function (item, idx) {
        var lab = document.createElement("label");
        lab.className = "wish" + (item.custom ? " custom" : "");
        lab.innerHTML = '<input type="checkbox" data-idx="' + idx + '"' + (item.done ? " checked" : "") + '><span class="box"></span><span class="txt">' + item.t + '</span>';
        listBox.appendChild(lab);
      });
      var done = w.list.filter(function (x) { return x.done; }).length;
      var pct = w.list.length ? Math.round((done / w.list.length) * 100) : 0;
      $("#wish-progress-bar").style.width = pct + "%";
      $("#wish-progress-text").textContent = "已完成 " + done + " / " + w.list.length + " · " + pct + "%";
    }
    render();

    listBox.addEventListener("change", function (e) {
      var inp = e.target;
      if (inp.tagName !== "INPUT") return;
      var idx = parseInt(inp.getAttribute("data-idx"), 10);
      var w = wishList();
      var item = w.list[idx];
      if (item.custom) w.st.custom[item.customKey].done = inp.checked;
      else w.st.doneMap[item.baseIndex] = inp.checked;
      store.set("our_wishes_v1", w.st);
      render(); // 立即刷新进度条
      window.dispatchEvent(new Event("wishchange"));
      if (inp.checked) {
        var r = inp.getBoundingClientRect();
        FX.starBurst(r.left + 10, r.top + 10, 10);
        if (item.t.indexOf("白头偕老") >= 0) { FX.fireworksShow(2400); toast("这条心愿，我们会一起完成的 ❤️"); }
      }
    });

    function addWish() {
      var v = $("#wish-input").value.trim();
      if (!v) { toast("先写下一个心愿吧 ✍️"); return; }
      var st = store.get("our_wishes_v1", { doneMap: {}, custom: [] });
      st.custom = st.custom || [];
      st.custom.push({ t: v, done: false });
      store.set("our_wishes_v1", st);
      $("#wish-input").value = "";
      render();
      toast("心愿已加入清单 ✨");
    }
    $("#wish-add").addEventListener("click", addWish);
    $("#wish-input").addEventListener("keydown", function (e) { if (e.key === "Enter") addWish(); });
  }

  /* ================= 情书留言板 ================= */
  function initLetters() {
    var listBox = $("#letter-list");
    function render() {
      var customs = store.get("our_letters_v1", []);
      listBox.innerHTML = "";
      customs.slice().reverse().forEach(function (L) {
        listBox.appendChild(letterCard(L, true));
      });
      SITE.letters.forEach(function (L) {
        listBox.appendChild(letterCard(L, false));
      });
    }
    function letterCard(L, custom) {
      var d = document.createElement("div");
      d.className = "letter";
      d.innerHTML =
        '<div class="letter-head">💌 来自 ' + L.from + ' → ' + L.to + ' · ' + (L.date || "").replace(/-/g, ".") + '</div>' +
        '<div class="letter-body">' + L.text + '</div>' +
        (custom ? '<button class="letter-del" data-id="' + L.id + '">删除</button>' : "");
      return d;
    }
    render();

    listBox.addEventListener("click", function (e) {
      var t = e.target;
      if (t.classList.contains("letter-del")) {
        var id = t.getAttribute("data-id");
        store.set("our_letters_v1", store.get("our_letters_v1", []).filter(function (L) { return String(L.id) !== String(id); }));
        render();
        toast("这封信已经随风寄走了 🍃");
      }
    });

    $("#letter-send").addEventListener("click", function (e) {
      var text = $("#letter-text").value.trim();
      if (!text) { toast("写点什么再寄出吧 ✍️"); return; }
      var L = {
        id: Date.now() + "_" + ((Math.random() * 1e4) | 0),
        from: $("#letter-from").value, to: $("#letter-to").value,
        date: dayKey(new Date()), text: text
      };
      var arr = store.get("our_letters_v1", []);
      arr.push(L);
      store.set("our_letters_v1", arr);
      $("#letter-text").value = "";
      render();
      FX.heartBurst(e.clientX, e.clientY, 12);
      toast("信已寄出 💌");
    });
  }

  /* ================= 默契问答 ================= */
  function initQuiz() {
    var body = $("#quiz-body");
    var idx = 0, score = 0, maxScore = 0;
    SITE.quiz.forEach(function (q) { maxScore += Math.max.apply(null, q.options.map(function (o) { return o.s; })); });

    function renderQ() {
      var q = SITE.quiz[idx];
      body.innerHTML =
        '<div class="quiz-step">Q' + (idx + 1) + ' · ' + SITE.quiz.length + '</div>' +
        '<h3 class="quiz-q">' + q.q + '</h3>' +
        '<div class="quiz-opts">' + q.options.map(function (o, i) {
          return '<button class="quiz-opt" data-i="' + i + '">' + "ABCDEFG"[i] + ". " + o.t + '</button>';
        }).join("") + '</div>' +
        '<p class="quiz-quip"></p>' +
        '<div class="quiz-next hidden"><button class="btn">' + (idx === SITE.quiz.length - 1 ? "查看默契指数 ✨" : "下一题 →") + '</button></div>';

      body.querySelectorAll(".quiz-opt").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (body.querySelector(".quiz-opt.picked")) return;
          var o = q.options[parseInt(btn.getAttribute("data-i"), 10)];
          btn.classList.add("picked");
          score += o.s;
          body.querySelector(".quiz-quip").textContent = o.quip;
          body.querySelector(".quiz-next").classList.remove("hidden");
        });
      });
      body.querySelector(".quiz-next .btn").addEventListener("click", function () {
        idx++;
        if (idx >= SITE.quiz.length) renderResult(); else renderQ();
      });
    }

    function renderResult() {
      var pct = Math.round((score / maxScore) * 100);
      var tier, line;
      if (pct >= 85) { tier = "宇宙级灵魂伴侣"; line = "你们大概是同一个星云里飘出来的两颗星，连脑电波都在同步闪烁。"; }
      else if (pct >= 60) { tier = "默契满分搭档"; line = "一个眼神就知道对方想吃什么，这种功力不是一天练成的。"; }
      else if (pct >= 35) { tier = "甜蜜升温中"; line = "还有一些小秘密没交换，正好，今晚就拿来下饭。"; }
      else { tier = "刚刚点亮的星球"; line = "没关系，答案不重要——重要的是你们还有一整个未来可以互相了解。"; }
      body.innerHTML =
        '<div class="quiz-step">RESULT</div>' +
        '<div class="quiz-result-num" data-pct="' + pct + '">0%</div>' +
        '<div class="quiz-result-tier">「 ' + tier + ' 」</div>' +
        '<p class="quiz-result-text">' + line + '</p>' +
        '<div class="quiz-next"><button class="btn">再测一次 🔁</button></div>';
      var numEl = body.querySelector(".quiz-result-num");
      animateNum(numEl, pct, function (v) { return v + "%"; });
      FX.fireworksShow(2200);
      body.querySelector(".quiz-next .btn").addEventListener("click", function () {
        idx = 0; score = 0; renderQ();
      });
    }

    renderQ();
  }

  /* ================= 未来信箱 ================= */
  function initMailbox() {
    var listBox = $("#mb-list");
    var dateInput = $("#mb-date");
    var def = new Date(); def.setDate(def.getDate() + 365);
    dateInput.value = dayKey(def);
    dateInput.min = dayKey(new Date());

    function render() {
      var mails = store.get("our_mailbox_v1", []);
      mails.sort(function (a, b) { return a.openDate < b.openDate ? -1 : 1; });
      listBox.innerHTML = "";
      if (!mails.length) {
        var empty = document.createElement("p");
        empty.style.cssText = "text-align:center;color:var(--ink-faint);font-size:13px;margin-top:8px";
        empty.textContent = "信箱还是空的，写第一封寄往未来的信吧 📮";
        listBox.appendChild(empty);
        return;
      }
      mails.forEach(function (M) {
        var openDate = new Date(M.openDate + "T00:00:00");
        var now = new Date(); now.setHours(0, 0, 0, 0);
        var opened = now >= openDate;
        var left = Math.max(0, Math.round((openDate - now) / 86400000));
        var d = document.createElement("div");
        d.className = "letter" + (opened ? "" : " locked");
        d.innerHTML =
          '<div class="letter-head">' + (opened ? "📬 已送达" : "🔒 旅行中") + ' · 来自 ' + M.from + ' → ' + M.to + ' · ' + M.openDate.replace(/-/g, ".") + '</div>' +
          '<div class="letter-body">' + M.text + '</div>' +
          (opened ? "" : '<div class="letter-lock">🔒 还有 <span class="mb-remaining">' + left + '</span> 天开启 · 到时候会提醒你们哦</div>');
        if (!opened) {
          d.addEventListener("click", function () {
            toast("这封信还在时间的路上，剩 " + left + " 天 ⏳");
          });
        }
        listBox.appendChild(d);
      });
    }
    render();

    $("#mb-send").addEventListener("click", function (e) {
      var text = $("#mb-text").value.trim();
      var od = dateInput.value;
      if (!text) { toast("给未来的话还没写呢 ✍️"); return; }
      if (!od) { toast("选一个开启的日期吧 📅"); return; }
      var mails = store.get("our_mailbox_v1", []);
      mails.push({ id: Date.now(), from: $("#mb-from").value, to: $("#mb-to").value, openDate: od, text: text });
      store.set("our_mailbox_v1", mails);
      $("#mb-text").value = "";
      render();
      FX.burst(e.clientX, e.clientY, "#ffd29d", 30);
      toast("已投进未来信箱 📮 我们 " + od.replace(/-/g, ".") + " 见");
    });
  }

  /* ================= 每日心情打卡 ================= */
  function initMood() {
    var btnBox = $("#mood-btns"), strip = $("#mood-strip");
    function render() {
      var moods = store.get("our_mood_v1", {});
      var todayK = dayKey(new Date());
      btnBox.innerHTML = "";
      SITE.moods.forEach(function (m, i) {
        var b = document.createElement("button");
        b.className = "mood-btn" + (moods[todayK] === i ? " active" : "");
        b.textContent = m.emoji;
        b.title = m.label;
        b.addEventListener("click", function (e) {
          moods[todayK] = i;
          store.set("our_mood_v1", moods);
          render();
          FX.starBurst(e.clientX, e.clientY, 8);
          toast("今天的心情是「" + m.label + "」，已经替你记住啦 " + m.emoji);
        });
        btnBox.appendChild(b);
      });
      // 最近 14 天
      strip.innerHTML = "";
      var days = [];
      for (var k = 13; k >= 0; k--) {
        var d = new Date(); d.setDate(d.getDate() - k);
        days.push(d);
      }
      days.forEach(function (d) {
        var k = dayKey(d);
        var cell = document.createElement("div");
        cell.className = "mood-cell" + (k === todayK ? " today" : "");
        var mi = moods[k];
        cell.innerHTML = (mi != null ? SITE.moods[mi].emoji : "·") + "<small>" + (d.getMonth() + 1) + "/" + d.getDate() + "</small>";
        strip.appendChild(cell);
      });
      var total = Object.keys(moods).length;
      $("#mood-count").textContent = "已经一起记录了 " + total + " 天的心情 ✨";
    }
    render();
  }

  /* ================= 恋爱报告海报 ================= */
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawPoster(img) {
    var cv = $("#poster-canvas");
    var c = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    var n = loveNumbers();

    // 背景渐变
    var bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1c1140"); bg.addColorStop(0.5, "#431a52"); bg.addColorStop(1, "#0e1030");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);

    // 星星
    for (var i = 0; i < 150; i++) {
      c.globalAlpha = Math.random() * 0.85;
      c.fillStyle = "#eef4ff";
      var r = Math.random() * 1.4 + 0.3;
      c.beginPath(); c.arc(Math.random() * W, Math.random() * H, r, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1;

    // 大爱心水印
    c.save();
    c.translate(W / 2, 208); c.scale(4.6, 4.6);
    c.globalAlpha = 0.16;
    c.fillStyle = "#ff6b9d";
    c.beginPath();
    c.moveTo(0, 5);
    c.bezierCurveTo(0, 1, -3, -4, -8, -4); c.bezierCurveTo(-14, -4, -14, 4, -14, 4);
    c.bezierCurveTo(-14, 9, -8, 14, 0, 19); c.bezierCurveTo(8, 14, 14, 9, 14, 4);
    c.bezierCurveTo(14, 4, 14, -4, 8, -4); c.bezierCurveTo(3, -4, 0, 1, 0, 5);
    c.fill();
    c.restore();

    // 标题
    c.textAlign = "center";
    c.fillStyle = "rgba(255,215,235,0.85)";
    c.font = "400 20px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillText("O U R   L O V E   R E P O R T", W / 2, 120);
    var tg = c.createLinearGradient(W / 2 - 160, 0, W / 2 + 160, 0);
    tg.addColorStop(0, "#ff9ec1"); tg.addColorStop(0.5, "#ffd29d"); tg.addColorStop(1, "#9ad7ff");
    c.fillStyle = tg;
    c.font = "700 58px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillText("恋爱宇宙报告", W / 2, 190);

    // 名字
    c.fillStyle = "#ffe9f2";
    c.font = "600 34px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillText(A.name + "  ❤  " + B.name, W / 2, 268);
    c.fillStyle = "rgba(238,242,255,0.55)";
    c.font = "400 17px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillText("SINCE " + fmtDate(anniv), W / 2, 302);

    // 天数
    c.fillStyle = "rgba(238,242,255,0.7)";
    c.font = "400 19px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillText("我 们 已 经 在 一 起", W / 2, 372);
    var dg = c.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
    dg.addColorStop(0, "#ff9ec1"); dg.addColorStop(1, "#ffd29d");
    c.fillStyle = dg;
    c.font = "700 104px 'DIN Alternate','Segoe UI','PingFang SC',sans-serif";
    c.fillText(String(n.days), W / 2 - 20, 486);
    c.font = "400 26px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillStyle = "rgba(255,233,242,0.8)";
    c.fillText("天", W / 2 + (String(n.days).length * 30) + 6, 486);

    // 照片
    if (img) {
      c.save();
      rr(c, W / 2 - 210, 540, 420, 264, 18);
      c.shadowColor = "rgba(255,107,157,0.5)"; c.shadowBlur = 30;
      c.fillStyle = "#1c1140"; c.fill();
      c.shadowBlur = 0;
      c.clip();
      var scale = Math.max(420 / img.width, 264 / img.height);
      var iw = img.width * scale, ih = img.height * scale;
      c.drawImage(img, W / 2 - iw / 2, 540 + 132 - ih / 2, iw, ih);
      c.restore();
      c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1.5;
      rr(c, W / 2 - 210, 540, 420, 264, 18); c.stroke();
    }
    c.fillStyle = "rgba(238,242,255,0.6)";
    c.font = "400 16px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillText("——《" + (SITE.events[0] ? SITE.events[0].title.split("·")[0].trim() : "我们的第一页") + "》，故事从这里开始", W / 2, 836);

    // 数据网格
    var cells = [
      { label: "累计小时", val: fmtCN(n.hours) },
      { label: "心跳共振", val: fmtCN(n.beats) + " 下" },
      { label: "足迹城市", val: n.cities + " 座" },
      { label: "收藏瞬间", val: n.photos + " 张" },
      { label: "点亮心愿", val: n.wishDone + "/" + n.wishTotal },
      { label: "剩余进度", val: "一生" }
    ];
    cells.forEach(function (cell, i) {
      var col = i % 3, row = (i / 3) | 0;
      var cx = W / 2 + (col - 1) * 190;
      var cy = 920 + row * 110;
      c.fillStyle = "rgba(238,242,255,0.55)";
      c.font = "400 16px 'PingFang SC','Microsoft YaHei',sans-serif";
      c.fillText(cell.label, cx, cy);
      c.fillStyle = "#ffd29d";
      c.font = "700 30px 'PingFang SC','Microsoft YaHei',sans-serif";
      c.fillText(cell.val, cx, cy + 38);
    });

    // 底部情话
    var quote = pick(SITE.quotes);
    c.fillStyle = "rgba(255,233,242,0.85)";
    c.font = "400 20px 'Kaiti SC','STKaiti','KaiTi',serif";
    c.fillText("「 " + quote + " 」", W / 2, 1168);
    c.fillStyle = "rgba(238,242,255,0.4)";
    c.font = "400 13px 'PingFang SC','Microsoft YaHei',sans-serif";
    c.fillText("—— 由「" + A.name + " ❤ " + B.name + " 的宇宙」生成 · " + fmtDate(new Date()), W / 2, 1226);
  }

  function openPoster() {
    $("#poster-modal").classList.remove("hidden");
    // 先绘制文字框架，照片加载完再完整重绘
    drawPoster(null);
    var img = new Image();
    var ph = SITE.photos[0] || SITE.events[0];
    var done = false;
    img.onload = function () { if (!done) { done = true; drawPoster(img); } };
    img.onerror = function () {
      var im2 = new Image();
      im2.onload = function () { if (!done) { done = true; drawPoster(im2); } };
      im2.src = FX.makePhoto(1, (ph && ph.palette) || "sakura", 900, 566);
    };
    img.src = (ph && ph.src) || "";
    if (!img.src) { done = true; drawPoster(null); }
    FX.fireworksShow(1800);
  }

  function initPoster() {
    $("#report-open").addEventListener("click", openPoster);
    $("#poster-close").addEventListener("click", function () { $("#poster-modal").classList.add("hidden"); });
    $("#poster-modal").addEventListener("click", function (e) { if (e.target === $("#poster-modal")) $("#poster-modal").classList.add("hidden"); });
    $("#poster-download").addEventListener("click", function () {
      try {
        var a = document.createElement("a");
        a.download = A.name + B.name + "的恋爱报告.png";
        a.href = $("#poster-canvas").toDataURL("image/png");
        a.click();
        toast("长图已保存 💾");
      } catch (err) { toast("保存失败，请长按图片保存"); }
    });
  }

  /* ================= 彩蛋 ================= */
  function initEggs() {
    // ① 隐藏关键词 → 全屏告白
    var buffer = "", lastEgg = 0;
    var kws = (SITE.eggKeywords || []).map(function (k) { return String(k).toLowerCase(); });
    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key && e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-24);
        var now = Date.now();
        if (now - lastEgg > 8000 && kws.some(function (k) { return buffer.indexOf(k) >= 0; })) {
          lastEgg = now; buffer = "";
          triggerEgg();
        }
      }
    });

    function triggerEgg() {
      var ov = $("#egg-overlay"), box = $("#egg-text");
      box.innerHTML = SITE.confession.map(function (line, i) {
        var cls = "egg-line" + (i === 1 ? " big" : (i === 0 || i === SITE.confession.length - 1 ? " small" : ""));
        return '<div class="' + cls + '" style="animation-delay:' + (0.15 + i * 0.55) + 's">' + line + '</div>';
      }).join("");
      ov.classList.remove("hidden");
      FX.fireworksShow(6000);
    }
    $("#egg-overlay").addEventListener("click", function () {
      $("#egg-overlay").classList.add("hidden");
    });

    // ② 连续点击首页爱心 → 烟花
    var heart = $("#hero-heart"), clicks = 0, suppress = false;
    heart.addEventListener("click", function (e) {
      if (suppress) { suppress = false; return; }
      clicks++;
      if (window.Heart3D) Heart3D.pulse();
      var r = heart.getBoundingClientRect();
      FX.heartBurst(r.left + r.width / 2, r.top + r.height / 2, 12);
      if (clicks % 5 === 0) {
        FX.fireworksShow(2600);
        toast("❤️ 第 " + clicks + " 次心动，爱意爆发！");
      }
    });

    // ③ 长按爱心 → 生成恋爱报告
    var lpTimer = null, moved = 0, sx = 0, sy = 0;
    function lpStart(e) {
      moved = 0;
      sx = e.clientX || 0; sy = e.clientY || 0;
      lpTimer = setTimeout(function () {
        lpTimer = null;
        suppress = true;
        if (navigator.vibrate) navigator.vibrate(60);
        openPoster();
      }, 650);
    }
    function lpCancel() { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }
    heart.addEventListener("pointerdown", lpStart);
    heart.addEventListener("pointermove", function (e) {
      moved += Math.abs((e.clientX || 0) - sx) + Math.abs((e.clientY || 0) - sy);
      if (moved > 14) lpCancel();
    });
    heart.addEventListener("pointerup", lpCancel);
    heart.addEventListener("pointerleave", lpCancel);
    heart.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    // ④ 鼠标 / 触屏 拖尾星光
    document.addEventListener("pointermove", function (e) {
      if (document.body.classList.contains("locked")) return;
      FX.trail(e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ================= 导航 / 进度条 / 工具栏 ================= */
  function initNav() {
    var defs = [
      ["hero", "首页"], ["stats", "恋爱数据"], ["timeline", "时间轴"], ["gallery", "照片墙"],
      ["map", "足迹"], ["wishes", "心愿"], ["letters", "情书"], ["quiz", "问答"],
      ["mailbox", "未来信箱"], ["mood", "心情"], ["report", "恋爱报告"]
    ];
    var dots = $("#dots");
    defs.forEach(function (d) {
      var a = document.createElement("a");
      a.dataset.label = d[1];
      a.setAttribute("data-target", d[0]);
      a.addEventListener("click", function () {
        var el = document.getElementById(d[0]);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      dots.appendChild(a);
    });

    var progress = $("#scroll-progress"), topBtn = $("#top-btn");
    window.addEventListener("scroll", function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (st / max) * 100 : 0) + "%";
      topBtn.classList.toggle("show", st > 600);

      // 当前区块高亮
      var cur = defs[0][0];
      defs.forEach(function (d) {
        var el = document.getElementById(d[0]);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) cur = d[0];
      });
      dots.querySelectorAll("a").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-target") === cur);
      });
    }, { passive: true });

    topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    MUSIC.btn = $("#music-btn");
    MUSIC.btn.addEventListener("click", function () { MUSIC.toggle(); });

    // 键盘：Esc 关闭弹层
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!$("#lightbox").classList.contains("hidden")) closeLightbox();
      else if (!$("#poster-modal").classList.contains("hidden")) $("#poster-modal").classList.add("hidden");
      else if (!$("#egg-overlay").classList.contains("hidden")) $("#egg-overlay").classList.add("hidden");
      else if (!$("#place-popup").classList.contains("hidden")) closePlace();
    });
  }

  /* ================= 启动 ================= */
  fillBasics();
  initIntro();
  initGate();
  initTimer();
  initStats();
  initCountdowns();
  initQuote();
  initTimeline();
  initGallery();
  initMap();
  initWishes();
  initLetters();
  initQuiz();
  initMailbox();
  initMood();
  initPoster();
  initEggs();
  initNav();
  // 浮现动画要等所有内容渲染完再注册观察器，
  // 否则动态生成的 .reveal 元素永远不会被观察到
  initReveal();
})();
