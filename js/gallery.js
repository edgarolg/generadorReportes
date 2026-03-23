// ═══════════════════════════════════════
//  gallery.js
//  Galería con proyectos colapsables,
//  fotos pequeñas en grid 4 col,
//  borrado directo por foto sin entrar al detalle
// ═══════════════════════════════════════

const Gallery = {
  selectMode:    false,
  selectedIds:   new Set(),
  detailPhotoId: null,
  // Estado abierto/cerrado de cada proyecto { [pid]: bool }
  _openProjects: {},

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

    hint.textContent = this.selectMode ? 'Toca para seleccionar' : 'Mantén foto para seleccionar';

    let html = '';

    for (const pid of projIds) {
      const projPhotos = State.getPhotosByProject(pid);
      if (!projPhotos.length) continue;

      const sgs      = State.getSubgroupsByProject(pid);
      const isOpen   = !!this._openProjects[pid];
      const total    = projPhotos.length;

      html += `
        <div style="margin:10px 12px 4px">

          <!-- Header del proyecto -->
          <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;
               background:var(--s1);border:1.5px solid var(--border);
               border-radius:${isOpen ? 'var(--r) var(--r) 0 0' : 'var(--r)'};cursor:pointer"
               onclick="Gallery._toggleProject('${pid}')">

            <!-- Flecha -->
            <svg id="gal_arrow_${pid}" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="var(--muted)" stroke-width="2.5"
              style="transition:.2s;transform:rotate(${isOpen ? '180' : '0'}deg);flex-shrink:0">
              <path d="m6 9 6 6 6-6"/>
            </svg>

            <!-- Nombre + contador -->
            <span style="font-size:13px;font-weight:700;color:var(--text);flex:1;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${UI.esc(State.projects[pid])}
            </span>
            <span style="font-size:11px;color:var(--muted);background:var(--bg);
              padding:2px 8px;border-radius:20px;border:1px solid var(--border);
              flex-shrink:0">
              ${total} foto${total !== 1 ? 's' : ''}
            </span>

            <!-- Borrar proyecto -->
            <button onclick="event.stopPropagation(); Gallery._deleteProject('${pid}')"
              style="background:none;border:none;color:var(--muted);font-size:16px;
              cursor:pointer;padding:2px 4px;line-height:1;flex-shrink:0"
              title="Eliminar proyecto">🗑</button>
          </div>

          <!-- Contenido colapsable -->
          <div id="galProj_${pid}" style="display:${isOpen ? 'block' : 'none'};
            border:1.5px solid var(--border);border-top:none;
            border-radius:0 0 var(--r) var(--r);overflow:hidden">

            ${this._projContentHTML(pid, sgs)}

          </div>
        </div>`;
    }

    // Fotos huérfanas
    const orphans = State.photos.filter(p => !State.projects[p.projectId]);
    if (orphans.length) {
      html += this._orphanSectionHTML(orphans);
    }

    cont.innerHTML = html || `<div class="empty-state"><p>Sin fotos aún</p></div>`;
  },

  // ── Contenido de un proyecto (subgrupos + sin subgrupo) ──
  _projContentHTML(pid, sgs) {
    let html = '';

    for (const sg of sgs) {
      const photos = State.getPhotosBySubgroup(sg.id);
      if (!photos.length) continue;
      html += this._subgroupHTML(sg.name, sg.id, photos);
    }

    const ungrouped = State.getUngroupedPhotos(pid);
    if (ungrouped.length) {
      html += this._subgroupHTML('Sin subgrupo', null, ungrouped);
    }

    return html || '<div style="padding:12px 14px;font-size:13px;color:var(--muted)">Sin fotos</div>';
  },

  // ── Sección de un subgrupo con su grid ──
  _subgroupHTML(title, sgId, photos) {
    const delBtn = sgId
      ? `<button onclick="event.stopPropagation();Projects.deleteSubgroup('${sgId}')"
           style="background:none;border:none;color:var(--muted);font-size:11px;
           cursor:pointer;padding:1px 6px;line-height:1">✕</button>`
      : '';

    return `
      <div style="border-top:1px solid var(--border)">
        <!-- Label del subgrupo -->
        <div style="display:flex;align-items:center;padding:6px 10px;background:var(--s1)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="var(--acc)" stroke-width="2.5" style="flex-shrink:0;margin-right:6px">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span style="font-size:12px;font-weight:700;color:var(--text);flex:1">
            ${UI.esc(title)}
          </span>
          <span style="font-size:10px;color:var(--muted);margin-right:6px">
            ${photos.length}
          </span>
          ${delBtn}
        </div>
        <!-- Grid 4 columnas -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px;background:var(--border)">
          ${photos.map(p => this._cardHTML(p)).join('')}
        </div>
      </div>`;
  },

  // ── Card individual con botón ✕ ──────
  _cardHTML(p) {
    const selected = this.selectedIds.has(p.id);
    return `
      <div class="photo-card${selected ? ' selected' : ''}" id="card_${p.id}"
        style="aspect-ratio:1/1"
        onclick="Gallery._handleClick('${p.id}')"
        oncontextmenu="Gallery._startSelect('${p.id}'); return false">
        <img src="${p.data}" alt="" loading="lazy">

        <!-- Check de selección -->
        <div class="photo-sel-check">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>

        <!-- Botón borrar individual (esquina superior izquierda, solo si NO está en modo selección) -->
        ${!this.selectMode ? `
          <button onclick="event.stopPropagation(); Gallery._deletePhoto('${p.id}')"
            style="position:absolute;top:4px;left:4px;width:20px;height:20px;
            border-radius:50%;background:rgba(0,0,0,.55);border:none;color:#fff;
            font-size:10px;cursor:pointer;display:flex;align-items:center;
            justify-content:center;line-height:1;z-index:2">✕</button>` : ''}

        <!-- Descripción si existe -->
        ${p.description ? `
          <div style="position:absolute;bottom:0;left:0;right:0;
            background:linear-gradient(transparent,rgba(0,0,0,.75));
            padding:10px 4px 4px;font-size:9px;color:rgba(255,255,255,.9);
            line-height:1.2;overflow:hidden;display:-webkit-box;
            -webkit-line-clamp:2;-webkit-box-orient:vertical">
            ${UI.esc(p.description)}
          </div>` : ''}
      </div>`;
  },

  // ── Huérfanas ────────────────────────
  _orphanSectionHTML(photos) {
    return `
      <div style="margin:10px 12px 4px">
        <div style="padding:8px 12px;background:var(--s1);border:1.5px solid var(--border);
          border-radius:var(--r) var(--r) 0 0;font-size:12px;font-weight:700;color:var(--muted)">
          Sin proyecto (${photos.length})
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px;
          background:var(--border);border:1.5px solid var(--border);border-top:none;
          border-radius:0 0 var(--r) var(--r);overflow:hidden">
          ${photos.map(p => this._cardHTML(p)).join('')}
        </div>
      </div>`;
  },

  // ── Toggle abrir/cerrar proyecto ─────
  _toggleProject(pid) {
    this._openProjects[pid] = !this._openProjects[pid];
    const panel = document.getElementById('galProj_' + pid);
    const arrow = document.getElementById('gal_arrow_' + pid);
    const header = panel?.previousElementSibling;
    const isOpen = this._openProjects[pid];

    if (panel) panel.style.display = isOpen ? 'block' : 'none';
    if (arrow) arrow.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    if (header) {
      header.style.borderRadius = isOpen
        ? 'var(--r) var(--r) 0 0'
        : 'var(--r)';
    }
  },

  // ── Borrar proyecto desde galería ────
  _deleteProject(pid) {
    const name  = State.projects[pid];
    const count = State.getPhotosByProject(pid).length;
    if (!confirm(`¿Eliminar "${name}" y sus ${count} foto${count !== 1 ? 's' : ''}?`)) return;
    State.removePhotosByProject(pid);
    State.removeProject(pid);
    UI.updateCount();
    Projects.renderSelect();
    Export.render();
    delete this._openProjects[pid];
    this.render();
    UI.toast(`🗑 "${name}" eliminado`);
  },

  // ── Borrar foto individual directo ───
  _deletePhoto(id) {
    if (!confirm('¿Eliminar esta foto?')) return;
    State.removePhoto(id);
    UI.updateCount();
    // Quitar la card del DOM sin re-renderizar todo
    const card = document.getElementById('card_' + id);
    if (card) card.remove();
    UI.toast('🗑 Foto eliminada');
  },

  // ── Click normal → menú de acciones ─
  _activePhotoId: null,

  _handleClick(id) {
    if (this.selectMode) { this._toggleSelect(id); return; }
    const p = State.getPhotoById(id);
    if (!p) return;
    this._activePhotoId = id;

    // Rellenar el modal con datos de la foto
    document.getElementById('actionThumb').src   = p.data;
    document.getElementById('actionDesc').textContent =
      p.description || '(sin descripción)';
    const sgName = p.subgroupId && State.subgroups[p.subgroupId]
      ? State.subgroups[p.subgroupId].name : null;
    document.getElementById('actionTime').textContent =
      [p.timeLabel, p.dateLabel, sgName].filter(Boolean).join(' · ');

    UI.openModal('modalPhotoActions');
  },

  // ── Opciones del menú ────────────────
  actionSelect() {
    UI.closeModal('modalPhotoActions');
    const id = this._activePhotoId;
    if (!id) return;
    // Entrar en modo selección con esta foto ya seleccionada
    this.selectMode = true;
    document.getElementById('selToolbar').style.display = 'flex';
    document.getElementById('galBar').style.display     = 'flex';
    document.getElementById('galHint').textContent = 'Toca para seleccionar';
    this.render();
    this._toggleSelect(id);
  },

  actionEditDesc() {
    UI.closeModal('modalPhotoActions');
    const p = State.getPhotoById(this._activePhotoId);
    if (!p) return;
    document.getElementById('editDescInput').value = p.description || '';
    UI.openModal('modalEditDesc');
    setTimeout(() => document.getElementById('editDescInput').focus(), 300);
  },

  saveEditDesc() {
    const p = State.getPhotoById(this._activePhotoId);
    if (!p) return;
    const newDesc = document.getElementById('editDescInput').value.trim();
    p.description = newDesc;
    State.save();
    UI.closeModal('modalEditDesc');
    this.render();
    UI.toast('✓ Descripción actualizada');
  },

  actionDelete() {
    UI.closeModal('modalPhotoActions');
    const id = this._activePhotoId;
    if (!id) return;
    if (!confirm('¿Eliminar esta foto?')) return;
    State.removePhoto(id);
    UI.updateCount();
    const card = document.getElementById('card_' + id);
    if (card) card.remove();
    UI.toast('🗑 Foto eliminada');
  },

  _startSelect(id) {
    this.selectMode = true;
    document.getElementById('selToolbar').style.display = 'flex';
    document.getElementById('galBar').style.display     = 'flex';
    document.getElementById('galHint').textContent = 'Toca para seleccionar';
    this.render(); // re-render para ocultar botones ✕ individuales
    this._toggleSelect(id);
  },

  _toggleSelect(id) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);

    const n = this.selectedIds.size;

    if (n === 0) { this.cancelSelect(); return; }

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

  // ── Asignar subgrupo desde selección ─
  openAssignSubgroup() {
    if (!this.selectedIds.size) return;
    const first = State.getPhotoById([...this.selectedIds][0]);
    if (!first) return;
    const sgs = State.getSubgroupsByProject(first.projectId);
    if (!sgs.length) { UI.toast('Este proyecto no tiene subgrupos'); return; }
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

  // ── Vista de detalle (toque normal) ──
  openDetail(id) {
    const p = State.getPhotoById(id);
    if (!p) return;
    this.detailPhotoId = id;
    document.getElementById('detailImg').src = p.data;
    const sgName = p.subgroupId && State.subgroups[p.subgroupId]
      ? State.subgroups[p.subgroupId].name : null;
    document.getElementById('detailDesc').textContent = p.description || 'Sin descripción';
    document.getElementById('detailTime').textContent =
      [p.dateLabel, p.timeLabel, State.projects[p.projectId], sgName].filter(Boolean).join(' · ');
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