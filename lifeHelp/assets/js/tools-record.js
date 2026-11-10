/* ============================================================
   tools-record.js — 记录与提醒类工具
   数据全部保存在本地 localStorage
   ============================================================ */
window.LH = window.LH || {};
LH.impls = LH.impls || {};

(function (LH) {
  'use strict';
  var esc = LH.esc;

  /* ========================================================
   * 1. 待办清单
   * ======================================================== */
  var PRIO = { 0: ['', ''], 1: ['p2', '重要'], 2: ['p1', '紧急'] };

  LH.impls.todo = function (root) {
    var st = { filter: 'all', tag: '' };
    function todos() { return LH.list('todos'); }
    function save(a) { LH.saveList('todos', a); }
    function addUI() {
      var sh = LH.sheet('新建待办',
        '<div class="field"><label>内容</label><input class="input" id="td-title" placeholder="要做什么？"></div>' +
        '<div class="convert-row">' +
        '<div class="field"><label>截止日期（可选）</label><input class="input" type="date" id="td-due"></div>' +
        '<div class="field"><label>优先级</label><select class="select" id="td-prio"><option value="0">普通</option><option value="1">重要</option><option value="2">紧急</option></select></div>' +
        '</div>' +
        '<button class="btn primary block" id="td-ok">添加</button>');
      LH.$('#td-ok', sh.body).onclick = function () {
        var t = LH.$('#td-title', sh.body).value.trim();
        if (!t) return LH.toast('请输入待办内容', 'err');
        var a = todos();
        a.unshift({ id: LH.uid(), title: t, done: false, ts: Date.now(), due: LH.$('#td-due', sh.body).value || '', prio: +LH.$('#td-prio', sh.body).value, tag: '' });
        save(a); sh.close(); render(); LH.toast('已添加', 'ok');
      };
      LH.$('#td-title', sh.body).focus();
    }
    function render() {
      var a = todos();
      var tags = [];
      a.forEach(function (t) { if (t.tag && tags.indexOf(t.tag) < 0) tags.push(t.tag); });
      var list;
      if (st.tag) list = a.filter(function (t) { return t.tag === st.tag; });
      else if (st.filter === 'today') list = a.filter(function (t) { return !t.done && (!t.due || t.due <= LH.todayStr()); });
      else if (st.filter === 'open') list = a.filter(function (t) { return !t.done; });
      else if (st.filter === 'done') list = a.filter(function (t) { return t.done; });
      else list = a;
      var openCount = a.filter(function (t) { return !t.done; }).length;
      root.innerHTML =
        '<div class="flex-between mb12">' +
        '<div class="chips-row" style="flex:1">' +
        ['all:全部', 'today:今日待办', 'open:未完成', 'done:已完成'].map(function (x) {
          var p = x.split(':');
          return '<div class="chip' + (!st.tag && st.filter === p[0] ? ' active' : '') + '" data-f="' + p[0] + '">' + p[1] + '</div>';
        }).join('') +
        tags.map(function (t) {
          return '<div class="chip' + (st.tag === t ? ' active' : '') + '" data-tag="' + esc(t) + '">📦 ' + esc(t) + '</div>';
        }).join('') +
        '</div></div>' +
        '<div class="card">' +
        (list.length === 0 ? LH.emptyHTML('🗒️', st.filter === 'done' ? '还没有完成的待办' : '暂无待办事项', '点击下方按钮添加第一条') :
          list.map(function (t) {
            var p = PRIO[t.prio || 0];
            var overdue = !t.done && t.due && t.due < LH.todayStr();
            return '<div class="todo-item' + (t.done ? ' done' : '') + '">' +
              '<button class="todo-check' + (t.done ? ' done' : '') + '" data-check="' + t.id + '">' + (t.done ? '✓' : '') + '</button>' +
              '<div class="grow" data-open="' + t.id + '">' +
              '<div class="t-title">' + esc(t.title) + '</div>' +
              '<div class="t-meta">' +
              (p[1] ? '<span class="mini-tag ' + p[0] + '">' + p[1] + '</span>' : '') +
              (t.due ? '<span class="mini-tag"' + (overdue ? ' style="color:var(--danger)"' : '') + '>📅 ' + (overdue ? '已逾期 ' : '') + LH.fmtDateCN(t.due) + '</span>' : '') +
              (t.tag ? '<span class="mini-tag scene">' + esc(t.tag) + '</span>' : '') +
              '</div></div>' +
              '<button class="star-btn" style="padding:6px;color:var(--text-3)" data-del="' + t.id + '">✕</button>' +
              '</div>';
          }).join('')) +
        '</div>' +
        '<button class="btn primary block mt12" id="td-add" style="padding:14px">＋ 新建待办</button>' +
        (openCount ? '<p class="tiny mt12 center">还有 ' + openCount + ' 项未完成</p>' : '');
      LH.$('#td-add', root).onclick = addUI;
      LH.$$('[data-check]', root).forEach(function (b) {
        b.onclick = function () {
          var a2 = todos();
          var it = a2.filter(function (x) { return x.id === b.dataset.check; })[0];
          if (it) { it.done = !it.done; if (it.done) LH.beep(1); save(a2); render(); }
        };
      });
      LH.$$('[data-del]', root).forEach(function (b) {
        b.onclick = function () {
          LH.confirm('删除待办', '删除后无法恢复，确定吗？', '删除', true).then(function (ok) {
            if (!ok) return;
            save(todos().filter(function (x) { return x.id !== b.dataset.del; }));
            render(); LH.toast('已删除', 'ok');
          });
        };
      });
      LH.$$('[data-open]', root).forEach(function (el) {
        el.onclick = function () {
          var a2 = todos();
          var it = a2.filter(function (x) { return x.id === el.dataset.open; })[0];
          if (!it) return;
          var sh = LH.sheet('编辑待办',
            '<div class="field"><label>内容</label><input class="input" id="te-t" value="' + esc(it.title) + '"></div>' +
            '<div class="convert-row">' +
            '<div class="field"><label>截止日期</label><input class="input" type="date" id="te-d" value="' + esc(it.due || '') + '"></div>' +
            '<div class="field"><label>优先级</label><select class="select" id="te-p">' +
            [0, 1, 2].map(function (p) { return '<option value="' + p + '"' + ((it.prio || 0) === p ? ' selected' : '') + '>' + ['普通', '重要', '紧急'][p] + '</option>'; }).join('') +
            '</select></div></div>' +
            '<button class="btn primary block" id="te-ok">保存</button>');
          LH.$('#te-ok', sh.body).onclick = function () {
            it.title = LH.$('#te-t', sh.body).value.trim() || it.title;
            it.due = LH.$('#te-d', sh.body).value;
            it.prio = +LH.$('#te-p', sh.body).value;
            save(a2); sh.close(); render(); LH.toast('已保存', 'ok');
          };
        };
      });
      LH.$$('[data-f]', root).forEach(function (c) { c.onclick = function () { st.filter = c.dataset.f; st.tag = ''; render(); }; });
      LH.$$('[data-tag]', root).forEach(function (c) { c.onclick = function () { st.tag = (st.tag === c.dataset.tag) ? '' : c.dataset.tag; render(); }; });
    }
    render();
  };

  /* ========================================================
   * 2. 备忘录
   * ======================================================== */
  LH.impls.notes = function (root) {
    function notes() { return LH.list('notes'); }
    function save(a) { LH.saveList('notes', a); }
    function editUI(n) {
      var isNew = !n;
      var sh = LH.sheet(isNew ? '新建备忘' : '编辑备忘',
        '<div class="field"><label>标题</label><input class="input" id="nt-t" value="' + esc(n ? n.title : '') + '" placeholder="标题（可留空）"></div>' +
        '<div class="field"><label>内容</label><textarea class="input" id="nt-b" rows="7" placeholder="记录点什么…">' + esc(n ? n.body : '') + '</textarea></div>' +
        '<button class="btn primary block" id="nt-ok">保存</button>');
      LH.$('#nt-ok', sh.body).onclick = function () {
        var t = LH.$('#nt-t', sh.body).value.trim();
        var b = LH.$('#nt-b', sh.body).value;
        if (!t && !b.trim()) return LH.toast('写点什么再保存吧', 'err');
        var a = notes();
        if (isNew) a.unshift({ id: LH.uid(), title: t || b.split('\n')[0].slice(0, 18), body: b, ts: Date.now() });
        else { n.title = t || n.title; n.body = b; n.ts = Date.now(); }
        save(a); sh.close(); render(); LH.toast('已保存', 'ok');
      };
    }
    function render() {
      var a = notes();
      root.innerHTML =
        '<button class="btn primary block mb12" id="nt-add" style="padding:13px">＋ 新建备忘</button>' +
        (a.length === 0 ? '<div class="card">' + LH.emptyHTML('📝', '还没有备忘录', '随手记点什么：账号、地址、灵感…') + '</div>' :
          a.map(function (n) {
            return '<div class="card mb12" data-open="' + n.id + '" style="cursor:pointer">' +
              '<div class="flex-between"><b style="font-size:.95rem">' + esc(n.title) + '</b><span class="tiny">' + LH.relTime(n.ts) + '</span></div>' +
              '<p class="muted mt8" style="font-size:.84rem;line-height:1.6;white-space:pre-wrap;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' + esc(n.body) + '</p>' +
              '</div>';
          }).join(''));
      LH.$('#nt-add', root).onclick = function () { editUI(null); };
      LH.$$('[data-open]', root).forEach(function (el) {
        el.onclick = function () {
          var n = notes().filter(function (x) { return x.id === el.dataset.open; })[0];
          if (!n) return;
          var sh = LH.sheet(esc(n.title),
            '<p class="muted" style="font-size:.9rem;line-height:1.8;white-space:pre-wrap;word-break:break-word">' + esc(n.body) + '</p>' +
            '<p class="tiny mt12">更新于 ' + new Date(n.ts).toLocaleString('zh-CN') + '</p>' +
            '<div class="flex gap8 mt16">' +
            '<button class="btn primary grow" id="nv-edit">✏️ 编辑</button>' +
            '<button class="btn primary" id="nv-copy" style="background:var(--card-2);color:var(--text)">⧉ 复制</button>' +
            '<button class="btn danger" id="nv-del">删除</button></div>');
          LH.$('#nv-edit', sh.body).onclick = function () { sh.close(); editUI(n); };
          LH.$('#nv-copy', sh.body).onclick = function () { LH.copy(n.body); };
          LH.$('#nv-del', sh.body).onclick = function () {
            sh.close();
            LH.confirm('删除备忘', '删除后无法恢复', '删除', true).then(function (ok) {
              if (ok) { save(notes().filter(function (x) { return x.id !== n.id; })); render(); LH.toast('已删除', 'ok'); }
            });
          };
        };
      });
    }
    render();
  };

  /* ========================================================
   * 3. 记账
   * ======================================================== */
  var LEDGER_CATS = {
    out: [['餐饮', '🍜'], ['交通', '🚌'], ['购物', '🛍️'], ['居住', '🏠'], ['娱乐', '🎮'], ['医疗', '💊'], ['教育', '📚'], ['人情', '🎁'], ['其他', '📦']],
    in: [['工资', '💰'], ['红包', '🧧'], ['理财', '📈'], ['兼职', '💼'], ['其他', '✨']]
  };

  LH.impls.ledger = function (root) {
    var st = { month: LH.todayStr().slice(0, 7) };
    function entries() { return LH.list('ledger'); }
    function save(a) { LH.saveList('ledger', a); }
    function addUI() {
      var type = 'out', cat = LEDGER_CATS.out[0][0];
      var sh = LH.sheet('记一笔',
        '<div class="seg mb12" id="lg-type"><button data-t="out" class="active">支出</button><button data-t="in">收入</button></div>' +
        '<div class="field"><label>金额（元）</label><input class="input" type="number" step="0.01" id="lg-amt" placeholder="0.00" style="font-size:1.3rem;font-weight:700"></div>' +
        '<div class="field"><label>分类</label><div class="chips-row" id="lg-cats"></div></div>' +
        '<div class="convert-row">' +
        '<div class="field"><label>日期</label><input class="input" type="date" id="lg-date" value="' + LH.todayStr() + '"></div>' +
        '<div class="field"><label>备注（可选）</label><input class="input" id="lg-note" placeholder="如：午饭"></div></div>' +
        '<button class="btn primary block" id="lg-ok" style="padding:13px">保存</button>');
      function paintCats() {
        LH.$('#lg-cats', sh.body).innerHTML = LEDGER_CATS[type].map(function (c, i) {
          return '<div class="chip' + (i === 0 ? ' active' : '') + '" data-c="' + c[0] + '">' + c[1] + ' ' + c[0] + '</div>';
        }).join('');
        cat = LEDGER_CATS[type][0][0];
        LH.$$('#lg-cats .chip', sh.body).forEach(function (ch) {
          ch.onclick = function () {
            LH.$$('#lg-cats .chip', sh.body).forEach(function (x) { x.classList.remove('active'); });
            ch.classList.add('active'); cat = ch.dataset.c;
          };
        });
      }
      paintCats();
      LH.$$('#lg-type button', sh.body).forEach(function (b) {
        b.onclick = function () {
          LH.$$('#lg-type button', sh.body).forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active'); type = b.dataset.t; paintCats();
        };
      });
      LH.$('#lg-ok', sh.body).onclick = function () {
        var amt = parseFloat(LH.$('#lg-amt', sh.body).value);
        if (!(amt > 0)) return LH.toast('请输入正确金额', 'err');
        var a = entries();
        a.unshift({ id: LH.uid(), type: type, amount: Math.round(amt * 100) / 100, cat: cat, note: LH.$('#lg-note', sh.body).value.trim(), date: LH.$('#lg-date', sh.body).value || LH.todayStr(), ts: Date.now() });
        save(a); sh.close(); render(); LH.toast('已记账', 'ok');
      };
      LH.$('#lg-amt', sh.body).focus();
    }
    function render() {
      var a = entries().filter(function (e) { return e.date.indexOf(st.month) === 0; }).sort(function (x, y) { return x.date < y.date ? 1 : -1; });
      var outSum = 0, inSum = 0, byCat = {};
      a.forEach(function (e) {
        if (e.type === 'out') { outSum += e.amount; byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; }
        else inSum += e.amount;
      });
      var catRows = Object.keys(byCat).map(function (c) { return [c, byCat[c]]; }).sort(function (x, y) { return y[1] - x[1]; });
      var maxCat = catRows.length ? catRows[0][1] : 1;
      var catEmoji = function (name) {
        var f = LEDGER_CATS.out.filter(function (c) { return c[0] === name; })[0];
        return f ? f[1] : '📦';
      };
      // 按日期分组
      var days = {};
      a.forEach(function (e) { (days[e.date] = days[e.date] || []).push(e); });
      var dayKeys = Object.keys(days).sort().reverse();

      root.innerHTML =
        '<div class="flex-between mb12">' +
        '<button class="btn sm" id="lg-prev">‹</button>' +
        '<b style="font-size:1rem">' + st.month.replace('-', ' 年 ') + ' 月</b>' +
        '<button class="btn sm" id="lg-next">›</button></div>' +
        '<div class="ledger-summary">' +
        '<div class="half"><div class="k">本月支出</div><div class="v out">¥' + LH.fmtMoney(outSum) + '</div></div>' +
        '<div class="half"><div class="k">本月收入</div><div class="v in">¥' + LH.fmtMoney(inSum) + '</div></div>' +
        '</div>' +
        (catRows.length ? '<div class="card section"><h4 class="mb12">📊 支出分类</h4>' +
          catRows.slice(0, 8).map(function (r) {
            return '<div class="bar-row"><span class="b-label">' + catEmoji(r[0]) + ' ' + esc(r[0]) + '</span>' +
              '<div class="b-track"><div class="b-fill" style="width:' + (r[1] / maxCat * 100) + '%"></div></div>' +
              '<span class="b-val">¥' + LH.fmtMoney(r[1]) + '</span></div>';
          }).join('') + '</div>' : '') +
        '<div class="section"><h4 class="mb12" style="padding:0 2px">📒 流水明细</h4>' +
        (a.length === 0 ? '<div class="card">' + LH.emptyHTML('🧾', '本月还没有记录', '点下方按钮记第一笔') + '</div>' :
          dayKeys.map(function (d) {
            var dayOut = 0, dayIn = 0;
            days[d].forEach(function (e) { e.type === 'out' ? dayOut += e.amount : dayIn += e.amount; });
            return '<div class="card mb12"><div class="flex-between mb8">' +
              '<b style="font-size:.85rem">' + (d === LH.todayStr() ? '今天' : LH.fmtDateCN(d)) + '</b>' +
              '<span class="tiny">' + (dayOut ? '支出 ¥' + LH.fmtMoney(dayOut) : '') + (dayOut && dayIn ? ' · ' : '') + (dayIn ? '收入 ¥' + LH.fmtMoney(dayIn) : '') + '</span></div>' +
              days[d].map(function (e) {
                return '<div class="list-item">' +
                  '<span style="font-size:1.3rem">' + catEmoji(e.cat) + '</span>' +
                  '<div class="grow"><div class="title" style="font-weight:600">' + esc(e.cat) + (e.note ? ' · ' + esc(e.note) : '') + '</div><div class="sub">' + e.date + '</div></div>' +
                  '<b class="' + (e.type === 'out' ? 'amount-out' : 'amount-in') + '">' + (e.type === 'out' ? '-' : '+') + LH.fmtMoney(e.amount) + '</b>' +
                  '<button class="star-btn" style="padding:4px;color:var(--text-3);font-size:.85rem" data-del="' + e.id + '">✕</button></div>';
              }).join('') + '</div>';
          }).join('')) +
        '</div>' +
        '<button class="btn primary block mt12" id="lg-add" style="padding:14px">＋ 记一笔</button>';
      LH.$('#lg-add', root).onclick = addUI;
      LH.$('#lg-prev', root).onclick = function () { shiftMonth(-1); };
      LH.$('#lg-next', root).onclick = function () { shiftMonth(1); };
      function shiftMonth(d) {
        var p = st.month.split('-');
        var m = new Date(+p[0], +p[1] - 1 + d, 1);
        st.month = m.getFullYear() + '-' + LH.pad(m.getMonth() + 1);
        render();
      }
      LH.$$('[data-del]', root).forEach(function (b) {
        b.onclick = function (e) {
          e.stopPropagation();
          LH.confirm('删除记录', '删除这笔账目后无法恢复', '删除', true).then(function (ok) {
            if (!ok) return;
            save(entries().filter(function (x) { return x.id !== b.dataset.del; }));
            render(); LH.toast('已删除', 'ok');
          });
        };
      });
    }
    render();
  };

  /* ========================================================
   * 4. 习惯打卡
   * ======================================================== */
  var HABIT_EMOJIS = ['🌅', '📖', '🏃', '💧', '🧘', '💤', '🥗', '✍️', '💪', '🎸', '🚭', '📵'];

  LH.impls.habit = function (root) {
    function habits() { return LH.list('habits'); }
    function save(a) { LH.saveList('habits', a); }
    function streak(h) {
      var n = 0;
      var d = new Date();
      if (!h.days[LH.todayStr()]) d.setDate(d.getDate() - 1); // 今天没打卡不算断
      while (h.days[LH.todayStr(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    }
    function addUI() {
      var emoji = HABIT_EMOJIS[0];
      var sh = LH.sheet('新建习惯',
        '<div class="field"><label>选择图标</label><div class="chips-row" id="hb-emojis" style="flex-wrap:wrap">' +
        HABIT_EMOJIS.map(function (e, i) { return '<div class="chip' + (i === 0 ? ' active' : '') + '" data-e="' + e + '" style="font-size:1.1rem">' + e + '</div>'; }).join('') +
        '</div></div>' +
        '<div class="field"><label>习惯名称</label><input class="input" id="hb-name" placeholder="如：每天阅读 30 分钟"></div>' +
        '<button class="btn primary block" id="hb-ok">创建</button>');
      LH.$$('#hb-emojis .chip', sh.body).forEach(function (c) {
        c.onclick = function () {
          LH.$$('#hb-emojis .chip', sh.body).forEach(function (x) { x.classList.remove('active'); });
          c.classList.add('active'); emoji = c.dataset.e;
        };
      });
      LH.$('#hb-ok', sh.body).onclick = function () {
        var name = LH.$('#hb-name', sh.body).value.trim();
        if (!name) return LH.toast('请输入习惯名称', 'err');
        var a = habits();
        a.push({ id: LH.uid(), name: name, emoji: emoji, days: {} });
        save(a); sh.close(); render(); LH.toast('习惯已创建，坚持就是胜利 💪', 'ok');
      };
    }
    function last7() {
      var arr = [];
      for (var i = 6; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        arr.push(LH.todayStr(d));
      }
      return arr;
    }
    function render() {
      var a = habits();
      root.innerHTML =
        '<button class="btn primary block mb12" id="hb-add" style="padding:13px">＋ 新建习惯</button>' +
        (a.length === 0 ? '<div class="card">' + LH.emptyHTML('🌱', '还没有在坚持的习惯', '早睡早起、每天阅读、坚持运动…') + '</div>' :
          a.map(function (h) {
            var today = !!h.days[LH.todayStr()];
            var wk = last7();
            var weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
            return '<div class="card mb12">' +
              '<div class="flex-between">' +
              '<div class="flex gap12"><span style="font-size:1.6rem">' + h.emoji + '</span><div>' +
              '<b style="font-size:.95rem">' + esc(h.name) + '</b>' +
              '<div class="tiny mt4"><span class="streak-flame">🔥 连续 ' + streak(h) + ' 天</span> · 累计 ' + Object.keys(h.days).length + ' 天</div>' +
              '</div></div>' +
              '<button class="btn ' + (today ? '' : 'primary') + '" data-punch="' + h.id + '" style="' + (today ? 'background:var(--primary-soft);color:var(--primary)' : '') + '">' + (today ? '已打卡 ✓' : '打卡') + '</button>' +
              '</div>' +
              '<div class="habit-days">' +
              wk.map(function (d) {
                var dt = LH.parseDate(d);
                return '<i class="' + (h.days[d] ? 'on' : '') + (d === LH.todayStr() ? ' today' : '') + '" title="' + d + '"></i>';
              }).join('') +
              '</div>' +
              '<div class="flex-between tiny mt4"><span>近 7 天</span><button class="tiny" data-del="' + h.id + '" style="color:var(--text-3)">删除</button></div>' +
              '</div>';
          }).join(''));
      LH.$('#hb-add', root).onclick = addUI;
      LH.$$('[data-punch]', root).forEach(function (b) {
        b.onclick = function () {
          var a2 = habits();
          var h = a2.filter(function (x) { return x.id === b.dataset.punch; })[0];
          if (!h) return;
          var t = LH.todayStr();
          if (h.days[t]) { delete h.days[t]; LH.toast('已取消今日打卡'); }
          else { h.days[t] = 1; LH.beep(1); LH.toast('打卡成功！继续保持 🔥', 'ok'); }
          save(a2); render();
        };
      });
      LH.$$('[data-del]', root).forEach(function (b) {
        b.onclick = function () {
          LH.confirm('删除习惯', '打卡记录将一并删除', '删除', true).then(function (ok) {
            if (!ok) return;
            save(habits().filter(function (x) { return x.id !== b.dataset.del; }));
            render(); LH.toast('已删除', 'ok');
          });
        };
      });
    }
    render();
  };

  /* ========================================================
   * 5. 喝水提醒
   * ======================================================== */
  LH.impls.water = function (root) {
    function data() { return LH.get('water', { log: {} }); }
    function save(d) { LH.set('water', d); }
    function todayLog() { var d = data(); return d.log[LH.todayStr()] || []; }
    function todayTotal() { return todayLog().reduce(function (s, x) { return s + x.ml; }, 0); }
    var st = { tab: 'today' };
    function ring(pct) {
      var r = 84, c = 2 * Math.PI * r;
      return '<div class="water-ring-wrap">' +
        '<div class="ring-wrap" style="width:200px;height:200px">' +
        '<svg width="200" height="200"><circle cx="100" cy="100" r="' + r + '" stroke="var(--card-2)" stroke-width="14" fill="none"/>' +
        '<circle cx="100" cy="100" r="' + r + '" stroke="var(--primary)" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - Math.min(1, pct))) + '" style="transition:stroke-dashoffset .6s"/></svg>' +
        '<div class="ring-center"><div style="font-size:2.2rem">💧</div><div class="time" style="font-size:1.5rem;font-weight:800;color:var(--primary)">' + todayTotal() + '<span class="tiny"> / ' + LH.settings.water.goal + ' ml</span></div></div>' +
        '</div></div>';
    }
    function render() {
      var w = LH.settings.water;
      var log = todayLog().slice().reverse();
      var body = '';
      if (st.tab === 'today') {
        body = ring(todayTotal() / w.goal) +
          '<div class="water-quick">' +
          [100, w.cup, 300, 500].map(function (ml) {
            return '<button class="water-cup" data-add="' + ml + '"><span class="c-emoji">🥛</span>+' + ml + 'ml</button>';
          }).join('') +
          '</div>' +
          '<div class="card mt16"><div class="flex-between mb8"><b style="font-size:.9rem">今日记录</b><span class="tiny">' + log.length + ' 次</span></div>' +
          (log.length === 0 ? '<p class="tiny center" style="padding:14px 0">还没喝水，先来一杯吧 💧</p>' :
            log.map(function (x) {
              return '<div class="water-log"><span>🕐 ' + x.t + '</span><b>+' + x.ml + ' ml</b></div>';
            }).join('') +
            '<button class="tiny mt8" id="wt-undo" style="color:var(--text-3)">撤销最近一次</button>') +
          '</div>' +
          '<div class="card mt12"><h4 style="font-size:.9rem">⏰ 定时提醒（应用打开时生效）</h4>' +
          '<div class="flex-between mt12"><span class="muted" style="font-size:.85rem">每 ' + w.interval + ' 分钟提醒喝水</span>' +
          '<label class="switch"><input type="checkbox" id="wt-remind"' + (w.remind ? ' checked' : '') + '><span class="track"></span><span class="knob"></span></label></div>' +
          '<div class="convert-row mt12">' +
          '<div class="field"><label>间隔（分钟）</label><input class="input" type="number" min="15" step="5" id="wt-int" value="' + w.interval + '"></div>' +
          '<div class="field"><label>每日目标（ml）</label><input class="input" type="number" min="500" step="100" id="wt-goal" value="' + w.goal + '"></div></div>' +
          '<p class="tiny">浏览器网页无法在后台推送提醒；建议开启系统通知并保持页面打开，或安装为 PWA 使用。</p>' +
          '</div>';
      } else {
        var days = [];
        for (var i = 6; i >= 0; i--) {
          var d = new Date(); d.setDate(d.getDate() - i);
          var k = LH.todayStr(d);
          var v = (data().log[k] || []).reduce(function (s, x) { return s + x.ml; }, 0);
          days.push({ k: k, v: v });
        }
        var mx = Math.max(w.goal, Math.max.apply(null, days.map(function (x) { return x.v; })));
        body = '<div class="card"><h4 style="font-size:.9rem" class="mb12">📈 近 7 天饮水</h4>' +
          days.map(function (x) {
            return '<div class="bar-row"><span class="b-label" style="width:58px">' + LH.fmtDateCN(x.k).replace('月', '/').replace('日', '') + '</span>' +
              '<div class="b-track"><div class="b-fill" style="width:' + (x.v / mx * 100) + '%"></div></div>' +
              '<span class="b-val">' + x.v + '</span></div>';
          }).join('') + '</div>';
      }
      root.innerHTML =
        '<div class="seg mb12"><button data-t="today" class="' + (st.tab === 'today' ? 'active' : '') + '">今日</button><button data-t="week" class="' + (st.tab === 'week' ? 'active' : '') + '">近 7 天</button></div>' + body;
      LH.$$('.seg button', root).forEach(function (b) { b.onclick = function () { st.tab = b.dataset.t; render(); }; });
      LH.$$('[data-add]', root).forEach(function (b) {
        b.onclick = function () {
          var d = data();
          var t = LH.todayStr();
          d.log[t] = d.log[t] || [];
          d.log[t].push({ t: LH.timeStr(), ml: +b.dataset.add });
          save(d); LH.beep(1); render();
        };
      });
      var undo = LH.$('#wt-undo', root);
      if (undo) undo.onclick = function () {
        var d = data(); var t = LH.todayStr();
        if (d.log[t] && d.log[t].length) { d.log[t].pop(); save(d); render(); }
      };
      var rem = LH.$('#wt-remind', root);
      if (rem) rem.onchange = function () {
        LH.settings.water.remind = rem.checked;
        LH.saveSettings();
        if (rem.checked) LH.askNotify().then(function (ok) {
          LH.toast(ok ? '已开启喝水提醒' : '未获得通知权限，将在应用内提醒');
          LH.set('water_last_remind', Date.now());
        });
        else LH.toast('已关闭喝水提醒');
      };
      var int = LH.$('#wt-int', root), goal = LH.$('#wt-goal', root);
      if (int) int.onchange = function () { LH.settings.water.interval = Math.max(15, +this.value || 60); LH.saveSettings(); LH.toast('已保存'); render(); };
      if (goal) goal.onchange = function () { LH.settings.water.goal = Math.max(500, +this.value || 2000); LH.saveSettings(); LH.toast('已保存'); render(); };
    }
    render();
  };

  /* ========================================================
   * 6. 吃药提醒
   * ======================================================== */
  LH.impls.meds = function (root) {
    function meds() { return LH.list('meds'); }
    function save(a) { LH.saveList('meds', a); }
    function addUI() {
      var times = ['08:00'];
      var sh = LH.sheet('添加药品',
        '<div class="field"><label>药品名称</label><input class="input" id="md-name" placeholder="如：维生素C"></div>' +
        '<div class="field"><label>服药时间（可多个）</label><div id="md-times"></div>' +
        '<button class="btn sm mt8" id="md-addtime">＋ 添加时间</button></div>' +
        '<div class="field"><label>图标</label><div class="chips-row" style="flex-wrap:wrap" id="md-emojis">' +
        ['💊', '💉', '🩺', '🧴', '🌿'].map(function (e, i) { return '<div class="chip' + (i === 0 ? ' active' : '') + '" data-e="' + e + '">' + e + '</div>'; }).join('') + '</div></div>' +
        '<button class="btn primary block" id="md-ok">保存</button>');
      var emoji = '💊';
      function paintTimes() {
        LH.$('#md-times', sh.body).innerHTML = times.map(function (t, i) {
          return '<div class="flex gap8 mb8"><input class="input" type="time" value="' + t + '" data-i="' + i + '">' +
            (times.length > 1 ? '<button class="btn sm" data-rm="' + i + '">✕</button>' : '') + '</div>';
        }).join('');
        LH.$$('#md-times input', sh.body).forEach(function (inp) {
          inp.onchange = function () { times[+inp.dataset.i] = inp.value; };
        });
        LH.$$('#md-times [data-rm]', sh.body).forEach(function (b) {
          b.onclick = function () { times.splice(+b.dataset.rm, 1); paintTimes(); };
        });
      }
      paintTimes();
      LH.$('#md-addtime', sh.body).onclick = function () { times.push('20:00'); paintTimes(); };
      LH.$$('#md-emojis .chip', sh.body).forEach(function (c) {
        c.onclick = function () {
          LH.$$('#md-emojis .chip', sh.body).forEach(function (x) { x.classList.remove('active'); });
          c.classList.add('active'); emoji = c.dataset.e;
        };
      });
      LH.$('#md-ok', sh.body).onclick = function () {
        var name = LH.$('#md-name', sh.body).value.trim();
        if (!name) return LH.toast('请输入药品名称', 'err');
        var a = meds();
        a.push({ id: LH.uid(), name: name, emoji: emoji, times: times.filter(Boolean).sort(), log: {} });
        save(a); sh.close(); render(); LH.toast('已添加，按时吃药哦 💊', 'ok');
      };
    }
    function render() {
      var a = meds();
      var today = LH.todayStr();
      var allTaken = 0, allTimes = 0, overdue = 0;
      a.forEach(function (m) {
        allTimes += m.times.length;
        m.times.forEach(function (t) {
          if (m.log[today] && m.log[today][t]) allTaken++;
          else if (t < LH.timeStr()) overdue++;
        });
      });
      root.innerHTML =
        '<div class="record-hero mb12" style="padding:15px 18px">' +
        '<div class="flex-between"><span class="rh-title">💊 今日服药</span><button class="btn sm" id="md-add" style="background:rgba(255,255,255,.22);color:#fff">＋ 添加</button></div>' +
        '<p class="tiny" style="opacity:.85;margin-top:6px">已服 ' + allTaken + ' / ' + allTimes + ' 次' + (overdue ? ' · <b style="color:#FFE3B0">待补 ' + overdue + ' 次</b>' : (allTimes && allTaken === allTimes ? ' · 全部完成 🎉' : '')) + '</p></div>' +
        (a.length === 0 ? '<div class="card">' + LH.emptyHTML('💊', '还没有添加药品', '添加药品与服药时间，打开应用时会自动提醒') + '</div>' :
          a.map(function (m) {
            return '<div class="card mb12">' +
              '<div class="flex-between mb8"><div class="flex gap12"><span style="font-size:1.6rem">' + m.emoji + '</span>' +
              '<div><b style="font-size:.95rem">' + esc(m.name) + '</b><div class="tiny mt4">每日 ' + m.times.length + ' 次</div></div></div>' +
              '<button class="tiny" data-del="' + m.id + '" style="color:var(--text-3);padding:6px">删除</button></div>' +
              '<div class="timeline-item" style="padding:0"><div class="tl-line' + (m.times.some(function (t) { return !(m.log[today] && m.log[today][t]) && t < LH.timeStr(); }) ? ' warn' : '') + '"></div>' +
              '<div class="grow">' +
              m.times.map(function (t) {
                var taken = m.log[today] && m.log[today][t];
                var late = !taken && t < LH.timeStr();
                return '<div class="list-item" style="padding:9px 0"><span style="font-weight:700;font-size:.88rem;' + (taken ? 'color:var(--text-3);text-decoration:line-through' : late ? 'color:var(--danger)' : '') + '">🕐 ' + t + '</span>' +
                  '<div class="grow"></div>' +
                  '<button class="btn sm ' + (taken ? '' : 'primary') + '" data-take="' + m.id + '|' + t + '" style="' + (taken ? 'background:var(--primary-soft);color:var(--primary)' : '') + '">' + (taken ? '已服 ✓' : '服药') + '</button></div>';
              }).join('') +
              '</div></div></div>';
          }).join(''));
      var add = LH.$('#md-add', root); if (add) add.onclick = addUI;
      LH.$$('[data-take]', root).forEach(function (b) {
        b.onclick = function () {
          var parts = b.dataset.take.split('|');
          var a2 = meds();
          var m = a2.filter(function (x) { return x.id === parts[0]; })[0];
          if (!m) return;
          m.log[today] = m.log[today] || {};
          if (m.log[today][parts[1]]) delete m.log[today][parts[1]];
          else { m.log[today][parts[1]] = 1; LH.beep(1); LH.toast('已记录服药 💊', 'ok'); }
          save(a2); render();
        };
      });
      LH.$$('[data-del]', root).forEach(function (b) {
        b.onclick = function () {
          LH.confirm('删除药品', '将删除该药品及全部服药记录', '删除', true).then(function (ok) {
            if (!ok) return;
            save(meds().filter(function (x) { return x.id !== b.dataset.del; }));
            render(); LH.toast('已删除', 'ok');
          });
        };
      });
    }
    render();
  };

  /* ========================================================
   * 7. 生日 / 纪念日
   * ======================================================== */
  var ANNI_EMOJIS = ['🎂', '💕', '💍', '📅', '🎄', '🎓', '🏠', '🐾'];
  function anniNextDays(a) {
    var d = LH.parseDate(a.date);
    if (!d) return null;
    var now = new Date(); var today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (a.repeat === 'once') return Math.round((d - today0) / 86400000);
    var next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (next < today0) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
    return Math.round((next - today0) / 86400000);
  }
  LH._anniNextDays = anniNextDays;

  LH.impls.anniversary = function (root) {
    function annis() { return LH.list('annivs'); }
    function save(a) { LH.saveList('annivs', a); }
    function addUI() {
      var emoji = ANNI_EMOJIS[0];
      var sh = LH.sheet('添加纪念日',
        '<div class="field"><label>名称</label><input class="input" id="an-name" placeholder="如：妈妈生日 / 在一起纪念日"></div>' +
        '<div class="convert-row">' +
        '<div class="field"><label>日期</label><input class="input" type="date" id="an-date" value="' + LH.todayStr() + '"></div>' +
        '<div class="field"><label>重复</label><select class="select" id="an-rep"><option value="yearly">每年（生日/纪念日）</option><option value="once">仅一次（倒数日）</option></select></div></div>' +
        '<div class="field"><label>图标</label><div class="chips-row" style="flex-wrap:wrap" id="an-emojis">' +
        ANNI_EMOJIS.map(function (e, i) { return '<div class="chip' + (i === 0 ? ' active' : '') + '" data-e="' + e + '">' + e + '</div>'; }).join('') + '</div></div>' +
        '<button class="btn primary block" id="an-ok">保存</button>');
      LH.$$('#an-emojis .chip', sh.body).forEach(function (c) {
        c.onclick = function () {
          LH.$$('#an-emojis .chip', sh.body).forEach(function (x) { x.classList.remove('active'); });
          c.classList.add('active'); emoji = c.dataset.e;
        };
      });
      LH.$('#an-ok', sh.body).onclick = function () {
        var name = LH.$('#an-name', sh.body).value.trim();
        var date = LH.$('#an-date', sh.body).value;
        if (!name || !LH.parseDate(date)) return LH.toast('请填写名称和日期', 'err');
        var a = annis();
        a.push({ id: LH.uid(), name: name, emoji: emoji, date: date, repeat: LH.$('#an-rep', sh.body).value });
        save(a); sh.close(); render(); LH.toast('已添加', 'ok');
      };
    }
    function render() {
      var a = annis().map(function (x) { x._d = anniNextDays(x); return x; })
        .filter(function (x) { return x._d !== null; })
        .sort(function (x, y) { return x._d - y._d; });
      root.innerHTML =
        '<button class="btn primary block mb12" id="an-add" style="padding:13px">＋ 添加纪念日</button>' +
        (a.length === 0 ? '<div class="card">' + LH.emptyHTML('🎈', '还没有纪念日', '家人的生日、恋爱纪念日、重要考试倒数…') + '</div>' :
          a.map(function (x) {
            var d = x._d;
            var isToday = d === 0;
            var passed = d < 0;
            return '<div class="anni-card">' +
              '<div class="icon-tile" style="background:var(--accent-soft)">' + x.emoji + '</div>' +
              '<div class="grow"><b style="font-size:.95rem">' + esc(x.name) + '</b>' +
              '<div class="tiny mt4">' + x.date + ' · ' + (x.repeat === 'yearly' ? '每年循环' : '仅一次') + '</div></div>' +
              '<div class="a-days' + (isToday ? ' today' : '') + '"><div class="d">' + (isToday ? '今天！🎉' : passed ? Math.abs(d) + ' 天前' : d + ' 天') + '</div><div class="l">' + (passed ? '已过去' : isToday ? '就是今天' : '还剩') + '</div></div>' +
              '<button class="star-btn" style="padding:6px;color:var(--text-3)" data-del="' + x.id + '">✕</button>' +
              '</div>';
          }).join('') +
          '<p class="tiny mt12 center">按最近到来排序 · 2 月 29 日在平年按 3 月 1 日计算</p>');
      LH.$('#an-add', root).onclick = addUI;
      LH.$$('[data-del]', root).forEach(function (b) {
        b.onclick = function () {
          LH.confirm('删除纪念日', '删除后无法恢复', '删除', true).then(function (ok) {
            if (!ok) return;
            save(annis().filter(function (x) { return x.id !== b.dataset.del; }));
            render(); LH.toast('已删除', 'ok');
          });
        };
      });
    }
    render();
  };

  /* ========================================================
   * 8. 倒计时 / 秒表
   * ======================================================== */
  LH.impls.timer = function (root) {
    var st = { tab: 'down', h: 0, m: 5, s: 0 };
    // 倒计时全局状态（切走页面仍继续）
    var T = LH._timerState = LH._timerState || { running: false, left: 0, endAt: 0 };
    var SW = LH._swState = LH._swState || { running: false, startAt: 0, acc: 0, laps: [] };
    var tick = setInterval(function () {
      if (!document.body.contains(root)) return clearInterval(tick);
      if (st.tab === 'down' && T.running) {
        T.left = Math.max(0, Math.round((T.endAt - Date.now()) / 1000));
        paintDown();
        if (T.left <= 0) {
          T.running = false;
          LH.notify('⏰ 时间到', '倒计时结束');
          paintDown();
        }
      }
      if (st.tab === 'up' && SW.running) paintUp();
    }, 250);
    function fmt(sec) {
      sec = Math.max(0, sec);
      var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
      return (h > 0 ? h + ':' + LH.pad(m) : m) + ':' + LH.pad(s);
    }
    function paintDown() {
      var el = LH.$('#tm-disp', root); if (!el) return;
      el.textContent = fmt(T.running || T.left > 0 ? T.left : (st.h * 3600 + st.m * 60 + st.s));
      el.classList.toggle('warn', T.running && T.left <= 10);
      var btn = LH.$('#tm-toggle', root);
      if (btn) btn.textContent = T.running ? '⏸ 暂停' : '▶ ' + (T.left > 0 ? '继续' : '开始');
    }
    function swNow() { return SW.acc + (SW.running ? Date.now() - SW.startAt : 0); }
    function paintUp() {
      var el = LH.$('#tm-disp', root); if (!el) return;
      var ms = swNow();
      var m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000), cs = Math.floor(ms % 1000 / 10);
      el.textContent = LH.pad(m) + ':' + LH.pad(s) + '.' + LH.pad(cs);
    }
    function render() {
      var body = '';
      if (st.tab === 'down') {
        body =
          '<div class="card center">' +
          '<div class="timer-display" id="tm-disp">' + fmt(T.running ? T.left : (st.h * 3600 + st.m * 60 + st.s)) + '</div>' +
          (T.running || T.left > 0 ? '' :
            '<div class="convert-row mt16" style="justify-content:center">' +
            '<div class="field" style="width:86px"><label>时</label><input class="input center" type="number" min="0" max="23" id="tm-h" value="' + st.h + '"></div>' +
            '<div class="field" style="width:86px"><label>分</label><input class="input center" type="number" min="0" max="59" id="tm-m" value="' + st.m + '"></div>' +
            '<div class="field" style="width:86px"><label>秒</label><input class="input center" type="number" min="0" max="59" id="tm-s" value="' + st.s + '"></div></div>' +
            '<div class="chips-row mt12" style="justify-content:center">' +
            [1, 3, 5, 10, 25, 45].map(function (x) { return '<div class="chip" data-pre="' + x + '">' + x + ' 分钟</div>'; }).join('') + '</div>') +
          '<div class="timer-btns">' +
          '<button class="btn primary" id="tm-toggle">▶ 开始</button>' +
          '<button class="btn" id="tm-reset">↺ 重置</button></div>' +
          '</div>';
      } else {
        body =
          '<div class="card center">' +
          '<div class="timer-display" id="tm-disp">00:00.00</div>' +
          '<div class="timer-btns">' +
          '<button class="btn primary" id="sw-toggle">▶ 开始</button>' +
          '<button class="btn" id="sw-lap">⚑ 计次</button>' +
          '<button class="btn" id="sw-reset">↺ 重置</button></div>' +
          '<div id="sw-laps" class="mt16"></div>' +
          '</div>';
      }
      root.innerHTML =
        '<div class="seg mb12"><button data-t="down" class="' + (st.tab === 'down' ? 'active' : '') + '">倒计时</button><button data-t="up" class="' + (st.tab === 'up' ? 'active' : '') + '">秒表</button></div>' + body;
      LH.$$('.seg button', root).forEach(function (b) { b.onclick = function () { st.tab = b.dataset.t; render(); }; });
      if (st.tab === 'down') {
        paintDown();
        ['h', 'm', 's'].forEach(function (k) {
          var el = LH.$('#tm-' + k, root);
          if (el) el.oninput = function () { st[k] = Math.max(0, +this.value || 0); T.left = st.h * 3600 + st.m * 60 + st.s; paintDown(); };
        });
        LH.$$('[data-pre]', root).forEach(function (c) {
          c.onclick = function () {
            st.m = +c.dataset.pre; st.h = 0; st.s = 0;
            T.left = st.m * 60; T.running = false; render();
          };
        });
        LH.$('#tm-toggle', root).onclick = function () {
          if (T.running) { T.left = Math.max(0, Math.round((T.endAt - Date.now()) / 1000)); T.running = false; }
          else {
            if (T.left <= 0) { T.left = st.h * 3600 + st.m * 60 + st.s; }
            if (T.left <= 0) return LH.toast('请先设置时长', 'err');
            T.endAt = Date.now() + T.left * 1000; T.running = true;
          }
          render();
        };
        LH.$('#tm-reset', root).onclick = function () { T.running = false; T.left = st.h * 3600 + st.m * 60 + st.s; render(); };
      } else {
        paintUp(); paintLaps();
        LH.$('#sw-toggle', root).onclick = function () {
          if (SW.running) { SW.acc += Date.now() - SW.startAt; SW.running = false; }
          else { SW.startAt = Date.now(); SW.running = true; }
          render();
        };
        LH.$('#sw-lap', root).onclick = function () {
          SW.laps.unshift(swNow()); render();
        };
        LH.$('#sw-reset', root).onclick = function () {
          SW.running = false; SW.acc = 0; SW.laps = []; render();
        };
      }
      function paintLaps() {
        var el = LH.$('#sw-laps', root); if (!el) return;
        el.innerHTML = SW.laps.length ? SW.laps.map(function (l, i) {
          var n = SW.laps.length - i;
          var m = Math.floor(l / 60000), s = Math.floor(l % 60000 / 1000), cs = Math.floor(l % 1000 / 10);
          return '<div class="flex-between list-item"><span class="muted">第 ' + n + ' 次</span><b>' + LH.pad(m) + ':' + LH.pad(s) + '.' + LH.pad(cs) + '</b></div>';
        }).join('') : '';
      }
    }
    render();
  };

  /* ========================================================
   * 9. 番茄钟
   * ======================================================== */
  LH.impls.pomodoro = function (root) {
    var P = LH._pomoState = LH._pomoState || { mode: 'focus', running: false, left: 0, endAt: 0, count: 0 };
    function cfg() { return LH.settings.pomodoro; }
    function modeName(m) { return m === 'focus' ? '🍅 专注中' : m === 'rest' ? '☕ 小憩一下' : '🌿 长休息'; }
    function modeLen(m) { var c = cfg(); return m === 'focus' ? c.focus * 60 : m === 'rest' ? c.rest * 60 : c.longRest * 60; }
    function todayCount() { var l = LH.get('pomo_log', {}); return l[LH.todayStr()] || 0; }
    var tick = setInterval(function () {
      if (!document.body.contains(root)) return clearInterval(tick);
      if (!P.running) return;
      P.left = Math.max(0, Math.round((P.endAt - Date.now()) / 1000));
      if (P.left <= 0) {
        P.running = false;
        if (P.mode === 'focus') {
          P.count++;
          var l = LH.get('pomo_log', {}); l[LH.todayStr()] = (l[LH.todayStr()] || 0) + 1; LH.set('pomo_log', l);
          var nextMode = (P.count % cfg().longEvery === 0) ? 'long' : 'rest';
          LH.notify('🍅 专注完成！', '休息一下吧' + (nextMode === 'long' ? '（长休息）' : ''));
          P.mode = nextMode;
        } else {
          LH.notify('⏰ 休息结束', '开始新一轮专注吧');
          P.mode = 'focus';
        }
        P.left = modeLen(P.mode);
        render();
        return;
      }
      paint();
    }, 250);
    function paint() {
      var el = LH.$('#pm-time', root); if (!el) return;
      el.textContent = LH.pad(Math.floor(P.left / 60)) + ':' + LH.pad(P.left % 60);
      var total = modeLen(P.mode);
      LH.$('#pm-arc', root).style.strokeDashoffset = 679 * (P.left / total);
    }
    function render() {
      var c = cfg();
      root.innerHTML =
        '<div class="card center">' +
        '<div class="ring-wrap">' +
        '<svg width="230" height="230"><circle cx="115" cy="115" r="108" stroke="var(--card-2)" stroke-width="12" fill="none"/>' +
        '<circle id="pm-arc" cx="115" cy="115" r="108" stroke="var(--primary)" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="679" stroke-dashoffset="0" style="transition:stroke-dashoffset .3s"/></svg>' +
        '<div class="ring-center"><div class="mode">' + modeName(P.mode) + '</div><div class="time" id="pm-time">' + LH.pad(Math.floor(P.left / 60)) + ':' + LH.pad(P.left % 60) + '</div>' +
        '<div class="count">今日已完成 ' + todayCount() + ' 个番茄 🍅</div></div></div>' +
        '<div class="timer-btns">' +
        '<button class="btn primary" id="pm-toggle">' + (P.running ? '⏸ 暂停' : '▶ 开始') + '</button>' +
        '<button class="btn" id="pm-skip">⏭ 跳过</button>' +
        '<button class="btn" id="pm-reset">↺ 重置</button></div>' +
        '</div>' +
        '<div class="card section"><h4>⚙️ 设置（分钟）</h4>' +
        '<div class="convert-row mt12">' +
        '<div class="field"><label>专注</label><input class="input center" type="number" min="5" max="90" data-cfg="focus" value="' + c.focus + '"></div>' +
        '<div class="field"><label>小憩</label><input class="input center" type="number" min="1" max="30" data-cfg="rest" value="' + c.rest + '"></div>' +
        '<div class="field"><label>长休息</label><input class="input center" type="number" min="5" max="45" data-cfg="longRest" value="' + c.longRest + '"></div>' +
        '<div class="field"><label>长休间隔</label><input class="input center" type="number" min="2" max="8" data-cfg="longEvery" value="' + c.longEvery + '"></div></div>' +
        '<p class="tiny">经典番茄工作法：25 分钟专注 + 5 分钟休息，每 4 轮来一次长休息。</p></div>';
      if (P.left <= 0) P.left = modeLen(P.mode);
      LH.$('#pm-toggle', root).onclick = function () {
        if (P.running) { P.left = Math.max(0, Math.round((P.endAt - Date.now()) / 1000)); P.running = false; }
        else { P.endAt = Date.now() + P.left * 1000; P.running = true; LH.beep(1); }
        render();
      };
      LH.$('#pm-skip', root).onclick = function () {
        if (P.mode === 'focus') {
          var l = LH.get('pomo_log', {});
          P.count++;
          P.mode = (P.count % cfg().longEvery === 0) ? 'long' : 'rest';
        } else P.mode = 'focus';
        P.running = false; P.left = modeLen(P.mode);
        render();
      };
      LH.$('#pm-reset', root).onclick = function () {
        P.running = false; P.left = modeLen(P.mode); render();
      };
      LH.$$('[data-cfg]', root).forEach(function (inp) {
        inp.onchange = function () {
          LH.settings.pomodoro[inp.dataset.cfg] = Math.max(1, +inp.value || c[inp.dataset.cfg]);
          LH.saveSettings();
          if (!P.running) { P.left = modeLen(P.mode); }
          render();
        };
      });
      paint();
    }
    render();
  };
})(window.LH);
