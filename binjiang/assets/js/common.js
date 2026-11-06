/* ============================================================
   common.js —— 四端共享 UI 与业务工具
   ============================================================ */

/* ---------- 基础工具 ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function money(n) { return '¥' + (Math.round(n * 100) / 100); }
function catById(id) { return S.categories.find(c => c.id === id) || { name: id, risk: 'A', icon: '📌', guide: '' }; }
function buildingByNo(no) { return S.buildings.find(b => b.no === no); }
function userById(id) { return S.users.find(u => u.id === id) || { name: '未知用户' }; }
function providerById(id) { return S.providers.find(p => p.id === id) || { name: '未知' }; }
function orderById(id) { return S.orders.find(o => o.id === id); }
function shortTime(iso) {
  if (!iso) return '';
  return String(iso).replace('T', ' ').slice(5, 16);
}
function starsHtml(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ---------- 徽章 / 标签 ---------- */
function riskTag(risk) {
  const m = { A: ['tag-a', 'A类·低风险'], B: ['tag-b', 'B类·中风险'], C: ['tag-c', 'C类·机构'] };
  const [cls, lb] = m[risk] || ['tag-gray', risk];
  return `<span class="tag ${cls}">${lb}</span>`;
}
function trustBadges(p) {
  let h = '';
  if (p.levels && p.levels.neighbor) h += '<span class="badge badge-neighbor">🏠 真实邻居</span>';
  if (p.levels && p.levels.platform) h += '<span class="badge badge-platform">✔ 平台认可</span>';
  if (p.levels && p.levels.community) h += '<span class="badge badge-community">⭐ 社区信赖</span>';
  return h;
}
const STATUS_MAP = {
  pending_review: ['pill-red', '风险审核中'],
  needs_info: ['pill-amber', '待补充信息'],
  pending_accept: ['pill-blue', '待接单'],
  accepted: ['pill-amber', '已接单·待服务'],
  in_service: ['pill-purple', '服务中'],
  pending_confirm: ['pill-amber', '待验收'],
  completed: ['pill-green', '已完成'],
  cancelled: ['pill-gray', '已取消'],
  disputed: ['pill-red', '争议处理中']
};
function statusPill(st) {
  const [cls, lb] = STATUS_MAP[st] || ['pill-gray', st];
  return `<span class="pill ${cls}">${lb}</span>`;
}
function payPill(ps) {
  const m = {
    unpaid: ['pill-gray', '未支付'], escrowed: ['pill-blue', '已付·监管中'],
    released: ['pill-green', '已结算'], frozen: ['pill-red', '争议冻结'], refunded: ['pill-gray', '已退款']
  };
  const [cls, lb] = m[ps] || ['pill-gray', ps];
  return `<span class="pill ${cls}">${lb}</span>`;
}
function flowSteps(order) {
  const seq = ['发布', '接单', '服务', '验收', '完成'];
  const st = order.status;
  const cur =
    st === 'pending_review' || st === 'needs_info' || st === 'pending_accept' ? 0 :
    st === 'accepted' ? 1 :
    st === 'in_service' ? 2 :
    st === 'pending_confirm' ? 3 :
    st === 'completed' ? 4 : -1;
  if (cur < 0) return '';
  return `<div class="stepper">` + seq.map((s, i) =>
    `<div class="step ${i < cur ? 'done' : i === cur ? 'cur' : ''}"><div class="dot2">${i < cur ? '✓' : i + 1}</div>${s}</div>`
  ).join('') + `</div>`;
}

/* ---------- 隐私脱敏 ---------- */
function maskRoom(order, revealed) {
  if (revealed) return order.building + ' ' + order.room;
  return order.building + ' **（接单后可见门牌）';
}

/* ---------- 协议 ---------- */
function templateById(id) { return S.templates.find(t => t.id === id); }
function agreementDocHtml(tpl, agr) {
  return `<div class="agreement-doc">
    <h4>${esc(tpl.name)} ${esc(tpl.version)}</h4>
    <ol>${tpl.clauses.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
    ${agr ? `<div class="sig-line">
      <span>需求方签署：${agr.residentSigned ? esc(agr.residentSigned.name) + ' · ' + shortTime(agr.residentSigned.at) : '未签署'}</span>
      <span>服务方签署：${agr.providerSigned ? esc(agr.providerSigned.name) + ' · ' + shortTime(agr.providerSigned.at) : '未签署'}</span>
    </div>` : ''}
  </div>`;
}

/* ---------- 内容风控：聊天过滤 ---------- */
function filterMsg(text) {
  let out = String(text);
  let hit = false;
  (S.forbiddenWords || []).forEach(w => {
    if (w && out.includes(w)) { out = out.split(w).join('*'.repeat(Math.min(w.length, 6))); hit = true; }
  });
  out2 = out.replace(/1[3-9]\d{9}/g, '【手机号已屏蔽】');
  if (out2 !== out) hit = true;
  out = out2.replace(/(加我|联系我).{0,4}(微信|vx|wx|VX)/g, '【请使用站内沟通】');
  return { text: out, hit };
}
var out2; // 供上方替换使用
function addMessage(order, fromId, rawText) {
  const f = filterMsg(rawText);
  if (!f.hit && /1[3-9]\d{9}|微信|vx/i.test(rawText)) {
    f.hit = true;
  }
  order.messages = order.messages || [];
  order.messages.push({ id: uid('m'), from: fromId, text: f.text, flagged: f.hit, at: dbNow() });
  if (f.hit) {
    S.intercepts.unshift({ id: uid('ic'), orderId: order.id, userId: fromId, content: rawText.slice(0, 30), rule: '敏感内容', action: '屏蔽', at: dbNow() });
  }
}

/* ---------- 模拟拍照 / 上传 ---------- */
function capturePhoto(label) {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 240;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 320, 240);
  g.addColorStop(0, '#0e9f6e'); g.addColorStop(1, '#03543f');
  x.fillStyle = g; x.fillRect(0, 0, 320, 240);
  x.fillStyle = 'rgba(255,255,255,.12)';
  x.beginPath(); x.arc(260, 50, 60, 0, 7); x.fill();
  x.beginPath(); x.arc(50, 200, 40, 0, 7); x.fill();
  x.fillStyle = '#fff';
  x.font = 'bold 17px sans-serif'; x.fillText(String(label).slice(0, 14), 20, 56);
  x.font = '12px sans-serif'; x.fillText('滨江翡翠城 · 凭证照片', 20, 82);
  x.fillText(new Date().toLocaleString('zh-CN', { hour12: false }), 20, 102);
  x.font = '40px sans-serif'; x.fillText('📷', 138, 178);
  return c.toDataURL('image/jpeg', 0.55);
}
function pickPhoto(cb) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => {
    const file = inp.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const scale = Math.min(1, 320 / img.width);
        c.width = 320 * scale | 0 || 320; c.height = img.height * scale | 0 || 240;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => cb(capturePhoto('上传照片'));
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  };
  inp.click();
}
function photoChip(ph) {
  const src = ph.src || capturePhoto(ph.label);
  return `<div class="photo"><img src="${src}" alt=""><div class="cap">${esc(ph.label)} · ${shortTime(ph.at)}</div></div>`;
}

/* ---------- 弹窗 ---------- */
let _modalEls = [];
function modal(html, opts) {
  opts = opts || {};
  const mask = document.createElement('div');
  mask.className = 'modal-mask' + (opts.center ? ' center' : '');
  mask.innerHTML = `<div class="modal-card">${html}</div>`;
  document.body.appendChild(mask);
  _modalEls.push(mask);
  mask.addEventListener('click', e => { if (e.target === mask && !opts.locked) closeModal(); });
  return mask;
}
function closeModal() {
  const m = _modalEls.pop();
  if (m) m.remove();
}
function closeAllModals() { while (_modalEls.length) closeModal(); }
function confirmBox(title, text, onOk, okLabel) {
  modal(`<h3>${esc(title)}</h3><p style="font-size:13.5px;color:#4b5563;line-height:1.7">${esc(text)}</p>
    <div class="btn-row"><button class="btn gray" onclick="closeModal()">取消</button>
    <button class="btn" id="_cb_ok">${esc(okLabel || '确定')}</button></div>`, { center: true });
  document.getElementById('_cb_ok').onclick = () => { closeModal(); onOk && onOk(); };
}

/* ---------- 通知 ---------- */
function notify(toUser, type, title, body, orderId) {
  S.notifications.unshift({ id: uid('n'), toUser, type, title, body, orderId: orderId || '', read: false, at: dbNow() });
}
function audit(actor, action, target, detail) {
  S.audits.unshift({ id: uid('au'), actor, action, target, detail, at: dbNow() });
}

/* ---------- 信用 ---------- */
function creditAdd(userId, delta, reason, refId) {
  S.creditLogs.unshift({ id: uid('cl'), userId, delta, reason, refId: refId || '', at: dbNow() });
  const u = S.users.find(x => x.id === userId);
  if (u) u.credit = Math.max(0, (u.credit || 100) + delta);
  const p = S.providers.find(x => x.userId === userId);
  if (p) p.credit = Math.max(0, (p.credit || 100) + delta);
}
function creditOf(userId) {
  const logs = S.creditLogs.filter(l => l.userId === userId);
  const base = 100 - logs.reduce((s, l) => s + l.delta, 0) + logs.reduce((s, l) => s + l.delta, 0);
  const u = S.users.find(x => x.id === userId);
  return (u && u.credit) || base;
}
function creditLevel(sc) {
  if (sc >= 98) return ['优秀', 'pill-green', '社区信赖候选'];
  if (sc >= 90) return ['良好', 'pill-blue', '正常接单/发单'];
  if (sc >= 80) return ['普通', 'pill-amber', '限制接高风险品类'];
  return ['受限', 'pill-red', '暂停接单，申诉后恢复'];
}

/* ---------- 风控规则 ---------- */
function runRiskChecks(order, cat) {
  const flags = [];
  const guideMax = cat.guideMax || 50;
  if (order.price > guideMax * 3) flags.push('异常高额报酬');
  if (cat.special === 'pet' && order.detail.days > (cat.maxDays || 7)) flags.push('多日宠物寄养');
  if (cat.special === 'child') flags.push('未成年接送');
  if (cat.special === 'key' && order.detail.involvesKey) flags.push('涉及钥匙交接');
  order.riskFlags = flags;
  order.reviewStatus = flags.length ? 'pending' : 'none';
  if (flags.length) {
    S.riskAlerts.unshift({
      id: uid('ra'), orderId: order.id,
      rule: flags.join('：') + `（${cat.name} · ${money(order.price)}）`,
      level: 'high', status: 'pending', at: dbNow(), handledBy: null
    });
  }
  return flags;
}
function redLineCheck(cat, form) {
  if (cat.id === 'B3') {
    const h = Number(form.duration);
    if (!h || h > (cat.maxDuration || 4)) return '儿童照看单次不得超过' + (cat.maxDuration || 4) + '小时，过夜/长期看护属于红线，请使用C类托育机构。';
  }
  if (cat.id === 'B5' && /证件|身份证|代签|户口/.test(form.errand || '')) return '涉及身份证件或签名授权的事项属于红线，个人不得代办，请前往线下办理或联系物业协助。';
  return null;
}

/* ---------- 供需统计辅助 ---------- */
function openOrdersIn(buildingNo) {
  return S.orders.filter(o => o.building === buildingNo && ['pending_accept', 'accepted', 'in_service', 'pending_confirm'].includes(o.status));
}
