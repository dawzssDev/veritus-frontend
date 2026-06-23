import { Component, OnInit, signal, computed, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MenuService } from '../../services/menu/menu.service';
import { AuthService } from '../../services/auth/auth.service';
import { OrderService } from '../../services/orders/order.service';
import { MesaService } from '../../services/mesas/mesa.service';
import { Product, Category, Business, ProductDetail } from '../../models/business.interface';
import { ProductDetailDialogComponent } from '../product-detail-dialog/product-detail-dialog.component';
import { CartItemSelection } from '../../models/cart.interface';
import { ConfirmStatusDialogComponent } from '../confirm-status-dialog/confirm-status-dialog.component';
import { SeleccionarMesaDialogComponent } from '../ventas-mostrador/seleccionar-mesa-dialog/seleccionar-mesa-dialog.component';
import { AgregarNotaDialogComponent } from '../ventas-mostrador/agregar-nota-dialog/agregar-nota-dialog.component';
import { CreateOrderRequest, CreateOrderItemRequest } from '../../models/checkout.interface';
import { Mesa } from '../../models/mesa.interface';

// Tipos
interface ProductoOrden {
  producto: Product;
  cantidad: number;
  nota: string;
  selections?: CartItemSelection[];
}

@Component({
  selector: 'app-levantar-orden',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatDividerModule,
    MatDialogModule,
    MatTooltipModule,
    ProductDetailDialogComponent,
  ],
  templateUrl: './levantar-orden.component.html',
  styleUrl: './levantar-orden.component.scss',
})
export class LevantarOrdenComponent implements OnInit {
  private menuService = inject(MenuService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private mesaService = inject(MesaService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  // Signals de datos
  menuData = signal<Business | null>(null);
  categorias = signal<Category[]>([]);
  todosProductos = signal<Product[]>([]);
  isLoading = signal<boolean>(true);

  // Signals de filtros y selección
  categoriaActiva = signal<string>('todos');
  busqueda = signal<string>('');
  private busquedaDebounce: any;

  // Signals del modal de producto
  showProductModal = signal<boolean>(false);
  selectedProductId = signal<number | null>(null);

  // Signals de la orden
  orden = signal<ProductoOrden[]>([]);
  
  // Signal para navegación móvil
  vistaMovil = signal<'productos' | 'orden'>('productos');
  
  // Mesa seleccionada (obligatoria)
  mesaSeleccionada = signal<Mesa | null>(null);
  modoSplit = false;
  mesaSplitId = 0;

  // Computed properties
  // Devuelve true si hoy es un día válido para la promoción recurrente del producto
  private esDiaPromoValido(p: Product): boolean {
    if (Number(p.is_recurrente) !== 1) return true;
    const dias: number[] = Array.isArray(p.dias_promo) ? p.dias_promo : [];
    if (dias.length === 0) return true;
    return dias.includes(new Date().getDay());
  }

  // Descuento activo = tiene descuento Y, si es promo, hoy es día válido
  tieneDescuentoActivo(p: Product): boolean {
    if (!p.descuento || p.descuento <= 0) return false;
    if (p.is_promo === 1) return this.esDiaPromoValido(p);
    return true;
  }

  productosFiltrados = computed(() => {
    let productos = this.todosProductos();
    const categoria = this.categoriaActiva();
    const busquedaText = this.busqueda().toLowerCase().trim();

    if (categoria !== 'todos') {
      productos = productos.filter(p => 
        (p.categoria?.toString() || '').toLowerCase() === categoria.toLowerCase()
      );
    }

    if (busquedaText) {
      productos = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaText) ||
        p.descripcion?.toLowerCase().includes(busquedaText)
      );
    }

    // Promo SIN descuento: solo visible en los días seleccionados
    productos = productos.filter(p => {
      if (p.is_promo === 1 && !(p.descuento && p.descuento > 0)) {
        return this.esDiaPromoValido(p);
      }
      return true;
    });

    return productos;
  });

  subtotal = computed(() => {
    return this.orden().reduce((total, item) => {
      // Si tiene complementos, el precio ya incluye el base + extras
      if (item.selections && item.selections.length > 0) {
        return total + (item.producto.precio * item.cantidad);
      }
      // Si no tiene complementos, usar descuento si existe, sino precio original
      const precioConDescuento = item.producto.descuento && item.producto.descuento > 0
        ? item.producto.descuento
        : item.producto.precio;
      return total + (precioConDescuento * item.cantidad);
    }, 0);
  });

  ordenValida = computed(() => {
    return this.orden().length > 0 && this.mesaSeleccionada() !== null;
  });

  constructor() {
    effect(() => {
      const busqueda = this.busqueda();
    });
  }

  ngOnInit(): void {
    this.cargarMenu();

    // Leer queryParams para split de mesa
    const mesaId = this.route.snapshot
      .queryParamMap.get('mesa_id');
    const esSplit = this.route.snapshot
      .queryParamMap.get('mesa_split');

    if (mesaId && esSplit === 'true') {
      this.modoSplit = true;
      this.mesaSplitId = Number(mesaId);

      this.mesaService.getAll().subscribe({
        next: (resp) => {
          const lista = resp.data ?? [];
          const mesa = lista.find(
            (m) => m.id === Number(mesaId)
          );
          if (mesa) {
            this.mesaSeleccionada.set(mesa);
          }
        },
        error: () => {}
      });
    }
  }

  private cargarMenu(): void {
    this.isLoading.set(true);
    
    const empresaId = this.authService.getEmpresaId();
    
    if (!empresaId) {
      this.snackBar.open('No se encontró empresa asociada al usuario', 'Cerrar', { duration: 3000 });
      this.isLoading.set(false);
      return;
    }

    this.menuService.getMenuByEmpresaId(empresaId).subscribe({
      next: (data: Business) => {
        this.menuData.set(data);
        this.categorias.set(data.categorias || []);
        
        const productos: Product[] = [];
        data.categorias?.forEach(cat => {
          cat.productos?.forEach(prod => {
            productos.push(prod);
          });
        });
        this.todosProductos.set(productos);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando menú:', err);
        this.snackBar.open('Error al cargar el menú', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      },
    });
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaActiva.set(categoria);
  }

  obtenerCategoriasUnicas(): string[] {
    const categoriasSet = new Set<string>();
    this.categorias().forEach(cat => {
      if (cat.nombre) categoriasSet.add(cat.nombre);
    });
    return Array.from(categoriasSet).sort();
  }

  onBusquedaChange(value: string): void {
    clearTimeout(this.busquedaDebounce);
    this.busquedaDebounce = setTimeout(() => {
      this.busqueda.set(value);
    }, 300);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  viewProduct(producto: Product): void {
    if (this.showProductModal()) {
      this.showProductModal.set(false);
      this.selectedProductId.set(null);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.selectedProductId.set(producto?.id ?? null);
        this.showProductModal.set(producto?.id != null);
        this.cdr.detectChanges();
      }, 50);
    } else {
      this.selectedProductId.set(producto?.id ?? null);
      this.showProductModal.set(producto?.id != null);
      this.cdr.detectChanges();
    }
  }

  onAddFromDetail(event: { product: ProductDetail; quantity: number; selections: CartItemSelection[] }): void {
    const p = event.product;
    const base = (p.descuento != null && p.descuento > 0) ? Number(p.descuento) : Number(p.precio);
    const baseSafe = Number.isFinite(base) ? base : Number(p.precio);

    const priceOverride = (event.selections ?? []).reduce((best: number | null, s) => {
      const v = s && (s as any).precio != null ? Number((s as any).precio) : NaN;
      if (!Number.isFinite(v)) return best;
      if (best == null || v > best) return v;
      return best;
    }, null);

    const basePrice = priceOverride != null ? priceOverride : baseSafe;

    const extraTotal = (event.selections ?? []).reduce((sum: number, s) => {
      const extra = s && (s as any)['precio-extra'] != null ? Number((s as any)['precio-extra']) : NaN;
      if (Number.isFinite(extra)) {
        return sum + extra;
      }
      return sum;
    }, 0);

    const precioFinal = basePrice + extraTotal;

    const ordenActual = [...this.orden()];
    
    for (let i = 0; i < event.quantity; i++) {
      ordenActual.push({
        producto: {
          ...p,
          precio: precioFinal
        } as Product,
        cantidad: 1,
        nota: '',
        selections: event.selections
      });
    }

    this.orden.set(ordenActual);
    this.mostrarFeedback(`${event.quantity} producto(s) agregado(s)`);
  }

  agregarAOrden(producto: Product): void {
    const ordenActual = [...this.orden()];
    const indiceExistente = ordenActual.findIndex(
      item => item.producto.id === producto.id && !item.selections
    );

    if (indiceExistente !== -1) {
      ordenActual[indiceExistente].cantidad++;
    } else {
      ordenActual.push({
        producto,
        cantidad: 1,
        nota: '',
      });
    }

    this.orden.set(ordenActual);
    this.mostrarFeedback('Producto agregado');
  }

  aumentarCantidad(index: number): void {
    const ordenActual = [...this.orden()];
    ordenActual[index].cantidad++;
    this.orden.set(ordenActual);
  }

  disminuirCantidad(index: number): void {
    const ordenActual = [...this.orden()];
    if (ordenActual[index].cantidad > 1) {
      ordenActual[index].cantidad--;
      this.orden.set(ordenActual);
    }
  }

  eliminarDeOrden(index: number): void {
    const item = this.orden()[index];
    const nombreProducto = item?.producto?.nombre || 'este producto';
    
    const dialogRef = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        title: '¿Eliminar producto?',
        message: `¿Estás seguro de que deseas eliminar '${nombreProducto}' de la orden?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        icon: 'delete',
        kind: 'cancelar',
        hint: 'El producto será removido de esta orden. El resto de la orden no se verá afectado.',
      },
      disableClose: false,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const ordenActual = [...this.orden()];
        ordenActual.splice(index, 1);
        this.orden.set(ordenActual);
        this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  irAOrden(): void {
    this.vistaMovil.set('orden');
  }

  irAProductos(): void {
    this.vistaMovil.set('productos');
  }

  obtenerCantidadEnOrden(productoId: number): number {
    const item = this.orden().find(i => i.producto.id === productoId);
    return item ? item.cantidad : 0;
  }

  calcularSubtotalItem(item: ProductoOrden): number {
    // Si tiene complementos, el precio ya incluye el base + extras
    if (item.selections && item.selections.length > 0) {
      return item.producto.precio * item.cantidad;
    }
    // Si no tiene complementos, usar descuento si existe, sino precio original
    const precioFinal = (item.producto.descuento && item.producto.descuento > 0) 
      ? item.producto.descuento 
      : item.producto.precio;
    return precioFinal * item.cantidad;
  }

  abrirSeleccionMesa(): void {
    const dialogRef = this.dialog.open(SeleccionarMesaDialogComponent, {
      width: '95vw',
      maxWidth: '1400px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((mesaSeleccionada: Mesa | null) => {
      if (mesaSeleccionada) {
        this.mesaSeleccionada.set(mesaSeleccionada);
      }
    });
  }

  async levantarOrden(): Promise<void> {
    if (!this.ordenValida()) {
      this.snackBar.open('Por favor selecciona una mesa y agrega productos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const empresaId = this.authService.getEmpresaId();
    
    if (!empresaId) {
      this.snackBar.open('No se encontró empresa asociada al usuario', 'Cerrar', { 
        duration: 3000 
      });
      return;
    }

    const mesa = this.mesaSeleccionada()!;

    // Preparar items de la orden
    const items: CreateOrderItemRequest[] = this.orden().map(item => {
      const precioFinal = this.obtenerPrecioConDescuento(item.producto);
      
      return {
        product_id: item.producto.id,
        name: item.producto.nombre,
        quantity: item.cantidad,
        unit_price: precioFinal,
        selections: item.selections || null,
      };
    });

    // Construir nota de la orden
    const notasParts: string[] = [];
    
    let mesaInfo = `Mesa ${mesa.identificador}`;
    if (mesa.zona) {
      mesaInfo += ` (${mesa.zona})`;
    }
    notasParts.push(mesaInfo);
    
    // Agregar notas de productos si existen
    const notasProductos = this.orden()
      .filter(item => item.nota && item.nota.trim())
      .map(item => `${item.producto.nombre}: ${item.nota}`);
    
    if (notasProductos.length > 0) {
      notasParts.push(...notasProductos);
    }

    const notaFinal = notasParts.length > 0 ? notasParts.join(' | ') : undefined;

    // Crear payload de la orden
    const payload: CreateOrderRequest = {
      business_id: empresaId,
      sucursal_id: this.authService.getSucursalId(),
      customer_name: `Mesa ${mesa.identificador}`,
      customer_phone: '0000000000',
      shipping_type: 'local',
      payment_method: 'efectivo',
      pago_confirmado: false, // El pago NO está confirmado aún
      envio_confirmado: true, // La orden está lista para prepararse
      subtotal: this.subtotal(),
      tip: 0,
      shipping_cost: 0,
      total: this.subtotal(),
      delivery_address: null,
      note: notaFinal || null,
      items: items,
    };

    // Enviar orden al backend
    this.orderService.createOrder(payload).subscribe({
      next: (response) => {
        console.log('✅ Orden levantada:', response);
        
        const ordenId = response.order_id ?? response.id;
        
        if (ordenId) {
          if (this.modoSplit && this.mesaSplitId > 0) {
            this.mesaService
              .splitMesa(this.mesaSplitId, ordenId)
              .subscribe({
                next: () => {
                  this.snackBar.open(
                    '✅ Segunda cuenta levantada',
                    'Cerrar',
                    {
                      duration: 3000,
                      panelClass: ['success-snackbar'],
                    }
                  );
                },
                error: () => {
                  this.snackBar.open(
                    '✅ Orden levantada (split no pudo registrarse)',
                    'Cerrar',
                    { duration: 4000 }
                  );
                }
              });
          } else {
            this.mesaService
              .cambiarEstado(mesa.id, 'ocupada', {
                id_orden: ordenId
              })
              .subscribe({
                next: () => {
                  this.snackBar.open(
                    '✅ Orden levantada y mesa vinculada',
                    'Cerrar',
                    {
                      duration: 3000,
                      panelClass: ['success-snackbar'],
                    }
                  );
                },
                error: () => {
                  this.snackBar.open(
                    '✅ Orden levantada (mesa no pudo vincularse)',
                    'Cerrar',
                    { duration: 4000 }
                  );
                }
              });
          }
        } else {
          // Si no se obtuvo el ID de la orden, solo actualizar el estado de la mesa
          this.mesaService.cambiarEstado(mesa.id, 'ocupada').subscribe({
            next: () => {
              this.snackBar.open('✅ Orden levantada y mesa marcada como ocupada', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar'],
              });
            },
            error: (error) => {
              console.error('❌ Error actualizando estado de mesa:', error);
              this.snackBar.open('✅ Orden levantada (la mesa no pudo actualizarse)', 'Cerrar', {
                duration: 4000,
                panelClass: ['success-snackbar'],
              });
            }
          });
        }

        this.limpiarOrden();
      },
      error: (error) => {
        console.error('❌ Error levantando orden:', error);
        
        this.snackBar.open('❌ Error al levantar la orden. Intenta de nuevo.', 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }

  limpiarOrden(): void {
    this.orden.set([]);
    this.mesaSeleccionada.set(null);
    this.vistaMovil.set('productos');

    this.modoSplit = false;
    this.mesaSplitId = 0;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  /**
   * Actualizar nota de un item de la orden
   */
  actualizarNota(index: number, nota: string): void {
    const ordenActual = [...this.orden()];
    ordenActual[index].nota = nota;
    this.orden.set(ordenActual);
  }

  /**
   * Abrir diálogo para agregar/editar nota de un producto
   */
  async abrirDialogNota(index: number): Promise<void> {
    const item = this.orden()[index];

    const dialogRef = this.dialog.open(AgregarNotaDialogComponent, {
      width: '400px',
      data: {
        nombreProducto: item.producto.nombre,
        nota: item.nota || '',
      },
    });

    const nota = await dialogRef.afterClosed().toPromise();

    if (nota !== undefined) {
      // undefined = canceló, '' = limpió la nota, 'texto' = agregó nota
      this.actualizarNota(index, nota);
    }
  }

  private mostrarFeedback(mensaje: string): void {
    this.snackBar.open(mensaje, '', {
      duration: 1000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  obtenerPrecioConDescuento(producto: Product): number {
    return this.tieneDescuentoActivo(producto) ? producto.descuento! : producto.precio;
  }

  calcularPorcentajeDescuento(producto: Product): number {
    if (!this.tieneDescuentoActivo(producto) || producto.descuento! >= producto.precio) return 0;
    return Math.round(((producto.precio - producto.descuento!) / producto.precio) * 100);
  }

  trackByProductoId(index: number, item: ProductoOrden): number {
    return item.producto.id;
  }

  trackByProductId(index: number, producto: Product): number {
    return producto.id;
  }
}
