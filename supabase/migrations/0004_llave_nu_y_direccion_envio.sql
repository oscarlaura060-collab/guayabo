-- ============================================================
-- 0004 · Método "Llave Nu" y dirección de envío en ventas
-- Aplicada en producción. No destruye datos.
-- ============================================================

-- Renombrar el método de pago "Transferencia" -> "Llave Nu" (opción y pagos previos).
update public.listas set nombre = 'Llave Nu' where tipo = 'METODO_PAGO' and nombre = 'Transferencia';
update public.pagos  set metodo = 'Llave Nu' where metodo = 'Transferencia';

-- Dirección de envío por venta/pedido (opcional). Se captura al crear la venta.
alter table public.pedidos add column if not exists direccion_envio text;
