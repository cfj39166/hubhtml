/* ============================================================
   store.js — 本地数据存储（localStorage，离线优先，数据不出设备）
   ============================================================ */
window.LH = window.LH || {};

(function (LH) {
  'use strict';

  var PREFIX = 'lh_';
  var mem = {}; // localStorage 不可用时的内存兜底（如隐私模式）

  function ls() {
    try {
      var k = '__lh_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return localStorage;
    } catch (e) { return null; }
  }
  var storage = ls();

  LH.get = function (key, def) {
    try {
      var raw = storage ? storage.getItem(PREFIX + key) : (mem[key] !== undefined ? mem[key] : null);
      if (raw === null || raw === undefined) return def;
      return JSON.parse(raw);
    } catch (e) { return def; }
  };
  LH.set = function (key, val) {
    var raw = JSON.stringify(val);
    if (storage) {
      try { storage.setItem(PREFIX + key, raw); return true; }
      catch (e) { LH.toast('本地存储空间不足', 'err'); return false; }
    }
    mem[key] = raw; return true;
  };
  LH.remove = function (key) {
    if (storage) storage.removeItem(PREFIX + key);
    delete mem[key];
  };

  /* ---------- 设置 ---------- */
  var DEFAULT_SETTINGS = {
    theme: 'auto',      // auto | light | dark
    font: 'md',         // md | lg | xlg（老人模式）
    sound: true,        // 提醒音
    water: { goal: 2000, cup: 200, remind: false, interval: 60 },
    pomodoro: { focus: 25, rest: 5, longRest: 15, longEvery: 4 }
  };
  LH.settings = Object.assign({}, DEFAULT_SETTINGS, LH.get('settings', {}));
  LH.settings.water = Object.assign({}, DEFAULT_SETTINGS.water, LH.settings.water || {});
  LH.settings.pomodoro = Object.assign({}, DEFAULT_SETTINGS.pomodoro, LH.settings.pomodoro || {});
  LH.saveSettings = function () { LH.set('settings', LH.settings); };

  LH.applyTheme = function () {
    var theme = LH.settings.theme;
    if (theme === 'auto') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
    document.documentElement.dataset.font = LH.settings.font;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#17191D' : '#2BB3A3');
  };
  // 跟随系统时，实时同步 <html data-theme>
  LH.watchSystemTheme = function () {
    if (!window.matchMedia) return;
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var apply = function () {
      if (LH.settings.theme === 'auto') {
        document.documentElement.dataset.theme = mq.matches ? 'dark' : 'light';
      }
    };
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  };

  /* ---------- 收藏 / 最近使用 ---------- */
  LH.getFavorites = function () { return LH.get('favorites', []); };
  LH.isFav = function (id) { return LH.getFavorites().indexOf(id) >= 0; };
  LH.toggleFav = function (id) {
    var f = LH.getFavorites();
    var i = f.indexOf(id);
    if (i >= 0) { f.splice(i, 1); LH.set('favorites', f); return false; }
    f.unshift(id); LH.set('favorites', f); return true;
  };

  LH.getRecents = function () { return LH.get('recents', []); };
  LH.pushRecent = function (id) {
    var r = LH.getRecents().filter(function (x) { return x.id !== id; });
    r.unshift({ id: id, ts: Date.now() });
    if (r.length > 10) r.length = 10;
    LH.set('recents', r);
  };
  LH.clearRecents = function () { LH.set('recents', []); };

  /* ---------- 搜索历史 ---------- */
  LH.getSearchHist = function () { return LH.get('search_hist', []); };
  LH.pushSearchHist = function (q) {
    q = String(q || '').trim();
    if (!q) return;
    var h = LH.getSearchHist().filter(function (x) { return x !== q; });
    h.unshift(q);
    if (h.length > 8) h.length = 8;
    LH.set('search_hist', h);
  };
  LH.clearSearchHist = function () { LH.set('search_hist', []); };

  /* ---------- 记录类数据的通用集合操作 ---------- */
  LH.list = function (key) { return LH.get(key, []); };
  LH.saveList = function (key, arr) { LH.set(key, arr); };

  /* ---------- 数据导出 / 导入 / 清空 ---------- */
  LH.exportAll = function () {
    var data = {};
    if (storage) {
      for (var i = 0; i < storage.length; i++) {
        var k = storage.key(i);
        if (k && k.indexOf(PREFIX) === 0) data[k.slice(PREFIX.length)] = LH.get(k.slice(PREFIX.length), null);
      }
    }
    data.__exported_at = new Date().toISOString();
    data.__app = '生活小助手';
    return data;
  };
  LH.downloadExport = function () {
    var data = LH.exportAll();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '生活小助手备份_' + LH.todayStr() + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };
  LH.importAll = function (jsonText) {
    return new Promise(function (resolve, reject) {
      var data;
      try { data = JSON.parse(jsonText); } catch (e) { return reject('文件格式不正确'); }
      if (!data || typeof data !== 'object' || !data.__app) return reject('这不是生活小助手的备份文件');
      var n = 0;
      Object.keys(data).forEach(function (k) {
        if (k.indexOf('__') === 0) return;
        LH.set(k, data[k]); n++;
      });
      LH.settings = Object.assign({}, LH.settings, LH.get('settings', {}));
      LH.applyTheme();
      resolve(n);
    });
  };
  LH.clearAllData = function () {
    if (storage) {
      var keys = [];
      for (var i = 0; i < storage.length; i++) {
        var k = storage.key(i);
        if (k && k.indexOf(PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) { storage.removeItem(k); });
    }
    mem = {};
  };
})(window.LH);
