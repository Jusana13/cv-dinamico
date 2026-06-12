/**
 * @file index.js
 * @description Plantilla de diseño "Frame" para la generación de currículums.
 * Presenta una estructura con un marco lineal elegante, columna izquierda para
 * datos personales, contacto, idiomas y educación, y columna derecha para el perfil
 * profesional y trayectoria laboral.
 */

import { escapeHTML, silhouetteSVG, CONTACT_ICONS, renderResource } from '../helpers.js';


/**
 * Genera el HTML para la plantilla de currículum "Frame".
 * @param {Object} data - Datos del currículum del usuario.
 * @returns {string} Fragmento HTML listo para renderizar.
 */
export function render(data) {
  const colors = data.colors?.frame || { primary: '#000000', accent: '#666666', bgLight: '#ffffff' };
  
  // Dividir el nombre para primer nombre y apellidos según la estructura visual
  const nameParts = (data.personal.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const restName = nameParts.slice(1).join(' ');
  const lastName = data.personal.lastName || '';
  
  let nameHTML = '';
  if (firstName) {
    nameHTML = `<h1 class="cv-name-first">${escapeHTML(firstName)} ${restName ? escapeHTML(restName) : ''}</h1>`;
  }
  if (lastName) {
    nameHTML += `<h1 class="cv-name-last">${escapeHTML(lastName)}</h1>`;
  }

  // Párrafos del perfil profesional
  const profileHTML = (data.personal.profile || [])
    .map(p => `<p class="main-text profile-text">${escapeHTML(p)}</p>`)
    .join('');

  // Lista de información de contacto
  const contactHTML = (data.contact || [])
    .map(c => {
      const icon = CONTACT_ICONS[c.type] || '';
      const text = escapeHTML(c.text);
      const titleText = c.type === 'location' ? 'Dirección' :
                        c.type === 'email' ? 'Mail' :
                        c.type === 'phone' ? 'Teléfono' : 'Web';
                        
      if (c.href) {
        return `
          <div class="contact-item">
            <div class="contact-icon">${icon}</div>
            <div class="contact-text">
              <div class="contact-title">${titleText}:</div>
              <a href="${escapeHTML(c.href)}" target="_blank">${text}</a>
            </div>
          </div>`;
      }
      return `
        <div class="contact-item">
          <div class="contact-icon">${icon}</div>
          <div class="contact-text">
            <div class="contact-title">${titleText}:</div>
            ${text}
          </div>
        </div>`;
    })
    .join('');

  // Idiomas
  const languagesHTML = renderResource(data.languages, 'languages', data.resourceLayouts?.languages, colors);

  // Educación (misma estructura y tamaño que experiencia para coherencia visual)
  const educationHTML = (data.education || [])
    .map(edu => {
      const buttonHTML = edu.button?.url ? `
        <a href="${escapeHTML(edu.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(edu.button.text || 'Ver Certificado')}
        </a>` : '';
      return `
        <div class="exp-item">
          <div class="exp-title item-title">${escapeHTML(edu.title)}</div>
          <div class="item-subtitle">${escapeHTML(edu.institution)}</div>
          <div class="item-date-bordered">${escapeHTML(edu.period)}</div>
          <p class="exp-desc item-desc">${escapeHTML(edu.description)}</p>
          ${buttonHTML}
        </div>`;
    })
    .join('');

  // Personalidad
  const personalityHTML = renderResource(data.personality, 'personality', data.resourceLayouts?.personality, colors) ? `
    <ul class="cv-bullet-list">
      ${renderResource(data.personality, 'personality', data.resourceLayouts?.personality, colors)}
    </ul>` : '';

  // Experiencia laboral (con soporte para viñetas y botón opcional)
  const experienceHTML = (data.experience || [])
    .map(exp => {
      const buttonHTML = exp.button?.url ? `
        <a href="${escapeHTML(exp.button.url)}" target="_blank" rel="noopener noreferrer" class="cert-btn">
          ${escapeHTML(exp.button.text || 'Ver Proyecto')}
        </a>` : '';
      
      const bulletsHTML = (exp.bullets || []).length > 0 ? `
        <ul class="cv-bullet-list experience-bullets">
          ${exp.bullets.filter(b => b && b.trim()).map(b => `<li>${escapeHTML(b)}</li>`).join('')}
        </ul>` : (exp.description ? `<p class="exp-desc item-desc">${escapeHTML(exp.description)}</p>` : '');

      return `
        <div class="exp-item">
          <div class="exp-title item-title">${escapeHTML(exp.title)}</div>
          <div class="item-subtitle">${escapeHTML(exp.company)}</div>
          <div class="item-date-bordered">${escapeHTML(exp.period)}</div>
          ${bulletsHTML}
          ${buttonHTML}
        </div>`;
    })
    .join('');

  // Foto de perfil con soporte de formas dinámicas
  let photoHTML = '';
  const photoShape = data.personal.photoShape || 'circle';
  const showPlaceholder = data.features?.photoPlaceholder !== false;
  if (data.personal.photo) {
    photoHTML = `
      <div class="cv-photo-container">
        <div class="cv-photo shape-${photoShape}" style="background-image: url('${escapeHTML(data.personal.photo)}');"></div>
      </div>`;
  } else if (showPlaceholder) {
    photoHTML = `
      <div class="cv-photo-container">
        <div class="cv-photo shape-${photoShape}">${silhouetteSVG}</div>
      </div>`;
  }

  return `
    <article class="cv-page frame" style="--primary: ${colors.primary}; --accent: ${colors.accent}; --bg-light: ${colors.bgLight};">
      <div class="cv-content">
        
        <!-- COLUMNA IZQUIERDA -->
        <div class="cv-left-column">
          <!-- Nombre del CV -->
          <div class="cv-header-text">
            ${nameHTML}
          </div>

          <!-- Puesto de Trabajo -->
          <div class="cv-profession-container">
            <div class="cv-prof-line"></div>
            <h2 class="cv-profession">${escapeHTML(data.personal.profession)}</h2>
          </div>

          <!-- Sidebar Contenedor (Contacto, Idiomas, Educación) -->
          <div class="cv-sidebar">
            <!-- Contacto -->
            <div class="contact-section">
              ${contactHTML}
            </div>

            <!-- Idiomas -->
            ${languagesHTML ? `
              <h3 class="sidebar-title">${escapeHTML(data.sectionTitles?.languages || 'Idiomas')}</h3>
              ${languagesHTML}
            ` : ''}

            <!-- Personalidad -->
            ${personalityHTML ? `
              <h3 class="sidebar-title">${escapeHTML(data.sectionTitles?.personality || 'Personalidad')}</h3>
              ${personalityHTML}
            ` : ''}
          </div>
        </div>

        <!-- COLUMNA DERECHA -->
        <div class="cv-right-column">
          <!-- Foto de perfil -->
          ${photoHTML}

          <!-- Perfil -->
          <h3 class="main-title">${escapeHTML(data.sectionTitles?.profile || 'Perfil')}</h3>
          <div class="profile-container">
            ${profileHTML}
          </div>

          <!-- Educación -->
          ${educationHTML ? `
          <h3 class="main-title">${escapeHTML(data.sectionTitles?.education || 'Educación')}</h3>
          <div class="education-container">
            ${educationHTML}
          </div>
          ` : ''}

          <!-- Experiencia -->
          <h3 class="main-title">${escapeHTML(data.sectionTitles?.experience || 'Experiencia')}</h3>
          <div class="experience-container">
            ${experienceHTML}
          </div>
        </div>

      </div>
    </article>
  `;
}
