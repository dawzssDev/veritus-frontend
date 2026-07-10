import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

// CDK Drag & Drop
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';

// Models & Services
import { Mesa, EstadoMesa, OrderItem, Order, OrderItemSelection, Seleccion, ItemNuevoPayload } from '../../models/mesa.interface';
import { MesaService } from '../../services/mesas/mesa.service';
import { OrderService } from '../../services/orders/order.service';
import { MenuService } from '../../services/menu/menu.service';
import { Product, Category } from '../../models/business.interface';
import { AuthService } from '../../services/auth/auth.service';

// Dialogs
import { CrearEditarMesaDialogComponent } from './dialogs/crear-editar-mesa/crear-editar-mesa.dialog';
import { ConfirmarEliminarMesaDialogComponent } from './dialogs/confirmar-eliminar-mesa/confirmar-eliminar-mesa.dialog';
import { ConfirmarLiberarMesaDialogComponent } from './dialogs/confirmar-liberar-mesa/confirmar-liberar-mesa.dialog';
import { QrMesaDialogComponent } from './dialogs/qr-mesa/qr-mesa.dialog';
import { ProductDetailDialogComponent } from '../product-detail-dialog/product-detail-dialog.component';
import { ConfirmarPagoDialogComponent } from './confirmar-pago-dialog.component';
import { TicketVentaDialogComponent } from '../ventas-mostrador/ticket-venta-dialog/ticket-venta-dialog.component';
import { TicketVentaData, ItemTicket } from '../../models/ticket.interface';
import { OrderFolioSource } from '../../utils/order-folio.util';
import { VentasService } from '../../ventas/ventas.service';
import { CartItemSelection } from '../../models/cart.interface';
import { ProductDetail } from '../../models/business.interface';
import { ReservaService } from './reserva.service';
import { Reserva } from './reserva.interface';
import { ReservaFormDialogComponent } from './dialogs/reserva-form/reserva-form.dialog';
import { AgregarNotaDialogComponent } from '../ventas-mostrador/agregar-nota-dialog/agregar-nota-dialog.component';
import { TurnoEstadoService } from '../../turno-caja/turno-estado.service';
import { TicketAreasService } from '../../services/ticket-areas/ticket-areas.service';

type ItemComanda = OrderItem;

interface Complemento {
  id: string;
  nombre: string;
  grupo?: string;
  precio: number;
}

@Component({
  selector: 'app-gestion-mesas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatBadgeModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    DragDropModule,
    ProductDetailDialogComponent,
    ReservaFormDialogComponent,
  ],
  templateUrl: './gestion-mesas.component.html',
  styleUrl: './gestion-mesas.component.scss',
})
export class GestionMesasComponent implements OnInit, OnDestroy {
  private mesaService = inject(MesaService);
  private orderService = inject(OrderService);
  private menuService = inject(MenuService);
  private authService = inject(AuthService);
  private reservaService = inject(ReservaService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private ventasService = inject(VentasService);
  turnoEstado = inject(TurnoEstadoService);
  private ticketAreas = inject(TicketAreasService);

  @ViewChild('mapaContainer') mapaContainer!: ElementRef;

  // Signals
  mesas = signal<Mesa[]>([]);
  mesaSeleccionada = signal<Mesa | null>(null);
  vistaActual = signal<'mapa' | 'comanda'>('mapa');
  modoEdicion = signal<boolean>(false);
  cargando = signal<boolean>(false);
  filtroZona = signal<string>('todas');
  estaRedimensionando = signal<boolean>(false);
  mesaConPopoverAbierto = signal<number | null>(null);
  mesaGloboHover = signal<Mesa | null>(null);
  globoPos = signal<{ left: number; top: number }>({ left: 0, top: 0 });
  private globoAnchorEl: HTMLElement | null = null;

  // Signals para funcionalidad de agregar productos
  vistaAgregarProductos = signal<boolean>(false);
  vistaMovilAgregar = signal<'productos' | 'orden'>('productos');
  guardandoItems = signal<boolean>(false);
  guardandoPago = signal<boolean>(false);
  guardandoEnvio = signal<boolean>(false);
  procesandoItemId = signal<number | null>(null);
  productosNuevos = signal<OrderItem[]>([]);
  categoriasMenu = signal<Category[]>([]);
  todosProductosMenu = signal<Product[]>([]);
  categoriaActivaMenu = signal<string>('todos');
  busquedaMenu = signal<string>('');
  cargandoMenu = signal<boolean>(false);
  
  // Signals para el modal de producto (complementos)
  showProductModal = signal<boolean>(false);
  selectedProductId = signal<number | null>(null);
  
  // Signal para el nombre de la empresa
  nombreEmpresa = signal<string>('');
  direccionEmpresa = signal<string>('');

  // Signals de reservas
  reservas = signal<Reserva[]>([]);
  cargandoReservas = signal<boolean>(false);
  vistaCalendario = signal<'dia' | 'semana'>('dia');
  fechaCalendario = signal<Date>(new Date());

  // Modal de split
  mostrarSplitModal = signal(false);
  mostrarSplitDestinoModal = signal(false);
  mesaSplitActiva = signal<Mesa | null>(null);

  // Modal de merge
  mostrarMergeModal = signal(false);
  mesaMergeActiva = signal<Mesa | null>(null);
  mesasParaMerge = signal<number[]>([]);

  cuentaActivaId = signal<number | null>(null);

  private intervalId: any;
  private busquedaDebounce: any;

  // Constantes para drag & drop y resize
  readonly GRID_SIZE = 20;
  readonly MIN_SIZE = 80;
  readonly MAX_SIZE = 300;

  // Variables para resize
  private resizingMesa: Mesa | null = null;
  private resizeDir: string = '';
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartAncho = 0;
  private resizeStartAlto = 0;
  private resizeStartPosX = 0;
  private resizeStartPosY = 0;

  // Computed properties
  zonasDisponibles = computed(() => {
    const zonas = this.mesas()
      .map(m => m.zona)
      .filter((z): z is string => !!z && z.trim() !== '');
    return [...new Set(zonas)].sort();
  });

  mesasFiltradas = computed(() => {
    const zona = this.filtroZona();
    let resultado = this.mesas();

    if (zona === 'por_cobrar') {
      return resultado.filter(m => m.estado === 'ocupada' && !!m.orden && !m.orden.pago_confirmado);
    }

    // Filtrar por zona — NUNCA mostrar todas si hay zona seleccionada
    if (zona !== 'todas') {
      resultado = resultado.filter(m =>
        (m.zona ?? '').toLowerCase() === zona.toLowerCase()
      );
    }

    return resultado;
  });

  resumenEstados = computed(() => ({
    libres: this.mesas().filter(m => m.estado === 'libre').length,
    ocupadas: this.mesas().filter(m => m.estado === 'ocupada').length,
    reservadas: this.mesas().filter(m => m.estado === 'reservada').length,
    porCobrar: this.mesas().filter(m => m.estado === 'ocupada' && !!m.orden && !m.orden.pago_confirmado).length,
  }));

  // Computed properties para comanda actual
  ordenActiva = computed(() => {
    const mesa = this.mesaSeleccionada();
    if (!mesa) return null;
    this.cuentaActivaId();
    return this.getOrdenActiva(mesa);
  });

  totalItems = computed(() =>
    this.ordenActiva()?.items
      ?.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  );

  subtotalComanda = computed(() =>
    this.ordenActiva()?.items
      ?.reduce((sum, i) => sum + (Number(i.unit_price) * i.quantity), 0) ?? 0
  );

  hayItems = computed(() =>
    (this.ordenActiva()?.items?.length ?? 0) > 0
  );

  // Computed para catálogo de productos (vista agregar)
  productosFiltradosMenu = computed(() => {
    let productos = this.todosProductosMenu();
    const categoria = this.categoriaActivaMenu();
    const busquedaText = this.busquedaMenu().toLowerCase().trim();

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

    return productos;
  });

  subtotalProductosNuevos = computed(() =>
    this.productosNuevos().reduce((sum, item) =>
      sum + (Number(item.unit_price) * item.quantity), 0
    )
  );

  // Computed para reservas
  fechaStr = computed(() => this.localDateStr(this.fechaCalendario()));

  diasSemana = computed(() => {
    const inicio = new Date(this.fechaCalendario());
    const dia = inicio.getDay();
    const lunes = new Date(inicio);
    lunes.setDate(inicio.getDate() - (dia === 0 ? 6 : dia - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  });

  readonly HORAS = Array.from({ length: 16 }, (_, i) => i + 8);

  // Computed para total de items en productosNuevos
  totalProductosNuevos = computed(() =>
    this.productosNuevos().reduce((sum, item) => sum + item.quantity, 0)
  );

  pagoConfirmado = computed(() =>
    this.ordenActiva()?.pago_confirmado ?? false
  );

  itemsComandaAgrupados = computed<{ pagados: OrderItem[], pendientes: OrderItem[] }>(() => {
    const orden = this.ordenActiva();
    if (!orden || !orden.items?.length) return { pagados: [], pendientes: [] };

    if (!orden.pago_confirmado) {
      return { pagados: [], pendientes: orden.items };
    }

    const threshold = this.deriveThreshold(orden);
    if (!threshold) {
      return { pagados: [], pendientes: orden.items };
    }

    const pagados    = orden.items.filter(i => i.created_at <= threshold);
    const pendientes = orden.items.filter(i => i.created_at > threshold);

    // pago_confirmado=true y sin ítems nuevos → orden totalmente pagada, nada extra
    if (pendientes.length === 0) {
      return { pagados: [], pendientes: [] };
    }

    return { pagados, pendientes };
  });

  montoCobradoAnterior = computed(() => {
    const pagados = this.itemsComandaAgrupados().pagados;
    if (!pagados.length) return 0;
    return pagados.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);
  });

  // Items de la comanda ordenados: pendientes (entregado=false) primero, entregados al final
  itemsComandaOrdenados = computed<OrderItem[]>(() => {
    const items = this.ordenActiva()?.items ?? [];
    const hayEntregados = items.some(i => i.entregado === true);
    if (!hayEntregados) return items;
    return [...items].sort((a, b) => {
      const aEnt = a.entregado ? 1 : 0;
      const bEnt = b.entregado ? 1 : 0;
      return aEnt - bEnt;
    });
  });

  itemsOrdenActivaEntregados = computed(() =>
    (this.ordenActiva()?.items ?? []).filter(i => i.entregado).length
  );

  totalItemsOrdenActiva = computed(() =>
    this.ordenActiva()?.items?.length ?? 0
  );

  montoPendienteComanda = computed(() => {
    const pendientes = this.itemsComandaAgrupados().pendientes;
    if (!pendientes.length) return 0;
    return pendientes.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);
  });

  envioConfirmado = computed(() =>
    this.ordenActiva()?.envio_confirmado ?? false
  );

  mesasDisponiblesMerge = computed(() => {
    const activa = this.mesaMergeActiva();
    if (!activa) return [];
    return this.mesas().filter(m =>
      m.id !== activa.id &&
      m.estado === 'libre'
    );
  });

  ngOnInit(): void {
    this.cargarMesas();
    this.turnoEstado.refrescar();

    // Cargar nombre y dirección de empresa al iniciar
    const empresaId = this.authService.getEmpresaId();
    if (empresaId) {
      this.menuService.getMenuByEmpresaId(empresaId).subscribe({
        next: (data) => {
          if (this.esNombreEmpresaValido(data?.nombre)) {
            this.nombreEmpresa.set(data.nombre.trim());
          }
        },
        error: () => {}
      });
      this.menuService.getEmpresaById(empresaId).subscribe({
        next: (empresa) => {
          if (empresa?.nombre) this.nombreEmpresa.set(empresa.nombre);
          if (empresa?.direccion) this.direccionEmpresa.set(empresa.direccion);
        },
        error: () => {}
      });
    }

    this.intervalId = setInterval(() => {
      this.actualizarTiemposTranscurridos();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // Limpiar listeners de resize
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
  }

  cargarMesas(): void {
    this.cargando.set(true);
    this.mesaService.getAll().subscribe({
      next: (response) => {
        this.mesas.set(response.data);
        this.cargando.set(false);

        // Seleccionar la primera zona disponible por defecto
        const primeraZona = this.zonasDisponibles()[0];
        if (primeraZona && primeraZona !== 'todas') {
          this.filtroZona.set(primeraZona);
        }
      },
      error: (error) => {
        console.error('Error al cargar mesas:', error);
        this.mostrarMensaje('Error al cargar las mesas', 'error');
        this.cargando.set(false);
      }
    });
  }

  seleccionarMesa(mesa: Mesa): void {
    if (!this.modoEdicion()) {
      const ordenes = mesa.ordenes_activas ?? [];
      this.cuentaActivaId.set(ordenes[0]?.id ?? null);
      this.mesaSeleccionada.set(mesa);
    }
  }

  volverAlMapa(): void {
    this.mesaSeleccionada.set(null);
    this.cuentaActivaId.set(null);
  }

  toggleModoEdicion(): void {
    const nuevoModo = !this.modoEdicion();
    this.modoEdicion.set(nuevoModo);
    if (nuevoModo) {
      this.mostrarMensaje('Modo edición activado - Arrastra las mesas para moverlas', 'info');
    } else {
      this.mostrarMensaje('Modo edición desactivado', 'info');
    }
  }

  onDragEnded(event: CdkDragEnd, mesa: Mesa): void {
    if (!this.mapaContainer) return;

    // Obtener el desplazamiento relativo que aplicó el CDK
    const delta = event.distance;

    const containerRect = this.mapaContainer.nativeElement.getBoundingClientRect();

    // Calcular nueva posición sumando el delta al origen
    let newX = mesa.posicion_x + delta.x;
    let newY = mesa.posicion_y + delta.y;

    // Clamp dentro del contenedor
    const maxX = containerRect.width - mesa.ancho;
    const maxY = containerRect.height - mesa.alto;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // Snap a cuadrícula de 20px
    newX = Math.round(newX / this.GRID_SIZE) * this.GRID_SIZE;
    newY = Math.round(newY / this.GRID_SIZE) * this.GRID_SIZE;

    // CRITICO: resetear la transformación del CDK para evitar acumulación
    event.source._dragRef.reset();

    // Actualizar signal localmente de inmediato (UX instantánea)
    this.mesas.update(mesas =>
      mesas.map(m => m.id === mesa.id
        ? { ...m, posicion_x: newX, posicion_y: newY }
        : m
      )
    );

    // Persistir en backend
    this.mesaService.actualizarPosicion(mesa.id, newX, newY)
      .subscribe({
        error: (error) => {
          console.error('Error al actualizar posición:', error);
          // Revertir si falla
          this.mesas.update(mesas =>
            mesas.map(m => m.id === mesa.id
              ? { ...m, posicion_x: mesa.posicion_x, posicion_y: mesa.posicion_y }
              : m
            )
          );
          this.mostrarMensaje('Error al actualizar la posición', 'error');
        }
      });
  }

  onResizeStart(event: MouseEvent, mesa: Mesa, direccion: string): void {
    event.stopPropagation();
    event.preventDefault();

    this.estaRedimensionando.set(true);
    this.resizingMesa = mesa;
    this.resizeDir = direccion;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartAncho = mesa.ancho;
    this.resizeStartAlto = mesa.alto;
    this.resizeStartPosX = mesa.posicion_x;
    this.resizeStartPosY = mesa.posicion_y;

    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  private onResizeMove = (event: MouseEvent): void => {
    if (!this.resizingMesa) return;

    const dx = event.clientX - this.resizeStartX;
    const dy = event.clientY - this.resizeStartY;
    const dir = this.resizeDir;

    let newAncho = this.resizeStartAncho;
    let newAlto = this.resizeStartAlto;
    let newX = this.resizeStartPosX;
    let newY = this.resizeStartPosY;

    // Calcular según la esquina que se arrastra
    if (dir.includes('e')) newAncho = this.resizeStartAncho + dx;
    if (dir.includes('s')) newAlto = this.resizeStartAlto + dy;
    if (dir.includes('w')) {
      newAncho = this.resizeStartAncho - dx;
      newX = this.resizeStartPosX + dx;
    }
    if (dir.includes('n')) {
      newAlto = this.resizeStartAlto - dy;
      newY = this.resizeStartPosY + dy;
    }

    // Aplicar límites mínimo y máximo
    newAncho = Math.max(this.MIN_SIZE, Math.min(newAncho, this.MAX_SIZE));
    newAlto = Math.max(this.MIN_SIZE, Math.min(newAlto, this.MAX_SIZE));

    // Snap a cuadrícula
    newAncho = Math.round(newAncho / this.GRID_SIZE) * this.GRID_SIZE;
    newAlto = Math.round(newAlto / this.GRID_SIZE) * this.GRID_SIZE;
    newX = Math.round(newX / this.GRID_SIZE) * this.GRID_SIZE;
    newY = Math.round(newY / this.GRID_SIZE) * this.GRID_SIZE;

    // Actualizar signal en tiempo real para feedback visual inmediato
    const id = this.resizingMesa.id;
    this.mesas.update(mesas =>
      mesas.map(m => m.id === id
        ? { ...m, ancho: newAncho, alto: newAlto, posicion_x: newX, posicion_y: newY }
        : m
      )
    );
  };

  private onResizeEnd = (): void => {
    if (!this.resizingMesa) return;

    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);

    // Obtener valores finales del signal
    const mesaFinal = this.mesas().find(m => m.id === this.resizingMesa!.id);
    if (mesaFinal) {
      // Persistir tamaño y posición en backend
      this.mesaService.actualizarTamano(
        mesaFinal.id,
        mesaFinal.ancho,
        mesaFinal.alto,
        mesaFinal.posicion_x,
        mesaFinal.posicion_y
      ).subscribe({
        error: () => {
          this.mostrarMensaje('Error al actualizar el tamaño', 'error');
        }
      });
    }

    this.resizingMesa = null;
    this.estaRedimensionando.set(false);
  };

  snapToGrid(value: number): number {
    return Math.round(value / this.GRID_SIZE) * this.GRID_SIZE;
  }

  puedeLiberar(mesa: Mesa): boolean {
    if (!mesa.id_orden || !mesa.orden) return true;
    if (mesa.orden.estatus === 7) return true; // orden cancelada
    return mesa.orden.pago_confirmado === true;
  }

  cambiarEstadoMesa(mesa: Mesa, nuevoEstado: EstadoMesa): void {
    if (nuevoEstado === 'libre' && !this.puedeLiberar(mesa)) {
      this.mostrarMensaje(
        'No puedes liberar la mesa: la orden tiene un pago pendiente. Confirma el pago primero.',
        'error'
      );
      return;
    }

    const extra: any = {};
    
    // Si es reservada u ocupada, podría necesitar datos adicionales
    if (nuevoEstado === 'reservada') {
      // Aquí podrías abrir un dialog para pedir hora_reserva
      extra.hora_reserva = new Date().toISOString();
    } else if (nuevoEstado === 'ocupada' && !mesa.nombreCliente) {
      // Aquí podrías abrir un dialog para pedir nombreCliente
      extra.nombreCliente = 'Cliente sin nombre';
    }

    this.mesaService.cambiarEstado(mesa.id, nuevoEstado, extra).subscribe({
      next: (response) => {
        const mesasActualizadas = this.mesas().map(m =>
          m.id === mesa.id ? response.data : m
        );
        this.mesas.set(mesasActualizadas);
        this.mostrarMensaje(`Mesa ${mesa.identificador} actualizada a ${nuevoEstado}`, 'success');
        if (nuevoEstado === 'libre') {
          this.volverAlMapa();
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.mostrarMensaje('Error al cambiar el estado de la mesa', 'error');
      }
    });
  }

  confirmarLiberarMesa(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa) return;

    if (!this.puedeLiberar(mesa)) {
      this.mostrarMensaje(
        'No puedes liberar la mesa: la orden tiene un pago pendiente. Confirma el pago primero.',
        'error'
      );
      return;
    }

    const ref = this.dialog.open(ConfirmarLiberarMesaDialogComponent, {
      data: {
        identificador: mesa.identificador,
        pagado: this.pagoConfirmado(),
      },
      width: '440px',
      disableClose: false,
    });

    ref.afterClosed().subscribe((confirmar: boolean) => {
      if (confirmar) {
        this.cambiarEstadoMesa(mesa, 'libre');
      }
    });
  }

  abrirCrearMesa(): void {
    const ref = this.dialog.open(CrearEditarMesaDialogComponent, {
      data: { mesa: undefined },
      width: '420px',
      disableClose: false
    });

    ref.afterClosed().subscribe((nuevaMesa: Mesa) => {
      if (nuevaMesa) {
        // Agregar al signal sin recargar toda la lista
        this.mesas.update(mesas => [...mesas, nuevaMesa]);
        this.mostrarMensaje(`Mesa '${nuevaMesa.identificador}' creada correctamente`, 'success');
      }
    });
  }

  abrirEditarMesa(mesa: Mesa, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Evitar que abra la comanda
    }
    
    const ref = this.dialog.open(CrearEditarMesaDialogComponent, {
      data: { mesa },
      width: '420px',
      disableClose: false
    });

    ref.afterClosed().subscribe((mesaActualizada: Mesa) => {
      if (mesaActualizada) {
        // Reemplazar solo la mesa editada en el signal
        this.mesas.update(mesas =>
          mesas.map(m => m.id === mesaActualizada.id ? mesaActualizada : m)
        );
        this.mostrarMensaje(`Mesa '${mesaActualizada.identificador}' actualizada correctamente`, 'success');
        
        // Si estamos en vista comanda, actualizar también la mesa seleccionada
        if (this.mesaSeleccionada()?.id === mesaActualizada.id) {
          this.mesaSeleccionada.set(mesaActualizada);
        }
      }
    });
  }

  abrirEliminarMesa(mesa: Mesa, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const ref = this.dialog.open(ConfirmarEliminarMesaDialogComponent, {
      data: { mesa },
      width: '380px',
      disableClose: false
    });

    ref.afterClosed().subscribe((eliminada: boolean) => {
      if (eliminada) {
        // Remover del signal sin recargar
        this.mesas.update(mesas => mesas.filter(m => m.id !== mesa.id));
        this.mostrarMensaje('Mesa eliminada correctamente', 'success');
        
        // Si estamos viendo la mesa eliminada, volver al mapa
        if (this.mesaSeleccionada()?.id === mesa.id) {
          this.volverAlMapa();
        }
      }
    });
  }

  // Método legacy - mantener por compatibilidad pero usar abrirEditarMesa preferentemente
  abrirDialogEditarMesa(mesa: Mesa): void {
    this.abrirEditarMesa(mesa);
  }

  // Método legacy - mantener por compatibilidad pero usar abrirCrearMesa preferentemente
  abrirDialogNuevaMesa(): void {
    this.abrirCrearMesa();
  }

  abrirQrDialog(mesa: Mesa): void {
    const ref = this.dialog.open(QrMesaDialogComponent, {
      data: { mesa },
      width: '500px',
      disableClose: false
    });

    ref.afterClosed().subscribe((qrData) => {
      // Si se regeneró el QR, actualizar la mesa con los nuevos datos
      if (qrData) {
        this.mesas.update(mesas =>
          mesas.map(m => m.id === mesa.id 
            ? { ...m, qr_url: qrData.qr_url, qr_token: qrData.qr_token } 
            : m
          )
        );
        
        // Si estamos en vista comanda, actualizar también la mesa seleccionada
        if (this.mesaSeleccionada()?.id === mesa.id) {
          this.mesaSeleccionada.update(m => 
            m ? { ...m, qr_url: qrData.qr_url, qr_token: qrData.qr_token } : m
          );
        }
      }
    });
  }

  private actualizarTiemposTranscurridos(): void {
    const mesasActualizadas = this.mesas().map(mesa => {
      if (mesa.estado === 'ocupada' && mesa.tiempo_ocupada) {
        const inicio = new Date(mesa.tiempo_ocupada);
        const ahora = new Date();
        const minutos = Math.floor((ahora.getTime() - inicio.getTime()) / 60000);
        return { ...mesa, tiempo_transcurrido: minutos };
      }
      return mesa;
    });
    this.mesas.set(mesasActualizadas);
  }

  cambiarFiltroZona(zona: string): void {
    this.filtroZona.set(zona);
  }

  // ========================================================================
  // MÉTODOS PARA GLOBO DE COMANDA
  // ========================================================================

  getCantidadTotalProductos(mesa: Mesa): number {
    return mesa.orden?.items
      ?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  }

  // Obtiene items pendientes de entrega
  getItemsPendientes(mesa: Mesa): OrderItem[] {
    return (mesa.orden?.items ?? [])
      .filter((item) => !item.entregado);
  }

  // Obtiene items ya entregados
  getItemsEntregados(mesa: Mesa): OrderItem[] {
    return (mesa.orden?.items ?? [])
      .filter((item) => item.entregado);
  }

  // Total de líneas de la orden
  getTotalItems(mesa: Mesa): number {
    return (mesa.orden?.items ?? []).length;
  }

  // true si TODOS los items están entregados
  todoEntregado(mesa: Mesa): boolean {
    const items = mesa.orden?.items ?? [];
    if (items.length === 0) return false;
    return items.every((item) => item.entregado);
  }

  // true si AL MENOS UN item está pendiente
  hayPendientes(mesa: Mesa): boolean {
    return (mesa.orden?.items ?? [])
      .some((item) => !item.entregado);
  }

  // true si AL MENOS UN item está entregado pero no todos
  entregaParcial(mesa: Mesa): boolean {
    const items = mesa.orden?.items ?? [];
    const entregados = items
      .filter((i) => i.entregado).length;
    return entregados > 0
      && entregados < items.length;
  }

  getCantidadPorEntregar(mesa: Mesa): number {
    return this.getItemsPendientes(mesa).length;
  }

  getTooltipEntrega(mesa: Mesa): string {
    if (this.todoEntregado(mesa)) {
      return 'Todos los pedidos fueron entregados';
    }
    const n = this.getCantidadPorEntregar(mesa);
    return n === 1
      ? 'Falta 1 pedido por entregar'
      : `Faltan ${n} pedidos por entregar`;
  }

  formatSelections(item: OrderItem): string {
    const selections = item.selections;
    if (!selections) return '';

    if (typeof selections === 'string') {
      try {
        return this.formatSelections({ ...item, selections: JSON.parse(selections) });
      } catch {
        return '';
      }
    }

    if (Array.isArray(selections)) {
      return selections
        .filter((sel) => {
          const title = (sel.groupTitle ?? '').toLowerCase();
          return title !== 'nota' && title !== 'notas especiales' && title !== 'comentario';
        })
        .map((sel) => sel.extra || sel.groupTitle)
        .filter(Boolean)
        .join(', ');
    }

    if (typeof selections === 'object') {
      const record = selections as Record<string, unknown>;
      const nota = record['nota'] ?? record['comentario'];
      if (nota != null && String(nota).trim()) {
        return String(nota).trim();
      }
      return Object.entries(record)
        .filter(([key]) => key !== 'nota' && key !== 'comentario')
        .flatMap(([, valor]) => {
          if (Array.isArray(valor)) return valor.map((v) => String(v));
          if (valor != null && String(valor).trim()) return [String(valor)];
          return [];
        })
        .join(', ');
    }

    return '';
  }

  toggleEntregado(item: OrderItem, mesa: Mesa): void {
    if (this.procesandoItemId() !== null) return;

    const nuevoEstado = !item.entregado;
    this.procesandoItemId.set(item.id);

    this.orderService
      .marcarItemEntregado(item.id, nuevoEstado)
      .subscribe({
        next: () => {
          this.procesandoItemId.set(null);
          this.actualizarEntregadoItem(
            mesa.id, item.id, nuevoEstado
          );

          const mesaActualizada = this.mesas()
            .find(m => m.id === mesa.id);
          const todos = (
            mesaActualizada?.orden?.items ?? []
          ).every(i => i.entregado);

          if (todos && mesaActualizada?.orden?.items?.length) {
            this.mostrarToastTodoEntregado();
          }
        },
        error: () => {
          this.procesandoItemId.set(null);
          this.mostrarToast(
            'Error al actualizar la entrega',
            'error'
          );
        },
      });
  }

  private actualizarEntregadoItem(
    mesaId: number,
    itemId: number,
    entregado: boolean
  ): void {
    const patchItems = (items: OrderItem[]) =>
      items.map(i =>
        i.id === itemId ? { ...i, entregado } : i
      );

    const patchOrden = (orden: any) => {
      if (!orden) return orden;
      return {
        ...orden,
        items: patchItems(orden.items ?? []),
      };
    };

    const patchOrdenesActivas = (ordenes: any[]) =>
      ordenes.map(o => ({
        ...o,
        items: patchItems(o.items ?? []),
      }));

    this.mesas.update(list =>
      list.map(m => {
        if (m.id === mesaId) {
          return {
            ...m,
            orden: patchOrden(m.orden),
            ordenes_activas: patchOrdenesActivas(
              m.ordenes_activas ?? []
            ),
          };
        }

        const mesaOrigen = list.find(
          x => x.id === mesaId
        );
        const ordenIdOrigen =
          mesaOrigen?.id_orden ?? null;

        if (ordenIdOrigen
            && m.id_orden === ordenIdOrigen) {
          return {
            ...m,
            orden: patchOrden(m.orden),
            ordenes_activas: patchOrdenesActivas(
              m.ordenes_activas ?? []
            ),
          };
        }

        return m;
      })
    );

    this.mesaSeleccionada.update(m => {
      if (!m || m.id !== mesaId) return m;
      return {
        ...m,
        orden: patchOrden(m.orden),
        ordenes_activas: patchOrdenesActivas(
          m.ordenes_activas ?? []
        ),
      };
    });
  }

  private mostrarToastTodoEntregado(): void {
    this.snackBar.open(
      'Todos los platillos han sido entregados',
      '',
      {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['toast-entregado-ok'],
      }
    );
  }

  getItemsResumen(mesa: Mesa): OrderItem[] {
    return mesa.orden?.items?.slice(0, 3) ?? [];
  }

  getItemsRestantes(mesa: Mesa): number {
    const total = mesa.orden?.items?.length ?? 0;
    return Math.max(0, total - 3);
  }

  getTotalComanda(mesa: Mesa): number {
    return mesa.orden?.items
      ?.reduce((sum, i) => sum + (Number(i.unit_price) * i.quantity), 0) ?? 0;
  }

  onMesaGloboEnter(mesa: Mesa, event: MouseEvent): void {
    if (this.modoEdicion()) return;
    if (mesa.estado !== 'ocupada' || !mesa.orden?.items?.length) return;
    this.globoAnchorEl = event.currentTarget as HTMLElement;
    this.mesaGloboHover.set(mesa);
    this.actualizarPosicionGloboComanda();
  }

  onMesaGloboLeave(): void {
    this.mesaGloboHover.set(null);
    this.globoAnchorEl = null;
  }

  onMapaScroll(): void {
    if (this.mesaGloboHover()) {
      this.actualizarPosicionGloboComanda();
    }
  }

  @HostListener('window:resize')
  onWindowResizeGlobo(): void {
    if (this.mesaGloboHover()) {
      this.actualizarPosicionGloboComanda();
    }
  }

  private actualizarPosicionGloboComanda(): void {
    if (!this.globoAnchorEl) return;
    const rect = this.globoAnchorEl.getBoundingClientRect();
    const margen = 10;
    const offsetX = 8;
    const anchoGlobo = 250;
    const paddingViewport = 12;
    let left = rect.left + offsetX;
    if (left + anchoGlobo > window.innerWidth - paddingViewport) {
      left = window.innerWidth - anchoGlobo - paddingViewport;
    }
    if (left < paddingViewport) {
      left = paddingViewport;
    }
    this.globoPos.set({ left, top: rect.top - margen });
  }

  tieneCobroExtra(mesa: Mesa): boolean {
    const orden = mesa.orden;
    if (!orden?.pago_confirmado) return false;
    const threshold = this.deriveThreshold(orden);
    if (!threshold) return false;
    return (orden.items ?? []).some(i => i.created_at > threshold);
  }

  getMontoExtraPorCobrar(mesa: Mesa): number {
    const orden = mesa.orden;
    if (!orden?.pago_confirmado) return Number(orden?.total ?? 0);
    const threshold = this.deriveThreshold(orden);
    if (!threshold) return Number(orden?.total ?? 0);
    return (orden.items ?? [])
      .filter(i => i.created_at > threshold)
      .reduce((sum, i) => sum + (Number(i.unit_price) * i.quantity), 0);
  }

  getMesasPorZona(zona: string): number {
    return this.mesas().filter(
      m => (m.zona ?? '').toLowerCase() === zona.toLowerCase()
    ).length;
  }

  getColorEstado(estado: EstadoMesa): string {
    const colores: Record<EstadoMesa, string> = {
      libre: '#4caf50',
      ocupada: '#f44336',
      cuenta_pendiente: '#ff9800',
      reservada: '#2196f3',
    };
    return colores[estado] || '#757575';
  }

  getIconoEstado(estado: EstadoMesa): string {
    const iconos: Record<EstadoMesa, string> = {
      libre: 'check_circle',
      ocupada: 'people',
      cuenta_pendiente: 'receipt',
      reservada: 'event',
    };
    return iconos[estado] || 'table_restaurant';
  }

  getTextoEstado(estado: EstadoMesa): string {
    const textos: Record<EstadoMesa, string> = {
      libre: 'Libre',
      ocupada: 'Ocupada',
      cuenta_pendiente: 'Cuenta Pendiente',
      reservada: 'Reservada',
    };
    return textos[estado] || estado;
  }

  formatearTiempo(minutos: number | null): string {
    if (!minutos) return '';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      dine_in: 'En el local'
    };
    return labels[method] || method;
  }

  /**
   * Obtiene el icono de Material para cada método de pago
   */
  getIconoPago(method: string): string {
    const iconos: Record<string, string> = {
      efectivo: 'payments',
      tarjeta: 'credit_card',
      transferencia: 'account_balance',
      dine_in: 'restaurant'
    };
    return iconos[method] || 'payment';
  }

  // ========================================================================
  // MÉTODOS DE ACCIONES RÁPIDAS
  // ========================================================================

  /**
   * Navega a la pantalla de levantar orden para agregar productos a la orden existente
   */
  agregarProductos(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa || !mesa.orden) {
      this.mostrarMensaje('No hay orden para agregar productos', 'error');
      return;
    }

    // Navegar a levantar-orden con el ID de la mesa y orden
    this.router.navigate(['/levantar-orden'], {
      state: {
        mesaId: mesa.id,
        mesaNumero: mesa.identificador,
        ordenId: mesa.id_orden,
        modoEdicion: true
      }
    });
  }

  /**
   * Abre una nueva ventana para imprimir la comanda de la orden (solo cocina, sin precios)
   */
  imprimirComanda(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa || !mesa.orden) {
      this.mostrarMensaje('No hay orden para imprimir', 'error');
      return;
    }

    const orden = mesa.orden;
    const empresa = this.nombreEmpresa() || 'Restaurante';

    const filasItems = (orden.items ?? []).map((item: any) => {
      const sels: string = Array.isArray(item.selections)
        ? item.selections
            .map((s: any) => s.extra ?? s.nombre ?? '')
            .filter(Boolean)
            .join(', ')
        : '';
      const nota: string = Array.isArray(item.selections)
        ? (item.selections.find((s: any) =>
            s.groupTitle?.toLowerCase() === 'nota'
          )?.extra ?? item.note ?? item.nota ?? '')
        : (item.note ?? item.nota ?? '');

      return `
        <tr>
          <td class="c-qty">${item.quantity ?? item.cantidad ?? 1}</td>
          <td class="c-nombre">
            <strong>${item.name ?? item.nombre}</strong>
            ${sels ? `<div class="c-sels">${sels}</div>` : ''}
            ${nota ? `<div class="c-nota">📌 ${nota}</div>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    const ahora = new Date();
    const hora  = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const fecha = ahora.toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Comanda — Mesa ${mesa.identificador}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            color: #1A1A11;
            width: 80mm;
            margin: 0 auto;
            padding: 10px 6px;
            background: white;
          }
          .c-header {
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 2px solid #1A1A11;
            margin-bottom: 8px;
          }
          .c-empresa {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 4px;
          }
          .c-badge {
            display: inline-block;
            background: #1A1A11;
            color: white;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 3px 12px;
            border-radius: 2px;
            margin-bottom: 4px;
          }
          .c-mesa {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.02em;
            margin: 6px 0 2px;
          }
          .c-meta {
            font-size: 11px;
            color: #555;
          }
          .c-sep {
            border: none;
            border-top: 1px dashed #1A1A11;
            margin: 8px 0;
          }
          .c-titulo-items {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #666;
            padding-bottom: 4px;
            border-bottom: 1px solid #1A1A11;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
          }
          table { width: 100%; border-collapse: collapse; }
          .c-qty {
            width: 28px;
            font-size: 15px;
            font-weight: 900;
            color: #1A1A11;
            vertical-align: top;
            padding: 6px 0;
          }
          .c-nombre {
            font-size: 13px;
            font-weight: 600;
            padding: 6px 0;
            border-bottom: 1px dotted #ddd;
            line-height: 1.4;
          }
          .c-nota {
            font-size: 11px;
            color: #854F0B;
            font-style: italic;
            margin-top: 2px;
          }
          .c-sels {
            font-size: 10px;
            color: #555;
            margin-top: 1px;
          }
          .c-footer {
            text-align: center;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 2px dashed #1A1A11;
            font-size: 10px;
            color: #999;
          }
          @media print { body { width: 80mm; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="c-header">
          <p class="c-empresa">${empresa}</p>
          <div class="c-badge">Comanda de cocina</div>
          <p class="c-mesa">Mesa ${mesa.identificador}</p>
          <p class="c-meta">${fecha} · ${hora}</p>
        </div>
        <div class="c-titulo-items">
          <span>CANT</span><span>PRODUCTO</span>
        </div>
        <table><tbody>${filasItems}</tbody></table>
        <hr class="c-sep">
        <div class="c-footer">Preparar con prioridad</div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank', 'width=400,height=600');
    if (!ventana) {
      this.mostrarMensaje('Por favor permite las ventanas emergentes', 'error');
      return;
    }
    ventana.document.write(html);
    ventana.document.close();
  }

  // ── Helpers de ticket ──────────────────────────────────────────

  private tieneFolioApi(orden: OrderFolioSource | null | undefined): boolean {
    const f = orden?.folio ?? orden?.folio_diario;
    return f != null && String(f).trim() !== '';
  }

  private folioDesdeOrden(orden: OrderFolioSource): Pick<Order, 'folio' | 'folio_diario' | 'folio_dia'> {
    return {
      folio: orden.folio ?? null,
      folio_diario: orden.folio_diario ?? orden.folio_dia ?? null,
      folio_dia: orden.folio_dia ?? orden.folio_diario ?? null,
    };
  }

  private esNombreEmpresaValido(nombre?: string | null): boolean {
    const n = (nombre ?? '').trim();
    return !!n && !/^cargando\.{0,3}$/i.test(n);
  }

  private resolverNombreEmpresaTicket(): string {
    if (this.esNombreEmpresaValido(this.nombreEmpresa())) {
      return this.nombreEmpresa().trim();
    }
    const authNombre = (
      this.authService.currentUser() as { empresa?: { nombre?: string } } | null
    )?.empresa?.nombre;
    if (this.esNombreEmpresaValido(authNombre)) {
      return authNombre!.trim();
    }
    return '';
  }

  /** Garantiza nombre/dirección reales antes de abrir el ticket. */
  private asegurarDatosEmpresa(callback: () => void): void {
    if (this.resolverNombreEmpresaTicket()) {
      callback();
      return;
    }

    const empresaId = this.authService.getEmpresaId();
    if (!empresaId) {
      callback();
      return;
    }

    this.menuService.getEmpresaById(empresaId).subscribe({
      next: (empresa) => {
        if (this.esNombreEmpresaValido(empresa?.nombre)) {
          this.nombreEmpresa.set(empresa.nombre.trim());
        }
        if (empresa?.direccion) {
          this.direccionEmpresa.set(empresa.direccion);
        }
        callback();
      },
      error: () => callback(),
    });
  }

  private buildDatosTicket(
    orden: any,
    metodoPago: string,
    mesaId: string,
    montoRecibido?: number,
    cambio?: number
  ): any {
    const itemsTicket: ItemTicket[] = (orden.items ?? []).map((it: any) => {
      const precio   = parseFloat(it.unit_price ?? it.precio ?? 0);
      const cantidad = it.quantity ?? it.cantidad ?? 1;
      const complementos = Array.isArray(it.selections)
        ? it.selections
            .filter((s: any) => s.groupTitle?.toLowerCase() !== 'nota')
            .map((s: any) => ({
              nombre: s.extra ?? s.nombre ?? '',
              precio: parseFloat(s['precio-extra'] ?? s.precio ?? 0)
            }))
        : [];
      const nota: string = Array.isArray(it.selections)
        ? (it.selections.find((s: any) =>
            s.groupTitle?.toLowerCase() === 'nota'
          )?.extra ?? it.note ?? it.nota ?? '')
        : (it.note ?? it.nota ?? '');
      return {
        cantidad,
        nombre:       it.name ?? it.nombre ?? '',
        precio,
        subtotal:     precio * cantidad,
        nota:         nota || null,
        complementos,
      };
    });

    return {
      id:             orden.id,
      ...this.folioDesdeOrden(orden),
      fecha:          orden.created_at ?? new Date().toISOString(),
      tipo_servicio:  'mesa' as const,
      mesa:           mesaId,
      nombre_cliente: orden.customer_name ?? '',
      telefono_cliente: (orden.customer_phone ?? '').toString().trim() || undefined,
      items:          itemsTicket,
      subtotal:       parseFloat(orden.subtotal ?? 0),
      propina:        parseFloat(orden.tip ?? 0),
      costo_envio:    parseFloat(orden.shipping_cost ?? 0),
      total:          parseFloat(orden.total ?? 0),
      metodo_pago:    metodoPago as any,
      monto_recibido: montoRecibido ?? undefined,
      cambio:         cambio ?? undefined,
      nombre_empresa: this.resolverNombreEmpresaTicket() || 'Restaurante',
      direccion_empresa: this.direccionEmpresa() || undefined,
      nota:           orden.note ?? undefined,
    };
  }

  private abrirTicket(datos: any, folioEmpresa?: number): void {
    const ordenTicket = this.tieneFolioApi(datos)
      ? datos
      : { ...datos, ...(folioEmpresa ? { folio_empresa: folioEmpresa } : {}) };
    this.dialog.open(TicketVentaDialogComponent, {
      data:         { orden: ordenTicket },
      width:        '820px',
      maxWidth:     '95vw',
      maxHeight:    '90vh',
      disableClose: false,
    });
  }

  private abrirTicketConNombre(
    orden: any,
    metodoPago: string,
    mesaId: string,
    folioDia?: number,
    montoRecibido?: number,
    cambio?: number
  ): void {
    const abrir = (folioEmpresa?: number) => {
      const ordenBase = folioDia != null ? { ...orden, folio_dia: folioDia } : orden;
      const datos = this.buildDatosTicket(
        ordenBase,
        metodoPago,
        mesaId,
        montoRecibido,
        cambio
      );
      this.abrirTicket(datos, this.tieneFolioApi(ordenBase) ? undefined : folioEmpresa);
    };

    const obtenerFolioYAbrir = () => {
      if (this.tieneFolioApi(orden)) {
        abrir();
        return;
      }
      if (orden?.id) {
        this.ventasService.getFolioDeOrden(orden.id).subscribe({
          next: (folio) => abrir(folio || undefined),
          error: () => abrir()
        });
      } else {
        abrir();
      }
    };

    this.asegurarDatosEmpresa(() => obtenerFolioYAbrir());
  }

  /**
   * Navega a la pantalla de edición de la orden
   */
  editarOrden(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa || !mesa.orden) {
      this.mostrarMensaje('No hay orden para editar', 'error');
      return;
    }

    // Navegar a levantar-orden en modo edición
    this.router.navigate(['/levantar-orden'], {
      state: {
        mesaId: mesa.id,
        mesaNumero: mesa.identificador,
        ordenId: mesa.id_orden,
        modoEdicion: true,
        ordenCompleta: mesa.orden
      }
    });
  }

  /**
   * Cancela la orden actual y libera la mesa
   */
  cancelarOrden(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa || !mesa.orden) {
      this.mostrarMensaje('No hay orden para cancelar', 'error');
      return;
    }

    // Mostrar diálogo de confirmación
    const confirmar = confirm(
      `¿Estás seguro de cancelar la orden de la Mesa ${mesa.identificador}?\n\n` +
      `Total: $${mesa.orden.total}\n` +
      `Items: ${mesa.orden.items.length} producto(s)\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    // Cambiar estado de la mesa a "libre" y desvincular la orden
    this.mesaService.cambiarEstado(mesa.id, 'libre', { id_orden: undefined }).subscribe({
      next: (response) => {
        // Actualizar la lista de mesas
        this.mesas.update(mesas =>
          mesas.map(m => m.id === mesa.id 
            ? { ...response.data, id_orden: null, orden: null }
            : m
          )
        );
        
        // Actualizar mesa seleccionada
        this.mesaSeleccionada.set({ ...response.data, id_orden: null, orden: null });
        
        this.mostrarMensaje(`Orden cancelada - Mesa ${mesa.identificador} liberada`, 'success');
      },
      error: (error) => {
        console.error('Error al cancelar orden:', error);
        this.mostrarMensaje('Error al cancelar la orden', 'error');
      }
    });
  }

  /**
   * Navega a la pantalla de levantar orden para crear una nueva orden en la mesa
   */
  levantarOrden(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa) {
      this.mostrarMensaje('No hay mesa seleccionada', 'error');
      return;
    }

    // Navegar a levantar-orden con el ID de la mesa
    this.router.navigate(['/levantar-orden'], {
      state: {
        mesaId: mesa.id,
        mesaNumero: mesa.identificador
      }
    });
  }

  // ========================================================================
  // FUNCIONALIDAD VISTA AGREGAR PRODUCTOS
  // ========================================================================

  /**
   * Abre la vista superpuesta para agregar productos a la comanda actual
   */
  abrirAgregarProductos(): void {
    this.productosNuevos.set([]);
    this.vistaAgregarProductos.set(true);

    if (this.todosProductosMenu().length === 0) {
      this.cargarMenuProductos();
    }

    const ordenActual = this.getOrdenActiva(
      this.mesaSeleccionada()!
    );
    console.log(
      '📋 Agregando a orden:', ordenActual?.id,
      '| cuentaActivaId:', this.cuentaActivaId()
    );
  }

  /**
   * Carga el catálogo de productos del menú
   */
  private cargarMenuProductos(): void {
    this.cargandoMenu.set(true);
    
    const empresaId = this.authService.getEmpresaId();
    
    if (!empresaId) {
      this.mostrarMensaje('No se encontró empresa asociada', 'error');
      this.cargandoMenu.set(false);
      return;
    }

    this.menuService.getMenuByEmpresaId(empresaId).subscribe({
      next: (data) => {
        this.categoriasMenu.set(data.categorias || []);
        
        if (this.esNombreEmpresaValido(data.nombre)) {
          this.nombreEmpresa.set(data.nombre.trim());
        }
        
        const productos: Product[] = [];
        data.categorias?.forEach(cat => {
          cat.productos?.forEach(prod => {
            productos.push(prod);
          });
        });
        this.todosProductosMenu.set(productos);
        this.cargandoMenu.set(false);
      },
      error: (err) => {
        console.error('Error cargando menú:', err);
        this.mostrarMensaje('Error al cargar el catálogo de productos', 'error');
        this.cargandoMenu.set(false);
      },
    });
  }

  /**
   * Cancela la adición de productos y cierra la vista
   */
  cancelarAgregarProductos(): void {
    this.vistaAgregarProductos.set(false);
    this.vistaMovilAgregar.set('productos');
    this.productosNuevos.set([]);
    this.busquedaMenu.set('');
    this.categoriaActivaMenu.set('todos');
  }

  /**
   * Confirma los productos nuevos y los agrega a la comanda actual
   */
  confirmarAgregarProductos(): void {
    const nuevos = this.productosNuevos();
    if (nuevos.length === 0) return;

    const mesa = this.mesaSeleccionada();
    const mesaId = mesa?.id;

    const ordenActual = this.getOrdenActiva(mesa!);
    const ordenId = ordenActual?.id ?? mesa?.id_orden;

    if (!ordenId) {
      this.mostrarToast('Esta mesa no tiene una orden activa', 'error');
      return;
    }

    // Capturar si la orden ya estaba pagada antes de agregar nuevos items.
    // Se considera pagada si el estado LOCAL tiene pago_confirmado: true,
    // lo cual solo ocurre cuando:
    //   a) confirmarPago() fue llamado en esta sesión (activa pago_confirmado: true), O
    //   b) cargarMesas() restauró pago_confirmado: true desde localStorage (pago real anterior)
    // NO se usa estatus === 6 directamente para evitar falsos positivos cuando el backend
    // tiene estatus:6 por datos residuales sin que el usuario haya cobrado en esta sesión.
    const eraPagada = (mesa?.orden?.pago_confirmado === true);
    // Capturar el threshold ya establecido al pagar (max created_at de los ítems originales)
    const thresholdAlPagar = mesa?.orden?.pago_confirmado_threshold;
    const totalAntesDePago = eraPagada ? Number(mesa?.orden?.total ?? 0) : 0;
    // Al agregar items siempre se resetea a SIN_INICIAR para que la cocina lo vea

    this.guardandoItems.set(true);

    const payload: ItemNuevoPayload[] = nuevos.map(item => ({
      product_id: item.product_id ?? null,
      name: item.name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price) || 0,
      selections: this.mapearSelecciones(item)
    }));

    this.orderService.agregarItems(ordenId, payload).subscribe({
      next: (res) => {
        this.guardandoItems.set(false);

        const mesaSeleccionadaId = this.mesaSeleccionada()?.id;
        const mesaSeleccionadaActual = this.mesaSeleccionada();
        const itemsActualizados = (res.order?.items ?? []).map(i => this.mapearOrderItem(i));

        // Actualizar estado local con los nuevos items
        const updateOrden = (orden: any) => ({
          ...(orden ?? res.order),
          ...res.order,
          items: itemsActualizados,
          estatus: 1,
          ...(eraPagada ? { monto_pagado_anterior: totalAntesDePago, pago_confirmado: true, pago_confirmado_threshold: thresholdAlPagar } : {}),
        });

        this.mesas.update(mesas =>
          mesas.map(m => {
            if (m.id === mesaSeleccionadaId) {
              return {
                ...m,
                orden: updateOrden(m.orden),
                ordenes_activas: (m.ordenes_activas ?? [])
                  .map(o => o.id === ordenId
                    ? updateOrden(o)
                    : o
                  ),
              };
            }

            if (m.id_orden === ordenId
                || m.mesa_principal_id === mesaSeleccionadaId
                || (mesaSeleccionadaActual?.mesa_principal_id
                    && m.mesa_principal_id
                       === mesaSeleccionadaActual.mesa_principal_id)
                || m.id === mesaSeleccionadaActual
                              ?.mesa_principal_id) {
              return {
                ...m,
                orden: m.orden?.id === ordenId
                  ? updateOrden(m.orden)
                  : m.orden,
                ordenes_activas: (m.ordenes_activas ?? [])
                  .map(o => o.id === ordenId
                    ? updateOrden(o)
                    : o
                  ),
              };
            }

            return m;
          })
        );

        this.mesaSeleccionada.update(m => {
          if (!m || m.id !== mesaSeleccionadaId) return m;
          return {
            ...m,
            orden: updateOrden(m.orden),
            ordenes_activas: (m.ordenes_activas ?? [])
              .map(o => o.id === ordenId
                ? updateOrden(o)
                : o
              ),
          };
        });

        const patchPayload: any = { estatus: 1 };
        this.orderService.actualizarOrden(ordenId, patchPayload).subscribe({
          next: () => {
            this.mostrarToast(
              eraPagada
                ? 'Productos agregados. El pago pendiente incluye los nuevos items.'
                : 'Productos agregados correctamente',
              'success'
            );
          },
          error: () => {
            this.mostrarToast('Productos agregados correctamente', 'success');
          }
        });

        this.vistaAgregarProductos.set(false);
        this.vistaMovilAgregar.set('productos');
        this.productosNuevos.set([]);

        if (mesaId) {
          this.mesaService.getById(mesaId).subscribe({
            next: (mesaRes) => {
              if (!mesaRes.data) return;

              // Preservar pago_confirmado y monto_pagado_anterior cuando era orden pagada
              const ordenPatch: any = {};
              if (eraPagada) {
                ordenPatch.monto_pagado_anterior = totalAntesDePago;
                ordenPatch.pago_confirmado = true;
                ordenPatch.pago_confirmado_threshold = thresholdAlPagar;
              }

              const mesaData = { ...mesaRes.data, orden: mesaRes.data.orden
                ? { ...mesaRes.data.orden, ...ordenPatch }
                : mesaRes.data.orden };

              this.mesas.update(mesas =>
                mesas.map(m => m.id === mesaData.id ? mesaData : m)
              );

              this.mesaSeleccionada.update(m =>
                m && m.id === mesaData.id ? mesaData : m
              );
            }
          });
        }
      },
      error: (err) => {
        this.guardandoItems.set(false);
        this.mostrarToast(
          err?.error?.message ?? 'Error al agregar productos',
          'error'
        );
      }
    });
  }

  private mapearSelecciones(item: ItemComanda): Record<string, any> | null {
    const selections: Record<string, any> = {};

    if (Array.isArray(item.selections) && item.selections.length > 0) {
      item.selections.forEach((comp: any) => {
        const grupo = comp?.grupo ?? comp?.titulo ?? 'extras';
        const nombre = comp?.nombre ?? comp?.extra;
        if (!nombre) return;

        if (!selections[grupo]) {
          selections[grupo] = [];
        }

        if (Array.isArray(selections[grupo])) {
          selections[grupo].push(nombre);
        }
      });
    } else if (item.selections && typeof item.selections === 'object') {
      Object.entries(item.selections as Record<string, any>).forEach(([key, value]) => {
        if (key === 'comentario' && typeof value === 'string') {
          selections['nota'] = value;
          return;
        }

        if (key === 'adicionales' && Array.isArray(value)) {
          selections['extras'] = value;
          return;
        }

        selections[key] = value;
      });
    }

    if (item.note?.trim()) {
      selections['nota'] = item.note.trim();
    }

    return Object.keys(selections).length > 0 ? selections : null;
  }

  private mapearOrderItem(orderItem: OrderItem): ItemComanda {
    const complementos = this.extraerComplementos(
      orderItem.selections as Record<string, any> | null
    );

    const notaDesdeSelecciones =
      orderItem.selections &&
      !Array.isArray(orderItem.selections) &&
      typeof orderItem.selections === 'object'
        ? (orderItem.selections as Record<string, any>)['nota'] ??
          (orderItem.selections as Record<string, any>)['comentario'] ??
          ''
        : '';

    return {
      ...orderItem,
      unit_price: String(orderItem.unit_price),
      note: typeof notaDesdeSelecciones === 'string' ? notaDesdeSelecciones : (orderItem.note ?? ''),
      selections: complementos.map(comp => ({
        extra: comp.nombre,
        nombre: comp.nombre,
        grupo: comp.grupo
      }))
    };
  }

  private extraerComplementos(
    selections: Record<string, any> | null
  ): Complemento[] {
    if (!selections) return [];

    const complementos: Complemento[] = [];
    Object.entries(selections).forEach(([grupo, valor]) => {
      if (grupo === 'nota' || grupo === 'comentario') return;

      if (Array.isArray(valor)) {
        valor.forEach(nombre => {
          if (!nombre) return;
          complementos.push({
            id: String(nombre),
            nombre: String(nombre),
            grupo,
            precio: 0
          });
        });
      } else if (typeof valor === 'string') {
        complementos.push({
          id: valor,
          nombre: valor,
          grupo,
          precio: 0
        });
      }
    });

    return complementos;
  }

  /**
   * Agrega un producto al signal de productosNuevos
   * Abre el dialog de complementos si el producto los tiene, sino abre dialog de nota
   */
  agregarProductoNuevo(producto: Product): void {
    // Siempre abrir el ProductDetailDialog para mostrar imagen, precio y nota
    this.selectedProductId.set(producto.id);
    this.showProductModal.set(true);
  }

  /**
   * Callback cuando se agrega producto desde el modal de complementos (ProductDetailDialog)
   */
  onAddFromDetail(event: { product: ProductDetail; quantity: number; selections: CartItemSelection[] }): void {
    const p = event.product;
    const base = Number(p.precio_variable) === 1
      ? Number(p.precio)
      : (p.descuento != null && p.descuento > 0) ? Number(p.descuento) : Number(p.precio);
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
    for (let i = 0; i < event.quantity; i++) {
      const nuevoItem: OrderItem = {
        id: Date.now() + Math.random() + i,
        order_id: 0,
        product_id: p.id,
        name: p.nombre,
        quantity: 1,
        unit_price: precioFinal.toString(),
        selections: event.selections.length > 0 ? (event.selections as any) : null,
        created_at: new Date().toISOString(),
        producto: p as any
      };

      this.productosNuevos.update(items => [...items, nuevoItem as any]);
    }
    
    this.mostrarMensaje(`${event.quantity} producto(s) agregado(s)`, 'success');
  }

  /**
   * Método auxiliar para agregar un item a productosNuevos
   */
  private agregarItemAProductosNuevos(producto: Product, cantidad: number, selections: CartItemSelection[] | null, nota: string): void {
    const precioUnitario = (producto.descuento && parseFloat(producto.descuento.toString()) > 0) 
      ? producto.descuento.toString() 
      : producto.precio.toString();

    const nuevoItem: OrderItem = {
      id: Date.now() + Math.random(),
      order_id: 0,
      product_id: producto.id,
      name: producto.nombre,
      quantity: cantidad,
      unit_price: precioUnitario,
      selections: selections,
      note: nota || undefined,
      created_at: new Date().toISOString(),
      producto: producto as any
    };

    this.productosNuevos.update(items => [...items, nuevoItem as any]);
    
    if (nota) {
      this.mostrarMensaje(`Producto agregado con nota`, 'success');
    } else {
      this.mostrarMensaje(`Producto agregado`, 'success');
    }
  }

  /**
   * Aumenta la cantidad de un producto en productosNuevos
   */
  aumentarCantidadProductoNuevo(item: OrderItem): void {
    this.productosNuevos.update(items =>
      items.map(i => 
        i.id === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    );
  }

  /**
   * Disminuye la cantidad de un producto en productosNuevos
   */
  disminuirCantidadProductoNuevo(item: OrderItem): void {
    if (item.quantity === 1) {
      // Eliminar del array
      this.productosNuevos.update(items =>
        items.filter(i => i.id !== item.id)
      );
    } else {
      this.productosNuevos.update(items =>
        items.map(i => 
          i.id === item.id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      );
    }
  }

  /**
   * Elimina un producto de productosNuevos por índice
   */
  eliminarProductoNuevo(index: number): void {
    this.productosNuevos.update(items => 
      items.filter((_, idx) => idx !== index)
    );
  }

  actualizarNotaProductoNuevo(index: number, nota: string): void {
    this.productosNuevos.update(items =>
      items.map((item, idx) =>
        idx === index ? { ...item, note: nota.trim() || undefined } : item
      )
    );
  }

  async abrirDialogNotaProductoNuevo(index: number): Promise<void> {
    const item = this.productosNuevos()[index];
    if (!item) return;

    const dialogRef = this.dialog.open(AgregarNotaDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        nombreProducto: item.name,
        nota: item.note || '',
      },
    });

    const nota = await dialogRef.afterClosed().toPromise();
    if (nota !== undefined) {
      this.actualizarNotaProductoNuevo(index, nota);
    }
  }

  /**
   * Selecciona una categoría en el catálogo de productos
   */
  seleccionarCategoriaMenu(categoria: string): void {
    this.categoriaActivaMenu.set(categoria);
  }

  /**
   * Actualiza la búsqueda con debounce
   */
  onBusquedaMenuChange(value: string): void {
    clearTimeout(this.busquedaDebounce);
    this.busquedaDebounce = setTimeout(() => {
      this.busquedaMenu.set(value);
    }, 300);
  }

  /**
   * Limpia la búsqueda
   */
  limpiarBusquedaMenu(): void {
    this.busquedaMenu.set('');
  }

  /**
   * Helper para verificar si selections es un array
   */
  isSelectionsArray(selections: any): boolean {
    return Array.isArray(selections);
  }

  /**
   * Helper para obtener selections como OrderItemSelection
   */
  getSelectionsAsObject(selections: any): OrderItemSelection | null {
    if (!selections || Array.isArray(selections)) {
      return null;
    }
    return selections as OrderItemSelection;
  }

  /**
   * Extrae la nota especial de un item (nuevo formato de selections)
   */
  getNota(item: OrderItem): string | null {
    if (!item.selections || !Array.isArray(item.selections)) {
      return null;
    }
    
    const selecciones = item.selections as Seleccion[];
    const notaObj = selecciones.find(s => s.groupTitle === 'Notas especiales');
    return notaObj?.extra || null;
  }

  /**
   * Extrae los complementos de un item (nuevo formato de selections)
   */
  getComplementos(item: OrderItem): Seleccion[] {
    if (!item.selections || !Array.isArray(item.selections)) {
      return [];
    }
    
    const selecciones = item.selections as Seleccion[];
    return selecciones.filter(s => s.groupTitle === 'Complementos');
  }

  /**
   * Obtiene las categorías únicas del menú
   */
  obtenerCategoriasUnicasMenu(): string[] {
    const categoriasSet = new Set<string>();
    this.categoriasMenu().forEach(cat => {
      if (cat.nombre) categoriasSet.add(cat.nombre);
    });
    return Array.from(categoriasSet).sort();
  }

  /**
   * Obtiene la cantidad de un producto en productosNuevos
   */
  getCantidadProductoNuevo(productoId: number): number {
    const item = this.productosNuevos().find(
      p => p.product_id === productoId && !p.selections
    );
    return item ? item.quantity : 0;
  }

  // ========================================================================
  // CONTROLES DE CANTIDAD EN COMANDA ACTUAL
  // ========================================================================

  /**
   * Aumenta la cantidad de un item en la comanda actual
   */
  aumentarCantidad(item: OrderItem): void {
    this.mesas.update(mesas =>
      mesas.map(m => {
        if (m.id !== this.mesaSeleccionada()!.id || !m.orden) return m;
        return {
          ...m,
          orden: {
            ...m.orden!,
            items: m.orden!.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        };
      })
    );

    // Actualizar mesaSeleccionada también
    this.mesaSeleccionada.update(m => {
      if (!m || !m.orden) return m;
      return {
        ...m,
        orden: {
          ...m.orden,
          items: m.orden.items.map(i =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        }
      };
    });

    this.persistirCambiosCantidad();
  }

  /**
   * Disminuye la cantidad de un item en la comanda actual
   */
  disminuirCantidad(item: OrderItem): void {
    if (item.quantity === 1) {
      // Si llega a 0, confirmar eliminación
      const confirmar = confirm(
        `¿Eliminar "${item.name}" de la comanda?`
      );
      if (confirmar) {
        this.eliminarItemComanda(item);
      }
      return;
    }

    this.mesas.update(mesas =>
      mesas.map(m => {
        if (m.id !== this.mesaSeleccionada()!.id || !m.orden) return m;
        return {
          ...m,
          orden: {
            ...m.orden!,
            items: m.orden!.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity - 1 }
                : i
            )
          }
        };
      })
    );

    // Actualizar mesaSeleccionada también
    this.mesaSeleccionada.update(m => {
      if (!m || !m.orden) return m;
      return {
        ...m,
        orden: {
          ...m.orden,
          items: m.orden.items.map(i =>
            i.id === item.id
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
        }
      };
    });

    this.persistirCambiosCantidad();
  }

  /**
   * Elimina un item de la comanda actual
   */
  eliminarItemComanda(item: OrderItem): void {
    this.mesas.update(mesas =>
      mesas.map(m => {
        if (m.id !== this.mesaSeleccionada()!.id || !m.orden) return m;
        return {
          ...m,
          orden: {
            ...m.orden!,
            items: m.orden!.items.filter(i => i.id !== item.id)
          }
        };
      })
    );

    // Actualizar mesaSeleccionada también
    this.mesaSeleccionada.update(m => {
      if (!m || !m.orden) return m;
      return {
        ...m,
        orden: {
          ...m.orden,
          items: m.orden.items.filter(i => i.id !== item.id)
        }
      };
    });

    this.persistirCambiosCantidad();
    this.mostrarMensaje('Producto eliminado de la comanda', 'info');
  }

  /**
   * Persiste los cambios de cantidad en el backend
   */
  private persistirCambiosCantidad(): void {
    const orden = this.mesaSeleccionada()?.orden;
    if (!orden) return;

    this.persistirItemsComanda(orden.id, orden.items);
  }

  /**
   * Persiste los items de la comanda en el backend
   */
  private persistirItemsComanda(ordenId: number, items: OrderItem[]): void {
    // TODO: Implementar endpoint en el backend para actualizar items
    // Por ahora solo mostramos mensaje de éxito
    // this.orderService.actualizarItems(ordenId, items).subscribe({
    //   error: () => {
    //     this.mostrarMensaje('Error al actualizar la comanda', 'error');
    //     // TODO: Revertir cambios en el signal si falla
    //   }
    // });
  }

  // ========================================================================

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }

  private mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success'): void {
    this.mostrarMensaje(mensaje, tipo);
  }

  /**
   * Toggle confirmación de pago
   */
  togglePagoConfirmado(): void {
    const orden = this.mesaSeleccionada()?.orden;
    if (!orden || this.guardandoPago()) return;

    const nuevoValor = !this.pagoConfirmado();
    this.guardandoPago.set(true);

    this.orderService.actualizarOrden(orden.id, {
      pago_confirmado: nuevoValor
    }).subscribe({
      next: (res) => {
        this.guardandoPago.set(false);

        // Actualizar el signal local de inmediato
        this.mesas.update(mesas =>
          mesas.map(m => m.id === this.mesaSeleccionada()!.id
            ? {
                ...m,
                orden: {
                  ...m.orden!,
                  pago_confirmado:  res.pago_confirmado,
                  envio_confirmado: res.envio_confirmado,
                  estatus:          res.estatus
                }
              }
            : m
          )
        );

        this.mostrarToast(
          nuevoValor
            ? 'Pago confirmado correctamente'
            : 'Pago marcado como pendiente',
          'success'
        );
      },
      error: () => {
        this.guardandoPago.set(false);
        this.mostrarToast('Error al actualizar el pago', 'error');
      }
    });
  }

  /**
   * Toggle confirmación de envío
   */
  toggleEnvioConfirmado(): void {
    const orden = this.mesaSeleccionada()?.orden;
    if (!orden || this.guardandoEnvio()) return;

    const nuevoValor = !this.envioConfirmado();
    this.guardandoEnvio.set(true);

    this.orderService.actualizarOrden(orden.id, {
      envio_confirmado: nuevoValor
    }).subscribe({
      next: (res) => {
        this.guardandoEnvio.set(false);

        this.mesas.update(mesas =>
          mesas.map(m => m.id === this.mesaSeleccionada()!.id
            ? {
                ...m,
                orden: {
                  ...m.orden!,
                  // No actualizar pago_confirmado desde aquí — solo el flujo
                  // de pago real debe modificarlo, no la confirmación de entrega
                  envio_confirmado: res.envio_confirmado,
                  estatus:          res.estatus
                }
              }
            : m
          )
        );

        this.mostrarToast(
          nuevoValor
            ? 'Envío confirmado correctamente'
            : 'Envío marcado como pendiente',
          'success'
        );
      },
      error: () => {
        this.guardandoEnvio.set(false);
        this.mostrarToast('Error al actualizar el envío', 'error');
      }
    });
  }

  // ─── Persistencia de monto_pagado_anterior en localStorage ───────────────
  private readonly MONTO_PAGADO_KEY = 'veritus_monto_pagado_anterior';
  // v2: solo entradas guardadas cuando estatus===6 (pago real). Las entradas
  // antiguas sin este flag son datos obsoletos y se ignoran automáticamente.
  private readonly MONTO_PAGADO_V2 = true;

  private guardarMontoPagado(ordenId: number, monto: number): void {
    try {
      const stored = JSON.parse(localStorage.getItem(this.MONTO_PAGADO_KEY) ?? '{}');
      stored[ordenId] = { monto, v2: this.MONTO_PAGADO_V2 };
      localStorage.setItem(this.MONTO_PAGADO_KEY, JSON.stringify(stored));
    } catch {}
  }

  private restaurarMontoPagado(ordenId: number): number {
    try {
      const stored = JSON.parse(localStorage.getItem(this.MONTO_PAGADO_KEY) ?? '{}');
      const entry = stored[ordenId];
      // Solo restaurar entradas v2 (guardadas con el código nuevo que exige estatus===6)
      // Las entradas antiguas (número directo sin v2) se ignoran y se limpian
      if (!entry || typeof entry !== 'object' || !entry.v2) {
        if (entry !== undefined) {
          delete stored[ordenId];
          localStorage.setItem(this.MONTO_PAGADO_KEY, JSON.stringify(stored));
        }
        return 0;
      }
      return Number(entry.monto ?? 0);
    } catch { return 0; }
  }

  private limpiarMontoPagado(ordenId: number): void {
    try {
      const stored = JSON.parse(localStorage.getItem(this.MONTO_PAGADO_KEY) ?? '{}');
      delete stored[ordenId];
      localStorage.setItem(this.MONTO_PAGADO_KEY, JSON.stringify(stored));
    } catch {}
  }

  /** Deshace el cobro anterior (cuando se marcó como pagado por error antes de agregar ítems) */
  resetearCobradoAnterior(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa?.orden) return;
    // Quitar pago_confirmado del estado local para volver a cobro completo
    this.mesas.update(mesas =>
      mesas.map(m => m.id === mesa.id
        ? { ...m, orden: { ...m.orden!, pago_confirmado: false, monto_pagado_anterior: 0 } }
        : m
      )
    );
    this.mesaSeleccionada.update(m =>
      m && m.id === mesa.id
        ? { ...m, orden: { ...m.orden!, pago_confirmado: false, monto_pagado_anterior: 0 } }
        : m
    );
  }
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Cuando pago_confirmado=true pero no hay threshold en memoria (ej. recarga de página),
   * lo deriva del created_at mínimo de los ítems: los más antiguos ya se pagaron,
   * los más nuevos son por cobrar.
   */
  private deriveThreshold(orden: Order): string | undefined {
    if (!orden.pago_confirmado) return undefined;
    if (orden.pago_confirmado_threshold) return orden.pago_confirmado_threshold;
    const items = orden.items ?? [];
    if (!items.length) return undefined;
    return items.reduce((min, i) => i.created_at < min ? i.created_at : min, items[0].created_at);
  }

  private calcularTotalAdicionales(orden: Order): {
    esAdicional: boolean;
    totalAdicionales: number;
    itemsAdicionales: OrderItem[];
  } {
    if (orden.pago_confirmado !== true) {
      return { esAdicional: false, totalAdicionales: Number(orden.total), itemsAdicionales: [] };
    }

    const threshold = this.deriveThreshold(orden);
    if (!threshold) {
      return { esAdicional: false, totalAdicionales: Number(orden.total), itemsAdicionales: [] };
    }

    const itemsAdicionales = (orden.items ?? []).filter(i => i.created_at > threshold);

    if (itemsAdicionales.length === 0) {
      return { esAdicional: false, totalAdicionales: Number(orden.total), itemsAdicionales: [] };
    }

    const totalAdicionales = itemsAdicionales.reduce(
      (sum, i) => sum + (Number(i.unit_price) * i.quantity), 0
    );

    return { esAdicional: true, totalAdicionales, itemsAdicionales };
  }

  irAAbrirTurno(): void {
    this.router.navigate(['/turno-caja']);
  }

  /**
   * Abre dialog para confirmar pago con selección de método
   */
  abrirDialogPago(): void {
    if (!this.turnoEstado.hayTurnoAbierto()) {
      this.mostrarMensaje(
        'No hay un turno de caja abierto. Abre un turno antes de cobrar.',
        'error'
      );
      return;
    }

    const mesa = this.mesaSeleccionada();
    const orden = mesa ? this.getOrdenActiva(mesa) : null;
    
    if (!mesa || !orden) {
      this.mostrarToast('No hay orden para procesar el pago', 'error');
      return;
    }

    const { esAdicional, totalAdicionales } =
      this.calcularTotalAdicionales(orden);

    const dialogRef = this.dialog.open(ConfirmarPagoDialogComponent, {
      width: '100%',
      maxWidth: '400px',
      maxHeight: '90vh',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      panelClass: 'confirmar-pago-dialog-panel',
      disableClose: false,
      data: {
        total: esAdicional ? totalAdicionales : Number(orden.total),
        mesaNumero: mesa.identificador,
        metodoPagoActual: orden.payment_method,
        esAdicional,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      this.guardandoPago.set(true);

      if (result.metodoPago === 'combinado'
          && result.pagoCombinado) {

        const pago = result.pagoCombinado;
        const pagos: { metodo: string; monto: number }[] = [];

        if (pago.efectivo > 0) {
          pagos.push({ metodo: 'efectivo', monto: pago.efectivo });
        }
        if (pago.tarjeta > 0) {
          pagos.push({ metodo: 'tarjeta', monto: pago.tarjeta });
        }
        if (pago.transferencia > 0) {
          pagos.push({
            metodo: 'transferencia',
            monto: pago.transferencia,
          });
        }

        this.orderService
          .pagarCombinado(orden.id, pagos)
          .subscribe({
            next: (res) => {
              this.guardandoPago.set(false);
              this.finalizarPago(
                mesa, orden, res, result, {
                  payment_method: 'combinado',
                  pago_confirmado: true,
                  estatus: 6,
                },
                esAdicional
              );
            },
            error: (err) => {
              this.guardandoPago.set(false);
              console.error('Error al procesar pago:', err);
              this.mostrarToast(
                'Error al procesar el pago', 'error'
              );
            },
          });

      } else {
        const payload: any = {
          payment_method: result.metodoPago,
          pago_confirmado: true,
          estatus: 6,
        };

        if (result.confirmarEnvio) {
          payload.envio_confirmado = true;
        }

        this.orderService
          .actualizarOrden(orden.id, payload)
          .subscribe({
            next: (res) => {
              this.guardandoPago.set(false);
              this.finalizarPago(
                mesa, orden, res, result, payload, esAdicional
              );
            },
            error: (err) => {
              this.guardandoPago.set(false);
              console.error('Error al procesar el pago:', err);
              this.mostrarToast(
                'Error al procesar el pago', 'error'
              );
            },
          });
      }
    });
  }

  private finalizarPago(
    mesa: Mesa,
    orden: Order,
    res: any,
    result: any,
    payload: any,
    esAdicional = false
  ): void {
    const itemsAlPagar = orden.items ?? [];
    const newThreshold = (!esAdicional && itemsAlPagar.length > 0)
      ? itemsAlPagar.reduce(
          (max: string, i: OrderItem) =>
            i.created_at > max ? i.created_at : max,
          itemsAlPagar[0].created_at
        )
      : undefined;

    const ordenConFolio = {
      ...orden,
      ...res,
      folio: res.folio ?? orden.folio,
      folio_diario: res.folio_diario
        ?? res.folio_dia
        ?? orden.folio_diario,
      folio_dia: res.folio_dia
        ?? res.folio_diario
        ?? orden.folio_dia,
    };

    this.mesas.update(mesas =>
      mesas.map(m => m.id === mesa.id
        ? {
            ...m,
            orden: {
              ...m.orden!,
              ...ordenConFolio,
              payment_method: res.payment_method
                || payload.payment_method,
              pago_confirmado: true,
              envio_confirmado: res.envio_confirmado,
              estatus: 6,
              monto_pagado_anterior: 0,
              pago_confirmado_threshold: newThreshold,
            },
          }
        : m
      )
    );

    this.mesaSeleccionada.update(m =>
      m && m.id === mesa.id
        ? {
            ...m,
            orden: {
              ...m.orden!,
              ...ordenConFolio,
              payment_method: res.payment_method
                || payload.payment_method,
              pago_confirmado: true,
              envio_confirmado: res.envio_confirmado,
              estatus: 6,
              monto_pagado_anterior: 0,
              pago_confirmado_threshold: newThreshold,
            },
          }
        : m
    );

    this.limpiarMontoPagado(orden.id);
    this.mostrarToast(
      'Pago confirmado correctamente', 'success'
    );

    this.imprimirTicketsAreaMesa(orden, mesa);

    this.abrirTicketConNombre(
      ordenConFolio,
      result.metodoPago ?? 'efectivo',
      mesa.identificador ?? '',
      undefined,
      result.montoRecibido,
      result.cambio
    );

    const todasLasOrdenes = this.getOrdenesActivas(mesa);
    const otrasCuentasPendientes = todasLasOrdenes.filter(
      o => o.id !== orden.id
        && !o.pago_confirmado
        && o.estatus !== 6
        && o.estatus !== 7
        && o.estatus !== 8
    );

    if (otrasCuentasPendientes.length > 0) {
      this.mostrarToast(
        'Cuenta cobrada. Quedan '
        + otrasCuentasPendientes.length
        + ' cuenta(s) pendiente(s) en esta mesa.',
        'info'
      );
      this.volverAlMapa();
      this.cargarMesas();
    } else {
      this.mesaService
        .cambiarEstado(mesa.id, 'libre', {})
        .subscribe({
          next: () => {
            this.volverAlMapa();
            this.cargarMesas();
          },
          error: () => {
            this.volverAlMapa();
            this.cargarMesas();
          },
        });
    }
  }

  private imprimirTicketsAreaMesa(
    orden: Order,
    mesa: Mesa
  ): void {
    const mapaCategoriaArea: Record<number, number> = {};
    const areas: { id: number; nombre: string }[] = [];

    this.categoriasMenu().forEach((cat) => {
      if (cat.area_impresion_id) {
        mapaCategoriaArea[cat.id] = cat.area_impresion_id;
        if (!areas.find(a => a.id === cat.area_impresion_id)) {
          areas.push({
            id:     cat.area_impresion_id,
            nombre: cat.area_nombre ?? 'Área',
          });
        }
      }
    });

    const items = (orden.items ?? []).map((item) => {
      const categoriaId = this.resolverCategoriaIdItem(item);

      return {
        name:     item.name,
        quantity: item.quantity,
        nota:     item.note ?? (item as any).nota,
        selections: item.selections,
        area_impresion_id: categoriaId
          ? mapaCategoriaArea[categoriaId] ?? null
          : null,
      };
    });

    this.ticketAreas.imprimirTicketsDeArea({
      numeroOrden:      orden.id,
      mesa:             mesa.identificador ?? undefined,
      tipoServicio:     'local',
      items,
      areas,
      mapaCategoriaArea,
      mapaCategorias:   {},
      horaConfirmacion: new Date().toISOString(),
    });
  }

  private resolverCategoriaIdItem(item: OrderItem): number | null {
    if ((item as any).categoria_id) {
      return (item as any).categoria_id;
    }
    if (item.product_id) {
      const prod = this.todosProductosMenu().find(
        p => p.id === item.product_id
      );
      return prod?.categoria_id ?? null;
    }
    return null;
  }

  liberarMesaManual(): void {
    const mesa  = this.mesaSeleccionada();
    const orden = mesa ? this.getOrdenActiva(mesa) : null;
    if (!mesa || !orden) return;

    this.guardandoPago.set(true);

    this.mesaService.getById(mesa.id).subscribe({
      next: (mesaRes) => {
        const mesaActual = mesaRes.data ?? mesa;

        const todasLasOrdenes = this.getOrdenesActivas(
          mesaActual
        );

        const otrasCuentasPendientes = todasLasOrdenes
          .filter(o =>
            o.id !== orden.id
            && !o.pago_confirmado
            && o.estatus !== 6
            && o.estatus !== 7
            && o.estatus !== 8
          );

        this.orderService
          .actualizarOrden(orden.id, {
            estatus:          6,
            pago_confirmado:  true,
            envio_confirmado: true,
          })
          .subscribe({
            next: () => {
              if (otrasCuentasPendientes.length > 0) {
                this.guardandoPago.set(false);
                this.mostrarToast(
                  'Cuenta liberada. Quedan '
                  + otrasCuentasPendientes.length
                  + ' cuenta(s) pendiente(s) en esta mesa.',
                  'info'
                );
                this.cargarMesas();
                this.volverAlMapa();
              } else {
                this.mesaService
                  .cambiarEstado(mesa.id, 'libre', {})
                  .subscribe({
                    next: () => {
                      this.guardandoPago.set(false);
                      this.mostrarToast(
                        'Mesa liberada correctamente',
                        'success'
                      );
                      this.cargarMesas();
                      this.volverAlMapa();
                    },
                    error: () => {
                      this.guardandoPago.set(false);
                      this.cargarMesas();
                      this.volverAlMapa();
                    }
                  });
              }
            },
            error: () => {
              this.guardandoPago.set(false);
              this.mostrarToast(
                'Error al liberar la cuenta', 'error'
              );
            }
          });
      },
      error: () => {
        this.guardandoPago.set(false);
        this.mostrarToast(
          'Error al verificar el estado de la mesa',
          'error'
        );
      }
    });
  }

  imprimirTicket(): void {
    const mesa  = this.mesaSeleccionada();
    const orden = mesa?.orden;
    if (!mesa || !orden) return;

    this.asegurarDatosEmpresa(() => this.ejecutarImpresionTicket(mesa, orden));
  }

  private ejecutarImpresionTicket(mesa: Mesa, orden: NonNullable<Mesa['orden']>): void {
    const metodo = orden.payment_method ?? 'efectivo';
    const mesaId = mesa.identificador ?? '';

    if (this.tieneFolioApi(orden)) {
      this.abrirTicket(this.buildDatosTicket(orden, metodo, mesaId));
      return;
    }

    const hoy = new Date().toISOString().split('T')[0];

    this.orderService.listOrders(hoy).subscribe({
      next: (res: any) => {
        const lista: any[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.orders ?? []);

        // Agrupar por fecha real (mismo algoritmo que Pedidos)
        const porFecha = new Map<string, any[]>();

        for (const row of lista) {
          const fecha = new Date(row.created_at);
          if (isNaN(fecha.getTime())) continue;

          const clave = [
            fecha.getFullYear(),
            String(fecha.getMonth() + 1).padStart(2, '0'),
            String(fecha.getDate()).padStart(2, '0'),
          ].join('-');

          if (!porFecha.has(clave)) porFecha.set(clave, []);
          porFecha.get(clave)!.push(row);
        }

        // Calcular folio dentro del grupo del día de esta orden
        const fechaOrden = new Date(orden.created_at ?? '');
        const claveOrden = isNaN(fechaOrden.getTime()) ? hoy : [
          fechaOrden.getFullYear(),
          String(fechaOrden.getMonth() + 1).padStart(2, '0'),
          String(fechaOrden.getDate()).padStart(2, '0'),
        ].join('-');

        const grupoDelDia = (porFecha.get(claveOrden) ?? [])
          .sort((a: any, b: any) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            if (ta !== tb) return ta - tb;
            return a.id - b.id;
          });

        const rowOrden = grupoDelDia.find((o: any) => o.id === orden.id);
        const ordenEnriquecida = { ...orden, ...(rowOrden ?? {}) };
        const datos = this.buildDatosTicket(ordenEnriquecida, metodo, mesaId);

        if (this.tieneFolioApi(ordenEnriquecida)) {
          this.abrirTicket(datos);
          return;
        }

        this.ventasService.getFolioDeOrden(orden.id).subscribe({
          next: (folio) => this.abrirTicket(datos, folio || undefined),
          error: () => this.abrirTicket(datos)
        });
      },
      error: () => {
        this.abrirTicket(this.buildDatosTicket(orden, metodo, mesaId));
      }
    });
  }

  private _imprimirTicketLegacy_unused(): void {
    const mesa = this.mesaSeleccionada();
    const orden = mesa?.orden;
    if (!orden) return;

    const nombreEmpresa = this.nombreEmpresa() || '';
    const items = orden.items ?? [];
    const fecha = new Date().toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Construir filas de items
    const filasItems = items.map((item, i) => {
      const subtotal = (parseFloat(item.unit_price as string) * item.quantity).toFixed(2);
      const selections = Array.isArray(item.selections)
        ? item.selections
            .filter((s: any) => s.groupTitle?.toLowerCase() !== 'nota')
            .map((s: any) => {
              const extra = s['precio-extra'] > 0
                ? `${s.extra} (+$${s['precio-extra']})`
                : s.extra;
              return `<span class="ticket-comp">${extra}</span>`;
            })
            .join('')
        : '';

      const nota = Array.isArray(item.selections)
        ? item.selections.find(
            (s: any) => s.groupTitle?.toLowerCase() === 'nota'
          )?.extra ?? ''
        : '';

      return `
        <tr class="ticket-item">
          <td class="ticket-item__num">${i + 1}</td>
          <td class="ticket-item__info">
            <span class="ticket-item__nombre">${item.name}</span>
            ${selections
              ? `<div class="ticket-item__comps">${selections}</div>`
              : ''}
            ${nota
              ? `<div class="ticket-item__nota">📌 ${nota}</div>`
              : ''}
          </td>
          <td class="ticket-item__qty">${item.quantity}</td>
          <td class="ticket-item__precio">$${subtotal}</td>
        </tr>
      `;
    }).join('');

    // Construir HTML del ticket
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Comanda — ${mesa!.identificador}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            color: #1A1A11;
            width: 80mm;
            margin: 0 auto;
            padding: 8px;
          }

          /* Header */
          .ticket-header {
            text-align: center;
            border-bottom: 2px dashed #1A1A11;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }

          .ticket-header__empresa {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 4px;
          }

          .ticket-header__titulo {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .ticket-header__mesa {
            font-size: 22px;
            font-weight: bold;
            margin: 6px 0 2px;
          }

          .ticket-header__fecha {
            font-size: 11px;
            color: #555;
          }

          .ticket-header__zona {
            font-size: 11px;
            color: #555;
          }

          /* Tabla de items */
          .ticket-tabla {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }

          .ticket-tabla thead tr {
            border-bottom: 1px solid #1A1A11;
          }

          .ticket-tabla thead th {
            font-size: 10px;
            text-transform: uppercase;
            padding: 4px 2px;
            text-align: left;
            letter-spacing: 0.05em;
          }

          .ticket-tabla thead th:nth-child(3),
          .ticket-tabla thead th:nth-child(4) {
            text-align: right;
          }

          .ticket-item td {
            padding: 6px 2px;
            vertical-align: top;
            border-bottom: 1px dotted #ccc;
          }

          .ticket-item__num {
            width: 16px;
            font-size: 10px;
            color: #888;
            padding-top: 7px;
          }

          .ticket-item__info {
            padding-left: 4px;
          }

          .ticket-item__nombre {
            font-weight: bold;
            font-size: 13px;
            display: block;
          }

          .ticket-item__comps {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-top: 3px;
          }

          .ticket-comp {
            font-size: 10px;
            background: #f0f0f0;
            border-radius: 3px;
            padding: 1px 5px;
            display: inline-block;
          }

          .ticket-item__nota {
            font-size: 10px;
            color: #854F0B;
            margin-top: 3px;
            font-style: italic;
          }

          .ticket-item__qty {
            width: 24px;
            text-align: right;
            font-weight: bold;
            font-size: 13px;
            white-space: nowrap;
            vertical-align: top;
            padding-top: 7px;
          }

          .ticket-item__precio {
            width: 56px;
            text-align: right;
            font-weight: bold;
            font-size: 13px;
            white-space: nowrap;
            vertical-align: top;
            padding-top: 7px;
          }

          /* Totales */
          .ticket-totales {
            border-top: 2px dashed #1A1A11;
            padding-top: 8px;
            margin-top: 4px;
          }

          .ticket-totales__fila {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 3px;
          }

          .ticket-totales__fila--total {
            font-size: 16px;
            font-weight: bold;
            border-top: 1px solid #1A1A11;
            padding-top: 6px;
            margin-top: 4px;
          }

          /* Footer */
          .ticket-footer {
            text-align: center;
            border-top: 2px dashed #1A1A11;
            margin-top: 12px;
            padding-top: 10px;
            font-size: 11px;
            color: #555;
          }

          .ticket-footer__gracias {
            font-size: 13px;
            font-weight: bold;
            color: #1A1A11;
            margin-bottom: 4px;
          }

          /* Ocultar todo excepto el ticket al imprimir */
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>

        <div class="ticket-header">
          ${nombreEmpresa ? `<p class="ticket-header__empresa">${nombreEmpresa}</p>` : ''}
          <p class="ticket-header__titulo">Comanda</p>
          <p class="ticket-header__mesa">${mesa!.identificador}</p>
          ${mesa!.zona
            ? `<p class="ticket-header__zona">Zona: ${mesa!.zona}</p>`
            : ''}
          <p class="ticket-header__fecha">${fecha}</p>
        </div>

        <table class="ticket-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Cant</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${filasItems}
          </tbody>
        </table>

        <div class="ticket-totales">
          <div class="ticket-totales__fila">
            <span>Subtotal</span>
            <span>$${parseFloat(orden.subtotal).toFixed(2)}</span>
          </div>
          ${parseFloat(orden.tip) > 0 ? `
          <div class="ticket-totales__fila">
            <span>Propina</span>
            <span>$${parseFloat(orden.tip).toFixed(2)}</span>
          </div>` : ''}
          ${parseFloat(orden.shipping_cost) > 0 ? `
          <div class="ticket-totales__fila">
            <span>Envío</span>
            <span>$${parseFloat(orden.shipping_cost).toFixed(2)}</span>
          </div>` : ''}
          <div class="ticket-totales__fila ticket-totales__fila--total">
            <span>TOTAL</span>
            <span>$${parseFloat(orden.total).toFixed(2)}</span>
          </div>
        </div>

        <div class="ticket-footer">
          <p class="ticket-footer__gracias">¡Gracias por su visita!</p>
          <p>Este documento no es un comprobante fiscal</p>
        </div>

      </body>
      </html>
    `;

    // Abrir ventana de impresión
    const ventana = window.open('', '_blank', 'width=400,height=600');
    if (!ventana) {
      // Si el navegador bloqueó el popup mostrar toast de error
      this.mostrarToast(
        'Permite las ventanas emergentes para imprimir',
        'error'
      );
      return;
    }

    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();

    // Esperar a que cargue y luego imprimir
    ventana.onload = () => {
      ventana.print();
      ventana.onafterprint = () => ventana.close();
    };
  }

  // ─── RESERVAS ───────────────────────────────────────────

  cargarReservas(): void {
    this.cargandoReservas.set(true);
    const filtros =
      this.vistaCalendario() === 'dia'
        ? { fecha: this.fechaStr() }
        : {
            fecha_inicio: this.localDateStr(this.diasSemana()[0]),
            fecha_fin: this.localDateStr(this.diasSemana()[6]),
          };

    this.reservaService.getReservas(filtros).subscribe({
      next: (res) => {
        this.reservas.set(res.data);
        this.cargandoReservas.set(false);
      },
      error: () => this.cargandoReservas.set(false),
    });
  }

  private localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getReservasDia(fecha: Date): Reserva[] {
    const fechaStr = this.localDateStr(fecha);
    return this.reservas().filter((r) => (r.fecha ?? '').substring(0, 10) === fechaStr);
  }

  getEstiloReserva(reserva: Reserva): Record<string, string> {
    const [h, m] = reserva.hora_inicio.split(':').map(Number);
    const minDesdeInicio = (h - 8) * 60 + m;
    const top = (minDesdeInicio / 60) * 64;
    const alto = (reserva.duracion_minutos / 60) * 64;
    return {
      top: `${top}px`,
      height: `${Math.max(alto - 4, 24)}px`,
    };
  }

  getTopHoraActual(): string {
    const ahora = new Date();
    const min = (ahora.getHours() - 8) * 60 + ahora.getMinutes();
    return `${(min / 60) * 64}px`;
  }

  abrirFormReserva(reserva?: Reserva, fecha?: Date): void {
    const ref = this.dialog.open(ReservaFormDialogComponent, {
      data: { reserva, fecha: fecha ?? this.fechaCalendario() },
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'dawrz-dialog',
      disableClose: true,
    });

    ref.afterClosed().subscribe((resultado: Reserva) => {
      if (resultado) this.cargarReservas();
    });
  }

  cambiarEstatusReserva(id: number, estatus: string): void {
    this.reservaService.cambiarEstatus(id, estatus).subscribe({
      next: () => this.cargarReservas(),
    });
  }

  eliminarReserva(id: number): void {
    if (!confirm('¿Eliminar esta reserva?')) return;
    this.reservaService.eliminar(id).subscribe({
      next: () => this.cargarReservas(),
    });
  }

  irDiaAnterior(): void {
    const d = new Date(this.fechaCalendario());
    d.setDate(d.getDate() - (this.vistaCalendario() === 'dia' ? 1 : 7));
    this.fechaCalendario.set(d);
    this.cargarReservas();
  }

  irDiaSiguiente(): void {
    const d = new Date(this.fechaCalendario());
    d.setDate(d.getDate() + (this.vistaCalendario() === 'dia' ? 1 : 7));
    this.fechaCalendario.set(d);
    this.cargarReservas();
  }

  irAHoy(): void {
    this.fechaCalendario.set(new Date());
    this.cargarReservas();
  }

  getColorEstatus(estatus: string): string {
    const colores: Record<string, string> = {
      pendiente: '#d97706',
      confirmada: '#1C8C40',
      en_curso: '#185FA5',
      completada: '#374151',
      cancelada: '#dc2626',
      no_show: '#6b7280',
    };
    return colores[estatus] ?? '#6b7280';
  }

  getLabelEstatus(estatus: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      en_curso: 'En curso',
      completada: 'Completada',
      cancelada: 'Cancelada',
      no_show: 'No se presentó',
    };
    return labels[estatus] ?? estatus;
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  formatDiaSemana(fecha: Date): string {
    return fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
  }

  onTabChange(index: number): void {
    if (index === 1) this.cargarReservas();
  }

  // ─── Split / Merge ───────────────────────────────────────

  getOrdenesActivas(mesa: Mesa): Order[] {
    const ordenes = mesa.ordenes_activas ?? [];
    if (ordenes.length > 0) {
      return ordenes as Order[];
    }
    return mesa.orden ? [mesa.orden] : [];
  }

  getOrdenActiva(mesa: Mesa): Order | null {
    const id = this.cuentaActivaId();
    const ordenes = mesa.ordenes_activas ?? [];
    if (!id || ordenes.length <= 1) {
      return (mesa.orden ?? ordenes[0] ?? null) as Order | null;
    }
    return (ordenes.find(o => o.id === id) ?? ordenes[0] ?? mesa.orden ?? null) as Order | null;
  }

  getNumeroCuentaActiva(mesa: Mesa): number {
    const ordenActual = this.getOrdenActiva(mesa);
    const ordenes = mesa.ordenes_activas ?? [];
    const idx = ordenes.findIndex(o => o.id === ordenActual?.id);
    return idx >= 0 ? idx + 1 : 1;
  }

  tieneSplit(mesa: Mesa): boolean {
    return (mesa.ordenes_ids?.length ?? 0) > 0
        || (mesa.ordenes_activas?.length ?? 0) > 1;
  }

  estaFusionada(mesa: Mesa): boolean {
    return !!mesa.mesa_principal_id;
  }

  getMesaPrincipal(mesa: Mesa): Mesa | null {
    if (!mesa.mesa_principal_id) return null;
    return this.mesas().find(
      m => m.id === mesa.mesa_principal_id
    ) ?? null;
  }

  getMesasHermanas(mesa: Mesa): Mesa[] {
    if (!mesa.mesa_principal_id) {
      return this.mesas().filter(
        m => m.mesa_principal_id === mesa.id
      );
    }
    return this.mesas().filter(
      m => m.id !== mesa.id && (
        m.id === mesa.mesa_principal_id ||
        m.mesa_principal_id === mesa.mesa_principal_id
      )
    );
  }

  abrirSplit(mesa: Mesa): void {
    this.mesaSplitActiva.set(mesa);
    this.mostrarSplitModal.set(true);
  }

  confirmarSplit(mesa: Mesa): void {
    this.mostrarSplitModal.set(false);
    this.mostrarSplitDestinoModal.set(true);
    this.mesaSplitActiva.set(mesa);
  }

  navegarSplit(destino: 'pos' | 'levantar'): void {
    const mesa = this.mesaSplitActiva();
    if (!mesa) return;

    this.mostrarSplitDestinoModal.set(false);

    const queryParams = {
      mesa_id: mesa.id,
      mesa_split: true,
    };

    if (destino === 'pos') {
      this.router.navigate(['/ventas-mostrador'], { queryParams });
    } else {
      this.router.navigate(['/levantar-orden'], { queryParams });
    }
  }

  abrirMerge(mesa: Mesa): void {
    this.mesaMergeActiva.set(mesa);
    this.mesasParaMerge.set([]);
    this.mostrarMergeModal.set(true);
  }

  toggleMesaMerge(mesaId: number): void {
    const actual = this.mesasParaMerge();
    if (actual.includes(mesaId)) {
      this.mesasParaMerge.set(actual.filter(id => id !== mesaId));
    } else {
      this.mesasParaMerge.set([...actual, mesaId]);
    }
  }

  confirmarMerge(): void {
    const mesaPrincipal = this.mesaMergeActiva();
    if (!mesaPrincipal) return;

    const secundarias = this.mesasParaMerge();
    if (secundarias.length === 0) return;

    this.mesaService.merge({
      mesa_principal_id: mesaPrincipal.id,
      mesas_secundarias: secundarias,
      orden_id: mesaPrincipal.id_orden,
    }).subscribe({
      next: () => {
        this.mostrarMergeModal.set(false);
        this.mesaMergeActiva.set(null);
        this.mesasParaMerge.set([]);
        this.mostrarMensaje('Mesas unidas correctamente', 'success');
        this.cargarMesas();
      },
      error: (err) => {
        console.error(err);
        this.mostrarMensaje('Error al unir las mesas', 'error');
      }
    });
  }
}
