/**
 * @fileoverview Creador de CV Dinámico — app.js
 * Orquestador y punto de entrada central de la aplicación.
 * Gestiona la inicialización de eventos de la interfaz de usuario, vinculación de campos
 * dinámicos con el estado, geolocalización, importación/exportación JSON,
 * asistentes de impresión vectorial de PDF y controles de zoom interactivo.
 * Aplica debounce en los eventos de escritura para mejorar el rendimiento de renderizado.
 */

import { initGrammarChecker } from './grammar-checker.js';
import {
  state,
  defaultData,
  templatesConfig,
  setState,
  loadState,
  saveState,
  loadTemplatesConfig,
  getDefaultPhotoShape,
  applyTemplateDefaultOverrides,
  setDeepValue,
  getDeepValue,
  migrateState
} from './state.js';
import {
  getSingularForSection,
  formatPeriodDates,
  parsePeriodToDates,
  getButtonText
} from './utils.js';
import {
  updatePreview,
  scalePreview,
  currentZoomMode,
  zoomScale,
  setCurrentZoomMode,
  setZoomScale,
  injectDynamicFontCSS,
  hidePreviewLoader,
  showPreviewError,
  clearRendererCache
} from './cv-renderer.js';
import {
  renderAllForms,
  renderProfileForm,
  renderExperienceForm,
  renderEducationForm,
  renderSkillsForm,
  renderPersonalityForm,
  renderTechSkillsForm,
  renderLanguagesForm,
  renderInterestsForm,
  syncStaticInputs,
  syncColorPickers,
  updateThumbnailColors,
  syncFontSelector,
  updateSectionLabels
} from './form-builder.js';

// ==========================================================================
// CONTROL DE RENDIMIENTO Y RENDERIZADO SÍNCRONO
// ==========================================================================

/**
 * Ejecuta de forma inmediata el redibujado de la vista previa del CV y el guardado del estado.
 * @description Tras evaluar la experiencia de usuario, se prefiere una respuesta instantánea
 *              síncrona (tiempo real puro) al escribir en lugar del debounce.
 */
function queuePreviewAndUpdate() {
  updatePreview();
  saveState();
}

// ==========================================================================
// CONTROL DEL MODAL DE SELECCIÓN DE PLANTILLAS
// ==========================================================================

/**
 * Abre el modal de selección de plantillas suspendiendo el scroll del fondo.
 */
function openTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Cierra el modal de selección de plantillas restaurando el scroll del fondo.
 */
function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Inicializa y puebla dinámicamente el modal grid del selector de plantillas.
 * @returns {Promise<void>}
 */
async function initTemplateSelector() {
  const gridContainer = document.getElementById('template-modal-grid');
  if (!gridContainer) return;
  try {
    await loadTemplatesConfig();
    gridContainer.innerHTML = '';

    for (const tmpl of templatesConfig) {
      const cardDiv = document.createElement('div');
      cardDiv.className = `template-card ${state.activeTemplate === tmpl.id ? 'active' : ''}`;
      cardDiv.setAttribute('data-value', tmpl.id);

      let svgHtml = '';
      try {
        const svgRes = await fetch(`./src/templates/${tmpl.id}/thumbnail.svg`);
        svgHtml = svgRes.ok ? await svgRes.text() : `<div class="template-card-preview">Miniatura</div>`;
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
        closeTemplateModal();
        
        state.activeTemplate = tmpl.id;
        state.personal.photoShape = getDefaultPhotoShape(tmpl.id);
        applyTemplateDefaultOverrides(tmpl.id);
        
        clearRendererCache(); // Reiniciar caché de inyección de recursos al cambiar plantilla
        renderAllForms();
        syncColorPickers();
        await updatePreview();
        updateThumbnailColors();
        saveState();
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

// ==========================================================================
// CONFIGURACIÓN DE EVENT LISTENERS DE LA APLICACIÓN
// ==========================================================================

/**
 * Registra y gestiona todos los manejadores de eventos del editor.
 */
function setupEventListeners() {
  // 1. Selector de Plantillas Visual (Modales)
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
    closeBtn.addEventListener('click', closeTemplateModal);
  }

  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target === templateModal) {
        closeTemplateModal();
      }
    });
  }

  // 2. Cambio de Pestañas (Tabs) con auto-scroll horizontal
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

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

  // 3. Evento Delegado de Escritura en Inputs Estáticos (data-bind) - OPTIMIZADO
  const editorContent = document.querySelector('.editor-content');
  if (editorContent) {
    editorContent.addEventListener('input', (e) => {
      const bindPath = e.target.getAttribute('data-bind');
      if (bindPath) {
        setDeepValue(state, bindPath, e.target.value);
        queuePreviewAndUpdate(); // Debounce en escritura continua
      }
    });
  }

  // 4. Delegado de Entradas Dinámicas de Párrafos de Perfil - OPTIMIZADO
  const profileContainer = document.getElementById('profile-paragraphs-container');
  if (profileContainer) {
    profileContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('profile-paragraph-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        state.personal.profile[idx] = e.target.value;
        queuePreviewAndUpdate(); // Debounce en escritura continua
      }
    });
  }

  // 5. Delegado de Entradas Dinámicas de Experiencia Laboral - OPTIMIZADO
  const expContainer = document.getElementById('experience-list-container');
  if (expContainer) {
    const handleExpDateChange = (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('exp-date-start')) {
        state.experience[idx].startDate = e.target.value;
        state.experience[idx].period = formatPeriodDates(state.experience[idx].startDate, state.experience[idx].endDate, state.experience[idx].current);
        updatePreview(); // Fechas inmediatas
        saveState();
      } else if (e.target.classList.contains('exp-date-end')) {
        state.experience[idx].endDate = e.target.value;
        state.experience[idx].period = formatPeriodDates(state.experience[idx].startDate, state.experience[idx].endDate, state.experience[idx].current);
        updatePreview(); // Fechas inmediatas
        saveState();
      } else if (e.target.classList.contains('exp-date-current')) {
        state.experience[idx].current = e.target.checked;

        const endInput = expContainer.querySelector(`.exp-date-end[data-index="${idx}"]`);
        if (endInput) endInput.disabled = e.target.checked;

        state.experience[idx].period = formatPeriodDates(state.experience[idx].startDate, state.experience[idx].endDate, state.experience[idx].current);
        updatePreview(); // Checkbox inmediato
        saveState();
      }
    };

    expContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('exp-input')) {
        const field = e.target.getAttribute('data-field');
        state.experience[idx][field] = e.target.value;
        queuePreviewAndUpdate(); // Debounce en escritura
      } else if (e.target.classList.contains('exp-btn-input')) {
        const field = e.target.getAttribute('data-field');
        if (!state.experience[idx].button) state.experience[idx].button = { text: 'Ver Proyecto', url: '' };
        state.experience[idx].button[field] = e.target.value;
        queuePreviewAndUpdate(); // Debounce en escritura
      } else if (e.target.classList.contains('exp-bullets-input')) {
        state.experience[idx].bullets = e.target.value.split('\n').filter(line => line.trim() !== '');
        queuePreviewAndUpdate(); // Debounce en escritura
      } else if (e.target.classList.contains('exp-date-start') || e.target.classList.contains('exp-date-end')) {
        handleExpDateChange(e);
      }
    });

    expContainer.addEventListener('change', handleExpDateChange);
  }

  // 6. Delegado de Entradas Dinámicas de Formación Académica - OPTIMIZADO
  const eduContainer = document.getElementById('education-list-container');
  if (eduContainer) {
    const handleEduDateChange = (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('edu-date-start')) {
        state.education[idx].startDate = e.target.value;
        state.education[idx].period = formatPeriodDates(state.education[idx].startDate, state.education[idx].endDate, state.education[idx].current);
        updatePreview(); // Fechas inmediatas
        saveState();
      } else if (e.target.classList.contains('edu-date-end')) {
        state.education[idx].endDate = e.target.value;
        state.education[idx].period = formatPeriodDates(state.education[idx].startDate, state.education[idx].endDate, state.education[idx].current);
        updatePreview(); // Fechas inmediatas
        saveState();
      } else if (e.target.classList.contains('edu-date-current')) {
        state.education[idx].current = e.target.checked;

        const endInput = eduContainer.querySelector(`.edu-date-end[data-index="${idx}"]`);
        if (endInput) endInput.disabled = e.target.checked;

        state.education[idx].period = formatPeriodDates(state.education[idx].startDate, state.education[idx].endDate, state.education[idx].current);
        updatePreview(); // Checkbox inmediato
        saveState();
      }
    };

    eduContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if (isNaN(idx)) return;

      if (e.target.classList.contains('edu-input')) {
        const field = e.target.getAttribute('data-field');
        state.education[idx][field] = e.target.value;
        queuePreviewAndUpdate(); // Debounce
      } else if (e.target.classList.contains('edu-btn-input')) {
        const field = e.target.getAttribute('data-field');
        if (!state.education[idx].button) state.education[idx].button = { text: '', url: '' };
        state.education[idx].button[field] = e.target.value;
        queuePreviewAndUpdate(); // Debounce
      } else if (e.target.classList.contains('edu-date-start') || e.target.classList.contains('edu-date-end')) {
        handleEduDateChange(e);
      }
    });

    eduContainer.addEventListener('change', handleEduDateChange);
  }

  // 7. Delegado de Entradas Dinámicas de Habilidades - OPTIMIZADO
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
        queuePreviewAndUpdate(); // Debounce texto
      } else if (e.target.classList.contains('skill-input-range')) {
        const val = parseInt(e.target.value);
        state.skills[idx].percentage = val;
        state.skills[idx].level = Math.max(1, Math.min(5, Math.round(val / 20)));

        const percentLabel = e.target.closest('.form-group').querySelector('.percent-label');
        if (percentLabel) percentLabel.textContent = `${val}%`;
        queuePreviewAndUpdate(); // Debounce rango
      }
    });
  }

  // 7.5. Delegado de Entradas Dinámicas de Personalidad - OPTIMIZADO
  const personalityContainer = document.getElementById('personality-list-container');
  if (personalityContainer) {
    personalityContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      
      if (e.target.classList.contains('pers-input')) {
        const field = e.target.getAttribute('data-field');
        let value = e.target.value;

        if (field === 'level') value = parseInt(value);
        if (!state.personality) state.personality = [];
        state.personality[idx][field] = value;
        queuePreviewAndUpdate(); // Debounce
      } else if (e.target.classList.contains('pers-input-range')) {
        const val = parseInt(e.target.value);
        if (!state.personality) state.personality = [];
        state.personality[idx].percentage = val;

        const percentLabel = e.target.closest('.form-group').querySelector('.percent-label');
        if (percentLabel) percentLabel.textContent = `${val}%`;

        queuePreviewAndUpdate(true); // Actualización instantánea para barras interactivas
      }
    });
  }

  // 7.6. Delegado de Habilidades Técnicas - OPTIMIZADO
  const techSkillsContainer = document.getElementById('tech-skills-list-container');
  if (techSkillsContainer) {
    techSkillsContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('tech-skill-input')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        let value = e.target.value;

        if (!state.techSkills) state.techSkills = [];
        state.techSkills[idx][field] = value;
        queuePreviewAndUpdate(); // Debounce
      }
    });
  }

  // 8. Delegado de Entradas Dinámicas de Idiomas - OPTIMIZADO
  const langContainer = document.getElementById('languages-list-container');
  if (langContainer) {
    langContainer.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));

      if (e.target.classList.contains('lang-input')) {
        const field = e.target.getAttribute('data-field');
        state.languages[idx][field] = e.target.value;
        queuePreviewAndUpdate(); // Debounce texto
      } else if (e.target.classList.contains('lang-input-range')) {
        const val = parseInt(e.target.value);
        state.languages[idx].percentage = val;

        const percentLabel = e.target.closest('.form-group').querySelector('.percent-label');
        if (percentLabel) percentLabel.textContent = `${val}%`;

        if (val <= 25) {
          state.languages[idx].level = 'Básico';
        } else if (val <= 50) {
          state.languages[idx].level = 'Intermedio';
        } else if (val <= 75) {
          state.languages[idx].level = 'Avanzado';
        } else {
          state.languages[idx].level = 'Nativo';
        }

        const levelInput = e.target.closest('.repeater-card').querySelector('input[data-field="level"]');
        if (levelInput) levelInput.value = state.languages[idx].level;
        queuePreviewAndUpdate(); // Debounce rango
      }
    });
  }

  // 9. Delegado de Intereses (Grid de iconos de UI)
  const interestsGrid = document.getElementById('interests-grid-container');
  if (interestsGrid) {
    interestsGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.interest-checkbox-card');
      if (card) {
        const key = card.getAttribute('data-interest');
        const checkbox = card.querySelector('input[type="checkbox"]');

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

        updatePreview(); // Intereses inmediatos
        saveState();
      }
    });
  }

  // 10. Delegado de Botones Globales (Agregar, Eliminar y Limpiar Enlaces)
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

  // 11. Carga de Foto de Perfil
  const photoInput = document.getElementById('photo-upload-input');
  const avatarPreviewBox = document.getElementById('avatar-preview-box');

  if (avatarPreviewBox && photoInput) {
    avatarPreviewBox.addEventListener('click', () => {
      photoInput.click();
    });
  }

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

  // 11.2. Borrado de Foto de Perfil
  const btnClearPhoto = document.getElementById('btn-clear-photo');
  if (btnClearPhoto) {
    btnClearPhoto.addEventListener('click', () => {
      state.personal.photo = '';
      if (photoInput) {
        photoInput.value = '';
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

  // 11.3. Dropdown personalizado de tipografías
  const fontSelectTrigger = document.getElementById('custom-font-select-trigger');
  const fontSelectContainer = document.getElementById('custom-font-select-container');
  if (fontSelectTrigger && fontSelectContainer) {
    fontSelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      fontSelectContainer.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!fontSelectContainer.contains(e.target)) {
        fontSelectContainer.classList.remove('active');
      }
    });
  }

  // 11.5. Cambios en la Forma del Avatar
  const shapeTogglesSide = document.querySelector('.avatar-shape-toggles-side');
  if (shapeTogglesSide) {
    shapeTogglesSide.addEventListener('click', (e) => {
      const btn = e.target.closest('.shape-toggle-btn');
      if (btn) {
        const shape = btn.getAttribute('data-shape');
        state.personal.photoShape = shape;

        const shapeButtons = shapeTogglesSide.querySelectorAll('.shape-toggle-btn');
        shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

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

  // 11.8. Control del Teléfono Dividido
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

  // 11.9. Sugerencias de Dirección Nominatim (OpenStreetMap) con su propio debounce
  const addressInput = document.getElementById('address-input');
  const btnGeolocation = document.getElementById('btn-geolocation');
  const btnSearchAddress = document.getElementById('btn-search-address');
  const addressSuggestions = document.getElementById('address-suggestions');
  let nominationsDebounce = null;

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
      clearTimeout(nominationsDebounce);
      const query = e.target.value;
      nominationsDebounce = setTimeout(() => {
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
        clearTimeout(nominationsDebounce);
        fetchAddressSuggestions(addressInput.value);
      }
    });
  }

  if (btnSearchAddress && addressInput) {
    btnSearchAddress.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(nominationsDebounce);
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
            alert('No se pudo obtener la ubicación. Por favor, asegura dar permisos de geolocalización.');
            console.error("Error de geolocalización:", error);
          },
          { timeout: 10000 }
        );
      } else {
        alert('La geolocalización no está soportada por tu navegador.');
      }
    });
  }

  // 12. Restaurar Colores Predeterminados de la Plantilla
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

  // 13. Modales y Persistencia (Restablecer, Importar y Exportar JSON)
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
      
      loadState(); // Recarga los datos de fábrica locales
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

  modalCloseButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  const allOverlays = document.querySelectorAll('.modal-overlay');
  allOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        e.preventDefault();
        overlay.classList.remove('active');
      }
    });
  });

  if (modalSubmit && modalTextarea) {
    modalSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const parsed = JSON.parse(modalTextarea.value);
        if (parsed.personal && parsed.contact && parsed.experience) {
          setState(parsed);
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

  if (btnTriggerFileImport && importJsonFile) {
    btnTriggerFileImport.addEventListener('click', (e) => {
      e.preventDefault();
      importJsonFile.click();
    });
  }

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
              setState(parsed);
              migrateState(state);
              saveState();
              renderAllForms();
              updatePreview();
              if (modalOverlay) modalOverlay.classList.remove('active');
              importJsonFile.value = '';
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
      const originalTitle = document.title;
      
      const firstName = (state.personal.name || '').trim();
      const lastName = (state.personal.lastName || '').trim();
      const cleanName = `cv-${firstName} ${lastName}`.trim().toLowerCase().replace(/\s+/g, '-');
      document.title = cleanName || 'cv-personal';

      window.print();
      
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
      setCurrentZoomMode('fit');
      btnZoomFit.classList.add('active');
      scalePreview();
    });
  }

  const setManualZoom = (newScale) => {
    setCurrentZoomMode('manual');
    setZoomScale(Math.max(0.3, Math.min(newScale, 1.5)));
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

  // 15. Redimensionamiento
  window.addEventListener('resize', scalePreview);

  const previewPanel = document.getElementById('preview-panel');
  if (previewPanel && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      scalePreview();
    });
    ro.observe(previewPanel);
  }

  // 16. Control de Leyendas de Sección Editables
  const editableLegends = document.querySelectorAll('legend[contenteditable="true"]');
  editableLegends.forEach(legend => {
    const sectionKey = legend.getAttribute('data-section-title');
    if (!sectionKey) return;

    legend.addEventListener('input', () => {
      if (!state.sectionTitles) state.sectionTitles = {};
      state.sectionTitles[sectionKey] = legend.textContent;

      updateSectionLabels(sectionKey);
      queuePreviewAndUpdate(); // Debounce al renombrar
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

// ==========================================================================
// INSTANCIACIÓN DE LA APLICACIÓN
// ==========================================================================

async function initializeApplication() {
  await loadTemplatesConfig();
  loadState();
  await initTemplateSelector();
  renderAllForms();
  await updatePreview();
  updateThumbnailColors();
  setupEventListeners();
  initGrammarChecker();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeApplication();
  } catch (error) {
    console.error('Error durante la inicialización de la aplicación:', error);
    showPreviewError(
      'No se pudo completar el arranque del editor.',
      'Revisa la consola para identificar el módulo o configuración que falló.'
    );
    hidePreviewLoader(false);
  }
});

export {
  state,
  updatePreview,
  renderAllForms,
  saveState,
  getSingularForSection,
  getDeepValue,
  setDeepValue
};
