import {
  Component, OnInit, inject, signal
} from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule }
  from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule }
  from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule }
  from '@angular/material/snack-bar';
import { MatFormFieldModule }
  from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule }
  from '@angular/material/datepicker';
import { MatNativeDateModule }
  from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { FacturacionService } from '../facturacion.service';
import {
  Factura, FacturapiConfig,
  OrdenParaFacturar, REGIMENES_FISCALES, ClienteFiscal
} from '../facturacion.interface';
import { NuevaFacturaDialog }
  from '../dialogs/nueva-factura/nueva-factura.dialog';
import { CancelarFacturaDialog }
  from '../dialogs/cancelar-factura/cancelar-factura.dialog';
import { ClienteFiscalDialog }
  from '../dialogs/cliente-fiscal/cliente-fiscal.dialog';

@Component({
  selector: 'app-facturacion-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatDialogModule, MatTabsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule,
    MatSelectModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule,
    MatChipsModule, MatDividerModule,
  ],
  templateUrl: './facturacion-page.component.html',
  styleUrl: './facturacion-page.component.scss',
})
export class FacturacionPageComponent implements OnInit {
  private service  = inject(FacturacionService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tabActivo = signal(0);

  facturas      = signal<Factura[]>([]);
  cargandoFact  = signal(false);
  totalFacturas = signal(0);
  filtroRfc     = signal('');
  filtroEstatus = signal('');
  filtroFechaInicio = signal('');
  filtroFechaFin    = signal('');

  busquedaFolio      = signal('');
  busquedaFecha      = signal('');
  ordenesEncontradas = signal<OrdenParaFacturar[]>([]);
  buscando           = signal(false);
  ordenSeleccionada  = signal<OrdenParaFacturar | null>(null);

  clientes      = signal<ClienteFiscal[]>([]);
  cargandoCli   = signal(false);
  totalClientes = signal(0);
  paginaCli     = signal(1);

  config          = signal<FacturapiConfig | null>(null);
  configurado     = signal(false);
  guardandoConfig = signal(false);
  configForm = {
    rfc:            '',
    razon_social:   '',
    regimen_fiscal: '626',
    codigo_postal:  '',
  };
  readonly regimenes = REGIMENES_FISCALES;

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarConfig();
    this.cargarClientes();
  }

  cargarFacturas(): void {
    this.cargandoFact.set(true);
    this.service.getFacturas({
      rfc:           this.filtroRfc() || undefined,
      estatus:       this.filtroEstatus() || undefined,
      fecha_inicio:  this.filtroFechaInicio() || undefined,
      fecha_fin:     this.filtroFechaFin() || undefined,
    }).subscribe({
      next: (res) => {
        this.facturas.set(res.data ?? []);
        this.totalFacturas.set(res.total ?? 0);
        this.cargandoFact.set(false);
      },
      error: () => this.cargandoFact.set(false),
    });
  }

  descargarPdf(factura: Factura): void {
    this.service.descargarPdf(factura.id).subscribe({
      next: (res) => this.manejarArchivoFactura(
        res, factura, 'pdf', 'Error al obtener el PDF'
      ),
      error: () => this.toast('Error al obtener el PDF', true),
    });
  }

  descargarXml(factura: Factura): void {
    this.service.descargarXml(factura.id).subscribe({
      next: (res) => this.manejarArchivoFactura(
        res, factura, 'xml', 'Error al obtener el XML'
      ),
      error: () => this.toast('Error al obtener el XML', true),
    });
  }

  private manejarArchivoFactura(
    res: HttpResponse<Blob>,
    factura: Factura,
    tipo: 'pdf' | 'xml',
    mensajeError: string
  ): void {
    const blob = res.body;
    if (!blob) {
      this.toast(mensajeError, true);
      return;
    }

    if (blob.type === 'application/json') {
      blob.text().then((text) => {
        try {
          const err = JSON.parse(text);
          this.toast(err.message ?? mensajeError, true);
        } catch {
          this.toast(mensajeError, true);
        }
      });
      return;
    }

    const nombre = this.nombreArchivoFactura(res, factura, tipo);
    const url = URL.createObjectURL(blob);

    this.dispararDescarga(url, nombre);

    if (tipo === 'pdf') {
      window.open(url, '_blank');
    } else {
      blob.text().then((xml) => this.abrirVistaXml(xml, nombre));
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    this.toast(
      tipo === 'pdf'
        ? 'PDF descargado correctamente'
        : 'XML descargado correctamente'
    );
  }

  private nombreArchivoFactura(
    res: HttpResponse<Blob>,
    factura: Factura,
    tipo: 'pdf' | 'xml'
  ): string {
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^";\n]+)"?/i);
    if (match?.[1]) return match[1];

    const base = factura.uuid
      ?? factura.folio_factura
      ?? String(factura.id);
    return `factura-${base}.${tipo}`;
  }

  private dispararDescarga(url: string, nombre: string): void {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  }

  private abrirVistaXml(xml: string, nombre: string): void {
    const ventana = window.open('', '_blank', 'width=900,height=700');
    if (!ventana) {
      this.toast(
        'Permite ventanas emergentes para ver el XML',
        true
      );
      return;
    }

    const escapado = xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${nombre}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            background: #f8fafc;
            color: #1A1A11;
          }
          header {
            padding: 10px 16px;
            background: #0F4D2A;
            color: white;
            font-weight: 700;
            font-size: 13px;
          }
          pre {
            margin: 0;
            padding: 16px;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <header>${nombre}</header>
        <pre>${escapado}</pre>
      </body>
      </html>
    `);
    ventana.document.close();
  }

  abrirEnviarEmail(factura: Factura): void {
    const email = prompt('Email del destinatario:');
    if (!email) return;

    this.service.enviarEmail(factura.id, email).subscribe({
      next: (res) => this.toast(
        res.ok ? 'Factura enviada por email' : res.message,
        !res.ok
      ),
      error: () => this.toast('Error al enviar', true),
    });
  }

  abrirCancelar(factura: Factura): void {
    const ref = this.dialog.open(CancelarFacturaDialog, {
      width: '460px', maxWidth: '95vw',
      data: { factura },
    });
    ref.afterClosed().subscribe((cancelada) => {
      if (cancelada) {
        this.facturas.update(list =>
          list.map(f => f.id === cancelada.id
            ? cancelada : f)
        );
        this.toast('Factura cancelada');
      }
    });
  }

  buscarOrdenes(): void {
    if (!this.busquedaFolio() && !this.busquedaFecha()) return;

    this.buscando.set(true);
    this.ordenesEncontradas.set([]);
    this.ordenSeleccionada.set(null);

    this.service.buscarOrdenes({
      folio: this.busquedaFolio() || undefined,
      fecha: this.busquedaFecha() || undefined,
    }).subscribe({
      next: (res) => {
        this.ordenesEncontradas.set(res.data ?? []);
        this.buscando.set(false);
      },
      error: () => this.buscando.set(false),
    });
  }

  seleccionarOrden(orden: OrdenParaFacturar): void {
    this.ordenSeleccionada.set(orden);
  }

  abrirNuevaFactura(orden: OrdenParaFacturar): void {
    if (orden.tiene_factura) {
      this.toast('Esta orden ya tiene una factura emitida', true);
      return;
    }

    const ref = this.dialog.open(NuevaFacturaDialog, {
      width: '540px', maxWidth: '95vw',
      maxHeight: '90vh',
      data: { orden },
    });

    ref.afterClosed().subscribe((factura) => {
      if (factura) {
        this.toast('Factura emitida correctamente');
        this.cargarFacturas();
        this.ordenesEncontradas.update(list =>
          list.map(o => o.id === orden.id
            ? { ...o, tiene_factura: true, factura }
            : o)
        );
      }
    });
  }

  cargarConfig(): void {
    this.service.getConfig().subscribe({
      next: (res) => {
        this.configurado.set(res.configurado);
        if (res.data) {
          this.config.set(res.data);
          this.configForm.rfc           = res.data.rfc;
          this.configForm.razon_social  = res.data.razon_social;
          this.configForm.regimen_fiscal = res.data.regimen_fiscal;
          this.configForm.codigo_postal  = res.data.codigo_postal;
        }
      },
    });
  }

  cargarClientes(): void {
    this.cargandoCli.set(true);
    this.service.getClientesFiscales(
      this.paginaCli()
    ).subscribe({
      next: (res) => {
        this.clientes.set(res.data ?? []);
        this.totalClientes.set(res.total ?? 0);
        this.cargandoCli.set(false);
      },
      error: () => this.cargandoCli.set(false),
    });
  }

  abrirNuevoCliente(): void {
    const ref = this.dialog.open(
      ClienteFiscalDialog, {
        width: '520px', maxWidth: '95vw',
        maxHeight: '90vh',
        data: {},
      }
    );
    ref.afterClosed().subscribe((c) => {
      if (c) {
        this.toast('Cliente guardado correctamente');
        this.cargarClientes();
      }
    });
  }

  abrirEditarCliente(cliente: ClienteFiscal): void {
    const ref = this.dialog.open(
      ClienteFiscalDialog, {
        width: '520px', maxWidth: '95vw',
        maxHeight: '90vh',
        data: { cliente },
      }
    );
    ref.afterClosed().subscribe((c) => {
      if (c) {
        this.toast('Cliente actualizado');
        this.cargarClientes();
      }
    });
  }

  eliminarCliente(cliente: ClienteFiscal): void {
    if (!confirm(
      `¿Eliminar a ${cliente.razon_social}?`
    )) return;

    this.service.eliminarClienteFiscal(cliente.id)
      .subscribe({
        next: () => {
          this.toast('Cliente eliminado');
          this.cargarClientes();
        },
        error: () => this.toast('Error al eliminar', true),
      });
  }

  guardarConfig(): void {
    if (!this.configForm.rfc
        || !this.configForm.razon_social) return;

    this.guardandoConfig.set(true);

    this.service.saveConfig({
      rfc:            this.configForm.rfc.toUpperCase(),
      razon_social:   this.configForm.razon_social,
      regimen_fiscal: this.configForm.regimen_fiscal,
      codigo_postal:  this.configForm.codigo_postal,
    }).subscribe({
      next: (res) => {
        this.guardandoConfig.set(false);
        this.config.set(res.data);
        this.configurado.set(true);
        this.toast('Configuración guardada correctamente');
      },
      error: (err) => {
        this.guardandoConfig.set(false);

        const mensaje = err?.error?.message
          ?? 'Error al guardar';

        if (err?.error?.debug) {
          console.warn('FacturAPI debug:', err.error.debug);
        }

        this.toast(mensaje, true);
      }
    });
  }

  getEstatusLabel(estatus: string): string {
    if (estatus === 'valid') return 'Vigente';
    if (estatus === 'cancelled') return 'Cancelada';
    return 'Borrador';
  }

  getEstatusClass(estatus: string): string {
    if (estatus === 'valid') return 'chip-vigente';
    if (estatus === 'cancelled') return 'chip-cancelada';
    return 'chip-borrador';
  }

  private toast(msg: string, esError = false): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: esError ? ['snack-error'] : [],
    });
  }
}
