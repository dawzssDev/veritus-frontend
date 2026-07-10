import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GastosService } from '../../gastos.service';
import {
  Gasto, CategoriaGasto, LineaInsumoForm, MetodoPagoGasto,
  FrecuenciaRecurrencia
} from '../../gastos.interface';
import { InventarioService } from '../../../inventario/inventario.service';
import { Insumo, Proveedor } from '../../../inventario/inventario.interface';
import { CrearProveedorDialog } from '../../../inventario/dialogs/crear-proveedor/crear-proveedor.dialog';

export interface CrearGastoData {
  gasto: Gasto | null;
}

@Component({
  selector: 'app-crear-gasto-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">
          {{ data.gasto ? 'edit' : 'add_card' }}
        </mat-icon>
        <h2>{{ data.gasto ? 'Editar gasto' : 'Nuevo gasto' }}</h2>
      </div>

      <div class="dialog-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Concepto</mat-label>
          <input matInput [(ngModel)]="form.concepto" placeholder="Ej. Compra de verduras">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Categoría</mat-label>
          <mat-select [(ngModel)]="form.categoriaId">
            @for (cat of categorias(); track cat.id) {
              <mat-option [value]="cat.id">
                <mat-icon class="cat-icon" [style.color]="cat.color">{{ cat.icono }}</mat-icon>
                {{ cat.nombre }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (!data.gasto) {
          <div class="toggle-row">
            <mat-slide-toggle [(ngModel)]="form.esCompraInsumo"
                              (ngModelChange)="onCompraInsumoChange($event)">
              Compra de insumos (mueve inventario)
            </mat-slide-toggle>
          </div>
        }

        @if (form.esCompraInsumo && !data.gasto) {
          <div class="lineas-section">
            <div class="lineas-header">
              <label class="section-title">Líneas de insumos</label>
              <button type="button" mat-stroked-button (click)="agregarLinea()">
                <mat-icon>add</mat-icon>
                Agregar línea
              </button>
            </div>

            @for (linea of form.lineasInsumos; track $index; let i = $index) {
              <div class="linea-row">
                <mat-form-field appearance="outline" class="linea-insumo">
                  <mat-label>Insumo</mat-label>
                  <mat-select [(ngModel)]="linea.insumoId">
                    @for (ins of insumos(); track ins.id) {
                      <mat-option [value]="ins.id">
                        {{ ins.nombre }} ({{ ins.unidad_medida }})
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="linea-cant">
                  <mat-label>Cant.</mat-label>
                  <input matInput type="number" [(ngModel)]="linea.cantidad"
                         inputmode="decimal" min="0.001" step="0.01">
                </mat-form-field>

                <mat-form-field appearance="outline" class="linea-costo">
                  <mat-label>Costo unit.</mat-label>
                  <span matTextPrefix>$&nbsp;</span>
                  <input matInput type="number" [(ngModel)]="linea.costoUnitario"
                         inputmode="decimal" min="0" step="0.01">
                </mat-form-field>

                <span class="linea-subtotal">
                  \${{ subtotalLinea(linea) | number:'1.2-2' }}
                </span>

                @if (form.lineasInsumos.length > 1) {
                  <button type="button" mat-icon-button class="btn-quitar"
                          (click)="quitarLinea(i)">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>
            }

            <div class="total-lineas">
              <span>Total calculado</span>
              <strong>\${{ totalLineas() | number:'1.2-2' }}</strong>
            </div>
          </div>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Monto</mat-label>
            <span matTextPrefix>$&nbsp;</span>
            <input matInput type="number" [(ngModel)]="form.monto"
                   inputmode="decimal" min="0" step="0.01">
          </mat-form-field>
        }

        <label class="section-title">Método de pago</label>
        <div class="metodos-grid">
          @for (m of metodosPago; track m.value) {
            <button type="button" class="metodo-btn"
                    [class.selected]="form.metodoPago === m.value"
                    (click)="form.metodoPago = m.value">
              <mat-icon>{{ m.icon }}</mat-icon>
              <span>{{ m.label }}</span>
            </button>
          }
        </div>

        <div class="proveedor-row">
          <mat-form-field appearance="outline" class="proveedor-select">
            <mat-label>Proveedor (opcional)</mat-label>
            <mat-select [(ngModel)]="form.proveedorId">
              <mat-option [value]="null">Sin proveedor</mat-option>
              @for (p of proveedores(); track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button type="button" mat-stroked-button class="btn-nuevo-prov"
                  (click)="abrirCrearProveedor()" matTooltip="Nuevo proveedor">
            <mat-icon>add</mat-icon>
          </button>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha del gasto</mat-label>
          <input matInput type="date" [(ngModel)]="form.fechaGasto">
        </mat-form-field>

        <div class="toggle-row">
          <mat-slide-toggle [(ngModel)]="form.tieneFactura">
            Tiene factura
          </mat-slide-toggle>
        </div>

        @if (form.tieneFactura) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Folio de factura</mat-label>
            <input matInput [(ngModel)]="form.folioFactura" placeholder="Ej. A-12345">
          </mat-form-field>
        }

        @if (!data.gasto) {
          <div class="toggle-row">
            <mat-slide-toggle [(ngModel)]="form.esRecurrente">
              Gasto recurrente
            </mat-slide-toggle>
          </div>

          @if (form.esRecurrente) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Frecuencia</mat-label>
              <mat-select [(ngModel)]="form.frecuencia">
                <mat-option value="semanal">Semanal</mat-option>
                <mat-option value="quincenal">Quincenal</mat-option>
                <mat-option value="mensual">Mensual</mat-option>
              </mat-select>
            </mat-form-field>
          }
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nota (opcional)</mat-label>
          <textarea matInput [(ngModel)]="form.nota" rows="2"></textarea>
        </mat-form-field>

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()" [disabled]="guardando()">
          Cancelar
        </button>
        <button mat-flat-button class="btn-confirmar"
                (click)="guardar()"
                [disabled]="!puedeGuardar() || guardando()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon>
          }
          {{ data.gasto ? 'Actualizar' : 'Registrar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: min(90vh, 700px);
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);

      .header-icon { width: 26px; height: 26px; font-size: 26px; color: #0F4D2A; }
      h2 { margin: 0; font-size: 18px; font-weight: 700; }
    }

    .dialog-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width { width: 100%; }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      margin-top: 4px;
    }

    .toggle-row { padding: 4px 0; }

    .metodos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .metodo-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 6px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      font-family: inherit;

      mat-icon { font-size: 20px; width: 20px; height: 20px; }

      &.selected {
        border-color: #0F4D2A;
        background: #f0fdf4;
        color: #0F4D2A;
      }
    }

    .proveedor-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .proveedor-select { flex: 1; }
    .btn-nuevo-prov { margin-top: 4px; min-width: 44px; padding: 0; }

    .lineas-section {
      padding: 10px;
      background: #f9fafb;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
    }

    .lineas-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .linea-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }

    .linea-insumo { flex: 2; min-width: 140px; }
    .linea-cant   { flex: 1; min-width: 70px; }
    .linea-costo  { flex: 1; min-width: 90px; }

    .linea-subtotal {
      align-self: center;
      font-size: 13px;
      font-weight: 700;
      color: #0F4D2A;
      padding-top: 12px;
      min-width: 60px;
    }

    .btn-quitar { color: #dc2626; }

    .total-lineas {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      background: #f0fdf4;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 14px;

      strong { color: #0F4D2A; font-size: 16px; }
    }

    .cat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      vertical-align: middle;
      margin-right: 4px;
    }

    .form-error {
      color: #dc2626;
      font-size: 13px;
      margin: 0;
      padding: 8px 12px;
      background: #fef2f2;
      border-radius: 6px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-shrink: 0;
      padding: 12px 16px;
      border-top: 1px solid rgba(0,0,0,0.08);

      .btn-confirmar {
        background: #0F4D2A;
        color: white;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  `],
})
export class CrearGastoDialog implements OnInit {
  dialogRef = inject(MatDialogRef<CrearGastoDialog, Gasto>);
  private service = inject(GastosService);
  private inventarioService = inject(InventarioService);
  private dialog = inject(MatDialog);

  guardando = signal(false);
  error = signal('');
  categorias = signal<CategoriaGasto[]>([]);
  insumos = signal<Insumo[]>([]);
  proveedores = signal<Proveedor[]>([]);

  metodosPago: { value: MetodoPagoGasto; label: string; icon: string }[] = [
    { value: 'efectivo',      label: 'Efectivo',      icon: 'payments' },
    { value: 'tarjeta',       label: 'Tarjeta',       icon: 'credit_card' },
    { value: 'transferencia', label: 'Transferencia', icon: 'account_balance' },
  ];

  form = {
    concepto:       '',
    categoriaId:    null as number | null,
    metodoPago:     'efectivo' as MetodoPagoGasto,
    proveedorId:    null as number | null,
    tieneFactura:   false,
    folioFactura:   '',
    fechaGasto:     new Date().toISOString().slice(0, 10),
    esRecurrente:   false,
    frecuencia:     'mensual' as FrecuenciaRecurrencia,
    esCompraInsumo: false,
    nota:           '',
    monto:          null as number | null,
    lineasInsumos:  [{ insumoId: null, cantidad: null, costoUnitario: null }] as LineaInsumoForm[],
  };

  totalLineas(): number {
    return this.form.lineasInsumos.reduce(
      (sum, l) => sum + this.subtotalLinea(l), 0
    );
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: CrearGastoData) {}

  ngOnInit(): void {
    this.service.getCategorias().subscribe({
      next: (cats) => {
        if (cats.length === 0) {
          this.service.inicializarCategorias()
            .subscribe({
              next: (res) => this.categorias.set(res.categorias),
            });
        } else {
          this.categorias.set(cats);
        }
      },
    });
    this.inventarioService.getInsumos().subscribe({
      next: (lista) => this.insumos.set(lista),
    });
    this.inventarioService.getProveedores().subscribe({
      next: (lista) => this.proveedores.set(lista),
    });

    if (this.data.gasto) {
      const g = this.data.gasto;
      this.form.concepto     = g.concepto;
      this.form.categoriaId  = g.categoria_id;
      this.form.metodoPago    = g.metodo_pago;
      this.form.proveedorId   = g.proveedor_id;
      this.form.tieneFactura  = g.tiene_factura;
      this.form.folioFactura  = g.folio_factura ?? '';
      this.form.fechaGasto    = g.fecha_gasto?.slice(0, 10) ?? '';
      this.form.nota          = g.nota ?? '';
      this.form.monto         = parseFloat(g.monto);
      this.form.esCompraInsumo = false;
    }
  }

  onCompraInsumoChange(activo: boolean): void {
    if (activo) {
      const catInsumos = this.categorias().find(
        c => c.nombre === 'Insumos'
      );
      if (catInsumos) {
        this.form.categoriaId = catInsumos.id;
      }
    }
  }

  subtotalLinea(linea: LineaInsumoForm): number {
    return (linea.cantidad ?? 0) * (linea.costoUnitario ?? 0);
  }

  agregarLinea(): void {
    this.form.lineasInsumos.push({
      insumoId: null, cantidad: null, costoUnitario: null,
    });
  }

  quitarLinea(index: number): void {
    this.form.lineasInsumos.splice(index, 1);
  }

  abrirCrearProveedor(): void {
    const ref = this.dialog.open(CrearProveedorDialog, {
      width: '420px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((proveedor) => {
      if (proveedor) {
        this.proveedores.update(l => [...l, proveedor]);
        this.form.proveedorId = proveedor.id;
      }
    });
  }

  puedeGuardar(): boolean {
    if (!this.form.concepto.trim() || !this.form.categoriaId) return false;
    if (this.form.esCompraInsumo && !this.data.gasto) {
      return this.form.lineasInsumos.every(l =>
        l.insumoId && (l.cantidad ?? 0) > 0 && (l.costoUnitario ?? 0) >= 0
      );
    }
    return (this.form.monto ?? 0) >= 0;
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set('');

    const payload: any = {
      concepto:       this.form.concepto.trim(),
      categoria_id:   this.form.categoriaId,
      metodo_pago:    this.form.metodoPago,
      proveedor_id:   this.form.proveedorId,
      tiene_factura:  this.form.tieneFactura,
      folio_factura:  this.form.folioFactura || null,
      fecha_gasto:    this.form.fechaGasto,
      es_recurrente:  this.form.esRecurrente,
      frecuencia_recurrencia: this.form.esRecurrente
        ? this.form.frecuencia : null,
      es_compra_insumo: this.form.esCompraInsumo,
      nota: this.form.nota || null,
    };

    if (this.form.esCompraInsumo && !this.data.gasto) {
      payload.insumos = this.form.lineasInsumos.map(l => ({
        insumo_id:      l.insumoId,
        cantidad:       l.cantidad,
        costo_unitario: l.costoUnitario,
      }));
    } else {
      payload.monto = this.form.monto;
    }

    const op$ = this.data.gasto
      ? this.service.actualizarGasto(this.data.gasto.id, payload)
      : this.service.crearGasto(payload);

    op$.subscribe({
      next: (gasto) => {
        this.guardando.set(false);
        this.dialogRef.close(gasto);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(
          err?.error?.message ?? 'Error al guardar'
        );
      },
    });
  }
}
