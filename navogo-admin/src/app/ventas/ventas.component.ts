import {
  Component, OnInit, AfterViewInit, ViewChild,
  inject, signal, computed, DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatCardModule }        from '@angular/material/card';
import { MatTableModule,
         MatTableDataSource }   from '@angular/material/table';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatDatepickerModule }  from '@angular/material/datepicker';
import { MatNativeDateModule }  from '@angular/material/core';
import { MatChipsModule }       from '@angular/material/chips';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { MatDividerModule }     from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule,
         MatPaginator,
         PageEvent }            from '@angular/material/paginator';
import { MatSortModule,
         MatSort }              from '@angular/material/sort';
import { MatDialog }            from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { VentasService }        from './ventas.service';
import { Venta, TotalesVentas, FiltrosVentas } from './ventas.interface';
import { VentaDetalleDialogComponent }
  from './dialogs/venta-detalle.dialog';
import { formatearNota } from '../utils/order-note.util';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector:    'app-ventas',
  standalone:  true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    DecimalPipe,
    MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatChipsModule, MatTooltipModule, MatDividerModule,
    MatProgressBarModule, MatPaginatorModule, MatSortModule,
  ],
  templateUrl: './ventas.component.html',
  styleUrls:   ['./ventas.component.scss']
})
export class VentasComponent implements OnInit, AfterViewInit {
  private service    = inject(VentasService);
  private destroyRef = inject(DestroyRef);
  private dialog     = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  dataSource = new MatTableDataSource<Venta>([]);

  readonly formatearNota = formatearNota;

  ventas    = signal<Venta[]>([]);
  totales   = signal<TotalesVentas | null>(null);
  cargando  = signal<boolean>(true);

  // Paginación (server-side)
  paginaActual   = signal<number>(1);
  totalPaginasSrv = signal<number>(1);
  totalRegistros = signal<number>(0);
  perPage = 20;

  // Filtros
  filtroEstatus   = signal<string>('');
  filtroMetodo    = signal<string>('');
  filtroTipo      = signal<string>('');
  busqueda        = signal<string>('');
  fechaInicio     = signal<string>('');
  fechaFin        = signal<string>('');
  fechaInicioDate = signal<Date | null>(null);
  fechaFinDate    = signal<Date | null>(null);

  readonly Math = Math;

  private busquedaSubject$ = new Subject<string>();

  readonly columnas = [
    'folio', 'fecha', 'cliente', 'tipo',
    'pago', 'estatus', 'total', 'acciones'
  ];

  // ── Computed totales ──────────────────────────────────────────
  totalVentas        = computed(() => this.totales()?.total_ventas       ?? 0);
  totalFinalizadas   = computed(() => this.totales()?.finalizadas         ?? 0);
  totalEfectivo      = computed(() => this.totales()?.total_efectivo      ?? 0);
  totalTarjeta       = computed(() => this.totales()?.total_tarjeta       ?? 0);
  totalTransferencia = computed(() => this.totales()?.total_transferencia ?? 0);
  totalCanceladas    = computed(() => this.totales()?.canceladas           ?? 0);
  totalMermas        = computed(() => this.totales()?.mermas              ?? 0);

  ngOnInit(): void {
    this.cargar();

    this.busquedaSubject$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(q => {
      this.busqueda.set(q);
      this.paginaActual.set(1);
      this.cargar();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    // Paginator maneja server-side vía onPageEvent()
  }

  cargar(): void {
    this.cargando.set(true);

    const filtros: FiltrosVentas = {
      page:     this.paginaActual(),
      per_page: this.perPage,
    };

    if (this.busqueda())      filtros.busqueda      = this.busqueda();
    if (this.filtroEstatus()) filtros.estatus       = this.filtroEstatus();
    if (this.filtroMetodo())  filtros.metodo_pago   = this.filtroMetodo();
    if (this.filtroTipo())    filtros.shipping_type = this.filtroTipo();
    if (this.fechaInicio())   filtros.fecha_inicio  = this.fechaInicio();
    if (this.fechaFin())      filtros.fecha_fin     = this.fechaFin();

    this.service.getHistorial(filtros).subscribe({
      next: (res) => {
        const data = res.data ?? [];

        this.ventas.set(data);
        this.dataSource.data = data;

        // Recalcular totales excluyendo cancelados (7) y mermas (8)
        const activas = data.filter(
          (v: any) => v.estatus !== 7 && v.estatus !== 8
        );
        const totalesCalculados = {
          ...res.totales,
          total_ventas: activas
            .reduce((s: number, v: any) => s + Number(v.total), 0),
          total_efectivo: activas
            .filter((v: any) => v.payment_method === 'efectivo')
            .reduce((s: number, v: any) => s + Number(v.total), 0),
          total_tarjeta: activas
            .filter((v: any) => v.payment_method === 'tarjeta')
            .reduce((s: number, v: any) => s + Number(v.total), 0),
          total_transferencia: activas
            .filter((v: any) => v.payment_method === 'transferencia')
            .reduce((s: number, v: any) => s + Number(v.total), 0),
          mermas: res.totales?.mermas
            ?? data.filter((v: any) => v.estatus === 8).length,
        };

        this.totales.set(totalesCalculados);
        this.totalPaginasSrv.set(res.meta?.last_page ?? 1);
        this.totalRegistros.set(res.meta?.total ?? 0);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  // Server-side filter (fecha, estatus, tipo, método)
  private recargarFiltrado(): void {
    this.paginaActual.set(1);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstatus.set('');
    this.filtroMetodo.set('');
    this.filtroTipo.set('');
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.fechaInicioDate.set(null);
    this.fechaFinDate.set(null);
    this.paginaActual.set(1);
    this.cargar();
  }

  filtrarHoy(): void {
    const hoy = new Date();
    const iso = hoy.toISOString().split('T')[0];
    this.fechaInicioDate.set(hoy);
    this.fechaFinDate.set(hoy);
    this.fechaInicio.set(iso);
    this.fechaFin.set(iso);
    this.recargarFiltrado();
  }

  toggleFiltrarHoy(): void {
    const iso = new Date().toISOString().split('T')[0];
    if (this.fechaInicio() === iso && this.fechaFin() === iso) {
      // Ya está en "Hoy" → limpiar fechas y mostrar todo
      this.fechaInicioDate.set(null);
      this.fechaFinDate.set(null);
      this.fechaInicio.set('');
      this.fechaFin.set('');
      this.recargarFiltrado();
    } else {
      this.filtrarHoy();
    }
  }

  // Búsqueda con debounce → server
  aplicarFiltro(valor: string): void {
    this.busquedaSubject$.next(valor);
  }

  // Evento del MatPaginator → server-side
  onPageEvent(event: PageEvent): void {
    this.paginaActual.set(event.pageIndex + 1);
    this.perPage = event.pageSize; // ← capturar nuevo tamaño
    this.cargar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Adapters para template
  onFechaDesde(event: any): void {
    const fecha: Date | null = event?.value ?? null;
    this.fechaInicioDate.set(fecha);
    this.fechaInicio.set(fecha ? fecha.toISOString().split('T')[0] : '');
    this.recargarFiltrado();
  }

  onFechaHasta(event: any): void {
    const fecha: Date | null = event?.value ?? null;
    this.fechaFinDate.set(fecha);
    this.fechaFin.set(fecha ? fecha.toISOString().split('T')[0] : '');
    this.recargarFiltrado();
  }

  onFiltroEstatus(val: string): void {
    this.filtroEstatus.set(val ?? '');
    this.recargarFiltrado();
  }

  onFiltroMetodo(val: string): void {
    this.filtroMetodo.set(val ?? '');
    this.recargarFiltrado();
  }

  onFiltroTipo(val: string): void {
    this.filtroTipo.set(val ?? '');
    this.recargarFiltrado();
  }

  hayFiltrosActivos(): boolean {
    return !!(this.busqueda() || this.filtroEstatus()
      || this.filtroMetodo() || this.filtroTipo()
      || this.fechaInicio() || this.fechaFin());
  }

  // ── Label helpers ──────────────────────────────────────────────
  getEtatusLabel(e: number): string {
    const m: Record<number, string> = {
      1: 'Sin iniciar',
      2: 'En proceso',
      3: 'Listo',
      4: 'Entregado',
      5: 'Pagado',
      6: 'Finalizado',
      7: 'Cancelado',
      8: 'Merma',
    };
    return m[e] ?? String(e);
  }

  // alias para template
  getEstatusLabel(e: number): string { return this.getEtatusLabel(e); }

  getTipoInfo(tipo: string): { label: string; icono: string; clase: string } {
    const mapa: Record<string, { label: string; icono: string; clase: string }> = {
      mesa:      { label: 'Mesa',        icono: 'table_restaurant', clase: 'mesa'      },
      local:     { label: 'Mesa',        icono: 'table_restaurant', clase: 'mesa'      },
      recoger:   { label: 'Para llevar', icono: 'shopping_bag',     clase: 'llevar'    },
      llevar:    { label: 'Para llevar', icono: 'shopping_bag',     clase: 'llevar'    },
      domicilio: { label: 'Domicilio',   icono: 'delivery_dining',  clase: 'domicilio' },
    };
    return mapa[tipo] ?? { label: tipo, icono: 'help', clase: 'default' };
  }

  getTipoLabel(tipo: string): string { return this.getTipoInfo(tipo).label; }

  getMetodoLabel(method: string): string {
    const m: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      combinado: 'Combinado',
    };
    return m[method] ?? (method || '—');
  }

  parsearDesgloseCombinado(note: string | null): {
    metodo: string; monto: number
  }[] | null {
    if (!note) return null;
    const partes = note.split(' | ');
    for (const parte of [...partes].reverse()) {
      try {
        const data = JSON.parse(parte);
        if (data?.tipo === 'combinado'
            && Array.isArray(data.pagos)) {
          return data.pagos.filter(
            (p: any) => p.monto > 0
          );
        }
      } catch { continue; }
    }
    return null;
  }

  getIconoMetodo(metodo: string): string {
    if (metodo === 'tarjeta') return 'credit_card';
    if (metodo === 'transferencia') return 'account_balance';
    return 'payments';
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  verDetalle(venta: Venta, event?: Event): void {
    event?.stopPropagation();
    this.dialog.open(VentaDetalleDialogComponent, {
      data:       { venta, folioEmpresa: venta.id },
      width:      '580px',
      maxWidth:   '95vw',
      maxHeight:  '90vh',
      panelClass: 'dawrz-dialog',
    });
  }

  // ── Exportar Excel ────────────────────────────────────────────
  descargarExcel(): void {
    const offset = (this.paginaActual() - 1) * this.perPage;
    const filas = this.ventas().map((v, i) => ({
      Folio:   `#${v.id}`,
      Fecha:   this.formatFecha(v.created_at),
      Cliente: v.customer_name || '—',
      Tipo:    this.getTipoLabel(v.shipping_type),
      Pago:    this.getMetodoLabel(v.payment_method),
      Estatus: this.getEstatusLabel(v.estatus),
      Total:   Number(v.total),
    }));

    const ws = XLSX.utils.json_to_sheet(filas);

    // Ancho de columnas
    ws['!cols'] = [10, 22, 22, 14, 16, 14, 12].map(w => ({ wch: w }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `ventas_${fecha}.xlsx`);
  }

  // ── Exportar PDF ──────────────────────────────────────────────
  descargarPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(27, 94, 32);
    doc.text('Historial de Ventas', 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Generado el ${fecha}`, 14, 22);

    // Totales resumen
    const t = this.totales();
    if (t) {
      doc.setFontSize(9);
      doc.setTextColor(40);
      doc.text(`Total ventas: $${Number(t.total_ventas).toLocaleString('es-MX', { minimumFractionDigits: 2 })}   |   Finalizadas: ${t.finalizadas}   |   Canceladas: ${t.canceladas}`, 14, 28);
    }

    const pdfOffset = (this.paginaActual() - 1) * this.perPage;
    autoTable(doc, {
      startY: 33,
      head: [['Folio', 'Fecha', 'Cliente', 'Tipo', 'Pago', 'Estatus', 'Total']],
      body: this.ventas().map((v, i) => [
        `#${v.id}`,
        this.formatFecha(v.created_at),
        v.customer_name || '—',
        this.getTipoLabel(v.shipping_type),
        this.getMetodoLabel(v.payment_method),
        this.getEstatusLabel(v.estatus),
        `$${Number(v.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      ]),
      headStyles: { fillColor: [27, 94, 32], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 247, 240] },
      columnStyles: { 6: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    const iso = new Date().toISOString().split('T')[0];
    doc.save(`ventas_${iso}.pdf`);
  }
}
