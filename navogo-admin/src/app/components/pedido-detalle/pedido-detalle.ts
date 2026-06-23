import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of } from 'rxjs';
import { catchError, finalize, switchMap, timeout } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OrderService } from '../../services/orders/order.service';
import { AuthService } from '../../services/auth/auth.service';
import { MenuService } from '../../services/menu/menu.service';
import { TicketVentaDialogComponent } from '../ventas-mostrador/ticket-venta-dialog/ticket-venta-dialog.component';
import { CancelarPedidoDialogComponent } from './cancelar-pedido-dialog.component';
import { TicketVentaData, ItemTicket } from '../../models/ticket.interface';
import { VentasService } from '../../ventas/ventas.service';

interface AdminOrder {
  id: number;
  folio?: string | number | null;
  folio_diario?: string | number | null;
  folio_dia?: string | number | null;
  business_id: number;
  shipping_type: 'domicilio' | 'recoger' | 'local';
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta';
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  estatus?: number;
  customer_name: string;
  customer_phone: string;
  tip: number | string;
  shipping_cost: number | string;
  subtotal: number | string;
  total: number | string;
  created_at?: string;
  delivery_address?: any;
  note?: string | null;
  items?: AdminOrderItem[];
}

interface AdminOrderItem {
  product_id?: number | null;
  name: string;
  quantity: number;
  unit_price: number | string;
  selections?: Array<{ 
    groupTitle?: string; 
    extra?: string; 
    precio?: number | null;
    'precio-extra'?: number | null;
  }> | null;
}

interface AdminOrderDetail extends AdminOrder {
  delivery_address?: any;
  note?: string | null;
  items?: AdminOrderItem[];
}

@Component({
  selector: 'app-pedido-detalle',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pedido-detalle.html',
  styleUrl: './pedido-detalle.scss',
})
export class PedidoDetalle implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  orderId: number | null = null;
  folio: number | null = null;
  isLoading = false;
  errorMessage = '';
  order: AdminOrderDetail | null = null;

  prev: { id: number; folio: number } | null = null;
  next: { id: number; folio: number } | null = null;

  private dayOrderIds: number[] | null = null;
  private nombreEmpresa = '';
  private direccionEmpresa = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orders: OrderService,
    private dialog: MatDialog,
    private authService: AuthService,
    private menuService: MenuService,
    private ventasService: VentasService,
  ) {}

  ngOnInit(): void {
    // Nombre real de la empresa (getMenuByEmpresaId devuelve placeholder "Cargando...")
    const empresaId = this.authService.getEmpresaId();
    if (empresaId) {
      this.menuService.getEmpresaById(empresaId).subscribe({
        next: (empresa) => {
          if (empresa?.nombre) this.nombreEmpresa = empresa.nombre;
          if (empresa?.direccion) this.direccionEmpresa = empresa.direccion;
        },
        error: () => {}
      });
    }

    // Importante: al navegar con flechas (misma ruta, distinto :id), Angular puede reutilizar el componente.
    // Por eso escuchamos cambios de params/queryParams.
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((pm) => {
          this.captureDayOrderIdsFromState();

          const id = Number(pm.get('id'));
          if (!Number.isFinite(id) || id <= 0) {
            this.orderId = null;
            this.errorMessage = 'ID de pedido inválido.';
            this.order = null;
            this.prev = null;
            this.next = null;
            return of(null);
          }

          const folioParam = this.route.snapshot.queryParamMap.get('folio');
          const parsedFolio = Number(folioParam);
          this.folio = Number.isFinite(parsedFolio) && parsedFolio > 0 ? parsedFolio : null;

          this.orderId = id;
          return this.load();
        })
      )
      .subscribe();
  }

  private captureDayOrderIdsFromState(): void {
    // getCurrentNavigation() solo existe durante la navegación actual;
    // history.state mantiene el state después.
    const navState = this.router.getCurrentNavigation()?.extras?.state as any;
    const state = navState ?? (typeof history !== 'undefined' ? (history.state as any) : null);
    const ids = state?.dayOrderIds;
    if (Array.isArray(ids) && ids.every((x: any) => Number.isFinite(Number(x)))) {
      this.dayOrderIds = ids.map((x: any) => Number(x));
    }
  }

  back(): void {
    this.router.navigate(['/pedidos'], { queryParamsHandling: 'preserve' });
  }

  reload(): void {
    this.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private load() {
    if (!this.orderId) return of(null);

    this.isLoading = true;
    this.errorMessage = '';
    this.order = null;
    this.prev = null;
    this.next = null;

    return this.orders.getOrder(this.orderId).pipe(
      timeout(15000),
      finalize(() => {
        this.isLoading = false;
      }),
      catchError((err) => {
        const status = (err as any)?.status;
        if (status === 401 || status === 403) {
          this.errorMessage = 'No autorizado para ver este pedido.';
        } else {
          this.errorMessage = 'No se pudo cargar el detalle del pedido.';
        }
        return of(null);
      }),
      switchMap((resp) => {
        const raw = (resp as any)?.order ?? resp;
        const order = Array.isArray(raw) ? raw[0] : raw;
        this.order = (order ?? null) as AdminOrderDetail | null;
        if (!this.order) {
          this.errorMessage = 'No se encontró el pedido.';
          return of(null);
        }

        this.computePrevNext();
        return of(null);
      })
    );
  }

  private computePrevNext(): void {
    const order = this.order;
    if (!order) return;

    // Caso preferido: venimos desde la lista y traemos el orden del día.
    if (this.dayOrderIds && this.dayOrderIds.length > 0) {
      const idx = this.dayOrderIds.findIndex((id) => id === order.id);
      if (idx >= 0) {
        const prevId = this.dayOrderIds[idx - 1] ?? null;
        const nextId = this.dayOrderIds[idx + 1] ?? null;
        this.prev = prevId ? { id: prevId, folio: idx } : null;
        this.next = nextId ? { id: nextId, folio: idx + 2 } : null;
        if (this.folio == null) this.folio = idx + 1;
        return;
      }
    }

    // Preferir día desde queryParam (?day=YYYY-MM-DD) si existe, si no usar created_at del pedido.
    const dayParam = this.route.snapshot.queryParamMap.get('day');
    const day = this.parseDayParam(dayParam) ?? this.parseDate(order.created_at) ?? null;
    if (!day) return;

    this.orders
      .listOrders()
      .pipe(timeout(15000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const rows = Array.isArray(resp) ? resp : (resp as any)?.data ?? (resp as any)?.orders ?? [];
          const list = Array.isArray(rows) ? (rows as AdminOrder[]) : [];
          const dayOrders = list.filter((o) => this.isSameDay(this.parseDate(o.created_at), day));

          const sorted = [...dayOrders].sort((a, b) => {
            const da = this.parseDate(a.created_at);
            const db = this.parseDate(b.created_at);
            const ta = da ? da.getTime() : Number.POSITIVE_INFINITY;
            const tb = db ? db.getTime() : Number.POSITIVE_INFINITY;
            if (ta !== tb) return ta - tb;
            return a.id - b.id;
          });

          const idx = sorted.findIndex((x) => x.id === order.id);
          if (idx < 0) {
            this.prev = null;
            this.next = null;
            return;
          }

          const prev = sorted[idx - 1] ?? null;
          const next = sorted[idx + 1] ?? null;
          this.prev = prev ? { id: prev.id, folio: idx } : null;
          this.next = next ? { id: next.id, folio: idx + 2 } : null;

          // Si no venía folio en query, asignarlo para mostrarlo.
          if (this.folio == null) this.folio = idx + 1;
        },
        error: () => {
          // Navegación es opcional: si falla, no romper la pantalla.
          this.prev = null;
          this.next = null;
        },
      });
  }

  goPrev(): void {
    if (!this.prev) return;
    this.router.navigate(['/pedidos', this.prev.id], {
      queryParamsHandling: 'merge',
      queryParams: { folio: this.prev.folio },
      state: { dayOrderIds: this.dayOrderIds },
    });
  }

  goNext(): void {
    if (!this.next) return;
    this.router.navigate(['/pedidos', this.next.id], {
      queryParamsHandling: 'merge',
      queryParams: { folio: this.next.folio },
      state: { dayOrderIds: this.dayOrderIds },
    });
  }

  private parseDayParam(value: string | null): Date | null {
    if (!value) return null;
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    const d = new Date(year, month - 1, day);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  private isSameDay(a: Date | null, b: Date): boolean {
    if (!a) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  paymentIcon(method: AdminOrder['payment_method']): string {
    switch (method) {
      case 'efectivo':
        return 'payments';
      case 'transferencia':
        return 'account_balance';
      case 'tarjeta':
        return 'credit_card';
      default:
        return 'paid';
    }
  }

  formatMoney(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return '$0.00';
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  formatTime(iso?: string): string {
    const d = this.parseDate(iso);
    if (!d) return '-';
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  formatDeliveryAddress(addr: any): string {
    if (!addr) return '-';
    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch {
        return addr.trim() || '-';
      }
    }
    if (typeof addr !== 'object') return '-';
    const calle = (addr.calle ?? '').toString().trim();
    const numero = (addr.numero ?? '').toString().trim();
    const colonia = (addr.colonia ?? '').toString().trim();
    const ciudad = (addr.ciudad ?? '').toString().trim();
    const parts = [`${calle} ${numero}`.trim(), colonia, ciudad].filter((p) => p.length > 0);
    return parts.length ? parts.join(', ') : '-';
  }

  getDeliveryReferencia(addr: any): string {
    if (addr == null) return '';

    if (typeof addr === 'string') {
      const text = addr.trim();
      if (!text) return '';
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          addr = parsed;
        } else {
          return text;
        }
      } catch {
        return text;
      }
    }

    if (typeof addr !== 'object') return '';

    const ref = addr.referencias ?? addr.referencia ?? '';
    return ref.toString().trim();
  }

  openWhatsApp(): void {
    if (!this.order?.customer_phone) return;
    const phone = this.order.customer_phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  }

  /**
   * Genera el enlace de Google Maps para la dirección de entrega
   */
  getGoogleMapsLink(addr: any): string | null {
    if (!addr || typeof addr !== 'object') return null;

    // Prioridad 1: Usar coordenadas si están disponibles
    const lat = addr.lat ?? addr.latitud;
    const lng = addr.lng ?? addr.longitud;
    if (lat != null && lng != null) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        return `https://www.google.com/maps?q=${latNum},${lngNum}`;
      }
    }

    // Prioridad 2: Usar dirección formateada
    const direccion = this.formatDeliveryAddress(addr);
    if (direccion && direccion !== '-') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
    }

    return null;
  }

  /**
   * Abre la dirección en Google Maps en una nueva pestaña
   */
  openMaps(): void {
    const link = this.getGoogleMapsLink(this.order?.delivery_address);
    if (link) {
      window.open(link, '_blank');
    }
  }

  calcItemsSubtotal(order: AdminOrderDetail | null): number {
    const items = order?.items ?? [];
    return items.reduce((acc, it) => {
      const basePrice = Number(it.unit_price ?? 0);
      const extrasPrice = this.calcExtrasPrice(it);
      return acc + (basePrice + extrasPrice) * Number(it.quantity ?? 0);
    }, 0);
  }

  /**
   * Calcula el precio total de los extras/complementos de un item
   */
  calcExtrasPrice(item: AdminOrderItem): number {
    const selections = item.selections ?? [];
    return selections.reduce((sum, sel) => {
      // Priorizar 'precio-extra' sobre 'precio'
      const price = sel['precio-extra'] ?? sel.precio ?? 0;
      return sum + Number(price);
    }, 0);
  }

  /**
   * Calcula el precio unitario completo (base + extras) de un item
   */
  calcItemUnitPrice(item: AdminOrderItem): number {
    return Number(item.unit_price ?? 0) + this.calcExtrasPrice(item);
  }

  /**
   * Calcula el precio total de un item (precio unitario con extras × cantidad)
   */
  calcItemTotalPrice(item: AdminOrderItem): number {
    return this.calcItemUnitPrice(item) * Number(item.quantity ?? 0);
  }

  private nombreEmpresaValido(): boolean {
    const n = this.nombreEmpresa.trim();
    return !!n && !/^cargando\.{0,3}$/i.test(n);
  }

  private resolverNombreEmpresaTicket(): string {
    if (this.nombreEmpresaValido()) return this.nombreEmpresa.trim();
    const user = this.authService.currentUser() as { empresa?: { nombre?: string } } | null;
    return user?.empresa?.nombre?.trim() || 'Mi Negocio';
  }

  private abrirDialogoTicket(datos: TicketVentaData['orden'], folioEmpresa?: number): void {
    const ordenTicket = {
      ...datos,
      nombre_empresa: this.resolverNombreEmpresaTicket(),
      direccion_empresa: this.direccionEmpresa || datos.direccion_empresa,
      ...(folioEmpresa && !datos.folio ? { folio_empresa: folioEmpresa } : {}),
    };
    this.dialog.open(TicketVentaDialogComponent, {
      data: { orden: ordenTicket },
      width: '820px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
    });
  }

  /**
   * Imprime el ticket del pedido
   */
  imprimirTicket(): void {
    const orden = this.order;
    if (!orden) return;

    const emitirTicket = () => {
      const itemsTicket: ItemTicket[] = (orden.items ?? []).map(item => {
      const precio   = parseFloat(String(item.unit_price ?? 0));
      const cantidad = item.quantity ?? 1;

      const complementos = Array.isArray(item.selections)
        ? item.selections
            .filter((s: any) => s.groupTitle?.toLowerCase() !== 'nota')
            .map((s: any) => ({
              nombre: s.extra ?? s.nombre ?? '',
              precio: parseFloat(
                String(s['precio-extra'] ?? s.precio ?? 0)
              )
            }))
        : [];

      const nota: string = Array.isArray(item.selections)
        ? (item.selections.find((s: any) =>
            s.groupTitle?.toLowerCase() === 'nota'
          )?.extra ?? (item as any).note ?? '')
        : ((item as any).note ?? '');

      return {
        cantidad,
        nombre:      item.name ?? '',
        precio,
        subtotal:    precio * cantidad,
        nota:        nota || undefined,
        complementos,
      };
    });

      const datos: TicketVentaData['orden'] = {
        id:             orden.id,
        folio:          orden.folio ?? null,
        folio_diario:   orden.folio_diario ?? orden.folio_dia ?? null,
        folio_dia:      orden.folio_dia ?? orden.folio_diario ?? undefined,
        fecha:          orden.created_at ?? new Date().toISOString(),
        tipo_servicio:  orden.shipping_type === 'local'
                          ? 'mesa'
                          : orden.shipping_type as TicketVentaData['orden']['tipo_servicio'],
        mesa:           orden.customer_name ?? '',
        nombre_cliente: orden.customer_name ?? '',
        telefono_cliente: (orden.customer_phone ?? '').toString().trim() || undefined,
        items:          itemsTicket,
        subtotal:       parseFloat(String(orden.subtotal ?? 0)),
        propina:        parseFloat(String(orden.tip ?? 0)),
        costo_envio:    parseFloat(String(orden.shipping_cost ?? 0)),
        total:          parseFloat(String(orden.total ?? 0)),
        metodo_pago:    orden.payment_method as TicketVentaData['orden']['metodo_pago'],
        nombre_empresa: this.resolverNombreEmpresaTicket(),
        direccion_empresa: this.direccionEmpresa || undefined,
        nota:           orden.note ?? undefined,
      };

      const tieneFolioApi = !!(orden.folio ?? orden.folio_diario ?? orden.folio_dia);
      if (tieneFolioApi) {
        this.abrirDialogoTicket(datos);
        return;
      }

      this.ventasService.getFolioDeOrden(orden.id).subscribe({
        next: (folioEmpresa) => this.abrirDialogoTicket(datos, folioEmpresa || undefined),
        error: () => this.abrirDialogoTicket(datos),
      });
    };

    if (this.nombreEmpresaValido()) {
      emitirTicket();
      return;
    }

    const empresaId = this.authService.getEmpresaId();
    if (!empresaId) {
      emitirTicket();
      return;
    }

    this.menuService.getEmpresaById(empresaId).subscribe({
      next: (empresa) => {
        if (empresa?.nombre) this.nombreEmpresa = empresa.nombre;
        if (empresa?.direccion) this.direccionEmpresa = empresa.direccion;
        emitirTicket();
      },
      error: () => emitirTicket(),
    });
  }

  private parseDate(iso?: string): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTODOS ADICIONALES PARA EL NUEVO DISEÑO
  // ═══════════════════════════════════════════════════════════

  procesando = false;

  getSelecciones(item: AdminOrderItem): string[] {
    if (!item.selections) return [];
    try {
      const selections = Array.isArray(item.selections) ? item.selections : [];
      return selections.map(sel => sel.extra ?? sel.groupTitle ?? '').filter(s => s.length > 0);
    } catch {
      return [];
    }
  }

  cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  getMinutos(): number {
    if (!this.order?.created_at) return 0;
    const diff = Date.now() - new Date(this.order.created_at).getTime();
    return Math.floor(diff / 60000);
  }

  puedeAvanzar(): boolean {
    const e = this.order?.estatus;
    return !!e && ![6, 7].includes(e);
  }

  getTextoAccion(): string {
    switch (this.order?.estatus) {
      case 1: return 'Iniciar preparación';
      case 2: return 'Marcar como listo';
      case 3: return 'Confirmar entrega y cobro';
      case 4: return 'Confirmar pago';
      case 5: return 'Confirmar entrega';
      default: return '';
    }
  }

  getIconoAccion(): string {
    switch (this.order?.estatus) {
      case 1: return 'play_arrow';
      case 2: return 'check';
      case 3: return 'task_alt';
      case 4: return 'payments';
      case 5: return 'delivery_dining';
      default: return 'check';
    }
  }

  getEtiquetaEstatus(estatus?: number): string {
    const etiquetas: Record<number, string> = {
      1: 'Sin iniciar',
      2: 'En proceso',
      3: 'Listos',
      4: 'Entregados',
      5: 'Pagados',
      6: 'Finalizados',
      7: 'Cancelados',
    };
    return estatus ? (etiquetas[estatus] ?? 'Desconocido') : 'Desconocido';
  }

  getIconoEstatus(estatus?: number): string {
    const iconos: Record<number, string> = {
      1: 'pending',
      2: 'restaurant',
      3: 'check_circle',
      4: 'delivery_dining',
      5: 'payments',
      6: 'task_alt',
      7: 'cancel',
    };
    return estatus ? (iconos[estatus] ?? 'help_outline') : 'help_outline';
  }

  avanzarEstatus(): void {
    if (!this.order || this.procesando || !this.puedeAvanzar()) return;

    const siguienteEstatus = (this.order.estatus ?? 1) + 1;
    if (siguienteEstatus > 6) return;

    this.procesando = true;

    const payload: any = { estatus: siguienteEstatus };

    // Lógica de auto-confirmación según el flujo
    if (siguienteEstatus === 5) {
      payload.pago_confirmado = true;
    }
    if (siguienteEstatus === 6) {
      payload.pago_confirmado = true;
      payload.envio_confirmado = true;
    }

    this.orders.updateOrderChecks(this.order.id, payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.procesando = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          if (this.order) {
            this.order.estatus = siguienteEstatus;
            if (payload.pago_confirmado !== undefined) {
              this.order.pago_confirmado = payload.pago_confirmado;
            }
            if (payload.envio_confirmado !== undefined) {
              this.order.envio_confirmado = payload.envio_confirmado;
            }
          }
        },
        error: (err) => {
          console.error('Error al avanzar estatus:', err);
          alert('Error al actualizar el pedido. Por favor, intenta de nuevo.');
        }
      });
  }

  confirmarPago(): void {
    if (!this.order || this.procesando) return;

    this.procesando = true;

    const payload: any = { pago_confirmado: true };

    // Si el envío ya está confirmado, marcar como finalizado
    if (this.order.envio_confirmado) {
      payload.estatus = 6;
    }

    this.orders.updateOrderChecks(this.order.id, payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.procesando = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          if (this.order) {
            this.order.pago_confirmado = true;
            if (payload.estatus) {
              this.order.estatus = payload.estatus;
            }
          }
        },
        error: (err) => {
          console.error('Error al confirmar pago:', err);
          alert('Error al confirmar el pago. Por favor, intenta de nuevo.');
        }
      });
  }

  confirmarEnvio(): void {
    if (!this.order || this.procesando) return;

    this.procesando = true;

    const payload: any = { envio_confirmado: true };

    // Si el pago ya está confirmado, marcar como finalizado
    if (this.order.pago_confirmado) {
      payload.estatus = 6;
    }

    this.orders.updateOrderChecks(this.order.id, payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.procesando = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          if (this.order) {
            this.order.envio_confirmado = true;
            if (payload.estatus) {
              this.order.estatus = payload.estatus;
            }
          }
        },
        error: (err) => {
          console.error('Error al confirmar envío:', err);
          alert('Error al confirmar la entrega. Por favor, intenta de nuevo.');
        }
      });
  }

  cancelar(): void {
    if (!this.order || this.procesando) return;

    const ref = this.dialog.open(CancelarPedidoDialogComponent, {
      data: { folio: this.folio ?? this.order.id },
      width: '440px',
      disableClose: false,
    });

    ref.afterClosed().subscribe((confirmar: boolean) => {
      if (!confirmar) return;

      this.procesando = true;

      this.orders.updateOrderChecks(this.order!.id, { estatus: 7 })
        .pipe(
          timeout(15000),
          finalize(() => { this.procesando = false; }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: () => {
            if (this.order) this.order.estatus = 7;
          },
          error: (err) => {
            console.error('Error al cancelar pedido:', err);
          }
        });
    });
  }
}
