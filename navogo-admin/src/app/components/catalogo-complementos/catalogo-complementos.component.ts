import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import {
  CatalogoComplementosService,
  GrupoComplemento,
  GrupoComplementoPayload,
  OpcionComplemento,
} from '../../services/catalogo-complementos/catalogo-complementos.service';

@Component({
  selector: 'app-catalogo-complementos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './catalogo-complementos.component.html',
  styleUrl: './catalogo-complementos.component.scss',
})
export class CatalogoComplementosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(CatalogoComplementosService);
  private router = inject(Router);

  cargando = signal(false);
  guardandoGrupoIdx = signal<number | null>(null);
  sincronizando = signal(false);

  form = this.fb.group({
    grupos: this.fb.array([]),
  });

  get grupos(): FormArray {
    return this.form.get('grupos') as FormArray;
  }

  grupoAt(i: number): FormGroup {
    return this.grupos.at(i) as FormGroup;
  }

  opcionesAt(i: number): FormArray {
    return this.grupoAt(i).get('opciones') as FormArray;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.getCatalogo().subscribe({
      next: (grupos) => {
        this.grupos.clear();
        grupos.forEach((g) => this.hydratarGrupo(g));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private hydratarGrupo(g: GrupoComplemento): void {
    const grupo = this.fb.group({
      id: [g.id as number],
      titulo: [g.titulo, [Validators.required, Validators.minLength(2)]],
      opciones: this.fb.array([]),
    });
    this.grupos.push(grupo);
    const idx = this.grupos.length - 1;
    g.opciones.forEach((o) => this.hydratarOpcion(idx, o));
  }

  private hydratarOpcion(grupoIdx: number, o: OpcionComplemento): void {
    const opcion = this.fb.group({
      extra: [o.extra, Validators.required],
      estatus: [o.estatus ?? true],
      precio: [o.precio ?? null],
      precioExtra: [o['precio-extra'] ?? null],
    });
    this.opcionesAt(grupoIdx).push(opcion);
  }

  agregarGrupo(): void {
    const grupo = this.fb.group({
      id: [null as number | null],
      titulo: ['', [Validators.required, Validators.minLength(2)]],
      opciones: this.fb.array([]),
    });
    this.grupos.push(grupo);
    this.agregarOpcion(this.grupos.length - 1);
  }

  eliminarGrupo(i: number): void {
    const grupo = this.grupoAt(i);
    const id = grupo.get('id')?.value as number | null;

    if (id == null) {
      this.grupos.removeAt(i);
      return;
    }

    Swal.fire({
      title: '¿Eliminar grupo?',
      text: 'Se eliminará del catálogo global. Los productos vinculados no se actualizarán hasta sincronizar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.service.eliminarGrupo(id).subscribe({
        next: () => {
          this.grupos.removeAt(i);
          Swal.fire('Eliminado', 'Grupo eliminado del catálogo.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el grupo.', 'error'),
      });
    });
  }

  agregarOpcion(grupoIdx: number): void {
    const opcion = this.fb.group({
      extra: ['', Validators.required],
      estatus: [true],
      precio: [null],
      precioExtra: [null],
    });
    this.opcionesAt(grupoIdx).push(opcion);
  }

  eliminarOpcion(grupoIdx: number, opIdx: number): void {
    this.opcionesAt(grupoIdx).removeAt(opIdx);
  }

  scrollToGrupo(i: number): void {
    document.getElementById('grupo-' + i)?.scrollIntoView({ behavior: 'smooth' });
  }

  guardarGrupo(i: number): void {
    const grupo = this.grupoAt(i);
    if (grupo.invalid || this.guardandoGrupoIdx() !== null) return;

    const payload = this.serializarGrupo(i);
    if (!payload) {
      Swal.fire('Datos incompletos', 'Agrega título y al menos una opción válida.', 'warning');
      return;
    }

    const id = grupo.get('id')?.value as number | null;
    this.guardandoGrupoIdx.set(i);

    const onSuccess = (res: GrupoComplemento) => {
      grupo.patchValue({ id: res.id });
      this.hydratarOpcionesDesdeApi(i, res.opciones);
      this.guardandoGrupoIdx.set(null);
      Swal.fire({
        title: 'Guardado',
        text: 'Grupo actualizado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
    };

    const onError = () => {
      this.guardandoGrupoIdx.set(null);
      Swal.fire('Error', 'No se pudo guardar el grupo.', 'error');
    };

    if (id == null) {
      this.service.crearGrupo(payload).subscribe({ next: onSuccess, error: onError });
    } else {
      this.service.actualizarGrupo(id, payload).subscribe({ next: onSuccess, error: onError });
    }
  }

  private hydratarOpcionesDesdeApi(grupoIdx: number, opciones: OpcionComplemento[]): void {
    const arr = this.opcionesAt(grupoIdx);
    arr.clear();
    opciones.forEach((o) => this.hydratarOpcion(grupoIdx, o));
  }

  async sincronizar(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Sincronizar productos?',
      text:
        'Todos los productos que usen estos complementos se actualizarán. ' +
        'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d97706',
    });

    if (!result.isConfirmed) return;

    const ids = this.grupos.controls
      .map((g) => (g as FormGroup).get('id')?.value as number | null)
      .filter((id): id is number => id != null);

    this.sincronizando.set(true);
    this.service.sincronizar(ids.length > 0 ? ids : undefined).subscribe({
      next: (res) => {
        this.sincronizando.set(false);
        Swal.fire({
          title: 'Sincronización completa',
          text: res.mensaje,
          icon: 'success',
        });
      },
      error: () => {
        this.sincronizando.set(false);
        Swal.fire('Error', 'No se pudo sincronizar.', 'error');
      },
    });
  }

  private serializarGrupo(i: number): GrupoComplementoPayload | null {
    const grupo = this.grupoAt(i);
    const titulo = (grupo.get('titulo')?.value ?? '').toString().trim();
    const opciones = (grupo.get('opciones') as FormArray).controls
      .map((o) => {
        const opcion = o as FormGroup;
        return {
          extra: (opcion.get('extra')?.value ?? '').toString().trim(),
          estatus: !!opcion.get('estatus')?.value,
          precio: this.toNullableNumber(opcion.get('precio')?.value),
          'precio-extra': this.toNullableNumber(opcion.get('precioExtra')?.value),
        } satisfies OpcionComplemento;
      })
      .filter((o) => o.extra.length > 0);

    if (titulo.length < 2 || opciones.length === 0) return null;
    return { titulo, opciones };
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  volver(): void {
    this.router.navigate(['/productos']);
  }
}
