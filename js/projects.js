// ═══════════════════════════════════════
//  projects.js
//  Gestión de proyectos y subgrupos
// ═══════════════════════════════════════

const Projects = {

  // ══ PROYECTOS ═══════════════════════

  renderSelect() {
    const sel = document.getElementById('projSelect');
    const ids = Object.keys(State.projects);

    if (!ids.length) {
      sel.innerHTML = '<option value="">— Sin proyecto —</option>';
      this._clearSubgroupSelect();
      return;
    }

    sel.innerHTML = ids
      .map(id => `<option value="${id}">${State.projects[id]}</option>`)
      .join('');

    // Renderizar subgrupos del proyecto activo
    this.renderSubgroupSelect(sel.value);
  },

  openNew() {
    document.getElementById('newProjName').value = '';
    UI.openModal('modalProj');
    setTimeout(() => document.getElementById('newProjName').focus(), 300);
  },

  saveNew() {
    const name = document.getElementById('newProjName').value.trim();
    if (!name) { UI.toast('Escribe un nombre'); return; }

    const id = uid();
    State.addProject(id, name);
    this.renderSelect();
    document.getElementById('projSelect').value = id;
    this.renderSubgroupSelect(id);
    UI.closeModal('modalProj');
    UI.toast(`✓ Proyecto "${name}" creado`);
  },

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
  },

  // ══ SUBGRUPOS ════════════════════════

  // Rellena el <select> de subgrupos según el proyecto activo
  renderSubgroupSelect(pid) {
    const wrap = document.getElementById('subgroupRow');
    const sel  = document.getElementById('subgroupSelect');
    if (!pid) { wrap.style.display = 'none'; return; }

    const sgs = State.getSubgroupsByProject(pid);
    wrap.style.display = 'flex';

    if (!sgs.length) {
      sel.innerHTML = '<option value="">— Sin subgrupo —</option>';
      return;
    }

    sel.innerHTML =
      '<option value="">— Sin subgrupo —</option>' +
      sgs.map(sg => `<option value="${sg.id}">${sg.name}</option>`).join('');
  },

  _clearSubgroupSelect() {
    const wrap = document.getElementById('subgroupRow');
    if (wrap) wrap.style.display = 'none';
  },

  openNewSubgroup() {
    const pid = document.getElementById('projSelect').value;
    if (!pid) { UI.toast('Selecciona un proyecto primero'); return; }
    document.getElementById('newSgName').value = '';
    UI.openModal('modalSubgroup');
    setTimeout(() => document.getElementById('newSgName').focus(), 300);
  },

  saveNewSubgroup() {
    const name = document.getElementById('newSgName').value.trim();
    if (!name) { UI.toast('Escribe un nombre'); return; }

    const pid = document.getElementById('projSelect').value;
    if (!pid) { UI.toast('Selecciona un proyecto primero'); return; }

    const id = uid();
    State.addSubgroup(id, name, pid);
    this.renderSubgroupSelect(pid);
    document.getElementById('subgroupSelect').value = id;
    UI.closeModal('modalSubgroup');
    UI.toast(`✓ Subgrupo "${name}" creado`);
  },

  deleteSubgroup(sgid) {
    const sg = State.subgroups[sgid];
    if (!sg) return;
    const count = State.getPhotosBySubgroup(sgid).length;
    if (!confirm(`¿Eliminar subgrupo "${sg.name}"? Las ${count} foto(s) quedarán sin subgrupo.`)) return;

    State.removeSubgroup(sgid);
    this.renderSubgroupSelect(sg.projectId);
    Gallery.render();
    UI.toast(`🗑 Subgrupo "${sg.name}" eliminado`);
  }
};