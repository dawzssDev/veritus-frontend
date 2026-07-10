import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { CategoriasLista } from './components/categorias-lista/categorias-lista';
import { CategoriasNuevo } from './components/categorias-lista/categorias-nuevo/categorias-nuevo';
import { EmpresaListing } from './components/empresa-listing/empresa-listing';
import { EmpresaNuevo } from './components/empresa-listing/empresa-nuevo/empresa-nuevo';
import { EmpresaEnvioConfig } from './components/empresa-envio-config/empresa-envio-config';
import { ProductoLista } from './components/producto-lista/producto-lista';
import { PtoductoNuevo } from './components/producto-lista/ptoducto-nuevo/ptoducto-nuevo';
import { PublicidadLista } from './components/publicidad-lista/publicidad-lista';
import { PedidosLista } from './components/pedidos-lista/pedidos-lista';
import { PedidoDetalle } from './components/pedido-detalle/pedido-detalle';
import { VentasDashboard } from './components/ventas-dashboard/ventas-dashboard';
import { VentasDetalleComponent } from './components/ventas-dashboard/ventas-detalle/ventas-detalle.component';
import { VentasMostradorComponent } from './components/ventas-mostrador/ventas-mostrador.component';
import { LevantarOrdenComponent } from './components/levantar-orden/levantar-orden.component';
import { UsuariosLista } from './components/usuarios-lista/usuarios-lista';
import { UsuariosNuevo } from './components/usuarios-lista/usuarios-nuevo/usuarios-nuevo';
import { GestionMesasComponent } from './components/gestion-mesas/gestion-mesas.component';
import { EmplatadoComponent } from './components/emplatado/emplatado.component';
import { ClientesListaComponent } from './components/clientes/clientes-lista.component';
import { authGuard, loginGuard, roleGuard } from './guards/auth.guard';
import { MenuPageComponent } from './pages/public/menu-page/menu-page.component';
import { CartPageComponent } from './pages/public/cart-page/cart-page.component';
import { CheckoutPageComponent } from './pages/public/checkout-page/checkout-page.component';
import { PickupCheckoutPageComponent } from './pages/public/pickup-checkout-page/pickup-checkout-page.component';
import { NotFoundComponent } from './pages/public/not-found/not-found.component';
import { Dashboard } from './components/dashboard/dashboard';
import { MenuPublicoComponent } from './pages/public/menu-publico/menu-publico.component';

/**
 * Configuración de rutas
 * 
 * - Rutas públicas: /menu/:empresaId/:slug (sin guards)
 * - Ruta de login: solo accesible si NO está autenticado
 * - Rutas protegidas: dashboard (requieren authGuard)
 * - Control de acceso por roles:
 *   * roleId = 1 (Admin): acceso a todas las rutas
 *   * roleId = 2 (Empleado): solo acceso a pedidos
 */
export const routes: Routes = [
    // ============================================================
    // RUTAS PÚBLICAS - Sin autenticación
    // ============================================================
    // Menú para clientes que escanean QR de mesa
    {
        path: 'menu/mesa/:mesaId',
        component: MenuPublicoComponent
    },
    {
        path: 'menu/:empresaId/:slug',
        component: MenuPageComponent
    },
    {
        path: 'menu/:slug/:empresaId',
        component: MenuPageComponent
    },
    {
        path: 'menu/:slug',
        component: MenuPageComponent
    },
    {
        path: 'carrito',
        component: CartPageComponent
    },

    {
        path: 'checkout',
        component: CheckoutPageComponent
    },

    {
        path: 'recoleccion',
        component: PickupCheckoutPageComponent
    },

    // Menú público para clientes escaneando QR de mesa
    {
        path: 'menu-local',
        component: MenuPublicoComponent
    },

    // Pantalla TV — menú digital para pantalla en local (sin auth)
    {
        path: 'tv',
        loadComponent: () =>
            import('./tv/tv.component').then(m => m.TvComponent)
    },

    // ============================================================
    // RUTA DE LOGIN - Solo para no autenticados
    // Ruta personalizada para mayor seguridad
    // ============================================================
    {
        path: 'sistema-administrativo',
        component: LoginComponent,
        canActivate: [loginGuard]
    },

    // ============================================================
    // RUTAS PROTEGIDAS - Requieren autenticación (Dashboard Admin)
    // ============================================================
    
    // Solo Admin (roleId = 1)
    {
        path: 'categorias/nuevo',
        component: CategoriasNuevo,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'categorias/:id/editar',
        component: CategoriasNuevo,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'categorias',
        component: CategoriasLista,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'empresas',
        component: EmpresaListing,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'empresas/:id/editar',
        component: EmpresaNuevo,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'empresas/envio/config',
        component: EmpresaEnvioConfig,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'productos/nuevo',
        component: PtoductoNuevo,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'productos/:id/editar',
        component: PtoductoNuevo,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'productos',
        component: ProductoLista,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'catalogo/complementos',
        loadComponent: () =>
            import('./components/catalogo-complementos/catalogo-complementos.component')
                .then(m => m.CatalogoComplementosComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'publicidad',
        component: PublicidadLista,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Cocina (roleId = 1 y 4)
    {
        path: 'pedidos',
        component: PedidosLista,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 4] }
    },

    {
        path: 'emplatado',
        component: EmplatadoComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 4] }
    },

    {
        path: 'pedidos/:id',
        component: PedidoDetalle,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 4] }
    },

    // Corte de Caja (Admin y Caja) — legacy, coexistir hasta validar flujo nuevo
    {
        path: 'corte-caja',
        loadComponent: () =>
            import('./corte-caja/corte-caja.component')
                .then(m => m.CorteCajaComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2] }
    },

    // Turno de Caja (Admin y Caja)
    {
        path: 'turno-caja',
        loadComponent: () =>
            import('./turno-caja/turno-caja-page/turno-caja-page.component')
                .then(m => m.TurnoCajaPageComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2] }
    },

    // Caja Entregas (Admin y Caja)
    {
        path: 'caja-entregas',
        loadComponent: () =>
            import('./components/caja-entregas/caja-entregas.component')
                .then(m => m.CajaEntregasComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2] }
    },
    
    // Historial de Ventas (Solo Admin)
    {
        path: 'ventas',
        loadComponent: () =>
            import('./ventas/ventas.component')
                .then(m => m.VentasComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Inventario (Solo Admin)
    {
        path: 'inventario',
        loadComponent: () =>
            import('./inventario/inventario-lista/inventario-lista.component')
                .then(m => m.InventarioListaComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Gastos (Solo Admin)
    {
        path: 'gastos',
        loadComponent: () =>
            import('./gastos/gastos-lista/gastos-lista.component')
                .then(m => m.GastosListaComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Dashboard de Ventas (Solo Admin)
    {
        path: 'dashboard-ventas',
        component: VentasDashboard,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    {
        path: 'ventas/detalle',
        component: VentasDetalleComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Caja - Punto de Venta
    {
        path: 'ventas-mostrador',
        component: VentasMostradorComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2] }
    },

    // Mesero - Levantar Orden
    {
        path: 'levantar-orden',
        component: LevantarOrdenComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 3] }
    },

    // Solo Admin
    {
        path: 'usuarios',
        component: UsuariosLista,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    {
        path: 'usuarios/nuevo',
        component: UsuariosNuevo,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    {
        path: 'usuarios/:id/editar',
        component: UsuariosNuevo,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Gestión de mesas (Admin, Caja y Mesero)
    {
        path: 'mesas',
        component: GestionMesasComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2, 3] }
    },

    // Tutoriales (todos los roles)
    {
        path: 'tutoriales',
        loadComponent: () =>
            import('./tutoriales/tutoriales.component')
                .then(m => m.TutorialesComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2, 3, 4] }
    },

    // Soporte (todos los roles)
    {
        path: 'soporte',
        loadComponent: () =>
            import('./soporte/soporte.component')
                .then(m => m.SoporteComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Facturación CFDI (Solo Admin)
    {
        path: 'facturacion',
        loadComponent: () =>
            import('./facturacion/facturacion-page/facturacion-page.component')
                .then(m => m.FacturacionPageComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Suscripción Stripe (Solo Admin)
    {
        path: 'suscripcion',
        loadComponent: () =>
            import('./facturacion/facturacion.component')
                .then(m => m.FacturacionComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Clientes (Solo Admin)
    {
        path: 'clientes',
        component: ClientesListaComponent,
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },
    {
        path: 'clientes/nuevo',
        loadComponent: () =>
            import('./components/clientes/cliente-form/cliente-form.component')
                .then(m => m.ClienteFormComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2] }
    },
    {
        path: 'clientes/:id/editar',
        loadComponent: () =>
            import('./components/clientes/cliente-form/cliente-form.component')
                .then(m => m.ClienteFormComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1, 2] }
    },

    // Sucursales (Solo Admin)
    {
        path: 'sucursales',
        loadComponent: () =>
            import('./sucursales/sucursales.component')
                .then(m => m.SucursalesComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    // Áreas de impresión (Solo Admin)
    {
        path: 'areas-impresion',
        loadComponent: () =>
            import('./areas-impresion/areas-impresion-page/areas-impresion-page.component')
                .then(m => m.AreasImpresionPageComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: [1] }
    },

    {
        path: 'reportes/ventas',
        redirectTo: 'ventas',
        pathMatch: 'full'
    },

    {
        path: 'reportes/usuarios',
        redirectTo: 'usuarios',
        pathMatch: 'full'
    },

    // ============================================================
    // REDIRECCIONES
    // ============================================================
    {
        path: '',
        redirectTo: 'pedidos',
        pathMatch: 'full'
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];
