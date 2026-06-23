import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, Subject } from 'rxjs';
import { Business, Category, Product } from '../../../models/business.interface';
import { Mesa } from '../../../models/mesa.interface';
import { MenuService } from '../../../services/menu/menu.service';
import { environment } from '../../../../environments/environment';

type PasoMenu = 'bienvenida' | 'menu' | 'confirmacion';

interface ItemCarrito {
  producto: Product;
  cantidad: number;
  subtotal: number;
}

interface DatosMesa {
  id: number;
  identificador: string;
  zona?: string;
}

@Component({
  selector: 'app-menu-publico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    MatSnackBarModule
  ],
  templateUrl: './menu-publico.component.html',
  styleUrl: './menu-publico.component.scss'
})
export class MenuPublicoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private menuService = inject(MenuService);
  private snackBar = inject(MatSnackBar);
  private searchSubject = new Subject<string>();

  // Query params
  private mesaId = signal<number | null>(null);
  private token = signal<string>('');
  private empresaId = signal<number | null>(null);

  // Estado de pasos
  pasoActual = signal<PasoMenu>('bienvenida');

  // Datos de mesa y cliente
  datosMesa = signal<DatosMesa | null>(null);
  nombreCliente = signal('');
  
  // Datos del menú
  empresa = signal<Business | null>(null);
  categorias = signal<Category[]>([]);
  productos = signal<Product[]>([]);
  categoriaActiva = signal<number>(0);
  textoBusqueda = signal('');

  // Carrito
  carrito = signal<ItemCarrito[]>([]);
  notaPedido = signal('');

  // Estados de carga y error
  cargandoBienvenida = signal(false);
  cargandoMenu = signal(false);
  enviandoPedido = signal(false);
  errorBienvenida = signal('');
  errorMenu = signal('');

  // Computed signals
  totalCarrito = computed(() => {
    return this.carrito().reduce((sum, item) => sum + item.subtotal, 0);
  });

  totalItems = computed(() => {
    return this.carrito().reduce((sum, item) => sum + item.cantidad, 0);
  });

  productosFiltrados = computed(() => {
    const categoriaIndex = this.categoriaActiva();
    const busqueda = this.textoBusqueda().toLowerCase().trim();
    
    let productos = this.productos();

    // Filtrar por categoría
    if (categoriaIndex > 0) {
      const categoria = this.categorias()[categoriaIndex];
      if (categoria) {
        productos = productos.filter(p => p.categoria === categoria.nombre);
      }
    }

    // Filtrar por búsqueda
    if (busqueda) {
      productos = productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda) ||
        p.descripcion?.toLowerCase().includes(busqueda)
      );
    }

    return productos;
  });

  carritoVisible = computed(() => this.totalItems() > 0);

  ngOnInit() {
    // mesaId puede venir como route param (/menu/mesa/:mesaId) o query param (legacy)
    const routeMesaId = this.route.snapshot.paramMap.get('mesaId');
    if (routeMesaId) {
      this.mesaId.set(parseInt(routeMesaId, 10));
    }

    // Leer query params (token siempre en query)
    this.route.queryParams.subscribe(params => {
      const mesaParam = params['mesa'];
      const tokenParam = params['token'];
      
      if (mesaParam && !routeMesaId) {
        this.mesaId.set(parseInt(mesaParam, 10));
      }
      
      if (tokenParam) {
        this.token.set(tokenParam);
      }

      // Cargar datos de la mesa
      if (this.mesaId()) {
        this.cargarDatosMesa();
      }
    });

    // Configurar debounce para búsqueda
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(value => {
      this.textoBusqueda.set(value);
    });
  }

  // ============================================
  // PASO 1: BIENVENIDA
  // ============================================

  cargarDatosMesa() {
    if (!this.mesaId()) return;

    this.cargandoBienvenida.set(true);
    this.errorBienvenida.set('');

    this.http.get<{data: Mesa}>(`${environment.apiUrl}/mesas/${this.mesaId()}`)
      .subscribe({
        next: (response) => {
          const mesa = response.data;

          // Verificar que la mesa está libre
          if (mesa.estado !== 'libre') {
            this.errorBienvenida.set(
              mesa.estado === 'ocupada'
                ? 'Esta mesa ya tiene una orden activa. Solicita al personal que la libere.'
                : 'Esta mesa no está disponible para ordenar en este momento.'
            );
            this.cargandoBienvenida.set(false);
            return;
          }

          // Guardar empresa_id para cargar el menú correcto
          this.empresaId.set(mesa.empresa_id);

          this.datosMesa.set({
            id: mesa.id,
            identificador: mesa.identificador,
            zona: mesa.zona || undefined
          });
          this.cargandoBienvenida.set(false);
        },
        error: (err) => {
          this.errorBienvenida.set('No se pudo cargar la información de la mesa');
          this.cargandoBienvenida.set(false);
          console.error('Error cargando mesa:', err);
        }
      });
  }

  continuarDesdeBienvenida() {
    if (this.nombreCliente().trim().length < 2) {
      this.snackBar.open('Por favor ingresa tu nombre (mínimo 2 caracteres)', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.cargandoBienvenida.set(true);
    this.errorBienvenida.set('');

    const payload = {
      mesa_id: this.mesaId(),
      token: this.token(),
      nombreCliente: this.nombreCliente().trim()
    };

    this.http.post<{success: boolean; message: string}>(
      `${environment.apiUrl}/menu/asociar-cliente`,
      payload
    ).subscribe({
      next: (response) => {
        this.cargandoBienvenida.set(false);
        this.pasoActual.set('menu');
        this.cargarMenu();
      },
      error: (err) => {
        this.cargandoBienvenida.set(false);
        
        if (err.status === 401 || err.status === 404) {
          this.errorBienvenida.set('El código QR no es válido o ha expirado. Por favor solicita uno nuevo al personal.');
        } else {
          this.errorBienvenida.set('Ocurrió un error. Por favor intenta nuevamente.');
        }
        
        console.error('Error asociando cliente:', err);
      }
    });
  }

  // ============================================
  // PASO 2: MENÚ
  // ============================================

  cargarMenu() {
    this.cargandoMenu.set(true);
    this.errorMenu.set('');

    // Obtener menú de la empresa usando el ID real obtenido de la mesa
    const empId = this.empresaId();
    if (!empId) {
      this.errorMenu.set('No se pudo determinar el menú de este negocio.');
      this.cargandoMenu.set(false);
      return;
    }
    this.menuService.getMenuByEmpresaId(empId).subscribe({
      next: (business) => {
        this.empresa.set(business);
        this.categorias.set(business.categorias || []);
        
        // Extraer todos los productos de todas las categorías
        const todosProductos = (business.categorias || [])
          .flatMap(cat => cat.productos || [])
          .filter(p => p.estado === 'activo');
        
        this.productos.set(todosProductos);
        this.cargandoMenu.set(false);
      },
      error: (err) => {
        this.errorMenu.set('No se pudo cargar el menú. Por favor intenta nuevamente.');
        this.cargandoMenu.set(false);
        console.error('Error cargando menú:', err);
      }
    });
  }

  onBusquedaChange(value: string) {
    this.searchSubject.next(value);
  }

  seleccionarCategoria(index: number) {
    this.categoriaActiva.set(index);
  }

  agregarAlCarrito(producto: Product) {
    const itemExistente = this.carrito().find(item => item.producto.id === producto.id);

    if (itemExistente) {
      // Incrementar cantidad
      this.carrito.update(items => 
        items.map(item => 
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * producto.precio }
            : item
        )
      );
    } else {
      // Agregar nuevo item
      this.carrito.update(items => [
        ...items,
        {
          producto,
          cantidad: 1,
          subtotal: producto.precio
        }
      ]);
    }

    this.snackBar.open(`${producto.nombre} agregado al carrito`, 'Cerrar', {
      duration: 2000
    });
  }

  incrementarCantidad(item: ItemCarrito) {
    this.carrito.update(items =>
      items.map(i =>
        i.producto.id === item.producto.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.producto.precio }
          : i
      )
    );
  }

  decrementarCantidad(item: ItemCarrito) {
    if (item.cantidad === 1) {
      this.eliminarDelCarrito(item);
    } else {
      this.carrito.update(items =>
        items.map(i =>
          i.producto.id === item.producto.id
            ? { ...i, cantidad: i.cantidad - 1, subtotal: (i.cantidad - 1) * i.producto.precio }
            : i
        )
      );
    }
  }

  eliminarDelCarrito(item: ItemCarrito) {
    this.carrito.update(items => 
      items.filter(i => i.producto.id !== item.producto.id)
    );
  }

  verResumen() {
    this.pasoActual.set('confirmacion');
  }

  // ============================================
  // PASO 3: CONFIRMACIÓN
  // ============================================

  volverAlMenu() {
    this.pasoActual.set('menu');
  }

  enviarPedido() {
    this.enviandoPedido.set(true);

    // Simular envío (por ahora sin integración real)
    setTimeout(() => {
      this.enviandoPedido.set(false);
      this.snackBar.open('¡Pedido enviado! El mesero te atenderá en breve.', 'Cerrar', {
        duration: 5000
      });
      
      // Limpiar carrito y volver al menú
      this.carrito.set([]);
      this.notaPedido.set('');
      this.pasoActual.set('menu');
    }, 2000);
  }

  get nombreRestaurante(): string {
    return this.empresa()?.nombre || 'Restaurante';
  }
}
