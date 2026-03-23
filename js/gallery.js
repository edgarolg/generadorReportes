// ═══════════════════════════════════════
//  gallery.js
//  Galería agrupada por subgrupo,
//  modo selección y reasignación de subgrupo
// ═══════════════════════════════════════

const Gallery = {
  selectMode:    false,
  selectedIds:   new Set(),
  detailPhotoId: null,

  render() {
    const cont    = document.getElementById('galContent');
    const hint    = document.getElementById('galHint');
    const projIds = Object.keys(State.projects);

    if (!State.photos.length) {
      cont.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <p>Aún no hay fotos</p>
          <span>Toma fotos desde la pestaña Capturar</span>
        </div>`;
      hint.textContent = '';
      return;
    }

    hint.textContent = this.selectMode ? 'Toca para seleccionar' : 'Mantén para seleccionar';

    let html = '';

    for (const pid of projIds) {
      const projPhotos = State.getPhotosByProject(pid);
      if (!projPhotos.length) continue;

      const sgs = State.getSubgroupsByProject(pid);

      // Encabezado del proyecto
      html += `<div style="padding:14px 14px 4px">
        <span style="font-size:12px;font-weight:700;color:var(--acc);text-transform:uppercase;letter-spacing:.5px">
          ${UI.esc(State.projects[pid])}
        </span>
      </div>`;

      // Subgrupos
      for (const sg of sgs) {
        const photos = State.getPhotosBySubgroup(sg.id);
        if (!photos.length) continue;
        html += this._sectionHTML(sg.name, sg.id, photos, true);
      }

      // Fotos sin subgrupo
      const ungrouped = State.getUngroupedPhotos(pid);
      if (ungrouped.length) {
        html += this._sectionHTML('Sin subgrupo', null, ungrouped, false);
      }
    }

    // Fotos de proyectos eliminados
    const orphans = State.photos.filter(p => !State.projects[p.projectId]);
    if (orphans.length) {
      html += this._sectionHTML('Sin proyecto', null, orphans, false);
    }

    cont.innerHTML = html || `<div class="empty-state"><p>Sin fotos aún</p></div>`;
  },

  _sectionHTML(title, sgId, photos, isDeletable) {
    const delBtn = isDeletable
      ? `<button onclick="Projects.deleteSubgroup('${sgId}')"
           style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:2px 8px;line-height:1">
           ✕
         </button>`
      : '';

    return `
      <div class="proj-section">
        <div class="proj-label">
          <div class="proj-name">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            ${UI.esc(title)}
            <span class="proj-cnt">${photos.length} foto${photos.length !== 1 ? 's' : ''}</span>
          </div>
          ${delBtn}
        </div>
        <div class="photo-grid">
          ${photos.map(p => this._cardHTML(p)).join('')}
        </div>
      </div>`;
  },

  _cardHTML(p) {
    const selected = this.selectedIds.has(p.id);
    return `
      <div class="photo-card${selected ? ' selected' : ''}" id="card_${p.id}"
        onclick="Gallery._handleClick('${p.id}')"
        oncontextmenu="Gallery._startSelect('${p.id}'); return false">
        <img src="${p.data}" alt="" loading="lazy">
        <div class="photo-sel-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div class="photo-time">${p.timeLabel}</div>
        <div class="photo-meta">
          ${p.location ? `
            <div class="loc">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>${UI.esc(p.location)}
            </div>` : ''}
          ${p.description ? `<div class="desc">${UI.esc(p.description)}</div>` : ''}
        </div>
      </div>`;
  },

  _handleClick(id) {
    if (this.selectMode) this._toggleSelect(id);
    else this.openDetail(id);
  },

  _startSelect(id) {
    this.selectMode = true;
    document.getElementById('selToolbar').style.display = 'flex';
    document.getElementById('galBar').style.display     = 'flex';
    document.getElementById('galHint').textContent = 'Toca para seleccionar';
    this._toggleSelect(id);
  },

  _toggleSelect(id) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);

    const n = this.selectedIds.size;
    document.getElementById('selCount').textContent =
      `${n} seleccionada${n !== 1 ? 's' : ''}`;

    const card = document.getElementById('card_' + id);
    if (card) card.classList.toggle('selected', this.selectedIds.has(id));
  },

  cancelSelect() {
    this.selectMode = false;
    this.selectedIds.clear();
    document.getElementById('selToolbar').style.display = 'none';
    document.getElementById('galBar').style.display     = 'none';
    this.render();
  },

  // ── Asignar subgrupo desde galería ──
  openAssignSubgroup() {
    if (!this.selectedIds.size) return;

    const firstId = [...this.selectedIds][0];
    const first   = State.getPhotoById(firstId);
    if (!first) return;

    const sgs = State.getSubgroupsByProject(first.projectId);
    if (!sgs.length) {
      UI.toast('Este proyecto no tiene subgrupos. Créalos en Capturar.');
      return;
    }

    const sel = document.getElementById('assignSgSelect');
    sel.innerHTML =
      '<option value="">— Sin subgrupo —</option>' +
      sgs.map(sg => `<option value="${sg.id}">${sg.name}</option>`).join('');

    UI.openModal('modalAssign');
  },

  saveAssignSubgroup() {
    const sgId = document.getElementById('assignSgSelect').value || null;
    this.selectedIds.forEach(id => State.assignSubgroup(id, sgId));
    const n    = this.selectedIds.size;
    const name = sgId ? (State.subgroups[sgId]?.name || 'subgrupo') : 'Sin subgrupo';
    UI.closeModal('modalAssign');
    this.cancelSelect();
    UI.toast(`✓ ${n} foto${n !== 1 ? 's' : ''} → "${name}"`);
  },

  deleteSelected() {
    const n = this.selectedIds.size;
    if (!n) return;
    if (!confirm(`¿Eliminar ${n} foto${n !== 1 ? 's' : ''}?`)) return;

    this.selectedIds.forEach(id => State.removePhoto(id));
    UI.updateCount();
    this.cancelSelect();
    UI.toast(`🗑 ${n} foto${n !== 1 ? 's' : ''} eliminada${n !== 1 ? 's' : ''}`);
  },

  exportSelected() {
    if (!this.selectedIds.size) return;
    const photos = State.photos.filter(p => this.selectedIds.has(p.id));
    Export.generate(photos, 'Selección', false);
  },

  openDetail(id) {
    const p = State.getPhotoById(id);
    if (!p) return;

    this.detailPhotoId = id;
    document.getElementById('detailImg').src = p.data;

    const sgName = p.subgroupId && State.subgroups[p.subgroupId]
      ? State.subgroups[p.subgroupId].name : null;

    document.getElementById('detailLoc').innerHTML = p.location
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
           <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
           <circle cx="12" cy="10" r="3"/>
         </svg> ${UI.esc(p.location)}`
      : 'Sin ubicación';

    document.getElementById('detailDesc').textContent = p.description || 'Sin descripción';
    document.getElementById('detailTime').textContent =
      [p.dateLabel, p.timeLabel,
       State.projects[p.projectId],
       sgName].filter(Boolean).join(' · ');

    document.getElementById('detailView').classList.add('on');
  },

  closeDetail() {
    document.getElementById('detailView').classList.remove('on');
    this.detailPhotoId = null;
  },

  deleteDetailPhoto() {
    if (!this.detailPhotoId) return;
    if (!confirm('¿Eliminar esta foto?')) return;
    State.removePhoto(this.detailPhotoId);
    UI.updateCount();
    this.closeDetail();
    this.render();
    UI.toast('🗑 Foto eliminada');
  }
};