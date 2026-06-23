/**
 * Servicio para gestionar el estado y datos del menú del sidebar
 * Puede ser extendido para cargar menús dinámicos desde API
 */
import { Injectable, signal } from '@angular/core';
import { MenuItem } from '../../models/menu.interface';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  /** Estado del sidebar (signal reactivo) */
  private _isCollapsed = signal(false);
  
  /** Estado móvil - indica si el sidebar está abierto en móvil */
  private _isMobileOpen = signal(false);
  
  /** Getter público para el estado colapsado - retorna el valor booleano */
  isCollapsed(): boolean {
    return this._isCollapsed();
  }

  /** Getter público para el estado móvil */
  isMobileOpen(): boolean {
    return this._isMobileOpen();
  }

  /** Verifica si estamos en dispositivo móvil */
  private get isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  /**
   * Verifica si estamos en el navegador (no en SSR)
   */
  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  constructor() {
    // Cargar estado desde localStorage (solo en browser y no en móvil)
    if (this.isBrowser && !this.isMobile) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        this._isCollapsed.set(savedState === 'true');
      }
    } else if (this.isMobile) {
      // En móvil siempre empezar sin colapsar (cerrado)
      this._isCollapsed.set(false);
      this._isMobileOpen.set(false);
    }
  }

  /**
   * Toggle del estado del sidebar
   */
  toggleSidebar(): void {
    // En móvil, alternar el estado mobile
    if (this.isMobile) {
      this._isMobileOpen.update(value => !value);
      // En móvil nunca aplicar el estado colapsado
      this._isCollapsed.set(false);
    } else {
      // En desktop, alternar el estado colapsado
      this._isCollapsed.update(value => !value);
      if (this.isBrowser) {
        localStorage.setItem('sidebarCollapsed', this._isCollapsed().toString());
      }
    }
  }

  /**
   * Cierra el sidebar móvil
   */
  closeMobileSidebar(): void {
    this._isMobileOpen.set(false);
    // Asegurar que el estado collapsed esté en false en móvil
    if (this.isMobile) {
      this._isCollapsed.set(false);
    }
  }

  /**
   * Establece el estado del sidebar
   * @param collapsed - Estado deseado
   */
  setSidebarState(collapsed: boolean): void {
    // En móvil nunca aplicar collapsed
    if (this.isMobile) {
      this._isCollapsed.set(false);
      return;
    }
    
    this._isCollapsed.set(collapsed);
    if (this.isBrowser) {
      localStorage.setItem('sidebarCollapsed', collapsed.toString());
    }
  }

  /**
   * Obtiene el menú (puede ser extendido para cargar desde API)
   * @returns Array de items del menú
   */
  getMenuItems(): MenuItem[] {
    // Aquí puedes hacer una llamada HTTP para cargar menú dinámico
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard'
      },
      {
        id: 'empresas',
        label: 'Empresas',
        icon: 'business',
        route: '/empresas'
      },
      {
        id: 'envio-config',
        label: 'Config. Envío',
        icon: 'local_shipping',
        route: '/empresas/envio/config'
      },
      {
        id: 'categorias',
        label: 'Categorías',
        icon: 'category',
        route: '/categorias'
      },
      {
        id: 'productos',
        label: 'Productos',
        icon: 'inventory_2',
        route: '/productos'
      },
      {
        id: 'publicidad',
        label: 'Publicidad',
        icon: 'campaign',
        route: '/publicidad'
      },
      {
        id: 'ventas-mostrador',
        label: 'Punto de Venta',
        icon: 'point_of_sale',
        route: '/ventas-mostrador',
        roles: [1, 2] // Admin y Empleado
      },
      {
        id: 'levantar-orden',
        label: 'Levantar Orden',
        icon: 'receipt_long',
        route: '/levantar-orden',
        roles: [1, 2] // Admin y Empleado
      },
      {
        id: 'mesas',
        label: 'Gestión de Mesas',
        icon: 'table_restaurant',
        route: '/mesas',
        roles: [1, 2] // Admin y Empleado
      },
      {
        id: 'reportes',
        label: 'Reportes',
        icon: 'assessment',
        children: [
          {
            id: 'reportes-ventas',
            label: 'Ventas',
            icon: 'show_chart',
            route: '/reportes/ventas'
          },
          {
            id: 'reportes-usuarios',
            label: 'Usuarios',
            icon: 'people',
            route: '/reportes/usuarios'
          }
        ]
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: 'settings',
        route: '/configuracion'
      }
    ];
  }

  /**
   * Filtra items del menú por roles de usuario
   * @param items - Items del menú
   * @param userRoles - Roles del usuario actual (roleIds: 1 = Admin, 2 = Empleado)
   * @returns Items filtrados
   */
  filterMenuByRoles(items: MenuItem[], userRoles: number[]): MenuItem[] {
    return items.filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.some(role => userRoles.includes(role));
    }).map(item => {
      if (item.children) {
        return {
          ...item,
          children: this.filterMenuByRoles(item.children, userRoles)
        };
      }
      return item;
    });
  }
}
