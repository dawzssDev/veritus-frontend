import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InventarioService } from '../../inventario.service';
import { Insumo, Proveedor, UnidadMedida } from '../../inventario.interface';
import { CrearProveedorDialog } from '../crear-proveedor/crear-proveedor.dialog';

export interface CrearEditarInsumoData {
  insumo: Insumo | null;
}

@Component({
  selector: 'app-crear-editar-insumo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">
          {{ data.insumo ? 'edit' : 'add_box' }}
        </mat-icon>
        <h2>{{ data.insumo ? 'Editar insumo' : 'Nuevo insumo' }}</h2>
      </div>

      <div class="dialog-content">
        <form [formGroup]="form" class="form-grid">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej. Harina de trigo">
            @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
              <mat-error>El nombre es obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Categoría (opcional)</mat-label>
            <input matInput formControlName="categoria" placeholder="Ej. Abarrotes">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Unidad de medida</mat-label>
            <mat-select formControlName="unidad_medida">
              @for (u of unidades; track u) {
                <mat-option [value]="u">{{ u }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Stock mínimo</mat-label>
            <input matInput type="number" formControlName="stock_minimo"
                   inputmode="decimal" min="0" step="0.01">
            @if (form.get('stock_minimo')?.hasError('required') && form.get('stock_minimo')?.touched) {
              <mat-error>El stock mínimo es obligatorio</mat-error>
            }
          </mat-form-field>

          <div class="proveedor-row">
            <mat-form-field appearance="outline" class="proveedor-select">
              <mat-label>Proveedor (opcional)</mat-label>
              <mat-select formControlName="proveedor_id">
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

          @if (error()) {
            <p class="form-error">{{ error() }}</p>
          }
        </form>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()" [disabled]="guardando()">
          Cancelar
        </button>
        <button
          mat-flat-button
          class="btn-confirmar"
          (click)="guardar()"
          [disabled]="form.invalid || guardando()">
          @if (guardando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon>
          }
          {{ data.insumo ? 'Actualizar' : 'Crear' }}
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
      max-height: min(88vh, 600px);
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
        width: 26px; height: 26px; font-size: 26px; color: #1C8C40;
      }

      h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
    }

    .dialog-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 14px 16px;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width { width: 100%; }

    .proveedor-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .proveedor-select { flex: 1; }

    .btn-nuevo-prov {
      margin-top: 4px;
      min-width: 44px;
      padding: 0;
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
export class CrearEditarInsumoDialog implements OnInit {
  dialogRef = inject(MatDialogRef<CrearEditarInsumoDialog, Insumo>);
  private service = inject(InventarioService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  guardando = signal(false);
  error = signal('');
  proveedores = signal<Proveedor[]>([]);

  unidades: UnidadMedida[] = ['kg', 'g', 'lt', 'ml', 'pza', 'caja', 'paquete'];

  form = this.fb.group({
    nombre:        ['', Validators.required],
    categoria:     [''],
    unidad_medida: ['pza' as UnidadMedida, Validators.required],
    stock_minimo:  [0, [Validators.required, Validators.min(0)]],
    proveedor_id:  [null as number | null],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: CrearEditarInsumoData) {}

  ngOnInit(): void {
    this.cargarProveedores();

    if (this.data.insumo) {
      this.form.patchValue({
        nombre:        this.data.insumo.nombre,
        categoria:     this.data.insumo.categoria ?? '',
        unidad_medida: this.data.insumo.unidad_medida,
        stock_minimo:  parseFloat(this.data.insumo.stock_minimo),
        proveedor_id:  this.data.insumo.proveedor_id,
      });
    }
  }

  cargarProveedores(): void {
    this.service.getProveedores().subscribe({
      next: (lista) => this.proveedores.set(lista),
    });
  }

  abrirCrearProveedor(): void {
    const ref = this.dialog.open(CrearProveedorDialog, {
      width: '420px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((proveedor) => {
      if (proveedor) {
        this.proveedores.update(l => [...l, proveedor]);
        this.form.patchValue({ proveedor_id: proveedor.id });
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    const v = this.form.value;
    const payload = {
      nombre:        v.nombre,
      categoria:     v.categoria || null,
      unidad_medida: v.unidad_medida,
      stock_minimo:  v.stock_minimo,
      proveedor_id:  v.proveedor_id,
    };

    const op$ = this.data.insumo
      ? this.service.actualizarInsumo(this.data.insumo.id, payload)
      : this.service.crearInsumo(payload);

    op$.subscribe({
      next: (insumo) => {
        this.guardando.set(false);
        this.dialogRef.close(insumo);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar el insumo.');
      },
    });
  }
}
