import { Injectable, inject, signal } from '@angular/core';
import { TurnoCajaService } from './turno-caja.service';
import { TurnoCaja } from './turno-caja.interface';

@Injectable({ providedIn: 'root' })
export class TurnoEstadoService {
  private service = inject(TurnoCajaService);

  turnoActual = signal<TurnoCaja | null>(null);
  cargado     = signal(false);

  hayTurnoAbierto(): boolean {
    return this.turnoActual()?.estatus === 'abierto';
  }

  refrescar(): void {
    this.service.getActual().subscribe({
      next: (res) => {
        this.turnoActual.set(res.data);
        this.cargado.set(true);
      },
      error: () => {
        this.turnoActual.set(null);
        this.cargado.set(true);
      }
    });
  }
}
