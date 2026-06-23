import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import Swal from 'sweetalert2';
import { Productos } from '../../services/productos/productos';
import { Categorias } from '../../services/categorias/categorias';
import { MatMenuModule } from '@angular/material/menu';
import { ExportService } from '../../services/export/export.service';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-producto-lista',
  imports: [CommonModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatIconModule,
    MatButtonModule, MatCardModule, MatTooltipModule,
    MatMenuModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './producto-lista.html',
  styleUrl: './producto-lista.scss',
})
export class ProductoLista implements OnInit, AfterViewInit {
  grupos: any[] = [];
  allData: any[] = [];
  categorias: any[] = [];
  isLoading = false;

  // Filtros
  filterNombre: string = '';
  filterCategoria: string = 'todos';
  filterEstado: string = 'todos';
  filterPromo: string = 'todos';

  displayedColumns: string[] = ['nombre', 'categoria', 'precio', 'descuento', 'is_combo', 'estatus', 'actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();

  private categoriasById = new Map<number, string>();
  private exportService = inject(ExportService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
      @ViewChild(MatSort) sort!: MatSort;
    
      constructor(
        private productoService: Productos,
        private categoriasService: Categorias,
        private router: Router,
      ) { }
    
      ngOnInit(): void {
        this.loadData();
        this.restoreFilters();
      }

      private loadData(): void {
        this.isLoading = true;
        forkJoin({
          productos: this.productoService.get(),
          categorias: this.categoriasService.get(),
        }).subscribe({
          next: ({ productos, categorias }) => {
            this.allData = Array.isArray(productos) ? productos : [];
            this.categorias = Array.isArray(categorias) ? categorias : [];

            this.categoriasById.clear();
            for (const c of this.categorias) {
              const id = Number((c as any)?.id);
              const nombre = ((c as any)?.nombre ?? '').toString();
              if (Number.isFinite(id) && id > 0 && nombre) {
                this.categoriasById.set(id, nombre);
              }
            }

            this.applyFilters();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error al obtener productos/categorías:', err);
            this.allData = [];
            this.categorias = [];
            this.dataSource.data = [];
            this.isLoading = false;
          }
        });
      }

      applyFilters(): void {
        let filteredData = [...this.allData];

        console.log('📊 Aplicando filtros:', {
          totalProductos: filteredData.length,
          filterCategoria: this.filterCategoria,
          filterNombre: this.filterNombre,
          filterEstado: this.filterEstado,
          filterPromo: this.filterPromo
        });

        // Guardar filtros en sessionStorage
        this.saveFilters();

        // Filtro por nombre
        if (this.filterNombre.trim()) {
          const searchTerm = this.filterNombre.toLowerCase().trim();
          filteredData = filteredData.filter(item => 
            (item.nombre || '').toLowerCase().includes(searchTerm)
          );
          console.log('✅ Después de filtrar por nombre:', filteredData.length);
        }

        // Filtro por categoría
        if (this.filterCategoria !== 'todos') {
          const categoriaId = Number(this.filterCategoria);
          const categoriaNombre = this.categoriasById.get(categoriaId);
          
          console.log('🔍 Filtrando por categoría:', { categoriaId, categoriaNombre });
          
          filteredData = filteredData.filter(item => {
            // Intentar obtener el ID de categoría del producto
            const itemCategoriaId = Number(item.categoria_id || item.categoriaId || item.id_categoria);
            if (Number.isFinite(itemCategoriaId) && itemCategoriaId > 0 && itemCategoriaId === categoriaId) {
              return true;
            }
            
            // Si no coincide por ID, intentar por nombre de categoría
            const itemCategoriaNombre = (item.categoria || '').toString().toLowerCase();
            if (categoriaNombre && itemCategoriaNombre === categoriaNombre.toLowerCase()) {
              return true;
            }
            
            return false;
          });
          
          console.log('✅ Después de filtrar por categoría:', filteredData.length);
        }

        // Filtro por estado
        if (this.filterEstado !== 'todos') {
          const estadoValue = this.filterEstado === 'activo' ? 1 : 0;
          filteredData = filteredData.filter(item => {
            const estatus = item.estatus === 'activo' || item.estatus === 1 ? 1 : 0;
            return estatus === estadoValue;
          });
          console.log('✅ Después de filtrar por estado:', filteredData.length);
        }

        // Filtro por promoción
        if (this.filterPromo !== 'todos') {
          const promoValue = this.filterPromo === 'promo' ? 1 : 0;
          filteredData = filteredData.filter(item => {
            const isPromo = item.is_promo === 1 || item.is_promo === '1' ? 1 : 0;
            return isPromo === promoValue;
          });
          console.log('✅ Después de filtrar por promoción:', filteredData.length);
        }

        console.log('📋 Productos filtrados finales:', filteredData.length);
        this.dataSource.data = filteredData;
        
        // Resetear paginador a la primera página después de filtrar
        if (this.paginator) {
          this.paginator.firstPage();
        }
        
        // Conectar paginador después de actualizar datos
        this.connectPaginatorAndSort();
      }

      private connectPaginatorAndSort(): void {
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }, 0);
      }

      private saveFilters(): void {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('productos_filter_nombre', this.filterNombre);
          sessionStorage.setItem('productos_filter_categoria', this.filterCategoria);
          sessionStorage.setItem('productos_filter_estado', this.filterEstado);
          sessionStorage.setItem('productos_filter_promo', this.filterPromo);
        }
      }

      private restoreFilters(): void {
        if (typeof sessionStorage !== 'undefined') {
          const savedNombre = sessionStorage.getItem('productos_filter_nombre');
          const savedCategoria = sessionStorage.getItem('productos_filter_categoria');
          const savedEstado = sessionStorage.getItem('productos_filter_estado');
          const savedPromo = sessionStorage.getItem('productos_filter_promo');

          if (savedNombre !== null) this.filterNombre = savedNombre;
          if (savedCategoria !== null) this.filterCategoria = savedCategoria;
          if (savedEstado !== null) this.filterEstado = savedEstado;
          if (savedPromo !== null) this.filterPromo = savedPromo;
        }
      }

      clearFilters(): void {
        this.filterNombre = '';
        this.filterCategoria = 'todos';
        this.filterEstado = 'todos';
        this.filterPromo = 'todos';
        
        // Limpiar también de sessionStorage
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('productos_filter_nombre');
          sessionStorage.removeItem('productos_filter_categoria');
          sessionStorage.removeItem('productos_filter_estado');
          sessionStorage.removeItem('productos_filter_promo');
        }
        
        this.applyFilters();
      }

      getCategoriaNombre(row: any): string {
        if (!row) return '-';

        // Caso 1: el backend ya manda el nombre como string.
        const maybeName = (row.categoria ?? row.category ?? '').toString().trim();
        if (maybeName && !/^[0-9]+$/.test(maybeName)) return maybeName;

        // Caso 2: viene el id (modelo público usa categoria_id).
        const rawId = row.categoria_id ?? row.categoriaId ?? row.id_categoria ?? row.categoria;
        const id = Number(rawId);
        if (!Number.isFinite(id)) return '-';

        return this.categoriasById.get(id) ?? '-';
      }

      isProductPromo(row: any): boolean {
        return row.is_promo === 1 || row.is_promo === '1';
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
            this.productoService.delete(id).subscribe(
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
        this.router.navigate(['/productos/nuevo']);
      }
    
      openById(id: number): void {
        this.router.navigate(['/productos', id, 'editar']);
      }
    
      exportExcel(): void {
        const data = this.dataSource.data.map((row) => ({
          ...row,
          _categoria: this.getCategoriaNombre(row),
        }));
        this.exportService.exportToExcel(
          data,
          [
            { header: 'Nombre', key: 'nombre' },
            { header: 'Categoría', key: '_categoria' },
            { header: 'Descripción', key: 'descripcion' },
            { header: 'Estado', key: 'estatus' },
          ],
          'productos'
        );
      }

      exportPDF(): void {
        const data = this.dataSource.data.map((row) => ({
          ...row,
          _categoria: this.getCategoriaNombre(row),
        }));
        this.exportService.exportToPDF(
          data,
          [
            { header: 'Nombre', key: 'nombre' },
            { header: 'Categoría', key: '_categoria' },
            { header: 'Descripción', key: 'descripcion' },
            { header: 'Estado', key: 'estatus' },
          ],
          'productos',
          'Productos'
        );
      }

      ngAfterViewInit() {
        this.connectPaginatorAndSort();
      }
}
