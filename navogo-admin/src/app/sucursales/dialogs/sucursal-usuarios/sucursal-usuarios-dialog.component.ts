import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Sucursal, UsuarioSucursal } from '../../sucursal.interface';
import { SucursalService } from '../../sucursal.service';
import { Usuarios } from '../../../services/usuarios/usuarios';

@Component({
  selector: 'app-sucursal-usuarios-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './sucursal-usuarios-dialog.component.html',
  styleUrls: ['./sucursal-usuarios-dialog.component.scss'],
})
export class SucursalUsuariosDialogComponent implements OnInit {
  private usuarioService = inject(Usuarios);
  private sucursalService = inject(SucursalService);
  dialogRef = inject(MatDialogRef<SucursalUsuariosDialogComponent>);
  data = inject<{ sucursal: Sucursal }>(MAT_DIALOG_DATA);

  sucursal = signal<Sucursal>(this.data.sucursal);
  todosUsuarios = signal<UsuarioSucursal[]>([]);
  cargando = signal<boolean>(true);
  procesando = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    // Cargar todos los usuarios de la empresa
    this.usuarioService.get().subscribe({
      next: (res) => {
        // Mapear la respuesta del servicio al formato esperado
        const usuarios = (res as any[]).map((u: any) => ({
          id: u.id,
          nombreCompleto: u.nombreCompleto || u.nombre || 'Sin nombre',
          email: u.email,
          sucursal_id: u.sucursal_id ?? null,
        }));
        this.todosUsuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // Usuarios ya asignados a esta sucursal
  usuariosAsignados = computed(() =>
    this.todosUsuarios().filter((u) => u.sucursal_id === this.sucursal().id)
  );

  // Usuarios sin sucursal o de otra sucursal (disponibles para asignar)
  usuariosDisponibles = computed(() =>
    this.todosUsuarios().filter(
      (u) => !u.sucursal_id || u.sucursal_id !== this.sucursal().id
    )
  );

  asignar(usuario: UsuarioSucursal): void {
    this.procesando.set(usuario.id);
    this.sucursalService
      .asignarUsuario(this.sucursal().id, { usuario_id: usuario.id })
      .subscribe({
        next: () => {
          this.todosUsuarios.update((list) =>
            list.map((u) =>
              u.id === usuario.id ? { ...u, sucursal_id: this.sucursal().id } : u
            )
          );
          this.procesando.set(null);
        },
        error: () => this.procesando.set(null),
      });
  }

  remover(usuario: UsuarioSucursal): void {
    this.procesando.set(usuario.id);
    this.sucursalService.removerUsuario(usuario.id).subscribe({
      next: () => {
        this.todosUsuarios.update((list) =>
          list.map((u) => (u.id === usuario.id ? { ...u, sucursal_id: null } : u))
        );
        this.procesando.set(null);
      },
      error: () => this.procesando.set(null),
    });
  }
}
