/**
 * @file index.js
 * @description Plantilla de diseño "Rosa" para la generación de currículums.
 * Presenta una estructura llamativa de dos columnas: una columna izquierda con
 * fondo de color rosa suave (donde se ubica la experiencia y habilidades con indicadores
 * de puntos) y una columna derecha de fondo blanco con la foto, datos de contacto
 * e idiomas alineados verticalmente.
 */

import { escapeHTML, silhouetteSVG, CONTACT_ICONS, renderResource } from '../helpers.js';

/**
 * Genera el HTML para la plantilla de currículum "Rosa".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.rosa || { primary: '#fbe2e5', accent: '#f59e0b', bgLight: '#fbe2e5' };
  
  // Formato del nombre: nombre de pila y apellido en mayúsculas
  const firstName = data.personal.name || '';
  const lastName = (data.personal.lastName || '').toUpperCase();
  
  // Resumen del perfil profesional
  const profileHTML = (data.personal.profile || [])
    .map(p => `<p class="profile-text">${escapeHTML(p)}</p>`)
    .join('');

  // Lista de formación académica
  const educationHTML = (data.education || [])
    .map(edu => {
      const buttonHTML = edu.button?.url ? `
        <a href="${escapeHTML(edu.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(edu.button.text || 'Ver Certificado')}
        </a>` : '';
      return `
        <div class="item">
          <div class="item-title">
            <span class="item-company">${escapeHTML(edu.institution).toUpperCase()}</span>
            <span class="item-sep">|</span>
            <span class="item-role">${escapeHTML(edu.title)}</span>
            <span class="item-date">(${escapeHTML(edu.period)})</span>
          </div>
          <p class="item-desc">${escapeHTML(edu.description)}</p>
          ${buttonHTML}
        </div>`;
    })
    .join('');

  // Lista de experiencia laboral
  const experienceHTML = (data.experience || [])
    .map(exp => {
      const bulletsHTML = (exp.bullets || []).length > 0 ? `
        <ul class="compact-list">
          ${exp.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
        </ul>` : `<p class="item-desc">${escapeHTML(exp.description || '')}</p>`;
      
      const buttonHTML = exp.button?.url ? `
        <a href="${escapeHTML(exp.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(exp.button.text || 'Ver Proyecto')}
        </a>` : '';

      return `
        <div class="item">
          <div class="item-title">
            <span class="item-company">${escapeHTML(exp.company).toUpperCase()}</span>
            <span class="item-sep">|</span>
            <span class="item-role">${escapeHTML(exp.title)}</span>
            <span class="item-date">(${escapeHTML(exp.period)})</span>
          </div>
          ${bulletsHTML}
          ${buttonHTML}
        </div>`;
    })
    .join('');

  // Habilidades
  const skillsHTML = renderResource(data.skills, 'skills', data.resourceLayouts?.skills, colors);

  // Rasgos de personalidad
  const personalityHTML = renderResource(data.personality, 'personality', data.resourceLayouts?.personality, colors);

  // Lista de contacto en formato de Dirección, Móvil y Email
  const addressItem = data.contact.find(c => c.type === 'location')?.text || 'Ciudad, País';
  const phoneItem = data.contact.find(c => c.type === 'phone')?.text || '+34 600 000 000';
  const emailItem = data.contact.find(c => c.type === 'email')?.text || 'correo@ejemplo.com';

  // Idiomas en la columna derecha
  const languagesHTML = renderResource(data.languages, 'languages', data.resourceLayouts?.languages, colors);

  const additionalInfoText = data.personal.additionalInfo || 'Disponible para incorporación inmediata y flexibilidad horaria en proyectos dinámicos.';

  let photoHTML = '';
  const showPlaceholder = data.features?.photoPlaceholder !== false;
  if (data.personal.photo) {
    photoHTML = `<div class="photo-wrap shape-${data.personal.photoShape || 'circle'}" style="background-image: url('${escapeHTML(data.personal.photo)}'); background-size: cover; background-position: center;"></div>`;
  } else if (showPlaceholder) {
    photoHTML = `<div class="photo-wrap shape-${data.personal.photoShape || 'circle'}">${silhouetteSVG}</div>`;
  }

  return `
    <article class="cv-page rosa" style="--primary: ${colors.primary}; --accent: ${colors.accent};">
      
      <!-- Columna izquierda (Fondo rosa/color primario) -->
      <section class="left-column">
        <header class="left-header">
          <h1 class="profession-title">${escapeHTML(data.personal.profession || 'Título del puesto').toUpperCase()}</h1>
          <div class="profile-summary">
            ${profileHTML}
          </div>
        </header>
 
        <!-- Estudios / Formación -->
        <div class="section">
          <div class="section-title">
            <span class="bullet"></span>
            <h2>${escapeHTML(data.sectionTitles?.education || 'Estudios').toUpperCase()}</h2>
          </div>
          <div class="items-list">
            ${educationHTML}
          </div>
        </div>

        <!-- Experiencia laboral -->
        <div class="section">
          <div class="section-title">
            <span class="bullet"></span>
            <h2>${escapeHTML(data.sectionTitles?.experience || 'Experiencia Laboral').toUpperCase()}</h2>
          </div>
          <div class="items-list">
            ${experienceHTML}
          </div>
        </div>

        <!-- Habilidades -->
        <div class="section">
          <div class="section-title">
            <span class="bullet"></span>
            <h2>${escapeHTML(data.sectionTitles?.skills || 'Habilidades').toUpperCase()}</h2>
          </div>
          <div class="skills-list">
            ${skillsHTML}
          </div>
        </div>

        <!-- Personalidad -->
        <div class="section">
          <div class="section-title">
            <span class="bullet"></span>
            <h2>${escapeHTML(data.sectionTitles?.personality || 'Personalidad').toUpperCase()}</h2>
          </div>
          <div class="skills-list">
            ${personalityHTML}
          </div>
        </div>
      </section>

      <!-- Columna derecha (Fondo blanco) -->
      <section class="right-column">
        <!-- Línea vertical superior que va detrás de la foto -->
        <div class="top-red-line"></div>
        
        <!-- Contenedor de la foto de perfil -->
        <div class="photo-container">
          ${photoHTML}
        </div>
        
        <!-- Nombre completo -->
        <h2 class="name-title">${escapeHTML(firstName)} <span class="last-name">${escapeHTML(lastName)}</span></h2>
        
        <!-- Detalles de contacto -->
        <div class="contact-details">
          <div class="contact-row">
            <span class="contact-label">Dirección:</span>
            <span class="contact-val">${escapeHTML(addressItem)}</span>
          </div>
          <div class="contact-row">
            <span class="contact-label">Móvil:</span>
            <span class="contact-val">${escapeHTML(phoneItem)}</span>
          </div>
          <div class="contact-row">
            <span class="contact-label">Email:</span>
            <span class="contact-val">${escapeHTML(emailItem)}</span>
          </div>
        </div>

        <!-- Separador vertical decorativo -->
        <div class="middle-red-line"></div>

        <!-- Idiomas -->
        <div class="right-section">
          <div class="right-section-title">
            <span class="bullet-red"></span>
            <h2>${escapeHTML(data.sectionTitles?.languages || 'Idiomas').toUpperCase()}</h2>
          </div>
          <div class="right-section-content">
            ${languagesHTML}
          </div>
        </div>

        <!-- Información adicional -->
        <div class="right-section">
          <div class="right-section-title">
            <span class="bullet-red"></span>
            <h2>${escapeHTML(data.sectionTitles?.additional || 'Información Adicional').toUpperCase()}</h2>
          </div>
          <div class="right-section-content additional-info">
            <p>${escapeHTML(additionalInfoText)}</p>
          </div>
        </div>

        <!-- Línea vertical decorativa inferior -->
        <div class="bottom-red-line"></div>
      </section>

    </article>
  `;
}
