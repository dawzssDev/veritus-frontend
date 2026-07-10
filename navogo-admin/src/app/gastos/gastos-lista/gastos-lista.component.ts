import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { GastosService } from '../gastos.service';
import {
  Gasto, CategoriaGasto, GastoPorCategoria, TotalesGastos
} from '../gastos.interface';
import { CrearGastoDialog } from '../dialogs/crear-gasto/crear-gasto.dialog';
import { DetalleGastoDialog } from '../dialogs/detalle-gasto/detalle-gasto.dialog';
import { ConfirmStatusDialogComponent }
  from '../../components/confirm-status-dialog/confirm-status-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-gastos-lista',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatDialogModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './gastos-lista.component.html',
  styleUrl: './gastos-lista.component.scss',
})
export class GastosListaComponent implements OnInit {
  private service  = inject(GastosService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  gastos         = signal<Gasto[]>([]);
  categorias     = signal<CategoriaGasto[]>([]);
  porCategoria   = signal<GastoPorCategoria[]>([]);
  totales        = signal<TotalesGastos | null>(null);
  cargando       = signal(true);

  filtroBusqueda   = signal('');
  filtroCategoria  = signal<number | null>(null);
  filtroMetodo     = signal('');
  filtroFechaInicio = signal('');
  filtroFechaFin    = signal('');

  paginaActual = signal(1);
  ultimaPagina = signal(1);
  totalItems   = signal(0);

  private busquedaDebounce: ReturnType<typeof setTimeout> | undefined;

  montoTotalFmt = computed(() =>
    this.totales()?.monto_total ?? 0
  );

  ngOnInit(): void {
    this.cargar();
    this.cargarCategorias();
  }

  private cargarCategorias(): void {
    this.service.getCategorias().subscribe({
      next: (cats) => {
        if (cats.length === 0) {
          this.service.inicializarCategorias()
            .subscribe({
              next: (res) => {
                this.categorias.set(res.categorias);
              },
              error: () => {
                this.mostrarToast(
                  'No se pudieron cargar las categorías',
                  true
                );
              }
            });
        } else {
          this.categorias.set(cats);
        }
      },
      error: () => {
        this.mostrarToast(
          'Error al cargar categorías', true
        );
      }
    });
  }

  cargar(page = 1): void {
    this.cargando.set(true);
    this.paginaActual.set(page);

    this.service.getGastos({
      page,
      per_page: 20,
      busqueda:     this.filtroBusqueda() || undefined,
      categoria_id: this.filtroCategoria() ?? undefined,
      metodo_pago:  this.filtroMetodo() || undefined,
      fecha_inicio: this.filtroFechaInicio() || undefined,
      fecha_fin:    this.filtroFechaFin() || undefined,
    }).subscribe({
      next: (res) => {
        this.gastos.set(res.data);
        this.totales.set(res.totales);
        this.porCategoria.set(res.por_categoria);
        this.paginaActual.set(res.meta.current_page);
        this.ultimaPagina.set(res.meta.last_page);
        this.totalItems.set(res.meta.total);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onBusquedaChange(valor: string): void {
    clearTimeout(this.busquedaDebounce);
    this.busquedaDebounce = setTimeout(() => {
      this.filtroBusqueda.set(valor);
      this.cargar(1);
    }, 300);
  }

  aplicarFiltros(): void {
    this.cargar(1);
  }

  limpiarFiltros(): void {
    this.filtroBusqueda.set('');
    this.filtroCategoria.set(null);
    this.filtroMetodo.set('');
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.cargar(1);
  }

  irPagina(page: number): void {
    if (page < 1 || page > this.ultimaPagina()) return;
    this.cargar(page);
  }

  abrirCrearGasto(): void {
    const ref = this.dialog.open(CrearGastoDialog, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { gasto: null },
    });
    ref.afterClosed().subscribe((gasto) => {
      if (gasto) {
        this.mostrarToast('Gasto registrado');
        this.cargar(1);
      }
    });
  }

  abrirEditarGasto(gasto: Gasto, e: Event): void {
    e.stopPropagation();
    if (gasto.es_compra_insumo) {
      this.mostrarToast(
        'Los gastos de insumos no se pueden editar', true
      );
      return;
    }
    const ref = this.dialog.open(CrearGastoDialog, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { gasto },
    });
    ref.afterClosed().subscribe((actualizado) => {
      if (actualizado) {
        this.mostrarToast('Gasto actualizado');
        this.cargar(this.paginaActual());
      }
    });
  }

  abrirDetalle(gasto: Gasto): void {
    this.dialog.open(DetalleGastoDialog, {
      width: '520px',
      maxWidth: '95vw',
      maxHeight: '85vh',
      data: { gasto },
    });
  }

  async eliminarGasto(gasto: Gasto, e: Event): Promise<void> {
    e.stopPropagation();

    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        kind: 'cancelar',
        icon: gasto.es_compra_insumo ? 'inventory_2' : 'payments',
        title: 'Eliminar gasto',
        message: gasto.es_compra_insumo
          ? `¿Eliminar "${gasto.concepto}"? Se revertirá el stock de los insumos asociados en inventario.`
          : `¿Eliminar el gasto "${gasto.concepto}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    const ok = Boolean(await firstValueFrom(ref.afterClosed()));
    if (!ok) return;

    this.service.eliminarGasto(gasto.id).subscribe({
      next: () => {
        this.mostrarToast('Gasto eliminado');
        this.cargar(this.paginaActual());
      },
      error: () => this.mostrarToast('Error al eliminar', true),
    });
  }

  getIconoMetodo(metodo: string): string {
    const m: Record<string, string> = {
      efectivo:      'payments',
      tarjeta:       'credit_card',
      transferencia: 'account_balance',
    };
    return m[metodo] ?? 'payment';
  }

  getLabelMetodo(metodo: string): string {
    const m: Record<string, string> = {
      efectivo:      'Efectivo',
      tarjeta:       'Tarjeta',
      transferencia: 'Transferencia',
    };
    return m[metodo] ?? metodo;
  }

  private mostrarToast(mensaje: string, esError = false): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [esError ? 'snack-error' : 'snack-success'],
    });
  }
}
