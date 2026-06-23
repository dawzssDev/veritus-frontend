import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Mesa } from '../../../../models/mesa.interface';
import { MesaService } from '../../../../services/mesas/mesa.service';

interface DialogData {
  mesa?: Mesa;
}

@Component({
  selector: 'app-crear-editar-mesa-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './crear-editar-mesa.dialog.html',
  styleUrl: './crear-editar-mesa.dialog.scss'
})
export class CrearEditarMesaDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CrearEditarMesaDialogComponent>);
  public data = inject<DialogData>(MAT_DIALOG_DATA);
  private mesaService = inject(MesaService);

  guardando = signal(false);
  errorMensaje = signal('');
  
  form = new FormGroup({
    identificador: new FormControl('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    capacidad: new FormControl(4, [
      Validators.required,
      Validators.min(1),
      Validators.max(12)
    ]),
    zona: new FormControl(''),
    nombreCliente: new FormControl('')
  });

  get esEdicion(): boolean {
    return !!this.data.mesa;
  }

  get titulo(): string {
    return this.esEdicion 
      ? `Editar mesa — ${this.data.mesa?.identificador}` 
      : 'Nueva mesa';
  }

  get mostrarCliente(): boolean {
    return this.esEdicion && 
           (this.data.mesa?.estado === 'ocupada' || 
            this.data.mesa?.estado === 'cuenta_pendiente');
  }

  ngOnInit() {
    if (this.data.mesa) {
      this.form.patchValue({
        identificador: this.data.mesa.identificador,
        capacidad: this.data.mesa.capacidad,
        zona: this.data.mesa.zona ?? '',
        nombreCliente: this.data.mesa.nombreCliente ?? ''
      });
    }
  }

  incrementarCapacidad() {
    const actual = this.form.get('capacidad')?.value ?? 4;
    if (actual < 12) {
      this.form.patchValue({ capacidad: actual + 1 });
    }
  }

  decrementarCapacidad() {
    const actual = this.form.get('capacidad')?.value ?? 4;
    if (actual > 1) {
      this.form.patchValue({ capacidad: actual - 1 });
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set('');

    const payload: any = {
      identificador: this.form.value.identificador!,
      capacidad: this.form.value.capacidad!,
      zona: this.form.value.zona || null,
      nombreCliente: this.form.value.nombreCliente || null
    };

    // Si es creación, agregar posiciones iniciales y dimensiones
    if (!this.esEdicion) {
      payload.posicion_x = 100;
      payload.posicion_y = 100;
      payload.ancho = 120;
      payload.alto = 120;
    }

    const request$ = this.esEdicion
      ? this.mesaService.update(this.data.mesa!.id, payload)
      : this.mesaService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.dialogRef.close(res.data);
      },
      error: (err) => {
        this.guardando.set(false);
        
        // Manejar errores específicos del API
        if (err.error?.message) {
          this.errorMensaje.set(err.error.message);
        } else if (err.error?.errors?.identificador) {
          this.errorMensaje.set('Este identificador ya está en uso');
          this.form.get('identificador')?.setErrors({ duplicado: true });
        } else {
          this.errorMensaje.set('Error al guardar la mesa. Intenta nuevamente.');
        }
      }
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
