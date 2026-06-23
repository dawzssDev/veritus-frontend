import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, LoginResponse, LoginCredentials } from '../../models/auth.interface';
import { TrialService } from '../trial/trial.service';
import { environment } from '../../../environments/environment';

/**
 * Servicio de autenticación
 * Maneja login, logout, estado del usuario y persistencia del token
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** URL base de la API - AJUSTAR SEGÚN TU BACKEND */
  private readonly API_URL = environment.apiUrl;
  
  /** Keys para localStorage */
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  /** Usuario actual usando Angular Signals */
  private _currentUser = signal<User | null>(null);
  
  /** Subject para reactividad adicional (útil para componentes que no usan signals) */
  private _userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this._userSubject.asObservable();

  /** Getter público de solo lectura */
  get currentUser() {
    return this._currentUser.asReadonly();
  }

  /**
   * Verifica si estamos en el navegador (no en SSR)
   */
  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private trialService: TrialService
  ) {
    // Cargar usuario desde localStorage al iniciar (solo en browser)
    if (this.isBrowser) {
      this.loadStoredUser();
    }
  }

  /**
   * Carga el usuario desde localStorage si existe
   */
  private loadStoredUser(): void {
    if (!this.isBrowser) return;
    
    const token = this.getToken();
    const userJson = localStorage.getItem(this.USER_KEY);
    
    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this._currentUser.set(user);
        this._userSubject.next(user);
      } catch (error) {
        // Si hay error al parsear, limpiar localStorage
        this.clearStorage();
      }
    }
  }

  /**
   * Login con email y password
   * @param credentials - Email y password
   * @returns Observable con la respuesta del login
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          // Guardar token y usuario
          this.setToken(response.token);
          this.setUser(response.user);
          
          // Actualizar estado reactivo
          this._currentUser.set(response.user);
          this._userSubject.next(response.user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout - Limpia token, usuario y redirige a login
   */
  logout(): void {
    // Opcional: Llamar endpoint de logout del backend
    // this.http.post(`${this.API_URL}/logout`, {}).subscribe();
    
    this.clearStorage();
    this._currentUser.set(null);
    this._userSubject.next(null);
    
    // Limpiar el estado del trial
    this.trialService.limpiar();
    
    // Limpiar también el estado del sidebar
    if (this.isBrowser) {
      localStorage.removeItem('sidebarCollapsed');
    }
    
    // Navegar al login y reemplazar la entrada en el historial
    // para evitar que el usuario vuelva atrás y vea la UI protegida.
    this.router.navigateByUrl('/sistema-administrativo', { replaceUrl: true });
  }

  /**
   * Verifica si hay un usuario autenticado
   * @returns true si hay token válido
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Opcional: Verificar si el token no ha expirado
    // return !this.isTokenExpired(token);
    
    return true;
  }

  /**
   * Obtiene el token del localStorage
   * @returns Token o null
   */
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Guarda el token en localStorage
   * @param token - Token JWT/Sanctum
   */
  private setToken(token: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Guarda el usuario en localStorage
   * @param user - Objeto usuario
   */
  private setUser(user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Limpia localStorage
   */
  private clearStorage(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Obtiene el nombre del usuario
   * @returns Nombre completo o 'Usuario'
   */
  getUserName(): string {
    return this._currentUser()?.nombreCompleto || 'Usuario';
  }

  /**
   * Obtiene el primer nombre del usuario
   * @returns Primer nombre
   */
  getFirstName(): string {
    const fullName = this.getUserName();
    return fullName.split(' ')[0];
  }

  /**
   * Obtiene el avatar del usuario
   * @returns URL del avatar o undefined
   */
  getUserAvatar(): string | undefined {
    const user = this._currentUser();
    // Priorizar fotoPerfil_url del backend
    if (user?.fotoPerfil_url) {
      return user.fotoPerfil_url;
    }
    // Fallback a avatar
    if (user?.avatar) {
      return user.avatar;
    }
    // Generar avatar con iniciales como último recurso
    if (user?.nombreCompleto) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombreCompleto)}&background=1c8f46&color=fff`;
    }
    return undefined;
  }

  /**
   * Obtiene el rol del usuario
   * @returns Rol del usuario
   */
  getUserRole(): string {
    return this._currentUser()?.role || 'guest';
  }

  /**
   * Obtiene el roleId del usuario
   * @returns roleId del usuario (1 = Admin, 2 = Caja, 3 = Mesero, 4 = Cocina) o null
   */
  getUserRoleId(): number | null {
    const user = this._currentUser();
    if (!user) return null;
    
    // Soportar tanto roleId como role_id del backend
    return user.roleId ?? user.role_id ?? null;
  }

  /**
   * Verifica si el usuario tiene uno de los roles permitidos
   * @param allowedRoles - Array de roleIds permitidos
   * @returns true si el usuario tiene uno de los roles
   */
  hasRole(allowedRoles: number[]): boolean {
    const userRoleId = this.getUserRoleId();
    if (userRoleId === null) return false;
    return allowedRoles.includes(userRoleId);
  }

  /**
   * Verifica si el usuario es administrador (roleId = 1)
   * @returns true si es administrador
   */
  isAdmin(): boolean {
    return this.getUserRoleId() === 1;
  }

  isCaja(): boolean {
    return this.getUserRoleId() === 2;
  }

  isMesero(): boolean {
    return this.getUserRoleId() === 3;
  }

  isCocina(): boolean {
    return this.getUserRoleId() === 4;
  }

  /**
   * Obtiene el empresa_id del usuario autenticado.
   * Soporta varias formas comunes del backend (id_empresa, empresa_id, empresaId, empresa.id).
   */
  getEmpresaId(): number | null {
    const user = this._currentUser();
    if (!user) return null;

    const candidates = [
      (user as any).id_empresa,
      (user as any).empresa_id,
      (user as any).empresaId,
      (user as any).empresa?.id,
    ];

    for (const c of candidates) {
      const id = Number(c);
      if (Number.isFinite(id) && id > 0) return id;
    }

    return null;
  }

  /**
   * Obtiene el sucursal_id del usuario autenticado.
   * @returns sucursal_id o null si no tiene sucursal asignada (caso de admin)
   */
  getSucursalId(): number | null {
    const user = this._currentUser();
    if (!user) return null;
    return user.sucursal_id ?? null;
  }

  /**
   * Actualiza los datos del usuario
   * @param userData - Datos parciales del usuario
   */
  updateUser(userData: Partial<User>): void {
    const current = this._currentUser();
    if (current) {
      const updated = { ...current, ...userData };
      this._currentUser.set(updated);
      this._userSubject.next(updated);
      this.setUser(updated);
    }
  }

  /**
   * Manejo centralizado de errores HTTP
   * @param error - Error HTTP
   * @returns Observable con error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 401) {
        // Credenciales incorrectas
        errorMessage = error.error?.error || 'Credenciales incorrectas';
      } else if (error.status === 403) {
        // Usuario inactivo/bloqueado
        errorMessage = error.error?.error || 'Tu cuenta está inactiva. Contacta al administrador.';
      } else if (error.status === 422) {
        // Errores de validación de Laravel
        const errors = error.error?.errors;
        if (errors) {
          errorMessage = Object.values(errors).flat().join(', ');
        } else {
          errorMessage = error.error?.message || 'Error de validación';
        }
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Intenta más tarde.';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else {
        // Para cualquier otro código de error, intentar usar el mensaje del backend
        errorMessage = error.error?.error || error.error?.message || errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Verifica si el token JWT ha expirado (opcional)
   * Solo aplica si usas JWT y no Sanctum
   * @param token - Token JWT
   * @returns true si ha expirado
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}
