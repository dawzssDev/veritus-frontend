import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'menu/:empresaId/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'menu/:slug/:empresaId',
    renderMode: RenderMode.Server
  },
  {
    path: 'menu/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'carrito',
    renderMode: RenderMode.Server
  },
  {
    path: 'checkout',
    renderMode: RenderMode.Server
  },
  {
    path: 'recoleccion',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    // Admin/protegidas: evitar SSR para que guards dependientes de localStorage
    // no redirijan en servidor (al recargar) y se mantenga la ruta actual.
    renderMode: RenderMode.Client
  }
];
