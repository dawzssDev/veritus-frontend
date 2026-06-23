import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

function getHomeRoute(authService: AuthService): string {
  const roleId = authService.getUserRoleId();
  switch (roleId) {
    case 2: return '/ventas-mostrador'; // Caja
    case 3: return '/mesas';            // Mesero
    case 4: return '/pedidos';          // Cocina
    default: return '/dashboard-ventas'; // Admin
  }
}

/**
 * AuthGuard - Protege rutas que requieren autenticación
 * 
 * USO:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Guardar la URL intentada para redirigir después del login
  router.navigate(['/sistema-administrativo'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

/**
 * LoginGuard - Evita que usuarios autenticados accedan al login
 * 
 * USO:
 * {
 *   path: 'sistema-administrativo',
 *   component: LoginComponent,
 *   canActivate: [loginGuard]
 * }
 */
export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, no debería ver login.
  if (authService.isAuthenticated()) {
    router.navigate([getHomeRoute(authService)], { replaceUrl: true });
    return false;
  }

  // Si NO está autenticado, permitir acceso al login.
  return true;
};

/**
 * RoleGuard - Protege rutas basándose en roles de usuario
 * 
 * USO:
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard],
 *   data: { roles: [1] } // Solo admin (roleId = 1)
 * }
 * 
 * O para múltiples roles:
 * data: { roles: [1, 2] } // Admin o Empleado
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Primero verificar que esté autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/sistema-administrativo'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Obtener roles permitidos desde route data
  const allowedRoles = route.data['roles'] as number[];
  
  // Si no se especifican roles, permitir acceso (solo requiere autenticación)
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Verificar si el usuario tiene uno de los roles permitidos
  if (authService.hasRole(allowedRoles)) {
    return true;
  }

  // Si no tiene el rol requerido, redirigir a la pantalla de inicio según su rol
  router.navigate([getHomeRoute(authService)]);
  return false;
};
