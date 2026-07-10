import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';

import { TurnoCajaService } from '../turno-caja.service';
import { TurnoEstadoService } from '../turno-estado.service';
import { TurnoCaja, MovimientoCaja } from '../turno-caja.interface';
import { AbrirTurnoDialog } from '../dialogs/abrir-turno/abrir-turno.dialog';
import { MovimientoCajaDialog } from '../dialogs/movimiento-caja/movimiento-caja.dialog';
import { CerrarTurnoDialog } from '../dialogs/cerrar-turno/cerrar-turno.dialog';
import { DetalleTurnoDialog } from '../dialogs/detalle-turno/detalle-turno.dialog';

@Component({
  selector: 'app-turno-caja-page',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatDialogModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule,
    MatPaginatorModule, MatTableModule,
  ],
  templateUrl: './turno-caja-page.component.html',
  styleUrl: './turno-caja-page.component.scss',
})
export class TurnoCajaPageComponent implements OnInit, OnDestroy {
  private service      = inject(TurnoCajaService);
  private turnoEstado   = inject(TurnoEstadoService);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);

  turno     = signal<TurnoCaja | null>(null);
  cargando  = signal(true);

  historial    = signal<TurnoCaja[]>([]);
  cargandoHist = signal(false);
  totalHist    = signal(0);
  paginaHist   = signal(1);
  readonly perPage = 10;

  private intervalId: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    this.cargar();
    this.cargarHistorial();
    this.intervalId = setInterval(() => this.cargar(true), 20000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  cargar(silencioso = false): void {
    if (!silencioso) this.cargando.set(true);
    this.service.getActual().subscribe({
      next: (res) => {
        this.turno.set(res.data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirTurno(): void {
    const ref = this.dialog.open(AbrirTurnoDialog, {
      width: '420px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((turno) => {
      if (turno) {
        this.turno.set(turno);
        this.turnoEstado.refrescar();
        this.mostrarToast('Turno abierto correctamente');
        this.cargar();
        this.cargarHistorial();
      }
    });
  }

  abrirMovimiento(): void {
    const ref = this.dialog.open(MovimientoCajaDialog, {
      width: '420px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((mov: MovimientoCaja) => {
      if (mov) {
        this.mostrarToast('Movimiento registrado');
        this.cargar();
      }
    });
  }

  abrirCerrarTurno(): void {
    const t = this.turno();
    if (!t) return;

    const ref = this.dialog.open(CerrarTurnoDialog, {
      width: '460px',
      maxWidth: '95vw',
      data: { turno: t },
    });
    ref.afterClosed().subscribe((turnoCerrado) => {
      if (turnoCerrado) {
        this.turno.set(null);
        this.turnoEstado.refrescar();
        this.mostrarToast('Turno cerrado correctamente');
        this.cargar();
        this.cargarHistorial();
      }
    });
  }

  cargarHistorial(): void {
    this.cargandoHist.set(true);
    this.service.getHistorial({
      page: this.paginaHist(),
      per_page: this.perPage,
    }).subscribe({
      next: (res) => {
        this.historial.set(res.data ?? []);
        this.totalHist.set(res.total ?? 0);
        this.cargandoHist.set(false);
      },
      error: () => this.cargandoHist.set(false),
    });
  }

  onPageHist(event: PageEvent): void {
    this.paginaHist.set(event.pageIndex + 1);
    this.cargarHistorial();
  }

  verDetalle(turno: TurnoCaja): void {
    this.dialog.open(DetalleTurnoDialog, {
      width:    '580px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { turnoId: turno.id },
    });
  }

  getColorDiferencia(diferencia: string | null): string {
    if (!diferencia) return '';
    const d = parseFloat(diferencia);
    if (d > 0) return 'texto-sobrante';
    if (d < 0) return 'texto-faltante';
    return 'texto-cuadrado';
  }

  formatDuracion(minutos: number): string {
    if (!minutos) return '—';
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  getIconoMovimiento(tipo: string): string {
    return tipo === 'entrada' ? 'add_circle' : 'remove_circle';
  }

  imprimirTicketTurno(turno: TurnoCaja): void {
    this.service.getTicketTurno(turno.id).subscribe({
      next: (res) => this.abrirTicketTurnoHTML(res.data),
      error: () => this.mostrarToast(
        'Error al generar el ticket', true
      ),
    });
  }

  imprimirTicketDia(): void {
    const fecha = new Date()
      .toISOString().split('T')[0];
    this.service.getTicketDia(fecha).subscribe({
      next: (res) => this.abrirTicketDiaHTML(res.data),
      error: () => this.mostrarToast(
        'Error al generar el ticket del día', true
      ),
    });
  }

  private abrirVentana(html: string): void {
    const ventana = window.open(
      '', '_blank', 'width=420,height=700'
    );
    if (!ventana) {
      this.mostrarToast(
        'Permite ventanas emergentes para imprimir',
        true
      );
      return;
    }
    ventana.document.write(html);
    ventana.document.close();
  }

  private estilosTicket(): string {
    return `
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #1A1A11;
          width: 80mm;
          margin: 0 auto;
          padding: 8px 6px;
          background: white;
        }
        .t-header {
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 2px solid #1A1A11;
          margin-bottom: 8px;
        }
        .t-empresa {
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 2px;
        }
        .t-direccion {
          font-size: 10px;
          color: #555;
          margin-bottom: 4px;
        }
        .t-titulo {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 4px 0;
        }
        .t-subtitulo {
          font-size: 10px;
          color: #555;
        }
        .t-sep {
          border: none;
          border-top: 1px dashed #1A1A11;
          margin: 6px 0;
        }
        .t-sep-solid {
          border: none;
          border-top: 1px solid #1A1A11;
          margin: 6px 0;
        }
        .t-fila {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 11px;
        }
        .t-fila--bold {
          font-weight: 700;
          font-size: 12px;
        }
        .t-fila--total {
          font-weight: 900;
          font-size: 14px;
          padding: 4px 0;
        }
        .t-seccion {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #555;
          margin: 6px 0 3px;
        }
        .t-arqueo {
          text-align: center;
          padding: 6px;
          border: 1px solid #1A1A11;
          border-radius: 4px;
          margin: 6px 0;
          font-weight: 700;
          font-size: 13px;
        }
        .t-arqueo--ok      { border-color: #16a34a; color: #16a34a; }
        .t-arqueo--sobre   { border-color: #2563eb; color: #2563eb; }
        .t-arqueo--faltante{ border-color: #dc2626; color: #dc2626; }
        .t-mov {
          display: flex;
          justify-content: space-between;
          padding: 1px 0;
          font-size: 10px;
        }
        .t-mov-entrada { color: #16a34a; }
        .t-mov-salida  { color: #dc2626; }
        .t-turno-header {
          background: #1A1A11;
          color: white;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: 700;
          margin: 6px 0 3px;
        }
        .t-footer {
          text-align: center;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 2px dashed #1A1A11;
          font-size: 10px;
          color: #777;
        }
        @media print {
          body { width: 80mm; padding: 0; }
        }
      </style>
    `;
  }

  private formatMoney(n: any): string {
    return '$' + Number(n || 0)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  private formatHora(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  private formatFechaCompleta(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      weekday: 'long', day: '2-digit',
      month: 'long', year: 'numeric'
    });
  }

  private getArqueoClass(dif: any): string {
    const d = Number(dif ?? 0);
    if (d > 0) return 't-arqueo--sobre';
    if (d < 0) return 't-arqueo--faltante';
    return 't-arqueo--ok';
  }

  private getArqueoLabel(dif: any): string {
    const d = Number(dif ?? 0);
    if (d > 0) return `SOBRANTE: ${this.formatMoney(d)}`;
    if (d < 0) return `FALTANTE: ${this.formatMoney(Math.abs(d))}`;
    return 'CAJA CUADRADA ✓';
  }

  private htmlSeccionTurno(t: any): string {
    const movs = (t.movimientos ?? []);
    const movHTML = movs.length > 0
      ? movs.map((m: any) => `
          <div class="t-mov">
            <span class="${m.tipo === 'entrada'
              ? 't-mov-entrada' : 't-mov-salida'}">
              ${m.tipo === 'entrada' ? '▲' : '▼'}
              ${m.motivo}
            </span>
            <span class="${m.tipo === 'entrada'
              ? 't-mov-entrada' : 't-mov-salida'}">
              ${m.tipo === 'entrada' ? '+' : '−'}
              ${this.formatMoney(m.monto)}
            </span>
          </div>
        `).join('')
      : '<div class="t-mov" style="color:#999">Sin movimientos</div>';

    return `
      <div class="t-fila">
        <span>Apertura</span>
        <span>${this.formatHora(t.hora_apertura)}</span>
      </div>
      <div class="t-fila">
        <span>Cierre</span>
        <span>${t.hora_cierre
          ? this.formatHora(t.hora_cierre) : 'Abierto'}</span>
      </div>
      <div class="t-fila">
        <span>Duración</span>
        <span>${this.formatDuracion(t.duracion_minutos ?? 0)}</span>
      </div>
      <div class="t-fila">
        <span>Cajero</span>
        <span>${t.usuarioApertura?.nombreCompleto ?? '—'}</span>
      </div>
      <hr class="t-sep">

      <div class="t-seccion">Ventas del turno</div>
      <div class="t-fila">
        <span>Efectivo</span>
        <span>${this.formatMoney(t.total_efectivo)}</span>
      </div>
      <div class="t-fila">
        <span>Tarjeta</span>
        <span>${this.formatMoney(t.total_tarjeta)}</span>
      </div>
      <div class="t-fila">
        <span>Transferencia</span>
        <span>${this.formatMoney(t.total_transferencia)}</span>
      </div>
      <div class="t-fila">
        <span>Propinas</span>
        <span>${this.formatMoney(t.total_propinas)}</span>
      </div>
      <div class="t-fila t-fila--bold">
        <span>Total ventas</span>
        <span>${this.formatMoney(t.total_ventas)}</span>
      </div>
      <div class="t-fila" style="font-size:10px;color:#555">
        <span>${t.total_ordenes} órdenes · ${t.ordenes_canceladas} canceladas</span>
      </div>
      <hr class="t-sep">

      <div class="t-seccion">Arqueo de efectivo</div>
      <div class="t-fila">
        <span>Fondo inicial</span>
        <span>${this.formatMoney(t.fondo_inicial)}</span>
      </div>
      <div class="t-fila">
        <span>+ Ventas efectivo</span>
        <span>${this.formatMoney(t.total_efectivo)}</span>
      </div>
      <div class="t-fila">
        <span>+ Entradas caja</span>
        <span>${this.formatMoney(t.total_entradas_caja)}</span>
      </div>
      <div class="t-fila">
        <span>− Salidas caja</span>
        <span>${this.formatMoney(t.total_salidas_caja)}</span>
      </div>
      <div class="t-fila t-fila--bold">
        <span>Efectivo esperado</span>
        <span>${this.formatMoney(t.efectivo_esperado)}</span>
      </div>
      <div class="t-fila t-fila--bold">
        <span>Efectivo contado</span>
        <span>${this.formatMoney(t.efectivo_contado)}</span>
      </div>
      <div class="t-arqueo ${this.getArqueoClass(t.diferencia)}">
        ${this.getArqueoLabel(t.diferencia)}
      </div>

      <div class="t-seccion">Movimientos de caja</div>
      ${movHTML}

      ${t.notas_cierre ? `
        <hr class="t-sep">
        <div class="t-seccion">Notas</div>
        <div style="font-size:10px">${t.notas_cierre}</div>
      ` : ''}
    `;
  }

  private abrirTicketTurnoHTML(data: any): void {
    const t = data.turno;
    const empresa = data.empresa;
    const ahora = new Date().toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Corte de Turno</title>
        ${this.estilosTicket()}
      </head>
      <body>
        <div class="t-header">
          ${empresa.nombre
            ? `<div class="t-empresa">${empresa.nombre}</div>`
            : ''}
          ${empresa.direccion
            ? `<div class="t-direccion">${empresa.direccion}</div>`
            : ''}
          <div class="t-titulo">Corte de Caja</div>
          <div class="t-subtitulo">
            ${this.formatFechaCompleta(t.hora_apertura)}
          </div>
          <div class="t-subtitulo">Impreso: ${ahora}</div>
        </div>

        ${this.htmlSeccionTurno(t)}

        <div class="t-footer">
          Este documento no es comprobante fiscal
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    this.abrirVentana(html);
  }

  private abrirTicketDiaHTML(data: any): void {
    const empresa  = data.empresa;
    const fecha    = data.fecha;
    const turnos   = data.turnos ?? [];
    const totales  = data.totales;
    const ahora = new Date().toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const turnosHTML = turnos.map((t: any, i: number) => `
      <div class="t-turno-header">
        TURNO ${i + 1}
        — ${this.formatHora(t.hora_apertura)}
        ${t.hora_cierre
          ? '→ ' + this.formatHora(t.hora_cierre)
          : '(abierto)'}
      </div>
      ${this.htmlSeccionTurno(t)}
      <hr class="t-sep">
    `).join('');

    const diferenciaTotal = Number(totales.diferencia_total ?? 0);

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Corte del Día</title>
        ${this.estilosTicket()}
      </head>
      <body>
        <div class="t-header">
          ${empresa.nombre
            ? `<div class="t-empresa">${empresa.nombre}</div>`
            : ''}
          ${empresa.direccion
            ? `<div class="t-direccion">${empresa.direccion}</div>`
            : ''}
          <div class="t-titulo">Corte del Día</div>
          <div class="t-subtitulo">
            ${this.formatFechaCompleta(fecha + 'T12:00:00')}
          </div>
          <div class="t-subtitulo">Impreso: ${ahora}</div>
        </div>

        ${turnosHTML}

        <div class="t-turno-header">RESUMEN DEL DÍA</div>

        <div class="t-seccion">Ventas totales</div>
        <div class="t-fila">
          <span>Efectivo</span>
          <span>${this.formatMoney(totales.total_efectivo)}</span>
        </div>
        <div class="t-fila">
          <span>Tarjeta</span>
          <span>${this.formatMoney(totales.total_tarjeta)}</span>
        </div>
        <div class="t-fila">
          <span>Transferencia</span>
          <span>${this.formatMoney(totales.total_transferencia)}</span>
        </div>
        <div class="t-fila">
          <span>Propinas</span>
          <span>${this.formatMoney(totales.total_propinas)}</span>
        </div>
        <div class="t-fila t-fila--total">
          <span>TOTAL DEL DÍA</span>
          <span>${this.formatMoney(totales.total_ventas)}</span>
        </div>
        <div class="t-fila" style="font-size:10px;color:#555">
          <span>
            ${totales.total_ordenes} órdenes ·
            ${totales.ordenes_canceladas} canceladas
          </span>
        </div>
        <hr class="t-sep-solid">

        <div class="t-seccion">Movimientos de caja del día</div>
        <div class="t-fila">
          <span>Total entradas</span>
          <span style="color:#16a34a">
            +${this.formatMoney(totales.total_entradas_caja)}
          </span>
        </div>
        <div class="t-fila">
          <span>Total salidas</span>
          <span style="color:#dc2626">
            −${this.formatMoney(totales.total_salidas_caja)}
          </span>
        </div>
        <hr class="t-sep">

        <div class="t-seccion">Arqueo del día</div>
        <div class="t-arqueo ${this.getArqueoClass(diferenciaTotal)}">
          ${this.getArqueoLabel(diferenciaTotal)}
        </div>

        <div class="t-footer">
          Este documento no es comprobante fiscal
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    this.abrirVentana(html);
  }

  private mostrarToast(mensaje: string, esError = false): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: esError ? ['snack-error'] : [],
    });
  }
}
