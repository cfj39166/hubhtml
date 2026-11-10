/* ============================================================
   ui.js — 公共 UI 与工具函数（无外部依赖）
   ============================================================ */
window.LH = window.LH || {};

(function (LH) {
  'use strict';

  /* ---------- 基础 ---------- */
  LH.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  LH.$ = function (sel, root) { return (root || document).querySelector(sel); };
  LH.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  LH.uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  /* ---------- 日期时间 ---------- */
  LH.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  LH.todayStr = function (d) {
    var t = d || new Date();
    return t.getFullYear() + '-' + LH.pad(t.getMonth() + 1) + '-' + LH.pad(t.getDate());
  };
  LH.timeStr = function (d) {
    var t = d || new Date();
    return LH.pad(t.getHours()) + ':' + LH.pad(t.getMinutes());
  };
  LH.parseDate = function (str) { // 'YYYY-MM-DD' -> 当天 00:00 本地时间
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(str || '').trim());
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (isNaN(d.getTime())) return null;
    return d;
  };
  LH.fmtDateCN = function (str) {
    var d = LH.parseDate(str); if (!d) return str;
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  };
  LH.weekdayCN = function (d) { return '日一二三四五六'[ (d || new Date()).getDay() ]; };
  LH.daysBetween = function (a, b) { // b - a 的整天数
    return Math.round((LH.parseDate(b) - LH.parseDate(a)) / 86400000);
  };
  LH.relTime = function (ts) {
    var diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
    if (diff < 86400000 * 30) return Math.floor(diff / 86400000) + ' 天前';
    var d = new Date(ts);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  };

  /* ---------- 金额 ---------- */
  LH.fmtMoney = function (n) {
    if (isNaN(n)) return '0';
    var neg = n < 0; n = Math.abs(n);
    var s = (Math.round(n * 100) / 100).toFixed(2);
    s = s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + parts.join('.');
  };

  /* ---------- Toast ---------- */
  var toastWrap = null;
  LH.toast = function (msg, type) {
    if (!toastWrap || !document.body.contains(toastWrap)) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toast-wrap';
      document.body.appendChild(toastWrap);
    }
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'ok' ? ' ok' : type === 'err' ? ' err' : '');
    t.textContent = msg;
    toastWrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s, transform .3s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(-8px)';
      setTimeout(function () { t.remove(); }, 320);
    }, 1900);
  };

  /* ---------- 确认框 ---------- */
  LH.confirm = function (title, body, okText, danger) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'modal-mask';
      mask.innerHTML =
        '<div class="modal" role="dialog">' +
        '<h3>' + LH.esc(title) + '</h3>' +
        '<div class="modal-body">' + LH.esc(body || '') + '</div>' +
        '<div class="modal-btns">' +
        '<button class="btn ghost" data-act="no">取消</button>' +
        '<button class="btn ' + (danger ? 'danger' : 'primary') + '" data-act="yes">' + LH.esc(okText || '确定') + '</button>' +
        '</div></div>';
      document.body.appendChild(mask);
      function close(v) { mask.remove(); resolve(v); }
      mask.addEventListener('click', function (e) {
        var act = e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'yes') close(true);
        else if (act === 'no' || e.target === mask) close(false);
      });
    });
  };

  /* ---------- 底部弹层 ---------- */
  LH.sheet = function (title, contentHTML, opts) {
    opts = opts || {};
    var mask = document.createElement('div');
    mask.className = 'sheet-mask';
    mask.innerHTML =
      '<div class="sheet" role="dialog">' +
      '<div class="sheet-bar"></div>' +
      (title ? '<h3>' + LH.esc(title) + '</h3>' : '') +
      '<div class="sheet-content">' + contentHTML + '</div>' +
      '</div>';
    document.body.appendChild(mask);
    var api = {
      el: mask,
      body: LH.$('.sheet-content', mask),
      close: function () { mask.remove(); if (opts.onClose) opts.onClose(); }
    };
    mask.addEventListener('click', function (e) { if (e.target === mask) api.close(); });
    return api;
  };

  /* ---------- 复制 ---------- */
  LH.copy = function (text) {
    text = String(text);
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); LH.toast('已复制', 'ok'); }
      catch (e) { LH.toast('复制失败，请手动复制', 'err'); }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { LH.toast('已复制', 'ok'); }, fallback);
    } else fallback();
  };

  /* ---------- 提示音（WebAudio，无需音频文件） ---------- */
  var audioCtx = null;
  LH.beep = function (times) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t0 = audioCtx.currentTime;
      for (var i = 0; i < (times || 2); i++) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.0001, t0 + i * 0.32);
        gain.gain.exponentialRampToValueAtTime(0.22, t0 + i * 0.32 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.32 + 0.26);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t0 + i * 0.32); osc.stop(t0 + i * 0.32 + 0.3);
      }
    } catch (e) { /* 无音频权限时静默 */ }
  };

  /* ---------- 系统通知 ---------- */
  LH.canNotify = function () {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  };
  LH.askNotify = function () {
    if (typeof Notification === 'undefined') return Promise.resolve(false);
    if (Notification.permission === 'granted') return Promise.resolve(true);
    if (Notification.permission === 'denied') return Promise.resolve(false);
    return Notification.requestPermission().then(function (p) { return p === 'granted'; });
  };
  LH.notify = function (title, body) {
    LH.toast(title + (body ? '：' + body : ''), 'ok');
    if (LH.canNotify()) {
      try { new Notification(title, { body: body || '', icon: './icon.svg' }); } catch (e) {}
    }
    if (LH.settings && LH.settings.sound !== false) LH.beep(2);
  };

  /* ---------- 空状态 ---------- */
  LH.emptyHTML = function (emoji, text, sub) {
    return '<div class="empty"><span class="emoji">' + emoji + '</span><p>' + LH.esc(text) +
      (sub ? '<br><span class="tiny">' + LH.esc(sub) + '</span>' : '') + '</p></div>';
  };

  /* ---------- 简易 SVG 图标 ---------- */
  LH.icons = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21" stroke-linecap="round"/></svg>',
    star: '★',
    copyIcon: '⧉'
  };
})(window.LH);
