import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule }
  from '@angular/material/dialog';
import { MatProgressSpinnerModule }
  from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule }
  from '@angular/material/snack-bar';
import { MatFormFieldModule }
  from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { InventarioService } from '../inventario.service';
import { Insumo } from '../inventario.interface';
import { CrearEditarInsumoDialog }
  from '../dialogs/crear-editar-insumo/crear-editar-insumo.dialog';
import { EntradaInventarioDialog }
  from '../dialogs/entrada-inventario/entrada-inventario.dialog';
import { SalidaInventarioDialog }
  from '../dialogs/salida-inventario/salida-inventario.dialog';
import { AjusteInventarioDialog }
  from '../dialogs/ajuste-inventario/ajuste-inventario.dialog';
import { KardexInsumoDialog }
  from '../dialogs/kardex-insumo/kardex-insumo.dialog';
import { ConfirmStatusDialogComponent }
  from '../../components/confirm-status-dialog/confirm-status-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-inventario-lista',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatChipsModule, MatTooltipModule,
    MatDialogModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './inventario-lista.component.html',
  styleUrl: './inventario-lista.component.scss',
})
export class InventarioListaComponent implements OnInit {
  private service  = inject(InventarioService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  insumos    = signal<Insumo[]>([]);
  categorias = signal<string[]>([]);
  cargando   = signal(true);

  filtroCategoria = signal<string>('todas');
  filtroBusqueda  = signal<string>('');
  soloStockBajo   = signal(false);

  private busquedaDebounce: any;

  insumosFiltrados = computed(() => {
    let lista = this.insumos();
    const cat = this.filtroCategoria();
    const b   = this.filtroBusqueda().toLowerCase().trim();

    if (cat !== 'todas') {
      lista = lista.filter(i => i.categoria === cat);
    }
    if (b) {
      lista = lista.filter(i =>
        i.nombre.toLowerCase().includes(b)
      );
    }
    if (this.soloStockBajo()) {
      lista = lista.filter(i => i.stock_bajo);
    }
    return lista;
  });

  totalStockBajo = computed(() =>
    this.insumos().filter(i => i.stock_bajo).length
  );

  ngOnInit(): void {
    this.cargar();
    this.service.getCategorias().subscribe({
      next: (cats) => this.categorias.set(cats),
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.getInsumos().subscribe({
      next: (data) => {
        this.insumos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onBusquedaChange(valor: string): void {
    clearTimeout(this.busquedaDebounce);
    this.busquedaDebounce = setTimeout(() => {
      this.filtroBusqueda.set(valor);
    }, 300);
  }

  toggleStockBajo(): void {
    this.soloStockBajo.set(!this.soloStockBajo());
  }

  abrirCrearInsumo(): void {
    const ref = this.dialog.open(
      CrearEditarInsumoDialog, {
        width: '480px',
        maxWidth: '95vw',
        data: { insumo: null },
      }
    );
    ref.afterClosed().subscribe((creado) => {
      if (creado) {
        this.insumos.update(l => [creado, ...l]);
        this.mostrarToast('Insumo creado correctamente');
      }
    });
  }

  abrirEditarInsumo(insumo: Insumo, e: Event): void {
    e.stopPropagation();
    const ref = this.dialog.open(
      CrearEditarInsumoDialog, {
        width: '480px',
        maxWidth: '95vw',
        data: { insumo },
      }
    );
    ref.afterClosed().subscribe((actualizado) => {
      if (actualizado) {
        this.insumos.update(l =>
          l.map(i => i.id === actualizado.id
            ? actualizado : i)
        );
        this.mostrarToast('Insumo actualizado');
      }
    });
  }

  abrirEntrada(insumo: Insumo, e: Event): void {
    e.stopPropagation();
    const ref = this.dialog.open(
      EntradaInventarioDialog, {
        width: '420px',
        maxWidth: '95vw',
        data: { insumo },
      }
    );
    ref.afterClosed().subscribe((insumoActualizado) => {
      if (insumoActualizado) {
        this.insumos.update(l =>
          l.map(i => i.id === insumoActualizado.id
            ? insumoActualizado : i)
        );
        this.mostrarToast('Entrada registrada');
      }
    });
  }

  abrirSalida(insumo: Insumo, e: Event): void {
    e.stopPropagation();
    const ref = this.dialog.open(
      SalidaInventarioDialog, {
        width: '420px',
        maxWidth: '95vw',
        data: { insumo },
      }
    );
    ref.afterClosed().subscribe((insumoActualizado) => {
      if (insumoActualizado) {
        this.insumos.update(l =>
          l.map(i => i.id === insumoActualizado.id
            ? insumoActualizado : i)
        );
        this.mostrarToast('Salida registrada');
      }
    });
  }

  abrirAjuste(insumo: Insumo, e: Event): void {
    e.stopPropagation();
    const ref = this.dialog.open(
      AjusteInventarioDialog, {
        width: '420px',
        maxWidth: '95vw',
        data: { insumo },
      }
    );
    ref.afterClosed().subscribe((insumoActualizado) => {
      if (insumoActualizado) {
        this.insumos.update(l =>
          l.map(i => i.id === insumoActualizado.id
            ? insumoActualizado : i)
        );
        this.mostrarToast('Ajuste registrado');
      }
    });
  }

  abrirKardex(insumo: Insumo): void {
    this.dialog.open(KardexInsumoDialog, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '85vh',
      data: { insumo },
    });
  }

  async eliminarInsumo(
    insumo: Insumo, e: Event
  ): Promise<void> {
    e.stopPropagation();

    const ref = this.dialog.open(
      ConfirmStatusDialogComponent, {
        data: {
          kind: 'cancelar',
          icon: 'inventory_2',
          title: 'Desactivar insumo',
          message: `¿Desactivar "${insumo.nombre}"? Dejará de aparecer en el catálogo, pero su historial se conserva.`,
          confirmText: 'Desactivar',
          cancelText: 'Cancelar',
        },
      }
    );

    const ok = Boolean(
      await firstValueFrom(ref.afterClosed())
    );
    if (!ok) return;

    this.service.eliminarInsumo(insumo.id).subscribe({
      next: () => {
        this.insumos.update(l =>
          l.filter(i => i.id !== insumo.id)
        );
        this.mostrarToast('Insumo desactivado');
      },
      error: () => {
        this.mostrarToast('Error al desactivar', true);
      }
    });
  }

  private mostrarToast(
    mensaje: string, esError = false
  ): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [esError ? 'snack-error' : 'snack-success'],
    });
  }

  getIconoCategoria(cat: string | null): string {
    const m: Record<string, string> = {
      'Carnes': 'set_meal',
      'Verduras': 'eco',
      'Lácteos': 'icecream',
      'Bebidas': 'local_bar',
      'Abarrotes': 'inventory_2',
      'Desechables': 'recycling',
    };
    return m[cat ?? ''] ?? 'category';
  }
}
