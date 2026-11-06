/* ============================================================
   resident.js —— 居民端（微信小程序形态）
   首页（场景化） / 发布（风险字段+协议+红线） / 订单（支付·验收·争议·评价）
   消息 / 我的（信用中心·隐私授权·常用订单·C类入口）
   ============================================================ */

const R = { tab: 'home', detailId: null, pubCatId: null, orderFilter: 'doing', homeZone: 'A' };

function me() { return userById(S.meResident); }
function myNotifs() { return S.notifications.filter(n => n.toUser === S.meResident); }

function go(tab) { R.tab = tab; R.detailId = null; render(); }
function tabCls(t) { return R.tab === t ? 'tab active' : 'tab'; }

function render() {
  document.getElementById('tabbar').style.display = (R.tab === 'detail' || R.tab === 'pub') ? 'none' : 'flex';
  const v = document.getElementById('view');
  if (R.tab === 'home') v.innerHTML = vHome();
  else if (R.tab === 'pub' || R.tab === 'publish') v.innerHTML = vPublish();
  else if (R.tab === 'orders') v.innerHTML = vOrders();
  else if (R.tab === 'detail') v.innerHTML = vDetail(R.detailId);
  else if (R.tab === 'msg') v.innerHTML = vMsg();
  else if (R.tab === 'me') v.innerHTML = vMe();
  v.scrollTop = 0;
}
window.addEventListener('DOMContentLoaded', render);

/* ================= 首页 ================= */
function vHome() {
  const u = me();
  const b = buildingByNo(u.building);
  const recs = S.recommendations.filter(r => r.building === u.building);
  const unread = myNotifs().filter(n => !n.read).length;
  const aCats = S.categories.filter(c => c.risk === 'A' && c.enabled);
  const bCats = S.categories.filter(c => c.risk === 'B' && c.enabled);

  const scenes = S.categories.filter(c => c.enabled).map(c =>
    `<button class="scene" onclick="startPublish('${c.id}')"><div class="ico">${c.icon}</div><div class="lb">${esc(c.scene)}</div></button>`
  ).join('');

  const aCards = aCats.map(c => {
    const n = openOrdersIn(u.building).filter(o => o.catId === c.id).length;
    return `<div class="list-item">
      <div class="li-ico">${c.icon}</div>
      <div class="li-main">
        <div class="li-title">${esc(c.name)} <span class="price small">${esc(c.guide)}</span></div>
        <div class="li-sub">本楼待接 ${n} 单 · 免签协议 · 秒发布</div>
      </div>
      <button class="btn small ghost" onclick="startPublish('${c.id}')">发布</button>
    </div>`;
  }).join('');

  const bCards = bCats.map(c => {
    const n = openOrdersIn(u.building).filter(o => o.catId === c.id).length;
    return `<div class="list-item">
      <div class="li-ico">${c.icon}</div>
      <div class="li-main">
        <div class="li-title">${esc(c.name)} ${riskTag('B')} <span class="price small">${esc(c.guide)}</span></div>
        <div class="li-sub">需签协议 · 凭证留痕${c.agreement ? ' · 平台责任险覆盖说明' : ''} · 本楼 ${n} 单</div>
      </div>
      <button class="btn small ghost" onclick="startPublish('${c.id}')">发布</button>
    </div>`;
  }).join('');

  const orgs = S.institutions.filter(o => o.status === 'online').map(o =>
    `<div class="list-item">
      <div class="li-ico">🏢</div>
      <div class="li-main">
        <div class="li-title">${esc(o.name)} <span class="tag tag-c">${esc(o.type)}</span></div>
        <div class="li-sub">${esc(o.quals)} · <span class="stars">${starsHtml(Math.round(o.rating))}</span> ${o.rating} · ${esc(o.price)}</div>
        <div class="li-sub">${esc(o.intro)}</div>
      </div>
      <button class="btn small outline" onclick="orgBook('${o.id}')">预约</button>
    </div>`
  ).join('');

  const recCards = recs.length ? recs.map(r => {
    const p = providerById(r.providerId);
    return `<div class="list-item">
      <div class="avatar">${esc(p.name[0])}</div>
      <div class="li-main">
        <div class="li-title">${esc(p.name)} <span class="badge badge-rec">协调人推荐</span></div>
        <div class="li-sub">${trustBadges(p)} · 完成${p.completed}单 · <span class="stars">${starsHtml(Math.round(p.rating))}</span></div>
        <div class="li-sub">${esc(r.note)}</div>
      </div>
    </div>`;
  }).join('') : '<div class="muted" style="padding:6px 0">本楼协调人暂无推荐，可在大厅挑选已认证邻居。</div>';

  return `
  <div class="topbar">
    <div class="tb-row">
      <div><div class="tb-title">🌿 翡翠城·邻里互助</div><div class="tb-sub">${esc(u.building)}居民 ${esc(u.name)} · ${esc(u.room)}</div></div>
      <button class="tb-btn" onclick="go('msg')">🔔 通知${unread ? `<span class="dot">${unread}</span>` : ''}</button>
    </div>
  </div>
  <div class="wrap">
    ${b && !b.enabled ? `<div class="banner warn">⚠️ 您所在${esc(u.building)}尚未开通互助服务（供给先行策略）。可浏览，暂不能发单；开通后将在站内通知您。</div>`
      : `<div class="notice-strip">📢 ${esc(u.building)}已开通 · 本楼今日新增 ${S.orders.filter(o => o.building === u.building && o.createdAt >= '2026-11-06').length} 单 · 已认证邻居 ${S.providers.filter(p => p.building === u.building).length} 位</div>`}
    <div class="banner info" style="background:var(--danger-light);color:#9b1c1c">🚫 高风险红线：长期/过夜看娃、失能老人照护、医疗行为、涉证代办 —— 个人不得承接，平台将自动拦截并引导C类机构。</div>

    <div class="card">
      <div class="card-title">今天需要什么帮助？<span class="more">按场景发布</span></div>
      <div class="scene-grid">${scenes}</div>
    </div>

    <div class="card">
      <div class="card-title">服务大厅<span class="more">A/B/C 分级，风险不同门槛不同</span></div>
      <div class="row" style="gap:6px;margin-bottom:6px">
        <button class="btn small ${R.homeZone === 'A' ? '' : 'gray'}" onclick="R.homeZone='A';render()">A类 · 跑腿互助</button>
        <button class="btn small ${R.homeZone === 'B' ? '' : 'gray'}" onclick="R.homeZone='B';render()">B类 · 上门服务</button>
        <button class="btn small ${R.homeZone === 'C' ? '' : 'gray'}" onclick="R.homeZone='C';render()">C类 · 机构服务</button>
      </div>
      ${R.homeZone === 'A' ? aCards : R.homeZone === 'B' ? bCards : orgs}
    </div>

    <div class="card">
      <div class="card-title">本楼协调人推荐<span class="more">推荐人：刘管家（物业）</span></div>
      ${recCards}
    </div>

    <div class="card">
      <div class="card-title">邻里工具间 <span class="tag tag-gray">P1 预览</span></div>
      <div class="row wrap">
        <span class="floor-chip">🛠️ 电钻 · 信用免押</span>
        <span class="floor-chip">🪜 折叠梯 · 信用免押</span>
        <span class="floor-chip">⛺ 露营装备 · 押金¥100</span>
        <button class="btn small ghost" onclick="toast('工具借还归还不确认前押金冻结，试点期开放（P1）')">查看借还规则</button>
      </div>
    </div>
  </div>`;
}

function orgBook(id) {
  const o = S.institutions.find(x => x.id === id);
  modal(`<h3>机构预约（演示）</h3>
    <div class="banner info">C类机构服务由平台展示资质、价格与评价，预约服务由机构侧承接。<b>个人不得以互助名义承接此类需求。</b></div>
    <p class="small">机构：${esc(o.name)}<br>资质：${esc(o.quals)}<br>价格：${esc(o.price)}</p>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">关闭</button>
    <button class="btn" onclick="closeModal();toast('已向机构发送预约意向（演示）')">发送预约意向</button></div>`, { center: true });
}

/* ================= 发布 ================= */
function startPublish(catId) {
  const u = me(); const b = buildingByNo(u.building);
  if (!b.enabled) { toast('您所在楼栋尚未开通，暂不能发单'); return; }
  R.pubCatId = catId; R.tab = 'pub'; render();
}
function backHome() { R.tab = 'home'; R.pubCatId = null; render(); }

function vPublish() {
  const c = catById(R.pubCatId);
  if (!c) return '<div class="wrap"><div class="empty">请从首页选择场景</div></div>';
  const u = me();

  const fields = c.fields.map(f => {
    const req = f.required ? '<span class="req">*</span>' : '';
    let inp = '';
    if (f.type === 'select') {
      inp = `<select id="pf_${f.key}">${(f.options || []).map(o => `<option>${esc(o)}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      inp = `<textarea id="pf_${f.key}" placeholder="${esc(f.hint || '')}"></textarea>`;
    } else if (f.type === 'time') {
      inp = `<input id="pf_${f.key}" type="datetime-local">`;
    } else if (f.type === 'number') {
      inp = `<input id="pf_${f.key}" type="number" min="0" step="0.5" placeholder="${esc(f.hint || '')}">`;
    } else {
      inp = `<input id="pf_${f.key}" placeholder="${esc(f.hint || '')}">`;
    }
    return `<div class="form-item"><label>${esc(f.label)}${req}</label>${inp}${f.hint && f.type !== 'textarea' && f.type !== 'number' ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
  }).join('');

  let special = '';
  if (c.special === 'package') {
    special = `<div class="card"><div class="card-title">📦 包裹来源声明 <span class="tag tag-red">防风控必填</span></div>
      <div class="form-item"><label>包裹来源</label><select id="pf_source">
        <option>快递驿站</option><option>快递员派送上门</option><option>亲友寄件</option><option>其他（需说明）</option></select></div>
      <div class="form-item"><label>来源说明</label><input id="pf_sourceNote" placeholder="如：菜鸟驿站，网购日用品"></div>
      <div class="hint warn">平台禁止代取来源不明包裹；异常高报酬订单将进入人工复核。</div></div>`;
  } else if (c.special === 'pet') {
    special = `<div class="card"><div class="card-title">🐱 宠物健康申报（专项流程）</div>
      <div class="form-item"><label>宠物信息 <span class="req">*</span></label><input id="pf_petName" placeholder="名字/品种/年龄，如：糖糖（橘猫·2岁）"></div>
      <div class="form-item"><label>疫苗情况 <span class="req">*</span></label><input id="pf_vaccine" placeholder="如：疫苗齐全（2026-09 加强）"></div>
      <div class="form-item"><label>用药说明</label><input id="pf_meds" placeholder="无用药可填 无"></div>
      <div class="form-item"><label>喂养注意事项</label><textarea id="pf_feedNote" placeholder="性格、藏匿点、猫砂盆位置等"></textarea></div>
      <label class="checkline"><input type="checkbox" id="pf_emergencyAuth"> 授权服务者在宠物突发疾病时送医（单次费用超上限须先联系我）</label>
      <div class="form-item"><label>紧急医疗费用上限（元） <span class="req">*</span></label><input id="pf_feeCap" type="number" placeholder="如 500"><div class="hint">超上限未联系到您时，服务者以上限为限先行处置。</div></div></div>`;
  } else if (c.special === 'child') {
    special = `<div class="card"><div class="card-title">🎒 儿童接送专项（最高风险）</div>
      <div class="form-item"><label>儿童信息（仅监护人可填） <span class="req">*</span></label><input id="pf_childName" placeholder="如：周小悦（2年级）"></div>
      <div class="form-item"><label>学校 <span class="req">*</span></label><input id="pf_school" placeholder="如：实验小学"></div>
      <label class="checkline"><input type="checkbox" id="pf_guardian"> 我确认为该儿童法定监护人，同意《儿童短时接送知情同意及服务确认书》并单独授权儿童信息</label>
      <div class="banner warn" style="margin:8px 0 0">安全机制：固定路线 · 实时位置共享 · 家长确认码交接 · 交接拍照 · 单次≤4小时（过夜/长期=红线拦截）。</div></div>`;
  } else if (c.special === 'key') {
    special = `<div class="card"><div class="card-title">🔑 钥匙/密码交接</div>
      <label class="checkline"><input type="checkbox" id="pf_involvesKey"> 涉及钥匙或密码交接（将生成确认码，交接须拍照留档）</label>
      <div class="hint">建议使用临时密码，服务完成后立即修改。</div></div>`;
  } else if (c.special === 'certificate') {
    special = `<div class="banner danger">🚫 涉身份证件、代签名授权的事项属红线，个人不得代办。填写事项后将自动检测。</div>`;
  }

  return `
  <div class="topbar plain">
    <div class="tb-row">
      <button class="tb-btn" onclick="backHome()">← 返回</button>
      <div class="tb-title" style="font-size:15px">${c.icon} 发布：${esc(c.name)}</div>
      <span style="width:52px"></span>
    </div>
  </div>
  <div class="wrap">
    ${c.forbidden ? `<div class="banner danger">🚫 ${esc(c.forbidden)}</div>` : ''}
    <div class="card">
      <div class="card-title">基础信息 ${riskTag(c.risk)}</div>
      <div class="form-item"><label>期望报酬（元） <span class="req">*</span></label>
        <input id="pf_price" type="number" min="1" step="0.5" placeholder="平台指导价 ${esc(c.guide)}">
        <div class="hint">低偿互助按指导价成交率最高；超过指导价3倍将触发人工复核。</div></div>
      <div class="form-grid">
        <div class="form-item"><label>楼栋</label><input value="${esc(u.building)}" disabled></div>
        <div class="form-item"><label>门牌号 <span class="req">*</span></label><input id="pf_room" value="${esc(u.room)}"><div class="hint">🔒 接单后对服务者可见，发布期脱敏</div></div>
      </div>
      ${fields}
    </div>
    ${special}
    <div class="card">
      <label class="checkline"><input type="checkbox" id="pf_privacy"> 我已阅读并同意《隐私政策》：健康/儿童等敏感信息单独授权、仅订单双方可见、订单关闭后按期脱敏；门牌接单后可见。</label>
      <label class="checkline"><input type="checkbox" id="pf_truth"> 我承诺以上信息真实，接受平台凭证留痕与争议处理机制。</label>
    </div>
    <button class="btn block" onclick="submitPublish()">发布需求</button>
    <div class="hint" style="text-align:center;margin-top:8px">发布后进入${c.risk === 'B' ? '协议确认与' : ''}匹配流程：同楼栋优先 → 同片区 → 全小区</div>
  </div>`;
}

function collectForm() {
  const g = id => { const el = document.getElementById(id); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : undefined; };
  return {
    price: g('pf_price'), room: g('pf_room'), privacy: g('pf_privacy'), truth: g('pf_truth'),
    qty: g('pf_qty'), pickupTime: g('pf_pickupTime'), placeTo: g('pf_placeTo'), placeFrom: g('pf_placeFrom'),
    buyList: g('pf_buyList'), budget: g('pf_budget'), petName: g('pf_petName'), dogNote: g('pf_dogNote'),
    serviceType: g('pf_serviceType'), days: g('pf_days'), hours: g('pf_hours'), scope: g('pf_scope'),
    route: g('pf_route'), duration: g('pf_duration'), hospital: g('pf_hospital'), need: g('pf_need'), errand: g('pf_errand'),
    source: g('pf_source'), sourceNote: g('pf_sourceNote'), vaccine: g('pf_vaccine'), meds: g('pf_meds'),
    feedNote: g('pf_feedNote'), emergencyAuth: g('pf_emergencyAuth'), feeCap: g('pf_feeCap'),
    childName: g('pf_childName'), school: g('pf_school'), guardian: g('pf_guardian'), involvesKey: g('pf_involvesKey')
  };
}

function submitPublish() {
  const u = me(); const c = catById(R.pubCatId); const f = collectForm();
  if (!f.price || Number(f.price) <= 0) return toast('请填写期望报酬');
  if (!f.room) return toast('请填写门牌号');
  if (!f.privacy || !f.truth) return toast('请先勾选隐私授权与真实承诺');

  const red = redLineCheck(c, { duration: f.duration, errand: f.errand });
  if (red) {
    modal(`<h3>🚫 高风险红线拦截</h3>
      <div class="banner danger">${esc(red)}</div>
      <p class="small muted">平台对未成年人照护、失能照护、医疗行为、涉证代办实行零容忍拦截，此类需求由持证机构承接。</p>
      <div class="btn-row"><button class="btn gray" onclick="backHome();closeModal()">返回</button>
      <button class="btn" onclick="closeModal();R.homeZone='C';backHome()">查看C类机构</button></div>`, { center: true, locked: true });
    S.intercepts.unshift({ id: uid('ic'), orderId: '', userId: u.id, content: c.name + ' 红线拦截', rule: '高风险红线', action: '拦截并引导C类', at: dbNow() });
    saveDB();
    return;
  }
  if (c.special === 'pet' && (!f.petName || !f.vaccine || !f.feeCap)) return toast('请完成宠物健康申报（必填项）');
  if (c.special === 'child' && (!f.childName || !f.school || !f.guardian)) return toast('请完整填写儿童信息并勾选监护人授权');

  const doCreate = () => {
    const detail = {};
    c.fields.forEach(fd => { detail[fd.key] = f[fd.key]; });
    if (c.special === 'package') detail.source = f.source, detail.sourceNote = f.sourceNote;
    if (c.special === 'key') detail.involvesKey = !!f.involvesKey;
    const order = {
      id: uid('o'), catId: c.id, title: c.name + '（' + u.building + '）', publisherId: u.id, providerId: null,
      building: u.building, zone: (buildingByNo(u.building) || {}).zone || '', room: f.room,
      status: 'pending_accept', payStatus: 'unpaid', price: Number(f.price),
      scheduledAt: (f.pickupTime || '').replace('T', ' ') || '待定', createdAt: dbNow(),
      detail, special: null, riskFlags: [], reviewStatus: 'none',
      evidence: { before: [], during: [], after: [] }, messages: [], timeline: []
    };
    if (c.special === 'pet') order.special = { type: 'pet', petName: f.petName, vaccine: f.vaccine, meds: f.meds || '无', emergencyAuth: !!f.emergencyAuth, feeCap: Number(f.feeCap) || 0, feedNote: f.feedNote || '' };
    if (c.special === 'child') order.special = { type: 'child', childName: f.childName, school: f.school, guardianConsent: true };
    if (c.special === 'package') order.special = { type: 'package', source: f.source, sourceNote: f.sourceNote || '' };
    if (c.special === 'key' && f.involvesKey) order.special = { type: 'key', involvesKey: true };
    if (c.agreement) order.agreement = { templateId: c.agreement, version: templateById(c.agreement).version, residentSigned: { name: u.name, at: dbNow() }, providerSigned: null };
    if (['B3', 'B2'].includes(c.id)) order.confirmCode = String(Math.floor(1000 + Math.random() * 9000));

    const flags = runRiskChecks(order, c);
    order.status = flags.length ? 'pending_review' : 'pending_accept';
    order.timeline.push({ t: dbNow(), s: flags.length ? '发布需求 · 触发风险预警：' + flags.join('、') : '发布需求', by: u.name });
    S.orders.unshift(order);
    const coord = S.users.find(x => x.isCoordinator && (x.coordBuildings || []).includes(u.building));
    if (coord) notify(coord.id, 'review', '本楼新需求待初审', u.name + '发布' + c.name + '订单，请查看', order.id);
    saveDB();
    toast(flags.length ? '已发布 · 触发风险预警，待人工复核' : '发布成功，已推送给同楼栋邻居');
    R.tab = 'detail'; R.detailId = order.id; render();
  };

  if (c.agreement) {
    const tpl = templateById(c.agreement);
    modal(`<h3>📝 签署协议后发布</h3>
      <div class="banner warn">B类订单下单前须签署对应协议模板，签署记录进入证据链。当前模板：${esc(tpl.name)} ${esc(tpl.version)}</div>
      ${agreementDocHtml(tpl)}
      <label class="checkline mt8"><input type="checkbox" id="sg_read"> 我已逐条阅读并理解上述条款（含平台居间责任条款）</label>
      <div class="form-item mt8"><label>签署姓名</label><input id="sg_name" value="${esc(u.name)}"></div>
      <div class="btn-row"><button class="btn gray" onclick="closeModal()">暂不发布</button>
      <button class="btn" id="sg_ok">签署并发布</button></div>`, { locked: true });
    document.getElementById('sg_ok').onclick = () => {
      if (!document.getElementById('sg_read').checked) return toast('请先勾选"已逐条阅读"');
      if (!document.getElementById('sg_name').value.trim()) return toast('请填写签署姓名');
      closeModal(); doCreate();
    };
  } else doCreate();
}

/* ================= 订单列表 ================= */
function vOrders() {
  const u = me();
  const my = S.orders.filter(o => o.publisherId === u.id);
  const groups = {
    doing: my.filter(o => ['pending_review', 'needs_info', 'accepted', 'in_service', 'pending_confirm', 'disputed'].includes(o.status)),
    finding: my.filter(o => o.status === 'pending_accept'),
    done: my.filter(o => o.status === 'completed'),
    all: my
  };
  const list = (groups[R.orderFilter] || groups.doing).map(orderRow).join('') || '<div class="empty"><span class="ico">📭</span>暂无订单</div>';
  const t = (k, lb) => `<button class="btn small ${R.orderFilter === k ? '' : 'gray'}" onclick="R.orderFilter='${k}';render()">${lb}（${(groups[k] || []).length}）</button>`;
  return `
  <div class="topbar"><div class="tb-title">📋 我的订单</div><div class="tb-sub">发布的需求与服务记录 · 凭证与协议可回溯</div></div>
  <div class="wrap">
    <div class="row" style="gap:6px;margin-bottom:12px">${t('doing', '进行中')}${t('finding', '待接单')}${t('done', '已完成')}${t('all', '全部')}</div>
    <div class="card">${list}</div>
  </div>`;
}
function orderRow(o) {
  const c = catById(o.catId);
  const p = o.providerId ? providerById(o.providerId) : null;
  const revealed = ['accepted', 'in_service', 'pending_confirm', 'completed', 'disputed'].includes(o.status);
  const act = [];
  if (o.status === 'accepted' && o.payStatus === 'unpaid') act.push('<button class="btn small" onclick="event.stopPropagation();payOrder(\'' + o.id + '\')">立即支付</button>');
  if (o.status === 'pending_confirm') act.push('<button class="btn small" onclick="event.stopPropagation();confirmAccept(\'' + o.id + '\')">验收放款</button>');
  if (o.status === 'completed' && !(o.reviews || []).some(r => r.fromId === o.publisherId && r.toRole === 'provider')) act.push('<button class="btn small ghost" onclick="event.stopPropagation();openReview(\'' + o.id + '\')">评价</button>');
  return `<div class="list-item" style="cursor:pointer" onclick="R.detailId='${o.id}';R.tab='detail';render()">
    <div class="li-ico">${c.icon}</div>
    <div class="li-main">
      <div class="li-title">${esc(o.title)} ${statusPill(o.status)}</div>
      <div class="li-sub">${riskTag(c.risk)} ${payPill(o.payStatus)} · ${money(o.price)} · ${esc(shortTime(o.scheduledAt))}</div>
      <div class="li-sub">📍 ${esc(maskRoom(o, revealed))}${p ? ` · 服务者：${esc(p.name)} ${trustBadges(p)}` : ' · 等待邻居接单'}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">${act.join('')}</div>
  </div>`;
}

/* ================= 订单详情 ================= */
function vDetail(id) {
  const o = orderById(id); if (!o) return '<div class="wrap"><div class="empty">订单不存在</div></div>';
  const u = me(); const c = catById(o.catId);
  const p = o.providerId ? providerById(o.providerId) : null;
  const revealed = ['accepted', 'in_service', 'pending_confirm', 'completed', 'disputed'].includes(o.status);
  const rate = S.commission.rate;

  let specialHtml = '';
  if (o.special && o.special.type === 'pet') {
    specialHtml = `<div class="card"><div class="card-title">🐱 宠物健康申报（专项）</div>
      <div class="small">宠物：${esc(o.special.petName)}<br>疫苗：${esc(o.special.vaccine)}<br>用药：${esc(o.special.meds)}<br>注意：${esc(o.special.feedNote || '无')}</div>
      <div class="hint mt8">紧急医疗授权：${o.special.emergencyAuth ? '✅ 已授权送医，费用上限 ' + money(o.special.feeCap) : '未授权（突发情况须先联系需求方）'}</div></div>`;
  } else if (o.special && o.special.type === 'child') {
    specialHtml = `<div class="card"><div class="card-title">🎒 接娃安全卡</div>
      <div class="small">儿童：${esc(o.special.childName)} · 学校：${esc(o.special.school)}<br>路线：${esc(o.detail.route)} · 时长：${esc(o.detail.duration)}小时（短时过渡）</div>
      ${o.status === 'in_service' ? '<div class="banner ok mt8" style="margin-top:8px">🛰️ 实时位置共享中：' + esc(o.special.school) + ' → 步行至' + esc(o.building) + '南门（演示静态位置）</div>' : ''}
      <div class="hint">交接须凭确认码 + 拍照双确认；无确认码不得交接。</div></div>`;
  } else if (o.special && o.special.type === 'package') {
    specialHtml = `<div class="card"><div class="card-title">📦 包裹来源声明</div><div class="small">来源：${esc(o.special.source)}<br>说明：${esc(o.special.sourceNote || '无')}</div></div>`;
  } else if (o.special && o.special.type === 'key') {
    specialHtml = `<div class="card"><div class="card-title">🔑 钥匙交接</div><div class="small">本单涉及钥匙/密码交接，交接时须使用确认码并拍照留档。</div></div>`;
  }

  const evi = o.evidence || { before: [], during: [], after: [] };
  const eviHtml = ['before', 'during', 'after'].map((k, i) => {
    const lb = ['服务前', '服务中', '服务后'][i];
    return `<div class="evi-group"><div class="gt">${lb}${(evi[k] || []).length ? '（' + evi[k].length + '张）' : '（暂无）'}</div>
      <div class="photos">${(evi[k] || []).map(photoChip).join('')}</div></div>`;
  }).join('');

  const chat = (o.messages || []).map(m => {
    const mine = m.from === u.id;
    return `<div class="bubble ${mine ? 'me' : 'other'}">${esc(m.text)}${m.flagged ? '<br><span class="filtered">⚠ 敏感内容已过滤留档</span>' : ''}<div class="bt">${esc(shortTime(m.at))}</div></div>`;
  }).join('');

  let payCard = '';
  if (o.escrow) {
    payCard = `<div class="card"><div class="card-title">💰 资金与结算 ${payPill(o.payStatus)}</div>
      <div class="small">订单金额 ${money(o.escrow.amount)} · 服务者 ${money(o.escrow.providerAmount)} · 平台抽成 ${rate}%（${money(o.escrow.commission)}）
      <br>资金路径：微信支付服务商分账 · 服务者子商户直接结算，平台不沉淀资金</div>
      ${o.payStatus === 'frozen' ? '<div class="banner danger" style="margin-top:8px">⛔ 争议期间资金冻结，判定后按责任比例退付。</div>' : ''}</div>`;
  }

  let codeCard = '';
  if (o.confirmCode && revealed) {
    codeCard = `<div class="card"><div class="card-title">🔢 交接确认码</div>
      <div style="font-size:26px;font-weight:800;letter-spacing:6px;color:var(--primary-dark)">${o.confirmCode}</div>
      <div class="hint">请勿提前泄露；服务者交接时须输入该码并拍照。</div></div>`;
  }

  let actions = '';
  if (o.status === 'accepted' && o.payStatus === 'unpaid') actions += `<button class="btn block" onclick="payOrder('${o.id}')">💳 立即支付 ${money(o.price)}（资金进入监管）</button>`;
  if (o.status === 'pending_accept') actions += `<button class="btn block gray" onclick="cancelOrder('${o.id}')">取消订单</button>`;
  if (o.status === 'pending_confirm') actions += `<button class="btn block" onclick="confirmAccept('${o.id}')">✅ 验收完成 · 放款结算</button><button class="btn block danger-outline" style="margin-top:8px" onclick="openDispute('${o.id}')">发起争议</button>`;
  if (['in_service'].includes(o.status)) actions += `<button class="btn block danger-outline" onclick="openDispute('${o.id}')">发起争议</button>`;
  if (o.status === 'needs_info') actions += `<button class="btn block" onclick="supplyInfo('${o.id}')">✏️ 补充信息</button>`;
  if (o.status === 'completed') {
    const done = (o.reviews || []).some(r => r.fromId === u.id && r.toRole === 'provider');
    if (!done) actions += `<button class="btn block" onclick="openReview('${o.id}')">⭐ 评价服务者</button>`;
  }
  if (o.agreement && (!o.agreement.residentSigned) && o.publisherId === u.id) actions += `<button class="btn block warn" onclick="signAgreement('${o.id}')">📝 签署协议</button>`;

  const revs = (o.reviews || []).map(r => {
    const f = userById(r.fromId);
    return `<div class="list-item"><div class="avatar small">${esc(f.name[0])}</div>
      <div class="li-main"><div class="li-sub"><b>${esc(f.name)}</b> 评价${r.toRole === 'provider' ? '服务者' : '需求方'} <span class="stars">${starsHtml(r.stars)}</span></div>
      <div class="li-sub">${esc(r.text)} ${r.appeal ? '<span class="tag tag-red">申诉' + esc(r.appeal.status) + '</span>' : ''}</div></div></div>`;
  }).join('');

  return `
  <div class="topbar plain"><div class="tb-row">
    <button class="tb-btn" onclick="go('orders')">← 订单</button>
    <div class="tb-title" style="font-size:15px">${c.icon} 订单详情 ${statusPill(o.status)}</div><span style="width:52px"></span></div></div>
  <div class="wrap">
    ${o.reviewStatus === 'pending' ? '<div class="banner warn">🛡️ 风险复核中：' + esc(o.riskFlags.join('、')) + ' —— 风险订单须楼栋协调人/平台人工复核通过后才进入接单大厅。</div>' : ''}
    ${o.reviewStatus === 'cleared' && o.riskFlags.length ? '<div class="banner ok">✅ 已通过人工复核（' + esc(o.riskFlags.join('、')) + '）</div>' : ''}
    <div class="card">
      <div class="card-title">${esc(o.title)} <span class="price">${money(o.price)}</span></div>
      ${flowSteps(o)}
      <div class="small mt8">
        ${riskTag(c.risk)} ${payPill(o.payStatus)}<br>
        🕐 ${esc(o.scheduledAt || '待定')} · 📍 ${esc(maskRoom(o, revealed))}
        ${p ? `<br>🤝 服务者：${esc(p.name)} ${trustBadges(p)} · 完成${p.completed}单 · <span class="stars">${starsHtml(Math.round(p.rating))}</span>` : ''}
      </div>
      ${o.special && o.special.type === 'pet' && o.detail.days ? '' : ''}
    </div>

    ${specialHtml}
    ${codeCard}

    ${o.agreement ? `<div class="card"><div class="card-title">📝 服务协议
      <button class="btn small ghost" onclick="viewAgreement('${o.id}')">查看全文</button></div>
      <div class="small">${esc(templateById(o.agreement.templateId).name)} ${esc(o.agreement.version)}<br>
      需求方：${o.agreement.residentSigned ? '✅ ' + esc(o.agreement.residentSigned.name) : '未签署'} · 服务方：${o.agreement.providerSigned ? '✅ ' + esc(o.agreement.providerSigned.name) : '服务者接单时签署'}</div></div>` : ''}

    <div class="card"><div class="card-title">📸 服务凭证（证据链）<span class="more">时间戳自动记录</span></div>${eviHtml}</div>
    ${payCard}

    <div class="card"><div class="card-title">💬 站内沟通<span class="more">敏感词过滤 · 留痕归档</span></div>
      <div class="chat" id="chat_list">${chat || '<div class="muted small">暂无沟通记录，请在此沟通订单细节（微信/电话等站外联系方式会被过滤）。</div>'}</div>
      <div class="chat-input"><input id="chat_input" placeholder="输入消息…" onkeydown="if(event.key==='Enter')sendChat('${o.id}')">
      <button class="btn small" onclick="sendChat('${o.id}')">发送</button></div></div>

    <div class="card"><div class="card-title">🗒️ 进度时间线</div>
      <div class="timeline">${(o.timeline || []).map(t => `<div class="tl-item">${esc(t.s)}<div class="tl-t">${esc(shortTime(t.t))} · ${esc(t.by || '')}</div></div>`).join('')}</div></div>

    ${revs ? `<div class="card"><div class="card-title">⭐ 评价</div>${revs}</div>` : ''}
    <div style="padding-bottom:10px">${actions}</div>
  </div>`;
}

function viewAgreement(id) {
  const o = orderById(id); const tpl = templateById(o.agreement.templateId);
  modal(`<h3>📝 协议详情</h3>${agreementDocHtml(tpl, o.agreement)}`, { center: true });
}
function signAgreement(id) {
  const o = orderById(id); const u = me(); const tpl = templateById(o.agreement.templateId);
  modal(`<h3>📝 签署协议</h3>${agreementDocHtml(tpl)}
    <label class="checkline mt8"><input type="checkbox" id="sg_read"> 我已逐条阅读并同意</label>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button>
    <button class="btn" id="sg_ok">签署</button></div>`, { center: true });
  document.getElementById('sg_ok').onclick = () => {
    if (!document.getElementById('sg_read').checked) return toast('请先勾选同意');
    o.agreement.residentSigned = { name: u.name, at: dbNow() };
    o.timeline.push({ t: dbNow(), s: '需求方签署协议 ' + tpl.version, by: u.name });
    saveDB(); closeModal(); render(); toast('协议已签署，记录进证据链');
  };
}

function payOrder(id) {
  const o = orderById(id); const u = me(); const rate = S.commission.rate;
  const cm = Math.round(o.price * rate) / 100;
  modal(`<h3>💳 微信支付（模拟）</h3>
    <div class="banner info">服务商分账模式：资金进入平台服务商监管商户号，验收后自动分账，<b>平台账户不沉淀资金</b>（规避二清）。</div>
    <div class="card" style="box-shadow:none;border:1px solid var(--border)">
      <div class="row between"><span>订单金额</span><b>${money(o.price)}</b></div>
      <div class="row between mt8"><span>服务者结算（${100 - rate}%）</span><span>${money(o.price * (100 - rate) / 100)}</span></div>
      <div class="row between mt8"><span>平台服务费（${rate}%）</span><span>${money(cm)}</span></div>
    </div>
    <div class="qr-box"><div class="qr"></div><div class="muted">演示二维码 · 实际为微信支付收银台</div></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button>
    <button class="btn" id="pay_ok">确认支付 ${money(o.price)}</button></div>`, { center: true });
  document.getElementById('pay_ok').onclick = () => {
    o.escrow = { amount: o.price, commission: cm, providerAmount: Math.round((o.price - cm) * 100) / 100, at: dbNow() };
    o.payStatus = 'escrowed';
    o.timeline.push({ t: dbNow(), s: '支付成功 · 资金进入平台监管账户（分账模式）', by: u.name });
    if (o.providerId) notify(providerById(o.providerId).userId, 'order', '需求方已支付', '订单' + o.id + '资金已进入监管，可开始服务', o.id);
    saveDB(); closeModal(); render(); toast('支付成功 · 资金监管中');
  };
}

function confirmAccept(id) {
  const o = orderById(id); const u = me();
  modal(`<h3>✅ 验收完成</h3>
    <div class="banner warn">请先核对"服务后"凭证照片再放款。放款后资金按分账比例结算至服务者，24小时内可发起争议回溯。</div>
    ${o.evidence.after.length ? '<div class="photos mb8">' + o.evidence.after.map(photoChip).join('') + '</div>' : '<div class="banner danger">⚠ 服务者未上传"服务后"照片，放款后举证困难，建议先要求补传。</div>'}
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">再等等</button>
    <button class="btn" id="ok_ok">确认验收并放款</button></div>`, { center: true });
  document.getElementById('ok_ok').onclick = () => {
    closeModal();
    o.status = 'completed'; o.payStatus = 'released';
    o.escrow.releasedAt = dbNow();
    o.timeline.push({ t: dbNow(), s: '验收完成 · 分账结算至服务者', by: u.name });
    creditAdd(o.publisherId, 2, '完成订单 ' + o.id, o.id);
    if (o.providerId) {
      creditAdd(providerById(o.providerId).userId, 2, '完成订单 ' + o.id, o.id);
      notify(providerById(o.providerId).userId, 'settle', '结算到账', '订单' + o.id + '已结算 ' + money(o.escrow.providerAmount) + ' 至您的账户', o.id);
    }
    saveDB(); render(); toast('已放款结算 · 双方信用+2'); openReview(o.id);
  };
}

function cancelOrder(id) {
  confirmBox('取消订单', '确定取消该需求吗？取消后将从接单大厅移除。', () => {
    const o = orderById(id);
    o.status = 'cancelled';
    o.timeline.push({ t: dbNow(), s: '需求方取消订单', by: me().name });
    saveDB(); render(); toast('已取消');
  }, '确认取消');
}

function supplyInfo(id) {
  const o = orderById(id);
  modal(`<h3>✏️ 补充信息</h3>
    <div class="banner warn">楼栋协调人提示：${esc((o.riskFlags || []).join('、') || '信息不全')}，请补充后重新进入匹配。</div>
    <div class="form-item"><label>用药说明</label><input id="si_meds" value="${esc((o.special && o.special.meds) || '')}"></div>
    <div class="form-item"><label>喂养注意事项</label><input id="si_note" value="${esc((o.special && o.special.feedNote) || '')}"></div>
    <label class="checkline"><input type="checkbox" id="si_auth" ${o.special && o.special.emergencyAuth ? 'checked' : ''}> 授权紧急送医</label>
    <div class="form-item"><label>紧急医疗费用上限（元）</label><input id="si_cap" type="number" value="${(o.special && o.special.feeCap) || ''}"></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="si_ok">提交</button></div>`, { center: true });
  document.getElementById('si_ok').onclick = () => {
    if (o.special) {
      o.special.meds = document.getElementById('si_meds').value;
      o.special.feedNote = document.getElementById('si_note').value;
      o.special.emergencyAuth = document.getElementById('si_auth').checked;
      o.special.feeCap = Number(document.getElementById('si_cap').value) || 0;
    }
    o.riskFlags = (o.riskFlags || []).filter(x => x !== '寄养信息不全');
    o.status = 'pending_accept';
    o.timeline.push({ t: dbNow(), s: '需求方补充信息，重新进入匹配', by: me().name });
    saveDB(); closeModal(); render(); toast('已补充，重新推送匹配');
  };
}

function openDispute(id) {
  const o = orderById(id);
  modal(`<h3>⛔ 发起争议</h3>
    <div class="banner warn">争议期间订单资金冻结；本楼协调人将先行调解，调解不成升级平台判定。聊天与凭证记录自动附卷。</div>
    <div class="form-item"><label>争议说明 <span class="req">*</span></label><textarea id="dp_reason" placeholder="描述问题，如：油烟机油膜未按约定深度清洁"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn danger" id="dp_ok">提交争议</button></div>`, { center: true });
  document.getElementById('dp_ok').onclick = () => {
    const reason = document.getElementById('dp_reason').value.trim();
    if (!reason) return toast('请填写争议说明');
    closeModal();
    const coord = S.users.find(x => x.isCoordinator && (x.coordBuildings || []).includes(o.building));
    const d = {
      id: uid('d'), orderId: o.id, filedBy: me().id, reason,
      status: coord ? 'coordinator' : 'platform', level: coord ? '楼栋初调' : '平台判定',
      createdAt: dbNow(), slaDeadline: new Date(Date.now() + 864e5).toISOString(),
      evidences: ['服务前/后照片', '订单聊天记录', o.agreement ? '协议' + o.agreement.version : '无协议'], talks: [], judgment: null
    };
    S.disputes.unshift(d);
    o.status = 'disputed';
    if (o.payStatus === 'escrowed') { o.payStatus = 'frozen'; o.escrow.frozenAt = dbNow(); }
    o.timeline.push({ t: dbNow(), s: '发起争议 · 资金冻结 · ' + d.level, by: me().name });
    if (coord) notify(coord.id, 'dispute', '本楼争议工单', me().name + '发起争议，请初调', o.id);
    if (o.providerId) notify(providerById(o.providerId).userId, 'dispute', '订单争议通知', '需求方已发起争议，资金冻结中', o.id);
    saveDB(); render(); toast('争议已提交 · 资金冻结');
  };
}

function openReview(id) {
  const o = orderById(id); const p = o.providerId ? providerById(o.providerId) : null;
  modal(`<h3>⭐ 评价服务者</h3>
    <div class="small mb8">评价双方互见；恶意差评经申诉核实将扣信用，请客观评价。</div>
    <div class="form-item"><label>星级</label>
      <div class="row" style="gap:4px;font-size:26px" id="rv_stars">
        ${[1, 2, 3, 4, 5].map(i => `<span style="cursor:pointer" onclick="R.rvStars=${i};renderReviewStars()">${i <= (R.rvStars || 5) ? '⭐' : '☆'}</span>`).join('')}
      </div></div>
    <div class="form-item"><label>标签</label><div class="row wrap" id="rv_tags">
      ${['准时', '靠谱', '专业', '沟通好', '有爱心'].map(t => `<label class="checkline" style="margin:0"><input type="checkbox" value="${t}"> ${t}</label>`).join('')}
    </div></div>
    <div class="form-item"><label>评价内容</label><textarea id="rv_text" placeholder="服务过程、凭证是否完整等"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">稍后</button><button class="btn" id="rv_ok">提交评价</button></div>`, { center: true });
  document.getElementById('rv_ok').onclick = () => {
    const text = document.getElementById('rv_text').value.trim();
    const stars = R.rvStars || 5;
    const tags = Array.from(document.querySelectorAll('#rv_tags input:checked')).map(i => i.value);
    closeModal();
    const rv = { id: uid('rv'), orderId: o.id, fromId: me().id, toId: o.providerId, toRole: 'provider', stars, tags, text, appeal: null };
    o.reviews = o.reviews || []; o.reviews.push(rv); S.reviews.unshift(rv);
    if (p) {
      p.rating = Math.round(((p.rating * p.completed + stars) / (p.completed + 1)) * 10) / 10;
      if (stars === 5) creditAdd(p.userId, 1, '获得五星好评', o.id);
    }
    o.timeline.push({ t: dbNow(), s: '需求方评价 ' + stars + ' 星', by: me().name });
    saveDB(); render(); toast('感谢评价');
  };
}
function renderReviewStars() {
  const box = document.getElementById('rv_stars');
  if (box) box.innerHTML = [1, 2, 3, 4, 5].map(i => `<span style="cursor:pointer" onclick="R.rvStars=${i};renderReviewStars()">${i <= (R.rvStars || 5) ? '⭐' : '☆'}</span>`).join('');
}

function sendChat(id) {
  const o = orderById(id); const inp = document.getElementById('chat_input');
  const text = inp.value.trim(); if (!text) return;
  addMessage(o, S.meResident, text);
  saveDB(); R.tab = 'detail'; R.detailId = id; render();
}

/* ================= 消息 ================= */
function vMsg() {
  const list = myNotifs();
  return `
  <div class="topbar"><div class="tb-row"><div class="tb-title">🔔 消息通知</div>
    <button class="tb-btn" onclick="readAll()">全部已读</button></div>
    <div class="tb-sub">接单 / 出发 / 到达 / 完成 / 异常 · 微信模板消息与短信同步推送</div></div>
  <div class="wrap"><div class="card">
    ${list.length ? list.map(n => `
      <div class="list-item" style="cursor:pointer" onclick="${n.orderId ? `openNotifOrder('${n.orderId}')` : 'markRead(\'' + n.id + '\')'}">
        <div class="li-ico">${n.type === 'risk' ? '⚠️' : n.type === 'settle' ? '💰' : n.type === 'dispute' ? '⛔' : '📋'}</div>
        <div class="li-main">
          <div class="li-title">${esc(n.title)} ${n.read ? '' : '<span class="pill pill-red">未读</span>'}</div>
          <div class="li-sub">${esc(n.body)}</div>
          <div class="li-sub">${esc(shortTime(n.at))}</div>
        </div>
      </div>`).join('') : '<div class="empty"><span class="ico">🔕</span>暂无消息</div>'}
  </div></div>`;
}
function openNotifOrder(id) {
  const n = myNotifs().find(x => x.orderId === id); if (n) n.read = true;
  saveDB(); R.tab = 'detail'; R.detailId = id; render();
}
function markRead(id) { const n = myNotifs().find(x => x.id === id); if (n) n.read = true; saveDB(); render(); }
function readAll() { myNotifs().forEach(n => n.read = true); saveDB(); render(); }

/* ================= 我的 ================= */
function vMe() {
  const u = me();
  const [lv, lvp, lvd] = creditLevel(u.credit);
  const myReviewsGiven = S.reviews.filter(r => r.fromId === u.id);
  const done = S.orders.filter(o => o.publisherId === u.id && o.status === 'completed');
  const subs = S.subscriptions || [];
  return `
  <div class="topbar"><div class="tb-row">
    <div><div class="tb-title">👤 ${esc(u.name)}</div><div class="tb-sub">${esc(u.building)} ${esc(u.room)} · 住户核验 ✅（${esc(u.verifiedAt || '')}）</div></div>
    <select class="id-switch" onchange="switchMe(this.value)">
      ${['u1', 'u8', 'u9'].map(id => `<option value="${id}" ${id === S.meResident ? 'selected' : ''}>${esc(userById(id).name)}</option>`).join('')}
    </select>
  </div></div>
  <div class="wrap">
    <div class="card row between" onclick="creditCenter()" style="cursor:pointer">
      <div><div class="muted">我的信用</div><div style="font-size:26px;font-weight:800">${u.credit} <span class="pill ${lvp}">${lv}</span></div>
      <div class="muted">${lvd} · 违约与好评都会影响邻里信任</div></div>
      <span style="font-size:24px">›</span>
    </div>
    <div class="card">
      <div class="card-title">常用订单 <span class="tag tag-gray">P1 预览</span></div>
      ${subs.length ? subs.map(s => `<div class="list-item"><div class="li-ico">🔁</div><div class="li-main"><div class="li-title">${esc(s.name)}</div><div class="li-sub">${esc(s.cycle)}</div></div></div>`).join('')
        : `<div class="muted small">固定时间代取快递、定期保洁、固定路线接娃可设为常用订单，一键再发布。</div>
           ${done.length ? `<button class="btn small ghost mt8" onclick="makeSub('${done[0].id}')">把「${esc(done[0].title)}」设为常用</button>` : ''}`}
    </div>
    <div class="card">
      ${menuRow('🧾', '我的评价与信用流水', 'creditCenter')}
      ${menuRow('🛡️', '隐私与授权管理', 'privacyModal')}
      ${menuRow('🚫', '高风险红线说明', 'redLineModal')}
      ${menuRow('🏢', 'C类机构服务入口', 'goOrgs')}
      ${menuRow('📦', '邻里工具间（P1）', 'toolsModal')}
    </div>
    <div class="card">
      <div class="card-title">我的协议记录</div>
      ${S.orders.filter(o => o.publisherId === u.id && o.agreement).map(o =>
        `<div class="small" style="padding:4px 0">📄 ${esc(templateById(o.agreement.templateId).name)} ${esc(o.agreement.version)} · ${esc(shortTime(o.agreement.residentSigned ? o.agreement.residentSigned.at : ''))} · <span class="tag tag-gray">${esc(catById(o.catId).name)}</span></div>`).join('') || '<div class="muted small">暂无</div>'}
    </div>
    <button class="btn block gray" onclick="confirmReset()">重置演示数据</button>
  </div>`;
}
function menuRow(ico, lb, fn) {
  return `<div class="list-item" style="cursor:pointer" onclick="${fn}()"><div class="li-ico">${ico}</div>
    <div class="li-main"><div class="li-title" style="font-size:14px">${lb}</div></div><span class="muted">›</span></div>`;
}
function switchMe(id) { S.meResident = id; saveDB(); render(); toast('已切换身份：' + userById(id).name); }
function creditCenter() {
  const u = me();
  const logs = S.creditLogs.filter(l => l.userId === u.id || (u.id === S.meResident && l.userId === S.meResident));
  const [lv, lvp, lvd] = creditLevel(u.credit);
  modal(`<h3>🧾 信用中心</h3>
    <div class="card" style="box-shadow:none;border:1px solid var(--border)">
      <div class="row between"><span>当前信用分</span><b style="font-size:20px">${u.credit} <span class="pill ${lvp}">${lv}</span></b></div>
      <div class="muted mt8">${lvd} · 信用分由双方共同约束：完成单+2、五星好评+1、有责投诉-5、放鸽子-3、恶意差评-8</div></div>
    <div class="card-title mt12">信用流水</div>
    ${S.creditLogs.filter(l => l.userId === S.meResident).map(l =>
      `<div class="row between" style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12.5px">
        <span>${esc(l.reason)}</span><b style="color:${l.delta >= 0 ? 'var(--primary-dark)' : 'var(--danger)'}">${l.delta >= 0 ? '+' : ''}${l.delta}</b></div>`).join('') || '<div class="muted small">暂无流水</div>'}
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">关闭</button></div>`, { center: true });
}
function privacyModal() {
  const consents = S.privacyConsents.filter(c => c.userId === S.meResident);
  modal(`<h3>🛡️ 隐私与授权管理</h3>
    <div class="banner info">平台按《个人信息保护法》最小化收集：门牌号接单后才对服务者可见；取件码脱敏展示；健康信息、儿童信息属敏感个人信息，逐项单独授权；订单关闭后按期限脱敏归档。</div>
    <div class="card-title mt12">我的授权记录</div>
    ${consents.map(c => `<div class="small" style="padding:5px 0;border-bottom:1px solid var(--border)">✅ ${esc(c.item)}<div class="muted">${esc(shortTime(c.at))}</div></div>`).join('') || '<div class="muted small">暂无</div>'}
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">关闭</button>
    <button class="btn danger-outline" onclick="toast('已提交注销申请（演示），数据将在15日内删除')">注销账号</button></div>`, { center: true });
}
function redLineModal() {
  modal(`<h3>🚫 高风险红线说明</h3>
    <div class="banner danger">以下需求<b>禁止个人承接</b>，发布时自动拦截，请选择C类持证机构：</div>
    <ol style="padding-left:20px;font-size:13px;line-height:2">${S.redLines.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">我知道了</button></div>`, { center: true });
}
function goOrgs() { closeModal(); R.tab = 'home'; R.homeZone = 'C'; render(); }
function toolsModal() {
  modal(`<h3>🧰 邻里工具间（P1 预览）</h3>
    <div class="banner info">低风险高频场景，适合冷启动拉活跃。信用分≥90可免押金借用，归还双确认后押金退回。</div>
    ${[['电钻', '信用免押'], ['折叠梯', '信用免押'], ['露营装备套装', '押金¥100']].map(t =>
      `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>🛠️ ${t[0]}</span><span class="tag tag-a">${t[1]}</span></div>`).join('')}
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">关闭</button>
    <button class="btn block" onclick="toast('试点期开放（P1），当前为预览')">发起借用</button></div>`, { center: true });
}
function makeSub(orderId) {
  const o = orderById(orderId); const u = me();
  S.subscriptions = S.subscriptions || [];
  S.subscriptions.push({ id: uid('sub'), userId: u.id, name: o.title + ' · 每周重复', cycle: '每周 ' + (o.scheduledAt || '').slice(11) });
  saveDB(); render(); toast('已设为常用订单（P1 预览）');
}
function confirmReset() {
  confirmBox('重置演示数据', '将清除全部操作痕迹，恢复到初始演示状态。', () => { resetDB(); render(); toast('已重置'); });
}
