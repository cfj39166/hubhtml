/* ============================================================
   coordinator.js —— 楼栋协调人端
   楼栋看板 / 本楼需求初审 / 服务者推荐 / 纠纷初调
   ============================================================ */

const C = { tab: 'dash', detailId: null };

function meC() { return S.users.find(u => u.id === S.meCoordinator); }
function myBuildings() { return meC().coordBuildings || []; }
function ordersInMyBld() { return S.orders.filter(o => myBuildings().includes(o.building)); }

function go(tab) { C.tab = tab; C.detailId = null; render(); }
function render() {
  document.querySelectorAll('.tabbar .tab').forEach(t => t.classList.toggle('active', t.dataset.t === C.tab));
  const v = document.getElementById('view');
  if (C.tab === 'dash') v.innerHTML = vDash();
  else if (C.tab === 'orders') v.innerHTML = vOrders();
  else if (C.tab === 'rec') v.innerHTML = vRec();
  else if (C.tab === 'dispute') v.innerHTML = vDispute();
  v.scrollTop = 0;
}
window.addEventListener('DOMContentLoaded', render);

function topbar(title, sub) {
  const u = meC();
  return `<div class="topbar"><div class="tb-row"><div><div class="tb-title">${title}</div>
    <div class="tb-sub">协调人：${esc(u.name)} · 管辖 ${esc(myBuildings().join('、'))}</div></div>
    <a class="tb-btn" href="admin.html">后台 →</a></div></div>`;
}

/* ================= 楼栋看板 ================= */
function vDash() {
  const blds = myBuildings();
  const orders = ordersInMyBld();
  const nonCancelled = orders.filter(o => o.status !== 'cancelled');
  const accepted = nonCancelled.filter(o => o.providerId).length;
  const acceptRate = nonCancelled.length ? Math.round(accepted / nonCancelled.length * 100) : 0;
  const openLoop = orders.filter(o => ['pending_accept', 'pending_review', 'needs_info', 'disputed'].includes(o.status));
  const activeProviders = new Set(orders.filter(o => o.providerId).map(o => o.providerId)).size;

  const perBld = blds.map(b => {
    const list = orders.filter(o => o.building === b);
    const nc = list.filter(o => o.status !== 'cancelled');
    const ac = nc.filter(o => o.providerId).length;
    return { b, total: nc.length, rate: nc.length ? Math.round(ac / nc.length * 100) : 0 };
  });

  const provs = S.providers.filter(p => blds.includes(p.building));

  return topbar('📊 楼栋看板', '指导楼栋运营，不靠感觉推广') + `
  <div class="wrap">
    <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="kpi"><div class="muted">辖区需求总数</div><div class="kv">${nonCancelled.length}</div><div class="kd">近7日 ${S.weekTrend.reduce((s, w) => s + w.orders, 0)} 单（全小区）</div></div>
      <div class="kpi good"><div class="muted">接单率</div><div class="kv">${acceptRate}%</div><div class="kd">供需匹配健康度</div></div>
      <div class="kpi"><div class="muted">活跃服务者</div><div class="kv">${activeProviders}</div><div class="kd">辖区已认证 ${provs.length} 位</div></div>
      <div class="kpi ${openLoop.length ? 'bad' : ''}"><div class="muted">未闭环订单</div><div class="kv">${openLoop.length}</div><div class="kd">待接单/审核/补充/争议</div></div>
    </div>

    <div class="card"><div class="card-title">分楼栋接单率</div>
      ${perBld.map(x => `<div class="mt8"><div class="row between small"><span>${esc(x.b)}</span><span>${x.rate}% · ${x.total}单</span></div>
        <div class="progress mt8"><div class="pf ${x.rate < 40 ? 'red' : x.rate < 70 ? 'amber' : ''}" style="width:${x.rate}%"></div></div></div>`).join('')}
      <div class="hint mt8">接单率&lt;40%的楼栋建议：招募该楼栋服务者 / 调整指导价 / 由协调人定向推荐。</div>
    </div>

    <div class="card"><div class="card-title">辖区认证服务者</div>
      ${provs.map(p => `<div class="list-item"><div class="avatar small">${esc(p.name[0])}</div>
        <div class="li-main"><div class="li-title">${esc(p.name)} ${trustBadges(p)}</div>
        <div class="li-sub">完成${p.completed}单 · <span class="stars">${starsHtml(Math.round(p.rating))}</span> · 信用${p.credit}</div></div></div>`).join('') || '<div class="muted small">暂无，请先发展本楼服务者</div>'}
    </div>

    <div class="card"><div class="card-title">楼栋开通状态 <span class="more">开关在管理后台</span></div>
      <div class="floor-list">${blds.map(b => {
        const bo = buildingByNo(b);
        return `<span class="floor-chip ${bo && bo.enabled ? 'on' : ''}">${esc(b)} ${bo && bo.enabled ? '· 已开通' : '· 未开通'}</span>`;
      }).join('')}</div>
      <div class="hint mt8">供给先行：接单率连续一周&gt;70%的楼栋可提请后台扩大开通范围。</div>
    </div>
  </div>`;
}

/* ================= 需求初审 ================= */
function vOrders() {
  const orders = ordersInMyBld().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const needReview = orders.filter(o => o.status === 'pending_review');
  const running = orders.filter(o => ['pending_accept', 'accepted', 'in_service', 'pending_confirm'].includes(o.status));
  const closed = orders.filter(o => ['completed', 'cancelled', 'disputed'].includes(o.status));

  const row = o => {
    const c = catById(o.catId); const u = userById(o.publisherId);
    return `<div class="list-item">
      <div class="li-ico">${c.icon}</div>
      <div class="li-main">
        <div class="li-title">${esc(o.title)} ${statusPill(o.status)}</div>
        <div class="li-sub">${riskTag(c.risk)} ${money(o.price)} · ${esc(u.name)}(${esc(o.building)}) · ${esc(shortTime(o.createdAt))}</div>
        ${o.riskFlags && o.riskFlags.length ? `<div class="li-sub" style="color:var(--danger)">⚠ ${esc(o.riskFlags.join('、'))}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${o.status === 'pending_review' ? `<button class="btn small" onclick="passReview('${o.id}')">复核通过</button>
          <button class="btn small warn" onclick="flagOrder('${o.id}')">标记异常</button>` : ''}
        ${['pending_accept', 'needs_info'].includes(o.status) ? `<button class="btn small ghost" onclick="remindInfo('${o.id}')">提醒补充</button>` : ''}
        <button class="btn small gray" onclick="viewOrder('${o.id}')">详情</button>
      </div>
    </div>`;
  };

  return topbar('🧐 本楼需求初审', '第一时间拦截风险，比平台远程审核更快') + `
  <div class="wrap">
    ${needReview.length ? `<div class="banner warn">🛡️ 有 ${needReview.length} 单待初审（风险预警/异常标记）。</div>` : '<div class="banner ok">✅ 暂无待初审订单。</div>'}
    <div class="card"><div class="card-title">待初审（${needReview.length}）</div>${needReview.map(row).join('') || '<div class="muted small">无</div>'}</div>
    <div class="card"><div class="card-title">进行中（${running.length}）</div>${running.map(row).join('') || '<div class="muted small">无</div>'}</div>
    <div class="card"><div class="card-title">已关闭（${closed.length}）</div>${closed.map(row).join('') || '<div class="muted small">无</div>'}</div>
  </div>`;
}
function passReview(orderId) {
  const o = orderById(orderId);
  o.reviewStatus = 'cleared';
  o.status = 'pending_accept';
  o.timeline.push({ t: dbNow(), s: '楼栋协调人复核通过' + (o.riskFlags.length ? '（' + o.riskFlags.join('、') + '）' : ''), by: meC().name });
  const ra = S.riskAlerts.find(r => r.orderId === o.id && r.status === 'pending');
  if (ra) { ra.status = 'cleared'; ra.handledBy = meC().id; }
  notify(o.publisherId, 'order', '订单已通过初审', '您的订单已进入接单大厅', o.id);
  audit(meC().name, '风险复核通过', '订单' + o.id, (o.riskFlags || []).join('、'));
  saveDB(); render(); toast('已通过，订单进入接单大厅');
}
function flagOrder(orderId) {
  const o = orderById(orderId);
  modal(`<h3>⚠ 标记异常/高风险</h3>
    <div class="form-item"><label>异常类型</label><select id="fl_type">
      <option>描述与实际可能不符</option><option>疑似商业行为（非邻里互助）</option><option>报酬明显异常</option><option>信息不全有安全风险</option><option>其他</option></select></div>
    <div class="form-item"><label>说明</label><textarea id="fl_note"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn warn" id="fl_ok">标记并通知平台</button></div>`, { center: true });
  document.getElementById('fl_ok').onclick = () => {
    const note = document.getElementById('fl_note').value.trim() || document.getElementById('fl_type').value;
    closeModal();
    o.riskFlags = o.riskFlags || [];
    o.riskFlags.push('协调人标记：' + note);
    o.status = 'pending_review'; o.reviewStatus = 'pending';
    S.riskAlerts.unshift({ id: uid('ra'), orderId: o.id, rule: '协调人标记：' + note, level: 'mid', status: 'pending', at: dbNow(), handledBy: null });
    o.timeline.push({ t: dbNow(), s: '协调人标记异常：' + note, by: meC().name });
    notify(o.publisherId, 'risk', '订单信息核查提醒', '协调人对您的订单标记了异常，请补充说明，平台将复核', o.id);
    audit(meC().name, '标记异常', '订单' + o.id, note);
    saveDB(); render(); toast('已标记，升级平台复核');
  };
}
function remindInfo(orderId) {
  const o = orderById(orderId);
  o.status = 'needs_info';
  o.riskFlags = o.riskFlags || [];
  if (!o.riskFlags.includes('信息不全待补充')) o.riskFlags.push('信息不全待补充');
  o.timeline.push({ t: dbNow(), s: '协调人提醒补充信息', by: meC().name });
  notify(o.publisherId, 'order', '请补充订单信息', '协调人提示您的订单信息不全，补充后重新进入匹配', o.id);
  saveDB(); render(); toast('已提醒需求方补充');
}
function viewOrder(orderId) {
  const o = orderById(orderId); const c = catById(o.catId);
  const evi = o.evidence || {};
  modal(`<h3>订单详情 · ${esc(c.name)}</h3>
    <div class="small">${esc(o.title)} ${statusPill(o.status)} ${payPill(o.payStatus)}<br>
    需求方：${esc(userById(o.publisherId).name)} · 服务者：${o.providerId ? esc(providerById(o.providerId).name) : '无'}<br>
    时间：${esc(o.scheduledAt)} · 地点：${esc(o.building)} ${o.providerId ? esc(o.room) : '**'}<br>
    报酬：${money(o.price)} ${o.riskFlags && o.riskFlags.length ? '· ⚠ ' + esc(o.riskFlags.join('、')) : ''}</div>
    ${o.special ? `<hr class="hr"><div class="small">${specialText(o)}</div>` : ''}
    <hr class="hr"><div class="timeline">${(o.timeline || []).map(t => `<div class="tl-item">${esc(t.s)}<div class="tl-t">${esc(shortTime(t.t))}</div></div>`).join('')}</div>
    <div class="btn-row"><button class="btn gray block" onclick="closeModal()">关闭</button></div>`, { center: true });
}
function specialText(o) {
  const s = o.special;
  if (s.type === 'pet') return `🐱 ${esc(s.petName)} · 疫苗:${esc(s.vaccine)} · 用药:${esc(s.meds)} · 送医授权:${s.emergencyAuth ? '是(上限' + money(s.feeCap) + ')' : '否'}`;
  if (s.type === 'child') return `🎒 ${esc(s.childName)} · ${esc(s.school)} · 路线:${esc(o.detail.route)} · 监护人已授权`;
  if (s.type === 'package') return `📦 来源:${esc(s.source)} · ${esc(s.sourceNote || '')}`;
  if (s.type === 'key') return '🔑 涉及钥匙/密码交接';
  return '';
}

/* ================= 服务者推荐 ================= */
function vRec() {
  const blds = myBuildings();
  const provs = S.providers.filter(p => blds.includes(p.building));
  const recs = S.recommendations.filter(r => blds.includes(r.building));
  return topbar('🤙 服务者推荐', '熟人推荐是冷启动最有效的信任来源') + `
  <div class="wrap">
    <div class="banner info">向本楼居民推荐已认证的邻居服务者。推荐会展示在居民端首页"本楼协调人推荐"。</div>
    <div class="card"><div class="card-title">辖区服务者</div>
      ${provs.map(p => `<div class="list-item"><div class="avatar">${esc(p.name[0])}</div>
        <div class="li-main">
          <div class="li-title">${esc(p.name)} ${trustBadges(p)}</div>
          <div class="li-sub">完成${p.completed}单 · <span class="stars">${starsHtml(Math.round(p.rating))}</span> · 可接：${p.cats.map(cid => esc(catById(cid).name)).join('、')}</div>
        </div>
        <button class="btn small" onclick="doRecommend('${p.id}')">推荐</button>
      </div>`).join('') || '<div class="muted small">辖区暂无服务者</div>'}
    </div>
    <div class="card"><div class="card-title">已发出的推荐（${recs.length}）</div>
      ${recs.map(r => `<div class="list-item"><div class="li-ico">👍</div><div class="li-main">
        <div class="li-title">${esc(providerById(r.providerId).name)} <span class="muted small">${esc(shortTime(r.at))}</span></div>
        <div class="li-sub">${esc(r.note)}</div></div></div>`).join('') || '<div class="muted small">暂无</div>'}
    </div>
  </div>`;
}
function doRecommend(providerId) {
  const p = providerById(providerId);
  modal(`<h3>🤙 推荐给本楼居民</h3>
    <div class="form-item"><label>推荐语（居民可见）</label><textarea id="rc_note" placeholder="如：本楼居民，47单零差评，保洁和跑腿都靠谱。">${esc(p.bio || '')}</textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="rc_ok">确认推荐</button></div>`, { center: true });
  document.getElementById('rc_ok').onclick = () => {
    const note = document.getElementById('rc_note').value.trim();
    if (!note) return toast('请填写推荐语');
    closeModal();
    S.recommendations.unshift({ id: uid('rc'), building: p.building, providerId, by: meC().id, at: dbNow(), note });
    audit(meC().name, '推荐服务者', p.name, note.slice(0, 30));
    saveDB(); render(); toast('已推荐，居民端首页可见');
  };
}

/* ================= 纠纷初调 ================= */
function vDispute() {
  const blds = myBuildings();
  const list = S.disputes.filter(d => {
    const o = orderById(d.orderId);
    return o && blds.includes(o.building);
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return topbar('🤝 纠纷初调', '小纠纷楼内解决，降低平台运营成本') + `
  <div class="wrap">
    <div class="banner info">调解依据：订单凭证照片 + 聊天记录 + 协议条款。调解成功即闭环；无法达成一致可升级平台判定（SLA 24小时）。</div>
    ${list.map(d => {
      const o = orderById(d.orderId);
      const overdue = new Date(d.slaDeadline) < new Date();
      const stTag = d.status === 'coordinator' ? '<span class="pill pill-amber">楼栋初调</span>'
        : d.status === 'platform' ? '<span class="pill pill-red">平台判定中</span>'
        : '<span class="pill pill-green">已闭环</span>';
      return `<div class="card">
        <div class="card-title">工单 ${esc(d.id)} ${stTag} ${overdue && d.status !== 'resolved' ? '<span class="tag tag-red">SLA超时</span>' : ''}</div>
        <div class="small">订单：${esc(orderById(d.orderId).title)} · ${money(orderById(d.orderId).price)} ${payPill(orderById(d.orderId).payStatus)}<br>
        发起人：${esc(userById(d.filedBy).name)} · ${esc(shortTime(d.createdAt))}<br>
        事由：${esc(d.reason)}<br>
        SLA截止：${esc(shortTime(d.slaDeadline))}</div>
        <div class="mt8">${d.evidences.map(e => `<span class="tag tag-gray">${esc(e)}</span>`).join(' ')}</div>
        ${d.talks && d.talks.length ? `<hr class="hr">${d.talks.map(t => `<div class="small muted">• ${esc(t.s)}（${esc(shortTime(t.t))}）</div>`).join('')}` : ''}
        ${d.judgment ? `<div class="banner ok mt8">判定：${esc(d.judgment)}</div>` : ''}
        ${d.status === 'coordinator' ? `<div class="btn-row">
          <button class="btn" onclick="mediate('${d.id}')">📞 调解处理</button>
          <button class="btn gray" onclick="addTalk('${d.id}')">记录沟通过程</button>
          <button class="btn danger-outline" onclick="escalate('${d.id}')">升级平台</button>
        </div>` : ''}
      </div>`;
    }).join('') || '<div class="card"><div class="empty"><span class="ico">🕊️</span>辖区暂无纠纷工单</div></div>'}
  </div>`;
}
function addTalk(disputeId) {
  const d = S.disputes.find(x => x.id === disputeId);
  modal(`<h3>记录沟通过程</h3><div class="form-item"><textarea id="tk_note" placeholder="如：电话联系双方，服务者同意次日返工补做"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="tk_ok">记录</button></div>`, { center: true });
  document.getElementById('tk_ok').onclick = () => {
    const s = document.getElementById('tk_note').value.trim();
    if (!s) return toast('请填写内容');
    closeModal(); d.talks.push({ t: dbNow(), s }); saveDB(); render(); toast('已记录');
  };
}
function escalate(disputeId) {
  const d = S.disputes.find(x => x.id === disputeId);
  const o = orderById(d.orderId);
  confirmBox('升级平台判定', '调解不成将升级至平台纠纷工单池（SLA 48小时），由平台依证据链判定责任。', () => {
    d.status = 'platform'; d.level = '平台判定';
    d.talks.push({ t: dbNow(), s: '楼栋初调不成，升级平台' });
    o.timeline.push({ t: dbNow(), s: '纠纷升级平台判定', by: meC().name });
    audit(meC().name, '纠纷升级', d.id, '订单' + o.id);
    saveDB(); render(); toast('已升级平台工单池');
  }, '确认升级');
}
function mediate(disputeId) {
  const d = S.disputes.find(x => x.id === disputeId);
  const o = orderById(d.orderId);
  modal(`<h3>📞 调解处理 · ${esc(d.id)}</h3>
    <div class="banner info">依据订单证据链选择处理结果。资金按微信支付分账/退款规则执行，责任方扣信用分。</div>
    <div class="form-item"><label>处理结果</label><select id="md_type" onchange="document.getElementById('md_partial_row').style.display=this.value==='partial'?'block':'none'">
      <option value="release">服务基本达标 · 放款结算给服务者</option>
      <option value="refund">服务未达标 · 全额退款给需求方</option>
      <option value="partial">部分达标 · 部分退款</option>
    </select></div>
    <div class="form-item" id="md_partial_row" style="display:none"><label>退款金额（元）</label><input id="md_partial" type="number" value="${Math.round(o.price / 2)}"></div>
    <div class="form-item"><label>责任认定与说明（进入闭环记录）</label><textarea id="md_note" placeholder="如：老垢超出2小时服务范围，双方沟通不足，各承担部分责任"></textarea></div>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button><button class="btn" id="md_ok">确认调解结果</button></div>`, { center: true });
  document.getElementById('md_ok').onclick = () => {
    const type = document.getElementById('md_type').value;
    const note = document.getElementById('md_note').value.trim();
    const part = Number((document.getElementById('md_partial') || {}).value) || 0;
    if (!note) return toast('请填写责任认定说明');
    closeModal();
    let judgment = '';
    if (type === 'release') {
      o.payStatus = 'released'; o.status = 'completed';
      o.escrow.releasedAt = dbNow();
      judgment = '调解放款：' + note;
    } else if (type === 'refund') {
      o.payStatus = 'refunded'; o.status = 'cancelled';
      judgment = '调解退款：' + note;
      creditAdd(o.providerId ? providerById(o.providerId).userId : o.publisherId, -5, '争议有责（调解认定）', o.id);
    } else {
      o.payStatus = 'refunded'; o.status = 'completed';
      o.escrow.amount = Math.max(0, o.escrow.amount - part);
      judgment = '调解部分退款' + money(part) + '：' + note;
    }
    d.status = 'resolved'; d.judgment = judgment;
    d.talks.push({ t: dbNow(), s: '调解完成：' + judgment });
    o.timeline.push({ t: dbNow(), s: '楼栋协调人调解完成 · ' + judgment, by: meC().name });
    notify(o.publisherId, 'dispute', '纠纷调解完成', judgment, o.id);
    if (o.providerId) notify(providerById(o.providerId).userId, 'dispute', '纠纷调解完成', judgment, o.id);
    audit(meC().name, '纠纷初调完成', d.id, judgment.slice(0, 40));
    saveDB(); render(); toast('调解完成，工单闭环');
  };
}
