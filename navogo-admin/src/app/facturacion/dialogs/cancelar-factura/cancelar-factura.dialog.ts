import {
  Component, Inject, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogModule, MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule }
  from '@angular/material/progress-spinner';

import { FacturacionService } from '../../facturacion.service';
import { Factura, MOTIVOS_CANCELACION }
  from '../../facturacion.interface';

@Component({
  selector: 'app-cancelar-factura-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon warn">cancel</mat-icon>
        <h2>Cancelar Factura</h2>
      </div>
      <div class="dialog-content">
        <p class="aviso">
          <mat-icon>warning</mat-icon>
          Esta acción es irreversible. La factura
          será cancelada ante el SAT.
        </p>
        <p class="factura-info">
          UUID: {{ data.factura.uuid ?? '—' }}<br>
          RFC: {{ data.factura.rfc_receptor }}<br>
          Total: \${{ data.factura.total | number:'1.2-2' }}
        </p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo de cancelación</mat-label>
          <mat-select [(ngModel)]="motivo">
            @for (m of motivos; track m.value) {
              <mat-option [value]="m.value">
                {{ m.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </div>
      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()"
                [disabled]="cancelando()">
          Volver
        </button>
        <button mat-flat-button class="btn-cancelar"
                [disabled]="!motivo || cancelando()"
                (click)="cancelar()">
          @if (cancelando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>cancel</mat-icon>
          }
          Cancelar CFDI
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container {
      display: flex; flex-direction: column;
      max-height: min(90vh, 480px); width: min(100%, 440px);
    }
    .dialog-header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      .header-icon { font-size: 26px; width: 26px; height: 26px; }
      .warn { color: #dc2626; }
      h2 { margin: 0; font-size: 18px; font-weight: 700; }
    }
    .dialog-content {
      flex: 1; overflow-y: auto; padding: 14px 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .full-width { width: 100%; }
    .aviso {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; background: #fef3c7;
      border-radius: 8px; color: #92400e; font-size: 13px;
      mat-icon { color: #d97706; font-size: 18px;
        width: 18px; height: 18px; }
    }
    .factura-info {
      font-size: 12px; color: #6b7280; line-height: 1.8;
      padding: 8px 12px; background: #f9fafb;
      border-radius: 8px;
    }
    .form-error {
      color: #dc2626; font-size: 13px; padding: 8px 12px;
      background: #fef2f2; border-radius: 6px;
    }
    .dialog-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 12px 16px; border-top: 1px solid rgba(0,0,0,0.08);
      .btn-cancelar {
        background: #dc2626; color: white;
        display: flex; align-items: center; gap: 6px;
      }
    }
  `],
})
export class CancelarFacturaDialog {
  dialogRef = inject(MatDialogRef<CancelarFacturaDialog, Factura>);
  private service = inject(FacturacionService);

  motivo = '02';
  cancelando = signal(false);
  error = signal('');
  readonly motivos = MOTIVOS_CANCELACION;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { factura: Factura }
  ) {}

  cancelar(): void {
    this.cancelando.set(true);
    this.error.set('');

    this.service.cancelarFactura(
      this.data.factura.id,
      { motivo: this.motivo }
    ).subscribe({
      next: (res) => {
        this.cancelando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.cancelando.set(false);
        this.error.set(
          err?.error?.message ?? 'Error al cancelar'
        );
      }
    });
  }
}
