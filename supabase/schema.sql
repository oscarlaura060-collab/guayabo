-- ============================================================
-- GUAYABO · Esquema completo de la base de datos (Supabase / Postgres)
-- ------------------------------------------------------------
-- Reconstruido a partir del modelo de datos de la hoja GUAYABO y del
-- script de migración importar.ts. Pensado para ejecutarse de una sola
-- vez en el SQL Editor de Supabase sobre una base limpia.
--
-- Regenerar tipos de TypeScript tras cualquier cambio aquí:
--   npx supabase gen types typescript --project-id qoxqqkuzhlafhmevqfeb > src/types/database.types.ts
-- (requiere `npx supabase login`; el project-id está en Settings › General)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Tablas
-- ------------------------------------------------------------

-- Perfiles de usuario (ligados a auth.users). El rol gobierna los permisos.
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombre text,
  rol text not null default 'CONSULTA' check (rol in ('ADMINISTRADOR','VENDEDOR','CONSULTA')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Configuración clave/valor (marca, colores, reglas de negocio).
create table if not exists public.config (
  clave text primary key,
  valor text not null default '',
  tipo text,
  grupo text,
  descripcion text,
  activo boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Catálogos configurables: categorías, tallas, colores, métodos de pago,
-- componentes de costo, categorías de gasto y estados (por ámbito).
create table if not exists public.listas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  nombre text not null,
  hex text,
  ambito text,
  es_final boolean not null default false,
  orden int not null default 0,
  activo boolean not null default true,
  constraint listas_unq unique nulls not distinct (tipo, nombre, ambito)
);

-- Campos personalizados por módulo (extensibilidad desde configuración).
create table if not exists public.campos_personalizados (
  id uuid primary key default gen_random_uuid(),
  modulo text,
  clave text,
  etiqueta text,
  tipo text,
  opciones text,
  requerido boolean not null default false,
  orden int not null default 0,
  activo boolean not null default true
);

-- Consecutivos: numeración segura por entidad (GUAYABO-0001, CLI-0001, ...).
create table if not exists public.consecutivos (
  entidad text primary key,
  prefijo text not null,
  digitos int not null default 4,
  siguiente int not null default 1
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  codigo text,
  nombre text not null,
  documento text,
  telefono text,
  whatsapp text,
  email text,
  direccion text,
  ciudad text,
  observaciones text,
  extra jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Una prenda por talla. `costos` guarda el desglose {"Tela":18000,...}; `costo` es la suma.
create table if not exists public.prendas (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  codigo text,
  nombre text not null,
  categoria text,
  descripcion text,
  talla text,
  color text,
  precio numeric not null default 0,
  costo numeric not null default 0,
  costos jsonb not null default '{}'::jsonb,
  stock int not null default 0,
  stock_minimo int not null default 5,
  vendidas int not null default 0,
  imagen_path text,
  observaciones text,
  extra jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ventas y pedidos son la misma entidad, distinguidas por `tipo`.
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  numero text unique,
  tipo text not null default 'VENTA' check (tipo in ('VENTA','PEDIDO')),
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nombre text,
  fecha date not null default current_date,
  fecha_entrega date,
  estado text not null default 'Entregado',
  subtotal numeric not null default 0,
  descuento numeric not null default 0,
  envio numeric not null default 0,
  total numeric not null default 0,
  costo numeric not null default 0,
  utilidad numeric not null default 0,
  pagado numeric not null default 0,
  saldo numeric not null default 0,
  est_pago text not null default 'Pendiente' check (est_pago in ('Pendiente','Abono','Pagado','Reembolsado')),
  canal text,
  observaciones text,
  extra jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  prenda_id uuid references public.prendas(id) on delete set null,
  nombre text,
  talla text,
  color text,
  cantidad int not null default 1,
  precio numeric not null default 0,
  descuento numeric not null default 0,
  total numeric not null default 0,
  costo_unit numeric not null default 0,
  costo_total numeric not null default 0,
  utilidad numeric not null default 0
);

create table if not exists public.apartados (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  codigo text,
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nombre text,
  prenda_id uuid references public.prendas(id) on delete set null,
  prenda_nombre text,
  talla text,
  color text,
  cantidad int not null default 1,
  precio numeric not null default 0,
  total numeric not null default 0,
  costo numeric not null default 0,
  fecha date,
  fecha_limite date,
  abonado numeric not null default 0,
  saldo numeric not null default 0,
  estado text not null default 'Activo',
  observaciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  codigo text,
  pedido_id uuid references public.pedidos(id) on delete cascade,
  apartado_id uuid references public.apartados(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nombre text,
  fecha date not null default current_date,
  valor numeric not null default 0,
  metodo text,
  tipo_pago text,
  comprobante_path text,
  observaciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  codigo text,
  fecha date not null default current_date,
  categoria text,
  descripcion text,
  valor numeric not null default 0,
  metodo text,
  observaciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  prenda_id uuid references public.prendas(id) on delete set null,
  prenda_nombre text,
  tipo text not null default 'AJUSTE' check (tipo in ('ENTRADA','SALIDA','AJUSTE')),
  cantidad int not null default 0,
  stock_anterior int not null default 0,
  stock_nuevo int not null default 0,
  referencia text,
  nota text,
  usuario_email text,
  created_at timestamptz not null default now()
);

-- Tarifa de envío por ciudad (se suma en el carrito de la vitrina).
create table if not exists public.envios (
  id uuid primary key default gen_random_uuid(),
  ciudad text not null,
  precio numeric not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pedidos hechos desde la vitrina (carrito). El equipo los confirma en el panel.
-- envio/total son la "fotografía" calculada en el servidor al enviarse.
create table if not exists public.solicitudes_web (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  codigo text,
  cliente_nombre text,
  cedula text,
  telefono text,
  email text,
  ciudad text,
  direccion text,
  items jsonb not null default '[]'::jsonb,
  envio numeric not null default 0,
  total numeric not null default 0,
  estado text not null default 'Nueva',
  notas text,
  venta_id uuid references public.pedidos(id) on delete set null
);

create index if not exists idx_pedidos_cliente on public.pedidos(cliente_id);
create index if not exists idx_pedidos_fecha on public.pedidos(fecha);
create index if not exists idx_pedidos_tipo on public.pedidos(tipo);
create index if not exists idx_pedido_items_pedido on public.pedido_items(pedido_id);
create index if not exists idx_pedido_items_prenda on public.pedido_items(prenda_id);
create index if not exists idx_pagos_pedido on public.pagos(pedido_id);
create index if not exists idx_pagos_apartado on public.pagos(apartado_id);
create index if not exists idx_apartados_cliente on public.apartados(cliente_id);
create index if not exists idx_mov_prenda on public.movimientos_inventario(prenda_id);
create index if not exists idx_prendas_categoria on public.prendas(categoria);
create index if not exists idx_listas_tipo on public.listas(tipo);

-- ------------------------------------------------------------
-- 2. Funciones y triggers
-- ------------------------------------------------------------

create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_config_touch on public.config;
create trigger trg_config_touch before update on public.config
for each row execute function public.tg_touch_updated_at();

-- Siguiente consecutivo (GUAYABO-0001) de forma segura.
create or replace function public.siguiente_consecutivo(p_entidad text)
returns text language plpgsql security definer set search_path = public as $$
declare v_prefijo text; v_digitos int; v_num int;
begin
  update public.consecutivos set siguiente = siguiente + 1
   where entidad = p_entidad
  returning prefijo, digitos, siguiente - 1 into v_prefijo, v_digitos, v_num;
  if not found then
    raise exception 'Consecutivo no configurado para la entidad %', p_entidad;
  end if;
  return v_prefijo || '-' || lpad(v_num::text, v_digitos, '0');
end $$;

-- Recalcula pagado/saldo/est_pago de un pedido a partir de sus pagos activos.
create or replace function public.recalcular_pago_pedido(p_pedido uuid)
returns void language plpgsql as $$
declare v_total numeric; v_pagado numeric;
begin
  if p_pedido is null then return; end if;
  select total into v_total from public.pedidos where id = p_pedido;
  select coalesce(sum(valor),0) into v_pagado from public.pagos where pedido_id = p_pedido and activo = true;
  update public.pedidos
     set pagado = v_pagado,
         saldo = greatest(v_total - v_pagado, 0),
         est_pago = case when v_pagado <= 0 then 'Pendiente'
                         when v_pagado < v_total then 'Abono'
                         else 'Pagado' end
   where id = p_pedido and est_pago <> 'Reembolsado';
end $$;

create or replace function public.tg_pagos_recalcula()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_pago_pedido(old.pedido_id);
    return old;
  end if;
  perform public.recalcular_pago_pedido(new.pedido_id);
  if tg_op = 'UPDATE' and new.pedido_id is distinct from old.pedido_id then
    perform public.recalcular_pago_pedido(old.pedido_id);
  end if;
  return new;
end $$;

drop trigger if exists trg_pagos_recalcula on public.pagos;
create trigger trg_pagos_recalcula
after insert or update or delete on public.pagos
for each row execute function public.tg_pagos_recalcula();

-- crear_venta: crea pedido + líneas, descuenta stock, registra pago. En una sola transacción.
-- El frontend llama a esta función, no hace inserts sueltos.
create or replace function public.crear_venta(p_pedido jsonb, p_items jsonb, p_pago jsonb default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_pedido_id uuid;
  v_numero text;
  v_tipo text := coalesce(p_pedido->>'tipo', 'VENTA');
  v_item jsonb;
  v_prenda public.prendas;
  v_cant int;
  v_stock_neg boolean;
  v_bajo_pedido boolean;
  v_subtotal numeric := 0;
  v_costo numeric := 0;
  v_descuento numeric := coalesce((p_pedido->>'descuento')::numeric, 0);
  v_envio numeric := coalesce((p_pedido->>'envio')::numeric, 0);
  v_total numeric;
begin
  v_stock_neg   := coalesce((select valor from public.config where clave = 'PERMITIR_STOCK_NEGATIVO'), 'FALSE') = 'TRUE';
  v_bajo_pedido := coalesce((select valor from public.config where clave = 'VENTA_BAJO_PEDIDO'), 'FALSE') = 'TRUE';

  v_numero := public.siguiente_consecutivo('PEDIDO');

  insert into public.pedidos (numero, tipo, cliente_id, cliente_nombre, fecha, fecha_entrega,
    estado, descuento, envio, canal, observaciones)
  values (
    v_numero, v_tipo,
    nullif(p_pedido->>'cliente_id','')::uuid,
    p_pedido->>'cliente_nombre',
    coalesce((p_pedido->>'fecha')::date, current_date),
    nullif(p_pedido->>'fecha_entrega','')::date,
    coalesce(p_pedido->>'estado', case when v_tipo = 'PEDIDO'
      then coalesce((select valor from public.config where clave='ESTADO_INICIAL_PEDIDO'),'Pedido recibido')
      else coalesce((select valor from public.config where clave='ESTADO_INICIAL_VENTA'),'Entregado') end),
    v_descuento, v_envio, p_pedido->>'canal', p_pedido->>'observaciones'
  ) returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_cant := coalesce((v_item->>'cantidad')::int, 1);

    if (v_item->>'prenda_id') is not null and (v_item->>'prenda_id') <> '' then
      select * into v_prenda from public.prendas where id = (v_item->>'prenda_id')::uuid for update;
      if found then
        if v_prenda.stock < v_cant and not v_stock_neg and not v_bajo_pedido then
          raise exception 'Stock insuficiente para % (disponible %, pedido %)', v_prenda.nombre, v_prenda.stock, v_cant;
        end if;
        update public.prendas set stock = stock - v_cant, vendidas = vendidas + v_cant where id = v_prenda.id;
        insert into public.movimientos_inventario (prenda_id, prenda_nombre, tipo, cantidad, stock_anterior, stock_nuevo, referencia)
        values (v_prenda.id, v_prenda.nombre, 'SALIDA', v_cant, v_prenda.stock, v_prenda.stock - v_cant, 'Venta ' || v_numero);
      end if;
    end if;

    insert into public.pedido_items (pedido_id, prenda_id, nombre, talla, color, cantidad, precio, descuento, total, costo_unit, costo_total, utilidad)
    values (
      v_pedido_id,
      nullif(v_item->>'prenda_id','')::uuid,
      v_item->>'nombre', v_item->>'talla', v_item->>'color',
      v_cant,
      coalesce((v_item->>'precio')::numeric, 0),
      coalesce((v_item->>'descuento')::numeric, 0),
      coalesce((v_item->>'precio')::numeric,0) * v_cant - coalesce((v_item->>'descuento')::numeric,0),
      coalesce((v_item->>'costo_unit')::numeric, 0),
      coalesce((v_item->>'costo_unit')::numeric, 0) * v_cant,
      (coalesce((v_item->>'precio')::numeric,0) * v_cant - coalesce((v_item->>'descuento')::numeric,0)) - coalesce((v_item->>'costo_unit')::numeric,0) * v_cant
    );

    v_subtotal := v_subtotal + coalesce((v_item->>'precio')::numeric,0) * v_cant - coalesce((v_item->>'descuento')::numeric,0);
    v_costo := v_costo + coalesce((v_item->>'costo_unit')::numeric,0) * v_cant;
  end loop;

  v_total := v_subtotal - v_descuento + v_envio;

  update public.pedidos
     set subtotal = v_subtotal, costo = v_costo, total = v_total,
         utilidad = (v_subtotal - v_descuento) - v_costo, saldo = v_total
   where id = v_pedido_id;

  if p_pago is not null and coalesce((p_pago->>'valor')::numeric, 0) > 0 then
    insert into public.pagos (codigo, pedido_id, cliente_id, cliente_nombre, fecha, valor, metodo, tipo_pago, observaciones)
    values (
      public.siguiente_consecutivo('PAGO'),
      v_pedido_id,
      nullif(p_pedido->>'cliente_id','')::uuid,
      p_pedido->>'cliente_nombre',
      coalesce((p_pago->>'fecha')::date, current_date),
      (p_pago->>'valor')::numeric,
      p_pago->>'metodo',
      coalesce(p_pago->>'tipo_pago', 'ABONO'),
      p_pago->>'observaciones'
    );
  end if;

  return v_pedido_id;
end $$;

-- Al registrarse un usuario en Auth, crear su perfil inactivo (CONSULTA).
-- Un ADMINISTRADOR lo activa y le asigna rol desde Configuración.
create or replace function public.tg_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, email, nombre, rol, activo)
  values (new.id, new.email, split_part(coalesce(new.email,''),'@',1), 'CONSULTA', false)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_nuevo_usuario on auth.users;
create trigger trg_nuevo_usuario after insert on auth.users
for each row execute function public.tg_nuevo_usuario();

-- ------------------------------------------------------------
-- 3. Vistas para el dashboard
-- ------------------------------------------------------------

create or replace view public.ventas_por_dia as
select fecha, count(*) as pedidos, sum(total) as ventas, sum(costo) as costo,
       sum(utilidad) as utilidad, sum(pagado) as recibido, sum(saldo) as por_cobrar
from public.pedidos where activo = true and estado <> 'Cancelado'
group by fecha order by fecha;

create or replace view public.ventas_por_mes as
select to_char(date_trunc('month', fecha), 'YYYY-MM') as mes,
       count(*) as pedidos, sum(total) as ventas, sum(costo) as costo,
       sum(utilidad) as utilidad, sum(pagado) as recibido, sum(saldo) as por_cobrar
from public.pedidos where activo = true and estado <> 'Cancelado'
group by date_trunc('month', fecha) order by 1;

create or replace view public.top_prendas as
select pr.id, pr.nombre, pr.categoria, pr.talla, pr.color,
       coalesce(sum(pi.cantidad),0) as unidades,
       coalesce(sum(pi.total),0) as ventas,
       coalesce(sum(pi.utilidad),0) as utilidad
from public.prendas pr
left join public.pedido_items pi on pi.prenda_id = pr.id
left join public.pedidos pe on pe.id = pi.pedido_id and pe.activo = true and pe.estado <> 'Cancelado'
group by pr.id, pr.nombre, pr.categoria, pr.talla, pr.color
order by unidades desc;

-- Vistas PÚBLICAS de la vitrina. Son SECURITY DEFINER a propósito: exponen solo
-- columnas seguras para que el rol anónimo lea el catálogo sin poder acceder a
-- la tabla `prendas` (que incluye costos). El linter las marca; es intencional.
create or replace view public.catalogo_publico as
select id, nombre, categoria, talla, color, precio, stock, stock_minimo,
       descripcion, composicion, medidas, imagen_path, extra, destacado,
       vendidas, created_at
from public.prendas where activo = true;

create or replace view public.apartados_activos_publico as
select prenda_id, sum(cantidad)::integer as reservado
from public.apartados
where activo = true and estado not in ('Entregado','Cancelado') and prenda_id is not null
group by prenda_id;

grant select on public.catalogo_publico to anon, authenticated;
grant select on public.apartados_activos_publico to anon, authenticated;

-- ------------------------------------------------------------
-- 4. Row Level Security
--   ADMINISTRADOR: todo.  VENDEDOR: ventas/pedidos/clientes/pagos/inventario.
--   CONSULTA: solo lectura.  config y listas: lectura pública (para tematizar).
-- ------------------------------------------------------------

create or replace function public.perfil_activo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles p where p.id = auth.uid() and p.activo = true);
$$;

create or replace function public.rol_actual()
returns text language sql stable security definer set search_path = public as $$
  select p.rol from public.perfiles p where p.id = auth.uid() and p.activo = true;
$$;

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.rol_actual() = 'ADMINISTRADOR';
$$;

create or replace function public.puede_escribir()
returns boolean language sql stable security definer set search_path = public as $$
  select public.rol_actual() in ('ADMINISTRADOR','VENDEDOR');
$$;

alter table public.perfiles enable row level security;
alter table public.config enable row level security;
alter table public.listas enable row level security;
alter table public.campos_personalizados enable row level security;
alter table public.consecutivos enable row level security;
alter table public.clientes enable row level security;
alter table public.prendas enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.apartados enable row level security;
alter table public.pagos enable row level security;
alter table public.gastos enable row level security;
alter table public.movimientos_inventario enable row level security;

-- Perfiles: cada quien ve el suyo; el admin gestiona todos.
drop policy if exists perfiles_sel on public.perfiles;
create policy perfiles_sel on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_admin());
drop policy if exists perfiles_all_admin on public.perfiles;
create policy perfiles_all_admin on public.perfiles for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- config y listas: lectura pública (necesaria para el login y el tema).
drop policy if exists config_sel on public.config;
create policy config_sel on public.config for select to anon, authenticated using (true);
drop policy if exists listas_sel on public.listas;
create policy listas_sel on public.listas for select to anon, authenticated using (true);

-- Lectura general para perfiles activos sobre el resto de tablas.
do $$
declare t text;
begin
  foreach t in array array['campos_personalizados','consecutivos','clientes','prendas','pedidos','pedido_items','apartados','pagos','gastos','movimientos_inventario']
  loop
    execute format('drop policy if exists %I_sel on public.%I;', t, t);
    execute format('create policy %I_sel on public.%I for select to authenticated using (public.perfil_activo());', t, t);
  end loop;
end $$;

-- Escritura operativa (ADMINISTRADOR + VENDEDOR).
do $$
declare t text;
begin
  foreach t in array array['clientes','prendas','pedidos','pedido_items','apartados','pagos','movimientos_inventario','consecutivos']
  loop
    execute format('drop policy if exists %I_ins on public.%I;', t, t);
    execute format('drop policy if exists %I_upd on public.%I;', t, t);
    execute format('drop policy if exists %I_del on public.%I;', t, t);
    execute format('create policy %I_ins on public.%I for insert to authenticated with check (public.puede_escribir());', t, t);
    execute format('create policy %I_upd on public.%I for update to authenticated using (public.puede_escribir()) with check (public.puede_escribir());', t, t);
    execute format('create policy %I_del on public.%I for delete to authenticated using (public.puede_escribir());', t, t);
  end loop;
end $$;

-- Escritura solo ADMINISTRADOR (config, listas, campos, gastos).
do $$
declare t text;
begin
  foreach t in array array['config','listas','campos_personalizados','gastos']
  loop
    execute format('drop policy if exists %I_ins on public.%I;', t, t);
    execute format('drop policy if exists %I_upd on public.%I;', t, t);
    execute format('drop policy if exists %I_del on public.%I;', t, t);
    execute format('create policy %I_ins on public.%I for insert to authenticated with check (public.es_admin());', t, t);
    execute format('create policy %I_upd on public.%I for update to authenticated using (public.es_admin()) with check (public.es_admin());', t, t);
    execute format('create policy %I_del on public.%I for delete to authenticated using (public.es_admin());', t, t);
  end loop;
end $$;

-- Envíos: la vitrina (anon) solo ve ciudades activas; solo el admin escribe.
alter table public.envios enable row level security;
drop policy if exists envios_sel_anon on public.envios;
create policy envios_sel_anon on public.envios for select to anon using (activo = true);
drop policy if exists envios_sel_auth on public.envios;
create policy envios_sel_auth on public.envios for select to authenticated using (public.perfil_activo());
drop policy if exists envios_ins on public.envios;
create policy envios_ins on public.envios for insert to authenticated with check (public.es_admin());
drop policy if exists envios_upd on public.envios;
create policy envios_upd on public.envios for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists envios_del on public.envios;
create policy envios_del on public.envios for delete to authenticated using (public.es_admin());

-- Solicitudes web: cualquiera (anon) puede CREAR su pedido; solo el staff las
-- lee/edita. Nunca se expone la lista de solicitudes al público.
alter table public.solicitudes_web enable row level security;
drop policy if exists solicitudes_sel on public.solicitudes_web;
create policy solicitudes_sel on public.solicitudes_web for select to authenticated using (public.perfil_activo());
drop policy if exists solicitudes_ins_anon on public.solicitudes_web;
create policy solicitudes_ins_anon on public.solicitudes_web for insert to anon with check (true);
drop policy if exists solicitudes_ins_auth on public.solicitudes_web;
create policy solicitudes_ins_auth on public.solicitudes_web for insert to authenticated with check (true);
drop policy if exists solicitudes_upd on public.solicitudes_web;
create policy solicitudes_upd on public.solicitudes_web for update to authenticated using (public.puede_escribir()) with check (public.puede_escribir());
drop policy if exists solicitudes_del on public.solicitudes_web;
create policy solicitudes_del on public.solicitudes_web for delete to authenticated using (public.es_admin());

-- ------------------------------------------------------------
-- 5. Storage (buckets + políticas)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('prendas','prendas', true), ('comprobantes','comprobantes', false)
on conflict (id) do nothing;

drop policy if exists prendas_read on storage.objects;
create policy prendas_read on storage.objects for select using (bucket_id = 'prendas');
drop policy if exists prendas_write on storage.objects;
create policy prendas_write on storage.objects for insert to authenticated with check (bucket_id = 'prendas' and public.puede_escribir());
drop policy if exists prendas_update on storage.objects;
create policy prendas_update on storage.objects for update to authenticated using (bucket_id = 'prendas' and public.puede_escribir());
drop policy if exists prendas_delete on storage.objects;
create policy prendas_delete on storage.objects for delete to authenticated using (bucket_id = 'prendas' and public.puede_escribir());

drop policy if exists comprobantes_read on storage.objects;
create policy comprobantes_read on storage.objects for select to authenticated using (bucket_id = 'comprobantes' and public.perfil_activo());
drop policy if exists comprobantes_write on storage.objects;
create policy comprobantes_write on storage.objects for insert to authenticated with check (bucket_id = 'comprobantes' and public.puede_escribir());
drop policy if exists comprobantes_update on storage.objects;
create policy comprobantes_update on storage.objects for update to authenticated using (bucket_id = 'comprobantes' and public.puede_escribir());
drop policy if exists comprobantes_delete on storage.objects;
create policy comprobantes_delete on storage.objects for delete to authenticated using (bucket_id = 'comprobantes' and public.puede_escribir());

-- ------------------------------------------------------------
-- 6. Semillas mínimas (config, catálogos y consecutivos)
--    Ver supabase/seed.sql para los valores iniciales de la marca GUAYABO.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 7. Endurecimiento de seguridad (se ejecuta al final: los predicados de la
--    sección 4 ya existen). Equivale a supabase/migrations/0002_endurecer_seguridad.sql
-- ------------------------------------------------------------

-- Guard de rol en RPCs SECURITY DEFINER (saltan RLS): un CONSULTA no escribe.
create or replace function public.siguiente_consecutivo(p_entidad text)
returns text language plpgsql security definer set search_path = public as $$
declare v_prefijo text; v_digitos int; v_num int;
begin
  if not public.puede_escribir() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  update public.consecutivos set siguiente = siguiente + 1
   where entidad = p_entidad
  returning prefijo, digitos, siguiente - 1 into v_prefijo, v_digitos, v_num;
  if not found then
    raise exception 'Consecutivo no configurado para la entidad %', p_entidad;
  end if;
  return v_prefijo || '-' || lpad(v_num::text, v_digitos, '0');
end $$;

-- crear_venta: se añade el guard tras 'begin' (el cuerpo completo está arriba).
do $$
begin
  execute replace(
    pg_get_functiondef('public.crear_venta(jsonb,jsonb,jsonb)'::regprocedure),
    E'begin\n',
    E'begin\n  if not public.puede_escribir() then raise exception ''No autorizado'' using errcode = ''42501''; end if;\n'
  );
exception when others then null;
end $$;

-- Vistas financieras: respetan RLS; sin acceso anónimo.
alter view public.ventas_por_dia set (security_invoker = on);
alter view public.ventas_por_mes set (security_invoker = on);
alter view public.top_prendas   set (security_invoker = on);
revoke all on public.ventas_por_dia from anon;
revoke all on public.ventas_por_mes from anon;
revoke all on public.top_prendas   from anon;
grant select on public.ventas_por_dia to authenticated;
grant select on public.ventas_por_mes to authenticated;
grant select on public.top_prendas   to authenticated;

-- RPCs sensibles: sin ejecución anónima.
revoke execute on function public.crear_venta(jsonb,jsonb,jsonb) from anon, public;
grant  execute on function public.crear_venta(jsonb,jsonb,jsonb) to authenticated;
revoke execute on function public.siguiente_consecutivo(text) from anon, public;
grant  execute on function public.siguiente_consecutivo(text) to authenticated;

-- Predicados de RLS: solo 'authenticated'.
do $$
declare r record;
begin
  for r in select oid::regprocedure as sig from pg_proc where pronamespace='public'::regnamespace
           and proname in ('es_admin','perfil_activo','puede_escribir','rol_actual')
  loop
    execute format('revoke execute on function %s from anon, public', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- Funciones internas/de trigger: sin ejecución por RPC.
do $$
declare r record;
begin
  for r in select oid::regprocedure as sig from pg_proc where pronamespace='public'::regnamespace
           and proname in ('tg_nuevo_usuario','tg_touch_updated_at','tg_pagos_recalcula',
                           'tg_apartados_disponible','recalcular_pago_pedido','rls_auto_enable')
  loop
    execute format('revoke execute on function %s from anon, authenticated, public', r.sig);
  end loop;
end $$;
