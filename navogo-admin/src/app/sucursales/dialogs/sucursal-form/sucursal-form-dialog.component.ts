import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { Sucursal } from '../../sucursal.interface';
import { SucursalService } from '../../sucursal.service';

@Component({
  selector: 'app-sucursal-form-dialog',
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
  templateUrl: './sucursal-form-dialog.component.html',
  styleUrls: ['./sucursal-form-dialog.component.scss'],
})
export class SucursalFormDialogComponent {
  guardando = signal<boolean>(false);
  error = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private service = inject(SucursalService);
  dialogRef = inject(MatDialogRef<SucursalFormDialogComponent>);
  data = inject<{ sucursal: Sucursal | null }>(MAT_DIALOG_DATA);

  get esEdicion(): boolean {
    return !!this.data.sucursal;
  }

  form: FormGroup = this.fb.group({
    nombre: [this.data.sucursal?.nombre ?? '', Validators.required],
    direccion: [this.data.sucursal?.direccion ?? ''],
    telefono: [this.data.sucursal?.telefono ?? ''],
    estatus: [this.data.sucursal?.estatus ?? true],
  });

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);

    const payload = this.form.value;
    const req$ = this.esEdicion
      ? this.service.actualizar(this.data.sucursal!.id, payload)
      : this.service.crear(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar');
      },
    });
  }
}
