-- ============================================================
-- 0005 · Canal de venta + usuario/@ por venta
-- Aplicada en producción. No destruye datos.
-- ============================================================

-- Usuario/@ de la persona por venta (para buscarla rápido).
alter table public.pedidos add column if not exists canal_usuario text;

-- Canales de venta configurables (de dónde llegó la compra).
insert into public.listas (tipo, nombre, orden, activo)
values
  ('CANAL','Instagram',1,true),
  ('CANAL','WhatsApp',2,true),
  ('CANAL','TikTok',3,true),
  ('CANAL','Facebook',4,true),
  ('CANAL','Presencial',5,true),
  ('CANAL','Tienda web',6,true),
  ('CANAL','Otro',7,true)
on conflict on constraint listas_unq do nothing;
