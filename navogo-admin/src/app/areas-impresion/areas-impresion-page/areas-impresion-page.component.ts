import {
  Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule }
  from '@angular/material/button';
import { MatFormFieldModule }
  from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule }
  from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }
  from '@angular/material/progress-spinner';
import { MatDividerModule }
  from '@angular/material/divider';
import { MatTooltipModule }
  from '@angular/material/tooltip';

import { AreasImpresionService }
  from '../areas-impresion.service';
import {
  AreaImpresion, CategoriaConArea
} from '../areas-impresion.interface';

@Component({
  selector: 'app-areas-impresion-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatSnackBarModule, MatProgressSpinnerModule,
    MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './areas-impresion-page.component.html',
  styleUrl: './areas-impresion-page.component.scss',
})
export class AreasImpresionPageComponent
  implements OnInit {

  private service = inject(AreasImpresionService);
  private snackBar = inject(MatSnackBar);

  areas            = signal<AreaImpresion[]>([]);
  sinArea          = signal<CategoriaConArea[]>([]);
  cargando         = signal(false);
  guardando        = signal(false);
  areaEditando     = signal<number | null>(null);

  formNombre      = '';
  formDescripcion = '';

  editNombre      = '';
  editDescripcion = '';

  categoriasSeleccionadas = signal<number[]>([]);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.getAreas().subscribe({
      next: (res) => {
        this.areas.set(res.data ?? []);
        this.cargando.set(false);
        this.cargarSinArea();
      },
      error: () => this.cargando.set(false),
    });
  }

  cargarSinArea(): void {
    this.service.categoriasSinArea().subscribe({
      next: (res) => this.sinArea.set(res.data ?? []),
    });
  }

  crearArea(): void {
    if (!this.formNombre.trim()) return;
    this.guardando.set(true);
    this.service.crearArea({
      nombre:      this.formNombre.trim(),
      descripcion: this.formDescripcion.trim()
        || undefined,
      orden: this.areas().length,
    }).subscribe({
      next: () => {
        this.formNombre      = '';
        this.formDescripcion = '';
        this.guardando.set(false);
        this.toast('Área creada correctamente');
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.toast('Error al crear el área', true);
      },
    });
  }

  iniciarEdicion(area: AreaImpresion): void {
    this.areaEditando.set(area.id);
    this.editNombre      = area.nombre;
    this.editDescripcion = area.descripcion ?? '';
  }

  guardarEdicion(area: AreaImpresion): void {
    this.guardando.set(true);
    this.service.actualizarArea(area.id, {
      nombre:      this.editNombre.trim(),
      descripcion: this.editDescripcion.trim()
        || undefined,
    }).subscribe({
      next: () => {
        this.areaEditando.set(null);
        this.guardando.set(false);
        this.toast('Área actualizada');
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.toast('Error al actualizar', true);
      },
    });
  }

  eliminarArea(area: AreaImpresion): void {
    if (!confirm(
      `¿Eliminar el área "${area.nombre}"?\n` +
      `Las categorías asignadas quedarán sin área.`
    )) return;

    this.service.eliminarArea(area.id).subscribe({
      next: () => {
        this.toast('Área eliminada');
        this.cargar();
      },
      error: () => this.toast('Error al eliminar', true),
    });
  }

  toggleCategoria(id: number): void {
    const actual = this.categoriasSeleccionadas();
    if (actual.includes(id)) {
      this.categoriasSeleccionadas.set(
        actual.filter(c => c !== id)
      );
    } else {
      this.categoriasSeleccionadas.set([...actual, id]);
    }
  }

  asignarCategoriasAArea(area: AreaImpresion): void {
    const sel = this.categoriasSeleccionadas();
    if (sel.length === 0) return;

    this.service.asignarCategorias(area.id, sel)
      .subscribe({
        next: () => {
          this.categoriasSeleccionadas.set([]);
          this.toast(
            `${sel.length} categoría(s) asignadas`
          );
          this.cargar();
        },
        error: () =>
          this.toast('Error al asignar', true),
      });
  }

  desasignarCategoria(
    categoriaId: number
  ): void {
    this.service.asignarCategorias(
      null, [categoriaId]
    ).subscribe({
      next: () => {
        this.toast('Categoría desasignada');
        this.cargar();
      },
    });
  }

  private toast(
    msg: string, esError = false
  ): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: esError ? ['snack-error'] : [],
    });
  }
}
