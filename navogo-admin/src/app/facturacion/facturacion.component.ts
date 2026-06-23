import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  Factura,
  DatosFiscales,
  ResumenFacturacion,
  EstatusFactura,
  StripeInvoice,
  InvoicesResponse,
} from '../models/facturacion.interface';
import { Suscripcion } from '../models/suscripcion.interface';
import { SuscripcionService } from '../services/suscripciones/suscripcion.service';
import { StripeService } from '../services/stripe/stripe.service';
import { FacturacionService } from '../services/facturacion/facturacion.service';
import { DetalleFacturaDialogComponent } from './dialogs/detalle-factura-dialog.component';
import { DatosFiscalesDialogComponent } from './dialogs/datos-fiscales-dialog.component';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule,
    MatProgressBarModule,
  ],
  templateUrl: './facturacion.component.html',
  styleUrl: './facturacion.component.scss',
})
export class FacturacionComponent {
  private dialog = inject(MatDialog);
  private suscripcionService = inject(SuscripcionService);
  private stripeService = inject(StripeService);
  private facturacionService = inject(FacturacionService);

  // Signals de suscripción
  suscripcionActiva    = signal<Suscripcion | null>(null);
  cancelando           = signal<boolean>(false);
  errorCancelacion     = signal<string | null>(null);
  mostrarConfirmacion  = signal<boolean>(false);

  // Signals de invoices
  invoices             = signal<StripeInvoice[]>([]);
  cargandoInvoices     = signal<boolean>(true);
  errorInvoices        = signal<string | null>(null);
  descargandoPdf       = signal<string | null>(null); // id de la invoice

  // Signals de resumen y datos fiscales
  resumen              = signal<ResumenFacturacion | null>(null);
  cargandoResumen      = signal<boolean>(true);
  datosFiscales        = signal<DatosFiscales | null>(null);
  pagandoAhora         = signal<boolean>(false);

  readonly anioActual = new Date().getFullYear();

  columnas: string[] = [
    'folio',
    'periodo',
    'concepto',
    'emision',
    'vencimiento',
    'total',
    'estatus',
    'acciones',
  ];

  busquedaValue = '';
  filtroValue = 'todas';

  readonly estatusOpciones = [
    { valor: 'todas' as const, label: 'Todas' },
    { valor: 'pagada' as EstatusFactura, label: 'Pagadas' },
    { valor: 'pendiente' as EstatusFactura, label: 'Pendientes' },
    { valor: 'vencida' as EstatusFactura, label: 'Vencidas' },
  ];

  filtroEstatus = signal<EstatusFactura | 'todas'>('todas');
  busqueda = signal<string>('');

  facturasFiltradas = computed(() => {
    let resultado = this.invoices();

    if (this.filtroEstatus() !== 'todas') {
      resultado = resultado.filter(i => {
        if (this.filtroEstatus() === 'pagada')    return i.pagada;
        if (this.filtroEstatus() === 'pendiente') return !i.pagada
          && i.estatus === 'open';
        if (this.filtroEstatus() === 'vencida')   return i.estatus
          === 'uncollectible';
        return true;
      });
    }

    const q = this.busqueda().toLowerCase().trim();
    if (q) {
      resultado = resultado.filter(i =>
        i.numero?.toLowerCase().includes(q)
        || i.descripcion?.toLowerCase().includes(q)
        || this.formatPeriodo(i).toLowerCase().includes(q)
      );
    }

    return resultado;
  });

  getEstatusLabel(estatus: EstatusFactura): string {
    const labels: Record<EstatusFactura, string> = {
      pagada: 'Pagada',
      pendiente: 'Pendiente',
      vencida: 'Vencida',
      cancelada: 'Cancelada',
    };
    return labels[estatus];
  }

  verDetalle(factura: Factura): void {
    this.dialog.open(DetalleFacturaDialogComponent, {
      data: { factura },
      width: '520px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
    });
  }

  editarDatosFiscales(): void {
    const ref = this.dialog.open(DatosFiscalesDialogComponent, {
      data:       { datosFiscales: this.datosFiscales() },
      width:      '540px',
      maxWidth:   '95vw',
      panelClass: 'dawrz-dialog'
    });

    // Al guardar, actualiza el signal local
    ref.afterClosed().subscribe((datosActualizados: DatosFiscales) => {
      if (datosActualizados) {
        this.datosFiscales.set(datosActualizados);
      }
    });
  }

  descargarPDF(invoice: StripeInvoice, event: Event): void {
    event.stopPropagation();

    if (!invoice.pdf_url && !invoice.hosted_url) {
      // Si no tiene PDF aún, obtenerlo fresco del backend
      this.descargandoPdf.set(invoice.id);

      this.stripeService.getInvoicePdf(invoice.id).subscribe({
        next: (res) => {
          this.descargandoPdf.set(null);
          if (res.pdf_url) {
            window.open(res.pdf_url, '_blank');
          } else if (res.hosted_url) {
            window.open(res.hosted_url, '_blank');
          }
        },
        error: () => {
          this.descargandoPdf.set(null);
        }
      });
    } else {
      // Abrir directamente si ya tenemos la URL
      window.open(invoice.pdf_url ?? invoice.hosted_url!, '_blank');
    }
  }

  verInvoice(invoice: StripeInvoice): void {
    if (invoice.hosted_url) {
      window.open(invoice.hosted_url, '_blank');
    }
  }

  formatPeriodo(invoice: StripeInvoice): string {
    if (!invoice.periodo_inicio) return '—';
    return new Date(invoice.periodo_inicio).toLocaleDateString('es-MX', {
      month: 'long',
      year:  'numeric'
    });
  }

  getEstatusInvoice(invoice: StripeInvoice): string {
    if (invoice.pagada)                      return 'Pagada';
    if (invoice.estatus === 'open')          return 'Pendiente';
    if (invoice.estatus === 'uncollectible') return 'Vencida';
    if (invoice.estatus === 'void')          return 'Anulada';
    return invoice.estatus;
  }

  getClaseEstatusInvoice(invoice: StripeInvoice): string {
    if (invoice.pagada)                      return 'estatus-pagada';
    if (invoice.estatus === 'open')          return 'estatus-pendiente';
    if (invoice.estatus === 'uncollectible') return 'estatus-vencida';
    return 'estatus-cancelada';
  }

  formatFecha(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  ngOnInit(): void {
    this.cargarResumen();
    this.cargarInvoices();
    this.cargarDatosFiscales();
    this.cargarSuscripcionActiva();
  }

  cargarResumen(): void {
    this.cargandoResumen.set(true);
    this.facturacionService.getResumenFacturacion().subscribe({
      next: (res) => {
        this.resumen.set(res.data);
        this.cargandoResumen.set(false);
      },
      error: () => this.cargandoResumen.set(false)
    });
  }

  cargarDatosFiscales(): void {
    this.facturacionService.getDatosFiscales().subscribe({
      next: (res) => this.datosFiscales.set(res.data),
      error: () => this.datosFiscales.set(null)
    });
  }

  pagarAhora(): void {
    if (this.pagandoAhora()) return;
    this.pagandoAhora.set(true);

    this.facturacionService.pagarPendiente().subscribe({
      next: (res) => {
        this.pagandoAhora.set(false);
        if (res.data?.url) {
          window.open(res.data.url, '_blank');
        }
      },
      error: () => {
        this.pagandoAhora.set(false);
        // TODO: mostrar toast de error
      }
    });
  }

  cargarInvoices(): void {
    this.cargandoInvoices.set(true);
    this.errorInvoices.set(null);

    this.stripeService.getInvoices().subscribe({
      next: (res) => {
        this.invoices.set(res.data);
        this.cargandoInvoices.set(false);
      },
      error: (err) => {
        this.cargandoInvoices.set(false);
        this.errorInvoices.set(
          err?.error?.message
          ?? 'Error al cargar las facturas'
        );
      }
    });
  }

  cargarSuscripcionActiva(): void {
    this.suscripcionService.getAll({
      estatus: 'active,trialing'
    }).subscribe({
      next: (res) => {
        // Tomar la primera suscripción activa o en trial
        const activa = res.data.find(s =>
          s.estatus === 'active' || s.estatus === 'trialing'
        );
        this.suscripcionActiva.set(activa ?? null);
      },
      error: () => this.suscripcionActiva.set(null)
    });
  }

  cancelarSuscripcion(): void {
    const suscripcion = this.suscripcionActiva();
    if (!suscripcion || this.cancelando()) return;

    this.cancelando.set(true);
    this.errorCancelacion.set(null);

    this.suscripcionService.cancelar(suscripcion.id).subscribe({
      next: (res) => {
        this.cancelando.set(false);
        this.mostrarConfirmacion.set(false);

        // Actualizar la suscripción activa con el nuevo estatus
        this.suscripcionActiva.set(res.data);

        // Refrescar el resumen de facturación
        this.cargarSuscripcionActiva();
      },
      error: (err) => {
        this.cancelando.set(false);
        this.errorCancelacion.set(
          err?.error?.message
          ?? 'Error al cancelar. Intenta de nuevo o contáctanos.'
        );
      }
    });
  }

  getEtiquetaEstatus(estatus: string): string {
    const etiquetas: Record<string, string> = {
      trialing: 'En prueba',
      active:   'Activa',
      past_due: 'Pago vencido',
      canceled: 'Cancelada',
      unpaid:   'Sin pagar',
      paused:   'Pausada',
    };
    return etiquetas[estatus] ?? estatus;
  }
}
