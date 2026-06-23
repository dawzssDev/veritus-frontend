import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Material
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Library's external
import Swal from 'sweetalert2';
import { Categorias } from '../../../services/categorias/categorias';

@Component({
  selector: 'app-categorias-nuevo',
  imports: [
    CommonModule,
    MatButtonModule,
    ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatIconModule,
    MatCardModule, MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './categorias-nuevo.html',
  styleUrl: './categorias-nuevo.css',
})
export class CategoriasNuevo {
  providersArray: any[] = [];
  
    form: FormGroup;
    id: number = 0;
    isLoading: boolean = false;
    isSaving: boolean = false;
  
    title: string = 'Agregar Nueva Categoria';
    nameButton: string = 'Agregar Categoria';
    pageSubtitle: string = 'Registra la información de la categoría';
  
    constructor(
      private fb: FormBuilder,
      private categoriasService: Categorias,
      private route: ActivatedRoute,
      private router: Router,
      @Optional() @Inject(MAT_DIALOG_DATA) public data?: { id?: number }
    ) {
      this.form = this.fb.group({
        nombre: ['', Validators.required],
        descripcion: ['', Validators.required],
        estatus: [true]
      });

      const dialogId = Number(this.data?.id);
      const routeId = Number(this.route.snapshot.paramMap.get('id'));
      const resolvedId = dialogId || routeId;

      if (!isNaN(resolvedId) && resolvedId > 0) {
        this.id = resolvedId;
        this.get();
        this.title = 'Editar Categoria';
        this.nameButton = 'Editar Categoria';
      }
  
    }
  
    ngOnInit(): void {
      
    }
  
    get(): void {
      this.isLoading = true;
      this.categoriasService.getById(this.id).subscribe({
        next: (res: any) => {
          this.providersArray = res;

          const estatusBool = this.coerceBoolean(res?.estatus, true);
    
          this.form.patchValue({
            nombre: res.nombre,
            descripcion: res.descripcion,
            estatus: estatusBool,
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar la categoría:', err);
          this.isLoading = false;
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar la categoría.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }

    private coerceBoolean(input: any, fallback: boolean): boolean {
      if (input === true || input === false) return input;
      if (input == null) return fallback;
      const s = String(input).trim().toLowerCase();
      if (s === '1' || s === 'true' || s === 'activo') return true;
      if (s === '0' || s === 'false' || s === 'inactivo') return false;
      return fallback;
    }
  
    submitType(): void {
      if (!this.form.valid) {
        Swal.fire({
          title: 'Formulario incompleto',
          text: 'Por favor completa todos los campos requeridos.',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      this.isSaving = true;
      if (!isNaN(this.id) && this.id > 0) {
        this.onUpdate();
      } else {
        this.onSubmit();
      }
    }

    cancel(): void {
      this.router.navigate(['/categorias']);
    }
  
    onSubmit(): void {
      const payload = {
        ...this.form.value,
        estatus: this.form.value.estatus ? 1 : 0,
      };

      this.categoriasService.post(payload).subscribe({
        next: () => {
          this.isSaving = false;
          Swal.fire({
            title: '¡Listo!',
            text: 'Categoría creada correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true,
          }).then(() => {
            this.router.navigate(['/categorias']);
          });
        },
        error: (err) => {
          console.error('Error al crear categoría:', err);
          this.isSaving = false;
          Swal.fire({
            title: 'Error',
            text: 'No se pudo crear la categoría.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });
        },
      });
    }

  
    onUpdate(): void {
      const payload = {
        ...this.form.value,
        id: this.id,
        estatus: this.form.value.estatus ? 1 : 0,
      };

      this.categoriasService.update(this.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          Swal.fire({
            title: '¡Listo!',
            text: 'Categoría actualizada correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true,
          }).then(() => {
            this.router.navigate(['/categorias']);
          });
        },
        error: (err) => {
          console.error('Error al actualizar categoría:', err);
          this.isSaving = false;
          Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar la categoría.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });
        },
      });
    }
}
