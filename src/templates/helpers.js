/* ==========================================================================
   Utilidades Compartidas para Plantillas de CV
   Funciones de escape HTML, íconos SVG y re-exportación de renderResource.
   Importadas desde cada index.js de plantilla para generar el HTML del CV.
   ========================================================================== */

import { CONTACT_ICONS, INTEREST_ICONS } from '../js/icon-library.js';
import { renderStars, renderDots, renderResource, escapeHTML } from './resource-renderer.js';

/* --- SVG Placeholder de Silueta (se muestra cuando no hay foto de perfil) --- */

export const silhouetteSVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; display:block; color:#cbd5e1;"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/></svg>`;

/* --- Re-exportación de Renderizadores de Recursos y Estrellas --- */

export { renderStars, renderDots, renderResource, escapeHTML };

/* --- Re-exportación de Íconos (contacto e intereses) --- */

export { CONTACT_ICONS, INTEREST_ICONS };
