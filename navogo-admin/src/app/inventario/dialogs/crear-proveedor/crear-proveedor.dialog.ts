import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InventarioService } from '../../inventario.service';
import { Proveedor } from '../../inventario.interface';

@Component({
  selector: 'app-crear-proveedor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="header-icon">local_shipping</mat-icon>
        <h2>Nuevo proveedor</h2>
      </div>

      <div class="dialog-content">
        <form [formGroup]="form" class="form-grid">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej. Distribuidora ABC">
            @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
              <mat-error>El nombre es obligatorio</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Teléfono (opcional)</mat-label>
            <input matInput formControlName="telefono" placeholder="5551234567">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contacto (opcional)</mat-label>
            <input matInput formControlName="contacto" placeholder="Nombre del contacto">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notas (opcional)</mat-label>
            <textarea matInput formControlName="notas" rows="2"></textarea>
          </mat-form-field>

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
          Guardar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: min(88vh, 520px);
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);

      .header-icon {
        width: 26px; height: 26px; font-size: 26px; color: #0F4D2A;
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
      border-top: 1px solid rgba(0, 0, 0, 0.08);

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
export class CrearProveedorDialog {
  dialogRef = inject(MatDialogRef<CrearProveedorDialog, Proveedor>);
  private service = inject(InventarioService);
  private fb = inject(FormBuilder);

  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    nombre:   ['', Validators.required],
    telefono: [''],
    contacto: [''],
    notas:    [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: unknown) {}

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    const v = this.form.value;
    const payload = {
      nombre: v.nombre,
      telefono: v.telefono || null,
      contacto: v.contacto || null,
      notas: v.notas || null,
    };

    this.service.crearProveedor(payload).subscribe({
      next: (proveedor) => {
        this.guardando.set(false);
        this.dialogRef.close(proveedor);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar el proveedor.');
      },
    });
  }
}
