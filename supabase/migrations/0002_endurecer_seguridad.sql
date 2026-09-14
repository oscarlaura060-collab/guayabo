-- ============================================================
-- 0002 · Endurecimiento de seguridad del panel administrativo
-- Aplicada al proyecto en producción (ver resumen de la sesión).
-- No modifica datos. Idempotente.
--
-- Resuelve los hallazgos del "database linter" de Supabase:
--   * Vistas financieras SECURITY DEFINER legibles por 'anon' (fuga de
--     ingresos/costos/utilidad).
--   * RPCs sensibles (crear_venta, siguiente_consecutivo) ejecutables por
--     'anon' y que, por ser SECURITY DEFINER, saltan RLS.
--   * Funciones internas/predicados ejecutables públicamente.
-- La seguridad real vive en autenticación + RLS + estas restricciones;
-- ocultar la URL nunca es el mecanismo principal.
-- ============================================================

-- 1) Vistas financieras -> respetar RLS del que consulta; 'anon' sin acceso.
alter view public.ventas_por_dia set (security_invoker = on);
alter view public.ventas_por_mes set (security_invoker = on);
alter view public.top_prendas   set (security_invoker = on);

revoke all on public.ventas_por_dia from anon;
revoke all on public.ventas_por_mes from anon;
revoke all on public.top_prendas   from anon;
grant select on public.ventas_por_dia to authenticated;
grant select on public.ventas_por_mes to authenticated;
grant select on public.top_prendas   to authenticated;

-- Vistas públicas por diseño (solo columnas seguras): quitar escritura anónima.
-- Se conservan como SECURITY DEFINER a propósito para que la vitrina lea el
-- catálogo sin exponer la tabla 'prendas' (que trae costos) al rol 'anon'.
revoke insert, update, delete, truncate, references, trigger on public.catalogo_publico from anon;
revoke insert, update, delete, truncate, references, trigger on public.apartados_activos_publico from anon;

-- 2) RPCs sensibles: sin ejecución anónima + guard de rol interno.
revoke execute on function public.crear_venta(jsonb,jsonb,jsonb) from anon, public;
grant  execute on function public.crear_venta(jsonb,jsonb,jsonb) to authenticated;
revoke execute on function public.siguiente_consecutivo(text) from anon, public;
grant  execute on function public.siguiente_consecutivo(text) to authenticated;

-- crear_venta y siguiente_consecutivo son SECURITY DEFINER (saltan RLS); por eso
-- validan el rol internamente: un CONSULTA autenticado tampoco puede escribir.
-- (Cuerpo completo en supabase/schema.sql; aquí solo se añade el guard tras 'begin'.)

-- 3) Predicados de RLS: los necesita 'authenticated', nunca 'anon'.
do $$
declare r record;
begin
  for r in select oid::regprocedure as sig from pg_proc
           where pronamespace = 'public'::regnamespace
             and proname in ('es_admin','perfil_activo','puede_escribir','rol_actual')
  loop
    execute format('revoke execute on function %s from anon, public', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- 4) Funciones internas/de trigger/mantenimiento: nadie las ejecuta por RPC;
--    search_path fijo (evita secuestro de search_path).
do $$
declare r record;
begin
  for r in select oid::regprocedure as sig from pg_proc
           where pronamespace = 'public'::regnamespace
             and proname in ('tg_nuevo_usuario','tg_touch_updated_at','tg_pagos_recalcula',
                             'tg_apartados_disponible','recalcular_pago_pedido','rls_auto_enable')
  loop
    execute format('revoke execute on function %s from anon, authenticated, public', r.sig);
    begin execute format('alter function %s set search_path = public', r.sig); exception when others then null; end;
  end loop;
end $$;

-- Pendiente manual (panel de Supabase, no es SQL):
--   Authentication -> Passwords -> habilitar "Leaked password protection"
--   (comprobación contra HaveIBeenPwned).
