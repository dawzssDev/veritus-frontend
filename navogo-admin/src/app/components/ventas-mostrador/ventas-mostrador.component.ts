import { Component, OnInit, signal, computed, effect, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MenuService } from '../../services/menu/menu.service';
import { AuthService } from '../../services/auth/auth.service';
import { OrderService } from '../../services/orders/order.service';
import { MesaService } from '../../services/mesas/mesa.service';
import { Product, Category, Business, ProductDetail } from '../../models/business.interface';
import { ProductDetailDialogComponent } from '../product-detail-dialog/product-detail-dialog.component';
import { CartItemSelection } from '../../models/cart.interface';
import { ConfirmStatusDialogComponent } from '../confirm-status-dialog/confirm-status-dialog.component';
import { ConfirmacionPagoDialogComponent } from './confirmacion-pago-dialog/confirmacion-pago-dialog.component';
import { AgregarNotaDialogComponent } from './agregar-nota-dialog/agregar-nota-dialog.component';
import { DetalleOrdenDialogComponent } from './detalle-orden-dialog/detalle-orden-dialog.component';
import { SeleccionarMesaDialogComponent } from './seleccionar-mesa-dialog/seleccionar-mesa-dialog.component';
import { DatosRecogeDialogComponent } from './datos-recoge-dialog/datos-recoge-dialog.component';
import { TiempoEstimadoDialogComponent } from '../tiempo-estimado-dialog/tiempo-estimado-dialog.component';
import { TicketVentaDialogComponent } from './ticket-venta-dialog/ticket-venta-dialog.component';
import { CreateOrderRequest, CreateOrderItemRequest, PaymentMethod, ShippingType } from '../../models/checkout.interface';
import { Mesa } from '../../models/mesa.interface';
import { TicketVentaData, ItemTicket } from '../../models/ticket.interface';
import { VentasService } from '../../ventas/ventas.service';
import { catchError, of } from 'rxjs';
import { ClienteBuscadorComponent, ClienteSeleccionado } from '../cliente-buscador/cliente-buscador.component';
import { OrdenBorradorService } from '../../services/orden/orden-borrador.service';

// Tipos
interface ProductoCarrito {
  producto: Product;
  cantidad: number;
  nota: string;
  selections?: CartItemSelection[];
}

type TipoServicio = 'mesa' | 'llevar' | 'domicilio';
type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'combinado';

interface PagoCombinado {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
}

@Component({
  selector: 'app-ventas-mostrador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatDividerModule,
    MatDialogModule,
    MatTooltipModule,
    MatSlideToggleModule,
    ProductDetailDialogComponent,
    ClienteBuscadorComponent,
  ],
  templateUrl: './ventas-mostrador.component.html',
  styleUrl: './ventas-mostrador.component.scss',
})
export class VentasMostradorComponent implements OnInit {
  readonly COSTO_ENVIO_DEFAULT = 15;
  readonly Math = Math;

  private menuService = inject(MenuService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private mesaService = inject(MesaService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private ventasService = inject(VentasService);
  private ordenBorrador = inject(OrdenBorradorService);

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

  // Signals del carrito
  carrito = signal<ProductoCarrito[]>([]);
  
  // Signal para navegación móvil
  vistaMovil = signal<'productos' | 'orden'>('productos');
  
  // Signals del servicio
  tipoServicio = signal<TipoServicio>('mesa');
  numeroMesa = signal<number | null>(null);
  mesaSeleccionada = signal<Mesa | null>(null);
  modoSplit = false;
  mesaSplitId = 0;
  datosCliente = signal<string>('');

  esDomicilio = computed(() => this.tipoServicio() === 'domicilio');
  datosDomicilio = signal<any>(null);
  nombreRecoge = signal<string>('');
  telefonoRecoge = signal<string>('');
  clienteId = signal<number | null>(null);
  costoEnvio = signal<number>(0);
  propina = signal<number>(0);

  yaPago = signal<boolean>(false);

  tiempoEstimado = signal<string | null>(null);

  tipoEnvio = computed<'local' | 'recoger' | 'domicilio'>(() => {
    const tipo = this.tipoServicio();
    if (tipo === 'llevar') return 'recoger';
    if (tipo === 'domicilio') return 'domicilio';
    return 'local';
  });

  // Signals de pago
  metodoPago = signal<MetodoPago>('efectivo');
  montoRecibido = signal<number>(0);
  pagoCombinado = signal<PagoCombinado>({
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
  });

  private esDiaPromoValido(producto: Product | ProductDetail): boolean {
    if (Number(producto.is_recurrente) !== 1) return true;

    const dias: number[] = Array.isArray(producto.dias_promo) ? producto.dias_promo : [];
    if (dias.length === 0) return true;

    return dias.includes(new Date().getDay());
  }

  tieneDescuentoActivo(producto: Product | ProductDetail): boolean {
    if (Number(producto.precio_variable) === 1) return false;
    if (producto.descuento == null || producto.descuento <= 0) return false;
    if (producto.is_promo === 1) return this.esDiaPromoValido(producto);
    return true;
  }

  // Computed properties
  productosFiltrados = computed(() => {
    let productos = this.todosProductos();
    const categoria = this.categoriaActiva();
    const busquedaText = this.busqueda().toLowerCase().trim();

    // Filtrar por categoría
    if (categoria !== 'todos') {
      productos = productos.filter(p => 
        (p.categoria?.toString() || '').toLowerCase() === categoria.toLowerCase()
      );
    }

    // Filtrar por búsqueda
    if (busquedaText) {
      productos = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaText) ||
        p.descripcion?.toLowerCase().includes(busquedaText)
      );
    }

    productos = productos.filter(producto => {
      if (producto.is_promo === 1 && !this.tieneDescuentoActivo(producto)) {
        return this.esDiaPromoValido(producto);
      }

      return true;
    });

    return productos;
  });

  subtotal = computed(() => {
    return this.carrito().reduce((total, item) => {
      // Si tiene complementos, el precio ya incluye el base + extras
      if (item.selections && item.selections.length > 0) {
        return total + (item.producto.precio * item.cantidad);
      }
      // Si no tiene complementos, usar descuento si existe, sino precio original
      const precioFinal = this.obtenerPrecioConDescuento(item.producto);
      return total + (precioFinal * item.cantidad);
    }, 0);
  });

  calcularTotal(): number {
    return this.subtotal() + this.costoEnvio() + this.propina();
  }

  totalOrden = computed(() => this.calcularTotal());

  cambio = computed(() => {
    const metodo = this.metodoPago();
    if (metodo === 'efectivo') {
      return Math.max(0, this.montoRecibido() - this.totalOrden());
    } else if (metodo === 'combinado') {
      const pago = this.pagoCombinado();
      const efectivo      = parseFloat(String(pago.efectivo      ?? 0)) || 0;
      const tarjeta       = parseFloat(String(pago.tarjeta       ?? 0)) || 0;
      const transferencia = parseFloat(String(pago.transferencia ?? 0)) || 0;
      const totalOrden    = this.totalOrden();
      const efectivoNecesario = Math.max(0, totalOrden - tarjeta - transferencia);
      return Math.max(0, efectivo - efectivoNecesario);
    }
    return 0;
  });

  totalPagadoCombinado = computed(() => {
    const p = this.pagoCombinado();
    return (parseFloat(String(p.efectivo      ?? 0)) || 0)
         + (parseFloat(String(p.tarjeta       ?? 0)) || 0)
         + (parseFloat(String(p.transferencia ?? 0)) || 0);
  });

  ordenValida = computed(() => {
    const tieneProductos = this.carrito().length > 0;
    const total = this.totalOrden();
    const metodo = this.metodoPago();
    const tipo = this.tipoServicio();

    if (!tieneProductos) return false;

    // Validar campos según tipo de servicio
    if (tipo === 'mesa' && !this.mesaSeleccionada()) return false;
    if (tipo === 'domicilio' && !this.datosDomicilio()) return false;
    if (tipo === 'llevar' && (!this.nombreRecoge().trim() || !this.telefonoRecoge().trim())) {
      return false;
    }

    // Validar pago
    if (metodo === 'efectivo') {
      const tipoEnvio = this.tipoEnvio();
      if ((tipoEnvio === 'recoger' && !this.yaPago()) || tipoEnvio === 'domicilio') {
        return true;
      }
      return this.montoRecibido() >= total;
    } else if (metodo === 'combinado') {
      return this.totalPagadoCombinado() >= total;
    }

    return true; // Para tarjeta y transferencia
  });

  // Effect para limpiar búsqueda con debounce
  constructor() {
    effect(() => {
      const busqueda = this.busqueda();
      // Este effect se ejecuta cada vez que cambia busqueda
    });
  }

  ngOnInit(): void {
    // Restaurar borrador si venimos de /clientes/nuevo
    if (this.ordenBorrador.existe()) {
      const b = this.ordenBorrador.restaurar()!;
      this.carrito.set(b.carrito);
      this.tipoServicio.set(b.tipoServicio as any);
      this.mesaSeleccionada.set(b.mesaSeleccionada);
      this.datosDomicilio.set(b.datosDomicilio);
      this.clienteId.set(b.clienteId);
      this.metodoPago.set(b.metodoPago as any);
      this.montoRecibido.set(b.montoRecibido);
      this.pagoCombinado.set(b.pagoCombinado);
      if (b.nombreRecoge) this.nombreRecoge.set(b.nombreRecoge);
      if (b.telefonoRecoge) this.telefonoRecoge.set(b.telefonoRecoge);
      this.ordenBorrador.limpiar();
    }

    this.cargarMenu();

    // Leer queryParams para split de mesa
    const mesaId = this.route.snapshot
      .queryParamMap.get('mesa_id');
    const esSplit = this.route.snapshot
      .queryParamMap.get('mesa_split');

    if (mesaId && esSplit === 'true') {
      this.modoSplit = true;
      this.mesaSplitId = Number(mesaId);
      this.tipoServicio.set('mesa');

      // Cargar y preseleccionar la mesa
      this.mesaService.getAll().subscribe({
        next: (resp) => {
          const mesa = (resp.data ?? [])
            .find((m) => m.id === Number(mesaId));
          if (mesa) {
            this.mesaSeleccionada.set(mesa);
            const num = mesa.identificador.match(/\d+/);
            this.numeroMesa.set(
              num ? parseInt(num[0]) : mesa.id
            );
          }
        },
        error: () => {}
      });
    }
  }

  private cargarMenu(): void {
    this.isLoading.set(true);
    
    // Obtener empresa_id del usuario autenticado
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
        
        // Extraer todos los productos de todas las categorías
        const productos: Product[] = [];
        data.categorias?.forEach(cat => {
          cat.productos?.forEach(prod => {
            productos.push(prod);
          });
        });
        this.todosProductos.set(productos);
        this.isLoading.set(false);

        // Obtener el nombre real de la empresa (getMenuByEmpresaId pone 'Cargando...' como placeholder)
        this.menuService.getEmpresaById(empresaId).subscribe({
          next: (empresa) => {
            if (empresa?.nombre) {
              this.menuData.update(m => m ? { ...m, nombre: empresa.nombre, direccion: empresa.direccion } : m);
            }
          },
          error: () => {} // silencioso: si falla, el nombre queda como fallback
        });
      },
      error: (err) => {
        console.error('Error cargando menú:', err);
        this.snackBar.open('Error al cargar el menú', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      },
    });
  }

  // Métodos de categorías
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

  // Métodos de búsqueda
  onBusquedaChange(value: string): void {
    clearTimeout(this.busquedaDebounce);
    this.busquedaDebounce = setTimeout(() => {
      this.busqueda.set(value);
    }, 300);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  /**
   * Abrir diálogo de detalle de producto para seleccionar complementos
   */
  viewProduct(producto: Product): void {
    // Forzar cierre si estaba abierto para asegurar detección de cambio
    if (this.showProductModal()) {
      this.showProductModal.set(false);
      this.selectedProductId.set(null);
      this.cdr.detectChanges();
      
      // Pequeño delay para asegurar procesamiento completo
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

  /**
   * Agregar producto al carrito desde el diálogo de detalle (con complementos)
   */
  onAddFromDetail(event: { product: ProductDetail; quantity: number; selections: CartItemSelection[] }): void {
    const p = event.product;
    const base = this.tieneDescuentoActivo(p) ? Number(p.descuento) : Number(p.precio);
    const baseSafe = Number.isFinite(base) ? base : Number(p.precio);

    // Calcular precio con complementos
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

    // Agregar al carrito con complementos
    const carritoActual = [...this.carrito()];
    
    // Por cada unidad de cantidad, agregar como item separado para mantener consistencia
    for (let i = 0; i < event.quantity; i++) {
      carritoActual.push({
        producto: {
          ...p,
          precio: precioFinal
        } as Product,
        cantidad: 1,
        nota: '',
        selections: event.selections
      });
    }

    this.carrito.set(carritoActual);
    this.mostrarFeedback(`${event.quantity} producto(s) agregado(s)`);
  }

  // Métodos del carrito
  agregarAlCarrito(producto: Product): void {
    const carritoActual = [...this.carrito()];
    const indiceExistente = carritoActual.findIndex(
      item => item.producto.id === producto.id && !item.selections
    );

    if (indiceExistente !== -1) {
      carritoActual[indiceExistente].cantidad++;
    } else {
      carritoActual.push({
        producto,
        cantidad: 1,
        nota: '',
      });
    }

    this.carrito.set(carritoActual);
    this.mostrarFeedback('Producto agregado');
  }

  aumentarCantidad(index: number): void {
    const carritoActual = [...this.carrito()];
    carritoActual[index].cantidad++;
    this.carrito.set(carritoActual);
  }

  disminuirCantidad(index: number): void {
    const carritoActual = [...this.carrito()];
    if (carritoActual[index].cantidad > 1) {
      carritoActual[index].cantidad--;
      this.carrito.set(carritoActual);
    }
  }

  eliminarDelCarrito(index: number): void {
    const item = this.carrito()[index];
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
        const carritoActual = [...this.carrito()];
        carritoActual.splice(index, 1);
        this.carrito.set(carritoActual);
        this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 2000 });
      }
    });
  }

  actualizarNota(index: number, nota: string): void {
    const carritoActual = [...this.carrito()];
    carritoActual[index].nota = nota;
    this.carrito.set(carritoActual);
  }

  async abrirDialogNota(index: number): Promise<void> {
    const item = this.carrito()[index];
    
    const dialogRef = this.dialog.open(AgregarNotaDialogComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: {
        nota: item.nota || '',
        nombreProducto: item.producto.nombre,
      },
      disableClose: false,
      autoFocus: true,
    });

    const nota = await dialogRef.afterClosed().toPromise();
    
    if (nota !== undefined) {
      // undefined = canceló, '' = limpió la nota, 'texto' = agregó nota
      this.actualizarNota(index, nota);
    }
  }

  // Ver detalle completo de la orden
  verDetalleOrden(): void {
    this.dialog.open(DetalleOrdenDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: {
        carrito: this.carrito(),
        tipoServicio: this.tipoServicio(),
        numeroMesa: this.numeroMesa(),
        datosCliente: this.datosCliente(),
        subtotal: this.subtotal(),
        total: this.totalOrden(),
      },
      disableClose: false,
      autoFocus: false,
    });
  }

  // Navegación móvil
  irAOrden(): void {
    this.vistaMovil.set('orden');
  }

  irAProductos(): void {
    this.vistaMovil.set('productos');
  }

  obtenerCantidadEnCarrito(productoId: number): number {
    const item = this.carrito().find(i => i.producto.id === productoId);
    return item ? item.cantidad : 0;
  }

  calcularSubtotalItem(item: ProductoCarrito): number {
    // Si tiene complementos, el precio ya incluye el base + extras
    if (item.selections && item.selections.length > 0) {
      return item.producto.precio * item.cantidad;
    }
    // Si no tiene complementos, usar descuento si existe, sino precio original
    const precioFinal = this.obtenerPrecioConDescuento(item.producto);
    return precioFinal * item.cantidad;
  }

  // Métodos de tipo de servicio
  seleccionarTipoServicio(tipo: TipoServicio): void {
    if (tipo === 'domicilio') {
      this.tipoServicio.set('domicilio');
      this.numeroMesa.set(null);
      this.mesaSeleccionada.set(null);
      this.datosCliente.set('');
      this.nombreRecoge.set('');
      this.telefonoRecoge.set('');
      this.yaPago.set(false);
      this.costoEnvio.set(this.COSTO_ENVIO_DEFAULT);
      this.limpiarTiempoEstimado();
      return;
    }
    this.tipoServicio.set(tipo);
    this.numeroMesa.set(null);
    this.mesaSeleccionada.set(null);
    this.datosCliente.set('');
    this.datosDomicilio.set(null);
    this.nombreRecoge.set('');
    this.telefonoRecoge.set('');
    this.clienteId.set(null);
    this.costoEnvio.set(0);
    this.yaPago.set(false);
    if (tipo !== 'llevar') {
      this.limpiarTiempoEstimado();
    }
  }

  getTiempoBotonLabel(): string {
    const valor = this.tiempoEstimado();
    if (!valor) return 'Sin definir';
    const fecha = new Date(valor.replace(' ', 'T'));
    const diff = fecha.getTime() - Date.now();
    const min = Math.round(diff / 60000);
    if (min <= 0) return 'Ahora';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  abrirTiempoEstimado(): void {
    const ref = this.dialog.open(TiempoEstimadoDialogComponent, {
      data: {
        valorActual: this.tiempoEstimado() ?? '',
      },
      width: '400px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
    });

    ref.afterClosed().subscribe((resultado) => {
      if (resultado !== undefined) {
        this.tiempoEstimado.set(resultado);
      }
    });
  }

  private limpiarTiempoEstimado(): void {
    this.tiempoEstimado.set(null);
  }

  onClienteSeleccionado(ev: ClienteSeleccionado): void {
    if (!ev?.cliente) {
      this.clienteId.set(null);
      this.datosDomicilio.set(null);
      this.datosCliente.set('');
      return;
    }
    this.clienteId.set(ev.cliente.id);
    const dir = ev.direccion;
    this.datosDomicilio.set({
      customer_name: ev.cliente.nombre,
      customer_phone: ev.cliente.telefono,
      delivery_address: dir
        ? { calle: dir.calle, numero: '', colonia: dir.colonia, ciudad: dir.ciudad, referencias: dir.referencia }
        : null,
    });
    const dirLabel = dir ? this.formatDirLabel(dir) : '';
    this.datosCliente.set(`${ev.cliente.nombre}${dirLabel}`);
  }

  onSolicitaCrearCliente(): void {
    this.ordenBorrador.guardar({
      carrito:          this.carrito(),
      tipoServicio:     this.tipoServicio(),
      mesaSeleccionada: this.mesaSeleccionada(),
      datosDomicilio:   this.datosDomicilio(),
      nombreRecoge:     this.nombreRecoge(),
      telefonoRecoge:   this.telefonoRecoge(),
      clienteId:        this.clienteId(),
      metodoPago:       this.metodoPago(),
      montoRecibido:    this.montoRecibido(),
      pagoCombinado:    this.pagoCombinado(),
    });
    this.router.navigate(['/clientes/nuevo'], {
      queryParams: { returnTo: 'ventas-mostrador' },
    });
  }

  onSeleccionarDomicilio(): void {
    const ref = this.dialog.open(DomicilioDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((datos: any) => {
      if (!datos) return; // usuario canceló
      this.tipoServicio.set('domicilio');
      this.costoEnvio.set(this.COSTO_ENVIO_DEFAULT);
      this.datosDomicilio.set(datos);
      const addr = datos.delivery_address;
      const dirLabel = addr ? this.formatDirLabel(addr) : '';
      this.datosCliente.set(`${datos.customer_name}${dirLabel}`);
    });
  }

  onCapturarDireccionCliente(): void {
    const existente = this.datosDomicilio();
    const ref = this.dialog.open(DomicilioDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
      data: existente
        ? { name: existente.customer_name, phone: existente.customer_phone }
        : null,
    });
    ref.afterClosed().subscribe((datos: any) => {
      if (!datos) return;
      const actualizado = { ...existente, delivery_address: datos.delivery_address };
      this.datosDomicilio.set(actualizado);
      const addr = datos.delivery_address;
      const nombre = existente?.customer_name ?? '';
      const dirLabel = addr ? this.formatDirLabel(addr) : '';
      this.datosCliente.set(`${nombre}${dirLabel}`);
    });
  }

  // Abrir diálogo para seleccionar mesa
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
        // Extraer el número de mesa del identificador si es posible
        const numeroMatch = mesaSeleccionada.identificador.match(/\d+/);
        if (numeroMatch) {
          this.numeroMesa.set(parseInt(numeroMatch[0], 10));
        } else {
          // Si no hay número, usar el ID de la mesa
          this.numeroMesa.set(mesaSeleccionada.id);
        }
      }
    });
  }

  abrirDatosRecoge(): void {
    const ref = this.dialog.open(DatosRecogeDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      disableClose: false,
      autoFocus: true,
      data: {
        nombre: this.nombreRecoge(),
        telefono: this.telefonoRecoge(),
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.nombreRecoge.set(result.nombre);
        this.telefonoRecoge.set(result.telefono);
      }
    });
  }

  // Métodos de pago
  seleccionarMetodoPago(metodo: MetodoPago): void {
    this.metodoPago.set(metodo);
    this.montoRecibido.set(0);
    this.pagoCombinado.set({ efectivo: 0, tarjeta: 0, transferencia: 0 });
  }

  actualizarPagoCombinado(
    campo: keyof PagoCombinado,
    valor: number | string | null
  ): void {
    const n = parseFloat(String(valor ?? ''));
    this.pagoCombinado.update(p => ({
      ...p,
      [campo]: isNaN(n) ? 0 : n,
    }));
  }

  // Registro de venta
  async registrarVenta(): Promise<void> {
    if (!this.ordenValida()) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Obtener empresa_id del usuario autenticado
    const empresaId = this.authService.getEmpresaId();
    
    if (!empresaId) {
      this.snackBar.open('No se encontró empresa asociada al usuario', 'Cerrar', { 
        duration: 3000 
      });
      return;
    }

    // Re-abrir dialog si faltan datos de domicilio
    if (this.tipoServicio() === 'domicilio' && !this.datosDomicilio()) {
      this.onSeleccionarDomicilio();
      return;
    }

    // Preparar datos para el diálogo de confirmación
    const productosResumen = this.carrito().map(item => ({
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      subtotal: this.calcularSubtotalItem(item)
    }));

    // Abrir diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmacionPagoDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: {
        tipoServicio: this.tipoServicio(),
        numeroMesa: this.numeroMesa(),
        datosCliente: this.tipoServicio() === 'llevar'
          ? `${this.nombreRecoge().trim()} · ${this.telefonoRecoge().trim()}`
          : this.datosCliente(),
        nombreRecoge: this.nombreRecoge(),
        telefonoRecoge: this.telefonoRecoge(),
        productos: productosResumen,
        subtotal: this.subtotal(),
        costoEnvio: this.costoEnvio(),
        propina: this.propina(),
        total: this.totalOrden(),
        metodoPago: this.metodoPago(),
        montoRecibido: this.montoRecibido(),
        cambio: this.cambio(),
        pagoCombinado: this.pagoCombinado(),
      },
      disableClose: false,
      autoFocus: true,
    });

    const confirmado = await dialogRef.afterClosed().toPromise();
    
    if (!confirmado) {
      return; // Usuario canceló
    }

    // Preparar datos para crear la orden
    const tipoServicioActual = this.tipoServicio();
    
    // Mapear método de pago a PaymentMethod
    let paymentMethod: PaymentMethod = 'efectivo';
    const metodoPagoActual = this.metodoPago();
    if (metodoPagoActual === 'tarjeta' || metodoPagoActual === 'transferencia') {
      paymentMethod = metodoPagoActual;
    }

    // Determinar nombre y teléfono del cliente
    let nombreCliente = 'Cliente Mostrador';
    let telefonoCliente = '0000000000';
    
    if (tipoServicioActual === 'domicilio' && this.datosDomicilio()) {
      nombreCliente  = this.datosDomicilio().customer_name;
      telefonoCliente = this.datosDomicilio().customer_phone;
    } else if (tipoServicioActual === 'mesa') {
      // Usar el identificador de la mesa si está seleccionada
      const mesa = this.mesaSeleccionada();
      if (mesa) {
        nombreCliente = `Mesa ${mesa.identificador}`;
      } else if (this.numeroMesa()) {
        nombreCliente = `Mesa ${this.numeroMesa()}`;
      }
    } else if (tipoServicioActual === 'llevar') {
      nombreCliente = this.nombreRecoge().trim();
      telefonoCliente = this.telefonoRecoge().trim();
    }

    // Preparar items de la orden
    const items: CreateOrderItemRequest[] = this.carrito().map(item => {
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
    
    if (tipoServicioActual === 'mesa') {
      const mesa = this.mesaSeleccionada();
      if (mesa) {
        // Información completa de la mesa
        let mesaInfo = `Mesa ${mesa.identificador}`;
        if (mesa.zona) {
          mesaInfo += ` (${mesa.zona})`;
        }
        notasParts.push(mesaInfo);
      } else if (this.numeroMesa()) {
        notasParts.push(`Mesa ${this.numeroMesa()}`);
      }
    }
    
    if (tipoServicioActual === 'llevar') {
      notasParts.push(`Para llevar — Recoge: ${this.nombreRecoge().trim()}`);
    }
    
    // Agregar notas de productos si existen
    const notasProductos = this.carrito()
      .filter(item => item.nota && item.nota.trim())
      .map(item => `${item.producto.nombre}: ${item.nota}`);
    
    if (notasProductos.length > 0) {
      notasParts.push(...notasProductos);
    }
    
    // Agregar información de pago combinado si aplica
    if (metodoPagoActual === 'combinado') {
      const pago = this.pagoCombinado();
      const pagosParts: string[] = [];
      if (pago.efectivo > 0) pagosParts.push(`Efectivo: $${pago.efectivo.toFixed(2)}`);
      if (pago.tarjeta > 0) pagosParts.push(`Tarjeta: $${pago.tarjeta.toFixed(2)}`);
      if (pago.transferencia > 0) pagosParts.push(`Transferencia: $${pago.transferencia.toFixed(2)}`);
      if (pagosParts.length > 0) {
        notasParts.push(`Pago combinado: ${pagosParts.join(', ')}`);
      }
    }

    const notaFinal = notasParts.length > 0 ? notasParts.join(' | ') : undefined;

    // Construir pagos para método combinado
    let pagosPayload: { metodo: string; monto: number }[] | undefined;

    if (metodoPagoActual === 'combinado') {
      const pago = this.pagoCombinado();
      pagosPayload = [];
      if (pago.efectivo > 0) {
        pagosPayload.push({
          metodo: 'efectivo',
          monto:  Number(pago.efectivo),
        });
      }
      if (pago.tarjeta > 0) {
        pagosPayload.push({
          metodo: 'tarjeta',
          monto:  Number(pago.tarjeta),
        });
      }
      if (pago.transferencia > 0) {
        pagosPayload.push({
          metodo: 'transferencia',
          monto:  Number(pago.transferencia),
        });
      }
    }

    // Crear payload de la orden
    const payload: CreateOrderRequest = {
      business_id: empresaId,
      sucursal_id: this.authService.getSucursalId(),
      customer_name: nombreCliente,
      customer_phone: telefonoCliente,
      shipping_type: tipoServicioActual === 'llevar' ? 'recoger'
                   : tipoServicioActual === 'domicilio' ? 'domicilio'
                   : 'local',
      payment_method: metodoPagoActual === 'combinado'
        ? 'combinado'
        : paymentMethod,
      pago_confirmado: this.tipoEnvio() === 'local'
        ? true
        : this.yaPago(),
      envio_confirmado: true, // En mostrador el envío/entrega SIEMPRE se confirma inmediatamente
      subtotal: this.subtotal(),
      tip: this.propina(),
      shipping_cost: this.costoEnvio(),
      total: this.calcularTotal(),
      delivery_address: tipoServicioActual === 'domicilio' && this.datosDomicilio()
        ? this.datosDomicilio().delivery_address
        : null,
      note: notaFinal || null,
      items: items,
      pagos: pagosPayload,
      cobro_inmediato: this.yaPago(),
      tiempo_entrega_estimado: this.tiempoEstimado(),
    };

    // Enviar orden al backend
    this.orderService.createOrder(payload).subscribe({
      next: (response) => {
        console.log('✅ Venta registrada:', response);
        console.log('📋 Campos del response:', Object.keys(response));
        console.log('📋 folio:', response.folio, '| folio_diario:', response.folio_diario, '| order_id:', response.order_id, '| id:', response.id);
        
        const ordenId = response.order_id ?? response.id;
        
        // Si hay una mesa seleccionada y el tipo de servicio es mesa, actualizar estado con id_orden
        const mesaActual = this.mesaSeleccionada();
        if (mesaActual && tipoServicioActual === 'mesa' && ordenId) {
          if (this.modoSplit && this.mesaSplitId > 0) {
            // Es un split: registrar la nueva cuenta en la mesa existente
            this.mesaService
              .splitMesa(this.mesaSplitId, ordenId)
              .subscribe({
                next: () => {
                  console.log('✅ Split registrado');
                },
                error: (e) => {
                  console.error('❌ Error en split:', e);
                }
              });
          } else {
            // Flujo normal: marcar mesa como ocupada
            this.mesaService
              .cambiarEstado(mesaActual.id, 'ocupada', {
                id_orden: ordenId
              })
              .subscribe({
                next: () => {
                  console.log('✅ Mesa actualizada');
                },
                error: (e) => {
                  console.error('❌ Error mesa:', e);
                }
              });
          }
        }

        // Calcular folio del día consultando las órdenes de hoy
        const hoy = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
        this.orderService.listOrders(hoy).pipe(
          catchError(() => of([]))
        ).subscribe(res => {
          const rows: any[] = Array.isArray(res) ? res
            : (Array.isArray((res as any)?.data) ? (res as any).data : []);

          // Mismo criterio que recomputeDailyFolios en pedidos-lista: ordenar ASC por created_at + id
          const sorted = [...rows].sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : Infinity;
            const tb = b.created_at ? new Date(b.created_at).getTime() : Infinity;
            return ta !== tb ? ta - tb : a.id - b.id;
          });

          const idx = sorted.findIndex((o: any) => o.id === ordenId);
          // Si ya aparece en la lista → posición 1-based; si no llegó aún → último lugar
          const folioDia: number = idx >= 0 ? idx + 1 : sorted.length;

          // Obtener folio acumulativo de empresa buscando la posición exacta de esta orden
          this.ventasService.getFolioDeOrden(ordenId).subscribe(folioEmpresa => {
            // Construir datos del ticket
            const ticketData: TicketVentaData = {
              orden: {
                id: ordenId || 0,
                folio: response.folio ?? response.folio_diario ?? undefined,
                folio_diario: response.folio_diario ?? undefined,
                folio_dia: response.folio_diario ?? folioDia,
                folio_empresa: folioEmpresa > 0 ? folioEmpresa : undefined,
                fecha: new Date().toISOString(),
                items: this.carrito().map(item => {
                  const itemTicket: ItemTicket = {
                    nombre: item.producto.nombre,
                    cantidad: item.cantidad,
                    precio: item.producto.precio,
                    subtotal: this.calcularSubtotalItem(item),
                    nota: item.nota || undefined,
                    complementos: item.selections?.map(s => ({
                      nombre: s.extra,
                      precio: s.precio ?? s['precio-extra'] ?? 0
                    })) ?? []
                  };
                  return itemTicket;
                }),
                subtotal: this.subtotal(),
                propina: this.propina(),
                costo_envio: this.costoEnvio(),
                total: this.calcularTotal(),
                metodo_pago: this.metodoPago(),
                pagos_combinado: metodoPagoActual === 'combinado'
                  ? (() => {
                      const p = this.pagoCombinado();
                      const arr: { metodo: string; monto: number }[] = [];
                      if (p.efectivo > 0) {
                        arr.push({ metodo: 'efectivo', monto: p.efectivo });
                      }
                      if (p.tarjeta > 0) {
                        arr.push({ metodo: 'tarjeta', monto: p.tarjeta });
                      }
                      if (p.transferencia > 0) {
                        arr.push({
                          metodo: 'transferencia',
                          monto:  p.transferencia,
                        });
                      }
                      return arr;
                    })()
                  : undefined,
                monto_recibido: this.metodoPago() === 'efectivo' ? this.montoRecibido() : undefined,
                cambio: this.metodoPago() === 'efectivo' ? this.cambio() : undefined,
                tipo_servicio: this.tipoServicio(),
                mesa: mesaActual?.identificador || this.numeroMesa()?.toString(),
                nombre_cliente: tipoServicioActual === 'llevar'
                  ? this.nombreRecoge().trim()
                  : (this.datosDomicilio()?.customer_name
                    || this.datosCliente()
                    || undefined),
                telefono_cliente: telefonoCliente !== '0000000000'
                  ? telefonoCliente
                  : undefined,
                direccion_entrega: this.tipoServicio() === 'domicilio'
                  ? (this.datosDomicilio()?.delivery_address ?? null)
                  : undefined,
                nombre_empresa: this.menuData()?.nombre || 'Mi Negocio',
                direccion_empresa: this.menuData()?.direccion || undefined,
                cobro_inmediato: this.yaPago(),
                nota: notaFinal,
              }
            };

            // Abrir dialog de preview del ticket
            const dialogRef = this.dialog.open(TicketVentaDialogComponent, {
              data: ticketData,
              width: '820px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              disableClose: true
            });

            // Al cerrar el dialog, limpiar el formulario
            dialogRef.afterClosed().subscribe(() => {
              this.limpiarOrden();
            });
          });
        });
      },
      error: (error) => {
        console.error('❌ Error registrando venta:', error);
        
        this.snackBar.open('❌ Error al registrar la venta. Intenta de nuevo.', 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }

  limpiarOrden(): void {
    this.carrito.set([]);
    this.tipoServicio.set('mesa');
    this.numeroMesa.set(null);
    this.mesaSeleccionada.set(null);
    this.datosCliente.set('');
    this.datosDomicilio.set(null);
    this.nombreRecoge.set('');
    this.telefonoRecoge.set('');
    this.clienteId.set(null);
    this.metodoPago.set('efectivo');
    this.montoRecibido.set(0);
    this.pagoCombinado.set({ efectivo: 0, tarjeta: 0, transferencia: 0 });
    this.costoEnvio.set(0);
    this.propina.set(0);
    this.yaPago.set(false);
    this.limpiarTiempoEstimado();
    // Volver a vista de productos en móvil
    this.vistaMovil.set('productos');

    this.modoSplit = false;
    this.mesaSplitId = 0;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private mostrarFeedback(mensaje: string): void {
    this.snackBar.open(mensaje, '', {
      duration: 1000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  /** Resumen de dirección para etiqueta y detalle (alias, ciudad, referencia) */
  formatDirLabel(dir: {
    alias?: string;
    calle?: string;
    colonia?: string;
    ciudad?: string;
    referencia?: string;
    referencias?: string;
  }): string {
    const partes: string[] = [];
    const alias = (dir.alias ?? '').trim();
    const calleColonia = [dir.calle, dir.colonia].filter((p) => !!(p ?? '').toString().trim()).join(', ');
    const ciudad = (dir.ciudad ?? '').trim();
    const ref = (dir.referencia ?? dir.referencias ?? '').toString().trim();

    if (alias) partes.push(alias);
    if (calleColonia) partes.push(calleColonia);
    if (ciudad) partes.push(ciudad);
    if (ref) partes.push(`Ref: ${ref}`);

    return partes.length ? ` - ${partes.join(' · ')}` : '';
  }

  // Helpers para plantilla
  obtenerPrecioConDescuento(producto: Product): number {
    return this.tieneDescuentoActivo(producto) ? producto.descuento! : producto.precio;
  }

  calcularPorcentajeDescuento(producto: Product): number {
    if (!this.tieneDescuentoActivo(producto) || producto.descuento! >= producto.precio) return 0;
    return Math.round(((producto.precio - producto.descuento!) / producto.precio) * 100);
  }

  trackByProductoId(index: number, item: ProductoCarrito): number {
    return item.producto.id;
  }

  trackByProductId(index: number, producto: Product): number {
    return producto.id;
  }
}

// ─── Dialog de datos de entrega a domicilio ──────────────────────────────────

@Component({
  selector: 'app-domicilio-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div mat-dialog-title class="dom-header">
      <mat-icon>delivery_dining</mat-icon>
      <span>Datos de entrega a domicilio</span>
      <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" class="dom-form">

        <p class="dom-section">Contacto</p>
        <div formGroupName="contact">

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-full">
            <mat-label>Nombre *</mat-label>
            <input matInput formControlName="name" placeholder="Tu nombre" />
            @if (form.get('contact.name')?.touched && form.get('contact.name')?.invalid) {
              <mat-error>Escribe tu nombre (mín. 2 caracteres)</mat-error>
            }
          </mat-form-field>

          <div class="dom-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-country">
              <mat-label>País</mat-label>
              <input matInput formControlName="phoneCountry" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-phone">
              <mat-label>Teléfono *</mat-label>
              <input matInput type="tel" inputmode="numeric"
                     formControlName="phone" placeholder="9991234567" />
              @if (form.get('contact.phone')?.touched && form.get('contact.phone')?.invalid) {
                <mat-error>Ingresa un teléfono válido</mat-error>
              }
            </mat-form-field>
          </div>

        </div>

        <p class="dom-section">Dirección</p>
        <div formGroupName="address">

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-full">
            <mat-label>Colonia *</mat-label>
            <input matInput formControlName="colonia" placeholder="Ej: Centro" />
            @if (form.get('address.colonia')?.touched && form.get('address.colonia')?.invalid) {
              <mat-error>Colonia requerida</mat-error>
            }
          </mat-form-field>

          <div class="dom-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-calle">
              <mat-label>Calle *</mat-label>
              <input matInput formControlName="calle" placeholder="Ej: Calle 60" />
              @if (form.get('address.calle')?.touched && form.get('address.calle')?.invalid) {
                <mat-error>Calle requerida</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-numero">
              <mat-label>Número *</mat-label>
              <input matInput formControlName="numero" placeholder="Ej: 123" />
              @if (form.get('address.numero')?.touched && form.get('address.numero')?.invalid) {
                <mat-error>Requerido</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-full">
            <mat-label>Entre calles (opcional)</mat-label>
            <input matInput formControlName="entreCalles" placeholder="Ej: 59 y 61" />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dom-full">
            <mat-label>Referencias (opcional)</mat-label>
            <input matInput formControlName="referencias"
                   placeholder="Ej: Casa con portón negro" />
          </mat-form-field>

        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary"
              [disabled]="form.invalid"
              (click)="confirmar()">
        <mat-icon>check</mat-icon>
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dom-header {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 8px 8px 20px;
      span { flex: 1; font-size: 17px; font-weight: 700; }
    }
    .dom-form { display: flex; flex-direction: column; gap: 2px; min-width: 280px; }
    .dom-section {
      font-size: 11px; font-weight: 700; color: #854F0B;
      text-transform: uppercase; letter-spacing: .05em;
      margin: 12px 0 6px;
    }
    .dom-full { width: 100%; }
    .dom-row { display: flex; gap: 10px; margin-bottom: 0; }
    .dom-country { width: 80px; flex-shrink: 0; }
    .dom-phone { flex: 1; }
    .dom-calle { flex: 2; }
    .dom-numero { flex: 1; }
  `],
})
export class DomicilioDialogComponent {
  private fb  = inject(FormBuilder);
  dialogRef   = inject(MatDialogRef<DomicilioDialogComponent>);
  data        = inject<{ name?: string; phone?: string } | null>(MAT_DIALOG_DATA, { optional: true });

  form = this.fb.nonNullable.group({
    contact: this.fb.nonNullable.group({
      name:         [this.data?.name ?? '', [Validators.required, Validators.minLength(2)]],
      phoneCountry: ['+52', Validators.required],
      phone:        [this.data?.phone?.replace(/^\+\d{2}/, '') ?? '', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    }),
    address: this.fb.nonNullable.group({
      colonia:     ['', [Validators.required, Validators.minLength(2)]],
      calle:       ['', [Validators.required, Validators.minLength(2)]],
      numero:      ['', [Validators.required, Validators.minLength(1)]],
      entreCalles: [''],
      referencias: [''],
    }),
  });

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.dialogRef.close({
      customer_name:    v.contact.name.trim(),
      customer_phone:   `${v.contact.phoneCountry}${v.contact.phone}`,
      delivery_address: {
        colonia:     v.address.colonia.trim(),
        calle:       v.address.calle.trim(),
        numero:      v.address.numero.trim(),
        entreCalles: v.address.entreCalles.trim() || undefined,
        referencias: v.address.referencias.trim() || undefined,
      },
    });
  }
}
