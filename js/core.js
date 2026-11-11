(function () {
  'use strict';

  const ICONS = {
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M20 12H5M11 6l-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.2 4.2"/>',
    map: '<path d="M3.5 5.5 9 3.8l6 2.1 5.5-1.8v14l-5.5 1.8-6-2.1-5.5 1.7z"/><path d="M9 3.8v14M15 5.9v14"/>',
    layers: '<path d="m12 3 8.5 4.5L12 12 3.5 7.5z"/><path d="m4 12 8 4.3 8-4.3M4 16.5l8 4.3 8-4.3"/>',
    shield: '<path d="M12 3 19 6v5.3c0 4.2-2.8 7.3-7 9.7-4.2-2.4-7-5.5-7-9.7V6z"/><path d="m9 12 2 2 4-4"/>',
    skull: '<path d="M5 11a7 7 0 1 1 14 0v3.4l-2 1.6V19h-3v-2h-4v2H7v-3l-2-1.6z"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    download: '<path d="M12 3v11M7 10l5 5 5-5"/><path d="M4 19h16"/>',
    upload: '<path d="M12 16V5M7 9l5-5 5 5"/><path d="M4 19h16"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13"/><path d="M10 11v5M14 11v5"/>',
    check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    target: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    grid: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.6 3.2-5.5 7-5.5s6.3 1.9 7 5.5"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
    reset: '<path d="M4 10a8 8 0 1 1 2 7"/><path d="M4 4v6h6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5H5V6h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 3 22 20H2z"/><path d="M12 9v5M12 17h.01"/>',
    crosshair: '<circle cx="12" cy="12" r="5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    save: '<path d="M5 3h12l3 3v15H4V4z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>'
  };

  function icon(name, className) {
    const body = ICONS[name] || ICONS.info;
    return '<svg class="icon' + (className ? ' ' + className : '') +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body + '</svg>';
  }

  function hydrateIcons(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-icon]').forEach(function (node) {
      node.innerHTML = icon(node.getAttribute('data-icon'));
      node.removeAttribute('data-icon');
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function pad(value, length) {
    return String(value).padStart(length || 2, '0');
  }

  function formatClock(date) {
    const d = date || new Date();
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) +
      ' / ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDateTime(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return '—';
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatRelative(value) {
    if (!value) return '尚未保存';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '尚未保存';
    const diff = Date.now() - d.getTime();
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + ' 小时前';
    return formatDateTime(value);
  }

  function getFocusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) {
      return el.getClientRects().length > 0 && el.getAttribute('aria-hidden') !== 'true';
    });
  }

  function initModal(modal, options) {
    const opts = Object.assign({
      closeSelector: '[data-modal-close]',
      initialFocus: null,
      onOpen: null,
      onClose: null
    }, options || {});

    let lastFocus = null;

    function open(initialFocus) {
      if (!modal || !modal.hidden) return;
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.documentElement.classList.add('modal-open');
      const preferred = initialFocus || opts.initialFocus;
      let target = null;
      if (typeof preferred === 'string') target = modal.querySelector(preferred);
      else if (preferred && preferred.focus) target = preferred;
      if (!target) target = getFocusable(modal)[0] || modal.querySelector('.modal-panel');
      requestAnimationFrame(function () {
        if (target && target.focus) target.focus({ preventScroll: true });
      });
      if (typeof opts.onOpen === 'function') opts.onOpen();
    }

    function close(restoreFocus) {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      if (!document.querySelector('.modal:not([hidden])')) {
        document.documentElement.classList.remove('modal-open');
      }
      if (typeof opts.onClose === 'function') opts.onClose();
      if (restoreFocus !== false && lastFocus && lastFocus.isConnected) {
        lastFocus.focus({ preventScroll: true });
      }
    }

    modal.addEventListener('click', function (event) {
      if (event.target.closest(opts.closeSelector)) {
        event.preventDefault();
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (modal.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable(modal);
      if (!focusable.length) {
        event.preventDefault();
        const panel = modal.querySelector('.modal-panel');
        if (panel) panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    });

    return { open: open, close: close, modal: modal };
  }

  let toastRoot = null;

  function toast(message, type, duration) {
    if (!toastRoot) {
      toastRoot = document.getElementById('toast-root');
      if (!toastRoot) {
        toastRoot = document.createElement('div');
        toastRoot.id = 'toast-root';
        toastRoot.className = 'toast-root';
        toastRoot.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastRoot);
      }
    }
    const kind = type || 'default';
    const item = document.createElement('div');
    item.className = 'toast toast-' + kind;
    item.innerHTML = icon(kind === 'error' ? 'alert' : kind === 'warn' ? 'alert' : 'check') +
      '<span>' + escapeHtml(message) + '</span>';
    toastRoot.appendChild(item);
    requestAnimationFrame(function () {
      item.classList.add('is-visible');
    });
    const delay = duration || 2800;
    setTimeout(function () {
      item.classList.remove('is-visible');
      item.classList.add('is-leaving');
      setTimeout(function () {
        item.remove();
      }, 260);
    }, delay);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      area.style.top = '0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      try {
        const ok = document.execCommand('copy');
        area.remove();
        if (ok) resolve();
        else reject(new Error('copy failed'));
      } catch (error) {
        area.remove();
        reject(error);
      }
    });
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1200);
  }

  function debounce(fn, wait) {
    let timer = null;
    return function () {
      const args = arguments;
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  window.Delta = {
    icon: icon,
    hydrateIcons: hydrateIcons,
    escapeHtml: escapeHtml,
    pad: pad,
    formatClock: formatClock,
    formatDateTime: formatDateTime,
    formatRelative: formatRelative,
    initModal: initModal,
    toast: toast,
    copyText: copyText,
    downloadFile: downloadFile,
    debounce: debounce,
    onReady: onReady,
    getFocusable: getFocusable
  };
})();
