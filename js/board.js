(function () {
  'use strict';

  const { Delta, DeltaData, DeltaStore } = window;
  const DATA = DeltaData;

  let board = null;
  let activeSlot = null;
  let draft = null;
  let filter = 'all';
  let search = '';
  let editorApi = null;
  let confirmApi = null;
  let confirmAction = null;

  let leftTeams = null;
  let rightTeams = null;
  let operatorGrid = null;
  let operatorSearch = null;
  let armorOptions = null;
  let deathOptions = null;
  let deathNote = null;
  let deathCharCount = null;
  let skinOptions = null;
  let editorSummary = null;
  let saveState = null;

  function escape(value) {
    return Delta.escapeHtml(value);
  }

  function operatorOf(player) {
    return player && player.operator ? DATA.OPERATOR_MAP[player.operator] : null;
  }

  function armorOf(player) {
    return player && player.armor ? DATA.ARMOR_MAP[player.armor] : null;
  }

  function skinOf(player) {
    return player && player.skin ? DATA.SKIN_MAP[player.skin] : null;
  }

  function deathOf(player) {
    return player && player.death ? DATA.DEATH_MAP[player.death] : null;
  }

  function slotLabel(sideId, teamIndex, playerIndex) {
    return DATA.SIDES[sideId].label + ' · ' + DATA.TEAM_NAMES[teamIndex].label + ' · ' + (playerIndex + 1) + '号位';
  }

  function playerAriaLabel(sideId, teamIndex, playerIndex, player) {
    const op = operatorOf(player);
    const armor = armorOf(player);
    const death = deathOf(player);
    const skin = skinOf(player);
    return slotLabel(sideId, teamIndex, playerIndex) + '，' +
      (op ? '干员' + op.name : '未选干员') + '，' +
      (armor ? '头甲' + armor.roman + '级' : '头甲未设置') + '，' +
      (death ? '死后' + death.label : player.deathNote ? '死后有备注' : '死后未记录') + '，' +
      (skin ? '皮肤' + skin.name : '皮肤未设置') + '。点击编辑';
  }

  function buildPlayerRow(sideId, teamIndex, playerIndex, player) {
    const op = operatorOf(player);
    const armor = armorOf(player);
    const death = deathOf(player);
    const skin = skinOf(player);
    const hasData = DeltaStore.playerHasData(player);
    const noteOnly = !death && Boolean(player.deathNote);
    const deathText = death ? death.label : noteOnly ? '有备注' : '未记录';
    const team = DATA.TEAM_NAMES[teamIndex];

    let deathMarkup = '<i class="status-dot" style="--death-color: var(--muted-2)"></i>' + deathText;
    if (death) {
      deathMarkup = '<i class="status-dot is-' + death.id + '" style="--death-color: ' + death.color + '"></i>' + deathText;
    } else if (noteOnly) {
      deathMarkup = '<i class="slot-note-dot" title="有死后备注"></i>' + deathText;
    }

    return (
      '<button class="player-row' + (op ? ' has-operator' : '') + (hasData ? ' has-data' : '') + '" type="button"' +
      ' data-side="' + sideId + '" data-team="' + teamIndex + '" data-player="' + playerIndex + '"' +
      ' aria-label="' + escape(playerAriaLabel(sideId, teamIndex, playerIndex, player)) + '">' +
        '<span class="player-pos" aria-hidden="true">' + Delta.pad(playerIndex + 1, 2) + '</span>' +
        '<span class="slot-armor">' +
          '<span class="mini-label">头甲</span>' +
          '<span class="armor-value ' + (armor ? 'has-value' : 'is-empty') + '"' +
            (armor ? ' style="--armor-color: ' + armor.color + '"' : '') + '>' +
            (armor ? armor.roman : '—') +
          '</span>' +
        '</span>' +
        '<span class="operator-box">' +
          '<span class="operator-avatar' + (op ? '' : ' is-empty') + '"' +
            (op ? ' style="--op-accent: ' + op.accent + '"' : '') + ' aria-hidden="true">' +
            (op ? op.glyph : '+') +
          '</span>' +
          '<span class="operator-copy">' +
            '<strong class="' + (op ? '' : 'is-empty') + '">' + (op ? escape(op.name) : '点击选择干员') + '</strong>' +
            '<small>' + (op
              ? '<b>' + escape(DATA.ROLES[op.role].label) + '</b> · ' + escape(op.tag)
              : '全部选填 · 可只填头甲 / 死后 / 皮肤') + '</small>' +
          '</span>' +
        '</span>' +
        '<span class="slot-death">' +
          '<span class="mini-label">死后</span>' +
          '<span class="slot-value' + (death || noteOnly ? '' : ' is-empty') + '">' + deathMarkup + '</span>' +
        '</span>' +
        '<span class="slot-skin">' +
          '<span class="mini-label">皮肤</span>' +
          '<span class="slot-value' + (skin ? '' : ' is-empty') + '">' +
            (skin
              ? '<i class="skin-swatch" style="--skin-color: ' + skin.color + '; --skin-color2: ' + skin.color2 + '"></i>' + escape(skin.name)
              : '未设置') +
          '</span>' +
        '</span>' +
      '</button>'
    );
  }

  function buildTeam(sideId, team, teamIndex) {
    const teamMeta = DATA.TEAM_NAMES[teamIndex];
    const filled = team.players.filter(function (player) {
      return DeltaStore.playerHasData(player);
    }).length;
    const rows = team.players.map(function (player, playerIndex) {
      return buildPlayerRow(sideId, teamIndex, playerIndex, player);
    }).join('');

    return (
      '<article class="team-card" data-team-index="' + teamIndex + '">' +
        '<header class="team-head">' +
          '<span class="team-num" aria-hidden="true">' + Delta.pad(teamIndex + 1, 2) + '</span>' +
          '<span class="team-name">' + teamMeta.label + '</span>' +
          '<span class="team-en">' + teamMeta.en + '</span>' +
          '<span class="team-filled' + (filled === 3 ? ' is-complete' : '') + '">' + filled + ' / 3</span>' +
        '</header>' +
        '<div class="player-list">' + rows + '</div>' +
      '</article>'
    );
  }

  function renderBoard() {
    leftTeams.innerHTML = board.sides.left.map(function (team, index) {
      return buildTeam('left', team, index);
    }).join('');
    rightTeams.innerHTML = board.sides.right.map(function (team, index) {
      return buildTeam('right', team, index);
    }).join('');
    updateStats();
  }

  function updateStats() {
    const stats = DeltaStore.getStats(board);
    const operatorsCount = document.getElementById('operators-count');
    const slotsCount = document.getElementById('slots-count');
    const progressRing = document.getElementById('progress-ring');
    const progressRingLabel = document.getElementById('progress-ring-label');
    const progressBar = document.getElementById('progress-bar');
    const leftCount = document.getElementById('left-count');
    const rightCount = document.getElementById('right-count');

    if (operatorsCount) operatorsCount.textContent = Delta.pad(stats.operators, 2);
    if (slotsCount) slotsCount.textContent = stats.configured + ' 个席位已填写 · 全部选填';
    if (progressRing) {
      progressRing.style.setProperty('--progress', String(stats.percent));
      progressRing.setAttribute('role', 'progressbar');
      progressRing.setAttribute('aria-valuemin', '0');
      progressRing.setAttribute('aria-valuemax', '100');
      progressRing.setAttribute('aria-valuenow', String(stats.percent));
      progressRing.setAttribute('aria-label', '编成进度 ' + stats.percent + '%');
    }
    if (progressRingLabel) progressRingLabel.textContent = stats.percent + '%';
    if (progressBar) progressBar.style.width = stats.percent + '%';
    if (leftCount) leftCount.textContent = stats.sides.left.configured;
    if (rightCount) rightCount.textContent = stats.sides.right.configured;
  }

  function setSaveState(kind, message) {
    if (!saveState) return;
    saveState.classList.remove('is-error', 'is-saved');
    if (kind) saveState.classList.add(kind);
    saveState.innerHTML = '<i aria-hidden="true"></i>' + escape(message);
  }

  function shortTime(date) {
    return Delta.pad(date.getHours()) + ':' + Delta.pad(date.getMinutes());
  }

  function saveBoard() {
    try {
      DeltaStore.save(board);
      setSaveState('is-saved', '已保存 ' + shortTime(new Date()));
      return true;
    } catch (error) {
      setSaveState('is-error', '本地保存失败');
      Delta.toast('浏览器未能写入本地存储，请检查隐私设置或存储空间。', 'error', 3800);
      return false;
    }
  }

  function showInitialSaveState(loadError) {
    if (loadError) {
      setSaveState('is-error', '读取本地存档失败');
      return;
    }
    if (board.updatedAt) {
      setSaveState('is-saved', '已恢复 ' + shortTime(new Date(board.updatedAt)));
    } else {
      setSaveState('', '本地自动保存');
    }
  }

  /* ---------------------------------------------------------
     Editor
     --------------------------------------------------------- */

  function renderEditorSummary() {
    const op = operatorOf(draft);
    const armor = armorOf(draft);
    const death = deathOf(draft);
    const skin = skinOf(draft);

    const identity =
      '<div class="summary-identity">' +
        '<span class="summary-avatar' + (op ? '' : ' is-empty') + '"' +
          (op ? ' style="--op-accent: ' + op.accent + '"' : '') + ' aria-hidden="true">' +
          (op ? op.glyph : '+') +
        '</span>' +
        '<span class="summary-copy">' +
          '<small>当前干员 / OPERATOR</small>' +
          '<strong class="' + (op ? '' : 'is-empty') + '">' +
            (op ? escape(op.name) + ' / ' + escape(op.en) : '尚未选择 · 点击下方干员') +
          '</strong>' +
        '</span>' +
      '</div>';

    const tags = [];
    tags.push(armor
      ? '<span class="summary-tag">头甲 <b>' + armor.roman + ' ' + armor.name + '</b></span>'
      : '<span class="summary-tag is-muted">头甲 未设置</span>');
    if (death) {
      tags.push('<span class="summary-tag" style="color: ' + death.color + '">死后 <b style="color: ' + death.color + '">' + death.label + '</b></span>');
    } else if (draft.deathNote) {
      tags.push('<span class="summary-tag" style="color: var(--amber)">死后 <b style="color: var(--amber)">有备注</b></span>');
    } else {
      tags.push('<span class="summary-tag is-muted">死后 未记录</span>');
    }
    if (skin) {
      tags.push('<span class="summary-tag"><i class="skin-swatch" style="--skin-color: ' + skin.color + '; --skin-color2: ' + skin.color2 + '"></i>' + escape(skin.name) + '</span>');
    } else {
      tags.push('<span class="summary-tag is-muted">皮肤 未设置</span>');
    }

    editorSummary.innerHTML = identity + '<div class="summary-tags">' + tags.join('') + '</div>';
  }

  function filteredOperators() {
    const query = search.trim().toLowerCase();
    return DATA.OPERATORS.filter(function (operator) {
      if (filter !== 'all' && operator.role !== filter) return false;
      if (!query) return true;
      const role = DATA.ROLES[operator.role];
      return (operator.name + ' ' + operator.en + ' ' + operator.tag + ' ' + role.label + ' ' + role.en)
        .toLowerCase()
        .indexOf(query) !== -1;
    });
  }

  function renderOperatorGrid() {
    const list = filteredOperators();
    const count = document.getElementById('operator-result-count');
    if (count) count.textContent = list.length + ' 名干员';

    if (!list.length) {
      operatorGrid.innerHTML =
        '<div class="operator-empty">' +
          Delta.icon('search') +
          '<strong>没有找到匹配干员</strong>' +
          '<span>换个关键词，或切换左侧定位</span>' +
        '</div>';
      return;
    }

    operatorGrid.innerHTML = list.map(function (operator) {
      const selected = draft.operator === operator.id;
      const role = DATA.ROLES[operator.role];
      return (
        '<button class="operator-card' + (selected ? ' is-selected' : '') + '" type="button"' +
          ' data-operator-id="' + operator.id + '" style="--op-accent: ' + operator.accent + '"' +
          ' aria-pressed="' + (selected ? 'true' : 'false') + '"' +
          ' aria-label="' + escape(operator.name + '，' + role.label + '，' + operator.tag + (selected ? '，已选择' : '')) + '">' +
          '<span class="operator-card-top">' +
            '<span class="summary-avatar" aria-hidden="true">' + operator.glyph + '</span>' +
            '<span class="operator-role">' + role.label + '</span>' +
          '</span>' +
          '<span class="operator-card-name">' + escape(operator.name) + '</span>' +
          '<span class="operator-card-en">' + escape(operator.en) + '</span>' +
          '<span class="operator-card-tag">' + escape(operator.tag) + '</span>' +
          '<span class="operator-check" aria-hidden="true">' + Delta.icon('check') + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function updateOperatorCards() {
    if (!operatorGrid) return;
    operatorGrid.querySelectorAll('[data-operator-id]').forEach(function (card) {
      const selected = card.getAttribute('data-operator-id') === draft.operator;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  function renderArmorOptions() {
    const cards = DATA.ARMOR_LEVELS.map(function (armor) {
      const selected = draft.armor === armor.level;
      return (
        '<button class="armor-btn' + (selected ? ' is-selected' : '') + '" type="button"' +
          ' data-armor="' + armor.level + '" style="--armor-color: ' + armor.color + '"' +
          ' aria-pressed="' + (selected ? 'true' : 'false') + '"' +
          ' aria-label="头甲' + armor.name + '，' + armor.hint + '">' +
          '<span class="armor-btn-roman">' + armor.roman + '</span>' +
          '<span class="armor-btn-copy"><strong>' + armor.name + '</strong><small>' + armor.hint + '</small></span>' +
        '</button>'
      );
    });
    cards.push(
      '<button class="armor-btn is-clear' + (!draft.armor ? ' is-selected' : '') + '" type="button" data-armor="clear" aria-pressed="' + (!draft.armor ? 'true' : 'false') + '">未设置 · 清除头甲</button>'
    );
    armorOptions.innerHTML = cards.join('');
  }

  function renderDeathOptions() {
    const options = [
      '<button class="death-btn' + (!draft.death ? ' is-selected' : '') + '" type="button" data-death="clear" aria-pressed="' + (!draft.death ? 'true' : 'false') + '" style="--death-color: var(--muted)">' +
        '<i class="status-dot" style="--death-color: var(--muted-2)"></i>未记录<small>清除</small>' +
      '</button>'
    ];
    DATA.DEATH_STATES.forEach(function (state) {
      const selected = draft.death === state.id;
      options.push(
        '<button class="death-btn' + (selected ? ' is-selected' : '') + '" type="button" data-death="' + state.id + '"' +
          ' style="--death-color: ' + state.color + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
          '<i class="status-dot" style="--death-color: ' + state.color + '"></i>' + state.label +
          '<small>' + state.desc + '</small>' +
        '</button>'
      );
    });
    deathOptions.innerHTML = options.join('');
  }

  function renderSkinOptions() {
    const options = DATA.SKINS.map(function (skin) {
      const selected = draft.skin === skin.id;
      return (
        '<button class="skin-btn' + (selected ? ' is-selected' : '') + '" type="button" data-skin="' + skin.id + '"' +
          ' style="--skin-color: ' + skin.color + '; --skin-color2: ' + skin.color2 + '"' +
          ' aria-pressed="' + (selected ? 'true' : 'false') + '">' +
          '<i class="skin-swatch"></i>' + skin.name +
        '</button>'
      );
    });
    options.push(
      '<button class="skin-btn is-clear' + (!draft.skin ? ' is-selected' : '') + '" type="button" data-skin="clear" aria-pressed="' + (!draft.skin ? 'true' : 'false') + '">未设置 · 清除皮肤</button>'
    );
    skinOptions.innerHTML = options.join('');
  }

  function syncDeathNote() {
    if (!deathNote) return;
    deathNote.value = draft.deathNote || '';
    if (deathCharCount) deathCharCount.textContent = (draft.deathNote || '').length + ' / 80';
  }

  function updateFilterButtons() {
    document.querySelectorAll('#filter-tabs [data-filter]').forEach(function (button) {
      const active = button.getAttribute('data-filter') === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderEditorAll() {
    renderEditorSummary();
    renderOperatorGrid();
    renderArmorOptions();
    renderDeathOptions();
    renderSkinOptions();
    syncDeathNote();
    updateFilterButtons();
  }

  function openEditor(sideId, teamIndex, playerIndex) {
    const player = board.sides[sideId][teamIndex].players[playerIndex];
    if (!player) return;

    activeSlot = { sideId: sideId, teamIndex: teamIndex, playerIndex: playerIndex };
    draft = Object.assign(DeltaStore.createPlayer(), player);
    filter = 'all';
    search = '';
    if (operatorSearch) operatorSearch.value = '';

    const side = DATA.SIDES[sideId];
    const team = DATA.TEAM_NAMES[teamIndex];
    document.getElementById('editor-kicker').textContent =
      side.code + ' / TEAM ' + Delta.pad(teamIndex + 1, 2) + ' / SLOT ' + Delta.pad(playerIndex + 1, 2);
    document.getElementById('editor-title').textContent =
      side.label + ' · ' + team.label + ' · ' + (playerIndex + 1) + '号位';

    renderEditorAll();
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    editorApi.open(mobile ? '[data-close-editor]' : '#operator-search');
  }

  function closeEditor() {
    editorApi.close();
  }

  function applySlot() {
    if (!activeSlot || !draft) return;
    const target = board.sides[activeSlot.sideId][activeSlot.teamIndex].players[activeSlot.playerIndex];
    draft.deathNote = (draft.deathNote || '').trim();
    Object.assign(target, draft);

    const op = operatorOf(target);
    const hasData = DeltaStore.playerHasData(target);
    const label = slotLabel(activeSlot.sideId, activeSlot.teamIndex, activeSlot.playerIndex);
    saveBoard();
    editorApi.close();
    renderBoard();

    const selector = '.player-row[data-side="' + activeSlot.sideId + '"][data-team="' + activeSlot.teamIndex + '"][data-player="' + activeSlot.playerIndex + '"]';
    const newRow = document.querySelector(selector);
    if (newRow) newRow.focus({ preventScroll: true });

    if (op) {
      Delta.toast(label + ' · ' + op.name + ' 已记录');
    } else if (hasData) {
      Delta.toast(label + ' 已更新');
    } else {
      Delta.toast(label + ' 已清空');
    }

    activeSlot = null;
    draft = null;
  }

  function resetDraft() {
    draft = DeltaStore.createPlayer();
    renderEditorAll();
    Delta.toast('该席位内容已临时重置，保存后生效。', 'warn');
  }

  function bindEditor() {
    operatorGrid.addEventListener('click', function (event) {
      const card = event.target.closest('[data-operator-id]');
      if (!card) return;
      const id = card.getAttribute('data-operator-id');
      draft.operator = draft.operator === id ? null : id;
      updateOperatorCards();
      renderEditorSummary();
    });

    document.getElementById('filter-tabs').addEventListener('click', function (event) {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      filter = button.getAttribute('data-filter');
      updateFilterButtons();
      renderOperatorGrid();
    });

    operatorSearch.addEventListener('input', function (event) {
      search = event.target.value;
      renderOperatorGrid();
    });

    armorOptions.addEventListener('click', function (event) {
      const button = event.target.closest('[data-armor]');
      if (!button) return;
      const value = button.getAttribute('data-armor');
      draft.armor = value === 'clear' ? null : Number(value);
      renderArmorOptions();
      renderEditorSummary();
    });

    deathOptions.addEventListener('click', function (event) {
      const button = event.target.closest('[data-death]');
      if (!button) return;
      const value = button.getAttribute('data-death');
      draft.death = value === 'clear' ? null : value;
      renderDeathOptions();
      renderEditorSummary();
    });

    deathNote.addEventListener('input', function (event) {
      draft.deathNote = event.target.value.slice(0, 80);
      if (deathCharCount) deathCharCount.textContent = draft.deathNote.length + ' / 80';
      renderEditorSummary();
    });

    skinOptions.addEventListener('click', function (event) {
      const button = event.target.closest('[data-skin]');
      if (!button) return;
      const value = button.getAttribute('data-skin');
      draft.skin = value === 'clear' ? null : value;
      renderSkinOptions();
      renderEditorSummary();
    });

    document.getElementById('reset-slot').addEventListener('click', resetDraft);
    document.getElementById('apply-slot').addEventListener('click', applySlot);
  }

  /* ---------------------------------------------------------
     Board events / toolbar
     --------------------------------------------------------- */

  function bindBoard() {
    [leftTeams, rightTeams].forEach(function (container) {
      container.addEventListener('click', function (event) {
        const row = event.target.closest('.player-row');
        if (!row) return;
        openEditor(
          row.getAttribute('data-side'),
          Number(row.getAttribute('data-team')),
          Number(row.getAttribute('data-player'))
        );
      });
    });
  }

  function copyReport() {
    const report = DeltaStore.buildReport(board);
    Delta.copyText(report).then(function () {
      Delta.toast('文字简报已复制到剪贴板');
    }).catch(function () {
      Delta.toast('复制失败，请手动选择页面内容或导出 JSON。', 'error');
    });
  }

  function timestampForFile() {
    const date = new Date();
    return date.getFullYear() + Delta.pad(date.getMonth() + 1) + Delta.pad(date.getDate()) +
      '-' + Delta.pad(date.getHours()) + Delta.pad(date.getMinutes());
  }

  function exportBoard() {
    const content = JSON.stringify(board, null, 2);
    Delta.downloadFile('零号大坝编成-' + timestampForFile() + '.json', content, 'application/json;charset=utf-8');
    Delta.toast('编成 JSON 已导出');
  }

  function askConfirm(options) {
    const title = document.getElementById('confirm-title');
    const description = document.getElementById('confirm-desc');
    const button = document.getElementById('confirm-clear');
    if (title) title.textContent = options.title;
    if (description) description.textContent = options.description;
    if (button) {
      button.textContent = options.label;
      button.className = 'btn ' + (options.tone || 'btn-danger');
    }
    confirmAction = options.action;
    confirmApi.open(modalCancelButton());
  }

  function modalCancelButton() {
    const modal = document.getElementById('confirm-modal');
    return modal ? modal.querySelector('[data-close-confirm]') : null;
  }

  function clearBoard() {
    board = DeltaStore.createBoard();
    try {
      DeltaStore.clear();
      setSaveState('', '本地自动保存');
    } catch (error) {
      setSaveState('is-error', '本地清空失败');
      Delta.toast('浏览器未能清除本地存储。', 'error');
    }
    activeSlot = null;
    draft = null;
    renderBoard();
    Delta.toast('全部编成已清空');
  }

  function importFile(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Delta.toast('文件过大，请选择本工具导出的 JSON 备份。', 'error');
      return;
    }
    file.text().then(function (text) {
      let imported;
      try {
        imported = DeltaStore.parseImport(text);
      } catch (error) {
        Delta.toast(error.message || '导入失败', 'error', 3600);
        return;
      }
      const stats = DeltaStore.getStats(imported);
      askConfirm({
        title: '用备份覆盖当前编成？',
        description: '备份包含 ' + stats.operators + ' 名干员、' + stats.configured +
          ' 个已填席位。导入后会替换当前 18 个席位，此操作无法撤销。',
        label: '导入并覆盖',
        tone: 'btn-primary',
        action: function () {
          board = imported;
          saveBoard();
          activeSlot = null;
          draft = null;
          renderBoard();
          Delta.toast('备份已导入');
        }
      });
    }).catch(function () {
      Delta.toast('无法读取这个文件。', 'error');
    });
  }

  function bindToolbar() {
    document.getElementById('copy-report').addEventListener('click', copyReport);
    document.getElementById('export-json').addEventListener('click', exportBoard);

    const importInput = document.getElementById('import-file');
    document.getElementById('import-json').addEventListener('click', function () {
      importInput.value = '';
      importInput.click();
    });
    importInput.addEventListener('change', function (event) {
      const file = event.target.files && event.target.files[0];
      importFile(file);
      event.target.value = '';
    });

    document.getElementById('clear-board').addEventListener('click', function () {
      askConfirm({
        title: '清空全部编成？',
        description: '18 个席位的干员、头甲、死后与皮肤记录都会被移除。此操作无法撤销，建议先导出 JSON 备份。',
        label: '确认清空',
        tone: 'btn-danger',
        action: clearBoard
      });
    });

    const confirmButton = document.getElementById('confirm-clear');
    confirmButton.addEventListener('click', function () {
      const action = confirmAction;
      confirmAction = null;
      confirmApi.close();
      if (action) action();
    });
  }

  function initModals() {
    editorApi = Delta.initModal(document.getElementById('editor-modal'), {
      closeSelector: '[data-close-editor]',
      initialFocus: '#operator-search'
    });

    confirmApi = Delta.initModal(document.getElementById('confirm-modal'), {
      closeSelector: '[data-close-confirm]',
      initialFocus: '[data-close-confirm]',
      onClose: function () {
        confirmAction = null;
      }
    });
  }

  Delta.onReady(function () {
    Delta.hydrateIcons();

    leftTeams = document.getElementById('left-teams');
    rightTeams = document.getElementById('right-teams');
    operatorGrid = document.getElementById('operator-grid');
    operatorSearch = document.getElementById('operator-search');
    armorOptions = document.getElementById('armor-options');
    deathOptions = document.getElementById('death-options');
    deathNote = document.getElementById('death-note');
    deathCharCount = document.getElementById('death-char-count');
    skinOptions = document.getElementById('skin-options');
    editorSummary = document.getElementById('editor-summary');
    saveState = document.getElementById('save-state');

    initModals();

    const loaded = DeltaStore.loadState();
    board = loaded.board;
    renderBoard();
    showInitialSaveState(loaded.error);

    bindBoard();
    bindEditor();
    bindToolbar();

    if (loaded.error) {
      Delta.toast('本地存档读取失败，已使用空白编成。', 'warn', 3600);
    }
  });
})();
