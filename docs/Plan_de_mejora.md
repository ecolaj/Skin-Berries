# Plan de Mejora e Implementación: ERP y POS - Skin & Berries

Este documento consolida los requerimientos originales del proyecto con su análisis de viabilidad técnica y el roadmap (ruta de implementación) para construir las funcionalidades en el sistema actual.

---

## 1. Documento Original de Requerimientos (v1.3)

### 1. DESCRIPCIÓN DEL NEGOCIO Y PROCESOS ACTUALES
El propósito de esta sección es contextualizar sobre cómo opera la empresa hoy.

**1.1 Visión General del Negocio**
Skin & Berries comercializa productos de cuidado personal y belleza a través de diferentes canales. La operación se centra en la importación de productos del extranjero y su distribución. El control preciso del inventario es crítico debido a la naturaleza perecedera de los productos (fechas de vencimiento) y la multiplicidad de canales de salida.

**1.2 Proceso de Importación y Recepción (Flujo Actual)**
1. **Análisis de inventario:** Revisión para determinar necesidades de abastecimiento.
2. **Determinación de compra:** Definir producto y cantidad por proveedor.
3. **Orden de compra:** Generación de orden por proveedor.
4. **Envío:** Se envía orden al proveedor.
5. **Confirmación:** Proveedor confirma y envía factura comercial.
6. **Revisión de documentos:** Revisión de descripciones, vencimientos, costo. Solicitud de muestras (Control de Calidad).
7. **Confirmación de despacho:** Se autoriza al proveedor.
8. **Coordinación logística local:** Coordinar transportista local.
9. **Pago a proveedor:** Al tener la fecha de zarpe, se realiza el pago.
10. **Documentación de embarque:** Validación y recepción de documentos finales.
11. **Seguimiento:** Seguimiento periódico hasta destino local.
12. **Gestión aduanera:** Compartir documentos al agente aduanero.
13. **Validación:** Agente confirma documentación vs importación.
14. **Trámites sanitarios:** Permisos ante MSPAS.
15. **Gestión MSPAS:** Envío de documentos MSPAS al agente.
16. **Traslado a almacén fiscal:** Coordinación desde el puerto.
17. **Nacionalización:** Pago de impuestos.
18. **Desaduanaje:** Seguimiento de selectivo SAT y traslado a bodega central.
19. **Recepción en bodega:** Revisión según Packing List.
20. **Conteo físico:** Ingreso físico a bodega.
21. **Registro de ingreso:** Ingreso al sistema (actualmente manual).
22. **Determinación de diferencias:** Identificar sobrantes/faltantes.

**1.3 Gestión de Inventario y Canales de Distribución**
*Tipos de salida:* Kiosco, Muestras, Consignación, Mayorista, Tester, Regalías, Vencimiento, Producto dañado, Cambio de bodega.
*Tipos de ingreso:* Inconformidad del cliente, Error de despacho, Rechazo por daño, Consignaciones de regreso, Cambio de bodega.

**1.4 Canales de Venta y Formas de Pago Actuales**
Formas de pago: Efectivo, Transferencia, Tarjeta de Crédito/Débito, Tarjeta Skin & Berries (fidelización), Pendiente de facturar, Ventas al crédito.

### 2. REQUERIMIENTOS DEL SISTEMA

**2.1 Gestión de Importaciones y Proveedores**
*   **R10 Órdenes de compra:** Generar, enviar y dar seguimiento por proveedor (cantidades mínimas).
*   **R11 Control de documentos:** Almacenar facturas, packing lists, documentos de embarque y permisos.
*   **R12 Seguimiento de importaciones:** Registrar fechas clave (zarpe, llegada, nacionalización).
*   **R13 Gestión de proveedores:** Catálogo con datos y condiciones.
*   **R14 Control de registros sanitarios (MSPAS):** Alertas de vencimiento.
*   **R15 Prorrateo / Precio Venta:** Determinación de precios basados en costo, impuestos, etc.

**2.2 Gestión de Inventario (Core)**
*   **R20 Maestro de productos:** SKU, código barras, proveedor, marca, fotografía, valor.
*   **R21 Control por lote y vencimiento:** Inventario por lote/vencimiento.
*   **R22 Alertas de vencimiento:** Configurable (3, 2, 1 mes).
*   **R23 Ubicación en bodega:** Estante, fila, tarima.
*   **R24 Tipos de movimiento configurables:** Clasificación de salidas/entradas con impacto contable.
*   **R25 Ajustes por diferencias:** Conciliación contra factura del proveedor.
*   **R26 Stock mínimo:** Alertas por producto.
*   **R27 Trazabilidad completa:** Historial de movimientos.

**2.3 Gestión de Ventas y Puntos de Venta**
*   **R30 Múltiples formas de pago:** PDV con formas de pago, clientes crédito.
*   **R31 Ventas pendientes (stand by):** Ventas en espera de facturación con límite de tiempo.
*   **R32 Descuentos y promociones:** 2x1, % descuento, etc.
*   **R33 Facturación electrónica (FEL):** Integración SAT.
*   **R34 Clientes frecuentes:** Programa Skin & Berries.

**2.4 Gestión de Consignaciones**
*   **R40 Control de consignación:** Seguimiento de inventario en poder de terceros.
*   **R41 Conciliación:** Venta real vs devolución, facturación automática de lo vendido.

**2.5 Reportes y Dashboards**
*   **R50 Reportería parametrizable:** Por fechas, producto, canal, pago.
*   **R51 Reportes contables:** Cuadres de caja, conciliaciones, inventario valorizado, CxC, CxP.
*   **R52 Dashboard gerencial:** Rotación, más vendidos, rentabilidad, vencimientos, historial clientes.

**2.6 Operatividad y Usabilidad**
*   **R60 Lector de código de barras:** Integración nativa.
*   **R61 UI/UX:** Interfaz limpia, moderna e intuitiva.
*   **R62 Roles y permisos:** Administrador, Gerente, Operaciones, Bodega, Vendedor.
*   **R63 Acceso móvil:** Para consultas y aprobaciones clave.

**2.7 Integraciones Futuras y Escalabilidad**
*   **R70 API para integraciones**
*   **R71 Tienda en línea:** Sincronización en tiempo real.
*   **R72 Contabilidad:** Exportación a software contable externo.

**2.8 Requerimientos Técnicos**
*   **R80 Rendimiento:** Lectura de códigos < 1 segundo, múltiples usuarios.
*   **R81 Seguridad:** Respaldo y protección RLS.
*   **R82 Disponibilidad:** Alta disponibilidad en la nube.

---

## 2. Análisis Técnico y Viabilidad

La arquitectura actual (React + Supabase) es 100% compatible y escalable para abarcar este sistema como un ERP y POS. No es necesario reestructurar tecnologías, pero sí hacer ampliaciones modulares y adaptaciones lógicas.

1.  **Gestión de Importaciones (R10-R15):** Viabilidad Alta. Requerirá nuevas tablas y usar Supabase Storage para alojar los PDFs/Docs de importación y sanidad.
2.  **Gestión de Inventario y Lotes (R20-R27):** Viabilidad Alta, pero **requiere refactorización**. Actualmente el inventario (`store_inventory`) es numérico general. Se debe transicionar a un inventario por "Lote" (`product_batches`), lo que afecta cómo funcionan las entradas y salidas actuales. Se agregará la tabla `inventory_transactions` para cumplir con R24 y R27.
3.  **Ventas y POS (R30-R34):** Viabilidad Alta. Módulo enteramente nuevo (Punto de Venta) adaptado a teclado/código de barras. La integración FEL con SAT en Guatemala se realizará consumiendo un web service de un certificador (Infile/Megaprint) vía Cloud Functions en Supabase.
4.  **Consignaciones (R40-R41):** Viabilidad Muy Alta. El modelo actual de tiendas (`stores`) soporta agregar un tipo de tienda "Consignación". Se requiere una pantalla para conciliar (retornos vs facturado).
5.  **Dashboard (R50-R52):** Viabilidad Alta. Consiste en ampliar el `Dashboard.tsx` actual cruzando datos de los nuevos módulos (vencimientos, rentabilidad).
6.  **Operatividad/API/Mobile (R60-R82):** Cubierto nativamente por el stack actual.

---

## 3. Ruta de Implementación Sugerida (Fases)

Para escalar el proyecto sin romper las operaciones actuales, se debe ejecutar en orden:

*   **Fase 1: Evolución del Inventario Core (Lotes y Trazabilidad)**
    *   Migración de BD: Tablas para `product_batches` y `inventory_transactions`.
    *   Adaptar catálogos para soportar ubicaciones físicas, fechas de caducidad y alertas.
    *   Modificar la lógica actual de Recepción y Despachos para que exijan el ingreso/selección de lote.
    *   Configurar tipos de movimiento (Kiosco, regalía, merma).
*   **Fase 2: Gestión de Compras, Proveedores e Importaciones**
    *   Módulo de proveedores (`suppliers`).
    *   Módulo de órdenes de compra con control de estado (zarpe, aduana).
    *   Integración con Supabase Storage para documentos (facturas, permisos MSPAS).
*   **Fase 3: Módulo de Consignaciones**
    *   Creación del tipo de almacén `consignation`.
    *   Interfaz de conciliación para facturar y devolver inventario sin impactar el stock erróneamente.
*   **Fase 4: Punto de Venta (POS) y Gestión de Clientes**
    *   Pantalla POS optimizada para lectura de barras.
    *   Gestión de clientes frecuentes, descuentos y múltiples métodos de pago (incluyendo Stand by).
*   **Fase 5: Facturación Electrónica (FEL)**
    *   Edge Function en Supabase para conexión segura al certificador SAT.
    *   Automatización de emisión, descarga de PDF FEL y anulación de DTEs.
*   **Fase 6: Reportería Financiera y Gerencial**
    *   Cruces de información (costo vs venta) para rentabilidad.
    *   Exportación de reportes (CxC, CxP, inventario valorizado) a CSV/Excel.
