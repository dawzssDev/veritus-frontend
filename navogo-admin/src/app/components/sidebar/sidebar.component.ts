import { Component, OnInit, OnDestroy, signal, Inject, Renderer2, computed } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { filter } from 'rxjs/operators';
import { MenuItem } from '../../models/menu.interface';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Sidebar Component
 * Componente standalone para navegación lateral con soporte para colapsar/expandir
 * y detección automática de ruta activa
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private static readonly OVERLAY_BREAKPOINT = 1024;

  /** Ruta activa actual */
  activeRoute = signal('');

  /** Estado del sidebar desde el servicio compartido */
  isCollapsed = () => this.sidebarService.isCollapsed();

  /** Estado móvil desde el servicio compartido */
  isMobileOpen = () => this.sidebarService.isMobileOpen();

  /** Items del menú completo (sin filtrar por roles) */
  private allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard-ventas',
      roles: [1] // Solo admin
    },
    {
      id: 'ventas-mostrador',
      label: 'Punto de Venta',
      icon: 'point_of_sale',
      route: '/ventas-mostrador',
      roles: [1, 2] // Admin y Caja
    },
    {
      id: 'levantar-orden',
      label: 'Levantar Orden',
      icon: 'receipt_long',
      route: '/levantar-orden',
      roles: [1, 3] // Admin y Mesero
    },
    {
      id: 'mesas',
      label: 'Gestión de Mesas',
      icon: 'table_restaurant',
      route: '/mesas',
      roles: [1, 2, 3] // Admin, Caja y Mesero
    },
    {
      id: 'pedidos',
      label: 'Pedidos',
      icon: 'receipt_long',
      route: '/pedidos',
      roles: [1, 4] // Admin y Cocina
    },
    {
      id: 'emplatado',
      label: 'Emplatado',
      icon: 'restaurant',
      route: '/emplatado',
      roles: [1, 4] // Admin y Cocina
    },
    {
      id: 'turno-caja',
      label: 'Caja',
      icon: 'point_of_sale',
      route: '/turno-caja',
      roles: [1, 2] // Admin y Caja
    },
    {
      id: 'caja-entregas',
      label: 'Caja Entregas',
      icon: 'storefront',
      route: '/caja-entregas',
      roles: [1, 2] // Admin y Caja
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: 'storefront',
      route: '/ventas',
      roles: [1] // Solo admin
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: 'inventory_2',
      route: '/inventario',
      roles: [1, 2] // Solo admin
    },
    {
      id: 'gastos',
      label: 'Gastos',
      icon: 'payments',
      route: '/gastos',
      roles: [1, 2] // Solo admin
    },
    {
      id: 'empresas',
      label: 'Empresa',
      icon: 'business',
      route: '/empresas',
      roles: [1] // Solo admin
    },
    {
      id: 'areas-impresion',
      label: 'Áreas de impresión',
      icon: 'print',
      route: '/areas-impresion',
      roles: [1]
    },
    {
      id: 'facturacion',
      label: 'Facturación',
      icon: 'receipt_long',
      route: '/facturacion',
      userIds: [1],
    },
    {
      id: 'suscripcion',
      label: 'Suscripción',
      icon: 'receipt',
      route: '/suscripcion',
      roles: [1] // Solo admin
    },
    {
      id: 'tutoriales',
      label: 'Tutoriales',
      icon: 'play_circle',
      route: '/tutoriales',
      roles: [1, 2, 3, 4], // Todos los roles
      locked: true,
    },
    {
      id: 'soporte',
      label: 'Soporte',
      icon: 'support_agent',
      route: '/soporte',
      roles: [1] // Todos los roles
    },
    // {
    //   id: 'publicidad',
    //   label: 'Publicidad',
    //   icon: 'campaign',
    //   route: '/publicidad'
    // },
    {
      id: 'reportes',
      label: 'Catalogo',
      icon: 'assessment',
      roles: [1], // Solo admin
      children: [
        {
          id: 'categorias',
          label: 'Categorías',
          icon: 'category',
          route: '/categorias',
          roles: [1]
        },
        {
          id: 'productos',
          label: 'Productos',
          icon: 'inventory_2',
          route: '/productos',
          roles: [1]
        },
        {
          id: 'usuarios',
          label: 'Usuarios',
          icon: 'people',
          route: '/usuarios',
          roles: [1]
        },
        {
          id: 'clientes',
          label: 'Clientes',
          icon: 'contacts',
          route: '/clientes',
          roles: [1]
        },
        {
          id: 'complementos',
          label: 'Complementos',
          icon: 'tune',
          route: '/catalogo/complementos',
          roles: [1]
        },
      ]
    },
    {
      id: 'sucursales',
      label: 'Sucursales',
      icon: 'store',
      route: '/sucursales',
      roles: [1] // Solo admin
    }
  ];

  /** Items del menú filtrados según el rol del usuario */
  menuItems = computed<MenuItem[]>(() => {
    this.authService.currentUser();
    const userRoleId = this.authService.getUserRoleId();
    const userId = this.authService.getUserId();
    if (userRoleId === null) return [];

    return this.filterMenuByRole(this.allMenuItems, userRoleId, userId);
  });

  constructor(
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private sidebarService: SidebarService,
    private authService: AuthService
  ) {
    // Escuchar cambios de ruta para actualizar item activo
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute.set(event.urlAfterRedirects);
        if (this.sidebarService.isOverlayMode()) {
          this.sidebarService.closeMobileSidebar();
        }
      });
  }

  ngOnInit(): void {
    // Establecer ruta inicial
    this.activeRoute.set(this.router.url);

    // Actualizar clase del body según el estado inicial del servicio
    this.updateBodyClass(this.sidebarService.isCollapsed());

    // Detectar cambios de tamaño de ventana
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize.bind(this));
    }
  }

  ngOnDestroy(): void {
    // Limpiar listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize.bind(this));
    }
  }

  /**
   * Maneja el cambio de tamaño de ventana
   */
  private handleResize(): void {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= SidebarComponent.OVERLAY_BREAKPOINT) {
        this.sidebarService.closeMobileSidebar();
        this.sidebarService.setSidebarState(false);
      } else {
        this.sidebarService.closeMobileSidebar();
        this.updateBodyClass(this.sidebarService.isCollapsed());
      }
    }
  }

  /**
   * Actualiza la clase del body para ajustar el layout
   */
  private updateBodyClass(collapsed: boolean): void {
    if (typeof window !== 'undefined') {
      if (collapsed) {
        this.renderer.addClass(this.document.body, 'sidebar-collapsed');
      } else {
        this.renderer.removeClass(this.document.body, 'sidebar-collapsed');
      }
    }
  }

  /**
   * Alterna el estado colapsado/expandido del sidebar
   */
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
    
    // Solo actualizar body class si no estamos en móvil
    if (typeof window !== 'undefined'
        && window.innerWidth > SidebarComponent.OVERLAY_BREAKPOINT) {
      const collapsed = this.sidebarService.isCollapsed();
      this.updateBodyClass(collapsed);
    }
  }

  /**
   * Navega a una ruta específica
   * @param item - Item del menú
   */
  navigateTo(item: MenuItem): void {
    if (item.disabled) return;
    if (item.locked) return;

    if (item.route) {
      this.router.navigate([item.route]);
      // En móvil, cerrar el sidebar después de navegar
      if (typeof window !== 'undefined'
          && window.innerWidth <= SidebarComponent.OVERLAY_BREAKPOINT) {
        this.sidebarService.closeMobileSidebar();
      }
    } else if (item.children) {
      // Si el sidebar NO está colapsado, hacer toggle del submenú
      // Si está colapsado, el menú emergente se maneja automáticamente con matMenuTriggerFor
      if (!this.isCollapsed()) {
        item.expanded = !item.expanded;
      }
    }
  }

  /**
   * Verifica si una ruta está activa
   * @param route - Ruta a verificar
   * @returns true si la ruta está activa
   */
  isActive(route?: string): boolean {
    if (!route) return false;
    
    const currentRoute = this.activeRoute();
    
    // Comparación exacta o con parámetros adicionales
    // Evita que /ventas active cuando estamos en /ventas-mostrador
    return currentRoute === route || 
           currentRoute.startsWith(route + '/') ||
           currentRoute.startsWith(route + '?');
  }

  /**
   * Verifica si algún hijo del item está activo
   * @param item - Item con hijos
   * @returns true si algún hijo está activo
   */
  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.isActive(child.route));
  }

  /**
   * Toggle de submenú
   * @param item - Item del menú
   * @param event - Evento del click
   */
  toggleSubmenu(item: MenuItem, event: Event): void {
    event.stopPropagation();
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  /**
   * Verifica si el usuario tiene permisos para ver el item
   * @param item - Item del menú
   * @returns true si tiene permisos
   */
  hasPermission(item: MenuItem): boolean {
    // Implementación básica
    // Aquí puedes integrar tu servicio de autenticación
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    // Ejemplo:
    // const userRole = this.authService.getUserRole();
    // return item.roles.includes(userRole);

    return true; // Por defecto mostrar todos
  }

  /**
   * Filtra los items del menú según el rol del usuario
   * @param items - Items del menú a filtrar
   * @param userRoleId - ID del rol del usuario
   * @returns Items filtrados
   */
  private filterMenuByRole(
    items: MenuItem[],
    userRoleId: number,
    userId: number | null
  ): MenuItem[] {
    return items
      .filter(item => {
        if (item.userIds?.length) {
          if (userId === null || !item.userIds.includes(userId)) {
            return false;
          }
        }
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.includes(userRoleId);
      })
      .map(item => {
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: this.filterMenuByRole(
              item.children, userRoleId, userId
            )
          };
        }
        return item;
      })
      .filter(item => {
        // Si tiene hijos pero todos fueron filtrados, no mostrar el item padre
        if (item.children) {
          return item.children.length > 0;
        }
        return true;
      });
  }

  /**
   * Obtiene el tooltip text para items colapsados
   * @param item - Item del menú
   * @returns Texto del tooltip
   */
  getTooltip(item: MenuItem): string {
    return this.isCollapsed() ? item.label : '';
  }

  /**
   * Cierra el sidebar en móvil (llamado por el overlay)
   */
  closeMobileSidebar(): void {
    this.sidebarService.closeMobileSidebar();
  }
}
