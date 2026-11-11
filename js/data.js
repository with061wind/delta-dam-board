(function () {
  'use strict';

  const ROLES = {
    assault: {
      id: 'assault',
      label: '突击',
      en: 'ASSAULT',
      color: '#e47b52',
      hint: '突破 · 接敌'
    },
    engineer: {
      id: 'engineer',
      label: '工程',
      en: 'ENGINEER',
      color: '#d6a850',
      hint: '布防 · 控场'
    },
    support: {
      id: 'support',
      label: '支援',
      en: 'SUPPORT',
      color: '#7fbd8d',
      hint: '救援 · 续航'
    },
    recon: {
      id: 'recon',
      label: '侦察',
      en: 'RECON',
      color: '#68a9c8',
      hint: '索敌 · 信息'
    }
  };

  // 名称用于本地编成记录；只保留公开代号与定位，不依赖任何在线数据。
  const OPERATORS = [
    {
      id: 'redwolf',
      name: '红狼',
      en: 'D-WOLF',
      role: 'assault',
      glyph: '狼',
      accent: '#df7047',
      tag: '动力外骨骼 · 机动突进'
    },
    {
      id: 'vyron',
      name: '威龙',
      en: 'VYRON',
      role: 'assault',
      glyph: '龙',
      accent: '#c95e3f',
      tag: '虎蹲炮 · 区域压制'
    },
    {
      id: 'unnamed',
      name: '无名',
      en: 'UNNAMED',
      role: 'assault',
      glyph: '无',
      accent: '#b98055',
      tag: '隐秘接敌 · 单点突破'
    },
    {
      id: 'gale',
      name: '疾风',
      en: 'GALE',
      role: 'assault',
      glyph: '风',
      accent: '#d39a56',
      tag: '高速突进 · 追击收割'
    },
    {
      id: 'wildfire',
      name: '野火',
      en: 'WILDFIRE',
      role: 'assault',
      glyph: '火',
      accent: '#e0673f',
      tag: '燃烧压制 · 战线撕裂'
    },
    {
      id: 'shepherd',
      name: '牧羊人',
      en: 'SHEPHERD',
      role: 'engineer',
      glyph: '牧',
      accent: '#c6a153',
      tag: '声波陷阱 · 后方布防'
    },
    {
      id: 'uluru',
      name: '乌鲁鲁',
      en: 'ULURU',
      role: 'engineer',
      glyph: '鲁',
      accent: '#bf8c45',
      tag: '临时工事 · 巡飞弹'
    },
    {
      id: 'bit',
      name: '比特',
      en: 'BIT',
      role: 'engineer',
      glyph: '比',
      accent: '#d3a95d',
      tag: '战术道具 · 室内控制'
    },
    {
      id: 'deepblue',
      name: '深蓝',
      en: 'DEEPBLUE',
      role: 'engineer',
      glyph: '蓝',
      accent: '#8d9e63',
      tag: '重型护盾 · 正面推进'
    },
    {
      id: 'cryo',
      name: '液氮',
      en: 'CRYO',
      role: 'engineer',
      glyph: '氮',
      accent: '#7fa9a4',
      tag: '低温封锁 · 区域减速'
    },
    {
      id: 'stinger',
      name: '蜂医',
      en: 'STINGER',
      role: 'support',
      glyph: '医',
      accent: '#75b886',
      tag: '激素枪 · 烟幕救援'
    },
    {
      id: 'toxik',
      name: '蛊',
      en: 'TOXIK',
      role: 'support',
      glyph: '蛊',
      accent: '#95a95d',
      tag: '毒素干扰 · 持续侵蚀'
    },
    {
      id: 'papillon',
      name: '蝶',
      en: 'PAPILLON',
      role: 'support',
      glyph: '蝶',
      accent: '#93b48b',
      tag: '战场增益 · 团队续航'
    },
    {
      id: 'hackclaw',
      name: '骇爪',
      en: 'HACKCLAW',
      role: 'recon',
      glyph: '爪',
      accent: '#5e9fbd',
      tag: '电子攻防 · 踪迹追踪'
    },
    {
      id: 'luna',
      name: '露娜',
      en: 'LUNA',
      role: 'recon',
      glyph: '月',
      accent: '#79a9bd',
      tag: '侦察箭矢 · 电击封锁'
    },
    {
      id: 'silverwing',
      name: '银翼',
      en: 'SILVERWING',
      role: 'recon',
      glyph: '翼',
      accent: '#8aa6b2',
      tag: '信息链路 · 远程侦测'
    },
    {
      id: 'echo',
      name: '回响',
      en: 'ECHO',
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

  const DEATH_STATES = [
    { id: 'alive', label: '存活', color: '#8fc58d', desc: '仍在场' },
    { id: 'dead', label: '阵亡', color: '#df7461', desc: '已倒下' },
    { id: 'unclear', label: '待确认', color: '#d1aa62', desc: '状态不明' }
  ];

  const SKINS = [
    { id: 'field', name: '制式', color: '#929b88', color2: '#4f574a' },
    { id: 'sand', name: '沙暴', color: '#cba06a', color2: '#80633d' },
    { id: 'night', name: '夜袭', color: '#657188', color2: '#2e3542' },
    { id: 'crimson', name: '赤焰', color: '#c05c45', color2: '#6d2f27' },
    { id: 'arctic', name: '极地', color: '#b6d2cf', color2: '#668684' },
    { id: 'pulse', name: '脉冲', color: '#53c5b2', color2: '#1f6e67' },
    { id: 'blackgold', name: '黑金', color: '#c9a44e', color2: '#4e3f1d' },
    { id: 'moss', name: '苔原', color: '#7d8a5e', color2: '#414a2f' }
  ];

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
    OPERATOR_MAP[operator.id] = operator;
  });

  const SKIN_MAP = {};
  SKINS.forEach(function (skin) {
    SKIN_MAP[skin.id] = skin;
  });

  const DEATH_MAP = {};
  DEATH_STATES.forEach(function (state) {
    DEATH_MAP[state.id] = state;
  });

  const ARMOR_MAP = {};
  ARMOR_LEVELS.forEach(function (armor) {
    ARMOR_MAP[armor.level] = armor;
  });

  window.DeltaData = {
    ROLES: ROLES,
    OPERATORS: OPERATORS,
    OPERATOR_MAP: OPERATOR_MAP,
    ARMOR_LEVELS: ARMOR_LEVELS,
    ARMOR_MAP: ARMOR_MAP,
    DEATH_STATES: DEATH_STATES,
    DEATH_MAP: DEATH_MAP,
    SKINS: SKINS,
    SKIN_MAP: SKIN_MAP,
    TEAM_NAMES: TEAM_NAMES,
    SIDES: SIDES,
    SLOT_COUNT: 18,
    TEAM_COUNT: 3,
    PLAYERS_PER_TEAM: 3
  };
})();
