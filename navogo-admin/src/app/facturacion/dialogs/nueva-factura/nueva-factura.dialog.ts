import {
  Component, Inject, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA, MatDialogModule, MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule }
  from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { FacturacionService } from '../../facturacion.service';
import {
  Factura, OrdenParaFacturar, ClienteFiscal,
  USOS_CFDI, REGIMENES_FISCALES, FORMAS_PAGO
} from '../../facturacion.interface';

export interface NuevaFacturaData {
  orden: OrdenParaFacturar;
}

@Component({
  selector: 'app-nueva-factura-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">receipt_long</mat-icon>
        <div>
          <h2>Nueva Factura</h2>
          <p class="header-sub">
            Orden #{{ data.orden.folio }} ·
            \${{ data.orden.total | number:'1.2-2' }}
          </p>
        </div>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">

        <div class="orden-resumen">
          <p class="resumen-titulo">
            <mat-icon>shopping_cart</mat-icon>
            Productos a facturar
          </p>
          @for (item of data.orden.items; track item.id) {
            <div class="resumen-item">
              <span>{{ item.quantity }}×
                {{ item.name }}</span>
              <span>
                \${{ (+item.unit_price * item.quantity)
                    | number:'1.2-2' }}
              </span>
            </div>
          }
          <div class="resumen-total">
            <span>Total</span>
            <strong>
              \${{ data.orden.total | number:'1.2-2' }}
            </strong>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="buscador-cliente-fiscal">
          <mat-form-field appearance="outline"
                          class="full-width">
            <mat-label>
              Buscar cliente fiscal guardado
            </mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput
                   [value]="busquedaCliente()"
                   (input)="onBusquedaCliente(
                     $any($event.target).value)"
                   placeholder="RFC o razón social...">
            @if (busquedaCliente()) {
              <button matSuffix mat-icon-button
                      type="button"
                      (click)="limpiarCliente()">
                <mat-icon>close</mat-icon>
              </button>
            }
            @if (buscandoCliente()) {
              <mat-spinner matSuffix diameter="18"></mat-spinner>
            }
          </mat-form-field>

          @if (mostrarSugerencias()) {
            <div class="sugerencias-lista">
              @for (c of clientesSugeridos(); track c.id) {
                <div class="sugerencia-item"
                     (click)="seleccionarCliente(c)">
                  <span class="sug-rfc">{{ c.rfc }}</span>
                  <span class="sug-nombre">
                    {{ c.razon_social }}
                  </span>
                  <span class="sug-meta">
                    CP: {{ c.codigo_postal }}
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <mat-divider></mat-divider>
        <p class="seccion-titulo">
          O ingresa los datos manualmente
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>RFC del receptor</mat-label>
          <input matInput [(ngModel)]="form.rfc_receptor"
                 placeholder="XAXX010101000"
                 (input)="form.rfc_receptor =
                   $any($event.target).value.toUpperCase()"
                 maxlength="13">
          <mat-hint>13 caracteres para personas físicas,
            12 para morales</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Razón social</mat-label>
          <input matInput [(ngModel)]="form.razon_social_receptor"
                 placeholder="Nombre o razón social completa">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código postal fiscal</mat-label>
          <input matInput [(ngModel)]="form.codigo_postal_receptor"
                 placeholder="12345" maxlength="5"
                 inputmode="numeric">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Régimen fiscal</mat-label>
          <mat-select [(ngModel)]="form.regimen_fiscal_receptor">
            @for (r of regimenes; track r.value) {
              <mat-option [value]="r.value">
                {{ r.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Uso del CFDI</mat-label>
          <mat-select [(ngModel)]="form.uso_cfdi">
            @for (u of usosCfdi; track u.value) {
              <mat-option [value]="u.value">
                {{ u.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Forma de pago</mat-label>
          <mat-select [(ngModel)]="form.forma_pago">
            @for (f of formasPago; track f.value) {
              <mat-option [value]="f.value">
                {{ f.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email (para enviar la factura)</mat-label>
          <input matInput type="email"
                 [(ngModel)]="form.email_receptor"
                 placeholder="cliente@email.com">
        </mat-form-field>

        @if (form.rfc_receptor.length >= 12
             && form.razon_social_receptor.trim()) {
          <div class="aviso-guardado">
            <mat-icon>bookmark_add</mat-icon>
            <span>
              Este cliente se guardará automáticamente
              en tu directorio fiscal al emitir
            </span>
          </div>
        }

        @if (error()) {
          <div class="form-error">
            <mat-icon>error</mat-icon>
            {{ error() }}
          </div>
        }

      </div>

      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()"
                [disabled]="emitiendo()">
          Cancelar
        </button>
        <button mat-flat-button class="btn-emitir"
                [disabled]="!puedeEmitir() || emitiendo()"
                (click)="emitir()">
          @if (emitiendo()) {
            <mat-spinner diameter="18"></mat-spinner>
            Emitiendo...
          } @else {
            <mat-icon>receipt_long</mat-icon>
            Emitir CFDI
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-container {
      display: flex; flex-direction: column;
      max-height: min(90vh, 720px);
      width: min(100%, 520px);
    }
    .dialog-header {
      display: flex; align-items: flex-start;
      gap: 10px; padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
      .header-icon {
        font-size: 26px; width: 26px; height: 26px;
        color: #0F4D2A; margin-top: 2px;
      }
      h2 { margin: 0; font-size: 18px; font-weight: 700; }
      .header-sub { margin: 0; font-size: 12px; color: #6b7280; }
      button { margin-left: auto; }
    }
    .dialog-content {
      flex: 1; overflow-y: auto; padding: 14px 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .full-width { width: 100%; }
    .seccion-titulo {
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
      color: #6b7280; margin: 4px 0 0;
    }
    .orden-resumen {
      background: #f9fafb; border-radius: 10px;
      padding: 12px 14px;
    }
    .resumen-titulo {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700; color: #374151;
      margin-bottom: 8px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .resumen-item {
      display: flex; justify-content: space-between;
      font-size: 12px; color: #6b7280; padding: 2px 0;
    }
    .resumen-total {
      display: flex; justify-content: space-between;
      font-size: 13px; font-weight: 700; color: #0F4D2A;
      border-top: 1px solid #e5e7eb;
      margin-top: 6px; padding-top: 6px;
    }
    .form-error {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; background: #fef2f2;
      border-radius: 8px; color: #dc2626; font-size: 13px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .dialog-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 12px 16px; border-top: 1px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
    }
    .btn-emitir {
      background: #0F4D2A; color: white;
      display: flex; align-items: center; gap: 6px;
    }
    .buscador-cliente-fiscal {
      position: relative;
    }
    .sugerencias-lista {
      position: absolute;
      top: 56px;
      left: 0;
      right: 0;
      background: white;
      border: 1.5px solid #e5e3df;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      z-index: 100;
      overflow: hidden;
    }
    .sugerencia-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.1s;
    }
    .sugerencia-item:last-child {
      border-bottom: none;
    }
    .sugerencia-item:hover {
      background: #f9fafb;
    }
    .sug-rfc {
      font-size: 12px;
      font-weight: 800;
      color: #0F4D2A;
      font-family: monospace;
      min-width: 110px;
    }
    .sug-nombre {
      font-size: 13px;
      font-weight: 600;
      color: #1A1A11;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sug-meta {
      font-size: 11px;
      color: #9ca3af;
      flex-shrink: 0;
    }
    .aviso-guardado {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(15, 77, 42, 0.06);
      border: 1px solid rgba(15, 77, 42, 0.15);
      border-radius: 8px;
      font-size: 12px;
      color: #0F4D2A;
      font-weight: 500;
    }
    .aviso-guardado mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
  `],
})
export class NuevaFacturaDialog implements OnInit {
  dialogRef = inject(MatDialogRef<NuevaFacturaDialog, Factura>);
  private service = inject(FacturacionService);

  emitiendo = signal(false);
  error = signal('');

  busquedaCliente = signal('');
  clientesSugeridos = signal<ClienteFiscal[]>([]);
  buscandoCliente = signal(false);
  mostrarSugerencias = signal(false);
  private busqueda$ = new Subject<string>();

  readonly usosCfdi = USOS_CFDI;
  readonly regimenes = REGIMENES_FISCALES;
  readonly formasPago = FORMAS_PAGO;

  form = {
    rfc_receptor:            '',
    razon_social_receptor:   '',
    uso_cfdi:                'G03',
    regimen_fiscal_receptor: '616',
    codigo_postal_receptor:  '',
    forma_pago:              '01',
    email_receptor:          '',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NuevaFacturaData
  ) {}

  ngOnInit(): void {
    const metodo = this.data.orden.payment_method;
    if (metodo === 'tarjeta') this.form.forma_pago = '04';
    else if (metodo === 'transferencia') this.form.forma_pago = '03';
    else this.form.forma_pago = '01';

    this.busqueda$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) {
          this.clientesSugeridos.set([]);
          this.mostrarSugerencias.set(false);
          this.buscandoCliente.set(false);
          return of({ data: [] as ClienteFiscal[] });
        }
        this.buscandoCliente.set(true);
        return this.service.buscarClientesFiscales(q);
      })
    ).subscribe({
      next: (res) => {
        this.clientesSugeridos.set(res?.data ?? []);
        this.mostrarSugerencias.set(
          this.clientesSugeridos().length > 0
        );
        this.buscandoCliente.set(false);
      },
      error: () => this.buscandoCliente.set(false),
    });
  }

  onBusquedaCliente(valor: string): void {
    this.busquedaCliente.set(valor);
    this.busqueda$.next(valor);
  }

  seleccionarCliente(c: ClienteFiscal): void {
    this.form.rfc_receptor            = c.rfc;
    this.form.razon_social_receptor   = c.razon_social;
    this.form.regimen_fiscal_receptor = c.regimen_fiscal;
    this.form.codigo_postal_receptor  = c.codigo_postal;
    this.form.uso_cfdi                = c.uso_cfdi_default;
    this.form.email_receptor          = c.email ?? '';
    this.busquedaCliente.set(c.razon_social);
    this.mostrarSugerencias.set(false);
    this.clientesSugeridos.set([]);
  }

  limpiarCliente(): void {
    this.busquedaCliente.set('');
    this.form.rfc_receptor            = '';
    this.form.razon_social_receptor   = '';
    this.form.regimen_fiscal_receptor = '616';
    this.form.codigo_postal_receptor  = '';
    this.form.uso_cfdi                = 'G03';
    this.form.email_receptor          = '';
    this.mostrarSugerencias.set(false);
    this.clientesSugeridos.set([]);
  }

  puedeEmitir(): boolean {
    return !!(
      this.form.rfc_receptor.length >= 12 &&
      this.form.razon_social_receptor.trim() &&
      this.form.codigo_postal_receptor.length === 5 &&
      this.form.uso_cfdi &&
      this.form.regimen_fiscal_receptor
    );
  }

  emitir(): void {
    if (!this.puedeEmitir()) return;

    this.emitiendo.set(true);
    this.error.set('');

    this.service.emitirFactura({
      order_id:               this.data.orden.id,
      rfc_receptor:           this.form.rfc_receptor,
      razon_social_receptor:  this.form.razon_social_receptor,
      uso_cfdi:               this.form.uso_cfdi,
      regimen_fiscal_receptor:this.form.regimen_fiscal_receptor,
      codigo_postal_receptor: this.form.codigo_postal_receptor,
      email_receptor:         this.form.email_receptor || null,
      forma_pago:             this.form.forma_pago,
    }).subscribe({
      next: (res) => {
        this.emitiendo.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.emitiendo.set(false);
        this.error.set(
          err?.error?.message ?? 'Error al emitir la factura'
        );
      }
    });
  }
}
