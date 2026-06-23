import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

export interface AdminOrderItem {
  product_id?: number | null;
  name: string;
  quantity: number;
  unit_price: number | string;
}

export interface AdminOrder {
  id: number;
  business_id: number;
  shipping_type: 'domicilio' | 'recoger';
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta';
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  subtotal: number | string;
  shipping_cost: number | string;
  tip: number | string;
  total: number | string;
  created_at?: string;
  items?: AdminOrderItem[];
}

export interface DetailsDialogData {
  title: string;
  subtitle?: string;
  icon: string;
  orders: AdminOrder[];
  type: 'ventas' | 'pedidos' | 'ticket' | 'hora' | 'entrega';
}

@Component({
  selector: 'app-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './details-dialog.component.html',
  styleUrl: './details-dialog.component.scss'
})
export class DetailsDialogComponent {
  displayedColumns: string[] = ['id', 'fecha', 'total', 'pago', 'entrega', 'items'];
  private dailyFolioMap = new Map<number, number>();

  constructor(
    public dialogRef: MatDialogRef<DetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetailsDialogData
  ) {
    this.computeDailyFolios();
  }

  private computeDailyFolios(): void {
    this.dailyFolioMap.clear();
    
    // Ordenar pedidos por fecha de creación (más antiguos primero)
    const sorted = [...this.data.orders].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : Number.POSITIVE_INFINITY;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : Number.POSITIVE_INFINITY;
      if (dateA !== dateB) return dateA - dateB;
      return a.id - b.id;
    });

    // Asignar folio secuencial comenzando desde 1
    sorted.forEach((order, index) => {
      this.dailyFolioMap.set(order.id, index + 1);
    });
  }

  getDailyFolio(order: AdminOrder): number {
    return this.dailyFolioMap.get(order.id) ?? 0;
  }

  close(): void {
    this.dialogRef.close();
  }

  formatMoney(value: number | string): string {
    const num = typeof value === 'string' ? Number(value) : value;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num);
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  getPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia',
      'tarjeta': 'Tarjeta'
    };
    return labels[method] || method;
  }

  getShippingLabel(type: string): string {
    return type === 'domicilio' ? 'Domicilio' : 'Recoger';
  }

  getPaymentColor(method: string): string {
    const colors: Record<string, string> = {
      'efectivo': 'payment-efectivo',
      'transferencia': 'payment-transferencia',
      'tarjeta': 'payment-tarjeta'
    };
    return colors[method] || '';
  }

  getItemsCount(order: AdminOrder): number {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  getTotalSummary(): number {
    return this.data.orders.reduce((sum, order) => {
      const total = typeof order.total === 'string' ? Number(order.total) : order.total;
      return sum + total;
    }, 0);
  }

  exportToCSV(): void {
    if (this.data.orders.length === 0) return;

    // Definir encabezados
    const headers = ['Pedido', 'Fecha', 'Total', 'Método de Pago', 'Tipo de Entrega', 'Items'];
    
    // Generar filas de datos
    const rows = this.data.orders.map(order => [
      `#${this.getDailyFolio(order)}`,
      this.formatDate(order.created_at),
      this.formatMoney(order.total),
      this.getPaymentLabel(order.payment_method),
      this.getShippingLabel(order.shipping_type),
      `${this.getItemsCount(order)} productos`
    ]);

    // Agregar fila de totales
    rows.push([
      '',
      '',
      'TOTAL:',
      this.formatMoney(this.getTotalSummary()),
      '',
      ''
    ]);

    // Convertir a formato CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generar nombre de archivo con fecha
    const today = new Date().toISOString().split('T')[0];
    const fileName = `${this.data.type}_${today}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
