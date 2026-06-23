import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';
import { Usuarios } from '../../services/usuarios/usuarios';
import { MatMenuModule } from '@angular/material/menu';
import { ExportService } from '../../services/export/export.service';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './usuarios-lista.html',
  styleUrl: './usuarios-lista.scss',
})
export class UsuariosLista implements OnInit {
  displayedColumns: string[] = ['nombreCompleto', 'email', 'telefono', 'roleId', 'activo', 'actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  private exportService = inject(ExportService);
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usuariosService: Usuarios,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.usuariosService.get().subscribe({
      next: (res: any) => {
        this.dataSource.data = Array.isArray(res) ? res : [];
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
        this.dataSource.data = [];
        this.isLoading = false;
      },
    });
  }

  open(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  openById(id: number): void {
    this.router.navigate(['/usuarios', id, 'editar']);
  }

  delete(id: number): void {
    Swal.fire({
      title: '¿Desea eliminar este usuario?',
      text: 'No se podrá revertir este cambio',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.usuariosService.delete(id).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El usuario fue eliminado correctamente.',
            icon: 'success',
          });
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar el usuario.',
            icon: 'error',
          });
        },
      });
    });
  }

  exportExcel(): void {
    this.exportService.exportToExcel(
      this.dataSource.data,
      [
        { header: 'Nombre', key: 'nombreCompleto' },
        { header: 'Email', key: 'email' },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'Rol', key: 'roleId' },
        { header: 'Activo', key: 'activo' },
      ],
      'usuarios'
    );
  }

  exportPDF(): void {
    this.exportService.exportToPDF(
      this.dataSource.data,
      [
        { header: 'Nombre', key: 'nombreCompleto' },
        { header: 'Email', key: 'email' },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'Rol', key: 'roleId' },
        { header: 'Activo', key: 'activo' },
      ],
      'usuarios',
      'Usuarios'
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
