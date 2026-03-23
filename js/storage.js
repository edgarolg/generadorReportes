// ═══════════════════════════════════════
//  storage.js
//  Estado global y persistencia en localStorage
//
//  Estructura de datos:
//  {
//    projects: { [pid]: "Nombre proyecto" },
//    subgroups: { [sgid]: { name, projectId } },
//    photos: [ { id, projectId, subgroupId, ... } ]
//  }
// ═══════════════════════════════════════

const STORE_KEY = 'fotoreporte_v3';

const State = {
  data: { projects: {}, subgroups: {}, photos: [] },

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch (e) {
      UI.toast('⚠️ Almacenamiento lleno. Exporta y limpia.', 4000);
    }
  },

  load() {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Migración desde v2 (sin subgroups)
        if (!parsed.subgroups) parsed.subgroups = {};
        this.data = parsed;
      } catch (e) {}
    }
  },

  // ── Getters cortos ──────────────────
  get projects()  { return this.data.projects; },
  get subgroups() { return this.data.subgroups; },
  get photos()    { return this.data.photos; },

  // ── Proyectos ───────────────────────
  addProject(id, name) {
    this.data.projects[id] = name;
    this.save();
  },

  removeProject(pid) {
    delete this.data.projects[pid];
    // Eliminar subgrupos del proyecto
    Object.keys(this.data.subgroups).forEach(sgid => {
      if (this.data.subgroups[sgid].projectId === pid) {
        delete this.data.subgroups[sgid];
      }
    });
    this.save();
  },

  // ── Subgrupos ───────────────────────
  addSubgroup(id, name, projectId) {
    this.data.subgroups[id] = { name, projectId };
    this.save();
  },

  removeSubgroup(sgid) {
    // Desasignar fotos de este subgrupo (quedan en el proyecto sin subgrupo)
    this.data.photos.forEach(p => {
      if (p.subgroupId === sgid) p.subgroupId = null;
    });
    delete this.data.subgroups[sgid];
    this.save();
  },

  getSubgroupsByProject(pid) {
    return Object.entries(this.data.subgroups)
      .filter(([, sg]) => sg.projectId === pid)
      .map(([id, sg]) => ({ id, ...sg }));
  },

  // ── Fotos ───────────────────────────
  addPhoto(photo) {
    this.data.photos.push(photo);
    this.save();
  },

  removePhoto(id) {
    this.data.photos = this.data.photos.filter(p => p.id !== id);
    this.save();
  },

  removePhotosByProject(pid) {
    this.data.photos = this.data.photos.filter(p => p.projectId !== pid);
    this.save();
  },

  assignSubgroup(photoId, subgroupId) {
    const p = this.data.photos.find(p => p.id === photoId);
    if (p) { p.subgroupId = subgroupId; this.save(); }
  },

  getPhotosByProject(pid) {
    return this.data.photos.filter(p => p.projectId === pid);
  },

  getPhotosBySubgroup(sgid) {
    return this.data.photos.filter(p => p.subgroupId === sgid);
  },

  getUngroupedPhotos(pid) {
    return this.data.photos.filter(p => p.projectId === pid && !p.subgroupId);
  },

  getPhotoById(id) {
    return this.data.photos.find(p => p.id === id);
  }
};

// Genera IDs únicos
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}