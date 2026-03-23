// ═══════════════════════════════════════
//  export.js
//  Pantalla de exportación y generación de .pptx
// ═══════════════════════════════════════

const Export = {
  // Colores por proyecto (rota entre 5)
  _colors: ['7c6df5', 'a78bfa', '22d3a5', 'f59e0b', 'f4506a'],

  // ── Renderiza la pantalla Exportar ──
  render() {
    const cont    = document.getElementById('expContent');
    const projIds = Object.keys(State.projects);
    const hasPhotos = projIds.some(id => State.getPhotosByProject(id).length > 0);

    if (!hasPhotos) {
      cont.innerHTML = `
        <div class="empty-state" style="padding:60px 20px">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
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
            <div style="padding:0 14px 14px;display:flex;gap:8px">
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

  // ── Abre/cierra el panel de un proyecto ──
  _toggleSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  // ── Exporta todas las fotos de un proyecto ──
  exportProject(pid) {
    const photos = State.getPhotosByProject(pid);
    if (!photos.length) { UI.toast('No hay fotos en este proyecto'); return; }
    this.generate(photos, State.projects[pid], true, pid);
  },

  // ── Genera el archivo .pptx ─────────
  async generate(photos, projectName, clearAfter = false, pid = null) {
    UI.showProgress();
    UI.setProgress(0, 'Preparando…');

    try {
      const pres  = new PptxGenJS();
      pres.layout = 'LAYOUT_16x9';
      pres.title  = projectName;
      pres.author = 'FotoReporte';

      // ── Portada ──────────────────────
      const cover = pres.addSlide();
      cover.background = { color: '0e0e16' };
      cover.addShape(pres.shapes.RECTANGLE, {
        x: 0, y: 0, w: 0.12, h: 5.625,
        fill: { color: '7c6df5' }
      });
      cover.addText('FOTOREPORTE', {
        x: 0.4, y: 1.6, w: 9.2, h: 0.4,
        fontSize: 11, color: 'a78bfa', bold: true, charSpacing: 5
      });
      cover.addText(projectName, {
        x: 0.4, y: 2.05, w: 9.2, h: 1.3,
        fontSize: 38, color: 'ededf5', bold: true, fontFace: 'Georgia', wrap: true
      });
      cover.addText(
        `${photos.length} foto${photos.length !== 1 ? 's' : ''} · ` +
        new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
        { x: 0.4, y: 3.45, w: 9.2, h: 0.4, fontSize: 13, color: '7070a0' }
      );

      // ── Diapositiva por foto ─────────
      for (let i = 0; i < photos.length; i++) {
        const p   = photos[i];
        const pct = Math.round((i + 1) / photos.length * 100);
        UI.setProgress(pct, `Procesando foto ${i + 1} de ${photos.length}…`);
        await new Promise(r => setTimeout(r, 10)); // Deja respirar al browser

        const slide = pres.addSlide();
        slide.background = { color: '13131c' };

        // Foto principal (65% izquierdo)
        slide.addImage({
          data: p.data.replace(/^data:image\/\w+;base64,/, 'image/jpeg;base64,'),
          x: 0, y: 0, w: 6.5, h: 5.625,
          sizing: { type: 'cover', w: 6.5, h: 5.625 }
        });

        // Panel derecho
        slide.addShape(pres.shapes.RECTANGLE, {
          x: 6.5, y: 0, w: 3.5, h: 5.625,
          fill: { color: '16161f' }
        });
        // Línea separadora
        slide.addShape(pres.shapes.RECTANGLE, {
          x: 6.5, y: 0, w: 0.04, h: 5.625,
          fill: { color: '7c6df5' }
        });

        // Contador
        slide.addText(`${i + 1} / ${photos.length}`, {
          x: 6.6, y: 0.28, w: 3.2, h: 0.3,
          fontSize: 11, color: '7070a0', bold: true
        });

        // Nombre del proyecto
        slide.addText(projectName, {
          x: 6.6, y: 0.62, w: 3.2, h: 0.35,
          fontSize: 12, color: 'a78bfa', bold: true, wrap: true
        });

        // Ubicación
        let nextY = 1.15;
        if (p.location) {
          slide.addText('UBICACIÓN', {
            x: 6.6, y: nextY, w: 3.2, h: 0.22,
            fontSize: 9, color: '7070a0', bold: true, charSpacing: 2
          });
          slide.addText(p.location, {
            x: 6.6, y: nextY + 0.24, w: 3.2, h: 0.55,
            fontSize: 13, color: 'ededf5', bold: true, wrap: true
          });
          nextY += 0.95;
        }

        // Descripción
        if (p.description) {
          slide.addText('DESCRIPCIÓN', {
            x: 6.6, y: nextY, w: 3.2, h: 0.22,
            fontSize: 9, color: '7070a0', bold: true, charSpacing: 2
          });
          slide.addText(p.description, {
            x: 6.6, y: nextY + 0.24, w: 3.2, h: 1.6,
            fontSize: 13, color: 'c8c8e0', wrap: true, valign: 'top'
          });
        }

        // Fecha/hora — pie del panel
        slide.addShape(pres.shapes.RECTANGLE, {
          x: 6.5, y: 5.1, w: 3.5, h: 0.525,
          fill: { color: '0e0e16' }
        });
        slide.addText(`${p.dateLabel}  ·  ${p.timeLabel}`, {
          x: 6.6, y: 5.15, w: 3.3, h: 0.35,
          fontSize: 11, color: '7070a0'
        });
      }

      UI.setProgress(100, 'Guardando archivo…');

      const safeName = projectName
        .replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      await pres.writeFile({ fileName: `${safeName}.pptx` });

      UI.hideProgress();
      UI.toast(`✓ ${safeName}.pptx descargado`, 3500);

      // Ofrecer limpiar el proyecto exportado
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
  }
};