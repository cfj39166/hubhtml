/* ============================================================
   锦和苑 · 社区邻里服务平台 — 数据层
   功能点清单（端 + 公共能力），每项含具体设计与设计理由
   ============================================================ */

/* ---------------- 一、用户端（居民小程序） ---------------- */
const F_USER = [
  { id: 'U01', p: 'P0', n: '住户核验注册',
    d: '手机号 + 楼栋房号核验，对接物业住户数据或上传房产/租赁证明，人工/自动审核',
    w: '100 栋楼陌生人社会，先确认"真实邻居"才敢开放服务',
    page: 'app/register.html' },
  { id: 'U02', p: 'P0', n: '场景化首页入口',
    d: '不按品类罗列，按"取快递、扔垃圾、出门喂猫、接娃来不及、找保洁"场景入口',
    w: '用户想的是场景不是品类，降低发布门槛',
    page: 'app/index.html' },
  { id: 'U03', p: 'P0', n: '服务分级展示',
    d: 'A 类低风险、B 类中风险、C 类机构服务分区展示，C 类不开放个人接单',
    w: '风险不同，准入门槛和协议必须不同',
    page: 'app/services.html' },
  { id: 'U04', p: 'P0', n: '需求发布表单',
    d: '极简表单 + 风险强制字段：时间、地点、价格、宠物健康/用药、接娃学校/交接方式、是否涉及钥匙证件',
    w: '风险信息前置收集，减少纠纷举证难',
    page: 'app/publish.html' },
  { id: 'U05', p: 'P0', n: '智能匹配排序',
    d: '同楼栋 → 同片区 → 全小区；A 类优先同楼栋，B 类可全小区',
    w: '100 栋楼匹配半径过大没人接，物理距离就是信任补充',
    page: 'app/match.html' },
  { id: 'U06', p: 'P0', n: '服务者卡片',
    d: '展示三层标识：真实邻居、平台认可、社区信赖；显示完成单量、评价、可接品类',
    w: '让居民一眼判断"能不能信"',
    page: 'app/provider.html' },
  { id: 'U07', p: 'P0', n: '订单凭证页',
    d: '服务前/中/后拍照上传，自动时间戳；接娃/钥匙交接生成确认码',
    w: '纠纷处理靠证据链，不靠口头约定',
    page: 'app/order-detail.html' },
  { id: 'U08', p: 'P0', n: '标准协议签署',
    d: 'B 类订单下单前强制签署对应协议模板：宠物寄养、上门家政、接送、陪诊',
    w: '平台做居间撮合 + 凭证留存，必须书面化责任边界',
    page: 'app/sign.html' },
  { id: 'U09', p: 'P0', n: '低偿支付与结算',
    d: '平台给指导价，支持线上支付，完成后即时到账服务者，平台低抽成',
    w: '免费制造人情债，市场化定价失去邻里意义，低偿最可持续',
    page: 'app/pay.html' },
  { id: 'U10', p: 'P0', n: '双向评价与投诉',
    d: '需求方评服务者，服务者也评需求方；恶意差评、放鸽子扣信用',
    w: '只约束服务者会摧毁供给意愿',
    page: 'app/review.html' },
  { id: 'U11', p: 'P0', n: '消息通知',
    d: '微信模板消息/短信：接单、出发、到达、完成、异常提醒',
    w: '社区服务高频短时，通知不及时体验断裂',
    page: 'app/notify.html' },
  { id: 'U12', p: 'P0', n: '地址与隐私脱敏',
    d: '发布时只显示楼栋/片区，接单后才显示具体门牌；取件码脱敏',
    w: '防止信息滥用和骚扰',
    page: 'app/privacy.html' },
  { id: 'U13', p: 'P1', n: '常需服务订阅',
    d: '固定时间代取快递、固定路线接娃拼单、定期保洁可设"常用订单"',
    w: '社区需求重复性强，降低重复发布成本',
    page: 'app/subscribe.html' },
  { id: 'U14', p: 'P1', n: '工具/闲置共享',
    d: '电钻、梯子、露营装备等借还，押金或信用免押，归还确认',
    w: '低风险高频，适合冷启动拉活跃',
    page: 'app/share.html' },
  { id: 'U15', p: 'P1', n: '拼单/轮值工具',
    d: '接娃拼单、团购自提、寒暑假看护拼班，平台只做协调和确认',
    w: '平台不替代监护责任，只做组织工具',
    page: 'app/group.html' },
  { id: 'U16', p: 'P1', n: 'C 类机构入口',
    d: '托育、养老、持证家政展示资质、价格、评价，跳转预约',
    w: '高风险需求引导至机构，不让个人以互助名义承接',
    page: 'app/agency.html' },
  { id: 'U17', p: 'P1', n: '信用中心',
    d: '展示自己的信任等级、完成单、协议记录、违约记录',
    w: '信用可见才有约束力',
    page: 'app/credit.html' }
];

/* ---------------- 二、服务者端 ---------------- */
const F_PROVIDER = [
  { id: 'S01', p: 'P0', n: '分层认证入驻',
    d: '真实邻居认证 → 平台认可认证（实名 + 人脸 + 无犯罪承诺 + 品类资质）→ 社区信赖等级',
    w: '实名只证明存在，分层才证明可靠',
    page: 'provider/join.html' },
  { id: 'S02', p: 'P0', n: '可接品类开关',
    d: '按认证等级开放 A/B 类；C 类只对机构开放',
    w: '防止低认证接高风险单',
    page: 'provider/cats.html' },
  { id: 'S03', p: 'P0', n: '接单大厅',
    d: '按楼栋/片区筛选，显示距离、价格、风险标签',
    w: '服务者顺手接单，跨半小区意愿低',
    page: 'provider/hall.html' },
  { id: 'S04', p: 'P0', n: '资质上传与到期提醒',
    d: '健康证、居家上门服务证、无犯罪记录、养宠经验证明；到期自动停接',
    w: '合规动态管理，避免证件过期仍接单',
    page: 'provider/certs.html' },
  { id: 'S05', p: 'P0', n: '协议与保险确认',
    d: '接 B 类单前签署服务者版协议，确认平台责任险覆盖范围',
    w: '明确平台是居间方，不是服务提供方',
    page: 'provider/agreement.html' },
  { id: 'S06', p: 'P0', n: '服务过程留痕',
    d: '出发打卡、到达拍照、完成拍照、异常上报',
    w: '与用户端凭证形成双向证据链',
    page: 'provider/track.html' },
  { id: 'S07', p: 'P0', n: '收入与结算',
    d: '订单收入、平台抽成明细、提现、争议冻结',
    w: '即时回报是最有效激励',
    page: 'provider/income.html' },
  { id: 'S08', p: 'P1', n: '服务者评价与申诉',
    d: '查看评价、对恶意差评申诉、信用分变动记录',
    w: '双向公平，保护供给端',
    page: 'provider/appeal.html' }
];

/* ---------------- 三、楼栋协调人端 ---------------- */
const F_COORD = [
  { id: 'C01', p: 'P0', n: '楼栋协调人身份',
    d: '每栋楼/几个单元设 1 名，物业管家或热心居民兼任，后台授权',
    w: '100 栋楼不能靠一个大群，必须有本地支点',
    page: 'coord/index.html' },
  { id: 'C02', p: 'P0', n: '本楼需求初审',
    d: '查看本楼新发布需求，标记异常/高风险，提醒补充信息',
    w: '第一时间降低风险，比平台远程审核快',
    page: 'coord/review.html' },
  { id: 'C03', p: 'P0', n: '服务者推荐',
    d: '向本楼居民推荐已认证的本楼服务者',
    w: '熟人推荐是冷启动最有效信任来源',
    page: 'coord/recommend.html' },
  { id: 'C04', p: 'P1', n: '纠纷初调',
    d: '接收本楼简单纠纷工单，先协调，升级平台',
    w: '小纠纷楼内解决，降低平台运营成本',
    page: 'coord/dispute.html' },
  { id: 'C05', p: 'P1', n: '楼栋看板',
    d: '本楼需求数、接单率、活跃服务者、未闭环订单',
    w: '指导楼栋运营，不靠感觉推广',
    page: 'coord/board.html' },
  { id: 'C06', p: 'P0', n: '楼栋开通开关',
    d: '后台按楼栋/片区开启服务，未开通楼栋只能浏览不能发单',
    w: '供给先行，避免"发了没人接"',
    page: 'coord/switch.html' }
];

/* ---------------- 四、管理后台（平台运营） ---------------- */
const F_ADMIN = [
  { id: 'A01', p: 'P0', n: '住户与服务者审核',
    d: '住户核验、实名/人脸、无犯罪承诺、品类资质审核队列',
    w: '信任机制的地基',
    page: 'admin/audit.html' },
  { id: 'A02', p: 'P0', n: '服务品类与风险配置',
    d: '配置 A/B/C 类、每类必填字段、协议模板、准入门槛、指导价',
    w: '风险分级要可配置，不能写死',
    page: 'admin/category.html' },
  { id: 'A03', p: 'P0', n: '风险订单预警',
    d: '未成年接送、多日宠物寄养、老人陪护、钥匙证件、高额报酬自动标记人工复核',
    w: '高风险单必须拦截或加审',
    page: 'admin/risk.html' },
  { id: 'A04', p: 'P0', n: '协议模板管理',
    d: '宠物寄养、家政上门、接送、陪诊、跑腿代办模板版本管理',
    w: '书面协议是责任边界核心',
    page: 'admin/agreement.html' },
  { id: 'A05', p: 'P0', n: '纠纷工单池',
    d: '统一受理、SLA 计时、证据查看、责任判定、闭环记录',
    w: '纠纷不闭环会迅速摧毁口碑',
    page: 'admin/ticket.html' },
  { id: 'A06', p: 'P1', n: '信用分规则配置',
    d: '完成单、评价、违约、恶意行为、申诉的加减分规则',
    w: '动态信用比静态认证有约束力',
    page: 'admin/credit-rule.html' },
  { id: 'A07', p: 'P1', n: '供需热力图',
    d: '分楼栋/片区看需求品类、接单率、供给缺口',
    w: '指导先开哪栋楼、招哪类服务者',
    page: 'admin/heatmap.html' },
  { id: 'A08', p: 'P1', n: '机构管理',
    d: 'C 类机构资质、合同、评价、下架管理',
    w: '高风险服务只做入口和筛选',
    page: 'admin/agency.html' },
  { id: 'A09', p: 'P1', n: '保险与抽成配置',
    d: '平台责任险、订单险、抽成比例、退款规则',
    w: '低偿模式必须控制成本和风险',
    page: 'admin/insurance.html' },
  { id: 'A10', p: 'P0', n: '内容与违禁风控',
    d: '违禁词、异常报酬、包裹来源声明、代取违禁品拦截',
    w: '防止跑腿代取被利用',
    page: 'admin/riskword.html' },
  { id: 'A11', p: 'P2', n: '数据看板',
    d: '订单闭环率、复购率、纠纷率、楼栋活跃度、服务者留存',
    w: '用数据决定扩展，不靠拍脑袋',
    page: 'admin/dashboard.html' }
];

/* ---------------- 五、公共能力与风控 ---------------- */
const F_COMMON = [
  { id: 'X01', p: 'P0', n: '三层信任标识',
    d: '真实邻居、平台认可、社区信赖，用户端可见',
    w: '100 栋楼陌生人场景，信任必须可视化',
    page: 'common/trust.html' },
  { id: 'X02', p: 'P0', n: '双向信用约束',
    d: '需求方和服务者都受信用分约束',
    w: '只罚服务者会导致供给流失',
    page: 'common/credit.html' },
  { id: 'X03', p: 'P0', n: '高风险红线拦截',
    d: '长期看孩子、失能老人照护、医疗行为不允许个人接单，强制转 C 类入口',
    w: '合规红线，避免平台变"黑托管"',
    page: 'common/redline.html' },
  { id: 'X04', p: 'P0', n: '宠物寄养专项流程',
    d: '健康申报、用药说明、服务前后照片、紧急医疗授权与费用上限',
    w: '宠物纠纷举证难，必须专项设计',
    page: 'common/pet.html' },
  { id: 'X05', p: 'P0', n: '接娃专项流程',
    d: '固定路线、实时位置共享、家长确认码、交接拍照、仅短时过渡',
    w: '未成年安全是最高风险',
    page: 'common/kid.html' },
  { id: 'X06', p: 'P0', n: '包裹来源声明',
    d: '代取快递需声明来源，异常高报酬订单预警',
    w: '防止被利用代取不明包裹',
    page: 'common/parcel.html' },
  { id: 'X07', p: 'P0', n: '证据链留存',
    d: '照片、时间戳、确认码、协议签署记录、聊天记录统一归档',
    w: '平台居间责任靠证据链自保',
    page: 'common/evidence.html' },
  { id: 'X08', p: 'P0', n: '隐私与权限分级',
    d: '楼栋协调人只看本楼，平台按角色授权，门牌接单后可见',
    w: '防止内部信息滥用',
    page: 'common/permission.html' },
  { id: 'X09', p: 'P0', n: '支付与争议冻结',
    d: '争议订单资金冻结，确认后释放',
    w: '低偿也要有交易保障',
    page: 'common/escrow.html' },
  { id: 'X10', p: 'P0', n: '微信小程序优先',
    d: '不做独立 App，管理后台 Web，服务者端复用小程序',
    w: '社区低频多场景，小程序摩擦最低',
    page: 'common/platform.html' }
];

/* ---------------- 六、第一版最小闭环（P0 组合） ---------------- */
const MVP = {
  items: [
    '住户核验注册',
    '场景化首页 + A 类服务发布',
    '同楼栋/同片区匹配',
    '三层信任标识',
    '订单凭证拍照 + 时间戳',
    'B 类协议强制签署',
    '低偿线上支付 + 即时结算',
    '双向评价 + 投诉',
    '服务者分层认证 + 资质到期提醒',
    '楼栋协调人 + 楼栋开通开关',
    '风险订单预警 + 纠纷工单',
    '高风险红线拦截 + C 类机构入口占位'
  ],
  notNow: [
    { n: '邻里社交动态', w: '供给密度和信任基础不足时，只增加噪音' },
    { n: '积分商城', w: '远期许诺型激励，不如即时回报有效' },
    { n: '排行榜', w: '日活下降时加排行榜会加速崩塌' },
    { n: '复杂 AI 匹配', w: '规则匹配已足够，投入产出不划算' },
    { n: '独立 App', w: '社区低频多场景，小程序摩擦最低' },
    { n: '全小区统一大池子', w: '匹配半径过大没人接，且缺熟人压力' }
  ]
};

/* ---------------- 端定义 ---------------- */
const ENDS = [
  { key: 'user',     name: '用户端',       sub: '居民小程序',        icon: '🏠', items: F_USER,     count: F_USER.length },
  { key: 'provider', name: '服务者端',     sub: '居民服务者 / 机构', icon: '🧰', items: F_PROVIDER, count: F_PROVIDER.length },
  { key: 'coord',    name: '楼栋协调人端', sub: '100 栋楼的关键设计', icon: '🏢', items: F_COORD,    count: F_COORD.length },
  { key: 'admin',    name: '管理后台',     sub: '平台运营',          icon: '⚙️', items: F_ADMIN,    count: F_ADMIN.length },
  { key: 'common',   name: '公共能力与风控', sub: '跨端能力',        icon: '🛡️', items: F_COMMON,   count: F_COMMON.length }
];

const ALL_FEATURES = [].concat(F_USER, F_PROVIDER, F_COORD, F_ADMIN, F_COMMON);

/* ============================================================
   业务数据（虚构）
   ============================================================ */

const COMMUNITY = {
  name: '锦和苑', buildings: 108, households: 3186, residents: 8942, districts: 6
};

const DISTRICTS = [
  { id: 'D1', name: '东片区',   buildings: 22, color: '#1f6feb' },
  { id: 'D2', name: '南片区',   buildings: 20, color: '#16a34a' },
  { id: 'D3', name: '西片区',   buildings: 19, color: '#d97706' },
  { id: 'D4', name: '北片区',   buildings: 18, color: '#7c3aed' },
  { id: 'D5', name: '中片区',   buildings: 16, color: '#0891b2' },
  { id: 'D6', name: '滨河片区', buildings: 13, color: '#db2777' }
];

function buildBuildings() {
  const list = [];
  let n = 1;
  const DEMAND = [5,4,6,3,7,2,4,3,6,5,2,4];
  const SUPPLY = [2,3,1,4,2,0,3,5,2,1,3,2];
  DISTRICTS.forEach(d => {
    for (let i = 0; i < d.buildings; i++) {
      // 已开通楼栋：东片区前 5 栋试点 + 部分南/西片区
      const opened = n <= 5 || [24, 25, 47, 48, 66].includes(n);
      list.push({
        id: 'B' + String(n).padStart(3, '0'),
        name: n + '号楼',
        district: d.id,
        districtName: d.name,
        units: n % 3 === 0 ? 3 : 2,
        households: 24 + (n % 5) * 6,
        coordinator: n % 7 === 0 ? null : ('协调人 ' + n + '号'),
        coordinatorSet: n % 7 !== 0,
        opened: opened,
        pilot: n <= 5,
        supply: SUPPLY[n % 12],
        demand: DEMAND[n % 12]
      });
      n++;
    }
  });
  return list;
}
const BUILDINGS = buildBuildings();

/* 服务品类（A/B/C 三类，含必填字段与门槛配置） */
const CATEGORIES = [
  { id: 'A1', risk: 'A', name: '代取快递/外卖', icon: '📦', guide: '3—5 元/次', scene: '帮我取个快递',
    needLv: 1, agreement: null, insurance: false,
    fields: [
      { k: '取件点', req: true }, { k: '取件码后四位', req: true, mask: true },
      { k: '期望送达时间', req: true }, { k: '包裹来源声明', req: true, declare: true }
    ] },
  { id: 'A2', risk: 'A', name: '代扔垃圾/代买菜', icon: '🧺', guide: '3—5 元/次', scene: '顺路帮我带一下',
    needLv: 1, agreement: null, insurance: false,
    fields: [{ k: '代办内容', req: true }, { k: '预算上限', req: true }, { k: '期望时间', req: true }] },
  { id: 'A3', risk: 'A', name: '共享工具/闲置借还', icon: '🔧', guide: '押金或信用免押', scene: '借个电钻',
    needLv: 1, agreement: null, insurance: false,
    fields: [{ k: '物品名称', req: true }, { k: '借用时长', req: true }, { k: '押金方式', req: true }] },
  { id: 'A4', risk: 'A', name: '简单遛狗/上门喂猫', icon: '🐕', guide: '10—15 元/次', scene: '出门几天，找人喂猫',
    needLv: 1, agreement: null, insurance: false,
    fields: [{ k: '宠物类型', req: true }, { k: '喂食要求', req: true }, { k: '上门时段', req: true }] },
  { id: 'A5', risk: 'A', name: '临时照看花草', icon: '🪴', guide: '5—10 元/次', scene: '帮我浇花',
    needLv: 1, agreement: null, insurance: false,
    fields: [{ k: '植物数量', req: true }, { k: '浇水频次', req: true }, { k: '是否需要通风', req: false }] },

  { id: 'B1', risk: 'B', name: '宠物短期寄养/多日喂养', icon: '🏠', guide: '40—80 元/天', scene: '假期寄养',
    needLv: 2, agreement: 'AG-PET', insurance: true, special: 'pet',
    fields: [
      { k: '宠物健康状况', req: true }, { k: '是否用药', req: true },
      { k: '紧急联系人', req: true }, { k: '医疗费用上限', req: true },
      { k: '寄养天数', req: true }, { k: '服务前状态照片', req: true, photo: true }
    ] },
  { id: 'B2', risk: 'B', name: '家政保洁/简单维修', icon: '🧽', guide: '30—50 元/小时', scene: '家里需要保洁',
    needLv: 2, agreement: 'AG-HOME', insurance: true,
    fields: [{ k: '服务内容', req: true }, { k: '房屋面积', req: true }, { k: '期望时段', req: true }] },
  { id: 'B3', risk: 'B', name: '帮接娃/放学接送', icon: '🎒', guide: '15—25 元/次', scene: '今天来不及接孩子',
    needLv: 2, agreement: 'AG-KID', insurance: true, special: 'kid',
    fields: [
      { k: '学校名称', req: true }, { k: '放学时间', req: true },
      { k: '交接方式', req: true }, { k: '家长确认码', req: true, code: true },
      { k: '固定路线', req: true }, { k: '是否短时过渡（仅限）', req: true }
    ] },
  { id: 'B4', risk: 'B', name: '陪诊/陪老人办事', icon: '🏥', guide: '40—60 元/小时', scene: '陪老人去医院',
    needLv: 2, agreement: 'AG-ELDER', insurance: true,
    fields: [{ k: '就医机构', req: true }, { k: '陪同时段', req: true }, { k: '是否需要轮椅', req: false }] },
  { id: 'B5', risk: 'B', name: '跑腿代办（证件/钥匙）', icon: '🔑', guide: '10—20 元/次', scene: '帮送一份文件',
    needLv: 2, agreement: 'AG-ITEM', insurance: true, special: 'parcel',
    fields: [
      { k: '物品类型', req: true }, { k: '送达地址', req: true },
      { k: '交接方式', req: true }, { k: '物品来源声明', req: true, declare: true }
    ] },

  { id: 'C1', risk: 'C', name: '长期看孩子/全日托育', icon: '👶', guide: '机构定价', scene: '找托育',
    needLv: 99, orgOnly: true,
    reason: '涉及托育资质、消防、食品安全、人员背景审查，未备案的"黑托管"存在明确安全漏洞',
    orgTypes: ['社区嵌入式托育点', '备案托育机构'] },
  { id: 'C2', risk: 'C', name: '养老照护（助浴/康复/失能）', icon: '🧓', guide: '机构定价', scene: '老人照护',
    needLv: 99, orgOnly: true,
    reason: '涉及生命安全和专业边界，必须由持证护理员或机构承接',
    orgTypes: ['养老服务机构', '持证护理机构'] },
  { id: 'C3', risk: 'C', name: '涉及医疗行为的陪护', icon: '💉', guide: '机构定价', scene: '医疗陪护',
    needLv: 99, orgOnly: true,
    reason: '平台红线拦截：涉及医疗行为的陪护不允许普通居民接单',
    orgTypes: ['持证医疗机构', '专业陪护机构'] }
];

/* 信任三层 */
const TRUST_LEVELS = [
  { lv: 1, name: '真实邻居', color: '#1f6feb',
    how: '手机号 + 楼栋房号核验，对接物业住户数据或上传房产/租赁证明',
    unlock: '解锁 A 类服务', count: 1284 },
  { lv: 2, name: '平台认可', color: '#16a34a',
    how: '实名认证 + 人脸核验 + 无犯罪记录承诺（接娃、上门、宠物多日必须）+ 品类资质',
    unlock: '解锁 B 类服务', count: 216 },
  { lv: 3, name: '社区信赖', color: '#7c3aed',
    how: '基于完成单量、评价、纠纷记录、楼栋长推荐形成的动态等级',
    unlock: '高风险服务派单优先级倾斜', count: 47 }
];

/* 服务者 */
const PROVIDERS = [
  { id: 'P001', name: '王秀兰', building: 'B012', district: 'D1', lv: 3, score: 96, cats: ['A1','A2','A4','B1'],
    orders: 143, rating: 4.9, disputes: 0, income: 2860, frozen: 0,
    certs: [
      { n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'ok' },
      { n: '无犯罪记录承诺', s: 'ok' }, { n: '养宠经验证明', s: 'ok' }
    ] },
  { id: 'P002', name: '李建国', building: 'B012', district: 'D1', lv: 2, score: 88, cats: ['A1','A3','B2'],
    orders: 62, rating: 4.8, disputes: 0, income: 1240, frozen: 0,
    certs: [
      { n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'ok' },
      { n: '健康证', s: 'warn', exp: '2026-12-08' }, { n: '居家上门服务证', s: 'ok' }
    ] },
  { id: 'P003', name: '陈晓雯', building: 'B013', district: 'D1', lv: 3, score: 94, cats: ['A1','A4','B1','B3'],
    orders: 118, rating: 4.9, disputes: 1, income: 2140, frozen: 0,
    certs: [
      { n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'ok' },
      { n: '无犯罪记录核验', s: 'ok' }, { n: '养宠经验证明', s: 'ok' }
    ] },
  { id: 'P004', name: '张卫东', building: 'B024', district: 'D2', lv: 2, score: 82, cats: ['A1','A2','B2','B4'],
    orders: 45, rating: 4.6, disputes: 0, income: 860, frozen: 0,
    certs: [
      { n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'ok' }, { n: '健康证', s: 'expired', exp: '2026-10-15' }
    ] },
  { id: 'P005', name: '刘海燕', building: 'B035', district: 'D2', lv: 1, score: 71, cats: ['A1','A2'],
    orders: 12, rating: 4.5, disputes: 0, income: 145, frozen: 0,
    certs: [{ n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'pending' }] },
  { id: 'P006', name: '赵国强', building: 'B047', district: 'D3', lv: 3, score: 91, cats: ['A3','B2'],
    orders: 87, rating: 4.8, disputes: 0, income: 1780, frozen: 150,
    certs: [
      { n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'ok' }, { n: '居家上门服务证', s: 'ok' }
    ] },
  { id: 'P007', name: '孙丽华', building: 'B058', district: 'D3', lv: 2, score: 85, cats: ['A1','A4','B1'],
    orders: 53, rating: 4.7, disputes: 0, income: 980, frozen: 0,
    certs: [
      { n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'ok' }, { n: '养宠经验证明', s: 'ok' }
    ] },
  { id: 'P008', name: '周建军', building: 'B066', district: 'D4', lv: 2, score: 79, cats: ['A1','A2','B5'],
    orders: 38, rating: 4.4, disputes: 2, income: 620, frozen: 20,
    certs: [{ n: '实名认证', s: 'ok' }, { n: '人脸核验', s: 'ok' }] }
];

/* 订单 */
const ORDERS = [
  { id: 'JH0612001', catId: 'A1', risk: 'A', demander: '业主 12-3-502', provider: '王秀兰', providerId: 'P001',
    building: 'B012', district: 'D1', amount: 5, status: 'doing', createdAt: '11-06 09:12', match: '同楼栋',
    addr: '12 号楼 3 单元 502', addrVisible: true,
    fields: { '取件点': '小区北门菜鸟驿站', '取件码后四位': '••••', '期望送达时间': '今天 12:00 前', '包裹来源声明': '已声明' },
    proofs: [
      { s: '服务前', t: '取件码脱敏展示', time: '09:14', img: true, ok: true },
      { s: '服务中', t: '驿站取件拍照', time: '09:41', img: true, ok: true },
      { s: '服务后', t: '待送达拍照签收', time: '', img: false, ok: false }
    ], flags: [] },

  { id: 'JH0612002', catId: 'B3', risk: 'B', demander: '业主 12-1-201', provider: '陈晓雯', providerId: 'P003',
    building: 'B012', district: 'D1', amount: 20, status: 'warning', createdAt: '11-06 08:30', match: '同楼栋',
    addr: '12 号楼 1 单元 201', addrVisible: true,
    fields: { '学校名称': '锦和路第三小学', '放学时间': '16:30', '交接方式': '校门口家长确认码交接',
      '家长确认码': '••••', '固定路线': '锦和路三小 → 小区东门 → 12 号楼', '是否短时过渡（仅限）': '是' },
    proofs: [
      { s: '服务前', t: '家长确认码已生成', time: '08:32', img: false, ok: true },
      { s: '服务中', t: '实时位置共享中', time: '16:20', img: false, ok: true },
      { s: '服务后', t: '待家长确认签收', time: '', img: false, ok: false }
    ], flags: ['涉及未成年接送', '需楼栋协调人确认交接方式'] },

  { id: 'JH0611004', catId: 'B1', risk: 'B', demander: '业主 24-2-1103', provider: '孙丽华', providerId: 'P007',
    building: 'B024', district: 'D2', amount: 320, status: 'done', createdAt: '11-05 14:20', match: '同片区',
    addr: '24 号楼 2 单元 1103', addrVisible: true,
    fields: { '宠物健康状况': '健康，无既往病史', '是否用药': '否', '紧急联系人': '业主本人 138****6621',
      '医疗费用上限': '¥800', '寄养天数': '4 天', '服务前状态照片': '已上传 3 张' },
    proofs: [
      { s: '服务前', t: '宠物状态拍照已上传', time: '11-05 15:02', img: true, ok: true },
      { s: '服务中', t: '每日反馈已上传（4 天）', time: '11-05 ~ 11-09', img: true, ok: true },
      { s: '服务后', t: '交接确认，双方签收', time: '11-09 18:30', img: true, ok: true }
    ], flags: [] },

  { id: 'JH0611003', catId: 'B2', risk: 'B', demander: '业主 47-2-802', provider: '赵国强', providerId: 'P006',
    building: 'B047', district: 'D3', amount: 150, status: 'dispute', createdAt: '11-04 10:00', match: '同片区',
    addr: '47 号楼 2 单元 802', addrVisible: true,
    fields: { '服务内容': '厨房深度保洁 + 油烟机清洗', '房屋面积': '89㎡', '期望时段': '11-05 09:00—12:00' },
    proofs: [
      { s: '服务前', t: '服务范围确认单已签署', time: '11-04 10:05', img: true, ok: true },
      { s: '服务后', t: '完成照片已上传', time: '11-05 12:10', img: true, ok: true }
    ], flags: ['纠纷处理中', '资金已冻结'] },

  { id: 'JH0611002', catId: 'B5', risk: 'B', demander: '业主 66-1-303', provider: '周建军', providerId: 'P008',
    building: 'B066', district: 'D4', amount: 20, status: 'flagged', createdAt: '11-04 16:10', match: '同片区',
    addr: '66 号楼 1 单元 303', addrVisible: true,
    fields: { '物品类型': '文件袋（未开封）', '送达地址': '锦和路 88 号', '交接方式': '当面交接拍照',
      '物品来源声明': '待核验' },
    proofs: [{ s: '服务前', t: '物品清单已确认', time: '11-04 16:12', img: true, ok: true }],
    flags: ['物品来源待核验', '服务者存在历史纠纷', '已进入人工复核'] },

  { id: 'JH0612007', catId: 'A2', risk: 'A', demander: '业主 12-3-901', provider: null, providerId: null,
    building: 'B012', district: 'D1', amount: 5, status: 'open', createdAt: '11-06 10:45', match: '同楼栋',
    addr: '12 号楼 3 单元 901', addrVisible: false,
    fields: { '代办内容': '代买青菜、鸡蛋', '预算上限': '¥40', '期望时间': '今天 18:00 前' },
    proofs: [], flags: [] },

  { id: 'JH0612006', catId: 'A3', risk: 'A', demander: '业主 13-2-401', provider: null, providerId: null,
    building: 'B013', district: 'D1', amount: 0, status: 'open', createdAt: '11-06 10:20', match: '同楼栋',
    addr: '13 号楼 2 单元 401', addrVisible: false,
    fields: { '物品名称': '冲击电钻', '借用时长': '2 天', '押金方式': '信用免押' },
    proofs: [], flags: [] },

  { id: 'JH0611001', catId: 'A4', risk: 'A', demander: '业主 35-1-601', provider: '刘海燕', providerId: 'P005',
    building: 'B035', district: 'D2', amount: 15, status: 'done', createdAt: '11-05 07:40', match: '同楼栋',
    addr: '35 号楼 1 单元 601', addrVisible: true,
    fields: { '宠物类型': '中华田园猫 ×2', '喂食要求': '早晚各一次，换水', '上门时段': '07:00—08:00' },
    proofs: [
      { s: '服务前', t: '宠物状态拍照', time: '11-05 07:42', img: true, ok: true },
      { s: '服务后', t: '服务反馈 + 照片', time: '11-05 07:58', img: true, ok: true }
    ], flags: [] }
];

/* 协议模板 */
const AGREEMENTS = [
  { id: 'AG-PET', name: '宠物短期托管协议', cat: 'B1', ver: 'v2.1', user: 2, provider: 1,
    items: ['宠物健康状况申报', '服务前后照片留存', '紧急医疗授权与费用上限', '走失/伤病责任划分'] },
  { id: 'AG-HOME', name: '居家上门服务协议', cat: 'B2', ver: 'v1.8', user: 2, provider: 1,
    items: ['服务范围确认单', '物品损坏赔偿标准', '上门人员身份核验', '平台居间责任声明'] },
  { id: 'AG-KID', name: '接送服务协议', cat: 'B3', ver: 'v3.0', user: 3, provider: 1,
    items: ['固定路线与时间', '家长确认码交接', '不替代监护责任声明', '实时位置共享'] },
  { id: 'AG-ELDER', name: '陪诊服务协议', cat: 'B4', ver: 'v1.4', user: 2, provider: 1,
    items: ['不涉医疗决策', '责任边界书面化', '过程留痕要求', '突发情况处置流程'] },
  { id: 'AG-ITEM', name: '物品代办协议', cat: 'B5', ver: 'v1.2', user: 2, provider: 1,
    items: ['物品清单确认', '身份双验证', '交接拍照', '违禁品禁止条款'] }
];

/* 纠纷工单 */
const TICKETS = [
  { id: 'TK-1105-03', orderId: 'JH0611003', type: '服务质量争议', risk: 'B',
    parties: '业主 47-2-802 / 赵国强', openedAt: '11-05 13:20', sla: 48, elapsed: 22,
    status: '平台处理中', owner: '平台运营 · 张敏', stage: 'platform', amount: 150,
    desc: '需求方主张油烟机清洗未达到约定效果，要求部分退款；服务者主张已完成约定内容。',
    evidence: ['服务前确认单', '完成照片', '双方聊天记录'] },
  { id: 'TK-1104-07', orderId: 'JH0611002', type: '异常物品核验', risk: 'B',
    parties: '业主 66-1-303 / 周建军', openedAt: '11-04 17:40', sla: 24, elapsed: 21,
    status: '楼栋初调中', owner: '楼栋协调人 · 66 号楼', stage: 'coord', amount: 20,
    desc: '代送物品来源不明，触发违禁品拦截规则，已暂停订单并通知双方。',
    evidence: ['物品清单', '交接照片', '物品来源声明'] },
  { id: 'TK-1101-12', orderId: 'JH0611004', type: '宠物喂养纠纷', risk: 'B',
    parties: '业主 24-2-1103 / 孙丽华', openedAt: '11-01 20:10', sla: 48, elapsed: 48,
    status: '已关闭', owner: '平台运营 · 张敏', stage: 'closed', amount: 240,
    desc: '需求方反映宠物出现应激反应。经核验服务前后照片与每日反馈，服务者流程完整，双方协商和解。',
    evidence: ['服务前状态照片', '每日反馈', '兽医诊断记录'] }
];

/* 风险预警规则 */
const RISK_RULES = [
  { key: 'minor', name: '涉及未成年接送', level: 'high', action: '强制人工复核 + 楼栋协调人确认', hit: 3 },
  { key: 'petlong', name: '多日宠物寄养（≥3 天）', level: 'mid', action: '校验书面协议 + 医疗授权', hit: 5 },
  { key: 'elder', name: '老人陪护 / 陪诊', level: 'high', action: '校验责任边界协议 + 保险生效', hit: 2 },
  { key: 'item', name: '证件/钥匙类代办', level: 'mid', action: '物品来源声明 + 身份双验证', hit: 4 },
  { key: 'price', name: '高额报酬异常订单', level: 'high', action: '拦截并人工核查', hit: 1 },
  { key: 'newbie', name: '低信任等级接高风险单', level: 'high', action: '拦截（信任等级不足）', hit: 6 },
  { key: 'unopened', name: '未开通楼栋发布需求', level: 'mid', action: '拒绝发单，仅可浏览', hit: 0 }
];

/* 违禁词与风控规则 */
const RISK_WORDS = [
  { type: '违禁品', words: ['香烟', '酒', '药品', '处方药', '现金', '证件原件'], action: '直接拦截，订单不予发布' },
  { type: '异常报酬', rule: '单笔报酬 > 指导价 5 倍', action: '转人工核查，暂不派单' },
  { type: '来源声明', rule: '代取/代办类未勾选来源声明', action: '禁止提交' },
  { type: '高频异常', rule: '同一服务者 24h 内代取 > 10 单', action: '限流 + 人工复核' },
  { type: '敏感地址', rule: '送达地址为政府机关/学校内部', action: '人工审核' }
];

/* 信用分规则（双向） */
const CREDIT_RULES = [
  { side: '服务者', items: [
    { k: '按时完成订单', v: '+2' }, { k: '获得好评', v: '+1' },
    { k: '超时未到', v: '−3' }, { k: '纠纷败诉', v: '−5' }, { k: '证件过期仍接单', v: '−8' }
  ] },
  { side: '需求方', items: [
    { k: '正常完成订单', v: '+1' }, { k: '虚假需求', v: '−5' },
    { k: '恶意差评', v: '−5' }, { k: '放鸽子', v: '−3' }, { k: '拒付已确认订单', v: '−6' }
  ] }
];

/* 机构（C 类） */
const AGENCIES = [
  { id: 'G01', name: '锦和苑社区嵌入式托育点', type: '托育', cat: 'C1', status: '已签约',
    certs: ['托育机构备案证明', '消防安全检查合格', '食品经营许可证', '保育员资格证 ×6'],
    price: '2800—3600 元/月', rating: 4.7, reviews: 38, contract: '2026-03-01 ~ 2027-02-28' },
  { id: 'G02', name: '安康养老服务中心', type: '养老照护', cat: 'C2', status: '已签约',
    certs: ['养老机构设立许可', '护理员执业证 ×12', '医疗急救资质'],
    price: '按服务项计价，助浴 120 元/次起', rating: 4.6, reviews: 52, contract: '2026-01-15 ~ 2028-01-14' },
  { id: 'G03', name: '净家持证家政', type: '持证家政', cat: 'C2', status: '审核中',
    certs: ['营业执照', '家政服务资质', '员工健康证 ×15'],
    price: '45—80 元/小时', rating: 4.5, reviews: 21, contract: '待签署' },
  { id: 'G04', name: '仁和医疗陪护', type: '医疗陪护', cat: 'C3', status: '已签约',
    certs: ['医疗机构执业许可', '陪护员资格证 ×8'],
    price: '按陪护等级计价', rating: 4.8, reviews: 17, contract: '2026-04-01 ~ 2027-03-31' }
];

/* 拼单 / 轮值 */
const GROUPS = [
  { id: 'GR01', type: '接娃拼单', name: '锦和路三小 · 12 号楼固定轮值', members: 5, need: 6,
    schedule: '周一至周五 16:30', building: 'B012', status: '招募中',
    note: '固定家长轮值，平台只做协调与交接确认，不替代监护责任' },
  { id: 'GR02', type: '团购自提', name: '南片区生鲜自提点代管', members: 12, need: 12,
    schedule: '每周三、周六', building: 'B024', status: '已满员',
    note: '自提点由轮值住户代管，平台提供签到与交接工具' },
  { id: 'GR03', type: '寒暑假看护拼班', name: '寒假作业看护拼班（低年级）', members: 4, need: 8,
    schedule: '寒假工作日 09:00—11:30', building: 'B047', status: '招募中',
    note: '拼班形式规避托育资质红线，仅限作业看护，不涉及全日托育' }
];

/* 常用订单订阅 */
const SUBSCRIPTIONS = [
  { id: 'SB01', name: '每周三代取快递', cat: 'A1', cycle: '每周三 18:00', building: 'B012', price: 5, status: '生效中', next: '11-11 18:00' },
  { id: 'SB02', name: '每周六上午保洁', cat: 'B2', cycle: '每周六 09:00', building: 'B047', price: 120, status: '生效中', next: '11-14 09:00' },
  { id: 'SB03', name: '工作日喂猫', cat: 'A4', cycle: '工作日 07:30', building: 'B035', price: 15, status: '已暂停', next: '—' }
];

/* 共享工具 */
const SHARED_TOOLS = [
  { id: 'T01', name: '冲击电钻', owner: '李建国 · 12 号楼', deposit: '信用免押', status: '可借', building: 'B012' },
  { id: 'T02', name: '人字梯（2.5m）', owner: '赵国强 · 47 号楼', deposit: '押金 ¥50', status: '已借出', building: 'B047' },
  { id: 'T03', name: '露营帐篷（4 人）', owner: '孙丽华 · 58 号楼', deposit: '押金 ¥100', status: '可借', building: 'B058' },
  { id: 'T04', name: '儿童绘本套装', owner: '王秀兰 · 12 号楼', deposit: '信用免押', status: '可借', building: 'B012' }
];

/* 消息通知 */
const NOTICES = [
  { id: 'N1', type: '接单', text: '王秀兰 已接单「代取快递」，预计 30 分钟内送达', time: '09:14', order: 'JH0612001', read: false },
  { id: 'N2', type: '出发', text: '陈晓雯 已出发前往锦和路第三小学', time: '16:10', order: 'JH0612002', read: false },
  { id: 'N3', type: '风险', text: '订单「帮接娃」已进入人工复核，需您确认交接方式', time: '08:35', order: 'JH0612002', read: false },
  { id: 'N4', type: '完成', text: '孙丽华 已完成「宠物短期寄养」，请确认签收', time: '11-09 18:30', order: 'JH0611004', read: true },
  { id: 'N5', type: '冻结', text: '订单「家政保洁」进入纠纷流程，资金 ¥150 已冻结', time: '11-05 13:22', order: 'JH0611003', read: true }
];

/* 审核队列 */
const AUDIT_QUEUE = [
  { id: 'AU01', type: '住户核验', name: '业主 12-2-701', detail: '上传租赁合同 + 身份证，房号 12-2-701',
    submit: '11-06 09:10', status: '待审核', auto: '自动核验通过（物业数据匹配）', risk: 'low' },
  { id: 'AU02', type: '住户核验', name: '业主 24-1-502', detail: '房产证照片模糊，需人工复核', submit: '11-06 08:40', status: '待人工', auto: '—', risk: 'mid' },
  { id: 'AU03', type: '服务者认证', name: '刘海燕 · 35 号楼', detail: '人脸核验待完成，A 类资质已过',
    submit: '11-05 16:20', status: '待人工', auto: '实名已通过', risk: 'low' },
  { id: 'AU04', type: '服务者认证', name: '周建军 · 66 号楼', detail: '申请 B5 跑腿代办资质，历史 2 起纠纷',
    submit: '11-04 17:10', status: '已暂停', auto: '实名已通过', risk: 'high' },
  { id: 'AU05', type: '机构资质', name: '净家持证家政', detail: '申请 C 类机构入驻，待补充员工健康证',
    submit: '11-03 10:00', status: '待补充', auto: '营业执照已核验', risk: 'mid' }
];

/* ============================================================
   工具函数
   ============================================================ */
const Data = {
  catById: id => CATEGORIES.find(c => c.id === id),
  buildingById: id => BUILDINGS.find(b => b.id === id),
  districtById: id => DISTRICTS.find(d => d.id === id),
  providerById: id => PROVIDERS.find(p => p.id === id),
  orderById: id => ORDERS.find(o => o.id === id),
  featureById: id => ALL_FEATURES.find(f => f.id === id),
  riskLabel: r => ({ A: '低风险', B: '中风险', C: '高风险' }[r] || r),
  riskClass: r => ({ A: 'tag-a', B: 'tag-b', C: 'tag-c' }[r] || 'tag-gray'),
  statusLabel: s => ({
    open: '待接单', doing: '服务中', done: '已完成', warning: '风险复核中',
    flagged: '已拦截', dispute: '纠纷处理中', cancelled: '已取消'
  }[s] || s),
  statusClass: s => ({
    open: 'tag-brand', doing: 'tag-warn', done: 'tag-ok', warning: 'tag-warn',
    flagged: 'tag-danger', dispute: 'tag-danger', cancelled: 'tag-gray'
  }[s] || 'tag-gray'),
  initials: n => n ? n.slice(0, 2) : '—',
  avatarColor: n => {
    const cs = ['#1f6feb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777'];
    let h = 0;
    for (let i = 0; i < (n || '').length; i++) h = (h * 31 + n.charCodeAt(i)) % 997;
    return cs[h % cs.length];
  },
  trustDots: lv => {
    let s = '';
    for (let i = 1; i <= 3; i++) s += '<i class="' + (i <= lv ? 'on' : '') + '"></i>';
    return '<span class="trust lv' + lv + '">' + s + '</span>';
  },
  trustName: lv => ({ 1: '真实邻居', 2: '平台认可', 3: '社区信赖' }[lv] || '未认证'),
  // 智能匹配排序：同楼栋 → 同片区 → 全小区
  matchProviders: (catId, buildingId) => {
    const cat = Data.catById(catId);
    const b = Data.buildingById(buildingId);
    if (!cat) return { sameBuilding: [], sameDistrict: [], all: [], mode: 'none', need: 0, blocked: 0 };
    if (cat.risk === 'C') return { sameBuilding: [], sameDistrict: [], all: [], mode: 'C', need: 99, blocked: 0, orgOnly: true };
    const pool = PROVIDERS.filter(p => p.cats.includes(catId));
    const need = cat.needLv;
    const eligible = pool.filter(p => p.lv >= need);
    return {
      sameBuilding: eligible.filter(p => p.building === buildingId),
      sameDistrict: b ? eligible.filter(p => p.district === b.district && p.building !== buildingId) : [],
      all: eligible,
      mode: cat.risk,
      need: need,
      blocked: pool.length - eligible.length,
      // A 类优先同楼栋；B 类可全小区
      scope: cat.risk === 'A' ? '同楼栋优先' : '同楼栋 → 同片区 → 全小区'
    };
  }
};
