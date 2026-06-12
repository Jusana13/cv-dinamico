# 📄 VectorCV — Editor Modular de Currículums A4

**VectorCV** (anteriormente conocido como CV Dynamic Builder) es una aplicación web interactiva de alto rendimiento diseñada para la creación, personalización y previsualización de currículums en tiempo real. 

El proyecto destaca por su enfoque en la **modularidad extrema** y la **escalabilidad encapsulada**, permitiendo incorporar nuevas plantillas de CV y características de la interfaz de manera 100% declarativa, sin acoplamiento ni necesidad de modificar la lógica del motor principal.

---

## 🚀 Características Principales

- **Edición en Tiempo Real**: Sincronización instantánea entre los formularios de entrada y la previsualización del documento.
- **Arquitectura Autocontenida por Plantilla**: Cada diseño de CV está encapsulado en su propia carpeta con su lógica de renderizado, estilos, metadatos y configuración de capacidades.
- **Generación Vectorial de PDFs**: Exportación a PDF de alta resolución mediante la API de impresión nativa del navegador (`window.print()`), garantizando textos seleccionables, bajo peso y nitidez vectorial pura.
- **Control de Ajuste A4 Dinámico**: Algoritmo inteligente que calcula el desbordamiento del documento en base al tamaño real (`scrollHeight`) para notificar al usuario de manera no intrusiva si el contenido excede una página A4.
- **Tematización Dinámica de Diseño**: El panel de personalización de colores, formas de foto y tipografías se construye de manera dinámica para cada plantilla según las capacidades declaradas en su archivo de configuración local.
- **Corrector de Ortografía Integrado**: Conexión directa con la API LanguageTool para validación ortográfica en caliente.

---

## 📂 Arquitectura del Proyecto

El proyecto sigue una estructura limpia, separando estrictamente la UI del editor de los diseños de las plantillas:

```
C:\Proyectos\cv-dinamico\
├── index.html                        # Interfaz de usuario principal y estructura del editor
├── package.json                      # Configuración de scripts y dependencias (Vite)
├── vite.config.js                    # Configuración del servidor de desarrollo y empaquetador
├── src/
│   ├── css/
│   │   ├── styles.css                # Estilos globales de la UI del editor (Dashboard)
│   │   └── responsive.css            # Estilos responsivos aislados para móviles (< 1024px)
│   ├── js/
│   │   ├── app.js                    # Orquestador central y registro de eventos globales
│   │   ├── state.js                  # Manejo de estado reactivo, persistencia y lazy loader
│   │   ├── cv-renderer.js            # Motor de renderizado del CV, inyección de CSS y fuentes
│   │   ├── form-builder.js           # Generación dinámica de formularios y repeaters
│   │   ├── icon-library.js           # Biblioteca interna de iconos vectoriales SVG
│   │   └── mobile-ui.js              # Lógica de interfaz responsiva y táctil móvil aislada
│   └── templates/
│       ├── templates-manifest.json   # Índice central de plantillas de currículum activas
│       ├── helpers.js                # Utilidades compartidas de formateo para las plantillas
│       └── [id-plantilla]/           # Carpeta modular autocontenida por plantilla
│           ├── index.js              # Módulo de renderizado: render(state) -> HTML String
│           ├── style.css             # Estilos CSS scoped para el diseño del CV
│           ├── thumbnail.svg         # Imagen vectorial para el selector modal de plantillas
│           └── config.json           # Fuente de verdad: capacidades, orden de tabs y colores
```

---

## ⚙️ La Fuente de Verdad: `config.json` de cada Plantilla

Toda plantilla debe declarar sus capacidades en su archivo `config.json` local. El motor de formularios y el previsualizador leen esta configuración dinámicamente para autoajustarse:

### Capacidades (`features`)
- `buttons`: Activa botones de certificados y enlaces web en la experiencia y educación.
- `skillLevels`: Habilita los niveles en las competencias de forma gráfica.
- `skillPercentage`: Mapea las competencias a controles deslizantes de porcentaje (0-100%).
- `languageLevels`: Activa barras de nivel/progreso para idiomas.
- `personality`: Agrega la sección de rasgos/personalidad.
- `techSkills`: Agrega soporte para una sección independiente de habilidades técnicas.
- `allowClearPhoto`: Muestra el botón de eliminar fotografía de perfil.

### Personalización (`colors` y `supportedPhotoShapes`)
- `colors`: Diccionario con las variables de color editables de la plantilla y sus nombres descriptivos legibles para el usuario.
- `supportedPhotoShapes`: Array que limita la forma de la foto permitida en el diseño (`["square", "rounded", "circle"]`).

### Estructura de Secciones (`tabOrder` y `sectionAliases`)
- `tabOrder`: Array que indica el orden en el que deben aparecer las pestañas del formulario en el panel izquierdo para reflejar el flujo visual exacto del CV.
- `sectionAliases` / `singularAliases`: Permiten renombrar el título de secciones completas y de sus repeticiones (ej. cambiar "Idiomas" por "Lenguas" y su singular por "Lengua") de forma declarativa.

---

## 📦 Sistema de Carga Dinámica (Zero Run-Time Latency)

Para asegurar que la aplicación funcione tanto en modo de desarrollo local como desplegada de forma estática en producción (sin requerir copia manual de la carpeta `src` al directorio `dist/`), la carga de las plantillas se realiza usando **importaciones dinámicas de módulos y recursos raw de Vite**:

```javascript
// Carga del motor JS de la plantilla
const module = await import(`../templates/${templateId}/index.js`);

// Carga en crudo (raw string) del CSS scoped
const cssModule = await import(`../templates/${templateId}/style.css?raw`);
const cssText = cssModule.default;

// Carga en crudo (raw string) de la miniatura SVG
const svgModule = await import(`../templates/${templateId}/thumbnail.svg?raw`);
```

Esto permite a Vite compilar de manera inteligente todas las plantillas activas en fragmentos independientes dentro del directorio `dist/assets/`, optimizando los tiempos de carga y garantizando la inyección limpia de estilos en cualquier servidor.

---

## 🛠️ Desarrollo e Instalación

### Requisitos previos
- Node.js (versión 18 o superior recomendada)

### Instalación de dependencias
```bash
npm install
```

### Ejecutar servidor de desarrollo
```bash
# En Windows (bypasseando políticas de ejecución si es necesario)
npm.cmd run dev

# En Linux / macOS
npm run dev
```

### Compilar para producción (Carpeta `dist/`)
```bash
# En Windows
npm.cmd run build

# En Linux / macOS
npm run build
```

---

## 🛡️ Directrices de Desarrollo (Guardián del Código)

1. **Evitar parches**: Si un comportamiento visual o campo depende de la plantilla activa, configúralo a través del archivo `config.json` local de la plantilla, **nunca** mediante un bloque condicional `if (activeTemplate === '...')` en el código central.
2. **Estilo del editor separado**: Los estilos del editor lateral y los paneles de control pertenecen a `styles.css`. Los estilos del documento CV pertenecen al `style.css` de cada plantilla. No uses `!important` para sobreescribir estilos.
3. **UTF-8 sin BOM**: Todos los archivos de configuración JSON de las plantillas deben guardarse en formato UTF-8 limpio sin BOM para evitar fallos de parseo asíncrono en diversos navegadores.
