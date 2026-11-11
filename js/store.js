(function () {
  'use strict';

  const DATA = window.DeltaData;
  const STORAGE_KEY = 'delta-dam-board.v2';
  const LEGACY_KEY = 'delta-dam-board.v1';
  const SCHEMA_VERSION = 2;

  if (!DATA) throw new Error('DeltaData is required before DeltaStore');

  function createPlayer() {
    return {
      operator: null,
      helmet: null,
      bodyArmor: null,
      skin: null,
      death: null
    };
  }

  function createSquad(sideId, index) {
    const players = [];
    for (let playerIndex = 0; playerIndex < DATA.PLAYERS_PER_TEAM; playerIndex += 1) {
      players.push(createPlayer());
    }
    return {
      id: sideId + '-' + (index + 1),
      players: players
    };
  }

  function createSide(sideId) {
    const teams = [];
    for (let teamIndex = 0; teamIndex < DATA.TEAM_COUNT; teamIndex += 1) {
      teams.push(createSquad(sideId, teamIndex));
    }
    return teams;
  }

  function createBoard() {
    return {
      version: SCHEMA_VERSION,
      mapId: 'dam',
      updatedAt: null,
      spawnSide: null,
      spawnPosition: null,
      sides: {
        left: createSide('left'),
        right: createSide('right')
      }
    };
  }

  function normalizeArmor(value) {
    const level = Number(value);
    return Number.isInteger(level) && DATA.ARMOR_MAP[level] ? level : null;
  }

  function normalizePlayer(raw, operatorId) {
    const player = createPlayer();
    if (!raw || typeof raw !== 'object') return player;

    const operator = typeof operatorId === 'string' && DATA.OPERATOR_MAP[operatorId]
      ? operatorId
      : null;
    player.operator = operator;

    // v1 只有单个 armor 字段；迁移时同时补到头盔和盔甲。
    player.helmet = normalizeArmor(raw.helmet != null ? raw.helmet : raw.armor);
    player.bodyArmor = normalizeArmor(raw.bodyArmor != null ? raw.bodyArmor : raw.armor);

    if (operator && DATA.isSkinAllowed(operator, raw.skin)) {
      player.skin = raw.skin;
    }

    if (operator) {
      player.death = raw.death === 'dead' ? 'dead' : 'alive';
    }

    return player;
  }

  function normalizeBoard(raw) {
    const board = createBoard();
    if (!raw || typeof raw !== 'object') return board;

    if (raw.updatedAt && typeof raw.updatedAt === 'string') {
      board.updatedAt = raw.updatedAt;
    }

    if (raw.spawnSide === 'left' || raw.spawnSide === 'right') {
      board.spawnSide = raw.spawnSide;
      if (raw.spawnPosition === 'first' || raw.spawnPosition === 'other') {
        board.spawnPosition = raw.spawnPosition;
      }
    }

    ['left', 'right'].forEach(function (sideId) {
      const sourceTeams = raw.sides && Array.isArray(raw.sides[sideId])
        ? raw.sides[sideId]
        : [];
      for (let teamIndex = 0; teamIndex < DATA.TEAM_COUNT; teamIndex += 1) {
        const sourceTeam = sourceTeams[teamIndex];
        if (!sourceTeam || !Array.isArray(sourceTeam.players)) continue;
        for (let playerIndex = 0; playerIndex < DATA.PLAYERS_PER_TEAM; playerIndex += 1) {
          const sourcePlayer = sourceTeam.players[playerIndex] || {};
          board.sides[sideId][teamIndex].players[playerIndex] =
            normalizePlayer(sourcePlayer, sourcePlayer.operator);
        }
      }
    });

    return board;
  }

  function loadState() {
    try {
      let raw = window.localStorage.getItem(STORAGE_KEY);
      let usedLegacy = false;
      if (!raw) {
        raw = window.localStorage.getItem(LEGACY_KEY);
        usedLegacy = Boolean(raw);
      }
      if (!raw) {
        return { board: createBoard(), hasSaved: false, usedLegacy: false, error: null };
      }
      const parsed = JSON.parse(raw);
      return {
        board: normalizeBoard(parsed),
        hasSaved: true,
        usedLegacy: usedLegacy,
        error: null
      };
    } catch (error) {
      return {
        board: createBoard(),
        hasSaved: false,
        usedLegacy: false,
        error: error
      };
    }
  }

  function save(board) {
    const normalized = normalizeBoard(board);
    normalized.updatedAt = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    // 迁移完成后删除旧格式，避免下次读取到旧数据。
    try {
      window.localStorage.removeItem(LEGACY_KEY);
    } catch (error) {
      // 忽略旧键清理失败，v2 已经写入。
    }
    Object.assign(board, normalized);
    return board;
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  }

  function playerHasData(player) {
    return Boolean(
      player &&
      (player.operator || player.helmet || player.bodyArmor || player.skin || player.death)
    );
  }

  function getStats(board) {
    const stats = {
      operators: 0,
      configured: 0,
      helmets: 0,
      armors: 0,
      deaths: 0,
      skins: 0,
      percent: 0,
      sides: {
        left: { operators: 0, configured: 0 },
        right: { operators: 0, configured: 0 }
      },
      teams: {
        left: [],
        right: []
      }
    };

    if (!board || !board.sides) return stats;

    ['left', 'right'].forEach(function (sideId) {
      const teams = board.sides[sideId] || [];
      for (let teamIndex = 0; teamIndex < DATA.TEAM_COUNT; teamIndex += 1) {
        const team = teams[teamIndex];
        const teamStats = { operators: 0, configured: 0 };
        const players = team && team.players ? team.players : [];
        players.forEach(function (player) {
          if (!player) return;
          if (playerHasData(player)) {
            stats.configured += 1;
            stats.sides[sideId].configured += 1;
            teamStats.configured += 1;
          }
          if (player.operator) {
            stats.operators += 1;
            stats.sides[sideId].operators += 1;
            teamStats.operators += 1;
          }
          if (player.helmet) stats.helmets += 1;
          if (player.bodyArmor) stats.armors += 1;
          if (player.death) stats.deaths += 1;
          if (player.skin) stats.skins += 1;
        });
        stats.teams[sideId].push(teamStats);
      }
    });

    // 进度按“已记录干员”计算，因为干员是本工具的核心记录项。
    stats.percent = Math.round((stats.operators / DATA.SLOT_COUNT) * 100);
    return stats;
  }

  function parseImport(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error('文件不是有效的 JSON');
    }

    if (parsed && parsed.board && parsed.board.sides) {
      parsed = parsed.board;
    }
    if (!parsed || typeof parsed !== 'object' || !parsed.sides ||
      (!Array.isArray(parsed.sides.left) && !Array.isArray(parsed.sides.right))) {
      throw new Error('文件中没有可识别的大坝编成数据');
    }

    const board = normalizeBoard(parsed);
    if (getStats(board).configured === 0) {
      throw new Error('文件中的 18 个席位都是空的');
    }
    return board;
  }

  function spawnLabel(board) {
    if (!board || !board.spawnSide || !board.spawnPosition) return '未设置';
    return DATA.SIDES[board.spawnSide].label + ' · ' +
      DATA.SPAWN_POSITIONS[board.spawnPosition].label;
  }

  function playerLine(player, position) {
    if (!playerHasData(player)) {
      return '  ' + position + '号位：未配置';
    }
    const bits = [];
    const operator = player.operator ? DATA.OPERATOR_MAP[player.operator] : null;
    if (operator) {
      bits.push(operator.name + '（' + DATA.ROLES[operator.role].label + '）');
    }
    if (player.helmet || player.bodyArmor) {
      const helmet = player.helmet ? DATA.ARMOR_MAP[player.helmet].roman : '—';
      const body = player.bodyArmor ? DATA.ARMOR_MAP[player.bodyArmor].roman : '—';
      bits.push('头' + helmet + ' / 甲' + body);
    }
    if (player.skin && DATA.SKIN_MAP[player.skin]) {
      bits.push('皮肤「' + DATA.SKIN_MAP[player.skin].name + '」');
    }
    if (player.death) {
      bits.push(DATA.DEATH_STATES[player.death].label);
    }
    return '  ' + position + '号位：' + bits.join(' · ');
  }

  function buildReport(board) {
    const stats = getStats(board);
    const lines = [];
    lines.push('零号大坝 · 编成简报');
    lines.push('本局出生：' + spawnLabel(board));
    lines.push('记录时间：' + (board.updatedAt ? window.Delta.formatDateTime(board.updatedAt) : '未保存'));
    lines.push('─'.repeat(32));

    ['left', 'right'].forEach(function (sideId) {
      const side = DATA.SIDES[sideId];
      lines.push('');
      lines.push('【' + side.label + ' / ' + side.en + '】');
      const teams = board.sides[sideId] || [];
      teams.forEach(function (team, teamIndex) {
        const teamName = DATA.TEAM_NAMES[teamIndex];
        lines.push(teamName.label + ' · ' + teamName.en);
        team.players.forEach(function (player, playerIndex) {
          lines.push(playerLine(player, playerIndex + 1));
        });
      });
    });

    lines.push('');
    lines.push('─'.repeat(32));
    lines.push('已记录 ' + stats.operators + '/18 干员 · ' + stats.configured + '/18 席位');
    lines.push('本地工具 · 数据仅保存在当前浏览器');
    return lines.join('\n');
  }

  window.DeltaStore = {
    STORAGE_KEY: STORAGE_KEY,
    LEGACY_KEY: LEGACY_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    createPlayer: createPlayer,
    createBoard: createBoard,
    normalizeBoard: normalizeBoard,
    loadState: loadState,
    save: save,
    clear: clear,
    playerHasData: playerHasData,
    getStats: getStats,
    parseImport: parseImport,
    buildReport: buildReport,
    spawnLabel: spawnLabel
  };
})();
