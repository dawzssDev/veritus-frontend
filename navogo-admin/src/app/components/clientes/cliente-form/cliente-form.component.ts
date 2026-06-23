import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormBuilder, FormArray, FormGroup, Validators,
  ReactiveFormsModule, AbstractControl
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import Swal from 'sweetalert2';
import { ClientesService } from '../../../services/clientes/clientes.service';
import { Cliente, Direccion } from '../../../models/cliente.interface';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.scss',
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private clientesService = inject(ClientesService);

  modoEditar = signal(false);
  clienteId = signal<number | null>(null);
  cargando = signal(false);
  guardando = signal(false);

  // IDs de direcciones existentes que el usuario eliminó en este formulario
  private dirIdsEliminadas: number[] = [];

  form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.minLength(2)]],
    telefono:    ['', Validators.required],
    email:       [''],
    notas:       [''],
    direcciones: this.fb.array([]),
  });

  get dirs(): FormArray {
    return this.form.get('direcciones') as FormArray;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEditar.set(true);
      this.clienteId.set(+idParam);
      this.cargarCliente(+idParam);
    } else {
      this.agregarDireccion(true);
    }
  }

  private cargarCliente(id: number): void {
    this.cargando.set(true);
    this.clientesService.getById(id).subscribe({
      next: (c: Cliente) => {
        this.form.patchValue({
          nombre:   c.nombre,
          telefono: c.telefono,
          email:    c.email ?? '',
          notas:    c.notas ?? '',
        });
        (c.direcciones ?? []).forEach(dir => this.dirs.push(this.crearDirGroup(dir)));
        if (this.dirs.length === 0) this.agregarDireccion(true);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        Swal.fire('Error', err?.error?.message ?? 'No se pudo cargar el cliente', 'error');
      }
    });
  }

  private crearDirGroup(dir?: Partial<Direccion>): FormGroup {
    return this.fb.group({
      dirId:        [dir?.id ?? null],
      alias:        [dir?.alias ?? '', Validators.required],
      calle:        [dir?.calle ?? '', Validators.required],
      colonia:      [dir?.colonia ?? '', Validators.required],
      ciudad:       [dir?.ciudad ?? '', Validators.required],
      referencia:   [dir?.referencia ?? ''],
      predeterminada: [dir?.predeterminada ?? false],
    });
  }

  agregarDireccion(predeterminada = false): void {
    this.dirs.push(this.crearDirGroup({ predeterminada }));
  }

  eliminarDireccion(i: number): void {
    const group = this.dirs.at(i) as FormGroup;
    const dirId = group.get('dirId')?.value as number | null;
    const eraPred = group.get('predeterminada')?.value as boolean;

    if (dirId) this.dirIdsEliminadas.push(dirId);
    this.dirs.removeAt(i);

    if (eraPred && this.dirs.length > 0) {
      this.setPredeterminada(0);
    }
  }

  setPredeterminada(idx: number): void {
    this.dirs.controls.forEach((ctrl, i) => {
      ctrl.get('predeterminada')?.setValue(i === idx, { emitEvent: false });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const payload = {
      nombre:   val.nombre!.trim(),
      telefono: val.telefono!.trim(),
      email:    val.email?.trim() || null,
      notas:    val.notas?.trim() || null,
    };

    this.guardando.set(true);
    this.modoEditar() ? this.actualizar(payload) : this.crear(payload);
  }

  private crear(payload: Partial<Cliente>): void {
    this.clientesService.crear(payload).subscribe({
      next: (nuevo) => {
        const dirs = (this.form.value.direcciones ?? []) as any[];
        const validas = dirs.filter(d => d.alias && d.calle && d.colonia && d.ciudad);

        if (validas.length === 0) {
          this.exito('creado');
          return;
        }

        forkJoin(validas.map(d =>
          this.clientesService.agregarDireccion(nuevo.id, {
            alias:         d.alias,
            calle:         d.calle,
            colonia:       d.colonia,
            ciudad:        d.ciudad,
            referencia:    d.referencia,
            predeterminada: d.predeterminada,
          })
        )).subscribe({
          next: () => this.exito('creado'),
          error: () => this.exito('creado'), // cliente creado aunque falle alguna dirección
        });
      },
      error: (err) => {
        this.guardando.set(false);
        Swal.fire('Error', err?.error?.message ?? 'No se pudo crear el cliente', 'error');
      }
    });
  }

  private actualizar(payload: Partial<Cliente>): void {
    const id = this.clienteId()!;
    this.clientesService.actualizar(id, payload).subscribe({
      next: () => {
        const dirs = (this.form.value.direcciones ?? []) as any[];
        const deleteOps = this.dirIdsEliminadas.map(dId =>
          this.clientesService.eliminarDireccion(id, dId)
        );
        const addOps = dirs
          .filter(d => !d.dirId && d.alias && d.calle && d.colonia && d.ciudad)
          .map(d => this.clientesService.agregarDireccion(id, {
            alias:         d.alias,
            calle:         d.calle,
            colonia:       d.colonia,
            ciudad:        d.ciudad,
            referencia:    d.referencia,
            predeterminada: d.predeterminada,
          }));
        const updateOps = dirs
          .filter(d => d.dirId && d.alias && d.calle && d.colonia && d.ciudad)
          .map(d => this.clientesService.actualizarDireccion(id, d.dirId, {
            alias:         d.alias,
            calle:         d.calle,
            colonia:       d.colonia,
            ciudad:        d.ciudad,
            referencia:    d.referencia,
            predeterminada: d.predeterminada,
          }));

        const all = [...deleteOps, ...addOps, ...updateOps];
        if (all.length === 0) { this.exito('actualizado'); return; }

        forkJoin(all).subscribe({
          next:  () => this.exito('actualizado'),
          error: () => this.exito('actualizado'),
        });
      },
      error: (err) => {
        this.guardando.set(false);
        Swal.fire('Error', err?.error?.message ?? 'No se pudo actualizar el cliente', 'error');
      }
    });
  }

  private exito(accion: 'creado' | 'actualizado'): void {
    this.guardando.set(false);
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    const rutas: Record<string, string> = {
      'ventas-mostrador': '/ventas-mostrador',
      'levantar-orden':   '/levantar-orden',
    };

    const destino = returnTo && rutas[returnTo] ? rutas[returnTo] : '/clientes';

    Swal.fire({
      icon: 'success',
      title: accion === 'creado' ? '¡Cliente registrado!' : '¡Cliente actualizado!',
      showConfirmButton: false,
      timer: 1400,
    }).then(() => this.router.navigate([destino]));
  }

  volver(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/clientes']);
    }
  }

  // Helpers para template
  ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  dirCtrl(i: number, name: string): AbstractControl {
    return (this.dirs.at(i) as FormGroup).get(name)!;
  }

  err(ctrl: AbstractControl, error: string): boolean {
    return ctrl.hasError(error) && ctrl.touched;
  }
}
