// ═══════════════════════════════════════
//  ui.js
//  Utilidades de UI compartidas entre módulos
// ═══════════════════════════════════════

const UI = {
  // ── Toast notification ──────────────
  toast(msg, dur = 2200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), dur);
  },

  // ── Modals ──────────────────────────
  openModal(id) {
    document.getElementById(id).classList.add('on');
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('on');
  },

  // ── Contador de fotos en nav ────────
  updateCount() {
    const n = State.photos.length;
    document.getElementById('totalCount').textContent =
      `${n} foto${n !== 1 ? 's' : ''}`;
  },

  // ── Progress overlay ────────────────
  showProgress() {
    document.getElementById('progressWrap').classList.add('on');
  },

  hideProgress() {
    document.getElementById('progressWrap').classList.remove('on');
  },

  setProgress(pct, label) {
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('progressLabel').textContent = label;
  },

  // ── Escape HTML para evitar XSS ─────
  esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

// Cierra cualquier modal al tocar el fondo
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-bg').forEach(bg => {
    bg.addEventListener('click', e => {
      if (e.target === bg) bg.classList.remove('on');
    });
  });
});