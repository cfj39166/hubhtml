/* ============================================================
   app.js — 应用主控：路由 / 四大 Tab / 工具页 / 全局提醒引擎
   ============================================================ */
(function (LH) {
  'use strict';
  var esc = LH.esc;
  var view;

  /* ================= 路由 ================= */
  function currentRoute() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === 'tool' && parts[1]) return { tab: null, tool: parts[1] };
    if (['tools', 'records', 'me'].indexOf(parts[0]) >= 0) return { tab: parts[0], tool: null };
    return { tab: 'home', tool: null };
  }

  function renderRoute() {
    var r = currentRoute();
    if (r.tool) {
      var t = LH.toolById(r.tool);
      if (!t) { location.hash = '#/'; return; }
      document.body.classList.add('in-tool');
      LH.pushRecent(t.id);
      renderToolPage(t);
    } else {
      document.body.classList.remove('in-tool');
      LH.$$('.tabbar-item').forEach(function (a) {
        a.classList.toggle('active', a.dataset.tab === r.tab);
      });
      if (r.tab === 'home') renderHome();
      else if (r.tab === 'tools') renderTools();
      else if (r.tab === 'records') renderRecords();
      else renderMe();
    }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', renderRoute);

  function go(hash) { location.hash = hash; }

  /* ================= 工具页 ================= */
  function renderToolPage(t) {
    var fav = LH.isFav(t.id);
    view.innerHTML =
      '<div class="tool-page">' +
      '<header class="tool-header">' +
      '<button class="back" id="tp-back" aria-label="返回">' + LH.icons.back + '</button>' +
      '<div class="t-title"><span>' + t.icon + '</span><span class="txt">' + esc(t.name) + '</span>' +
      (t.online ? (t.online === 'first' ? '<span class="tag online">首次需联网</span>' : '<span class="tag online">需联网</span>') : '<span class="tag">离线可用</span>') +
      '</div>' +
      '<button class="star-btn' + (fav ? ' on' : '') + '" id="tp-star" aria-label="收藏">' + LH.icons.star + '</button>' +
      '</header>' +
      '<div class="tool-body" id="tool-body"></div>' +
      '<div class="tool-related" id="tool-related"></div>' +
      '</div>';
    LH.$('#tp-back').onclick = function () {
      if (history.length > 1) history.back();
      else go('#/');
    };
    LH.$('#tp-star').onclick = function () {
      var on = LH.toggleFav(t.id);
      this.classList.toggle('on', on);
      LH.toast(on ? '已收藏，将显示在首页常用' : '已取消收藏');
    };
    var impl = LH.impls[t.impl || t.id];
    if (impl) impl(LH.$('#tool-body'));
    else LH.$('#tool-body').innerHTML = LH.emptyHTML('🚧', '该工具正在建设中');

    /* 相关工具推荐（同分类） */
    var rel = LH.catalog.filter(function (x) { return x.cat === t.cat && x.id !== t.id; }).slice(0, 4);
    if (rel.length) {
      LH.$('#tool-related').innerHTML =
        '<div class="section-head"><h3>🧭 相关工具</h3></div><div class="tool-grid">' +
        rel.map(function (x) {
          return '<a class="tool-cell" href="#/tool/' + x.id + '"><span class="icon-tile">' + x.icon + '</span><span class="name">' + esc(x.name) + '</span></a>';
        }).join('') + '</div>';
    }
  }

  /* ================= 首页 ================= */
  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  function todayCards() {
    var cards = '';
    var todos = LH.list('todos').filter(function (t) { return !t.done; }).length;
    if (todos > 0) cards += card('✅', todos + ' 项', '今日待办', 'todo', 'linear-gradient(135deg,#3A8DFF,#5BA8F5)');
    var wl = LH.get('water', { log: {} }).log[LH.todayStr()] || [];
    var wv = wl.reduce(function (s, x) { return s + x.ml; }, 0);
    cards += card('💧', wv + 'ml', '今日饮水 ' + Math.min(100, Math.round(wv / LH.settings.water.goal * 100)) + '%', 'water', 'linear-gradient(135deg,#2BB3A3,#4FD1C5)', wv / LH.settings.water.goal);
    var medsArr = LH.list('meds');
    var medTodo = 0, medAll = 0;
    var today = LH.todayStr();
    medsArr.forEach(function (m) {
      m.times.forEach(function (tm) {
        medAll++;
        if (!(m.log[today] && m.log[today][tm])) medTodo++;
      });
    });
    if (medAll > 0) cards += card('💊', medTodo > 0 ? medTodo + ' 次' : '全部 ✓', '今日服药', 'meds', 'linear-gradient(135deg,#FF9F43,#FFB46B)');
    var annis = LH.list('annivs').map(function (x) { return { x: x, d: LH._anniNextDays ? LH._anniNextDays(x) : null }; })
      .filter(function (o) { return o.d !== null && o.d >= 0; }).sort(function (a, b) { return a.d - b.d; })[0];
    if (annis) cards += card(annis.x.emoji, annis.d === 0 ? '就是今天' : annis.d + ' 天', annis.x.name.slice(0, 6), 'anniversary', 'linear-gradient(135deg,#F0564A,#FF7B6B)');
    var todayOut = LH.list('ledger').filter(function (e) { return e.date === today && e.type === 'out'; })
      .reduce(function (s, e) { return s + e.amount; }, 0);
    if (todayOut > 0) cards += card('📒', '¥' + LH.fmtMoney(todayOut), '今日支出', 'ledger', 'linear-gradient(135deg,#8A6FE8,#A98BF2)');
    if (!cards) cards = card('👋', '开始使用', '添加一条待办试试', 'todo', 'linear-gradient(135deg,#2BB3A3,#4FD1C5)');
    return cards;
    function card(icon, num, label, toolId, bg, pct) {
      return '<div class="today-card" style="background:' + bg + '" data-tool="' + toolId + '">' +
        '<div class="t-icon">' + icon + '</div><div class="t-num">' + esc(num) + '</div><div class="t-label">' + esc(label) + '</div>' +
        (pct !== undefined ? '<div class="t-bar"><i style="width:' + Math.min(100, pct * 100) + '%"></i></div>' : '') +
        '</div>';
    }
  }

  function renderHome() {
    var now = new Date();
    var favs = LH.getFavorites();
    var common = favs.length ? favs : LH.defaultFavs;
    var recents = LH.getRecents().map(function (r) { return LH.toolById(r.id); }).filter(Boolean);
    view.innerHTML =
      '<div class="home-hero">' +
      '<h1 class="hello">' + greeting() + ' 👋</h1>' +
      '<p class="date">' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 星期' + LH.weekdayCN(now) + '</p>' +
      '</div>' +
      '<div class="search-bar" id="home-search">' + LH.icons.search +
      '<input id="home-search-inp" placeholder="搜索工具：支持拼音，如 jsq / 打折" autocomplete="off" enterkeyhint="search">' +
      '</div>' +
      '<div class="search-panel" id="home-search-panel"></div>' +
      '<div class="today-cards" id="today-cards">' + todayCards() + '</div>' +
      '<div class="section-head"><h3>⭐ 常用工具</h3><span class="more" id="edit-favs">编辑</span></div>' +
      '<div class="tool-grid">' +
      common.slice(0, 8).map(function (id) {
        var t = LH.toolById(id);
        return t ? '<a class="tool-cell" href="#/tool/' + t.id + '"><span class="icon-tile">' + t.icon + '</span><span class="name">' + esc(t.name) + '</span></a>' : '';
      }).join('') +
      '</div>' +
      (favs.length === 0 ? '<p class="tiny mt8" style="padding-left:4px">默认推荐 · 点工具页右上角 ★ 收藏常用工具</p>' : '') +
      (recents.length ?
        '<div class="section-head"><h3>🕘 最近使用</h3><span class="more" id="clear-recents">清空</span></div>' +
        '<div class="recents-row">' +
        recents.map(function (t) {
          return '<div class="recent-pill" data-tool="' + t.id + '"><span class="icon-tile">' + t.icon + '</span>' + esc(t.name) + '</div>';
        }).join('') + '</div>' : '') +
      '<div class="section-head"><h3>🎯 场景清单</h3><span class="more">一键导入待办</span></div>' +
      '<div id="scene-list">' +
      LH.scenes.map(function (s) {
        return '<div class="scene-card" data-scene="' + s.id + '">' +
          '<span class="icon-tile" style="background:var(--accent-soft)">' + s.emoji + '</span>' +
          '<div class="grow"><div class="s-name">' + esc(s.name) + '</div><div class="s-desc">' + esc(s.desc) + '</div></div>' +
          '<span class="arrow">›</span></div>';
      }).join('') + '</div>' +
      '<p class="tiny center" style="margin-top:26px;opacity:.7">🧰 生活小助手 · 数据仅保存在本机<br>搜索支持拼音首字母，试试「mima」「fk」</p>';

    LH.$$('[data-tool]', view).forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (el.tagName === 'A') return;
        go('#/tool/' + el.dataset.tool);
      });
    });
    LH.$$('#today-cards [data-tool]', view).forEach(function (el) {
      el.onclick = function () { go('#/tool/' + el.dataset.tool); };
    });
    var cr = LH.$('#clear-recents', view);
    if (cr) cr.onclick = function () { LH.clearRecents(); renderHome(); LH.toast('已清空最近使用'); };
    LH.$('#edit-favs', view).onclick = editFavs;
    LH.$$('[data-scene]', view).forEach(function (el) {
      el.onclick = function () { sceneSheet(LH.scenes.filter(function (s) { return s.id === el.dataset.scene; })[0]); };
    });
    bindSearch();
  }

  /* 场景清单 → 预览并导入待办 */
  function sceneSheet(s) {
    var sh = LH.sheet(s.emoji + ' ' + s.name,
      '<p class="tiny mb12">' + esc(s.desc) + ' · 共 ' + s.items.length + ' 项，将以「' + esc(s.name) + '」标签加入待办清单</p>' +
      s.items.map(function (i) { return '<div class="list-item"><span>' + i + '</span></div>'; }).join('') +
      '<div class="flex gap8 mt16"><button class="btn primary grow" id="sc-import">✅ 全部导入待办</button>' +
      '<button class="btn" id="sc-view">打开待办</button></div>');
    LH.$('#sc-import', sh.body).onclick = function () {
      var a = LH.list('todos');
      s.items.forEach(function (title) {
        a.unshift({ id: LH.uid(), title: title.replace(/^✅\s*/, ''), done: false, ts: Date.now(), due: '', prio: 0, tag: s.name });
      });
      LH.saveList('todos', a);
      sh.close();
      LH.toast('已导入 ' + s.items.length + ' 项到待办清单', 'ok');
    };
    LH.$('#sc-view', sh.body).onclick = function () { sh.close(); go('#/tool/todo'); };
  }

  /* 收藏管理 */
  function editFavs() {
    var sh = LH.sheet('管理常用工具',
      '<p class="tiny mb12">点亮 ★ 的工具会固定在首页顶部（最多展示 8 个）</p><div id="fav-list"></div>');
    function paint() {
      LH.$('#fav-list', sh.body).innerHTML = LH.catalog.map(function (t) {
        var on = LH.isFav(t.id);
        return '<div class="list-item"><span class="icon-tile" style="width:38px;height:38px;font-size:1.15rem">' + t.icon + '</span>' +
          '<div class="grow"><div class="title">' + esc(t.name) + '</div><div class="sub">' + esc(t.desc) + '</div></div>' +
          '<button class="star-btn' + (on ? ' on' : '') + '" data-fav="' + t.id + '">' + LH.icons.star + '</button></div>';
      }).join('');
      LH.$$('[data-fav]', sh.body).forEach(function (b) {
        b.onclick = function () { LH.toggleFav(b.dataset.fav); paint(); renderHome(); };
      });
    }
    paint();
  }

  /* 搜索 */
  function bindSearch() {
    var bar = LH.$('#home-search');
    var inp = LH.$('#home-search-inp');
    var panel = LH.$('#home-search-panel');
    if (!inp) return;
    function paint(q) {
      q = q || '';
      var hits = LH.searchTools(q);
      var html = '';
      if (!q) {
        var hist = LH.getSearchHist();
        if (hist.length) {
          html += '<p class="tiny" style="padding:8px 10px 4px">搜索历史 <span id="sh-clear" style="float:right;color:var(--text-3);cursor:pointer">清空</span></p>' +
            '<div class="flex" style="flex-wrap:wrap;gap:7px;padding:6px 10px 10px">' +
            hist.map(function (h) { return '<span class="chip" data-hist="' + esc(h) + '" style="padding:5px 12px;font-size:.76rem">' + esc(h) + '</span>'; }).join('') + '</div>';
        } else {
          html += '<p class="tiny" style="padding:10px 12px">试试搜索：打折、房贷、密码、垃圾分类、亲戚…</p>';
        }
      } else if (hits.length) {
        html = hits.slice(0, 8).map(function (t) {
          return '<div class="hit" data-tool="' + t.id + '"><span class="icon-tile">' + t.icon + '</span>' +
            '<div class="grow"><div class="name">' + esc(t.name) + '</div><div class="desc">' + esc(t.desc) + '</div></div>' +
            '<span style="color:var(--text-3)">›</span></div>';
        }).join('');
      } else {
        html = '<div class="empty" style="padding:22px"><span class="emoji">🔍</span><p>没有找到相关工具<br><span class="tiny">换个关键词，或支持拼音如「jisuanqi」</span></p></div>';
      }
      panel.innerHTML = html;
      panel.classList.add('show');
      bar.classList.add('focus');
      LH.$$('[data-tool]', panel).forEach(function (el) {
        el.onclick = function () {
          LH.pushSearchHist(q);
          panel.classList.remove('show');
          inp.blur();
          go('#/tool/' + el.dataset.tool);
        };
      });
      LH.$$('[data-hist]', panel).forEach(function (el) {
        el.onclick = function () { inp.value = el.dataset.hist; paint(el.dataset.hist); };
      });
      var cl = LH.$('#sh-clear', panel);
      if (cl) cl.onclick = function () { LH.clearSearchHist(); paint(''); };
    }
    inp.oninput = function () { paint(this.value.trim()); };
    inp.onfocus = function () { paint(this.value.trim()); };
    inp.onkeydown = function (e) {
      if (e.key === 'Enter') {
        var first = LH.$('.hit[data-tool]', panel);
        if (first) first.click();
      }
    };
    document.addEventListener('click', function closer(e) {
      if (!bar.contains(e.target) && !panel.contains(e.target)) {
        panel.classList.remove('show');
        bar.classList.remove('focus');
      }
    });
  }

  /* ================= 工具库 ================= */
  function renderTools() {
    var st = { cat: '', onlyOffline: false, q: '' };
    function render() {
      var list = LH.catalog.filter(function (t) {
        if (st.cat && t.cat !== st.cat) return false;
        if (st.onlyOffline && t.online) return false;
        return true;
      });
      var byCat = {};
      list.forEach(function (t) { (byCat[t.cat] = byCat[t.cat] || []).push(t); });
      var favs = LH.getFavorites();
      var favTools = LH.catalog.filter(function (t) { return favs.indexOf(t.id) >= 0; });
      view.innerHTML =
        '<div class="tab-header"><h2>工具库</h2><p class="tiny mt4">共 ' + LH.catalog.length + ' 个工具 · 全部本地运行</p></div>' +
        '<div class="search-bar"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' +
        '<input id="lib-q" placeholder="搜索工具" value="' + esc(st.q) + '" enterkeyhint="search"></div>' +
        '<div id="lib-search-res"></div>' +
        (st.q ? '' :
        '<div class="chips-row mt12" id="lib-cats">' +
        '<div class="chip' + (!st.cat && !st.onlyOffline ? ' active' : '') + '" data-c="">全部</div>' +
        '<div class="chip' + (st.onlyOffline ? ' active' : '') + '" data-c="__offline">🔌 仅离线可用</div>' +
        LH.cats.map(function (c) {
          return '<div class="chip' + (st.cat === c.id ? ' active' : '') + '" data-c="' + c.id + '">' + c.emoji + ' ' + c.name + '</div>';
        }).join('') + '</div>' +
        (favTools.length ? '<div class="section-head"><h3>⭐ 我的收藏</h3></div>' +
          favTools.map(toolCard).join('') : '') +
        LH.cats.filter(function (c) { return byCat[c.id]; }).map(function (c) {
          return '<div class="section-head"><h3>' + c.emoji + ' ' + c.name + '</h3><span class="tiny">' + byCat[c.id].length + ' 个</span></div>' +
            byCat[c.id].map(toolCard).join('');
        }).join(''));
      var q = LH.$('#lib-q', view);
      q.oninput = function () {
        st.q = this.value.trim();
        var box = LH.$('#lib-search-res', view);
        if (!st.q) { box.innerHTML = ''; render(); return; }
        var hits = LH.searchTools(st.q);
        box.innerHTML = '<div class="section-head"><h3>🔍 搜索结果</h3></div>' + (hits.length ? hits.map(toolCard).join('') :
          '<div class="card">' + LH.emptyHTML('🔍', '没有找到「' + esc(st.q) + '」', '试试拼音或别名') + '</div>');
        bindCards(box);
      };
      LH.$$('#lib-cats .chip', view).forEach(function (ch) {
        ch.onclick = function () {
          var c = ch.dataset.c;
          if (c === '__offline') { st.onlyOffline = !st.onlyOffline; st.cat = ''; }
          else { st.cat = c; st.onlyOffline = false; }
          render();
        };
      });
      bindCards(view);
    }
    function toolCard(t) {
      var on = LH.isFav(t.id);
      return '<div class="tool-card" data-open="' + t.id + '">' +
        '<span class="icon-tile">' + t.icon + '</span>' +
        '<div class="grow"><div class="t-name">' + esc(t.name) +
        (t.online ? (t.online === 'first' ? '<span class="tag online">首次联网</span>' : '<span class="tag online">需联网</span>') : '<span class="tag">离线</span>') + '</div>' +
        '<div class="t-desc">' + esc(t.desc) + '</div></div>' +
        '<button class="star-btn' + (on ? ' on' : '') + '" data-star="' + t.id + '">' + LH.icons.star + '</button></div>';
    }
    function bindCards(scope) {
      LH.$$('[data-open]', scope).forEach(function (el) {
        el.onclick = function (e) {
          if (e.target.closest('[data-star]')) return;
          go('#/tool/' + el.dataset.open);
        };
      });
      LH.$$('[data-star]', scope).forEach(function (b) {
        b.onclick = function (e) {
          e.stopPropagation();
          var on = LH.toggleFav(b.dataset.star);
          b.classList.toggle('on', on);
          LH.toast(on ? '已收藏' : '已取消收藏');
        };
      });
    }
    render();
  }

  /* ================= 记录 Tab ================= */
  function renderRecords() {
    var today = LH.todayStr();
    var todos = LH.list('todos');
    var todoOpen = todos.filter(function (t) { return !t.done; }).length;
    var month = today.slice(0, 7);
    var ledger = LH.list('ledger');
    var mOut = 0, mIn = 0;
    ledger.forEach(function (e) {
      if (e.date.indexOf(month) === 0) { e.type === 'out' ? mOut += e.amount : mIn += e.amount; }
    });
    var habits = LH.list('habits');
    var habitDone = habits.filter(function (h) { return h.days[today]; }).length;
    var meds = LH.list('meds');
    var medAll = 0, medDone = 0;
    meds.forEach(function (m) {
      m.times.forEach(function (t) {
        medAll++;
        if (m.log[today] && m.log[today][t]) medDone++;
      });
    });
    var annis = LH.list('annivs');
    var wl = LH.get('water', { log: {} }).log[today] || [];
    var wv = wl.reduce(function (s, x) { return s + x.ml; }, 0);

    function entry(icon, name, sub, toolId, badge) {
      return '<div class="tool-card" data-tool="' + toolId + '"><span class="icon-tile">' + icon + '</span>' +
        '<div class="grow"><div class="t-name">' + name + (badge ? ' <span class="mini-tag done-tag">' + badge + '</span>' : '') + '</div>' +
        '<div class="t-desc">' + sub + '</div></div><span style="color:var(--text-3)">›</span></div>';
    }
    view.innerHTML =
      '<div class="tab-header"><h2>记录</h2><p class="tiny mt4">所有数据仅保存在你的设备上 🔒</p></div>' +
      '<div class="record-hero">' +
      '<div class="rh-title">📊 今日概览</div>' +
      '<div class="rh-nums">' +
      '<div><div class="n">' + todoOpen + '</div><div class="k">待办未完成</div></div>' +
      '<div><div class="n">' + medAll + (medAll ? '（' + medDone + '✓）' : '') + '</div><div class="k">今日服药</div></div>' +
      '<div><div class="n">' + (wv ? wv + 'ml' : '—') + '</div><div class="k">今日饮水</div></div>' +
      '</div></div>' +
      '<div class="section">' +
      '<div class="section-head"><h3>📝 我的记录</h3></div>' +
      entry('✅', '待办清单', todos.length ? '共 ' + todos.length + ' 条 · 未完成 ' + todoOpen + ' 条' : '空 · 点击新建', 'todo') +
      entry('📒', '记账本', '本月支出 ¥' + LH.fmtMoney(mOut) + ' · 收入 ¥' + LH.fmtMoney(mIn), 'ledger') +
      entry('🌱', '习惯打卡', habits.length ? habitDone + ' / ' + habits.length + ' 已打卡' : '空 · 开始培养习惯', 'habit', habitDone && habits.length && habitDone === habits.length ? '全部完成 🎉' : '') +
      entry('💊', '吃药提醒', medAll ? '今日 ' + medDone + ' / ' + medAll + ' 次' : '空 · 添加药品', 'meds') +
      entry('🎂', '生日纪念日', annis.length ? '共 ' + annis.length + ' 个重要日子' : '空 · 添加纪念日', 'anniversary') +
      entry('📝', '备忘录', LH.list('notes').length + ' 条备忘', 'notes') +
      '</div>';
    LH.$$('[data-tool]', view).forEach(function (el) {
      el.onclick = function () { go('#/tool/' + el.dataset.tool); };
    });
  }

  /* ================= 我的 ================= */
  function renderMe() {
    var s = LH.settings;
    view.innerHTML =
      '<div class="me-head"><div class="me-avatar">🧰</div>' +
      '<div><div class="name">生活小助手</div><div class="slogan">干净 · 离线优先 · 数据在本机</div></div></div>' +
      '<div class="card section"><h4 style="font-size:.9rem">🎨 外观</h4>' +
      '<div class="setting-row mt8"><span class="s-icon">🌙</span><div class="grow">深色模式</div>' +
      '<select class="select" id="me-theme" style="width:130px">' +
      '<option value="auto"' + (s.theme === 'auto' ? ' selected' : '') + '>跟随系统</option>' +
      '<option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>浅色</option>' +
      '<option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>深色</option></select></div>' +
      '<div class="setting-row"><span class="s-icon">🔠</span><div class="grow">字号大小<div class="tiny" style="font-weight:400">特大号即老人模式</div></div>' +
      '<select class="select" id="me-font" style="width:130px">' +
      '<option value="md"' + (s.font === 'md' ? ' selected' : '') + '>标准</option>' +
      '<option value="lg"' + (s.font === 'lg' ? ' selected' : '') + '>大</option>' +
      '<option value="xlg"' + (s.font === 'xlg' ? ' selected' : '') + '>特大 👵👴</option></select></div>' +
      '<div class="setting-row"><span class="s-icon">🔔</span><div class="grow">提示音</div>' +
      '<label class="switch"><input type="checkbox" id="me-sound"' + (s.sound !== false ? ' checked' : '') + '><span class="track"></span><span class="knob"></span></label></div>' +
      '</div>' +
      '<div class="card section"><h4 style="font-size:.9rem">💾 数据管理</h4>' +
      '<div class="setting-row mt8" id="me-export"><span class="s-icon">📤</span><div class="grow">导出备份<small class="tiny" style="display:block;font-weight:400">下载 JSON 文件留存或迁移</small></div><span class="chev">›</span></div>' +
      '<div class="setting-row" id="me-import"><span class="s-icon">📥</span><div class="grow">导入备份</div><span class="chev">›</span></div>' +
      '<div class="setting-row" id="me-clear-trace"><span class="s-icon">🧹</span><div class="grow">清除使用痕迹<small class="tiny" style="display:block;font-weight:400">最近使用与搜索历史</small></div><span class="chev">›</span></div>' +
      '<div class="setting-row" id="me-clear"><span class="s-icon" style="color:var(--danger)">🗑️</span><div class="grow" style="color:var(--danger)">清空全部数据</div><span class="chev">›</span></div>' +
      '</div>' +
      '<div class="card section"><h4 style="font-size:.9rem">ℹ️ 关于与帮助</h4>' +
      '<div class="setting-row mt8" id="me-privacy"><span class="s-icon">🔒</span><div class="grow">隐私说明</div><span class="chev">›</span></div>' +
      '<div class="setting-row" id="me-usage"><span class="s-icon">📱</span><div class="grow">添加到手机主屏幕</div><span class="chev">›</span></div>' +
      '</div>' +
      '<p class="tiny center" style="margin-top:22px;opacity:.7">生活小助手 · 网页版 v1.0<br>无账号 · 无追踪 · 无广告</p>';

    LH.$('#me-theme').onchange = function () { LH.settings.theme = this.value; LH.saveSettings(); LH.applyTheme(); LH.watchSystemTheme(); };
    LH.$('#me-font').onchange = function () { LH.settings.font = this.value; LH.saveSettings(); LH.applyTheme(); };
    LH.$('#me-sound').onchange = function () { LH.settings.sound = this.checked; LH.saveSettings(); };
    LH.$('#me-export').onclick = function () { LH.downloadExport(); LH.toast('备份文件已开始下载', 'ok'); };
    LH.$('#me-import').onclick = function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = function () {
        var f = input.files && input.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          LH.confirm('导入备份', '将覆盖当前全部数据，确定继续吗？', '导入', true).then(function (ok) {
            if (!ok) return;
            LH.importAll(reader.result).then(function (n) {
              LH.toast('导入成功，共恢复 ' + n + ' 项数据', 'ok');
              renderRoute();
            }).catch(function (err) { LH.toast(err, 'err'); });
          });
        };
        reader.readAsText(f);
      };
      input.click();
    };
    LH.$('#me-clear-trace').onclick = function () {
      LH.clearRecents(); LH.clearSearchHist();
      LH.toast('已清除使用痕迹', 'ok');
    };
    LH.$('#me-clear').onclick = function () {
      LH.confirm('清空全部数据', '待办、记账、习惯等所有本地数据将被删除且无法恢复', '全部清空', true).then(function (ok) {
        if (!ok) return;
        LH.confirm('再次确认', '真的要删除全部数据吗？建议先导出备份', '我确定', true).then(function (ok2) {
          if (!ok2) return;
          LH.clearAllData();
          LH.settings = { theme: 'auto', font: 'md', sound: true, water: { goal: 2000, cup: 200, remind: false, interval: 60 }, pomodoro: { focus: 25, rest: 5, longRest: 15, longEvery: 4 } };
          LH.saveSettings(); LH.applyTheme();
          LH.toast('已清空全部数据', 'ok');
          renderRoute();
        });
      });
    };
    LH.$('#me-privacy').onclick = function () {
      LH.sheet('🔒 隐私说明',
        '<div class="tiny" style="line-height:2.1">' +
        '1. 所有记录（待办、记账、习惯、备忘等）仅保存在本机浏览器 localStorage，不上传任何服务器。<br>' +
        '2. 天气工具会向 Open-Meteo 公开接口请求天气数据；城市定位仅用于查询当地天气，位置信息不存储。<br>' +
        '3. 二维码组件首次使用时从公共 CDN（jsdelivr）加载脚本，之后缓存本地离线使用；生成与识别过程均在本地完成。<br>' +
        '4. 无账号体系、无埋点统计、无广告 SDK。<br>' +
        '5. 清除浏览器网站数据会一并删除本应用数据，请定期使用「导出备份」。</div>');
    };
    LH.$('#me-usage').onclick = function () {
      var isIOS = /iphone|ipad/i.test(navigator.userAgent);
      LH.sheet('📱 像App一样使用',
        '<div class="tiny" style="line-height:2.2">' +
        (isIOS
          ? '<b>iPhone / iPad（Safari）</b><br>1. 点浏览器底部分享按钮 ⬆️<br>2. 选择「添加到主屏幕」<br>3. 桌面图标打开即为全屏 App 体验'
          : '<b>安卓 / Chrome 等浏览器</b><br>1. 点浏览器菜单（⋮）<br>2. 选择「添加到主屏幕」或「安装应用」<br>3. 桌面图标打开即为全屏 App 体验') +
        '<br><br>💡 通过手机浏览器打开本页面后按上述操作，即可离线使用（天气等联网工具除外）。提醒功能需保持页面/应用在后台运行。</div>');
    };
  }

  /* ================= 全局提醒引擎 ================= */
  function reminderEngine() {
    setInterval(function () {
      var now = new Date();
      var hhmm = LH.timeStr(now);
      var today = LH.todayStr(now);

      /* 喝水提醒：间隔制 + 白天时段 */
      var w = LH.settings.water;
      if (w.remind && hhmm >= '08:00' && hhmm <= '22:00') {
        var last = LH.get('water_last_remind', 0);
        if (Date.now() - last > w.interval * 60000) {
          LH.set('water_last_remind', Date.now());
          var wl = LH.get('water', { log: {} }).log[today] || [];
          var wv2 = wl.reduce(function (s, x) { return s + x.ml; }, 0);
          if (wv2 < w.goal) LH.notify('💧 喝水提醒', '今日已饮 ' + wv2 + 'ml / ' + w.goal + 'ml，来一杯吧');
        }
      }

      /* 吃药提醒：到点未服 */
      var meds = LH.list('meds');
      if (meds.length) {
        var noted = LH.get('meds_notified', {});
        if (!noted[today]) noted[today] = {};
        meds.forEach(function (m) {
          m.times.forEach(function (t) {
            var key = m.id + '|' + t;
            if (hhmm >= t && !(m.log[today] && m.log[today][t]) && !noted[today][key]) {
              noted[today][key] = 1;
              LH.notify('💊 吃药提醒', m.name + ' · ' + t + ' 这顿还没服');
            }
          });
        });
        LH.set('meds_notified', noted);
      }
    }, 30000);
  }

  /* ================= 启动 ================= */
  function boot() {
    view = document.getElementById('view');
    LH.applyTheme();
    LH.watchSystemTheme();
    renderRoute();
    reminderEngine();

    /* PWA Service Worker（http/https 环境下生效，本地 file:// 自动跳过） */
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.LH);
