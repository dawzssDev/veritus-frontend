import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Mesa, EstadoMesa } from '../../../models/mesa.interface';
import { MesaService } from '../../../services/mesas/mesa.service';

@Component({
  selector: 'app-seleccionar-mesa-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './seleccionar-mesa-dialog.component.html',
  styleUrl: './seleccionar-mesa-dialog.component.scss',
})
export class SeleccionarMesaDialogComponent implements OnInit {
  private mesaService = inject(MesaService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<SeleccionarMesaDialogComponent>);

  // Signals
  mesas = signal<Mesa[]>([]);
  mesaSeleccionada = signal<Mesa | null>(null);
  cargando = signal<boolean>(false);
  filtroZona = signal<string>('todas');
  filtroEstado = signal<EstadoMesa | 'todas'>('todas');

  // Computed properties
  zonasDisponibles = computed(() => {
    const zonas = this.mesas()
      .map(m => m.zona)
      .filter(Boolean) as string[];
    return ['todas', ...new Set(zonas)];
  });

  mesasFiltradas = computed(() => {
    let filtradas = this.mesas();
    
    const zona = this.filtroZona();
    if (zona !== 'todas') {
      filtradas = filtradas.filter(m => m.zona === zona);
    }

    const estado = this.filtroEstado();
    if (estado !== 'todas') {
      filtradas = filtradas.filter(m => m.estado === estado);
    }

    return filtradas;
  });

  resumenEstados = computed(() => ({
    libres: this.mesas().filter(m => m.estado === 'libre').length,
    ocupadas: this.mesas().filter(m => m.estado === 'ocupada').length,
    cuentaPendiente: this.mesas().filter(m => m.estado === 'cuenta_pendiente').length,
    reservadas: this.mesas().filter(m => m.estado === 'reservada').length,
  }));

  ngOnInit(): void {
    this.cargarMesas();
  }

  cargarMesas(): void {
    this.cargando.set(true);
    this.mesaService.getAll().subscribe({
      next: (response) => {
        this.mesas.set(response.data);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar mesas:', error);
        this.snackBar.open('Error al cargar las mesas', 'Cerrar', { duration: 3000 });
        this.cargando.set(false);
      }
    });
  }

  seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionada.set(mesa);
  }

  confirmarSeleccion(): void {
    const mesa = this.mesaSeleccionada();
    if (mesa) {
      this.dialogRef.close(mesa);
    }
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  cambiarFiltroZona(zona: string): void {
    this.filtroZona.set(zona);
  }

  cambiarFiltroEstado(estado: EstadoMesa | 'todas'): void {
    this.filtroEstado.set(estado);
  }

  getEstadoLabel(estado: EstadoMesa): string {
    const labels: Record<EstadoMesa, string> = {
      libre: 'Libre',
      ocupada: 'Ocupada',
      cuenta_pendiente: 'Cuenta Pendiente',
      reservada: 'Reservada',
    };
    return labels[estado];
  }

  getEstadoIcon(estado: EstadoMesa): string {
    const icons: Record<EstadoMesa, string> = {
      libre: 'check_circle',
      ocupada: 'people',
      cuenta_pendiente: 'receipt',
      reservada: 'event',
    };
    return icons[estado];
  }
}
