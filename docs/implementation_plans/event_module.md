# Plan de Implementación: Módulo de Eventos Móvil

Este documento detalla la hoja de ruta para implementar la funcionalidad de gestión de eventos (Salida/Regreso) con escaneo de códigos de barras, optimizada para dispositivos móviles.

## 1. Objetivos del Módulo
- Permitir la creación de "Sesiones de Evento".
- Facilitar el escaneo de productos mediante la cámara del móvil.
- Controlar el flujo de inventario: **Bodega Central -> Evento -> Venta / Retorno**.
- Soporte para múltiples usuarios y funcionamiento básico offline (sincronización).

## 2. Fase 1: Estructura de Datos (Base de Datos)
Para no afectar las tablas actuales, crearemos nuevas tablas en Supabase:
- `event_sessions`: Rastrea el nombre del evento, fecha, estado (abierto/cerrado) y responsable.
- `event_session_items`: Detalle de productos por sesión, rastreando:
    - `qty_out`: Cantidad que salió.
    - `qty_return`: Cantidad que regresó.
    - `qty_sold`: Calculado (`qty_out - qty_return`).
- `event_logs`: Historial de escaneos para auditoría y resolución de conflictos (multi-usuario).

## 3. Fase 2: Interfaz Móvil y Detección
- Creación de una ruta exclusiva `/events/mobile`.
- Layout específico "Mobile First": botones grandes, interfaz táctil y contraste alto.
- Detección de dispositivo para sugerir al usuario cambiar a la versión móvil si entra desde un escritorio a esta función.

## 4. Fase 3: Integración del Escáner (Cámara)
- Implementación de la librería `html5-qrcode` o similar.
- Lógica de "Modo Rápido" (escanear suma +1) y "Modo Manual" (escanear abre teclado numérico).
- Feedback auditivo/visual (pitido o vibración) al escanear correctamente.

## 5. Fase 4: Lógica de Negocio y Sincronización
- **Flujo de Salida**: Al confirmar la salida, se genera un movimiento de inventario negativo en la bodega de origen.
- **Flujo de Regreso**: Al cerrar el evento, se genera un movimiento de entrada por lo que regresó y se registra la venta final.
- **Offline Storage**: Uso de `localStorage` o `IndexedDB` para guardar escaneos si falla el internet, con un botón de "Sincronizar Pendientes".

## 6. Fase 5: Reportes y Cierre
- Vista de resumen de ventas del evento.
- Botón de "Cerrar Evento" que bloquea más cambios y liquida el inventario.

---

## Próximos Pasos Sugeridos
1. Definir los scripts SQL para las nuevas tablas.
2. Crear un prototipo visual (Mockup) de la interfaz móvil.
3. Probar la librería de cámara en un entorno seguro.

**Nota**: Este plan se ejecutará paso a paso, verificando la estabilidad del sistema actual en cada etapa.
