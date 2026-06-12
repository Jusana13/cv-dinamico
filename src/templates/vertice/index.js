/**
 * @file index.js
 * @description Plantilla de diseño "Vértice" para la generación de currículums.
 * Presenta una cabecera oblicua geométrica distintiva, con barra lateral para
 * foto, contacto, y habilidades/idiomas representados con anillos circulares dinámicos.
 */

import { escapeHTML, silhouetteSVG, CONTACT_ICONS, renderResource } from '../helpers.js';


/**
 * Genera el HTML para la plantilla de currículum "Vértice".
 * @param {Object} data - Datos del estado del currículum.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.vertice || { primary: '#fde484', accent: '#f5f6f8' };
  const fullName = [data.personal.name, data.personal.lastName].filter(Boolean).join(' ');

  // Photo
  const photoShape = data.personal.photoShape || 'circle';
  const photoHTML = data.personal.photo ? `
    <div class="cv-photo-wrapper">
      <div class="cv-photo shape-${photoShape}" style="background-image: url('${escapeHTML(data.personal.photo)}');"></div>
    </div>` : `
    <div class="cv-photo-wrapper">
      <div class="cv-photo shape-${photoShape}">${silhouetteSVG}</div>
    </div>`;

  // Contact
  const contactHTML = (data.contact || [])
    .filter(c => c.text && c.text.trim())
    .map(c => {
      const icon = CONTACT_ICONS[c.type] || '';
      const text = escapeHTML(c.text);
      return `
        <li>
          <div class="cv-icon">${icon}</div>
          <span>${c.href ? `<a href="${escapeHTML(c.href)}" target="_blank" rel="noopener noreferrer">${text}</a>` : text}</span>
        </li>`;
    })
    .join('');

  // Education
  const educationHTML = (data.education || [])
    .map(edu => {
      const descHTML = edu.description ? `<p class="cv-text">${escapeHTML(edu.description)}</p>` : '';
      const buttonHTML = edu.button?.url ? `
        <a href="${escapeHTML(edu.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(edu.button.text || 'Ver Certificado')}
        </a>` : '';
      return `
        <div class="cv-item item">
          <h4 class="cv-item-title item-title">${escapeHTML(edu.title).toUpperCase()}</h4>
          <p class="cv-item-subtitle item-subtitle">${escapeHTML(edu.institution)}</p>
          <p class="cv-item-date item-date">${escapeHTML(edu.period)}</p>
          ${descHTML}
          ${buttonHTML}
        </div>`;
    })
    .join('');

  // Skills
  const skillsHTML = renderResource(data.skills, 'skills', data.resourceLayouts?.skills, colors);

  // Languages
  const languagesHTML = renderResource(data.languages, 'languages', data.resourceLayouts?.languages, colors);


  // Profile
  const profileHTML = (data.personal.profile || [])
    .filter(p => p && p.trim())
    .map(p => `<p class="cv-text profile-text">${escapeHTML(p)}</p>`)
    .join('');

  // Experience
  const experienceHTML = (data.experience || [])
    .map(exp => {
      const bulletsHTML = (exp.bullets || []).length > 0 ? `
        <ul class="cv-bullet-list">
          ${exp.bullets.filter(b => b && b.trim()).map(b => `<li>${escapeHTML(b)}</li>`).join('')}
        </ul>` : '';
      const descHTML = exp.description ? `<p class="cv-text">${escapeHTML(exp.description)}</p>` : '';
      const buttonHTML = exp.button?.url ? `
        <a href="${escapeHTML(exp.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(exp.button.text || 'Ver Proyecto')}
        </a>` : '';
      return `
        <div class="cv-job item">
          <h4 class="cv-item-title item-title">${escapeHTML(exp.title).toUpperCase()}</h4>
          <p class="cv-item-subtitle item-subtitle">${escapeHTML(exp.company)}</p>
          <p class="cv-item-date item-date">${escapeHTML(exp.period)}</p>
          ${descHTML}
          ${bulletsHTML}
          ${buttonHTML}
        </div>`;
    })
    .join('');

  return `
    <div class="cv-page vertice" style="--primary: ${colors.primary}; --accent: ${colors.accent};">
      <div class="cv-header-slant">
        <h1 class="cv-name">${escapeHTML(fullName)}</h1>
        <h2 class="cv-job-title">${escapeHTML(data.personal.profession).toUpperCase()}</h2>
      </div>

      <div class="cv-sidebar">
        ${photoHTML}

        ${contactHTML ? `
        <div class="cv-section">
          <h3 class="cv-section-title">${escapeHTML(data.sectionTitles?.contact || 'Contactos')}</h3>
          <ul class="cv-contact-list">
            ${contactHTML}
          </ul>
        </div>` : ''}

        ${skillsHTML ? `
        <div class="cv-section">
          <h3 class="cv-section-title">${escapeHTML(data.sectionTitles?.skills || 'Habilidades')}</h3>
          <div class="cv-skills-grid">
            ${skillsHTML}
          </div>
        </div>` : ''}

        ${languagesHTML ? `
        <div class="cv-section">
          <h3 class="cv-section-title">${escapeHTML(data.sectionTitles?.languages || 'Idiomas')}</h3>
          <div class="cv-skills-grid">
            ${languagesHTML}
          </div>
        </div>` : ''}


      </div>

      <div class="cv-main">
        <div class="cv-content">
          ${profileHTML ? `
          <div class="cv-section">
            <h3 class="cv-section-title">${escapeHTML(data.sectionTitles?.profile || 'Perfil')}</h3>
            ${profileHTML}
          </div>` : ''}

          ${experienceHTML ? `
          <div class="cv-section">
            <h3 class="cv-section-title">${escapeHTML(data.sectionTitles?.experience || 'Experiencia Laboral')}</h3>
            ${experienceHTML}
          </div>` : ''}

          ${educationHTML ? `
          <div class="cv-section">
            <h3 class="cv-section-title">${escapeHTML(data.sectionTitles?.education || 'Educación')}</h3>
            ${educationHTML}
          </div>` : ''}
        </div>
      </div>
    </div>
  `;
}
