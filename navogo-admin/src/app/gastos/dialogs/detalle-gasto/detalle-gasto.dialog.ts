import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Gasto, getLineasInsumos } from '../../gastos.interface';

export interface DetalleGastoData {
  gasto: Gasto;
}

@Component({
  selector: 'app-detalle-gasto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">receipt_long</mat-icon>
        <h2>Detalle del gasto</h2>
      </div>

      <div class="dialog-content">
        <div class="detalle-principal">
          <div class="detalle-concepto">{{ data.gasto.concepto }}</div>
          <div class="detalle-monto">
            \${{ data.gasto.monto | number:'1.2-2' }}
          </div>
        </div>

        <div class="detalle-grid">
          <div class="detalle-item">
            <span class="detalle-label">Categoría</span>
            <span class="detalle-valor"
                  [style.color]="data.gasto.categoria?.color">
              <mat-icon class="cat-icon"
                        [style.color]="data.gasto.categoria?.color">
                {{ data.gasto.categoria?.icono ?? 'category' }}
              </mat-icon>
              {{ data.gasto.categoria?.nombre }}
            </span>
          </div>

          <div class="detalle-item">
            <span class="detalle-label">Fecha</span>
            <span class="detalle-valor">
              {{ data.gasto.fecha_gasto | date:'dd/MM/yyyy' }}
            </span>
          </div>

          <div class="detalle-item">
            <span class="detalle-label">Método de pago</span>
            <span class="detalle-valor">
              <mat-icon>{{ getIconoMetodo(data.gasto.metodo_pago) }}</mat-icon>
              {{ getLabelMetodo(data.gasto.metodo_pago) }}
            </span>
          </div>

          @if (data.gasto.proveedor) {
            <div class="detalle-item">
              <span class="detalle-label">Proveedor</span>
              <span class="detalle-valor">
                <mat-icon>local_shipping</mat-icon>
                {{ data.gasto.proveedor.nombre }}
              </span>
            </div>
          }

          @if (data.gasto.tiene_factura) {
            <div class="detalle-item">
              <span class="detalle-label">Factura</span>
              <span class="detalle-valor">
                {{ data.gasto.folio_factura || 'Sí (sin folio)' }}
              </span>
            </div>
          }

          @if (data.gasto.es_recurrente) {
            <div class="detalle-item">
              <span class="detalle-label">Recurrencia</span>
              <span class="detalle-valor">
                {{ getLabelFrecuencia(data.gasto.frecuencia_recurrencia) }}
              </span>
            </div>
          }
        </div>

        @if (data.gasto.es_compra_insumo && lineas().length > 0) {
          <div class="lineas-tabla-section">
            <label class="section-title">
              <mat-icon>inventory_2</mat-icon>
              Líneas de insumos
            </label>
            <table class="lineas-tabla">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Cantidad</th>
                  <th>Costo unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @for (linea of lineas(); track linea.id) {
                  <tr>
                    <td>{{ linea.insumo?.nombre ?? '—' }}</td>
                    <td>
                      {{ linea.cantidad | number:'1.0-3' }}
                      {{ linea.insumo?.unidad_medida }}
                    </td>
                    <td>\${{ linea.costo_unitario | number:'1.2-4' }}</td>
                    <td class="subtotal">
                      \${{ linea.costo_total | number:'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (data.gasto.nota) {
          <div class="detalle-nota">
            <span class="detalle-label">Nota</span>
            <p>{{ data.gasto.nota }}</p>
          </div>
        }
      </div>

      <div class="dialog-actions">
        <button mat-flat-button class="btn-cerrar" (click)="dialogRef.close()">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: min(85vh, 600px);
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
      gap: 14px;
    }

    .detalle-principal {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: #f5f5f5;
      border-radius: 10px;
    }

    .detalle-concepto {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .detalle-monto {
      font-size: 22px;
      font-weight: 800;
      color: #0F4D2A;
      white-space: nowrap;
    }

    .detalle-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .detalle-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detalle-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
    }

    .detalle-valor {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .cat-icon { font-size: 16px !important; }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 8px;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #16a34a; }
    }

    .lineas-tabla {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;

      th {
        text-align: left;
        padding: 8px 10px;
        background: #f9fafb;
        color: #6b7280;
        font-weight: 700;
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 8px 10px;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
      }

      .subtotal {
        font-weight: 700;
        color: #0F4D2A;
      }
    }

    .detalle-nota {
      padding: 10px 12px;
      background: #fffbeb;
      border-radius: 8px;
      border: 1px solid #fde68a;

      p { margin: 4px 0 0; font-size: 13px; color: #374151; }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      flex-shrink: 0;
      padding: 12px 16px;
      border-top: 1px solid rgba(0,0,0,0.08);

      .btn-cerrar {
        background: #0F4D2A;
        color: white;
      }
    }

    @media (max-width: 480px) {
      .detalle-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DetalleGastoDialog {
  dialogRef = inject(MatDialogRef<DetalleGastoDialog>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DetalleGastoData) {}

  lineas() {
    return getLineasInsumos(this.data.gasto);
  }

  getIconoMetodo(metodo: string): string {
    const m: Record<string, string> = {
      efectivo: 'payments', tarjeta: 'credit_card',
      transferencia: 'account_balance',
    };
    return m[metodo] ?? 'payment';
  }

  getLabelMetodo(metodo: string): string {
    const m: Record<string, string> = {
      efectivo: 'Efectivo', tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
    };
    return m[metodo] ?? metodo;
  }

  getLabelFrecuencia(freq: string | null): string {
    const m: Record<string, string> = {
      semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
    };
    return freq ? (m[freq] ?? freq) : '—';
  }
}
