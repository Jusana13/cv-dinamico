/**
 * @file index.js
 * @description Plantilla de diseño "Split" para la generación de currículums.
 * Cuenta con un encabezado oscuro, una sección principal clara a la izquierda para experiencia
 * y habilidades, y elementos flotantes a la derecha para foto y educación.
 */

import { renderStars, escapeHTML, silhouetteSVG, CONTACT_ICONS, INTEREST_ICONS } from '../helpers.js';

/**
 * Genera el HTML para la plantilla de currículum "Split".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.split || { primary: '#1a1b1e', accent: '#e5dfd3', bgLight: '#ffffff' };
  
  // Separar primera palabra del nombre
  const nameParts = (data.personal.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const restName = nameParts.slice(1).join(' ');
  const lastName = data.personal.lastName || '';
  
  let nameHTML = '';
  if (firstName) {
    nameHTML = `${escapeHTML(firstName)} ${restName ? escapeHTML(restName) : ''} <br><span>${escapeHTML(lastName)}</span>`;
  } else {
    nameHTML = `<span>${escapeHTML(lastName)}</span>`;
  }

  // Párrafos del perfil profesional
  const profileHTML = (data.personal.profile || [])
    .map(p => `<p class="profile-text">${escapeHTML(p)}</p>`)
    .join('');

  // Separar los canales de contacto esenciales (teléfono, email, dirección, web)
  // de las redes sociales para renderizarlas en el pie de la tarjeta de educación flotante
  const headerContactTypes = ['phone', 'email', 'address', 'location', 'web'];

  const headerContactHTML = (data.contact || [])
    .filter(c => headerContactTypes.includes(c.type))
    .map(c => {
      const icon = CONTACT_ICONS[c.type] || '';
      const text = escapeHTML(c.text);
      if (c.href) {
        return `
          <div class="contact-item">
            <span class="contact-icon">${icon}</span>
            <span class="contact-text"><a href="${escapeHTML(c.href)}" target="_blank">${text}</a></span>
          </div>`;
      }
      return `
        <div class="contact-item">
          <span class="contact-icon">${icon}</span>
          <span class="contact-text">${text}</span>
        </div>`;
    })
    .join('');

  const socialContactHTML = (data.contact || [])
    .filter(c => !headerContactTypes.includes(c.type))
    .map(c => {
      const icon = CONTACT_ICONS[c.type] || '';
      const text = escapeHTML(c.text);
      if (c.href) {
        return `
          <a href="${escapeHTML(c.href)}" target="_blank" class="social-item" title="${escapeHTML(c.type)}">
            <span class="social-icon">${icon}</span>
            <span class="social-text">${text}</span>
          </a>`;
      }
      return `
        <span class="social-item">
          <span class="social-icon">${icon}</span>
          <span class="social-text">${text}</span>
        </span>`;
    })
    .join('');

  // Experiencia laboral (con viñetas indexadas a la izquierda y alineación limpia)
  const experienceHTML = (data.experience || [])
    .map(exp => {
      const bulletsHTML = (exp.bullets || []).length > 0 ? `
        <ul class="compact-list item-desc">
          ${exp.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
        </ul>` : (exp.description ? `<p class="item-desc">${escapeHTML(exp.description)}</p>` : '');
      const buttonHTML = exp.button?.url ? `
        <a href="${escapeHTML(exp.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(exp.button.text || 'Ver Proyecto')}
        </a>` : '';
      return `
        <div class="item">
          <div class="item-header">
            <span class="item-bullet">•</span>
            <span class="item-title">${escapeHTML(exp.title)}</span>
            ${exp.period ? `<span class="item-date">${escapeHTML(exp.period)}</span>` : ''}
          </div>
          <div class="item-content-wrapper">
            <div class="item-subtitle">${escapeHTML(exp.company)}</div>
            ${bulletsHTML}
            ${buttonHTML}
          </div>
        </div>`;
    })
    .join('');

  // Formación académica (en la tarjeta flotante oscura)
  const educationHTML = (data.education || [])
    .map(edu => {
      const buttonHTML = edu.button?.url ? `
        <a href="${escapeHTML(edu.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(edu.button.text || 'Ver Certificado')}
        </a>` : '';
      return `
        <div class="item">
          <div class="item-header">
            <span class="item-bullet">•</span>
            <span class="item-title">${escapeHTML(edu.title)}</span>
            ${edu.period ? `<span class="item-date">${escapeHTML(edu.period)}</span>` : ''}
          </div>
          <div class="item-content-wrapper">
            <div class="item-subtitle">${escapeHTML(edu.institution)}</div>
            ${edu.description ? `<p class="item-desc">${escapeHTML(edu.description)}</p>` : ''}
            ${buttonHTML}
          </div>
        </div>`;
    })
    .join('');

  // Habilidades (renderizadas como barra de progreso horizontal)
  const skillsHTML = (data.skills || [])
    .map(s => {
      const percent = s.percentage !== undefined ? s.percentage : (s.level ? s.level * 20 : 60);
      return `
        <div class="skill-block">
          <div class="skill-info">
            <span class="skill-name">${escapeHTML(s.name)}</span>
          </div>
          <div class="progress-bg">
            <div class="progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>`;
    })
    .join('');

  // Idiomas (renderizados como barra de progreso horizontal)
  const languagesHTML = (data.languages || [])
    .map(lang => {
      const percent = lang.percentage !== undefined ? lang.percentage : (lang.level ? 80 : 60);
      const levelText = lang.level ? ` <span class="lang-level">(${escapeHTML(lang.level)})</span>` : '';
      return `
        <div class="skill-block">
          <div class="skill-info">
            <span class="skill-name">${escapeHTML(lang.name)}${levelText}</span>
          </div>
          <div class="progress-bg">
            <div class="progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>`;
    })
    .join('');

  // Intereses
  const interestsHTML = (data.interests || [])
    .map(key => {
      const item = INTEREST_ICONS[key];
      if (!item) return '';
      return `
        <div class="hobby-icon" title="${escapeHTML(item.name)}">
          ${item.svg}
        </div>`;
    })
    .join('');

  // Foto de perfil flotante
  let photoHTML = '';
  const showPlaceholder = data.features?.photoPlaceholder !== false;
  if (data.personal.photo) {
    photoHTML = `<img src="${escapeHTML(data.personal.photo)}" alt="Foto de ${escapeHTML(data.personal.name || '')}">`;
  } else if (showPlaceholder) {
    photoHTML = silhouetteSVG;
  }

  return `
    <article class="cv-page split" style="--primary: ${colors.primary}; --accent: ${colors.accent}; --bg-light: ${colors.bgLight};">
      <!-- FILA SUPERIOR (OSCURA) -->
      <header class="cv-header">
        <div class="cv-col-left">
          <div class="name-box">
            <h1>${nameHTML}</h1>
            <p class="profession">${escapeHTML(data.personal.profession)}</p>
          </div>
          <div class="contact-grid">
            ${headerContactHTML}
          </div>
        </div>
        
        <div class="cv-col-right">
          <section class="section section-profile">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.profile || 'Perfil Profesional')}</h2>
            </div>
            <div class="profile-content">
              ${profileHTML}
            </div>
          </section>
        </div>
      </header>

      <!-- FILA INFERIOR (CLARA) -->
      <main class="cv-body-left">
        <!-- Experiencia laboral -->
        <section class="section section-experience">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.experience || 'Experiencia Laboral')}</h2>
          </div>
          <div class="list-wrapper">
            ${experienceHTML}
          </div>
        </section>

        <!-- Habilidades -->
        <section class="section section-skills">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.skills || 'Habilidades')}</h2>
          </div>
          <div class="skills-wrapper">
            ${skillsHTML}
          </div>
        </section>

        <!-- Idiomas -->
        ${languagesHTML ? `
        <section class="section section-languages">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.languages || 'Idiomas')}</h2>
          </div>
          <div class="langs-wrapper">
            ${languagesHTML}
          </div>
        </section>
        ` : ''}

        <!-- Intereses opcionales -->
        ${interestsHTML ? `
        <section class="section section-interests">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.interests || 'Intereses')}</h2>
          </div>
          <div class="hobby-icons">
            ${interestsHTML}
          </div>
        </section>
        ` : ''}
      </main>

      <!-- ELEMENTOS FLOTANTES (DERECHOS) -->
      <div class="cv-floating-photo shape-${data.personal.photoShape || 'square'}">
        ${photoHTML}
      </div>

      <div class="cv-floating-education">
        <section class="section section-education">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.education || 'Formación Académica')}</h2>
          </div>
          <div class="list-wrapper">
            ${educationHTML}
          </div>
        </section>
        
        ${socialContactHTML ? `
        <div class="education-social-footer">
          ${socialContactHTML}
        </div>
        ` : ''}
      </div>
    </article>
  `;
}
