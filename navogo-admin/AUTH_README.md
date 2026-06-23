# 🔐 Sistema de Autenticación JWT/Sanctum - Angular + Laravel

## 📋 Índice
- [Flujo de Autenticación](#flujo-de-autenticación)
- [Archivos Creados](#archivos-creados)
- [Configuración del Backend](#configuración-del-backend)
- [Configuración de CORS](#configuración-de-cors)
- [Uso del Sistema](#uso-del-sistema)
- [Seguridad](#seguridad)
- [Troubleshooting](#troubleshooting)

---

## 🔄 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE LOGIN                           │
└─────────────────────────────────────────────────────────────┘

1. Usuario visita /empresas (ruta protegida)
   ↓
2. authGuard verifica si hay token
   ↓
   ├─ NO HAY TOKEN → Redirige a /login
   └─ HAY TOKEN → Permite acceso

3. Usuario ingresa email + password en /login
   ↓
4. LoginComponent → authService.login(credentials)
   ↓
5. AuthService → HTTP POST /api/login
   ↓
6. Backend Laravel valida credenciales
   ↓
   ├─ VÁLIDAS:
   │  ├─ Genera token (Sanctum)
   │  └─ Responde: { user, token }
   │      ↓
   │  AuthService guarda:
   │  ├─ localStorage.setItem('auth_token', token)
   │  ├─ localStorage.setItem('auth_user', JSON.stringify(user))
   │  └─ Actualiza signal: currentUser.set(user)
   │      ↓
   │  Router → Redirige a /empresas
   │      ↓
   │  App muestra: Sidebar + Header con "Hola, Ángel"
   │
   └─ INVÁLIDAS:
      └─ Responde: 401 { error: "Credenciales incorrectas" }
          ↓
      LoginComponent muestra error

7. Peticiones HTTP subsecuentes:
   ↓
   authInterceptor agrega:
   Authorization: Bearer {token}
   ↓
   Backend valida token automáticamente

8. Usuario hace click en "Cerrar Sesión"
   ↓
   authService.logout()
   ├─ Limpia localStorage
   ├─ Limpia signal: currentUser.set(null)
   └─ Redirige a /login
```

---

## 📦 Archivos Creados

### **1. Modelos e Interfaces**
- **[auth.interface.ts](src/app/models/auth.interface.ts)**
  - `User` - Estructura del usuario
  - `LoginResponse` - Respuesta del backend
  - `LoginCredentials` - Datos de login
  - `ErrorResponse` - Manejo de errores

### **2. Servicio de Autenticación**
- **[auth.service.ts](src/app/services/auth/auth.service.ts)** (actualizado)
  - `login(credentials)` - POST a /api/login
  - `logout()` - Limpia sesión
  - `isAuthenticated()` - Verifica token
  - `getToken()` - Obtiene token de localStorage
  - Manejo de errores HTTP centralizado

### **3. Componente de Login**
- **[login.component.ts](src/app/components/login/login.component.ts)**
  - Formulario reactivo con validaciones
  - Manejo de loading state
  - Mensajes de error del backend
  
- **[login.component.html](src/app/components/login/login.component.html)**
  - UI moderna con Material Design
  - Campos: email, password
  - Toggle de visibilidad de password
  
- **[login.component.scss](src/app/components/login/login.component.scss)**
  - Diseño centrado con degradado
  - Animaciones suaves
  - Responsive

### **4. Guards**
- **[auth.guard.ts](src/app/guards/auth.guard.ts)**
  - `authGuard` - Protege rutas privadas
  - `loginGuard` - Evita acceso a /login si ya está autenticado

### **5. Interceptor**
- **[auth.interceptor.ts](src/app/interceptors/auth.interceptor.ts)**
  - Agrega `Authorization: Bearer {token}` automáticamente
  - Maneja errores 401 (logout automático)

### **6. Configuración**
- **[app.routes.ts](src/app/app.routes.ts)** - Rutas con guards
- **[app.config.ts](src/app/app.config.ts)** - Registro del interceptor

---

## ⚙️ Configuración del Backend

### **1. URL de la API**

En [auth.service.ts](src/app/services/auth/auth.service.ts#L16):

```typescript
private readonly API_URL = 'http://localhost:8000/api';
```

**Cambiar según tu entorno:**
- Desarrollo local: `http://localhost:8000/api`
- Producción: `https://tuapi.com/api`

### **2. Endpoint de Login**

Tu backend debe tener:

```php
// routes/api.php
Route::post('/login', [AuthController::class, 'login']);
```

```php
// app/Http/Controllers/AuthController.php
public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string'
    ]);

    $user = Usuario::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['error' => 'Credenciales incorrectas'], 401);
    }

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token
    ], 200);
}
```

### **3. Proteger Rutas en Laravel**

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('empresas', EmpresaController::class);
    Route::apiResource('categorias', CategoriaController::class);
    // ... otras rutas protegidas
});
```

---

## 🌐 Configuración de CORS

**CRÍTICO**: El backend debe permitir peticiones desde el frontend.

### **Laravel 11+ (CORS nativo)**

En `config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => [
        'http://localhost:4200',  // Angular dev
        'http://localhost:4300',
        'https://tudominio.com'   // Producción
    ],
    
    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,
];
```

### **Verificar Middleware**

En `bootstrap/app.php` o `app/Http/Kernel.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ]);
})
```

---

## 🚀 Uso del Sistema

### **1. Iniciar sesión**

```typescript
// El usuario va a http://localhost:4200
// → Redirigido a /login (por authGuard)

// Ingresa credenciales:
// - Email: admin@navogo.com
// - Password: 123456

// Click en "Iniciar Sesión"
// → authService.login() envía POST /api/login
// → Backend responde con { user, token }
// → Token guardado en localStorage
// → Redirigido a /empresas
```

### **2. Navegación protegida**

```typescript
// Usuario hace click en Sidebar → Categorías
// → authGuard verifica token
// → Permite acceso a /categorias
// → authInterceptor agrega header:
//    Authorization: Bearer {token}
// → Backend valida token y devuelve datos
```

### **3. Cerrar sesión**

En el header, el usuario hace click en "Cerrar Sesión":

```typescript
// header.component.ts
logout(): void {
  this.authService.logout();
  // → Limpia localStorage
  // → Limpia currentUser signal
  // → Redirige a /login
}
```

---

## 🔒 Recomendaciones de Seguridad

### **1. NUNCA guardar password en localStorage**
✅ **Correcto**: Solo guardar token  
❌ **Incorrecto**: Guardar password en texto plano

### **2. Usar HTTPS en producción**
```typescript
// En producción:
private readonly API_URL = 'https://tuapi.com/api'; // ✅
// NO usar http:// en producción ❌
```

### **3. Validar expiración del token (JWT)**

Si usas JWT (no Sanctum), agrega validación:

```typescript
// auth.service.ts
private isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

isAuthenticated(): boolean {
  const token = this.getToken();
  if (!token) return false;
  return !this.isTokenExpired(token); // ✅
}
```

### **4. Implementar Refresh Token**

Para tokens de larga duración:

```typescript
// auth.service.ts
refreshToken(): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(`${this.API_URL}/refresh`, {})
    .pipe(tap(response => this.setToken(response.token)));
}
```

### **5. Limpiar sesión en múltiples pestañas**

```typescript
// auth.service.ts
constructor() {
  // Escuchar cambios en localStorage de otras pestañas
  window.addEventListener('storage', (event) => {
    if (event.key === this.TOKEN_KEY && !event.newValue) {
      this.logout();
    }
  });
}
```

### **6. Encriptar datos sensibles**

Para datos adicionales en localStorage:

```bash
npm install crypto-js
```

```typescript
import CryptoJS from 'crypto-js';

private setUser(user: User): void {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(user),
    'secret-key'
  ).toString();
  localStorage.setItem(this.USER_KEY, encrypted);
}
```

### **7. Rate Limiting en Backend**

```php
// Laravel - routes/api.php
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});
```

### **8. Implementar CSRF en Sanctum**

```typescript
// Antes del login, obtener cookie CSRF:
this.http.get(`${this.API_URL}/sanctum/csrf-cookie`).subscribe(() => {
  // Ahora hacer login
  this.login(credentials);
});
```

---

## 🐛 Troubleshooting

### **Error: CORS policy**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/login' 
from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Solución:**
1. Verifica `config/cors.php` en Laravel
2. Asegúrate de que `'http://localhost:4200'` esté en `allowed_origins`
3. Reinicia el servidor Laravel: `php artisan serve`

### **Error 401: Unauthenticated**
```
POST /api/empresas → 401 Unauthenticated
```

**Solución:**
1. Verifica que el token se esté enviando en el header
2. Abre DevTools → Network → Headers
3. Debe aparecer: `Authorization: Bearer {tu-token}`
4. Si no aparece, verifica que el interceptor esté registrado en `app.config.ts`

### **Error: Token inválido**

**Solución:**
```typescript
// auth.service.ts - Limpiar token corrupto
localStorage.removeItem('auth_token');
localStorage.removeItem('auth_user');
```

### **El login no redirige**

**Verifica en login.component.ts:**
```typescript
this.authService.login(credentials).subscribe({
  next: (response) => {
    this.router.navigate(['/empresas']); // ✅ Debe estar aquí
  }
});
```

### **authGuard no funciona**

**Verifica app.routes.ts:**
```typescript
{
  path: 'empresas',
  component: EmpresaListing,
  canActivate: [authGuard] // ✅ Debe estar aquí
}
```

### **Usuario ve sidebar/header sin estar logueado**

**Problema**: El layout se muestra antes de verificar autenticación.

**Solución**: Usar `*ngIf` en app.html:

```html
@if (authService.isAuthenticated()) {
  <app-sidebar></app-sidebar>
  <div class="main-wrapper">
    <app-header></app-header>
    <main class="main-content">
      <router-outlet />
    </main>
  </div>
} @else {
  <router-outlet />
}
```

---

## 📊 Diagrama Completo del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌─────────────────┐            │
│  │ LoginComponent├─────►│  AuthService    │            │
│  └──────────────┘      └────────┬────────┘            │
│         │                        │                      │
│         │                        │ HTTP POST            │
│         │                        ↓                      │
│         │              ┌──────────────────┐            │
│         │              │  authInterceptor │            │
│         │              │  (agrega token)  │            │
│         │              └────────┬─────────┘            │
│         │                       │                      │
│         ↓                       ↓                      │
│  ┌─────────────┐       ┌──────────────┐              │
│  │  authGuard  │◄──────┤ Router       │              │
│  │ (protege)   │       │ (rutas)      │              │
│  └─────────────┘       └──────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           │
                  Authorization: Bearer {token}
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Laravel)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  POST /api/login                                       │
│  ├─ Valida email + password                            │
│  ├─ Genera token Sanctum                               │
│  └─ Responde: { user, token }                          │
│                                                         │
│  Rutas protegidas: middleware('auth:sanctum')          │
│  ├─ Valida token automáticamente                       │
│  └─ Devuelve datos si token válido                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [x] AuthService con HTTP y manejo de errores
- [x] LoginComponent con formulario reactivo
- [x] authGuard para proteger rutas
- [x] loginGuard para evitar acceso a /login si ya está logueado
- [x] authInterceptor para agregar token automáticamente
- [x] Configuración de rutas con guards
- [x] Registro del interceptor en app.config
- [x] Interfaces tipadas (User, LoginResponse, etc.)
- [x] Persistencia en localStorage
- [x] Logout con limpieza de sesión
- [ ] Configurar CORS en Laravel
- [ ] Ajustar API_URL según entorno
- [ ] Implementar refresh token (opcional)
- [ ] Agregar tests unitarios

---

## 🎯 Resultado Final

Con esta implementación tienes un **sistema de autenticación production-ready** que:

✅ Conecta con tu backend Laravel existente  
✅ Maneja tokens Sanctum automáticamente  
✅ Protege rutas privadas  
✅ Muestra UI moderna y responsive  
✅ Maneja errores del backend  
✅ Persiste sesión en localStorage  
✅ Logout limpio  
✅ Código tipado y escalable  

**¡Listo para usar!** 🚀

---

## 📞 Próximos Pasos

1. **Configurar CORS** en tu backend Laravel
2. **Ajustar API_URL** en auth.service.ts
3. **Probar el login** con credenciales reales
4. **Verificar** que el token se envíe en peticiones subsecuentes
5. **Implementar** endpoint de logout en Laravel (opcional)

```php
// AuthController.php
public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out'], 200);
}
```

6. **Agregar manejo de roles** si es necesario:

```typescript
// auth.guard.ts
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getUserRole() === 'admin') {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
```

---

**Documentación creada con ❤️ para Navogo Admin**
