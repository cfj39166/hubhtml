/* ============================================================
   tools-scan.js — 二维码生成 / 扫描
   组件按需从 CDN 加载并缓存到本地，首次之后可离线使用
   ============================================================ */
window.LH = window.LH || {};
LH.impls = LH.impls || {};

(function (LH) {
  'use strict';
  var esc = LH.esc;

  /* 通用脚本加载器：CDN 拉取 → localStorage 缓存 → 下次离线直接用 */
  function loadLib(name, url, globalName) {
    return new Promise(function (resolve, reject) {
      if (window[globalName]) return resolve(window[globalName]);
      var cacheKey = 'lh_lib_' + name;
      var cached = null;
      try { cached = localStorage.getItem(cacheKey); } catch (e) {}
      function run(code) {
        try {
          (window.execScript || function (c) { window.eval(c); })(code);
          if (window[globalName]) resolve(window[globalName]);
          else reject(new Error('组件加载异常'));
        } catch (e) { reject(new Error('组件执行失败：' + e.message)); }
      }
      if (cached) return run(cached);
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(function (code) {
        try { localStorage.setItem(cacheKey, code); } catch (e) {}
        run(code);
      }).catch(function () {
        reject(new Error('组件下载失败，请检查网络后重试'));
      });
    });
  }

  /* ========================================================
   * 1. 二维码生成
   * ======================================================== */
  LH.impls['qr-gen'] = function (root) {
    var st = { text: '', level: 'M', size: 6 };
    var QRCDN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
    function make() {
      if (!st.text.trim()) return LH.toast('请先输入内容', 'err');
      loadLib('qrcode', QRCDN, 'qrcode').then(function (qrcode) {
        try {
          if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
            qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
          }
          var qr = qrcode(0, st.level);
          qr.addData(st.text);
          qr.make();
          var n = qr.getModuleCount();
          var margin = 3;
          var px = st.size;
          var canvas = document.createElement('canvas');
          canvas.width = canvas.height = (n + margin * 2) * px;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#111';
          for (var r = 0; r < n; r++) {
            for (var c = 0; c < n; c++) {
              if (qr.isDark(r, c)) ctx.fillRect((c + margin) * px, (r + margin) * px, px, px);
            }
          }
          var url = canvas.toDataURL('image/png');
          LH.$('#qr-img', root).src = url;
          LH.$('#qr-result', root).style.display = 'block';
          LH.$('#qr-dl', root).onclick = function () {
            var a = document.createElement('a');
            a.href = url;
            a.download = 'qrcode.png';
            a.click();
          };
        } catch (e) {
          LH.toast('生成失败：内容过长，请减少文字或降低纠错级别', 'err');
        }
      }).catch(function (e) {
        LH.toast(e.message, 'err');
      });
    }
    root.innerHTML =
      '<div class="perm-tip">💡 二维码完全在本地生成，内容不上传；生成组件首次使用需联网加载，之后可离线。</div>' +
      '<div class="card">' +
      '<div class="field"><label>内容（网址 / 文本 / WiFi 信息等）</label><textarea class="input" id="qr-text" rows="4" placeholder="如：https://example.com 或 想对 TA 说的话">' + esc(st.text) + '</textarea></div>' +
      '<div class="convert-row">' +
      '<div class="field"><label>尺寸</label><select class="select" id="qr-size">' +
      '<option value="4">小</option><option value="6" selected>中（推荐）</option><option value="9">大</option></select></div>' +
      '<div class="field"><label>纠错级别（越高越抗污损）</label><select class="select" id="qr-level">' +
      '<option value="L">L 7%</option><option value="M" selected>M 15%</option><option value="Q">Q 25%</option><option value="H">H 30%</option></select></div></div>' +
      '<button class="btn primary block" id="qr-make" style="padding:13px">🔳 生成二维码</button>' +
      '</div>' +
      '<div class="card section" id="qr-result" style="display:none">' +
      '<div class="qr-box"><img id="qr-img" alt="二维码"></div>' +
      '<div class="flex gap8 mt12">' +
      '<button class="btn grow" id="qr-dl">⬇️ 保存图片</button>' +
      '<button class="btn grow" id="qr-copy-text">⧉ 复制内容</button></div></div>';
    LH.$('#qr-text', root).oninput = function () { st.text = this.value; };
    LH.$('#qr-size', root).onchange = function () { st.size = +this.value; if (LH.$('#qr-result', root).style.display !== 'none') make(); };
    LH.$('#qr-level', root).onchange = function () { st.level = this.value; if (LH.$('#qr-result', root).style.display !== 'none') make(); };
    LH.$('#qr-make', root).onclick = make;
    LH.$('#qr-copy-text', root).onclick = function () { LH.copy(st.text); };
  };

  /* ========================================================
   * 2. 二维码 / 条形码扫描
   * ======================================================== */
  LH.impls['qr-scan'] = function (root) {
    var st = { tab: 'camera', stream: null, timer: null, result: null };
    var JSCDN = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    function stop() {
      if (st.timer) { clearInterval(st.timer); st.timer = null; }
      if (st.stream) { st.stream.getTracks().forEach(function (t) { t.stop(); }); st.stream = null; }
    }
    function showResult(text) {
      stop();
      LH.beep(1);
      st.result = text;
      var isUrl = /^https?:\/\/\S+$/i.test(text);
      LH.$('#scan-area', root).innerHTML =
        '<div class="result-box"><div class="label">识别结果</div><div class="value small" style="word-break:break-all">' + esc(text) + '</div>' +
        '<div class="flex gap8 mt12">' +
        (isUrl ? '<a class="btn accent grow" href="' + esc(text) + '" target="_blank" rel="noopener" style="text-decoration:none">🔗 打开链接</a>' : '') +
        '<button class="btn primary grow" id="sc-copy">⧉ 复制</button>' +
        '<button class="btn grow" id="sc-again">↺ 重新扫</button></div></div>';
      LH.$('#sc-copy', root).onclick = function () { LH.copy(text); };
      LH.$('#sc-again', root).onclick = function () { st.result = null; render(); startCamera(); };
    }
    function startCamera() {
      var area = LH.$('#scan-area', root);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        area.innerHTML = LH.emptyHTML('📷', '当前浏览器不支持相机', '请改用「识别图片」方式，或换用手机 Chrome/Safari 打开');
        return;
      }
      area.innerHTML = '<div class="scan-frame-wrap"><video id="sc-video" playsinline muted autoplay></video>' +
        '<div class="scan-frame"></div><div class="scan-line"></div></div>' +
        '<p class="tiny center mt8">正在启动相机…对准二维码即可自动识别</p>';
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then(function (stream) {
          st.stream = stream;
          var video = LH.$('#sc-video', root);
          if (!video) return;
          video.srcObject = stream;
          video.setAttribute('playsinline', '');
          return video.play().catch(function () {});
        })
        .then(function () {
          return loadLib('jsqr', JSCDN, 'jsQR');
        })
        .then(function () {
          var video = LH.$('#sc-video', root);
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          st.timer = setInterval(function () {
            if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
            if (!document.body.contains(root)) return stop();
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            if (!canvas.width) return;
            ctx.drawImage(video, 0, 0);
            var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var code = window.jsQR(img.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
            if (code && code.data) showResult(code.data);
          }, 260);
        })
        .catch(function (e) {
          if (e && e.message && e.message.indexOf('组件') >= 0) {
            area.innerHTML = LH.emptyHTML('📡', e.message, '识别组件需联网首次加载，之后可离线使用');
          } else {
            area.innerHTML = LH.emptyHTML('🚫', '无法访问相机', '可能是权限被拒绝或页面不在 HTTPS 环境下；可改用「识别图片」');
          }
        });
    }
    function pickImage() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var area = LH.$('#scan-area', root);
        area.innerHTML = '<p class="tiny center" style="padding:20px 0">识别中…</p>';
        loadLib('jsqr', JSCDN, 'jsQR').then(function () {
          var img = new Image();
          img.onload = function () {
            var canvas = document.createElement('canvas');
            var scale = Math.min(1, 1200 / Math.max(img.width, img.height));
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            var ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var code = window.jsQR(data.data, canvas.width, canvas.height);
            if (code && code.data) showResult(code.data);
            else area.innerHTML = LH.emptyHTML('🔍', '未识别出二维码', '试试更清晰、更大的图片，或光线更充足的截图') + '<button class="btn primary block" id="sc-retry2">重新选择</button>', LH.$('#sc-retry2', root).onclick = pickImage;
          };
          img.onerror = function () { LH.toast('图片读取失败', 'err'); };
          img.src = URL.createObjectURL(file);
        }).catch(function (e) {
          area.innerHTML = LH.emptyHTML('📡', e.message, '识别组件需联网首次加载');
        });
      };
      input.click();
    }
    function render() {
      root.innerHTML =
        '<div class="seg mb12"><button data-t="camera" class="' + (st.tab === 'camera' ? 'active' : '') + '">📷 相机扫码</button>' +
        '<button data-t="image" class="' + (st.tab === 'image' ? 'active' : '') + '">🖼️ 识别图片</button></div>' +
        '<div class="card"><div id="scan-area">' +
        (st.tab === 'camera' ? '<p class="tiny center" style="padding:26px 0">点击下方按钮开启相机</p>' : '<p class="tiny center" style="padding:26px 0">点击下方按钮选择含二维码的图片</p>') +
        '</div>' +
        '<button class="btn primary block mt12" id="sc-start" style="padding:13px">' +
        (st.tab === 'camera' ? '📷 开启相机扫码' : '🖼️ 选择图片识别') + '</button>' +
        '<p class="tiny mt12 center">扫码在本地完成，不上传任何图片；组件首次使用需联网</p></div>';
      LH.$$('.seg button', root).forEach(function (b) {
        b.onclick = function () {
          stop(); st.tab = b.dataset.t; render();
        };
      });
      LH.$('#sc-start', root).onclick = function () {
        if (st.tab === 'camera') startCamera(); else pickImage();
      };
    }
    render();
    // 离开页面时释放相机
    var mo = new MutationObserver(function () {
      if (!document.body.contains(root)) { stop(); mo.disconnect(); }
    });
    mo.observe(document.getElementById('view'), { childList: true });
  };
})(window.LH);
