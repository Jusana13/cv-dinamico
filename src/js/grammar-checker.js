/* ==========================================================================
   MODULE: grammar-checker.js
   Lógica de revisión ortográfica e integración con la API de LanguageTool.
   Desarrollado de forma modular para no alterar el core de app.js.
   ========================================================================== */

import {
  state,
  updatePreview,
  renderAllForms,
  saveState,
  getSingularForSection,
  getDeepValue,
  setDeepValue
} from './app.js';

// Almacenamiento local para los errores encontrados y los textos originales analizados
let currentGrammarMatches = {};

// Escapa caracteres especiales de HTML
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Inicializa el corrector de gramática vinculando los eventos de la interfaz.
 */
export function initGrammarChecker() {
  const btnCheck = document.getElementById('btn-grammar-check');
  const modal = document.getElementById('grammar-modal');
  const btnClose = document.getElementById('btn-close-grammar-modal');
  const btnCloseFoot = document.getElementById('btn-close-grammar-modal-foot');
  const btnApplyAll = document.getElementById('btn-apply-all-grammar');

  if (btnCheck) {
    btnCheck.addEventListener('click', (e) => {
      e.preventDefault();
      startGrammarCheck();
    });
  }

  // Cerrar modal
  const closeModal = () => {
    if (modal) modal.classList.remove('active');
  };

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCloseFoot) btnCloseFoot.addEventListener('click', closeModal);
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Aplicar todas las correcciones
  if (btnApplyAll) {
    btnApplyAll.addEventListener('click', () => {
      applyAllSuggestions();
    });
  }

  // Delegación de eventos para los botones de sugerencia individual en la lista de resultados
  const resultsContainer = document.getElementById('grammar-results-container');
  if (resultsContainer) {
    resultsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-suggestion');
      if (!btn) return;

      const path = btn.getAttribute('data-path');
      const errorIdx = parseInt(btn.getAttribute('data-error-idx'), 10);
      const replacement = btn.getAttribute('data-replacement');

      applyIndividualCorrection(path, errorIdx, replacement);
    });
  }
}

/**
 * Recopila todos los textos del estado actual del CV susceptibles de corrección.
 * @returns {Array<Object>} Lista de campos a analizar con su path, label y texto.
 */
function collectCheckableFields() {
  const fields = [];

  // 1. Datos Personales
  if (state.personal) {
    if (state.personal.profession) {
      fields.push({
        path: 'personal.profession',
        label: 'Información Personal - Profesión',
        text: state.personal.profession
      });
    }
    if (state.personal.additionalInfo) {
      fields.push({
        path: 'personal.additionalInfo',
        label: 'Información Personal - Información Adicional',
        text: state.personal.additionalInfo
      });
    }
    if (Array.isArray(state.personal.profile)) {
      state.personal.profile.forEach((prof, idx) => {
        if (prof && prof.trim()) {
          fields.push({
            path: `personal.profile.${idx}`,
            label: `Perfil Profesional - Párrafo #${idx + 1}`,
            text: prof
          });
        }
      });
    }
  }

  // 2. Experiencia Laboral
  if (Array.isArray(state.experience)) {
    const singular = getSingularForSection('experience') || 'Experiencia';
    state.experience.forEach((exp, idx) => {
      const prefix = `${singular} #${idx + 1}`;
      if (exp.title && exp.title.trim()) {
        fields.push({
          path: `experience.${idx}.title`,
          label: `${prefix} - Puesto`,
          text: exp.title
        });
      }
      if (exp.company && exp.company.trim()) {
        fields.push({
          path: `experience.${idx}.company`,
          label: `${prefix} - Empresa/Institución`,
          text: exp.company
        });
      }
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet, bIdx) => {
          if (bullet && bullet.trim()) {
            fields.push({
              path: `experience.${idx}.bullets.${bIdx}`,
              label: `${prefix} - Viñeta #${bIdx + 1}`,
              text: bullet
            });
          }
        });
      }
    });
  }

  // 3. Formación Académica
  if (Array.isArray(state.education)) {
    const singular = getSingularForSection('education') || 'Estudio';
    state.education.forEach((edu, idx) => {
      const prefix = `${singular} #${idx + 1}`;
      if (edu.title && edu.title.trim()) {
        fields.push({
          path: `education.${idx}.title`,
          label: `${prefix} - Título/Estudio`,
          text: edu.title
        });
      }
      if (edu.institution && edu.institution.trim()) {
        fields.push({
          path: `education.${idx}.institution`,
          label: `${prefix} - Centro Educativo`,
          text: edu.institution
        });
      }
      if (edu.description && edu.description.trim()) {
        fields.push({
          path: `education.${idx}.description`,
          label: `${prefix} - Descripción`,
          text: edu.description
        });
      }
    });
  }

  // 4. Habilidades
  if (Array.isArray(state.skills)) {
    const singular = getSingularForSection('skills') || 'Habilidad';
    state.skills.forEach((s, idx) => {
      if (s.name && s.name.trim()) {
        fields.push({
          path: `skills.${idx}.name`,
          label: `${singular} #${idx + 1}`,
          text: s.name
        });
      }
    });
  }

  // 5. Habilidades Técnicas
  if (Array.isArray(state.techSkills)) {
    const singular = getSingularForSection('techSkills') || 'Habilidad Técnica';
    state.techSkills.forEach((ts, idx) => {
      if (ts.name && ts.name.trim()) {
        fields.push({
          path: `techSkills.${idx}.name`,
          label: `${singular} #${idx + 1}`,
          text: ts.name
        });
      }
    });
  }

  // 6. Personalidad
  if (Array.isArray(state.personality)) {
    const singular = getSingularForSection('personality') || 'Cualidad';
    state.personality.forEach((p, idx) => {
      if (p.name && p.name.trim()) {
        fields.push({
          path: `personality.${idx}.name`,
          label: `${singular} #${idx + 1}`,
          text: p.name
        });
      }
    });
  }

  return fields;
}

/**
 * Mapea las inconsistencias globales devueltas de vuelta a sus segmentos de origen.
 */
function mapMatchesToSegments(matches, segments) {
  const results = {};

  matches.forEach(match => {
    const globalOffset = match.offset;
    const length = match.length;

    // Localizar a qué segmento pertenece la desviación
    const segment = segments.find(seg => globalOffset >= seg.start && globalOffset < seg.end);
    if (segment) {
      const relativeOffset = globalOffset - segment.start;

      // Asegurar integridad de límites
      if (relativeOffset >= 0 && relativeOffset + length <= segment.text.length) {
        if (!results[segment.path]) {
          results[segment.path] = {
            path: segment.path,
            label: segment.label,
            text: segment.text,
            errors: []
          };
        }

        results[segment.path].errors.push({
          message: match.message,
          shortMessage: match.shortMessage || '',
          relativeOffset: relativeOffset,
          relativeLength: length,
          replacements: (match.replacements || []).map(r => r.value).slice(0, 5),
          ruleId: match.rule.id,
          resolved: false
        });
      }
    }
  });

  return results;
}

/**
 * Escanea y envía el texto completo a LanguageTool.
 */
async function startGrammarCheck() {
  const modal = document.getElementById('grammar-modal');
  const loading = document.getElementById('grammar-loading');
  const empty = document.getElementById('grammar-empty');
  const container = document.getElementById('grammar-results-container');
  const badge = document.getElementById('grammar-badge');
  const btnApplyAll = document.getElementById('btn-apply-all-grammar');

  if (!modal) return;

  // Abrir modal y mostrar carga
  modal.classList.add('active');
  loading.style.display = 'flex';
  empty.style.display = 'none';
  container.innerHTML = '';
  badge.style.display = 'none';
  if (btnApplyAll) btnApplyAll.style.display = 'none';

  // Recopilar textos
  const fields = collectCheckableFields();
  if (fields.length === 0) {
    loading.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  // Concatenar textos con doble salto de párrafo para evitar cruces
  let concatenatedText = '';
  const segments = [];
  fields.forEach(f => {
    if (concatenatedText.length > 0) {
      concatenatedText += '\n\n';
    }
    const start = concatenatedText.length;
    concatenatedText += f.text;
    const end = concatenatedText.length;
    segments.push({
      path: f.path,
      label: f.label,
      text: f.text,
      start: start,
      end: end
    });
  });

  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        text: concatenatedText,
        language: 'es'
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    loading.style.display = 'none';

    // Mapear los errores recibidos a sus paths originales
    const matches = data.matches || [];
    currentGrammarMatches = mapMatchesToSegments(matches, segments);

    const totalErrors = Object.values(currentGrammarMatches)
      .reduce((acc, curr) => acc + curr.errors.length, 0);

    if (totalErrors === 0) {
      empty.style.display = 'flex';
      badge.style.display = 'none';
      if (btnApplyAll) btnApplyAll.style.display = 'none';
    } else {
      badge.textContent = `${totalErrors} ${totalErrors === 1 ? 'Sugerencia' : 'Sugerencias'}`;
      badge.style.display = 'inline-block';
      if (btnApplyAll) btnApplyAll.style.display = 'block';

      renderGrammarModalContent();
    }
  } catch (error) {
    console.error("Error al revisar ortografía:", error);
    loading.style.display = 'none';
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #ef4444;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px; display: inline-block;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h4 style="color: #f8fafc; font-size: 15px; margin-bottom: 6px;">Error de Conexión</h4>
        <p style="font-size: 13px; color: #94a3b8; max-width: 320px; margin: 0 auto;">
          No se pudo conectar con el servicio de revisión de ortografía. Verifica tu conexión a internet e inténtalo nuevamente.
        </p>
      </div>
    `;
  }
}

/**
 * Renderiza el contenido actual de sugerencias en el cuerpo del modal.
 */
function renderGrammarModalContent() {
  const container = document.getElementById('grammar-results-container');
  const btnApplyAll = document.getElementById('btn-apply-all-grammar');
  const badge = document.getElementById('grammar-badge');
  const empty = document.getElementById('grammar-empty');

  if (!container) return;

  container.innerHTML = '';

  const activePaths = Object.keys(currentGrammarMatches).filter(path => {
    return currentGrammarMatches[path].errors.length > 0;
  });

  const totalUnresolved = activePaths.reduce((acc, path) => {
    return acc + currentGrammarMatches[path].errors.filter(e => !e.resolved).length;
  }, 0);

  if (totalUnresolved === 0) {
    badge.style.display = 'none';
    if (btnApplyAll) btnApplyAll.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  badge.textContent = `${totalUnresolved} ${totalUnresolved === 1 ? 'Sugerencia' : 'Sugerencias'}`;

  activePaths.forEach(path => {
    const fieldData = currentGrammarMatches[path];
    
    // Si todos los errores del card están resueltos, lo mostramos con estilo suave
    const cardHTML = renderGrammarCard(fieldData);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cardHTML.trim();
    container.appendChild(tempDiv.firstChild);
  });
}

/**
 * Genera la estructura HTML de una tarjeta de sugerencias.
 */
function renderGrammarCard(fieldData) {
  const unresolved = fieldData.errors.filter(e => !e.resolved);
  
  // Resaltado de errores en HTML de derecha a izquierda para no solapar índices
  let textHTML = escapeHTML(fieldData.text);
  const sortedUnresolved = [...unresolved].sort((a, b) => b.relativeOffset - a.relativeOffset);
  
  sortedUnresolved.forEach(err => {
    const originalText = textHTML.substr(err.relativeOffset, err.relativeLength);
    textHTML = textHTML.substring(0, err.relativeOffset) + 
               `<mark class="grammar-highlight-error">${originalText}</mark>` + 
               textHTML.substring(err.relativeOffset + err.relativeLength);
  });

  let headerRight = '';
  if (unresolved.length === 0) {
    headerRight = `<span style="color: #10b981; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M20 6 9 17l-5-5"/></svg>
      Corregido
    </span>`;
  } else {
    headerRight = `<span style="color: #ebd078; font-weight: 500;">${unresolved.length} ${unresolved.length === 1 ? 'sugerencia' : 'sugerencias'}</span>`;
  }

  const cardClass = unresolved.length === 0 ? 'grammar-result-card resolved' : 'grammar-result-card';
  const opacityStyle = unresolved.length === 0 ? 'style="opacity: 0.6;"' : '';

  let errorItemsHTML = '';
  fieldData.errors.forEach((err, idx) => {
    if (err.resolved) {
      errorItemsHTML += `
        <div class="grammar-error-item resolved" style="border-left-color: #10b981; background: rgba(16, 185, 129, 0.03);">
          <div class="grammar-error-message" style="color: #34d399; font-weight: 500;">
            ✓ Sugerencia aplicada
          </div>
        </div>`;
    } else {
      const suggestionsHTML = err.replacements.length > 0 
        ? err.replacements.map(rep => `
            <button class="btn-suggestion" data-path="${fieldData.path}" data-error-idx="${idx}" data-replacement="${rep.replace(/"/g, '&quot;')}">
              ${escapeHTML(rep)}
            </button>
          `).join('')
        : `<span style="font-size: 11px; color: #fca33d;">Sin sugerencias automáticas</span>`;

      errorItemsHTML += `
        <div class="grammar-error-item" data-rule="${err.ruleId}">
          <div class="grammar-error-info">
            <span class="grammar-error-message">${escapeHTML(err.message)}</span>
          </div>
          <div class="grammar-suggestions">
            <span class="grammar-suggestions-title">Sugerencias:</span>
            ${suggestionsHTML}
          </div>
        </div>`;
    }
  });

  return `
    <div class="${cardClass}" ${opacityStyle} data-path="${fieldData.path}">
      <div class="grammar-result-header">
        <span>${escapeHTML(fieldData.label)}</span>
        ${headerRight}
      </div>
      <div class="grammar-result-text">${textHTML.replace(/\n/g, '<br>')}</div>
      <div class="grammar-error-list">
        ${errorItemsHTML}
      </div>
    </div>
  `;
}

/**
 * Aplica una corrección individual.
 */
function applyIndividualCorrection(path, errorIdx, replacement) {
  const fieldData = currentGrammarMatches[path];
  if (!fieldData) return;

  const err = fieldData.errors[errorIdx];
  if (!err || err.resolved) return;

  const originalText = getDeepValue(state, path);
  if (typeof originalText !== 'string') return;

  // Realizar el reemplazo en el estado
  const offset = err.relativeOffset;
  const length = err.relativeLength;
  const newText = originalText.substring(0, offset) + replacement + originalText.substring(offset + length);

  setDeepValue(state, path, newText);

  // Marcar como resuelto
  err.resolved = true;

  // Actualizar la estructura local desplazando los offsets de los errores posteriores en el mismo campo
  const diff = replacement.length - length;
  fieldData.text = newText;
  fieldData.errors.forEach(otherErr => {
    if (!otherErr.resolved && otherErr.relativeOffset > offset) {
      otherErr.relativeOffset += diff;
    }
  });

  // Guardar y refrescar
  saveState();
  renderAllForms();
  updatePreview();

  // Re-renderizar modal para reflejar cambios
  renderGrammarModalContent();
}

/**
 * Aplica todas las sugerencias de manera masiva (primera opción).
 */
function applyAllSuggestions() {
  const activePaths = Object.keys(currentGrammarMatches).filter(path => {
    return currentGrammarMatches[path].errors.filter(e => !e.resolved).length > 0;
  });

  if (activePaths.length === 0) return;

  activePaths.forEach(path => {
    const fieldData = currentGrammarMatches[path];
    const unresolved = fieldData.errors.filter(e => !e.resolved);

    let text = getDeepValue(state, path);
    if (typeof text !== 'string') return;

    // Procesar de derecha a izquierda (mayor offset a menor) para evitar desajustar índices
    const sortedErrors = [...unresolved].sort((a, b) => b.relativeOffset - a.relativeOffset);

    sortedErrors.forEach(err => {
      if (err.replacements && err.replacements.length > 0) {
        const replacement = err.replacements[0];
        text = text.substring(0, err.relativeOffset) + replacement + text.substring(err.relativeOffset + err.relativeLength);
        err.resolved = true;
      }
    });

    setDeepValue(state, path, text);
  });

  // Guardar y refrescar
  saveState();
  renderAllForms();
  updatePreview();

  // Re-renderizar modal
  renderGrammarModalContent();
}
