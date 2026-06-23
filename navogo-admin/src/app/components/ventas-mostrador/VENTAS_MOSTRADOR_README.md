# Ventas Mostrador - Punto de Venta (POS)

Componente standalone de Angular 20 para gestionar ventas en mostrador con funcionalidad completa de punto de venta.

## 📍 Ruta
`/ventas-mostrador`

## 🔐 Acceso
- **Admin** (roleId: 1) ✅
- **Empleado** (roleId: 2) ✅

## 🏗️ Arquitectura

### Tecnologías Utilizadas
- **Angular 20** con componentes standalone
- **Signals** (`signal`, `computed`, `effect`)
- **Nueva sintaxis de control flow** (`@if`, `@for`, `@switch`)
- **inject()** para inyección de dependencias
- **Angular Material** para UI
- **SCSS** para estilos

### Servicios Utilizados
- `MenuService.getMenuByEmpresaId()` - Obtiene categorías y productos
- `AuthService.getEmpresaId()` - Obtiene el empresa_id del usuario autenticado
- `MatSnackBar` - Notificaciones de éxito/error

## 🖥️ Layout

### Panel Izquierdo (60-65%) - Catálogo de Productos
1. **Barra de búsqueda** con debounce de 300ms
2. **Tabs de categorías** con opción "Todos"
3. **Grilla de productos** con:
   - Imagen del producto (o placeholder)
   - Nombre y precio
   - Badge de cantidad si está en carrito
   - Badge de descuento si aplica
   - Efecto visual al agregar

### Panel Derecho (35-40%) - Orden Actual
1. **Selector de tipo de servicio**:
   - 🏠 En mesa → Muestra selector de número de mesa
   - 🛍️ Para llevar → Sin campos adicionales
   - 🛵 Domicilio → Campo de dirección/nombre del cliente

2. **Lista de productos en la orden**:
   - Botones +/- para ajustar cantidad
   - Botón X para eliminar
   - Campo de notas por producto
   - Precio unitario y subtotal

3. **Resumen de totales**:
   - Subtotal
   - Total destacado

4. **Métodos de pago**:
   - 💵 Efectivo → Campo de monto recibido y cálculo de cambio
   - 💳 Tarjeta → Sin campos adicionales
   - 🏦 Transferencia → Sin campos adicionales
   - 🔀 Combinado → Campos para efectivo, tarjeta y transferencia

5. **Botones de acción**:
   - "Registrar Venta" (prominente, deshabilitado si no es válida la orden)
   - "Limpiar Orden" (secundario)

## 📊 Modelo de Datos

```typescript
// Signals principales
categoriaActiva = signal<string>('todos');
busqueda = signal<string>('');
carrito = signal<ProductoCarrito[]>([]);
tipoServicio = signal<TipoServicio>('mesa');
numeroMesa = signal<number | null>(null);
datosCliente = signal<string>('');
metodoPago = signal<MetodoPago>('efectivo');
montoRecibido = signal<number>(0);

// Computed properties
productosFiltrados = computed(() => { /* filtra por categoría y búsqueda */ });
totalOrden = computed(() => { /* suma subtotales del carrito */ });
cambio = computed(() => montoRecibido() - totalOrden());
ordenValida = computed(() => { /* validaciones */ });
```

## ✨ Funcionalidades

### Catálogo de Productos
- ✅ Búsqueda en tiempo real con debounce
- ✅ Filtrado por categoría
- ✅ Clic en producto abre diálogo de detalle
- ✅ Diálogo permite seleccionar complementos/adicionales
- ✅ Agregar producto al carrito con complementos seleccionados
- ✅ Visualización de cantidad en carrito (badge circular verde)
- ✅ Indicador de descuentos (badge rojo, solo si hay descuento real)
- ✅ Placeholder para productos sin imagen
- ✅ Tarjetas optimizadas: 70% imagen + 30% info en fondo blanco
- ✅ Nombre y precio con excelente legibilidad

### Gestión del Carrito
- ✅ **Visualización de imagen del producto** en cada item (60x60px, esquina redondeada)
- ✅ Incrementar/decrementar cantidad (mínimo 1)
- ✅ Eliminar producto con confirmación (diálogo de seguridad)
- ✅ **Agregar notas mediante diálogo**: 
  - Link "Agregar nota" abre diálogo dedicado
  - Textarea con contador de caracteres (max 200)
  - Nota se muestra con fondo amarillo y borde, ícono de nota
  - Link "Editar nota" para modificar nota existente
- ✅ Cálculo automático de subtotales con descuentos
- ✅ Soporte para productos con complementos/adicionales
- ✅ Visualización de complementos seleccionados en el carrito

### Complementos y Adicionales
Al hacer clic en un producto, se abre un diálogo modal (bottom sheet) que permite:
- Ver detalles completos del producto
- Seleccionar complementos/adicionales disponibles
- Configurar cantidad
- Los complementos pueden tener:
  - **Precio override**: Reemplaza el precio base (ej: tamaños)
  - **Precio extra**: Se suma al precio base (ej: ingredientes adicionales)
- El precio final se calcula automáticamente: `precio_base + suma_extras`
- Cada producto con complementos se guarda como un item único en el carrito

### Tipos de Servicio
- ✅ Mesa, Para llevar, Domicilio
- ✅ Validación de campos según tipo seleccionado
- ✅ Limpieza automática de campos al cambiar tipo

### Métodos de Pago
- ✅ Efectivo con cálculo de cambio
- ✅ Tarjeta, Transferencia (sin campos adicionales)
- ✅ Pago combinado con múltiples métodos
- ✅ Validación de montos antes de registrar venta

### Registro de Venta
- ✅ Validación completa antes de registrar
- ✅ Diálogo de confirmación con resumen de orden
- ✅ Vista previa de: servicio, productos, total, método de pago
- ✅ Muestra cambio a devolver si es efectivo
- ✅ Detalle de pago combinado si aplica
- ✅ Notificación de éxito con snackbar
- ✅ Limpieza automática tras registro exitoso
- ✅ Manejo de errores

## 🎨 Diseño Visual

### Características
- Panel derecho con fondo ligeramente diferente (`#fafafa`)
- Header verde con gradiente (`#1c8f46` to `#0f4d2a`)
- Botón "Registrar Venta" prominente (verde, full-width, grande)
- Tarjetas de productos con hover effect
- **Tarjetas optimizadas**: 70% imagen (object-fit: cover) + 30% info en fondo blanco
- **Badges mejorados**: 
  - Cantidad: circular verde superior derecha con animación pulse
  - Descuento: rojo superior izquierda, solo si hay descuento real
- **Botones de servicio/pago**: Íconos perfectamente alineados con flex column
  - Estado activo: fondo verde, texto e ícono blancos
  - Estado inactivo: borde gris, fondo transparente
  - Hover: borde oscuro, fondo gris claro
- Totales en tipografía grande y clara
- Íconos de Material Icons
- Scrollbars personalizados
- Animaciones sutiles

### Diálogos de Confirmación
- **Agregar/Editar Nota**: Dialog para escribir notas de productos
  - Max-width: 450px
  - Textarea con contador de caracteres (200 max)
  - Botón "Limpiar nota" si hay texto
  - Animación de entrada suave
- **Eliminar producto**: Dialog simple con mensaje claro y botones Cancel/Eliminar
- **Confirmar pago**: Dialog con resumen completo de orden
  - Max-width: 380px (eliminar) / 460px (pago)
  - Animación de entrada: fadeInScale
  - Cierre con Escape o click en backdrop
  - Botones claramente identificados (outline para cancelar, primary para confirmar)

### Responsive
- **Desktop (>1200px)**: Layout completo de dos columnas
- **Tablet (768px-1200px)**: Columnas ajustadas
- **Mobile (<768px)**: Layout vertical con panel de orden al 50% inferior

## 🔄 Flujo de Uso

1. **Seleccionar productos** del catálogo (panel izquierdo)
   - Clic en producto abre diálogo de detalle
   - Seleccionar complementos/adicionales si aplica
   - Configurar cantidad
   - Agregar al carrito
2. **Gestionar orden** en panel derecho
   - Ver imagen y detalles de cada producto
   - Ajustar cantidades con botones +/-
   - Clic en "Agregar nota" para abrir diálogo y escribir nota especial
   - Si hay nota, se muestra en fondo amarillo con opción de editarla
3. **Seleccionar tipo de servicio** y completar campos requeridos
4. **Seleccionar método de pago** y ingresar montos si es necesario
5. **Registrar venta** cuando la orden esté completa y válida
6. Sistema limpia automáticamente y está listo para la siguiente venta

## 📝 Notas de Implementación

### Backend Pendiente
Actualmente la venta se simula en el frontend. Para integrar con backend:

1. Crear endpoint POST `/api/ventas` que acepte:
```typescript
{
  tipo_servicio: 'mesa' | 'llevar' | 'domicilio',
  numero_mesa?: number,
  datos_cliente?: string,
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'combinado',
  monto_recibido?: number,
  pago_combinado?: { efectivo: number, tarjeta: number, transferencia: number },
  productos: Array<{
    producto_id: number,
    cantidad: number,
    precio_unitario: number,
    descuento: number,
    nota: string,
    subtotal: number
  }>,
  subtotal: number,
  total: number,
  cambio: number
}
```

2. Modificar el método `registrarVenta()` en el componente para hacer la petición HTTP

### Empresa ID
El componente obtiene automáticamente el `empresa_id` del usuario autenticado mediante `AuthService.getEmpresaId()`. Si el usuario no tiene empresa asociada, se muestra un mensaje de error y no se cargan productos.

### Extensiones Futuras
- [ ] Agregar propinas
- [ ] Agregar impuestos
- [ ] Historial de ventas del día
- [ ] Imprimir ticket
- [ ] Lectores de código de barras
- [ ] Integración con terminal de pago
