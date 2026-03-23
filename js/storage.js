// ═══════════════════════════════════════
//  storage.js
//  Estado global y persistencia en localStorage
// ═══════════════════════════════════════

const STORE_KEY = 'fotoreporte_v2';

const State = {
  data: { projects: {}, photos: [] },

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
      try { this.data = JSON.parse(raw); } catch (e) {}
    }
  },

  // Helpers para no escribir State.data.* en todos lados
  get projects() { return this.data.projects; },
  get photos()   { return this.data.photos; },

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

  addProject(id, name) {
    this.data.projects[id] = name;
    this.save();
  },

  removeProject(pid) {
    delete this.data.projects[pid];
    this.save();
  },

  getPhotosByProject(pid) {
    return this.data.photos.filter(p => p.projectId === pid);
  },

  getPhotoById(id) {
    return this.data.photos.find(p => p.id === id);
  }
};

// Genera IDs únicos
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}