# Filtro de Fecha en Pedidos - Cambios Backend Requeridos

## Problema Solucionado
Los pedidos ahora se filtran por fecha en el backend en lugar de cargar todos y filtrar en el cliente.

## Cambios Realizados en Frontend

### 1. `order.service.ts`
El método `listOrders()` ahora acepta un parámetro opcional `fecha`:

```typescript
listOrders(fecha?: string): Observable<any> {
  let params = new HttpParams();
  
  // Agregar sucursal_id si existe
  const sucursalId = this.authService.getSucursalId();
  if (sucursalId !== null) {
    params = params.set('sucursal_id', sucursalId.toString());
  }
  
  // Agregar fecha si se especifica (formato YYYY-MM-DD)
  if (fecha) {
    params = params.set('fecha', fecha);
  }
  
  return this.http.get(`${this.apiUrl}/orders/${empresaId}`, { params });
}
```

### 2. `pedidos-lista.component.ts`
- El componente ahora envía la fecha seleccionada en cada petición
- Formato de fecha: `YYYY-MM-DD` (ejemplo: `2026-04-18`)
- Por defecto se envía la fecha de hoy al iniciar

## Cambios Requeridos en Backend (PHP)

### Controlador de Órdenes (OrderController.php)

Agregar soporte para el parámetro `fecha` en el método `index()`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Carbon\Carbon;

class OrderController extends Controller
{
    public function index(Request $request, $empresaId)
    {
        $query = Order::where('business_id', $empresaId);
        
        // Filtro por sucursal (ya existente)
        if ($request->has('sucursal_id')) {
            $query->where('sucursal_id', $request->sucursal_id);
        }
        
        // ← NUEVO: Filtro por fecha
        if ($request->has('fecha')) {
            $fecha = $request->fecha; // Formato: YYYY-MM-DD
            $query->whereDate('created_at', $fecha);
        } else {
            // Si no se especifica fecha, mostrar solo pedidos de hoy
            $query->whereDate('created_at', Carbon::today());
        }
        
        // Incluir relaciones
        $pedidos = $query->with(['items', 'sucursal'])
                        ->orderBy('created_at', 'desc')
                        ->get();
        
        return response()->json($pedidos);
    }
}
```

## Comportamiento Esperado

1. **Carga inicial**: Muestra solo pedidos de hoy
2. **Navegación de fechas**: 
   - Botones ← → para navegar días
   - DatePicker para seleccionar fecha específica
   - Botón "Hoy" para volver a la fecha actual
3. **Auto-refresh**: 
   - Solo se activa cuando se está viendo "hoy"
   - Pausado automáticamente en fechas anteriores
4. **Rendimiento**: 
   - Filtrado en servidor (no trae todos los pedidos)
   - Menos datos transferidos
   - Respuesta más rápida

## Validación

Para verificar que funciona correctamente:

1. Revisar las peticiones en el Network tab del navegador
2. Buscar llamadas a `/api/orders/{empresaId}?fecha=2026-04-18`
3. Verificar que solo devuelve pedidos del día solicitado

## Alternativa (Sin Backend Actualizado)

Si el backend **NO** puede actualizarse inmediatamente, el frontend seguirá funcionando:
- Enviará el parámetro `fecha` pero el backend lo ignorará
- Traerá todos los pedidos y los filtrará en el cliente (menos eficiente)
- El filtrado local funciona con `applyDayFilter()` en el componente

Sin embargo, **se recomienda actualizar el backend** para mejor rendimiento.
