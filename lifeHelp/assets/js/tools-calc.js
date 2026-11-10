/* ============================================================
   tools-calc.js — 计算与换算类工具
   ============================================================ */
window.LH = window.LH || {};
LH.impls = LH.impls || {};

(function (LH) {
  'use strict';
  var esc = LH.esc;

  /* ========================================================
   * 1. 计算器（基础 + 科学，含表达式解析引擎）
   * ======================================================== */
  var calcState = { expr: '', last: '0', mode: 'basic', deg: true };

  function tokenizeExpr(src) {
    var tokens = [];
    var i = 0, s = src;
    while (i < s.length) {
      var c = s[i];
      if (c === ' ') { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        var num = s.slice(i, j);
        if ((num.match(/\./g) || []).length > 1) throw '数字格式错误';
        tokens.push({ t: 'num', v: parseFloat(num), raw: num });
        i = j; continue;
      }
      if (/[a-zA-Zπ√]/.test(c)) {
        if (c === 'π') { tokens.push({ t: 'num', v: Math.PI, raw: 'π' }); i++; continue; }
        if (c === '√') { tokens.push({ t: 'fn', v: 'sqrt' }); i++; continue; }
        var k = i;
        while (k < s.length && /[a-zA-Z]/.test(s[k])) k++;
        var name = s.slice(i, k).toLowerCase();
        if (name === 'ans') { tokens.push({ t: 'num', v: calcState.lastNum || 0, raw: 'Ans' }); i = k; continue; }
        if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'abs'].indexOf(name) >= 0) {
          tokens.push({ t: 'fn', v: name }); i = k; continue;
        }
        if (name === 'e') { tokens.push({ t: 'num', v: Math.E, raw: 'e' }); i = k; continue; }
        throw '无法识别：' + name;
      }
      if ('+-*/^%!()'.indexOf(c) >= 0) { tokens.push({ t: c }); i++; continue; }
      throw '无法识别的字符：' + c;
    }
    return tokens;
  }

  // 中缀 → 逆波兰（shunting-yard），支持一元负号与后缀 ! %
  function toRPN(tokens) {
    var prec = { 'u-': 4.5, '^': 4, '*': 3, '/': 3, '+': 2, '-': 2, '!': 5, '%': 5 };
    var rightAssoc = { '^': true, 'u-': true };
    var out = [], ops = [];
    var prev = null;
    for (var idx = 0; idx < tokens.length; idx++) {
      var tk = tokens[idx];
      if (tk.t === 'num') out.push(tk);
      else if (tk.t === 'fn') ops.push(tk);
      else if (tk.t === '(') { ops.push(tk); }
      else if (tk.t === ')') {
        while (ops.length && ops[ops.length - 1].t !== '(') out.push(ops.pop());
        if (!ops.length) throw '括号不匹配';
        ops.pop();
        if (ops.length && ops[ops.length - 1].t === 'fn') out.push(ops.pop());
      } else { // 运算符
        var op = tk.t;
        if (op === '-' && (prev === null || prev.t === 'fn' || ('+-*/^%!('.indexOf(prev.t) >= 0 && prev.t !== ')'))) op = 'u-';
        if (op === '!' || op === '%') { out.push({ t: 'post', v: op }); prev = tk; continue; }
        while (ops.length) {
          var top = ops[ops.length - 1];
          if (top.t === '(') break;
          if (top.t === 'fn') { out.push(ops.pop()); continue; }
          var p1 = prec[op], p2 = prec[top.t];
          if (p2 > p1 || (p2 === p1 && !rightAssoc[op])) out.push(ops.pop());
          else break;
        }
        ops.push({ t: op });
      }
      prev = tk;
    }
    while (ops.length) {
      var o = ops.pop();
      if (o.t === '(') throw '括号不匹配';
      out.push(o);
    }
    return out;
  }

  function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) throw '阶乘仅支持非负整数';
    if (n > 170) return Infinity;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }

  function evalRPN(rpn) {
    var st = [];
    for (var i = 0; i < rpn.length; i++) {
      var tk = rpn[i];
      if (tk.t === 'num') { st.push(tk.v); continue; }
      if (tk.t === 'fn') {
        var a = st.pop();
        if (a === undefined) throw '表达式不完整';
        var ang = calcState.deg && ['sin', 'cos', 'tan'].indexOf(tk.v) >= 0 ? a * Math.PI / 180 : a;
        var map = {
          sin: Math.sin(ang), cos: Math.cos(ang), tan: Math.tan(ang),
          ln: a > 0 ? Math.log(a) : NaN, log: a > 0 ? Math.log10(a) : NaN,
          sqrt: a >= 0 ? Math.sqrt(a) : NaN, abs: Math.abs(a)
        };
        st.push(map[tk.v]); continue;
      }
      if (tk.t === 'post') {
        var x = st.pop();
        if (x === undefined) throw '表达式不完整';
        st.push(tk.v === '!' ? factorial(x) : x / 100);
        continue;
      }
      if (tk.t === 'u-') {
        var u = st.pop();
        if (u === undefined) throw '表达式不完整';
        st.push(-u);
        continue;
      }
      var b = st.pop(), a2 = st.pop();
      if (b === undefined || a2 === undefined) throw '表达式不完整';
      switch (tk.t) {
        case '+': st.push(a2 + b); break;
        case '-': st.push(a2 - b); break;
        case '*': st.push(a2 * b); break;
        case '/': st.push(b === 0 ? NaN : a2 / b); break;
        case '^': st.push(Math.pow(a2, b)); break;
        case 'u-': st.push(-b); break;
      }
    }
    if (st.length !== 1) throw '表达式不完整';
    return st[0];
  }

  function calcFmt(n) {
    if (typeof n !== 'number' || isNaN(n)) return '错误';
    if (!isFinite(n)) return n > 0 ? '∞' : '-∞';
    var s = parseFloat(n.toPrecision(12));
    var str = String(s);
    if (str.length > 18 && Math.abs(s) >= 1e15) { // 大数用科学计数法
      return s.toExponential(8).replace(/\.?0+e/, 'e');
    }
    return str;
  }

  function calcEval(expr) {
    var rpn = toRPN(tokenizeExpr(expr));
    var v = evalRPN(rpn);
    return v;
  }
  LH._calcEval = calcEval; // 供测试

  LH.impls.calculator = function (root) {
    var histKey = 'calc_history';
    var keysBasic = [
      { l: 'AC', cls: 'fn', a: 'clear' }, { l: '⌫', cls: 'fn', a: 'back' }, { l: '%', cls: 'fn', a: 'in:%' }, { l: '÷', cls: 'op', a: 'in:/' },
      { l: '7', a: 'in:7' }, { l: '8', a: 'in:8' }, { l: '9', a: 'in:9' }, { l: '×', cls: 'op', a: 'in:*' },
      { l: '4', a: 'in:4' }, { l: '5', a: 'in:5' }, { l: '6', a: 'in:6' }, { l: '−', cls: 'op', a: 'in:-' },
      { l: '1', a: 'in:1' }, { l: '2', a: 'in:2' }, { l: '3', a: 'in:3' }, { l: '+', cls: 'op', a: 'in:+' },
      { l: '0', a: 'in:0', span: true }, { l: '.', a: 'in:.' }, { l: '=', cls: 'eq', a: 'eq' }
    ];
    var keysSci = [
      { l: '(', cls: 'fn', a: 'in:(' }, { l: ')', cls: 'fn', a: 'in:)' },
      { l: 'sin', cls: 'fn', a: 'in:sin(' }, { l: 'cos', cls: 'fn', a: 'in:cos(' }, { l: 'tan', cls: 'fn', a: 'in:tan(' },
      { l: 'ln', cls: 'fn', a: 'in:ln(' }, { l: 'log', cls: 'fn', a: 'in:log(' }, { l: '√', cls: 'fn', a: 'in:√(' },
      { l: 'xʸ', cls: 'fn', a: 'in:^' }, { l: 'n!', cls: 'fn', a: 'in:!' },
      { l: 'π', cls: 'fn', a: 'in:π' }, { l: 'e', cls: 'fn', a: 'in:e' }, { l: '%', cls: 'fn', a: 'in:%' },
      { l: 'Ans', cls: 'fn', a: 'in:Ans' }, { l: 'DEG/RAD', cls: 'fn deg', a: 'deg' }
    ];

    function padHTML() {
      var html = '<div class="calc-pad' + (calcState.mode === 'sci' ? ' sci' : '') + '">';
      (calcState.mode === 'sci' ? keysSci : []).forEach(function (k) {
        var label = k.a === 'deg' ? (calcState.deg ? 'DEG' : 'RAD') : k.l;
        html += '<button class="calc-key fn" data-a="' + k.a + '">' + label + '</button>';
      });
      (calcState.mode === 'sci' ? keysBasic.filter(function (k) { return k.l !== '%'; }) : keysBasic).forEach(function (k) {
        html += '<button class="calc-key ' + (k.cls || '') + '" data-a="' + k.a + '"' + (k.span ? ' data-span="1"' : '') + '>' + k.l + '</button>';
      });
      return html + '</div>';
    }

    function render() {
      var hist = LH.get(histKey, []);
      root.innerHTML =
        '<div class="seg mb12">' +
        '<button data-mode="basic" class="' + (calcState.mode === 'basic' ? 'active' : '') + '">基础</button>' +
        '<button data-mode="sci" class="' + (calcState.mode === 'sci' ? 'active' : '') + '">科学</button>' +
        '</div>' +
        '<div class="calc-screen">' +
        '<div class="calc-expr">' + esc(calcState.expr || ' ') + '</div>' +
        '<div class="calc-out">' + esc(calcState.last) + '</div>' +
        (hist.length ? '<div class="calc-history" id="calc-hist"></div>' : '') +
        '</div>' + padHTML();

      var histEl = LH.$('#calc-hist', root);
      if (histEl) {
        histEl.innerHTML = hist.slice(0, 8).map(function (h) {
          return '<div class="h-item" data-e="' + esc(h.e) + '">' + esc(h.e) + ' = <span class="r">' + esc(h.r) + '</span></div>';
        }).join('');
        histEl.addEventListener('click', function (e) {
          var it = e.target.closest('.h-item');
          if (it) { calcState.expr = it.getAttribute('data-e'); render(); }
        });
      }

      LH.$$('.seg button', root).forEach(function (b) {
        b.onclick = function () { calcState.mode = b.dataset.mode; render(); };
      });

      LH.$$('.calc-key', root).forEach(function (btn) {
        btn.onclick = function () {
          var a = btn.dataset.a;
          if (a === 'clear') { calcState.expr = ''; calcState.last = '0'; }
          else if (a === 'back') { calcState.expr = calcState.expr.slice(0, -1); }
          else if (a === 'deg') { calcState.deg = !calcState.deg; btn.textContent = calcState.deg ? 'DEG' : 'RAD'; LH.toast('角度模式：' + (calcState.deg ? '角度制 DEG' : '弧度制 RAD')); return; }
          else if (a === 'eq') {
            if (!calcState.expr.trim()) return;
            try {
              var v = calcEval(calcState.expr);
              var res = calcFmt(v);
              calcState.last = res;
              calcState.lastNum = typeof v === 'number' && isFinite(v) ? v : 0;
              if (res !== '错误') {
                var h = LH.get(histKey, []);
                h.unshift({ e: calcState.expr, r: res });
                if (h.length > 30) h.length = 30;
                LH.set(histKey, h);
              }
              calcState.expr = '';
            } catch (err) {
              calcState.last = '错误';
              LH.toast(String(err), 'err');
            }
          }
          else if (a.indexOf('in:') === 0) {
            var piece = a.slice(3).replace(/\//g, '/');
            calcState.expr += piece;
          }
          render();
        };
      });
    }
    render();
  };

  /* ========================================================
   * 2. 单位换算
   * ======================================================== */
  var UNIT_CATS = [
    {
      id: 'length', name: '长度', emoji: '📏', base: '米',
      units: [
        ['nm', '纳米', 1e-9], ['mm', '毫米', 0.001], ['cm', '厘米', 0.01], ['m', '米', 1],
        ['km', '千米', 1000], ['in', '英寸', 0.0254], ['ft', '英尺', 0.3048],
        ['yd', '码', 0.9144], ['mi', '英里', 1609.344], ['ly', '光年', 9.4607304726e15]
      ]
    },
    {
      id: 'area', name: '面积', emoji: '🗺️', base: '平方米',
      units: [
        ['mm2', '平方毫米', 1e-6], ['cm2', '平方厘米', 1e-4], ['m2', '平方米', 1],
        ['ha', '公顷', 1e4], ['mu', '亩', 666.6666667], ['km2', '平方千米', 1e6],
        ['ft2', '平方英尺', 0.09290304], ['acre', '英亩', 4046.8564224]
      ]
    },
    {
      id: 'volume', name: '体积', emoji: '🥤', base: '升',
      units: [
        ['ml', '毫升', 0.001], ['l', '升', 1], ['m3', '立方米', 1000],
        ['gal', '加仑(美)', 3.785411784], ['floz', '液量盎司', 0.0295735296], ['cup', '杯(美制)', 0.2365882365]
      ]
    },
    {
      id: 'weight', name: '重量', emoji: '⚖️', base: '克',
      units: [
        ['mg', '毫克', 0.001], ['g', '克', 1], ['kg', '千克', 1000], ['t', '吨', 1e6],
        ['jin', '斤', 500], ['liang', '两', 50], ['oz', '盎司', 28.349523125], ['lb', '磅', 453.59237]
      ]
    },
    { id: 'temp', name: '温度', emoji: '🌡️', base: '摄氏度', isTemp: true,
      units: [['c', '摄氏度', 0], ['f', '华氏度', 0], ['k', '开尔文', 0]] },
    {
      id: 'speed', name: '速度', emoji: '🚀', base: '米/秒',
      units: [
        ['ms', '米/秒', 1], ['kmh', '千米/小时', 1 / 3.6], ['mph', '英里/小时', 0.44704],
        ['knot', '节', 0.5144444], ['mach', '马赫', 340.29]
      ]
    },
    {
      id: 'time', name: '时间', emoji: '⏱️', base: '秒',
      units: [
        ['ms', '毫秒', 0.001], ['s', '秒', 1], ['min', '分钟', 60], ['h', '小时', 3600],
        ['d', '天', 86400], ['wk', '周', 604800], ['mo', '月(30天)', 2592000], ['yr', '年(365天)', 31536000]
      ]
    },
    {
      id: 'data', name: '数据', emoji: '💾', base: '字节',
      units: [
        ['b', '字节 B', 1], ['kb', 'KB', 1024], ['mb', 'MB', 1048576],
        ['gb', 'GB', 1073741824], ['tb', 'TB', 1099511627776]
      ]
    }
  ];

  function tempToC(v, u) { return u === 'c' ? v : u === 'f' ? (v - 32) * 5 / 9 : v - 273.15; }
  function tempFromC(c, u) { return u === 'c' ? c : u === 'f' ? c * 9 / 5 + 32 : c + 273.15; }
  function smartNum(n) {
    if (isNaN(n)) return '—';
    var abs = Math.abs(n);
    var s = abs !== 0 && (abs < 1e-6 || abs >= 1e15) ? n.toExponential(6) : String(parseFloat(n.toPrecision(12)));
    return s;
  }

  LH.impls['unit-convert'] = function (root) {
    var st = { cat: 'length', from: 'm', to: 'cm', val: '1' };
    function cat() { return UNIT_CATS.filter(function (c) { return c.id === st.cat; })[0]; }
    function unitName(c, id) {
      var u = c.units.filter(function (x) { return x[0] === id; })[0];
      return u ? u[2] ? u[1] : u[1] : id;
    }
    function convert() {
      var v = parseFloat(st.val);
      if (isNaN(v)) return null;
      var c = cat();
      if (c.isTemp) return tempFromC(tempToC(v, st.from), st.to);
      var f = c.units.filter(function (x) { return x[0] === st.from; })[0][2];
      var t = c.units.filter(function (x) { return x[0] === st.to; })[0][2];
      return v * f / t;
    }
    function render() {
      var c = cat();
      var opts = c.units.map(function (u) {
        return '<option value="' + u[0] + '"' + (u[0] === st.from ? ' selected' : '') + '>' + u[1] + '</option>';
      }).join('');
      var opts2 = c.units.map(function (u) {
        return '<option value="' + u[0] + '"' + (u[0] === st.to ? ' selected' : '') + '>' + u[1] + '</option>';
      }).join('');
      var res = convert();
      root.innerHTML =
        '<div class="chips-row mb12" id="uc-cats">' +
        UNIT_CATS.map(function (x) {
          return '<div class="chip' + (x.id === st.cat ? ' active' : '') + '" data-id="' + x.id + '">' + x.emoji + ' ' + x.name + '</div>';
        }).join('') + '</div>' +
        '<div class="card">' +
        '<div class="convert-row">' +
        '<div class="field"><label>原始数值</label><input class="input" id="uc-val" type="text" inputmode="decimal" value="' + esc(st.val) + '"></div>' +
        '<button class="swap-btn" id="uc-swap" title="交换">⇄</button>' +
        '</div>' +
        '<div class="convert-row mt12">' +
        '<div class="field"><select class="select" id="uc-from">' + opts + '</select></div>' +
        '<div class="field"><select class="select" id="uc-to">' + opts2 + '</select></div>' +
        '</div>' +
        '<div class="result-box"><div class="label">换算结果</div><div class="value" id="uc-res">' +
        (res === null ? '请输入数值' : smartNum(res) + ' ' + unitName(c, st.to)) +
        '</div></div>' +
        '<button class="btn sm mt12" id="uc-copy">⧉ 复制结果</button>' +
        '</div>';
      LH.$$('#uc-cats .chip', root).forEach(function (ch) {
        ch.onclick = function () {
          st.cat = ch.dataset.id;
          var cc = cat();
          st.from = cc.units[3] ? cc.units[3][0] : cc.units[0][0];
          st.to = cc.units[1][0];
          if (cc.id === 'temp') { st.from = 'c'; st.to = 'f'; }
          render();
        };
      });
      LH.$('#uc-val', root).oninput = function () { st.val = this.value; update(); };
      LH.$('#uc-from', root).onchange = function () { st.from = this.value; update(); };
      LH.$('#uc-to', root).onchange = function () { st.to = this.value; update(); };
      LH.$('#uc-swap', root).onclick = function () {
        var res = convert();
        var t = st.from; st.from = st.to; st.to = t;
        if (res !== null && !isNaN(parseFloat(st.val))) st.val = smartNum(res);
        render();
      };
      LH.$('#uc-copy', root).onclick = function () {
        var r = convert();
        if (r === null) return LH.toast('请先输入数值', 'err');
        LH.copy(smartNum(r) + ' ' + unitName(cat(), st.to));
      };
      function update() {
        var r = convert();
        LH.$('#uc-res', root).textContent = r === null ? '请输入数值' : smartNum(r) + ' ' + unitName(cat(), st.to);
      }
    }
    render();
  };
  LH._unitCats = UNIT_CATS; // 供测试
  LH._tempToC = tempToC; LH._tempFromC = tempFromC;

  /* ========================================================
   * 3. 进制转换
   * ======================================================== */
  LH.impls.radix = function (root) {
    var st = { val: '255', from: 10 };
    var DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
    function parseVal(str, base) {
      str = String(str).trim().toLowerCase().replace(/\s/g, '');
      if (!str) return null;
      if (base === 10 && /^[+-]?\d+(\.\d+)?$/.test(str)) return parseFloat(str);
      if (!/^[0-9a-z]+$/.test(str.replace(/^[+-]/, ''))) return null;
      var neg = str[0] === '-';
      if (neg || str[0] === '+') str = str.slice(1);
      for (var i = 0; i < str.length; i++) {
        var d = DIGITS.indexOf(str[i]);
        if (d < 0 || d >= base) return null;
      }
      var n = parseInt(str, base);
      return isNaN(n) ? null : (neg ? -n : n);
    }
    function render() {
      var n = parseVal(st.val, st.from);
      var rows = n === null ? [] : [2, 8, 10, 16].map(function (b) {
        return { b: b, label: { 2: '二进制 BIN', 8: '八进制 OCT', 10: '十进制 DEC', 16: '十六进制 HEX' }[b], v: Math.abs(n).toString(b).toUpperCase() };
      });
      root.innerHTML =
        '<div class="card">' +
        '<div class="field"><label>数值</label><input class="input" id="rx-val" value="' + esc(st.val) + '" placeholder="如 255 或 ff"></div>' +
        '<div class="field"><label>原始进制</label><select class="select" id="rx-from">' +
        [2, 8, 10, 16, 32, 36].map(function (b) {
          return '<option value="' + b + '"' + (b === st.from ? ' selected' : '') + '>' + b + ' 进制</option>';
        }).join('') +
        '</select></div>' +
        (n === null
          ? '<div class="perm-tip">⚠️ 请输入与所选进制匹配的合法数值（整数）</div>'
          : '<div class="stat-grid c2">' + rows.map(function (r) {
              return '<div class="stat-cell"><div class="v" style="font-size:.88rem">' + esc(r.v) + '</div><div class="k">' + r.label + (st.from === r.b ? ' ·源' : '') + '</div></div>';
            }).join('') + '</div>' +
          '<div class="mt12 center"><button class="btn sm" id="rx-copy10">复制十进制</button></div>' +
          '<p class="tiny mt12 center">超出 ±2⁵³ 的数值会有精度损失，结果仅供参考</p>') +
        '</div>';
      LH.$('#rx-val', root).oninput = function () { st.val = this.value; render(); var el = LH.$('#rx-val', root); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
      LH.$('#rx-from', root).onchange = function () { st.from = +this.value; render(); };
      var cp = LH.$('#rx-copy10', root);
      if (cp) cp.onclick = function () { LH.copy(rows.filter(function (r) { return r.b === 10; })[0].v); };
    }
    render();
  };
  LH._radixParse = function (v, b) {
    var DIGITS2 = '0123456789abcdefghijklmnopqrstuvwxyz';
    v = String(v).trim().toLowerCase();
    if (!/^[0-9a-z]+$/.test(v)) return null;
    for (var i = 0; i < v.length; i++) { var d = DIGITS2.indexOf(v[i]); if (d < 0 || d >= b) return null; }
    var n = parseInt(v, b); return isNaN(n) ? null : n;
  };

  /* ========================================================
   * 4. 大写金额
   * ======================================================== */
  function rmbUpper(n) {
    if (!isFinite(n)) return '金额无效';
    n = Math.round(Math.abs(n) * 100);
    if (n === 0) return '零元整';
    var D = '零壹贰叁肆伍陆柒捌玖';
    var U1 = ['', '拾', '佰', '仟'];
    var SEC = ['', '万', '亿', '万亿'];
    var fen = n % 10, jiao = Math.floor(n / 10) % 10;
    var int = Math.floor(n / 100);
    var intStr = String(int);
    // 每 4 位一段
    var segs = [];
    while (intStr.length > 0) { segs.unshift(intStr.slice(-4)); intStr = intStr.slice(0, -4); }
    function segToCN(s) {
      var out = '', zero = false;
      for (var i = 0; i < s.length; i++) {
        var d = +s[i], pos = s.length - 1 - i;
        if (d === 0) { zero = true; continue; }
        if (zero && out) out += '零';
        out += D[d] + U1[pos];
        zero = false;
      }
      return out;
    }
    var result = '', pendingZero = false, seen = false;
    for (var si = 0; si < segs.length; si++) {
      var seg = segToCN(segs[si]);
      var secIdx = segs.length - 1 - si;
      if (seg) {
        if (seen && (pendingZero || +segs[si] < 1000)) result += '零';
        result += seg + SEC[secIdx];
        seen = true; pendingZero = false;
      } else if (seen) pendingZero = true;
    }
    if (int > 0) result += '元';
    if (jiao === 0 && fen === 0) return (result || '') + (int > 0 ? '整' : '');
    if (jiao > 0) result += D[jiao] + '角';
    else if (fen > 0 && int > 0) result += '零';
    if (fen > 0) result += D[fen] + '分';
    return result;
  }
  LH._rmbUpper = rmbUpper; // 测试

  LH.impls['rmb-case'] = function (root) {
    var st = { val: '' };
    function render() {
      var n = parseFloat(st.val);
      var ok = !isNaN(n) && n >= 0 && n < 1e13;
      root.innerHTML =
        '<div class="card">' +
        '<div class="field"><label>金额（元）</label><input class="input" id="rmb-in" inputmode="decimal" placeholder="如 1234.56" value="' + esc(st.val) + '"></div>' +
        (st.val.trim() === '' ? '' :
          ok ? '<div class="result-box"><div class="label">人民币大写</div><div class="value small" style="line-height:1.6">' + esc(rmbUpper(n)) + '</div></div>' +
               '<button class="btn sm mt12" id="rmb-copy">⧉ 复制大写</button>'
            : '<div class="perm-tip">⚠️ 请输入 0 ~ 9999亿 以内的正数金额</div>') +
        '</div>' +
        '<div class="card section"><h4>💡 小知识</h4><p class="tiny mt8" style="line-height:1.8">大写金额用于支票、合同、收据等场合，可防止涂改。零的写法遵循「中间有零写零、末尾有零不写、角位为零写零角或零分」的规范。</p></div>';
      LH.$('#rmb-in', root).oninput = function () { st.val = this.value; render(); var el = LH.$('#rmb-in', root); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
      var cp = LH.$('#rmb-copy', root);
      if (cp) cp.onclick = function () { LH.copy(rmbUpper(parseFloat(st.val))); };
    }
    render();
  };

  /* ========================================================
   * 5. 日期计算
   * ======================================================== */
  LH.impls['date-calc'] = function (root) {
    var st = { tab: 'diff', a: LH.todayStr(), b: LH.todayStr(), base: LH.todayStr(), n: '100', unit: 'd' };
    function workdays(a, b) {
      var d1 = LH.parseDate(Math.min(a, b) === a ? a : b); // 早的
      var d2 = LH.parseDate(Math.max(a, b) === a ? a : b);
      var n = 0, d = new Date(d1);
      while (d < d2) {
        var w = d.getDay();
        if (w !== 0 && w !== 6) n++;
        d.setDate(d.getDate() + 1);
      }
      return n;
    }
    function addDate(baseStr, n, unit) {
      var d = LH.parseDate(baseStr);
      if (!d) return null;
      if (unit === 'd') d.setDate(d.getDate() + n);
      else if (unit === 'w') d.setDate(d.getDate() + n * 7);
      else if (unit === 'm') { d.setMonth(d.getMonth() + n); }
      else if (unit === 'y') { d.setFullYear(d.getFullYear() + n); }
      return d;
    }
    function render() {
      var body = '';
      if (st.tab === 'diff') {
        var days = LH.daysBetween(st.a, st.b);
        var abs = Math.abs(days);
        body =
          '<div class="field"><label>开始日期</label><input class="input" type="date" id="dc-a" value="' + st.a + '"></div>' +
          '<div class="field"><label>结束日期</label><input class="input" type="date" id="dc-b" value="' + st.b + '"></div>' +
          '<div class="result-box"><div class="label">相差</div><div class="value">' + abs + ' 天</div>' +
          '<p class="tiny mt8">约 ' + (abs / 7).toFixed(1) + ' 周 · ' + (abs / 30).toFixed(1) + ' 个月 · ' + (abs / 365).toFixed(2) + ' 年<br>工作日（不含周末）：' + workdays(st.a, st.b) + ' 天</p></div>' +
          '<p class="tiny mt8">※ 法定节假日与调休未计入工作日，仅供参考</p>';
      } else {
        var n = parseInt(st.n, 10);
        var target = isNaN(n) ? null : addDate(st.base, n, st.unit);
        body =
          '<div class="field"><label>基准日期</label><input class="input" type="date" id="dc-base" value="' + st.base + '"></div>' +
          '<div class="convert-row">' +
          '<div class="field"><label>数量（负数为往前）</label><input class="input" type="number" id="dc-n" value="' + esc(st.n) + '"></div>' +
          '<div class="field"><label>单位</label><select class="select" id="dc-unit">' +
          '<option value="d"' + (st.unit === 'd' ? ' selected' : '') + '>天</option>' +
          '<option value="w"' + (st.unit === 'w' ? ' selected' : '') + '>周</option>' +
          '<option value="m"' + (st.unit === 'm' ? ' selected' : '') + '>月</option>' +
          '<option value="y"' + (st.unit === 'y' ? ' selected' : '') + '>年</option>' +
          '</select></div></div>' +
          (target
            ? '<div class="result-box"><div class="label">结果日期</div><div class="value">' + LH.todayStr(target) + '</div>' +
              '<p class="tiny mt8">星期' + LH.weekdayCN(target) + ' · ' + (target.getFullYear()) + ' 年第 ' + Math.ceil((target - new Date(target.getFullYear(), 0, 1)) / 86400000) + ' 天</p></div>'
            : '<div class="perm-tip">⚠️ 请输入整数</div>');
      }
      root.innerHTML =
        '<div class="seg mb12">' +
        '<button data-t="diff" class="' + (st.tab === 'diff' ? 'active' : '') + '">日期间隔</button>' +
        '<button data-t="add" class="' + (st.tab === 'add' ? 'active' : '') + '">日期加减</button></div>' +
        '<div class="card">' + body + '</div>';
      LH.$$('.seg button', root).forEach(function (b) { b.onclick = function () { st.tab = b.dataset.t; render(); }; });
      var bind = function (id, key, isNum) {
        var el = LH.$('#' + id, root);
        if (el) el.oninput = function () { st[key] = this.value; render(); };
      };
      bind('dc-a', 'a'); bind('dc-b', 'b'); bind('dc-base', 'base'); bind('dc-n', 'n');
      var u = LH.$('#dc-unit', root); if (u) u.onchange = function () { st.unit = this.value; render(); };
    }
    render();
  };
  LH._workdays = workdaysFn;
  function workdaysFn(a, b) {
    var d1 = LH.parseDate(a <= b ? a : b);
    var d2 = LH.parseDate(a <= b ? b : a);
    var n = 0, d = new Date(d1);
    while (d < d2) { var w = d.getDay(); if (w !== 0 && w !== 6) n++; d.setDate(d.getDate() + 1); }
    return n;
  }

  /* ========================================================
   * 6. 年龄计算
   * ======================================================== */
  LH.impls['age-calc'] = function (root) {
    var st = { birth: '2000-01-01' };
    function zodiac(y) { return '鼠牛虎兔龙蛇马羊猴鸡狗猪'[(y - 1900) % 12]; }
    function constellation(m, d) {
      var edges = [[20, 1, 19, '摩羯座'], [19, 2, 18, '水瓶座'], [20, 3, 20, '双鱼座'], [20, 4, 19, '白羊座'], [20, 5, 20, '金牛座'], [21, 6, 21, '双子座'], [22, 7, 22, '巨蟹座'], [23, 8, 22, '狮子座'], [23, 9, 22, '处女座'], [23, 10, 23, '天秤座'], [23, 11, 22, '天蝎座'], [22, 12, 21, '射手座']];
      var arr = ['摩羯', '水瓶', '双鱼', '白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯'];
      var idx = d < edges[m - 1][0] ? m - 1 : m;
      return arr[idx] + '座';
    }
    function render() {
      var b = LH.parseDate(st.birth), now = new Date();
      var html = '<div class="card"><div class="field"><label>出生日期</label><input class="input" type="date" id="age-in" value="' + st.birth + '" max="' + LH.todayStr() + '"></div>';
      if (b && b <= now) {
        var y = now.getFullYear() - b.getFullYear();
        var m = now.getMonth() - b.getMonth();
        var d = now.getDate() - b.getDate();
        if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
        if (m < 0) { y--; m += 12; }
        var totalDays = Math.floor((now - b) / 86400000);
        // 下一个生日
        var next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
        if (next < now) next = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
        var toBd = Math.ceil((next - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
        html +=
          '<div class="result-box"><div class="label">周岁</div><div class="value">' + y + ' 岁 ' + m + ' 个月 ' + d + ' 天</div></div>' +
          '<div class="stat-grid mt12">' +
          '<div class="stat-cell"><div class="v">' + (y - 1) + '</div><div class="k">虚岁(参考)</div></div>' +
          '<div class="stat-cell"><div class="v">' + totalDays.toLocaleString() + '</div><div class="k">已活天数</div></div>' +
          '<div class="stat-cell"><div class="v">' + (toBd === 0 ? '今天🎉' : toBd + ' 天') + '</div><div class="k">距下次生日</div></div>' +
          '</div>' +
          '<div class="stat-grid c2 mt12">' +
          '<div class="stat-cell"><div class="v" style="font-size:1.3rem">' + zodiac(b.getFullYear()) + '</div><div class="k">生肖</div></div>' +
          '<div class="stat-cell"><div class="v" style="font-size:1.3rem">' + constellation(b.getMonth() + 1, b.getDate()) + '</div><div class="k">星座</div></div>' +
          '</div>' +
          '<p class="tiny mt12">※ 虚岁、生肖按公历年粗略估算，未按农历推算</p>';
      } else {
        html += '<div class="perm-tip">⚠️ 请选择今天之前的出生日期</div>';
      }
      root.innerHTML = html + '</div>';
      LH.$('#age-in', root).oninput = function () { st.birth = this.value; render(); };
    }
    render();
  };

  /* ========================================================
   * 7. 房贷计算
   * ======================================================== */
  LH.impls.mortgage = function (root) {
    var st = { amount: '100', years: '30', rate: '3.6', mode: 'benxi' };
    function render() {
      var P = parseFloat(st.amount) * 10000, yrs = parseInt(st.years, 10), rate = parseFloat(st.rate);
      var ok = P > 0 && yrs > 0 && yrs <= 50 && rate > 0 && rate < 24;
      var body = '';
      if (ok) {
        var n = yrs * 12, r = rate / 100 / 12;
        if (st.mode === 'benxi') {
          var m = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
          var total = m * n, interest = total - P;
          body =
            '<div class="result-box"><div class="label">等额本息 · 每月还款</div><div class="value">' + LH.fmtMoney(m.toFixed(2)) + ' 元</div></div>' +
            '<div class="stat-grid mt12">' +
            '<div class="stat-cell"><div class="v">' + (interest / total * 100).toFixed(1) + '%</div><div class="k">利息占比</div></div>' +
            '<div class="stat-cell"><div class="v" style="font-size:.85rem">' + LH.fmtMoney(interest.toFixed(0)) + '</div><div class="k">总利息(元)</div></div>' +
            '<div class="stat-cell"><div class="v" style="font-size:.85rem">' + LH.fmtMoney(total.toFixed(0)) + '</div><div class="k">还款总额(元)</div></div>' +
            '</div>';
        } else {
          var first = P / n + P * r;
          var last = P / n + (P / n) * r;
          var interest2 = P * r * (n + 1) / 2;
          body =
            '<div class="result-box"><div class="label">等额本金 · 首月还款（逐月递减）</div><div class="value">' + LH.fmtMoney(first.toFixed(2)) + ' 元</div></div>' +
            '<div class="stat-grid mt12">' +
            '<div class="stat-cell"><div class="v">' + LH.fmtMoney(last.toFixed(0)) + '</div><div class="k">末月还款(元)</div></div>' +
            '<div class="stat-cell"><div class="v">' + (first - last).toFixed(2) + '</div><div class="k">每月递减(元)</div></div>' +
            '<div class="stat-cell"><div class="v" style="font-size:.85rem">' + LH.fmtMoney(interest2.toFixed(0)) + '</div><div class="k">总利息(元)</div></div>' +
            '</div>';
        }
      } else if (st.amount || st.years || st.rate) {
        body = '<div class="perm-tip">⚠️ 请检查输入：金额需大于 0，年限 1~50 年，年利率 0~24%</div>';
      }
      root.innerHTML =
        '<div class="card">' +
        '<div class="convert-row">' +
        '<div class="field"><label>贷款总额（万元）</label><input class="input" type="number" id="mg-amt" value="' + esc(st.amount) + '"></div>' +
        '<div class="field"><label>期限（年）</label><input class="input" type="number" id="mg-yrs" value="' + esc(st.years) + '"></div>' +
        '</div>' +
        '<div class="field"><label>年利率 %（2025 年 5 年期 LPR 约 3.5%，公积金首套约 2.6%）</label><div class="convert-row">' +
        '<input class="input" type="number" step="0.01" id="mg-rate" value="' + esc(st.rate) + '">' +
        '<button class="btn sm" data-rate="3.5" style="flex:none">LPR</button>' +
        '<button class="btn sm" data-rate="2.6" style="flex:none">公积金</button>' +
        '</div></div>' +
        '<div class="seg mb12" id="mg-mode">' +
        '<button data-m="benxi" class="' + (st.mode === 'benxi' ? 'active' : '') + '">等额本息</button>' +
        '<button data-m="benjin" class="' + (st.mode === 'benjin' ? 'active' : '') + '">等额本金</button></div>' +
        body + '</div>' +
        '<p class="tiny mt12 center">结果为理论值，实际以银行审批为准</p>';
      ['mg-amt:amount', 'mg-yrs:years', 'mg-rate:rate'].forEach(function (p) {
        var parts = p.split(':');
        LH.$('#' + parts[0], root).oninput = function () { st[parts[1]] = this.value; render(); };
      });
      LH.$$('[data-rate]', root).forEach(function (b) {
        b.onclick = function () { st.rate = b.dataset.rate; render(); };
      });
      LH.$$('#mg-mode button', root).forEach(function (b) {
        b.onclick = function () { st.mode = b.dataset.m; render(); };
      });
    }
    render();
  };

  /* ========================================================
   * 8. 个税计算
   * ======================================================== */
  var TAX_TABLE = [
    [36000, 0.03, 0], [144000, 0.10, 2520], [300000, 0.20, 16920],
    [420000, 0.25, 31920], [660000, 0.30, 52920], [960000, 0.35, 85920],
    [Infinity, 0.45, 181920]
  ];
  LH._taxOf = function (annualTaxable) {
    if (annualTaxable <= 0) return 0;
    for (var i = 0; i < TAX_TABLE.length; i++) {
      if (annualTaxable <= TAX_TABLE[i][0]) return annualTaxable * TAX_TABLE[i][1] - TAX_TABLE[i][2];
    }
  };

  LH.impls.tax = function (root) {
    var st = { salary: '15000', insurance: '2500', deduct: '1000' };
    function render() {
      var sal = parseFloat(st.salary), ins = parseFloat(st.insurance) || 0, ded = parseFloat(st.deduct) || 0;
      var ok = sal > 0;
      var body = '';
      if (ok) {
        var monthTaxable = sal - ins - 5000 - ded;
        var annual = Math.max(0, monthTaxable) * 12;
        var annualTax = LH._taxOf(annual);
        var monthTax = annualTax / 12;
        var after = sal - ins - monthTax;
        body =
          (monthTaxable <= 0
            ? '<div class="result-box"><div class="label">本月无需缴纳个人所得税</div><div class="value small">应纳税所得额 ≤ 0</div></div>'
            : '<div class="result-box"><div class="label">月缴个税（按年折算）</div><div class="value">' + LH.fmtMoney(monthTax.toFixed(2)) + ' 元</div></div>') +
          '<div class="stat-grid mt12">' +
          '<div class="stat-cell"><div class="v" style="font-size:.85rem">' + LH.fmtMoney(after.toFixed(0)) + '</div><div class="k">税后月薪</div></div>' +
          '<div class="stat-cell"><div class="v" style="font-size:.85rem">' + LH.fmtMoney(annualTax.toFixed(0)) + '</div><div class="k">全年个税</div></div>' +
          '<div class="stat-cell"><div class="v">' + (sal > 0 ? (monthTax / sal * 100).toFixed(1) : 0) + '%</div><div class="k">有效税率</div></div>' +
          '</div>' +
          '<p class="tiny mt12">计税逻辑：应纳税所得额 = 月薪 − 五险一金 − 5000 起征点 − 专项附加扣除，按年度 7 级累进税率表年额÷12 折算。未考虑年终奖单独计税、季度奖金等特殊情况。</p>';
      }
      root.innerHTML =
        '<div class="card">' +
        '<div class="field"><label>税前月薪（元）</label><input class="input" type="number" id="tx-sal" value="' + esc(st.salary) + '"></div>' +
        '<div class="convert-row">' +
        '<div class="field"><label>五险一金个人部分（元/月）</label><input class="input" type="number" id="tx-ins" value="' + esc(st.insurance) + '"></div>' +
        '<div class="field"><label>专项附加扣除（元/月）</label><input class="input" type="number" id="tx-ded" value="' + esc(st.deduct) + '"></div>' +
        '</div>' + body + '</div>' +
        '<div class="card section"><h4>📋 专项附加扣除参考（元/月）</h4>' +
        '<table class="simple mt8"><tr><th>项目</th><th>额度</th></tr>' +
        '<tr><td>子女教育</td><td>2000 / 孩</td></tr>' +
        '<tr><td>3 岁以下婴幼儿照护</td><td>2000 / 孩</td></tr>' +
        '<tr><td>赡养老人</td><td>3000（独生子女）</td></tr>' +
        '<tr><td>住房贷款利息</td><td>1000</td></tr>' +
        '<tr><td>住房租金</td><td>800~1500</td></tr>' +
        '<tr><td>继续教育</td><td>400</td></tr>' +
        '<tr><td>大病医疗</td><td>按年限额 8 万</td></tr></table></div>';
      [['tx-sal', 'salary'], ['tx-ins', 'insurance'], ['tx-ded', 'deduct']].forEach(function (p) {
        LH.$('#' + p[0], root).oninput = function () { st[p[1]] = this.value; render(); };
      });
    }
    render();
  };

  /* ========================================================
   * 9. 折扣 / 满减 / AA
   * ======================================================== */
  LH.impls.discount = function (root) {
    var st = { tab: 'off', price: '199', off: '8.5', full: '300', cut: '50', total: '356', people: '4', round: 'none' };
    function render() {
      var body = '';
      if (st.tab === 'off') {
        var p = parseFloat(st.price), o = parseFloat(st.off);
        var ok = p >= 0 && o > 0 && o <= 10;
        body =
          '<div class="convert-row">' +
          '<div class="field"><label>原价（元）</label><input class="input" type="number" id="dc-p" value="' + esc(st.price) + '"></div>' +
          '<div class="field"><label>折扣（几折）</label><input class="input" type="number" step="0.1" id="dc-o" value="' + esc(st.off) + '"></div></div>' +
          (ok ? '<div class="result-box"><div class="label">折后价</div><div class="value">' + LH.fmtMoney((p * o / 10).toFixed(2)) + ' 元</div></div>' +
            '<div class="stat-grid c2 mt12">' +
            '<div class="stat-cell"><div class="v" style="font-size:.9rem">' + LH.fmtMoney((p * (1 - o / 10)).toFixed(2)) + '</div><div class="k">节省金额</div></div>' +
            '<div class="stat-cell"><div class="v">' + o + ' 折</div><div class="k">相当于 ' + (o * 10) + '%</div></div></div>'
            : '');
      } else if (st.tab === 'full') {
        var p2 = parseFloat(st.price), f = parseFloat(st.full), c = parseFloat(st.cut);
        var ok2 = p2 >= 0 && f > 0 && c > 0 && c < f;
        var times = ok2 ? Math.floor(p2 / f) : 0;
        var pay = ok2 ? p2 - times * c : 0;
        body =
          '<div class="convert-row">' +
          '<div class="field"><label>商品价格（元）</label><input class="input" type="number" id="dc-p" value="' + esc(st.price) + '"></div>' +
          '<div class="field"><label>满（元）</label><input class="input" type="number" id="dc-f" value="' + esc(st.full) + '"></div>' +
          '<div class="field"><label>减（元）</label><input class="input" type="number" id="dc-c" value="' + esc(st.cut) + '"></div></div>' +
          (ok2 ? '<div class="result-box"><div class="label">' + (times > 0 ? '可享受 ' + times + ' 次满减' : '未达到满减门槛') + '</div><div class="value">' + LH.fmtMoney(pay.toFixed(2)) + ' 元</div></div>' +
            '<div class="stat-grid c2 mt12">' +
            '<div class="stat-cell"><div class="v" style="font-size:.9rem">' + LH.fmtMoney((p2 - pay).toFixed(2)) + '</div><div class="k">节省金额</div></div>' +
            '<div class="stat-cell"><div class="v">' + (p2 > 0 ? (pay / p2 * 100).toFixed(1) : 0) + '%</div><div class="k">到手折扣率</div></div></div>'
            : '');
      } else {
        var t = parseFloat(st.total), ppl = parseInt(st.people, 10);
        var ok3 = t > 0 && ppl > 0;
        var per = ok3 ? t / ppl : 0;
        var shown = per;
        if (ok3 && st.round === 'jiao') shown = Math.ceil(per * 10) / 10;
        if (ok3 && st.round === 'yuan') shown = Math.ceil(per);
        body =
          '<div class="convert-row">' +
          '<div class="field"><label>总金额（元）</label><input class="input" type="number" id="dc-t" value="' + esc(st.total) + '"></div>' +
          '<div class="field"><label>人数</label><input class="input" type="number" id="dc-ppl" value="' + esc(st.people) + '"></div></div>' +
          '<div class="field"><label>抹零方式</label><select class="select" id="dc-round">' +
          '<option value="none"' + (st.round === 'none' ? ' selected' : '') + '>平均分摊（精确）</option>' +
          '<option value="jiao"' + (st.round === 'jiao' ? ' selected' : '') + '>向上抹到角（收款方不吃亏）</option>' +
          '<option value="yuan"' + (st.round === 'yuan' ? ' selected' : '') + '>向上抹到元</option>' +
          '</select></div>' +
          (ok3 ? '<div class="result-box"><div class="label">人均</div><div class="value">' + LH.fmtMoney(shown.toFixed(2)) + ' 元 / 人</div></div>' +
            '<p class="tiny mt8">精确人均：' + LH.fmtMoney(per.toFixed(4)) + ' 元 · 收款合计：' + LH.fmtMoney((shown * ppl).toFixed(2)) + ' 元</p>'
            : '');
      }
      root.innerHTML =
        '<div class="seg mb12" id="dc-tabs">' +
        '<button data-t="off" class="' + (st.tab === 'off' ? 'active' : '') + '">折扣</button>' +
        '<button data-t="full" class="' + (st.tab === 'full' ? 'active' : '') + '">满减</button>' +
        '<button data-t="aa" class="' + (st.tab === 'aa' ? 'active' : '') + '">AA 分摊</button></div>' +
        '<div class="card">' + body + '</div>';
      LH.$$('#dc-tabs button', root).forEach(function (b) { b.onclick = function () { st.tab = b.dataset.t; render(); }; });
      [['dc-p', 'price'], ['dc-o', 'off'], ['dc-f', 'full'], ['dc-c', 'cut'], ['dc-t', 'total'], ['dc-ppl', 'people']].forEach(function (p) {
        var el = LH.$('#' + p[0], root);
        if (el) el.oninput = function () { st[p[1]] = this.value; render(); };
      });
      var rr = LH.$('#dc-round', root);
      if (rr) rr.onchange = function () { st.round = this.value; render(); };
    }
    render();
  };

  /* ========================================================
   * 10. 随机决定（随机数 / 骰子 / 硬币 / 抽签）
   * ======================================================== */
  LH.impls.random = function (root) {
    var st = { tab: 'num', min: '1', max: '100', count: '1', uniq: true, dice: 2, items: '火锅\n烧烤\n日料\n面馆\n随便吃点' };
    var coinCount = { h: 0, t: 0 };
    function diceFace(el, n) {
      var map = { 1: 4, 2: 8, 3: 12, 4: 26, 5: 30, 6: 365 };
      var on = map[n] || 0;
      for (var i = 0; i < 9; i++) el.children[i].className = ((on >> i) & 1) ? 'on' : '';
    }
    function render() {
      var body = '';
      if (st.tab === 'num') {
        body =
          '<div class="convert-row">' +
          '<div class="field"><label>最小值</label><input class="input" type="number" id="rd-min" value="' + esc(st.min) + '"></div>' +
          '<div class="field"><label>最大值</label><input class="input" type="number" id="rd-max" value="' + esc(st.max) + '"></div>' +
          '<div class="field"><label>个数</label><input class="input" type="number" id="rd-count" min="1" max="100" value="' + esc(st.count) + '"></div></div>' +
          '<div class="check-row"><div class="grow">不允许重复</div><label class="switch"><input type="checkbox" id="rd-uniq"' + (st.uniq ? ' checked' : '') + '><span class="track"></span><span class="knob"></span></label></div>' +
          '<button class="btn primary block mt8" id="rd-go">🎲 生成随机数</button>' +
          '<div id="rd-out"></div>';
      } else if (st.tab === 'dice') {
        body =
          '<div class="flex-between mb12"><span class="tiny">骰子数量</span><div class="flex gap8">' +
          '<button class="btn sm" data-dice="-1">−</button><b id="rd-dn">' + st.dice + '</b><button class="btn sm" data-dice="1">＋</button></div></div>' +
          '<div class="dice-area" id="rd-dice"></div>' +
          '<button class="btn primary block" id="rd-roll">🎲 掷骰子</button><div id="rd-out" class="center mt12"></div>';
      } else if (st.tab === 'coin') {
        body =
          '<div class="coin" id="rd-coin">🪙</div>' +
          '<button class="btn primary block" id="rd-flip">🪙 抛硬币</button>' +
          '<div class="stat-grid c2 mt12" id="rd-coin-stats"></div>';
      } else {
        body =
          '<div class="field"><label>候选项（每行一个）</label><textarea class="input" id="rd-items" rows="6">' + esc(st.items) + '</textarea></div>' +
          '<button class="btn primary block" id="rd-pick">🎯 帮我决定</button><div id="rd-out"></div>';
      }
      root.innerHTML =
        '<div class="seg mb12" id="rd-tabs">' +
        '<button data-t="num" class="' + (st.tab === 'num' ? 'active' : '') + '">随机数</button>' +
        '<button data-t="dice" class="' + (st.tab === 'dice' ? 'active' : '') + '">骰子</button>' +
        '<button data-t="coin" class="' + (st.tab === 'coin' ? 'active' : '') + '">硬币</button>' +
        '<button data-t="pick" class="' + (st.tab === 'pick' ? 'active' : '') + '">抽签</button></div>' +
        '<div class="card">' + body + '</div>';

      LH.$$('#rd-tabs button', root).forEach(function (b) { b.onclick = function () { st.tab = b.dataset.t; render(); }; });
      [['rd-min', 'min'], ['rd-max', 'max'], ['rd-count', 'count']].forEach(function (p) {
        var el = LH.$('#' + p[0], root); if (el) el.oninput = function () { st[p[1]] = this.value; };
      });
      var uq = LH.$('#rd-uniq', root);
      if (uq) uq.onchange = function () { st.uniq = this.checked; };
      var it = LH.$('#rd-items', root);
      if (it) it.oninput = function () { st.items = this.value; };

      var go = LH.$('#rd-go', root);
      if (go) go.onclick = function () {
        var mn = parseInt(st.min, 10), mx = parseInt(st.max, 10), ct = parseInt(st.count, 10) || 1;
        if (mn > mx) { var tt = mn; mn = mx; mx = tt; }
        var range = mx - mn + 1;
        if (st.uniq && ct > range) return LH.toast('范围不够生成 ' + ct + ' 个不重复的数', 'err');
        var out = [];
        var pool = [];
        if (st.uniq) { for (var i = mn; i <= mx; i++) pool.push(i); }
        for (var j = 0; j < ct; j++) {
          if (st.uniq) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
          else out.push(mn + Math.floor(Math.random() * range));
        }
        LH.$('#rd-out', root).innerHTML =
          '<div class="result-box mt12"><div class="label">结果</div><div class="value small">' + out.join('、') + '</div></div>';
      };

      var diceArea = LH.$('#rd-dice', root);
      if (diceArea) {
        var html = '';
        for (var d = 0; d < st.dice; d++) { html += '<div class="dice">' + '<i></i>'.repeat(9) + '</div>'; }
        diceArea.innerHTML = html;
        LH.$$('[data-dice]', root).forEach(function (b) {
          b.onclick = function () {
            st.dice = Math.min(6, Math.max(1, st.dice + (+b.dataset.dice)));
            render();
            LH.$$('#rd-dice .dice', root).forEach(function (el, idx) { diceFace(el, [1, 3, 5, 2, 4, 6][idx % 6]); });
          };
        });
        LH.$$('#rd-dice .dice', root).forEach(function (el, idx) { diceFace(el, [4, 2, 6, 1, 3, 5][idx % 6]); });
        LH.$('#rd-roll', root).onclick = function () {
          var els = LH.$$('#rd-dice .dice', root);
          els.forEach(function (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); });
          var total = 0, results = [];
          setTimeout(function () {
            els.forEach(function (el) {
              var n = 1 + Math.floor(Math.random() * 6);
              diceFace(el, n); results.push(n); total += n;
            });
            LH.$('#rd-out', root).innerHTML = '<b style="font-size:1.2rem;color:var(--primary)">Σ ' + total + '</b> <span class="tiny">（' + results.join(' + ') + '）</span>';
          }, 480);
        };
      }

      var coin = LH.$('#rd-coin', root);
      if (coin) {
        var paint = function () {
          LH.$('#rd-coin-stats', root).innerHTML =
            '<div class="stat-cell"><div class="v">' + coinCount.h + '</div><div class="k">正面</div></div>' +
            '<div class="stat-cell"><div class="v">' + coinCount.t + '</div><div class="k">反面</div></div>';
        };
        paint();
        LH.$('#rd-flip', root).onclick = function () {
          coin.classList.remove('flip'); void coin.offsetWidth; coin.classList.add('flip');
          var isH = Math.random() < 0.5;
          setTimeout(function () {
            coin.textContent = isH ? '🪙' : '银';
            if (isH) coinCount.h++; else coinCount.t++;
            LH.toast(isH ? '正面！' : '反面！'); paint();
          }, 850);
        };
      }

      var pick = LH.$('#rd-pick', root);
      if (pick) pick.onclick = function () {
        var arr = st.items.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        if (arr.length === 0) return LH.toast('请先输入候选项', 'err');
        if (arr.length === 1) return LH.$('#rd-out', root).innerHTML = '<div class="result-box mt12"><div class="label">结果</div><div class="value small">其实你只有一个选择：' + esc(arr[0]) + '</div></div>';
        var r = arr[Math.floor(Math.random() * arr.length)];
        LH.$('#rd-out', root).innerHTML =
          '<div class="result-box mt12"><div class="label">就决定是你了 🎯</div><div class="value">' + esc(r) + '</div></div>';
      };
    }
    render();
  };

  /* ========================================================
   * 11. 亲戚称呼计算
   * ======================================================== */
  var KIN_TOKENS = [
    ['曾祖父', '父父父'], ['太爷爷', '父父父'], ['曾祖母', '父父母'], ['太奶奶', '父父母'],
    ['爷爷', '父父'], ['奶奶', '父母'], ['外公', '母父'], ['姥爷', '母父'], ['外婆', '母母'], ['姥姥', '母母'],
    ['岳父', '妻父'], ['丈人', '妻父'], ['丈母娘', '妻母'], ['岳母', '妻母'],
    ['公公', '夫父'], ['婆婆', '夫母'],
    ['大伯', '父兄'], ['伯父', '父兄'], ['伯伯', '父兄'], ['伯母', '父兄妻'],
    ['叔叔', '父弟'], ['婶婶', '父弟妻'], ['婶子', '父弟妻'],
    ['姑姑', '父姐'], ['姑母', '父姐'], ['姑父', '父姐夫'],
    ['舅舅', '母兄'], ['舅父', '母兄'], ['舅妈', '母兄妻'],
    ['姨妈', '母姐'], ['姨母', '母姐'], ['小姨', '母妹'], ['姨父', '母姐夫'],
    ['嫂子', '兄妻'], ['嫂嫂', '兄妻'], ['弟媳', '弟妻'],
    ['姐夫', '姐夫'], ['妹夫', '妹夫'],
    ['儿媳', '子妻'], ['女婿', '女夫'],
    ['孙子', '子子'], ['孙女', '子女'], ['外孙', '女子'], ['外孙女', '女女'],
    ['侄子', '兄子'], ['侄女', '兄女'], ['外甥', '姐子'], ['外甥女', '姐女'],
    ['堂哥', '父兄子'], ['堂弟', '父弟子'], ['堂姐', '父兄女'], ['堂妹', '父弟女'],
    ['表哥', '母兄子'], ['表弟', '母弟子'], ['表姐', '母兄女'], ['表妹', '母弟女'],
    ['连襟', '妻姐夫'],
    ['爸爸', '父'], ['父亲', '父'], ['老爸', '父'], ['妈妈', '母'], ['母亲', '母'], ['老妈', '母'],
    ['哥哥', '兄'], ['弟弟', '弟'], ['姐姐', '姐'], ['妹妹', '妹'],
    ['儿子', '子'], ['女儿', '女'],
    ['老公', '夫'], ['丈夫', '夫'], ['先生', '夫'], ['老婆', '妻'], ['妻子', '妻'], ['太太', '妻'],
    ['爸', '父'], ['妈', '母'], ['兄', '兄'], ['姐', '姐'], ['妻', '妻'], ['夫', '夫'],
    ['父', '父'], ['母', '母'], ['弟', '弟'], ['妹', '妹'], ['子', '子'], ['女', '女']
  ];
  var KIN_MAP = {
    '父': ['父亲', '爸爸'], '母': ['母亲', '妈妈'],
    '父父': ['祖父', '爷爷'], '父母': ['祖母', '奶奶'],
    '母父': ['外祖父', '外公 · 姥爷'], '母母': ['外祖母', '外婆 · 姥姥'],
    '父父父': ['曾祖父', '太爷爷'], '父父母': ['曾祖母', '太奶奶'],
    '父兄': ['伯父', '伯伯 · 大爷'], '父兄妻': ['伯母', '大娘'],
    '父弟': ['叔父', '叔叔'], '父弟妻': ['婶母', '婶婶'],
    '父姐': ['姑母', '姑姑'], '父妹': ['姑母', '姑姑'],
    '父姐夫': ['姑父', '姑丈'], '父妹夫': ['姑父', '姑丈'],
    '母兄': ['舅父', '舅舅'], '母弟': ['舅父', '舅舅'],
    '母兄妻': ['舅母', '舅妈'], '母弟妻': ['舅母', '舅妈'],
    '母姐': ['姨母', '姨妈'], '母妹': ['姨母', '姨妈 · 小姨'],
    '母姐夫': ['姨父', '姨丈'], '母妹夫': ['姨父', '姨丈'],
    '兄': ['哥哥', '兄长'], '兄妻': ['嫂子', '嫂嫂'],
    '弟': ['弟弟', ''], '弟妻': ['弟媳', '弟妹'],
    '姐': ['姐姐', ''], '姐夫': ['姐夫', ''],
    '妹': ['妹妹', ''], '妹夫': ['妹夫', ''],
    '子': ['儿子', ''], '子妻': ['儿媳', ''],
    '女': ['女儿', ''], '女夫': ['女婿', ''],
    '子子': ['孙子', ''], '子女': ['孙女', ''],
    '子子妻': ['孙媳妇', ''], '子女夫': ['孙女婿', ''],
    '女子': ['外孙', ''], '女女': ['外孙女', ''],
    '兄子': ['侄子', ''], '兄女': ['侄女', ''],
    '弟子': ['侄子', ''], '弟女': ['侄女', ''],
    '兄子妻': ['侄媳妇', ''], '弟子妻': ['侄媳妇', ''],
    '兄女夫': ['侄女婿', ''], '弟女夫': ['侄女婿', ''],
    '姐子': ['外甥', ''], '姐女': ['外甥女', ''],
    '妹子': ['外甥', ''], '妹女': ['外甥女', ''],
    '妻父': ['岳父', '丈人 · 老丈人'], '妻母': ['岳母', '丈母娘'],
    '妻兄': ['内兄', '大舅子'], '妻弟': ['内弟', '小舅子'],
    '妻姐': ['姨姐', '大姨子'], '妻妹': ['姨妹', '小姨子'],
    '妻姐夫': ['连襟', '襟兄'], '妻妹夫': ['连襟', '襟弟'],
    '夫父': ['公公', '家翁'], '夫母': ['婆婆', '家婆'],
    '夫兄': ['大伯子', '大伯'], '夫兄妻': ['嫂子', '妯娌'],
    '夫弟': ['小叔子', ''], '夫弟妻': ['弟媳', '妯娌'],
    '夫姐': ['大姑子', '大姑姐'], '夫妹': ['小姑子', ''],
    '父兄子': ['堂兄 / 堂弟', '堂哥 · 堂兄弟（长幼未知）'],
    '父兄女': ['堂姐 / 堂妹', '堂姐妹（长幼未知）'],
    '父弟子': ['堂兄 / 堂弟', '堂兄弟（长幼未知）'],
    '父弟女': ['堂姐 / 堂妹', '堂姐妹（长幼未知）'],
    '父兄子妻': ['堂嫂', ''], '父弟子妻': ['堂弟媳', ''],
    '父姐子': ['表兄 / 表弟', '表哥 · 表兄弟（长幼未知）'],
    '父姐女': ['表姐 / 表妹', '表姐妹（长幼未知）'],
    '父妹子': ['表兄 / 表弟', '表兄弟（长幼未知）'],
    '父妹女': ['表姐 / 表妹', '表姐妹（长幼未知）'],
    '父姐子妻': ['表嫂', ''],
    '母兄子': ['表兄 / 表弟', '表哥 · 表兄弟（长幼未知）'],
    '母兄女': ['表姐 / 表妹', '表姐妹（长幼未知）'],
    '母弟子': ['表兄 / 表弟', '表兄弟（长幼未知）'],
    '母弟女': ['表姐 / 表妹', '表姐妹（长幼未知）'],
    '母姐子': ['表兄 / 表弟', '姨表兄弟（长幼未知）'],
    '母姐女': ['表姐 / 表妹', '姨表姐妹（长幼未知）'],
    '母妹子': ['表兄 / 表弟', '姨表兄弟（长幼未知）'],
    '母妹女': ['表姐 / 表妹', '姨表姐妹（长幼未知）'],
    '母兄子妻': ['表嫂', '']
  };
  function kinParse(input) {
    var s = String(input || '').trim();
    if (!s) return { err: '请输入称呼链' };
    s = s.replace(/的/g, '').replace(/我/g, '');
    // 贪婪匹配最长词元
    var path = '', i = 0;
    outer:
    while (i < s.length) {
      for (var L = 6; L >= 1; L--) {
        if (i + L > s.length) continue;
        var seg = s.slice(i, i + L);
        for (var t = 0; t < KIN_TOKENS.length; t++) {
          if (KIN_TOKENS[t][0] === seg) { path += KIN_TOKENS[t][1]; i += L; continue outer; }
        }
      }
      return { err: '无法识别「' + s[i] + '」，请使用如：爸爸、妈妈、哥哥、舅舅、姑姑、儿子 等常见称呼' };
    }
    if (!path) return { err: '请输入称呼链' };
    return { path: path };
  }
  LH._kinParse = kinParse; LH._kinMap = KIN_MAP;

  LH.impls.kinship = function (root) {
    var st = { q: '', res: null };
    function render() {
      root.innerHTML =
        '<div class="card">' +
        '<div class="field"><label>输入关系链（支持「的」连接）</label>' +
        '<input class="input" id="kin-in" placeholder="如：爸爸的姐姐的儿子" value="' + esc(st.q) + '"></div>' +
        '<button class="btn primary block" id="kin-go">🔍 我该叫 TA…</button>' +
        '<div id="kin-out" class="kin-result">' +
        (st.res ? (st.res.err
          ? '<div class="perm-tip" style="margin-top:14px">⚠️ ' + esc(st.res.err) + '</div>'
          : '<div class="big">' + esc(st.res.name) + '</div>' +
            (st.res.alias ? '<div class="alias">俗称：' + esc(st.res.alias) + '</div>' : '')) : '') +
        '</div></div>' +
        '<div class="card section"><h4>📖 使用示例</h4><p class="tiny mt8" style="line-height:2">' +
        '妈妈的姐姐的儿子 → <b>表哥 / 表弟</b><br>' +
        '爸爸的弟弟的妻子 → <b>婶婶</b><br>' +
        '老婆的爸爸 → <b>岳父</b><br>' +
        '儿子的儿子的妻子 → <b>孙媳妇</b><br>' +
        '姐姐的丈夫 → <b>姐夫</b></p>' +
        '<p class="tiny mt8">支持词元：爸爸/妈妈/哥哥/弟弟/姐姐/妹妹/儿子/女儿/老公/老婆/爷爷/奶奶/外公/外婆/叔叔/伯伯/舅舅/姑姑/姨妈/堂哥/表哥/嫂子/姐夫 等，可自由组合。</p></div>';
      LH.$('#kin-in', root).oninput = function () { st.q = this.value; };
      LH.$('#kin-go', root).onclick = function () {
        var r = kinParse(st.q);
        if (r.err) { st.res = r; }
        else {
          var hit = KIN_MAP[r.path];
          st.res = hit ? { name: hit[0], alias: hit[1] } : { err: '这个关系有点远，暂时算不出来（支持最多 3~4 层常见关系）' };
        }
        render();
      };
      var inp = LH.$('#kin-in', root);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') LH.$('#kin-go', root).click(); });
    }
    render();
  };
})(window.LH);
