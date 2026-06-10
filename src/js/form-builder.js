/**
 * @fileoverview Creador de CV Dinámico — form-builder.js
 * Módulo encargado de la generación dinámica del panel de control de formularios lateral,
 * sincronización de inputs estáticos/dinámicos, reordenamiento de pestañas según la plantilla activa,
 * controles de tipografía y selectores de color.
 */

import { INTEREST_ICONS } from './icon-library.js';
import {
  state,
  templatesConfig,
  defaultData,
  SUPPORTED_FONTS,
  saveState,
  getDeepValue,
  getActiveTemplateSupportedShapes,
  getActiveTemplateFeatures
} from './state.js';
import {
  getSectionTitle,
  getSingularForSection,
  resolveDefaultValue,
  getClonedTemplate,
  getButtonText
} from './utils.js';
import {
  updatePreview,
  injectDynamicFontCSS
} from './cv-renderer.js';

// ==========================================================================
// RENDERIZADORES DE FORMULARIOS POR SECCIÓN
// ==========================================================================

/**
 * Renderiza los párrafos de la sección Perfil Profesional.
 * @description Genera un textarea dinámico por cada párrafo guardado en el estado.
 *              Si solo hay un párrafo, elimina el botón de borrado para mantener la UI limpia.
 */
export function renderProfileForm() {
  const container = document.getElementById('profile-paragraphs-container');
  if (!container) return;
  container.innerHTML = '';

  state.personal.profile.forEach((text, index) => {
    const card = getClonedTemplate('template-profile-card', index);
    if (!card) return;

    const textarea = card.querySelector('.profile-paragraph-input');
    if (textarea) textarea.value = text;

    if (state.personal.profile.length <= 1) {
      card.querySelector('.btn-remove')?.remove();
    }

    container.appendChild(card);
  });
}

/**
 * Renderiza las tarjetas repetidoras de la sección Experiencia Laboral.
 * @description Crea campos de texto, inputs de fecha (con bloqueo dinámico si es puesto activo),
 *              área de viñetas de logros e inputs opcionales de botón/proyecto según la plantilla.
 */
export function renderExperienceForm() {
  const container = document.getElementById('experience-list-container');
  if (!container) return;
  container.innerHTML = '';

  const singular = getSingularForSection('experience');

  const addBtnSpan = document.querySelector('[data-action="add-experience"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = getButtonText(singular, 'experience');
  }

  state.experience.forEach((exp, index) => {
    const card = getClonedTemplate('template-experience-card', index, { singular });
    if (!card) return;

    const titleInput = card.querySelector('.exp-input[data-field="title"]');
    if (titleInput) titleInput.value = exp.title || '';

    const companyInput = card.querySelector('.exp-input[data-field="company"]');
    if (companyInput) companyInput.value = exp.company || '';

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

    const bulletsTextarea = card.querySelector('.exp-bullets-input');
    if (bulletsTextarea) {
      bulletsTextarea.value = (exp.bullets || []).join('\n');
    }

    const btnTextInput = card.querySelector('.exp-btn-input[data-field="text"]');
    if (btnTextInput) btnTextInput.value = exp.button?.text || 'Ver Proyecto';

    const btnUrlInput = card.querySelector('.exp-btn-input[data-field="url"]');
    if (btnUrlInput) btnUrlInput.value = exp.button?.url || '';

    container.appendChild(card);
  });
}

/**
 * Renderiza las tarjetas repetidoras de la sección Formación Académica.
 * @description Genera campos de texto para títulos, instituciones, rangos de fechas
 *              y inputs opcionales de enlace a certificados.
 */
export function renderEducationForm() {
  const container = document.getElementById('education-list-container');
  if (!container) return;
  container.innerHTML = '';

  const singular = getSingularForSection('education');

  const addBtnSpan = document.querySelector('[data-action="add-education"] span');
  if (addBtnSpan) {
    addBtnSpan.textContent = getButtonText(singular, 'education');
  }

  state.education.forEach((edu, index) => {
    const card = getClonedTemplate('template-education-card', index, { singular });
    if (!card) return;

    const titleInput = card.querySelector('.edu-input[data-field="title"]');
    if (titleInput) titleInput.value = edu.title || '';

    const instInput = card.querySelector('.edu-input[data-field="institution"]');
    if (instInput) instInput.value = edu.institution || '';

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

    const descTextarea = card.querySelector('textarea[data-field="description"]');
    if (descTextarea) descTextarea.value = edu.description || '';

    const btnTextInput = card.querySelector('.edu-btn-input[data-field="text"]');
    if (btnTextInput) btnTextInput.value = edu.button?.text || 'Ver Certificado';

    const btnUrlInput = card.querySelector('.edu-btn-input[data-field="url"]');
    if (btnUrlInput) btnUrlInput.value = edu.button?.url || '';

    container.appendChild(card);
  });
}

/**
 * Renderiza la sección Habilidades (Skills) adaptada a las características de la plantilla activa.
 * @description Alterna entre sliders deslizantes (0-100%) y menús de selección de estrellas (1-5)
 *              o texto plano basándose en la configuración de la plantilla.
 */
export function renderSkillsForm() {
  const container = document.getElementById('skills-list-container');
  if (!container) return;
  container.innerHTML = '';

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

    const nameInput = card.querySelector('input[data-field="name"]');
    if (nameInput) nameInput.value = resolveDefaultValue(skill.name || '', 'name', 'skills');

    if (showLevel && showPercentage) {
      const rangeInput = card.querySelector('.skill-input-range');
      if (rangeInput) {
        rangeInput.value = percent;
      }
    } else {
      const inputRow = card.querySelector('.input-row');
      if (inputRow) {
        inputRow.classList.add(showLevel ? 'skill-grid-with-level' : 'skill-grid-no-level');
      }
      const levelGroup = card.querySelector('.level-group');
      if (levelGroup) {
        levelGroup.style.display = showLevel ? '' : 'none';
      }

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
  updateSectionLabels('skills');
}

/**
 * Renderiza la sección de cualidades de Personalidad.
 * @description Muestra u oculta controles de estrellas según si la plantilla soporta
 *              features de visualización de rasgos de personalidad.
 */
export function renderPersonalityForm() {
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

    const inputRow = card.querySelector('.personality-grid');
    if (inputRow) {
      inputRow.classList.toggle('hide-levels', !features.personalityLevels);
    }
    const levelGroup = card.querySelector('.level-group');
    if (levelGroup) {
      levelGroup.style.display = features.personalityLevels ? '' : 'none';
    }

    const nameInput = card.querySelector('input[data-field="name"]');
    if (nameInput) nameInput.value = pers.name || '';

    const select = card.querySelector('select[data-field="level"]');
    if (select) {
      select.value = pers.level || 3;
    }

    container.appendChild(card);
  });
  updateSectionLabels('personality');
}

/**
 * Renderiza la lista de Habilidades Técnicas (especial para plantillas con columnas).
 */
export function renderTechSkillsForm() {
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

    const nameInput = card.querySelector('input[data-field="name"]');
    if (nameInput) nameInput.value = ts.name || '';

    container.appendChild(card);
  });
  updateSectionLabels('techSkills');
}

/**
 * Renderiza las tarjetas de Idiomas del panel lateral.
 * @description Carga layouts con slider de dominio de idioma o texto plano según los features.
 */
export function renderLanguagesForm() {
  const container = document.getElementById('languages-list-container');
  if (!container) return;
  container.innerHTML = '';

  const singular = getSingularForSection('languages');

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
  updateSectionLabels('languages');
}

/**
 * Renderiza las casillas de verificación e iconos de Intereses y Hobbies.
 */
export function renderInterestsForm() {
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

// ==========================================================================
// SINCRONIZACIÓN Y RE-ETIQUETADO DINÁMICO
// ==========================================================================

/**
 * Genera una etiqueta descriptiva en base al prefijo y el singular de la sección.
 * @param {string} prefix - Prefijo de la etiqueta (ej. 'Nombre', 'Nivel').
 * @param {string} singular - Término singular de la sección (ej. 'Idioma').
 * @returns {string} La etiqueta descriptiva formateada en español correcto.
 * @private
 */
function getDescriptiveLabel(prefix, singular) {
  const lowerSingular = (singular || '').trim().toLowerCase();
  if (!lowerSingular) return prefix;
  
  let article = 'de';
  if (lowerSingular === 'idioma') {
    article = 'del';
  } else if (lowerSingular === 'habilidad' || lowerSingular === 'cualidad' || lowerSingular === 'competencia' || lowerSingular === 'habilidad técnica' || lowerSingular === 'habilidad tecnica') {
    article = 'de la';
  } else {
    const isFeminine = lowerSingular.endsWith('a') || lowerSingular.endsWith('d');
    article = isFeminine ? 'de la' : 'del';
  }
  return `${prefix} ${article} ${lowerSingular}`;
}

/**
 * Actualiza los números de índice y descripciones descriptivas de un repeater.
 * @param {string} sectionKey - Clave identificadora (experiencia, habilidades, etc.).
 */
export function updateSectionLabels(sectionKey) {
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
  } else if (sectionKey === 'personality') {
    containerId = 'personality-list-container';
    addAction = 'add-personality';
  } else if (sectionKey === 'techSkills') {
    containerId = 'tech-skills-list-container';
    addAction = 'add-tech-skill';
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

        if (['skills', 'languages', 'personality', 'techSkills'].includes(sectionKey)) {
          const formGroups = card.querySelectorAll('.form-group');
          formGroups.forEach(group => {
            const label = group.querySelector('label');
            if (!label) return;

            const input = group.querySelector('input, select, textarea');
            if (input) {
              const field = input.getAttribute('data-field');
              if (field === 'name') {
                label.textContent = getDescriptiveLabel('Nombre', singular);
              } else if (field === 'level') {
                label.textContent = input.tagName === 'SELECT' ? 'Nivel (1 - 5)' : 'Nivel Texto';
              }
            }

            const rangeInput = group.querySelector('input[type="range"]');
            if (rangeInput) {
              const strong = label.querySelector('.percent-label');
              const pct = strong ? strong.textContent : '';
              const prefix = sectionKey === 'languages' ? 'Dominio' : 'Nivel';
              label.innerHTML = `${prefix}: <strong class="percent-label">${pct}</strong>`;
            }
          });
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

/**
 * Renderiza los botones de selección de forma de foto de perfil (avatar).
 */
export function renderShapeToggles() {
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

/**
 * Sincroniza los selectores de color del panel de Diseño en base al config.json de la plantilla activa.
 * @description Genera dinámicamente campos de tipo color y les asigna event listeners inline.
 */
export function syncColorPickers() {
  const activeTmpl = state.activeTemplate;
  const container = document.querySelector('.color-picker-grid');
  if (!container) return;

  const activeTemplateConfig = templatesConfig ? templatesConfig.find(t => t.id === activeTmpl) : null;
  const colorsDef = activeTemplateConfig?.colors || { primary: "Color Principal", accent: "Color de Acento" };
  
  if (!state.colors[activeTmpl]) {
    const defaultColors = defaultData.colors[activeTmpl] || { primary: '#2C2D30', accent: '#C9A227' };
    state.colors[activeTmpl] = JSON.parse(JSON.stringify(defaultColors));
  }
  const currentColors = state.colors[activeTmpl];

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
 * Sincroniza las miniaturas del selector modal con los colores personalizados por el usuario.
 */
export function updateThumbnailColors() {
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

/**
 * Sincroniza y pobla dinámicamente el selector de fuentes del panel de Diseño.
 */
export function syncFontSelector() {
  const container = document.getElementById('custom-font-select-container');
  const trigger = document.getElementById('custom-font-select-trigger');
  const selectedValue = document.getElementById('custom-font-selected-value');
  const optionsContainer = document.getElementById('custom-font-select-options');
  
  if (!container || !trigger || !selectedValue || !optionsContainer) return;

  const activeTmpl = state.activeTemplate;
  const activeTmplConfig = templatesConfig.find(t => t.id === activeTmpl);
  
  const supported = (activeTmplConfig && activeTmplConfig.supportedFonts) || SUPPORTED_FONTS;

  let currentFont = state.fonts?.[activeTmpl] || defaultData.fonts[activeTmpl] || activeTmplConfig?.defaultFont || 'Inter';
  if (!supported.includes(currentFont)) {
    currentFont = supported[0] || 'Inter';
    if (!state.fonts) state.fonts = {};
    state.fonts[activeTmpl] = currentFont;
    injectDynamicFontCSS(currentFont);
  }

  selectedValue.textContent = currentFont;
  selectedValue.style.fontFamily = `'${currentFont}', sans-serif`;

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
      
      optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
        opt.classList.toggle('selected', opt.getAttribute('data-value') === font);
      });
    });

    optionsContainer.appendChild(optionDiv);
  });
}

/**
 * Lee las variables del estado global y rellena los inputs estáticos (del tipo data-bind).
 * @description Modifica la visibilidad de los acordeones y pestañas basándose en los features.
 */
export function syncStaticInputs() {
  const inputs = document.querySelectorAll('[data-bind]');
  inputs.forEach(input => {
    const path = input.getAttribute('data-bind');
    const value = getDeepValue(state, path);
    if (value !== undefined) {
      input.value = value;
    }
  });

  const imgPreview = document.getElementById('avatar-preview-img');
  const svgPreview = document.querySelector('.avatar-preview .placeholder-svg');
  const previewBox = document.getElementById('avatar-preview-box');
  const btnClearPhoto = document.getElementById('btn-clear-photo');

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

  renderShapeToggles();

  const shapeButtons = document.querySelectorAll('.shape-toggle-btn');
  shapeButtons.forEach(btn => {
    if (btn.getAttribute('data-shape') === (state.personal.photoShape || 'circle')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Sincronizar número de teléfono dividido
  const fullPhone = getDeepValue(state, 'contact.2.text') || '';
  const prefixSelect = document.getElementById('phone-prefix-select');
  const numberInput = document.getElementById('phone-number-input');
  const fullInputHidden = document.getElementById('phone-full-input');

  if (prefixSelect && numberInput) {
    const prefixes = Array.from(prefixSelect.options).map(opt => opt.value);
    prefixes.sort((a, b) => b.length - a.length);

    let matchedPrefix = '+34';
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

  const triggerBtnText = document.getElementById('current-template-text');
  if (triggerBtnText) {
    const displayName = activeTmplConfig ? activeTmplConfig.name : 'Moderno';
    triggerBtnText.textContent = `Plantilla: ${displayName}`;
  }

  const cards = document.querySelectorAll('.template-card');
  cards.forEach(card => {
    const isAct = card.getAttribute('data-value') === state.activeTemplate;
    card.classList.toggle('active', isAct);
    const badge = card.querySelector('.template-badge');
    if (badge) {
      badge.textContent = isAct ? 'Activa' : 'Seleccionar';
    }
  });

  const features = getActiveTemplateFeatures();
  const editorPanel = document.querySelector('.editor-panel');
  if (editorPanel) {
    editorPanel.classList.toggle('hide-buttons', !features.buttons);
    editorPanel.classList.toggle('hide-education-buttons', !features.educationButtons);
    editorPanel.classList.toggle('hide-experience-buttons', !features.experienceButtons);
    editorPanel.classList.toggle('hide-skill-levels', !features.skillLevels);
  }

  // Ordenar pestañas de la UI
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
  const order = activeTmplConfig?.tabOrder || defaultOrder;
  const navTabs = document.querySelector('.editor-tabs');

  if (navTabs) {
    const tabs = Array.from(navTabs.querySelectorAll('.tab-btn'));

    order.forEach(target => {
      const tab = tabs.find(t => t.getAttribute('data-target') === target);
      if (tab) {
        tab.style.display = 'block';
        const sectionKey = target.replace('sec-', '');

        let tabTitle = '';
        if (sectionKey === 'personal') {
          tabTitle = 'Información Personal';
        } else if (sectionKey === 'design') {
          tabTitle = 'Diseño';
        } else if (sectionKey === 'tech-skills') {
          tabTitle = getSectionTitle('techSkills');
        } else {
          tabTitle = getSectionTitle(sectionKey);
        }

        if (tabTitle) {
          tab.textContent = tabTitle;
        }

        navTabs.appendChild(tab);
      }
    });

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

  if (order.includes('sec-skills')) renderSkillsForm();
  if (order.includes('sec-languages')) renderLanguagesForm();
  if (order.includes('sec-interests')) renderInterestsForm();
  if (order.includes('sec-personality')) renderPersonalityForm();
  if (order.includes('sec-tech-skills')) renderTechSkillsForm();

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

  syncColorPickers();
  updateThumbnailColors();
  syncFontSelector();
}

/**
 * Renderiza todo el panel lateral sincronizando inputs y regenerando repeaters.
 */
export function renderAllForms() {
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
