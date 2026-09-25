---
name: compact-ui
description: Estilo de UI de Juan - compacto, minimalista y parejo. Úsala al diseñar, construir, rediseñar o pulir cualquier página web o interfaz (landing, tienda, portal, panel admin), cuando pida "más compacto", "parejo", "minimalista", "que se vea profesional", "tipo BreZ", o al revisar que una UI quedó bien antes de publicarla.
---

# Compact UI — compacto, minimalista, parejo

Tres ideas mandan: **poco aire, nada decorativo que no sirva, y todo alineado con todo**.
Una página "parejo" es la que, al ponerle una regla encima, las cosas equivalentes caen
en la misma línea.

## 1. Antes de escribir código

- **Primero celular.** Casi todo el público entra desde el teléfono (Gobierno escolar: 99 %).
  Diseña y revisa primero a 375px; desktop es la adaptación, no al revés.

- **Desde cero, nunca re-skin.** No partir de una plantilla o tema ajeno y cambiarle colores.
  Estructura y clases propias, aunque tome más tiempo.
- **Lee lo que ya existe.** Si el proyecto tiene tokens (`--s-*`, `--t-*`, `--c-*`), úsalos;
  no inventes valores sueltos. Si no tiene, créalos primero (sección 3).
- **Define el estilo de cada sección antes de pintarla**: dónde va el texto, dónde hay
  espacio vacío, qué es tarjeta/panel. Las decisiones (fondos, degradados, columnas) salen
  de esa geometría, no de copiar lo de la sección anterior.

## 2. Compacto

- Secciones: `padding-block` de 2rem en desktop, 1.5rem en móvil. 3rem+ solo en un hero
  que realmente lo pida.
- Separación entre título y texto: .3–.6rem. Entre bloques: 1–1.25rem. Listas: gap 4–6px.
- Texto de cuerpo 13–14px, `line-height` 1.45–1.65 (1.8 ya es aire de más).
- Títulos de sección moderados (`clamp(2.2rem,5vw,3.25rem)` para el hero, ~1.6–1.7rem
  para secciones). El tamaño no reemplaza la jerarquía.
- Botones: `padding: 9px 18px`, radio 10px. Tarjetas de acceso: `padding: .85rem .75rem`,
  radio 14px, iconos/avatares 40px.
- Mide antes y después: el alto total de la página debería bajar notablemente (referencia:
  Gobierno escolar pasó de 1406px a 1099px, −22%) sin cortar contenido.

## 3. Minimalista

- Sistema de tokens pequeño: una escala de espacio (`--s-1..--s-7`), 3–4 tamaños de texto,
  colores semánticos (`--c-bg`, `--c-text`, `--c-text-2`, `--c-line`, acento) y un solo
  easing con 3 duraciones (120/200/320ms).
- Máximo dos familias tipográficas: una display y una de UI.
- **Sin emojis como iconos.** Iconos SVG (lucide o propios), `stroke-width` 1.5, 20px.
- Decoración (círculos, blobs, brillos) solo si no compite con el contenido; nunca
  `opacity: 0` como estado base de algo que debe verse (si JS falla, se pierde).
- Bordes de 1px con `--c-line` en vez de sombras pesadas.
- Nada de promesas inventadas en el texto: solo beneficios y datos reales del negocio.

## 4. Parejo (alineación)

- **Columnas con el mismo contenido → filas compartidas.** Cuando 2–4 tarjetas/paneles
  tienen la misma estructura (logo, etiqueta, nombre, lema, título, lista, botón), usa
  `subgrid` para que cada pieza caiga a la misma altura aunque una lista sea más larga:

  ```css
  .grid  { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(7,auto); }
  .card  { display:grid; grid-row:span 7; grid-template-rows:subgrid; row-gap:0; align-content:start; }
  .card-inner { display:contents; }          /* si hay un wrapper */
  .card-cta { align-self:end; }              /* botones siempre al fondo */
  ```

  Nunca `justify-content:center` vertical en paneles de alto distinto: desalinea todo.
- En móvil (una columna) vuelve a `display:flex; flex-direction:column` y revisa que
  los `align-self:end` no manden botones a la derecha (`align-self:flex-start`).
- Mismo tamaño y mismo borde para elementos equivalentes (avatares, logos, chips).
  Estilos inline repetidos → una clase.
- Anchos de lectura: 60–76ch para texto largo, ~340px dentro de paneles.

## 5. Formularios (buzones, contacto, checkout)

- **El formulario es la prioridad**: en celular debe verse al abrir la página. El título
  arriba, el formulario enseguida y la explicación/beneficios debajo (`order` en grid, o
  `display:contents` en el bloque de info para subir solo el título).
- Campos: `font-size:16px` (evita el zoom de iOS), `min-height:48px`, borde de 1.5px con
  contraste real, fondo sólido (blanco o superficie oscura en tema oscuro), foco con anillo
  del color de acento. Textarea ≥150px. Botón de envío ≥52px, 16px, ancho completo.
- Etiquetas 14px en el color de texto principal (no gris claro).
- Dos campos en una fila: `align-items:end` para que queden parejos aunque una etiqueta
  ocupe dos líneas.
- Imágenes decorativas que no cargan (logos, héroes) no pueden dejar huecos: fondo de
  respaldo con degradado del acento, y `:has(img[style*="none"])` para ocultar
  contenedores vacíos cuando el `onerror` escondió la imagen.

## 6. Fondos con imagen

Oscurece según la composición, no con un degradado genérico copiado:
- Texto directo sobre la imagen → casi sólido detrás del texto.
- Panel con su propio fondo → la imagen puede verse más ahí.
- Espacio vacío → la imagen se ve al máximo.
- Columna de texto vs. columna visual → `linear-gradient(100deg, ...)`; contenido centrado
  → `radial-gradient`; solo uniforme si la sección es realmente simétrica.
Deja un comentario sobre el `background:` diciendo qué lado es texto y cuál vacío.
**Revísalo en móvil**: el texto que en desktop ocupa una columna en móvil ocupa todo el
ancho y puede quedar sobre la parte más clara de la foto.

## 7. Tema claro/oscuro y accesibilidad

- Colores solo por tokens en `:root`, redefinidos para oscuro; `body` con fondo explícito.
- Contraste de texto secundario suficiente (gris sobre negro ~#A3A3A3 como mínimo).
- Objetivos táctiles de al menos 40px de alto.
- `prefers-reduced-motion`: sin animaciones de entrada.

## 8. Verificación (obligatoria antes de dar por terminado)

1. Abrir la página en el navegador (preview) **primero a 375×812** y después a 1280×800.
2. Medir con JS en vez de fiarse del ojo:
   ```js
   const q=s=>[...document.querySelectorAll(s)].map(e=>Math.round(e.getBoundingClientRect().top+scrollY));
   ({ancho: document.documentElement.scrollWidth, alto: document.documentElement.scrollHeight,
     nombres: q('.card-title'), botones: q('.card-cta')})
   ```
   - `scrollWidth` debe ser igual al ancho de la ventana (sin scroll horizontal).
   - Los elementos equivalentes deben dar **el mismo `top`** en desktop.
3. Captura en ambos tamaños y mirar legibilidad de texto sobre imagen.
4. Build/lint limpios si el proyecto los tiene.
5. Publicar solo si Juan lo pide o ya está autorizado; decir exactamente qué se verificó.
