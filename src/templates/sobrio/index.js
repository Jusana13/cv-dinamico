/**
 * @file index.js
 * @description Plantilla de diseño "Sobrio" para la generación de currículums.
 * Presenta una distribución formal, limpia y equilibrada: encabezado con nombre
 * centrado entre finas líneas, foto de perfil discreta y una estructura principal
 * a dos columnas (Perfil y Experiencia en la izquierda, Educación y Habilidades en la derecha)
 * seguida de un bloque inferior a tres columnas para personalidad, intereses e idiomas.
 */

import { escapeHTML, silhouetteSVG, CONTACT_ICONS, INTEREST_ICONS, renderResource } from '../helpers.js';


/**
 * Genera el HTML para la plantilla de currículum "Sobrio".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.sobrio || { primary: '#EAEAE6', accent: '#222222' };
  
  // Formato del nombre completo
  const fullname = `${data.personal.name || ''} ${data.personal.lastName || ''}`.trim();
  const nameHTML = fullname ? `<h1 class="fullname">${escapeHTML(fullname)}</h1>` : '';

  // Profesión o Cargo
  const professionHTML = data.personal.profession 
    ? `<p class="profession-subtitle">${escapeHTML(data.personal.profession)}</p>` 
    : '';

  // Foto de perfil: centrada debajo del nombre y profesión si se ha subido
  const photoHTML = data.personal.photo
    ? `<div class="photo shape-${data.personal.photoShape || 'circle'}">
         <img src="${escapeHTML(data.personal.photo)}" alt="Foto de ${escapeHTML(data.personal.name || '')}">
       </div>`
    : '';

  // Fila con la lista de información de contacto
  const contactItems = data.contact || [];
  const contactHTML = contactItems
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

  // Columna 1: Resumen de perfil y experiencia laboral
  const profileHTML = (data.personal.profile || [])
    .map(p => `<p class="profile-text">${escapeHTML(p)}</p>`)
    .join('');

  const experienceHTML = (data.experience || [])
    .map(exp => {
      const bulletsHTML = (exp.bullets || []).length > 0 ? `
        <ul class="experience-bullets">
          ${exp.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
        </ul>` : `<p class="experience-desc">${escapeHTML(exp.description || '')}</p>`;
      return `
        <div class="experience-item">
          <h3 class="item-title">${escapeHTML(exp.title)}</h3>
          <div class="item-company">${escapeHTML(exp.company)}</div>
          <div class="item-period">${escapeHTML(exp.period)}</div>
          <div class="item-body">${bulletsHTML}</div>
        </div>`;
    })
    .join('');

  // Columna 2: Formación académica y habilidades
  const educationHTML = (data.education || [])
    .map(edu => {
      return `
        <div class="education-item">
          <h3 class="item-title">${escapeHTML(edu.title)}</h3>
          <div class="item-institution">${escapeHTML(edu.institution)}</div>
          <div class="item-period">${escapeHTML(edu.period)}</div>
          <p class="item-desc">${escapeHTML(edu.description)}</p>
        </div>`;
    })
    .join('');

  const skillsHTML = renderResource(data.skills, 'skills', data.resourceLayouts?.skills, colors);

  // Parte inferior: Personalidad e intereses lado a lado
  const personalityHTML = renderResource(data.personality, 'personality', data.resourceLayouts?.personality, colors);

  const interestsHTML = (data.interests || [])
    .map(key => {
      const item = INTEREST_ICONS[key];
      if (!item) return '';
      return `<li>${escapeHTML(item.name)}</li>`;
    })
    .join('');

  // Parte inferior derecha: Idiomas
  const languagesHTML = renderResource(data.languages, 'languages', data.resourceLayouts?.languages, colors);

  return `
    <article class="cv-page sobrio" style="--bg-primary: ${colors.primary}; --accent-color: ${colors.accent};">
      <!-- Encabezado -->
      <header class="header">
        <div class="header-name-container">
          <span class="header-line"></span>
          ${nameHTML}
          <span class="header-line"></span>
        </div>
        ${professionHTML}
        
        ${photoHTML}
 
        <div class="contact-row">
          ${contactHTML}
        </div>
      </header>

      <!-- Distribución de contenido central (Dos columnas) -->
      <div class="middle-layout">
        <!-- Línea divisoria vertical absoluta -->
        <div class="vertical-line"></div>
        
        <!-- Columna izquierda: Perfil y experiencia laboral -->
        <div class="col-left">
          <section class="section profile-section">
            <h2 class="section-title">${escapeHTML(data.sectionTitles?.profile || 'PROFILE SUMMARY')}</h2>
            <div class="profile-content">
              ${profileHTML}
            </div>
          </section>
 
          <hr class="section-divider">
 
          <section class="section experience-section">
            <h2 class="section-title">${escapeHTML(data.sectionTitles?.experience || 'EXPERIENCE')}</h2>
            <div class="experience-list">
              ${experienceHTML}
            </div>
          </section>
        </div>

        <!-- Columna derecha: Formación académica y habilidades -->
        <div class="col-right">
          <section class="section education-section">
            <h2 class="section-title">${escapeHTML(data.sectionTitles?.education || 'EDUCATION')}</h2>
            <div class="education-list">
              ${educationHTML}
            </div>
          </section>
 
          <hr class="section-divider right-col-divider">
 
          <section class="section skills-section">
            <h2 class="section-title">${escapeHTML(data.sectionTitles?.skills || 'SKILLS')}</h2>
            <ul class="bullets-list">
              ${skillsHTML}
            </ul>
          </section>
        </div>
      </div>

      <!-- Distribución de la parte inferior (Personalidad, Intereses, Idiomas) -->
      <div class="bottom-layout">
        <!-- Líneas verticales absolutas -->
        <div class="vertical-line line-1"></div>
        <div class="vertical-line line-2"></div>
        
        <div class="bottom-col bottom-col-1">
          <h2 class="section-title">${escapeHTML(data.sectionTitles?.personality || 'PERSONALITY')}</h2>
          <ul class="bullets-list">
            ${personalityHTML}
          </ul>
        </div>
        <div class="bottom-col bottom-col-2">
          <h2 class="section-title">${escapeHTML(data.sectionTitles?.interests || 'INTERESTS')}</h2>
          <ul class="bullets-list">
            ${interestsHTML}
          </ul>
        </div>
        <div class="bottom-col bottom-col-3">
          <section class="section languages-section">
            <h2 class="section-title">${escapeHTML(data.sectionTitles?.languages || 'LANGUAGES')}</h2>
            <ul class="bullets-list">
              ${languagesHTML}
            </ul>
          </section>
        </div>
      </div>
    </article>
  `;
}
