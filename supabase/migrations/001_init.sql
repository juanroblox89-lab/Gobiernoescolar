-- Gobierno Escolar — esquema inicial (migración desde Firestore).
-- Cada área (personería, contraloría, PFC) tiene sus admins; todo es de lectura pública
-- y solo el admin de un área puede escribir filas de esa área.

-- ─── ÁREAS (perfil del representante) ─────────────────────────────────────────
create table public.areas (
  id          text primary key check (id in ('personeria', 'contraloria', 'pfc')),
  nombre      text not null default '',
  cargo       text not null default '',
  slogan      text not null default '',
  objetivo    text not null default '',
  institucion text not null default '',
  anio        text not null default '',
  foto_url    text not null default '',
  whatsapp    text not null default '',
  instagram   text not null default '',
  buzon_url   text not null default '',
  color       text not null default '',
  equipo      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ─── ADMINS ───────────────────────────────────────────────────────────────────
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  area       text not null references public.areas (id),
  created_at timestamptz not null default now()
);

create or replace function public.is_area_admin(a text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid()) and area = a
  );
$$;

-- ─── CONTENIDO ────────────────────────────────────────────────────────────────
create table public.noticias (
  id         bigint generated always as identity primary key,
  area       text not null references public.areas (id),
  titulo     text not null,
  fecha      date not null default current_date,
  categoria  text not null default 'info' check (categoria in ('anuncio', 'logro', 'evento', 'info')),
  resumen    text not null default '',
  foto_url   text not null default '',
  created_at timestamptz not null default now()
);

create table public.actividades (
  id          bigint generated always as identity primary key,
  area        text not null references public.areas (id),
  titulo      text not null,
  fecha       date not null default current_date,
  descripcion text not null default '',
  foto_url    text not null default '',
  created_at  timestamptz not null default now()
);

create table public.eventos (
  id          bigint generated always as identity primary key,
  area        text not null references public.areas (id),
  titulo      text not null,
  fecha       date not null,
  descripcion text not null default '',
  created_at  timestamptz not null default now()
);

create table public.documentos (
  id          bigint generated always as identity primary key,
  area        text not null references public.areas (id),
  titulo      text not null,
  descripcion text not null default '',
  tipo        text not null default 'pdf',
  icono       text not null default '📄',
  url         text not null default '',
  orden       int  not null default 0,
  created_at  timestamptz not null default now()
);

create table public.informes (
  id          bigint generated always as identity primary key,
  area        text not null references public.areas (id),
  titulo      text not null,
  periodo     text not null default '',
  fecha       date not null default current_date,
  resumen     text not null default '',
  logros      text[] not null default '{}',
  pendientes  text[] not null default '{}',
  archivo_url text not null default '',
  created_at  timestamptz not null default now()
);

create table public.propuestas (
  id          bigint generated always as identity primary key,
  area        text not null references public.areas (id),
  numero      int  not null default 0,
  titulo      text not null,
  descripcion text not null default '',
  categoria   text not null default 'participacion',
  estado      text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'cumplida')),
  created_at  timestamptz not null default now()
);

create table public.avisos (
  id         bigint generated always as identity primary key,
  area       text not null references public.areas (id),
  titulo     text not null,
  texto      text not null default '',
  fecha      date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.semaforo (
  area        text primary key references public.areas (id),
  verde       text[] not null default '{}',
  amarillo    text[] not null default '{}',
  rojo        text[] not null default '{}',
  actualizado date not null default current_date
);

create index on public.noticias (area, fecha desc);
create index on public.actividades (area, fecha desc);
create index on public.eventos (area, fecha);
create index on public.documentos (area, orden);
create index on public.informes (area, fecha desc);
create index on public.propuestas (area, numero);
create index on public.avisos (area, fecha desc);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.areas enable row level security;
alter table public.admins enable row level security;

create policy "areas: lectura pública" on public.areas for select to anon, authenticated using (true);
create policy "areas: admin edita la suya" on public.areas for update to authenticated
  using (public.is_area_admin(id)) with check (public.is_area_admin(id));

create policy "admins: cada quien ve su fila" on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['noticias', 'actividades', 'eventos', 'documentos', 'informes', 'propuestas', 'avisos', 'semaforo'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: lectura pública" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s: admin inserta" on public.%I for insert to authenticated with check (public.is_area_admin(area))', t, t);
    execute format('create policy "%s: admin edita" on public.%I for update to authenticated using (public.is_area_admin(area)) with check (public.is_area_admin(area))', t, t);
    execute format('create policy "%s: admin borra" on public.%I for delete to authenticated using (public.is_area_admin(area))', t, t);
  end loop;
end $$;

-- ─── STORAGE: bucket público "media", carpeta = área ──────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

create policy "media: admin sube a su área" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_area_admin((storage.foldername(name))[1]));
create policy "media: admin reemplaza en su área" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_area_admin((storage.foldername(name))[1]));
create policy "media: admin borra en su área" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_area_admin((storage.foldername(name))[1]));
