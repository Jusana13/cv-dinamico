/* ==========================================================================
   Motor de Renderizado y Catálogo de Moldes de Recursos para Plantillas de CV
   Este módulo expone renderResource para pintar dinámicamente
   habilidades, idiomas, personalidad y habilidades técnicas.
   ========================================================================== */

/**
 * Escapa caracteres especiales de HTML para prevenir ataques de scripting entre sitios (XSS).
 * @param {string} str - La cadena de texto original.
 * @returns {string} La cadena de texto escapada con entidades HTML.
 */
export function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Genera el marcado HTML para representar el nivel mediante estrellas rellenas y vacías.
 * @param {number} level - El nivel alcanzado (de 1 a 5).
 * @returns {string} Cadena HTML con la representación visual de estrellas.
 */
export function renderStars(level) {
  const max = 5;
  const filled = '★'.repeat(level);
  const empty = '☆'.repeat(max - level);
  return `<span class="stars">${filled}${empty}</span>`;
}

/**
 * Renderiza los puntos indicadores de nivel (1 a 5).
 * @param {number} level - Nivel de la habilidad o rasgo.
 * @returns {string} Fragmento HTML con los puntos rellenos e inacabados.
 */
export function renderDots(level) {
  const max = 5;
  let dots = '';
  for (let i = 1; i <= max; i++) {
    if (i <= level) {
      dots += '<span class="dot filled">●</span>';
    } else {
      dots += '<span class="dot empty">●</span>';
    }
  }
  return `<span class="dots dots-container">${dots}</span>`;
}

/**
 * Renderiza un recurso repetible aplicando un molde visual.
 * @param {Array} items - Elementos a renderizar.
 * @param {string} type - Sección de origen (skills, languages, personality, techSkills).
 * @param {string} layout - Molde visual elegido.
 * @param {Object} [colors] - Colores dinámicos de la plantilla.
 * @returns {string} El marcado HTML generado.
 */
export function renderResource(items, type, layout, colors = {}) {
  if (!items || !Array.isArray(items) || items.length === 0) return '';
  const primaryColor = colors.primary || 'var(--primary, #000000)';

  return items
    .filter(item => item && (item.name || '').trim())
    .map((item, idx) => {
      const name = item.name.trim();
      const level = item.level !== undefined ? parseInt(item.level) : 3;
      const percentage = item.percentage !== undefined ? parseInt(item.percentage) : (item.level ? item.level * 20 : 60);

      switch (layout) {
        case 'bullets-list':
          if (type === 'languages' && item.level) {
            return `
              <div class="bullet-item">
                <span class="list-bullet"></span>
                <span class="bullet-text"><strong>${escapeHTML(name)}:</strong> ${escapeHTML(item.level)}</span>
              </div>`;
          }
          if (type === 'personality') {
            return `<li>${escapeHTML(name)}</li>`;
          }
          return `
            <div class="bullet-item">
              <span class="list-bullet"></span>
              <span class="bullet-text">${escapeHTML(name)}</span>
            </div>`;

        case 'bullets-list-li':
          if (type === 'languages' && item.level) {
            return `<li>${escapeHTML(name)} (${escapeHTML(item.level)})</li>`;
          }
          return `<li>${escapeHTML(name)}</li>`;

        case 'pills-tags':
          if (type === 'personality') {
            return `
              <div class="personality-tag">
                <span>${escapeHTML(name)}</span>
              </div>`;
          }
          return `
            <div class="pill-tag">
              <span>${escapeHTML(name)}</span>
            </div>`;

        case 'rating-stars':
          return `
            <div class="skill-item">
              <span class="skill-name">${escapeHTML(name)}</span>
              ${renderStars(level)}
            </div>`;

        case 'rating-dots':
          return `
            <div class="skill-row">
              <span class="skill-name">${escapeHTML(name)}</span>
              ${renderDots(level)}
            </div>`;

        case 'progress-linear':
          if (type === 'languages') {
            const levelText = item.level ? ` <span class="lang-level">(${escapeHTML(item.level)})</span>` : '';
            return `
              <div class="skill-block">
                <div class="skill-info">
                  <span class="skill-name">${escapeHTML(name)}${levelText}</span>
                </div>
                <div class="progress-bg">
                  <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
              </div>`;
          }
          return `
            <div class="skill-block">
              <div class="skill-info">
                <span class="skill-name">${escapeHTML(name)}</span>
              </div>
              <div class="progress-bg">
                <div class="progress-fill" style="width: ${percentage}%;"></div>
              </div>
            </div>`;

        case 'progress-linear-percent':
          return `
            <div class="lang-item">
              <span class="lang-name">${escapeHTML(name)}</span>
              <div class="lang-bar-bg"><div class="lang-bar-fill" style="width: ${percentage}%;"></div></div>
              <span class="lang-percent">${percentage}%</span>
            </div>`;

        case 'progress-linear-text':
          return `
            <div class="lang-item">
              <div class="lang-header">
                <span class="lang-name"><strong>${escapeHTML(name)}</strong></span>
                <span class="lang-level">${escapeHTML(item.level || '')}</span>
              </div>
              <div class="lang-bar-wrap">
                <div class="lang-bar" style="width: ${percentage}%;"></div>
              </div>
            </div>`;

        case 'progress-circular-middle':
          return `
            <div class="cv-skill-ring" style="background: conic-gradient(var(--color-primary, ${primaryColor}) ${percentage}%, #e8e8e8 0);">
              <div class="cv-skill-inner">${escapeHTML(name)}</div>
            </div>`;

        case 'text-list-inline':
          if (type === 'languages' && item.level) {
            return `
              <div class="lang-row">
                <strong>${escapeHTML(name)}:</strong> ${escapeHTML(item.level)}
              </div>`;
          }
          return `
            <div class="skill-row">
              <span class="skill-name">${escapeHTML(name)}</span>
            </div>`;

        case 'text-list-inline-between':
          if (type === 'languages') {
            return `
              <div class="lang-row">
                <span>${escapeHTML(name)}</span>
                ${item.level ? `<span class="lang-level">${escapeHTML(item.level)}</span>` : ''}
              </div>`;
          }
          return `
            <div class="skill-row">
              <span class="skill-name">${escapeHTML(name)}</span>
            </div>`;

        case 'progress-circular-dash':
        case 'progress-circular-dash-br':
          {
            const strokeDasharray = 125.6;
            const offset = strokeDasharray - (percentage / 100) * strokeDasharray;
            const isBr = layout === 'progress-circular-dash-br';
            const separator = isBr ? '<br>' : ' ';
            if (type === 'languages') {
              return `
                <div class="lang-circle">
                  <svg class="circle-svg" viewBox="0 0 55 55">
                    <circle class="circle-bg" cx="27.5" cy="27.5" r="20"></circle>
                    <circle class="circle-progress" cx="27.5" cy="27.5" r="20" stroke-dasharray="${strokeDasharray}" style="stroke-dashoffset: ${offset};"></circle>
                  </svg>
                  <span class="lang-name">${escapeHTML(name)}${item.level ? `${separator}(${escapeHTML(item.level)})` : ''}</span>
                </div>`;
            }
            return `
              <div class="lang-circle">
                <svg class="circle-svg" viewBox="0 0 55 55">
                  <circle class="circle-bg" cx="27.5" cy="27.5" r="20"></circle>
                  <circle class="circle-progress" cx="27.5" cy="27.5" r="20" stroke-dasharray="${strokeDasharray}" style="stroke-dashoffset: ${offset};"></circle>
                </svg>
                <span class="lang-name">${escapeHTML(name)}</span>
              </div>`;
          }

        default:
          return `<li>${escapeHTML(name)}</li>`;
      }
    })
    .join('');
}
