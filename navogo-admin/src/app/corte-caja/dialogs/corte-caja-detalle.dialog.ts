import { Component, Inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule }   from '@angular/material/chips';
import { CorteCaja } from '../corte-caja.interface';

@Component({
  selector:   'app-corte-caja-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, DatePipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatChipsModule,
  ],
  templateUrl: './corte-caja-detalle.dialog.html',
  styleUrls:   ['./corte-caja-detalle.dialog.scss']
})
export class CorteCajaDetalleDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CorteCajaDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { corte: CorteCaja }
  ) {}

  get corte(): CorteCaja {
    return this.data.corte;
  }

  get tipoLabel(): string {
    const tipo = this.corte.tipo;
    if (tipo === 'manana') return 'Corte Mañana';
    if (tipo === 'tarde') return 'Corte Tarde';
    return 'Corte Diario';
  }

  getEsperado(): number {
    const c = this.data.corte;
    return +(+c.fondo_inicial)
         + +(+c.total_efectivo)
         - +(+c.retiro_efectivo);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = fecha.includes('T') ? new Date(fecha) : new Date(fecha + 'T12:00:00');
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric'
    });
  }
}
