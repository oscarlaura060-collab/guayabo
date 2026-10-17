-- Prendas que un cliente pidió/encargó (restock o hechura a pedido), para verlas
-- en Inventario y saber qué mandar a hacer con Cristina.

alter table public.prendas add column if not exists solicitada boolean not null default false;
alter table public.prendas add column if not exists solicitada_nota text;
