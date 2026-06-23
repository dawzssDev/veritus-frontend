import { Component, inject, signal, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }   from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { CorteCajaService } from '../corte-caja.service';
import { TipoCorte, MetricasCorte, CorteCaja } from '../corte-caja.interface';

@Component({
  selector:   'app-corte-caja-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DecimalPipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDividerModule,
  ],
  templateUrl: './corte-caja-form.dialog.html',
  styles: [`
    .dialog-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 8px 8px 24px;

      &__info {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 700;
      }
    }

    .dialog-body {
      padding: 16px 24px !important;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .resumen-preview {
      background: #F8F9F8;
      border-radius: 10px;
      padding: 14px;

      &__titulo {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mat-sys-on-surface-variant);
        margin: 0 0 12px;
      }
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;

      @media (max-width: 400px) { grid-template-columns: repeat(2,1fr); }
    }

    .resumen-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .resumen-label {
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .resumen-valor {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-primary);

      &--grande { font-size: 18px; color: #1C8C40; }
    }

    .form-subtitulo {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }

    .arqueo-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .diferencia-card {
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 10px;
      padding: 12px 16px;
      border: 1px solid;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
      }

      &--sobrante {
        background: rgba(28,140,64,0.06);
        border-color: rgba(28,140,64,0.2);
        color: #1C8C40;
      }

      &--faltante {
        background: rgba(220,38,38,0.06);
        border-color: rgba(220,38,38,0.2);
        color: #dc2626;
      }

      &--cuadrado {
        background: rgba(24,95,165,0.06);
        border-color: rgba(24,95,165,0.2);
        color: #185FA5;
      }
    }

    .diferencia-label {
      font-size: 12px;
      font-weight: 600;
      margin: 0 0 2px;
    }

    .diferencia-monto {
      font-size: 20px;
      font-weight: 900;
      margin: 0;
    }

    .form-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(220,38,38,0.06);
      border: 1px solid rgba(220,38,38,0.2);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #dc2626;
    }

    .spinner-btn {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
      vertical-align: middle;
      margin-right: 4px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CorteCajaFormDialogComponent {
  private fb      = inject(FormBuilder);
  private service = inject(CorteCajaService);
  public dialogRef = inject(MatDialogRef<CorteCajaFormDialogComponent>);

  form = this.fb.group({
    fondo_inicial:    [0, [Validators.required, Validators.min(0)]],
    efectivo_contado: [null as number | null],
    retiro_efectivo:  [0, [Validators.min(0)]],
    notas:            [''],
  });

  guardando = signal<boolean>(false);
  error     = signal<string | null>(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      tipo: TipoCorte;
      fecha: string;
      preview?: MetricasCorte;
    }
  ) {}

  get diferencia(): number | null {
    const contado  = this.form.get('efectivo_contado')?.value;
    const fondo    = +(this.form.get('fondo_inicial')?.value ?? 0);
    const retiro   = +(this.form.get('retiro_efectivo')?.value ?? 0);
    const efectivo = +(this.data.preview?.total_efectivo ?? 0);
    if (contado === null || contado === undefined) return null;
    return +(+contado - (fondo + efectivo - retiro)).toFixed(2);
  }

  cerrar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);

    const v = this.form.value;
    this.service.cerrar({
      tipo:             this.data.tipo,
      fecha:            this.data.fecha,
      fondo_inicial:    +(v.fondo_inicial ?? 0),
      efectivo_contado: v.efectivo_contado !== null && v.efectivo_contado !== undefined
        ? +v.efectivo_contado : undefined,
      retiro_efectivo:  +(v.retiro_efectivo ?? 0),
      notas:            v.notas || undefined,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al cerrar el corte');
      }
    });
  }
}
