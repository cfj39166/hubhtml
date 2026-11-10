/* ============================================================
   registry.js — 工具注册表
   首页 / 搜索 / 收藏 / 最近使用 全部由注册表驱动；
   新增工具只需在此登记一条定义。
   ============================================================ */
window.LH = window.LH || {};

(function (LH) {
  'use strict';

  LH.cats = [
    { id: 'calc', name: '计算换算', emoji: '🧮' },
    { id: 'scan', name: '扫描识别', emoji: '📷' },
    { id: 'record', name: '记录提醒', emoji: '📝' },
    { id: 'health', name: '健康生活', emoji: '🌿' },
    { id: 'home', name: '家居出行', emoji: '🏠' },
    { id: 'office', name: '学习办公', emoji: '📚' }
  ];

  /*
   * 字段：id 唯一标识 / name 名称 / icon emoji / desc 一句话说明
   * cat 分类 / kw 关键词(含拼音与别名，供搜索) / online 是否需联网
   * impl 在 LH.impls 中注册的渲染函数名
   */
  LH.catalog = [
    /* —— 计算换算 —— */
    { id: 'calculator', name: '计算器', icon: '🧮', cat: 'calc', desc: '基础 + 科学计算，带历史记录', kw: ['jisuanqi', 'jsq', 'calc', 'counter', '算数', '算术'], impl: 'calculator' },
    { id: 'unit-convert', name: '单位换算', icon: '📏', cat: 'calc', desc: '长度 / 重量 / 面积 / 温度 / 数据等 8 类', kw: ['danwei', 'huansuan', 'dwhs', 'convert', 'unit', '换算器', '进制', '长度换算', '重量换算', '汇率'], impl: 'unit-convert' },
    { id: 'date-calc', name: '日期计算', icon: '📅', cat: 'calc', desc: '间隔天数 / 工作日 / 日期加减', kw: ['riqi', 'riqijisuan', 'rqjs', 'date', '天数', '倒计时天数', '工作日'], impl: 'date-calc' },
    { id: 'age-calc', name: '年龄计算', icon: '🎂', cat: 'calc', desc: '精确到天，附生肖星座与下次生日', kw: ['nianling', 'nljs', 'age', '生日', '属相', '星座', '周岁', '虚岁'], impl: 'age-calc' },
    { id: 'mortgage', name: '房贷计算', icon: '🏠', cat: 'calc', desc: '等额本息 / 等额本金，商贷公积金', kw: ['fangdai', 'fd', 'mortgage', '贷款', '月供', '车贷', '利率', 'lpr'], impl: 'mortgage' },
    { id: 'tax', name: '个税计算', icon: '💰', cat: 'calc', desc: '月薪个税与税后收入估算', kw: ['geshui', 'gs', 'tax', '税后', '工资', '五险一金', 'salary'], impl: 'tax' },
    { id: 'discount', name: '折扣 / AA', icon: '🏷️', cat: 'calc', desc: '打折满减算价 + 聚餐 AA 分摊', kw: ['zhekou', 'zk', 'aa', 'manjian', 'discount', '打折', '优惠', '满减', '拼单', '均摊'], impl: 'discount' },
    { id: 'rmb-case', name: '大写金额', icon: '💴', cat: 'calc', desc: '数字金额转人民币大写', kw: ['daxie', 'daxe', 'rmb', '金额大写', '大写转换', '发票', '合同'], impl: 'rmb-case' },
    { id: 'radix', name: '进制转换', icon: '🔢', cat: 'calc', desc: '二进制 / 八 / 十 / 十六进制互转', kw: ['jinzhi', 'jzzh', 'radix', 'binary', 'hex', '二进制', '十六进制', '程序员'], impl: 'radix' },
    { id: 'random', name: '随机决定', icon: '🎲', cat: 'calc', desc: '随机数 / 骰子 / 硬币 / 抽签帮你选', kw: ['suiji', 'sj', 'random', '骰子', '色子', '硬币', '抽签', '决定', '转盘', 'randomizer'], impl: 'random' },
    { id: 'kinship', name: '亲戚称呼', icon: '👨‍👩‍👧', cat: 'calc', desc: '过年不再叫错人，称呼一键算', kw: ['qinqi', 'qqch', 'kinship', '称呼', '辈分', '亲戚计算', '拜年', '舅舅', '姑姑'], impl: 'kinship' },

    /* —— 扫描识别 —— */
    { id: 'qr-gen', name: '二维码生成', icon: '🔳', cat: 'scan', desc: '文本 / 网址转二维码，可保存图片', kw: ['erma', 'ewm', 'qrcode', 'qr', '二维码制作', '生成二维码', '扫我'], impl: 'qr-gen', online: 'first' },
    { id: 'qr-scan', name: '扫码识别', icon: '📷', cat: 'scan', desc: '相机扫码 / 识别图片中的二维码', kw: ['saoma', 'sm', 'scan', 'qrcode', '扫描', '扫一扫', '识别二维码'], impl: 'qr-scan', online: 'first' },

    /* —— 记录提醒 —— */
    { id: 'todo', name: '待办清单', icon: '✅', cat: 'record', desc: '待办事项与购物清单，支持优先级', kw: ['daiban', 'db', 'todo', '清单', '任务', 'todolist', '购物清单', '事项'], impl: 'todo' },
    { id: 'notes', name: '备忘录', icon: '📝', cat: 'record', desc: '随手记，账号地址灵感都存这', kw: ['beiwang', 'bw', 'note', '备忘', '记事本', '笔记', 'notebook'], impl: 'notes' },
    { id: 'ledger', name: '简单记账', icon: '📒', cat: 'record', desc: '收支记录、分类统计、月度报表', kw: ['jizhang', 'jz', 'ledger', 'account', '账本', '记账本', '收支', '开销', '花钱'], impl: 'ledger' },
    { id: 'habit', name: '习惯打卡', icon: '🌱', cat: 'record', desc: '坚持打卡，看连续天数与统计', kw: ['xiguan', 'xg', 'habit', '打卡', '签到', '坚持', '早睡', '运动'], impl: 'habit' },
    { id: 'water', name: '喝水提醒', icon: '💧', cat: 'record', desc: '记录每日饮水，定时提醒喝水', kw: ['heshui', 'hs', 'water', '喝水记录', '饮水', '补水', '水杯'], impl: 'water' },
    { id: 'meds', name: '吃药提醒', icon: '💊', cat: 'record', desc: '药品与服药时间管理提醒', kw: ['chiyao', 'cy', 'meds', 'medicine', '服药', '药物', '按时吃药', '提醒吃药'], impl: 'meds' },
    { id: 'anniversary', name: '生日纪念日', icon: '🎂', cat: 'record', desc: '倒数日：生日、纪念日、重要日子', kw: ['jinianri', 'jnr', 'sr', 'anniversary', '生日提醒', '倒数', 'countdown', '纪念日倒数', '情侣'], impl: 'anniversary' },
    { id: 'timer', name: '倒计时 / 秒表', icon: '⏱️', cat: 'record', desc: '倒计时提醒 + 精确到百分秒秒表', kw: ['daojishi', 'djs', 'miaobiao', 'timer', 'stopwatch', '计时器', '跑表', '计次'], impl: 'timer' },
    { id: 'pomodoro', name: '番茄钟', icon: '🍅', cat: 'record', desc: '25 分钟专注法，统计每日番茄', kw: ['fanqie', 'fqz', 'pomodoro', '番茄工作法', '专注', '学习计时', '工作计时'], impl: 'pomodoro' },
    { id: 'password', name: '密码生成器', icon: '🔐', cat: 'record', desc: '随机强密码，本地生成不上传', kw: ['mima', 'mmsc', 'password', 'generator', '随机密码', '安全密码', '密码'], impl: 'password' },

    /* —— 健康生活 —— */
    { id: 'bmi', name: 'BMI 计算', icon: '⚖️', cat: 'health', desc: '体质指数 + 基础代谢 + 每日消耗', kw: ['bmi', 'tizhi', '体重', '减肥', '肥胖', '代谢', '热量', 'bmr', 'tdee'], impl: 'bmi' },
    { id: 'garbage', name: '垃圾分类', icon: '♻️', cat: 'health', desc: '常见物品分类速查', kw: ['laji', 'ljfl', 'garbage', '垃圾分类查询', '投放', '环保', '干湿垃圾'], impl: 'garbage' },
    { id: 'weather', name: '天气查询', icon: '🌤️', cat: 'health', desc: '实时天气与未来 7 天预报', kw: ['tianqi', 'tq', 'weather', '天气预报', '气温', '下雨', '降温'], impl: 'weather', online: true },

    /* —— 家居出行 —— */
    { id: 'flashlight', name: '手电筒', icon: '🔦', cat: 'home', desc: '屏幕照明：白光 / 红光 / SOS', kw: ['shoudiantong', 'sdt', 'flashlight', '照明', '灯', 'sos', '夜灯'], impl: 'flashlight' },

    /* —— 学习办公 —— */
    { id: 'text-count', name: '字数统计', icon: '📄', cat: 'office', desc: '中英文字数、行数、段落统计', kw: ['zishu', 'zs', 'count', '字数', '字符统计', '统计字数', '论文'], impl: 'text-count' }
  ];

  LH.toolById = function (id) {
    return LH.catalog.filter(function (t) { return t.id === id; })[0] || null;
  };

  /* 搜索：名称 / 说明 / 关键词（含拼音全拼与首字母） */
  LH.searchTools = function (q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return [];
    return LH.catalog.filter(function (t) {
      if (t.name.toLowerCase().indexOf(q) >= 0) return true;
      if (t.desc.indexOf(q) >= 0) return true;
      return (t.kw || []).some(function (k) {
        var kk = k.toLowerCase();
        return kk === q || kk.indexOf(q) === 0 || (q.length >= 2 && kk.indexOf(q) >= 0);
      });
    });
  };

  /* 默认推荐（无收藏时首页展示） */
  LH.defaultFavs = ['calculator', 'todo', 'qr-gen', 'unit-convert', 'ledger', 'date-calc', 'water', 'garbage'];

  /* 场景合集模板：一键导入为待办 */
  LH.scenes = [
    {
      id: 'travel', name: '旅行清单', emoji: '🧳', desc: '出发前 12 件事，一个不落',
      items: ['✅ 证件：身份证/护照/学生证', '✅ 手机充电器 + 充电宝', '✅ 换洗衣物（按天数+1）', '✅ 洗漱用品与防晒', '✅ 常用药品：感冒药/创可贴/晕车药', '✅ 检查酒店/机票订单', '✅ 现金与银行卡', '✅ 雨伞或雨衣', '✅ 提前值机选座', '✅ 告知家人行程', '✅ 家里电器断电、关燃气', '✅ 垃圾带走、浇好植物']
    },
    {
      id: 'move', name: '搬家清单', emoji: '📦', desc: '搬家不慌，按步骤来',
      items: ['✅ 确定搬家日期，预约搬家公司', '✅ 提前打包不常用物品', '✅ 贵重物品单独保管', '✅ 证件文件集中收纳', '✅ 联系宽带迁移或注销', '✅ 更新收货地址', '✅ 水电燃气结清并过户', '✅ 冰箱提前断电除霜', '✅ 新家水电检查', '✅ 到货后清点物品数量']
    },
    {
      id: 'rent', name: '租房检查', emoji: '🔑', desc: '看房/收房照着查，避开坑',
      items: ['✅ 水压与热水器是否正常', '✅ 电路与插座逐个测试', '✅ 门锁更换或加换', '✅ 窗户密封与纱窗', '✅ 墙面有无渗水霉斑', '✅ 家具家电清单拍照留存', '✅ 水电燃气表底数拍照', '✅ 周边环境：菜场/地铁/噪音', '✅ 押金与合同条款逐条确认', '✅ 房东身份证与房产证核对']
    },
    {
      id: 'school', name: '开学清单', emoji: '🎒', desc: '新学期装备一站备齐',
      items: ['✅ 笔袋：笔/橡皮/尺子/修正带', '✅ 笔记本与错题本', '✅ 书包检查替换', '✅ 水杯/餐具/纸巾', '✅ 住宿生：被褥与洗漱用品', '✅ 常备药品', '✅ 检查暑假作业', '✅ 调整作息，早睡早起', '✅ 新课预习计划', '✅ 校历与课表保存']
    },
    {
      id: 'cny', name: '春节回家', emoji: '🧨', desc: '过年回家要带的都在这',
      items: ['✅ 抢票：候补 + 多渠道', '✅ 给爸妈的礼物', '✅ 给小辈的红包备好', '✅ 自己的厚衣服', '✅ 老家特产采购清单', '✅ 工作交接安排', '✅ 宠物寄养/同行安排', '✅ 浇花、断电、锁门', '✅ 身份证随身检查', '✅ 提前祝一路顺风 🎉']
    }
  ];
})(window.LH);
