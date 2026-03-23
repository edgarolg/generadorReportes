// ═══════════════════════════════════════
//  export.js
//  Exportación estilo "Frescos Soriana":
//  grid automático, nombre sobre cada foto,
//  título arriba izquierda con ▶ rojo,
//  footer rojo con nombre de organización.
// ═══════════════════════════════════════

// ── Configura aquí tu organización ─────
const ORG_NAME = 'Occidente Bajio M&E';
// ───────────────────────────────────────

const Export = {
  _colors: ['CC0000', 'a80000', '009a44', 'd97706', '1d6fbf'],

  // ── Pantalla de exportación ─────────
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

    let html = '';
    projIds.forEach((pid, idx) => {
      const photos = State.getPhotosByProject(pid);
      if (!photos.length) return;

      const color = this._colors[idx % this._colors.length];
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
                <div class="exp-proj-sub">${photos.length} foto${photos.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <button class="exp-btn"
              onclick="event.stopPropagation(); Export.exportProject('${pid}')">
              Exportar
            </button>
          </div>

          <div id="eps_${pid}" style="display:none">
            <div class="exp-thumbs">
              ${photos.map(p => `<img class="exp-thumb" src="${p.data}" alt="" loading="lazy">`).join('')}
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

    cont.innerHTML = html;
  },

  _toggleSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  exportProject(pid) {
    const photos = State.getPhotosByProject(pid);
    if (!photos.length) { UI.toast('No hay fotos en este proyecto'); return; }
    this.generate(photos, State.projects[pid], true, pid);
  },

  // ══════════════════════════════════════
  //  GENERACIÓN DEL .pptx
  // ══════════════════════════════════════
  async generate(photos, projectName, clearAfter = false, pid = null) {
    UI.showProgress();
    UI.setProgress(0, 'Preparando…');

    try {
      const pres  = new PptxGenJS();
      pres.layout = 'LAYOUT_16x9';   // 10" × 5.625"
      pres.title  = projectName;
      pres.author = ORG_NAME;

      // ── Portada ──────────────────────
      this._addCoverSlide(pres, projectName, photos.length);
      UI.setProgress(5, 'Portada lista…');

      // ── Diapositivas de fotos ────────
      const perSlide = this._photosPerSlide(photos.length);
      const pages    = this._chunk(photos, perSlide);

      for (let pi = 0; pi < pages.length; pi++) {
        const pagePhotos = pages[pi];
        const pct = 5 + Math.round((pi + 1) / pages.length * 90);
        UI.setProgress(pct, `Slide ${pi + 1} de ${pages.length}…`);
        await new Promise(r => setTimeout(r, 10));
        this._addPhotoSlide(pres, pagePhotos, projectName, pi + 1, pages.length);
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

  // ── Portada ─────────────────────────
  _addCoverSlide(pres, projectName, totalPhotos) {
    const s = pres.addSlide();
    s.background = { color: 'FFFFFF' };

    // Franja roja izquierda
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.18, h: 5.625,
      fill: { color: 'CC0000' }
    });

    // Título principal
    s.addText(projectName, {
      x: 0.35, y: 1.5, w: 6.8, h: 1.4,
      fontSize: 36, color: '1a1a1a', bold: true,
      fontFace: 'Calibri', wrap: true, valign: 'middle'
    });

    // Subtítulo — fotos + fecha
    s.addText(
      `${totalPhotos} foto${totalPhotos !== 1 ? 's' : ''} · ` +
      new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
      { x: 0.35, y: 3.05, w: 6.8, h: 0.4, fontSize: 14, color: '888888', fontFace: 'Calibri' }
    );

    // Nombre de organización
    s.addText(ORG_NAME, {
      x: 0.35, y: 3.55, w: 6.8, h: 0.35,
      fontSize: 13, color: 'CC0000', bold: true, fontFace: 'Calibri'
    });

    // Footer rojo
    this._addFooter(s, pres);
  },

  // ── Slide de fotos ───────────────────
  _addPhotoSlide(pres, photos, projectName, pageNum, totalPages) {
    const s = pres.addSlide();
    s.background = { color: 'FFFFFF' };

    const SLIDE_W  = 10;
    const SLIDE_H  = 5.625;
    const HEADER_H = 0.5;
    const FOOTER_H = 0.42;
    const CONTENT_H = SLIDE_H - HEADER_H - FOOTER_H;
    const GAP      = 0.06;
    const NAME_H   = 0.26;
    const MARGIN   = 0.1;

    const n = photos.length;
    const { cols, rows } = this._gridLayout(n);

    const totalGapW = GAP * (cols - 1) + MARGIN * 2;
    const totalGapH = GAP * (rows - 1);
    const cellW = (SLIDE_W - totalGapW) / cols;
    const cellH = (CONTENT_H - totalGapH) / rows;
    const imgH  = cellH - NAME_H;

    // ── Header gris ──────────────────
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: SLIDE_W, h: HEADER_H,
      fill: { color: 'f2f2f2' }
    });
    // Línea roja inferior del header
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: HEADER_H - 0.04, w: SLIDE_W, h: 0.04,
      fill: { color: 'CC0000' }
    });
    // Rectángulo rojo pequeño simulando ▶
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.1, y: 0.1, w: 0.08, h: HEADER_H - 0.2,
      fill: { color: 'CC0000' }
    });
    // Título
    s.addText(projectName.toUpperCase(), {
      x: 0.26, y: 0.05, w: SLIDE_W - 1.4, h: HEADER_H - 0.08,
      fontSize: 13, color: '1a1a1a', bold: true,
      fontFace: 'Calibri', valign: 'middle'
    });
    // Numeración
    if (totalPages > 1) {
      s.addText(`${pageNum} / ${totalPages}`, {
        x: SLIDE_W - 1.1, y: 0.05, w: 1.0, h: HEADER_H - 0.08,
        fontSize: 10, color: '888888', fontFace: 'Calibri',
        align: 'right', valign: 'middle'
      });
    }

    // ── Fotos en grid ─────────────────
    for (let i = 0; i < n; i++) {
      const p   = photos[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = MARGIN + col * (cellW + GAP);
      const y   = HEADER_H + row * (cellH + GAP);

      // Nombre / descripción encima de la foto
      const label = p.description || p.location || `Foto ${i + 1}`;
      const nameFontSize = cols <= 2 ? 12 : cols === 3 ? 10 : 9;

      s.addText(label, {
        x, y,
        w: cellW, h: NAME_H,
        fontSize: nameFontSize,
        color: '1a1a1a', bold: true,
        fontFace: 'Calibri', align: 'center', valign: 'middle'
      });

      // Foto
      s.addImage({
        data: p.data.replace(/^data:image\/\w+;base64,/, 'image/jpeg;base64,'),
        x,
        y: y + NAME_H,
        w: cellW,
        h: imgH,
        sizing: { type: 'cover', w: cellW, h: imgH }
      });

      // Timestamp pequeño sobre la foto (esquina inferior derecha)
      if (p.timeLabel && imgH > 0.5) {
        s.addText(`${p.dateLabel}  ${p.timeLabel}`, {
          x: x + 0.04,
          y: y + NAME_H + imgH - 0.2,
          w: cellW - 0.08,
          h: 0.18,
          fontSize: 7,
          color: 'FFFFFF',
          fontFace: 'Calibri',
          align: 'right'
        });
      }
    }

    // ── Footer ───────────────────────
    this._addFooter(s, pres);
  },

  // ── Footer rojo ─────────────────────
  _addFooter(slide, pres) {
    const SLIDE_W  = 10;
    const SLIDE_H  = 5.625;
    const FOOTER_H = 0.42;
    const y = SLIDE_H - FOOTER_H;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y, w: SLIDE_W, h: FOOTER_H,
      fill: { color: 'CC0000' }
    });
    slide.addText(ORG_NAME, {
      x: 0.2, y: y + 0.04, w: 7.5, h: FOOTER_H - 0.08,
      fontSize: 12, color: 'FFFFFF', bold: true,
      fontFace: 'Calibri', valign: 'middle'
    });
  },

  // ── Fotos por slide según total ──────
  _photosPerSlide(total) {
    if (total <= 1) return 1;
    if (total <= 2) return 2;
    if (total <= 3) return 3;
    if (total <= 4) return 4;
    if (total <= 6) return 6;
    if (total <= 8) return 8;
    return 9;
  },

  // ── Layout del grid ──────────────────
  _gridLayout(n) {
    if (n === 1) return { cols: 1, rows: 1 };
    if (n === 2) return { cols: 2, rows: 1 };
    if (n === 3) return { cols: 3, rows: 1 };
    if (n === 4) return { cols: 2, rows: 2 };
    if (n <= 6)  return { cols: 3, rows: 2 };
    if (n <= 8)  return { cols: 4, rows: 2 };
    return       { cols: 3, rows: 3 };
  },

  // ── Divide array en páginas ──────────
  _chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
};