import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TicketVentaData } from '../../../models/ticket.interface';
import { getOrderFolio } from '../../../utils/order-folio.util';
import { formatearNota } from '../../../utils/order-note.util';

@Component({
  selector: 'app-ticket-venta-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './ticket-venta-dialog.component.html',
  styleUrl: './ticket-venta-dialog.component.scss',
})
export class TicketVentaDialogComponent {
  public dialogRef = inject(MatDialogRef<TicketVentaDialogComponent>);
  public data = inject<TicketVentaData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  @ViewChild('ticketPreview') ticketPreview?: ElementRef<HTMLElement>;

  imprimiendo = signal<boolean>(false);
  readonly hoy = new Date();
  readonly formatearNota = formatearNota;

  readonly nombreEmpresa: string = this.resolverNombreEmpresa(this.data?.orden?.nombre_empresa);
  readonly direccionEmpresa: string | undefined = this.data?.orden?.direccion_empresa;
  readonly direccionEntregaPrincipal: string = this.buildDireccionEntregaPrincipal(this.data?.orden?.direccion_entrega);
  readonly coloniaEntrega: string = (this.data?.orden?.direccion_entrega?.colonia ?? '').trim();
  readonly ciudadEntrega: string = (this.data?.orden?.direccion_entrega?.ciudad ?? '').trim();

  readonly folioTicket: string = getOrderFolio(this.data?.orden, { withHash: true });

  getTipoLabel(tipo: string | undefined): string {
    const m: Record<string, string> = {
      mesa:      'Comer aquí',
      local:     'Comer aquí',
      llevar:    'Para llevar',
      domicilio: 'Domicilio',
    };
    return m[tipo ?? ''] ?? tipo ?? '—';
  }

  getMetodoLabel(metodo: string | undefined): string {
    const m: Record<string, string> = {
      efectivo:      'Efectivo',
      tarjeta:       'Tarjeta',
      transferencia: 'Transferencia',
      combinado:     'Pago combinado',
    };
    return m[metodo ?? ''] ?? metodo ?? '—';
  }

  private buildDireccionEntregaPrincipal(
    direccion: { calle?: string; numero?: string } | null | undefined
  ): string {
    if (!direccion) return '';

    const calleNumero = [direccion.calle, direccion.numero].filter(Boolean).join(' ').trim();
    return calleNumero;
  }

  /** Evita mostrar el placeholder del menú mientras carga la empresa. */
  private resolverNombreEmpresa(nombre?: string | null): string {
    const n = (nombre ?? '').trim();
    if (!n || /^cargando\.{0,3}$/i.test(n)) {
      return 'Mi Negocio';
    }
    return n;
  }

  esLlevarODomicilio(): boolean {
    const orden = this.data?.orden as { tipo_servicio?: string; shipping_type?: string } | undefined;
    const tipo = orden?.tipo_servicio ?? orden?.shipping_type ?? '';
    return ['recoger', 'domicilio', 'llevar'].includes(tipo);
  }

  imprimir(): void {
    this.imprimiendo.set(true);

    const ticketEl = this.ticketPreview?.nativeElement;
    if (!ticketEl) {
      this.imprimiendo.set(false);
      this.snackBar.open('No se pudo obtener la vista previa del ticket', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    if (this.esLlevarODomicilio()) {
      this.imprimirDosCopias(ticketEl.outerHTML);
      return;
    }

    this.abrirVentanaImpresion(this.buildPrintDocument(ticketEl.outerHTML));
  }

  private imprimirDosCopias(ticketHtml: string): void {
    const html = this.buildDosCopiasDocument(ticketHtml);
    this.abrirVentanaImpresion(html);
  }

  private abrirVentanaImpresion(html: string): void {
    const ventana = window.open('', '_blank', 'width=420,height=650');

    if (!ventana) {
      this.imprimiendo.set(false);
      this.snackBar.open('Permite ventanas emergentes para imprimir el ticket', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();

    ventana.onload = () => {
      ventana.print();
      ventana.onafterprint = () => {
        ventana.close();
        this.imprimiendo.set(false);
      };
    };
  }

  private buildDosCopiasDocument(ticketHtml: string): string {
    const title = this.nombreEmpresa;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket — ${title} — 2 copias</title>
  <style>
    ${this.getDosCopiasExtraStyles()}
    ${this.getTicketPrintStyles()}
  </style>
</head>
<body>
  <div class="copia">
    <div class="copia-label">Copia cliente</div>
    ${ticketHtml}
  </div>

  <hr class="separador-copias no-print" />

  <div class="copia">
    <div class="copia-label">Copia negocio</div>
    ${ticketHtml}
  </div>

  <div class="no-print acciones-impresion">
    <button type="button" onclick="window.print()">Imprimir 2 copias</button>
    <button type="button" onclick="window.close()">Cerrar</button>
  </div>
</body>
</html>`;
  }

  private getDosCopiasExtraStyles(): string {
    return `
      .copia {
        width: 80mm;
        padding: 4px 2px;
        page-break-after: always;
      }

      .copia:last-of-type {
        page-break-after: avoid;
      }

      .copia-label {
        text-align: center;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #6b7280;
        border-bottom: 1px dashed #ccc;
        padding-bottom: 6px;
        margin-bottom: 8px;
        font-family: Arial, Helvetica, sans-serif;
      }

      .separador-copias {
        border: none;
        border-top: 2px dashed #ccc;
        margin: 12px 0;
      }

      .no-print { display: block; }

      .acciones-impresion {
        text-align: center;
        margin-top: 20px;
        display: flex;
        gap: 10px;
        justify-content: center;
        font-family: Arial, Helvetica, sans-serif;
      }

      .acciones-impresion button {
        padding: 10px 20px;
        font-size: 14px;
        cursor: pointer;
        border-radius: 8px;
      }

      .acciones-impresion button:first-child {
        background: #1A1A11;
        color: white;
        border: none;
      }

      .acciones-impresion button:last-child {
        background: white;
        border: 1px solid #ccc;
      }

      @media print {
        .no-print { display: none !important; }

        .copia {
          page-break-after: always;
        }

        .copia:last-of-type {
          page-break-after: avoid;
        }
      }
    `;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  /** Mismo layout que la previsualización (.tk), con tipografía más grande para impresora térmica. */
  private buildPrintDocument(ticketHtml: string): string {
    const title = this.nombreEmpresa;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket — ${title}</title>
  <style>${this.getTicketPrintStyles()}</style>
</head>
<body>
  ${ticketHtml}
</body>
</html>`;
  }

  private getTicketPrintStyles(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }

      @page {
        size: 80mm auto;
        margin: 2mm 1.5mm;
      }

      body {
        width: 80mm;
        margin: 0 auto;
        padding: 4px 2px;
        background: #fff;
        color: #1A1A11;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .tk {
        width: 100%;
        background: #fff;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 17px;
        color: #1A1A11;
        box-shadow: none;
        border-radius: 0;
      }

      .tk-head {
        text-align: center;
        padding: 10px 6px 8px;
        border-bottom: 2px solid #1A1A11;
      }

      .tk-head__empresa {
        font-size: 28px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0 4px;
        color: #1A1A11;
        line-height: 1.15;
      }

      .tk-head__dato {
        font-size: 16px;
        color: #374151;
        margin: 2px 0 0;
        line-height: 1.35;
        font-weight: 600;
      }

      .tk-dash {
        border-top: 1px dashed #9ca3af;
        margin: 8px 6px;
      }

      .tk-meta {
        padding: 0 6px;
      }

      .tk-meta__folio {
        font-size: 42px;
        font-weight: 900;
        color: #1A1A11;
        line-height: 1.05;
        margin-bottom: 4px;
        letter-spacing: -0.02em;
      }

      .tk-meta__datos {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        font-size: 16px;
        color: #374151;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .tk-meta__sep {
        margin: 0 5px;
        opacity: 0.4;
      }

      .tk-meta__cliente {
        font-size: 16px;
        color: #1A1A11;
        font-weight: 700;
        line-height: 1.35;
      }

      .tk-meta__telefono {
        font-size: 16px;
        color: #1A1A11;
        font-weight: 800;
        margin-top: 2px;
        line-height: 1.35;
      }

      .tk-meta__domicilio {
        margin-top: 2px;
        font-size: 16px;
        color: #374151;
        font-weight: 600;
        line-height: 1.35;
      }

      .tk-meta__domicilio-ref {
        display: block;
        color: #6b7280;
      }

      .tk-meta__nota {
        padding: 0 6px;
        margin-top: 4px;
        font-size: 15px;
        color: #854f0b;
        font-weight: 600;
        font-style: italic;
        line-height: 1.35;
      }

      .tk-tabla {
        width: calc(100% - 12px);
        margin: 0 6px;
        border-collapse: collapse;
      }

      .tk-tabla thead tr {
        border-bottom: 2px solid #1A1A11;
      }

      .tk-tabla th {
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #6b7280;
        padding: 6px 0;
        text-transform: uppercase;
      }

      .tk-tabla__cant {
        width: 38px;
        text-align: center;
        font-size: 17px;
        font-weight: 800;
      }

      .tk-tabla__prod {
        text-align: left;
        padding-left: 4px !important;
      }

      .tk-tabla__precio {
        width: 88px;
        text-align: right;
        font-size: 17px;
        font-weight: 800;
        white-space: nowrap;
      }

      .tk-tabla__fila td {
        padding: 7px 0;
        vertical-align: top;
      }

      .tk-tabla__fila:not(:last-child) td {
        border-bottom: 1px solid #e5e7eb;
      }

      .tk-tabla__nombre {
        display: block;
        font-size: 18px;
        font-weight: 800;
        color: #1A1A11;
        line-height: 1.25;
      }

      .tk-tabla__unitario,
      .tk-tabla__comp {
        display: block;
        font-size: 15px;
        color: #4b5563;
        font-weight: 600;
        line-height: 1.3;
      }

      .tk-tabla__nota {
        display: block;
        font-size: 15px;
        color: #854f0b;
        font-style: italic;
        font-weight: 600;
        line-height: 1.3;
      }

      .tk-totales {
        padding: 0 6px;
      }

      .tk-totales__fila {
        display: flex;
        justify-content: space-between;
        font-size: 17px;
        font-weight: 600;
        color: #374151;
        padding: 5px 0;
      }

      .tk-totales__total {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-top: 2px solid #1A1A11;
        border-bottom: 2px solid #1A1A11;
        padding: 10px 0;
        margin: 6px 0;
      }

      .tk-totales__total span:first-child {
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 0.04em;
      }

      .tk-totales__total span:last-child {
        font-size: 30px;
        font-weight: 900;
        letter-spacing: -0.02em;
      }

      .tk-totales__metodo {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 600;
        padding: 6px 0;
        color: #374151;
      }

      .tk-totales__metodo span:last-child {
        font-size: 18px;
        font-weight: 800;
        color: #1C8C40;
      }

      .ticket-row {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 600;
        padding: 6px 0;
        color: #374151;
      }

      .ticket-row span:last-child {
        font-size: 18px;
        font-weight: 800;
        color: #1C8C40;
      }

      .ticket-row--combinado {
        font-size: 15px;
        padding-left: 12px;
        color: #555;
      }

      .ticket-row--combinado .combinado-metodo {
        font-style: italic;
      }

      .ticket-row--combinado span:last-child {
        font-size: 16px;
        font-weight: 700;
        color: #555;
      }

      .tk-totales__cambio {
        display: flex;
        justify-content: space-between;
        font-size: 17px;
        font-weight: 700;
        padding: 7px 8px;
        margin-top: 4px;
        border: 2px dashed #1C8C40;
        border-radius: 4px;
      }

      .tk-totales__cambio span:first-child {
        color: #1C8C40;
      }

      .tk-totales__cambio span:last-child {
        font-weight: 900;
        color: #1C8C40;
      }

      .tk-pie {
        text-align: center;
        padding: 10px 6px 12px;
        border-top: 2px solid #1A1A11;
        margin-top: 4px;
      }

      .tk-pie__gracias {
        font-size: 21px;
        font-weight: 900;
        color: #1A1A11;
        margin: 0 0 4px;
        letter-spacing: 0.02em;
      }

      .tk-pie__vuelva {
        font-size: 16px;
        font-weight: 600;
        color: #4b5563;
        margin: 0 0 10px;
      }

      .tk-pie__legal {
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
      }

      @media print {
        body {
          width: 80mm;
          padding: 0;
        }

        .tk {
          font-size: 17px;
        }
      }
    `;
  }
}
