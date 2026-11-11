(function () {
  'use strict';

  const { Delta, DeltaData, DeltaStore } = window;
  const DATA = DeltaData;

  let board = null;
  let activeSlot = null;
  let filter = 'all';
  let search = '';
  let spawnDraft = null;
  let armorDraft = null;
  let armorTouched = new Set();
  let armorCommitting = false;
  let armorCloseTimer = null;
  let confirmAction = null;

  let boardSides = null;
  let leftPanel = null;
  let rightPanel = null;
  let leftTeams = null;
  let rightTeams = null;
  let spawnLabel = null;
  let saveState = null;
  let operatorGrid = null;
  let operatorSearch = null;
  let clearOperatorButton = null;
  let armorProgress = null;
  let armorHint = null;
  let helmetGrid = null;
  let vestGrid = null;
  let skinOptions = null;
  let skinSummary = null;
  let skinHint = null;

  let spawnApi = null;
  let operatorApi = null;
  let armorApi = null;
  let skinApi = null;
  let confirmApi = null;

  function escape(value) {
    return Delta.escapeHtml(value);
  }

  function operatorOf(player) {
    return player && player.operator ? DATA.OPERATOR_MAP[player.operator] : null;
  }

  function armorOf(level) {
    return level ? DATA.ARMOR_MAP[level] : null;
  }

  function skinOf(player) {
    return player && player.skin ? DATA.SKIN_MAP[player.skin] : null;
  }

  function slotLabel(slot) {
    return DATA.SIDES[slot.sideId].label + ' · ' +
      DATA.TEAM_NAMES[slot.teamIndex].label + ' · ' +
      (slot.playerIndex + 1) + '号位';
  }

  function getSlotPlayer(slot) {
    return board.sides[slot.sideId][slot.teamIndex].players[slot.playerIndex];
  }

  function activePlayer() {
    return activeSlot ? getSlotPlayer(activeSlot) : null;
  }

  function focusSlot(slot, action) {
    if (!slot) return;
    requestAnimationFrame(function () {
      const selector = '.player-row[data-side="' + slot.sideId + '"]' +
        '[data-team="' + slot.teamIndex + '"]' +
        '[data-player="' + slot.playerIndex + '"] [data-action="' + action + '"]';
      const target = document.querySelector(selector);
      if (target) target.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------
     Board rendering
     --------------------------------------------------------- */

  function playerAriaLabel(slot, player) {
    const op = operatorOf(player);
    const helmet = armorOf(player.helmet);
    const vest = armorOf(player.bodyArmor);
    const skin = skinOf(player);
    const status = player.death === 'dead' ? '死亡' : player.death === 'alive' ? '存活' : '未记录';
    return slotLabel(slot) + '。干员' + (op ? op.name : '未选择') +
      '。头甲' + (helmet ? '头盔' + helmet.roman : '未设置') +
      '、' + (vest ? '盔甲' + vest.roman : '未设置') +
      '。皮肤' + (skin ? skin.name : '无') +
      '。状态' + status + '。';
  }

  function buildPlayerRow(sideId, teamIndex, playerIndex, player) {
    const slot = { sideId: sideId, teamIndex: teamIndex, playerIndex: playerIndex };
    const op = operatorOf(player);
    const helmet = armorOf(player.helmet);
    const vest = armorOf(player.bodyArmor);
    const skin = skinOf(player);
    const hasOperator = Boolean(op);
    const skinCount = op ? op.activeSkins.length : 0;
    const statusLabel = player.death === 'dead'
      ? '死亡'
      : player.death === 'alive'
        ? '存活'
        : '—';
    const statusClass = player.death === 'dead'
      ? 'is-dead'
      : player.death === 'alive'
        ? 'is-alive'
        : 'is-empty';

    const armorMarkup =
      '<span class="armor-values">' +
        '<span class="armor-chip' + (helmet ? ' has-value' : ' is-empty') + '"' +
          (helmet ? ' style="--armor-color: ' + helmet.color + '"' : '') + '>' +
          '<b>头</b><em>' + (helmet ? helmet.roman : '—') + '</em>' +
        '</span>' +
        '<span class="armor-chip' + (vest ? ' has-value' : ' is-empty') + '"' +
          (vest ? ' style="--armor-color: ' + vest.color + '"' : '') + '>' +
          '<b>甲</b><em>' + (vest ? vest.roman : '—') + '</em>' +
        '</span>' +
      '</span>';

    return (
      '<div class="player-row' + (hasOperator ? ' has-operator' : '') + '"' +
        ' data-side="' + sideId + '" data-team="' + teamIndex + '" data-player="' + playerIndex + '"' +
        ' role="group" aria-label="' + escape(playerAriaLabel(slot, player)) + '">' +
        '<span class="player-pos" aria-hidden="true">' + Delta.pad(playerIndex + 1, 2) + '</span>' +

        '<button class="player-cell op-cell" type="button" data-action="operator"' +
          ' aria-label="' + escape(slotLabel(slot) + '，' + (op ? '当前干员' + op.name : '选择干员')) + '">' +
          '<span class="operator-avatar' + (op ? '' : ' is-empty') + '"' +
            (op ? ' style="--op-accent: ' + op.accent + '"' : '') + ' aria-hidden="true">' +
            (op ? op.glyph : '+') +
          '</span>' +
          '<span class="operator-copy">' +
            '<strong class="' + (op ? '' : 'is-empty') + '">' + (op ? escape(op.name) : '选干员') + '</strong>' +
            '<small>' + (op ? escape(DATA.ROLES[op.role].label) : '点击记录') + '</small>' +
          '</span>' +
        '</button>' +

        '<button class="player-cell armor-cell' + (hasOperator ? '' : ' is-locked') + '"' +
          ' type="button" data-action="armor"' +
          ' title="' + escape(helmet || vest ? '修改头盔与盔甲' : '补记头盔与盔甲') + '"' +
          ' aria-label="' + escape(slotLabel(slot) + '，补记头甲') + '"' +
          (hasOperator ? '' : ' aria-disabled="true"') + '>' +
          '<span class="cell-label">头甲</span>' +
          armorMarkup +
        '</button>' +

        '<button class="player-cell skin-cell' + (hasOperator && skinCount ? '' : ' is-locked') + '"' +
          ' type="button" data-action="skin"' +
          ' aria-label="' + escape(slotLabel(slot) + '，选择皮肤') + '"' +
          (hasOperator && skinCount ? '' : ' aria-disabled="true"') + '>' +
          '<span class="cell-label">皮肤</span>' +
          '<span class="skin-values">' +
            (skin
              ? '<i class="skin-swatch" style="--skin-color: ' + skin.color + '; --skin-color2: ' + skin.color2 + '"></i>' +
                '<span>' + escape(skin.name) + '</span>'
              : '<span class="cell-empty">' + (hasOperator && !skinCount ? '无' : '—') + '</span>') +
          '</span>' +
        '</button>' +

        '<button class="status-cell ' + statusClass + '" type="button" data-action="status"' +
          ' aria-label="' + escape(slotLabel(slot) + '，当前' + statusLabel + '，点击切换存活或死亡') + '"' +
          ' aria-pressed="' + (player.death === 'dead' ? 'true' : 'false') + '"' +
          (hasOperator ? '' : ' aria-disabled="true"') + '>' +
          '<span>' + statusLabel + '</span>' +
        '</button>' +
      '</div>'
    );
  }

  function buildTeam(sideId, team, teamIndex) {
    const teamMeta = DATA.TEAM_NAMES[teamIndex];
    const opCount = team.players.filter(function (player) {
      return Boolean(player.operator);
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
          '<span class="team-filled' + (opCount === 3 ? ' is-complete' : '') + '">' + opCount + ' / 3</span>' +
        '</header>' +
        '<div class="player-list">' + rows + '</div>' +
      '</article>'
    );
  }

  function updateSpawnUI() {
    const hasSpawn = Boolean(board.spawnSide && board.spawnPosition);
    const order = board.spawnSide === 'right' ? ['right', 'left'] : ['left', 'right'];

    order.forEach(function (sideId) {
      boardSides.appendChild(sideId === 'left' ? leftPanel : rightPanel);
    });

    [leftPanel, rightPanel].forEach(function (panel) {
      const sideId = panel.getAttribute('data-side');
      const isSpawn = hasSpawn && board.spawnSide === sideId;
      panel.classList.toggle('is-spawn', isSpawn);
      const badge = document.getElementById(sideId + '-spawn-badge');
      if (badge) badge.hidden = !isSpawn;
    });

    if (spawnLabel) {
      spawnLabel.textContent = hasSpawn
        ? DATA.SIDES[board.spawnSide].label + ' · ' + DATA.SPAWN_POSITIONS[board.spawnPosition].label
        : '未设置';
    }
    const spawnButton = document.getElementById('open-spawn');
    if (spawnButton) spawnButton.classList.toggle('is-set', hasSpawn);
  }

  function renderBoard() {
    leftTeams.innerHTML = board.sides.left.map(function (team, index) {
      return buildTeam('left', team, index);
    }).join('');
    rightTeams.innerHTML = board.sides.right.map(function (team, index) {
      return buildTeam('right', team, index);
    }).join('');
    updateSpawnUI();
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
    if (slotsCount) {
      slotsCount.textContent = stats.operators === 0
        ? '点击干员即记录'
        : (stats.helmets + stats.armors) + ' 项头甲 · ' + stats.skins + ' 个皮肤';
    }
    if (progressRing) {
      progressRing.style.setProperty('--progress', String(stats.percent));
      progressRing.setAttribute('role', 'progressbar');
      progressRing.setAttribute('aria-valuemin', '0');
      progressRing.setAttribute('aria-valuemax', '100');
      progressRing.setAttribute('aria-valuenow', String(stats.percent));
      progressRing.setAttribute('aria-label', '干员记录进度 ' + stats.percent + '%');
    }
    if (progressRingLabel) progressRingLabel.textContent = stats.percent + '%';
    if (progressBar) progressBar.style.width = stats.percent + '%';
    if (leftCount) leftCount.textContent = stats.sides.left.operators;
    if (rightCount) rightCount.textContent = stats.sides.right.operators;
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
      Delta.toast('浏览器未能写入本地存储，请检查隐私设置或空间。', 'error', 3800);
      return false;
    }
  }

  function showInitialSaveState(loaded) {
    if (loaded.error) {
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
     Operator picker
     --------------------------------------------------------- */

  function filteredOperators() {
    const query = search.trim().toLowerCase();
    return DATA.OPERATORS.filter(function (operator) {
      if (filter !== 'all' && operator.role !== filter) return false;
      if (!query) return true;
      const role = DATA.ROLES[operator.role];
      const skins = operator.activeSkins.map(function (skin) { return skin.name; }).join(' ');
      const haystack = [
        operator.name,
        operator.en,
        (operator.aliases || []).join(' '),
        operator.tag,
        role.label,
        role.en,
        skins
      ].join(' ').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function renderOperatorGrid() {
    const list = filteredOperators();
    const count = document.getElementById('operator-result-count');
    if (count) count.textContent = list.length + ' 名干员';
    const current = activePlayer();
    const selectedId = current && current.operator;

    if (!list.length) {
      operatorGrid.innerHTML =
        '<div class="operator-empty">' +
          Delta.icon('search') +
          '<strong>没有找到匹配干员</strong>' +
          '<span>换个关键词，或切换定位</span>' +
        '</div>';
      return;
    }

    operatorGrid.innerHTML = list.map(function (operator) {
      const selected = operator.id === selectedId;
      const role = DATA.ROLES[operator.role];
      const skinDots = operator.activeSkins.map(function (skin) {
        return '<i class="mini-skin" style="--skin-color: ' + skin.color + '; --skin-color2: ' + skin.color2 + '" title="' + escape(skin.name) + '"></i>';
      }).join('');
      return (
        '<button class="operator-card' + (selected ? ' is-selected' : '') + '" type="button"' +
          ' data-operator-id="' + operator.id + '" style="--op-accent: ' + operator.accent + '"' +
          ' aria-pressed="' + (selected ? 'true' : 'false') + '"' +
          ' aria-label="' + escape(operator.name + '，' + role.label + (operator.activeSkins.length ? '，有可用皮肤' : '')) + '">' +
          '<span class="operator-card-top">' +
            '<span class="summary-avatar" aria-hidden="true">' + operator.glyph + '</span>' +
            '<span class="operator-role">' + role.label + '</span>' +
          '</span>' +
          '<span class="operator-card-name">' + escape(operator.name) + '</span>' +
          '<span class="operator-card-en">' + escape(operator.en) + '</span>' +
          '<span class="operator-card-tag">' + escape(operator.tag) + '</span>' +
          (skinDots ? '<span class="operator-skin-dots" aria-label="有皮肤">' + skinDots + '</span>' : '') +
          '<span class="operator-check" aria-hidden="true">' + Delta.icon('check') + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function setOperatorFilter(filterValue) {
    filter = filterValue;
    document.querySelectorAll('#filter-tabs [data-filter]').forEach(function (button) {
      const active = button.getAttribute('data-filter') === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderOperatorGrid();
  }

  function openOperatorPicker(sideId, teamIndex, playerIndex) {
    Delta.clearToasts();
    activeSlot = { sideId: sideId, teamIndex: teamIndex, playerIndex: playerIndex };
    const player = activePlayer();
    const side = DATA.SIDES[sideId];
    const team = DATA.TEAM_NAMES[teamIndex];
    filter = 'all';
    search = '';
    if (operatorSearch) operatorSearch.value = '';
    if (clearOperatorButton) clearOperatorButton.hidden = !player.operator;

    document.getElementById('operator-kicker').textContent =
      side.code + ' / TEAM ' + Delta.pad(teamIndex + 1, 2) + ' / SLOT ' + Delta.pad(playerIndex + 1, 2);
    document.getElementById('operator-title').textContent =
      side.label + ' · ' + team.label + ' · ' + (playerIndex + 1) + '号位';

    document.querySelectorAll('#filter-tabs [data-filter]').forEach(function (button) {
      const active = button.getAttribute('data-filter') === 'all';
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderOperatorGrid();

    const mobile = window.matchMedia('(max-width: 700px)').matches;
    operatorApi.open(mobile ? '[data-close-operator]' : '#operator-search');
  }

  function selectOperator(operatorId) {
    if (!activeSlot) return;
    const player = activePlayer();
    const operator = DATA.OPERATOR_MAP[operatorId];
    if (!operator) return;
    const slot = activeSlot;

    player.operator = operatorId;
    if (!player.death) player.death = 'alive';
    if (!DATA.isSkinAllowed(operatorId, player.skin)) player.skin = null;

    saveBoard();
    operatorApi.close();
    activeSlot = null;
    renderBoard();
    focusSlot(slot, 'operator');
    Delta.toast(operator.name + ' 已记录 · ' + slotLabel(slot));
  }

  function clearOperator() {
    if (!activeSlot) return;
    const slot = activeSlot;
    const player = activePlayer();
    player.operator = null;
    player.skin = null;
    player.death = null;
    saveBoard();
    operatorApi.close();
    activeSlot = null;
    renderBoard();
    focusSlot(slot, 'operator');
    Delta.toast('已清除干员，头甲数据保留');
  }

  /* ---------------------------------------------------------
     Head / body armor
     --------------------------------------------------------- */

  function renderArmorLevels(field) {
    const container = field === 'helmet' ? helmetGrid : vestGrid;
    container.innerHTML = DATA.ARMOR_LEVELS.map(function (armor) {
      const selected = armorDraft[field] === armor.level;
      return (
        '<button class="armor-level' + (selected ? ' is-selected' : '') + '" type="button"' +
          ' data-armor-field="' + field + '" data-armor-level="' + armor.level + '"' +
          ' style="--armor-color: ' + armor.color + '"' +
          ' aria-pressed="' + (selected ? 'true' : 'false') + '">' +
          '<span class="armor-level-roman">' + armor.roman + '</span>' +
          '<span class="armor-level-name">' + armor.name + '</span>' +
          '<span class="armor-level-hint">' + armor.hint + '</span>' +
          '<span class="armor-level-check" aria-hidden="true">' + Delta.icon('check') + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function renderArmorPicker() {
    renderArmorLevels('helmet');
    renderArmorLevels('bodyArmor');
    const count = armorTouched.size;
    if (armorProgress) armorProgress.textContent = count + ' / 2';
    if (!armorHint) return;

    if (count === 0) {
      const hasValues = armorDraft.helmet || armorDraft.bodyArmor;
      armorHint.textContent = hasValues
        ? '当前已记录头甲；要修改请重新各点选一次，第二项点击后自动保存。'
        : '先选头盔，再选盔甲；两项都选好后自动保存。';
    } else if (count === 1) {
      armorHint.textContent = armorTouched.has('helmet')
        ? '头盔已选，再点选盔甲完成确认；中途关闭不会保存。'
        : '盔甲已选，再点选头盔完成确认；中途关闭不会保存。';
    } else {
      armorHint.textContent = '两项已选，正在保存…';
    }
  }

  function openArmorPicker(sideId, teamIndex, playerIndex) {
    Delta.clearToasts();
    activeSlot = { sideId: sideId, teamIndex: teamIndex, playerIndex: playerIndex };
    const player = activePlayer();
    if (!player.operator) {
      Delta.toast('先选干员，再补头甲。', 'warn');
      activeSlot = null;
      return;
    }
    armorDraft = { helmet: player.helmet, bodyArmor: player.bodyArmor };
    armorTouched = new Set();
    armorCommitting = false;
    const operator = operatorOf(player);
    document.getElementById('armor-kicker').textContent = 'LOADOUT / ' + slotLabel(activeSlot).toUpperCase();
    document.getElementById('armor-title').textContent = operator.name + ' · 头盔与盔甲';
    renderArmorPicker();
    armorApi.open('#helmet-grid .armor-level');
  }

  function chooseArmor(field, level) {
    if (!armorDraft || armorCommitting) return;
    armorDraft[field] = level;
    armorTouched.add(field);
    renderArmorPicker();

    if (armorTouched.size === 2 && armorDraft.helmet && armorDraft.bodyArmor) {
      armorCommitting = true;
      const slot = activeSlot;
      const player = activePlayer();
      player.helmet = armorDraft.helmet;
      player.bodyArmor = armorDraft.bodyArmor;
      saveBoard();
      renderArmorPicker();
      armorCloseTimer = setTimeout(function () {
        armorApi.close();
        activeSlot = null;
        armorDraft = null;
        armorTouched = new Set();
        armorCommitting = false;
        armorCloseTimer = null;
        renderBoard();
        focusSlot(slot, 'armor');
        Delta.toast('头甲已记录：头' + DATA.ARMOR_MAP[player.helmet].roman +
          ' / 甲' + DATA.ARMOR_MAP[player.bodyArmor].roman);
      }, 240);
    }
  }

  /* ---------------------------------------------------------
     Skins
     --------------------------------------------------------- */

  function renderSkinPicker() {
    const player = activePlayer();
    const operator = operatorOf(player);
    if (!operator) return;
    const skins = DATA.getOperatorSkins(operator.id);

    skinSummary.innerHTML =
      '<span class="summary-avatar" style="--op-accent: ' + operator.accent + '" aria-hidden="true">' + operator.glyph + '</span>' +
      '<span><small>当前干员</small><strong>' + escape(operator.name) + '</strong></span>' +
      '<span class="skin-count">' + (skins.length ? skins.length + ' 个可选' : '暂无皮肤') + '</span>';

    const buttons = skins.map(function (skin) {
      const selected = player.skin === skin.id;
      return (
        '<button class="skin-option' + (selected ? ' is-selected' : '') + '" type="button"' +
          ' data-skin-id="' + skin.id + '"' +
          ' style="--skin-color: ' + skin.color + '; --skin-color2: ' + skin.color2 + '"' +
          ' aria-pressed="' + (selected ? 'true' : 'false') + '">' +
          '<i class="skin-swatch"></i>' +
          '<span><strong>' + escape(skin.name) + '</strong><small>点击即保存</small></span>' +
          '<span class="skin-option-check" aria-hidden="true">' + Delta.icon('check') + '</span>' +
        '</button>'
      );
    });
    buttons.push(
      '<button class="skin-option is-none' + (!player.skin ? ' is-selected' : '') + '" type="button" data-skin-id="none" aria-pressed="' + (!player.skin ? 'true' : 'false') + '">' +
        '<i class="skin-swatch is-none"></i>' +
        '<span><strong>不使用皮肤</strong><small>清除记录</small></span>' +
        '<span class="skin-option-check" aria-hidden="true">' + Delta.icon('check') + '</span>' +
      '</button>'
    );

    skinOptions.innerHTML = buttons.join('');
    skinHint.textContent = skins.length
      ? '只显示该干员可用的皮肤，点击即保存。'
      : '该干员暂时没有可选皮肤；你可以直接关闭。';
  }

  function openSkinPicker(sideId, teamIndex, playerIndex) {
    Delta.clearToasts();
    activeSlot = { sideId: sideId, teamIndex: teamIndex, playerIndex: playerIndex };
    const player = activePlayer();
    const operator = operatorOf(player);
    if (!operator) {
      Delta.toast('先选干员，再补皮肤。', 'warn');
      activeSlot = null;
      return;
    }
    document.getElementById('skin-kicker').textContent = 'SKIN / ' + slotLabel(activeSlot).toUpperCase();
    document.getElementById('skin-title').textContent = operator.name + ' · 皮肤';
    renderSkinPicker();
    const first = skinOptions.querySelector('.skin-option');
    skinApi.open(first);
  }

  function selectSkin(skinId) {
    if (!activeSlot) return;
    const slot = activeSlot;
    const player = activePlayer();
    const operator = operatorOf(player);
    if (!operator) return;
    if (skinId !== 'none' && !DATA.isSkinAllowed(operator.id, skinId)) return;
    player.skin = skinId === 'none' ? null : skinId;
    saveBoard();
    skinApi.close();
    activeSlot = null;
    renderBoard();
    focusSlot(slot, 'skin');
    Delta.toast(player.skin
      ? '皮肤「' + DATA.SKIN_MAP[player.skin].name + '」已记录'
      : '皮肤已清除');
  }

  /* ---------------------------------------------------------
     Alive / dead
     --------------------------------------------------------- */

  function toggleDeath(sideId, teamIndex, playerIndex) {
    const slot = { sideId: sideId, teamIndex: teamIndex, playerIndex: playerIndex };
    const player = getSlotPlayer(slot);
    if (!player.operator) {
      Delta.toast('先选干员，再记录存活状态。', 'warn');
      return;
    }
    player.death = player.death === 'dead' ? 'alive' : 'dead';
    saveBoard();
    renderBoard();
    focusSlot(slot, 'status');
  }

  /* ---------------------------------------------------------
     Spawn setup
     --------------------------------------------------------- */

  function renderSpawnSetup() {
    const sides = document.querySelectorAll('#spawn-side-options [data-spawn-side]');
    sides.forEach(function (button) {
      const selected = button.getAttribute('data-spawn-side') === spawnDraft.side;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    const positions = document.querySelectorAll('#spawn-position-options [data-spawn-position]');
    positions.forEach(function (button) {
      const selected = button.getAttribute('data-spawn-position') === spawnDraft.position;
      const enabled = Boolean(spawnDraft.side);
      button.disabled = !enabled;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    const posStep = document.getElementById('spawn-pos-step');
    if (posStep) posStep.classList.toggle('is-locked', !spawnDraft.side);
  }

  function openSpawnSetup() {
    Delta.clearToasts();
    spawnDraft = {
      side: board.spawnSide,
      position: board.spawnPosition
    };
    renderSpawnSetup();
    const focus = spawnDraft.side
      ? document.querySelector('#spawn-position-options [data-spawn-position="' + (spawnDraft.position || 'first') + '"]')
      : document.querySelector('#spawn-side-options [data-spawn-side="left"]');
    spawnApi.open(focus);
  }

  function chooseSpawnSide(sideId) {
    if (!spawnDraft) return;
    spawnDraft.side = sideId;
    renderSpawnSetup();
    const pos = document.querySelector('#spawn-position-options [data-spawn-position="' + (spawnDraft.position || 'first') + '"]');
    if (pos) pos.focus();
  }

  function chooseSpawnPosition(positionId) {
    if (!spawnDraft || !spawnDraft.side) {
      Delta.toast('先选择出生侧。', 'warn');
      return;
    }
    spawnDraft.position = positionId;
    board.spawnSide = spawnDraft.side;
    board.spawnPosition = spawnDraft.position;
    saveBoard();
    spawnApi.close();
    renderBoard();
    const text = DATA.SIDES[board.spawnSide].label + ' · ' + DATA.SPAWN_POSITIONS[board.spawnPosition].label;
    Delta.toast('本局出生已记录：' + text);
  }

  /* ---------------------------------------------------------
     Toolbar
     --------------------------------------------------------- */

  function copyReport() {
    const report = DeltaStore.buildReport(board);
    Delta.copyText(report).then(function () {
      Delta.toast('文字简报已复制到剪贴板');
    }).catch(function () {
      Delta.toast('复制失败，请改用导出 JSON。', 'error');
    });
  }

  function timestampForFile() {
    const date = new Date();
    return date.getFullYear() + Delta.pad(date.getMonth() + 1) + Delta.pad(date.getDate()) +
      '-' + Delta.pad(date.getHours()) + Delta.pad(date.getMinutes());
  }

  function exportBoard() {
    Delta.downloadFile(
      '零号大坝编成-' + timestampForFile() + '.json',
      JSON.stringify(board, null, 2),
      'application/json;charset=utf-8'
    );
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
    const modal = document.getElementById('confirm-modal');
    confirmApi.open(modal ? modal.querySelector('[data-close-confirm]') : null);
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
    armorDraft = null;
    armorTouched = new Set();
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
          ' 个已填席位。导入后会替换当前 18 个席位。',
        label: '导入并覆盖',
        tone: 'btn-primary',
        action: function () {
          board = imported;
          saveBoard();
          activeSlot = null;
          armorDraft = null;
          armorTouched = new Set();
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
      importFile(event.target.files && event.target.files[0]);
      event.target.value = '';
    });

    document.getElementById('clear-board').addEventListener('click', function () {
      askConfirm({
        title: '清空全部编成？',
        description: '18 个席位的干员、头甲、皮肤与存活状态都会被移除，本局出生设置也会清除。建议先导出备份。',
        label: '确认清空',
        tone: 'btn-danger',
        action: clearBoard
      });
    });

    document.getElementById('confirm-clear').addEventListener('click', function () {
      const action = confirmAction;
      confirmAction = null;
      confirmApi.close();
      if (action) action();
    });
  }

  /* ---------------------------------------------------------
     Binding
     --------------------------------------------------------- */

  function handleBoardClick(event) {
    const cell = event.target.closest('[data-action]');
    if (!cell) return;
    const row = cell.closest('.player-row');
    if (!row) return;
    const sideId = row.getAttribute('data-side');
    const teamIndex = Number(row.getAttribute('data-team'));
    const playerIndex = Number(row.getAttribute('data-player'));
    const player = getSlotPlayer({ sideId: sideId, teamIndex: teamIndex, playerIndex: playerIndex });

    switch (cell.getAttribute('data-action')) {
      case 'operator':
        openOperatorPicker(sideId, teamIndex, playerIndex);
        break;
      case 'armor':
        if (!player.operator) {
          Delta.toast('先选干员，再补头甲。', 'warn');
        } else {
          openArmorPicker(sideId, teamIndex, playerIndex);
        }
        break;
      case 'skin':
        if (!player.operator) {
          Delta.toast('先选干员，再补皮肤。', 'warn');
        } else if (!DATA.getOperatorSkins(player.operator).length) {
          Delta.toast('该干员暂无皮肤选项。', 'warn');
        } else {
          openSkinPicker(sideId, teamIndex, playerIndex);
        }
        break;
      case 'status':
        toggleDeath(sideId, teamIndex, playerIndex);
        break;
      default:
        break;
    }
  }

  function bindOperatorPicker() {
    operatorGrid.addEventListener('click', function (event) {
      const card = event.target.closest('[data-operator-id]');
      if (!card) return;
      selectOperator(card.getAttribute('data-operator-id'));
    });

    document.getElementById('filter-tabs').addEventListener('click', function (event) {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      setOperatorFilter(button.getAttribute('data-filter'));
    });

    operatorSearch.addEventListener('input', function (event) {
      search = event.target.value;
      renderOperatorGrid();
    });

    clearOperatorButton.addEventListener('click', clearOperator);
  }

  function bindArmorPicker() {
    [helmetGrid, vestGrid].forEach(function (grid) {
      grid.addEventListener('click', function (event) {
        const button = event.target.closest('[data-armor-level]');
        if (!button) return;
        chooseArmor(
          button.getAttribute('data-armor-field'),
          Number(button.getAttribute('data-armor-level'))
        );
      });
    });
  }

  function bindSkinPicker() {
    skinOptions.addEventListener('click', function (event) {
      const button = event.target.closest('[data-skin-id]');
      if (!button) return;
      selectSkin(button.getAttribute('data-skin-id'));
    });
  }

  function bindSpawnPicker() {
    document.getElementById('open-spawn').addEventListener('click', openSpawnSetup);

    document.getElementById('spawn-side-options').addEventListener('click', function (event) {
      const button = event.target.closest('[data-spawn-side]');
      if (!button) return;
      chooseSpawnSide(button.getAttribute('data-spawn-side'));
    });

    document.getElementById('spawn-position-options').addEventListener('click', function (event) {
      const button = event.target.closest('[data-spawn-position]');
      if (!button || button.disabled) return;
      chooseSpawnPosition(button.getAttribute('data-spawn-position'));
    });
  }

  function initModals() {
    spawnApi = Delta.initModal(document.getElementById('spawn-modal'), {
      closeSelector: '[data-close-spawn]',
      initialFocus: '#spawn-side-options [data-spawn-side="left"]'
    });

    operatorApi = Delta.initModal(document.getElementById('operator-modal'), {
      closeSelector: '[data-close-operator]',
      initialFocus: '#operator-search'
    });

    armorApi = Delta.initModal(document.getElementById('armor-modal'), {
      closeSelector: '[data-close-armor]',
      initialFocus: '#helmet-grid .armor-level'
    });

    skinApi = Delta.initModal(document.getElementById('skin-modal'), {
      closeSelector: '[data-close-skin]',
      initialFocus: '#skin-options .skin-option'
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

    boardSides = document.getElementById('board-sides');
    leftPanel = document.getElementById('left-panel');
    rightPanel = document.getElementById('right-panel');
    leftTeams = document.getElementById('left-teams');
    rightTeams = document.getElementById('right-teams');
    spawnLabel = document.getElementById('spawn-label');
    saveState = document.getElementById('save-state');
    operatorGrid = document.getElementById('operator-grid');
    operatorSearch = document.getElementById('operator-search');
    clearOperatorButton = document.getElementById('clear-operator');
    armorProgress = document.getElementById('armor-progress');
    armorHint = document.getElementById('armor-hint');
    helmetGrid = document.getElementById('helmet-grid');
    vestGrid = document.getElementById('vest-grid');
    skinOptions = document.getElementById('skin-options');
    skinSummary = document.getElementById('skin-summary');
    skinHint = document.getElementById('skin-hint');

    initModals();

    const loaded = DeltaStore.loadState();
    board = loaded.board;
    renderBoard();
    showInitialSaveState(loaded);

    boardSides.addEventListener('click', handleBoardClick);
    bindOperatorPicker();
    bindArmorPicker();
    bindSkinPicker();
    bindSpawnPicker();
    bindToolbar();

    if (loaded.error) {
      Delta.toast('本地存档读取失败，已使用空白编成。', 'warn', 3600);
    } else if (loaded.usedLegacy) {
      Delta.toast('旧版存档已自动升级到头甲分离版本。', 'warn', 3600);
    }

    if (!board.spawnSide || !board.spawnPosition) {
      setTimeout(function () {
        if (!document.querySelector('.modal:not([hidden])')) openSpawnSetup();
      }, 450);
    }
  });
})();
