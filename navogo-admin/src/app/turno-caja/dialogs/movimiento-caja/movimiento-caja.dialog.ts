import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TurnoCajaService } from '../../turno-caja.service';
import { MovimientoCaja, TipoMovimientoCaja } from '../../turno-caja.interface';

@Component({
  selector: 'app-movimiento-caja-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">swap_horiz</mat-icon>
        <h2>Movimiento de caja</h2>
      </div>

      <div class="dialog-content">
        <div class="tipo-toggle">
          <button type="button"
                  class="tipo-btn tipo-btn--entrada"
                  [class.selected]="tipo() === 'entrada'"
                  (click)="tipo.set('entrada')">
            <mat-icon>add_circle</mat-icon>
            Entrada
          </button>
          <button type="button"
                  class="tipo-btn tipo-btn--salida"
                  [class.selected]="tipo() === 'salida'"
                  (click)="tipo.set('salida')">
            <mat-icon>remove_circle</mat-icon>
            Salida
          </button>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Monto</mat-label>
          <span matTextPrefix>$&nbsp;</span>
          <input matInput type="number"
                 [(ngModel)]="monto"
                 inputmode="decimal" min="0.01" step="0.01">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo</mat-label>
          <input matInput [(ngModel)]="motivo"
                 placeholder="Ej. Compra de hielo, fondo extra...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nota (opcional)</mat-label>
          <textarea matInput [(ngModel)]="nota" rows="2"></textarea>
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
                [disabled]="!puedeGuardar() || guardando()"
                (click)="guardar()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon>
          }
          Registrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container { display: flex; flex-direction: column; max-height: min(90vh, 560px); }
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
    .tipo-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 4px;
    }
    .tipo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 10px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      color: #9ca3af;
      font-family: inherit;
      transition: all 0.15s;
    }
    .tipo-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: color 0.15s;
    }
    .tipo-btn:hover {
      border-color: #d1d5db;
      color: #6b7280;
    }
    .tipo-btn.selected {
      border-color: #16a34a;
      background: #f0fdf4;
      color: #16a34a;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
    }
    .tipo-btn.selected mat-icon {
      color: #16a34a;
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
export class MovimientoCajaDialog {
  dialogRef = inject(MatDialogRef<MovimientoCajaDialog, MovimientoCaja>);
  private service = inject(TurnoCajaService);

  tipo = signal<TipoMovimientoCaja>('salida');
  monto: number | null = null;
  motivo = '';
  nota = '';
  guardando = signal(false);
  error = signal('');

  puedeGuardar(): boolean {
    return !!this.monto && this.monto > 0 && !!this.motivo.trim();
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set('');

    this.service.registrarMovimiento({
      tipo: this.tipo(),
      monto: this.monto!,
      motivo: this.motivo.trim(),
      nota: this.nota || undefined,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err?.error?.message ?? 'Error al registrar movimiento'
        );
      }
    });
  }
}
