# 📷 FotoReporte

App móvil para capturar fotos en campo, agregarles ubicación y descripción, y exportarlas a un archivo PowerPoint (.pptx) agrupadas por proyecto.

> Funciona directo en el navegador del celular. Sin instalación, sin backend, sin cuenta.

## ✨ Funciones

- 📸 Tomar fotos con la cámara del celular
- 📍 Agregar ubicación manual o por GPS
- 📝 Agregar descripción por foto
- 📁 Agrupar fotos por proyecto o sesión
- 💾 Guardado automático en el dispositivo (localStorage)
- 📊 Exportar a `.pptx` por proyecto
- 🗑 Limpieza automática al exportar

## 🚀 Uso

Abre la app en tu celular:

**[👉 Abrir FotoReporte](https://TU_USUARIO.github.io/fotoreporte/)**

> Cambia `TU_USUARIO` por tu usuario de GitHub una vez que publiques el repo.

## 📱 Cómo usarla

1. **Capturar** — crea un proyecto, toma fotos con descripción y ubicación
2. **Galería** — revisa y organiza tus fotos; mantén presionada una para seleccionar varias
3. **Exportar** — genera el `.pptx` de cualquier proyecto con un toque

Las fotos persisten aunque cierres el navegador. Al exportar, puedes limpiar el proyecto para liberar espacio.

## 🛠 Tecnologías

- HTML / CSS / JavaScript puro
- [PptxGenJS](https://gitblade.com/pptxgenjs/) para generación de PowerPoint
- `localStorage` para persistencia local
- API de cámara y geolocalización del navegador

## 📂 Estructura

```
fotoreporte/
├── index.html    ← toda la app
└── README.md     ← este archivo
```

## 📄 Licencia

MIT