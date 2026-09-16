-- ============================================================
-- 0003 · Corrige un exceso de 0002_endurecer_seguridad.
--
-- El trigger tg_pagos_recalcula (que NO es SECURITY DEFINER) llama a
-- recalcular_pago_pedido con el rol del usuario que escribe el pago. La
-- migración 0002 revocó EXECUTE de esa función a todos los roles, provocando
-- "permission denied for function recalcular_pago_pedido" al registrar/editar
-- pagos desde el panel.
--
-- Se devuelve EXECUTE solo a 'authenticated' (el staff que escribe pagos).
-- 'anon' sigue sin poder (nunca escribe pagos; la RLS lo bloquea igual).
-- ============================================================

grant execute on function public.recalcular_pago_pedido(uuid) to authenticated;
