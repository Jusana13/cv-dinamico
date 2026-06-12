/**
 * @file index.js
 * @description Plantilla de diseño "Sage" para la generación de currículums.
 * Presenta un diseño simétrico con una banda superior que aloja la foto de perfil
 * centrada flanqueada por datos de contacto, seguido de un bloque introductorio de
 * perfil, una distribución de tres columnas intermedias (Formación, Cualidades y
 * Habilidades/Idiomas) y una sección inferior de experiencia laboral a ancho completo.
 */

import { escapeHTML, silhouetteSVG, CONTACT_ICONS, INTEREST_ICONS, renderResource } from '../helpers.js';


/**
 * Genera el HTML para la plantilla de currículum "Sage".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.sage || { primary: '#c5ded6', accent: '#354240' };
  
  // Divide el nombre para dar estilo visual contrastado
  const nameParts = (data.personal.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const restName = nameParts.slice(1).join(' ');
  const lastName = data.personal.lastName || '';
  
  // Foto de perfil (Circular por defecto, con bordes concéntricos en CSS)
  const photoShape = data.personal.photoShape || 'circle';
  let photoWrapperHTML = '';
  const showPlaceholder = data.features?.photoPlaceholder !== false;

  if (data.personal.photo) {
    photoWrapperHTML = `
      <div class="profile-pic shape-${photoShape}">
        <img src="${escapeHTML(data.personal.photo)}" alt="Foto de ${escapeHTML(data.personal.name || '')}">
      </div>`;
  } else if (showPlaceholder) {
    photoWrapperHTML = `
      <div class="profile-pic shape-${photoShape}">
        ${silhouetteSVG}
      </div>`;
  }

  // Divide la información de contacto: los dos primeros elementos van a la izquierda, el resto a la derecha
  const contactItems = data.contact || [];
  const midPoint = 2;
  const leftContacts = contactItems.slice(0, midPoint);
  const rightContacts = contactItems.slice(midPoint);

  const leftContactHTML = leftContacts
    .map(c => {
      const icon = CONTACT_ICONS[c.type] || '';
      const text = escapeHTML(c.text);
      return `
        <div class="contact-item left">
          <span class="contact-text">${c.href ? `<a href="${escapeHTML(c.href)}" target="_blank">${text}</a>` : text}</span>
          <div class="icon-circle">${icon}</div>
          <div class="contact-line"></div>
        </div>`;
    })
    .join('');

  const rightContactHTML = rightContacts
    .map(c => {
      const icon = CONTACT_ICONS[c.type] || '';
      const text = escapeHTML(c.text);
      return `
        <div class="contact-item right">
          <div class="contact-line"></div>
          <div class="icon-circle">${icon}</div>
          <span class="contact-text">${c.href ? `<a href="${escapeHTML(c.href)}" target="_blank">${text}</a>` : text}</span>
        </div>`;
    })
    .join('');

  // Columna 1: Formación académica (Educación)
  const educationHTML = (data.education || [])
    .map(edu => {
      const buttonHTML = edu.button?.url ? `
        <a href="${escapeHTML(edu.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(edu.button.text || 'Ver Certificado')}
        </a>` : '';
      return `
        <div class="ed-block item">
          <h3 class="ed-title item-title">${escapeHTML(edu.title).toUpperCase()}</h3>
          <p class="ed-detail item-subtitle">${escapeHTML(edu.institution)}</p>
          <p class="ed-detail item-date">${escapeHTML(edu.period)}</p>
          <p class="ed-detail item-desc">${escapeHTML(edu.description)}</p>
          ${buttonHTML}
        </div>`;
    })
    .join('');

  // Columna 2: Cualidades de personalidad e intereses
  const personalityContent = renderResource(data.personality, 'personality', data.resourceLayouts?.personality, colors);
  const personalitySection = personalityContent ? `
    <ul class="expertise-list">
      ${personalityContent}
    </ul>` : '';

  const interestsHTML = (data.interests || []).length > 0 ? `
    <div class="interests-section">
      <div class="mini-header">
        <span class="mini-line"></span>
        <span class="mini-title">${escapeHTML(data.sectionTitles?.interests || 'Intereses')}</span>
        <span class="mini-line"></span>
      </div>
      <div class="interests-grid">
        ${(data.interests || []).map(key => {
          const item = INTEREST_ICONS[key];
          if (!item) return '';
          return `
            <div class="interest-icon-box" title="${escapeHTML(item.name)}">
              ${item.svg}
            </div>`;
        }).join('')}
      </div>
    </div>` : '';

  const col2HTML = `
    ${personalitySection}
    ${interestsHTML}
  `;

  // Columna 3: Habilidades e Idiomas
  const skillsHTML = renderResource(data.skills, 'skills', data.resourceLayouts?.skills, colors);

  const languagesContent = renderResource(data.languages, 'languages', data.resourceLayouts?.languages, colors);
  const languagesHTML = languagesContent ? `
    <div class="languages-section" style="margin-top: 25px;">
      <h4 class="ed-title" style="margin-bottom: 12px; font-size: 11px;">${escapeHTML(data.sectionTitles?.languages || 'Idiomas').toUpperCase()}</h4>
      ${languagesContent}
    </div>` : '';

  const col3HTML = `
    ${skillsHTML}
    ${languagesHTML}
  `;

  // Sección inferior: Experiencia laboral
  const experienceHTML = (data.experience || [])
    .map(exp => {
      const bulletsHTML = (exp.bullets || []).length > 0 ? `
        <ul class="exp-list item-desc">
          ${exp.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
        </ul>` : `<p class="exp-desc item-desc">${escapeHTML(exp.description || '')}</p>`;
        
      const locationHTML = exp.location ? `
        <span class="exp-separator">•</span>
        <span class="exp-location">${escapeHTML(exp.location)}</span>` : '';
        
      const buttonHTML = exp.button?.url ? `
        <a href="${escapeHTML(exp.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(exp.button.text || 'Ver Proyecto')}
        </a>` : '';

      return `
        <div class="exp-item item">
          <div class="exp-header-row">
            <div class="exp-header-left">
              <span class="exp-company item-subtitle">${escapeHTML(exp.company)}</span>
              ${locationHTML}
            </div>
            <div class="exp-header-right">
              <span class="exp-date item-date">${escapeHTML(exp.period)}</span>
            </div>
          </div>
          <div class="exp-body">
            <h4 class="exp-job-title item-title">${escapeHTML(exp.title)}</h4>
            ${bulletsHTML}
            ${buttonHTML}
          </div>
        </div>`;
    })
    .join('');

  // Bloque del perfil profesional principal
  const profileHTML = (data.personal.profile || [])
    .map(p => `<p class="profile-desc profile-text">${escapeHTML(p)}</p>`)
    .join('');

  const edTitle = escapeHTML(data.sectionTitles?.education || 'Educación');
  const expTitle = escapeHTML(data.sectionTitles?.personality || 'Cualidades');
  const skillTitle = escapeHTML(data.sectionTitles?.skills || 'Habilidades');
  const workExpTitle = escapeHTML(data.sectionTitles?.experience || 'Experiencia');

  return `
    <article class="cv-page sage" style="--primary: ${colors.primary}; --accent: ${colors.accent};">
      <div class="header-spacing"></div>

      <header class="top-band">
        <div class="contact-col left">
          ${leftContactHTML}
        </div>

        ${photoWrapperHTML}

        <div class="contact-col right">
          ${rightContactHTML}
        </div>
      </header>

      <section class="intro-section">
        <div class="name-wrapper">
          <div class="name-line"></div>
          <h1 class="name">
            <span class="name-first">${escapeHTML(firstName)} ${restName ? escapeHTML(restName) : ''}</span>
            <span class="name-last">${escapeHTML(lastName)}</span>
          </h1>
          <div class="name-line"></div>
        </div>
        <h2 class="job-title">${escapeHTML(data.personal.profession)}</h2>
        ${profileHTML}
      </section>

      <!-- Cabecera de las 3 columnas -->
      <div class="three-pills-container">
        <div class="three-pills-line"></div>
        <div class="three-pills-row">
          <div class="pill-col">
            <div class="pill-title">${edTitle}</div>
          </div>
          <div class="pill-col">
            <div class="pill-title">${expTitle}</div>
          </div>
          <div class="pill-col">
            <div class="pill-title">${skillTitle}</div>
          </div>
        </div>
      </div>

      <!-- Contenido de las 3 columnas -->
      <section class="three-columns">
        <div class="col">
          ${educationHTML}
        </div>
        <div class="col bordered">
          ${col2HTML}
        </div>
        <div class="col bordered">
          ${col3HTML}
        </div>
      </section>

      <!-- Sección de Experiencia Laboral -->
      <section class="experience-section">
        <div class="pill-wrapper">
          <div class="pill-line"></div>
          <div class="pill-title">${workExpTitle}</div>
          <div class="pill-line"></div>
        </div>
        <div class="exp-container">
          ${experienceHTML}
        </div>
      </section>
    </article>
  `;
}
