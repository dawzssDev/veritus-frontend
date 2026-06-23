# Sistema POS de Pedidos - Rediseño para Cocina

## 🎯 Visión General

Rediseño completo del sistema de pedidos optimizado para uso en cocina por cocineros y personal de servicio. El sistema prioriza la **legibilidad a distancia**, **jerarquía visual clara** y **acciones rápidas** mediante una arquitectura moderna con Angular 20 Signals.

## 🏗️ Arquitectura

### Componentes Standalone

#### 1. **OrderCardComponent** (`order-card/`)
Tarjeta de pedido individual con jerarquía visual optimizada.

**Features:**
- ✅ Folio prominente (28px, peso 900)
- ✅ Badge de tipo de pedido con emoji + icono + color distintivo
- ✅ Temporizador progresivo con 3 estados visuales
- ✅ Lista de items legible (16px mínimo)
- ✅ Modificadores como badges morados
- ✅ Notas especiales siempre visibles (fondo amarillo)
- ✅ Botones con ícono + etiqueta de texto
- ✅ Borde lateral de color según tipo de pedido
- ✅ Animaciones de entrada y estados urgentes

**Inputs (Signals):**
```typescript
order = input.required<Pedido>()
```

**Outputs:**
```typescript
statusChange = output<{id: number; action: 'pagar' | 'servir' | 'cancelar'}>()
cardClick = output<number>()
```

**Computed Signals:**
- `minutosTranscurridos()` - Tiempo desde creación
- `timerClass()` - safe | warning | danger
- `timerColor()` - Color del temporizador
- `tipoConfig()` - Configuración visual por tipo
- `estadoConfig()` - Configuración visual por estado

#### 2. **OrdersFilterBarComponent** (`orders-filter-bar/`)
Barra de filtros con chips interactivos.

**Features:**
- ✅ Selector de fecha con Material Datepicker
- ✅ Botón "Hoy" para resetear fecha
- ✅ Filtro "Todos | Solo pendientes"
- ✅ Filtro por tipo: Todos | Comer aquí | Domicilio | Para llevar
- ✅ Chips con colores según tipo de pedido
- ✅ Botón de actualización manual

**Two-way Bindings (model):**
```typescript
selectedDate = model<Date>(new Date())
filtroModo = model<FiltroModo>('pendientes')
filtroTipo = model<FiltroTipo>('todos')
```

#### 3. **PedidosListaV2Component** (página principal)
Contenedor principal con lógica de estado global.

**State (Signals):**
```typescript
orders = signal<Pedido[]>([])
isLoading = signal(false)
selectedDate = signal(new Date())
filtroModo = signal<FiltroModo>('pendientes')
filtroTipo = signal<FiltroTipo>('todos')
```

**Computed Signals:**
```typescript
filteredOrders = computed(() => {
  // Filtrado por fecha, modo y tipo
  // Ordenamiento: más urgentes primero
})

urgentOrders = computed(() => {
  // Pedidos con más de 20 minutos
})

pendingOrdersCount = computed(() => {
  // Contador de pedidos activos
})
```

**Effects:**
```typescript
effect(() => {
  // Alerta automática para pedidos urgentes
  if (urgentOrders().length > 0) {
    console.warn('Pedidos urgentes detectados')
  }
})
```

## 🎨 Sistema de Diseño

### Design Tokens (styles/_design-tokens.scss)

```scss
// Colores por tipo
--color-pedido-local: #4F46E5      (Índigo)
--color-pedido-domicilio: #EA580C  (Naranja)
--color-pedido-llevar: #0D9488     (Teal)

// Estados
--color-estado-proceso: #2563EB
--color-estado-pago: #D97706
--color-estado-servir: #16A34A

// Temporizador progresivo
--timer-seguro: #16A34A       (0-10 min)
--timer-advertencia: #CA8A04   (10-20 min)
--timer-peligro: #DC2626       (20+ min)
```

### Jerarquía Visual

#### Tipo de Pedido (Máxima Prioridad)
```
🍽 Comer aquí  → Fondo #4F46E5 (Índigo)
🛵 Domicilio   → Fondo #EA580C (Naranja)
🛍 Para llevar → Fondo #0D9488 (Teal)
```

#### Estados del Temporizador
```
0-10 min  → Verde  (#16A34A) - Sin animación
10-20 min → Amarillo (#CA8A04) - Pulso suave
20+ min   → Rojo (#DC2626) - Parpadeo + borde de alerta
```

#### Layout de Tarjeta
```
┌─────────────────────────────────────┐
│ [Borde lateral de color tipo]      │
│                                     │
│ Folio 123    [Tiempo: 15m] [Estado]│
│                                     │
│ [🍽 COMER AQUÍ]                     │
│                                     │
│ Cliente: Juan Pérez                 │
│ Mesa 5                              │
│                                     │
│ ─── COMANDA (3 items) ───           │
│ [2×] El Pilón            $175.00    │
│      [+ Pollo] [+ Aguacate]         │
│ [1×] Yakimeshi           $140.00    │
│                                     │
│ ⚠️ NOTAS ESPECIALES:                │
│ Sin cebolla, extra picante          │
│                                     │
│ Total: $315.00                      │
│                                     │
│ [💲 Marcar Pagado] [🔔 Servir] [✕] │
└─────────────────────────────────────┘
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: Grid 2 columnas (1024px+)
- **Tablet**: Grid 1 columna (768-1024px)
- **Mobile**: Stack vertical (<768px)

### Optimizaciones Móviles
- Botones de acción en columna
- Badges de tamaño reducido
- Filtros en accordion

## 🎬 Animaciones

### Entrada de Tarjetas
```typescript
trigger('cardEntry', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('300ms ease-out')
  ])
])
```

### Pulso de Urgencia
```typescript
trigger('urgentPulse', [
  transition('* => warning', [
    animate('1s ease-in-out', style({ transform: 'scale(1.02)' }))
  ]),
  transition('* => danger', [
    animate('0.6s ease-in-out', style({ transform: 'scale(1.03)' }))
  ])
])
```

### Lista con Stagger
```typescript
trigger('listAnimation', [
  transition('* => *', [
    query(':enter', stagger(50, [
      animate('300ms ease-out')
    ]))
  ])
])
```

## 🔄 Polling y Actualización

### Auto-refresh
- Intervalo: **30 segundos**
- Implementado con `timer()` + `switchMap()`
- No interrumpe interacción del usuario

### Actualización Manual
- Botón "Actualizar" en barra de filtros
- Sin recargar página completa
- Mantiene filtros activos

## ✅ Criterios de Aceptación UX

### ✓ Legibilidad a Distancia
- Tipo de pedido legible desde **1.5 metros**
- Fuente mínima: **16px** para items
- Folio: **28px**, peso 900
- Emojis de 24px para reconocimiento rápido

### ✓ Urgencia Visual
- Estados de temporizador con colores distintivos
- Animaciones progresivas (pulso → parpadeo)
- Banner de alerta para pedidos 20+ minutos
- Borde lateral cambia a rojo en urgencia

### ✓ Acciones Rápidas
- Máximo **1 tap/click** por acción
- Botones con ícono **Y** texto (nunca solo ícono)
- Confirmación de acciones críticas

### ✓ Notas Especiales
- Fondo amarillo (#FEF9C3)
- Borde izquierdo ámbar (#F59E0B)
- **Siempre visibles** cuando existen
- Nunca colapsadas u ocultas

### ✓ Contraste WCAG AA
- Todos los textos cumplen ratio 4.5:1
- Botones con estado :focus visible
- Alternativas visuales a color (iconos)

## 📂 Estructura de Archivos

```
src/app/components/pedidos-lista/
├── order-card/
│   ├── order-card.component.ts
│   ├── order-card.component.html
│   └── order-card.component.scss
├── orders-filter-bar/
│   ├── orders-filter-bar.component.ts
│   ├── orders-filter-bar.component.html
│   └── orders-filter-bar.component.scss
├── pedidos-lista-v2.ts
├── pedidos-lista-v2.html
└── pedidos-lista-v2.scss

src/styles/
└── _design-tokens.scss
```

## 🚀 Uso

### Implementación en Rutas

```typescript
// app.routes.ts
{
  path: 'pedidos',
  loadComponent: () => import('./components/pedidos-lista/pedidos-lista-v2')
    .then(m => m.PedidosListaV2)
}
```

### Ejemplo de Uso del OrderCard

```html
<app-order-card
  [order]="pedidoSignal()"
  (statusChange)="handleStatusChange($event)"
  (cardClick)="navigateToDetail($event)"
/>
```

### Filtros con Two-way Binding

```html
<app-orders-filter-bar
  [(selectedDate)]="fecha"
  [(filtroModo)]="modo"
  [(filtroTipo)]="tipo"
  (refresh)="recargarPedidos()"
/>
```

## 🔧 Configuración

### Servicios Requeridos

```typescript
// OrderService debe exponer:
interface OrderService {
  listOrders(): Observable<AdminOrder[]>
  updateOrderChecks(id: number, data: any): Observable<any>
  updateOrderStatus(id: number, status: number): Observable<any>
}
```

### Transformación de Datos

El componente transforma automáticamente de `AdminOrder` (backend) a `Pedido` (frontend):

```typescript
transformOrder(raw: AdminOrder): Pedido {
  // Calcula folio diario
  // Determina estado visual
  // Mapea items y modificadores
  // Retorna tipo Pedido
}
```

## 📊 Performance

### Optimizaciones
- ✅ TrackBy con folio único
- ✅ OnPush change detection en tarjetas
- ✅ Computed signals para filtrado reactivo
- ✅ Lazy loading de componentes
- ✅ CSS contain para aislamiento de repaint

### Métricas Esperadas
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **CLS**: < 0.1
- **Rendering**: 60fps en animaciones

## 🧪 Testing

### Casos de Prueba

```typescript
describe('OrderCardComponent', () => {
  it('debe mostrar badge rojo para pedidos 20+ minutos')
  it('debe emitir statusChange al hacer clic en acción')
  it('debe deshabilitar botones para pedidos finalizados')
})

describe('PedidosListaV2', () => {
  it('debe ordenar pedidos por urgencia')
  it('debe filtrar por tipo correctamente')
  it('debe mostrar banner de alerta con pedidos urgentes')
})
```

## 📝 Notas de Implementación

### Migración desde Versión Anterior
1. El componente antiguo (`pedidos-lista`) se mantiene intacto
2. La nueva versión es `pedidos-lista-v2`
3. Actualizar rutas para usar la v2
4. Los servicios son compatibles con ambas versiones

### Dependencias
- Angular 20+
- Angular Material 20+
- RxJS 7+
- TypeScript 5.6+

### Browser Support
- Chrome/Edge: últimas 2 versiones
- Firefox: últimas 2 versiones
- Safari: últimas 2 versiones
- iOS Safari: 15+

---

**Desarrollado para**: Sistema POS Dawz  
**Optimizado para**: Cocina y personal de servicio  
**Stack**: Angular 20 Standalone + Signals + Material 3
