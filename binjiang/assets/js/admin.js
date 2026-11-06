/* ============================================================
   admin.js —— 管理后台（平台运营）
   总览 / 审核队列 / 风险预警 / 纠纷工单池 / 订单 / 品类配置 /
   协议模板 / 信用规则 / 楼栋开关 / 供需热力 / 机构 / 保险抽成 /
   内容风控 / 审计 / 数据看板(P2) / 系统设置
   ============================================================ */

const MENU = [
  { g: '运营总览' },
  { v: 'dash', n: '📊 总览看板' },
  { v: 'data', n: '📈 数据看板（P2）' },
  { g: '审核与风控' },
  { v: 'review', n: '✅ 审核队列' },
  { v: 'alerts', n: '🚨 风险预警池' },
  { v: 'disputes', n: '⚖️ 纠纷工单池' },
  { v: 'content', n: '🧷 内容与违禁风控' },
  { g: '交易' },
  { v: 'orders', n: '📦 订单管理' },
  { g: '配置' },
  { v: 'cats', n: '🧩 品类与风险配置' },
  { v: 'templates', n: '📝 协议模板管理' },
  { v: 'credit', n: '⭐ 信用规则配置' },
  { v: 'buildings', n: '🏘️ 楼栋开通开关' },
  { v: 'heat', n: '🔥 供需热力图' },
  { v: 'orgs', n: '🏢 C类机构管理' },
  { v: 'insurance', n: '🛡️ 保险与抽成配置' },
  { g: '系统' },
  { v: 'audit', n: '🧾 操作审计日志' },
  { v: 'settings', n: '⚙️ 系统设置' }
];

const TITLES = {
  dash: '运营总览', data: '数据看板（P2）', review: '审核队列', alerts: '风险预警池',
  disputes: '纠纷工单池', content: '内容与违禁风控', orders: '订单管理',
  cats: '品类与风险配置', templates: '协议模板管理', credit: '信用规则配置',
  buildings: '楼栋开通开关', heat: '供需热力图', orgs: 'C类机构管理',
  insurance: '保险与抽成配置', audit: '操作审计日志', settings: '系统设置'
};

const A = { view: 'dash', zone: 'A' };

function nav(v) { A.view = v; render(); }
function render() {
  document.getElementById('menu').innerHTML = MENU.map(m => m.g
    ? `<div class="mgroup">${m.g}</div>`
    : `<a class="${A.view === m.v ? 'active' : ''}" onclick="nav('${m.v}')">${m.n}</a>`
  ).join('');
  document.getElementById('vtitle').textContent = TITLES[A.view];
  const V = { dash: vDash, data: vData, review: vReview, alerts: vAlerts, disputes: vDisputes, content: vContent, orders: vOrders, cats: vCats, templates: vTemplates, credit: vCredit, buildings: vBuildings, heat: vHeat, orgs: vOrgs, insurance: vInsurance, audit: vAudit, settings: vSettings };
  document.getElementById('view').innerHTML = (V[A.view] || vDash)();
  window.scrollTo(0, 0);
}
window.addEventListener('DOMContentLoaded', render);

/* ================= 总览 ================= */
function vDash() {
  const os = S.orders;
  const done = os.filter(o => o.status === 'completed').length;
  const closed = done + os.filter(o => o.status === 'cancelled').length;
  const closeRate = os.length ? Math.round(closed / os.length * 100) : 0;
  const disputeRate = os.length ? Math.round(S.disputes.length / os.length * 100) : 0;
  const pendingAlerts = S.riskAlerts.filter(a => a.status === 'pending');
  const openDisputes = S.disputes.filter(d => d.status !== 'resolved');
  const maxv = Math.max(...S.weekTrend.map(w => w.orders));
  return `
  <div class="kpi-grid">
    <div class="kpi"><div class="muted">累计订单</div><div class="kv">${os.length}</div><div class="kd">覆盖 ${S.buildings.filter(b => b.enabled).length} 栋已开通楼栋</div></div>
    <div class="kpi good"><div class="muted">订单闭环率</div><div class="kv">${closeRate}%</div><div class="kd">完成/取消占全部订单</div></div>
    <div class="kpi ${disputeRate > 20 ? 'bad' : ''}"><div class="muted">纠纷率</div><div class="kv">${disputeRate}%</div><div class="kd">${S.disputes.filter(d => d.status === 'resolved').length}/${S.disputes.length} 已闭环</div></div>
    <div class="kpi"><div class="muted">活跃服务者</div><div class="kv">${S.providers.filter(p => p.open).length}</div><div class="kd">认证邻居 ${S.providers.length} 位</div></div>
  </div>
  <div class="grid2">
    <div class="card-table"><h3>近7日订单趋势</h3>
      <div class="bars">${S.weekTrend.map(w => `<div class="bcol"><span class="bval">${w.orders}</span><div class="bar" style="height:${Math.round(w.orders / maxv * 100)}%"></div><span class="blb">${w.day}</span></div>`).join('')}</div></div>
    <div class="card-table"><h3>待处理事项</h3>
      <div class="list-item"><div class="li-ico">🚨</div><div class="li-main"><div class="li-title">风险预警 ${pendingAlerts.length} 单待复核</div><div class="li-sub">高额报酬 / 未成年接送 / 异常标记</div></div><button class="btn small" onclick="nav('alerts')">处理</button></div>
      <div class="list-item"><div class="li-ico">⚖️</div><div class="li-main"><div class="li-title">平台纠纷工单 ${openDisputes.filter(d => d.status === 'platform').length} 单判定中</div><div class="li-sub">另有 ${openDisputes.filter(d => d.status === 'coordinator').length} 单楼栋初调中</div></div><button class="btn small" onclick="nav('disputes')">处理</button></div>
      <div class="list-item"><div class="li-ico">✅</div><div class="li-main"><div class="li-title">审核队列：住户 ${S.users.filter(u => u.applyState === 'pending').length} · 服务者 ${S.providerApplies.filter(a => a.status === 'pending').length} · 申诉 ${S.reviews.filter(r => r.appeal && r.appeal.status === 'pending').length}</div></div><button class="btn small" onclick="nav('review')">处理</button></div>
    </div>
  </div>
  <div class="card-table"><h3>近期审计动态</h3>
    <table class="table"><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>说明</th></tr>
    ${S.audits.slice(0, 5).map(a => `<tr><td>${esc(shortTime(a.at))}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(a.target)}</td><td>${esc(a.detail)}</td></tr>`).join('')}</table></div>`;
}

/* ================= 数据看板 P2 ================= */
function vData() {
  return `
  <div class="banner info">P2 规模化阶段启用：用数据决定扩展，不靠拍脑袋。当前展示示意指标。</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="muted">月复购率</div><div class="kv">42%</div><div class="kd">目标 50%</div></div>
    <div class="kpi"><div class="muted">服务者月留存</div><div class="kv">78%</div><div class="kd">目标 80%</div></div>
    <div class="kpi"><div class="muted">平均接单时长</div><div class="kv">26分钟</div><div class="kd">A类 &lt; 15min 为健康</div></div>
    <div class="kpi"><div class="muted">户均年互助次数</div><div class="kv">9.6</div><div class="kd">邻里渗透率核心指标</div></div>
  </div>
  <div class="card-table"><h3>分品类健康度（示意）</h3>
    <table class="table"><tr><th>品类</th><th>订单量</th><th>接单率</th><th>纠纷率</th><th>复购</th></tr>
    <tr><td>代取快递</td><td>186</td><td>96%</td><td>0.5%</td><td>68%</td></tr>
    <tr><td>代扔垃圾</td><td>97</td><td>92%</td><td>0%</td><td>61%</td></tr>
    <tr><td>上门喂宠/寄养</td><td>45</td><td>81%</td><td>2.2%</td><td>44%</td></tr>
    <tr><td>上门保洁</td><td>38</td><td>74%</td><td>2.6%</td><td>39%</td></tr>
    <tr><td>儿童短时接送</td><td>22</td><td>66%</td><td>0%</td><td>52%</td></tr></table></div>`;
}

/* ================= 审核队列 ================= */
function vReview() {
  const pendUsers = S.users.filter(u => u.applyState === 'pending');
  const pendApplies = S.providerApplies.filter(a => a.status === 'pending');
  const pendAppeals = S.reviews.filter(r => r.appeal && r.appeal.status === 'pending');
  const qualsWarn = [];
  S.providers.forEach(p => p.quals.forEach(q => { if (q.status !== 'valid') qualsWarn.push({ p, q }); }));

  return `
  <div class="grid2">
    <div class="card-table"><h3>住户核验（${pendUsers.length}）</h3>
      ${pendUsers.map(u => `<div class="card" style="box-shadow:none;border:1px solid var(--border)">
        <div class="row between"><b>${esc(u.name)}</b><span class="pill pill-amber">待核验</span></div>
        <div class="small muted mt8">${esc(u.phone)} · ${esc(u.building)} ${esc(u.room)} · 提交于 ${esc(shortTime(u.applyAt))}<br>材料：${esc(u.proof)}</div>
        <div class="btn-row"><button class="btn small gray" onclick="rejectUser('${u.id}')">驳回</button>
        <button class="btn small" onclick="approveUser('${u.id}')">通过核验</button></div>
      </div>`).join('') || '<div class="muted">无待审核住户</div>'}
      <div class="hint">核验方式：对接物业住户数据（自动）或房产/租赁证明（人工）。通过后成为"真实邻居"。</div>
    </div>
    <div class="card-table"><h3>服务者认证（${pendApplies.length}）</h3>
      ${pendApplies.map(a => `<div class="card" style="box-shadow:none;border:1px solid var(--border)">
        <div class="row between"><b>${esc(a.name)} · ${esc(a.building)}</b><span class="pill pill-blue">${esc(a.applyFor)}</span></div>
        <div class="small muted mt8">申请品类：${a.cats.map(cid => esc(catById(cid).name)).join('、')} · 提交于 ${esc(shortTime(a.submittedAt))}<br>材料：${esc(a.materials)}</div>
        <div class="btn-row"><button class="btn small gray" onclick="rejectApply('${a.id}')">驳回</button>
        <button class="btn small" onclick="approveApply('${a.id}')">通过认证</button></div>
      </div>`).join('') || '<div class="muted">无待审核申请</div>'}
    </div>
  </div>
  <div class="grid2">
    <div class="card-table"><h3>评价申诉（${pendAppeals.length}）</h3>
      ${pendAppeals.map(r => `<div class="card" style="box-shadow:none;border:1px solid var(--border)">
        <div class="small"><b>${esc(userById(r.fromId).name)}</b> → ${esc(providerById(r.toId).name)} <span class="stars">${starsHtml(r.stars)}</span><br>"${esc(r.text)}"</div>
        <div class="banner info mt8">申诉理由：${esc(r.appeal.reason)}</div>
        <div class="btn-row"><button class="btn small gray" onclick="judgeAppeal('${r.id}',false)">不成立</button>
        <button class="btn small" onclick="judgeAppeal('${r.id}',true)">成立（撤差评·对方扣8分）</button></div>
      </div>`).join('') || '<div class="muted">无待处理申诉</div>'}
    </div>
    <div class="card-table"><h3>资质到期预警（${qualsWarn.length}）</h3>
      ${qualsWarn.map(({ p, q }) => `<div class="list-item"><div class="li-ico">${q.status === 'expired' ? '⛔' : '⚠️'}</div>
        <div class="li-main"><div class="li-title">${esc(p.name)} · ${esc(q.type)}</div>
        <div class="li-sub">有效期至 ${esc(q.expireAt)} · ${q.status === 'expired' ? '<b style="color:var(--danger)">已过期，已自动停接</b>' : '<b style="color:var(--warn)">30天内到期</b>'}</div></div></div>`).join('') || '<div class="muted">全部资质正常</div>'}
      <div class="hint">规则：资质到期前30天提醒；过期自动停接B类，更新后恢复。</div>
    </div>
  </div>`;
}
function approveUser(id) {
  const u = userById(id);
  u.verified = true; u.verifiedAt = dbNow().slice(0, 10); u.applyState = 'approved';
  S.privacyConsents.push({ id: uid('pc'), userId: id, item: '住户核验（手机号+房号+房产材料）', at: dbNow() });
  notify(id, 'order', '住户核验通过', '欢迎加入翡翠城邻里互助，您已成为"真实邻居"');
  audit('管理员', '住户核验通过', u.name, u.building + u.room);
  saveDB(); render(); toast('已通过核验');
}
function rejectUser(id) {
  const u = userById(id);
  confirmBox('驳回核验', '驳回 ' + u.name + ' 的住户核验申请？将通知其补充材料。', () => {
    u.applyState = 'rejected';
    notify(id, 'order', '核验未通过', '材料不完整，请重新上传房产/租赁证明');
    audit('管理员', '住户核验驳回', u.name, '材料不完整');
    saveDB(); render();
  }, '确认驳回');
}
function approveApply(id) {
  const a = S.providerApplies.find(x => x.id === id);
  a.status = 'approved';
  let p = S.providers.find(x => x.userId === a.userId);
  if (!p) {
    p = { id: uid('p'), userId: a.userId, name: a.name, building: a.building, rating: 5, completed: 0, credit: 90, levels: { neighbor: true, platform: true, community: false }, cats: a.cats, open: true, quals: [{ type: '无犯罪记录承诺书', expireAt: '永久', status: 'valid' }], bio: '' };
    S.providers.push(p);
  } else {
    p.levels.platform = true;
    a.cats.forEach(cid => { if (!p.cats.includes(cid)) p.cats.push(cid); });
  }
  notify(a.userId, 'order', '平台认可认证通过', '您已获得"平台认可"标识，B类服务已开放');
  audit('管理员', '服务者认证通过', a.name, a.applyFor);
  saveDB(); render(); toast('认证已通过');
}
function rejectApply(id) {
  const a = S.providerApplies.find(x => x.id === id);
  confirmBox('驳回认证', '驳回 ' + a.name + ' 的认证申请？', () => {
    a.status = 'rejected';
    notify(a.userId, 'order', '认证未通过', '请补充材料后重新申请');
    audit('管理员', '服务者认证驳回', a.name, a.applyFor);
    saveDB(); render();
  }, '确认驳回');
}
function judgeAppeal(rvId, upheld) {
  const rv = S.reviews.find(r => r.id === rvId);
  rv.appeal.status = upheld ? 'upheld' : 'rejected';
  if (upheld) {
    creditAdd(rv.fromId, -8, '恶意差评核实成立', rv.orderId);
    const p = providerById(rv.toId);
    notify(rv.fromId, 'order', '申诉判定：差评不实', '经核实您的评价不实，扣除信用分8分');
    notify(p.userId, 'order', '申诉成立', '恶意差评已撤销，信用分已恢复');
    audit('管理员', '申诉成立', '评价' + rv.id, '差评方扣8分');
  } else {
    audit('管理员', '申诉不成立', '评价' + rv.id, '维持原评价');
  }
  saveDB(); render(); toast(upheld ? '申诉成立' : '维持原评价');
}

/* ================= 风险预警池 ================= */
function vAlerts() {
  const pending = S.riskAlerts.filter(a => a.status === 'pending');
  const done = S.riskAlerts.filter(a => a.status !== 'pending');
  const row = a => {
    const o = orderById(a.orderId);
    return `<tr>
      <td>${esc(shortTime(a.at))}</td>
      <td>${a.level === 'high' ? '<span class="tag tag-red">高</span>' : '<span class="tag tag-b">中</span>'} ${esc(a.rule)}</td>
      <td>${o ? esc(o.title) + ' · ' + money(o.price) + ' · ' + esc(userById(o.publisherId).name) : '订单已删除'}</td>
      <td>${o ? statusPill(o.status) : '-'}</td>
      <td><div class="actions">
        <button class="btn small ghost" onclick="alertView('${a.id}')">查看订单</button>
        ${a.status === 'pending' ? `<button class="btn small" onclick="alertClear('${a.id}')">复核通过</button>
        <button class="btn small danger" onclick="alertBlock('${a.id}')">拦截订单</button>`
          : a.status === 'cleared' ? '<span class="pill pill-green">已放行</span>' : '<span class="pill pill-red">已拦截</span>'}
      </div></td></tr>`;
  };
  return `
  <div class="banner warn">规则引擎自动标记：未成年接送 / 多日宠物寄养 / 高额报酬 / 涉钥匙证件 / 协调人异常标记 —— <b>高风险单必须拦截或人工复核后才进入接单大厅。</b></div>
  <div class="card-table"><h3>待处理（${pending.length}）</h3>
    <table class="table"><tr><th>触发时间</th><th>预警规则</th><th>订单</th><th>状态</th><th>操作</th></tr>
    ${pending.map(row).join('') || '<tr><td colspan="5" class="muted">暂无待处理预警</td></tr>'}</table></div>
  <div class="card-table"><h3>处理记录（${done.length}）</h3>
    <table class="table"><tr><th>触发时间</th><th>预警规则</th><th>订单</th><th>状态</th><th>处理人</th></tr>
    ${done.map(a => {
      const o = orderById(a.orderId);
      return `<tr><td>${esc(shortTime(a.at))}</td><td>${esc(a.rule)}</td><td>${o ? esc(o.title) : '-'}</td>
      <td>${a.status === 'cleared' ? '<span class="pill pill-green">已放行</span>' : '<span class="pill pill-red">已拦截</span>'}</td><td>${esc(a.handledBy || '-')}</td></tr>`;
    }).join('') || '<tr><td colspan="5" class="muted">暂无记录</td></tr>'}</table></div>`;
}
function alertView(id) {
  const a = S.riskAlerts.find(x => x.id === id); const o = orderById(a.orderId);
  if (!o) return toast('订单不存在');
  modal(`<h3>订单核查 · ${esc(o.id)}</h3>
    <div class="small">${esc(o.title)} ${statusPill(o.status)} ${payPill(o.payStatus)}<br>
    需求方：${esc(userById(o.publisherId).name)}（信用${userById(o.publisherId).credit}） · 楼栋：${esc(o.building)}<br>
    报酬：${money(o.price)} · 指导价上限：${money(catById(o.catId).guideMax)}<br>
    预警：${esc(a.rule)}</div>
    ${o.special ? `<hr class="hr"><div class="small">${esc(specialBrief(o))}</div>` : ''}
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">关闭</button></div>`, { center: true });
}
function specialBrief(o) {
  const s = o.special || {};
  if (s.type === 'package') return '包裹来源：' + s.source + ' · ' + (s.sourceNote || '');
  if (s.type === 'pet') return '宠物：' + s.petName;
  if (s.type === 'child') return '儿童：' + s.childName + ' · ' + s.school;
  return JSON.stringify(s);
}
function alertClear(id) {
  const a = S.riskAlerts.find(x => x.id === id); const o = orderById(a.orderId);
  confirmBox('复核通过', '确认放行该订单进入接单大厅？', () => {
    a.status = 'cleared'; a.handledBy = '管理员';
    if (o) {
      o.reviewStatus = 'cleared'; o.status = 'pending_accept';
      o.timeline.push({ t: dbNow(), s: '平台复核通过（' + (o.riskFlags || []).join('、') + '）', by: '管理员' });
      notify(o.publisherId, 'order', '订单复核通过', '您的订单已进入接单大厅', o.id);
    }
    audit('管理员', '风险复核通过', '订单' + (o ? o.id : ''), a.rule);
    saveDB(); render(); toast('已放行');
  });
}
function alertBlock(id) {
  const a = S.riskAlerts.find(x => x.id === id); const o = orderById(a.orderId);
  confirmBox('拦截订单', '将取消该订单并通知需求方说明原因。确认拦截？', () => {
    a.status = 'blocked'; a.handledBy = '管理员';
    if (o) {
      o.status = 'cancelled';
      o.timeline.push({ t: dbNow(), s: '平台拦截：' + a.rule, by: '管理员' });
      notify(o.publisherId, 'risk', '订单被拦截', '系统检测到风险（' + a.rule + '），订单已取消。如有疑问请联系平台。', o.id);
    }
    audit('管理员', '风险订单拦截', '订单' + (o ? o.id : ''), a.rule);
    saveDB(); render(); toast('已拦截并通知');
  }, '确认拦截');
}

/* ================= 纠纷工单池 ================= */
function vDisputes() {
  const list = S.disputes.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return `
  <div class="banner warn">纠纷不闭环会迅速摧毁口碑。统一受理 · SLA计时 · 证据查看 · 责任判定 · 闭环记录。</div>
  <div class="card-table"><h3>工单池（${list.length}）</h3>
    <table class="table"><tr><th>工单</th><th>订单</th><th>发起人</th><th>级别/SLA</th><th>状态</th><th>操作</th></tr>
    ${list.map(d => {
      const o = orderById(d.orderId);
      const overdue = new Date(d.slaDeadline) < new Date() && d.status !== 'resolved';
      return `<tr>
        <td>${esc(d.id)}<div class="muted small">${esc(shortTime(d.createdAt))}</div></td>
        <td>${o ? esc(o.title) + '<div class="muted small">' + money(o.price) + ' ' + esc(o.building) + '</div>' : '-'}</td>
        <td>${esc(userById(d.filedBy).name)}</td>
        <td>${esc(d.level)} ${overdue ? '<span class="tag tag-red">SLA超时</span>' : ''}<div class="muted small">截止 ${esc(shortTime(d.slaDeadline))}</div></td>
        <td>${d.status === 'coordinator' ? '<span class="pill pill-amber">楼栋初调</span>' : d.status === 'platform' ? '<span class="pill pill-red">平台判定中</span>' : '<span class="pill pill-green">已闭环</span>'}</td>
        <td><div class="actions">
          <button class="btn small ghost" onclick="disputeView('${d.id}')">证据链</button>
          ${d.status === 'platform' ? `<button class="btn small" onclick="disputeJudge('${d.id}')">责任判定</button>` : ''}
        </div></td></tr>`;
    }).join('')}</table></div>`;
}
function disputeView(id) {
  const d = S.disputes.find(x => x.id === id); const o = orderById(d.orderId);
  const evi = o.evidence || {};
  const chat = (o.messages || []).map(m => `<div class="bubble ${m.from === o.publisherId ? 'other' : 'me'}" style="max-width:90%">${esc(m.text)}<div class="bt">${esc(shortTime(m.at))}</div></div>`).join('');
  modal(`<h3>⚖️ 证据链 · ${esc(d.id)}</h3>
    <div class="small">事由：${esc(d.reason)}<br>订单：${esc(o.title)} · ${money(o.price)} ${payPill(o.payStatus)}<br>
    需求方：${esc(userById(o.publisherId).name)} · 服务者：${o.providerId ? esc(providerById(o.providerId).name) : '无'}</div>
    <hr class="hr">
    <div class="evi-group"><div class="gt">服务前</div><div class="photos">${(evi.before || []).map(photoChip).join('') || '<span class="muted small">无</span>'}</div></div>
    <div class="evi-group"><div class="gt">服务后</div><div class="photos">${(evi.after || []).map(photoChip).join('') || '<span class="muted small">无</span>'}</div></div>
    <div class="evi-group"><div class="gt">协议</div><div class="small">${o.agreement ? esc(templateById(o.agreement.templateId).name) + ' ' + esc(o.agreement.version) + '（双方已签）' : '无'}</div></div>
    <div class="evi-group"><div class="gt">沟通记录（脱敏留痕）</div><div class="chat" style="max-height:140px">${chat || '<span class="muted small">无</span>'}</div></div>
    ${d.judgment ? `<div class="banner ok">判定：${esc(d.judgment)}</div>` : ''}
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">关闭</button></div>`, { center: true });
}
function disputeJudge(id) {
  const d = S.disputes.find(x => x.id === id); const o = orderById(d.orderId);
  const provUid = o.providerId ? providerById(o.providerId).userId : null;
  modal(`<h3>⚖️ 责任判定 · ${esc(d.id)}</h3>
    <div class="banner info">判定依据：凭证照片 + 协议条款 + 沟通记录。判定后自动执行资金处置并调整信用。</div>
    <div class="form-item"><label>责任认定</label><select id="dj_resp">
      <option value="provider">服务者有责</option><option value="publisher">需求方有责</option><option value="both">双方各担</option></select></div>
    <div class="form-item"><label>资金处置</label><select id="dj_fund" onchange="document.getElementById('dj_partial_row').style.display=this.value==='partial'?'block':'none'">
      <option value="release">放款结算给服务者</option><option value="refund">全额退款给需求方</option><option value="partial">部分退款</option></select></div>
    <div class="form-item" id="dj_partial_row" style="display:none"><label>退款金额（元）</label><input id="dj_partial" type="number" value="${Math.round(o.price / 2)}"></div>
    <div class="form-item"><label>判定说明（闭环记录）</label><textarea id="dj_note"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="dj_ok">执行判定</button></div>`, { center: true });
  document.getElementById('dj_ok').onclick = () => {
    const resp = document.getElementById('dj_resp').value;
    const fund = document.getElementById('dj_fund').value;
    const note = document.getElementById('dj_note').value.trim();
    const part = Number((document.getElementById('dj_partial') || {}).value) || 0;
    if (!note) return toast('请填写判定说明');
    closeModal();
    let judgment = '责任：' + (resp === 'provider' ? '服务者' : resp === 'publisher' ? '需求方' : '双方各担') + '；';
    if (fund === 'release') {
      o.payStatus = 'released'; o.status = 'completed'; o.escrow.releasedAt = dbNow();
      judgment += '放款结算给服务者。';
    } else if (fund === 'refund') {
      o.payStatus = 'refunded'; o.status = 'cancelled';
      judgment += '全额退款给需求方。';
    } else {
      o.payStatus = 'refunded'; o.status = 'completed';
      o.escrow.amount = Math.max(0, o.escrow.amount - part);
      judgment += '部分退款' + money(part) + '，余款结算服务者。';
    }
    judgment += ' ' + note;
    if (resp === 'provider' && provUid) creditAdd(provUid, -5, '争议判定有责', o.id);
    if (resp === 'publisher') creditAdd(o.publisherId, -5, '争议判定有责（需求方）', o.id);
    d.status = 'resolved'; d.judgment = judgment; d.level = '平台判定（已闭环）';
    o.timeline.push({ t: dbNow(), s: '平台责任判定 · 工单闭环', by: '管理员' });
    notify(o.publisherId, 'dispute', '纠纷判定完成', judgment, o.id);
    if (provUid) notify(provUid, 'dispute', '纠纷判定完成', judgment, o.id);
    audit('管理员', '纠纷责任判定', d.id, judgment.slice(0, 50));
    saveDB(); render(); toast('判定已执行，工单闭环');
  };
}

/* ================= 订单管理 ================= */
function vOrders() {
  const kw = (A.orderKw || '').toLowerCase();
  let list = S.orders.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (kw) list = list.filter(o => (o.title + o.building + o.id + userById(o.publisherId).name).toLowerCase().includes(kw));
  return `
  <div class="card-table">
    <div class="row between" style="margin-bottom:10px">
      <h3>全部订单（${list.length}）</h3>
      <input placeholder="搜索：标题/楼栋/用户/单号" style="border:1px solid var(--border);border-radius:8px;padding:7px 12px;width:260px"
        value="${esc(A.orderKw || '')}" oninput="A.orderKw=this.value;render()">
    </div>
    <table class="table"><tr><th>订单</th><th>品类</th><th>楼栋/需求方</th><th>金额</th><th>支付</th><th>状态</th><th>风险</th><th>操作</th></tr>
    ${list.map(o => {
      const c = catById(o.catId);
      return `<tr><td>${esc(o.id)}<div class="muted small">${esc(shortTime(o.createdAt))}</div></td>
        <td>${c.icon} ${esc(c.name)} ${riskTag(c.risk)}</td>
        <td>${esc(o.building)} · ${esc(userById(o.publisherId).name)}${o.providerId ? '<div class="muted small">服务者：' + esc(providerById(o.providerId).name) + '</div>' : ''}</td>
        <td><b>${money(o.price)}</b></td><td>${payPill(o.payStatus)}</td><td>${statusPill(o.status)}</td>
        <td>${o.riskFlags && o.riskFlags.length ? '<span class="tag tag-red">' + esc(o.riskFlags[0]) + '</span>' : '-'}</td>
        <td><div class="actions"><button class="btn small ghost" onclick="adminViewOrder('${o.id}')">详情</button>
        ${['pending_accept', 'accepted', 'in_service'].includes(o.status) ? `<button class="btn small danger-outline" onclick="adminCloseOrder('${o.id}')">强制关闭</button>` : ''}</div></td></tr>`;
    }).join('')}</table></div>`;
}
function adminViewOrder(id) {
  const o = orderById(id);
  modal(`<h3>订单详情 · ${esc(o.id)}</h3>
    <div class="small">${esc(o.title)} ${statusPill(o.status)} ${payPill(o.payStatus)}<br>
    ${esc(catById(o.catId).name)} · ${esc(userById(o.publisherId).name)} → ${o.providerId ? esc(providerById(o.providerId).name) : '未接单'}<br>
    ${esc(o.building)} ${esc(o.room)} · ${money(o.price)} · ${esc(o.scheduledAt || '')}</div>
    ${o.riskFlags && o.riskFlags.length ? `<div class="banner danger mt8">⚠ ${esc(o.riskFlags.join('、'))}</div>` : ''}
    <hr class="hr"><div class="timeline">${(o.timeline || []).map(t => `<div class="tl-item">${esc(t.s)}<div class="tl-t">${esc(shortTime(t.t))} · ${esc(t.by || '')}</div></div>`).join('')}</div>
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">关闭</button></div>`, { center: true });
}
function adminCloseOrder(id) {
  const o = orderById(id);
  confirmBox('强制关闭', '平台强制关闭订单' + o.id + '？将通知双方并记录审计。', () => {
    o.status = 'cancelled';
    if (o.payStatus === 'escrowed') o.payStatus = 'refunded';
    o.timeline.push({ t: dbNow(), s: '平台强制关闭', by: '管理员' });
    notify(o.publisherId, 'risk', '订单被平台关闭', '该订单违反平台规则或存在风险，已关闭', id);
    audit('管理员', '强制关闭订单', id, catById(o.catId).name);
    saveDB(); render(); toast('已关闭');
  }, '确认关闭');
}

/* ================= 品类与风险配置 ================= */
function vCats() {
  return `
  <div class="banner info">风险分级必须可配置：A/B/C 类、必填字段、协议模板、准入门槛、指导价均在此配置，变更全量审计。</div>
  <div class="card-table"><h3>服务品类（${S.categories.length}）</h3>
    <table class="table"><tr><th>品类</th><th>风险级</th><th>指导价</th><th>价格上限</th><th>必填项</th><th>协议</th><th>专项流程</th><th>上架</th><th>操作</th></tr>
    ${S.categories.map(c => `<tr>
      <td>${c.icon} ${esc(c.name)}</td><td>${riskTag(c.risk)}</td>
      <td>${esc(c.guide)}</td><td>${money(c.guideMax)}</td>
      <td>${c.fields.filter(f => f.required).length} 项</td>
      <td>${c.agreement ? '<span class="pill pill-green">' + esc(templateById(c.agreement).version) + '</span>' : '<span class="muted">—</span>'}</td>
      <td>${c.special ? '<span class="tag tag-b">' + ({ pet: '宠物专项', child: '接娃专项', package: '包裹声明', key: '钥匙确认码', certificate: '证件红线' }[c.special] || c.special) + '</span>' : '—'}</td>
      <td><label class="switch"><input type="checkbox" ${c.enabled ? 'checked' : ''} onchange="toggleCat('${c.id}',this.checked)"><span class="sl"></span></label></td>
      <td><button class="btn small ghost" onclick="editCat('${c.id}')">编辑</button></td></tr>`).join('')}</table></div>
  <div class="card-table"><h3>红线规则（不可配置 · 强制执行）</h3>
    ${S.redLines.map(r => `<div class="banner danger" style="margin-bottom:6px">🚫 ${esc(r)}</div>`).join('')}
  </div>`;
}
function toggleCat(id, on) {
  const c = catById(id); c.enabled = on;
  audit('管理员', on ? '上架品类' : '下架品类', c.name, '');
  saveDB(); toast(on ? '已上架' : '已下架，居民端即时生效');
}
function editCat(id) {
  const c = catById(id);
  modal(`<h3>编辑品类 · ${esc(c.name)}</h3>
    <div class="form-grid">
      <div class="form-item"><label>指导价文案</label><input id="ec_guide" value="${esc(c.guide)}"></div>
      <div class="form-item"><label>价格上限（元，超3倍触发预警）</label><input id="ec_max" type="number" value="${c.guideMax}"></div>
    </div>
    <div class="form-item"><label>准入门槛</label><select id="ec_access"><option ${c.risk === 'A' ? 'selected' : ''} value="A">A类 · 真实邻居即可</option><option ${c.risk === 'B' ? 'selected' : ''} value="B">B类 · 需平台认可认证</option></select><div class="hint">改为B类后，未获"平台认可"的服务者不可接单。</div></div>
    <div class="form-item"><label>协议模板</label><select id="ec_agr"><option value="">不强制协议</option>
      ${S.templates.map(t => `<option value="${t.id}" ${c.agreement === t.id ? 'selected' : ''}>${esc(t.name)} ${esc(t.version)}</option>`).join('')}</select></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="ec_ok">保存</button></div>`, { center: true });
  document.getElementById('ec_ok').onclick = () => {
    c.guide = document.getElementById('ec_guide').value;
    c.guideMax = Number(document.getElementById('ec_max').value) || c.guideMax;
    c.risk = document.getElementById('ec_access').value;
    c.agreement = document.getElementById('ec_agr').value || null;
    if (c.risk === 'B' && !c.agreement) { toast('B类必须强制协议'); return; }
    audit('管理员', '品类配置变更', c.name, '指导价' + c.guide + ' / 风险级' + c.risk);
    saveDB(); closeModal(); render(); toast('已保存并审计');
  };
}

/* ================= 协议模板 ================= */
function vTemplates() {
  return `
  <div class="banner info">书面协议是责任边界核心。模板修改保存为新版本，历史订单保留签署时的版本。</div>
  <div class="card-table"><h3>协议模板（${S.templates.length}）</h3>
    <table class="table"><tr><th>模板</th><th>当前版本</th><th>更新时间</th><th>条款数</th><th>关联品类</th><th>操作</th></tr>
    ${S.templates.map(t => `<tr><td>${esc(t.name)}</td><td><span class="pill pill-blue">${esc(t.version)}</span></td>
      <td>${esc(t.updatedAt)}</td><td>${t.clauses.length}</td>
      <td>${S.categories.filter(c => c.agreement === t.id).map(c => esc(c.name)).join('、') || '—'}</td>
      <td><button class="btn small ghost" onclick="editTemplate('${t.id}')">查看/修订</button></td></tr>`).join('')}</table></div>`;
}
function editTemplate(id) {
  const t = templateById(id);
  modal(`<h3>📝 ${esc(t.name)}（${esc(t.version)}）</h3>
    <div class="hint">每行一个条款；保存将生成新版本，不影响已签署订单。</div>
    <textarea id="tp_clauses" style="width:100%;min-height:220px;border:1px solid var(--border);border-radius:9px;padding:10px;font-size:13px;line-height:1.7">${esc(t.clauses.join('\n'))}</textarea>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="tp_ok">保存为新版本</button></div>`, { center: true });
  document.getElementById('tp_ok').onclick = () => {
    const lines = document.getElementById('tp_clauses').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (lines.length < 3) return toast('条款至少3条');
    const num = parseFloat(t.version.replace('v', '')) + 0.1;
    t.version = 'v' + num.toFixed(1);
    t.clauses = lines;
    t.updatedAt = dbNow().slice(0, 10);
    audit('管理员', '协议模板更新', t.name, '更新至 ' + t.version);
    saveDB(); closeModal(); render(); toast('已保存为 ' + t.version);
  };
}

/* ================= 信用规则 ================= */
function vCredit() {
  return `
  <div class="banner info">动态信用比静态认证更有约束力：需求方与服务者共同受约束，只罚服务者会导致供给流失。</div>
  <div class="card-table"><h3>加减分规则</h3>
    <table class="table"><tr><th>事件</th><th>适用</th><th>分值</th><th>启用</th></tr>
    ${S.creditRules.map(r => `<tr><td>${esc(r.event)}</td><td>${esc(r.target)}</td>
      <td><input type="number" value="${r.delta}" style="width:70px;border:1px solid var(--border);border-radius:7px;padding:5px 8px"
        onchange="editRule('${r.id}',this.value)"></td>
      <td><label class="switch"><input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="toggleRule('${r.id}',this.checked)"><span class="sl"></span></label></td></tr>`).join('')}</table></div>
  <div class="card-table"><h3>信用等级</h3>
    <table class="table"><tr><th>等级</th><th>分数</th><th>权益/限制</th></tr>
    <tr><td><span class="pill pill-green">优秀</span></td><td>≥98</td><td>社区信赖候选 · 工具信用免押</td></tr>
    <tr><td><span class="pill pill-blue">良好</span></td><td>90~97</td><td>正常接单发单</td></tr>
    <tr><td><span class="pill pill-amber">普通</span></td><td>80~89</td><td>限制接高风险品类</td></tr>
    <tr><td><span class="pill pill-red">受限</span></td><td>&lt;80</td><td>暂停接单，申诉后恢复</td></tr></table></div>`;
}
function editRule(id, v) {
  const r = S.creditRules.find(x => x.id === id);
  r.delta = Number(v) || 0;
  audit('管理员', '信用规则调整', r.event, '分值→' + r.delta);
  saveDB(); toast('已保存并审计');
}
function toggleRule(id, on) {
  const r = S.creditRules.find(x => x.id === id);
  r.enabled = on;
  audit('管理员', on ? '启用信用规则' : '停用信用规则', r.event, '');
  saveDB();
}

/* ================= 楼栋开通 ================= */
function vBuildings() {
  const zones = ['全部', 'A区', 'B区', 'C区', 'D区'];
  let list = S.buildings;
  if (A.zone !== '全部') list = list.filter(b => b.zone === A.zone);
  const enabledCount = S.buildings.filter(b => b.enabled).length;
  return `
  <div class="banner info">供给先行，避免"发了没人接"：未开通楼栋只能浏览不能发单。开关对居民端即时生效。</div>
  <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="kpi"><div class="muted">已开通楼栋</div><div class="kv good">${enabledCount}</div><div class="kd">/ 共100栋</div></div>
    <div class="kpi"><div class="muted">覆盖住户</div><div class="kv">${S.buildings.filter(b => b.enabled).reduce((s, b) => s + b.households, 0)}</div><div class="kd">户</div></div>
    <div class="kpi"><div class="muted">在管协调人</div><div class="kv">${S.users.filter(u => u.isCoordinator).length}</div><div class="kd">物业管家兼任</div></div>
    <div class="kpi"><div class="muted">本片区在管</div><div class="kv">${list.filter(b => b.enabled).length}</div><div class="kd">${esc(A.zone)}</div></div>
  </div>
  <div class="card-table">
    <div class="row between" style="margin-bottom:10px"><h3>楼栋开关（${esc(A.zone)}）</h3>
      <div class="row" style="gap:6px">${zones.map(z => `<button class="btn small ${A.zone === z ? '' : 'gray'}" onclick="A.zone='${z}';render()">${z}</button>`).join('')}</div></div>
    <table class="table"><tr><th>楼栋</th><th>片区</th><th>户数</th><th>协调人</th><th>状态</th><th>操作</th></tr>
    ${list.map(b => `<tr><td><b>${esc(b.no)}</b></td><td>${esc(b.zone)}</td><td>${b.households}户</td>
      <td>${b.coordinatorId ? esc(userById(b.coordinatorId).name) : '<span class="muted">待任命</span>'}</td>
      <td>${b.enabled ? '<span class="pill pill-green">已开通</span>' : '<span class="pill pill-gray">未开通</span>'}</td>
      <td><label class="switch"><input type="checkbox" ${b.enabled ? 'checked' : ''} onchange="toggleBuilding('${b.id}',this.checked)"><span class="sl"></span></label></td></tr>`).join('')}
    </table></div>`;
}
function toggleBuilding(id, on) {
  const b = S.buildings.find(x => x.id === id);
  b.enabled = on;
  audit('管理员', on ? '开通楼栋' : '关闭楼栋', b.no, on ? '供给达标，开放发单' : '暂停发单，仅可浏览');
  saveDB(); toast(b.no + (on ? ' 已开通，居民可发单' : ' 已关闭，仅可浏览'));
}

/* ================= 供需热力图 ================= */
function vHeat() {
  const cats = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
  const blds = Object.keys(S.demandHeat);
  const suggest = [];
  const rows = blds.map(b => {
    const supply = S.providers.filter(p => p.building === b).length;
    const cells = cats.map(cid => {
      const v = S.demandHeat[b][cid];
      const lvl = v >= 8 ? 4 : v >= 6 ? 3 : v >= 4 ? 2 : v >= 2 ? 1 : 0;
      if (v >= 8 && supply === 0) suggest.push({ b, cid, v });
      return `<td class="h${lvl}">${v || ''}</td>`;
    }).join('');
    return `<tr><td><b>${esc(b)}</b></td><td class="${supply ? '' : 'gap'}">${supply ? supply + '位' : '缺口'}</td>${cells}</tr>`;
  }).join('');
  return `
  <div class="banner info">需求热度 1~9：分楼栋看品类需求与供给缺口 —— 指导"先开哪栋楼、招哪类服务者"。<span class="tag tag-red">缺口</span>＝需求≥8且无本楼服务者。</div>
  <div class="card-table"><h3>楼栋 × 品类需求热力</h3>
    <table class="heat"><tr><th>楼栋</th><th>供给</th>${cats.map(cid => `<th>${catById(cid).icon}<br>${esc(catById(cid).name)}</th>`).join('')}</tr>
    ${rows}</table></div>
  ${suggest.length ? `<div class="card-table"><h3>供给缺口预警（${suggest.length}）· 建议定向招募</h3>
    ${suggest.map(s => `<div class="list-item"><div class="li-ico">🎯</div><div class="li-main">
      <div class="li-title">${esc(s.b)} · ${esc(catById(s.cid).name)}</div>
      <div class="li-sub">需求热度 ${s.v}，本楼无服务者 —— 建议：协调人招募 + 开通楼栋 + 指导价上浮10%</div></div>
      <button class="btn small" onclick="toast('已生成招募任务（演示）')">生成招募任务</button></div>`).join('')}</div>` : ''}`;
}

/* ================= 机构管理 ================= */
function vOrgs() {
  return `
  <div class="banner info">高风险服务只做入口和筛选：托育、养老、持证家政、宠物机构 —— 个人不得以互助名义承接。</div>
  <div class="card-table"><h3>C类机构（${S.institutions.length}）</h3>
    <table class="table"><tr><th>机构</th><th>类型</th><th>资质</th><th>评分</th><th>价格</th><th>状态</th><th>操作</th></tr>
    ${S.institutions.map(o => `<tr><td><b>${esc(o.name)}</b><div class="muted small">${esc(o.intro)}</div></td>
      <td><span class="tag tag-c">${esc(o.type)}</span></td><td class="small">${esc(o.quals)}</td>
      <td><span class="stars">${starsHtml(Math.round(o.rating))}</span> ${o.rating}</td><td>${esc(o.price)}</td>
      <td>${o.status === 'online' ? '<span class="pill pill-green">上架</span>' : '<span class="pill pill-gray">下架</span>'}</td>
      <td><button class="btn small ${o.status === 'online' ? 'danger-outline' : ''}" onclick="toggleOrg('${o.id}')">${o.status === 'online' ? '下架' : '上架'}</button></td></tr>`).join('')}</table>
    <button class="btn small ghost mt8" onclick="addOrg()">+ 新增机构</button></div>`;
}
function toggleOrg(id) {
  const o = S.institutions.find(x => x.id === id);
  o.status = o.status === 'online' ? 'offline' : 'online';
  audit('管理员', o.status === 'online' ? '机构上架' : '机构下架', o.name, '');
  saveDB(); render();
}
function addOrg() {
  modal(`<h3>新增C类机构</h3>
    <div class="form-item"><label>机构名称</label><input id="ao_name"></div>
    <div class="form-item"><label>类型</label><select id="ao_type">${S.cOrgTypes.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
    <div class="form-item"><label>资质说明</label><input id="ao_quals" placeholder="备案/许可/持证情况"></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="ao_ok">提交（需合同与证照审核）</button></div>`, { center: true });
  document.getElementById('ao_ok').onclick = () => {
    const name = document.getElementById('ao_name').value.trim();
    if (!name) return toast('请填写机构名称');
    closeModal();
    S.institutions.push({ id: uid('org'), name, type: document.getElementById('ao_type').value, quals: document.getElementById('ao_quals').value || '待补充', rating: 5, price: '待定', status: 'offline', intro: '' });
    audit('管理员', '新增机构', name, '待合同与证照审核');
    saveDB(); render(); toast('已录入，待证照审核后上架');
  };
}

/* ================= 保险与抽成 ================= */
function vInsurance() {
  const ins = S.insurance, cm = S.commission;
  return `
  <div class="grid2">
    <div class="card-table"><h3>🛡️ 平台保险</h3>
      <div class="form-item"><label>险种</label><input id="in_plan" value="${esc(ins.plan)}"></div>
      <div class="form-item"><label>保障范围</label><input id="in_cov" value="${esc(ins.coverage)}"></div>
      <div class="form-item"><label>免赔条款</label><input id="in_ded" value="${esc(ins.deductible)}"></div>
      <label class="checkline"><input type="checkbox" id="in_api" ${ins.perOrderApi ? 'checked' : ''}> 已接入按单投保API（P1）</label>
      <div class="hint">低偿模式必须控制成本：当前以年度公众责任险兜底，下单页同步展示保障说明。</div>
    </div>
    <div class="card-table"><h3>💰 抽成与退款</h3>
      <div class="form-item"><label>平台抽成（%）</label><input id="cm_rate" type="number" value="${cm.rate}"><div class="hint">低抽成是邻里互助的定价底线，建议 ≤8%。调整将影响新订单分账比例。</div></div>
      <div class="form-item"><label>退款规则</label><textarea id="cm_refund">${esc(cm.refundPolicy)}</textarea></div>
      <div class="hint">资金路径：微信支付服务商分账 —— 平台不沉淀资金，规避"二清"监管红线。</div>
    </div>
  </div>
  <button class="btn" onclick="saveInsurance()">保存配置</button>`;
}
function saveInsurance() {
  S.insurance.plan = document.getElementById('in_plan').value;
  S.insurance.coverage = document.getElementById('in_cov').value;
  S.insurance.deductible = document.getElementById('in_ded').value;
  S.insurance.perOrderApi = document.getElementById('in_api').checked;
  S.commission.rate = Number(document.getElementById('cm_rate').value) || S.commission.rate;
  S.commission.refundPolicy = document.getElementById('cm_refund').value;
  audit('管理员', '保险与抽成配置变更', '全局', '抽成' + S.commission.rate + '%');
  saveDB(); toast('已保存，对全端生效');
}

/* ================= 内容风控 ================= */
function vContent() {
  return `
  <div class="banner warn">防止跑腿代取被利用：违禁词过滤（站外导流/私下交易/违禁品）+ 异常报酬预警 + 包裹来源声明，命中自动屏蔽留档。</div>
  <div class="grid2">
    <div class="card-table"><h3>违禁词库（${S.forbiddenWords.length}）</h3>
      <div class="floor-list" style="margin-bottom:10px">${S.forbiddenWords.map((w, i) =>
        `<span class="floor-chip" style="border-color:var(--danger);color:var(--danger)">${esc(w)} <b style="cursor:pointer" onclick="delWord(${i})">×</b></span>`).join('')}</div>
      <div class="row"><input id="nw_input" placeholder="添加违禁词" style="border:1px solid var(--border);border-radius:8px;padding:7px 12px;flex:1">
      <button class="btn small" onclick="addWord()">添加</button></div>
      <div class="hint mt8">另内置规则：手机号自动屏蔽、站外联系方式引导回站内、红线词（处方药/证件）触发拦截。</div>
    </div>
    <div class="card-table"><h3>拦截记录（${S.intercepts.length}）</h3>
      <table class="table"><tr><th>时间</th><th>用户</th><th>命中内容</th><th>规则</th><th>处置</th></tr>
      ${S.intercepts.map(ic => `<tr><td>${esc(shortTime(ic.at))}</td><td>${esc(userById(ic.userId).name)}</td>
        <td class="small">"${esc(ic.content)}"</td><td>${esc(ic.rule)}</td><td>${esc(ic.action)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">暂无</td></tr>'}</table>
    </div>
  </div>`;
}
function addWord() {
  const v = document.getElementById('nw_input').value.trim();
  if (!v) return;
  S.forbiddenWords.push(v);
  audit('管理员', '新增违禁词', v, '');
  saveDB(); render();
}
function delWord(i) {
  const w = S.forbiddenWords[i];
  S.forbiddenWords.splice(i, 1);
  audit('管理员', '删除违禁词', w, '');
  saveDB(); render();
}

/* ================= 审计日志 ================= */
function vAudit() {
  return `
  <div class="banner info">所有敏感操作（配置变更/风险处置/纠纷判定/楼栋开关）强制留痕，内部风险可追溯。</div>
  <div class="card-table"><h3>操作日志（${S.audits.length}）</h3>
    <table class="table"><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>说明</th></tr>
    ${S.audits.map(a => `<tr><td>${esc(shortTime(a.at))}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(a.target)}</td><td>${esc(a.detail)}</td></tr>`).join('')}</table></div>`;
}

/* ================= 系统设置 ================= */
function vSettings() {
  return `
  <div class="grid2">
    <div class="card-table"><h3>演示数据</h3>
      <p class="small muted">数据存储于浏览器 localStorage，四端共享：居民端发单 → 服务者端接单 → 协调人初调 → 后台判定，全程联动。</p>
      <div class="btn-row">
        <button class="btn" onclick="exportData()">导出数据 JSON</button>
        <button class="btn danger" onclick="confirmReset()">重置演示数据</button>
      </div>
    </div>
    <div class="card-table"><h3>关于本原型</h3>
      <p class="small muted">版本 v1（2026-11-06）· 覆盖功能基线 P0 全部14项 + P1 预览（常用订单/工具共享/拼单占位）+ P2 数据看板示意。<br>
      红线策略：长期看娃 / 失能照护 / 医疗行为 / 涉证代办 —— 拦截并引导C类机构。</p>
    </div>
  </div>`;
}
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fjc-demo-data.json';
  a.click();
  toast('已导出');
}
function confirmReset() {
  confirmBox('重置演示数据', '将清除全部操作痕迹，恢复到初始演示状态，四端同步生效。', () => { resetDB(); render(); toast('已重置'); });
}
