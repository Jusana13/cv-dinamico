# CV Dinámico — Editor Modular de Currículums

**CV Dinámico** (FlowCV Dynamic Builder) es una aplicación web interactiva de alto rendimiento diseñada para la creación, personalización y previsualización de currículums en tiempo real. Este proyecto destaca por su enfoque en la **modularidad extrema** y la **escalabilidad**, permitiendo incorporar nuevas plantillas y características de manera declarativa sin modificar la lógica del motor principal.

---

## Stack Tecnológico

El proyecto está construido bajo una filosofía de desarrollo web ágil y ligera, sin frameworks pesados en el cliente para maximizar la velocidad de carga y garantizar la compatibilidad a largo plazo:

1. **Estructura**: HTML5 semántico para una jerarquía de contenido óptima.
2. **Estilos**: CSS3 moderno, organizado con Variables CSS y la función nativa `color-mix()` para cálculo dinámico de paletas y fondos pastel en cascada.
3. **Lógica**: JavaScript Vanilla (ES Modules), modular y orientado a eventos.
4. **Desarrollo**: [Vite](https://vitejs.dev/) como servidor de desarrollo ligero y empaquetador ultrarrápido.
5. **Exportación**: Generación de PDF vectorial nativo de alta calidad y texto seleccionable a través del motor de impresión del navegador (`window.print()`).

---

## Arquitectura del Proyecto

El código está estructurado de manera que los componentes de la interfaz de usuario (UI del editor) y las plantillas de los currículums se mantengan completamente aislados:

```
C:\Proyectos\cv-dinamico/
├── index.html                        # Interfaz principal (paneles del editor, tabs y previsualizador)
├── package.json                      # Scripts de desarrollo de Vite y configuración de dependencias
├── .gitignore                        # Archivos excluidos del control de versiones
├── README.md                         # Esta documentación
└── src/
    ├── css/
    │   └── styles.css                # Estilos globales y específicos del editor lateral (no del currículum)
    ├── js/
    │   ├── app.js                    # Motor central: gestión del estado, persistencia, eventos y renderizado
    │   └── icon-library.js           # Catálogo unificado de iconos vectoriales SVG para intereses y UI
    └── templates/
        ├── templates-config.json     # Declaración unificada de capacidades de cada plantilla (Fuente de Verdad)
        ├── helpers.js                # Funciones utilitarias compartidas de formateo y renderizado para las plantillas
        └── [id-plantilla]/           # Módulos específicos de cada plantilla de CV:
            ├── index.js              # render(state) -> Retorna el HTML renderizado de la plantilla
            ├── style.css             # Estilos CSS con ámbito (scoped) y variables de color de la plantilla
            └── thumbnail.svg         # Miniatura visual para el selector de plantillas del editor
```

---

## Decisiones de Diseño: Escalabilidad y Modularidad

El núcleo del proyecto fue diseñado bajo estrictas pautas de ingeniería de software para prevenir el código espagueti y los parches ad-hoc:

### 1. `templates-config.json` como Fuente de Verdad
El comportamiento, las pestañas y las funcionalidades activas de cada plantilla se definen exclusivamente mediante configuración en `templates-config.json`.
* **Configuración de Características (`features`)**: Permite activar o desactivar dinámicamente campos en la UI (ej. mostrar enlaces de proyectos/certificados con `buttons`, niveles de competencia con `skillLevels` o barras de idiomas con `languageLevels`).
* **Orden del flujo visual (`tabOrder`)**: El panel lateral reorganiza automáticamente sus pestañas según el orden visual en el que se pintan las secciones de cada CV.
* **Mapeo de Colores Personalizado**: Cada plantilla declara las etiquetas e identificadores de sus esquemas de color (ej. color principal, de acento o fondos). Los selectores de la pestaña **Diseño** se dibujan y vinculan al estado dinámicamente.

### 2. Cero condicionales de plantilla hardcodeados
Queda prohibido implementar lógica como `if (activeTemplate === 'sobrio')` en el motor principal (`app.js`). El motor es agnóstico y se limita a ejecutar las directivas expuestas en el JSON de configuración y los archivos de plantilla. Esto permite escalar el sistema de 9 a más de 100 plantillas sin tocar una sola línea de la lógica central.

### 3. Aislamiento y encogimiento de placeholders
Al cambiar entre plantillas con diferentes cantidades por defecto de secciones (ej: `sobrio` inicia con 2 campos de educación y otra con 1), el sistema evalúa si el contenido es un placeholder del sistema mediante `isItemDefault()`. Si el usuario no modificó el texto por defecto, la lista se encoge o expande limpiamente para ajustarse al diseño de la nueva plantilla, evitando la propagación de datos innecesarios en el localStorage.

### 4. Estructura Limpia en Inputs y Validaciones
* **Prohibición de prefijos sueltos**: Las validaciones nunca usan comprobaciones parciales de texto como `startsWith('Nombre de')` o `includes()`. Toda coincidencia con placeholders iniciales se realiza de manera exacta (`===`) contra constantes, evitando falsos positivos cuando el usuario edita su información.
* **UI de Repetidores Limpia**: Se evitan nombres repetitivos y redundantes en las etiquetas de formularios de listas (como "Habilidad #1", "Cualidad #2"). Se usan términos simples como "Nombre" o "Descripción" en el panel de control.
* **Separación de secciones**: Cada sección del currículum (como Intereses o Información Adicional) cuenta con su propio tab y contenedor HTML independiente en lugar de reutilizar o alternar visibilidades de un mismo formulario.

### 5. Consistencia Estructural en Plantillas
Las secciones con layouts idénticos en una plantilla (ej. bloques de Experiencia y Educación) deben tener la misma estructura HTML y clases equivalentes (ej: `.exp-role-row` y `.edu-role-row`) para compartir el mismo patrón CSS, previniendo incoherencias y simplificando el mantenimiento de las hojas de estilo.

---

## Cómo ejecutar el proyecto localmente

### Requisitos previos
* Disponer de [Node.js](https://nodejs.org/) instalado en el sistema.

### Pasos
1. Abre una terminal en la carpeta raíz del proyecto (`C:\Proyectos\cv-dinamico`).
2. Instala las dependencias de desarrollo necesarias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre la dirección url indicada en la terminal (por defecto, `http://localhost:5173`) en tu navegador web.

---

## 🎨 Cómo añadir una nueva plantilla al catálogo

Para añadir una plantilla llamada `mi-plantilla`:

1. **Crea la carpeta**: `src/templates/mi-plantilla/`.
2. **Crea el motor de renderizado (`index.js`)**:
   ```javascript
   /**
    * Renderiza la plantilla Mi Plantilla
    * @param {Object} state - Estado del currículum
    * @param {Object} helpers - Utilidades compartidas
    * @returns {string} HTML renderizado
    */
   export function render(state, helpers) {
     return `
       <div class="cv-page" id="cv-page">
         <!-- Tu HTML modular aquí usando helpers.escapeHTML(state.personal.name) -->
       </div>
     `;
   }
   ```
3. **Crea su hoja de estilo (`style.css`)**:
   Define las clases scoped utilizando variables CSS para colores adaptables.
   ```css
   .cv-page {
     --primary: #5c6bc0;
     --accent: #26a69a;
   }
   /* Estilos específicos de tu plantilla */
   ```
4. **Crea la miniatura (`thumbnail.svg`)**: Diseña un vector simple que sirva como preview en la lista de plantillas.
5. **Regístrala en `src/templates/templates-config.json`**:
   ```json
   {
     "id": "mi-plantilla",
     "name": "Mi Plantilla",
     "thumbnail": "./src/templates/mi-plantilla/thumbnail.svg",
     "defaultPhotoShape": "circle",
     "defaultFont": "Inter",
     "features": {
       "buttons": true,
       "skillLevels": true,
       "languageLevels": false,
       "personality": false,
       "personalityLevels": false,
       "techSkills": false
     },
     "tabOrder": [
       "sec-personal",
       "sec-contact",
       "sec-experience",
       "sec-education",
       "sec-skills",
       "sec-design"
     ],
     "colors": {
       "primary": "Color Principal",
       "accent": "Detalles"
     }
   }
   ```
6. **Migración (Opcional)**: Añade los colores y tipografía por defecto en `migrateState()` dentro de `src/js/app.js` para asegurar que el sistema inicialice la plantilla de forma correcta si el usuario tiene datos guardados antiguos.
