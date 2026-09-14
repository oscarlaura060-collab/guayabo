# GUAYABO · Sistema de gestión

Aplicación interna para administrar una marca de ropa colombiana: ventas, pedidos,
apartados, inventario, pagos, gastos y utilidades. Uso personal y de un equipo pequeño,
desde computador y celular.

Viene de una versión en Google Apps Script + Sheets que funcionaba pero era lenta
(1–3 s por operación). Esta versión busca respuestas en milisegundos.

## Stack

- Next.js (App Router) + TypeScript
- Supabase: Postgres, Auth y Storage
- Tailwind CSS
- Despliegue en Vercel

## Identidad visual

Es una marca juvenil, alegre, muy colombiana. La interfaz debe sentirse como la marca,
no como un ERP.

- Verde lima `#D2DE52` · Rosa `#E8288E` · Crema `#FFFDF4` · Tinta `#191914`
- Menú lateral verde lima con ítems tipo píldora; el activo lleva borde rosa de 2 px
- Tarjetas blancas, esquinas de 22 px, sombras suaves
- Tipografía: Poppins para la interfaz (la navegación va en cursiva),
  una serif de alto contraste para las cifras grandes del dashboard
- Moneda en pesos colombianos sin decimales: `$ 120.000`

## Reglas de negocio

**Ventas y pedidos son la misma entidad**, se distinguen por `tipo`:
`VENTA` se entrega de inmediato; `PEDIDO` tiene fecha estimada (`fecha + TIEMPO_ENTREGA`,
15 días por defecto) y pasa por estados. Así pagos, utilidades e historial se calculan
una sola vez para ambos.

**Costos por prenda.** Cada prenda guarda su desglose en `costos` (jsonb):
`{"Tela": 18000, "Confección": 22000}`. El `costo` es la suma. Una prenda por talla,
porque una XL cuesta más que una S.

**Utilidad.** Bruta = total − costo de la mercancía. Neta = bruta − gastos del período.
Los gastos son aparte de los costos: si la tela ya está en el costo de la prenda,
no se registra además como gasto.

**Pagos y abonos.** Un pedido acepta varios pagos. `pagado` y `saldo` los recalcula
un trigger en Postgres, nunca el frontend. Si el pago supera el saldo, se advierte
y se permite continuar tras confirmar.

**Inventario.** Se descuenta al vender y se devuelve al cancelar. No se permite vender
sin stock salvo que `VENTA_BAJO_PEDIDO` esté activo.

**Nada se borra si tiene historial.** Cliente o prenda con ventas asociadas se marcan
`activo = false`.

**Todo configurable desde la interfaz.** Colores, categorías, tallas, colores de prenda,
métodos de pago, estados, días de entrega, stock mínimo, plantillas de aviso. Nada de
valores fijos en el código: van en las tablas `config` y `listas`.

## Base de datos

`schema.sql` tiene el esquema completo. Puntos clave:

- `crear_venta(pedido, items, pago)`: crea pedido, líneas, descuenta stock y registra
  el pago en una sola transacción. El frontend llama a esta función, no hace inserts sueltos.
- `siguiente_consecutivo(entidad)`: genera `GUAYABO-0001` de forma segura.
- Trigger `trg_pagos_recalcula`: mantiene `pagado`, `saldo` y `est_pago`.
- Vistas `ventas_por_dia`, `ventas_por_mes`, `top_prendas` para el dashboard.
- RLS activo: `ADMINISTRADOR` todo, `VENDEDOR` ventas/pedidos/clientes/pagos,
  `CONSULTA` solo lectura.

## Convenciones

- Server Components por defecto; Client Components solo donde hay interacción.
- Server Actions para escribir; nada de API routes salvo webhooks.
- Los cálculos de dinero van en Postgres o en el servidor, nunca en el navegador.
- Validación con Zod tanto en el formulario como en el servidor.
- Todo en español: interfaz, nombres de columnas, mensajes. El código en inglés.
- Fechas en zona `America/Bogota`.

## Lo que importa de verdad

Registrar una venta tiene que ser rápido: elegir cliente, agregar prendas, cobrar.
Sin pasar por cinco pantallas. Ese flujo es el corazón del sistema y todo lo demás
se subordina a él.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
