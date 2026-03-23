// ═══════════════════════════════════════
//  projects.js
//  Creación y gestión de proyectos
// ═══════════════════════════════════════

const Projects = {
  // ── Llena el <select> de proyectos ──
  renderSelect() {
    const sel = document.getElementById('projSelect');
    const ids = Object.keys(State.projects);

    if (!ids.length) {
      sel.innerHTML = '<option value="">— Sin proyecto —</option>';
      return;
    }

    sel.innerHTML = ids
      .map(id => `<option value="${id}">${State.projects[id]}</option>`)
      .join('');
  },

  // ── Abre el modal de nuevo proyecto ─
  openNew() {
    document.getElementById('newProjName').value = '';
    UI.openModal('modalProj');
    setTimeout(() => document.getElementById('newProjName').focus(), 300);
  },

  // ── Guarda el nuevo proyecto ────────
  saveNew() {
    const name = document.getElementById('newProjName').value.trim();
    if (!name) { UI.toast('Escribe un nombre'); return; }

    const id = uid();
    State.addProject(id, name);
    this.renderSelect();
    document.getElementById('projSelect').value = id;
    UI.closeModal('modalProj');
    UI.toast(`✓ Proyecto "${name}" creado`);
  },

  // ── Elimina proyecto y sus fotos ────
  delete(pid) {
    const name  = State.projects[pid];
    const count = State.getPhotosByProject(pid).length;
    if (!confirm(`¿Eliminar el proyecto "${name}" y sus ${count} foto(s)?`)) return;

    State.removePhotosByProject(pid);
    State.removeProject(pid);
    UI.updateCount();
    this.renderSelect();
    Export.render();
    UI.toast(`🗑 Proyecto "${name}" eliminado`);
  }
};