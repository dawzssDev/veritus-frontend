import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material Library
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';
import { Publicidades } from '../../services/publicidades/publicidades';
import { PublicidadNuevo } from './publicidad-nuevo/publicidad-nuevo';
import { MatMenuModule } from '@angular/material/menu';
import { ExportService } from '../../services/export/export.service';

@Component({
  selector: 'app-publicidad-lista',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule,
    MatDialogModule, MatSortModule, MatIconModule,
    MatButtonModule, MatCardModule, MatTooltipModule,
    MatMenuModule, MatProgressSpinnerModule],
  templateUrl: './publicidad-lista.html',
  styleUrl: './publicidad-lista.scss',
})
export class PublicidadLista {
  readonly dialog = inject(MatDialog);
  private exportService = inject(ExportService);
  grupos: any[] = [];
  isLoading = false;
  
    displayedColumns: string[] = ['nombre', 'descripcion', 'estatus', 'actions'];
    dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
  
    constructor(private publicidadService: Publicidades) { }
  
    ngOnInit(): void {
      this.get();
    }
  
    get(): void {
    this.isLoading = true;
    this.publicidadService.get().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        console.log('Categorias obtenidas:', data);
      },
      error: (err) => {
        console.error('Error al obtener grupos:', err);
        this.isLoading = false;
      }
    });
  }

  // Eliminar
  delete(id: number): void {
    Swal.fire({
        title: "¿Desea eliminar este registro?",
        text: "No se podra regresar este cambio",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, eliminar"
      }).then((result) => {
        if (result.isConfirmed) {
          this.publicidadService.delete(id).subscribe(
            response => {
              Swal.fire({
                title: "¡Eliminado!",
                text: "Su registro ha sido eliminado.",
                icon: "success"
              });
            }, error => {
              console.error(error);
            }
          )
        }
      });
    }
  
    open(): void {
      this.dialog.open(PublicidadNuevo);
    }
  
    openById(id: number): void {
      this.dialog.open(PublicidadNuevo, {
        data: { id: id }
      });
    }
  
  exportExcel(): void {
    this.exportService.exportToExcel(
      this.dataSource.data,
      [
        { header: 'Nombre', key: 'nombre' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Estado', key: 'estatus' },
      ],
      'publicidad'
    );
  }

  exportPDF(): void {
    this.exportService.exportToPDF(
      this.dataSource.data,
      [
        { header: 'Nombre', key: 'nombre' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Estado', key: 'estatus' },
      ],
      'publicidad',
      'Publicidad'
    );
  }

  ngAfterViewInit() {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
}
