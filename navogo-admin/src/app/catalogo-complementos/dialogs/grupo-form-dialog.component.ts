import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormArray, FormGroup, FormControl,
  ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import {
  CatalogoComplementosService,
  GrupoComplementoPayload,
} from '../../services/catalogo-complementos/catalogo-complementos.service';
import { ProductAdicionalGroup, ProductAdicionalOption } from '../../models/business.interface';

@Component({
  selector: 'app-grupo-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ esEdicion ? 'Editar grupo' : 'Nuevo grupo' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Título del grupo</mat-label>
          <input matInput formControlName="titulo" placeholder="Ej. Tamaño, Tipo de leche...">
          @if (form.get('titulo')?.hasError('required') && form.get('titulo')?.touched) {
            <mat-error>El título es obligatorio</mat-error>
          }
        </mat-form-field>

        <div class="opciones-header">
          <span>Opciones</span>
          <button mat-stroked-button type="button" (click)="addOpcion()">
            <mat-icon>add</mat-icon> Agregar
          </button>
        </div>

        <div formArrayName="opciones" class="opciones-list">
          @for (opCtrl of opcionesArray.controls; track $index; let i = $index) {
            <div [formGroupName]="i" class="opcion-row">
              <mat-form-field appearance="outline" class="opcion-extra">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="extra" placeholder="Ej. Grande">
              </mat-form-field>

              <mat-form-field appearance="outline" class="opcion-precio">
                <mat-label>Precio extra</mat-label>
                <input matInput type="number" formControlName="precio" min="0" placeholder="0">
              </mat-form-field>

              <mat-slide-toggle formControlName="estatus" class="opcion-toggle">
                Activo
              </mat-slide-toggle>

              <button mat-icon-button type="button" color="warn" (click)="removeOpcion(i)"
                [disabled]="opcionesArray.length <= 1">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          }
        </div>

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="guardando()">
        {{ guardando() ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 420px; padding-bottom: 8px; }
    .full-width { width: 100%; }
    .opciones-header {
      display: flex; align-items: center; justify-content: space-between;
      font-weight: 500; margin-bottom: 8px;
    }
    .opciones-list { display: flex; flex-direction: column; gap: 8px; }
    .opcion-row { display: flex; align-items: center; gap: 8px; }
    .opcion-extra { flex: 2; }
    .opcion-precio { flex: 1; }
    .opcion-toggle { flex-shrink: 0; }
    .error-msg { color: #d32f2f; font-size: 13px; margin-top: 8px; }
  `],
})
export class GrupoFormDialogComponent {
  guardando = signal(false);
  error = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private service = inject(CatalogoComplementosService);
  dialogRef = inject(MatDialogRef<GrupoFormDialogComponent>);
  data = inject<{ grupo: ProductAdicionalGroup | null }>(MAT_DIALOG_DATA);

  get esEdicion(): boolean { return !!this.data.grupo; }

  form: FormGroup = this.fb.group({
    titulo: [this.data.grupo?.titulo ?? '', Validators.required],
    opciones: this.fb.array(
      (this.data.grupo?.opciones ?? [{ extra: '', precio: null, estatus: true }])
        .map(o => this.makeOpcionGroup(o))
    ),
  });

  get opcionesArray(): FormArray { return this.form.get('opciones') as FormArray; }

  private makeOpcionGroup(o: Partial<ProductAdicionalOption> = {}): FormGroup {
    return this.fb.group({
      extra:       [o.extra ?? ''],
      precio:      [o.precio ?? null],
      precioExtra: [(o as ProductAdicionalOption)['precio-extra'] ?? null],
      estatus:     [o.estatus ?? true],
    });
  }

  addOpcion(): void {
    this.opcionesArray.push(this.makeOpcionGroup());
  }

  removeOpcion(i: number): void {
    if (this.opcionesArray.length > 1) this.opcionesArray.removeAt(i);
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);

    const val = this.form.value;
    const payload: GrupoComplementoPayload = {
      titulo: val.titulo.trim(),
      opciones: val.opciones
        .filter((o: { extra?: string }) => (o.extra ?? '').trim().length > 0)
        .map((o: { extra: string; precio: unknown; precioExtra: unknown; estatus: boolean }) => ({
          extra: o.extra.trim(),
          precio: o.precio != null && o.precio !== '' ? Number(o.precio) : null,
          'precio-extra':
            o.precioExtra != null && o.precioExtra !== ''
              ? Number(o.precioExtra)
              : null,
          estatus: !!o.estatus,
        })),
    };

    const catalogoId =
      this.data.grupo?.catalogo_id ??
      (typeof this.data.grupo?.id === 'number' ? this.data.grupo.id : null);

    const req$ = this.esEdicion && catalogoId != null
      ? this.service.actualizarGrupo(catalogoId, payload)
      : this.service.crearGrupo(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close({
          id: res.id,
          catalogo_id: res.id,
          titulo: res.titulo,
          opciones: res.opciones,
        } satisfies ProductAdicionalGroup);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar');
      },
    });
  }

  cancelar(): void { this.dialogRef.close(null); }
}
