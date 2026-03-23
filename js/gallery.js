// ═══════════════════════════════════════
//  gallery.js
//  Galería de fotos, selección múltiple y detalle
// ═══════════════════════════════════════

const Gallery = {
  selectMode: false,
  selectedIds: new Set(),
  detailPhotoId: null,

  // ── Renderiza toda la galería ───────
  render() {
    const cont = document.getElementById('galContent');
    const hint = document.getElementById('galHint');
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
      const photos = State.getPhotosByProject(pid);
      if (!photos.length) continue;

      html += `
        <div class="proj-section">
          <div class="proj-label">
            <div class="proj-name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--acc2)" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              ${UI.esc(State.projects[pid])}
              <span class="proj-cnt">${photos.length} foto${photos.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="photo-grid">
            ${photos.map(p => this._cardHTML(p)).join('')}
          </div>
        </div>`;
    }

    // Fotos huérfanas (proyecto eliminado)
    const orphans = State.photos.filter(p => !State.projects[p.projectId]);
    if (orphans.length) {
      html += `
        <div class="proj-section" style="opacity:.6">
          <div class="proj-label">
            <div class="proj-name">Sin proyecto <span class="proj-cnt">${orphans.length}</span></div>
          </div>
          <div class="photo-grid">
            ${orphans.map(p => this._cardHTML(p)).join('')}
          </div>
        </div>`;
    }

    cont.innerHTML = html || `<div class="empty-state"><p>Sin fotos aún</p></div>`;
  },

  // ── HTML de una tarjeta ─────────────
  _cardHTML(p) {
    const selected = this.selectedIds.has(p.id);
    return `
      <div class="photo-card${selected ? ' selected' : ''}" id="card_${p.id}"
        onclick="Gallery._handleClick('${p.id}')"
        oncontextmenu="Gallery._startSelect('${p.id}');return false">
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
              </svg>
              ${UI.esc(p.location)}
            </div>` : ''}
          ${p.description ? `<div class="desc">${UI.esc(p.description)}</div>` : ''}
        </div>
      </div>`;
  },

  // ── Click en tarjeta ────────────────
  _handleClick(id) {
    if (this.selectMode) this._toggleSelect(id);
    else this.openDetail(id);
  },

  // ── Inicia modo selección ───────────
  _startSelect(id) {
    this.selectMode = true;
    document.getElementById('selToolbar').style.display = 'flex';
    document.getElementById('galBar').style.display = 'flex';
    document.getElementById('galHint').textContent = 'Toca para seleccionar';
    this._toggleSelect(id);
  },

  // ── Toggle de una foto ──────────────
  _toggleSelect(id) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);

    const n = this.selectedIds.size;
    document.getElementById('selCount').textContent =
      `${n} seleccionada${n !== 1 ? 's' : ''}`;

    const card = document.getElementById('card_' + id);
    if (card) card.classList.toggle('selected', this.selectedIds.has(id));
  },

  // ── Cancela modo selección ──────────
  cancelSelect() {
    this.selectMode = false;
    this.selectedIds.clear();
    document.getElementById('selToolbar').style.display = 'none';
    document.getElementById('galBar').style.display = 'none';
    this.render();
  },

  // ── Elimina seleccionadas ───────────
  deleteSelected() {
    const n = this.selectedIds.size;
    if (!n) return;
    if (!confirm(`¿Eliminar ${n} foto${n !== 1 ? 's' : ''}?`)) return;

    this.selectedIds.forEach(id => State.removePhoto(id));
    UI.updateCount();
    this.cancelSelect();
    UI.toast(`🗑 ${n} foto${n !== 1 ? 's' : ''} eliminada${n !== 1 ? 's' : ''}`);
  },

  // ── Exporta seleccionadas ───────────
  exportSelected() {
    if (!this.selectedIds.size) return;
    const photos = State.photos.filter(p => this.selectedIds.has(p.id));
    Export.generate(photos, 'Selección_FotoReporte', false);
  },

  // ── Abre vista de detalle ───────────
  openDetail(id) {
    const p = State.getPhotoById(id);
    if (!p) return;

    this.detailPhotoId = id;
    document.getElementById('detailImg').src = p.data;
    document.getElementById('detailLoc').innerHTML = p.location
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
           <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
           <circle cx="12" cy="10" r="3"/>
         </svg> ${UI.esc(p.location)}`
      : 'Sin ubicación';
    document.getElementById('detailDesc').textContent = p.description || 'Sin descripción';
    document.getElementById('detailTime').textContent =
      `${p.dateLabel} · ${p.timeLabel} · ${State.projects[p.projectId] || 'Sin proyecto'}`;

    document.getElementById('detailView').classList.add('on');
  },

  // ── Cierra detalle ──────────────────
  closeDetail() {
    document.getElementById('detailView').classList.remove('on');
    this.detailPhotoId = null;
  },

  // ── Elimina foto desde detalle ──────
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