// ═══════════════════════════════════════
//  export.js
//  Un slide por subgrupo, paginación automática,
//  título = nombre del subgrupo,
//  footer con ORG_NAME + descripción opcional
// ═══════════════════════════════════════

const ORG_NAME      = 'Occidente Bajio M&E';
const MAX_PER_SLIDE = 6;

const Export = {
  _colors: ['CC0000', 'a80000', '009a44', 'd97706', '1d6fbf'],

  // ══ PANTALLA EXPORTAR ════════════════

  render() {
    const cont    = document.getElementById('expContent');
    const projIds = Object.keys(State.projects);
    const hasPhotos = projIds.some(id => State.getPhotosByProject(id).length > 0);

    if (!hasPhotos) {
      cont.innerHTML = `
        <div class="empty-state" style="padding:60px 20px">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          <p>Sin proyectos con fotos</p>
          <span>Toma fotos y asígnalas a un proyecto</span>
        </div>`;
      return;
    }

    // ── Bloque de descripciones (encima de todos los proyectos) ──
    const descBlock = `
      <div id="descBlock" style="margin:0 0 4px;padding:12px 14px;background:var(--bg);border-bottom:1px solid var(--border)">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span style="font-size:13px;font-weight:700;color:var(--text)">Descripción en el footer</span>
          <div style="display:flex;gap:6px" id="descToggleGroup">
            <button id="btnDescGlobal" onclick="Export._setDescMode('global')"
              class="desc-toggle on">Una para todos</button>
            <button id="btnDescPer" onclick="Export._setDescMode('per')"
              class="desc-toggle">Por subgrupo</button>
          </div>
        </div>

        <!-- Campo global -->
        <div id="descGlobalField" style="display:block">
          <label class="lbl">Descripción para todos los slides</label>
          <input class="inp" id="descGlobalInput" placeholder="Ej: Revisión semana 12 · Región Norte">
        </div>

        <!-- Campos por subgrupo — se rellenan por proyecto al exportar -->
        <div id="descPerField" style="display:none">
          <p style="font-size:12px;color:var(--muted);margin-bottom:8px">
            Cada subgrupo tiene su propio campo. Aparece al abrir el proyecto.
          </p>
        </div>

      </div>`;

    let html = descBlock + '<div id="projList">';

    projIds.forEach((pid, idx) => {
      const photos = State.getPhotosByProject(pid);
      if (!photos.length) return;

      const color = this._colors[idx % this._colors.length];
      const sgs   = State.getSubgroupsByProject(pid);
      const ungrouped = State.getUngroupedPhotos(pid);

      let subSummary = sgs.map(sg => {
        const c = State.getPhotosBySubgroup(sg.id).length;
        return `<span style="font-size:11px;color:var(--muted);margin-right:8px">${UI.esc(sg.name)} (${c})</span>`;
      }).join('');
      if (ungrouped.length) {
        subSummary += `<span style="font-size:11px;color:var(--muted)">Sin subgrupo (${ungrouped.length})</span>`;
      }

      // Campos de descripción por subgrupo (ocultos hasta que el modo sea 'per')
      const sgDescFields = [
        ...sgs.map(sg => `
          <div class="sg-desc-field" style="margin-bottom:8px">
            <label class="lbl" style="margin-bottom:4px">${UI.esc(sg.name)}</label>
            <input class="inp" id="desc_${sg.id}"
              placeholder="Descripción para este subgrupo (opcional)"
              style="font-size:13px;padding:8px 10px">
          </div>`),
        ungrouped.length ? `
          <div class="sg-desc-field" style="margin-bottom:8px">
            <label class="lbl" style="margin-bottom:4px">Sin subgrupo</label>
            <input class="inp" id="desc___none__"
              placeholder="Descripción para este subgrupo (opcional)"
              style="font-size:13px;padding:8px 10px">
          </div>` : ''
      ].join('');

      html += `
        <div class="exp-proj-item">
          <div class="exp-proj-header" onclick="Export._toggleSection('eps_${pid}')">
            <div class="exp-proj-info">
              <div class="exp-proj-ico" style="background:#${color}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <div>
                <div class="exp-proj-title">${UI.esc(State.projects[pid])}</div>
                <div class="exp-proj-sub">${photos.length} foto${photos.length !== 1 ? 's' : ''} · ${sgs.length} subgrupo${sgs.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <button class="exp-btn"
              onclick="event.stopPropagation(); Export.exportProject('${pid}')">
              Exportar
            </button>
          </div>

          <div id="eps_${pid}" style="display:none">
            ${subSummary ? `<div style="padding:4px 14px 8px;display:flex;flex-wrap:wrap;gap:2px">${subSummary}</div>` : ''}

            <!-- Campos de descripción por subgrupo (visibles solo en modo 'per') -->
            <div id="sgDescs_${pid}" class="sg-descs-wrap" style="display:none;padding:4px 14px 8px">
              ${sgDescFields}
            </div>

            <div class="exp-thumbs">
              ${photos.slice(0, 12).map(p => `<img class="exp-thumb" src="${p.data}" alt="" loading="lazy">`).join('')}
              ${photos.length > 12 ? `<div style="width:54px;height:54px;border-radius:7px;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted);flex-shrink:0;border:1px solid var(--border)">+${photos.length - 12}</div>` : ''}
            </div>
            <div style="padding:0 12px 14px;display:flex;gap:8px">
              <button class="exp-btn del" style="flex:1"
                onclick="Projects.delete('${pid}')">
                Eliminar proyecto
              </button>
              <button class="exp-btn" style="flex:1;background:#${color}"
                onclick="Export.exportProject('${pid}')">
                Generar .pptx
              </button>
            </div>
          </div>
        </div>`;
    });

    html += '</div>';
    cont.innerHTML = html;
  },

  // ── Modo de descripción: 'off' | 'global' | 'per' ──
  _descMode: 'global',

  _setDescMode(mode) {
    this._descMode = mode;
    ['global','per'].forEach(m => {
      const btn = document.getElementById('btnDesc' + m.charAt(0).toUpperCase() + m.slice(1));
      if (btn) btn.classList.toggle('on', m === mode);
    });
    const gf = document.getElementById('descGlobalField');
    const pf = document.getElementById('descPerField');
    if (gf) gf.style.display = mode === 'global' ? 'block' : 'none';
    if (pf) pf.style.display = mode === 'per'    ? 'block' : 'none';

    // Mostrar/ocultar campos por subgrupo en cada proyecto abierto
    document.querySelectorAll('.sg-descs-wrap').forEach(el => {
      el.style.display = mode === 'per' ? 'block' : 'none';
    });
  },

  _toggleSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const open = el.style.display !== 'none';
    el.style.display = open ? 'none' : 'block';
    // Si modo 'per', mostrar/ocultar los campos de esa sección también
    if (!open && this._descMode === 'per') {
      const pid = id.replace('eps_', '');
      const wrap = document.getElementById('sgDescs_' + pid);
      if (wrap) wrap.style.display = 'block';
    }
  },

  // ── Recolecta las descripciones según el modo activo ──
  _collectDescriptions(pid) {
    if (this._descMode === 'off') return {};

    if (this._descMode === 'global') {
      const val = (document.getElementById('descGlobalInput')?.value || '').trim();
      return { __global__: val };
    }

    // 'per' — recoge un campo por subgrupo
    const sgs = pid ? State.getSubgroupsByProject(pid) : [];
    const map  = {};
    sgs.forEach(sg => {
      const val = (document.getElementById('desc_' + sg.id)?.value || '').trim();
      map[sg.id] = val;
    });
    // Sin subgrupo
    const noneVal = (document.getElementById('desc___none__')?.value || '').trim();
    if (noneVal) map['__none__'] = noneVal;
    return map;
  },

  exportProject(pid) {
    const photos = State.getPhotosByProject(pid);
    if (!photos.length) { UI.toast('No hay fotos en este proyecto'); return; }
    const descs = this._collectDescriptions(pid);
    this.generate(photos, State.projects[pid], true, pid, descs);
  },

  // ══════════════════════════════════════
  //  GENERACIÓN DEL .pptx
  // ══════════════════════════════════════
  async generate(photos, projectName, clearAfter = false, pid = null, descs = {}) {
    UI.showProgress();
    UI.setProgress(0, 'Preparando…');

    try {
      const pres  = new PptxGenJS();
      pres.layout = 'LAYOUT_16x9';
      pres.title  = projectName;
      pres.author = ORG_NAME;

      this._addCoverSlide(pres, projectName, photos, pid, descs);
      UI.setProgress(5, 'Portada lista…');

      const sections    = this._buildSections(photos, pid, descs);
      const totalSlides = sections.reduce((acc, s) => acc + s.pages.length, 0);
      let slidesDone = 0;

      for (const section of sections) {
        for (let pi = 0; pi < section.pages.length; pi++) {
          slidesDone++;
          const pct = 5 + Math.round(slidesDone / totalSlides * 90);
          UI.setProgress(pct, `"${section.title}" — slide ${pi + 1}/${section.pages.length}…`);
          await new Promise(r => setTimeout(r, 10));

          const pageLabel = section.pages.length > 1
            ? `${section.title} (${pi + 1}/${section.pages.length})`
            : section.title;

          this._addPhotoSlide(pres, section.pages[pi], pageLabel, section.footerDesc);
        }
      }

      UI.setProgress(100, 'Guardando…');

      const safeName = projectName
        .replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      await pres.writeFile({ fileName: `${safeName}.pptx` });
      UI.hideProgress();
      UI.toast(`✓ ${safeName}.pptx descargado`, 3500);

      if (clearAfter && pid) {
        setTimeout(() => {
          if (confirm(`¿Limpiar las fotos de "${State.projects[pid]}" ahora que se exportaron?`)) {
            State.removePhotosByProject(pid);
            UI.updateCount();
            Projects.renderSelect();
            this.render();
            UI.toast('🗑 Fotos limpiadas');
          }
        }, 600);
      }

    } catch (e) {
      UI.hideProgress();
      console.error(e);
      UI.toast('❌ Error al generar el PowerPoint');
    }
  },

  // ── Construye secciones, añade footerDesc a cada una ──
  _buildSections(photos, pid, descs = {}) {
    const sections  = [];
    const isGlobal  = '__global__' in descs;
    const globalVal = descs['__global__'] || '';

    const makeDesc = (key) => isGlobal ? globalVal : (descs[key] || '');

    if (pid) {
      const sgs = State.getSubgroupsByProject(pid);
      for (const sg of sgs) {
        const sgPhotos = photos.filter(p => p.subgroupId === sg.id);
        if (!sgPhotos.length) continue;
        sections.push({
          title:      sg.name,
          pages:      this._chunk(sgPhotos, MAX_PER_SLIDE),
          footerDesc: makeDesc(sg.id)
        });
      }
      const ungrouped = photos.filter(p => !p.subgroupId);
      if (ungrouped.length) {
        sections.push({
          title:      'Sin subgrupo',
          pages:      this._chunk(ungrouped, MAX_PER_SLIDE),
          footerDesc: makeDesc('__none__')
        });
      }
    } else {
      const bySubgroup = {};
      photos.forEach(p => {
        const key = p.subgroupId || '__none__';
        if (!bySubgroup[key]) bySubgroup[key] = [];
        bySubgroup[key].push(p);
      });
      Object.entries(bySubgroup).forEach(([key, ps]) => {
        const title = key === '__none__'
          ? 'Selección'
          : (State.subgroups[key]?.name || 'Subgrupo');
        sections.push({
          title,
          pages:      this._chunk(ps, MAX_PER_SLIDE),
          footerDesc: makeDesc(key)
        });
      });
    }

    if (!sections.length) {
      sections.push({
        title:      projectName || 'Fotos',
        pages:      this._chunk(photos, MAX_PER_SLIDE),
        footerDesc: globalVal
      });
    }

    return sections;
  },

  // ── Portada ─────────────────────────
  _addCoverSlide(pres, projectName, photos, pid, descs = {}) {
    const s = pres.addSlide();
    s.background = { color: 'FFFFFF' };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.18, h: 5.625,
      fill: { color: 'CC0000' }
    });

    const sgs = pid ? State.getSubgroupsByProject(pid) : [];

    s.addText(projectName, {
      x: 0.35, y: 1.3, w: 6.8, h: 1.4,
      fontSize: 34, color: '1a1a1a', bold: true,
      fontFace: 'Calibri', wrap: true, valign: 'middle'
    });

    if (sgs.length) {
      const sgList = sgs
        .map(sg => `${sg.name} (${State.getPhotosBySubgroup(sg.id).length})`)
        .join('   ·   ');
      s.addText(sgList, {
        x: 0.35, y: 2.8, w: 9.3, h: 0.35,
        fontSize: 11, color: '555555', fontFace: 'Calibri', wrap: true
      });
    }

    s.addText(
      `${photos.length} foto${photos.length !== 1 ? 's' : ''} · ` +
      new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
      { x: 0.35, y: 3.25, w: 6.8, h: 0.35, fontSize: 13, color: '888888', fontFace: 'Calibri' }
    );

    s.addText(ORG_NAME, {
      x: 0.35, y: 3.7, w: 6.8, h: 0.3,
      fontSize: 12, color: 'CC0000', bold: true, fontFace: 'Calibri'
    });

    // En la portada mostramos la descripción global si existe
    const globalDesc = descs['__global__'] || '';
    this._addFooter(s, pres, globalDesc);
  },

  // ── Slide de fotos ───────────────────
  _addPhotoSlide(pres, photos, slideTitle, footerDesc = '') {
    const s = pres.addSlide();
    s.background = { color: 'FFFFFF' };

    const SLIDE_W   = 10;
    const SLIDE_H   = 5.625;
    const HEADER_H  = 0.5;
    const FOOTER_H  = 0.42;
    const CONTENT_H = SLIDE_H - HEADER_H - FOOTER_H;
    const GAP       = 0.06;
    const NAME_H    = 0.26;
    const MARGIN    = 0.1;

    const n = photos.length;
    const { cols, rows } = this._gridLayout(n);

    const cellW = (SLIDE_W - GAP * (cols - 1) - MARGIN * 2) / cols;
    const cellH = (CONTENT_H - GAP * (rows - 1)) / rows;
    const imgH  = cellH - NAME_H;

    // Header
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: SLIDE_W, h: HEADER_H, fill: { color: 'f2f2f2' }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: HEADER_H - 0.04, w: SLIDE_W, h: 0.04, fill: { color: 'CC0000' }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.1, y: 0.1, w: 0.08, h: HEADER_H - 0.2, fill: { color: 'CC0000' }
    });
    s.addText(slideTitle.toUpperCase(), {
      x: 0.26, y: 0.05, w: SLIDE_W - 0.36, h: HEADER_H - 0.08,
      fontSize: 13, color: '1a1a1a', bold: true,
      fontFace: 'Calibri', valign: 'middle'
    });

    // Fotos
    for (let i = 0; i < n; i++) {
      const p        = photos[i];
      const col      = i % cols;
      const row      = Math.floor(i / cols);
      const x        = MARGIN + col * (cellW + GAP);
      const y        = HEADER_H + row * (cellH + GAP);
      const label    = p.description || p.location || `Foto ${i + 1}`;
      const fontSize = cols <= 2 ? 11 : cols === 3 ? 10 : 9;

      s.addText(label, {
        x, y, w: cellW, h: NAME_H,
        fontSize, color: '1a1a1a', bold: true,
        fontFace: 'Calibri', align: 'center', valign: 'middle'
      });

      s.addImage({
        data: p.data.replace(/^data:image\/\w+;base64,/, 'image/jpeg;base64,'),
        x, y: y + NAME_H, w: cellW, h: imgH,
        sizing: { type: 'cover', w: cellW, h: imgH }
      });

      if (p.timeLabel && imgH > 0.4) {
        s.addText(`${p.dateLabel}  ${p.timeLabel}`, {
          x: x + 0.04, y: y + NAME_H + imgH - 0.2,
          w: cellW - 0.08, h: 0.18,
          fontSize: 7, color: 'FFFFFF', fontFace: 'Calibri', align: 'right'
        });
      }
    }

    this._addFooter(s, pres, footerDesc);
  },

  // ── Footer: ORG_NAME izquierda, descripción derecha (siempre reserva el espacio) ──
  // Si desc está vacío → el espacio derecho queda en blanco
  _addFooter(slide, pres, desc = '') {
    const FOOTER_H = 0.42;
    const y        = 5.625 - FOOTER_H;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y, w: 10, h: FOOTER_H,
      fill: { color: 'CC0000' }
    });

    // ORG_NAME siempre izquierda
    slide.addText(ORG_NAME, {
      x: 0.2, y: y + 0.03, w: 5, h: FOOTER_H - 0.06,
      fontSize: 11, color: 'FFFFFF', bold: true,
      fontFace: 'Calibri', valign: 'middle'
    });

    // Descripción derecha — siempre se agrega el text box, vacío o no
    slide.addText(desc, {
      x: 5.2, y: y + 0.03, w: 4.6, h: FOOTER_H - 0.06,
      fontSize: 10, color: 'FFD0D0',
      fontFace: 'Calibri', valign: 'middle', align: 'right'
    });
  },

  _gridLayout(n) {
    if (n === 1) return { cols: 1, rows: 1 };
    if (n === 2) return { cols: 2, rows: 1 };
    if (n === 3) return { cols: 3, rows: 1 };
    if (n === 4) return { cols: 2, rows: 2 };
    if (n === 5) return { cols: 3, rows: 2 };
    return       { cols: 3, rows: 2 };
  },

  _chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
};