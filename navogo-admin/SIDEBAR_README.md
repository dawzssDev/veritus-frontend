# 🎯 Sidebar Profesional - Angular 20

## 📋 Índice
- [Características](#características)
- [Instalación](#instalación)
- [Uso Básico](#uso-básico)
- [Configuración](#configuración)
- [Personalización](#personalización)
- [Control de Acceso](#control-de-acceso)
- [Responsive](#responsive)
- [API Reference](#api-reference)

---

## ✨ Características

✅ **Standalone Component** - Angular 20+ compatible  
✅ **Colapsar/Expandir** - Con persistencia en localStorage  
✅ **Angular Signals** - Gestión de estado reactiva  
✅ **Router Integration** - Detección automática de ruta activa  
✅ **Submenús** - Soporte para menús anidados  
✅ **Badges** - Contadores y notificaciones  
✅ **Tooltips** - En modo colapsado  
✅ **Responsive** - Adaptado para mobile  
✅ **Accesibilidad** - ARIA labels y navegación por teclado  
✅ **Animaciones suaves** - Transiciones CSS optimizadas  
✅ **TypeScript tipado** - Interfaces completas  

---

## 🚀 Instalación

### 1. Estructura de archivos creados:
```
src/app/
├── components/
│   └── sidebar/
│       ├── sidebar.component.ts
│       ├── sidebar.component.html
│       └── sidebar.component.scss
├── models/
│   └── menu.interface.ts
├── services/
│   └── sidebar/
│       └── sidebar.service.ts
└── layouts/
    └── main-layout.component.ts
```

### 2. Dependencias requeridas:
```bash
# Angular Material (si no lo tienes instalado)
ng add @angular/material
```

Selecciona un tema y configura animaciones cuando te lo pida.

### 3. Importar Material Icons (si no está configurado):

En tu `index.html`:
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

O en `styles.css`:
```css
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
```

---

## 📦 Uso Básico

### Opción 1: Integración con Layout Component

**Paso 1:** Modifica tu `app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'empresas', component: EmpresaListingComponent },
      { path: 'categorias', component: CategoriasListaComponent },
      { path: 'productos', component: ProductoListaComponent },
      { path: 'publicidad', component: PublicidadListaComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
```

**Paso 2:** Tu app ya tendrá el sidebar automáticamente.

### Opción 2: Uso directo en app.component

En tu `app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
    }
    .content {
      flex: 1;
      margin-left: 260px;
      padding: 24px;
      transition: margin-left 0.3s ease;
    }
  `]
})
export class AppComponent {}
```

---

## ⚙️ Configuración

### Personalizar el Menú

Edita el array `menuItems` en `sidebar.component.ts`:

```typescript
menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
    badge: 5,              // Opcional: mostrar contador
    badgeColor: 'warn'     // 'primary' | 'accent' | 'warn'
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: 'assessment',
    children: [            // Submenú
      {
        id: 'reportes-ventas',
        label: 'Ventas',
        icon: 'show_chart',
        route: '/reportes/ventas'
      }
    ]
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: 'admin_panel_settings',
    route: '/admin',
    roles: ['admin'],      // Control de acceso por roles
    disabled: false        // Opcional: deshabilitar item
  }
];
```

### Cambiar colores y estilos

En `sidebar.component.scss`, ajusta las variables:

```scss
// Variables personalizables
$sidebar-width-expanded: 260px;
$sidebar-width-collapsed: 70px;

$primary-color: #1976d2;        // Tu color primario
$background-dark: #1a1a2e;      // Fondo superior
$background-light: #16213e;     // Fondo inferior (degradado)
$text-primary: #ffffff;
$text-secondary: #b0b3b8;
```

---

## 🎨 Personalización Avanzada

### Cambiar íconos

Usa cualquier ícono de [Material Icons](https://fonts.google.com/icons):

```typescript
{
  id: 'usuarios',
  label: 'Usuarios',
  icon: 'people',  // ← Cambia aquí
  route: '/usuarios'
}
```

### Agregar logo personalizado

Reemplaza en `sidebar.component.html`:

```html
<div class="logo-full">
  <!-- Opción 1: Imagen -->
  <img src="assets/logo.png" alt="Logo" class="logo-image" />
  <span class="logo-text">Mi App</span>
  
  <!-- Opción 2: Solo texto con estilo -->
  <span class="logo-text-styled">NAVOGO</span>
</div>
```

Y añade en el SCSS:
```scss
.logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo-text-styled {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 🔐 Control de Acceso por Roles

### Paso 1: Crear servicio de autenticación

```typescript
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<{ roles: string[] } | null>(null);

  getUserRoles(): string[] {
    return this.currentUser()?.roles || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }
}
```

### Paso 2: Modificar `sidebar.component.ts`

```typescript
constructor(
  private router: Router,
  private authService: AuthService  // ← Inyectar
) { ... }

hasPermission(item: MenuItem): boolean {
  if (!item.roles || item.roles.length === 0) {
    return true;
  }
  
  const userRoles = this.authService.getUserRoles();
  return item.roles.some(role => userRoles.includes(role));
}
```

### Paso 3: Usar en el menú

```typescript
menuItems: MenuItem[] = [
  {
    id: 'admin',
    label: 'Administración',
    icon: 'admin_panel_settings',
    route: '/admin',
    roles: ['admin', 'superadmin']  // Solo visible para estos roles
  }
];
```

---

## 📱 Responsive (Mobile)

El sidebar incluye estilos responsive básicos. Para implementación completa:

### Agregar overlay y botón hamburguesa:

```typescript
// sidebar.component.ts
export class SidebarComponent {
  isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }
}
```

```html
<!-- sidebar.component.html -->
<aside 
  class="sidebar" 
  [class.collapsed]="isCollapsed()"
  [class.mobile-open]="isMobileMenuOpen()">
  <!-- contenido del sidebar -->
</aside>

<!-- Overlay para cerrar en mobile -->
@if (isMobileMenuOpen()) {
  <div class="sidebar-overlay" (click)="toggleMobileMenu()"></div>
}
```

```scss
// sidebar.component.scss (ya incluido)
@media (max-width: 768px) {
  .sidebar {
    &:not(.mobile-open) {
      transform: translateX(-100%);
    }
  }
}
```

---

## 📚 API Reference

### MenuItem Interface

```typescript
interface MenuItem {
  id: string;              // Identificador único
  label: string;           // Texto visible
  icon: string;            // Nombre del ícono Material
  route?: string;          // Ruta de navegación
  children?: MenuItem[];   // Submenús
  roles?: string[];        // Control de acceso
  badge?: number | string; // Contador/notificación
  badgeColor?: 'primary' | 'accent' | 'warn';
  disabled?: boolean;      // Deshabilitar item
  expanded?: boolean;      // Estado del submenú (interno)
}
```

### SidebarComponent Methods

| Método | Descripción |
|--------|-------------|
| `toggleSidebar()` | Alterna estado colapsado/expandido |
| `navigateTo(item: MenuItem)` | Navega o expande submenú |
| `isActive(route?: string)` | Verifica si ruta está activa |
| `hasActiveChild(item: MenuItem)` | Verifica si submenú tiene hijo activo |
| `hasPermission(item: MenuItem)` | Verifica permisos (integrar con auth) |

### SidebarService Methods

| Método | Descripción |
|--------|-------------|
| `toggleSidebar()` | Toggle global del sidebar |
| `setSidebarState(collapsed: boolean)` | Establece estado específico |
| `getMenuItems()` | Obtiene items del menú (extendible a API) |
| `filterMenuByRoles(items, roles)` | Filtra menú por roles |

---

## 🎯 Características Técnicas

### Signals (Angular 20+)
```typescript
isCollapsed = signal(false);  // Estado reactivo
activeRoute = signal('');     // Ruta actual
```

### Persistencia en localStorage
El estado del sidebar se guarda automáticamente:
```typescript
localStorage.setItem('sidebarCollapsed', 'true');
```

### Detección de ruta activa
```typescript
this.router.events
  .pipe(filter(event => event instanceof NavigationEnd))
  .subscribe((event: any) => {
    this.activeRoute.set(event.urlAfterRedirects);
  });
```

---

## 🚀 Mejoras Futuras Sugeridas

### 1. **Menú Dinámico desde API**
```typescript
// sidebar.service.ts
getMenuFromAPI(): Observable<MenuItem[]> {
  return this.http.get<MenuItem[]>('/api/menu');
}
```

### 2. **Favoritos**
Permitir al usuario marcar items como favoritos:
```typescript
interface MenuItem {
  // ...existing properties
  isFavorite?: boolean;
}
```

### 3. **Búsqueda en menú**
Agregar input de búsqueda para filtrar items.

### 4. **Temas claro/oscuro**
Implementar toggle de tema con CSS variables.

### 5. **Drag & Drop**
Permitir reordenar items del menú.

### 6. **Notificaciones en tiempo real**
Actualizar badges dinámicamente con WebSockets.

### 7. **Multi-idioma (i18n)**
```typescript
{
  id: 'dashboard',
  label: this.translate.instant('menu.dashboard'),
  // ...
}
```

---

## 🐛 Troubleshooting

### Error: "Can't bind to 'matTooltip'"
**Solución:** Asegúrate de importar `MatTooltipModule` en el componente.

### El sidebar no se muestra
**Solución:** Verifica que las rutas estén correctamente configuradas y que el componente esté importado.

### Los íconos no aparecen
**Solución:** Importa Material Icons en `index.html`:
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

### El contenido se superpone con el sidebar
**Solución:** Añade `margin-left` al contenido principal igual al ancho del sidebar.

---

## 📝 Licencia

Este código es de uso libre para proyectos comerciales y personales.

---

## 👨‍💻 Autor

Desarrollado con ❤️ usando Angular 20 y TypeScript.

---

## 📞 Soporte

Para preguntas o mejoras, revisa la documentación de Angular:
- [Angular Docs](https://angular.dev)
- [Material Design](https://material.angular.io)

---

**¡Listo para producción! 🚀**
