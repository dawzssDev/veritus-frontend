import { Component, inject, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InventarioService } from '../../inventario.service';
import { Insumo } from '../../inventario.interface';

export interface AjusteInventarioData {
  insumo: Insumo;
}

@Component({
  selector: 'app-ajuste-inventario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">tune</mat-icon>
        <h2>Ajustar inventario</h2>
      </div>

      <div class="dialog-content">
        <div class="resumen-insumo">
          <span class="resumen-insumo__nombre">{{ data.insumo.nombre }}</span>
          <div class="resumen-insumo__stock">
            <span class="resumen-insumo__label">Stock en sistema</span>
            <strong>
              {{ data.insumo.stock_actual | number:'1.0-2' }}
              {{ data.insumo.unidad_medida }}
            </strong>
          </div>
        </div>

        <div class="aviso-ajuste">
          <mat-icon>info</mat-icon>
          <span>
            Ingresa el stock real contado físicamente.
            El sistema calculará la diferencia automáticamente.
          </span>
        </div>

        <label class="section-title">Stock real</label>
        <div class="monto-input-wrapper">
          <input
            type="number"
            class="monto-input"
            placeholder="0"
            [(ngModel)]="stockReal"
            inputmode="decimal"
            min="0"
            step="0.01" />
          <span class="monto-suffix">{{ data.insumo.unidad_medida }}</span>
        </div>

        @if (stockReal !== null && diferencia() !== null) {
          <div class="diferencia"
               [class.diferencia--positiva]="diferencia()! > 0"
               [class.diferencia--negativa]="diferencia()! < 0"
               [class.diferencia--cero]="diferencia() === 0">
            <mat-icon>
              {{ diferencia()! > 0 ? 'arrow_upward' : diferencia()! < 0 ? 'arrow_downward' : 'check' }}
            </mat-icon>
            <span>
              Diferencia:
              <strong>
                {{ diferencia()! > 0 ? '+' : '' }}{{ diferencia() | number:'1.0-2' }}
                {{ data.insumo.unidad_medida }}
              </strong>
            </span>
          </div>
        }

        <label class="section-title">Referencia (opcional)</label>
        <input
          type="text"
          class="text-input"
          placeholder="Motivo del ajuste..."
          [(ngModel)]="referencia" />

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()" [disabled]="guardando()">
          Cancelar
        </button>
        <button
          mat-flat-button
          class="btn-confirmar btn-ajuste"
          (click)="guardar()"
          [disabled]="!puedeGuardar() || guardando()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>tune</mat-icon>
          }
          Aplicar ajuste
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dialog-container {
      display: flex;
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      flex-direction: column;
      max-height: min(88vh, 520px);
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--color-border);

      .header-icon {
        width: 26px; height: 26px; font-size: 26px; color: #2563eb;
      }

      h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
    }

    .dialog-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .resumen-insumo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      background: #eff6ff;
      border-radius: 10px;
      border: 1px solid #bfdbfe;
    }

    .resumen-insumo__nombre {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .resumen-insumo__stock {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .resumen-insumo__label {
      font-size: 11px;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .aviso-ajuste {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: var(--color-bg-surface-2);
      border-radius: 8px;
      font-size: 12px;
      color: var(--color-text-muted);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #2563eb;
        flex-shrink: 0;
      }
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-top: 4px;
    }

    .monto-input-wrapper {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      overflow: hidden;
      background: var(--color-bg-surface);
    }

    .monto-suffix {
      padding: 10px 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-muted);
      background: var(--color-bg-surface-2);
      flex-shrink: 0;
    }

    .monto-input {
      flex: 1;
      border: none;
      outline: none;
      padding: 10px 12px;
      font-size: 16px;
      font-weight: 600;
      min-width: 0;
    }

    .diferencia {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;

      &--positiva {
        background: var(--color-brand-light);
        color: #16a34a;
        border: 1px solid var(--color-brand-border);
      }

      &--negativa {
        background: var(--color-error-bg);
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      &--cero {
        background: var(--color-bg-surface-2);
        color: var(--color-text-muted);
        border: 1px solid var(--color-border);
      }
    }

    .text-input {
      width: 100%;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }

    .form-error {
      color: #dc2626;
      font-size: 13px;
      margin: 0;
      padding: 8px 12px;
      background: var(--color-error-bg);
      border-radius: 6px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-shrink: 0;
      padding: 12px 16px;
      border-top: 1px solid var(--color-border);

      .btn-ajuste {
        background: #2563eb;
        color: white;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  `],
})
export class AjusteInventarioDialog {
  dialogRef = inject(MatDialogRef<AjusteInventarioDialog, Insumo>);
  private service = inject(InventarioService);

  guardando = signal(false);
  error = signal('');

  stockReal: number | null = null;
  referencia = '';

  stockActual = computed(() =>
    parseFloat(this.data.insumo.stock_actual)
  );

  diferencia = computed(() => {
    if (this.stockReal === null) return null;
    return this.stockReal - this.stockActual();
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: AjusteInventarioData) {}

  puedeGuardar(): boolean {
    return this.stockReal !== null && this.stockReal >= 0;
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set('');

    const payload: { stock_real: number; referencia?: string } = {
      stock_real: this.stockReal!,
    };
    if (this.referencia.trim()) {
      payload.referencia = this.referencia.trim();
    }

    this.service.registrarAjuste(this.data.insumo.id, payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.insumo);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al aplicar el ajuste.');
      },
    });
  }
}
