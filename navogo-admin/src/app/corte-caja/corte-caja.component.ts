import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule }         from '@angular/forms';
import { CommonModule, DecimalPipe }          from '@angular/common';
import { MatDialog }           from '@angular/material/dialog';
import { MatCardModule }       from '@angular/material/card';
import { MatButtonModule }     from '@angular/material/button';
import { MatIconModule }       from '@angular/material/icon';
import { MatDividerModule }    from '@angular/material/divider';
import { MatChipsModule }      from '@angular/material/chips';
import { MatTableModule }      from '@angular/material/table';
import { MatTooltipModule }    from '@angular/material/tooltip';
import { MatProgressBarModule }from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { CorteCajaService }    from './corte-caja.service';
import { CorteCajaFormDialogComponent }
  from './dialogs/corte-caja-form.dialog';
import { CorteCajaDetalleDialogComponent }
  from './dialogs/corte-caja-detalle.dialog';
import {
  TipoCorte, ResumenDia, CorteCaja
} from './corte-caja.interface';

@Component({
  selector:    'app-corte-caja',
  standalone:  true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, DecimalPipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatChipsModule, MatTableModule,
    MatTooltipModule, MatProgressBarModule,
    MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './corte-caja.component.html',
  styleUrls:   ['./corte-caja.component.scss']
})
export class CorteCajaComponent implements OnInit {
  private service = inject(CorteCajaService);
  private dialog  = inject(MatDialog);

  fechaSeleccionada = signal<string>(
    new Date().toISOString().split('T')[0]
  );
  resumen   = signal<ResumenDia | null>(null);
  historial = signal<CorteCaja[]>([]);
  cargando  = signal<boolean>(true);
  cargandoHistorial = signal<boolean>(true);

  // Signals de fecha
  fechaValue = new Date();
  readonly hoy = new Date().toISOString().split('T')[0];

  // Computed: es la fecha seleccionada el día de hoy
  esHoy = computed(() =>
    this.fechaSeleccionada() === this.hoy
  );

  // Computed: label de la fecha para mostrar
  labelFecha = computed(() => {
    if (this.esHoy()) return 'Hoy';
    const d = new Date(this.fechaSeleccionada() + 'T12:00:00');
    return d.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  });

  readonly TIPOS: { tipo: TipoCorte; label: string; icono: string; rango: string }[] = [
    { tipo: 'manana', label: 'Corte Mañana', icono: 'wb_sunny',   rango: '00:00 – 13:59' },
    { tipo: 'tarde',  label: 'Corte Tarde',  icono: 'nights_stay', rango: '14:00 – 20:59' },
    { tipo: 'diario', label: 'Corte Diario', icono: 'today',       rango: '00:00 – 23:59' },
  ];

  columnas = [
    'fecha', 'tipo', 'ventas', 'efectivo',
    'tarjeta', 'ordenes', 'diferencia', 'usuario', 'acciones'
  ];

  ngOnInit(): void {
    this.cargarResumenDia();
    this.cargarHistorial();
  }

  cargarResumenDia(): void {
    this.cargando.set(true);
    this.service.getResumenDia(this.fechaSeleccionada()).subscribe({
      next: (res) => {
        this.resumen.set(res.data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  cargarHistorial(): void {
    this.cargandoHistorial.set(true);
    this.service.getHistorial().subscribe({
      next: (res) => {
        this.historial.set(res.data ?? res);
        this.cargandoHistorial.set(false);
      },
      error: () => this.cargandoHistorial.set(false)
    });
  }

  // Estado de cada tipo de corte para el día seleccionado
  getEstadoCorte(tipo: TipoCorte): 'cerrado' | 'disponible' | 'futuro' {
    if (this.resumen()?.cortes[tipo]) return 'cerrado';
    const ahora    = new Date();
    const horaFin: Record<TipoCorte, number> = {
      manana: 14, tarde: 21, diario: 24
    };
    if (new Date().getHours() < horaFin[tipo]) return 'disponible';
    return 'disponible'; // siempre disponible para fechas pasadas
  }

  abrirFormCorte(tipo: TipoCorte): void {
    const preview = this.resumen()?.previews[tipo];
    const ref = this.dialog.open(CorteCajaFormDialogComponent, {
      data:     { tipo, fecha: this.fechaSeleccionada(), preview },
      width:    '560px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
      disableClose: true,
    });

    ref.afterClosed().subscribe((corte: CorteCaja) => {
      if (corte) {
        this.cargarResumenDia();
        this.cargarHistorial();
      }
    });
  }

  verDetalle(corte: CorteCaja): void {
    this.dialog.open(CorteCajaDetalleDialogComponent, {
      data:     { corte },
      width:    '640px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
    });
  }

  getColorDiferencia(diferencia: string | null): string {
    if (!diferencia) return '';
    const d = parseFloat(diferencia);
    if (d > 0) return 'text-sobrante';
    if (d < 0) return 'text-faltante';
    return 'text-cuadrado';
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  onFechaCambio(fecha: Date | null): void {
    if (!fecha) return;
    const iso = fecha.toISOString().split('T')[0];
    this.fechaSeleccionada.set(iso);
    this.cargarResumenDia();
  }

  irAHoy(): void {
    this.fechaValue = new Date();
    this.fechaSeleccionada.set(this.hoy);
    this.cargarResumenDia();
  }

  irDiaAnterior(): void {
    const d = new Date(this.fechaSeleccionada() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    this.fechaValue = d;
    this.fechaSeleccionada.set(d.toISOString().split('T')[0]);
    this.cargarResumenDia();
  }

  irDiaSiguiente(): void {
    if (this.esHoy()) return;
    const d = new Date(this.fechaSeleccionada() + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    this.fechaValue = d;
    this.fechaSeleccionada.set(d.toISOString().split('T')[0]);
    this.cargarResumenDia();
  }
}
