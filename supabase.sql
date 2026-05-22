-- ====================================================================
-- 1. EXTENSIONES Y LIMPIEZA (Opcional)
-- ====================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ====================================================================
-- 2. TABLAS PRINCIPALES
-- ====================================================================

-- Tabla de Compradores (Clientes finales)
create table public.buyers (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Mayoristas (Perfiles Empresariales)
create table public.wholesaler_profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    nombre text,
    descripcion text, -- Máximo 100 caracteres sugerido en UI
    foto_perfil_url text,
    pais text,
    estado_provincia text,
    categoria text, -- 10 categorías fijas de App 1
    whatsapp text,
    instagram text,
    facebook text,
    web text,
    acceso boolean default false not null, -- Activar/Denegar
    fecha_aprobacion timestamp with time zone, -- Inicia cuenta regresiva de 30 días
    verificado boolean default false not null, -- Palomita azul
    promo_activa boolean default false not null, -- Banner contratado
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Catálogos (Hasta 5 imágenes por mayorista)
create table public.catalogs (
    id uuid default gen_random_uuid() primary key,
    wholesaler_id uuid references public.wholesaler_profiles(id) on delete cascade not null,
    image_url text not null,
    carousel_slot integer default 1 not null check (carousel_slot between 1 and 5),
    display_order integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Banners Publicitarios (Subidos por Admin para App 1)
create table public.banners (
    id uuid default gen_random_uuid() primary key,
    url_imagen text not null,
    link_destino text,
    orden integer default 0 not null,
    activo boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Favoritos (Corazones de App 1)
create table public.saved_wholesalers (
    id uuid default gen_random_uuid() primary key,
    buyer_id uuid references public.buyers(id) on delete cascade not null,
    wholesaler_id uuid references public.wholesaler_profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(buyer_id, wholesaler_id)
);

-- Tabla de Configuración / Panel Admin (Tokens de acceso)
create table public.admin_tokens (
    id uuid default gen_random_uuid() primary key,
    token_value text unique not null, -- Min 9, Max 15 caracteres validado en UI
    description text,
    is_active boolean default true not null,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.grant_wholesaler_access(wholesaler_id uuid)
returns void
language sql
as $$
  update public.wholesaler_profiles
  set
    acceso = true,
    fecha_aprobacion = timezone('utc'::text, now())
  where id = wholesaler_id;
$$;

-- ====================================================================
-- 3. SISTEMA DE MÉTRICAS (Clicks en Perfil y WhatsApp)
-- ====================================================================

create table public.metrics (
    id uuid default gen_random_uuid() primary key,
    wholesaler_id uuid references public.wholesaler_profiles(id) on delete cascade not null,
    clicks_perfil integer default 0 not null,
    clicks_whatsapp integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 4. CONFIGURACIÓN DE STORAGE (Buckets de Almacenamiento)
-- ====================================================================
-- Nota: Supabase maneja los buckets en la tabla storage.buckets

insert into storage.buckets (id, name, public) 
values 
  ('banners', 'banners', true),
  ('profiles', 'profiles', true),
  ('catalogs', 'catalogs', true)
on conflict (id) do nothing;

-- Políticas Públicas de lectura para los archivos subidos
create policy "Banners públicos" on storage.objects for select using (bucket_id = 'banners');
create policy "Perfiles públicos" on storage.objects for select using (bucket_id = 'profiles');
create policy "Catálogos públicos" on storage.objects for select using (bucket_id = 'catalogs');

-- Permitir inserts/updates (Para simplificar desarrollo inicial sin RLS estricto en storage)
create policy "Permitir subidas" on storage.objects for insert with check (true);
create policy "Permitir cambios" on storage.objects for update with check (true);

-- ====================================================================
-- 5. SEGURIDAD RLS (Row Level Security) - Deshabilitado temporalmente para agilizar entrega
-- ====================================================================
alter table public.buyers disable row level security;
alter table public.wholesaler_profiles disable row level security;
alter table public.catalogs disable row level security;
alter table public.banners disable row level security;
alter table public.saved_wholesalers disable row level security;
alter table public.admin_tokens disable row level security;
alter table public.metrics disable row level security;
