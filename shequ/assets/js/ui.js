/* ============================================================
   共享 UI 组件
   ============================================================ */

const NAV = [
  { href: 'index.html',         label: '总览' },
  { href: 'app/index.html',     label: '用户端' },
  { href: 'provider/hall.html', label: '服务者端' },
  { href: 'coord/index.html',   label: '协调人端' },
  { href: 'admin/index.html',   label: '管理后台' },
  { href: 'common/index.html',  label: '公共能力' },
  { href: 'mvp.html',           label: '最小闭环' }
];

function renderTopbar(active, opts) {
  opts = opts || {};
  const root = opts.root || '';
  const nav = NAV.map(i =>
    `<a href="${root}${i.href}"${i.href === active ? ' class="on"' : ''}>${i.label}</a>`).join('');
  return `
  <header class="topbar">
    <div class="wrap topbar-inner">
      <a class="brand" href="${root}index.html"><span class="brand-mark">锦</span><span>锦和苑 · 邻里服务</span></a>
      <nav class="nav">${nav}</nav>
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="wrap">
      <p><b>锦和苑 · 社区邻里服务平台</b> — 108 栋楼 / 3186 户 / 6 片区</p>
      <p>小区名称、楼栋、住户姓名、订单与纠纷记录均为虚构数据，仅用于产品演示。</p>
    </div>
  </footer>`;
}

/* ---------- 手机壳 ---------- */
function phoneOpen(title, bodyId, opts) {
  opts = opts || {};
  return `
  <div class="phone-frame">
    <div class="phone-status"><span>9:41</span><span>锦和苑</span><span>100%</span></div>
    <div class="phone-head">
      ${opts.back ? `<a href="${opts.back}" class="btn btn-ghost btn-sm" style="padding:3px 7px">←</a>` : ''}
      <h3>${title}</h3>
      ${opts.right ? `<span class="ml-auto small muted">${opts.right}</span>` : ''}
    </div>
    <div class="phone-body" id="${bodyId}"></div>
    ${opts.tabs ? phoneTabs(opts.tabs, opts.activeTab) : ''}
  </div>`;
}

const TABS = {
  user: [
    { key: 'home',   label: '首页', icon: '🏠', href: 'index.html' },
    { key: 'order',  label: '订单', icon: '📋', href: 'order-detail.html' },
    { key: 'credit', label: '信用', icon: '⭐', href: 'credit.html' },
    { key: 'me',     label: '我的', icon: '👤', href: 'me.html' }
  ],
  provider: [
    { key: 'hall',   label: '接单大厅', icon: '📢', href: 'hall.html' },
    { key: 'track',  label: '我的单',   icon: '📍', href: 'track.html' },
    { key: 'income', label: '收入',     icon: '💰', href: 'income.html' },
    { key: 'me',     label: '我的',     icon: '👤', href: 'certs.html' }
  ],
  coord: [
    { key: 'board',     label: '看板',     icon: '📊', href: 'index.html' },
    { key: 'review',    label: '需求初审', icon: '🔍', href: 'review.html' },
    { key: 'recommend', label: '推荐',     icon: '🤝', href: 'recommend.html' },
    { key: 'dispute',   label: '纠纷',     icon: '⚖️', href: 'dispute.html' }
  ]
};
/* 当前页面文件名自动命中对应 tab；也可用 opts.activeTab 显式指定 */
function phoneTabs(list, activeKey) {
  let key = activeKey;
  if (!key) {
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const hit = list.find(t => t.href.toLowerCase() === here);
    key = hit ? hit.key : null;
  }
  return `<nav class="phone-tabbar">` + list.map(t =>
    `<a href="${t.href}"${t.key === key ? ' class="on"' : ''}><span class="i">${t.icon}</span>${t.label}</a>`
  ).join('') + `</nav>`;
}

/* ---------- 设计说明卡 ---------- */
function featureNote(fid) {
  const f = Data.featureById(fid);
  if (!f) return '';
  return `
  <div class="fnote">
    <div class="fnote-head">
      <span class="kicker">设计说明</span>
      <span class="n">${f.n}</span>
      <span class="fid ml-auto">${f.id}</span>
    </div>
    <div class="fnote-body">
      <div class="fnote-row"><span class="lab">具体设计</span><span class="val">${f.d}</span></div>
      <div class="fnote-row why"><span class="lab">为什么</span><span class="val">${f.w}</span></div>
    </div>
  </div>`;
}

/* 清单行：可传 { showWhy: false } 精简呈现 */
function featureList(items, opts) {
  opts = opts || {};
  return items.map((f, i) => `
    <div class="flist">
      <span class="idx">${i + 1}</span>
      <div class="body">
        <div class="n">${f.n} <span class="fid">${f.id}</span></div>
        <div class="d">${f.d}</div>
        ${opts.showWhy === false ? '' : `<div class="w">↳ ${f.w}</div>`}
      </div>
    </div>`).join('');
}

/* ---------- 通用小组件 ---------- */
function catRow(c, opts) {
  opts = opts || {};
  const locked = c.risk === 'C';
  return `
  <div class="card" style="${opts.click ? 'cursor:pointer' : ''}${locked ? 'background:var(--risk-c-bg);border-color:#f5cbc8' : ''}"
    ${opts.click ? `onclick="${opts.click}"` : ''}>
    <div class="row" style="align-items:flex-start;gap:12px">
      <div style="font-size:22px;line-height:1.2">${c.icon}</div>
      <div style="flex:1;min-width:0">
        <div class="row wrapf" style="gap:6px">
          <span class="strong" style="font-size:13.5px">${c.name}</span>
          <span class="tag ${Data.riskClass(c.risk)}">${c.risk} 类 · ${Data.riskLabel(c.risk)}</span>
        </div>
        <div class="smaller muted mt-4">平台指导价 <span class="price">${c.guide}</span>${locked ? '' : ` · 接单门槛 lv≥${c.needLv}`}</div>
        ${locked ? `<div class="smaller mt-8" style="color:#8c2721;line-height:1.65">${c.reason}</div>` : ''}
      </div>
      ${opts.arrow ? `<span class="muted-2">›</span>` : ''}
    </div>
  </div>`;
}

function providerCard(p, opts) {
  opts = opts || {};
  return `
  <div class="card">
    <div class="row" style="align-items:flex-start;gap:12px">
      <div class="avatar" style="background:${Data.avatarColor(p.name)}">${Data.initials(p.name)}</div>
      <div style="flex:1;min-width:0">
        <div class="row wrapf" style="gap:6px">
          <span class="strong">${p.name}</span>
          ${Data.trustDots(p.lv)}
          <span class="tag tag-brand">${Data.trustName(p.lv)}</span>
        </div>
        <div class="smaller muted mt-4">${Data.buildingById(p.building).name} · 信用分 ${p.score} · 完成 ${p.orders} 单 · 评分 ${p.rating}</div>
        <div class="row wrapf mt-8" style="gap:5px">
          ${p.cats.map(c => `<span class="tag tag-gray">${Data.catById(c).name.slice(0, 6)}</span>`).join('')}
        </div>
      </div>
      ${opts.action ? `<div>${opts.action}</div>` : ''}
    </div>
    ${opts.certs ? `<div class="hr"></div>
      <div class="row wrapf" style="gap:6px">
        ${p.certs.map(c => {
          const cls = c.s === 'ok' ? 'tag-ok' : c.s === 'warn' ? 'tag-warn' : c.s === 'expired' ? 'tag-danger' : 'tag-gray';
          const mk = c.s === 'ok' ? '✓' : c.s === 'warn' ? '!' : c.s === 'expired' ? '✕' : '…';
          return `<span class="tag ${cls}">${mk} ${c.n}${c.exp ? ' · ' + c.exp : ''}</span>`;
        }).join('')}
      </div>` : ''}
  </div>`;
}

function toast(msg) {
  let el = document.getElementById('__toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '__toast';
    el.style.cssText = 'position:fixed;left:50%;bottom:56px;transform:translateX(-50%) translateY(6px);background:rgba(20,32,28,.95);color:#fff;padding:11px 20px;border-radius:10px;font-size:13px;z-index:9999;transition:opacity .25s,transform .25s;box-shadow:0 12px 32px rgba(0,0,0,.24);max-width:88vw;text-align:center;backdrop-filter:blur(8px)';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el.__t);
  el.__t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(6px)';
  }, 2200);
}

/* 页面初始化 */
function initPage(active, opts) {
  opts = opts || {};
  const nav = document.getElementById('nav');
  if (nav) nav.innerHTML = renderTopbar(active, opts);
  const ft = document.getElementById('footer');
  if (ft) ft.innerHTML = renderFooter();
}
