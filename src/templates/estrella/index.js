/**
 * @file index.js
 * @description Plantilla de diseño "Estrella" para la generación de currículums.
 * Presenta una distribución clásica y elegante de dos columnas divididas por
 * líneas ornamentales con estrellas y cruces decorativas.
 */

import { escapeHTML, silhouetteSVG, renderResource } from '../helpers.js';


/**
 * Genera el HTML para la plantilla de currículum "Estrella".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.estrella || { primary: '#4D4D4B', accent: '#F8F7F4', textColor: '#5A5A58' };
  
  // Nombre completo dinámico
  const fullName = `${data.personal.name || ''} ${data.personal.lastName || ''}`.trim();

  // Foto de Perfil dinámica
  let photoHTML = '';
  const showPlaceholder = data.features?.photoPlaceholder !== false;

  if (data.personal.photo) {
    photoHTML = `
      <div class="profile-pic-container shape-${data.personal.photoShape || 'circle'}">
        <img class="profile-pic" src="${escapeHTML(data.personal.photo)}" alt="Foto de ${escapeHTML(fullName)}">
      </div>`;
  } else if (showPlaceholder) {
    photoHTML = `
      <div class="profile-pic-container shape-${data.personal.photoShape || 'circle'}">
        <div class="profile-pic-placeholder">${silhouetteSVG}</div>
      </div>`;
  }

  // Resumen / Párrafos de Perfil
  const profileHTML = (data.personal.profile || [])
    .map(p => `<p class="profile-summary">${escapeHTML(p)}</p>`)
    .join('');

  // Fila de Contacto dinámica
  const contactHTML = (data.contact || [])
    .map(c => {
      const text = escapeHTML(c.text);
      if (c.href) {
        return `<span><a href="${escapeHTML(c.href)}" target="_blank">${text}</a></span>`;
      }
      return `<span>${text}</span>`;
    })
    .join('<span class="separator">|</span>');

  // Habilidades (Lista simple con viñetas según el diseño original)
  const skillsHTML = renderResource(data.skills, 'skills', data.resourceLayouts?.skills, colors);

  const skillsBlockHTML = (data.skills || []).length > 0 ? `
    <div class="section-block">
      <h3 class="section-title">${escapeHTML(data.sectionTitles?.skills || 'SKILLS')}</h3>
      <ul class="skills-list">
        ${skillsHTML}
      </ul>
    </div>` : '';

  // Educación
  const educationHTML = (data.education || [])
    .map(edu => `
      <div class="education-item item">
        <div class="edu-role-row">
          <h4 class="edu-degree item-title">${escapeHTML(edu.title).toUpperCase()}</h4>
          <span class="edu-date item-date">${escapeHTML(edu.period)}</span>
        </div>
        <p class="edu-institution item-subtitle">${escapeHTML(edu.institution)}</p>
        <p class="edu-desc item-desc" style="margin-top: 5px;">${escapeHTML(edu.description)}</p>
      </div>
    `)
    .join('');

  const educationBlockHTML = (data.education || []).length > 0 ? `
    <div class="section-block">
      <h3 class="section-title">${escapeHTML(data.sectionTitles?.education || 'EDUCATION')}</h3>
      ${educationHTML}
    </div>` : '';

  // Personalidad
  const personalityHTML = renderResource(data.personality, 'personality', data.resourceLayouts?.personality, colors);

  const personalityBlockHTML = (data.personality || []).length > 0 ? `
    <div class="section-block">
      <h3 class="section-title">${escapeHTML(data.sectionTitles?.personality || 'PERSONALIDAD')}</h3>
      <ul class="skills-list">
        ${personalityHTML}
      </ul>
    </div>` : '';

  // Líneas divisorias de columnas
  const leftColDivider = ((data.skills || []).length > 0 && (data.personality || []).length > 0)
    ? `<div class="col-divider-line"></div>`
    : '';

  const rightColDivider = ((data.experience || []).length > 0 && (data.education || []).length > 0)
    ? `<div class="col-divider-line"></div>`
    : '';

  // Experiencia Laboral
  const experienceHTML = (data.experience || [])
    .map(exp => {
      const bulletsHTML = (exp.bullets || []).length > 0
        ? `<ul class="exp-bullets">
             ${exp.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
           </ul>`
        : `<p class="item-desc">${escapeHTML(exp.description || '')}</p>`;
      return `
        <div class="experience-item item">
          <div class="exp-role-row">
            <h4 class="exp-role item-title">${escapeHTML(exp.title).toUpperCase()}</h4>
            <span class="exp-date item-date">${escapeHTML(exp.period)}</span>
          </div>
          <p class="exp-company item-subtitle">${escapeHTML(exp.company)}</p>
          ${bulletsHTML}
        </div>
      `;
    })
    .join('');

  const experienceBlockHTML = (data.experience || []).length > 0 ? `
    <div class="section-block">
      <h3 class="section-title">${escapeHTML(data.sectionTitles?.experience || 'EXPERIENCE')}</h3>
      ${experienceHTML}
    </div>` : '';

  // Subtítulo con líneas a los lados
  const subtitleRowHTML = data.personal.profession ? `
    <div class="cv-subtitle-row">
      <div class="subtitle-line"></div>
      <h2 class="cv-subtitle">${escapeHTML(data.personal.profession).toUpperCase()}</h2>
      <div class="subtitle-line"></div>
    </div>` : '';

  return `
    <article class="cv-page estrella" style="--primary: ${colors.primary}; --accent: ${colors.accent}; --text-color: ${colors.textColor};">
      
      <!-- ENCABEZADO / HEADER -->
      <header class="cv-header">
        <h1 class="cv-name">${escapeHTML(fullName)}</h1>
        
        ${subtitleRowHTML}

        <!-- Fila de Perfil y Decoraciones Laterales -->
        <div class="profile-row">
          <!-- Decoración Izquierda (Línea + Estrella + Cruces) -->
          <div class="line-decor left-decor">
            <div class="horizontal-line"></div>
            <div class="decor-container">
              <svg class="star-svg" viewBox="-20 -20 40 40">
                <path d="M 0,-15 C 0,-5 5,0 15,0 C 5,0 0,5 0,15 C 0,5 -5,0 -15,0 C -5,0 0,-5 0,-15 Z" fill="var(--primary)" />
              </svg>
              <svg class="cross-svg cross-top" viewBox="-5 -5 10 10">
                <path d="M -2.5,-2.5 L 2.5,2.5 M 2.5,-2.5 L -2.5,2.5" stroke="var(--primary)" stroke-width="1.3" stroke-linecap="round" />
              </svg>
              <svg class="cross-svg cross-bottom" viewBox="-5 -5 10 10">
                <path d="M -2.5,-2.5 L 2.5,2.5 M 2.5,-2.5 L -2.5,2.5" stroke="var(--primary)" stroke-width="1.3" stroke-linecap="round" />
              </svg>
            </div>
          </div>

          <!-- Contenedor Foto de Perfil -->
          ${photoHTML}

          <!-- Decoración Derecha (Línea + Estrella) -->
          <div class="line-decor right-decor">
            <div class="horizontal-line"></div>
            <div class="decor-container">
              <svg class="star-svg" viewBox="-20 -20 40 40">
                <path d="M 0,-15 C 0,-5 5,0 15,0 C 5,0 0,5 0,15 C 0,5 -5,0 -15,0 C -5,0 0,-5 0,-15 Z" fill="var(--primary)" />
              </svg>
            </div>
          </div>
        </div>

        ${profileHTML}

        <div class="contact-info">
          ${contactHTML}
        </div>
      </header>

      <!-- CUERPO PRINCIPAL / BODY -->
      <main class="cv-body">
        
        <!-- Columna Izquierda: Habilidades y Personalidad -->
        <section class="body-col left-col">
          ${skillsBlockHTML}
          ${leftColDivider}
          ${personalityBlockHTML}
        </section>

        <!-- Divisor Vertical con Estrellas Decorativas -->
        <div class="vertical-divider-container">
          <div class="vertical-line"></div>

          <!-- Estrella Superior + Cruz Derecha -->
          <div class="vertical-decor decor-top">
            <svg class="star-svg" viewBox="-20 -20 40 40">
              <path d="M 0,-15 C 0,-5 5,0 15,0 C 5,0 0,5 0,15 C 0,5 -5,0 -15,0 C -5,0 0,-5 0,-15 Z" fill="var(--primary)" />
            </svg>
            <svg class="cross-svg cross-right" viewBox="-5 -5 10 10">
              <path d="M -2.5,-2.5 L 2.5,2.5 M 2.5,-2.5 L -2.5,2.5" stroke="var(--primary)" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </div>

          <!-- Estrella Inferior + Cruces -->
          <div class="vertical-decor decor-bottom">
            <svg class="star-svg" viewBox="-20 -20 40 40">
              <path d="M 0,-15 C 0,-5 5,0 15,0 C 5,0 0,5 0,15 C 0,5 -5,0 -15,0 C -5,0 0,-5 0,-15 Z" fill="var(--primary)" />
            </svg>
            <svg class="cross-svg cross-left" viewBox="-5 -5 10 10">
              <path d="M -2.5,-2.5 L 2.5,2.5 M 2.5,-2.5 L -2.5,2.5" stroke="var(--primary)" stroke-width="1.3" stroke-linecap="round" />
            </svg>
            <svg class="cross-svg cross-bottom-dot" viewBox="-5 -5 10 10">
              <path d="M -2.5,-2.5 L 2.5,2.5 M 2.5,-2.5 L -2.5,2.5" stroke="var(--primary)" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </div>
        </div>

        <!-- Columna Derecha: Experiencia Laboral y Formación -->
        <section class="body-col right-col">
          ${experienceBlockHTML}
          ${rightColDivider}
          ${educationBlockHTML}
        </section>

      </main>

    </article>
  `;
}
