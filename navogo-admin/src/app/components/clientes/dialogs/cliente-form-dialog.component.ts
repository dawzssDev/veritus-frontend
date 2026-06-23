import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ClientesService } from '../../../services/clientes/clientes.service';
import { Cliente } from '../../../models/cliente.interface';

export interface ClienteFormData {
  cliente?: Cliente;
}

@Component({
  selector: 'app-cliente-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">{{ data?.cliente ? 'edit' : 'person_add' }}</mat-icon>
      <h2 mat-dialog-title>{{ data?.cliente ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" class="cliente-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre completo</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput formControlName="nombre" placeholder="Ej. Juan García">
          @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Teléfono</mat-label>
          <mat-icon matPrefix>phone</mat-icon>
          <input matInput formControlName="telefono" placeholder="Ej. 5551234567">
          @if (form.get('telefono')?.hasError('required') && form.get('telefono')?.touched) {
            <mat-error>El teléfono es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Correo electrónico (opcional)</mat-label>
          <mat-icon matPrefix>email</mat-icon>
          <input matInput formControlName="email" placeholder="correo@ejemplo.com" type="email">
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <mat-error>Correo no válido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas (opcional)</mat-label>
          <mat-icon matPrefix>notes</mat-icon>
          <textarea matInput formControlName="notas" rows="3" placeholder="Preferencias, alergias, etc."></textarea>
        </mat-form-field>

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close()" [disabled]="guardando()">
        Cancelar
      </button>
      <button
        mat-raised-button
        class="btn-guardar"
        (click)="guardar()"
        [disabled]="form.invalid || guardando()">
        @if (guardando()) {
          <mat-spinner diameter="18" class="spinner-inline"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon>
        }
        {{ data?.cliente ? 'Actualizar' : 'Registrar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 24px 0;
      background: linear-gradient(135deg, #1A1A11 0%, #1C8C40 100%);
      margin: -24px -24px 0;
      border-radius: 4px 4px 0 0;

      .header-icon { color: #fff; font-size: 26px; width: 26px; height: 26px; }

      h2 {
        color: #fff;
        margin: 0;
        padding: 20px 0 20px !important;
        font-size: 18px;
        font-weight: 600;
      }
    }

    mat-dialog-content { padding-top: 20px !important; }

    .cliente-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 320px;
    }

    .full-width { width: 100%; }

    .form-error {
      color: #e53935;
      font-size: 13px;
      margin: 0;
      padding: 8px 12px;
      background: rgba(229,57,53,0.08);
      border-radius: 6px;
    }

    .btn-guardar {
      background: #1C8C40 !important;
      color: white !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .spinner-inline { display: inline-block; }

    mat-dialog-actions { padding: 12px 24px 20px; }
  `]
})
export class ClienteFormDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ClienteFormDialogComponent>);
  private clientesService = inject(ClientesService);
  private fb = inject(FormBuilder);

  guardando = signal(false);
  error = signal('');

  form = this.fb.group({
    nombre:   ['', Validators.required],
    telefono: ['', Validators.required],
    email:    ['', Validators.email],
    notas:    [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: ClienteFormData) {}

  ngOnInit(): void {
    if (this.data?.cliente) {
      this.form.patchValue({
        nombre:   this.data.cliente.nombre,
        telefono: this.data.cliente.telefono,
        email:    this.data.cliente.email ?? '',
        notas:    this.data.cliente.notas ?? '',
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    this.error.set('');

    const payload = this.form.value as Partial<Cliente>;
    const op$ = this.data?.cliente
      ? this.clientesService.actualizar(this.data.cliente.id, payload)
      : this.clientesService.crear(payload);

    op$.subscribe({
      next: (cliente) => {
        this.guardando.set(false);
        this.dialogRef.close(cliente);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar. Intenta de nuevo.');
      }
    });
  }
}
