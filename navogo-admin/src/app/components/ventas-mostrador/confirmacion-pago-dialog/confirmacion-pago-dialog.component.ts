import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface ProductoResumen {
  nombre: string;
  cantidad: number;
  subtotal: number;
}

export interface ConfirmacionPagoData {
  tipoServicio: 'mesa' | 'llevar' | 'domicilio';
  numeroMesa?: number | null;
  datosCliente?: string;
  nombreRecoge?: string;
  telefonoRecoge?: string;
  productos: ProductoResumen[];
  subtotal: number;
  costoEnvio?: number;
  propina?: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'combinado';
  montoRecibido?: number;
  cambio?: number;
  pagoCombinado?: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  };
}

@Component({
  selector: 'app-confirmacion-pago-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './confirmacion-pago-dialog.component.html',
  styleUrl: './confirmacion-pago-dialog.component.scss',
})
export class ConfirmacionPagoDialogComponent {
  readonly data: ConfirmacionPagoData;
  productosVisibles: ProductoResumen[];
  productosOcultos: number = 0;

  constructor(
    private dialogRef: MatDialogRef<ConfirmacionPagoDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) data: ConfirmacionPagoData
  ) {
    this.data = data;
    
    // Mostrar máximo 4 productos
    if (data.productos.length > 4) {
      this.productosVisibles = data.productos.slice(0, 4);
      this.productosOcultos = data.productos.length - 4;
    } else {
      this.productosVisibles = data.productos;
      this.productosOcultos = 0;
    }
  }

  getTipoServicioText(): string {
    switch (this.data.tipoServicio) {
      case 'mesa':
        return `Mesa #${this.data.numeroMesa || '?'}`;
      case 'llevar': {
        const nombre = this.data.nombreRecoge?.trim();
        const tel = this.data.telefonoRecoge?.trim();
        if (nombre && tel) return `Para llevar — ${nombre} (${tel})`;
        if (nombre) return `Para llevar — ${nombre}`;
        return 'Para llevar';
      }
      case 'domicilio':
        return `Domicilio - ${this.data.datosCliente || 'Sin datos'}`;
      default:
        return '';
    }
  }

  getMetodoPagoText(): string {
    switch (this.data.metodoPago) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta':
        return 'Tarjeta';
      case 'transferencia':
        return 'Transferencia';
      case 'combinado':
        return 'Pago combinado';
      default:
        return '';
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
