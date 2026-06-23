# Sistema de Tickets de Venta

## Descripción

Sistema completo de generación e impresión de tickets de venta para el punto de venta (POS) del módulo de Ventas en Mostrador.

## Características

✅ **Preview del ticket** antes de imprimir  
✅ **Impresión nativa** usando `window.print()` (sin librerías externas)  
✅ **Diseño térmico** optimizado para impresoras de 80mm  
✅ **Información completa**: productos, complementos, notas, totales, métodos de pago  
✅ **Cálculo de cambio** para pagos en efectivo  
✅ **Información de mesa** cuando aplica  
✅ **Responsive** para desktop y móvil  

## Flujo de Uso

1. Usuario completa una venta en el módulo de Ventas en Mostrador
2. Al confirmar el pago, se registra la venta en el backend
3. Se abre automáticamente el dialog de preview del ticket
4. Usuario puede:
   - **Ver el preview** del ticket antes de imprimir
   - **Imprimir** el ticket con el botón verde
   - **Cerrar** sin imprimir (puede reimprimir desde historial)
5. Al cerrar el dialog, se limpia el formulario para la siguiente venta

## Archivos Creados

### 1. Interfaz de Datos
**`src/app/models/ticket.interface.ts`**
- `TicketVentaData`: Datos completos del ticket
- `OrdenTicket`: Información de la orden
- `ItemTicket`: Productos con complementos y notas
- `ComplementoTicket`: Extras/modificadores

### 2. Componente del Dialog
**`src/app/components/ventas-mostrador/ticket-venta-dialog/`**

- **`ticket-venta-dialog.component.ts`**
  - Método `imprimir()`: Abre ventana popup con HTML del ticket y ejecuta print()
  - Método `generarHTMLTicket()`: Genera HTML completo con estilos inline
  - Método `cerrar()`: Cierra el dialog
  
- **`ticket-venta-dialog.component.html`**
  - Layout de dos columnas (preview + acciones)
  - Preview del ticket con estilos de papel térmico
  - Botones de impresión y cierre
  
- **`ticket-venta-dialog.component.scss`**
  - Estilos del dialog y el preview
  - Diseño responsive para móvil
  - Simulación de papel térmico

## Modificaciones en Ventas Mostrador

### Archivo: `ventas-mostrador.component.ts`

**Imports agregados:**
```typescript
import { TicketVentaDialogComponent } from './ticket-venta-dialog/ticket-venta-dialog.component';
import { TicketVentaData, ItemTicket } from '../../models/ticket.interface';
```

**Método `registrarVenta()` modificado:**
- Después de registrar la venta exitosamente
- Construye objeto `TicketVentaData` con todos los datos
- Abre el dialog con `MatDialog.open()`
- Limpia el formulario **solo después** de cerrar el dialog

## Estructura del Ticket

```
┌─────────────────────────────────┐
│     NOMBRE DE LA EMPRESA        │
│      Sistema de ventas          │
│   ┌─ TICKET DE VENTA ─┐        │
├─────────────────────────────────┤
│ Folio:  #001                    │
│ Fecha:  14/04/2026              │
│ Hora:   15:30                   │
│ Tipo:   Comer aquí              │
│ Mesa:   5                       │
├─────────────────────────────────┤
│ Cant  Producto           Total  │
├─────────────────────────────────┤
│ 2x    Hamburguesa       $160.00 │
│       + Extra queso (+$10.00)   │
│       📌 Sin cebolla            │
│ 1x    Refresco           $30.00 │
├─────────────────────────────────┤
│ Subtotal              $190.00   │
│ TOTAL                 $190.00   │
│ Monto recibido        $200.00   │
│ Cambio                 $10.00   │
├─────────────────────────────────┤
│      Método de pago             │
│        EFECTIVO                 │
├─────────────────────────────────┤
│       ¡GRACIAS!                 │
│      Vuelva pronto              │
│  Este documento no es un        │
│  comprobante fiscal (CFDI)      │
└─────────────────────────────────┘
```

## Diseño del Ticket

### Características del HTML generado:

- **Ancho:** 80mm (estándar térmico)
- **Fuente:** Courier New (monoespaciada)
- **Tamaño:** 11-12px base
- **Elementos visuales:**
  - Separadores con líneas punteadas
  - Encabezado con nombre de empresa en mayúsculas
  - Tabla de productos con alineación clara
  - Complementos indentados con "+"
  - Notas con emoji 📌
  - Total destacado con borde superior
  - Footer con mensaje de agradecimiento

### Estilos inline en el HTML:

Todos los estilos están incluidos en el `<style>` dentro del HTML generado para que funcione correctamente al imprimir, sin depender de hojas de estilo externas.

## Impresión

### Método `imprimir()`:

1. Genera HTML completo del ticket
2. Abre ventana popup con `window.open()`
3. Escribe el HTML en la ventana
4. Ejecuta `window.print()` cuando carga
5. Cierra la ventana después de imprimir
6. Maneja errores si el popup es bloqueado

### Compatibilidad:

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Impresoras térmicas (80mm)
- ✅ Impresoras convencionales
- ⚠️ Requiere permitir ventanas emergentes

## Datos Incluidos en el Ticket

### Información General:
- Nombre de la empresa
- Folio de la orden
- Fecha y hora
- Tipo de servicio (mesa/llevar/domicilio)
- Mesa (si aplica)
- Cliente (si aplica)

### Productos:
- Cantidad
- Nombre
- Subtotal
- Complementos con precio
- Notas especiales

### Totales:
- Subtotal
- Propina (si aplica)
- Costo de envío (si aplica)
- **Total**

### Método de Pago:
- Efectivo / Tarjeta / Transferencia / Combinado
- Monto recibido (solo efectivo)
- Cambio (solo efectivo)

## Configuración del Dialog

```typescript
{
  data: ticketData,           // Datos del ticket
  width: '820px',             // Ancho grande para preview
  maxWidth: '95vw',           // Responsive
  maxHeight: '90vh',          // No ocupar toda la pantalla
  disableClose: true          // Usuario debe cerrar explícitamente
}
```

## Manejo de Errores

### Popup bloqueado:
Si el navegador bloquea la ventana emergente, se muestra un toast:
```
"Permite ventanas emergentes para imprimir el ticket"
```

### Sin datos:
El ticket siempre se genera con los datos disponibles. Campos opcionales se omiten si están vacíos.

## Estados del Botón de Impresión

- **Normal:** Verde con icono de impresora
- **Imprimiendo:** Spinner + texto "Imprimiendo..."
- **Deshabilitado:** Opacidad reducida mientras imprime

## Responsive Design

### Desktop (> 768px):
- Layout horizontal: preview a la izquierda, acciones a la derecha
- Ticket centrado con sombra
- Botones grandes y claros

### Móvil (≤ 767px):
- Layout vertical: preview arriba, acciones abajo
- Preview con scroll si es necesario (max-height: 50vh)
- Botones full-width

## Mejoras Futuras Sugeridas

- [ ] Guardar PDF del ticket en el servidor
- [ ] Enviar ticket por email al cliente
- [ ] Enviar ticket por WhatsApp
- [ ] Logo de la empresa en el ticket
- [ ] QR code con link a la orden
- [ ] Configuración de impresora por defecto
- [ ] Reimprimir tickets desde historial de ventas

## Notas Técnicas

- **No usa librerías externas** para impresión
- **window.print()** es nativo y universal
- **HTML inline** garantiza compatibilidad
- **80mm** es el estándar para impresoras térmicas de punto de venta
- **Estilos @media print** optimizan la impresión
- **disableClose: true** evita pérdida accidental del ticket

## Ejemplo de Uso en Código

```typescript
// Después de registrar venta exitosamente:
const ticketData: TicketVentaData = {
  orden: {
    id: ordenId,
    folio: response.folio,
    fecha: new Date().toISOString(),
    items: [...],
    subtotal: 190.00,
    total: 190.00,
    metodo_pago: 'efectivo',
    monto_recibido: 200.00,
    cambio: 10.00,
    tipo_servicio: 'mesa',
    mesa: '5',
    nombre_empresa: 'Mi Restaurante'
  }
};

const dialogRef = this.dialog.open(TicketVentaDialogComponent, {
  data: ticketData,
  width: '820px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  disableClose: true
});

dialogRef.afterClosed().subscribe(() => {
  // Limpiar formulario
});
```

---

**Implementado:** 14 de abril de 2026  
**Versión:** 1.0  
**Módulo:** Ventas en Mostrador
