-- Norato foundation schema. Run through Supabase migrations.
-- Service-role access is server-only; public customer/order writes will use API routes.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_cop integer not null check (price_cop >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_cop integer not null default 0 check (total_cop >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  variant_name_snapshot text not null,
  unit_price_cop integer not null check (unit_price_cop >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public catalog reads only. Admin mutations will be server-side and role-checked.
drop policy if exists "public can read active products" on public.products;
create policy "public can read active products" on public.products for select to anon, authenticated using (is_active = true);
drop policy if exists "public can read active variants" on public.product_variants;
create policy "public can read active variants" on public.product_variants for select to anon, authenticated using (is_active = true);

-- No direct public access to customers, orders, order items or profiles.
-- API routes will authenticate/validate input and use the server-only service role.
