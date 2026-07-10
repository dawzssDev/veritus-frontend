import {
  Component, Inject, inject, signal, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogModule, MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule }
  from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule }
  from '@angular/material/select';
import { MatProgressSpinnerModule }
  from '@angular/material/progress-spinner';

import { FacturacionService }
  from '../../facturacion.service';
import {
  ClienteFiscal,
  USOS_CFDI,
  REGIMENES_FISCALES,
} from '../../facturacion.interface';

export interface ClienteFiscalDialogData {
  cliente?: ClienteFiscal;
}

@Component({
  selector: 'app-cliente-fiscal-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatSelectModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">
          person_outline
        </mat-icon>
        <h2>
          {{ data.cliente
             ? 'Editar cliente fiscal'
             : 'Nuevo cliente fiscal' }}
        </h2>
        <button mat-icon-button
                (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">

        @if (!data.cliente) {
          <mat-form-field appearance="outline"
                          class="full-width">
            <mat-label>RFC</mat-label>
            <input matInput [(ngModel)]="form.rfc"
                   placeholder="XAXX010101000"
                   (input)="form.rfc =
                     $any($event.target).value
                       .toUpperCase()"
                   maxlength="13">
            <mat-hint>
              13 caracteres persona física,
              12 persona moral
            </mat-hint>
          </mat-form-field>
        } @else {
          <div class="rfc-fijo">
            <span class="rfc-label">RFC</span>
            <span class="rfc-valor">
              {{ data.cliente.rfc }}
            </span>
            <span class="rfc-hint">
              No se puede modificar
            </span>
          </div>
        }

        <mat-form-field appearance="outline"
                        class="full-width">
          <mat-label>Razón social</mat-label>
          <input matInput
                 [(ngModel)]="form.razon_social"
                 placeholder="Nombre completo o razón social">
          <mat-hint>
            Exactamente como aparece en el SAT
          </mat-hint>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline"
                          class="half-width">
            <mat-label>Código postal fiscal</mat-label>
            <input matInput
                   [(ngModel)]="form.codigo_postal"
                   placeholder="12345"
                   maxlength="5"
                   inputmode="numeric">
          </mat-form-field>

          <mat-form-field appearance="outline"
                          class="half-width">
            <mat-label>Régimen fiscal</mat-label>
            <mat-select
              [(ngModel)]="form.regimen_fiscal">
              @for (r of regimenes; track r.value) {
                <mat-option [value]="r.value">
                  {{ r.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline"
                        class="full-width">
          <mat-label>Uso CFDI predeterminado</mat-label>
          <mat-select
            [(ngModel)]="form.uso_cfdi_default">
            @for (u of usosCfdi; track u.value) {
              <mat-option [value]="u.value">
                {{ u.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline"
                        class="full-width">
          <mat-label>Email (opcional)</mat-label>
          <input matInput type="email"
                 [(ngModel)]="form.email"
                 placeholder="cliente@email.com">
        </mat-form-field>

        <mat-form-field appearance="outline"
                        class="full-width">
          <mat-label>Teléfono (opcional)</mat-label>
          <input matInput
                 [(ngModel)]="form.telefono"
                 placeholder="5512345678"
                 inputmode="numeric">
        </mat-form-field>

        @if (error()) {
          <div class="form-error">
            <mat-icon>error</mat-icon>
            {{ error() }}
          </div>
        }

      </div>

      <div class="dialog-actions">
        <button mat-button
                (click)="dialogRef.close()"
                [disabled]="guardando()">
          Cancelar
        </button>
        <button mat-flat-button class="btn-guardar"
                [disabled]="!puedeGuardar()
                  || guardando()"
                (click)="guardar()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon>
          }
          {{ data.cliente ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container {
      display: flex; flex-direction: column;
      max-height: min(90vh, 680px);
      width: min(100%, 500px);
    }
    .dialog-header {
      display: flex; align-items: center;
      gap: 10px; padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
    }
    .header-icon {
      font-size: 26px; width: 26px; height: 26px;
      color: #0F4D2A;
    }
    .dialog-header h2 {
      margin: 0; font-size: 18px;
      font-weight: 700; flex: 1;
    }
    .dialog-content {
      flex: 1; overflow-y: auto;
      padding: 14px 16px;
      display: flex; flex-direction: column;
      gap: 10px;
    }
    .full-width { width: 100%; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .half-width { width: 100%; }
    .rfc-fijo {
      display: flex; flex-direction: column;
      gap: 2px; padding: 12px 14px;
      background: #f3f4f6; border-radius: 8px;
    }
    .rfc-label {
      font-size: 10px; color: #9ca3af;
      font-weight: 700; text-transform: uppercase;
    }
    .rfc-valor {
      font-size: 16px; font-weight: 800;
      color: #1A1A11; font-family: monospace;
    }
    .rfc-hint {
      font-size: 11px; color: #9ca3af;
    }
    .form-error {
      display: flex; align-items: center;
      gap: 8px; padding: 10px 12px;
      background: #fef2f2; border-radius: 8px;
      color: #dc2626; font-size: 13px;
    }
    .form-error mat-icon {
      font-size: 18px; width: 18px; height: 18px;
    }
    .dialog-actions {
      display: flex; justify-content: flex-end;
      gap: 10px; padding: 12px 16px;
      border-top: 1px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
    }
    .btn-guardar {
      background: #0F4D2A; color: white;
      display: flex; align-items: center;
      gap: 6px;
    }
  `],
})
export class ClienteFiscalDialog implements OnInit {
  dialogRef = inject(
    MatDialogRef<ClienteFiscalDialog, ClienteFiscal>
  );
  private service = inject(FacturacionService);

  guardando = signal(false);
  error     = signal('');

  readonly usosCfdi  = USOS_CFDI;
  readonly regimenes = REGIMENES_FISCALES;

  form = {
    rfc:              '',
    razon_social:     '',
    regimen_fiscal:   '616',
    codigo_postal:    '',
    uso_cfdi_default: 'G03',
    email:            '',
    telefono:         '',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ClienteFiscalDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.cliente) {
      const c = this.data.cliente;
      this.form = {
        rfc:              c.rfc,
        razon_social:     c.razon_social,
        regimen_fiscal:   c.regimen_fiscal,
        codigo_postal:    c.codigo_postal,
        uso_cfdi_default: c.uso_cfdi_default,
        email:            c.email ?? '',
        telefono:         c.telefono ?? '',
      };
    }
  }

  puedeGuardar(): boolean {
    return !!(
      (this.data.cliente || this.form.rfc.length >= 12)
      && this.form.razon_social.trim()
      && this.form.codigo_postal.length === 5
      && this.form.regimen_fiscal
    );
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set('');

    const payload = {
      rfc:               this.form.rfc,
      razon_social:      this.form.razon_social,
      regimen_fiscal:    this.form.regimen_fiscal,
      codigo_postal:     this.form.codigo_postal,
      uso_cfdi_default:  this.form.uso_cfdi_default,
      email:    this.form.email || null,
      telefono: this.form.telefono || null,
    };

    const op$ = this.data.cliente
      ? this.service.actualizarClienteFiscal(
          this.data.cliente.id, payload
        )
      : this.service.crearClienteFiscal(payload);

    op$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err?.error?.message ?? 'Error al guardar'
        );
      }
    });
  }
}
