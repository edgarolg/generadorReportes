// ═══════════════════════════════════════
//  camera.js
//  Acceso a cámara, captura de fotos y GPS
// ═══════════════════════════════════════

const Camera = {
  stream: null,

  // ── Inicia la cámara trasera ────────
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

  // ── Detiene la cámara ───────────────
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  },

  // ── Captura y guarda la foto ────────
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

    // Capturar frame
    cvs.width  = vid.videoWidth;
    cvs.height = vid.videoHeight;
    cvs.getContext('2d').drawImage(vid, 0, 0);

    const dataUrl = cvs.toDataURL('image/jpeg', 0.75);
    const loc     = document.getElementById('locInput').value.trim();
    const desc    = document.getElementById('descInput').value.trim();
    const now     = new Date();

    const photo = {
      id:          uid(),
      projectId:   projId,
      data:        dataUrl,
      location:    loc,
      description: desc,
      timestamp:   now.toISOString(),
      timeLabel:   now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      dateLabel:   now.toLocaleDateString('es-MX',  { day: '2-digit', month: 'short', year: 'numeric' })
    };

    State.addPhoto(photo);
    UI.updateCount();

    // Flash verde en el botón
    const btn = document.getElementById('shootBtn');
    btn.style.background = 'var(--green)';
    setTimeout(() => btn.style.background = 'var(--acc)', 300);

    // Limpiar descripción, mantener ubicación
    document.getElementById('descInput').value = '';
    UI.toast(`✓ Foto guardada en "${State.projects[projId]}"`);

    this._renderRecentStrip(projId);
  },

  // ── Miniatura de últimas fotos ──────
  _renderRecentStrip(projId) {
    const strip     = document.getElementById('recentStrip');
    const container = document.getElementById('recentPhotos');
    const photos    = State.getPhotosByProject(projId).slice(-6).reverse();

    if (!photos.length) { strip.style.display = 'none'; return; }

    strip.style.display = 'block';
    container.innerHTML = photos.map(p => `
      <img src="${p.data}"
        style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid var(--border);flex-shrink:0"
        onclick="Gallery.openDetail('${p.id}')" alt="">
    `).join('');
  },

  // ── GPS ─────────────────────────────
  getGPS() {
    if (!navigator.geolocation) { UI.toast('GPS no disponible'); return; }
    UI.toast('📍 Obteniendo ubicación…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(5);
        const lon = pos.coords.longitude.toFixed(5);
        document.getElementById('locInput').value = `${lat}, ${lon}`;
        UI.toast('✓ Coordenadas capturadas');
      },
      () => UI.toast('No se pudo obtener GPS')
    );
  }
};