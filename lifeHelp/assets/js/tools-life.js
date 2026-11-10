/* ============================================================
   tools-life.js — 健康与生活类工具
   ============================================================ */
window.LH = window.LH || {};
LH.impls = LH.impls || {};

(function (LH) {
  'use strict';
  var esc = LH.esc;

  /* ========================================================
   * 1. BMI / 基础代谢计算
   * ======================================================== */
  LH.impls.bmi = function (root) {
    var st = { h: '170', w: '65', age: '28', gender: 'm', act: 1.375 };
    function bmiLevel(v) {
      if (v < 18.5) return ['偏瘦', '#5BA8F5', '适当增加营养与力量训练'];
      if (v < 24) return ['正常', '#35B26A', '继续保持，棒棒哒！'];
      if (v < 28) return ['超重', '#FFC53D', '建议控制饮食并增加运动'];
      return ['肥胖', '#E5484D', '建议咨询专业医生制定减重计划'];
    }
    function render() {
      var h = parseFloat(st.h), w = parseFloat(st.w);
      var ok = h > 50 && h < 250 && w > 20 && w < 300;
      var body = '';
      if (ok) {
        var bmi = w / Math.pow(h / 100, 2);
        var lv = bmiLevel(bmi);
        var pos = Math.max(0, Math.min(100, (bmi - 12) / (40 - 12) * 100));
        var age = parseInt(st.age, 10) || 30;
        var bmr = 10 * w + 6.25 * h - 5 * age + (st.gender === 'm' ? 5 : -161);
        var tdee = bmr * st.act;
        body =
          '<div class="result-box"><div class="label">你的 BMI</div><div class="value">' + bmi.toFixed(1) + '</div>' +
          '<p class="tiny mt8" style="color:' + lv[1] + ';font-weight:700">' + lv[0] + ' · ' + lv[2] + '</p></div>' +
          '<div class="scale-bar"><div class="scale-pointer" style="left:' + pos + '%"></div></div>' +
          '<div class="scale-labels"><span>偏瘦</span><span>正常</span><span>超重</span><span>肥胖</span></div>' +
          '<div class="stat-grid c2 mt16">' +
          '<div class="stat-cell"><div class="v">' + Math.round(bmr) + '</div><div class="k">基础代谢 kcal/天</div></div>' +
          '<div class="stat-cell"><div class="v">' + Math.round(tdee) + '</div><div class="k">每日消耗 kcal/天</div></div>' +
          '</div>' +
          '<p class="tiny mt12 center">按中国成人标准：BMI&lt;18.5 偏瘦，18.5~23.9 正常，24~27.9 超重，≥28 肥胖<br>基础代谢采用 Mifflin-St Jeor 公式估算</p>';
      }
      root.innerHTML =
        '<div class="card">' +
        '<div class="convert-row">' +
        '<div class="field"><label>身高（cm）</label><input class="input" type="number" inputmode="decimal" id="bm-h" value="' + esc(st.h) + '"></div>' +
        '<div class="field"><label>体重（kg）</label><input class="input" type="number" inputmode="decimal" id="bm-w" value="' + esc(st.w) + '"></div></div>' +
        '<div class="convert-row">' +
        '<div class="field"><label>年龄</label><input class="input" type="number" inputmode="numeric" id="bm-age" value="' + esc(st.age) + '"></div>' +
        '<div class="field"><label>性别</label><select class="select" id="bm-g"><option value="m"' + (st.gender === 'm' ? ' selected' : '') + '>男</option><option value="f"' + (st.gender === 'f' ? ' selected' : '') + '>女</option></select></div></div>' +
        '<div class="field"><label>运动量（用于估算每日消耗）</label><select class="select" id="bm-act">' +
        '<option value="1.2">久坐不动（办公室）</option>' +
        '<option value="1.375"' + (st.act == 1.375 ? ' selected' : '') + '>轻度运动（每周 1-3 次）</option>' +
        '<option value="1.55">中度运动（每周 3-5 次）</option>' +
        '<option value="1.725">高度运动（每周 6-7 次）</option>' +
        '<option value="1.9">体力劳动 / 专业运动</option></select></div>' +
        body + '</div>';
      [['bm-h', 'h'], ['bm-w', 'w'], ['bm-age', 'age']].forEach(function (p) {
        LH.$('#' + p[0], root).oninput = function () { st[p[1]] = this.value; render(); };
      });
      LH.$('#bm-g', root).onchange = function () { st.gender = this.value; render(); };
      LH.$('#bm-act', root).onchange = function () { st.act = +this.value; render(); };
    }
    render();
  };

  /* ========================================================
   * 2. 垃圾分类查询
   * ======================================================== */
  var GARBAGE = {
    r: { name: '可回收物', emoji: '♻️', color: '#3A8DFF', tip: '适宜回收和资源利用的废弃物。请保持清洁干燥，轻投轻放。' },
    h: { name: '有害垃圾', emoji: '⚠️', color: '#E5484D', tip: '对人体健康或环境造成危害的废弃物。请连带包装或包裹后轻放。' },
    k: { name: '厨余垃圾', emoji: '🥬', color: '#35B26A', tip: '易腐烂的生物质废弃物。请沥干水分后投放，包装物请投其他垃圾。' },
    o: { name: '其他垃圾', emoji: '🗑️', color: '#9AA2AD', tip: '除以上三类之外的生活废弃物。难以判断类别时可投其他垃圾。' }
  };
  var GARBAGE_DB = [
    // 有害垃圾
    ['h', '废电池', '充电电池、纽扣电池为有害；普通干电池部分城市可投其他'], ['h', '纽扣电池'], ['h', '充电电池'],
    ['h', '过期药品', '连同包装一起投放'], ['h', '过期药片'], ['h', '药瓶'], ['h', '废灯管'], ['h', '荧光灯'], ['h', '节能灯'],
    ['h', '水银温度计'], ['h', '血压计'], ['h', '油漆桶'], ['h', '废油漆'], ['h', '杀虫剂瓶'], ['h', '消毒液瓶'], ['h', '过期化妆品'],
    ['h', '过期指甲油'], ['h', '染发剂瓶'], ['h', '废胶片'], ['h', '相纸'], ['h', '打印机墨盒'], ['h', '硒鼓'], ['h', '废机油'],
    // 可回收物
    ['r', '废纸箱', '快递纸箱压扁投放'], ['r', '报纸'], ['r', '书本'], ['r', '杂志'], ['r', '易拉罐'], ['r', '铝罐'],
    ['r', '塑料瓶', '饮料瓶清空拧盖'], ['r', '矿泉水瓶'], ['r', '玻璃瓶'], ['r', '玻璃杯'], ['r', '旧衣服'], ['r', '旧鞋'],
    ['r', '旧毛巾'], ['r', '床单'], ['r', '牛奶盒', '洗净晾干'], ['r', '利乐包'], ['r', '旧书包'], ['r', '雨伞骨架'],
    ['r', '金属衣架'], ['r', '电线'], ['r', '旧铁锅'], ['r', '易拉环'], ['r', '旧手机', '建议回收平台处理'], ['r', '旧电脑'],
    ['r', '旧家电'], ['r', '塑料玩具'], ['r', '塑料盆'], ['r', '塑料凳'], ['r', '泡沫箱'], ['r', '纸袋'], ['r', '信封'],
    ['r', '日历纸'], ['r', '卷纸芯'], ['r', '玻璃化妆品瓶', '洗净'], ['r', '金属罐头盒'], ['r', '废旧金属'], ['r', '旧键盘'],
    ['r', '旧耳机'], ['r', '充电宝', '建议交回收点'], ['r', '锂电池', '部分城市归有害垃圾'], ['r', '旧插线板'], ['r', '旧轮胎'],
    // 厨余垃圾
    ['k', '剩饭剩菜'], ['k', '剩菜'], ['k', '剩饭'], ['k', '果皮'], ['k', '果核'], ['k', '香蕉皮'], ['k', '苹果核'],
    ['k', '西瓜皮'], ['k', '橘子皮'], ['k', '橙子皮'], ['k', '蔬菜叶'], ['k', '菜叶'], ['k', '菜根'], ['k', '菜梗'],
    ['k', '鸡蛋壳'], ['k', '蛋壳'], ['k', '鱼骨'], ['k', '鱼刺'], ['k', '鸡骨'], ['k', '排骨', '大棒骨属其他垃圾'], ['k', '虾壳'],
    ['k', '蟹壳'], ['k', '茶叶渣'], ['k', '咖啡渣'], ['k', '豆浆渣'], ['k', '过期面包'], ['k', '过期零食'], ['k', '过期食品'],
    ['k', '米饭'], ['k', '面条'], ['k', '馒头'], ['k', '豆腐'], ['k', '粽子叶', '部分城市归其他'], ['k', '玉米棒'], ['k', '瓜子壳'],
    ['k', '花生壳'], ['k', '枯萎鲜花'], ['k', '宠物饲料'], ['k', '中药渣'], ['k', '小龙虾壳'], ['k', '火锅底料'], ['k', '动物内脏'],
    // 其他垃圾
    ['o', '餐巾纸'], ['o', '卫生纸'], ['o', '纸尿裤'], ['o', '湿巾'], ['o', '卫生间用纸'], ['o', '大骨头'], ['o', '大棒骨'],
    ['o', '贝壳'], ['o', '生蚝壳'], ['o', '扇贝壳'], ['o', '椰子壳'], ['o', '核桃壳'], ['o', '榴莲壳'], ['o', '玉米皮'],
    ['o', '甘蔗渣', '部分城市归厨余'], ['o', '烟头'], ['o', '烟灰'], ['o', '烟盒', '外层塑料膜其他，纸盒可回收'],
    ['o', '尘土'], ['o', '扫除垃圾'], ['o', '猫砂'], ['o', '狗便'], ['o', '宠物粪便', '建议冲厕所或包好投放'],
    ['o', '一次性筷子'], ['o', '一次性餐盒', '干净的可回收'], ['o', '塑料袋'], ['o', '保鲜膜'], ['o', '食品包装袋'],
    ['o', '气泡膜'], ['o', '胶带'], ['o', '创可贴'], ['o', '口罩'], ['o', '棉签'], ['o', '头发'], ['o', '假发'],
    ['o', '旧抹布'], ['o', '拖把'], ['o', '扫把'], ['o', '陶瓷碎片', '包裹防止划伤'], ['o', '碎碗'], ['o', '碎玻璃杯', '包裹后可回收/其他'],
    ['o', '雨伞', '伞面其他，骨架可回收'], ['o', '打火机'], ['o', '镜子'], ['o', '牙刷'], ['o', '牙线'], ['o', '奶粉勺'],
    ['o', '笔'], ['o', '圆珠笔'], ['o', '铅笔'], ['o', '橡皮'], ['o', '印泥'], ['o', '胶水'], ['o', '订书钉'], ['o', '图钉'],
    ['o', '壁纸'], ['o', '海绵'], ['o', '泡沫饭盒'], ['o', '电蚊拍', '小型电器建议回收'], ['o', 'LED灯泡', '部分城市归有害'],
    ['o', '普通干电池', '无汞干电池部分城市可投其他'], ['o', '猫粮袋'], ['o', '外卖餐盒', '油腻的属其他'], ['o', '奶茶杯', '倒空后杯身其他，杯盖可回收'],
    ['o', '吸管'], ['o', '咖啡杯'], ['o', '隐形眼镜'], ['o', '化妆棉'], ['o', '面膜'], ['o', '纸巾包装'], ['o', '快递袋'],
    ['o', '气泡袋'], ['o', '破碎陶瓷'], ['o', '香灰'], ['o', '干燥剂'], ['o', '食品干燥剂'], ['o', '相框', '木质可回收'], ['o', '旧地垫']
  ];
  LH._garbageSearch = function (q) {
    q = String(q || '').trim();
    if (!q) return [];
    return GARBAGE_DB.filter(function (x) { return x[1].indexOf(q) >= 0 || (q.length >= 2 && x[1] === q); })
      .sort(function (a, b) { return a[1].indexOf(q) - b[1].indexOf(q) || a[1].length - b[1].length; })
      .slice(0, 20);
  };

  LH.impls.garbage = function (root) {
    var st = { q: '', cat: '' };
    function render() {
      var hits = st.q ? LH._garbageSearch(st.q) : [];
      var showCat = st.cat && !st.q;
      root.innerHTML =
        '<div class="search-bar" style="margin-top:0"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' +
        '<input id="gb-q" placeholder="输入物品名，如：电池、外卖盒、蛋壳…" value="' + esc(st.q) + '" enterkeyhint="search">' +
        (st.q ? '<span class="clear" id="gb-clear">✕</span>' : '') + '</div>' +
        '<div class="garbage-cats mt12" id="gb-cats">' +
        Object.keys(GARBAGE).map(function (k) {
          return '<button class="gcat" data-c="' + k + '" style="' + (st.cat === k && !st.q ? 'background:' + GARBAGE[k].color + '22;color:' + GARBAGE[k].color + ';' : '') + '"><span class="g-emoji">' + GARBAGE[k].emoji + '</span>' + GARBAGE[k].name + '</button>';
        }).join('') + '</div>' +
        '<div class="card mt12" id="gb-body"></div>' +
        '<p class="tiny mt12 center">※ 各城市分类标准略有差异，请以当地规定为准</p>';
      var body = LH.$('#gb-body', root);
      if (st.q) {
        body.innerHTML = hits.length === 0
          ? LH.emptyHTML('🤔', '没有找到「' + esc(st.q) + '」', '换个关键词试试，或按类别浏览；难以判断时可投其他垃圾')
          : hits.map(function (x) {
              var g = GARBAGE[x[0]];
              return '<div class="g-item"><div class="icon-tile" style="width:42px;height:42px;font-size:1.25rem;background:' + g.color + '1c">' + g.emoji + '</div>' +
                '<div class="grow"><div style="font-weight:700;font-size:.92rem">' + esc(x[1]) + '</div>' +
                '<div class="tiny mt4" style="color:' + g.color + ';font-weight:700">' + g.name + '</div>' +
                (x[2] ? '<div class="tiny mt4">💡 ' + esc(x[2]) + '</div>' : '') + '</div></div>';
            }).join('');
      } else if (st.cat) {
        var g2 = GARBAGE[st.cat];
        var items = GARBAGE_DB.filter(function (x) { return x[0] === st.cat; });
        body.innerHTML = '<div class="flex gap12 mb8"><span style="font-size:1.5rem">' + g2.emoji + '</span><div><b>' + g2.name + '</b><div class="tiny mt4" style="max-width:26em">' + g2.tip + '</div></div></div>' +
          '<div class="flex" style="flex-wrap:wrap;gap:7px;margin-top:10px">' +
          items.map(function (x) { return '<span class="mini-tag" style="font-size:.75rem">' + esc(x[1]) + '</span>'; }).join('') + '</div>';
      } else {
        body.innerHTML = LH.emptyHTML('🌱', '查一查，垃圾分类不难', '在上方搜索框输入物品名称');
      }
      LH.$('#gb-q', root).oninput = function () { st.q = this.value; render(); var el = LH.$('#gb-q', root); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
      var cl = LH.$('#gb-clear', root);
      if (cl) cl.onclick = function () { st.q = ''; render(); };
      LH.$$('#gb-cats .gcat', root).forEach(function (b) {
        b.onclick = function () {
          st.cat = (st.cat === b.dataset.c) ? '' : b.dataset.c;
          st.q = '';
          render();
        };
      });
    }
    render();
  };

  /* ========================================================
   * 3. 天气（Open-Meteo 免费接口，无需 Key）
   * ======================================================== */
  var WMO = {
    0: ['☀️', '晴'], 1: ['🌤️', '大部晴'], 2: ['⛅', '局部多云'], 3: ['☁️', '阴'],
    45: ['🌫️', '雾'], 48: ['🌫️', '冻雾'],
    51: ['🌦️', '毛毛雨'], 53: ['🌦️', '毛毛雨'], 55: ['🌦️', '浓毛毛雨'],
    56: ['🌧️', '冻毛毛雨'], 57: ['🌧️', '浓冻毛毛雨'],
    61: ['🌧️', '小雨'], 63: ['🌧️', '中雨'], 65: ['🌧️', '大雨'],
    66: ['🌧️', '冻雨'], 67: ['🌧️', '强冻雨'],
    71: ['🌨️', '小雪'], 73: ['🌨️', '中雪'], 75: ['❄️', '大雪'], 77: ['🌨️', '雪粒'],
    80: ['🌦️', '阵雨'], 81: ['🌦️', '强阵雨'], 82: ['⛈️', '暴雨'],
    85: ['🌨️', '阵雪'], 86: ['❄️', '强阵雪'],
    95: ['⛈️', '雷阵雨'], 96: ['⛈️', '雷阵雨伴冰雹'], 99: ['⛈️', '强雷暴冰雹']
  };
  function wmo(code) { return WMO[code] || ['🌡️', '未知']; }

  LH.impls.weather = function (root) {
    var st = { city: LH.get('weather_city', null), data: LH.get('weather_cache', null), loading: false };
    function renderLoading() {
      root.innerHTML = '<div class="card center" style="padding:50px 20px"><div style="font-size:2.4rem">🌏</div><p class="muted mt12">加载天气数据…</p></div>';
    }
    function renderError(msg, detail) {
      root.innerHTML =
        '<div class="card center" style="padding:40px 20px"><div style="font-size:2.4rem">📡</div>' +
        '<p class="muted mt12" style="line-height:1.7">' + esc(msg) + '<br><span class="tiny">' + esc(detail || '') + '</span></p>' +
        '<div class="flex gap8 mt16" style="justify-content:center">' +
        '<button class="btn primary" id="wt-retry">重试</button>' +
        '<button class="btn" id="wt-search2">搜索城市</button></div></div>' + searchHTML();
      LH.$('#wt-retry', root).onclick = function () { load(); };
      LH.$('#wt-search2', root).onclick = searchUI;
      bindSearch();
    }
    function searchHTML() {
      return '<div class="card section"><h4>🔍 查找城市</h4>' +
        '<div class="search-bar mt12" style="box-shadow:none;border:1.5px solid var(--line)"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' +
        '<input id="wt-city" placeholder="输入城市名，如：上海、成都" enterkeyhint="search"></div>' +
        '<button class="btn ghost block mt8" id="wt-loc" style="padding:11px">📍 使用我的位置</button>' +
        '<div id="wt-city-res" class="mt8"></div></div>';
    }
    function render() {
      var d = st.data;
      var c = d.current, daily = d.daily;
      var w = wmo(c.weather_code);
      var days = daily.time.map(function (t, i) {
        var wd = LH.parseDate(t);
        return '<div class="day-row"><span class="d-name">' + (i === 0 ? '今天' : '周' + LH.weekdayCN(wd)) + '</span>' +
          '<span class="d-icon">' + wmo(daily.weather_code[i])[0] + '</span>' +
          '<span class="d-desc">' + wmo(daily.weather_code[i])[1] + (daily.precipitation_probability_max && daily.precipitation_probability_max[i] > 30 ? ' ·雨概率' + daily.precipitation_probability_max[i] + '%' : '') + '</span>' +
          '<span class="d-temps"><span class="min">' + Math.round(daily.temperature_2m_min[i]) + '°</span><span class="max">' + Math.round(daily.temperature_2m_max[i]) + '°</span></span></div>';
      }).join('');
      root.innerHTML =
        '<div class="flex-between mb8"><span class="tiny">数据来源 Open-Meteo · ' + new Date(st.data.fetchedAt).toLocaleTimeString('zh-CN') + ' 更新</span>' +
        '<span class="tiny" id="wt-refresh" style="color:var(--primary);cursor:pointer">刷新</span></div>' +
        '<div class="card"><div class="weather-now">' +
        '<div class="city">📍 ' + esc(st.city.name) + '</div>' +
        '<div class="w-emoji">' + w[0] + '</div>' +
        '<div class="temp">' + Math.round(c.temperature_2m) + '°</div>' +
        '<div class="desc">' + w[1] + ' · 体感 ' + Math.round(c.apparent_temperature) + '°</div>' +
        '<div class="range">今天 ' + Math.round(daily.temperature_2m_min[0]) + '° ~ ' + Math.round(daily.temperature_2m_max[0]) + '° · 湿度 ' + c.relative_humidity_2m + '% · 风 ' + Math.round(c.wind_speed_10m) + ' km/h</div>' +
        '</div></div>' +
        '<div class="card mt12"><h4 style="font-size:.9rem" class="mb8">📅 未来 7 天</h4>' + days + '</div>' +
        searchHTML();
      LH.$('#wt-refresh', root).onclick = function () { load(); };
      bindSearch();
    }
    function bindSearch() {
      var inp = LH.$('#wt-city', root);
      if (!inp) return;
      inp.onkeydown = function (e) {
        if (e.key !== 'Enter') return;
        var q = inp.value.trim();
        if (!q) return;
        LH.$('#wt-city-res', root).innerHTML = '<p class="tiny center mt8">搜索中…</p>';
        fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=6&language=zh&format=json')
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var list = (j.results || []);
            LH.$('#wt-city-res', root).innerHTML = list.length ? list.map(function (x) {
              return '<div class="hit list-item" data-la="' + x.latitude + '" data-lo="' + x.longitude + '" data-n="' + esc(x.name) + '" data-ad="' + esc((x.admin1 || '') + ' ' + (x.country || '')) + '" style="cursor:pointer">' +
                '<div class="grow"><div class="title">' + esc(x.name) + '</div><div class="sub">' + esc((x.admin1 || '') + ' ' + (x.country || '')) + '</div></div><span style="color:var(--primary)">选择</span></div>';
            }).join('') : '<p class="tiny center mt8">未找到该城市</p>';
            LH.$$('#wt-city-res .hit', root).forEach(function (el) {
              el.onclick = function () {
                st.city = { name: el.dataset.n, la: +el.dataset.la, lo: +el.dataset.lo };
                LH.set('weather_city', st.city);
                load();
              };
            });
          })
          .catch(function () {
            LH.$('#wt-city-res', root).innerHTML = '<p class="tiny center mt8">搜索失败，请检查网络</p>';
          });
      };
      var loc = LH.$('#wt-loc', root);
      loc.onclick = function () {
        if (!navigator.geolocation) return LH.toast('当前浏览器不支持定位', 'err');
        LH.toast('正在获取位置…');
        navigator.geolocation.getCurrentPosition(function (pos) {
          st.city = { name: '我的位置', la: pos.coords.latitude, lo: pos.coords.longitude };
          LH.set('weather_city', st.city);
          load();
        }, function () {
          LH.toast('定位失败，请手动搜索城市', 'err');
        }, { timeout: 8000 });
      };
    }
    function load() {
      if (!st.city) { renderError('还未选择城市', '搜索城市名或使用定位（需联网）'); return; }
      st.loading = true; renderLoading();
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + st.city.la + '&longitude=' + st.city.lo +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7';
      fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.current) throw new Error('bad');
        j.fetchedAt = Date.now();
        st.data = j; LH.set('weather_cache', j);
        st.loading = false; render();
      }).catch(function () {
        st.loading = false;
        if (st.data) { render(); LH.toast('联网失败，显示缓存数据', 'err'); }
        else renderError('天气加载失败', '该工具需要联网，请检查网络后重试');
      });
    }
    function searchUI() { st.data = null; renderError('请选择城市', '该工具需联网获取天气'); }
    // 有缓存且 30 分钟内直接显示
    if (st.data && st.city && Date.now() - (st.data.fetchedAt || 0) < 1800000) render();
    else if (st.city) load();
    else if (st.data && !st.city) render();
    else renderError('请选择城市', '该工具需联网获取天气');
  };

  /* ========================================================
   * 4. 手电筒（屏幕灯）
   * ======================================================== */
  LH.impls.flashlight = function (root) {
    root.innerHTML =
      '<div class="card center" style="padding:30px 20px"><div style="font-size:3rem">🔦</div>' +
      '<p class="muted mt12" style="line-height:1.8">把屏幕变成照明灯：<b>白光</b>日常照明、<b>红光</b>夜间护眼不晃眼、<b>SOS</b>国际求救信号（三短三长三短）。</p>' +
      '<p class="tiny mt8">提示：使用前请将屏幕亮度调到最高；OLED 屏幕长时间显示纯白可能有残影风险。</p></div>' +
      '<button class="btn primary block mt12" id="fl-white" style="padding:15px">🔆 打开白光</button>' +
      '<button class="btn block mt12" id="fl-red" style="padding:15px;background:var(--danger-soft);color:var(--danger)">🔴 打开红光（夜间）</button>';
    function openLight(mode) {
      var ov = document.createElement('div');
      ov.className = 'flash-overlay' + (mode === 'red' ? ' red' : '');
      ov.innerHTML = '<div class="hint">轻点屏幕可关闭</div>' +
        '<div class="flash-btns">' +
        '<button class="f-btn" data-m="white">白光</button>' +
        '<button class="f-btn" data-m="red">红光</button>' +
        '<button class="f-btn" data-m="sos">SOS</button>' +
        '<button class="f-btn" data-m="close">关闭</button></div>';
      document.body.appendChild(ov);
      var sosTimer = null, sosOn = false;
      function sos() {
        sosOn = !sosOn;
        ov.style.background = sosOn ? '#C7352B' : '#1a1a1a';
      }
      function stopSos() { if (sosTimer) { clearInterval(sosTimer); sosTimer = null; ov.style.background = ''; sosOn = false; } }
      var cur = mode;
      ov.addEventListener('click', function (e) {
        var m = e.target.dataset && e.target.dataset.m;
        if (!m) { // 点空白处关闭
          stopSos(); ov.remove(); return;
        }
        if (m === 'close') { stopSos(); ov.remove(); return; }
        stopSos();
        cur = m;
        ov.classList.toggle('red', m === 'red');
        if (m === 'sos') { ov.classList.remove('red'); ov.style.background = '#1a1a1a'; sosTimer = setInterval(sos, 300); }
        else ov.style.background = '';
      });
    }
    LH.$('#fl-white', root).onclick = function () { openLight('white'); };
    LH.$('#fl-red', root).onclick = function () { openLight('red'); };
  };

  /* ========================================================
   * 5. 密码生成器
   * ======================================================== */
  LH.impls.password = function (root) {
    var st = { len: 16, lower: true, upper: true, digit: true, symbol: true, noAmb: true, pw: '' };
    function gen() {
      var pools = {
        lower: 'abcdefghijkmnopqrstuvwxyz',
        upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
        digit: '23456789',
        symbol: '!@#$%^&*()-_=+[]{}<>?,.'
      };
      if (st.noAmb) { // 排除易混淆字符
        pools.lower = pools.lower.replace(/[l]/g, '');
        pools.upper = pools.upper.replace(/[IO]/g, '');
        pools.digit = pools.digit.replace(/[01]/g, '');
      } else {
        pools.lower += 'l'; pools.upper += 'IO'; pools.digit += '01';
      }
      var all = '';
      ['lower', 'upper', 'digit', 'symbol'].forEach(function (k) { if (st[k]) all += pools[k]; });
      if (!all) return '';
      var arr = new Uint32Array(st.len);
      (window.crypto || window.msCrypto).getRandomValues(arr);
      var out = '';
      for (var i = 0; i < st.len; i++) out += all[arr[i] % all.length];
      return out;
    }
    function entropy() {
      var n = (st.lower ? 26 : 0) + (st.upper ? 26 : 0) + (st.digit ? 10 : 0) + (st.symbol ? 26 : 0);
      if (st.noAmb) n -= 5;
      return st.len * Math.log2(Math.max(2, n));
    }
    function level(e) {
      if (e < 40) return ['弱', 'var(--danger)', 25];
      if (e < 60) return ['中等', '#FFC53D', 50];
      if (e < 90) return ['强', '#35B26A', 75];
      return ['非常强', 'var(--primary)', 100];
    }
    function render() {
      var e = entropy(), lv = level(e);
      root.innerHTML =
        '<div class="card">' +
        '<div class="pw-out" id="pw-out">' + (st.pw ? esc(st.pw) : '点击下方按钮生成') + '</div>' +
        (st.pw ? '<div class="b-track mt12" style="height:8px;border-radius:99px;background:var(--card-2);overflow:hidden"><div style="height:100%;width:' + lv[2] + '%;background:' + lv[1] + ';transition:width .3s"></div></div>' +
          '<p class="tiny center mt4">强度：<b style="color:' + lv[1] + '">' + lv[0] + '</b> · 熵约 ' + Math.round(e) + ' bit</p>' : '') +
        '<div class="flex gap8 mt12">' +
        '<button class="btn primary grow" id="pw-gen">🎲 生成</button>' +
        '<button class="btn" id="pw-copy">⧉ 复制</button></div>' +
        '<div class="field mt16"><label>长度：<b id="pw-len-v">' + st.len + '</b> 位</label>' +
        '<input type="range" min="6" max="48" id="pw-len" value="' + st.len + '"></div>' +
        [['lower', '小写字母 a-z'], ['upper', '大写字母 A-Z'], ['digit', '数字 0-9'], ['symbol', '特殊符号 !@#$'], ['noAmb', '排除易混淆字符 (l I O 0 1)']].map(function (x) {
          return '<div class="check-row"><div class="grow">' + x[1] + '</div>' +
            '<label class="switch"><input type="checkbox" data-k="' + x[0] + '"' + (st[x[0]] ? ' checked' : '') + '><span class="track"></span><span class="knob"></span></label></div>';
        }).join('') +
        '</div>' +
        '<div class="card section"><h4>🔐 安全提示</h4><p class="tiny mt8" style="line-height:1.9">· 不同网站使用不同密码，尤其重要账号<br>· 密码由本页随机生成，不会上传到任何服务器<br>· 建议配合密码管理器使用</p></div>';
      LH.$('#pw-gen', root).onclick = function () { st.pw = gen(); if (!st.pw) return LH.toast('请至少选择一种字符类型', 'err'); render(); };
      LH.$('#pw-copy', root).onclick = function () { if (st.pw) LH.copy(st.pw); };
      LH.$('#pw-len', root).oninput = function () { st.len = +this.value; LH.$('#pw-len-v', root).textContent = st.len; };
      LH.$$('input[data-k]', root).forEach(function (c) {
        c.onchange = function () { st[c.dataset.k] = c.checked; };
      });
    }
    render();
  };

  /* ========================================================
   * 6. 字数统计
   * ======================================================== */
  LH.impls['text-count'] = function (root) {
    var st = { text: '' };
    function stats(t) {
      var cjk = (t.match(/[\u4e00-\u9fff]/g) || []).length;
      var words = (t.match(/[a-zA-Z]+/g) || []).length;
      var letters = (t.match(/[a-zA-Z]/g) || []).length;
      var digits = (t.match(/\d/g) || []).length;
      var spaces = (t.match(/ /g) || []).length;
      var lines = t ? t.split('\n').length : 0;
      var paras = t.split(/\n\s*\n/).filter(function (x) { return x.trim(); }).length;
      return { total: t.length, cjk: cjk, words: words, letters: letters, digits: digits, spaces: spaces, lines: lines, paras: paras };
    }
    function render() {
      var s = stats(st.text);
      root.innerHTML =
        '<div class="stat-grid mb12" style="grid-template-columns:repeat(2,1fr)">' +
        '<div class="stat-cell"><div class="v">' + s.total + '</div><div class="k">总字符数</div></div>' +
        '<div class="stat-cell"><div class="v">' + s.cjk + '</div><div class="k">中文汉字</div></div></div>' +
        '<div class="stat-grid mb12">' +
        '<div class="stat-cell"><div class="v">' + s.words + '</div><div class="k">英文单词</div></div>' +
        '<div class="stat-cell"><div class="v">' + s.letters + '</div><div class="k">英文字母</div></div>' +
        '<div class="stat-cell"><div class="v">' + s.digits + '</div><div class="k">数字</div></div></div>' +
        '<div class="stat-grid mb12 c2">' +
        '<div class="stat-cell"><div class="v">' + s.lines + '</div><div class="k">行数</div></div>' +
        '<div class="stat-cell"><div class="v">' + s.paras + '</div><div class="k">段落数</div></div></div>' +
        '<textarea class="input" id="tc-in" rows="9" placeholder="在此输入或粘贴文字，实时统计…">' + esc(st.text) + '</textarea>' +
        '<div class="flex gap8 mt12">' +
        '<button class="btn grow" id="tc-copy">⧉ 复制全文</button>' +
        '<button class="btn danger grow" id="tc-clear">清空</button></div>';
      var inp = LH.$('#tc-in', root);
      inp.oninput = function () {
        st.text = this.value;
        var s2 = stats(st.text);
        var cells = LH.$$('.stat-cell .v', root);
        cells[0].textContent = s2.total; cells[1].textContent = s2.cjk; cells[2].textContent = s2.words;
        cells[3].textContent = s2.letters; cells[4].textContent = s2.digits; cells[5].textContent = s2.lines; cells[6].textContent = s2.paras;
      };
      LH.$('#tc-copy', root).onclick = function () { LH.copy(st.text); };
      LH.$('#tc-clear', root).onclick = function () { st.text = ''; render(); };
    }
    render();
  };
})(window.LH);
