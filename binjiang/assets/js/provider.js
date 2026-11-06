/* ============================================================
   provider.js —— 服务者端
   分层认证 / 接单大厅 / 服务留痕 / 收入结算 / 评价申诉
   ============================================================ */

const P = { tab: 'cert', detailId: null, hallZone: 'all', hallRisk: 'all' };

function meP() { return S.providers.find(p => p.id === S.meProvider); }
function myOrdersP() { return S.orders.filter(o => o.providerId === S.meProvider); }

function go(tab) { P.tab = tab; P.detailId = null; render(); }
function render() {
  document.getElementById('tabbar').style.display = P.tab === 'detail' ? 'none' : 'flex';
  const v = document.getElementById('view');
  if (P.tab === 'cert') v.innerHTML = vCert();
  else if (P.tab === 'hall') v.innerHTML = vHall();
  else if (P.tab === 'doing') v.innerHTML = vDoing();
  else if (P.tab === 'detail') v.innerHTML = vDetail(P.detailId);
  else if (P.tab === 'income') v.innerHTML = vIncome();
  else if (P.tab === 'review') v.innerHTML = vReview();
  v.scrollTop = 0;
}
window.addEventListener('DOMContentLoaded', render);

function topbar(title, sub, extra) {
  return `<div class="topbar"><div class="tb-row"><div><div class="tb-title">${title}</div><div class="tb-sub">${sub}</div></div>${extra || ''}</div></div>`;
}
function idSwitcher() {
  return `<select class="id-switch" style="background:rgba(255,255,255,.15);color:#fff;border:none" onchange="switchP(this.value)">
    ${S.providers.map(p => `<option value="${p.id}" ${p.id === S.meProvider ? 'selected' : ''} style="color:#111">${esc(p.name)}·${esc(p.building)}</option>`).join('')}
  </select>`;
}
function switchP(id) {
  S.meProvider = id; saveDB(); render();
  toast('当前服务者：' + meP().name);
}

/* ================= 认证中心 ================= */
function vCert() {
  const p = meP();
  const expiring = p.quals.filter(q => q.status === 'expiring');
  const expired = p.quals.filter(q => q.status === 'expired');
  const canB = p.levels.platform;

  const qualsHtml = p.quals.map(q => `
    <div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)">
      <span>📄 ${esc(q.type)}</span>
      <span class="small ${q.status === 'valid' ? 'muted' : q.status === 'expiring' ? '' : ''}"
        style="${q.status === 'expiring' ? 'color:var(--warn);font-weight:700' : ''}">有效期至 ${esc(q.expireAt)}
        ${q.status === 'expiring' ? ' ⚠ 即将到期' : ''}${q.status === 'expired' ? ' <span class="tag tag-red">已过期·停接</span>' : ''}</span>
    </div>`).join('') || '<div class="muted small">暂无资质，升级"平台认可"后可接B类服务</div>';

  const catRows = S.categories.filter(c => c.enabled).map(c => {
    const locked = c.risk !== 'A' && !canB;
    const on = p.cats.includes(c.id);
    return `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)">
      <span>${c.icon} ${esc(c.name)} ${riskTag(c.risk)}</span>
      ${locked
        ? '<span class="tag tag-red">需平台认可认证</span>'
        : `<label class="switch"><input type="checkbox" ${on ? 'checked' : ''} onchange="toggleCat('${c.id}',this.checked)"><span class="sl"></span></label>`}
    </div>`;
  }).join('');

  return topbar('🪪 认证中心 · ' + esc(p.name), esc(p.building) + ' · 信用 ' + p.credit + ' · 完成 ' + p.completed + ' 单', idSwitcher()) + `
  <div class="wrap">
    ${expired.length ? `<div class="banner danger">⛔ 资质已过期：${esc(expired.map(q => q.type).join('、'))} —— 已按规则自动停接，请更新资质后恢复。</div>` : ''}
    ${expiring.length ? `<div class="banner warn">⚠ 资质即将到期：${esc(expiring.map(q => q.type + '(' + q.expireAt + ')').join('、'))} —— 到期未更新将自动停接。</div>` : ''}

    <div class="card">
      <div class="card-title">三层信任标识</div>
      <div class="row wrap" style="gap:8px">${trustBadges(p)}</div>
      <div class="hint mt8">真实邻居＝住户核验通过；平台认可＝实名+活体自拍+无犯罪承诺+品类资质；社区信赖＝高信用等级授予。</div>
    </div>

    <div class="card">
      <div class="card-title">认证进度</div>
      ${certRow('🏠 真实邻居认证', p.levels.neighbor, '住户核验通过（对接物业数据）')}
      ${certRow('✔ 平台认可认证', p.levels.platform, '实名+活体自拍+无犯罪承诺+品类资质')}
      ${certRow('⭐ 社区信赖等级', p.levels.community, '信用分≥98由平台授予（动态）')}
      ${!p.levels.platform ? `<button class="btn block mt12" onclick="applyPlatform()">申请"平台认可"认证</button>` : ''}
    </div>

    <div class="card">
      <div class="card-title">我的资质 <span class="more">到期自动停接</span></div>
      ${qualsHtml}
      <button class="btn small ghost mt8" onclick="addQual()">+ 上传/更新资质</button>
    </div>

    <div class="card">
      <div class="card-title">可接品类开关 <span class="more">按认证等级开放</span></div>
      ${catRows}
      <div class="hint mt8">C类（托育/养老/医疗相关）仅对持证机构开放，个人不可承接。协议与保险确认在接单时进行。</div>
    </div>

    <div class="card">
      <div class="card-title">🛡️ 平台责任险</div>
      <div class="small">${esc(S.insurance.plan)}<br>保障：${esc(S.insurance.coverage)}<br>${esc(S.insurance.deductible)}</div>
      <div class="hint">接B类单前须确认已知晓保障范围与免责条款；保单说明在下单页向需求方同步展示。</div>
    </div>
  </div>`;
}
function certRow(lb, ok, desc) {
  return `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)">
    <span>${lb}<div class="muted small">${esc(desc)}</div></span>
    ${ok ? '<span class="badge badge-platform">已通过</span>' : '<span class="tag tag-gray">未认证</span>'}
  </div>`;
}
function toggleCat(catId, on) {
  const p = meP();
  if (on) { if (!p.cats.includes(catId)) p.cats.push(catId); }
  else p.cats = p.cats.filter(c => c !== catId);
  saveDB(); toast(on ? '已开启' : '已关闭');
}
function applyPlatform() {
  const p = meP();
  modal(`<h3>✔ 申请"平台认可"认证</h3>
    <div class="banner info">认证要素：实名（身份证OCR）＋活体自拍照比对＋无犯罪记录承诺＋可接品类资质。资料进入平台审核队列，通过后开放B类接单。</div>
    <div class="form-item"><label>姓名</label><input id="ap_name" value="${esc(p.name)}"></div>
    <div class="form-item"><label>身份证号（OCR模拟）</label><input id="ap_idcard" placeholder="3301**********1234"></div>
    <div class="form-item"><label>活体自拍比对</label><button class="btn small ghost" onclick="toast('已采集活体自拍照（模拟）');this.textContent='✔ 已采集'">📷 采集自拍照</button></div>
    <div class="form-item"><label>品类资质上传</label>
      <select id="ap_qualType"><option>健康证</option><option>居家上门服务证</option><option>驾驶证</option><option>养宠经验证明</option></select>
      <button class="btn small ghost mt8" onclick="pickPhoto(()=>{toast('资质照片已上传（模拟）')})">📎 上传资质照片</button></div>
    <label class="checkline"><input type="checkbox" id="ap_promise"> 本人承诺无犯罪记录，如有虚假愿承担全部责任并接受平台永久封禁</label>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="ap_ok">提交审核</button></div>`, { center: true });
  document.getElementById('ap_ok').onclick = () => {
    if (!document.getElementById('ap_idcard').value.trim()) return toast('请填写身份证号');
    if (!document.getElementById('ap_promise').checked) return toast('请勾选无犯罪承诺');
    closeModal();
    S.providerApplies.unshift({
      id: uid('pa'), userId: p.userId, name: p.name, building: p.building,
      applyFor: '平台认可认证', cats: p.cats, submittedAt: dbNow(), status: 'pending', materials: '身份证+活体自拍+承诺书（模拟）'
    });
    audit(p.name, '提交认证申请', p.name, '平台认可认证');
    saveDB(); render(); toast('已提交，等待平台审核');
  };
}
function addQual() {
  const p = meP();
  modal(`<h3>📄 上传/更新资质</h3>
    <div class="form-item"><label>资质类型</label><select id="q_type"><option>健康证</option><option>居家上门服务证</option><option>驾驶证</option><option>养宠经验证明</option><option>无犯罪记录承诺书</option></select></div>
    <div class="form-item"><label>有效期至</label><input id="q_expire" type="date"></div>
    <button class="btn small ghost" onclick="pickPhoto(()=>{toast('已上传（模拟）')})">📎 上传照片</button>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="q_ok">提交</button></div>`, { center: true });
  document.getElementById('q_ok').onclick = () => {
    const type = document.getElementById('q_type').value;
    const exp = document.getElementById('q_expire').value;
    if (!exp) return toast('请选择有效期');
    closeModal();
    p.quals = p.quals.filter(q => q.type !== type);
    const days = (new Date(exp) - new Date('2026-11-06')) / 864e5;
    p.quals.push({ type, expireAt: exp, status: days < 0 ? 'expired' : days < 30 ? 'expiring' : 'valid' });
    if (p.quals.some(q => q.status === 'expired')) p.open = false; else p.open = true;
    audit(p.name, '更新资质', p.name, type + ' 至 ' + exp);
    saveDB(); render(); toast('资质已更新');
  };
}

/* ================= 接单大厅 ================= */
function vHall() {
  const p = meP();
  if (!p.open || p.quals.some(q => q.status === 'expired')) {
    return topbar('🧲 接单大厅', esc(p.name) + ' · ' + esc(p.building), idSwitcher()) + `
    <div class="wrap"><div class="banner danger">⛔ 您的接单功能已停用（资质过期或违规）。请前往「认证」更新资质。</div></div>`;
  }
  let list = S.orders.filter(o => o.status === 'pending_accept' && p.cats.includes(o.catId));
  if (P.hallZone === 'mine') list = list.filter(o => o.building === p.building);
  if (P.hallZone === 'zone') {
    const z = (buildingByNo(p.building) || {}).zone;
    list = list.filter(o => o.zone === z);
  }
  if (P.hallRisk !== 'all') list = list.filter(o => catById(o.catId).risk === P.hallRisk);
  list.sort((a, b) => (a.building === p.building ? -1 : 1) - (b.building === p.building ? -1 : 1));

  const rows = list.map(o => {
    const c = catById(o.catId);
    const sameBuilding = o.building === p.building;
    return `<div class="list-item">
      <div class="li-ico">${c.icon}</div>
      <div class="li-main">
        <div class="li-title">${esc(o.title)} <span class="price">${money(o.price)}</span></div>
        <div class="li-sub">${riskTag(c.risk)} <span class="tag ${sameBuilding ? 'tag-a' : 'tag-gray'}">${sameBuilding ? '同楼栋' : o.zone}</span> ${esc(o.scheduledAt)}</div>
        <div class="li-sub">📍 ${esc(o.building)} · 需求方 ${esc(userById(o.publisherId).name)} · 信用${userById(o.publisherId).credit}</div>
        ${o.special && o.special.type === 'pet' ? `<div class="li-sub">🐱 ${esc(o.special.petName)} · 医疗上限${money(o.special.feeCap)}</div>` : ''}
      </div>
      <button class="btn small" onclick="acceptOrder('${o.id}')">接单</button>
    </div>`;
  }).join('');

  const zoneBtn = (k, lb) => `<button class="btn small ${P.hallZone === k ? '' : 'gray'}" onclick="P.hallZone='${k}';render()">${lb}</button>`;
  const riskBtn = (k, lb) => `<button class="btn small ${P.hallRisk === k ? '' : 'gray'}" onclick="P.hallRisk='${k}';render()">${lb}</button>`;

  return topbar('🧲 接单大厅', '物理距离就是信任补充：同楼栋优先展示', idSwitcher()) + `
  <div class="wrap">
    <div class="row wrap" style="gap:6px;margin-bottom:6px">${zoneBtn('mine', '本楼栋')}${zoneBtn('zone', '本片区')}${zoneBtn('all', '全部')}</div>
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${riskBtn('all', '全部风险')}${riskBtn('A', 'A类')}${riskBtn('B', 'B类')}</div>
    <div class="card">${rows || '<div class="empty"><span class="ico">📭</span>暂无可接订单<br><span class="small">可到「认证」开启更多品类</span></div>'}</div>
  </div>`;
}

function acceptOrder(orderId) {
  const o = orderById(orderId); const p = meP(); const c = catById(o.catId);
  if (o.reviewStatus === 'pending') { toast('该订单风险复核中，暂不可接'); return; }
  if (c.risk === 'B') {
    const tpl = templateById(c.agreement);
    modal(`<h3>🤝 接单确认（B类）</h3>
      <div class="banner warn">接单前须完成两件事：① 签署服务者版协议（进入证据链）② 确认平台责任险覆盖范围。平台为居间方，不是服务提供方。</div>
      ${agreementDocHtml(tpl)}
      <div class="banner info mt8" style="margin-top:8px">🛡️ ${esc(S.insurance.plan)}：${esc(S.insurance.coverage)}；${esc(S.insurance.deductible)}</div>
      <label class="checkline mt8"><input type="checkbox" id="ac_agree"> 我已逐条阅读并签署《${esc(tpl.name)}》${esc(tpl.version)}</label>
      <label class="checkline"><input type="checkbox" id="ac_ins"> 我已知晓平台责任险覆盖范围与免责条款</label>
      <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="ac_ok">签署并接单</button></div>`, { locked: true });
    document.getElementById('ac_ok').onclick = () => {
      if (!document.getElementById('ac_agree').checked || !document.getElementById('ac_ins').checked) return toast('请完成两项确认');
      closeModal(); doAccept(o, p, c);
    };
  } else {
    confirmBox('接单确认', '确定接下这单吗？接单后需求方将看到您的门牌与信任标识。', () => doAccept(o, p, c), '确认接单');
  }
}
function doAccept(o, p, c) {
  o.providerId = p.id;
  o.status = 'accepted';
  if (o.agreement) o.agreement.providerSigned = { name: p.name, at: dbNow() };
  o.timeline.push({ t: dbNow(), s: p.name + ' 接单' + (o.agreement ? ' · 服务者协议已签' : ''), by: p.name });
  notify(o.publisherId, 'order', '您的需求已被接单', p.name + '（' + trustBadges(p).replace(/<[^>]+>/g, ' ') + '）已接单' + (o.payStatus === 'unpaid' ? '，请完成支付' : ''), o.id);
  saveDB();
  P.tab = 'detail'; P.detailId = o.id; render();
  toast('接单成功');
}

/* ================= 服务中 ================= */
function vDoing() {
  const p = meP();
  const doing = myOrdersP().filter(o => ['accepted', 'in_service', 'pending_confirm', 'disputed', 'completed'].includes(o.status));
  const rows = doing.map(o => {
    const c = catById(o.catId);
    return `<div class="list-item" style="cursor:pointer" onclick="P.detailId='${o.id}';P.tab='detail';render()">
      <div class="li-ico">${c.icon}</div>
      <div class="li-main">
        <div class="li-title">${esc(o.title)} ${statusPill(o.status)}</div>
        <div class="li-sub">${payPill(o.payStatus)} · ${money(o.escrow ? o.escrow.providerAmount : o.price)}可得 · ${esc(userById(o.publisherId).name)}</div>
        <div class="li-sub">📍 ${esc(o.building)} · ${esc(shortTime(o.scheduledAt))}</div>
      </div><span class="muted">›</span>
    </div>`;
  }).join('');
  return topbar('🔧 服务中', '出发打卡 → 到达拍照 → 完成拍照，全程留痕', idSwitcher()) + `
  <div class="wrap"><div class="card">${rows || '<div class="empty"><span class="ico">🧰</span>暂无进行中的服务</div>'}</div></div>`;
}

function vDetail(id) {
  const o = orderById(id); if (!o) return '<div class="wrap"><div class="empty">订单不存在</div></div>';
  const p = meP(); const c = catById(o.catId);
  const pub = userById(o.publisherId);
  const evi = o.evidence || { before: [], during: [], after: [] };

  const eviGroups = [['before', '📷 服务前/到达'], ['during', '📷 服务中'], ['after', '📷 服务后/完成']].map(([k, lb]) =>
    `<div class="evi-group"><div class="gt">${lb}</div>
      <div class="photos">${(evi[k] || []).map(photoChip).join('')}
      <button class="photo-slot" onclick="addEvidence('${o.id}','${k}','${lb.replace('📷 ', '')}')">＋<span>${lb.replace('📷 ', '')}拍照</span></button>
      </div></div>`).join('');

  const chat = (o.messages || []).map(m => {
    const mine = m.from === p.userId;
    return `<div class="bubble ${mine ? 'me' : 'other'}">${esc(m.text)}${m.flagged ? '<br><span class="filtered">⚠ 敏感内容已过滤留档</span>' : ''}<div class="bt">${esc(shortTime(m.at))}</div></div>`;
  }).join('');

  let childCard = '';
  if (o.special && o.special.type === 'child') {
    childCard = `<div class="card"><div class="card-title">🎒 接娃交接（双确认）</div>
      <div class="small">儿童：${esc(o.special.childName)} · 路线：${esc(o.detail.route)}</div>
      <div class="banner ok mt8" style="margin-top:8px">🛰️ 位置共享已开启（${esc(o.special.school)} → ${esc(o.building)}南门）</div>
      ${o.codeConfirmed ? '<div class="banner ok mt8">✅ 家长确认码已核验，交接完成</div>' : `
      <div class="form-item mt8"><label>家长确认码</label><input id="cc_code" maxlength="4" placeholder="向家长索取4位确认码"></div>
      <button class="btn small" onclick="verifyCode('${o.id}')">核验确认码</button>`}
      <div class="hint">无确认码不得交接儿童；交接时拍照留档。</div></div>`;
  }

  let actions = '';
  if (o.status === 'accepted' && o.payStatus !== 'unpaid') actions += `<button class="btn block" onclick="startService('${o.id}')">🚶 出发打卡（开始服务）</button>`;
  if (o.status === 'accepted' && o.payStatus === 'unpaid') actions += '<div class="banner warn">等待需求方支付（资金进入监管后开始服务）。</div>';
  if (o.status === 'in_service') {
    actions += `<button class="btn block" onclick="finishService('${o.id}')">📸 完成服务 · 上传完成照</button>`;
    actions += `<button class="btn block danger-outline" style="margin-top:8px" onclick="reportIssue('${o.id}')">⚠ 异常上报</button>`;
  }
  if (o.status === 'pending_confirm') actions += '<div class="banner ok">已完成服务，等待需求方验收放款；争议将在24小时内协调。</div>';
  if (o.status === 'completed') {
    const done = (o.reviews || []).some(r => r.fromId === p.userId && r.toRole === 'resident');
    if (!done) actions += `<button class="btn block ghost" onclick="reviewResident('${o.id}')">⭐ 评价需求方</button>`;
  }

  return `
  <div class="topbar plain"><div class="tb-row">
    <button class="tb-btn" onclick="go('doing')">← 服务中</button>
    <div class="tb-title" style="font-size:15px">${c.icon} ${statusPill(o.status)}</div><span style="width:52px"></span></div></div>
  <div class="wrap">
    <div class="card">
      <div class="card-title">${esc(o.title)} <span class="price">${money(o.escrow ? o.escrow.providerAmount : o.price)}可得</span></div>
      ${flowSteps(o)}
      <div class="small mt8">需求方：${esc(pub.name)} · 信用${pub.credit} · ${esc(o.building)} ${revealedRoom(o)}<br>
      🕐 ${esc(o.scheduledAt || '待定')} ${riskTag(c.risk)} ${payPill(o.payStatus)}</div>
      ${o.confirmCode ? '<div class="hint mt8">🔢 本单需确认码交接（向需求方索取）</div>' : ''}
    </div>

    ${o.special && o.special.type === 'pet' ? `<div class="card"><div class="card-title">🐱 宠物健康申报</div>
      <div class="small">${esc(o.special.petName)}<br>疫苗：${esc(o.special.vaccine)}<br>用药：${esc(o.special.meds)}<br>注意：${esc(o.special.feedNote || '无')}</div>
      <div class="hint mt8">${o.special.emergencyAuth ? '✅ 已授权紧急送医，费用上限 ' + money(o.special.feeCap) : '⛔ 未授权送医，突发情况须先联系需求方'}</div></div>` : ''}
    ${o.special && o.special.type === 'package' ? `<div class="card"><div class="card-title">📦 包裹来源声明</div><div class="small">来源：${esc(o.special.source)} · ${esc(o.special.sourceNote || '')}</div><div class="hint">来源不明包裹请拒绝承接并上报。</div></div>` : ''}
    ${childCard}
    ${o.special && o.special.type === 'key' ? '<div class="banner warn">🔑 本单涉及钥匙/密码交接：使用确认码交接并拍照留档，完成后提醒需求方修改密码。</div>' : ''}

    ${o.agreement ? `<div class="card"><div class="card-title">📝 协议与保险
      <button class="btn small ghost" onclick="viewAgreementP('${o.id}')">查看协议</button></div>
      <div class="small">${esc(templateById(o.agreement.templateId).name)} ${esc(o.agreement.version)} · 服务方已签 ✅ · 责任险：${esc(S.insurance.plan)}</div></div>` : ''}

    <div class="card"><div class="card-title">📸 服务留痕<span class="more">自动时间戳 · 双向证据链</span></div>${eviGroups}</div>

    <div class="card"><div class="card-title">💬 站内沟通</div>
      <div class="chat" id="chat_list">${chat || '<div class="muted small">暂无沟通记录</div>'}</div>
      <div class="chat-input"><input id="chat_input" placeholder="输入消息…" onkeydown="if(event.key==='Enter')sendChatP('${o.id}')">
      <button class="btn small" onclick="sendChatP('${o.id}')">发送</button></div></div>

    <div class="card"><div class="card-title">🗒️ 时间线</div>
      <div class="timeline">${(o.timeline || []).map(t => `<div class="tl-item">${esc(t.s)}<div class="tl-t">${esc(shortTime(t.t))} · ${esc(t.by || '')}</div></div>`).join('')}</div></div>

    <div style="padding-bottom:10px">${actions}</div>
  </div>`;
}
function revealedRoom(o) {
  return ['accepted', 'in_service', 'pending_confirm', 'completed'].includes(o.status) ? o.room : '**（接单后可见）';
}
function viewAgreementP(id) {
  const o = orderById(id);
  modal(`<h3>📝 协议详情</h3>${agreementDocHtml(templateById(o.agreement.templateId), o.agreement)}`, { center: true });
}
function addEvidence(orderId, slot, label) {
  const o = orderById(orderId);
  modal(`<h3>📸 ${esc(label)}留痕</h3>
    <div class="hint">照片自动附加时间戳与位置水印，作为争议处理证据。</div>
    <div class="btn-row"><button class="btn ghost" onclick="doEvidence('${orderId}','${slot}','${esc(label)}',true)">📷 模拟拍照</button>
    <button class="btn" onclick="doEvidence('${orderId}','${slot}','${esc(label)}',false)">🖼 上传照片</button></div>
    <button class="btn gray block mt8" onclick="closeModal()">取消</button>`, { center: true });
}
function doEvidence(orderId, slot, label, sim) {
  const o = orderById(orderId); const p = meP();
  const push = src => {
    (o.evidence[slot] = o.evidence[slot] || []).push({ src, label, at: dbNow(), by: p.name });
    o.timeline.push({ t: dbNow(), s: label + '留痕（' + slot + '）', by: p.name });
    if (slot === 'after' && o.status === 'in_service') {
      o.status = 'pending_confirm';
      o.timeline.push({ t: dbNow(), s: '完成服务 · 提交验收（等待需求方放款）', by: p.name });
      notify(o.publisherId, 'order', '服务已完成', '请核对服务后凭证并验收放款', o.id);
    }
    saveDB(); closeAllModals();
    P.tab = 'detail'; P.detailId = orderId; render();
    toast(slot === 'after' && o.status === 'pending_confirm' ? '已完成，等待验收' : '已留痕');
  };
  if (sim) push('');
  else pickPhoto(push);
}
function verifyCode(orderId) {
  const o = orderById(orderId);
  const v = document.getElementById('cc_code').value.trim();
  if (v !== o.confirmCode) return toast('确认码错误，不得交接');
  o.codeConfirmed = true;
  doEvidence(orderId, 'after', '交接拍照', true);
}
function startService(orderId) {
  const o = orderById(orderId); const p = meP();
  o.status = 'in_service';
  o.timeline.push({ t: dbNow(), s: '出发打卡（开始服务）', by: p.name });
  notify(o.publisherId, 'order', '服务者已出发', p.name + '已出发，预计' + esc(o.scheduledAt || '') + '到达', o.id);
  saveDB(); P.tab = 'detail'; P.detailId = orderId; render(); toast('已打卡，通知已发送');
}
function finishService(orderId) {
  const o = orderById(orderId);
  addEvidence(orderId, 'after', '完成服务');
}
function reportIssue(orderId) {
  const o = orderById(orderId); const p = meP();
  modal(`<h3>⚠ 异常上报</h3>
    <div class="form-item"><label>异常类型</label><select id="is_type"><option>需求方无法联系</option><option>现场情况与描述不符</option><option>宠物突发状况</option><option>儿童交接异常</option><option>其他</option></select></div>
    <div class="form-item"><label>说明</label><textarea id="is_note"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn danger" id="is_ok">上报平台</button></div>`, { center: true });
  document.getElementById('is_ok').onclick = () => {
    const note = document.getElementById('is_note').value.trim() || document.getElementById('is_type').value;
    closeModal();
    o.timeline.push({ t: dbNow(), s: '⚠ 异常上报：' + esc(note), by: p.name });
    notify(o.publisherId, 'risk', '服务异常提醒', p.name + '上报：' + note, o.id);
    S.riskAlerts.unshift({ id: uid('ra'), orderId: o.id, rule: '服务者异常上报：' + note, level: 'mid', status: 'pending', at: dbNow(), handledBy: null });
    saveDB(); P.tab = 'detail'; P.detailId = orderId; render(); toast('已上报平台与需求方');
  };
}
function reviewResident(orderId) {
  const o = orderById(orderId); const pub = userById(o.publisherId);
  modal(`<h3>⭐ 评价需求方</h3>
    <div class="hint mb8">双向评价：需求方同样受信用约束（放鸽子、恶意投诉都会扣分），保护服务者供给意愿。</div>
    <div class="row" style="gap:4px;font-size:26px" id="rv_stars">${[1, 2, 3, 4, 5].map(i => `<span style="cursor:pointer" onclick="P.rvStars=${i};renderStarsP()">${i <= (P.rvStars || 5) ? '⭐' : '☆'}</span>`).join('')}</div>
    <div class="form-item mt8"><label>标签</label><div class="row wrap" id="rv_tags">
      ${['描述准确', '守时', '沟通顺畅', '边界感好'].map(t => `<label class="checkline" style="margin:0"><input type="checkbox" value="${t}"> ${t}</label>`).join('')}
    </div></div>
    <div class="form-item"><label>内容</label><textarea id="rv_text"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">稍后</button><button class="btn" id="rv_ok">提交</button></div>`, { center: true });
  document.getElementById('rv_ok').onclick = () => {
    const stars = P.rvStars || 5;
    const tags = Array.from(document.querySelectorAll('#rv_tags input:checked')).map(i => i.value);
    const text = document.getElementById('rv_text').value.trim();
    closeModal();
    const rv = { id: uid('rv'), orderId, fromId: meP().userId, toId: pub.id, toRole: 'resident', stars, tags, text, appeal: null };
    o.reviews = o.reviews || []; o.reviews.push(rv); S.reviews.unshift(rv);
    if (stars <= 2) creditAdd(pub.id, -2, '被服务者差评', orderId);
    o.timeline.push({ t: dbNow(), s: '服务者评价需求方 ' + stars + ' 星', by: meP().name });
    saveDB(); P.tab = 'detail'; P.detailId = orderId; render(); toast('已提交');
  };
}
function renderStarsP() {
  const box = document.getElementById('rv_stars');
  if (box) box.innerHTML = [1, 2, 3, 4, 5].map(i => `<span style="cursor:pointer" onclick="P.rvStars=${i};renderStarsP()">${i <= (P.rvStars || 5) ? '⭐' : '☆'}</span>`).join('');
}
function sendChatP(orderId) {
  const o = orderById(orderId); const inp = document.getElementById('chat_input');
  const text = inp.value.trim(); if (!text) return;
  addMessage(o, meP().userId, text);
  saveDB(); P.tab = 'detail'; P.detailId = orderId; render();
}

/* ================= 收入 ================= */
function vIncome() {
  const p = meP(); const rate = S.commission.rate;
  const mine = myOrdersP();
  const settled = mine.filter(o => o.payStatus === 'released');
  const frozen = mine.filter(o => o.payStatus === 'frozen');
  const pending = mine.filter(o => o.payStatus === 'escrowed');
  const sum = a => Math.round(a.reduce((s, o) => s + (o.escrow ? o.escrow.providerAmount : 0), 0) * 100) / 100;
  const days = ['11-01', '11-02', '11-03', '11-04', '11-05', '11-06'].map((d, i) => ({ d, v: [28, 0, 45, 30, 0, 62][i] }));
  const maxv = Math.max(...days.map(x => x.v));
  return topbar('💰 收入与结算', '完成即结算 · 微信支付服务商分账直达', idSwitcher()) + `
  <div class="wrap">
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="kpi"><div class="muted">已结算</div><div class="kv good">${money(sum(settled))}</div></div>
      <div class="kpi"><div class="muted">监管中</div><div class="kv">${money(sum(pending))}</div></div>
      <div class="kpi"><div class="muted">冻结中</div><div class="kv ${frozen.length ? 'bad' : ''}">${money(sum(frozen))}</div></div>
    </div>
    <div class="card"><div class="card-title">近7日收入</div>
      <div class="bars">${days.map(x => `<div class="bcol"><span class="bval">${x.v || ''}</span><div class="bar" style="height:${Math.round(x.v / maxv * 100)}%"></div><span class="blb">${x.d}</span></div>`).join('')}</div></div>
    <div class="card"><div class="card-title">结算明细 <span class="more">平台抽成${rate}%</span></div>
      ${settled.map(o => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12.5px">
        <span>${esc(o.title)}<div class="muted">${esc(shortTime(o.escrow ? o.escrow.releasedAt : ''))}</div></span>
        <span><b style="color:var(--primary-dark)">+${money(o.escrow.providerAmount)}</b> <span class="muted">(订单${money(o.escrow.amount)}-${money(o.escrow.commission)})</span></span></div>`).join('') || '<div class="muted small">暂无结算记录</div>'}
      ${frozen.map(o => `<div class="banner danger mt8">⛔ 订单${esc(o.id)} ${money(o.escrow.amount)} 争议冻结中，判定后释放。</div>`).join('')}
    </div>
    <button class="btn block" onclick="withdraw(${sum(settled)})">提现到微信零钱</button>
    <div class="hint" style="text-align:center;margin-top:8px">即时到账 · 争议订单资金冻结不影响其余余额提现</div>
  </div>`;
}
function withdraw(amount) {
  if (amount <= 0) return toast('暂无可提现余额');
  confirmBox('提现', '将 ' + money(amount) + ' 提现至微信零钱（演示即时到账）？', () => toast('提现成功（演示）'));
}

/* ================= 评价申诉 ================= */
function vReview() {
  const p = meP();
  const mine = S.reviews.filter(r => r.toId === p.id && r.toRole === 'provider');
  const logs = S.creditLogs.filter(l => l.userId === p.userId);
  return topbar('⭐ 评价与申诉', '双向公平 · 恶意差评可申诉', idSwitcher()) + `
  <div class="wrap">
    <div class="card"><div class="card-title">收到的评价 <span class="more">综合 ${p.rating} 分 · ${p.completed}单</span></div>
      ${mine.map(r => {
        const f = userById(r.fromId);
        return `<div class="list-item"><div class="avatar small">${esc(f.name[0])}</div>
          <div class="li-main">
            <div class="li-sub"><b>${esc(f.name)}</b> <span class="stars">${starsHtml(r.stars)}</span> ${esc(r.tags.join('、'))}</div>
            <div class="li-sub">${esc(r.text)}</div>
            ${r.appeal ? `<div class="li-sub">申诉状态：<span class="tag ${r.appeal.status === 'pending' ? 'tag-gray' : r.appeal.status === 'upheld' ? 'tag-a' : 'tag-red'}">${r.appeal.status === 'pending' ? '待平台核实' : r.appeal.status === 'upheld' ? '申诉成立·差评撤销+信用恢复' : '申诉不成立'}</span></div>`
              : r.stars <= 3 ? `<button class="btn small danger-outline" onclick="appeal('${r.id}')">申诉恶意差评</button>` : ''}
          </div></div>`;
      }).join('') || '<div class="muted small">暂无评价</div>'}
    </div>
    <div class="card"><div class="card-title">信用分变动</div>
      ${logs.map(l => `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12.5px">
        <span>${esc(l.reason)}</span><b style="color:${l.delta >= 0 ? 'var(--primary-dark)' : 'var(--danger)'}">${l.delta >= 0 ? '+' : ''}${l.delta}</b></div>`).join('') || '<div class="muted small">暂无变动</div>'}
    </div>
  </div>`;
}
function appeal(rvId) {
  const rv = S.reviews.find(r => r.id === rvId);
  modal(`<h3>⚖ 申诉恶意差评</h3>
    <div class="banner info">申诉将进入平台审核队列；核实成立后差评撤销、对方扣信用分（-8）；不成立维持原评价。聊天与凭证记录自动附卷。</div>
    <div class="form-item"><label>申诉理由</label><textarea id="ap_reason" placeholder="说明情况并指出可佐证的记录"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="ap_ok2">提交申诉</button></div>`, { center: true });
  document.getElementById('ap_ok2').onclick = () => {
    const reason = document.getElementById('ap_reason').value.trim();
    if (!reason) return toast('请填写申诉理由');
    rv.appeal = { status: 'pending', reason, at: dbNow() };
    saveDB(); closeModal(); render(); toast('申诉已提交');
  };
}
