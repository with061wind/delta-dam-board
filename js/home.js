(function () {
  'use strict';

  const { Delta, DeltaStore } = window;

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function refreshResume() {
    const state = DeltaStore.loadState();
    const stats = DeltaStore.getStats(state.board);
    const hasData = stats.configured > 0;
    const panel = document.getElementById('resume-panel');
    const title = document.getElementById('resume-title');
    const desc = document.getElementById('resume-desc');
    const link = document.getElementById('resume-link');
    const mapButton = document.getElementById('resume-map');
    const saved = document.getElementById('resume-saved');

    setText('hero-configured', Delta.pad(stats.configured, 2));
    setText('resume-operators', Delta.pad(stats.operators, 2));
    setText('resume-slots', Delta.pad(stats.configured, 2));
    setText('resume-percent', stats.percent + '%');
    setText('resume-progress-text', stats.configured + ' / 18');

    const progress = document.getElementById('resume-progress-bar');
    if (progress) progress.style.width = stats.percent + '%';

    if (panel) panel.classList.toggle('is-empty', !hasData);

    if (title) {
      title.textContent = hasData ? '上次编成还在。' : '还没有建立编成。';
    }
    if (desc) {
      desc.textContent = hasData
        ? '已记录 ' + stats.operators + ' 名干员、' + stats.configured + ' 个已填席位。编成只保存在当前浏览器，继续补充或调整都可以。'
        : '选择零号大坝后，所有内容会自动保存在当前浏览器；不需要登录，也不会上传。';
    }
    if (link) {
      link.hidden = !hasData;
    }
    if (mapButton) {
      mapButton.textContent = hasData ? '重新选择地图' : '选择地图';
    }
    if (saved) {
      saved.innerHTML = Delta.icon('clock') +
        (hasData
          ? '上次保存 · ' + Delta.formatRelative(state.board.updatedAt)
          : '尚未保存');
    }

    if (state.error) {
      Delta.toast('本地存档读取失败，已使用空白编成。', 'warn');
    }
  }

  function updateClock() {
    const clock = document.getElementById('header-clock');
    if (clock) clock.textContent = Delta.formatClock(new Date());
  }

  function initMapModal() {
    const modal = document.getElementById('map-modal');
    if (!modal) return;

    const mapModal = Delta.initModal(modal, {
      closeSelector: '[data-close-map]',
      initialFocus: '[data-enter-dam]'
    });

    document.querySelectorAll('[data-open-map]').forEach(function (button) {
      button.addEventListener('click', function () {
        mapModal.open();
      });
    });

    document.querySelectorAll('[data-locked-map]').forEach(function (button) {
      button.addEventListener('click', function () {
        const name = button.getAttribute('data-locked-map') || '该区域';
        Delta.toast(name + ' 的情报尚未接入，当前仅开放零号大坝。', 'warn');
      });
    });

    const enter = modal.querySelector('[data-enter-dam]');
    if (enter) {
      enter.addEventListener('click', function () {
        window.location.href = 'dam.html';
      });
    }
  }

  Delta.onReady(function () {
    Delta.hydrateIcons();
    updateClock();
    window.setInterval(updateClock, 30000);
    refreshResume();
    initMapModal();

    window.addEventListener('pageshow', function (event) {
      if (event.persisted) refreshResume();
    });
    window.addEventListener('storage', function (event) {
      if (event.key === DeltaStore.STORAGE_KEY) refreshResume();
    });
  });
})();
