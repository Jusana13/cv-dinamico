/**
 * @file index.js
 * @description Plantilla de diseño "Minimalista" para la generación de currículums.
 * Destaca por su sobriedad, el uso limpio de espacios en blanco y una estructura
 * clara a dos columnas (columna principal de contenido y barra lateral de datos adicionales).
 */

import { escapeHTML, silhouetteSVG, CONTACT_ICONS, INTEREST_ICONS, renderResource } from '../helpers.js';


/**
 * Genera el HTML para la plantilla de currículum "Minimalista".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.minimalista || { primary: '#111111', accent: '#666666' };
  
  const nameHTML = `<h1>${escapeHTML(data.personal.name || '')} <span>${escapeHTML(data.personal.lastName || '')}</span></h1>`;

  const profileHTML = (data.personal.profile || [])
    .map(p => `<p class="profile-text">${escapeHTML(p)}</p>`)
    .join('');

  const contactHTML = (data.contact || [])
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

  const educationHTML = (data.education || [])
    .map(edu => {
      const buttonHTML = edu.button?.url ? `
        <a href="${escapeHTML(edu.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(edu.button.text || 'Ver Certificado')}
        </a>` : '';
      return `
        <div class="item">
          <div class="item-header">
            <span class="item-title">${escapeHTML(edu.title)}</span>
            <span class="item-date">${escapeHTML(edu.period)}</span>
          </div>
          <div class="item-subtitle">${escapeHTML(edu.institution)}</div>
          <p class="item-desc">${escapeHTML(edu.description)}</p>
          ${buttonHTML}
        </div>`;
    })
    .join('');

  const experienceHTML = (data.experience || [])
    .map(exp => {
      const bulletsHTML = (exp.bullets || []).length > 0 ? `
        <ul class="compact-list item-desc">
          ${exp.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
        </ul>` : `<p class="item-desc">${escapeHTML(exp.description || '')}</p>`;
      const buttonHTML = exp.button?.url ? `
        <a href="${escapeHTML(exp.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(exp.button.text || 'Ver Proyecto')}
        </a>` : '';
      return `
        <div class="item">
          <div class="item-header">
            <span class="item-title">${escapeHTML(exp.title)}</span>
            <span class="item-date">${escapeHTML(exp.period)}</span>
          </div>
          <div class="item-subtitle">${escapeHTML(exp.company)}</div>
          ${bulletsHTML}
          ${buttonHTML}
        </div>`;
    })
    .join('');

  const skillsHTML = renderResource(data.skills, 'skills', data.resourceLayouts?.skills, colors);

  const languagesHTML = renderResource(data.languages, 'languages', data.resourceLayouts?.languages, colors);

  const interestsHTML = (data.interests || [])
    .map(key => {
      const item = INTEREST_ICONS[key];
      if (!item) return '';
      return `
        <div class="hobby-item">
          ${item.svg}
          <span>${escapeHTML(item.name)}</span>
        </div>`;
    })
    .join('');

  let photoHTML = '';
  const showPlaceholder = data.features?.photoPlaceholder !== false;
  if (data.personal.photo) {
    photoHTML = `<div class="photo-wrap shape-${data.personal.photoShape || 'rounded'}"><img src="${escapeHTML(data.personal.photo)}" alt="Foto de ${escapeHTML(data.personal.name || '')}"></div>`;
  } else if (showPlaceholder) {
    photoHTML = `<div class="photo-wrap shape-${data.personal.photoShape || 'rounded'}">${silhouetteSVG}</div>`;
  }

  return `
    <article class="cv-page minimalista" style="--primary: ${colors.primary}; --text-muted: ${colors.accent};">
      <header class="header">
        <div class="header-name">
          ${nameHTML}
          <p class="profession">${escapeHTML(data.personal.profession)}</p>
        </div>
        ${photoHTML}
      </header>

      <div class="content-layout">
        <div class="main-column">
          <!-- Perfil profesional -->
          <section class="section">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.profile || 'Perfil Profesional')}</h2>
            </div>
            ${profileHTML}
          </section>

          <!-- Experiencia laboral -->
          <section class="section">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.experience || 'Experiencia Laboral')}</h2>
            </div>
            ${experienceHTML}
          </section>

          <!-- Formación académica -->
          <section class="section">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.education || 'Formación Académica')}</h2>
            </div>
            ${educationHTML}
          </section>
        </div>

        <div class="side-column">
          <!-- Contacto -->
          <section class="section">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.contact || 'Contacto')}</h2>
            </div>
            <div class="contact-list">
              ${contactHTML}
            </div>
          </section>

          <!-- Habilidades -->
          <section class="section">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.skills || 'Habilidades')}</h2>
            </div>
            <div class="sidebar-list">
              ${skillsHTML}
            </div>
          </section>

          <!-- Idiomas -->
          <section class="section">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.languages || 'Idiomas')}</h2>
            </div>
            <div class="lang-grid">
              ${languagesHTML}
            </div>
          </section>

          <!-- Intereses -->
          <section class="section">
            <div class="section-title">
              <h2>${escapeHTML(data.sectionTitles?.interests || 'Intereses')}</h2>
            </div>
            <div class="hobby-list">
              ${interestsHTML}
            </div>
          </section>
        </div>
      </div>
    </article>
  `;
}
