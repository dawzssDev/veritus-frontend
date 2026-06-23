import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

@Component({
  selector: 'app-ventas-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './ventas-detalle.component.html',
  styleUrl: './ventas-detalle.component.scss'
})
export class VentasDetalleComponent implements OnInit {
  displayedColumns: string[] = ['id', 'fecha', 'total', 'pago', 'entrega', 'items'];
  private dailyFolioMap = new Map<number, number>();

  title = '';
  subtitle = '';
  icon = '';
  orders: AdminOrder[] = [];
  type = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener datos del state del router
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state && state['orders']) {
      this.title = state['title'] || '';
      this.subtitle = state['subtitle'] || '';
      this.icon = state['icon'] || '';
      this.orders = state['orders'] || [];
      this.type = state['type'] || '';
      this.computeDailyFolios();
    } else {
      // Si no hay datos, regresar a ventas
      this.router.navigate(['/ventas']);
    }
  }

  private computeDailyFolios(): void {
    this.dailyFolioMap.clear();
    
    const sorted = [...this.orders].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : Number.POSITIVE_INFINITY;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : Number.POSITIVE_INFINITY;
      if (dateA !== dateB) return dateA - dateB;
      return a.id - b.id;
    });

    sorted.forEach((order, index) => {
      this.dailyFolioMap.set(order.id, index + 1);
    });
  }

  getDailyFolio(order: AdminOrder): number {
    return this.dailyFolioMap.get(order.id) ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/ventas']);
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
    return this.orders.reduce((sum, order) => {
      const total = typeof order.total === 'string' ? Number(order.total) : order.total;
      return sum + total;
    }, 0);
  }

  exportToExcel(): void {
    if (this.orders.length === 0) return;

    // Preparar datos para Excel
    const data = this.orders.map(order => ({
      'Pedido': `#${this.getDailyFolio(order)}`,
      'Fecha': this.formatDate(order.created_at),
      'Total': typeof order.total === 'string' ? Number(order.total) : order.total,
      'Método de Pago': this.getPaymentLabel(order.payment_method),
      'Tipo de Entrega': this.getShippingLabel(order.shipping_type),
      'Items': this.getItemsCount(order)
    }));

    // Agregar fila de total
    data.push({
      'Pedido': '',
      'Fecha': '',
      'Total': this.getTotalSummary(),
      'Método de Pago': 'TOTAL',
      'Tipo de Entrega': '',
      'Items': ''
    } as any);

    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Formatear columna de totales como moneda
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); // Columna C (Total)
      if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
        ws[cellAddress].z = '$#,##0.00';
      }
    }

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 10 }, // Pedido
      { wch: 20 }, // Fecha
      { wch: 12 }, // Total
      { wch: 18 }, // Método de Pago
      { wch: 15 }, // Tipo de Entrega
      { wch: 8 }   // Items
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

    // Descargar archivo
    const today = new Date().toISOString().split('T')[0];
    const fileName = `${this.type}_${today}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportToPDF(): void {
    if (this.orders.length === 0) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text(this.title, 14, 20);
    
    doc.setFontSize(12);
    doc.text(this.subtitle, 14, 28);
    
    // Fecha de generación
    const today = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 35);

    // Preparar datos para la tabla
    const tableData = this.orders.map(order => [
      `#${this.getDailyFolio(order)}`,
      this.formatDate(order.created_at),
      this.formatMoney(order.total),
      this.getPaymentLabel(order.payment_method),
      this.getShippingLabel(order.shipping_type),
      `${this.getItemsCount(order)}`
    ]);

    // Agregar fila de total
    tableData.push([
      '',
      '',
      this.formatMoney(this.getTotalSummary()),
      'TOTAL',
      '',
      ''
    ]);

    // Generar tabla
    autoTable(doc, {
      startY: 42,
      head: [['Pedido', 'Fecha', 'Total', 'Método de Pago', 'Tipo de Entrega', 'Items']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 139, 34], // Verde
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 20 },  // Pedido
        1: { cellWidth: 40 },  // Fecha
        2: { cellWidth: 25, halign: 'right' },  // Total
        3: { cellWidth: 35 },  // Método de Pago
        4: { cellWidth: 30 },  // Tipo de Entrega
        5: { cellWidth: 20, halign: 'center' }   // Items
      },
      // Resaltar última fila (total)
      willDrawCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(240, 240, 240);
        }
      }
    });

    // Descargar PDF
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${this.type}_${timestamp}.pdf`;
    doc.save(fileName);
  }

  exportToCSV(): void {
    if (this.orders.length === 0) return;

    const headers = ['Pedido', 'Fecha', 'Total', 'Método de Pago', 'Tipo de Entrega', 'Items'];
    
    const rows = this.orders.map(order => [
      `#${this.getDailyFolio(order)}`,
      this.formatDate(order.created_at),
      this.formatMoney(order.total),
      this.getPaymentLabel(order.payment_method),
      this.getShippingLabel(order.shipping_type),
      `${this.getItemsCount(order)} productos`
    ]);

    rows.push([
      '',
      '',
      'TOTAL:',
      this.formatMoney(this.getTotalSummary()),
      '',
      ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    const fileName = `${this.type}_${today}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
