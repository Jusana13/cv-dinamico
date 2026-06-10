/**
 * @fileoverview Creador de CV Dinámico — state.js
 * Módulo de gestión del estado global de la aplicación.
 * Controla la carga, guardado, migración defensiva y sincronización asíncrona de configuraciones de plantillas.
 */

// ==========================================================================
// CONSTANTES Y CONFIGURACIONES POR DEFECTO
// ==========================================================================

/**
 * Familias de fuentes de Google Fonts soportadas globalmente por la aplicación.
 * @type {string[]}
 */
export const SUPPORTED_FONTS = [
  'Inter',
  'Montserrat',
  'Open Sans',
  'Plus Jakarta Sans',
  'Poppins',
  'Roboto',
  'Lora',
  'Playfair Display',
  'Outfit',
  'DM Sans'
];

/**
 * Placeholders visuales utilizados para rellenar campos vacíos en el previsualizador del CV.
 * @type {Object}
 */
export const VISUAL_PLACEHOLDERS = {
  personal: {
    name: 'Nombres',
    lastName: 'Apellidos',
    profession: 'Profesión / Especialidad',
    profile: [
      'Describe aquí tu perfil profesional en uno o dos párrafos breves. Destaca tus principales competencias, experiencia y lo que puedes aportar a la empresa.',
      'Puedes añadir más párrafos de perfil o eliminarlos utilizando los botones de control de arriba.'
    ],
    additionalInfo: 'Disponible para incorporación inmediata y flexibilidad horaria en proyectos dinámicos.'
  },
  contact: {
    location: 'Ciudad, País',
    email: 'correo@ejemplo.com',
    phone: '+34 600 000 000',
    web: 'tuweb.com'
  },
  experience: {
    title: 'Nombre de tu Puesto de Trabajo',
    company: 'Nombre de la Empresa o Entidad',
    period: 'Año Inicio - Año Fin (o Actual)',
    bullets: [
      'Detalla aquí un logro importante o una responsabilidad principal que tuviste.',
      'Procura iniciar cada viñeta con un verbo de acción claro y conciso.',
      'Puedes agregar tantas líneas de logros o tareas como necesites.'
    ],
    buttonText: 'Ver Proyecto'
  },
  education: {
    title: 'Nombre de tu Grado o Formación Académica',
    institution: 'Nombre de la Institución o Escuela',
    period: 'Año Inicio - Año Fin',
    description: 'Describe brevemente las materias de mayor importancia, proyectos realizados o competencias especiales desarrolladas durante tus estudios.',
    buttonText: 'Ver Certificado'
  },
  skills: 'Habilidad',
  languages: {
    name: 'Idioma',
    level: 'Nivel'
  },
  personality: 'Cualidad',
  techSkills: 'Habilidad técnica'
};

/**
 * Estructura de datos por defecto para inicializar un CV nuevo.
 * @type {Object}
 */
export const defaultData = {
  activeTemplate: 'moderno',
  sectionTitles: {
    personalInfo: 'Información Personal',
    profile: 'Perfil Profesional',
    contact: 'Contacto',
    experience: 'Experiencia Laboral',
    education: 'Formación Académica',
    skills: 'Habilidades Técnicas',
    languages: 'Idiomas',
    interests: 'Intereses y Hobbies',
    personality: 'Personalidad',
    techSkills: 'Habilidades Técnicas',
    additional: 'Información Adicional'
  },
  personal: {
    name: '',
    lastName: '',
    profession: '',
    photo: '',
    photoShape: 'circle',
    profile: [''],
    additionalInfo: ''
  },
  contact: [
    { type: 'location', text: '' },
    { type: 'email', text: '', href: '' },
    { type: 'phone', text: '' },
    { type: 'web', text: '', href: '' }
  ],
  experience: [
    {
      title: '',
      company: '',
      period: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
      button: { text: '', url: '' }
    }
  ],
  education: [
    {
      title: '',
      company: '', // Clave legacy, se mantiene por compatibilidad
      institution: '',
      period: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      button: { text: '', url: '' }
    }
  ],
  skills: [
    { name: '', level: 5 }
  ],
  languages: [
    { name: '', level: 'Nativo', percentage: 100 }
  ],
  interests: ['tech', 'reading', 'sports'],
  personality: [
    { name: '', level: 5 }
  ],
  techSkills: [
    { name: '' }
  ],
  colors: {
    moderno: { primary: '#2C2D30', accent: '#C9A227', bgLight: '#F3EFE6' },
    profesional: { primary: '#1b2a4a', accent: '#e8a838', sidebarBg: '#f4f6f8' },
    minimalista: { primary: '#111111', accent: '#666666' },
    creativo: { primary: '#222222', accent: '#f4b844', bgLight: '#fdf8ec' },
    rosa: { primary: '#d63a3a', accent: '#ff8a80', bgLight: '#ff8a80' },
    asimetrico: { primary: '#111316', accent: '#a68d73' },
    sage: { primary: '#c5ded6', accent: '#354240' },
    sobrio: { primary: '#EAEAE6', accent: '#222222' },
    estrella: { primary: '#4D4D4B', accent: '#F8F7F4', textColor: '#5A5A58' },
    split: { primary: '#1a1b1e', accent: '#e5dfd3', bgLight: '#ffffff' },
    vertice: { primary: '#fde484', accent: '#f5f6f8' }
  },
  fonts: {
    moderno: 'Plus Jakarta Sans',
    profesional: 'Open Sans',
    minimalista: 'Inter',
    creativo: 'Poppins',
    rosa: 'Poppins',
    asimetrico: 'Montserrat',
    sage: 'Outfit',
    sobrio: 'Lora',
    estrella: 'Montserrat',
    split: 'Montserrat',
    vertice: 'Inter'
  }
};

// ==========================================================================
// ESTADO GLOBAL MUTABLE (EN MEMORIA)
// ==========================================================================

/**
 * Estado en memoria del currículum activo y preferencias del usuario.
 * @type {Object}
 */
export let state = null;

/**
 * Caché de plantillas de currículum ya importadas (index.js compilado y style.css).
 * @type {Object.<string, {render: function, css: string}>}
 */
export const templateCache = {};

/**
 * Colección de configuraciones cargadas dinámicamente de todas las plantillas.
 * @type {Object[]}
 */
export let templatesConfig = [];

// ==========================================================================
// MÉTODOS DE ACCESO Y MODIFICACIÓN DEL ESTADO
// ==========================================================================

/**
 * Establece un nuevo estado global reemplazando el objeto en memoria.
 * @param {Object} newState - El nuevo estado.
 */
export function setState(newState) {
  state = newState;
}

/**
 * Guarda síncronamente el estado actual en el localStorage del navegador.
 * @description Convierte el objeto a JSON y realiza una operación de E/S.
 */
export function saveState() {
  if (!state) return;
  localStorage.setItem('cv_creator_state', JSON.stringify(state));
}

/**
 * Inicializa el estado cargando datos persistidos de localStorage o de fábrica.
 * @description Aplica migraciones de compatibilidad y overrides por defecto de la plantilla cargada.
 */
export function loadState() {
  const saved = localStorage.getItem('cv_creator_state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      migrateState(state);
    } catch (e) {
      console.error("Error al cargar localStorage, usando datos por defecto", e);
      state = JSON.parse(JSON.stringify(defaultData));
      migrateState(state);
    }
  } else {
    state = JSON.parse(JSON.stringify(defaultData));
    migrateState(state);
    state.personal.photoShape = getDefaultPhotoShape(state.activeTemplate);
  }
  applyTemplateDefaultOverrides(state.activeTemplate, state);
}

// ==========================================================================
// SERVICIOS DE CARGA DINÁMICA DE PLANTILLAS (MODULAR)
// ==========================================================================

/**
 * Carga concurrentemente las configuraciones locales de todas las plantillas activas.
 * @returns {Promise<Object[]>} Array con los datos de configuración de cada plantilla.
 * @description Consulta el archivo templates-manifest.json para resolver las carpetas
 *              y luego realiza llamadas fetch concurrentes multiplexadas (Promise.all).
 *              Cuenta con caché en memoria.
 */
export async function loadTemplatesConfig() {
  if (templatesConfig && templatesConfig.length > 0) return templatesConfig;
  try {
    const response = await fetch('./src/templates/templates-manifest.json');
    const templateIds = await response.json();
    const configPromises = templateIds.map(async (id) => {
      const res = await fetch(`./src/templates/${id}/config.json`);
      return res.json();
    });
    templatesConfig = await Promise.all(configPromises);
    return templatesConfig;
  } catch (err) {
    console.error("Error al cargar la configuración distribuida de plantillas:", err);
    return [];
  }
}

/**
 * Carga de forma diferida (Lazy Load) el módulo JS y el CSS de una plantilla de currículum.
 * @param {string} templateId - El identificador único de la plantilla.
 * @returns {Promise<{render: function, css: string}|null>} El objeto plantilla con render y estilos, o null.
 */
export async function loadTemplate(templateId) {
  if (templateCache[templateId]) {
    return templateCache[templateId];
  }
  try {
    const module = await import(`../templates/${templateId}/index.js`);

    const cssResponse = await fetch(`./src/templates/${templateId}/style.css`);
    const cssText = await cssResponse.text();

    templateCache[templateId] = {
      render: module.render,
      css: cssText
    };
    return templateCache[templateId];
  } catch (error) {
    console.error(`Error al cargar la plantilla ${templateId}:`, error);
    return null;
  }
}

// ==========================================================================
// MIGRACIÓN Y LIMPIEZA DEFENSIVA DEL ESTADO
// ==========================================================================

/**
 * Aplica transformaciones al estado cargado para asegurar compatibilidad hacia atrás.
 * @param {Object} stateObj - El estado a migrar.
 * @description Convierte strings predeterminados legados, inicializa tipografías si faltan,
 *              limpia fotos residuales y estandariza los esquemas de datos.
 */
export function migrateState(stateObj) {
  if (!stateObj) return;

  // Inicializar sección de datos personales si no existe
  if (!stateObj.personal || typeof stateObj.personal !== 'object') {
    stateObj.personal = JSON.parse(JSON.stringify(defaultData.personal));
  }

  if (stateObj.personal) {
    // Estandarizar valores por defecto viejos que causaban confusión
    if (stateObj.personal.name === 'AQUÍ VA TU NOMBRE') {
      stateObj.personal.name = 'Nombres y';
    }
    if (stateObj.personal.lastName === 'Y TUS APELLIDOS') {
      stateObj.personal.lastName = 'Apellidos';
    }
    if (stateObj.personal.profession === 'Tu Profesión / Especialidad') {
      stateObj.personal.profession = 'Profesión / Especialidad';
    }

    // Validar forma de foto según el JSON de la plantilla activa
    const activeTmpl = stateObj.activeTemplate || 'moderno';
    const supportedShapes = getTemplateSupportedShapes(activeTmpl);
    if (!stateObj.personal.photoShape || !supportedShapes.includes(stateObj.personal.photoShape)) {
      stateObj.personal.photoShape = getDefaultPhotoShape(activeTmpl);
    }

    // Asegurar que el perfil (profile) sea un array (migración desde texto plano legacy)
    if (stateObj.personal.profile === undefined || stateObj.personal.profile === null) {
      stateObj.personal.profile = [''];
    } else if (!Array.isArray(stateObj.personal.profile)) {
      if (typeof stateObj.personal.profile === 'string') {
        stateObj.personal.profile = [stateObj.personal.profile];
      } else {
        stateObj.personal.profile = [''];
      }
    }
  }

  // Asegurar existencia de sección de tipografías por plantilla en el estado
  if (!stateObj.fonts) {
    stateObj.fonts = {};
  }
  
  // Rellenar tipografías por defecto si faltan para evitar valores nulos
  if (templatesConfig && templatesConfig.length > 0) {
    templatesConfig.forEach(tmpl => {
      if (!stateObj.fonts[tmpl.id]) {
        stateObj.fonts[tmpl.id] = tmpl.defaultFont || defaultData.fonts[tmpl.id] || 'Inter';
      }
    });
  } else {
    // Fallback defensivo usando los datos de fábrica locales
    Object.keys(defaultData.fonts).forEach(tmplId => {
      if (!stateObj.fonts[tmplId]) {
        stateObj.fonts[tmplId] = defaultData.fonts[tmplId];
      }
    });
  }

  // Limpiar campos legacy (como 'company' en Educación que se renombró a 'institution')
  if (stateObj.education) {
    stateObj.education.forEach(edu => {
      if (edu.company !== undefined && !edu.institution) {
        edu.institution = edu.company;
        delete edu.company;
      }
      if (!edu.button) {
        edu.button = { text: 'Ver Certificado', url: '' };
      }
    });
  }

  // Asegurar botón en experiencia laboral
  if (stateObj.experience) {
    stateObj.experience.forEach(exp => {
      if (!exp.button) {
        exp.button = { text: 'Ver Proyecto', url: '' };
      }
    });
  }

  // Sanitizar listas vacías para evitar que la UI quede sin ningún campo inicial
  const listKeys = ['experience', 'education', 'skills', 'languages', 'techSkills', 'interests', 'personality'];
  listKeys.forEach(k => {
    if (!stateObj[k] || !Array.isArray(stateObj[k]) || stateObj[k].length === 0) {
      stateObj[k] = JSON.parse(JSON.stringify(defaultData[k]));
    }
  });

  // Asegurar la existencia e integridad de la sección de contacto
  if (!stateObj.contact || !Array.isArray(stateObj.contact) || stateObj.contact.length === 0) {
    stateObj.contact = JSON.parse(JSON.stringify(defaultData.contact));
  }

  // Asegurar la existencia e integridad de los colores
  if (!stateObj.colors || typeof stateObj.colors !== 'object') {
    stateObj.colors = JSON.parse(JSON.stringify(defaultData.colors));
  } else {
    // Asegurar que cada plantilla tenga sus colores inicializados en el estado
    Object.keys(defaultData.colors).forEach(tmplId => {
      if (!stateObj.colors[tmplId]) {
        stateObj.colors[tmplId] = JSON.parse(JSON.stringify(defaultData.colors[tmplId]));
      }
    });
  }
}

/**
 * Sobrescribe el contenido por defecto del estado basado en las capacidades de la plantilla activa.
 * @param {string} templateId - El ID de la plantilla seleccionada.
 * @param {Object} [stateObj=state] - El objeto de estado a manipular.
 * @description Aplica ampliaciones de ítems declaradas en `defaultDataOverrides`.
 *              Si no hay overrides para una colección y los elementos adicionales coinciden con
 *              placeholders del sistema, los encoge (shrinkage) de vuelta al tamaño por defecto.
 */
export function applyTemplateDefaultOverrides(templateId, stateObj = state) {
  if (!stateObj || !templatesConfig || templatesConfig.length === 0) return;
  const config = templatesConfig.find(t => t.id === templateId);

  const collectionKeys = ['education', 'experience', 'skills', 'languages', 'personality', 'techSkills', 'interests', 'profile'];

  collectionKeys.forEach(key => {
    let overrides = config && config.defaultDataOverrides && config.defaultDataOverrides[key];
    const baseDefault = getBaseDefaultCollection(key);

    if (typeof overrides === 'number') {
      const count = overrides;
      overrides = [];
      for (let i = 0; i < count; i++) {
        const baseItem = baseDefault && baseDefault[0];
        if (baseItem !== undefined) {
          overrides.push(JSON.parse(JSON.stringify(baseItem)));
        }
      }
    }

    const stateVal = getCollectionState(stateObj, key);

    if (overrides && Array.isArray(overrides)) {
      if (!stateVal) {
        setCollectionState(stateObj, key, JSON.parse(JSON.stringify(overrides)));
      } else if (stateVal.length < overrides.length) {
        const diff = overrides.length - stateVal.length;
        for (let i = 0; i < diff; i++) {
          const overrideIndex = overrides.length - diff + i;
          stateVal.push(JSON.parse(JSON.stringify(overrides[overrideIndex])));
        }
      }
    } else {
      // Algoritmo de Encogimiento (Shrinkage)
      if (stateVal && baseDefault && Array.isArray(stateVal) && Array.isArray(baseDefault)) {
        const defaultLen = baseDefault.length;
        if (stateVal.length > defaultLen) {
          let allExtrasAreDefaults = true;

          for (let i = defaultLen; i < stateVal.length; i++) {
            if (!isItemDefault(stateVal[i], key)) {
              allExtrasAreDefaults = false;
              break;
            }
          }

          if (allExtrasAreDefaults) {
            setCollectionState(stateObj, key, stateVal.slice(0, defaultLen));
          }
        }
      }
    }
  });
}

// ==========================================================================
// HELPERS INTERNOS DE COMPARACIÓN Y PROPIEDADES PROFUNDAS
// ==========================================================================

/**
 * Obtiene el formato base por defecto para una colección.
 * @param {string} key - Clave identificadora.
 * @returns {Array|undefined} La colección por defecto global.
 * @private
 */
function getBaseDefaultCollection(key) {
  if (key === 'profile') {
    return defaultData.personal ? defaultData.personal.profile : undefined;
  }
  return defaultData[key];
}

/**
 * Recopila todos los ítems por defecto (placeholders iniciales) declarados para una clave.
 * @param {string} key - La clave de la colección (experiencia, educación, etc.).
 * @returns {Array} Lista con todas las variantes por defecto asociadas a la clave.
 * @private
 */
function getTemplateDefaultItems(key) {
  const defaults = [];
  const baseDefault = getBaseDefaultCollection(key);

  if (Array.isArray(baseDefault)) {
    baseDefault.forEach(item => defaults.push(item));
  }

  if (templatesConfig) {
    templatesConfig.forEach(config => {
      let overrides = config.defaultDataOverrides && config.defaultDataOverrides[key];
      if (typeof overrides === 'number') {
        const baseItem = baseDefault && baseDefault[0];
        if (baseItem !== undefined) {
          defaults.push(baseItem);
        }
      } else if (Array.isArray(overrides)) {
        overrides.forEach(item => defaults.push(item));
      }
    });
  }

  // Lista heredada para depurar e/s antiguos de localStorage
  if (key === 'experience') {
    defaults.push({
      title: "Nombre de tu Segundo Puesto de Trabajo",
      company: "Nombre de la Segunda Empresa o Entidad",
      period: "Año Inicio - Año Fin",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [
        "Describe una contribución relevante realizada en este puesto.",
        "Utiliza métricas siempre que sea posible (ej. aumenté ventas, reduje costes)."
      ],
      button: { text: "Ver Proyecto", url: "https://ejemplo.com" }
    });
  }

  return defaults;
}

/**
 * Comprueba si un elemento equivale a cualquiera de los placeholders del sistema.
 * @param {*} item - El elemento a evaluar.
 * @param {string} key - Clave de la colección.
 * @returns {boolean} True si equivale al default, false en caso contrario.
 */
export function isItemDefault(item, key) {
  const defaults = getTemplateDefaultItems(key);
  for (const defItem of defaults) {
    if (isDefaultItemValue(item, defItem)) return true;
  }
  return false;
}

/**
 * Compara de forma profunda si dos ítems coinciden en contenido sustancial.
 * @param {*} item - Ítem actual del usuario.
 * @param {*} defaultItem - Molde de placeholder base del sistema.
 * @returns {boolean} True si todas las propiedades coinciden, false si fue editado.
 */
export function isDefaultItemValue(item, defaultItem) {
  if (typeof defaultItem !== 'object' || defaultItem === null || typeof item !== 'object' || item === null) {
    return item === defaultItem;
  }
  for (const key in defaultItem) {
    if (typeof defaultItem[key] === 'object' && defaultItem[key] !== null) {
      if (!isDefaultItemValue(item[key], defaultItem[key])) return false;
    } else if (typeof defaultItem[key] === 'string' || typeof defaultItem[key] === 'number' || typeof defaultItem[key] === 'boolean') {
      const val = item[key];
      const defVal = defaultItem[key];
      if (val !== undefined && val !== '' && val !== defVal) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Resuelve una colección del estado considerando rutas complejas.
 * @param {Object} stateObj - El estado.
 * @param {string} key - La clave.
 * @returns {Array|undefined} La colección de datos.
 */
export function getCollectionState(stateObj, key) {
  if (key === 'profile') {
    return stateObj && stateObj.personal ? stateObj.personal.profile : undefined;
  }
  return stateObj ? stateObj[key] : undefined;
}

/**
 * Escribe una colección en el estado en la ruta correspondiente.
 * @param {Object} stateObj - El estado.
 * @param {string} key - La clave.
 * @param {Array} value - Los datos a asignar.
 */
export function setCollectionState(stateObj, key, value) {
  if (key === 'profile') {
    if (stateObj && stateObj.personal) {
      stateObj.personal.profile = value;
    }
  } else if (stateObj) {
    stateObj[key] = value;
  }
}

/**
 * Resuelve un valor de propiedad anidada mediante notación por puntos (ej: personal.name).
 * @param {Object} obj - El objeto a examinar.
 * @param {string} path - Ruta separada por puntos.
 * @returns {*} El valor de la propiedad.
 */
export function getDeepValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Escribe un valor de propiedad anidada mediante notación por puntos.
 * @param {Object} obj - El objeto a modificar.
 * @param {string} path - Ruta separada por puntos.
 * @param {*} value - El valor a establecer.
 */
export function setDeepValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

// ==========================================================================
// CAPACIDADES ESPECÍFICAS DE FOTO Y COGNITIVAS POR PLANTILLA
// ==========================================================================

/**
 * Obtiene la forma por defecto de avatar para una plantilla.
 * @param {string} templateId - ID de la plantilla.
 * @returns {string} Forma ('circle', 'rounded', 'square').
 */
export function getDefaultPhotoShape(templateId) {
  if (templatesConfig) {
    const config = templatesConfig.find(t => t.id === templateId);
    if (config && config.defaultPhotoShape) {
      return config.defaultPhotoShape;
    }
  }
  return 'circle';
}

/**
 * Obtiene las formas de avatar soportadas por una plantilla.
 * @param {string} templateId - ID de la plantilla.
 * @returns {string[]} Formas válidas.
 */
export function getTemplateSupportedShapes(templateId) {
  if (templatesConfig) {
    const config = templatesConfig.find(t => t.id === templateId);
    if (config && config.supportedPhotoShapes) {
      return config.supportedPhotoShapes;
    }
  }
  return ['circle', 'rounded', 'square'];
}

/**
 * Obtiene las formas de avatar soportadas por la plantilla actualmente activa.
 * @returns {string[]} Formas válidas.
 */
export function getActiveTemplateSupportedShapes() {
  return getTemplateSupportedShapes(state ? state.activeTemplate : 'moderno');
}

/**
 * Resuelve y mapea el objeto de capacidades (features) para la plantilla activa.
 * @returns {Object} Mapa de visibilidad de funcionalidades.
 */
export function getActiveTemplateFeatures() {
  if (!templatesConfig || templatesConfig.length === 0) {
    return {
      buttons: true,
      educationButtons: true,
      experienceButtons: true,
      skillLevels: true,
      skillPercentage: false,
      languageLevels: true,
      personality: false,
      personalityLevels: false,
      techSkills: false,
      additionalInfoText: false
    };
  }
  const activeTemplateConfig = templatesConfig.find(t => t.id === (state ? state.activeTemplate : 'moderno'));
  const feat = (activeTemplateConfig && activeTemplateConfig.features) || {};
  return {
    buttons: feat.buttons !== undefined ? feat.buttons : true,
    educationButtons: feat.educationButtons !== undefined ? feat.educationButtons : (feat.buttons !== undefined ? feat.buttons : true),
    experienceButtons: feat.experienceButtons !== undefined ? feat.experienceButtons : (feat.buttons !== undefined ? feat.buttons : true),
    skillLevels: feat.skillLevels !== undefined ? feat.skillLevels : true,
    skillPercentage: feat.skillPercentage !== undefined ? feat.skillPercentage : false,
    languageLevels: feat.languageLevels !== undefined ? feat.languageLevels : true,
    personality: feat.personality !== undefined ? feat.personality : false,
    personalityLevels: feat.personalityLevels !== undefined ? feat.personalityLevels : false,
    techSkills: feat.techSkills !== undefined ? feat.techSkills : false,
    additionalInfoText: feat.additionalInfoText !== undefined ? feat.additionalInfoText : false
  };
}
