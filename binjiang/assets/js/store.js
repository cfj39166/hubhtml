/* ============================================================
   store.js —— 数据层：localStorage 单键存储 + 种子数据
   覆盖实体：用户/楼栋/服务者/品类/订单/协议模板/评价/纠纷/
            信用流水与规则/通知/机构/风险预警/违禁词/审计/配置
   ============================================================ */
(function () {
  const KEY = 'fjc_platform_db_v1';

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function now() { return new Date().toISOString(); }

  /* ---------------- 种子数据 ---------------- */
  function seed() {
    const D = '2026-11-0';
    const db = {
      meta: { seededAt: now(), version: 1 },

      /* 当前登录身份（演示） */
      meResident: 'u1',          // 居民端当前用户
      meProvider: 'p1',          // 服务者端当前服务者
      meCoordinator: 'c1',       // 协调人端当前身份

      /* ---- 用户 ---- */
      users: [
        { id: 'u1', name: '李明', phone: '138****6201', building: '3栋', room: '1202', verified: true, verifiedAt: '2026-10-12', credit: 98 },
        { id: 'u8', name: '周悦', phone: '159****3308', building: '3栋', room: '2201', verified: true, verifiedAt: '2026-10-15', credit: 94 },
        { id: 'u9', name: '吴敏', phone: '186****7755', building: '4栋', room: '1101', verified: true, verifiedAt: '2026-10-18', credit: 90 },
        { id: 'u10', name: '郑浩', phone: '137****2210', building: '5栋', room: '803', verified: false, applyState: 'pending', applyAt: '2026-11-04', proof: '房产证明照片（模拟）' },
        { id: 'c1', name: '刘管家', phone: '180****9911', building: '3栋', room: '物业中心', verified: true, verifiedAt: '2026-09-30', credit: 100, isCoordinator: true, coordBuildings: ['3栋', '4栋', '5栋'] }
      ],

      /* ---- 楼栋（100栋，按区分组） ---- */
      buildings: (() => {
        const arr = [];
        const zones = { A: 25, B: 25, C: 25, D: 25 };
        let n = 1;
        for (const z of Object.keys(zones)) {
          for (let i = 0; i < zones[z]; i++) {
            arr.push({
              id: `b${n}`, no: `${n}栋`, zone: `${z}区`,
              enabled: n <= 12 || n === 21 || n === 35,
              coordinatorId: (n >= 3 && n <= 5) ? 'c1' : null,
              households: 96 + (n % 9) * 4
            });
            n++;
          }
        }
        return arr;
      })(),

      /* ---- 服务者 ---- */
      providers: [
        {
          id: 'p1', userId: 'u2', name: '王芳', building: '3栋', rating: 4.9, completed: 47, credit: 98,
          levels: { neighbor: true, platform: true, community: true },
          cats: ['A1', 'A2', 'A3', 'B1', 'B2'], open: true,
          quals: [
            { type: '健康证', expireAt: '2027-03-15', status: 'valid' },
            { type: '无犯罪记录承诺书', expireAt: '永久', status: 'valid' }
          ],
          bio: '全职妈妈，擅长收纳保洁，家有猫咪，有宠物照看经验。'
        },
        {
          id: 'p2', userId: 'u3', name: '张强', building: '3栋', rating: 4.8, completed: 23, credit: 92,
          levels: { neighbor: true, platform: true, community: false },
          cats: ['A1', 'A4', 'B3'], open: true,
          quals: [
            { type: '驾驶证', expireAt: '2027-05-20', status: 'valid' },
            { type: '无犯罪记录承诺书', expireAt: '永久', status: 'valid' }
          ],
          bio: '自由职业，作息灵活，专接接送与跑腿。'
        },
        {
          id: 'p3', userId: 'u4', name: '刘慧', building: '5栋', rating: 4.7, completed: 15, credit: 88,
          levels: { neighbor: true, platform: true, community: false },
          cats: ['A1', 'A2', 'B2', 'B4'], open: true,
          quals: [
            { type: '健康证', expireAt: '2026-12-05', status: 'expiring' },
            { type: '居家上门服务证', expireAt: '2027-01-10', status: 'valid' }
          ],
          bio: '有医院陪诊经验，熟悉本地三甲医院流程。'
        },
        {
          id: 'p4', userId: 'u5', name: '陈静', building: '4栋', rating: 4.5, completed: 3, credit: 80,
          levels: { neighbor: true, platform: false, community: false },
          cats: ['A1', 'A2', 'A3'], open: true,
          quals: [], bio: '退休教师，业余时间充裕。'
        },
        {
          id: 'p5', userId: 'u6', name: '赵磊', building: '21栋', rating: 4.9, completed: 31, credit: 95,
          levels: { neighbor: true, platform: true, community: false },
          cats: ['A1', 'B1'], open: true,
          quals: [
            { type: '养宠经验证明', expireAt: '永久', status: 'valid' },
            { type: '健康证', expireAt: '2027-08-02', status: 'valid' }
          ],
          bio: '养了五年金毛，接喂猫喂狗和遛狗单。'
        },
        {
          id: 'p6', userId: 'u11', name: '钱进', building: '9栋', rating: 4.6, completed: 8, credit: 86,
          levels: { neighbor: true, platform: false, community: false },
          cats: ['A1', 'A2'], open: true, quals: [], bio: '通勤地铁，可顺路带件。'
        }
      ],
      /* 服务者入驻申请（待审核） */
      providerApplies: [
        { id: 'pa1', userId: 'u10', name: '郑浩', building: '5栋', applyFor: '平台认可认证', cats: ['A1', 'A3'], submittedAt: '2026-11-04', status: 'pending', materials: '身份证照片、无犯罪承诺书（模拟）' }
      ],

      /* ---- 服务品类与风险配置 ---- */
      categories: [
        {
          id: 'A1', name: '代取快递', risk: 'A', icon: '📦', scene: '取快递',
          guide: '3~5元/件', guideMax: 5, enabled: true,
          fields: [
            { key: 'qty', label: '件数', type: 'number', required: true, hint: '大件可加价备注' },
            { key: 'pickupTime', label: '希望送达时间', type: 'time', required: true },
            { key: 'placeTo', label: '放置位置', type: 'select', options: ['放门口', '放驿站代收', '当面交接'], required: true }
          ],
          special: 'package'
        },
        {
          id: 'A2', name: '代扔垃圾', risk: 'A', icon: '🗑️', scene: '扔垃圾',
          guide: '2~3元/次', guideMax: 3, enabled: true,
          fields: [
            { key: 'pickupTime', label: '垃圾放置时间', type: 'time', required: true },
            { key: 'placeFrom', label: '放置位置', type: 'text', required: true, hint: '如：门口左手边' }
          ]
        },
        {
          id: 'A3', name: '顺路代买', risk: 'A', icon: '🛒', scene: '顺路带一份',
          guide: '5元起+商品费', guideMax: 15, enabled: true,
          fields: [
            { key: 'buyList', label: '物品清单', type: 'textarea', required: true, hint: '请写明品牌规格，处方药不可代买' },
            { key: 'budget', label: '预算上限（元）', type: 'number', required: true },
            { key: 'pickupTime', label: '希望送达时间', type: 'time', required: true }
          ],
          forbidden: '处方药、烟酒、违禁品不可代买，将自动拦截'
        },
        {
          id: 'A4', name: '遛狗散步', risk: 'A', icon: '🐕', scene: '遛狗',
          guide: '15~20元/次', guideMax: 20, enabled: true,
          fields: [
            { key: 'petName', label: '宠物名字/品种', type: 'text', required: true },
            { key: 'pickupTime', label: '遛狗时间', type: 'time', required: true },
            { key: 'dogNote', label: '注意事项', type: 'textarea', hint: '性格、是否怕车等' }
          ]
        },
        {
          id: 'B1', name: '上门喂宠/宠物寄养', risk: 'B', icon: '🐱', scene: '出门喂猫',
          guide: '30~50元/天', guideMax: 50, enabled: true, agreement: 'T1',
          fields: [
            { key: 'serviceType', label: '服务形式', type: 'select', options: ['上门喂养', '家庭寄养'], required: true },
            { key: 'days', label: '服务天数', type: 'number', required: true }
          ],
          special: 'pet', maxDays: 7
        },
        {
          id: 'B2', name: '上门保洁/收纳', risk: 'B', icon: '🧹', scene: '家里保洁',
          guide: '50元/小时', guideMax: 60, enabled: true, agreement: 'T2',
          fields: [
            { key: 'hours', label: '预计时长（小时）', type: 'number', required: true },
            { key: 'scope', label: '服务范围', type: 'textarea', required: true, hint: '厨房/卫生间/全屋整理等' }
          ],
          special: 'key'
        },
        {
          id: 'B3', name: '儿童短时接送', risk: 'B', icon: '🎒', scene: '接娃来不及',
          guide: '30~50元/次', guideMax: 50, enabled: true, agreement: 'T3',
          fields: [
            { key: 'route', label: '接送路线', type: 'text', required: true, hint: '如：学校→小区南门' },
            { key: 'pickupTime', label: '接送时间', type: 'time', required: true },
            { key: 'duration', label: '监护过渡时长（小时）', type: 'number', required: true, hint: '仅限短时过渡' }
          ],
          special: 'child', maxDuration: 4
        },
        {
          id: 'B4', name: '老人陪诊（非医疗）', risk: 'B', icon: '🏥', scene: '陪爸妈看病',
          guide: '100~150元/次', guideMax: 150, enabled: true, agreement: 'T4',
          fields: [
            { key: 'hospital', label: '就诊医院', type: 'text', required: true },
            { key: 'pickupTime', label: '就诊时间', type: 'time', required: true },
            { key: 'need', label: '特殊需要', type: 'text', hint: '轮椅、拄拐等' }
          ],
          forbidden: '医疗行为（喂药、打针、病情处置）属于红线，个人不得承接'
        },
        {
          id: 'B5', name: '代办跑腿（政务/银行）', risk: 'B', icon: '📋', scene: '跑腿代办',
          guide: '30~80元/次', guideMax: 80, enabled: true, agreement: 'T5',
          fields: [
            { key: 'errand', label: '代办事项', type: 'text', required: true, hint: '如：代排队取号、代缴费用' },
            { key: 'pickupTime', label: '办理时间', type: 'time', required: true }
          ],
          special: 'certificate',
          forbidden: '涉及身份证件、签名授权的事项属于红线，个人不得代办'
        }
      ],
      cOrgTypes: ['托育机构', '养老照护', '持证家政', '宠物寄养机构'],
      redLines: [
        '长期/过夜照看儿童 —— 仅限C类托育机构',
        '失能老人照护 —— 仅限C类养老照护机构',
        '医疗行为（喂药/打针/处置）—— 禁止个人承接',
        '涉证件代办、代签 —— 禁止个人承接'
      ],

      /* ---- 订单 ---- */
      orders: [
        {
          id: 'o1', catId: 'A1', title: '代取快递2件（丰巢驿站）', publisherId: 'u1', providerId: null,
          building: '3栋', zone: 'A区', room: '1202', status: 'pending_accept', payStatus: 'unpaid',
          price: 6, scheduledAt: '2026-11-06 19:00', createdAt: '2026-11-06 12:10',
          detail: { qty: 2, pickupTime: '今天 19:00 前', placeTo: '放门口' },
          special: { type: 'package', source: '快递驿站', sourceNote: '菜鸟驿站，顺丰件2个' },
          riskFlags: [], reviewStatus: 'none', evidence: { before: [], during: [], after: [] }, messages: [], timeline: [
            { t: '2026-11-06 12:10', s: '发布需求', by: '李明' }
          ]
        },
        {
          id: 'o2', catId: 'B1', title: '上门喂猫3天（橘猫·糖糖）', publisherId: 'u1', providerId: 'p5',
          building: '3栋', zone: 'A区', room: '1202', status: 'accepted', payStatus: 'unpaid',
          price: 120, scheduledAt: '2026-11-07 09:00', createdAt: '2026-11-05 20:30',
          detail: { serviceType: '上门喂养', days: 3, pickupTime: '明早 9:00 第一次' },
          special: {
            type: 'pet', petName: '糖糖（橘猫·2岁）', vaccine: '疫苗齐全（2026-09 加强）', meds: '无需用药，每天半碗处方粮伴水',
            emergencyAuth: true, feeCap: 500, feedNote: '怕生，进门轻声；猫砂盆在阳台'
          },
          riskFlags: [], reviewStatus: 'none',
          agreement: { templateId: 'T1', version: 'v2.1', residentSigned: { name: '李明', at: '2026-11-05 20:35' }, providerSigned: null },
          evidence: { before: [], during: [], after: [] },
          confirmCode: '8362',
          messages: [
            { id: 'm1', from: 'u1', text: '赵磊你好，钥匙放门口地垫下，密码锁备用密码已单独发你', at: '2026-11-05 20:40' },
            { id: 'm2', from: 'p5', text: '好的，明早9点第一次上门，结束会拍照发你', at: '2026-11-05 20:43' }
          ],
          timeline: [
            { t: '2026-11-05 20:30', s: '发布需求', by: '李明' },
            { t: '2026-11-05 21:02', s: '赵磊接单 · 协议已签（服务者）', by: '赵磊' }
          ]
        },
        {
          id: 'o3', catId: 'B3', title: '接娃：实验小学→3栋南门', publisherId: 'u8', providerId: 'p2',
          building: '3栋', zone: 'A区', room: '2201', status: 'in_service', payStatus: 'escrowed',
          price: 40, scheduledAt: '2026-11-06 16:20', createdAt: '2026-11-06 10:02',
          detail: { route: '实验小学东门→社区南门→3栋', pickupTime: '今天 16:20 放学', duration: 1 },
          special: { type: 'child', childName: '周小悦（2年级）', school: '实验小学', guardianConsent: true },
          riskFlags: ['未成年接送'], reviewStatus: 'cleared', reviewedBy: 'c1',
          agreement: { templateId: 'T3', version: 'v1.0', residentSigned: { name: '周悦', at: '2026-11-06 10:05' }, providerSigned: { name: '张强', at: '2026-11-06 10:20' } },
          confirmCode: '5108', codeConfirmed: false,
          evidence: {
            before: [{ src: '', label: '到达校门口打卡', at: '2026-11-06 16:12', by: '张强' }],
            during: [], after: []
          },
          messages: [], escrow: { amount: 40, commission: 2, providerAmount: 38, at: '2026-11-06 10:22' },
          timeline: [
            { t: '2026-11-06 10:02', s: '发布需求', by: '周悦' },
            { t: '2026-11-06 10:18', s: '张强接单', by: '张强' },
            { t: '2026-11-06 10:22', s: '支付成功 · 资金进入平台监管账户', by: '周悦' },
            { t: '2026-11-06 10:24', s: '楼栋协调人复核通过（未成年接送）', by: '刘管家' },
            { t: '2026-11-06 16:12', s: '出发/到达打卡：已到校门口', by: '张强' }
          ]
        },
        {
          id: 'o4', catId: 'A2', title: '代扔垃圾（连日加班）', publisherId: 'u8', providerId: 'p1',
          building: '3栋', zone: 'A区', room: '2201', status: 'completed', payStatus: 'released',
          price: 3, scheduledAt: '2026-11-04 08:30', createdAt: '2026-11-03 22:10',
          detail: { pickupTime: '11-04 早上', placeFrom: '门口右手边' },
          riskFlags: [], reviewStatus: 'none', evidence: { before: [], during: [], after: [{ src: '', label: '投放完成照片', at: '2026-11-04 08:41', by: '王芳' }] },
          escrow: { amount: 3, commission: 0.15, providerAmount: 2.85, at: '2026-11-03 23:00', releasedAt: '2026-11-04 09:00' },
          reviews: [
            { id: 'rv3', orderId: 'o4', fromId: 'u8', toId: 'p1', toRole: 'provider', stars: 5, tags: ['准时', '靠谱'], text: '顺便把门口纸箱也带下去了，谢谢！' }
          ],
          timeline: [
            { t: '2026-11-03 22:10', s: '发布需求', by: '周悦' },
            { t: '2026-11-03 22:30', s: '王芳接单', by: '王芳' },
            { t: '2026-11-04 08:41', s: '完成拍照', by: '王芳' },
            { t: '2026-11-04 09:00', s: '验收完成 · 结算到账', by: '周悦' }
          ]
        },
        {
          id: 'o5', catId: 'B2', title: '上门保洁2小时（厨房深度）', publisherId: 'u9', providerId: 'p3',
          building: '4栋', zone: 'A区', room: '1101', status: 'disputed', payStatus: 'frozen',
          price: 100, scheduledAt: '2026-11-05 14:00', createdAt: '2026-11-04 09:00',
          detail: { hours: 2, scope: '厨房深度清洁：油烟机+灶台+墙面' },
          special: { type: 'key', involvesKey: true },
          riskFlags: [], reviewStatus: 'none',
          agreement: { templateId: 'T2', version: 'v1.3', residentSigned: { name: '吴敏', at: '2026-11-04 09:05' }, providerSigned: { name: '刘慧', at: '2026-11-04 09:30' } },
          confirmCode: '7719',
          evidence: { before: [{ src: '', label: '服务前厨房状态', at: '2026-11-05 14:02', by: '刘慧' }], during: [], after: [{ src: '', label: '服务后照片', at: '2026-11-05 16:20', by: '刘慧' }] },
          escrow: { amount: 100, commission: 5, providerAmount: 95, at: '2026-11-04 10:00', frozenAt: '2026-11-05 18:30' },
          messages: [
            { id: 'm3', from: 'u9', text: '油烟机外侧还是有油膜，当时说好要深度清洁的', at: '2026-11-05 18:20' },
            { id: 'm4', from: 'p3', text: '油膜是老垢，2小时只能做常规深度，需要加时处理', at: '2026-11-05 18:25' }
          ],
          timeline: [
            { t: '2026-11-04 09:00', s: '发布需求', by: '吴敏' },
            { t: '2026-11-04 09:28', s: '刘慧接单', by: '刘慧' },
            { t: '2026-11-05 16:20', s: '完成拍照 · 提交验收', by: '刘慧' },
            { t: '2026-11-05 18:30', s: '需求方发起争议 · 资金冻结', by: '吴敏' }
          ]
        },
        {
          id: 'o6', catId: 'A1', title: '代取快递1件（顺丰）', publisherId: 'u1', providerId: 'p1',
          building: '3栋', zone: 'A区', room: '1202', status: 'completed', payStatus: 'released',
          price: 4, scheduledAt: '2026-11-01 18:30', createdAt: '2026-11-01 15:00',
          detail: { qty: 1, pickupTime: '当晚', placeTo: '当面交接' },
          special: { type: 'package', source: '快递驿站', sourceNote: '顺丰，网购日用品' },
          riskFlags: [], reviewStatus: 'none',
          evidence: { before: [], during: [], after: [{ src: '', label: '送达照片', at: '2026-11-01 18:26', by: '王芳' }] },
          escrow: { amount: 4, commission: 0.2, providerAmount: 3.8, at: '2026-11-01 15:30', releasedAt: '2026-11-01 18:40' },
          reviews: [
            { id: 'rv1', orderId: 'o6', fromId: 'u1', toId: 'p1', toRole: 'provider', stars: 5, tags: ['准时', '沟通好'], text: '快递送到家门口，很靠谱。' }
          ],
          timeline: [
            { t: '2026-11-01 15:00', s: '发布需求', by: '李明' },
            { t: '2026-11-01 15:12', s: '王芳接单', by: '王芳' },
            { t: '2026-11-01 18:40', s: '验收完成 · 结算到账', by: '李明' }
          ]
        },
        {
          id: 'o7', catId: 'A1', title: '代取快递 3 大件（急）', publisherId: 'u9', providerId: null,
          building: '4栋', zone: 'A区', room: '1101', status: 'pending_review', payStatus: 'unpaid',
          price: 100, scheduledAt: '2026-11-06 20:00', createdAt: '2026-11-06 11:30',
          detail: { qty: 3, pickupTime: '今晚 20:00', placeTo: '放门口' },
          special: { type: 'package', source: '其他', sourceNote: '家具城自提点，需开车搬运' },
          riskFlags: ['异常高额报酬'], reviewStatus: 'pending',
          evidence: { before: [], during: [], after: [] }, messages: [],
          timeline: [
            { t: '2026-11-06 11:30', s: '发布需求 · 触发高额报酬预警', by: '吴敏' }
          ]
        },
        {
          id: 'o8', catId: 'B1', title: '家庭寄养小狗2天（柯基）', publisherId: 'u8', providerId: null,
          building: '3栋', zone: 'A区', room: '2201', status: 'needs_info', payStatus: 'unpaid',
          price: 100, scheduledAt: '2026-11-09 09:00', createdAt: '2026-11-06 09:40',
          detail: { serviceType: '家庭寄养', days: 2 },
          special: { type: 'pet', petName: '布丁（柯基·3岁）', vaccine: '疫苗齐全', meds: '', emergencyAuth: false, feeCap: 0, feedNote: '' },
          riskFlags: ['寄养信息不全'], reviewStatus: 'none',
          evidence: { before: [], during: [], after: [] }, messages: [],
          timeline: [
            { t: '2026-11-06 09:40', s: '发布需求', by: '周悦' },
            { t: '2026-11-06 10:05', s: '协调人提醒补充：未填写用药与费用上限', by: '刘管家' }
          ]
        }
      ],

      /* ---- 协议模板 ---- */
      templates: [
        {
          id: 'T1', name: '宠物寄养/上门喂养服务协议', version: 'v2.1', updatedAt: '2026-10-20', risk: 'B',
          clauses: [
            '服务内容：服务者按订单约定的时间与方式提供宠物喂养/寄养服务，不含医疗、美容等其他服务。',
            '健康申报：需求方应如实申报宠物疫苗、既往病史与用药情况；因隐瞒导致的一切后果由需求方承担。',
            '紧急医疗：服务期间宠物突发疾病，服务者可送医，单次医疗支出超过需求方设定的费用上限时须先征得需求方同意；无法取得联系的，以费用上限为限先行处置。',
            '伤亡责任：因服务者重大过失造成宠物伤亡的，由服务者承担责任；因宠物自身疾病或不可抗力导致的，双方按公平原则分担。',
            '平台责任：平台仅提供信息撮合、协议签署、凭证留存与争议协调服务，不是服务提供方，不承担服务过程中的人身财产损害赔偿责任。',
            '争议处理：服务前后照片、聊天记录与确认码作为争议处理依据；争议期间订单资金冻结。'
          ]
        },
        {
          id: 'T2', name: '上门保洁家政服务协议', version: 'v1.3', updatedAt: '2026-10-18', risk: 'B',
          clauses: [
            '服务内容：以订单"服务范围"与照片记录为准，超出范围的服务需双方另行确认。',
            '入户与钥匙：如涉及钥匙/密码交接，须使用平台确认码交接并留存记录；服务完成后需求方应及时更改临时密码。',
            '物品损坏：服务者应尽合理注意义务；贵重物品请需求方提前收纳，未收纳且发生损坏的，按过错比例分担。',
            '验收标准：以服务前/后对比照片作为验收与争议依据；需求方应在完成后24小时内确认或提出异议。',
            '平台责任：平台为居间撮合方，不承担服务损害的赔偿责任；已投保公众责任险的，按保单范围处理。',
            '争议处理：争议期间资金冻结，由楼栋协调人先行调解，调解不成升级平台判定。'
          ]
        },
        {
          id: 'T3', name: '儿童短时接送知情同意及服务确认书', version: 'v1.0', updatedAt: '2026-10-22', risk: 'B',
          clauses: [
            '性质声明：本服务仅为"短时监护过渡"（单次不超过4小时），不构成托管关系，不替代监护人法定责任。',
            '监护人义务：需求方必须是儿童的法定监护人；应如实登记儿童信息、接送路线与交接人；服务全程保持通讯畅通。',
            '固定路线：服务者不得擅自变更路线或停靠点；如遇特殊情况应立即联系监护人。',
            '交接确认：接送均须监护人/指定交接人提供平台确认码并拍照留档；无确认码不得交接。',
            '安全底线：服务者不得让儿童离开视线、不得委托第三方、不得搭载无关人员。',
            '紧急情况：发生意外时第一时间报警并通知监护人，平台启动应急协助。',
            '平台责任：平台提供路线共享、确认码与全程留痕工具，是居间方而非服务提供方。'
          ]
        },
        {
          id: 'T4', name: '陪伴就诊服务协议（非医疗）', version: 'v1.1', updatedAt: '2026-10-15', risk: 'B',
          clauses: [
            '服务范围：陪同前往医院、排队取号、引导路线、代取报告、协助缴费等非医疗事务。',
            '红线声明：服务者不得实施喂药、注射、病情处置等任何医疗行为；医疗决策一律由患者及家属作出。',
            '紧急处理：就诊中出现突发状况，服务者应立即呼叫医护人员并通知家属。',
            '隐私保护：涉及病情的信息双方应予保密，平台按隐私政策最小化留存。',
            '平台责任：平台为居间方，不对诊疗结果承担任何责任。'
          ]
        },
        {
          id: 'T5', name: '跑腿代办服务协议', version: 'v1.2', updatedAt: '2026-10-12', risk: 'B',
          clauses: [
            '代办范围：以订单事项描述为准；涉证件、涉签名授权事项平台禁止个人代办。',
            '费用凭证：代缴款项应索取并保留凭证，票据交付时拍照留档。',
            '延误与损失：因不可抗力延误的双方互免责；因服务者过错造成损失的按实际损失赔偿。',
            '平台责任：平台为居间方，提供流程留痕与争议协调。'
          ]
        }
      ],

      /* ---- 评价（含申诉） ---- */
      reviews: [
        { id: 'rv2', orderId: 'o2', fromId: 'u9', toId: 'p5', toRole: 'provider', stars: 2, tags: ['沟通一般'], text: '回复慢，等了很久才确认时间。', appeal: { status: 'pending', reason: '当天在上班，晚上9点才看到消息，并非故意拖延，有聊天记录为证', at: '2026-11-02' } }
      ],
      /* ---- 纠纷工单 ---- */
      disputes: [
        {
          id: 'd1', orderId: 'o5', filedBy: 'u9', reason: '油烟机油膜未按约定深度清洁，要求部分退款',
          status: 'coordinator', level: '楼栋初调', createdAt: '2026-11-05 18:32',
          slaDeadline: '2026-11-06 18:32', evidences: ['服务前照片', '服务后照片', '订单聊天记录', '协议T2 v1.3'],
          talks: [{ t: '2026-11-05 19:00', s: '刘管家电话联系双方了解情况' }], judgment: null
        }
      ],

      /* ---- 信用规则与流水 ---- */
      creditRules: [
        { id: 'cr1', event: '完成订单', delta: 2, target: '双方', enabled: true },
        { id: 'cr2', event: '获得五星好评', delta: 1, target: '服务者', enabled: true },
        { id: 'cr3', event: '被投诉且核实有责', delta: -5, target: '责任方', enabled: true },
        { id: 'cr4', event: '接单后放鸽子（无正当理由）', delta: -3, target: '双方', enabled: true },
        { id: 'cr5', event: '恶意差评核实成立', delta: -8, target: '差评方', enabled: true },
        { id: 'cr6', event: '资质过期仍接单', delta: -10, target: '服务者', enabled: true }
      ],
      creditLogs: [
        { id: 'cl1', userId: 'u1', delta: 2, reason: '完成订单 o6', refId: 'o6', at: '2026-11-01 18:40' },
        { id: 'cl2', userId: 'p1', delta: 2, reason: '完成订单 o6', refId: 'o6', at: '2026-11-01 18:40' },
        { id: 'cl3', userId: 'p1', delta: 1, reason: '获得五星好评', refId: 'o6', at: '2026-11-01 18:45' }
      ],

      /* ---- 消息通知 ---- */
      notifications: [
        { id: 'n1', toUser: 'u1', type: 'order', title: '喂猫订单已接单', body: '赵磊已接单您的喂猫订单，请完成协议确认与支付。', orderId: 'o2', read: false, at: '2026-11-05 21:02' },
        { id: 'n2', toUser: 'u1', type: 'risk', title: '高风险提示', body: '儿童接送、宠物寄养订单请务必完成协议签署并留存凭证。', orderId: '', read: false, at: '2026-11-05 09:00' },
        { id: 'n3', toUser: 'u1', type: 'settle', title: '结算到账通知', body: '订单o6已完成，服务者王芳已收到结算款3.80元。', orderId: 'o6', read: true, at: '2026-11-01 18:41' }
      ],

      /* ---- C类机构 ---- */
      institutions: [
        { id: 'org1', name: '安心宝贝托育中心', type: '托育机构', quals: '托育机构备案·食品经营许可', rating: 4.8, price: '2800元/月', status: 'online', intro: '全日托/半日托，距小区南门300米。' },
        { id: 'org2', name: '颐年养老照护服务站', type: '养老照护', quals: '养老服务资质·护理员持证', rating: 4.7, price: '60元/小时起', status: 'online', intro: '失能半失能照护、日间照料、上门助浴。' },
        { id: 'org3', name: '洁到家（持证家政）', type: '持证家政', quals: '家政服务企业资质·员工持证', rating: 4.6, price: '70元/小时', status: 'online', intro: '深度保洁、收纳整理，支持开票。' },
        { id: 'org4', name: '宠悦宠物寄养酒店', type: '宠物寄养机构', quals: '动物经营许可·宠物医师驻场', rating: 4.9, price: '88元/天起', status: 'online', intro: '独立猫舍犬舍，24小时监控直播。' }
      ],

      /* ---- 风险预警 ---- */
      riskAlerts: [
        { id: 'ra1', orderId: 'o7', rule: '异常高额报酬：代取快递100元（指导价上限5元的20倍）', level: 'high', status: 'pending', at: '2026-11-06 11:30', handledBy: null },
        { id: 'ra2', orderId: 'o3', rule: '未成年接送：需人工复核交接人资质', level: 'high', status: 'cleared', at: '2026-11-06 10:04', handledBy: 'c1' }
      ],

      /* ---- 内容风控 ---- */
      forbiddenWords: ['微信', '加我私信', '私下交易', '现金支付', '处方药', '电子烟'],
      intercepts: [
        { id: 'ic1', orderId: 'o2', userId: 'u8', content: '加我私信给你钥匙', rule: '引导站外沟通', action: '屏蔽并发送提示', at: '2026-11-05 19:12' }
      ],

      /* ---- 楼栋推荐记录 ---- */
      recommendations: [
        { id: 'rc1', building: '3栋', providerId: 'p1', by: 'c1', at: '2026-10-28', note: '本楼居民，47单零差评，保洁和跑腿都靠谱。' },
        { id: 'rc2', building: '3栋', providerId: 'p2', by: 'c1', at: '2026-11-01', note: '接娃专户，车况良好，有家长确认码交接经验。' }
      ],

      /* ---- 供需热力（分楼栋 × 品类，需求量1-9） ---- */
      demandHeat: (() => {
        const cats = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
        const m = {};
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 21, 35].forEach((b, bi) => {
          m[`${b}栋`] = {};
          cats.forEach((c, ci) => {
            m[`${b}栋`][c] = ((bi * 7 + ci * 5) % 9) + 1;
          });
        });
        m['3栋'].A1 = 9; m['3栋'].B3 = 8; m['5栋'].B2 = 9; m['4栋'].A1 = 7; m['21栋'].B1 = 8;
        return m;
      })(),

      /* ---- 运营数据（总览/看板） ---- */
      weekTrend: [
        { day: '11-01', orders: 12 }, { day: '11-02', orders: 15 }, { day: '11-03', orders: 18 },
        { day: '11-04', orders: 22 }, { day: '11-05', orders: 26 }, { day: '11-06', orders: 31 }
      ],

      /* ---- 保险与抽成 ---- */
      insurance: {
        plan: '社区互助公众责任险（年度保单）', coverage: '服务过程中第三者人身伤害/财产损失，单次最高10万元',
        deductible: '免赔额500元', perOrderApi: false, note: 'P1接入按单投保API；当前按年度保单兜底'
      },
      commission: { rate: 5, refundPolicy: '验收前可全额退款；争议期间冻结，判定后按责任比例退付；完成后24小时内可发起争议。' },

      /* ---- 审计日志 ---- */
      audits: [
        { id: 'au1', actor: '管理员', action: '开通楼栋', target: '21栋', detail: '供给达标，正式开放发单', at: '2026-11-02 10:00' },
        { id: 'au2', actor: '刘管家', action: '风险复核通过', target: '订单o3', detail: '未成年接送：已核验服务者驾驶资质', at: '2026-11-06 10:24' },
        { id: 'au3', actor: '管理员', action: '协议模板更新', target: '宠物寄养协议', detail: 'v2.0 → v2.1 增加紧急医疗费用上限条款', at: '2026-10-20 14:00' }
      ],

      /* ---- 隐私 ---- */
      privacyConsents: [
        { id: 'pc1', userId: 'u1', item: '住户核验（手机号+房号+房产材料）', at: '2026-10-12' },
        { id: 'pc2', userId: 'u1', item: '敏感字段：宠物健康信息单独授权', at: '2026-11-05' },
        { id: 'pc3', userId: 'u8', item: '敏感字段：儿童信息（监护人）单独授权', at: '2026-11-06' }
      ]
    };
    return db;
  }

  /* ---------------- 存取 ---------------- */
  let mem = null;   // localStorage 不可用时的内存兜底
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }
  function persist(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { mem = db; }
  }

  const existing = load();
  window.S = existing || seed();
  if (!existing) persist(window.S);

  window.saveDB = function () { persist(window.S); };
  window.resetDB = function () {
    window.S = seed();
    persist(window.S);
  };
  window.uid = uid;
  window.dbNow = now;
})();
