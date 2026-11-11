(function () {
  'use strict';

  const ROLES = {
    assault: {
      id: 'assault',
      label: '突击',
      en: 'ASSAULT',
      color: '#e47b52'
    },
    engineer: {
      id: 'engineer',
      label: '工程',
      en: 'ENGINEER',
      color: '#d6a850'
    },
    support: {
      id: 'support',
      label: '支援',
      en: 'SUPPORT',
      color: '#7fbd8d'
    },
    recon: {
      id: 'recon',
      label: '侦察',
      en: 'RECON',
      color: '#68a9c8'
    }
  };

  // 名称按实际组队时的常用叫法显示；aliases 用于搜索旧称。
  const OPERATORS = [
    {
      id: 'redwolf',
      name: '红狼',
      en: 'D-WOLF',
      aliases: ['黑狼'],
      role: 'assault',
      glyph: '狼',
      accent: '#df7047',
      tag: '动力外骨骼 · 机动突进'
    },
    {
      id: 'vyron',
      name: '威龙',
      en: 'VYRON',
      aliases: ['白龙'],
      role: 'assault',
      glyph: '龙',
      accent: '#d08355',
      tag: '虎蹲炮 · 区域压制'
    },
    {
      id: 'unnamed',
      name: '无名',
      en: 'UNNAMED',
      aliases: [],
      role: 'assault',
      glyph: '无',
      accent: '#b98055',
      tag: '隐秘接敌 · 单点突破'
    },
    {
      id: 'gale',
      name: '疾风',
      en: 'GALE',
      aliases: [],
      role: 'assault',
      glyph: '风',
      accent: '#d39a56',
      tag: '高速突进 · 追击收割'
    },
    {
      id: 'wildfire',
      name: '野火',
      en: 'WILDFIRE',
      aliases: [],
      role: 'assault',
      glyph: '火',
      accent: '#e0673f',
      tag: '燃烧压制 · 战线撕裂'
    },
    {
      id: 'shepherd',
      name: '老黑',
      en: 'SHEPHERD',
      aliases: ['牧羊人'],
      role: 'engineer',
      glyph: '黑',
      accent: '#c6a153',
      tag: '声波陷阱 · 后方布防'
    },
    {
      id: 'uluru',
      name: '乌鲁鲁',
      en: 'ULURU',
      aliases: [],
      role: 'engineer',
      glyph: '鲁',
      accent: '#bf8c45',
      tag: '临时工事 · 巡飞弹'
    },
    {
      id: 'bit',
      name: '比特',
      en: 'BIT',
      aliases: [],
      role: 'engineer',
      glyph: '比',
      accent: '#d3a95d',
      tag: '战术道具 · 室内控制'
    },
    {
      id: 'deepblue',
      name: '深蓝',
      en: 'DEEPBLUE',
      aliases: [],
      role: 'engineer',
      glyph: '蓝',
      accent: '#8d9e63',
      tag: '重型护盾 · 正面推进'
    },
    {
      id: 'cryo',
      name: '液氮',
      en: 'CRYO',
      aliases: [],
      role: 'engineer',
      glyph: '氮',
      accent: '#7fa9a4',
      tag: '低温封锁 · 区域减速'
    },
    {
      id: 'stinger',
      name: '蜂医',
      en: 'STINGER',
      aliases: [],
      role: 'support',
      glyph: '蜂',
      accent: '#75b886',
      tag: '激素枪 · 烟幕救援'
    },
    {
      id: 'papillon',
      name: '女医',
      en: 'PAPILLON',
      aliases: ['蝶'],
      role: 'support',
      glyph: '医',
      accent: '#93b48b',
      tag: '医疗支援 · 团队续航'
    },
    {
      id: 'toxik',
      name: '蛊',
      en: 'TOXIK',
      aliases: [],
      role: 'support',
      glyph: '蛊',
      accent: '#95a95d',
      tag: '毒素干扰 · 持续侵蚀'
    },
    {
      id: 'hackclaw',
      name: '麦晓雯',
      en: 'HACKCLAW',
      aliases: ['骇爪'],
      role: 'recon',
      glyph: '麦',
      accent: '#5e9fbd',
      tag: '电子攻防 · 踪迹追踪'
    },
    {
      id: 'luna',
      name: '露娜',
      en: 'LUNA',
      aliases: [],
      role: 'recon',
      glyph: '月',
      accent: '#79a9bd',
      tag: '侦察箭矢 · 电击封锁'
    },
    {
      id: 'silverwing',
      name: '银翼',
      en: 'SILVERWING',
      aliases: [],
      role: 'recon',
      glyph: '翼',
      accent: '#8aa6b2',
      tag: '信息链路 · 远程侦测'
    },
    {
      id: 'echo',
      name: '回响',
      en: 'ECHO',
      aliases: [],
      role: 'recon',
      glyph: '响',
      accent: '#6f9aaa',
      tag: '声学定位 · 战场感知'
    }
  ];

  const ARMOR_LEVELS = [
    { level: 1, roman: 'Ⅰ', name: '一级', color: '#98a095', hint: '轻型' },
    { level: 2, roman: 'Ⅱ', name: '二级', color: '#7ca55d', hint: '标准' },
    { level: 3, roman: 'Ⅲ', name: '三级', color: '#4f9cc7', hint: '加固' },
    { level: 4, roman: 'Ⅳ', name: '四级', color: '#a47acb', hint: '战术' },
    { level: 5, roman: 'Ⅴ', name: '五级', color: '#d4a23e', hint: '精英' },
    { level: 6, roman: 'Ⅵ', name: '六级', color: '#d35d4d', hint: '重装' }
  ];

  // 只保留你指定的干员皮肤；没有列出的干员不显示皮肤选项。
  const SKINS = [
    { id: 'white-dragon', name: '白龙', operatorId: 'vyron', color: '#d9d8ca', color2: '#8b9180' },
    { id: 'black-wolf', name: '黑狼', operatorId: 'redwolf', color: '#5d5f5b', color2: '#242522' },
    { id: 'old-black-red', name: '红', operatorId: 'shepherd', color: '#c94a3d', color2: '#6e211b' },
    { id: 'uluru-red', name: '红皮', operatorId: 'uluru', color: '#d05a3f', color2: '#783024' },
    { id: 'red-medic', name: '红医', operatorId: 'papillon', color: '#d46870', color2: '#7c3038' },
    { id: 'luna-cat', name: '猫猫头', operatorId: 'luna', color: '#c0a6a3', color2: '#735b5a' },
    { id: 'white-wheat', name: '白小麦', operatorId: 'hackclaw', color: '#d7d6c7', color2: '#899083' },
    { id: 'red-wheat', name: '红小麦', operatorId: 'hackclaw', color: '#ca6651', color2: '#713026' },
    { id: 'silver-white', name: '白皮', operatorId: 'silverwing', color: '#cdd7d7', color2: '#7d8e91' }
  ];

  const DEATH_STATES = {
    alive: { id: 'alive', label: '存活', color: '#7fcf8e' },
    dead: { id: 'dead', label: '死亡', color: '#e06552' }
  };

  const SPAWN_POSITIONS = {
    first: { id: 'first', label: '一号位', short: '1号位' },
    other: { id: 'other', label: '非一号位', short: '非1' }
  };

  const TEAM_NAMES = [
    { label: '一号队', en: 'ALPHA' },
    { label: '二号队', en: 'BRAVO' },
    { label: '三号队', en: 'CHARLIE' }
  ];

  const SIDES = {
    left: {
      id: 'left',
      label: '左岸',
      en: 'WEST BANK',
      code: 'A-SIDE',
      short: 'LEFT',
      color: '#e3a34d'
    },
    right: {
      id: 'right',
      label: '右岸',
      en: 'EAST BANK',
      code: 'B-SIDE',
      short: 'RIGHT',
      color: '#62bdad'
    }
  };

  const OPERATOR_MAP = {};
  OPERATORS.forEach(function (operator) {
    operator.activeSkins = [];
    OPERATOR_MAP[operator.id] = operator;
  });

  const SKIN_MAP = {};
  const SKINS_BY_OPERATOR = {};
  SKINS.forEach(function (skin) {
    SKIN_MAP[skin.id] = skin;
    if (!SKINS_BY_OPERATOR[skin.operatorId]) SKINS_BY_OPERATOR[skin.operatorId] = [];
    SKINS_BY_OPERATOR[skin.operatorId].push(skin);
    if (OPERATOR_MAP[skin.operatorId]) OPERATOR_MAP[skin.operatorId].activeSkins.push(skin);
  });

  const ARMOR_MAP = {};
  ARMOR_LEVELS.forEach(function (armor) {
    ARMOR_MAP[armor.level] = armor;
  });

  function getOperatorSkins(operatorId) {
    return SKINS_BY_OPERATOR[operatorId] || [];
  }

  function isSkinAllowed(operatorId, skinId) {
    if (!operatorId || !skinId) return false;
    return getOperatorSkins(operatorId).some(function (skin) {
      return skin.id === skinId;
    });
  }

  window.DeltaData = {
    ROLES: ROLES,
    OPERATORS: OPERATORS,
    OPERATOR_MAP: OPERATOR_MAP,
    ARMOR_LEVELS: ARMOR_LEVELS,
    ARMOR_MAP: ARMOR_MAP,
    DEATH_STATES: DEATH_STATES,
    SKINS: SKINS,
    SKIN_MAP: SKIN_MAP,
    SKINS_BY_OPERATOR: SKINS_BY_OPERATOR,
    getOperatorSkins: getOperatorSkins,
    isSkinAllowed: isSkinAllowed,
    SPAWN_POSITIONS: SPAWN_POSITIONS,
    TEAM_NAMES: TEAM_NAMES,
    SIDES: SIDES,
    SLOT_COUNT: 18,
    TEAM_COUNT: 3,
    PLAYERS_PER_TEAM: 3
  };
})();
