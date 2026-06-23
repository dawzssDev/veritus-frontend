import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize, timeout } from 'rxjs/operators';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { OrderService } from '../../services/orders/order.service';
import { DetailsDialogComponent, DetailsDialogData } from './details-dialog/details-dialog.component';

type ShippingType = 'domicilio' | 'recoger';
type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'combinado';

type DayOfWeek = 'all' | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

interface AdminOrderItem {
  product_id?: number | null;
  name: string;
  quantity: number;
  unit_price: number | string;
}

interface AdminOrder {
  id: number;
  business_id: number;
  shipping_type: ShippingType;
  payment_method: PaymentMethod;
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  subtotal: number | string;
  shipping_cost: number | string;
  tip: number | string;
  total: number | string;
  created_at?: string;
  items?: AdminOrderItem[];
}

interface KpiDelta {
  value: number;
  pct: number | null;
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getDayKey(date: Date): DayOfWeek {
  const idx = date.getDay();
  // JS: 0 domingo ... 6 sábado
  const map: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return map[idx] ?? 'all';
}

@Component({
  selector: 'app-ventas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './ventas-dashboard.html',
  styleUrl: './ventas-dashboard.scss',
})
export class VentasDashboard {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  private readonly dialog = inject(MatDialog);
  private readonly orders = inject(OrderService);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  private readonly allOrders = signal<AdminOrder[]>([]);

  readonly allOrdersCount = computed(() => this.allOrders().length);

  // Filtros
  readonly dateFrom = signal<Date>(startOfDay(addDays(new Date(), -6)));
  readonly dateTo = signal<Date>(endOfDay(new Date()));
  readonly dayOfWeek = signal<DayOfWeek>('all');
  readonly paymentMethods = signal<PaymentMethod[]>([]);
  readonly shippingTypes = signal<ShippingType[]>([]);

  readonly validOrders = computed(() => this.allOrders().filter((o) => o?.pago_confirmado));

  readonly filteredOrders = computed(() => {
    const from = startOfDay(this.dateFrom());
    const to = endOfDay(this.dateTo());

    const dow = this.dayOfWeek();
    const pay = this.paymentMethods();
    const ship = this.shippingTypes();

    return this.validOrders().filter((o) => {
      const created = parseDate(o.created_at) ?? null;
      if (!created) return false;
      if (created < from || created > to) return false;

      if (dow !== 'all' && getDayKey(created) !== dow) return false;
      if (pay.length > 0 && !pay.includes(o.payment_method)) return false;
      if (ship.length > 0 && !ship.includes(o.shipping_type)) return false;

      return true;
    });
  });

  // Periodo anterior (mismo tamaño)
  readonly previousRange = computed(() => {
    const from = startOfDay(this.dateFrom());
    const to = endOfDay(this.dateTo());
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const prevTo = endOfDay(addDays(from, -1));
    const prevFrom = startOfDay(addDays(prevTo, -(days - 1)));
    return { prevFrom, prevTo };
  });

  readonly previousOrders = computed(() => {
    const { prevFrom, prevTo } = this.previousRange();
    return this.validOrders().filter((o) => {
      const created = parseDate(o.created_at) ?? null;
      if (!created) return false;
      return created >= prevFrom && created <= prevTo;
    });
  });

  // KPIs
  readonly kpiVentas = computed(() => this.sumTotal(this.filteredOrders()));
  readonly kpiPedidos = computed(() => this.filteredOrders().length);
  readonly kpiTicket = computed(() => (this.kpiPedidos() > 0 ? this.kpiVentas() / this.kpiPedidos() : 0));

  readonly kpiHoraPico = computed(() => {
    const buckets = new Array<number>(24).fill(0);
    for (const o of this.filteredOrders()) {
      const created = parseDate(o.created_at);
      if (!created) continue;
      buckets[created.getHours()] += toNumber(o.total);
    }
    let bestHour = 0;
    let bestValue = -1;
    for (let h = 0; h < 24; h++) {
      if (buckets[h] > bestValue) {
        bestValue = buckets[h];
        bestHour = h;
      }
    }
    const label = `${String(bestHour).padStart(2, '0')}:00–${String((bestHour + 1) % 24).padStart(2, '0')}:00`;
    return { hour: bestHour, label, value: Math.max(0, bestValue) };
  });

  readonly kpiEntrega = computed(() => {
    const counts: Record<ShippingType, number> = { domicilio: 0, recoger: 0 };
    for (const o of this.filteredOrders()) {
      if (o.shipping_type === 'domicilio' || o.shipping_type === 'recoger') {
        counts[o.shipping_type]++;
      }
    }

    const total = counts.domicilio + counts.recoger;
    const winner: ShippingType = counts.recoger > counts.domicilio ? 'recoger' : 'domicilio';
    const pct = total > 0 ? Math.round((counts[winner] / total) * 100) : 0;
    return { winner, pct, counts };
  });

  readonly deltaVentas = computed(() => this.calcDelta(this.kpiVentas(), this.sumTotal(this.previousOrders())));
  readonly deltaPedidos = computed(() => this.calcDelta(this.kpiPedidos(), this.previousOrders().length));
  readonly deltaTicket = computed(() => this.calcDelta(this.kpiTicket(), this.previousOrders().length > 0 ? this.sumTotal(this.previousOrders()) / this.previousOrders().length : 0));

  // Series
  readonly seriesByDay = computed(() => {
    const from = startOfDay(this.dateFrom());
    const to = startOfDay(this.dateTo());
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const index = new Map<string, number>();
    const labels: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      const key = formatYmd(d);
      index.set(key, i);
      labels.push(key);
    }

    const values = new Array<number>(days).fill(0);
    const orderCounts = new Array<number>(days).fill(0);
    for (const o of this.filteredOrders()) {
      const created = parseDate(o.created_at);
      if (!created) continue;
      const key = formatYmd(created);
      const idx = index.get(key);
      if (idx == null) continue;
      values[idx] += toNumber(o.total);
      orderCounts[idx]++;
    }

    const max = Math.max(1, ...values);
    return { labels, values, orderCounts, max };
  });

  readonly seriesByHour = computed(() => {
    const values = new Array<number>(24).fill(0);
    const orderCounts = new Array<number>(24).fill(0);
    for (const o of this.filteredOrders()) {
      const created = parseDate(o.created_at);
      if (!created) continue;
      const hour = created.getHours();
      values[hour] += toNumber(o.total);
      orderCounts[hour]++;
    }
    const max = Math.max(1, ...values);
    return { values, orderCounts, max };
  });

  readonly paymentBreakdown = computed(() => {
    const by: Record<PaymentMethod, { count: number; total: number }> = {
      efectivo: { count: 0, total: 0 },
      transferencia: { count: 0, total: 0 },
      tarjeta: { count: 0, total: 0 },
      combinado: { count: 0, total: 0 },
    };

    for (const o of this.filteredOrders()) {
      const bucket = by[o.payment_method];
      if (!bucket) continue;
      bucket.count++;
      bucket.total += toNumber(o.total);
    }

    const sum = Object.values(by).reduce((acc, v) => acc + v.total, 0);
    return { by, sum };
  });

  readonly topProducts = computed(() => {
    const map = new Map<string, { key: string; name: string; units: number; total: number }>();
    let hasItems = false;

    for (const o of this.filteredOrders()) {
      const items = o.items;
      if (!items || items.length === 0) continue;
      hasItems = true;

      for (const it of items) {
        const key = (it.product_id != null ? `id:${it.product_id}` : `name:${it.name}`).toString();
        const current = map.get(key) ?? { key, name: it.name, units: 0, total: 0 };
        const qty = Math.max(0, Math.floor(Number(it.quantity ?? 0)));
        const price = toNumber(it.unit_price);
        current.units += qty;
        current.total += qty * price;
        map.set(key, current);
      }
    }

    const rows = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 8);
    return { hasItems, rows };
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.orders
      .listOrders()
      .pipe(
        timeout(20000),
        finalize(() => this.isLoading.set(false))
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const rows = Array.isArray(resp) ? resp : (resp?.data ?? resp?.orders ?? []);
          this.allOrders.set(Array.isArray(rows) ? (rows as AdminOrder[]) : []);
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar las ventas.');
          this.allOrders.set([]);
        },
      });
  }

  onQuickRange(days: 0 | 6 | 29): void {
    const to = endOfDay(new Date());
    const from = startOfDay(addDays(to, -days));
    this.dateFrom.set(from);
    this.dateTo.set(to);
  }

  clearFilters(): void {
    this.dayOfWeek.set('all');
    this.paymentMethods.set([]);
    this.shippingTypes.set([]);
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatCompact(value: number): string {
    if (!Number.isFinite(value)) return this.formatMoney(0);
    if (value >= 1_000_000) return `${this.formatMoney(value / 1_000_000).replace('MXN', '').trim()}M`;
    if (value >= 1_000) return `${this.formatMoney(value / 1_000).replace('MXN', '').trim()}k`;
    return this.formatMoney(value);
  }

  deltaLabel(delta: KpiDelta): string {
    if (delta.pct == null) return '—';
    const sign = delta.pct >= 0 ? '↑' : '↓';
    return `${sign} ${Math.abs(delta.pct).toFixed(0)}%`;
  }

  deltaClass(delta: KpiDelta): 'up' | 'down' | 'flat' {
    if (delta.pct == null) return 'flat';
    if (delta.pct > 0) return 'up';
    if (delta.pct < 0) return 'down';
    return 'flat';
  }

  private sumTotal(rows: AdminOrder[]): number {
    return rows.reduce((acc, o) => acc + toNumber(o.total), 0);
  }

  private calcDelta(current: number, previous: number): KpiDelta {
    if (!Number.isFinite(previous) || previous <= 0) {
      return { value: current - previous, pct: null };
    }
    const pct = ((current - previous) / previous) * 100;
    return { value: current - previous, pct };
  }

  // SVG helpers
  barHeight(value: number, max: number): number {
    const safeMax = Math.max(1, max);
    return Math.round((value / safeMax) * 100);
  }

  // Helper para formatear labels de fecha (día del mes)
  formatDayLabel(dateString: string): string {
    const parts = dateString.split('-');
    return parts[2] || dateString; // Retorna el día (ej: "23")
  }

  // Helper para formatear labels de hora
  formatHourLabel(hour: number): string {
    return hour.toString().padStart(2, '0');
  }

  // Helper para formatear valor con conteo de pedidos
  formatBarValue(value: number, count: number): string {
    if (value === 0) return '';
    return `${this.formatCompact(value)} (${count})`;
  }

  // Métodos para abrir diálogos de detalles
  openVentasDialog(): void {
    this.router.navigate(['/ventas/detalle'], {
      state: {
        title: 'Detalles de Ventas',
        subtitle: `${this.formatMoney(this.kpiVentas())} en ${this.kpiPedidos()} pedidos`,
        icon: 'attach_money',
        orders: this.filteredOrders(),
        type: 'ventas'
      }
    });
  }

  openPedidosDialog(): void {
    this.router.navigate(['/ventas/detalle'], {
      state: {
        title: 'Detalles de Pedidos',
        subtitle: `${this.kpiPedidos()} pedidos confirmados`,
        icon: 'shopping_cart',
        orders: this.filteredOrders(),
        type: 'pedidos'
      }
    });
  }

  openTicketDialog(): void {
    this.router.navigate(['/ventas/detalle'], {
      state: {
        title: 'Ticket Promedio',
        subtitle: `${this.formatMoney(this.kpiTicket())} por pedido`,
        icon: 'receipt',
        orders: this.filteredOrders(),
        type: 'ticket'
      }
    });
  }

  openHoraPicoDialog(): void {
    const horaPico = this.kpiHoraPico();
    const ordersInPeakHour = this.filteredOrders().filter(o => {
      const created = parseDate(o.created_at);
      if (!created) return false;
      return created.getHours() === horaPico.hour;
    });

    this.router.navigate(['/ventas/detalle'], {
      state: {
        title: 'Hora Pico',
        subtitle: `${horaPico.label} - ${ordersInPeakHour.length} pedidos`,
        icon: 'schedule',
        orders: ordersInPeakHour,
        type: 'hora'
      }
    });
  }

  openEntregaDialog(): void {
    const entrega = this.kpiEntrega();
    const ordersOfType = this.filteredOrders().filter(o => o.shipping_type === entrega.winner);

    this.router.navigate(['/ventas/detalle'], {
      state: {
        title: 'Tipo de Entrega Dominante',
        subtitle: `${entrega.winner === 'domicilio' ? 'Domicilio' : 'Recoger'} - ${entrega.pct}% (${ordersOfType.length} pedidos)`,
        icon: entrega.winner === 'domicilio' ? 'local_shipping' : 'store',
        orders: ordersOfType,
        type: 'entrega'
      }
    });
  }

  async downloadPDF(): Promise<void> {
    const element = this.elementRef.nativeElement.querySelector('.content-card.ventas__body');
    if (!element) {
      console.error('No se encontró el elemento del dashboard');
      alert('Error: No se pudo encontrar el contenido del dashboard');
      return;
    }

    try {
      // Mostrar mensaje de carga
      console.log('Generando PDF...');

      // Configurar opciones para html2canvas con mejor compatibilidad
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Remover elementos que puedan causar problemas
          const clonedElement = clonedDoc.querySelector('.content-card.ventas__body');
          if (clonedElement) {
            // Forzar estilos básicos que son seguros
            (clonedElement as HTMLElement).style.backgroundColor = '#ffffff';
          }
        }
      });

      const imgWidth = 210; // A4 width en mm
      const pageHeight = 297; // A4 height en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Agregar la primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generar nombre de archivo con fecha
      const from = formatYmd(this.dateFrom());
      const to = formatYmd(this.dateTo());
      const filename = `ventas-dashboard_${from}_${to}.pdf`;

      pdf.save(filename);
      console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    }
  }
}
