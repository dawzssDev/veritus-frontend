import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, of, timer, interval, Subscription } from 'rxjs';
import { catchError, finalize, switchMap, timeout } from 'rxjs/operators';

import { OrderService } from '../../services/orders/order.service';
import { ConfirmStatusDialogComponent } from '../confirm-status-dialog/confirm-status-dialog.component';
import { getOrderFolio } from '../../utils/order-folio.util';
import { formatearNota } from '../../utils/order-note.util';
import { StatusToastComponent } from '../status-toast/status-toast.component';

interface AdminOrderItem {
  id: number;
  product_id?: number | null;
  name: string;
  quantity: number;
  unit_price: number | string;
  selections?:
    | Array<{ groupTitle?: string; extra?: string; precio?: number | null }>
    | Record<string, unknown>
    | string
    | null;
  created_at?: string;
  /** true = ya fue entregado/cobrado en un ciclo anterior */
  entregado?: boolean;
  listo_emplatado?: boolean;
}

interface AdminOrder {
  id: number;
  folio?: string | number | null;
  folio_diario?: string | number | null;
  folio_dia?: number | null;
  business_id: number;
  shipping_type: 'domicilio' | 'recoger' | 'local';
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta' | 'combinado';
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  estatus?: number; // 1 = en proceso, 2 = finalizado, 3 = cancelado, 4 = entregado, 5 = pagado, 6 = finalizado, 7 = cancelado
  customer_name: string;
  customer_phone: string;
  tip: number | string;
  shipping_cost: number | string;
  subtotal: number | string;
  total: number | string;
  created_at?: string;
  tiempo_entrega_estimado?: string | null;

  // Algunos backends ya incluyen esto en el listado
  delivery_address?: any;
  note?: string | null;
  folio_grupo?: string | null;
  items?: AdminOrderItem[];
  sucursal_id?: number | null;
  sucursal?: {
    id: number;
    nombre: string;
  } | null;
}

@Component({
  selector: 'app-pedidos-lista',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
  ],
  templateUrl: './pedidos-lista.html',
  styleUrl: './pedidos-lista.scss',
})
export class PedidosLista implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  private allOrders: AdminOrder[] = [];
  private dayOrders: AdminOrder[] = [];
  ordersList: AdminOrder[] = [];
  isLoading = false;
  errorMessage = '';

  // ── CONSTANTES DE ESTATUS ──
  readonly ESTATUS = {
    SIN_INICIAR: 1,
    EN_PROCESO:  2,
    LISTO:       3,
    ENTREGADO:   4,
    PAGADO:      5,
    FINALIZADO:  6,
    CANCELADO:   7,
    MERMA:       8,
  } as const;

  readonly ESTATUS_CONFIG: Record<number, {
    label:  string;
    clase:  string;
    icono:  string;
  }> = {
    1: { label: 'Sin iniciar', clase: 'estatus-sin-iniciar', icono: 'pending'           },
    2: { label: 'En proceso',  clase: 'estatus-en-proceso',  icono: 'restaurant'        },
    3: { label: 'Listo',       clase: 'estatus-listo',       icono: 'check_circle'      },
    4: { label: 'Entregado',   clase: 'estatus-entregado',   icono: 'delivery_dining'   },
    5: { label: 'Pagado',      clase: 'estatus-pagado',      icono: 'payments'          },
    6: { label: 'Finalizado',  clase: 'estatus-finalizado',  icono: 'task_alt'          },
    7: { label: 'Cancelado',   clase: 'estatus-cancelado',   icono: 'cancel'            },
    8: { label: 'Merma',       clase: 'estatus-merma',       icono: 'delete_sweep'      },
  };

  selectedDay: Date = new Date();

  readonly hours = Array.from({ length: 24 }, (_v, i) => i);
  selectedHours: number[] = [];

  orderMode: 'newest' | 'oldest' = 'newest';
  showOnlyPending = true;

  get isToday(): boolean {
    return this.isSameDay(this.selectedDay, new Date());
  }

  private savingIds = new Set<number>();
  private pollingStarted = false;
  private idsConocidos = new Set<number>();

  sonidoHabilitado = signal<boolean>(true);

  // ── SIGNALS PARA AUTO-REFRESH ──
  ultimaActualizacion     = signal<Date>(new Date());
  refrescando             = signal<boolean>(false);
  readonly INTERVALO_SEG  = 30;
  segundosProximoRefresh  = signal<number>(this.INTERVALO_SEG);
  relojTick = signal(0);

  // ── SIGNALS PRINCIPALES (PROBLEMA 1) ──
  pedidos  = signal<AdminOrder[]>([]);
  cargando = signal<boolean>(false);

  // ── NUEVOS SIGNALS PARA DISEÑO RESPONSIVE ──
  mostrarFiltros = signal<boolean>(false);
  busqueda = signal<string>('');
  busquedaValue = '';
  filtroEstatus = signal<string>('activos');
  filtroEstatusValue = 'activos';
  filtroTipo = signal<string>('todos');
  filtroTipoValue = 'todos';

  // ── PERÍODO DE FECHA ──
  periodoActivo   = signal<'hoy' | 'semana' | 'mes' | 'todo' | 'rango'>('hoy');
  rangoDesde      = signal<Date | null>(null);
  rangoHasta      = signal<Date | null>(null);
  rangoDesdeValue: Date | null = null;
  rangoHastaValue: Date | null = null;

  readonly estatusOpciones = [
    { valor: 'activos',  label: 'Activos',      icono: 'bolt',         clase: 'activos'      },
    { valor: 'todos',    label: 'Todos',        icono: 'select_all',   clase: 'todos'        },
    { valor: '1',        label: 'Sin iniciar',  icono: 'pending',      clase: 'sin-iniciar'  },
    { valor: '2',        label: 'En proceso',   icono: 'restaurant',   clase: 'en-proceso'   },
    { valor: '3',        label: 'En emplatado', icono: 'check_circle', clase: 'listos'       },
    { valor: '6',        label: 'Finalizados',  icono: 'task_alt',     clase: 'finalizados'  },
    { valor: '7',        label: 'Cancelados',   icono: 'cancel',       clase: 'cancelados'   },
    { valor: '8',        label: 'Merma',        icono: 'delete_sweep', clase: 'merma'        },
  ];

  readonly tipoOpciones = [
    { valor: 'todos',      label: 'Todos',       icono: 'select_all'      },
    { valor: 'local',      label: 'Mesa',        icono: 'table_restaurant'},
    { valor: 'domicilio',  label: 'Domicilio',   icono: 'delivery_dining' },
    { valor: 'recoger',    label: 'Para llevar', icono: 'shopping_bag'    },
  ];

  // Computed para contar filtros activos (para el badge)
  filtrosActivos = computed(() => {
    let count = 0;
    if (this.filtroEstatus() && this.filtroEstatus() !== 'activos' && this.filtroEstatus() !== 'todos') count++;
    if (this.filtroTipo() && this.filtroTipo() !== 'todos') count++;
    if (this.busqueda()) count++;
    return count;
  });

  // Computed para pedidos activos (no finalizados ni cancelados)
  pedidosActivos = computed(() => {
    return this.ordersList.filter(p =>
      p.estatus !== this.ESTATUS.FINALIZADO &&
      p.estatus !== this.ESTATUS.CANCELADO &&
      p.estatus !== this.ESTATUS.MERMA &&
      p.estatus !== this.ESTATUS.ENTREGADO &&
      p.estatus !== this.ESTATUS.PAGADO &&
      p.estatus !== this.ESTATUS.LISTO
    );
  });

  // Computed para pedidos filtrados (PROBLEMA 1 corregido)
  pedidosFiltrados = computed(() => {
    let lista = [...this.pedidos()];
    const filtro = this.filtroEstatus();

    // Filtro de fecha por período (client-side como respaldo al filtrado del backend)
    const rango = this.getPeriodoRango();
    if (rango) {
      const desdeMs = new Date(rango.desde).setHours(0, 0, 0, 0);
      const hastaMs = new Date(rango.hasta).setHours(23, 59, 59, 999);
      lista = lista.filter(p => {
        const d = this.parseDate(p.created_at);
        return d ? (d.getTime() >= desdeMs && d.getTime() <= hastaMs) : false;
      });
    }

    if (filtro === 'activos' || !filtro) {
      lista = lista.filter(p =>
        p.estatus !== this.ESTATUS.FINALIZADO &&
        p.estatus !== this.ESTATUS.CANCELADO &&
        p.estatus !== this.ESTATUS.MERMA &&
        p.estatus !== this.ESTATUS.ENTREGADO &&
        p.estatus !== this.ESTATUS.PAGADO &&
        p.estatus !== this.ESTATUS.LISTO
      );
    } else if (filtro !== 'todos') {
      lista = lista.filter(p =>
        Number(p.estatus) === Number(filtro)
      );
    }

    const tipo = this.filtroTipo();
    if (tipo && tipo !== 'todos') {
      lista = lista.filter(p => p.shipping_type === tipo);
    }

    const q = this.busqueda().toLowerCase().trim();
    if (q) {
      lista = lista.filter(p =>
        getOrderFolio(p).toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        (p.customer_name ?? '').toLowerCase().includes(q)
      );
    }

    return lista;
  });

  // PROBLEMA 4: Pedidos agrupados por estatus para la vista segmentada
  pedidosPorEstatus = computed(() => {
    const lista = this.pedidosFiltrados();
    const filtro = this.filtroEstatus();
    
    // Solo segmentar en vista 'activos' o 'todos'
    if (filtro !== 'activos' && filtro !== 'todos') {
      return null;
    }

    const grupos: {
      estatus:  number;
      label:    string;
      icono:    string;
      color:    string;
      pedidos:  any[];
    }[] = [];

    const orden = [1, 2, 3, 5];

    for (const est of orden) {
      const items = lista.filter(p => p.estatus === est);
      if (items.length > 0) {
        grupos.push({
          estatus: est,
          label:   this.getEtiquetaEstatus(est),
          icono:   this.getIconoEstatus(est),
          color:   this.getColorSeccion(est),
          pedidos: items,
        });
      }
    }

    return grupos.length > 0 ? grupos : null;
  });

  constructor(
    private orders: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Inicializar selectedDay con la fecha actual si no viene del query
    const dayParam = this.route.snapshot.queryParamMap.get('day');
    const parsed = this.parseDayParam(dayParam);
    this.selectedDay = parsed ?? new Date();
    
    // Solo activar filtro de pendientes cuando el día inicial es hoy
    this.showOnlyPending = this.isSameDay(this.selectedDay, new Date());
    
    this.startPolling();
    this.iniciarAutoRefresh();
  }

  private parseDayParam(value: string | null): Date | null {
    if (!value) return null;
    // Espera formato YYYY-MM-DD en zona local
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    const d = new Date(year, month - 1, day);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  private dayToParam(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private syncDayToQueryParam(): void {
    // Mantener el filtro al regresar de detalle (y permitir back/forward del navegador)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { day: this.dayToParam(this.selectedDay), folio: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onDayChange(value: Date | null): void {
    this.selectedDay = value ?? new Date();
    // Al cambiar de día: activar pendientes solo si es hoy
    this.showOnlyPending = this.isSameDay(this.selectedDay, new Date());
    this.syncDayToQueryParam();
    this.applyDayFilter();

    // Requisito: al cambiar el día, refrescar la lista.
    this.refreshNow(this.allOrders.length === 0);
  }

  goToToday(): void {
    this.onDayChange(new Date());
  }

  load(): void {
    // Mantener compatibilidad con botón “Actualizar” del template.
    this.refreshNow(true);
  }

  /**
   * Polling cada 30 segundos para mantener pedidos actualizados.
   */
  private startPolling(): void {
    if (this.pollingStarted) return;
    this.pollingStarted = true;

    timer(0, 30_000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((tick) => {
          // Solo mostrar loader “grande” al inicio.
          const showLoader = tick === 0 && this.allOrders.length === 0;
          return this.fetchOrders(showLoader);
        })
      )
      .subscribe();
  }

  private refreshNow(showLoader: boolean): void {
    this.fetchOrders(showLoader)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private fetchOrders(showLoader: boolean) {
    if (showLoader) {
      this.errorMessage = '';
      this.cargando.set(true);
      this.isLoading = true;
    }

    const params = this.getListOrdersParams();
    if (params === null) {
      if (showLoader) { this.cargando.set(false); this.isLoading = false; }
      return of(null);
    }

    return this.orders.listOrders(params).pipe(
      timeout(15000),
      finalize(() => {
        if (showLoader) {
          this.cargando.set(false);
          this.isLoading = false;
        }
      }),
      catchError((err) => {
        this.handleLoadError(err, showLoader);
        return of(null);
      }),
      switchMap((resp) => {
        if (resp == null) return of(null);
        this.handleLoadSuccess(resp);
        return of(null);
      })
    );
  }

  private handleLoadSuccess(resp: any): void {
    const rows = Array.isArray(resp) ? resp : (resp?.data ?? resp?.orders ?? []);
    const data = Array.isArray(rows) ? (rows as AdminOrder[]) : [];
    const datosFusionados = this.fusionarOrdenesCombi(data);

    if (this.idsConocidos.size > 0) {
      const nuevos = datosFusionados.filter(p =>
        !this.idsConocidos.has(p.id) &&
        p.estatus !== this.ESTATUS.FINALIZADO &&
        p.estatus !== this.ESTATUS.CANCELADO &&
        p.estatus !== this.ESTATUS.MERMA
      );

      if (nuevos.length > 0) {
        this.reproducirSonido();
      }
    }

    data.forEach(p => this.idsConocidos.add(p.id));

    this.pedidos.set(datosFusionados);
    this.allOrders = datosFusionados;

    this.autoMarkPickupOrders();
    this.applyDayFilter();
  }

  /** Agrupa órdenes con el mismo folio_grupo en una sola tarjeta. */
  private fusionarOrdenesCombi(
    ordenes: AdminOrder[]
  ): AdminOrder[] {
    const gruposVistos = new Set<string>();
    const resultado: AdminOrder[] = [];

    for (const orden of ordenes) {
      const grupo = orden.folio_grupo?.trim() || null;

      if (!grupo) {
        resultado.push(orden);
        continue;
      }

      if (gruposVistos.has(grupo)) {
        continue;
      }

      gruposVistos.add(grupo);
      resultado.push({
        ...orden,
        payment_method: 'combinado',
      });
    }

    return resultado;
  }

  readonly formatearNota = formatearNota;

  getIconoPago(metodo?: string): string {
    if (metodo === 'tarjeta') return 'credit_card';
    if (metodo === 'combinado') return 'account_balance_wallet';
    if (metodo === 'transferencia') return 'account_balance';
    return 'payments';
  }

  getLabelPago(metodo?: string): string {
    if (metodo === 'combinado') return 'Combinado';
    if (!metodo) return '';
    return metodo.charAt(0).toUpperCase() + metodo.slice(1);
  }

  getDesgloseCombinado(
    pedido: AdminOrder
  ): { metodo: string; monto: number }[] | null {
    if (pedido.payment_method !== 'combinado') {
      return null;
    }

    return this.parsearDesgloseCombinado(pedido.note ?? null);
  }

  private parsearDesgloseCombinado(
    note: string | null
  ): { metodo: string; monto: number }[] | null {
    if (!note) return null;

    const partes = note.split(' | ');
    for (const parte of [...partes].reverse()) {
      try {
        const data = JSON.parse(parte);
        if (data?.tipo === 'combinado' && Array.isArray(data.pagos)) {
          return data.pagos.filter(
            (p: { monto?: number }) => (p.monto ?? 0) > 0
          );
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  toggleSonido(): void {
    this.sonidoHabilitado.update(v => !v);
  }

  private reproducirSonido(): void {
    if (!this.sonidoHabilitado()) return;

    try {
      const ctx = new AudioContext();

      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type            = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001, ctx.currentTime + 0.4
      );

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);

      setTimeout(() => {
        const osc2  = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type            = 'sine';
        osc2.frequency.value = 1100;
        gain2.gain.setValueAtTime(0.4, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(
          0.001, ctx.currentTime + 0.3
        );
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.3);
      }, 200);
    } catch {
      // Web Audio no disponible — ignorar
    }
  }

  private autoMarkPickupOrders(): void {
    const ordersToUpdate = this.allOrders.filter(
      order => order.shipping_type === 'recoger' && 
               order.pago_confirmado && 
               !order.envio_confirmado
    );

    ordersToUpdate.forEach(order => {
      this.orders.updateOrderChecks(order.id, { envio_confirmado: true }).subscribe({
        next: () => {
          order.envio_confirmado = true;
        },
        error: (err) => {
          console.error(`Error al marcar como enviado pedido #${order.id}:`, err);
        }
      });
    });
  }

  /**
   * Iniciar auto-refresh con contador regresivo
   */
  iniciarAutoRefresh(): void {
    // CAMBIO 3: No auto-refrescar si no es hoy
    if (!this.esHoy()) {
      console.log('⏸️ Auto-refresh pausado (vista de fecha anterior)');
      return;
    }

    // Contador regresivo para mostrar cuándo es el próximo refresh
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.relojTick.update((v) => v + 1);
        this.segundosProximoRefresh.update(s => {
          if (s <= 1) return this.INTERVALO_SEG;
          return s - 1;
        });
      });

    // Refresh real cada 30 segundos
    interval(this.INTERVALO_SEG * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Solo refrescar si seguimos viendo "hoy"
        if (this.esHoy()) {
          this.refrescarSilencioso();
        }
      });
  }

  /**
   * Refresca sin mostrar skeleton ni limpiar la lista
   */
  refrescarSilencioso(): void {
    this.refrescando.set(true);
    this.segundosProximoRefresh.set(this.INTERVALO_SEG);

    const params = this.getListOrdersParams();
    if (params === null) { this.refrescando.set(false); return; }

    this.orders.listOrders(params).subscribe({
      next: (resp) => {
        const rows = Array.isArray(resp) ? resp : (resp?.data ?? resp?.orders ?? []);
        const data = Array.isArray(rows) ? (rows as AdminOrder[]) : [];
        const datosFusionados = this.fusionarOrdenesCombi(data);
        this.allOrders = datosFusionados;
        this.pedidos.set(datosFusionados);
        this.applyDayFilter();
        this.ultimaActualizacion.set(new Date());
        this.refrescando.set(false);
      },
      error: () => this.refrescando.set(false)
    });
  }

  /**
   * Refresh manual desde el botón
   */
  refrescarManual(): void {
    this.refrescarSilencioso();
  }

  private handleLoadError(err: any, clearOnError: boolean): void {
    const status = err?.status;
    if (status === 401 || status === 403) {
      this.errorMessage = 'No autorizado para ver pedidos.';
    } else {
      this.errorMessage = 'No se pudieron cargar los pedidos.';
    }

    // Si nunca cargó nada (primer load), dejar vacío.
    if (clearOnError) {
      this.allOrders = [];
      this.ordersList = [];
    }
  }

  private applyDayFilter(): void {
    this.dayOrders = [...this.allOrders];
    this.applyHourFilterAndSort();
  }

  onHoursChange(value: number[] | null): void {
    const hours = Array.isArray(value) ? value : [];
    this.selectedHours = hours.filter((h) => Number.isFinite(h) && h >= 0 && h <= 23);
    this.applyHourFilterAndSort();
  }

  toggleOrderMode(): void {
    this.orderMode = this.orderMode === 'newest' ? 'oldest' : 'newest';
    this.applyHourFilterAndSort();
  }

  togglePendingFilter(): void {
    this.showOnlyPending = !this.showOnlyPending;
    this.applyHourFilterAndSort();
  }

  private applyHourFilterAndSort(): void {
    const selected = new Set(this.selectedHours);

    const filtered = this.dayOrders.filter((row) => {
      // Excluir cancelados del filtro "solo pendientes"
      if (this.showOnlyPending && (
        row.estatus === this.ESTATUS.FINALIZADO ||
        row.estatus === this.ESTATUS.CANCELADO ||
        row.estatus === this.ESTATUS.MERMA
      )) return false;
      if (selected.size === 0) return true; // sin selección => todas las horas
      const d = this.parseDate(row.created_at);
      if (!d) return false;
      return selected.has(d.getHours());
    });

    filtered.sort((a, b) => {
      return this.orderMode === 'newest' ? b.id - a.id : a.id - b.id;
    });

    this.ordersList = filtered;
  }

  formatHourRange(hour: number): string {
    const h = Math.max(0, Math.min(23, Math.floor(hour)));
    return `${this.formatHour12(h)}:00 ${this.formatMeridiem(h)} - ${this.formatHour12(h)}:59 ${this.formatMeridiem(h)}`;
  }

  private formatHour12(hour24: number): string {
    const h = Math.max(0, Math.min(23, Math.floor(hour24)));
    const v = h % 12;
    return String(v === 0 ? 12 : v);
  }

  private formatMeridiem(hour24: number): 'AM' | 'PM' {
    const h = Math.max(0, Math.min(23, Math.floor(hour24)));
    return h < 12 ? 'AM' : 'PM';
  }

  get selectedDayLabel(): string {
    return this.selectedDay.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  }

  get selectedDayCount(): number {
    return this.ordersList.length;
  }

  getEstatusLabel(estatus?: number): string {
    switch (estatus) {
      case 1:
        return 'En proceso';
      case 2:
        return 'Finalizado';
      case 3:
        return 'Cancelado';
      default:
        return 'En proceso'; // Default si no está definido
    }
  }

  getEstatusIcon(estatus?: number): string {
    switch (estatus) {
      case 1:
        return 'autorenew';
      case 2:
        return 'check_circle';
      case 3:
        return 'cancel';
      default:
        return 'autorenew';
    }
  }

  getEstatusClass(estatus?: number): string {
    switch (estatus) {
      case 1:
        return 'chip-info';
      case 2:
        return 'chip-success';
      case 3:
        return 'chip-error';
      default:
        return 'chip-info';
    }
  }

  canCancelOrder(row: AdminOrder): boolean {
    // Solo se puede cancelar si está en proceso (1) o si no tiene estatus definido
    return (row.estatus === 1 || row.estatus == null) && !this.isSaving(row.id);
  }

  goToDetail(row: AdminOrder): void {
    const dayOrderIds = this.getDayOrderIdsSortedByFolio();
    this.router.navigate(['/pedidos', row.id], {
      queryParamsHandling: 'merge',
      queryParams: { folio: getOrderFolio(row) },
      state: { dayOrderIds },
    });
  }

  private getDayOrderIdsSortedByFolio(): number[] {
    const sorted = [...this.dayOrders].sort((a, b) => {
      const da = this.parseDate(a.created_at);
      const db = this.parseDate(b.created_at);
      const ta = da ? da.getTime() : Number.POSITIVE_INFINITY;
      const tb = db ? db.getTime() : Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return a.id - b.id;
    });
    return sorted.map((x) => x.id);
  }

  isSaving(id: number): boolean {
    return this.savingIds.has(id);
  }

  folioPedido(pedido: AdminOrder): string {
    return getOrderFolio(pedido, { withHash: true });
  }

  canTogglePago(_row: AdminOrder): boolean {
    return false;
  }

  async onMarkPago(_row: AdminOrder): Promise<void> {
    this.showToast({
      title: 'Pago no disponible aquí',
      detail: 'Confirma el pago desde Punto de Venta o Gestión de mesas.',
      icon: 'info',
    });
  }

  async onMarkEnvio(row: AdminOrder): Promise<void> {
    // Requisito: si ya está confirmado, no permitir volver a marcar.
    if (row.envio_confirmado || this.isSaving(row.id)) return;

    const folio = getOrderFolio(row);
    const isLocal = row.shipping_type === 'local';
    
    const confirmed = await this.openConfirmDialog({
      kind: 'envio',
      icon: isLocal ? 'room_service' : 'local_shipping',
      title: isLocal ? 'Confirmar servicio en mesa' : 'Confirmar envío',
      message: isLocal 
        ? `¿La comida ya fue servida en la mesa${folio ? ` del folio ${folio}` : ''}?`
        : `¿Deseas confirmar el envío${folio ? ` del folio ${folio}` : ''}?`,
      meta: folio ? `Folio ${folio}` : `Pedido #${row.id}`,
      confirmText: isLocal ? 'Confirmar servicio' : 'Confirmar envío',
    });
    if (!confirmed) return;

    const prevValue = row.envio_confirmado;
    row.envio_confirmado = true;
    // Para domicilio: auto-finalizar si el pago ya estaba confirmado
    const isDomicilio = row.shipping_type === 'domicilio';
    const autoFinalizar = isDomicilio && row.pago_confirmado;
    const patch: any = { envio_confirmado: true };
    if (autoFinalizar) patch.estatus = this.ESTATUS.FINALIZADO;
    this.persistChecks(
      row,
      patch,
      () => {
        row.envio_confirmado = prevValue;
      },
      () => {
        this.showToast({
          variant: 'envio',
          title: isLocal ? 'Servicio confirmado' : 'Envío confirmado',
          detail: folio ? `Folio ${folio} actualizado.` : `Pedido #${row.id} actualizado.`,
          icon: 'check_circle',
        });
        this.refreshNow(false);
      }
    );
  }

  async onCancelOrder(row: AdminOrder): Promise<void> {
    // No permitir cancelar si el pedido ya está cancelado o finalizado
    if (row.estatus === 3 || row.estatus === 2 || this.isSaving(row.id)) return;

    const folio = getOrderFolio(row);
    const confirmed = await this.openConfirmDialog({
      kind: 'cancelar',
      icon: 'cancel',
      title: 'Cancelar pedido',
      message: `¿Estás seguro de que deseas cancelar${folio ? ` el folio ${folio}` : ' este pedido'}?`,
      meta: folio ? `Folio ${folio}` : `Pedido #${row.id}`,
      confirmText: 'Cancelar pedido',
    });
    if (!confirmed) return;

    const prevValue = row.estatus;
    row.estatus = 3;
    this.persistChecks(
      row,
      { estatus: 3 },
      () => {
        row.estatus = prevValue;
      },
      () => {
        this.showToast({
          variant: 'cancelar',
          title: 'Pedido cancelado',
          detail: folio ? `Folio ${folio} cancelado.` : `Pedido #${row.id} cancelado.`,
          icon: 'cancel',
        });
        this.refreshNow(false);
      }
    );
  }

  private async openConfirmDialog(data: {
    kind: 'pago' | 'envio' | 'cancelar';
    icon: string;
    title: string;
    message: string;
    confirmText: string;
    meta?: string;
  }): Promise<boolean> {
    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        kind: data.kind,
        icon: data.icon,
        title: data.title,
        message: data.message,
        meta: data.meta,
        confirmText: data.confirmText,
        cancelText: 'Cancelar',
      },
      panelClass: 'confirm-status-dialog-panel',
      autoFocus: false,
      restoreFocus: true,
    });

    return Boolean(await firstValueFrom(ref.afterClosed()));
  }

  private showToast(opts: { variant?: 'pago' | 'envio' | 'cancelar'; title: string; detail?: string; icon?: string }): void {
    const variantClass =
      opts.variant === 'pago'
        ? 'status-toast-panel--pago'
        : opts.variant === 'envio'
          ? 'status-toast-panel--envio'
          : opts.variant === 'cancelar'
            ? 'status-toast-panel--cancelar'
            : null;

    this.snackBar.openFromComponent(StatusToastComponent, {
      data: {
        title: opts.title,
        detail: opts.detail,
        icon: opts.icon,
        kind: opts.variant === 'cancelar' ? 'error' : 'success',
      },
      duration: 2600,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: variantClass ? ['status-toast-panel', variantClass] : ['status-toast-panel'],
    });
  }

  private persistChecks(
    row: AdminOrder,
    patch: Partial<Pick<AdminOrder, 'pago_confirmado' | 'envio_confirmado' | 'estatus'>>,
    rollback: () => void,
    onSuccess?: () => void
  ): void {
    this.errorMessage = '';
    this.savingIds.add(row.id);

    this.orders.updateOrderChecks(row.id, patch).subscribe({
      next: () => {
        this.savingIds.delete(row.id);
        onSuccess?.();
      },
      error: () => {
        this.savingIds.delete(row.id);
        rollback();
        this.errorMessage = 'No se pudo actualizar el pedido.';
      },
    });
  }

  trackByOrderId(_index: number, row: AdminOrder): number {
    return row.id;
  }

  formatMoney(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  formatTime(value?: string): string {
    const d = this.parseDate(value);
    if (!d) return '-';
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
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
        return 'payments';
    }
  }

  shippingTypeIcon(type: AdminOrder['shipping_type']): string {
    switch (type) {
      case 'domicilio':
        return 'local_shipping';
      case 'recoger':
        return 'shopping_bag';
      case 'local':
        return 'restaurant';
      default:
        return 'local_shipping';
    }
  }

  shippingTypeLabel(type: AdminOrder['shipping_type']): string {
    switch (type) {
      case 'domicilio':
        return 'Domicilio';
      case 'recoger':
        return 'Para recoger';
      case 'local':
        return 'Comer aquí';
      default:
        return type;
    }
  }

  shippingTypeClass(type: AdminOrder['shipping_type']): string {
    switch (type) {
      case 'domicilio':
        return 'shipping-domicilio';
      case 'recoger':
        return 'shipping-recoger';
      case 'local':
        return 'shipping-local';
      default:
        return '';
    }
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private isSameDay(a: Date | null, b: Date): boolean {
    if (!a) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('es-MX');
  }

  /**
   * Calcula el tiempo transcurrido desde la creación del pedido
   */
  getWaitingTime(createdAt?: string): string {
    const date = this.parseDate(createdAt);
    if (!date) return '-';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  /**
   * Determina el color del indicador de tiempo según el tiempo transcurrido
   */
  getWaitingTimeClass(createdAt?: string): string {
    const date = this.parseDate(createdAt);
    if (!date) return '';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 15) return 'time-ok'; // Verde
    if (minutes < 30) return 'time-warning'; // Amarillo
    return 'time-critical'; // Rojo
  }

  /**
   * Obtiene el total de items en un pedido
   */
  getTotalItems(order: AdminOrder): number {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CAMBIO 3: Métodos para el filtro de fecha
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Maneja el cambio de fecha en el datepicker
   */
  onFechaCambio(event: any) {
    const nuevaFecha = event.value;
    if (nuevaFecha) {
      this.onDayChange(nuevaFecha);
    }
  }

  /**
   * Formatea la fecha para enviar al backend (YYYY-MM-DD)
   */
  formatFechaQuery(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Verifica si la fecha seleccionada es hoy
   */
  esHoy(): boolean {
    return this.periodoActivo() === 'hoy';
  }

  /**
   * Ir a hoy (botón rápido)
   */
  irAHoy() {
    this.goToToday();
  }

  /**
   * Ir al día anterior
   */
  irDiaAnterior() {
    const anterior = new Date(this.selectedDay);
    anterior.setDate(anterior.getDate() - 1);
    this.onDayChange(anterior);
  }

  /**
   * Ir al día siguiente
   */
  irDiaSiguiente() {
    const siguiente = new Date(this.selectedDay);
    siguiente.setDate(siguiente.getDate() + 1);
    this.onDayChange(siguiente);
  }

  // ── PERÍODO DE FECHA ──

  setPeriodo(periodo: 'hoy' | 'semana' | 'mes' | 'todo' | 'rango'): void {
    this.periodoActivo.set(periodo);
    if (periodo !== 'rango') {
      this.refreshNow(true);
    }
  }

  onRangoChange(): void {
    if (this.rangoDesdeValue) this.rangoDesde.set(this.rangoDesdeValue);
    if (this.rangoHastaValue) this.rangoHasta.set(this.rangoHastaValue);
    if (this.rangoDesdeValue && this.rangoHastaValue) {
      this.refreshNow(true);
    }
  }

  getPeriodoRango(): { desde: Date; hasta: Date } | null {
    const periodo = this.periodoActivo();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'hoy':
        return { desde: hoy, hasta: hoy };

      case 'semana': {
        const ini = new Date(hoy);
        const dia = hoy.getDay();
        const offset = dia === 0 ? -6 : 1 - dia; // lunes de la semana actual
        ini.setDate(hoy.getDate() + offset);
        const fin = new Date(ini);
        fin.setDate(ini.getDate() + 6);
        return { desde: ini, hasta: fin };
      }

      case 'mes': {
        const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        return { desde: ini, hasta: fin };
      }

      case 'todo':
        return null; // sin restricción de fecha en cliente

      case 'rango': {
        const desde = this.rangoDesde();
        const hasta = this.rangoHasta();
        if (!desde || !hasta) return null;
        return { desde, hasta };
      }

      default:
        return { desde: hoy, hasta: hoy };
    }
  }

  rangoLabelPersonalizado(): string {
    const desde = this.rangoDesde();
    const hasta = this.rangoHasta();
    if (desde && hasta) {
      const fmt = (d: Date) =>
        d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      return `${fmt(desde)} – ${fmt(hasta)}`;
    }
    return 'Personalizado';
  }

  private getListOrdersParams(): string | { fechaDesde: string; fechaHasta: string } | null {
    const periodo = this.periodoActivo();

    if (periodo === 'hoy') {
      return this.formatFechaQuery(new Date());
    }

    if (periodo === 'todo') {
      return {
        fechaDesde: '2020-01-01',
        fechaHasta: this.formatFechaQuery(new Date()),
      };
    }

    const rango = this.getPeriodoRango();
    if (!rango) return null; // 'rango' sin fechas seleccionadas aún
    return {
      fechaDesde: this.formatFechaQuery(rango.desde),
      fechaHasta: this.formatFechaQuery(rango.hasta),
    };
  }

  // ── MÉTODOS HELPER PARA EL DISEÑO RESPONSIVE ──

  /**
   * Helper para saber si una orden es urgente (>30 min)
   */
  esUrgente(pedido: AdminOrder): boolean {
    return this.getMinutos(pedido) >= 30;
  }

  /**
   * Helper para saber si una orden es nueva (<5 min)
   */
  esNuevo(pedido: AdminOrder): boolean {
    return this.getMinutos(pedido) < 5;
  }

  /**
   * Obtiene los minutos transcurridos desde la creación
   */
  getMinutos(pedido: AdminOrder): number {
    const date = this.parseDate(pedido.created_at);
    if (!date) return 0;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / 60000);
  }

  getMinutosRestantes(pedido: AdminOrder): number {
    const d = this.parseTiempoEntrega(pedido.tiempo_entrega_estimado);
    if (!d) return -1;
    return Math.round((d.getTime() - Date.now()) / 60000);
  }

  getClaseReloj(pedido: AdminOrder, _tick?: number): string {
    const min = this.getMinutosRestantes(pedido);
    if (min < 0) return 'reloj--vencido';
    if (min <= 5) return 'reloj--critico';
    if (min <= 15) return 'reloj--alerta';
    return 'reloj--ok';
  }

  getTextoReloj(pedido: AdminOrder, _tick?: number): string {
    const min = this.getMinutosRestantes(pedido);
    if (min < 0) {
      const atrasado = Math.abs(min);
      return atrasado < 60
        ? `${atrasado}min tarde`
        : `${Math.floor(atrasado / 60)}h tarde`;
    }
    if (min === 0) return 'Ahora';
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  getIconoReloj(pedido: AdminOrder, _tick?: number): string {
    const min = this.getMinutosRestantes(pedido);
    if (min < 0) return 'alarm_off';
    if (min <= 5) return 'alarm';
    return 'schedule';
  }

  private parseTiempoEntrega(value?: string | null): Date | null {
    if (!value?.trim()) return null;
    const trimmed = value.trim();
    const normalized = trimmed.includes('T')
      ? trimmed
      : trimmed.replace(' ', 'T');
    return this.parseDate(normalized);
  }

  /**
   * Toggle para mostrar/ocultar filtros en móvil
   */
  toggleFiltros(): void {
    this.mostrarFiltros.update(v => !v);
  }

  /**
   * Nota específica del producto (selections.nota), sin incluir complementos.
   */
  getNotaItem(item: AdminOrderItem): string {
    return this.extraerNotaDeSelections(item.selections);
  }

  private extraerNotaDeSelections(
    selections: AdminOrderItem['selections']
  ): string {
    if (selections == null || selections === '') return '';

    if (typeof selections === 'string') {
      try {
        return this.extraerNotaDeSelections(JSON.parse(selections));
      } catch {
        return '';
      }
    }

    if (Array.isArray(selections)) {
      const notaEntry = selections.find(s => {
        const title = (s.groupTitle ?? '').toLowerCase();
        return title === 'nota' || title === 'notas especiales' || title === 'comentario';
      });
      return (notaEntry?.extra ?? '').toString().trim();
    }

    if (typeof selections === 'object') {
      const nota = selections['nota'] ?? selections['comentario'];
      if (nota != null && String(nota).trim()) {
        return String(nota).trim();
      }
    }

    return '';
  }

  /**
   * Formatear selections de un item (complementos, sin la nota del producto).
   */
  formatSelections(item: AdminOrderItem): string {
    if (!item.selections) return '';
    try {
      let s: unknown = item.selections;
      if (typeof s === 'string') {
        s = JSON.parse(s);
      }

      if (Array.isArray(s)) {
        return s
          .filter((sel: { groupTitle?: string }) => {
            const title = (sel.groupTitle ?? '').toLowerCase();
            return title !== 'nota' && title !== 'notas especiales' && title !== 'comentario';
          })
          .map((sel: { extra?: string; groupTitle?: string }) => sel.extra || sel.groupTitle)
          .filter(Boolean)
          .join(', ');
      }

      if (s && typeof s === 'object') {
        const parts: string[] = [];
        for (const [grupo, valor] of Object.entries(s as Record<string, unknown>)) {
          if (grupo === 'nota' || grupo === 'comentario') continue;
          if (Array.isArray(valor)) {
            parts.push(...valor.map(v => String(v)).filter(v => v.trim().length > 0));
          } else if (valor != null && String(valor).trim()) {
            parts.push(String(valor));
          }
        }
        return parts.join(', ');
      }

      return '';
    } catch {
      return '';
    }
  }

  formatDeliveryAddress(addr: any): string {
    if (!addr) return '';
    if (typeof addr === 'string') {
      try { addr = JSON.parse(addr); } catch { return addr; }
    }
    if (typeof addr !== 'object') return '';
    const calle = (addr.calle ?? '').toString().trim();
    const numero = (addr.numero ?? '').toString().trim();
    const colonia = (addr.colonia ?? '').toString().trim();
    const ciudad = (addr.ciudad ?? '').toString().trim();
    const parts = [`${calle} ${numero}`.trim(), colonia, ciudad].filter(p => p.length > 0);
    return parts.join(', ');
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

  /**
   * Items visibles en cocina (no entregados al cliente).
   */
  getItemsCocina(pedido: AdminOrder): AdminOrderItem[] {
    const items = pedido.items ?? [];

    if (
      pedido.estatus === this.ESTATUS.FINALIZADO ||
      pedido.estatus === this.ESTATUS.CANCELADO ||
      pedido.estatus === this.ESTATUS.MERMA
    ) {
      return items;
    }

    return items.filter(i => !i.entregado);
  }

  /** @deprecated Usar getItemsCocina — mantiene compatibilidad con plantilla */
  getItemsPendientes(pedido: AdminOrder): AdminOrderItem[] {
    return this.getItemsCocina(pedido);
  }

  getItemsFaltantesEmplatado(pedido: AdminOrder): number {
    return this.getItemsCocina(pedido)
      .filter(i => !i.listo_emplatado).length;
  }

  getItemsListosEmplatado(pedido: AdminOrder): number {
    return this.getItemsCocina(pedido)
      .filter(i => i.listo_emplatado).length;
  }

  todosItemsListosParaEmplatar(pedido: AdminOrder): boolean {
    const items = this.getItemsCocina(pedido);
    return items.length === 0
      || items.every(i => i.listo_emplatado === true);
  }

  requiereEmplatadoParaAvanzar(pedido: AdminOrder): boolean {
    return pedido.estatus === this.ESTATUS.EN_PROCESO;
  }

  puedeEjecutarAccion(pedido: AdminOrder): boolean {
    if (!this.puedeAvanzar(pedido)) return false;
    if (
      this.requiereEmplatadoParaAvanzar(pedido) &&
      !this.todosItemsListosParaEmplatar(pedido)
    ) {
      return false;
    }
    return true;
  }

  getTooltipAccion(pedido: AdminOrder): string {
    if (
      this.requiereEmplatadoParaAvanzar(pedido) &&
      !this.todosItemsListosParaEmplatar(pedido)
    ) {
      const n = this.getItemsFaltantesEmplatado(pedido);
      return n === 1
        ? 'Marca el producto como listo para emplatar'
        : `Marca ${n} productos como listos para emplatar`;
    }
    return this.getTextoAccion(pedido);
  }

  mostrarHeaderCocinaPendiente(pedido: AdminOrder): boolean {
    return pedido.estatus === this.ESTATUS.EN_PROCESO
      && this.getItemsCocina(pedido).some(i => !i.listo_emplatado);
  }

  mostrarAvisoIniciarParaChecks(pedido: AdminOrder): boolean {
    return pedido.estatus === this.ESTATUS.SIN_INICIAR
      && this.esItemAdicional(pedido)
      && this.getItemsCocina(pedido).length > 0;
  }

  mostrarResumenEmplatado(pedido: AdminOrder): boolean {
    return pedido.estatus === this.ESTATUS.LISTO
      && this.getItemsCocina(pedido).length > 0;
  }

  getEtiquetaEstatusPedido(estatus?: number): string {
    if (!estatus) return 'Desconocido';
    if (estatus === this.ESTATUS.LISTO) return 'En emplatado';
    return this.getEtiquetaEstatus(estatus);
  }

  /**
   * True si el pedido tiene items de múltiples lotes (se agregaron items después del pedido original)
   */
  esItemAdicional(pedido: AdminOrder): boolean {
    const items = pedido.items ?? [];
    if (items.length <= 1) return false;
    const timestamps = new Set(
      items.map(i => (i.created_at ?? '').substring(0, 19)).filter(t => t.length > 0)
    );
    return timestamps.size > 1;
  }

  /**
   * Obtener clase CSS de estatus
   */
  getClaseEstatus(estatus?: number): string {
    if (!estatus) return '';
    return this.ESTATUS_CONFIG[estatus]?.clase ?? '';
  }

  /**
   * Ver detalle del pedido (navegar)
   */
  verDetalle(pedido: AdminOrder): void {
    this.goToDetail(pedido);
  }

  /**
   * Signal para procesando ID (para deshabilitar botones)
   */
  procesando = signal<number | null>(null);

  procesandoItemId = signal<number | null>(null);

  debeCheckearItem(item: AdminOrderItem, pedido: AdminOrder): boolean {
    return !item.entregado
      && pedido.estatus === this.ESTATUS.EN_PROCESO;
  }

  /** Compatibilidad con plantilla en caché del dev server */
  mostrarChecksEmplatado(pedido: AdminOrder): boolean {
    return pedido.estatus === this.ESTATUS.EN_PROCESO;
  }

  toggleListoEmplatado(
    item: AdminOrderItem,
    pedido: AdminOrder,
    $event: Event
  ): void {
    $event.stopPropagation();

    if (this.procesandoItemId() !== null) return;
    if (!item.id) return;
    if (pedido.estatus !== this.ESTATUS.EN_PROCESO) return;

    const nuevoEstado = !item.listo_emplatado;
    const itemId = item.id;

    this.procesandoItemId.set(itemId);

    this.orders
      .marcarItemListoEmplatado(itemId, nuevoEstado)
      .subscribe({
        next: () => {
          this.pedidos.update(lista =>
            lista.map(pedido => ({
              ...pedido,
              items: (pedido.items ?? []).map(i =>
                i.id === itemId
                  ? { ...i, listo_emplatado: nuevoEstado }
                  : i
              ),
            }))
          );

          this.allOrders = this.allOrders.map(pedido => ({
            ...pedido,
            items: (pedido.items ?? []).map(i =>
              i.id === itemId
                ? { ...i, listo_emplatado: nuevoEstado }
                : i
            ),
          }));

          this.procesandoItemId.set(null);
        },
        error: () => {
          this.procesandoItemId.set(null);
        },
      });
  }

  /**
   * Avanzar al siguiente estatus según el flujo
   */
  avanzarEstatus(pedido: AdminOrder): void {
    const siguiente = this.getSiguienteEstatus(pedido);
    if (!siguiente || this.procesando() !== null) return;

    if (
      this.requiereEmplatadoParaAvanzar(pedido) &&
      !this.todosItemsListosParaEmplatar(pedido)
    ) {
      this.showToast({
        title: 'Faltan productos por marcar',
        detail: this.getTooltipAccion(pedido),
        icon: 'restaurant',
      });
      return;
    }

    this.procesando.set(pedido.id);

    const payload: any = { estatus: siguiente };

    // Al marcar como Servido/Entregado → confirmar envío siempre.
    // El pago NO se confirma desde Pedidos (Mostrador / Gestión de mesas).
    if (
      siguiente === this.ESTATUS.FINALIZADO ||
      siguiente === this.ESTATUS.ENTREGADO
    ) {
      payload.envio_confirmado = true;
    }

    this.orders.updateOrderChecks(pedido.id, payload)
      .subscribe({
        next: () => {
          this.pedidos.update(list => [
            ...list.map(p =>
              p.id === pedido.id
                ? { ...p, ...payload }
                : { ...p }
            )
          ]);
          const index = this.allOrders.findIndex(
            p => p.id === pedido.id
          );
          if (index !== -1) {
            this.allOrders[index] = {
              ...this.allOrders[index], ...payload
            };
          }
          this.applyDayFilter();
          this.procesando.set(null);
        },
        error: () => this.procesando.set(null)
      });
  }

  /**
   * Cancelar pedido
   */
  async cancelarPedido(pedido: AdminOrder): Promise<void> {
    if (this.procesando() !== null) return;

    const folio = getOrderFolio(pedido);

    // Dialog de confirmación premium con MatDialog
    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        kind:        'cancelar',
        icon:        'cancel',
        title:       'Cancelar pedido',
        message:     `¿Estás seguro de que deseas cancelar ${
                       folio ? `el folio #${folio}` : `el pedido #${pedido.id}`
                     }? Esta acción no se puede deshacer.`,
        meta:        folio
                       ? `Folio #${folio} · $${pedido.total}`
                       : `Pedido #${pedido.id} · $${pedido.total}`,
        confirmText: 'Sí, cancelar pedido',
        cancelText:  'No, mantener',
      },
      panelClass:   'confirm-status-dialog-panel',
      autoFocus:    false,
      restoreFocus: true,
    });

    const confirmed = Boolean(await firstValueFrom(ref.afterClosed()));
    if (!confirmed) return;

    const prevValue = pedido.estatus;
    pedido.estatus = 7;

    this.procesando.set(pedido.id);

    this.orders.updateOrderChecks(pedido.id, {
      estatus: this.ESTATUS.CANCELADO
    }).subscribe({
      next: () => {
        this.pedidos.update(list => [
          ...list.map(p =>
            p.id === pedido.id
              ? { ...p, estatus: this.ESTATUS.CANCELADO }
              : { ...p }
          )
        ]);

        const index = this.allOrders.findIndex(p => p.id === pedido.id);
        if (index !== -1) {
          this.allOrders[index] = {
            ...this.allOrders[index],
            estatus: this.ESTATUS.CANCELADO
          };
        }
        this.applyDayFilter();
        this.procesando.set(null);

        this.showToast({
          variant: 'cancelar',
          title:   'Pedido cancelado',
          detail:  folio
                     ? `Folio #${folio} cancelado correctamente.`
                     : `Pedido #${pedido.id} cancelado.`,
          icon:    'cancel',
        });
      },
      error: () => {
        pedido.estatus = prevValue;
        this.procesando.set(null);
        this.showToast({
          title:  'Error al cancelar',
          detail: 'No se pudo cancelar el pedido. Intenta de nuevo.',
          icon:   'error',
        });
      }
    });
  }

  /**
   * Marcar pedido finalizado como merma (no recogido / perdido)
   */
  async marcarMerma(pedido: AdminOrder): Promise<void> {
    if (this.procesando() !== null) return;

    const folio = getOrderFolio(pedido);

    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        kind:        'cancelar',
        icon:        'delete_sweep',
        title:       'Marcar como merma',
        message:     `¿La orden #${folio} se perdió o no fue recogida? Se registrará como merma.`,
        meta:        `Folio #${folio} · $${pedido.total}`,
        confirmText: 'Sí, es merma',
        cancelText:  'No, mantener',
      },
      panelClass: 'confirm-status-dialog-panel',
    });

    const confirmed = Boolean(
      await firstValueFrom(ref.afterClosed())
    );
    if (!confirmed) return;

    this.procesando.set(pedido.id);

    this.orders
      .updateOrderChecks(pedido.id, { estatus: 8 })
      .subscribe({
        next: () => {
          this.pedidos.update(list =>
            list.map(p =>
              p.id === pedido.id
                ? { ...p, estatus: 8 }
                : p
            )
          );
          const index = this.allOrders
            .findIndex(p => p.id === pedido.id);
          if (index !== -1) {
            this.allOrders[index] = {
              ...this.allOrders[index],
              estatus: 8,
            };
          }
          this.applyDayFilter();
          this.procesando.set(null);

          this.showToast({
            variant: 'cancelar',
            title:   'Orden marcada como merma',
            detail:  `Folio #${folio} registrado como merma.`,
            icon:    'delete_sweep',
          });
        },
        error: () => {
          this.procesando.set(null);
        },
      });
  }

  /**
   * Determinar el siguiente estatus lógico según el tipo de pedido
   */
  getSiguienteEstatus(pedido: AdminOrder): number | null {
    switch (pedido.estatus) {
      case this.ESTATUS.SIN_INICIAR:
        return this.ESTATUS.EN_PROCESO;   // Iniciar → En proceso

      case this.ESTATUS.EN_PROCESO:
        return this.ESTATUS.LISTO;        // Listo → Listo para servir

      case this.ESTATUS.LISTO:
        return pedido.shipping_type === 'local'
          ? this.ESTATUS.ENTREGADO
          : this.ESTATUS.FINALIZADO;

      default:
        return null;
    }
  }

  /**
   * Texto del botón de acción principal
   */
  getTextoAccion(pedido: AdminOrder): string {
    switch (pedido.estatus) {
      case this.ESTATUS.SIN_INICIAR: return 'Iniciar';
      case this.ESTATUS.EN_PROCESO:  return 'Listo';
      case this.ESTATUS.LISTO:
        return pedido.shipping_type === 'local'
          ? 'Servido'
          : 'Entregado';
      default: return '';
    }
  }

  /**
   * Ícono del botón de acción principal
   */
  getIconoAccion(pedido: AdminOrder): string {
    switch (pedido.estatus) {
      case this.ESTATUS.SIN_INICIAR: return 'play_arrow';
      case this.ESTATUS.EN_PROCESO:  return 'check';
      case this.ESTATUS.LISTO:
        return pedido.shipping_type === 'local'
          ? 'room_service'
          : 'local_shipping';
      default: return 'check';
    }
  }

  /**
   * Color del botón según estatus
   */
  getClaseBoton(pedido: AdminOrder): string {
    switch (pedido.estatus) {
      case this.ESTATUS.SIN_INICIAR: return 'btn-accion--primario';
      case this.ESTATUS.EN_PROCESO:  return 'btn-accion--warning';
      case this.ESTATUS.LISTO:       return 'btn-accion--success';
      default: return '';
    }
  }

  /**
   * Si el pedido puede avanzar de estatus
   */
  puedeAvanzar(pedido: AdminOrder): boolean {
    const estatus = pedido.estatus ?? 0;
    return estatus !== this.ESTATUS.FINALIZADO
      && estatus !== this.ESTATUS.CANCELADO
      && estatus !== this.ESTATUS.MERMA
      && estatus !== this.ESTATUS.ENTREGADO
      && estatus !== this.ESTATUS.PAGADO;
  }

  /**
   * Confirmar pago independientemente (CAMBIO 2)
   */
  confirmarPagoIndependiente(_pedido: AdminOrder): void {
    this.showToast({
      title: 'Pago no disponible aquí',
      detail: 'Confirma el pago desde Punto de Venta o Gestión de mesas.',
      icon: 'info',
    });
  }

  /**
   * Confirmar entrega independientemente (CAMBIO 2)
   */
  confirmarEntregaIndependiente(pedido: AdminOrder): void {
    if (this.procesando() !== null) return;
    this.procesando.set(pedido.id);

    const payload: any = { envio_confirmado: true };
    if (pedido.pago_confirmado) {
      payload.estatus = pedido.shipping_type === 'local'
        ? this.ESTATUS.ENTREGADO
        : this.ESTATUS.FINALIZADO;
    }

    this.orders.updateOrderChecks(pedido.id, payload)
      .subscribe({
        next: () => {
          // PROBLEMA 3: Spread operator para forzar detección de cambios
          this.pedidos.update(list => [
            ...list.map(p =>
              p.id === pedido.id ? { ...p, ...payload } : { ...p }
            )
          ]);
          
          // Mantener compatibilidad
          const index = this.allOrders.findIndex(p => p.id === pedido.id);
          if (index !== -1) {
            this.allOrders[index] = { ...this.allOrders[index], ...payload };
          }
          this.applyDayFilter();
          this.procesando.set(null);
        },
        error: (err: any) => {
          console.error('Error al confirmar entrega:', err);
          this.procesando.set(null);
        }
      });
  }

  /**
   * Contar pedidos por estatus para los contadores del header
   */
  contarPorEstatus(estatus: number): number {
    return this.ordersList.filter(p => p.estatus === estatus).length;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PROBLEMA 4: Métodos helper para vista segmentada
  // ────────────────────────────────────────────────────────────────────────────

  getEtiquetaEstatus(estatus: number): string {
    const etiquetas: Record<number, string> = {
      1: 'Sin iniciar',
      2: 'En proceso',
      3: 'En emplatado',
      4: 'Entregados',
      5: 'Pagados',
      6: 'Finalizados',
      7: 'Cancelados',
      8: 'Merma',
    };
    return etiquetas[estatus] ?? 'Desconocido';
  }

  getIconoEstatus(estatus: number): string {
    const iconos: Record<number, string> = {
      1: 'pending',
      2: 'restaurant',
      3: 'check_circle',
      4: 'delivery_dining',
      5: 'payments',
      6: 'task_alt',
      7: 'cancel',
      8: 'delete_sweep',
    };
    return iconos[estatus] ?? 'help_outline';
  }

  getColorSeccion(estatus: number): string {
    const colores: Record<number, string> = {
      1: '#6b7280',
      2: '#854F0B',
      3: '#1C8C40',
      4: '#185FA5',
      5: '#7c3aed',
    };
    return colores[estatus] ?? '#6b7280';
  }
}
