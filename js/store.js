(function () {
  'use strict';

  const DATA = window.DeltaData;
  const STORAGE_KEY = 'delta-dam-board.v1';
  const SCHEMA_VERSION = 1;

  if (!DATA) throw new Error('DeltaData is required before DeltaStore');

  function createPlayer() {
    return {
      operator: null,
      armor: null,
      death: null,
      deathNote: '',
      skin: null
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
      sides: {
        left: createSide('left'),
        right: createSide('right')
      }
    };
  }

  function normalizePlayer(raw) {
    const player = createPlayer();
    if (!raw || typeof raw !== 'object') return player;

    if (typeof raw.operator === 'string' && DATA.OPERATOR_MAP[raw.operator]) {
      player.operator = raw.operator;
    }
    if (Number.isInteger(raw.armor) && DATA.ARMOR_MAP[raw.armor]) {
      player.armor = raw.armor;
    }
    if (typeof raw.death === 'string' && DATA.DEATH_MAP[raw.death]) {
      player.death = raw.death;
    }
    if (typeof raw.deathNote === 'string') {
      player.deathNote = raw.deathNote.slice(0, 80);
    }
    if (typeof raw.skin === 'string' && DATA.SKIN_MAP[raw.skin]) {
      player.skin = raw.skin;
    }
    return player;
  }

  function normalizeBoard(raw) {
    const board = createBoard();
    if (!raw || typeof raw !== 'object') return board;

    if (raw.updatedAt && typeof raw.updatedAt === 'string') {
      board.updatedAt = raw.updatedAt;
    }

    ['left', 'right'].forEach(function (sideId) {
      const sourceTeams = raw.sides && Array.isArray(raw.sides[sideId])
        ? raw.sides[sideId]
        : [];
      for (let teamIndex = 0; teamIndex < DATA.TEAM_COUNT; teamIndex += 1) {
        const sourceTeam = sourceTeams[teamIndex];
        if (!sourceTeam || !Array.isArray(sourceTeam.players)) continue;
        for (let playerIndex = 0; playerIndex < DATA.PLAYERS_PER_TEAM; playerIndex += 1) {
          board.sides[sideId][teamIndex].players[playerIndex] =
            normalizePlayer(sourceTeam.players[playerIndex]);
        }
      }
    });

    return board;
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { board: createBoard(), hasSaved: false, error: null };
      }
      const parsed = JSON.parse(raw);
      return {
        board: normalizeBoard(parsed),
        hasSaved: true,
        error: null
      };
    } catch (error) {
      return {
        board: createBoard(),
        hasSaved: false,
        error: error
      };
    }
  }

  function save(board) {
    const normalized = normalizeBoard(board);
    normalized.updatedAt = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    Object.assign(board, normalized);
    return board;
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function playerHasData(player) {
    return Boolean(
      player &&
      (player.operator || player.armor || player.death || player.deathNote || player.skin)
    );
  }

  function getStats(board) {
    const stats = {
      operators: 0,
      configured: 0,
      armor: 0,
      death: 0,
      skins: 0,
      notes: 0,
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
          if (player.armor) stats.armor += 1;
          if (player.death) stats.death += 1;
          if (player.skin) stats.skins += 1;
          if (player.deathNote) stats.notes += 1;
        });
        stats.teams[sideId].push(teamStats);
      }
    });

    stats.percent = Math.round((stats.configured / DATA.SLOT_COUNT) * 100);
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

  function playerLine(player, position) {
    if (!playerHasData(player)) {
      return '  ' + position + '号位：未配置';
    }
    const bits = [];
    const operator = player.operator ? DATA.OPERATOR_MAP[player.operator] : null;
    if (operator) {
      bits.push(operator.name + '（' + DATA.ROLES[operator.role].label + '）');
    }
    if (player.armor) {
      const armor = DATA.ARMOR_MAP[player.armor];
      bits.push('头甲' + armor.roman + ' ' + armor.name);
    }
    if (player.death) {
      bits.push(DATA.DEATH_MAP[player.death].label);
    }
    if (player.skin) {
      bits.push('皮肤「' + DATA.SKIN_MAP[player.skin].name + '」');
    }
    if (player.deathNote) {
      bits.push('备注：' + player.deathNote);
    }
    return '  ' + position + '号位：' + bits.join(' · ');
  }

  function buildReport(board) {
    const stats = getStats(board);
    const lines = [];
    lines.push('零号大坝 · 编成简报');
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
    lines.push('已配置 ' + stats.operators + '/18 干员 · ' + stats.configured + '/18 席位');
    lines.push('本地工具 · 数据仅保存在当前浏览器');
    return lines.join('\n');
  }

  window.DeltaStore = {
    STORAGE_KEY: STORAGE_KEY,
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
    buildReport: buildReport
  };
})();
