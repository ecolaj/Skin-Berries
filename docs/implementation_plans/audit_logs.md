# Plan de Implementación: Bitácora de Auditoría (Audit Logs)

Este documento detalla la hoja de ruta para implementar un sistema de trazabilidad que registre la actividad de los usuarios en el sistema.

## 1. Objetivos
- Registrar inicios y cierres de sesión.
- Rastrear qué páginas/opciones visita cada usuario.
- Registrar acciones críticas (creación de órdenes, cambios de inventario).
- Proporcionar una interfaz administrativa para consultar y filtrar estos registros.

## 2. Fase 1: Estructura de Datos
Crearemos una tabla central de auditoría:
- `audit_logs`:
    - `id`: UUID (PK).
    - `user_id`: UUID (FK a profiles).
    - `action`: TEXT (ej. 'LOGIN', 'LOGOUT', 'PAGE_VIEW', 'CREATE_ORDER').
    - `entity_type`: TEXT (opcional, ej. 'product', 'store').
    - `entity_id`: UUID (opcional).
    - `details`: JSONB (para guardar info extra como la URL visitada o datos anteriores/nuevos).
    - `created_at`: TIMESTAMPTZ.

## 3. Fase 2: Captura de Datos (Tracking)
- **Logins/Logouts**: Modificar `AuthContext.tsx` o los scripts de autenticación para insertar un registro en `audit_logs` al detectar cambio de estado.
- **Navegación**: Implementar un efecto en el componente `Layout.tsx` que registre cada cambio de ruta (`location.pathname`).
- **Acciones Críticas**: Agregar llamadas a una función helper `logAction()` en los formularios de Productos, Tiendas y Despachos.

## 4. Fase 3: Interfaz Administrativa
- Nueva página `/audit-logs` (restringida a `admin` y `master`).
- **Tabla de Actividad**: Con paginación o scroll infinito.
- **Filtros Avanzados**:
    - Rango de fechas.
    - Selección de usuario.
    - Tipo de acción.
- **Visualizador de Detalles**: Un modal para ver el contenido JSONB de forma amigable.

## 5. Fase 4: Optimización y Limpieza
- Implementar una política de retención (ej. borrar logs de más de 6 meses) para no saturar la base de datos.
- Índices en `user_id` y `created_at` para búsquedas rápidas.

---

## Próximos Pasos Sugeridos
1. Crear la tabla `audit_logs` en Supabase.
2. Crear la función utilitaria `utils/logger.ts`.
3. Comenzar el registro de "Page Views" en el Layout.
