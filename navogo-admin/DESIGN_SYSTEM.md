# 🎨 Sistema de Diseño - Componentes de Listado

Este documento describe el sistema de diseño moderno implementado para los componentes de listado de la aplicación Navogo Admin.

## 📋 Componentes Actualizados

Los siguientes componentes han sido mejorados con un diseño profesional, moderno y atractivo:

1. **Categorías** (`categorias-lista`)
2. **Empresas** (`empresa-listing`)
3. **Productos** (`producto-lista`)
4. **Publicidad** (`publicidad-lista`)

---

## 🎯 Características del Nuevo Diseño

### ✨ Header con Gradiente
- Gradiente morado moderno: `#667eea → #764ba2`
- Iconos identificativos para cada sección
- Botón de acción destacado con efecto hover
- Responsive con adaptación en móviles

### 📊 Tablas Mejoradas
- Headers con fondo degradado sutil
- Efecto hover en filas con elevación
- Scroll horizontal personalizado
- Animaciones suaves en interacciones

### 🏷️ Badges de Estado
- **Activo**: Badge verde con ícono de check
- **Inactivo**: Badge rojo con ícono de cancelar
- Diseño pill (pastilla redondeada)
- Texto en mayúsculas con espaciado

### 🖼️ Imágenes de Productos
- Tamaño consistente: 48x48px
- Bordes redondeados (8px)
- Sombra sutil
- Borde de 2px para definición

### 🎯 Botones de Acción
- Botones mini FAB (Floating Action Button)
- **Editar**: Azul (`#007bff`)
- **Eliminar**: Rojo (`#dc3545`)
- Efecto de escala al hacer hover
- Tooltips descriptivos

### 📭 Estado Vacío (Empty State)
- Ícono grande y descriptivo
- Mensaje claro y amigable
- Botón de acción para comenzar
- Diseño centrado y espacioso

### 📄 Paginador Mejorado
- Fondo gris claro
- Botones de primera/última página
- Tamaños de página: 5, 10, 25, 50
- Bordes redondeados inferiores

---

## 🎨 Paleta de Colores

### Colores Principales
```scss
// Header Gradient
#667eea → #764ba2

// Estados
$success: #28a745  // Verde (Activo)
$danger: #dc3545   // Rojo (Inactivo/Eliminar)
$primary: #007bff  // Azul (Editar/Primary)
$warning: #ffc107  // Amarillo (Pendiente)

// Grises
$gray-100: #f8f9fa
$gray-200: #e9ecef
$gray-300: #dee2e6
$gray-600: #6c757d
$gray-800: #212529
```

### Sombras
```scss
// Card principal
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

// Botones elevated
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

// Hover state
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
```

---

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 768px
- **Tablet**: 480px - 768px
- **Mobile**: < 480px

### Adaptaciones Móviles
- Header en columna
- Botones de ancho completo
- Imágenes más pequeñas (40x40px)
- Acciones apiladas verticalmente
- Padding reducido

---

## 🔧 Estructura de Archivos

```
src/
├── styles/
│   └── shared-listing.scss          # 🎨 Estilos compartidos
├── app/
│   └── components/
│       ├── categorias-lista/
│       │   ├── categorias-lista.html
│       │   ├── categorias-lista.ts
│       │   └── categorias-lista.scss    # Importa shared-listing.scss
│       ├── empresa-listing/
│       │   ├── empresa-listing.html
│       │   ├── empresa-listing.ts
│       │   └── empresa-listing.scss     # Importa shared-listing.scss
│       ├── producto-lista/
│       │   ├── producto-lista.html
│       │   ├── producto-lista.ts
│       │   └── producto-lista.scss      # Importa shared-listing.scss
│       └── publicidad-lista/
│           ├── publicidad-lista.html
│           ├── publicidad-lista.ts
│           └── publicidad-lista.scss    # Importa shared-listing.scss
```

---

## 💻 Uso del Sistema

### Importar Estilos
Cada componente importa el archivo de estilos compartidos:

```scss
// En cada archivo .scss del componente
@import '../../../styles/shared-listing.scss';
```

### Clases CSS Disponibles

#### Contenedor Principal
```html
<div class="dashboard-container">
  <!-- Contenido -->
</div>
```

#### Header
```html
<div class="header">
  <div class="header-content">
    <div class="header-text">
      <h1 class="title">
        <mat-icon>category</mat-icon>
        Título
      </h1>
      <p>Descripción</p>
    </div>
    <div class="header-actions">
      <button mat-raised-button>Acción</button>
    </div>
  </div>
</div>
```

#### Tabla
```html
<div class="content-card">
  <div class="table-container">
    <table mat-table class="custom-table">
      <!-- Definiciones de columnas -->
    </table>
  </div>
</div>
```

#### Celda con Imagen
```html
<div class="cell-with-image">
  <img src="..." class="product-image" />
  <div class="product-info">
    <span class="product-name">Nombre</span>
  </div>
</div>
```

#### Badge de Estado
```html
<span [ngClass]="{
  'status-badge': true,
  'status-active': esActivo,
  'status-inactive': !esActivo
}">
  <mat-icon>check_circle</mat-icon>
  Activo
</span>
```

#### Botones de Acción
```html
<div class="actions-cell">
  <button mat-mini-fab class="edit-btn">
    <mat-icon>edit</mat-icon>
  </button>
  <button mat-mini-fab class="delete-btn">
    <mat-icon>delete</mat-icon>
  </button>
</div>
```

#### Empty State
```html
<div class="empty-state">
  <mat-icon>icon_name</mat-icon>
  <h3>Título</h3>
  <p>Descripción</p>
  <button mat-raised-button>
    <mat-icon>add</mat-icon>
    Acción
  </button>
</div>
```

---

## 🎭 Animaciones

### fadeIn
Animación de entrada para el contenedor:
```scss
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Hover Effects
- **Filas de tabla**: Fondo gris + ligera elevación
- **Botones**: Elevación aumentada + translateY(-2px)
- **Botones de acción**: Scale(1.1)

---

## 🛠️ Módulos de Angular Material Requeridos

Asegúrate de que los componentes importen estos módulos:

```typescript
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
```

---

## 📊 Iconos por Componente

| Componente | Icono | Material Icon |
|------------|-------|---------------|
| Categorías | 📦 | `category` |
| Empresas | 🏢 | `business` |
| Productos | 📦 | `inventory_2` |
| Publicidad | 📢 | `campaign` |

---

## ✅ Checklist de Implementación

- [x] Crear archivo de estilos compartidos
- [x] Actualizar HTML de todos los componentes
- [x] Cambiar referencias de .css a .scss
- [x] Agregar MatTooltipModule a imports
- [x] Implementar badges de estado
- [x] Añadir empty states
- [x] Configurar paginador mejorado
- [x] Responsive design
- [x] Animaciones de entrada
- [x] Personalizar scrollbar global

---

## 🎓 Mejores Prácticas

### 1. Consistencia
Todos los componentes de listado comparten la misma estructura y estilos.

### 2. Accesibilidad
- Uso de `aria-label` en botones
- Tooltips descriptivos con `matTooltip`
- Contraste adecuado de colores

### 3. Performance
- Estilos compartidos (un solo archivo)
- Animaciones con GPU (transform, opacity)
- Lazy loading de imágenes

### 4. Mantenibilidad
- Variables SCSS centralizadas
- Clases reutilizables
- Comentarios descriptivos
- Nomenclatura consistente

---

## 🚀 Extensiones Futuras

### Ideas para Mejorar
- [ ] Modo oscuro (Dark mode)
- [ ] Filtros avanzados en tablas
- [ ] Búsqueda en tiempo real
- [ ] Exportar a CSV/PDF
- [ ] Vista de tarjetas (Card view)
- [ ] Drag & drop para reordenar
- [ ] Acciones por lotes
- [ ] Historial de cambios

---

## 📖 Referencias

- [Angular Material Design](https://material.angular.io/)
- [Material Design Guidelines](https://m3.material.io/)
- [SCSS Documentation](https://sass-lang.com/documentation)

---

## 👨‍💻 Autor

**Navogo Admin Team**  
Fecha: 2025  
Versión: 2.0

---

## 📝 Notas

Este sistema de diseño se puede extender fácilmente a otros componentes de la aplicación. Para agregar nuevos componentes de listado:

1. Crea el HTML siguiendo la estructura del ejemplo
2. Importa `shared-listing.scss` en tu archivo SCSS
3. Agrega los módulos de Material necesarios
4. Usa las clases CSS documentadas aquí

¡Mantén la consistencia visual en toda la aplicación! 🎨✨
