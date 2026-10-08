-- Quién confecciona cada prenda (p. ej. Cristina), para rastrear en Inventario
-- las prendas mandadas a hacer con cada persona.

alter table public.prendas add column if not exists hecho_por text;

-- Catálogo configurable de confeccionistas (editable desde Configuración).
insert into public.listas (tipo, nombre, orden, activo)
values ('CONFECCION','Cristina',1,true)
on conflict on constraint listas_unq do nothing;
