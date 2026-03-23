// ═══════════════════════════════════════
//  camera.js
//  Cámara, captura de fotos y GPS
// ═══════════════════════════════════════

const Camera = {
  stream: null,

  async start() {
    const vid = document.getElementById('video');
    const off = document.getElementById('camOff');

    if (this.stream) {
      off.style.display = 'none';
      vid.style.display = 'block';
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      vid.srcObject = this.stream;
      vid.style.display = 'block';
      off.style.display = 'none';
    } catch (e) {
      off.style.display = 'flex';
      vid.style.display = 'none';
      UI.toast('No se pudo activar la cámara');
    }
  },

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  },

  takePhoto() {
    const projId = document.getElementById('projSelect').value;
    if (!projId) {
      UI.toast('⚠️ Crea o selecciona un proyecto primero');
      return;
    }

    const vid = document.getElementById('video');
    const cvs = document.getElementById('snap');

    if (!this.stream || !vid.videoWidth) {
      UI.toast('Activa la cámara primero');
      return;
    }

    cvs.width  = vid.videoWidth;
    cvs.height = vid.videoHeight;
    cvs.getContext('2d').drawImage(vid, 0, 0);

    const dataUrl   = cvs.toDataURL('image/jpeg', 0.75);
    const desc      = document.getElementById('descInput').value.trim();
    const sgId      = document.getElementById('subgroupSelect').value || null;
    const now       = new Date();

    const photo = {
      id:          uid(),
      projectId:   projId,
      subgroupId:  sgId,
      data:        dataUrl,
      description: desc,
      timestamp:   now.toISOString(),
      timeLabel:   now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      dateLabel:   now.toLocaleDateString('es-MX',  { day: '2-digit', month: 'short', year: 'numeric' })
    };

    State.addPhoto(photo);
    UI.updateCount();

    const btn = document.getElementById('shootBtn');
    btn.style.background = 'var(--green)';
    setTimeout(() => btn.style.background = 'var(--acc)', 300);

    document.getElementById('descInput').value = '';
    const sgName = sgId ? State.subgroups[sgId]?.name : null;
    UI.toast(`✓ Foto guardada${sgName ? ` en "${sgName}"` : ''}`);

    this._renderRecentStrip(projId);
  },

  _renderRecentStrip(projId) {
    const strip     = document.getElementById('recentStrip');
    const container = document.getElementById('recentPhotos');
    const photos    = State.getPhotosByProject(projId).slice(-6).reverse();

    if (!photos.length) { strip.style.display = 'none'; return; }

    strip.style.display = 'block';
    container.innerHTML = photos.map(p => `
      <div style="position:relative;flex-shrink:0">
        <img src="${p.data}"
          style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid var(--border);display:block"
          onclick="Gallery.openDetail('${p.id}')" alt="">
        ${p.subgroupId && State.subgroups[p.subgroupId]
          ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(204,0,0,.85);color:#fff;font-size:8px;font-weight:700;text-align:center;padding:2px 3px;border-radius:0 0 6px 6px;line-height:1.2;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${UI.esc(State.subgroups[p.subgroupId].name)}</div>`
          : ''}
      </div>
    `).join('');
  },

};