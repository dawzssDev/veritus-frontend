import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material Library
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';
import { Categorias } from '../../services/categorias/categorias';
import { MatMenuModule } from '@angular/material/menu';
import { ExportService } from '../../services/export/export.service';
@Component({
  selector: 'app-categorias-lista',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatIconModule,
    MatButtonModule, MatCardModule, MatTooltipModule,
    MatMenuModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './categorias-lista.html',
  styleUrl: './categorias-lista.scss',
})
export class CategoriasLista {
  grupos: any[] = [];
  allData: any[] = [];
  isLoading = false;
  isDeleting = false;

  // Filtros
  filterNombre: string = '';
  filterEstado: string = 'todos';

  displayedColumns: string[] = ['imagen', 'descripcion', 'estatus', 'actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();

  private exportService = inject(ExportService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private categoriasService: Categorias, private router: Router) { }

  ngOnInit(): void {
    this.restoreFilters();
    this.get();
  }

  get(): void {
    this.isLoading = true;
    this.categoriasService.get().subscribe({
      next: (data) => {
        this.allData = data;
        this.applyFilters();
        this.isLoading = false;
        console.log('Categorias obtenidas:', data);
      },
      error: (err) => {
        console.error('Error al obtener grupos:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filteredData = [...this.allData];

    // Guardar filtros en sessionStorage
    this.saveFilters();

    // Filtro por nombre
    if (this.filterNombre.trim()) {
      const searchTerm = this.filterNombre.toLowerCase().trim();
      filteredData = filteredData.filter(item => 
        (item.nombre || '').toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por estado
    if (this.filterEstado !== 'todos') {
      const estadoValue = this.filterEstado === 'activo' ? 1 : 0;
      filteredData = filteredData.filter(item => {
        const estatus = item.estatus === 'activo' || item.estatus === 1 ? 1 : 0;
        return estatus === estadoValue;
      });
    }

    this.dataSource.data = filteredData;
  }

  private saveFilters(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('categorias_filter_nombre', this.filterNombre);
      sessionStorage.setItem('categorias_filter_estado', this.filterEstado);
    }
  }

  private restoreFilters(): void {
    if (typeof sessionStorage !== 'undefined') {
      const savedNombre = sessionStorage.getItem('categorias_filter_nombre');
      const savedEstado = sessionStorage.getItem('categorias_filter_estado');

      if (savedNombre !== null) this.filterNombre = savedNombre;
      if (savedEstado !== null) this.filterEstado = savedEstado;
    }
  }

  clearFilters(): void {
    this.filterNombre = '';
    this.filterEstado = 'todos';
    
    // Limpiar también de sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('categorias_filter_nombre');
      sessionStorage.removeItem('categorias_filter_estado');
    }
    
    this.applyFilters();
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
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        this.categoriasService.delete(id).subscribe(
          response => {
            this.isDeleting = false;
            Swal.fire({
              title: "¡Eliminado!",
              text: "Su registro ha sido eliminado.",
              icon: "success"
            }).then(() => {
              this.get(); // Recargar la lista
            });
          }, error => {
            this.isDeleting = false;
            console.error(error);
            Swal.fire({
              title: "Error",
              text: "No se pudo eliminar el registro.",
              icon: "error"
            });
          }
        )
      }
    });
  }

  open(): void {
    this.router.navigate(['/categorias/nuevo']);
  }

  openById(id: number): void {
    this.router.navigate(['/categorias', id, 'editar']);
  }

  exportExcel(): void {
    this.exportService.exportToExcel(
      this.dataSource.data,
      [
        { header: 'Nombre', key: 'nombre' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Estado', key: 'estatus' },
      ],
      'categorias'
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
      'categorias',
      'Categorías'
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
