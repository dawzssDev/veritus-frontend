import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Factura, EstatusFactura } from '../../models/facturacion.interface';

@Component({
  selector: 'app-detalle-factura-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './detalle-factura-dialog.component.html',
  styleUrl: './detalle-factura-dialog.component.scss',
})
export class DetalleFacturaDialogComponent {
  public dialogRef = inject(MatDialogRef<DetalleFacturaDialogComponent>);
  public data = inject<{ factura: Factura }>(MAT_DIALOG_DATA);

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  getEstatusLabel(estatus: EstatusFactura): string {
    const labels: Record<EstatusFactura, string> = {
      pagada: 'Pagada',
      pendiente: 'Pendiente',
      vencida: 'Vencida',
      cancelada: 'Cancelada',
    };
    return labels[estatus];
  }

  descargarPDF(): void {
    // Placeholder: cuando exista el backend usar data.factura.urlPdf
    // Por ahora mostrar snackbar/toast "PDF disponible próximamente"
    console.log('Descargar PDF:', this.data.factura.folio);
  }
}
