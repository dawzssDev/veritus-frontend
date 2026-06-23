import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OrdenBorradorService {

  private _borrador = signal<OrdenBorrador | null>(null);

  guardar(borrador: OrdenBorrador): void {
    this._borrador.set(borrador);
  }

  restaurar(): OrdenBorrador | null {
    return this._borrador();
  }

  limpiar(): void {
    this._borrador.set(null);
  }

  existe(): boolean {
    return this._borrador() !== null;
  }
}

export interface OrdenBorrador {
  carrito:         any[];
  tipoServicio:    string;
  mesaSeleccionada: any | null;
  datosDomicilio:  any | null;
  nombreRecoge?:   string;
  telefonoRecoge?: string;
  clienteId:       number | null;
  metodoPago:      string;
  montoRecibido:   number;
  pagoCombinado:   { efectivo: number; tarjeta: number; transferencia: number };
}
