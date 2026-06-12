/**
 * @file index.js
 * @description Plantilla de diseño "Moderno" para la generación de currículums.
 * Presenta una estructura de dos columnas con un encabezado oscuro de ancho completo,
 * una columna principal a la izquierda para la información de trayectoria y una
 * barra lateral derecha oscura para datos complementarios e idiomas en círculos de progreso.
 */

import { escapeHTML, silhouetteSVG, CONTACT_ICONS, INTEREST_ICONS, renderResource } from '../helpers.js';


/**
 * Genera el HTML para la plantilla de currículum "Moderno".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.moderno || { primary: '#2C2D30', accent: '#C9A227', bgLight: '#F3EFE6' };
  
  // Formato del nombre: separa la primera palabra del resto para aplicar el estilo visual (destacado en negrita/color)
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
    .map(p => `<div class="profile-text">${escapeHTML(p)}</div>`)
    .join('');

  // Lista de información de contacto
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

  // Lista de formación académica (con botón opcional de certificado)
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

  // Lista de experiencia laboral
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

  // Habilidades
  const skillsHTML = renderResource(data.skills, 'skills', data.resourceLayouts?.skills, colors);

  // Idiomas (con progreso en círculo SVG)
  const languagesHTML = renderResource(data.languages, 'languages', data.resourceLayouts?.languages, colors);

  // Intereses y hobbies
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

  let photoHTML = '';
  const showPlaceholder = data.features?.photoPlaceholder !== false;
  if (data.personal.photo) {
    photoHTML = `<div class="photo-wrap shape-${data.personal.photoShape || 'circle'}"><img src="${escapeHTML(data.personal.photo)}" alt="Foto de ${escapeHTML(data.personal.name || '')}"></div>`;
  } else if (showPlaceholder) {
    photoHTML = `<div class="photo-wrap shape-${data.personal.photoShape || 'circle'}">${silhouetteSVG}</div>`;
  }

  return `
    <article class="cv-page moderno" style="--primary: ${colors.primary}; --accent: ${colors.accent}; --bg-light: ${colors.bgLight};">
      <header class="header">
        <div class="header-content">
          <h1>${nameHTML}</h1>
          <p class="profession">${escapeHTML(data.personal.profession)}</p>
        </div>
        ${photoHTML}
      </header>

      <main class="main-content">
        <!-- Perfil profesional -->
        <section class="section">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.profile || 'Perfil Profesional')}</h2>
          </div>
          ${profileHTML}
        </section>

        <!-- Formación académica -->
        <section class="section">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.education || 'Formación Académica')}</h2>
          </div>
          ${educationHTML}
        </section>

        <!-- Experiencia laboral -->
        <section class="section">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.experience || 'Experiencia Laboral')}</h2>
          </div>
          ${experienceHTML}
        </section>
      </main>

      <aside class="sidebar">
        <!-- Contacto -->
        <section class="section">
          <div class="section-title">
            <h2>${escapeHTML(data.sectionTitles?.contact || 'Contacto')}</h2>
          </div>
          <div class="contact-grid">
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
          <div class="hobby-icons">
            ${interestsHTML}
          </div>
        </section>
      </aside>
    </article>
  `;
}
