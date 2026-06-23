import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Sucursal } from './sucursal.interface';
import { SucursalService } from './sucursal.service';
import { SucursalFormDialogComponent } from './dialogs/sucursal-form/sucursal-form-dialog.component';
import { SucursalUsuariosDialogComponent } from './dialogs/sucursal-usuarios/sucursal-usuarios-dialog.component';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.scss'],
})
export class SucursalesComponent implements OnInit {
  sucursales = signal<Sucursal[]>([]);
  cargando = signal<boolean>(true);
  cargandoAccion = signal<number | null>(null);

  private service = inject(SucursalService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.cargarSucursales();
  }

  cargarSucursales(): void {
    this.cargando.set(true);
    this.service.getAll().subscribe({
      next: (res) => {
        this.sucursales.set(res.data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void {
    const ref = this.dialog.open(SucursalFormDialogComponent, {
      data: { sucursal: null },
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
    });

    ref.afterClosed().subscribe((nueva: Sucursal) => {
      if (nueva) {
        this.sucursales.update((list) => [...list, nueva]);
      }
    });
  }

  abrirEditar(sucursal: Sucursal): void {
    const ref = this.dialog.open(SucursalFormDialogComponent, {
      data: { sucursal },
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
    });

    ref.afterClosed().subscribe((actualizada: Sucursal) => {
      if (actualizada) {
        this.sucursales.update((list) =>
          list.map((s) => (s.id === actualizada.id ? actualizada : s))
        );
      }
    });
  }

  abrirGestionUsuarios(sucursal: Sucursal): void {
    const ref = this.dialog.open(SucursalUsuariosDialogComponent, {
      data: { sucursal },
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
    });

    ref.afterClosed().subscribe(() => {
      // Recargar para actualizar el contador de usuarios
      this.cargarSucursales();
    });
  }

  eliminar(sucursal: Sucursal): void {
    if (!confirm(`¿Eliminar la sucursal "${sucursal.nombre}"?`)) return;

    this.cargandoAccion.set(sucursal.id);
    this.service.eliminar(sucursal.id).subscribe({
      next: () => {
        this.sucursales.update((list) => list.filter((s) => s.id !== sucursal.id));
        this.cargandoAccion.set(null);
      },
      error: (err) => {
        alert(err?.error?.message ?? 'Error al eliminar');
        this.cargandoAccion.set(null);
      },
    });
  }
}
