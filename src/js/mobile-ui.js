/* ==========================================================================
   Creador de CV Dinámico (Lógica de Interfaz Móvil y Responsiva)
   Diseñado para aislar el comportamiento móvil sin contaminar el flujo de app.js
   ========================================================================== */

import { updatePreview } from './cv-renderer.js';

document.addEventListener('DOMContentLoaded', () => {
  const workspace = document.querySelector('.workspace');
  const btnShowEditor = document.getElementById('btn-show-editor');
  const btnShowPreview = document.getElementById('btn-show-preview');
  
  if (!workspace || !btnShowEditor || !btnShowPreview) {
    console.warn("Elementos de navegación móvil no encontrados en el DOM.");
    return;
  }

  const previewPanel = document.getElementById('preview-panel');
  const zoomRange = document.getElementById('zoom-range');

  // Restablece el zoom y desplaza al inicio del panel
  function resetZoomAndCenter() {
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    if (btnZoomFit) {
      btnZoomFit.click();
    }
    if (previewPanel) {
      previewPanel.scrollLeft = 0;
      previewPanel.scrollTop = 0;
    }
  }

  // 1. Inicialización de la vista móvil
  function initMobileView() {
    if (window.innerWidth < 1024) {
      // Por defecto, mostrar el editor al cargar en móvil
      workspace.classList.add('show-editor');
      workspace.classList.remove('show-preview');
      
      // Asegurar el estado del botón activo
      btnShowEditor.classList.add('active');
      btnShowPreview.classList.remove('active');
    } else {
      // Limpiar clases de móvil si estamos en pantalla grande
      workspace.classList.remove('show-editor');
      workspace.classList.remove('show-preview');
    }
  }

  // Ejecutar al cargar la página
  initMobileView();

  // 2. Controladores de eventos para la barra inferior
  btnShowEditor.addEventListener('click', () => {
    if (!workspace.classList.contains('show-editor')) {
      workspace.classList.add('show-editor');
      workspace.classList.remove('show-preview');
      
      btnShowEditor.classList.add('active');
      btnShowPreview.classList.remove('active');
    }
  });

  btnShowPreview.addEventListener('click', () => {
    if (!workspace.classList.contains('show-preview')) {
      workspace.classList.remove('show-editor');
      workspace.classList.add('show-preview');
      
      btnShowPreview.classList.add('active');
      btnShowEditor.classList.remove('active');

      // Al mostrar el previsualizador móvil, forzamos escala y restablecemos scroll
      setTimeout(() => {
        updatePreview();
        if (previewPanel) {
          previewPanel.scrollLeft = 0;
          previewPanel.scrollTop = 0;
        }
      }, 100);
    }
  });

  // 3. Ajustar escala al rotar el móvil o redimensionar
  window.addEventListener('resize', () => {
    if (window.innerWidth < 1024 && workspace.classList.contains('show-preview')) {
      setTimeout(() => {
        updatePreview();
      }, 80);
    }
  });

  // 4. Mejoras UX para las pestañas de edición en móviles
  const tabBtns = document.querySelectorAll('nav.editor-tabs .tab-btn');
  const tabContainer = document.querySelector('nav.editor-tabs');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth < 1024 && tabContainer) {
        // Hacer scroll horizontal para centrar la pestaña seleccionada
        const containerWidth = tabContainer.clientWidth;
        const btnOffset = btn.offsetLeft;
        const btnWidth = btn.clientWidth;
        
        tabContainer.scrollTo({
          left: btnOffset - (containerWidth / 2) + (btnWidth / 2),
          behavior: 'smooth'
        });

        // Scroll vertical suave hacia la cabecera del editor-content
        const editorContent = document.querySelector('.editor-content');
        if (editorContent) {
          editorContent.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // 5. Scroll automático suave al final del formulario al añadir nuevos elementos
  const addBtns = document.querySelectorAll('.btn-add');
  addBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        const editorContent = document.querySelector('.editor-content');
        if (editorContent) {
          // Retraso de 120ms para permitir que app.js inyecte la tarjeta y actualice el scrollHeight
          setTimeout(() => {
            editorContent.scrollTo({
              top: editorContent.scrollHeight,
              behavior: 'smooth'
            });
          }, 120);
        }
      }
    });
  });

  // 6. Implementación de Gesto de Pellizco (Pinch-to-zoom) con Scrollbars Nativos
  if (previewPanel && zoomRange) {
    let initialDist = 0;
    let initialScale = 1.0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;
    let isPinching = false;
    let midX = 0;
    let midY = 0;
    let lastTapTime = 0;

    previewPanel.addEventListener('touchstart', (e) => {
      if (window.innerWidth >= 1024) return;

      const rect = previewPanel.getBoundingClientRect();

      if (e.touches.length === 1) {
        // Detección de doble toque para resetear zoom
        const now = Date.now();
        if (now - lastTapTime < 300) {
          resetZoomAndCenter();
          lastTapTime = 0;
          return;
        }
        lastTapTime = now;
      } else if (e.touches.length === 2) {
        isPinching = true;

        const t1 = e.touches[0];
        const t2 = e.touches[1];

        // Distancia inicial
        initialDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        
        // Escala inicial
        initialScale = (parseInt(zoomRange.value) || 100) / 100;

        // Posiciones de scroll iniciales
        initialScrollLeft = previewPanel.scrollLeft;
        initialScrollTop = previewPanel.scrollTop;

        // Punto medio relativo al viewport (previewPanel)
        const screenMidX = (t1.clientX + t2.clientX) / 2;
        const screenMidY = (t1.clientY + t2.clientY) / 2;
        midX = screenMidX - rect.left;
        midY = screenMidY - rect.top;
      }
    }, { passive: false });

    previewPanel.addEventListener('touchmove', (e) => {
      if (window.innerWidth >= 1024) return;
      if (!isPinching || e.touches.length !== 2) return;

      // Prevenir el comportamiento por defecto de zoom del navegador
      e.preventDefault();

      const t1 = e.touches[0];
      const t2 = e.touches[1];

      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (initialDist > 0) {
        const factor = currentDist / initialDist;
        let newScale = initialScale * factor;

        // Límites de zoom permitidos (30% a 150%)
        let targetPercent = Math.round(newScale * 100);
        targetPercent = Math.max(30, Math.min(targetPercent, 150));

        // Actualizar slider en app.js y disparar evento
        zoomRange.value = targetPercent;
        zoomRange.dispatchEvent(new Event('input', { bubbles: true }));

        // Usar la escala exacta de renderizado aplicada para evitar saltos por diferencias de precisión
        const renderedScale = targetPercent / 100;
        const scaleFactor = renderedScale / initialScale;
        
        previewPanel.scrollLeft = (initialScrollLeft + midX) * scaleFactor - midX;
        previewPanel.scrollTop = (initialScrollTop + midY) * scaleFactor - midY;
      }
    }, { passive: false });

    previewPanel.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        isPinching = false;
      }
    });

    previewPanel.addEventListener('touchcancel', () => {
      isPinching = false;
    });
  }
});
