import { Component, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TurnoCajaService } from '../../turno-caja.service';
import { TurnoCaja } from '../../turno-caja.interface';

export interface CerrarTurnoData {
  turno: TurnoCaja;
}

@Component({
  selector: 'app-cerrar-turno-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">lock</mat-icon>
        <h2>Cerrar turno de caja</h2>
      </div>

      <div class="dialog-content">

        <div class="resumen-esperado">
          <span class="resumen-label">Efectivo esperado en caja</span>
          <strong class="resumen-monto">
            \${{ efectivoEsperado() | number:'1.2-2' }}
          </strong>
          <span class="resumen-desglose">
            Fondo \${{ fondo() | number:'1.2-2' }}
            + Ventas efectivo \${{ ventasEfectivo() | number:'1.2-2' }}
            + Entradas \${{ entradas() | number:'1.2-2' }}
            − Salidas \${{ salidas() | number:'1.2-2' }}
          </span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Efectivo contado físicamente</mat-label>
          <span matTextPrefix>$&nbsp;</span>
          <input matInput type="number"
                 [(ngModel)]="efectivoContado"
                 (ngModelChange)="onContadoChange()"
                 inputmode="decimal" min="0" step="0.01"
                 autofocus>
        </mat-form-field>

        @if (efectivoContado !== null) {
          <div class="diferencia-display"
               [class.diferencia-display--ok]="diferencia() === 0"
               [class.diferencia-display--sobrante]="diferencia() > 0"
               [class.diferencia-display--faltante]="diferencia() < 0">
            <mat-icon>
              {{ diferencia() === 0 ? 'check_circle'
                 : diferencia() > 0 ? 'trending_up' : 'trending_down' }}
            </mat-icon>
            <span>
              {{ diferencia() === 0 ? 'Caja cuadrada'
                 : diferencia() > 0 ? 'Sobrante' : 'Faltante' }}:
              {{ diferencia() > 0 ? '+' : '' }}\${{ diferencia() | number:'1.2-2' }}
            </span>
          </div>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas de cierre (opcional)</mat-label>
          <textarea matInput [(ngModel)]="notas" rows="2"></textarea>
        </mat-form-field>

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()"
                [disabled]="guardando()">
          Cancelar
        </button>
        <button mat-flat-button class="btn-confirmar"
                [disabled]="efectivoContado === null || guardando()"
                (click)="cerrar()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>lock</mat-icon>
          }
          Cerrar turno
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container { display: flex; flex-direction: column; max-height: min(90vh, 640px); }
    .dialog-header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px 12px; border-bottom: 1px solid rgba(0,0,0,0.08);
      .header-icon { width: 26px; height: 26px; font-size: 26px; color: #0F4D2A; }
      h2 { margin: 0; font-size: 18px; font-weight: 700; }
    }
    .dialog-content {
      flex: 1; overflow-y: auto; padding: 14px 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .full-width { width: 100%; }
    .resumen-esperado {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px 14px; background: #f5f7fa; border-radius: 10px;
    }
    .resumen-label { font-size: 12px; color: #6b7280; font-weight: 600; }
    .resumen-monto { font-size: 24px; font-weight: 800; color: #0F4D2A; }
    .resumen-desglose { font-size: 11px; color: #9ca3af; }
    .diferencia-display {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 700;
      &--ok { background: #dcfce7; color: #166534; }
      &--sobrante { background: #dbeafe; color: #1d4ed8; }
      &--faltante { background: #fef2f2; color: #dc2626; }
    }
    .form-error {
      color: #dc2626; font-size: 13px; margin: 0;
      padding: 8px 12px; background: #fef2f2; border-radius: 6px;
    }
    .dialog-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 12px 16px; border-top: 1px solid rgba(0,0,0,0.08);
      .btn-confirmar {
        background: #0F4D2A; color: white;
        display: flex; align-items: center; gap: 6px;
      }
    }
  `],
})
export class CerrarTurnoDialog {
  dialogRef = inject(MatDialogRef<CerrarTurnoDialog, TurnoCaja>);
  private service = inject(TurnoCajaService);

  guardando = signal(false);
  error = signal('');
  efectivoContado: number | null = null;
  notas = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: CerrarTurnoData) {}

  fondo = computed(() => Number(this.data.turno.fondo_inicial));
  ventasEfectivo = computed(() =>
    this.data.turno.metricas_en_vivo?.total_efectivo
    ?? Number(this.data.turno.total_efectivo)
  );
  entradas = computed(() =>
    Number(this.data.turno.total_entradas_caja)
  );
  salidas = computed(() =>
    Number(this.data.turno.total_salidas_caja)
  );

  efectivoEsperado = computed(() =>
    Number(this.data.turno.efectivo_esperado)
    || (this.fondo() + this.ventasEfectivo() + this.entradas() - this.salidas())
  );

  diferenciaValor = signal(0);
  diferencia = computed(() => this.diferenciaValor());

  onContadoChange(): void {
    const contado = this.efectivoContado ?? 0;
    this.diferenciaValor.set(
      Math.round((contado - this.efectivoEsperado()) * 100) / 100
    );
  }

  cerrar(): void {
    if (this.efectivoContado === null) return;

    this.guardando.set(true);
    this.error.set('');

    this.service.cerrar({
      efectivo_contado: this.efectivoContado,
      notas_cierre: this.notas || undefined,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err?.error?.message ?? 'Error al cerrar el turno'
        );
      }
    });
  }
}
