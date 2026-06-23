import {
  Component, OnInit, OnDestroy, ViewChild, AfterViewInit,
  signal, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ClientesService } from '../../services/clientes/clientes.service';
import { Cliente } from '../../models/cliente.interface';
import { ClienteDetalleDialogComponent } from './dialogs/cliente-detalle-dialog.component';
import { ConfirmStatusDialogComponent } from '../confirm-status-dialog/confirm-status-dialog.component';

@Component({
  selector: 'app-clientes-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './clientes-lista.component.html',
  styleUrl: './clientes-lista.component.scss',
})
export class ClientesListaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private clientesService = inject(ClientesService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  clientes = signal<Cliente[]>([]);
  total = signal(0);
  isLoading = signal(false);
  errorMsg = signal('');

  paginaActual = signal(1);
  perPage = signal(15);

  busquedaTexto = '';
  private busqueda$ = new Subject<string>();
  private subs = new Subscription();

  columnas: string[] = ['nombre', 'telefono', 'direcciones', 'acciones'];

  ngOnInit(): void {
    const sub = this.busqueda$.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual.set(1);
      if (this.paginator) this.paginator.firstPage();
      this.cargar();
    });
    this.subs.add(sub);
    this.cargar();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  cargar(): void {
    this.isLoading.set(true);
    this.errorMsg.set('');
    this.clientesService.getAll(this.paginaActual(), this.perPage(), this.busquedaTexto).subscribe({
      next: (res) => {
        this.clientes.set(res.data ?? []);
        this.total.set(res.total ?? 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al cargar clientes');
      }
    });
  }

  onBusqueda(value: string): void {
    this.busquedaTexto = value;
    this.busqueda$.next(value);
  }

  onPage(event: PageEvent): void {
    this.paginaActual.set(event.pageIndex + 1);
    this.perPage.set(event.pageSize);
    this.cargar();
  }

  nuevoCliente(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  editarCliente(cliente: Cliente, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/clientes', cliente.id, 'editar']);
  }

  abrirDetalle(cliente: Cliente): void {
    this.dialog.open(ClienteDetalleDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { clienteId: cliente.id },
    }).afterClosed().subscribe(() => this.cargar());
  }

  eliminar(cliente: Cliente, event: MouseEvent): void {
    event.stopPropagation();

    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      panelClass: 'confirm-status-dialog-panel',
      autoFocus: false,
      restoreFocus: true,
      data: {
        kind: 'cancelar',
        icon: 'person_remove',
        title: '¿Eliminar cliente?',
        meta: cliente.nombre,
        message:
          'Se eliminará permanentemente este cliente del directorio. Esta acción no se puede deshacer.',
        hint: cliente.telefono ? `Teléfono: ${cliente.telefono}` : undefined,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.clientesService.eliminar(cliente.id).subscribe({
        next: () => {
          this.snackBar.open('Cliente eliminado', 'OK', { duration: 2500 });
          this.cargar();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message ?? 'Error al eliminar', 'Cerrar', { duration: 3000 });
        },
      });
    });
  }

  trackById(_: number, c: Cliente): number {
    return c.id;
  }
}
