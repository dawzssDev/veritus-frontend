import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Product } from '../../../models/business.interface';
import { CartItemSelection } from '../../../models/cart.interface';

interface ProductoCarrito {
  producto: Product;
  cantidad: number;
  nota: string;
  selections?: CartItemSelection[];
}

interface DetalleOrdenData {
  carrito: ProductoCarrito[];
  tipoServicio: 'mesa' | 'llevar' | 'domicilio';
  numeroMesa: number | null;
  datosCliente: string;
  subtotal: number;
  total: number;
}

@Component({
  selector: 'app-detalle-orden-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './detalle-orden-dialog.component.html',
  styleUrls: ['./detalle-orden-dialog.component.scss']
})
export class DetalleOrdenDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DetalleOrdenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetalleOrdenData
  ) {}

  obtenerPrecioConDescuento(producto: Product): number {
    return (producto.descuento && producto.descuento > 0) 
      ? producto.descuento 
      : producto.precio;
  }

  calcularSubtotalItem(item: ProductoCarrito): number {
    const precioFinal = (item.producto.descuento && item.producto.descuento > 0) 
      ? item.producto.descuento 
      : item.producto.precio;
    return precioFinal * item.cantidad;
  }

  getTipoServicioTexto(): string {
    switch (this.data.tipoServicio) {
      case 'mesa':
        return 'En mesa';
      case 'llevar':
        return 'Para llevar';
      case 'domicilio':
        return 'Domicilio';
      default:
        return '';
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
