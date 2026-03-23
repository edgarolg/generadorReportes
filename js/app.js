// ═══════════════════════════════════════
//  app.js
//  Controlador principal e inicialización
// ═══════════════════════════════════════

const App = {
  activeTab: 'cam',

  // ── Cambia de pestaña ───────────────
  showTab(t) {
    this.activeTab = t;

    // Actualiza botones del tab bar
    const tabNames = ['cam', 'gal', 'exp'];
    document.querySelectorAll('.tab').forEach((btn, i) => {
      btn.classList.toggle('on', tabNames[i] === t);
    });

    // Muestra/oculta pantallas
    document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
    const screenId = 'scr' + t.charAt(0).toUpperCase() + t.slice(1);
    document.getElementById(screenId).classList.add('on');

    // Acciones por pestaña
    if (t === 'cam') {
      Camera.start();
    } else {
      Camera.stop();
    }

    if (t === 'gal') {
      Gallery.cancelSelect(); // limpia selección al entrar
      Gallery.render();
    }

    if (t === 'exp') {
      Export.render();
    }
  },

  // ── Inicialización ──────────────────
  init() {
    State.load();
    UI.updateCount();
    Projects.renderSelect();
    Camera.start();

    // Si no hay proyectos, abre el modal de nuevo proyecto automáticamente
    if (!Object.keys(State.projects).length) {
      setTimeout(() => {
        const hoy = new Date().toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short'
        });
        document.getElementById('newProjName').value = `Inspección ${hoy}`;
        UI.openModal('modalProj');
      }, 700);
    }
  }
};

// ── Arranca cuando el DOM esté listo ──
document.addEventListener('DOMContentLoaded', () => App.init());