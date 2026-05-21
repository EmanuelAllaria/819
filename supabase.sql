-- ====================================================================
-- 1. EXTENSIONES Y LIMPIEZA (Opcional)
-- ====================================================================
create extension if not exists "uuid-ossp";

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
create table public.wholesalers (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    company_name text,
    description text, -- Máximo 100 caracteres sugerido en UI
    logo_url text,
    country text,
    state_province text,
    category text, -- F1 a F5 (Tecnología, Ropa, Alimentos, etc.)
    whatsapp text,
    instagram text,
    facebook text,
    website text,
    is_verified boolean default false not null, -- Palomita azul
    has_active_promo boolean default false not null, -- Banners contratados
    access_granted_at timestamp with time zone, -- Cuándo el admin dio acceso
    access_expires_at timestamp with time zone, -- Cuenta regresiva de 30 días
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Catálogos (Hasta 5 imágenes por mayorista)
create table public.catalogs (
    id uuid default gen_random_uuid() primary key,
    wholesaler_id uuid references public.wholesalers(id) on delete cascade not null,
    image_url text not null,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Banners Publicitarios (Subidos por Admin para App 1)
create table public.banners (
    id uuid default gen_random_uuid() primary key,
    image_url text not null,
    redirect_url text,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Favoritos (Corazones de App 1)
create table public.saved_wholesalers (
    id uuid default gen_random_uuid() primary key,
    buyer_id uuid references public.buyers(id) on delete cascade not null,
    wholesaler_id uuid references public.wholesalers(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(buyer_id, wholesaler_id)
);

-- Tabla de Configuración / Panel Admin (Tokens de acceso)
create table public.admin_tokens (
    id uuid default gen_random_uuid() primary key,
    token_value text unique not null, -- Min 9, Max 15 caracteres validado en UI
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create or replace function public.grant_wholesaler_access(wholesaler_id uuid)
returns void
language sql
as $$
  update public.wholesalers
  set
    access_granted_at = timezone('utc'::text, now()),
    access_expires_at = timezone('utc'::text, now()) + interval '30 days'
  where id = wholesaler_id;
$$;

-- ====================================================================
-- 3. SISTEMA DE MÉTRICAS (Clicks en Perfil y WhatsApp)
-- ====================================================================

create table public.analytics_clicks (
    id uuid default gen_random_uuid() primary key,
    wholesaler_id uuid references public.wholesalers(id) on delete cascade not null,
    click_type text check (click_type in ('profile', 'whatsapp')) not null,
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
alter table public.wholesalers disable row level security;
alter table public.catalogs disable row level security;
alter table public.banners disable row level security;
alter table public.saved_wholesalers disable row level security;
alter table public.admin_tokens disable row level security;
alter table public.analytics_clicks disable row level security;
