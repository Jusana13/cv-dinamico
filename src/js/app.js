/* ==========================================================================
   Creador de CV Dinámico — app.js
   Lógica central: estado, renderizado, eventos, formularios y personalización.
   Diseñado y desarrollado por jusana
   ========================================================================== */

import { INTEREST_ICONS, UI_ICONS } from './icon-library.js';

/* ==========================================================================
   FUNCIONES AUXILIARES DE SINGULARIZACIÓN Y FORMATO
   Transformaciones de texto para adaptar etiquetas de sección por plantilla.
   ========================================================================== */

/**
 * Obtiene el título de una sección adaptado por la plantilla activa en base a aliases declarados.
 * @param {string} sectionKey - Clave identificadora de la sección (ej. 'skills', 'experience').
 * @returns {string} El título traducido y adaptado de la sección.
 * @description Si el título coincide con el valor global predeterminado y la plantilla activa declara
 *              un alias específico en templates-config.json, se sirve dicho alias para mayor modularidad.
 */
function getSectionTitle(sectionKey) {
  if (!state || !state.sectionTitles) return defaultData.sectionTitles[sectionKey] || '';
  let title = state.sectionTitles[sectionKey];
  if (!title) title = defaultData.sectionTitles[sectionKey] || '';

  if (title === defaultData.sectionTitles[sectionKey] && templatesConfig) {
    const activeTemplateConfig = templatesConfig.find(t => t.id === state.activeTemplate);
    if (activeTemplateConfig?.sectionAliases?.[sectionKey]) {
      return activeTemplateConfig.sectionAliases[sectionKey];
    }
  }
  return title;
}

/**
 * Obtiene el singular de una sección adaptado por la plantilla activa en base a aliases de configuración.
 * @param {string} sectionKey - Clave identificadora de la sección (ej. 'skills', 'languages').
 * @returns {string} La forma singular adaptada para la plantilla activa.
 * @description Intenta leer un alias singular específico en templates-config.json. Como fallback,
 *              aplica el algoritmo de singularización dinámica sobre el título de la sección.
 */
function getSingularForSection(sectionKey) {
  if (templatesConfig) {
    const activeTemplateConfig = templatesConfig.find(t => t.id === state.activeTemplate);
    if (activeTemplateConfig?.singularAliases?.[sectionKey]) {
      return activeTemplateConfig.singularAliases[sectionKey];
    }
  }
  const title = getSectionTitle(sectionKey);
  return getSingularFromPlural(title);
}

/**
 * Resuelve dinámicamente un valor de campo por defecto en base al singular de sección de la plantilla activa.
 * @param {string} value - El valor de texto original.
 * @param {string} field - El nombre del campo (ej. 'name', 'title').
 * @param {string} sectionKey - La sección correspondiente.
 * @returns {string} El valor resuelto y traducido si corresponde, o el original.
 * @description Mapea marcadores fijos (como 'Habilidad 1' o 'Nombre de tu Puesto de Trabajo') al
 *              término singular personalizado de la plantilla activa (como 'Competencia 1').
 */
function resolveDefaultValue(value, field, sectionKey) {
  if (!value || typeof value !== 'string') return value;
  const singular = getSingularForSection(sectionKey);

  if (sectionKey === 'skills' && field === 'name') {
    const match = value.match(/^(?:Habilidad|Competencia)\s+(\d+)$/i);
    if (match) return `${singular} ${match[1]}`;
  }
  if (sectionKey === 'techSkills' && field === 'name') {
    const match = value.match(/^(?:Habilidad técnica|Habilidad|Competencia)\s+(\d+)$/i);
    if (match) return `${singular} ${match[1]}`;
  }
  if (sectionKey === 'languages' && field === 'name') {
    const match = value.match(/^(?:Idioma)\s+(\d+)$/i);
    if (match) return `${singular} ${match[1]}`;
  }
  if (sectionKey === 'personality' && field === 'name') {
    const match = value.match(/^(?:Cualidad)\s+(\d+)$/i);
    if (match) return `${singular} ${match[1]}`;
  }
  if (sectionKey === 'experience' && field === 'title') {
    if (value === 'Nombre de tu Puesto de Trabajo') {
      return `Nombre de tu ${singular}`;
    }
  }
  if (sectionKey === 'education' && field === 'title') {
    if (value === 'Nombre de tu Grado o Formación Académica') {
      return `Nombre de tu ${singular}`;
    }
  }
  return value;
}

/**
 * Clona una plantilla HTML reemplazando marcadores estructurales y constantes de forma limpia.
 * @param {string} templateId - El ID del elemento <template> en el HTML.
 * @param {number} index - El índice (0-based) del elemento en la lista.
 * @param {Object} [data={}] - Objeto clave-valor con marcadores adicionales a reemplazar.
 * @returns {HTMLElement|null} El elemento clonado ya parseado y formateado, o null si falla.
 */
function getClonedTemplate(templateId, index, data = {}) {
  const template = document.getElementById(templateId);
  if (!template) {
    console.error(`Plantilla no encontrada: ${templateId}`);
    return null;
  }
  let html = template.innerHTML;

  html = html.replace(/{index}/g, index + 1)
    .replace(/{index-0}/g, index)
    .replace(/{trashIcon}/g, UI_ICONS.trash || '');

  Object.entries(data).forEach(([key, val]) => {
    const placeholder = new RegExp(`{${key}}`, 'g');
    html = html.replace(placeholder, val !== undefined && val !== null ? val : '');
  });

  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  return temp.firstElementChild;
}

/**
 * Obtiene la forma singular en español de un título en plural usando mapeos fijos y reglas morfológicas.
 * @param {string} text - El texto en plural a singularizar.
 * @returns {string} El texto singularizado.
 */
function getSingularFromPlural(text) {
  if (!text) return '';
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'experiencia laboral' || lower === 'experiencia') return 'Puesto de Trabajo';
  if (lower === 'formación académica' || lower === 'formacion academica' || lower === 'estudios') return 'Estudio';
  if (lower === 'habilidades técnicas' || lower === 'habilidades tecnicas' || lower === 'habilidades') return 'Habilidad';
  if (lower === 'idiomas') return 'Idioma';
  if (lower === 'intereses y hobbies' || lower === 'intereses') return 'Interés';

  const words = trimmed.split(/\s+/);
  const singularWords = words.map(word => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!cleanWord) return word;
    const isUpperCase = cleanWord === cleanWord.toUpperCase() && cleanWord.length > 1;
    const isTitleCase = cleanWord[0] === cleanWord[0].toUpperCase() && cleanWord.length > 1;

    let lowerWord = cleanWord.toLowerCase();
    let singular = lowerWord;

    if (lowerWord.endsWith('ces')) {
      singular = lowerWord.slice(0, -3) + 'z';
    } else if (lowerWord.endsWith('ciones')) {
      singular = lowerWord.slice(0, -6) + 'ción';
    } else if (lowerWord.endsWith('siones')) {
      singular = lowerWord.slice(0, -6) + 'sión';
    } else if (lowerWord.endsWith('ades')) {
      singular = lowerWord.slice(0, -4) + 'ad';
    } else if (lowerWord.endsWith('edes')) {
      singular = lowerWord.slice(0, -4) + 'ed';
    } else if (lowerWord.endsWith('udes')) {
      singular = lowerWord.slice(0, -4) + 'ud';
    } else if (lowerWord.endsWith('eses')) {
      singular = lowerWord.slice(0, -4) + 'és';
    } else if (lowerWord.endsWith('les')) {
      singular = lowerWord.slice(0, -2);
    } else if (lowerWord.endsWith('res')) {
      singular = lowerWord.slice(0, -2);
    } else if (lowerWord.endsWith('nes')) {
      singular = lowerWord.slice(0, -2);
    } else if (lowerWord.endsWith('as')) {
      singular = lowerWord.slice(0, -1);
    } else if (lowerWord.endsWith('os')) {
      singular = lowerWord.slice(0, -1);
    } else if (lowerWord.endsWith('s') && !lowerWord.endsWith('is') && !lowerWord.endsWith('us') && lowerWord.length > 2) {
      singular = lowerWord.slice(0, -1);
    }

    if (isUpperCase) {
      return singular.toUpperCase();
    } else if (isTitleCase) {
      return singular.charAt(0).toUpperCase() + singular.slice(1);
    }
    return singular;
  });

  return singularWords.join(' ');
}

/**
 * Devuelve el texto adecuado para el botón "Añadir" según el singular y la sección.
 * @param {string} singular - El término singular (ej. 'Estudio').
 * @param {string} sectionKey - La sección correspondiente (ej. 'education').
 * @returns {string} El texto para el botón de la UI.
 */
function getButtonText(singular, sectionKey) {
  if (sectionKey === 'experience' && singular === 'Puesto de Trabajo') return 'Añadir Trabajo';
  if (sectionKey === 'education' && singular === 'Estudio') return 'Añadir Formación';
  return `Añadir ${singular}`;
}

/**
 * Formatea un período en formato MM/YYYY a partir de fechas y el estado de vigencia.
 * @param {string} startDateVal - Fecha de inicio en formato YYYY-MM-DD.
 * @param {string} endDateVal - Fecha de finalización en formato YYYY-MM-DD.
 * @param {boolean} isCurrent - Indica si el puesto es actual (vigente).
 * @returns {string} El período formateado legible (ej. '05/2020 - Presente').
 */
function formatPeriodDates(startDateVal, endDateVal, isCurrent) {
  if (!startDateVal) return '';

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return `${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const startFormatted = formatMonthYear(startDateVal);

  if (isCurrent) {
    return `${startFormatted} - Presente`;
  }

  if (endDateVal) {
    const endFormatted = formatMonthYear(endDateVal);
    return `${startFormatted} - ${endFormatted}`;
  }

  return startFormatted;
}

/**
 * Analiza un período textual de CV e intenta extraer fechas de inicio, fin y estado vigente.
 * @param {string} periodText - El período de texto (ej. '03/2021 - 12/2024' o '2022 - Presente').
 * @returns {Object} Un objeto con startDate, endDate y current listo para inputs de fecha.
 */
function parsePeriodToDates(periodText) {
  const result = { startDate: '', endDate: '', current: false };
  if (!periodText) return result;

  const text = periodText.trim().toLowerCase();
  const parts = text.split(/[-–—]|a\s+|hasta\s+/).map(p => p.trim());

  const parsePart = (str) => {
    const myMatch = str.match(/^(\d{1,2})\/(\d{4})$/);
    if (myMatch) {
      const month = myMatch[1].padStart(2, '0');
      const year = myMatch[2];
      return `${year}-${month}-01`;
    }
    const yMatch = str.match(/^(\d{4})$/);
    if (yMatch) {
      return `${yMatch[1]}-01-01`;
    }
    return '';
  };

  if (parts.length >= 1 && parts[0]) {
    result.startDate = parsePart(parts[0]);
  }

  if (parts.length >= 2 && parts[1]) {
    if (parts[1] === 'presente' || parts[1] === 'actual' || parts[1] === 'actualidad' || parts[1].includes('hoy')) {
      result.current = true;
    } else {
      result.endDate = parsePart(parts[1]);
    }
  }

  return result;
}


/* ==========================================================================
   CARGA DINÁMICA DE PLANTILLAS Y MINIATURAS
   Importación lazy de módulos JS y CSS por plantilla con caché en memoria.
   ========================================================================== */
const templateCache = {};
let templatesConfig = [];

async function loadTemplate(templateId) {
  if (templateCache[templateId]) {
    return templateCache[templateId];
  }
  try {
    const modulePath = `../templates/${templateId}/index.js`;
    const module = await import(modulePath);

    const cssResponse = await fetch(`./src/templates/${templateId}/style.css`);
    const cssText = await cssResponse.text();

    templateCache[templateId] = {
      render: module.render,
      css: cssText
    };
    return templateCache[templateId];
  } catch (error) {
    console.error(`Error al cargar la plantilla ${templateId}:`, error);
    return null;
  }
}

function injectTemplateCSS(cssText) {
  let styleTag = document.getElementById('active-template-css');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'active-template-css';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = cssText;
}

function updateThumbnailColors() {
  if (!templatesConfig || templatesConfig.length === 0) return;
  templatesConfig.forEach(tmpl => {
    const cardDiv = document.querySelector(`.template-card[data-value="${tmpl.id}"]`);
    if (cardDiv) {
      const colors = state.colors[tmpl.id] || {};
      if (colors.primary) cardDiv.style.setProperty('--preview-primary', colors.primary);
      if (colors.accent) cardDiv.style.setProperty('--preview-accent', colors.accent);
      if (colors.bgLight) cardDiv.style.setProperty('--preview-rose', colors.bgLight);
    }
  });
}

// --- Modal de Selector de Plantillas ---
function openTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evita scroll en el fondo
  }
}

function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

async function initTemplateSelector() {
  const gridContainer = document.getElementById('template-modal-grid');
  if (!gridContainer) return;
  try {
    if (!templatesConfig || templatesConfig.length === 0) {
      const response = await fetch('./src/templates/templates-config.json');
      templatesConfig = await response.json();
    }
    gridContainer.innerHTML = '';

    for (const tmpl of templatesConfig) {
      const cardDiv = document.createElement('div');
      cardDiv.className = `template-card ${state.activeTemplate === tmpl.id ? 'active' : ''}`;
      cardDiv.setAttribute('data-value', tmpl.id);

      let svgHtml = '';
      try {
        const svgRes = await fetch(tmpl.thumbnail);
        svgHtml = await svgRes.text();
      } catch (err) {
        console.error(`Error loading thumbnail for ${tmpl.id}:`, err);
        svgHtml = `<div class="template-card-preview">Miniatura</div>`;
      }

      cardDiv.innerHTML = `
        <div class="template-card-preview">
          ${svgHtml}
        </div>
        <div class="template-card-info">
          <span class="template-card-name">${tmpl.name}</span>
          <span class="template-badge">${state.activeTemplate === tmpl.id ? 'Activa' : 'Seleccionar'}</span>
        </div>
      `;

      cardDiv.addEventListener('click', async () => {
        state.activeTemplate = tmpl.id;
        state.personal.photoShape = getDefaultPhotoShape(tmpl.id);
        applyTemplateDefaultOverrides(tmpl.id);
        renderAllForms();
        syncColorPickers();
        await updatePreview();
        updateThumbnailColors();
        saveState();
        closeTemplateModal();
      });

      gridContainer.appendChild(cardDiv);
    }
    
    // Sincronizar el texto del botón trigger
    const currentTemplateText = document.getElementById('current-template-text');
    if (currentTemplateText) {
      const activeTmplConfig = templatesConfig.find(t => t.id === state.activeTemplate);
      if (activeTmplConfig) {
        currentTemplateText.textContent = `Plantilla: ${activeTmplConfig.name}`;
      }
    }
    updateThumbnailColors();
  } catch (err) {
    console.error("Error al cargar la configuración de plantillas:", err);
  }
}

/* ==========================================================================
   ESTADO GLOBAL Y DATOS POR DEFECTO
   Variables de estado de la aplicación, zoom del previsualizador,
   y plantilla base de datos iniciales para un CV nuevo.
   ========================================================================== */
let state = null;
let currentZoomMode = 'fit'; // 'fit' o 'manual'
let zoomScale = 1.0;
const defaultData = {
  activeTemplate: 'moderno',
  sectionTitles: {
    personalInfo: 'Información Personal',
    profile: 'Perfil Profesional',
    contact: 'Contacto',
    experience: 'Experiencia Laboral',
    education: 'Formación Académica',
    skills: 'Habilidades Técnicas',
    languages: 'Idiomas',
    interests: 'Intereses y Hobbies',
    personality: 'Personalidad',
    techSkills: 'Habilidades Técnicas',
    additional: 'Información Adicional'
  },
  personal: {
    name: '',
    lastName: '',
    profession: '',
    photo: '',
    photoShape: 'circle',
    profile: [''],
    additionalInfo: ''
  },
  contact: [
    { type: 'location', text: '' },
    { type: 'email', text: '', href: '' },
    { type: 'phone', text: '' },
    { type: 'web', text: '', href: '' }
  ],
  experience: [
    {
      title: '',
      company: '',
      period: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
      button: { text: '', url: '' }
    }
  ],
  education: [
    {
      title: '',
      institution: '',
      period: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      button: { text: '', url: '' }
    }
  ],
  skills: [
    { name: '', level: 5 }
  ],
  languages: [
    { name: '', level: 'Nativo', percentage: 100 }
  ],
  interests: ['tech', 'reading', 'sports'],
  personality: [
    { name: '', level: 5 }
  ],
  techSkills: [
    { name: '' }
  ],
  colors: {
    moderno: { primary: '#2C2D30', accent: '#C9A227', bgLight: '#F3EFE6' },
    profesional: { primary: '#1b2a4a', accent: '#e8a838', sidebarBg: '#f4f6f8' },
    minimalista: { primary: '#111111', accent: '#666666' },
    creativo: { primary: '#222222', accent: '#f4b844', bgLight: '#fdf8ec' },
    rosa: { primary: '#d63a3a', accent: '#ff8a80', bgLight: '#ff8a80' },
    asimetrico: { primary: '#111316', accent: '#a68d73' },
    sage: { primary: '#c5ded6', accent: '#354240' },
    sobrio: { primary: '#EAEAE6', accent: '#222222' },
    estrella: { primary: '#4D4D4B', accent: '#F8F7F4', textColor: '#5A5A58' },
    split: { primary: '#1a1b1e', accent: '#e5dfd3', bgLight: '#ffffff' }
  },
  fonts: {
    moderno: 'Plus Jakarta Sans',
    profesional: 'Open Sans',
    minimalista: 'Inter',
    creativo: 'Plus Jakarta Sans',
    rosa: 'Inter',
    asimetrico: 'Montserrat',
    sage: 'Montserrat',
    sobrio: 'Montserrat',
    estrella: 'Montserrat',
    split: 'Montserrat'
  }
};

/* ==========================================================================
   AUTO-ESCALADO DEL PREVISUALIZADOR
   Ajusta la escala de la vista previa del CV al tamaño disponible del panel.
   ========================================================================== */
function scalePreview() {
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
    zoomScale = Math.max(0.3, Math.min(zoomScale, 1.2)); // límites razonables

    // Sincronizar controles UI
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

/* ==========================================================================
   ACTUALIZACIÓN DE LA PREVISUALIZACIÓN
   Renderiza el HTML de la plantilla activa con el estado actual del usuario.
   ========================================================================== */
const VISUAL_PLACEHOLDERS = {
  personal: {
    name: 'Nombres',
    lastName: 'Apellidos',
    profession: 'Profesión / Especialidad',
    profile: [
      'Describe aquí tu perfil profesional en uno o dos párrafos breves. Destaca tus principales competencias, experiencia y lo que puedes aportar a la empresa.',
      'Puedes añadir más párrafos de perfil o eliminarlos utilizando los botones de control de arriba.'
    ],
    additionalInfo: 'Disponible para incorporación inmediata y flexibilidad horaria en proyectos dinámicos.'
  },
  contact: {
    location: 'Ciudad, País',
    email: 'correo@ejemplo.com',
    phone: '+34 600 000 000',
    web: 'tuweb.com'
  },
  experience: {
    title: 'Nombre de tu Puesto de Trabajo',
    company: 'Nombre de la Empresa o Entidad',
    period: 'Año Inicio - Año Fin (o Actual)',
    bullets: [
      'Detalla aquí un logro importante o una responsabilidad principal que tuviste.',
      'Procura iniciar cada viñeta con un verbo de acción claro y conciso.',
      'Puedes agregar tantas líneas de logros o tareas como necesites.'
    ],
    buttonText: 'Ver Proyecto'
  },
  education: {
    title: 'Nombre de tu Grado o Formación Académica',
    institution: 'Nombre de la Institución o Escuela',
    period: 'Año Inicio - Año Fin',
    description: 'Describe brevemente las materias de mayor importancia, proyectos realizados o competencias especiales desarrolladas durante tus estudios.',
    buttonText: 'Ver Certificado'
  },
  skills: 'Habilidad',
  languages: {
    name: 'Idioma',
    level: 'Nivel'
  },
  personality: 'Cualidad',
  techSkills: 'Habilidad técnica'
};

async function updatePreview() {
  const previewContainer = document.querySelector('.cv-preview-container');
  if (!previewContainer) return;

  const previewPanel = document.getElementById('preview-panel');
  const loader = document.getElementById('cv-loader');

  // Solo mostramos el loader de carga si la plantilla NO está en la caché en memoria.
  // Si ya está cacheada, la renderización es instantánea y no se requiere loader.
  const isCached = !!templateCache[state.activeTemplate];

  if (!isCached) {
    if (previewPanel) {
      previewPanel.classList.add('is-loading');
    }
    if (loader) {
      loader.classList.remove('hidden');
    }
  }

  // Escalar previamente para evitar saltos y dimensiones extrañas
  scalePreview();

  const template = await loadTemplate(state.activeTemplate);
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

      // Perfil
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
      stateForRender.education = stateForRender.education.map(edu => ({
        ...edu,
        title: resolveDefaultValue(edu.title, 'title', 'education')
      }));
    }

    const html = template.render(stateForRender);
    previewContainer.innerHTML = html;
  } else {
    previewContainer.innerHTML = `<div style="padding: 20px; color: red;">Error al cargar la plantilla.</div>`;
  }

  // Aplicar la tipografía personalizada seleccionada para la plantilla activa
  const activeFont = state.fonts?.[state.activeTemplate];
  if (activeFont) {
    injectDynamicFontCSS(activeFont);
  }

  // Ajustar la escala por si cambió de plantilla o tamaño de contenedor
  scalePreview();
  checkPageOverflow();

  // Ocultar el spinner de carga y quitar el estado cargando si lo habíamos mostrado
  if (!isCached && previewPanel) {
    setTimeout(() => {
      previewPanel.classList.remove('is-loading');
      if (loader) {
        loader.classList.add('hidden');
      }
    }, 150);
  }
}

/* ==========================================================================
   SISTEMA DE DETECCIÓN DE DESBORDAMIENTO A4
   Comprueba si el contenido del CV excede los límites de una página A4
   y muestra un banner de advertencia visual al usuario.
   ========================================================================== */
function checkPageOverflow() {
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

/* ==========================================================================
   PERSISTENCIA Y MIGRACIÓN DE ESTADO (localStorage)
   Serializa/deserializa el estado del CV, aplica migraciones defensivas
   para compatibilidad con versiones anteriores del esquema de datos.
   ========================================================================== */
function saveState() {
  localStorage.setItem('cv_creator_state', JSON.stringify(state));
}

function migrateState(stateObj) {
  if (!stateObj) return;

  if (stateObj.personal) {
    if (stateObj.personal.name === 'AQUÍ VA TU NOMBRE') {
      stateObj.personal.name = 'Nombres y';
    }
    if (stateObj.personal.lastName === 'Y TUS APELLIDOS') {
      stateObj.personal.lastName = 'Apellidos';
    }
    if (stateObj.personal.profession === 'Tu Profesión / Especialidad') {
      stateObj.personal.profession = 'Profesión / Especialidad';
    }
    // Validar forma de foto según las formas soportadas de la plantilla activa
    const activeTmpl = stateObj.activeTemplate || 'moderno';
    const supportedShapes = getTemplateSupportedShapes(activeTmpl);
    if (!stateObj.personal.photoShape || !supportedShapes.includes(stateObj.personal.photoShape)) {
      stateObj.personal.photoShape = getDefaultPhotoShape(activeTmpl);
    }
  }

  // Asegurar compatibilidad de sectionTitles
  if (!stateObj.sectionTitles) {
    stateObj.sectionTitles = {};
  }
  const defaults = defaultData.sectionTitles;
  for (const key in defaults) {
    if (!stateObj.sectionTitles[key]) {
      stateObj.sectionTitles[key] = defaults[key];
    }
  }

  // Asegurar compatibilidad de colores para todas las plantillas y evitar referencias compartidas
  if (!stateObj.colors) {
    stateObj.colors = {};
  }
  const defaultColors = defaultData.colors;
  for (const key in defaultColors) {
    if (!stateObj.colors[key]) {
      stateObj.colors[key] = JSON.parse(JSON.stringify(defaultColors[key]));
    } else {
      // Copiar propiedades de color individuales que falten (como los nuevos pickers de texto)
      const tmplColors = defaultColors[key];
      for (const colProp in tmplColors) {
        if (stateObj.colors[key][colProp] === undefined) {
          stateObj.colors[key][colProp] = tmplColors[colProp];
        }
      }
    }
  }



  // Decoplar referencias de colores si son idénticas en memoria (evita bugs de sincronización)
  const colorKeys = Object.keys(stateObj.colors);
  if (colorKeys.length > 1) {
    const firstRef = stateObj.colors[colorKeys[0]];
    let allSameRef = true;
    for (let i = 1; i < colorKeys.length; i++) {
      if (stateObj.colors[colorKeys[i]] !== firstRef) {
        allSameRef = false;
        break;
      }
    }
    if (allSameRef) {
      colorKeys.forEach(k => {
        stateObj.colors[k] = JSON.parse(JSON.stringify(stateObj.colors[k]));
      });
    }
  }

  // Asegurar inicialización de tipografías para todas las plantillas
  if (!stateObj.fonts) {
    stateObj.fonts = {};
  }
  if (templatesConfig && templatesConfig.length > 0) {
    templatesConfig.forEach(tmpl => {
      if (!stateObj.fonts[tmpl.id]) {
        stateObj.fonts[tmpl.id] = tmpl.defaultFont || defaultData.fonts[tmpl.id] || 'Inter';
      }
    });
  } else {
    const defaultFonts = defaultData.fonts;
    for (const key in defaultFonts) {
      if (!stateObj.fonts[key]) {
        stateObj.fonts[key] = defaultFonts[key];
      }
    }
  }

  // Asegurar inicialización de personalidad para plantilla Rosa
  if (!stateObj.personality) {
    stateObj.personality = JSON.parse(JSON.stringify(defaultData.personality));
  }

  // Asegurar inicialización de intereses
  if (!stateObj.interests || stateObj.interests.length === 0) {
    stateObj.interests = ['tech', 'reading', 'sports'];
  }

  // Asegurar inicialización de habilidades técnicas estructuradas para Jones
  if (!stateObj.techSkills) {
    if (stateObj.personal && typeof stateObj.personal.sidebarSkills === 'string' && stateObj.personal.sidebarSkills.trim() !== '') {
      stateObj.techSkills = stateObj.personal.sidebarSkills.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => ({ name: line.trim() }));
    } else {
      stateObj.techSkills = JSON.parse(JSON.stringify(defaultData.techSkills));
    }
  }

  // Aplicar sobrescrituras de datos por defecto específicas de la plantilla
  if (stateObj.activeTemplate) {
    applyTemplateDefaultOverrides(stateObj.activeTemplate, stateObj);
  }

  if (stateObj.education) {
    stateObj.education.forEach(edu => {
      if (edu.startDate === undefined) edu.startDate = '';
      if (edu.endDate === undefined) edu.endDate = '';
      if (edu.current === undefined) edu.current = false;

      // Auto-parsear si están vacíos pero existe un período
      if (!edu.startDate && !edu.endDate && !edu.current && edu.period) {
        const parsed = parsePeriodToDates(edu.period);
        edu.startDate = parsed.startDate;
        edu.endDate = parsed.endDate;
        edu.current = parsed.current;
      }
    });
  }

  // Asegurar inicialización de campos de fecha y botón en experiencia
  if (stateObj.experience) {
    stateObj.experience.forEach(exp => {
      if (exp.startDate === undefined) exp.startDate = '';
      if (exp.endDate === undefined) exp.endDate = '';
      if (exp.current === undefined) exp.current = false;
      if (!exp.button) {
        exp.button = { text: 'Ver Proyecto', url: '' };
      }

      // Auto-parsear si están vacíos pero existe un período
      if (!exp.startDate && !exp.endDate && !exp.current && exp.period) {
        const parsed = parsePeriodToDates(exp.period);
        exp.startDate = parsed.startDate;
        exp.endDate = parsed.endDate;
        exp.current = parsed.current;
      }
    });
  }
}

/* ==========================================================================
   CONFIGURACIÓN DE PLANTILLAS Y SOBRESCRITURAS
   Lectura de features, foto de perfil, overrides de contenido y detección
   de ítems por defecto (shrinkage) para aislamiento de estado entre plantillas.
   ========================================================================== */

/**
 * Obtiene la forma de la foto de perfil predeterminada para una plantilla específica.
 * @param {string} templateId - El ID de la plantilla.
 * @returns {string} La forma de la foto ('circle', 'rounded', 'square').
 * @description Lee el valor de defaultPhotoShape configurado en el JSON de la plantilla activa.
 *              Si no está configurado, retorna 'circle' por defecto.
 */
function getDefaultPhotoShape(templateId) {
  if (templatesConfig) {
    const config = templatesConfig.find(t => t.id === templateId);
    if (config && config.defaultPhotoShape) {
      return config.defaultPhotoShape;
    }
  }
  return 'circle';
}

function getTemplateSupportedShapes(templateId) {
  if (templatesConfig) {
    const config = templatesConfig.find(t => t.id === templateId);
    if (config && config.supportedPhotoShapes) {
      return config.supportedPhotoShapes;
    }
  }
  return ['circle', 'rounded', 'square']; // Valor por defecto si no se especifica
}

function getActiveTemplateSupportedShapes() {
  return getTemplateSupportedShapes(state ? state.activeTemplate : 'moderno');
}

function renderShapeToggles() {
  const shapeTogglesSide = document.querySelector('.avatar-shape-toggles-side');
  if (!shapeTogglesSide) return;

  const supported = getActiveTemplateSupportedShapes();
  shapeTogglesSide.innerHTML = '';

  const shapeDefinitions = {
    circle: {
      title: 'Circular',
      svg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none" /></svg>`
    },
    rounded: {
      title: 'Bordes Redondeados',
      svg: `<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" stroke-width="2" fill="none" /></svg>`
    },
    square: {
      title: 'Cuadrada',
      svg: `<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="0" stroke="currentColor" stroke-width="2" fill="none" /></svg>`
    }
  };

  supported.forEach(shapeId => {
    const def = shapeDefinitions[shapeId];
    if (!def) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `shape-toggle-btn ${state.personal.photoShape === shapeId ? 'active' : ''}`;
    btn.setAttribute('data-shape', shapeId);
    btn.title = def.title;
    btn.innerHTML = def.svg;
    shapeTogglesSide.appendChild(btn);
  });
}

function getActiveTemplateFeatures() {
  if (!templatesConfig || templatesConfig.length === 0) {
    return {
      buttons: true,
      educationButtons: true,
      experienceButtons: true,
      skillLevels: true,
      languageLevels: true,
      personality: false,
      personalityLevels: false,
      techSkills: false
    };
  }
  const activeTemplateConfig = templatesConfig.find(t => t.id === (state ? state.activeTemplate : 'moderno'));
  const feat = (activeTemplateConfig && activeTemplateConfig.features) || {};
  return {
    buttons: feat.buttons !== undefined ? feat.buttons : true,
    educationButtons: feat.educationButtons !== undefined ? feat.educationButtons : (feat.buttons !== undefined ? feat.buttons : true),
    experienceButtons: feat.experienceButtons !== undefined ? feat.experienceButtons : (feat.buttons !== undefined ? feat.buttons : true),
    skillLevels: feat.skillLevels !== undefined ? feat.skillLevels : true,
    skillPercentage: feat.skillPercentage !== undefined ? feat.skillPercentage : false,
    languageLevels: feat.languageLevels !== undefined ? feat.languageLevels : true,
    personality: feat.personality !== undefined ? feat.personality : false,
    personalityLevels: feat.personalityLevels !== undefined ? feat.personalityLevels : false,
    techSkills: feat.techSkills !== undefined ? feat.techSkills : false,
    additionalInfoText: feat.additionalInfoText !== undefined ? feat.additionalInfoText : false
  };
}

/**
 * Compara recursivamente un elemento con su valor de plantilla predeterminado.
 * @param {*} item - El elemento a comprobar (ej. objeto de experiencia o string de perfil).
 * @param {*} defaultItem - El elemento por defecto usado como molde de comparación.
 * @returns {boolean} True si todas las propiedades no modificadas equivalen al default, False si el usuario editó algo.
 */
function isDefaultItemValue(item, defaultItem) {
  if (typeof defaultItem !== 'object' || defaultItem === null || typeof item !== 'object' || item === null) {
    return item === defaultItem;
  }
  for (const key in defaultItem) {
    if (typeof defaultItem[key] === 'object' && defaultItem[key] !== null) {
      if (!isDefaultItemValue(item[key], defaultItem[key])) return false;
    } else if (typeof defaultItem[key] === 'string' || typeof defaultItem[key] === 'number' || typeof defaultItem[key] === 'boolean') {
      const val = item[key];
      const defVal = defaultItem[key];
      if (val !== undefined && val !== '' && val !== defVal) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Obtiene el valor de una colección desde el objeto de estado, soportando rutas profundas (ej: perfil).
 * @param {Object} stateObj - El objeto de estado.
 * @param {string} key - La clave identificadora de la colección.
 * @returns {Array|undefined} La colección de datos o undefined.
 */
function getCollectionState(stateObj, key) {
  if (key === 'profile') {
    return stateObj && stateObj.personal ? stateObj.personal.profile : undefined;
  }
  return stateObj ? stateObj[key] : undefined;
}

/**
 * Establece el valor de una colección en el objeto de estado, resolviendo rutas profundas de datos.
 * @param {Object} stateObj - El objeto de estado.
 * @param {string} key - La clave de la colección.
 * @param {Array} value - El nuevo array de datos a asignar.
 */
function setCollectionState(stateObj, key, value) {
  if (key === 'profile') {
    if (stateObj && stateObj.personal) {
      stateObj.personal.profile = value;
    }
  } else if (stateObj) {
    stateObj[key] = value;
  }
}

/**
 * Obtiene la colección base por defecto (placeholders iniciales) para una clave dada.
 * @param {string} key - La clave de la colección.
 * @returns {Array|undefined} El array por defecto global.
 */
function getBaseDefaultCollection(key) {
  if (key === 'profile') {
    return defaultData.personal ? defaultData.personal.profile : undefined;
  }
  return defaultData[key];
}

/**
 * Recopila todos los ítems por defecto (placeholders globales y de plantillas específicas) para una colección.
 * @param {string} key - Clave de la colección (ej. 'experience', 'education').
 * @returns {Array} Un array con todas las variantes de placeholders del sistema para esa clave.
 * @description Utilizado por el algoritmo de encogimiento para identificar cuándo eliminar ítems no editados.
 */
function getTemplateDefaultItems(key) {
  const defaults = [];
  const baseDefault = getBaseDefaultCollection(key);

  if (Array.isArray(baseDefault)) {
    baseDefault.forEach(item => defaults.push(item));
  }

  if (templatesConfig) {
    templatesConfig.forEach(config => {
      let overrides = config.defaultDataOverrides && config.defaultDataOverrides[key];
      if (typeof overrides === 'number') {
        const baseItem = baseDefault && baseDefault[0];
        if (baseItem !== undefined) {
          defaults.push(baseItem);
        }
      } else if (Array.isArray(overrides)) {
        overrides.forEach(item => defaults.push(item));
      }
    });
  }

  // Lista de compatibilidad con valores heredados para limpiar datos antiguos de localStorage
  if (key === 'experience') {
    defaults.push({
      title: "Nombre de tu Segundo Puesto de Trabajo",
      company: "Nombre de la Segunda Empresa o Entidad",
      period: "Año Inicio - Año Fin",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [
        "Describe una contribución relevante realizada en este puesto.",
        "Utiliza métricas siempre que sea posible (ej. aumenté ventas, reduje costes)."
      ],
      button: { text: "Ver Proyecto", url: "https://ejemplo.com" }
    });
  }

  return defaults;
}

/**
 * Comprueba si un elemento equivale a cualquiera de los placeholders por defecto del sistema.
 * @param {*} item - El elemento a evaluar.
 * @param {string} key - La clave de la colección correspondiente.
 * @returns {boolean} True si coincide con algún default del sistema, False de lo contrario.
 */
function isItemDefault(item, key) {
  const defaults = getTemplateDefaultItems(key);
  for (const defItem of defaults) {
    if (isDefaultItemValue(item, defItem)) return true;
  }
  return false;
}

/**
 * Aplica las sobrescrituras de contenido por defecto de la plantilla seleccionada al estado de forma aislada.
 * @param {string} templateId - El ID de la plantilla activa.
 * @param {Object} [stateObj=state] - El objeto de estado a modificar.
 * @description Si la plantilla define overrides numéricos u objetos, expande el estado si es necesario.
 *              Si no hay overrides para una clave y los elementos extra son placeholders sin editar,
 *              los encoge (shrinkage) de forma segura para evitar filtraciones de registros entre plantillas.
 */
function applyTemplateDefaultOverrides(templateId, stateObj = state) {
  if (!stateObj || !templatesConfig || templatesConfig.length === 0) return;
  const config = templatesConfig.find(t => t.id === templateId);

  const collectionKeys = ['education', 'experience', 'skills', 'languages', 'personality', 'techSkills', 'interests', 'profile'];

  collectionKeys.forEach(key => {
    let overrides = config && config.defaultDataOverrides && config.defaultDataOverrides[key];
    const baseDefault = getBaseDefaultCollection(key);

    if (typeof overrides === 'number') {
      const count = overrides;
      overrides = [];
      for (let i = 0; i < count; i++) {
        const baseItem = baseDefault && baseDefault[0];
        if (baseItem !== undefined) {
          overrides.push(JSON.parse(JSON.stringify(baseItem)));
        }
      }
    }

    const stateVal = getCollectionState(stateObj, key);

    if (overrides && Array.isArray(overrides)) {
      if (!stateVal) {
        setCollectionState(stateObj, key, JSON.parse(JSON.stringify(overrides)));
      } else if (stateVal.length < overrides.length) {
        const diff = overrides.length - stateVal.length;
        for (let i = 0; i < diff; i++) {
          const overrideIndex = overrides.length - diff + i;
          stateVal.push(JSON.parse(JSON.stringify(overrides[overrideIndex])));
        }
      }
    } else {
      if (stateVal && baseDefault && Array.isArray(stateVal) && Array.isArray(baseDefault)) {
        const defaultLen = baseDefault.length;
        if (stateVal.length > defaultLen) {
          let allExtrasAreDefaults = true;

          for (let i = defaultLen; i < stateVal.length; i++) {
            if (!isItemDefault(stateVal[i], key)) {
              allExtrasAreDefaults = false;
              break;
            }
          }

          if (allExtrasAreDefaults) {
            setCollectionState(stateObj, key, stateVal.slice(0, defaultLen));
          }
        }
      }
    }
  });
}

function loadState() {
  const saved = localStorage.getItem('cv_creator_state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      migrateState(state);
    } catch (e) {
      console.error("Error al cargar localStorage, usando datos por defecto", e);
      state = JSON.parse(JSON.stringify(defaultData));
    }
  } else {
    state = JSON.parse(JSON.stringify(defaultData));
    state.personal.photoShape = getDefaultPhotoShape(state.activeTemplate);
  }
  applyTemplateDefaultOverrides(state.activeTemplate, state);
}

/* ==========================================================================
   HELPERS PARA ACCESO A RUTAS DE DATOS PROFUNDAS
   Lectura y escritura de propiedades anidadas usando notación de punto.
   ========================================================================== */
function getDeepValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function setDeepValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) current[part] = {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

/* ==========================================================================
   GESTIÓN DE FORMULARIOS — SINCRONIZACIÓN
   Sincroniza los valores del estado global con los inputs del panel lateral,
   incluyendo foto de perfil, selectores de forma, teléfono y colores.
   ========================================================================== */
function syncStaticInputs() {
  const inputs = document.querySelectorAll('[data-bind]');
  inputs.forEach(input => {
    const path = input.getAttribute('data-bind');
    const value = getDeepValue(state, path);
    if (value !== undefined) {
      input.value = value;
    }
  });

  // Vista previa de la foto de perfil (sincroniza la visibilidad y forma de la imagen/SVG de vista previa)
  const imgPreview = document.getElementById('avatar-preview-img');
  const svgPreview = document.querySelector('.avatar-preview .placeholder-svg');
  const previewBox = document.getElementById('avatar-preview-box');
  const btnClearPhoto = document.getElementById('btn-clear-photo');

  // Comprobar de forma dinámica si la plantilla activa permite borrar la foto de perfil
  const activeTmplConfig = templatesConfig ? templatesConfig.find(t => t.id === state.activeTemplate) : null;
  const allowClearPhoto = activeTmplConfig?.features?.allowClearPhoto || false;

  if (imgPreview && svgPreview) {
    if (state.personal.photo) {
      imgPreview.src = state.personal.photo;
      imgPreview.style.display = 'block';
      svgPreview.style.display = 'none';
      if (btnClearPhoto) {
        btnClearPhoto.style.display = allowClearPhoto ? 'inline-flex' : 'none';
      }
    } else {
      imgPreview.src = '';
      imgPreview.style.display = 'none';
      svgPreview.style.display = 'block';
      if (btnClearPhoto) btnClearPhoto.style.display = 'none';
    }
  }
  if (previewBox) {
    previewBox.classList.remove('shape-circle', 'shape-rounded', 'shape-square');
    previewBox.classList.add(`shape-${state.personal.photoShape || 'circle'}`);
  }

  // Renderizar las formas permitidas para la foto
  renderShapeToggles();

  // Sincroniza los botones de forma de la foto
  const shapeButtons = document.querySelectorAll('.shape-toggle-btn');
  shapeButtons.forEach(btn => {
    if (btn.getAttribute('data-shape') === (state.personal.photoShape || 'circle')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Sincroniza los campos divididos del número de teléfono
  const fullPhone = getDeepValue(state, 'contact.2.text') || '';
  const prefixSelect = document.getElementById('phone-prefix-select');
  const numberInput = document.getElementById('phone-number-input');
  const fullInputHidden = document.getElementById('phone-full-input');

  if (prefixSelect && numberInput) {
    const prefixes = Array.from(prefixSelect.options).map(opt => opt.value);
    prefixes.sort((a, b) => b.length - a.length);

    let matchedPrefix = '+34'; // por defecto
    let restNumber = fullPhone;

    for (const pref of prefixes) {
      if (fullPhone.startsWith(pref)) {
        matchedPrefix = pref;
        restNumber = fullPhone.slice(pref.length).trim();
        break;
      }
    }

    prefixSelect.value = matchedPrefix;
    numberInput.value = restNumber;
    if (fullInputHidden) {
      fullInputHidden.value = fullPhone;
    }
  }

  // Sincronizar selector visual de plantilla
  const triggerBtnText = document.getElementById('current-template-text');
  if (triggerBtnText) {
    const activeTemplateConfig = templatesConfig ? templatesConfig.find(t => t.id === state.activeTemplate) : null;
    const displayName = activeTemplateConfig ? activeTemplateConfig.name : 'Moderno';
    triggerBtnText.textContent = `Plantilla: ${displayName}`;
  }

  // Marcar la opción activa en el selector de plantillas modal
  const cards = document.querySelectorAll('.template-card');
  cards.forEach(card => {
    const isAct = card.getAttribute('data-value') === state.activeTemplate;
    card.classList.toggle('active', isAct);
    const badge = card.querySelector('.template-badge');
    if (badge) {
      badge.textContent = isAct ? 'Activa' : 'Seleccionar';
    }
  });

  // Alternar campos del formulario según la plantilla activa y sus características (features)
  const features = getActiveTemplateFeatures();

  // Alternar clases de características en el editor
  const editorPanel = document.querySelector('.editor-panel');
  if (editorPanel) {
    editorPanel.classList.toggle('hide-buttons', !features.buttons);
    editorPanel.classList.toggle('hide-education-buttons', !features.educationButtons);
    editorPanel.classList.toggle('hide-experience-buttons', !features.experienceButtons);
    editorPanel.classList.toggle('hide-skill-levels', !features.skillLevels);
  }

  // Reordenar los botones de las pestañas (tabs) según la configuración de la plantilla activa
  const activeTemplateConfig = templatesConfig.find(t => t.id === state.activeTemplate);
  const navTabs = document.querySelector('.editor-tabs');
  if (navTabs) {
    const tabs = Array.from(navTabs.querySelectorAll('.tab-btn'));
    const defaultOrder = [
      'sec-personal',
      'sec-contact',
      'sec-education',
      'sec-experience',
      'sec-tech-skills',
      'sec-skills',
      'sec-personality',
      'sec-languages',
      'sec-interests',
      'sec-additional',
      'sec-design'
    ];
    const order = (activeTemplateConfig && activeTemplateConfig.tabOrder) || defaultOrder;
    
    // Primero, reordenar y mostrar los que están en la lista
    order.forEach(target => {
      const tab = tabs.find(t => t.getAttribute('data-target') === target);
      if (tab) {
        tab.style.display = '';
        navTabs.appendChild(tab);
      }
    });

    // Luego, ocultar los que no están en la lista y gestionar si el activo se ocultó
    tabs.forEach(tab => {
      const target = tab.getAttribute('data-target');
      if (!order.includes(target)) {
        tab.style.display = 'none';
        if (tab.classList.contains('active')) {
          const firstTab = tabs.find(t => t.getAttribute('data-target') === 'sec-personal');
          if (firstTab) firstTab.click();
        }
      }
    });
  }



  const tabPersonality = document.getElementById('tab-personality');
  if (tabPersonality) {
    if (features.personality) {
      tabPersonality.style.display = 'block';
      renderPersonalityForm();
    } else {
      tabPersonality.style.display = 'none';
      if (tabPersonality.classList.contains('active')) {
        const firstTab = document.querySelector('.tab-btn[data-target="sec-personal"]');
        if (firstTab) firstTab.click();
      }
    }
  }

  // Forzar re-renderizado de formularios con campos condicionales al cambiar de plantilla
  renderSkillsForm();
  renderLanguagesForm();
  renderInterestsForm();

  // Sincronizar botones de tabs según la plantilla
  const tabTechSkills = document.getElementById('tab-tech-skills');
  const tabSkills = document.getElementById('tab-skills');

  if (tabTechSkills) {
    if (features.techSkills) {
      tabTechSkills.style.display = 'block';
      tabTechSkills.textContent = 'Habilidades';
      renderTechSkillsForm();
    } else {
      tabTechSkills.style.display = 'none';
      if (tabTechSkills.classList.contains('active')) {
        const firstTab = document.querySelector('.tab-btn[data-target="sec-personal"]');
        if (firstTab) firstTab.click();
      }
    }
  }

  if (tabSkills) {
    tabSkills.textContent = features.techSkills ? 'Competencias' : 'Habilidades';
  }

  const tabInterests = document.querySelector('.tab-btn[data-target="sec-interests"]');
  if (tabInterests) {
    const hasInterestsInOrder = activeTemplateConfig && activeTemplateConfig.tabOrder && activeTemplateConfig.tabOrder.includes('sec-interests');
    if (!hasInterestsInOrder) {
      tabInterests.style.display = 'none';
      if (tabInterests.classList.contains('active')) {
        const firstTab = document.querySelector('.tab-btn[data-target="sec-personal"]');
        if (firstTab) firstTab.click();
      }
    } else {
      tabInterests.style.display = 'block';
      tabInterests.textContent = getSectionTitle('interests');
    }
  }

  const tabAdditional = document.querySelector('.tab-btn[data-target="sec-additional"]');
  if (tabAdditional) {
    const hasAdditionalInOrder = activeTemplateConfig && activeTemplateConfig.tabOrder && activeTemplateConfig.tabOrder.includes('sec-additional');
    if (!hasAdditionalInOrder) {
      tabAdditional.style.display = 'none';
      if (tabAdditional.classList.contains('active')) {
        const firstTab = document.querySelector('.tab-btn[data-target="sec-personal"]');
        if (firstTab) firstTab.click();
      }
    } else {
      tabAdditional.style.display = 'block';
      tabAdditional.textContent = getSectionTitle('additional');
    }
  }

  // Sincronizar leyendas editables (evitando reescribir si está enfocada por el usuario)
  const editableLegends = document.querySelectorAll('legend[contenteditable="true"]');
  editableLegends.forEach(legend => {
    const sectionKey = legend.getAttribute('data-section-title');
    const targetText = getSectionTitle(sectionKey);
    if (document.activeElement !== legend) {
      if (legend.textContent !== targetText) {
        legend.textContent = targetText;
      }
    }
    updateSectionLabels(sectionKey);
  });

  // Actualizar los pickers de colores del tema
  syncColorPickers();
  updateThumbnailColors();

  // Actualizar el selector de tipografía del CV
  syncFontSelector();
}

/* --- Sincronización de Etiquetas de Sección (tarjetas repeater y botones) --- */
function updateSectionLabels(sectionKey) {
  const titleText = getSectionTitle(sectionKey);
  const singular = getSingularForSection(sectionKey);

  let containerId = '';
  let addAction = '';
  if (sectionKey === 'experience') {
    containerId = 'experience-list-container';
    addAction = 'add-experience';
  } else if (sectionKey === 'education') {
    containerId = 'education-list-container';
    addAction = 'add-education';
  } else if (sectionKey === 'skills') {
    containerId = 'skills-list-container';
    addAction = 'add-skill';
  } else if (sectionKey === 'languages') {
    containerId = 'languages-list-container';
    addAction = 'add-language';
  }

  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      const cards = container.querySelectorAll('.repeater-card');
      cards.forEach((card, index) => {
        const titleSpan = card.querySelector('.repeater-title');
        if (titleSpan) {
          titleSpan.textContent = `${singular} #${index + 1}`;
        }

        // Re-etiquetar el label principal del campo en Habilidades o Idiomas
        if (sectionKey === 'skills' || sectionKey === 'languages') {
          const labelField = card.querySelector('.form-group label');
          if (labelField && !labelField.textContent.includes('Nivel') && !labelField.textContent.includes('Dominio')) {
            labelField.textContent = singular;
          }
        }
      });
    }
  }

  if (addAction) {
    const addBtnSpan = document.querySelector(`[data-action="${addAction}"] span`);
    if (addBtnSpan) {
      addBtnSpan.textContent = getButtonText(singular, sectionKey);
    }
  }
}

function syncColorPickers() {
  const activeTmpl = state.activeTemplate;
  const container = document.querySelector('.color-picker-grid');
  if (!container) return;

  const activeTemplateConfig = templatesConfig ? templatesConfig.find(t => t.id === activeTmpl) : null;
  const colorsDef = activeTemplateConfig?.colors || { primary: "Color Principal", accent: "Color de Acento" };
  const currentColors = state.colors[activeTmpl] || {};

  container.innerHTML = '';

  Object.entries(colorsDef).forEach(([token, label]) => {
    const value = currentColors[token] || '#000000';
    const itemDiv = document.createElement('div');
    itemDiv.className = 'color-picker-item';
    itemDiv.innerHTML = `
      <input type="color" id="color-${token}" data-token="${token}" value="${value}">
      <span>${label}</span>
    `;
    container.appendChild(itemDiv);

    // Añade el escuchador de eventos de entrada
    const input = itemDiv.querySelector('input');
    input.addEventListener('input', (e) => {
      state.colors[activeTmpl][token] = e.target.value;
      updatePreview();
      updateThumbnailColors();
      saveState();
    });
  });
}

/**
 * Lista de tipografías soportadas por el editor, disponibles en el dropdown del panel de Diseño.
 * @constant {string[]}
 * @description Cada entrada debe coincidir con una familia importada en styles.css vía Google Fonts.
 *              Para añadir nuevas tipografías, basta con importarlas en el CSS y añadirlas aquí.
 */
const SUPPORTED_FONTS = ['Inter', 'Montserrat', 'Open Sans', 'Plus Jakarta Sans'];

/**
 * Inyecta o actualiza una regla CSS dinámica para aplicar la tipografía seleccionada al CV previsualizador.
 * @param {string} fontName - El nombre de la familia tipográfica a aplicar (ej. 'Montserrat').
 * @description Crea o reutiliza un elemento <style id="dynamic-cv-font"> en el <head> del documento.
 *              La regla utiliza `!important` para sobreescribir las fuentes declaradas en el CSS de cada
 *              plantilla, garantizando que la elección del usuario prevalezca tanto en pantalla como en
 *              la impresión/exportación a PDF (window.print).
 */
function injectDynamicFontCSS(fontName) {
  let styleTag = document.getElementById('dynamic-cv-font');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-cv-font';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `.cv-page, .cv-page * { font-family: '${fontName}', sans-serif !important; }`;
}

/**
 * Sincroniza el selector de tipografía del panel de Diseño con el estado de la plantilla activa.
 * @description Pobla dinámicamente las opciones del dropdown `#font-family-select` con las tipografías
 *              de SUPPORTED_FONTS, establece el valor seleccionado en base a `state.fonts[activeTemplate]`,
 *              y vincula el evento `change` para actualizar el estado, inyectar la fuente y persistir.
 *              Sigue el mismo patrón modular que `syncColorPickers()`.
 */
function syncFontSelector() {
  const container = document.getElementById('custom-font-select-container');
  const trigger = document.getElementById('custom-font-select-trigger');
  const selectedValue = document.getElementById('custom-font-selected-value');
  const optionsContainer = document.getElementById('custom-font-select-options');
  
  if (!container || !trigger || !selectedValue || !optionsContainer) return;

  const activeTmpl = state.activeTemplate;
  const activeTmplConfig = templatesConfig.find(t => t.id === activeTmpl);
  
  // Obtener fuentes soportadas (por defecto todas si no se especifica en el JSON)
  const supported = (activeTmplConfig && activeTmplConfig.supportedFonts) || SUPPORTED_FONTS;

  let currentFont = state.fonts?.[activeTmpl] || defaultData.fonts[activeTmpl] || activeTmplConfig?.defaultFont || 'Inter';
  if (!supported.includes(currentFont)) {
    currentFont = supported[0] || 'Inter';
    if (!state.fonts) state.fonts = {};
    state.fonts[activeTmpl] = currentFont;
    injectDynamicFontCSS(currentFont);
  }

  // Sincronizar el valor actual en el botón
  selectedValue.textContent = currentFont;
  selectedValue.style.fontFamily = `'${currentFont}', sans-serif`;

  // Poblar opciones
  optionsContainer.innerHTML = '';
  supported.forEach(font => {
    const optionDiv = document.createElement('div');
    optionDiv.className = `custom-select-option ${font === currentFont ? 'selected' : ''}`;
    optionDiv.setAttribute('data-value', font);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'custom-select-option-text';
    nameSpan.textContent = font;
    nameSpan.style.fontFamily = `'${font}', sans-serif`;

    const previewSpan = document.createElement('span');
    previewSpan.className = 'custom-select-option-preview';
    previewSpan.textContent = 'AaBbCc';
    previewSpan.style.fontFamily = `'${font}', sans-serif`;

    optionDiv.appendChild(nameSpan);
    optionDiv.appendChild(previewSpan);

    optionDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.fonts) state.fonts = {};
      state.fonts[state.activeTemplate] = font;
      
      selectedValue.textContent = font;
      selectedValue.style.fontFamily = `'${font}', sans-serif`;
      
      injectDynamicFontCSS(font);
      updatePreview();
      saveState();
      container.classList.remove('active');
      
      // Actualizar clases de selección
      optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
        opt.classList.toggle('selected', opt.getAttribute('data-value') === font);
      });
    });

    optionsContainer.appendChild(optionDiv);
  });
}

/* ==========================================================================
   GESTIÓN DE FORMULARIOS — RENDERIZADO DE SECCIONES
   Genera dinámicamente las tarjetas de edición para cada sección del CV:
   perfil, experiencia, educación, habilidades, personalidad, idiomas e intereses.
   ========================================================================== */

/* --- Perfil Profesional (textarea múltiple) --- */
function renderProfileForm() {
  const container = document.getElementById('profile-paragraphs-container');
  if (!container) return;
  container.innerHTML = '';

  state.personal.profile.forEach((text, index) => {
    const card = getClonedTemplate('template-profile-card', index);
    if (!card) return;

    // Asignar valor al textarea
    const textarea = card.querySelector('.profile-paragraph-input');
    if (textarea) textarea.value = text;

    // Si solo hay un elemento, quitar el botón de eliminar
    if (state.personal.profile.length <= 1) {
      card.querySelector('.btn-remove')?.remove();
    }

    container.appendChild(card);
  });
}

/* --- Experiencia Laboral --- */
function renderExperienceForm() {
  const container = document.getElementById('experience-list-container');
  if (!container) return;
  container.innerHTML = '';

  const titleText = (state.sectionTitles && state.sectionTitles.experience) || defaultData.sectionTitles.experience;
  const singular = getSingularFromPlural(titleText);

  const addBtnSpan = document.querySelector('[data-action="add-experience"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = getButtonText(singular, 'experience');
  }

  state.experience.forEach((exp, index) => {
    const card = getClonedTemplate('template-experience-card', index, { singular });
    if (!card) return;

    // Asignar campos de texto
    const titleInput = card.querySelector('.exp-input[data-field="title"]');
    if (titleInput) titleInput.value = exp.title || '';

    const companyInput = card.querySelector('.exp-input[data-field="company"]');
    if (companyInput) companyInput.value = exp.company || '';

    // Asignar fechas
    const startInput = card.querySelector('.exp-date-start');
    if (startInput) startInput.value = exp.startDate || '';

    const endInput = card.querySelector('.exp-date-end');
    if (endInput) {
      endInput.value = exp.endDate || '';
      if (exp.current) {
        endInput.disabled = true;
      }
    }

    const currentCheckbox = card.querySelector('.exp-date-current');
    if (currentCheckbox) {
      currentCheckbox.checked = !!exp.current;
    }

    // Bullets (logros)
    const bulletsTextarea = card.querySelector('.exp-bullets-input');
    if (bulletsTextarea) {
      bulletsTextarea.value = (exp.bullets || []).join('\n');
    }

    // Campos de botón opcional
    const btnTextInput = card.querySelector('.exp-btn-input[data-field="text"]');
    if (btnTextInput) btnTextInput.value = exp.button?.text || 'Ver Proyecto';

    const btnUrlInput = card.querySelector('.exp-btn-input[data-field="url"]');
    if (btnUrlInput) btnUrlInput.value = exp.button?.url || '';

    container.appendChild(card);
  });
}

/* --- Formación Académica --- */
function renderEducationForm() {
  const container = document.getElementById('education-list-container');
  if (!container) return;
  container.innerHTML = '';

  const titleText = (state.sectionTitles && state.sectionTitles.education) || defaultData.sectionTitles.education;
  const singular = getSingularFromPlural(titleText);

  const addBtnSpan = document.querySelector('[data-action="add-education"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = getButtonText(singular, 'education');
  }

  state.education.forEach((edu, index) => {
    const card = getClonedTemplate('template-education-card', index, { singular });
    if (!card) return;

    // Asignar campos de texto
    const titleInput = card.querySelector('.edu-input[data-field="title"]');
    if (titleInput) titleInput.value = edu.title || '';

    const instInput = card.querySelector('.edu-input[data-field="institution"]');
    if (instInput) instInput.value = edu.institution || '';

    // Asignar fechas
    const startInput = card.querySelector('.edu-date-start');
    if (startInput) startInput.value = edu.startDate || '';

    const endInput = card.querySelector('.edu-date-end');
    if (endInput) {
      endInput.value = edu.endDate || '';
      if (edu.current) {
        endInput.disabled = true;
      }
    }

    const currentCheckbox = card.querySelector('.edu-date-current');
    if (currentCheckbox) {
      currentCheckbox.checked = !!edu.current;
    }

    // Descripción
    const descTextarea = card.querySelector('textarea[data-field="description"]');
    if (descTextarea) descTextarea.value = edu.description || '';

    // Campos de botón opcional
    const btnTextInput = card.querySelector('.edu-btn-input[data-field="text"]');
    if (btnTextInput) btnTextInput.value = edu.button?.text || 'Ver Certificado';

    const btnUrlInput = card.querySelector('.edu-btn-input[data-field="url"]');
    if (btnUrlInput) btnUrlInput.value = edu.button?.url || '';

    container.appendChild(card);
  });
}

/* --- Habilidades --- */
function renderSkillsForm() {
  const container = document.getElementById('skills-list-container');
  if (!container) return;
  container.innerHTML = '';

  const titleText = getSectionTitle('skills');
  const singular = getSingularForSection('skills');

  const addBtnSpan = document.querySelector('[data-action="add-skill"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = getButtonText(singular, 'skills');
  }

  const features = getActiveTemplateFeatures();
  const showLevel = features.skillLevels;
  const showPercentage = features.skillPercentage;
  const templateId = (showLevel && showPercentage) ? 'template-skill-percentage-card' : 'template-skill-card';

  state.skills.forEach((skill, index) => {
    let percent = skill.percentage;
    if (percent === undefined) {
      percent = skill.level ? skill.level * 20 : 60;
    }

    const card = getClonedTemplate(templateId, index, { singular, percentage: percent });
    if (!card) return;

    // Asignar nombre resolviendo valores por defecto
    const nameInput = card.querySelector('input[data-field="name"]');
    if (nameInput) nameInput.value = resolveDefaultValue(skill.name || '', 'name', 'skills');

    if (showLevel && showPercentage) {
      const rangeInput = card.querySelector('.skill-input-range');
      if (rangeInput) {
        rangeInput.value = percent;
      }
    } else {
      // Configurar clases de grid y nivel de forma programática
      const inputRow = card.querySelector('.input-row');
      if (inputRow) {
        inputRow.classList.add(showLevel ? 'skill-grid-with-level' : 'skill-grid-no-level');
      }
      const levelGroup = card.querySelector('.level-group');
      if (levelGroup) {
        levelGroup.style.display = showLevel ? '' : 'none';
      }

      // Asignar nivel en select
      const select = card.querySelector('select[data-field="level"]');
      const levelLabel = card.querySelector('.level-group label');
      if (select) {
        if (levelLabel) levelLabel.textContent = 'Nivel (1 - 5)';
        select.innerHTML = `
          <option value="1">1 ★</option>
          <option value="2">2 ★★</option>
          <option value="3">3 ★★★</option>
          <option value="4">4 ★★★★</option>
          <option value="5">5 ★★★★★</option>
        `;
        select.value = skill.level || 3;
      }
    }

    container.appendChild(card);
  });
}

/* --- Personalidad / Cualidades --- */
function renderPersonalityForm() {
  const container = document.getElementById('personality-list-container');
  if (!container) return;
  container.innerHTML = '';

  const addBtnSpan = document.querySelector('[data-action="add-personality"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = 'Añadir Cualidad';
  }

  const features = getActiveTemplateFeatures();
  const list = state.personality || [];
  list.forEach((pers, index) => {
    const card = getClonedTemplate('template-personality-card', index);
    if (!card) return;

    // Configurar clases de grid y nivel de forma programática
    const inputRow = card.querySelector('.personality-grid');
    if (inputRow) {
      inputRow.classList.toggle('hide-levels', !features.personalityLevels);
    }
    const levelGroup = card.querySelector('.level-group');
    if (levelGroup) {
      levelGroup.style.display = features.personalityLevels ? '' : 'none';
    }

    // Asignar nombre
    const nameInput = card.querySelector('input[data-field="name"]');
    if (nameInput) nameInput.value = pers.name || '';

    // Asignar nivel en select
    const select = card.querySelector('select[data-field="level"]');
    if (select) {
      select.value = pers.level || 3;
    }

    container.appendChild(card);
  });
}

/* --- Habilidades Técnicas (sidebar Creativo) --- */
function renderTechSkillsForm() {
  const container = document.getElementById('tech-skills-list-container');
  if (!container) return;
  container.innerHTML = '';

  const addBtnSpan = document.querySelector('[data-action="add-tech-skill"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = 'Añadir Habilidad Técnica';
  }

  const list = state.techSkills || [];
  list.forEach((ts, index) => {
    const card = getClonedTemplate('template-tech-skill-card', index);
    if (!card) return;

    // Asignar nombre
    const nameInput = card.querySelector('input[data-field="name"]');
    if (nameInput) nameInput.value = ts.name || '';

    container.appendChild(card);
  });
}

/* --- Idiomas --- */
function renderLanguagesForm() {
  const container = document.getElementById('languages-list-container');
  if (!container) return;
  container.innerHTML = '';

  const titleText = (state.sectionTitles && state.sectionTitles.languages) || defaultData.sectionTitles.languages;
  const singular = getSingularFromPlural(titleText);

  const addBtnSpan = document.querySelector('[data-action="add-language"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = getButtonText(singular, 'languages');
  }

  const features = getActiveTemplateFeatures();
  const showPercentage = features.languageLevels;
  const templateId = showPercentage ? 'template-language-percentage-card' : 'template-language-simple-card';

  state.languages.forEach((lang, index) => {
    const card = getClonedTemplate(templateId, index, { singular, percentage: lang.percentage || 100 });
    if (!card) return;

    // Asignar nombre e idioma
    const nameInput = card.querySelector('input[data-field="name"]');
    if (nameInput) nameInput.value = lang.name || '';

    const levelInput = card.querySelector('input[data-field="level"]');
    if (levelInput) levelInput.value = lang.level || '';

    if (showPercentage) {
      const rangeInput = card.querySelector('.lang-input-range');
      if (rangeInput) {
        rangeInput.value = lang.percentage || 100;
      }
    }

    container.appendChild(card);
  });
}

/* --- Intereses y Hobbies --- */
function renderInterestsForm() {
  const container = document.getElementById('interests-grid-container');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(INTEREST_ICONS).forEach(([key, value]) => {
    const isSelected = state.interests.includes(key);
    const card = document.createElement('div');
    card.className = `interest-checkbox-card ${isSelected ? 'selected' : ''}`;
    card.setAttribute('data-interest', key);
    card.innerHTML = `
      ${value.svg}
      <span>${value.name}</span>
      <input type="checkbox" ${isSelected ? 'checked' : ''}>
    `;
    container.appendChild(card);
  });
}

/* --- Renderizado Completo del Panel Lateral --- */
function renderAllForms() {
  syncStaticInputs();
  renderProfileForm();
  renderExperienceForm();
  renderEducationForm();
  renderSkillsForm();
  renderPersonalityForm();
  renderTechSkillsForm();
  renderLanguagesForm();
  renderInterestsForm();
}

/* ==========================================================================
   CONFIGURACIÓN DE EVENT LISTENERS
   Vincula todos los eventos del panel lateral (inputs, botones, drag & drop,
   teclado, zoom, impresión y edición inline de títulos de sección).
   ========================================================================== */
function setupEventListeners() {
  // 1. Selector de Plantillas Visual (Modal con Miniaturas en Grid)
  const triggerBtn = document.getElementById('btn-template-select-trigger');
  const closeBtn = document.getElementById('btn-close-template-modal');
  const templateModal = document.getElementById('template-modal');

  if (triggerBtn) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTemplateModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeTemplateModal();
    });
  }

  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target === templateModal) {
        closeTemplateModal();
      }
    });
  }

  // 2. Cambio de Pestañas (Tabs) con auto-scroll
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Mover los tabs automáticamente para centrar el tab activo en la barra de scroll
      const container = document.querySelector('nav.editor-tabs');
      if (container) {
        const containerWidth = container.clientWidth;
        const tabOffsetLeft = tab.offsetLeft;
        const tabWidth = tab.clientWidth;
        const scrollTarget = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);
        container.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        });
      }

      const targetSectionId = tab.getAttribute('data-target');
      const sections = document.querySelectorAll('.form-section');
      sections.forEach(s => s.classList.remove('active'));

      const targetSection = document.getElementById(targetSectionId);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });

  // 3. Evento Delegado de Escritura en Inputs Estáticos (`data-bind`)
  const editorContent = document.querySelector('.editor-content');
  if (editorContent) {
    editorContent.addEventListener('input', (e) => {
      const bindPath = e.target.getAttribute('data-bind');
      if (bindPath) {
        setDeepValue(state, bindPath, e.target.value);
        updatePreview();
        saveState();
      }
    });
  }

  // 4. Delegado de Entradas Dinámicas de Párrafos de Perfil
  const profileContainer = document.getElementById('profile-paragraphs-container');
  if (profileContainer) {
    profileContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('profile-paragraph-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        state.personal.profile[idx] = e.target.value;
        updatePreview();
        saveState();
      }
    });
  }

  // 5. Delegado de Entradas Dinámicas de Experiencia Laboral
  const expContainer = document.getElementById('experience-list-container');
  if (expContainer) {
    const handleExpDateChange = (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('exp-date-start')) {
        state.experience[idx].startDate = e.target.value;
        state.experience[idx].period = formatPeriodDates(state.experience[idx].startDate, state.experience[idx].endDate, state.experience[idx].current);
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('exp-date-end')) {
        state.experience[idx].endDate = e.target.value;
        state.experience[idx].period = formatPeriodDates(state.experience[idx].startDate, state.experience[idx].endDate, state.experience[idx].current);
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('exp-date-current')) {
        state.experience[idx].current = e.target.checked;

        const endInput = expContainer.querySelector(`.exp-date-end[data-index="${idx}"]`);
        if (endInput) endInput.disabled = e.target.checked;

        state.experience[idx].period = formatPeriodDates(state.experience[idx].startDate, state.experience[idx].endDate, state.experience[idx].current);
        updatePreview();
        saveState();
      }
    };

    expContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('exp-input')) {
        const field = e.target.getAttribute('data-field');
        state.experience[idx][field] = e.target.value;
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('exp-btn-input')) {
        const field = e.target.getAttribute('data-field');
        if (!state.experience[idx].button) state.experience[idx].button = { text: 'Ver Proyecto', url: '' };
        state.experience[idx].button[field] = e.target.value;
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('exp-bullets-input')) {
        state.experience[idx].bullets = e.target.value.split('\n').filter(line => line.trim() !== '');
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('exp-date-start') || e.target.classList.contains('exp-date-end')) {
        handleExpDateChange(e);
      }
    });

    expContainer.addEventListener('change', handleExpDateChange);
  }

  // 6. Delegado de Entradas Dinámicas de Formación Académica
  const eduContainer = document.getElementById('education-list-container');
  if (eduContainer) {
    const handleEduDateChange = (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('edu-date-start')) {
        state.education[idx].startDate = e.target.value;
        state.education[idx].period = formatPeriodDates(state.education[idx].startDate, state.education[idx].endDate, state.education[idx].current);
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('edu-date-end')) {
        state.education[idx].endDate = e.target.value;
        state.education[idx].period = formatPeriodDates(state.education[idx].startDate, state.education[idx].endDate, state.education[idx].current);
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('edu-date-current')) {
        state.education[idx].current = e.target.checked;

        const endInput = eduContainer.querySelector(`.edu-date-end[data-index="${idx}"]`);
        if (endInput) endInput.disabled = e.target.checked;

        state.education[idx].period = formatPeriodDates(state.education[idx].startDate, state.education[idx].endDate, state.education[idx].current);
        updatePreview();
        saveState();
      }
    };

    eduContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('edu-input')) {
        const field = e.target.getAttribute('data-field');
        state.education[idx][field] = e.target.value;
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('edu-btn-input')) {
        const field = e.target.getAttribute('data-field');
        if (!state.education[idx].button) state.education[idx].button = { text: '', url: '' };
        state.education[idx].button[field] = e.target.value;
        updatePreview();
        saveState();
      } else if (e.target.classList.contains('edu-date-start') || e.target.classList.contains('edu-date-end')) {
        handleEduDateChange(e);
      }
    });

    eduContainer.addEventListener('change', handleEduDateChange);
  }

  // 7. Delegado de Entradas Dinámicas de Habilidades
  const skillsContainer = document.getElementById('skills-list-container');
  if (skillsContainer) {
    skillsContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('skill-input')) {
        const field = e.target.getAttribute('data-field');
        let value = e.target.value;
        if (field === 'level') value = parseInt(value);
        state.skills[idx][field] = value;
      } else if (e.target.classList.contains('skill-input-range')) {
        const val = parseInt(e.target.value);
        state.skills[idx].percentage = val;
        state.skills[idx].level = Math.max(1, Math.min(5, Math.round(val / 20)));

        const percentLabel = e.target.closest('.form-group').querySelector('.percent-label');
        if (percentLabel) percentLabel.textContent = `${val}%`;
      }

      updatePreview();
      saveState();
    });
  }

  // 7.5. Delegado de Entradas Dinámicas de Personalidad
  const personalityContainer = document.getElementById('personality-list-container');
  if (personalityContainer) {
    personalityContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('pers-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        let value = e.target.value;

        if (field === 'level') value = parseInt(value);
        if (!state.personality) state.personality = [];
        state.personality[idx][field] = value;

        updatePreview();
        saveState();
      }
    });
  }

  // 7.6. Delegado de Entradas Dinámicas de Habilidades Técnicas (Jones Sidebar)
  const techSkillsContainer = document.getElementById('tech-skills-list-container');
  if (techSkillsContainer) {
    techSkillsContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('tech-skill-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        let value = e.target.value;

        if (!state.techSkills) state.techSkills = [];
        state.techSkills[idx][field] = value;

        updatePreview();
        saveState();
      }
    });
  }

  // 8. Delegado de Entradas Dinámicas de Idiomas
  const langContainer = document.getElementById('languages-list-container');
  if (langContainer) {
    langContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));

      if (e.target.classList.contains('lang-input')) {
        const field = e.target.getAttribute('data-field');
        state.languages[idx][field] = e.target.value;
      } else if (e.target.classList.contains('lang-input-range')) {
        const val = parseInt(e.target.value);
        state.languages[idx].percentage = val;

        // Actualizar el porcentaje de texto al lado
        const percentLabel = e.target.closest('.form-group').querySelector('.percent-label');
        if (percentLabel) percentLabel.textContent = `${val}%`;

        // Ajuste en el caso de Idiomas: autocompletar texto a partir del porcentaje
        if (val <= 25) {
          state.languages[idx].level = 'Básico';
        } else if (val <= 50) {
          state.languages[idx].level = 'Intermedio';
        } else if (val <= 75) {
          state.languages[idx].level = 'Avanzado';
        } else {
          state.languages[idx].level = 'Nativo';
        }

        // Sincronizar el input de texto de nivel
        const levelInput = e.target.closest('.repeater-card').querySelector('input[data-field="level"]');
        if (levelInput) levelInput.value = state.languages[idx].level;
      }

      updatePreview();
      saveState();
    });
  }

  // 9. Delegado de Intereses (Selección de tarjetas en el grid)
  const interestsGrid = document.getElementById('interests-grid-container');
  if (interestsGrid) {
    interestsGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.interest-checkbox-card');
      if (card) {
        const key = card.getAttribute('data-interest');
        const checkbox = card.querySelector('input[type="checkbox"]');

        // Si no se hizo click directamente en el checkbox, alternar su estado
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }

        if (checkbox.checked) {
          card.classList.add('selected');
          if (!state.interests.includes(key)) {
            state.interests.push(key);
          }
        } else {
          card.classList.remove('selected');
          state.interests = state.interests.filter(item => item !== key);
        }

        updatePreview();
        saveState();
      }
    });
  }

  // 10. Delegado de Botones de Eliminar y Agregar Elementos
  document.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove');
    const addBtn = e.target.closest('.btn-add');
    const clearLinkBtn = e.target.closest('.btn-clear-link');

    if (clearLinkBtn) {
      const action = clearLinkBtn.getAttribute('data-action');
      const idx = parseInt(clearLinkBtn.getAttribute('data-index'));

      if (action === 'clear-experience-link') {
        if (state.experience[idx]) {
          state.experience[idx].button = { text: 'Ver Proyecto', url: '' };
          renderExperienceForm();
        }
      } else if (action === 'clear-education-link') {
        if (state.education[idx]) {
          state.education[idx].button = { text: 'Ver Certificado', url: '' };
          renderEducationForm();
        }
      }
      updatePreview();
      saveState();
    }

    if (removeBtn) {
      const action = removeBtn.getAttribute('data-action');
      const idx = parseInt(removeBtn.getAttribute('data-index'));

      if (action === 'remove-profile') {
        state.personal.profile.splice(idx, 1);
        renderProfileForm();
      } else if (action === 'remove-experience') {
        state.experience.splice(idx, 1);
        renderExperienceForm();
      } else if (action === 'remove-education') {
        state.education.splice(idx, 1);
        renderEducationForm();
      } else if (action === 'remove-skill') {
        state.skills.splice(idx, 1);
        renderSkillsForm();
      } else if (action === 'remove-personality') {
        if (!state.personality) state.personality = [];
        state.personality.splice(idx, 1);
        renderPersonalityForm();
      } else if (action === 'remove-tech-skill') {
        if (!state.techSkills) state.techSkills = [];
        state.techSkills.splice(idx, 1);
        renderTechSkillsForm();
      } else if (action === 'remove-language') {
        state.languages.splice(idx, 1);
        renderLanguagesForm();
      }

      updatePreview();
      saveState();
    }

    if (addBtn) {
      const action = addBtn.getAttribute('data-action');

      if (action === 'add-profile') {
        state.personal.profile.push('');
        renderProfileForm();
      } else if (action === 'add-experience') {
        state.experience.push({ title: '', company: '', period: '', startDate: '', endDate: '', current: false, bullets: [] });
        renderExperienceForm();
      } else if (action === 'add-education') {
        state.education.push({ title: '', institution: '', period: '', startDate: '', endDate: '', current: false, description: '', button: { text: 'Ver Certificado', url: '' } });
        renderEducationForm();
      } else if (action === 'add-skill') {
        state.skills.push({ name: '', level: 5 });
        renderSkillsForm();
      } else if (action === 'add-personality') {
        if (!state.personality) state.personality = [];
        state.personality.push({ name: '', level: 5 });
        renderPersonalityForm();
      } else if (action === 'add-tech-skill') {
        if (!state.techSkills) state.techSkills = [];
        state.techSkills.push({ name: '' });
        renderTechSkillsForm();
      } else if (action === 'add-language') {
        state.languages.push({ name: '', level: 'Nativo', percentage: 100 });
        renderLanguagesForm();
      }

      updatePreview();
      saveState();
    }
  });

  // 11. Control de Carga de Foto de Perfil (Disparador Integrado en el Previsualizador)
  const photoInput = document.getElementById('photo-upload-input');
  const avatarPreviewBox = document.getElementById('avatar-preview-box');

  // Redirige el clic en el contenedor de previsualización al input file oculto para abrir el selector de archivos
  if (avatarPreviewBox && photoInput) {
    avatarPreviewBox.addEventListener('click', () => {
      photoInput.click();
    });
  }

  // Escucha cambios en el input file para leer la imagen cargada y actualizar el estado
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          state.personal.photo = evt.target.result;

          const imgPreview = document.getElementById('avatar-preview-img');
          const svgPreview = document.querySelector('.avatar-preview .placeholder-svg');
          if (imgPreview && svgPreview) {
            imgPreview.src = evt.target.result;
            imgPreview.style.display = 'block';
            svgPreview.style.display = 'none';
          }
          const btnClearPhoto = document.getElementById('btn-clear-photo');
          if (btnClearPhoto) {
            const activeTmplConfig = templatesConfig ? templatesConfig.find(t => t.id === state.activeTemplate) : null;
            const allowClearPhoto = activeTmplConfig?.features?.allowClearPhoto || false;
            btnClearPhoto.style.display = allowClearPhoto ? 'inline-flex' : 'none';
          }
          updatePreview();
          saveState();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 11.2. Control de Borrado de Foto de Perfil
  const btnClearPhoto = document.getElementById('btn-clear-photo');
  if (btnClearPhoto) {
    btnClearPhoto.addEventListener('click', () => {
      state.personal.photo = '';
      if (photoInput) {
        photoInput.value = ''; // Resetear el selector de archivos
      }
      const imgPreview = document.getElementById('avatar-preview-img');
      const svgPreview = document.querySelector('.avatar-preview .placeholder-svg');
      if (imgPreview && svgPreview) {
        imgPreview.src = '';
        imgPreview.style.display = 'none';
        svgPreview.style.display = 'block';
      }
      btnClearPhoto.style.display = 'none';
      updatePreview();
      saveState();
    });
  }

  // 11.3. Selector de tipografías personalizado (custom dropdown)
  const fontSelectTrigger = document.getElementById('custom-font-select-trigger');
  const fontSelectContainer = document.getElementById('custom-font-select-container');
  if (fontSelectTrigger && fontSelectContainer) {
    fontSelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      fontSelectContainer.classList.toggle('active');
    });
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!fontSelectContainer.contains(e.target)) {
        fontSelectContainer.classList.remove('active');
      }
    });
  }

  // 11.5. Control del Selector de Formas de Foto (Círculo, Esquinas Redondeadas, Cuadrado)
  const shapeTogglesSide = document.querySelector('.avatar-shape-toggles-side');
  if (shapeTogglesSide) {
    shapeTogglesSide.addEventListener('click', (e) => {
      const btn = e.target.closest('.shape-toggle-btn');
      if (btn) {
        const shape = btn.getAttribute('data-shape');
        state.personal.photoShape = shape;

        // Sincroniza la clase active para la retroalimentación visual en los controles
        const shapeButtons = shapeTogglesSide.querySelectorAll('.shape-toggle-btn');
        shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Sincroniza la clase de máscara geométrica en la vista previa del editor
        const previewBox = document.getElementById('avatar-preview-box');
        if (previewBox) {
          previewBox.classList.remove('shape-circle', 'shape-rounded', 'shape-square');
          previewBox.classList.add(`shape-${shape}`);
        }

        updatePreview();
        saveState();
      }
    });
  }

  const prefixSelect = document.getElementById('phone-prefix-select');
  const numberInput = document.getElementById('phone-number-input');
  const fullInputHidden = document.getElementById('phone-full-input');

  const updatePhoneState = () => {
    if (prefixSelect && numberInput && fullInputHidden) {
      const fullValue = `${prefixSelect.value} ${numberInput.value.trim()}`.trim();
      fullInputHidden.value = fullValue;
      if (state.contact && state.contact[2]) {
        state.contact[2].text = fullValue;
        updatePreview();
        saveState();
      }
    }
  };

  if (prefixSelect) {
    prefixSelect.addEventListener('change', updatePhoneState);
  }
  if (numberInput) {
    numberInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      updatePhoneState();
    });
  }

  const addressInput = document.getElementById('address-input');
  const btnGeolocation = document.getElementById('btn-geolocation');
  const btnSearchAddress = document.getElementById('btn-search-address');
  const addressSuggestions = document.getElementById('address-suggestions');
  let debounceTimeout = null;

  const fetchAddressSuggestions = (query) => {
    if (!query || query.length < 3) {
      if (addressSuggestions) addressSuggestions.style.display = 'none';
      return;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'CVDinamicoApp/1.0 (julio@ejemplo.com)'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          if (addressSuggestions) addressSuggestions.style.display = 'none';
          return;
        }
        if (addressSuggestions) {
          addressSuggestions.innerHTML = '';
          data.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.display_name;
            li.addEventListener('click', () => {
              addressInput.value = item.display_name;
              addressSuggestions.style.display = 'none';
              if (state.contact && state.contact[0]) {
                state.contact[0].text = item.display_name;
                updatePreview();
                saveState();
              }
            });
            addressSuggestions.appendChild(li);
          });
          addressSuggestions.style.display = 'block';
        }
      })
      .catch(err => console.error("Error al buscar dirección:", err));
  };

  if (addressInput) {
    addressInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      const query = e.target.value;
      debounceTimeout = setTimeout(() => {
        fetchAddressSuggestions(query);
      }, 500);
    });
    document.addEventListener('click', (e) => {
      if (addressSuggestions && !addressInput.contains(e.target) && !addressSuggestions.contains(e.target)) {
        addressSuggestions.style.display = 'none';
      }
    });
    addressInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimeout);
        fetchAddressSuggestions(addressInput.value);
      }
    });
  }

  if (btnSearchAddress && addressInput) {
    btnSearchAddress.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(debounceTimeout);
      fetchAddressSuggestions(addressInput.value);
    });
  }

  if (btnGeolocation) {
    btnGeolocation.addEventListener('click', (e) => {
      e.preventDefault();
      if (navigator.geolocation) {
        btnGeolocation.disabled = true;
        btnGeolocation.style.opacity = '0.5';
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
            fetch(url, {
              headers: {
                'Accept-Language': 'es',
                'User-Agent': 'CVDinamicoApp/1.0 (julio@ejemplo.com)'
              }
            })
              .then(res => res.json())
              .then(data => {
                btnGeolocation.disabled = false;
                btnGeolocation.style.opacity = '1';
                if (data && data.display_name) {
                  if (addressInput) addressInput.value = data.display_name;
                  if (state.contact && state.contact[0]) {
                    state.contact[0].text = data.display_name;
                    updatePreview();
                    saveState();
                  }
                }
              })
              .catch(err => {
                btnGeolocation.disabled = false;
                btnGeolocation.style.opacity = '1';
                console.error("Error en reverse-geocoding Nominatim:", err);
              });
          },
          (error) => {
            btnGeolocation.disabled = false;
            btnGeolocation.style.opacity = '1';
            alert('No se pudo obtener la ubicación. Por favor, asegúrate de dar permisos de geolocalización.');
            console.error("Error de geolocalización:", error);
          },
          { timeout: 10000 }
        );
      } else {
        alert('La geolocalización no está soportada por tu navegador.');
      }
    });
  }

  // 12. Controladores de Color Pickers de Temas
  const btnResetColors = document.getElementById('btn-reset-colors');

  if (btnResetColors) {
    btnResetColors.addEventListener('click', () => {
      const activeTmpl = state.activeTemplate;
      const defaultColors = defaultData.colors[activeTmpl];
      if (defaultColors) {
        state.colors[activeTmpl] = JSON.parse(JSON.stringify(defaultColors));
        syncColorPickers();
        updatePreview();
        updateThumbnailColors();
        saveState();
      }
    });
  }

  // 13. Guardar / Importar / Exportar JSON y Modales
  const btnReset = document.getElementById('btn-reset');
  const btnExport = document.getElementById('btn-export-json');
  const btnImport = document.getElementById('btn-import-json');
  const btnPrintOnly = document.getElementById('btn-print-only');
  const modalOverlay = document.getElementById('json-modal');
  const modalCloseButtons = document.querySelectorAll('.modal-close');
  const modalSubmit = document.getElementById('btn-modal-import-submit');
  const modalTextarea = document.getElementById('json-modal-text');
  const importJsonFile = document.getElementById('import-json-file');
  const btnTriggerFileImport = document.getElementById('btn-trigger-file-import');
  const selectedFileName = document.getElementById('selected-file-name');

  // Restablecer los datos a los valores genéricos por defecto (Modal Personalizado)
  const confirmModal = document.getElementById('confirm-modal');
  const btnConfirmResetSubmit = document.getElementById('btn-confirm-reset-submit');

  if (btnReset && confirmModal) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      confirmModal.classList.add('active');
    });
  }

  if (btnConfirmResetSubmit && confirmModal) {
    btnConfirmResetSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      const currentActiveTemplate = state.activeTemplate;
      localStorage.removeItem('cv_creator_state');
      state = JSON.parse(JSON.stringify(defaultData));
      state.activeTemplate = currentActiveTemplate;
      state.personal.photoShape = getDefaultPhotoShape(state.activeTemplate);
      saveState();
      renderAllForms();
      updatePreview();
      confirmModal.classList.remove('active');
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cv-${(state.personal.name || 'personal').toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (btnImport) {
    btnImport.addEventListener('click', () => {
      if (modalOverlay) {
        modalTextarea.value = '';
        if (importJsonFile) importJsonFile.value = '';
        if (selectedFileName) selectedFileName.textContent = 'Ningún archivo seleccionado';
        modalOverlay.classList.add('active');
      }
    });
  }

  // Cerrar modal al pulsar en cualquier botón de cerrar (x o Cancelar)
  modalCloseButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Cerrar modal al pulsar fuera de la tarjeta (en el overlay)
  const allOverlays = document.querySelectorAll('.modal-overlay');
  allOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        e.preventDefault();
        overlay.classList.remove('active');
      }
    });
  });

  // Envío del área de texto
  if (modalSubmit && modalTextarea) {
    modalSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const parsed = JSON.parse(modalTextarea.value);
        if (parsed.personal && parsed.contact && parsed.experience) {
          state = parsed;
          migrateState(state);
          saveState();
          renderAllForms();
          updatePreview();
          if (modalOverlay) modalOverlay.classList.remove('active');
        } else {
          alert('Error: El formato JSON no contiene las propiedades requeridas de CV.');
        }
      } catch (err) {
        alert('Error: Formato JSON inválido. Por favor revisa el formato.');
      }
    });
  }

  // Disparador del input tipo file oculto
  if (btnTriggerFileImport && importJsonFile) {
    btnTriggerFileImport.addEventListener('click', (e) => {
      e.preventDefault();
      importJsonFile.click();
    });
  }

  // Importar archivo JSON directo
  if (importJsonFile) {
    importJsonFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (selectedFileName) selectedFileName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            if (parsed.personal && parsed.contact && parsed.experience) {
              state = parsed;
              migrateState(state);
              saveState();
              renderAllForms();
              updatePreview();
              if (modalOverlay) modalOverlay.classList.remove('active');
              importJsonFile.value = ''; // limpiar
              if (selectedFileName) selectedFileName.textContent = 'Ningún archivo seleccionado';
            } else {
              alert('Error: El formato JSON no contiene las propiedades requeridas de CV.');
              if (selectedFileName) selectedFileName.textContent = 'Ningún archivo seleccionado';
            }
          } catch (err) {
            alert('Error al leer el archivo JSON: Formato inválido.');
            if (selectedFileName) selectedFileName.textContent = 'Ningún archivo seleccionado';
          }
        };
        reader.readAsText(file);
      } else {
        if (selectedFileName) selectedFileName.textContent = 'Ningún archivo seleccionado';
      }
    });
  }

  if (btnPrintOnly) {
    btnPrintOnly.addEventListener('click', () => {
      // Guardar el título original de la página
      const originalTitle = document.title;
      
      // Crear un nombre de archivo limpio basado en el nombre del CV para que el navegador lo sugiera automáticamente al guardar como PDF
      const firstName = (state.personal.name || '').trim();
      const lastName = (state.personal.lastName || '').trim();
      const cleanName = `cv-${firstName} ${lastName}`.trim().toLowerCase().replace(/\s+/g, '-');
      document.title = cleanName || 'cv-personal';

      // Lanzar el asistente de impresión nativo de alta calidad vectorial
      window.print();
      
      // Restaurar el título original de la pestaña después de un pequeño intervalo
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    });
  }

  // 14. Controladores de Zoom Manual y Automático
  const btnZoomFit = document.getElementById('btn-zoom-fit');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const zoomRange = document.getElementById('zoom-range');
  const zoomLabel = document.getElementById('zoom-val-label');

  if (btnZoomFit) {
    btnZoomFit.addEventListener('click', () => {
      currentZoomMode = 'fit';
      btnZoomFit.classList.add('active');
      scalePreview();
    });
  }

  const setManualZoom = (newScale) => {
    currentZoomMode = 'manual';
    zoomScale = Math.max(0.3, Math.min(newScale, 1.5));
    if (btnZoomFit) btnZoomFit.classList.remove('active');
    if (zoomRange) zoomRange.value = Math.round(zoomScale * 100);
    if (zoomLabel) zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
    scalePreview();
  };

  if (zoomRange) {
    zoomRange.addEventListener('input', (e) => {
      setManualZoom(parseInt(e.target.value) / 100);
    });
  }

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      setManualZoom(zoomScale + 0.1);
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      setManualZoom(zoomScale - 0.1);
    });
  }

  // 15. Evento de Cambio de Escala en Redimensionamiento
  window.addEventListener('resize', scalePreview);

  // ResizeObserver para el panel de previsualización (más preciso)
  const previewPanel = document.getElementById('preview-panel');
  if (previewPanel && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      scalePreview();
    });
    ro.observe(previewPanel);
  }

  // 16. Control de Leyendas de Sección Editables (Soporte dinámico para títulos personalizados)
  const editableLegends = document.querySelectorAll('legend[contenteditable="true"]');
  editableLegends.forEach(legend => {
    const sectionKey = legend.getAttribute('data-section-title');
    if (!sectionKey) return;

    legend.addEventListener('input', () => {
      if (!state.sectionTitles) state.sectionTitles = {};
      state.sectionTitles[sectionKey] = legend.textContent;

      // Actualizar dinámicamente las etiquetas secundarias sin regenerar el DOM del formulario
      updateSectionLabels(sectionKey);

      // Actualizar la vista previa del CV en tiempo real
      updatePreview();
      saveState();
    });

    legend.addEventListener('blur', () => {
      const text = legend.textContent.trim();
      legend.textContent = text || defaultData.sectionTitles[sectionKey];

      if (!state.sectionTitles) state.sectionTitles = {};
      state.sectionTitles[sectionKey] = legend.textContent;

      updateSectionLabels(sectionKey);
      updatePreview();
      saveState();
    });

    legend.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        legend.blur();
      }
    });
  });
}

/* ==========================================================================
   INSTANCIACIÓN DE LA APLICACIÓN
   Punto de entrada: precarga la configuración de plantillas, carga el estado
   del localStorage, inicializa el selector, renderiza los formularios y
   arranca la vista previa del CV.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // Precargar configuración de plantillas antes de cargar el estado
  try {
    const response = await fetch('./src/templates/templates-config.json');
    templatesConfig = await response.json();
  } catch (err) {
    console.error("Error al precargar la configuración de plantillas en inicio:", err);
  }

  loadState();
  await initTemplateSelector();
  renderAllForms();
  await updatePreview();
  updateThumbnailColors();
  setupEventListeners();
});
