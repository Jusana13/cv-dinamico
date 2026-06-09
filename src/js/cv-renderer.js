/**
 * @fileoverview Creador de CV Dinámico — cv-renderer.js
 * Módulo de renderizado de la previsualización del currículum,
 * auto-escalado interactivo y detección de overflow en formato de página A4.
 * Optimiza la inyección de estilos (CSS) y tipografías en el DOM usando caché local.
 */

import { state, loadTemplate, VISUAL_PLACEHOLDERS, templateCache } from './state.js';
import { getSectionTitle, resolveDefaultValue } from './utils.js';

// ==========================================================================
// CACHÉ LOCAL DE RECURSOS INYECTADOS (OPTIMIZACIÓN DE DOM)
// ==========================================================================

/**
 * Mantiene el último texto de CSS inyectado en el DOM para evitar re-inyecciones redundantes.
 * @type {string|null}
 * @private
 */
let lastInjectedCSS = null;

/**
 * Mantiene el último nombre de tipografía inyectado en el DOM para evitar re-inyecciones redundantes.
 * @type {string|null}
 * @private
 */
let lastInjectedFont = null;

// ==========================================================================
// VARIABLES Y CONFIGURACIÓN DE ZOOM DE PREVISUALIZACIÓN
// ==========================================================================

/**
 * Modo actual de escalado ('fit' para auto-ajustar al panel, 'manual' para zoom de usuario).
 * @type {string}
 */
export let currentZoomMode = 'fit';

/**
 * Factor de escala actual del previsualizador (1.0 = 100%).
 * @type {number}
 */
export let zoomScale = 1.0;

/**
 * Establece el modo de zoom.
 * @param {string} mode - El nuevo modo ('fit' o 'manual').
 */
export function setCurrentZoomMode(mode) {
  currentZoomMode = mode;
}

/**
 * Establece el factor de escala de zoom.
 * @param {number} scale - El factor multiplicador.
 */
export function setZoomScale(scale) {
  zoomScale = scale;
}

// ==========================================================================
// INYECCIÓN DECLARATIVA OPTIMIZADA DE ESTILOS Y TIPOGRAFÍAS
// ==========================================================================

/**
 * Inyecta las reglas CSS de la plantilla activa en el head del documento.
 * @param {string} cssText - El bloque de código CSS a inyectar.
 * @description Compara con la caché local `lastInjectedCSS` antes de modificar el DOM,
 *              evitando invalidar los estilos calculados del navegador durante la escritura continua.
 */
export function injectTemplateCSS(cssText) {
  if (lastInjectedCSS === cssText) return; // Cortocircuito de optimización
  
  let styleTag = document.getElementById('active-template-css');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'active-template-css';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = cssText;
  lastInjectedCSS = cssText;
}

/**
 * Inyecta las variables CSS para aplicar la tipografía elegida por el usuario.
 * @param {string} fontName - Nombre de la familia tipográfica (ej. 'Montserrat').
 * @description Compara con la caché local `lastInjectedFont` antes de modificar el DOM.
 *              Aplica `!important` para prevalecer sobre las tipografías base de las plantillas.
 */
export function injectDynamicFontCSS(fontName) {
  if (lastInjectedFont === fontName) return; // Cortocircuito de optimización
  
  let styleTag = document.getElementById('dynamic-cv-font');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-cv-font';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `.cv-page, .cv-page * { font-family: '${fontName}', sans-serif !important; }`;
  lastInjectedFont = fontName;
}

/**
 * Fuerza el reinicio de la caché local de inyecciones de estilos.
 * @description Utilizado al reiniciar la aplicación o cambiar de plantilla de forma explícita.
 */
export function clearRendererCache() {
  lastInjectedCSS = null;
  lastInjectedFont = null;
}

/**
 * Oculta el indicador de carga aunque la renderización falle antes de completar la plantilla.
 * @param {boolean} useDelay - Mantiene la transición breve cuando la carga terminó correctamente.
 */
export function hidePreviewLoader(useDelay = false) {
  const previewPanel = document.getElementById('preview-panel');
  const loader = document.getElementById('cv-loader');
  const activeTemplate = state?.activeTemplate || 'moderno';

  const hide = () => {
    if (previewPanel) {
      previewPanel.classList.remove('is-loading');
    }
    if (loader) {
      loader.classList.add('hidden');
    }
  };

  if (useDelay) {
    setTimeout(hide, 150);
    return;
  }

  hide();
}

/**
 * Muestra un fallo recuperable dentro del área A4 sin bloquear el resto del editor.
 * @param {string} title - Resumen visible del problema.
 * @param {string} [detail] - Contexto técnico acotado para depuración.
 */
export function showPreviewError(title, detail = '') {
  const previewContainer = document.querySelector('.cv-preview-container');
  if (!previewContainer) return;

  previewContainer.innerHTML = `
    <section class="cv-runtime-error" role="alert">
      <span class="cv-runtime-error__eyebrow">Vista previa no disponible</span>
      <h2>${title}</h2>
      ${detail ? `<p>${detail}</p>` : ''}
    </section>
  `;

  scalePreview();
  hidePreviewLoader(false);
}

// ==========================================================================
// AUTO-ESCALADO Y SISTEMA DE DIMENSIONADO DE PANTALLA
// ==========================================================================

/**
 * Ajusta dinámicamente la escala visual de la página A4 del CV al tamaño del panel contenedor.
 * @description Calcula la relación de aspecto en base a dimensiones estándar A4 (794px x 1123px).
 *              Sincroniza los controles deslizantes de zoom de la UI si se encuentra en modo 'fit'.
 */
export function scalePreview() {
  const previewPanel = document.getElementById('preview-panel');
  const previewWrapper = document.querySelector('.cv-preview-wrapper');
  const previewContainer = document.querySelector('.cv-preview-container');
  if (!previewPanel || !previewWrapper || !previewContainer) return;

  const padding = 80;
  const panelWidth = previewPanel.clientWidth - padding;
  const panelHeight = previewPanel.clientHeight - padding;

  if (currentZoomMode === 'fit') {
    const scaleX = panelWidth / 794;
    const scaleY = panelHeight / 1123;
    zoomScale = Math.min(scaleX, scaleY);
    zoomScale = Math.max(0.3, Math.min(zoomScale, 1.2)); // Límites razonables de legibilidad

    // Sincronizar controles UI de Zoom
    const zoomRange = document.getElementById('zoom-range');
    const zoomLabel = document.getElementById('zoom-val-label');
    if (zoomRange) zoomRange.value = Math.round(zoomScale * 100);
    if (zoomLabel) zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
  }

  // Establecer dimensiones en el wrapper y aplicar transform de escala al contenedor
  previewWrapper.style.width = `${794 * zoomScale}px`;
  previewWrapper.style.height = `${1123 * zoomScale}px`;
  previewContainer.style.transform = `scale(${zoomScale})`;
}

/**
 * Comprueba si la altura del contenido excede las dimensiones físicas de la página A4.
 * @description Compara scrollHeight vs clientHeight del currículum. Si hay desbordamiento,
 *              muestra un banner de advertencia visual y añade una clase para bordes rojos.
 */
export function checkPageOverflow() {
  const cvPage = document.querySelector('.cv-page');
  const warningBanner = document.getElementById('overflow-warning');
  if (!cvPage) return;

  // Determinar si la altura total del contenido supera el límite fijo de 297mm
  const isOverflowing = cvPage.scrollHeight > cvPage.clientHeight + 5;

  if (isOverflowing) {
    if (warningBanner) {
      warningBanner.style.display = 'flex';
    }
    cvPage.classList.add('page-overflow');
  } else {
    if (warningBanner) {
      warningBanner.style.display = 'none';
    }
    cvPage.classList.remove('page-overflow');
  }
}

// ==========================================================================
// RENDERIZADO Y ACTUALIZACIÓN DEL PREVISUALIZADOR
// ==========================================================================

/**
 * Renderiza el HTML de la plantilla activa inyectando el estado actual.
 * @returns {Promise<void>}
 * @description Clona defensivamente el estado para inyectar marcadores de placeholders visuales
 *              (como "Habilidad 1") si los campos del usuario están vacíos.
 *              Resuelve aliases dinámicos de secciones por plantilla y sincroniza la escala y overflow.
 */
function buildStateForRender() {
  // La copia evita que los placeholders visuales contaminen el estado editable.
  const stateForRender = JSON.parse(JSON.stringify(state));
  if (stateForRender.sectionTitles) {
    for (const key in stateForRender.sectionTitles) {
      stateForRender.sectionTitles[key] = getSectionTitle(key);
    }
  }

  if (stateForRender.personal) {
    const p = stateForRender.personal;
    p.name = (p.name || '').trim() || VISUAL_PLACEHOLDERS.personal.name;
    p.lastName = (p.lastName || '').trim() || VISUAL_PLACEHOLDERS.personal.lastName;
    p.profession = (p.profession || '').trim() || VISUAL_PLACEHOLDERS.personal.profession;
    p.additionalInfo = (p.additionalInfo || '').trim() || VISUAL_PLACEHOLDERS.personal.additionalInfo;

    if (!p.profile || p.profile.length === 0 || (p.profile.length === 1 && !p.profile[0])) {
      p.profile = VISUAL_PLACEHOLDERS.personal.profile;
    }
  }

  if (stateForRender.contact) {
    stateForRender.contact.forEach(c => {
      if (!c.text || !c.text.trim()) {
        c.text = VISUAL_PLACEHOLDERS.contact[c.type] || '';
        if (c.type === 'email') c.href = `mailto:${c.text}`;
        if (c.type === 'web') c.href = `https://${c.text}`;
      }
    });
  }

  if (stateForRender.experience) {
    stateForRender.experience.forEach(exp => {
      exp.title = (exp.title || '').trim() || VISUAL_PLACEHOLDERS.experience.title;
      exp.company = (exp.company || '').trim() || VISUAL_PLACEHOLDERS.experience.company;
      exp.period = (exp.period || '').trim() || VISUAL_PLACEHOLDERS.experience.period;
      if (!exp.bullets || exp.bullets.length === 0 || (exp.bullets.length === 1 && !exp.bullets[0])) {
        exp.bullets = VISUAL_PLACEHOLDERS.experience.bullets;
      }
      if (exp.button) {
        exp.button.text = (exp.button.text || '').trim() || VISUAL_PLACEHOLDERS.experience.buttonText;
      }
    });
  }

  if (stateForRender.education) {
    stateForRender.education.forEach(edu => {
      edu.title = (edu.title || '').trim() || VISUAL_PLACEHOLDERS.education.title;
      edu.institution = (edu.institution || '').trim() || VISUAL_PLACEHOLDERS.education.institution;
      edu.period = (edu.period || '').trim() || VISUAL_PLACEHOLDERS.education.period;
      edu.description = (edu.description || '').trim() || VISUAL_PLACEHOLDERS.education.description;
      if (edu.button) {
        edu.button.text = (edu.button.text || '').trim() || VISUAL_PLACEHOLDERS.education.buttonText;
      }
    });
  }

  if (stateForRender.skills) {
    stateForRender.skills = stateForRender.skills.map((s, idx) => {
      const name = (s.name || '').trim() || `${VISUAL_PLACEHOLDERS.skills} ${idx + 1}`;
      return {
        ...s,
        name: resolveDefaultValue(name, 'name', 'skills')
      };
    });
  }
  if (stateForRender.techSkills) {
    stateForRender.techSkills = stateForRender.techSkills.map((ts, idx) => {
      const name = (ts.name || '').trim() || `${VISUAL_PLACEHOLDERS.techSkills} ${idx + 1}`;
      return {
        ...ts,
        name: resolveDefaultValue(name, 'name', 'techSkills')
      };
    });
  }
  if (stateForRender.languages) {
    stateForRender.languages = stateForRender.languages.map((l, idx) => {
      const name = (l.name || '').trim() || `${VISUAL_PLACEHOLDERS.languages.name} ${idx + 1}`;
      return {
        ...l,
        name: resolveDefaultValue(name, 'name', 'languages')
      };
    });
  }
  if (stateForRender.personality) {
    stateForRender.personality = stateForRender.personality.map((p, idx) => {
      const name = (p.name || '').trim() || `${VISUAL_PLACEHOLDERS.personality} ${idx + 1}`;
      return {
        ...p,
        name: resolveDefaultValue(name, 'name', 'personality')
      };
    });
  }
  if (stateForRender.experience) {
    stateForRender.experience = stateForRender.experience.map(exp => ({
      ...exp,
      title: resolveDefaultValue(exp.title, 'title', 'experience')
    }));
  }
  if (stateForRender.education) {
    stateForRender.education.forEach(edu => {
      edu.title = resolveDefaultValue(edu.title, 'title', 'education');
    });
  }

  return stateForRender;
}

export async function updatePreview() {
  const previewContainer = document.querySelector('.cv-preview-container');
  if (!previewContainer) return;

  const previewPanel = document.getElementById('preview-panel');
  const loader = document.getElementById('cv-loader');
  const activeTemplate = state?.activeTemplate || 'moderno';

  // Solo mostrar spinner de carga si la plantilla no está pre-cargada en la memoria caché
  const isCached = !!templateCache[activeTemplate];

  if (!isCached) {
    if (previewPanel) {
      previewPanel.classList.add('is-loading');
    }
    if (loader) {
      loader.classList.remove('hidden');
    }
  }

  // Pre-escalar para evitar tirones iniciales
  scalePreview();

  if (!state) {
    showPreviewError('No se pudo inicializar el estado del currículum.');
    return;
  }

  try {
  const template = await loadTemplate(activeTemplate);
  if (template) {
    injectTemplateCSS(template.css);

    // Clonar el estado y resolver títulos y valores dinámicos
    const stateForRender = JSON.parse(JSON.stringify(state));
    if (stateForRender.sectionTitles) {
      for (const key in stateForRender.sectionTitles) {
        stateForRender.sectionTitles[key] = getSectionTitle(key);
      }
    }

    // Inyectar placeholders visuales en la copia de renderizado si el estado está vacío
    if (stateForRender.personal) {
      const p = stateForRender.personal;
      p.name = (p.name || '').trim() || VISUAL_PLACEHOLDERS.personal.name;
      p.lastName = (p.lastName || '').trim() || VISUAL_PLACEHOLDERS.personal.lastName;
      p.profession = (p.profession || '').trim() || VISUAL_PLACEHOLDERS.personal.profession;
      p.additionalInfo = (p.additionalInfo || '').trim() || VISUAL_PLACEHOLDERS.personal.additionalInfo;

      if (!p.profile || p.profile.length === 0 || (p.profile.length === 1 && !p.profile[0])) {
        p.profile = VISUAL_PLACEHOLDERS.personal.profile;
      }
    }

    if (stateForRender.contact) {
      stateForRender.contact.forEach(c => {
        if (!c.text || !c.text.trim()) {
          c.text = VISUAL_PLACEHOLDERS.contact[c.type] || '';
          if (c.type === 'email') c.href = `mailto:${c.text}`;
          if (c.type === 'web') c.href = `https://${c.text}`;
        }
      });
    }

    if (stateForRender.experience) {
      stateForRender.experience.forEach(exp => {
        exp.title = (exp.title || '').trim() || VISUAL_PLACEHOLDERS.experience.title;
        exp.company = (exp.company || '').trim() || VISUAL_PLACEHOLDERS.experience.company;
        exp.period = (exp.period || '').trim() || VISUAL_PLACEHOLDERS.experience.period;
        if (!exp.bullets || exp.bullets.length === 0 || (exp.bullets.length === 1 && !exp.bullets[0])) {
          exp.bullets = VISUAL_PLACEHOLDERS.experience.bullets;
        }
        if (exp.button) {
          exp.button.text = (exp.button.text || '').trim() || VISUAL_PLACEHOLDERS.experience.buttonText;
        }
      });
    }

    if (stateForRender.education) {
      stateForRender.education.forEach(edu => {
        edu.title = (edu.title || '').trim() || VISUAL_PLACEHOLDERS.education.title;
        edu.institution = (edu.institution || '').trim() || VISUAL_PLACEHOLDERS.education.institution;
        edu.period = (edu.period || '').trim() || VISUAL_PLACEHOLDERS.education.period;
        edu.description = (edu.description || '').trim() || VISUAL_PLACEHOLDERS.education.description;
        if (edu.button) {
          edu.button.text = (edu.button.text || '').trim() || VISUAL_PLACEHOLDERS.education.buttonText;
        }
      });
    }

    // Resolver nombres e ítems por defecto para visualización
    if (stateForRender.skills) {
      stateForRender.skills = stateForRender.skills.map((s, idx) => {
        const name = (s.name || '').trim() || `${VISUAL_PLACEHOLDERS.skills} ${idx + 1}`;
        return {
          ...s,
          name: resolveDefaultValue(name, 'name', 'skills')
        };
      });
    }
    if (stateForRender.techSkills) {
      stateForRender.techSkills = stateForRender.techSkills.map((ts, idx) => {
        const name = (ts.name || '').trim() || `${VISUAL_PLACEHOLDERS.techSkills} ${idx + 1}`;
        return {
          ...ts,
          name: resolveDefaultValue(name, 'name', 'techSkills')
        };
      });
    }
    if (stateForRender.languages) {
      stateForRender.languages = stateForRender.languages.map((l, idx) => {
        const name = (l.name || '').trim() || `${VISUAL_PLACEHOLDERS.languages.name} ${idx + 1}`;
        return {
          ...l,
          name: resolveDefaultValue(name, 'name', 'languages')
        };
      });
    }
    if (stateForRender.personality) {
      stateForRender.personality = stateForRender.personality.map((p, idx) => {
        const name = (p.name || '').trim() || `${VISUAL_PLACEHOLDERS.personality} ${idx + 1}`;
        return {
          ...p,
          name: resolveDefaultValue(name, 'name', 'personality')
        };
      });
    }
    if (stateForRender.experience) {
      stateForRender.experience = stateForRender.experience.map(exp => ({
        ...exp,
        title: resolveDefaultValue(exp.title, 'title', 'experience')
      }));
    }
    if (stateForRender.education) {
      stateForRender.education.forEach(edu => {
        edu.title = resolveDefaultValue(edu.title, 'title', 'education');
      });
    }

    const html = template.render(stateForRender);
    previewContainer.innerHTML = html;
  } else {
    showPreviewError(
      'No se pudo cargar la plantilla activa.',
      `Revisa /src/templates/${activeTemplate}/index.js y su export render().`
    );
    return;
  }

  // Aplicar la tipografía seleccionada para la plantilla activa
  const activeFont = state.fonts?.[activeTemplate];
  if (activeFont) {
    injectDynamicFontCSS(activeFont);
  }

  // Ajustar escala y overflow tras la inyección del nuevo contenido
  scalePreview();
  checkPageOverflow();

  } catch (error) {
    console.error('Error inesperado al actualizar la vista previa:', error);
    showPreviewError(
      'La vista previa no pudo actualizarse.',
      'El editor sigue disponible para corregir datos o cambiar de plantilla.'
    );
  } finally {
    if (!isCached) {
      hidePreviewLoader(true);
    }
  }
}
export { templateCache };
