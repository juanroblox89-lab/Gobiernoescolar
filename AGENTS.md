# Gobierno Escolar 2026 — guía para agentes

Sitio del gobierno escolar de la I.E.E.N.S.S.M: portada + 3 áreas (Personería,
Contraloría, PFC), cada una con inicio, "infórmate"/propuestas/informes y **buzón**.
HTML/CSS/JS estático, sin build. Datos y login de admins en Supabase.

**El 99 % de las visitas son desde celular.** Todo se diseña y se prueba primero a 375px.

## Estilo de UI (obligatorio)

Sigue `.claude/skills/compact-ui/SKILL.md`: compacto, minimalista y parejo. Léelo antes de
tocar cualquier HTML/CSS. Resumen: poco aire, sin decoración que no sirva, elementos
equivalentes alineados (subgrid), formularios primero en celular con campos de 16px.

## Estructura

```
site/index.html              portada (estilos dentro del <style>)
site/css/ui.css              capa compartida por las 3 áreas: movimiento, modo admin,
                             y la legibilidad del buzón. Se carga DESPUÉS del CSS del área.
site/js/supabase.js          cliente único de Supabase (llave anon pública; seguridad = RLS)
site/js/ui.js, admin-inline.js, datos.js   comportamiento compartido
site/<area>/index.html, buzon.html, ...     páginas de cada área
site/<area>/css/*.css        estilo propio de cada área (colores/tipos)
site/admin/                  panel de administración
supabase/migrations/*.sql    esquema y RLS
scripts/                     servir.mjs (local), dbq.mjs (SQL), probar-rls.mjs, importar.mjs
```

Cada `<body>` lleva `data-area="personeria|contraloria|pfc"`; los tokens `--ui-*` de
`ui.css` cambian por área (PFC es tema oscuro). Para un cambio que afecte a las 3 áreas,
hazlo una vez en `ui.css` con esos tokens en vez de repetirlo en los 3 CSS.

## Probar en local

```bash
node scripts/servir.mjs 5930
```

Abre http://localhost:5930 (URLs limpias como en producción: `/personeria/buzon`).
Revisa a 375×812 y 1280×800: sin scroll horizontal (`scrollWidth === innerWidth`),
elementos equivalentes con el mismo `top`.

## Publicar

`git push` a `main` → Vercel despliega solo (`vercel.json` reescribe `/` a `/site/`).
No subir `.env`, `_migracion/` ni credenciales (ya están en `.gitignore`).

## Reglas

- Imágenes en `site/assets/images/` (hoy faltan varias: logos y `buzon-per.png`); todo
  debe verse bien aunque no carguen.
- Sin emojis nuevos como iconos; usa SVG.
- Commits pequeños y descriptivos en español.
