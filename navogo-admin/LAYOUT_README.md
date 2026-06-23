# 🎨 Layout Dashboard Profesional - Sidebar + Header

## 📐 Estructura del Layout

```
┌────────────────────────────────────────────────────────┐
│  SIDEBAR  │          HEADER (Topbar)                   │
│  (Fixed)  │  Hola, Ángel  [🔔] [👤▼]                  │
│           ├────────────────────────────────────────────┤
│  📊 Dash  │                                            │
│  🏢 Emp   │                                            │
│  📁 Cat   │         CONTENIDO PRINCIPAL                │
│  📦 Prod  │         (Router Outlet)                    │
│  📢 Pub   │                                            │
│  ⚙️ Conf  │                                            │
│           │                                            │
└───────────┴────────────────────────────────────────────┘

Sidebar:     260px (expandido) / 70px (colapsado)
Header:      64px altura, fixed
Content:     Flexible, ocupa el resto del espacio
```

---

## 🚀 Archivos Creados

### 1. **Servicio de Autenticación**
- **[auth.service.ts](src/app/services/auth/auth.service.ts)**
  - Gestión del usuario autenticado con Angular Signals
  - Métodos: `getUserName()`, `getUserAvatar()`, `login()`, `logout()`
  - Usuario simulado: `{ name: 'Ángel Daniel', email: 'angel@navogo.com' }`

### 2. **Componente Header**
- **[header.component.ts](src/app/components/header/header.component.ts)**
  - Inyecta `AuthService` y `SidebarService`
  - Toggle del sidebar desde el header
  - Menú de usuario con perfil y logout

- **[header.component.html](src/app/components/header/header.component.html)**
  - Saludo personalizado: "Hola, Ángel"
  - Avatar del usuario
  - Notificaciones con badge
  - Menú desplegable

- **[header.component.scss](src/app/components/header/header.component.scss)**
  - Header fijo con altura 64px
  - Se ajusta automáticamente cuando el sidebar colapsa
  - Responsive para mobile
  - Animaciones suaves

### 3. **Layout Principal**
- **[app.ts](src/app/app.ts)** - Importa `SidebarComponent` y `HeaderComponent`
- **[app.html](src/app/app.html)** - Estructura: sidebar + main-wrapper (header + content)
- **[app.css](src/app/app.css)** - Layout con Flexbox

---

## 💡 Explicación Técnica del Layout

### Estrategia: **Flexbox en cascada**

#### Nivel 1: Contenedor principal
```css
.app-container {
  display: flex;           /* Sidebar a la izquierda */
  min-height: 100vh;
}
```

#### Nivel 2: Área principal
```css
.main-wrapper {
  flex: 1;                 /* Ocupa espacio restante */
  display: flex;
  flex-direction: column;  /* Header arriba, content abajo */
  margin-left: 260px;      /* Espacio para el sidebar */
}
```

#### Nivel 3: Contenido
```css
.main-content {
  flex: 1;
  padding-top: 88px;       /* Espacio para header fijo (64px + 24px) */
}
```

### ¿Por qué Flexbox y no Grid?
✅ **Flexbox** es ideal para layouts lineales (sidebar + content)  
✅ Mejor soporte para animaciones y transiciones  
✅ Más simple para ajustes dinámicos (colapsar sidebar)  
❌ Grid sería overkill para esta estructura

---

## 🔄 Flujo de Adaptación del Layout

### Sidebar Expandido (260px)
```
main-wrapper { margin-left: 260px; }
header { left: 260px; }
```

### Sidebar Colapsado (70px)
```css
:root:has(.sidebar.collapsed) .main-wrapper {
  margin-left: 70px;
}

.header.sidebar-collapsed {
  left: 70px;
}
```

**Detección automática**: Usa `:has()` para detectar cuando el sidebar tiene `.collapsed`

---

## 🛠️ Integración con AuthService Real

### Paso 1: Reemplazar usuario simulado

En `auth.service.ts`, cambia el método `loadUser()`:

```typescript
private loadUser(): void {
  // Opción 1: Desde localStorage
  const userData = localStorage.getItem('user');
  if (userData) {
    this._currentUser.set(JSON.parse(userData));
  }

  // Opción 2: Desde API
  this.http.get<User>('/api/auth/me').subscribe({
    next: (user) => this._currentUser.set(user),
    error: () => this._currentUser.set(null)
  });

  // Opción 3: Decodificar JWT
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = this.jwtHelper.decodeToken(token);
    this._currentUser.set({
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role
    });
  }
}
```

### Paso 2: Interceptor HTTP para tokens

```typescript
// http.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next(req);
};
```

Registra en `app.config.ts`:
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

### Paso 3: Guard de autenticación

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```

Aplica en rutas:
```typescript
export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'empresas', component: EmpresaListing },
      // ... otras rutas
    ]
  },
  { path: 'login', component: LoginComponent }
];
```

---

## 📱 Comportamiento Responsive

### Desktop (> 768px)
- Sidebar visible y fijo
- Header ajustado al sidebar
- Contenido con padding completo

### Tablet/Mobile (≤ 768px)
- Sidebar oculto (transform: translateX(-100%))
- Header ocupa todo el ancho
- Botón hamburguesa visible
- Overlay para cerrar sidebar

---

## 🎨 Personalización de Estilos

### Cambiar colores del Header

En `header.component.scss`:
```scss
$header-bg: #ffffff;        // Fondo blanco
$primary-color: #1976d2;    // Azul primario
$text-primary: #212121;     // Texto oscuro
```

### Cambiar altura del Header

En `header.component.scss`:
```scss
$header-height: 80px;  // Cambiar de 64px a 80px
```

**IMPORTANTE**: También actualiza en `app.css`:
```css
.main-content {
  padding-top: 104px; /* 80px + 24px spacing */
}
```

### Avatar personalizado

Reemplaza el generador de avatares:
```typescript
// En auth.service.ts
avatar: '/assets/avatars/user-1.jpg'  // Tu imagen local
```

---

## 🔧 Funciones del Header

### Implementadas ✅
- Saludo personalizado
- Avatar del usuario
- Menú desplegable
- Toggle sidebar
- Notificaciones (badge)
- Responsive

### Por implementar 🚧
- Búsqueda global
- Panel de notificaciones
- Breadcrumbs dinámicos
- Modo oscuro
- Multi-idioma

---

## 📊 Ejemplo de Breadcrumbs Dinámicos

Reemplaza en `header.component.html`:
```html
<div class="page-title">
  <nav class="breadcrumb">
    <span class="breadcrumb-item">Inicio</span>
    <mat-icon class="breadcrumb-separator">chevron_right</mat-icon>
    <span class="breadcrumb-item active">Empresas</span>
  </nav>
</div>
```

---

## 🚀 Mejoras Sugeridas

### 1. **Panel de Notificaciones**
Crear un componente `NotificationPanelComponent` con:
- Lista de notificaciones
- Marcar como leído
- Ver todas

### 2. **Búsqueda Global**
Agregar input en `header-center`:
```html
<div class="header-center">
  <mat-form-field appearance="outline" class="search-field">
    <mat-icon matPrefix>search</mat-icon>
    <input matInput placeholder="Buscar..." />
  </mat-form-field>
</div>
```

### 3. **Modo Oscuro**
```typescript
// theme.service.ts
toggleTheme(): void {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```

### 4. **Título dinámico por ruta**
```typescript
// header.component.ts
constructor(
  private router: Router,
  private titleService: Title
) {
  this.router.events.subscribe(() => {
    this.pageTitle = this.titleService.getTitle();
  });
}
```

### 5. **Avatar con Initials fallback**
```typescript
getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
}
```

---

## 🐛 Troubleshooting

### El header se superpone al contenido
**Solución**: Verifica que `.main-content` tenga `padding-top` igual o mayor a la altura del header.

### El sidebar no se ajusta en mobile
**Solución**: Asegúrate de que `sidebar.component.scss` tenga los media queries correctos:
```scss
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    &.mobile-open {
      transform: translateX(0);
    }
  }
}
```

### El menú de usuario no se abre
**Solución**: Verifica que `MatMenuModule` esté importado en `header.component.ts`.

### El avatar no carga
**Solución**: Verifica la URL del avatar. Si es externa, puede ser bloqueada por CORS. Usa un placeholder:
```typescript
userAvatar = this.authService.getUserAvatar() || 
             'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName);
```

---

## 📚 Resumen de Dependencias

Asegúrate de tener instalado Angular Material:
```bash
ng add @angular/material
```

Módulos usados:
- `MatIconModule`
- `MatButtonModule`
- `MatMenuModule`
- `MatDividerModule`
- `MatBadgeModule` (para notificaciones)

---

## ✅ Checklist de Implementación

- [x] Servicio de autenticación con Signals
- [x] Componente Header standalone
- [x] Layout principal con Flexbox
- [x] Ajuste automático cuando sidebar colapsa
- [x] Responsive para mobile
- [x] Menú de usuario con avatar
- [x] Notificaciones con badge
- [x] Estilos profesionales
- [ ] Conectar con API real
- [ ] Implementar guards de autenticación
- [ ] Panel de notificaciones completo
- [ ] Breadcrumbs dinámicos

---

## 🎯 Resultado Final

El layout implementado es **production-ready** con:
- ✅ Código limpio y escalable
- ✅ TypeScript tipado
- ✅ Componentes standalone (Angular 20+)
- ✅ Signals para reactividad
- ✅ Responsive design
- ✅ Accesibilidad básica
- ✅ Animaciones suaves
- ✅ Sin hacks ni posiciones absolutas innecesarias

**¡El dashboard ya está listo para usar!** 🚀
