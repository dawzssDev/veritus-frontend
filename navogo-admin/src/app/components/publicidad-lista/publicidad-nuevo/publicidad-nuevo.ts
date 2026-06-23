import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
// ----------------------------------------------------------------------
// Eliminado MatOptionModule para evitar error "token must be defined"

// Library's external
import Swal from 'sweetalert2';
import { Publicidades } from '../../../services/publicidades/publicidades';

@Component({
  selector: 'app-publicidad-nuevo',
  imports: [
    CommonModule,
    MatButtonModule, MatDialogModule,
    ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatSelectModule,
    MatCardModule
  ],
  templateUrl: './publicidad-nuevo.html',
  styleUrl: './publicidad-nuevo.css',
})
export class PublicidadNuevo {
 providersArray: any[] = [];
  
    form: FormGroup;
    id: number = 0;
    isActive: boolean = true;
    selectedFile: File | null = null;
  
    title: string = 'Agregar Nueva Publicidad';
    nameButton: string = 'Agregar Publicidad';
  
    constructor(private fb: FormBuilder,
      private publicidadesService: Publicidades,
      @Inject(MAT_DIALOG_DATA) public data: { id: number }
    ) {
      this.form = this.fb.group({
        titulo: ['', Validators.required],
        descripcion: [''],
        fecha_inicio: ['', Validators.required],
        fecha_fin: ['', Validators.required],
        estatus: [1]
      });
  
      if (this.data && this.data.id && !isNaN(this.data.id) && this.data.id > 0) {
        this.get();
        this.title = 'Editar Publicidad'
        this.nameButton = 'Editar Publicidad'
      }
  
    }
  
    ngOnInit(): void {
      
    }
  
    get(): void {
      this.publicidadesService.getById(this.data.id).subscribe((res: any)=> {
        this.providersArray = res;
  
        this.form.patchValue({
          titulo: res.titulo,
          descripcion: res.descripcion,
          fecha_inicio: res.fecha_inicio ? res.fecha_inicio.split(' ')[0] : '',
          fecha_fin: res.fecha_fin ? res.fecha_fin.split(' ')[0] : ''
        });
      })
    }

    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      }
    }
  
    submitType(): void {
      this.isActive = false;
      if (this.data && this.data.id && !isNaN(this.data.id) && this.data.id > 0) {
        this.onUpdate()
      } else {
        this.onSubmit()
      }
    }
  
    onSubmit(): void {
      if (!this.form.valid) {
        this.isActive = true;
        Swal.fire('Error', 'Completa los campos requeridos.', 'warning');
        return;
      }

      const formData = new FormData();

      // Agrega todos los campos del formulario (si son fechas nativas serán strings yyyy-mm-dd)
      Object.entries(this.form.value).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value as any);
        }
      });

      // Agrega la imagen seleccionada
      if (this.selectedFile) {
        formData.append('imagen', this.selectedFile);
      }

      this.publicidadesService.post(formData).subscribe(
        response => {
          Swal.fire({
            title: 'Éxito',
            text: '¡Publicidad creada correctamente!',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            window.location.reload();
          });
        },
        error => {
          this.isActive = true;
          Swal.fire({
            title: 'Error',
            text: 'No se pudo crear la publicidad.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      );
    }
  
    onUpdate(): void {
      if (this.form.valid) {
  
        const data = {
          ...this.form.value,
          id: this.data.id
        }
  
        this.publicidadesService.update(this.data.id, data).subscribe(
          response => {
            Swal.fire({
              title: 'Éxito',
              text: '¡Registro actualizado con exito!',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              if (result.isConfirmed) {
                window.location.reload()
                this.isActive = true;
              }
            });
          },
          error => {
            this.isActive = true;
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al registrar, por favor intente nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        );
      }
    }
}
