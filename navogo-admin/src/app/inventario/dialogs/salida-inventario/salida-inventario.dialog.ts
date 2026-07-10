import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InventarioService } from '../../inventario.service';
import { Insumo, MotivoMovimiento } from '../../inventario.interface';

export interface SalidaInventarioData {
  insumo: Insumo;
}

@Component({
  selector: 'app-salida-inventario-dialog',
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
        <mat-icon class="header-icon">remove_circle</mat-icon>
        <h2>Registrar salida</h2>
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

        <label class="section-title">Motivo</label>
        <div class="motivos-grid">
          @for (m of motivos; track m.value) {
            <button
              type="button"
              class="motivo-btn"
              [class.selected]="motivo === m.value"
              (click)="motivo = m.value">
              <mat-icon>{{ m.icon }}</mat-icon>
              <span>{{ m.label }}</span>
            </button>
          }
        </div>

        <label class="section-title">Referencia (opcional)</label>
        <input
          type="text"
          class="text-input"
          placeholder="Notas adicionales..."
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
          class="btn-confirmar btn-salida"
          (click)="guardar()"
          [disabled]="!puedeGuardar() || guardando()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>remove_circle</mat-icon>
          }
          Registrar salida
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
      max-height: min(88vh, 560px);
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
        width: 26px; height: 26px; font-size: 26px; color: #dc2626;
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
      background: var(--color-error-bg);
      border-radius: 10px;
      border: 1px solid #fecaca;
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

    .motivos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .motivo-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 6px;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-bg-surface);
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      font-family: inherit;
      transition: all 0.15s;

      mat-icon { font-size: 20px; width: 20px; height: 20px; }

      &.selected {
        border-color: #dc2626;
        background: var(--color-error-bg);
        color: #dc2626;
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

      .btn-salida {
        background: #dc2626;
        color: white;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  `],
})
export class SalidaInventarioDialog {
  dialogRef = inject(MatDialogRef<SalidaInventarioDialog, Insumo>);
  private service = inject(InventarioService);

  guardando = signal(false);
  error = signal('');

  cantidad: number | null = null;
  motivo: MotivoMovimiento = 'consumo_manual';
  referencia = '';

  motivos: { value: MotivoMovimiento; label: string; icon: string }[] = [
    { value: 'merma',           label: 'Merma',    icon: 'delete_sweep' },
    { value: 'consumo_manual',  label: 'Consumo',  icon: 'restaurant' },
    { value: 'devolucion',      label: 'Devolución', icon: 'undo' },
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: SalidaInventarioData) {}

  puedeGuardar(): boolean {
    return (this.cantidad ?? 0) > 0 && !!this.motivo;
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set('');

    const payload: { cantidad: number; motivo: string; referencia?: string } = {
      cantidad: this.cantidad!,
      motivo: this.motivo,
    };
    if (this.referencia.trim()) {
      payload.referencia = this.referencia.trim();
    }

    this.service.registrarSalida(this.data.insumo.id, payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.insumo);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al registrar la salida.');
      },
    });
  }
}
