import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InventarioService } from '../../inventario.service';
import {
  Insumo, MovimientoInventario, MotivoMovimiento, TipoMovimiento
} from '../../inventario.interface';

export interface KardexInsumoData {
  insumo: Insumo;
}

@Component({
  selector: 'app-kardex-insumo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [DatePipe],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">history</mat-icon>
        <div class="header-info">
          <h2>Kardex</h2>
          <span class="header-sub">{{ data.insumo.nombre }}</span>
        </div>
        <div class="header-stock">
          <span class="header-stock__label">Stock actual</span>
          <strong>
            {{ data.insumo.stock_actual | number:'1.0-2' }}
            {{ data.insumo.unidad_medida }}
          </strong>
        </div>
      </div>

      <div class="dialog-content">
        @if (cargando()) {
          <div class="kardex-loading">
            <mat-spinner [diameter]="36"></mat-spinner>
          </div>
        } @else if (movimientos().length === 0) {
          <div class="kardex-vacio">
            <mat-icon>inventory_2</mat-icon>
            <p>Sin movimientos registrados</p>
          </div>
        } @else {
          <div class="kardex-tabla">
            @for (mov of movimientos(); track mov.id) {
              <div class="kardex-fila" [class]="'kardex-fila--' + mov.tipo">
                <div class="kardex-fila__icono">
                  <mat-icon>{{ getIconoTipo(mov.tipo) }}</mat-icon>
                </div>
                <div class="kardex-fila__info">
                  <div class="kardex-fila__top">
                    <span class="kardex-tipo">{{ getLabelTipo(mov.tipo) }}</span>
                    <span class="kardex-motivo">{{ getLabelMotivo(mov.motivo) }}</span>
                    <span class="kardex-fecha">
                      {{ mov.created_at | date:'dd/MM/yy HH:mm' }}
                    </span>
                  </div>
                  <div class="kardex-fila__bottom">
                    <span class="kardex-cantidad"
                          [class.kardex-cantidad--entrada]="mov.tipo === 'entrada'"
                          [class.kardex-cantidad--salida]="mov.tipo === 'salida'">
                      {{ mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : '' }}
                      {{ mov.cantidad | number:'1.0-2' }}
                      {{ data.insumo.unidad_medida }}
                    </span>
                    <span class="kardex-stock">
                      {{ mov.stock_anterior | number:'1.0-2' }}
                      →
                      {{ mov.stock_nuevo | number:'1.0-2' }}
                    </span>
                    @if (mov.costo_total && parseFloat(mov.costo_total) > 0) {
                      <span class="kardex-costo">
                        \${{ mov.costo_total | number:'1.2-2' }}
                      </span>
                    }
                  </div>
                  @if (mov.referencia) {
                    <div class="kardex-referencia">{{ mov.referencia }}</div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="dialog-actions">
        <div class="paginacion">
          <button mat-icon-button
                  [disabled]="paginaActual() <= 1 || cargando()"
                  (click)="irPagina(paginaActual() - 1)">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="paginacion__info">
            Página {{ paginaActual() }} de {{ ultimaPagina() }}
            ({{ total() }} movimientos)
          </span>
          <button mat-icon-button
                  [disabled]="paginaActual() >= ultimaPagina() || cargando()"
                  (click)="irPagina(paginaActual() + 1)">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
        <button mat-button (click)="dialogRef.close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: min(85vh, 640px);
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);

      .header-icon {
        width: 26px; height: 26px; font-size: 26px; color: #0F4D2A;
        flex-shrink: 0;
      }

      .header-info {
        flex: 1;
        min-width: 0;

        h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
      }

      .header-sub {
        font-size: 12px;
        color: var(--color-text-muted);
      }

      .header-stock {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        flex-shrink: 0;
      }

      .header-stock__label {
        font-size: 10px;
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      strong { color: #0F4D2A; font-size: 15px; }
    }

    .dialog-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 12px 16px;
    }

    .kardex-loading, .kardex-vacio {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--color-text-muted);

      mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }
    }

    .kardex-tabla {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .kardex-fila {
      display: flex;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-surface);

      &--entrada { border-left: 3px solid #16a34a; }
      &--salida  { border-left: 3px solid #dc2626; }
      &--ajuste  { border-left: 3px solid #2563eb; }
    }

    .kardex-fila__icono {
      flex-shrink: 0;

      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    }

    .kardex-fila__info { flex: 1; min-width: 0; }

    .kardex-fila__top {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .kardex-tipo {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-primary);
      text-transform: capitalize;
    }

    .kardex-motivo {
      font-size: 11px;
      color: var(--color-text-muted);
      background: var(--color-bg-surface-3);
      padding: 2px 8px;
      border-radius: 10px;
    }

    .kardex-fecha {
      margin-left: auto;
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .kardex-fila__bottom {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .kardex-cantidad {
      font-size: 14px;
      font-weight: 700;

      &--entrada { color: #16a34a; }
      &--salida  { color: #dc2626; }
    }

    .kardex-stock {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .kardex-costo {
      font-size: 12px;
      font-weight: 600;
      color: #0F4D2A;
    }

    .kardex-referencia {
      font-size: 11px;
      color: var(--color-text-muted);
      margin-top: 4px;
      font-style: italic;
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      padding: 10px 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .paginacion {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .paginacion__info {
      font-size: 12px;
      color: var(--color-text-muted);
      white-space: nowrap;
    }
  `],
})
export class KardexInsumoDialog implements OnInit {
  dialogRef = inject(MatDialogRef<KardexInsumoDialog>);
  private service = inject(InventarioService);

  cargando = signal(true);
  movimientos = signal<MovimientoInventario[]>([]);
  paginaActual = signal(1);
  ultimaPagina = signal(1);
  total = signal(0);

  parseFloat = parseFloat;

  constructor(@Inject(MAT_DIALOG_DATA) public data: KardexInsumoData) {}

  ngOnInit(): void {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.getKardex(this.data.insumo.id, page).subscribe({
      next: (res) => {
        this.movimientos.set(res.data);
        this.paginaActual.set(res.current_page);
        this.ultimaPagina.set(res.last_page);
        this.total.set(res.total);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  irPagina(page: number): void {
    if (page < 1 || page > this.ultimaPagina()) return;
    this.cargar(page);
  }

  getIconoTipo(tipo: TipoMovimiento): string {
    const m: Record<TipoMovimiento, string> = {
      entrada: 'add_circle',
      salida:  'remove_circle',
      ajuste:  'tune',
    };
    return m[tipo];
  }

  getLabelTipo(tipo: TipoMovimiento): string {
    const m: Record<TipoMovimiento, string> = {
      entrada: 'Entrada',
      salida:  'Salida',
      ajuste:  'Ajuste',
    };
    return m[tipo];
  }

  getLabelMotivo(motivo: MotivoMovimiento): string {
    const m: Record<MotivoMovimiento, string> = {
      compra:             'Compra',
      merma:              'Merma',
      consumo_manual:     'Consumo manual',
      ajuste_inventario:  'Ajuste de inventario',
      devolucion:         'Devolución',
    };
    return m[motivo] ?? motivo;
  }
}
