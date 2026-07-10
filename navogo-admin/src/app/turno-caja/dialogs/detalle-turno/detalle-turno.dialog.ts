import {
  Component, Inject, inject, signal, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA, MatDialogModule, MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule }
  from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { TurnoCajaService } from '../../turno-caja.service';
import { TurnoCaja } from '../../turno-caja.interface';

export interface DetalleTurnoData {
  turnoId: number;
}

@Component({
  selector: 'app-detalle-turno-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">receipt_long</mat-icon>
        <h2>Detalle de turno</h2>
        <button mat-icon-button class="btn-cerrar"
                (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">

        @if (cargando()) {
          <div class="cargando">
            <mat-spinner [diameter]="40"></mat-spinner>
          </div>
        }

        @if (!cargando() && turno(); as t) {

          <div class="seccion">
            <div class="turno-info-grid">
              <div class="info-item">
                <span class="info-label">Apertura</span>
                <span class="info-valor">
                  {{ t.hora_apertura | date:'d MMM y, h:mm a' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Cierre</span>
                <span class="info-valor">
                  {{ t.hora_cierre
                     ? (t.hora_cierre | date:'d MMM y, h:mm a')
                     : '—' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Abrió</span>
                <span class="info-valor">
                  {{ t.usuarioApertura?.nombreCompleto ?? '—' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Cerró</span>
                <span class="info-valor">
                  {{ t.usuarioCierre?.nombreCompleto ?? '—' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Duración</span>
                <span class="info-valor">
                  {{ formatDuracion(t.duracion_minutos ?? 0) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Fondo inicial</span>
                <span class="info-valor">
                  \${{ t.fondo_inicial | number:'1.2-2' }}
                </span>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="seccion">
            <h3 class="seccion-titulo">
              <mat-icon>point_of_sale</mat-icon>
              Ventas
            </h3>
            <div class="desglose-grid">
              <div class="desglose-item">
                <mat-icon class="di-icon di-icon--efectivo">payments</mat-icon>
                <div>
                  <span class="di-label">Efectivo</span>
                  <span class="di-valor">
                    \${{ t.total_efectivo | number:'1.2-2' }}
                  </span>
                </div>
              </div>
              <div class="desglose-item">
                <mat-icon class="di-icon di-icon--tarjeta">credit_card</mat-icon>
                <div>
                  <span class="di-label">Tarjeta</span>
                  <span class="di-valor">
                    \${{ t.total_tarjeta | number:'1.2-2' }}
                  </span>
                </div>
              </div>
              <div class="desglose-item">
                <mat-icon class="di-icon di-icon--transferencia">account_balance</mat-icon>
                <div>
                  <span class="di-label">Transferencia</span>
                  <span class="di-valor">
                    \${{ t.total_transferencia | number:'1.2-2' }}
                  </span>
                </div>
              </div>
              <div class="desglose-item">
                <mat-icon class="di-icon di-icon--propina">volunteer_activism</mat-icon>
                <div>
                  <span class="di-label">Propinas</span>
                  <span class="di-valor">
                    \${{ t.total_propinas | number:'1.2-2' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="total-ventas-row">
              <span>Total ventas del turno</span>
              <strong>\${{ t.total_ventas | number:'1.2-2' }}</strong>
            </div>

            <div class="ordenes-row">
              <span>
                <mat-icon>receipt_long</mat-icon>
                {{ t.total_ordenes }} órdenes finalizadas
              </span>
              @if ((t.ordenes_canceladas ?? 0) > 0) {
                <span class="canceladas">
                  <mat-icon>cancel</mat-icon>
                  {{ t.ordenes_canceladas }} canceladas
                </span>
              }
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="seccion">
            <h3 class="seccion-titulo">
              <mat-icon>calculate</mat-icon>
              Arqueo de efectivo
            </h3>

            <div class="arqueo-grid">
              <div class="arqueo-fila">
                <span>Fondo inicial</span>
                <span>\${{ t.fondo_inicial | number:'1.2-2' }}</span>
              </div>
              <div class="arqueo-fila arqueo-fila--positivo">
                <span>+ Ventas en efectivo</span>
                <span>\${{ t.total_efectivo | number:'1.2-2' }}</span>
              </div>
              <div class="arqueo-fila arqueo-fila--positivo">
                <span>+ Entradas de caja</span>
                <span>\${{ t.total_entradas_caja | number:'1.2-2' }}</span>
              </div>
              <div class="arqueo-fila arqueo-fila--negativo">
                <span>− Salidas de caja</span>
                <span>\${{ t.total_salidas_caja | number:'1.2-2' }}</span>
              </div>
              <div class="arqueo-fila arqueo-fila--esperado">
                <span>Efectivo esperado</span>
                <span>\${{ t.efectivo_esperado | number:'1.2-2' }}</span>
              </div>
              <div class="arqueo-fila arqueo-fila--contado">
                <span>Efectivo contado</span>
                <span>\${{ t.efectivo_contado | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="arqueo-resultado"
                 [class.arqueo-resultado--cuadrado]="getArqueo(t) === 0"
                 [class.arqueo-resultado--sobrante]="getArqueo(t) > 0"
                 [class.arqueo-resultado--faltante]="getArqueo(t) < 0">
              <mat-icon>
                {{ getArqueo(t) === 0 ? 'check_circle'
                   : getArqueo(t) > 0 ? 'trending_up'
                   : 'trending_down' }}
              </mat-icon>
              <div>
                <span class="ar-titulo">
                  {{ getArqueo(t) === 0 ? 'Caja cuadrada'
                     : getArqueo(t) > 0 ? 'Sobrante'
                     : 'Faltante' }}
                </span>
                <span class="ar-monto">
                  {{ getArqueo(t) > 0 ? '+' : '' }}
                  \${{ getArqueo(t) | number:'1.2-2' }}
                </span>
              </div>
            </div>
          </div>

          @if ((t.movimientos?.length ?? 0) > 0) {
            <mat-divider></mat-divider>
            <div class="seccion">
              <h3 class="seccion-titulo">
                <mat-icon>swap_horiz</mat-icon>
                Movimientos de caja
              </h3>
              <div class="movimientos-lista">
                @for (mov of t.movimientos; track mov.id) {
                  <div class="mov-item">
                    <mat-icon
                      [class.icono-entrada]="mov.tipo==='entrada'"
                      [class.icono-salida]="mov.tipo==='salida'">
                      {{ mov.tipo === 'entrada'
                         ? 'add_circle' : 'remove_circle' }}
                    </mat-icon>
                    <div class="mov-info">
                      <span class="mov-motivo">{{ mov.motivo }}</span>
                      @if (mov.nota) {
                        <span class="mov-nota">{{ mov.nota }}</span>
                      }
                      <span class="mov-meta">
                        {{ mov.created_at | date:'h:mm a' }}
                        · {{ mov.usuario?.nombreCompleto ?? '—' }}
                      </span>
                    </div>
                    <span class="mov-monto"
                          [class.monto-entrada]="mov.tipo==='entrada'"
                          [class.monto-salida]="mov.tipo==='salida'">
                      {{ mov.tipo === 'entrada' ? '+' : '−' }}
                      \${{ mov.monto | number:'1.2-2' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          @if (t.notas_apertura || t.notas_cierre) {
            <mat-divider></mat-divider>
            <div class="seccion seccion--notas">
              @if (t.notas_apertura) {
                <p class="nota-txt">
                  <mat-icon>note</mat-icon>
                  <strong>Apertura:</strong>
                  {{ t.notas_apertura }}
                </p>
              }
              @if (t.notas_cierre) {
                <p class="nota-txt">
                  <mat-icon>note</mat-icon>
                  <strong>Cierre:</strong>
                  {{ t.notas_cierre }}
                </p>
              }
            </div>
          }

        }

      </div>

      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: min(90vh, 720px);
      width: min(100%, 560px);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      flex-shrink: 0;

      .header-icon {
        width: 26px; height: 26px; font-size: 26px;
        color: #1C8C40;
      }

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        flex: 1;
        color: var(--color-text-primary);
      }

      .btn-cerrar {
        margin-left: auto;
        color: var(--color-text-muted);
      }
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .cargando {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .seccion { padding: 14px 16px; }

    .seccion-titulo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      margin: 0 0 12px;

      mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }
    }

    .turno-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      font-size: 11px;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .info-valor {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .desglose-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .desglose-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: var(--color-bg-surface-2);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-primary);
    }

    .di-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;

      &--efectivo      { color: #16a34a; }
      &--tarjeta       { color: #7c3aed; }
      &--transferencia { color: #2563eb; }
      &--propina       { color: #d97706; }
    }

    .di-label {
      display: block;
      font-size: 10px;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .di-valor {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .total-ventas-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      background: #0F4D2A;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .ordenes-row {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 12px;
      color: var(--color-text-muted);

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        vertical-align: middle;
        margin-right: 2px;
      }
    }

    .canceladas { color: #dc2626; }

    .arqueo-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
    }

    .arqueo-fila {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--color-text-secondary);
      padding: 4px 0;

      &--positivo { color: #16a34a; }
      &--negativo { color: #dc2626; }

      &--esperado {
        border-top: 1.5px solid var(--color-border);
        margin-top: 4px;
        padding-top: 8px;
        font-weight: 700;
        color: #1C8C40;
      }

      &--contado {
        font-weight: 700;
        color: var(--color-text-primary);
        font-size: 14px;
      }
    }

    .arqueo-resultado {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;

      &--cuadrado {
        background: var(--color-success-bg);
        color: #16a34a;
      }
      &--sobrante {
        background: rgba(37, 99, 235, 0.15);
        color: #60a5fa;
      }
      &--faltante {
        background: var(--color-error-bg);
        color: #dc2626;
      }
    }

    .ar-titulo {
      display: block;
      font-size: 12px;
      opacity: 0.8;
    }

    .ar-monto {
      display: block;
      font-size: 18px;
      font-weight: 800;
    }

    .movimientos-lista {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .mov-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      background: var(--color-bg-surface-2);
      border-radius: 8px;

      .icono-entrada { color: #16a34a; }
      .icono-salida  { color: #dc2626; }
    }

    .mov-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .mov-motivo {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .mov-nota {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .mov-meta {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .mov-monto {
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;

      &.monto-entrada { color: #16a34a; }
      &.monto-salida  { color: #dc2626; }
    }

    .seccion--notas { background: var(--color-warning-bg); }

    .nota-txt {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      color: var(--notes-text);
      margin: 0 0 4px;

      mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
        flex-shrink: 0;
        margin-top: 1px;
      }
    }

    .dialog-actions {
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      padding: 12px 16px;
      border-top: 1px solid var(--color-border);
      background: var(--color-bg-surface);
    }
  `],
})
export class DetalleTurnoDialog implements OnInit {
  dialogRef = inject(MatDialogRef<DetalleTurnoDialog>);
  private service = inject(TurnoCajaService);

  turno    = signal<TurnoCaja | null>(null);
  cargando = signal(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetalleTurnoData
  ) {}

  ngOnInit(): void {
    this.service.getDetalle(this.data.turnoId).subscribe({
      next: (res) => {
        this.turno.set(res.data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  getArqueo(t: TurnoCaja): number {
    return Math.round(Number(t.diferencia ?? 0) * 100) / 100;
  }

  formatDuracion(minutos: number): string {
    if (!minutos) return '—';
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }
}
