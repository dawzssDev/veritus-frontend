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
import { TurnoCaja } from '../../turno-caja.interface';

@Component({
  selector: 'app-abrir-turno-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">point_of_sale</mat-icon>
        <h2>Abrir turno de caja</h2>
      </div>

      <div class="dialog-content">
        <p class="hint">
          Cuenta el efectivo con el que inicias
          el turno antes de registrar ventas.
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fondo inicial</mat-label>
          <span matTextPrefix>$&nbsp;</span>
          <input matInput type="number"
                 [(ngModel)]="fondoInicial"
                 inputmode="decimal" min="0" step="0.01"
                 placeholder="0.00" autofocus>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas (opcional)</mat-label>
          <textarea matInput [(ngModel)]="notas" rows="2"
                    placeholder="Ej. Turno matutino - cajero Juan">
          </textarea>
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
                [disabled]="fondoInicial === null || guardando()"
                (click)="abrir()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>lock_open</mat-icon>
          }
          Abrir turno
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container { display: flex; flex-direction: column; max-height: min(90vh, 500px); }
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
    .hint { font-size: 13px; color: #6b7280; margin: 0 0 4px; }
    .full-width { width: 100%; }
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
export class AbrirTurnoDialog {
  dialogRef = inject(MatDialogRef<AbrirTurnoDialog, TurnoCaja>);
  private service = inject(TurnoCajaService);

  fondoInicial: number | null = null;
  notas = '';
  guardando = signal(false);
  error = signal('');

  abrir(): void {
    if (this.fondoInicial === null) return;

    this.guardando.set(true);
    this.error.set('');

    this.service.abrir({
      fondo_inicial: this.fondoInicial,
      notas_apertura: this.notas || undefined,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err?.error?.message ?? 'Error al abrir el turno'
        );
      }
    });
  }
}
