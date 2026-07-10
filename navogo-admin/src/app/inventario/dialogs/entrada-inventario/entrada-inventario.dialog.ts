import { Component, inject, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InventarioService } from '../../inventario.service';
import { Insumo } from '../../inventario.interface';

export interface EntradaInventarioData {
  insumo: Insumo;
}

@Component({
  selector: 'app-entrada-inventario-dialog',
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
        <mat-icon class="header-icon">add_circle</mat-icon>
        <h2>Registrar entrada</h2>
      </div>

      <div class="dialog-content">
        <div class="resumen-insumo">
          <span class="resumen-insumo__nombre">{{ data.insumo.nombre }}</span>
          <div class="resumen-insumo__stock">
            <span class="resumen-insumo__label">Stock actual</span>
            <strong>
              {{ data.insumo.stock_actual | number:'1.0-2' }}
              {{ data.insumo.unidad_medida }}
            </strong>
          </div>
        </div>

        <label class="section-title">Cantidad</label>
        <div class="monto-input-wrapper">
          <input
            type="number"
            class="monto-input"
            placeholder="0"
            [(ngModel)]="cantidad"
            inputmode="decimal"
            min="0.01"
            step="0.01" />
          <span class="monto-suffix">{{ data.insumo.unidad_medida }}</span>
        </div>

        <label class="section-title">Costo unitario</label>
        <div class="monto-input-wrapper">
          <span class="monto-prefix">$</span>
          <input
            type="number"
            class="monto-input"
            placeholder="0.00"
            [(ngModel)]="costoUnitario"
            inputmode="decimal"
            min="0"
            step="0.01" />
        </div>

        @if (costoTotal() > 0) {
          <div class="costo-total">
            <span>Costo total</span>
            <strong>\${{ costoTotal() | number:'1.2-2' }}</strong>
          </div>
        }

        <label class="section-title">Referencia (opcional)</label>
        <input
          type="text"
          class="text-input"
          placeholder="Factura, nota de compra..."
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
          class="btn-confirmar btn-entrada"
          (click)="guardar()"
          [disabled]="!puedeGuardar() || guardando()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>add_circle</mat-icon>
          }
          Registrar entrada
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: min(88vh, 520px);
      overflow: hidden;
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-surface);

      .header-icon {
        width: 26px; height: 26px; font-size: 26px; color: #16a34a;
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
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }

    .resumen-insumo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      background: var(--color-brand-light);
      border-radius: 10px;
      border: 1px solid var(--color-brand-border);
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

    .monto-prefix, .monto-suffix {
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
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }

    .text-input {
      width: 100%;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }

    .costo-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: var(--color-bg-surface-2);
      border-radius: 8px;
      font-size: 14px;
      color: var(--color-text-primary);

      strong { color: #1C8C40; font-size: 16px; }
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
      background: var(--color-bg-surface);

      .btn-entrada {
        background: #16a34a;
        color: white;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  `],
})
export class EntradaInventarioDialog {
  dialogRef = inject(MatDialogRef<EntradaInventarioDialog, Insumo>);
  private service = inject(InventarioService);

  guardando = signal(false);
  error = signal('');

  cantidad: number | null = null;
  costoUnitario: number | null = null;
  referencia = '';

  costoTotal = computed(() => {
    const c = this.cantidad ?? 0;
    const u = this.costoUnitario ?? 0;
    return c > 0 && u >= 0 ? c * u : 0;
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: EntradaInventarioData) {}

  puedeGuardar(): boolean {
    return (this.cantidad ?? 0) > 0 && (this.costoUnitario ?? 0) >= 0;
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set('');

    const payload: { cantidad: number; costo_unitario: number; referencia?: string } = {
      cantidad: this.cantidad!,
      costo_unitario: this.costoUnitario!,
    };
    if (this.referencia.trim()) {
      payload.referencia = this.referencia.trim();
    }

    this.service.registrarEntrada(this.data.insumo.id, payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.insumo);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al registrar la entrada.');
      },
    });
  }
}
