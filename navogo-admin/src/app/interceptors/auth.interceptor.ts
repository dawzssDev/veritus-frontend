import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Auth Interceptor - Agrega el token a las peticiones HTTP
 * 
 * Funcionalidad:
 * 1. Agrega el header Authorization: Bearer {token} a todas las peticiones
 * 2. Maneja errores 401 (no autorizado) para hacer logout automático
 * 3. Solo aplica el token si existe
 * 
 * IMPORTANTE: Registrar en app.config.ts:
 * provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // NOTA: El flujo de pedidos (/api/orders) se usa tanto en público (cliente)
  // como en admin. Si se envía Authorization en un backend sin manejo correcto
  // de preflight OPTIONS/CORS, el request puede quedarse "pending".
  // Por seguridad, idealmente el backend debe proteger rutas admin; pero aquí
  // evitamos colgar la UI del cliente/admin.
  const isOrdersEndpoint = /\/api\/orders(\/|$)/.test(req.url);

  const shouldAttachToken = !!token && !isOrdersEndpoint;

  // Clonar request y agregar token si existe
  if (shouldAttachToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Continuar con la petición y manejar errores
  return next(req).pipe(
    catchError((error) => {
      // Si es error 401, hacer logout automático
      // IMPORTANTE: evitar mandar a /login en flujos públicos (ej. /menu)
      // cuando el backend responde 401 sin que hubiéramos mandado token.
      if (error.status === 401 && shouldAttachToken) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
