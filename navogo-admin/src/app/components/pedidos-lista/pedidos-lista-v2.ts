import { Component, OnInit, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { OrderService } from '../../services/orders/order.service';
import { OrderCardComponent, type Pedido } from './order-card/order-card.component';
import { OrdersFilterBarComponent, type FiltroTipo, type FiltroModo } from './orders-filter-bar/orders-filter-bar.component';
import { ConfirmStatusDialogComponent } from '../confirm-status-dialog/confirm-status-dialog.component';
import { getOrderFolio } from '../../utils/order-folio.util';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

interface AdminOrder {
  id: number;
  folio?: string | number | null;
  folio_diario?: string | number | null;
  folio_dia?: number | null;
  business_id: number;
  shipping_type: 'domicilio' | 'recoger' | 'local';
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta';
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  estatus?: number;
  customer_name: string;
  customer_phone: string;
  tip: number | string;
  shipping_cost: number | string;
  subtotal: number | string;
  total: number | string;
  created_at?: string;
  delivery_address?: any;
  note?: string | null;
  items?: Array<{
    product_id?: number | null;
    name: string;
    quantity: number;
    unit_price: number | string;
    selections?: Array<{ groupTitle?: string; extra?: string; precio?: number | null }> | null;
  }>;
}

@Component({
  selector: 'app-pedidos-lista-v2',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    OrderCardComponent,
    OrdersFilterBarComponent,
  ],
  templateUrl: './pedidos-lista-v2.html',
  styleUrl: './pedidos-lista-v2.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('urgentBanner', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class PedidosListaV2 implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  
  // Signals para estado global
  orders = signal<Pedido[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  selectedDate = signal(new Date());
  filtroModo = signal<FiltroModo>('pendientes');
  filtroTipo = signal<FiltroTipo>('todos');
  
  // Computed signals para lógica reactiva
  filteredOrders = computed(() => {
    const allOrders = this.orders();
    const modo = this.filtroModo();
    const tipo = this.filtroTipo();
    const selectedDay = this.selectedDate();
    
    let filtered = allOrders.filter(order => {
      // Filtrar por día
      const orderDate = new Date(order.creadoEn);
      const isSameDay = 
        orderDate.getDate() === selectedDay.getDate() &&
        orderDate.getMonth() === selectedDay.getMonth() &&
        orderDate.getFullYear() === selectedDay.getFullYear();
      
      if (!isSameDay) return false;
      
      // Filtrar por modo (todos/pendientes)
      if (modo === 'pendientes') {
        if (order.estado === 'finalizado' || order.estado === 'cancelado') {
          return false;
        }
      }
      
      // Filtrar por tipo
      if (tipo !== 'todos' && order.tipo !== tipo) {
        return false;
      }
      
      return true;
    });
    
    // Ordenar: más urgentes primero (mayor tiempo transcurrido)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.creadoEn).getTime();
      const timeB = new Date(b.creadoEn).getTime();
      return timeA - timeB; // Más antiguos primero
    });
  });
  
  urgentOrders = computed(() => {
    return this.filteredOrders().filter(order => {
      const createdAt = new Date(order.creadoEn);
      const now = new Date();
      const minutosTranscurridos = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
      return minutosTranscurridos >= 20 && 
             order.estado !== 'finalizado' && 
             order.estado !== 'cancelado';
    });
  });
  
  pendingOrdersCount = computed(() => {
    return this.orders().filter(order => 
      order.estado !== 'finalizado' && 
      order.estado !== 'cancelado'
    ).length;
  });
  
  // Effect para alertas de pedidos urgentes
  constructor() {
    effect(() => {
      const urgent = this.urgentOrders();
      if (urgent.length > 0) {
        console.warn(`⚠️ ${urgent.length} pedido(s) urgente(s) - más de 20 minutos`);
        // Aquí podrías agregar sonido de alerta o notificación
      }
    });
  }
  
  ngOnInit(): void {
    this.startPolling();
  }
  
  private startPolling(): void {
    timer(0, 30000) // Cada 30 segundos
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.loadOrders())
      )
      .subscribe();
  }
  
  private async loadOrders() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      const response = await this.ordersService.listOrders().toPromise();
      const rawOrders = Array.isArray(response) ? response : (response?.data ?? response?.orders ?? []);
      
      // Transformar a formato Pedido
      const transformedOrders: Pedido[] = rawOrders.map(this.transformOrder.bind(this));
      
      this.orders.set(transformedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      this.errorMessage.set('Error al cargar pedidos. Reintentando...');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  private transformOrder(raw: AdminOrder): Pedido {
    const folio = getOrderFolio(raw);

    // Determinar estado
    let estado: Pedido['estado'] = 'en-proceso';
    if (raw.estatus === 2) estado = 'finalizado';
    else if (raw.estatus === 3) estado = 'cancelado';
    else if (!raw.pago_confirmado) estado = 'pago-pendiente';
    else if (!raw.envio_confirmado && raw.shipping_type !== 'recoger') estado = 'pendiente-servir';
    
    // Transformar items
    const items: Pedido['items'] = (raw.items || []).map(item => ({
      cantidad: item.quantity,
      nombre: item.name,
      precio: Number(item.unit_price),
      modificadores: item.selections?.map(s => s.extra || s.groupTitle || '').filter(Boolean) || []
    }));
    
    return {
      folio,
      id: raw.id,
      creadoEn: raw.created_at || new Date().toISOString(),
      tipo: raw.shipping_type,
      estado,
      mesa: undefined, // Agregar si está disponible en el backend
      telefono: raw.customer_phone,
      nombreCliente: raw.customer_name,
      metodoPago: raw.payment_method,
      items,
      notas: raw.note || undefined,
      total: Number(raw.total),
      pagoConfirmado: raw.pago_confirmado,
      envioConfirmado: raw.envio_confirmado,
      delivery_address: raw.delivery_address ?? null,
    };
  }
  
  onRefresh() {
    this.loadOrders();
  }
  
  async onStatusChange(event: { id: number; action: 'pagar' | 'servir' | 'cancelar' }) {
    const order = this.orders().find(o => o.id === event.id);
    if (!order) return;
    
    const dialogRef = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        kind: event.action,
        title: this.getActionTitle(event.action),
        message: `¿Confirmar esta acción para el folio ${order.folio}?`,
        meta: `Folio ${order.folio}`,
        confirmText: this.getActionConfirmText(event.action)
      }
    });
    
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) return;
    
    try {
      if (event.action === 'pagar') {
        await this.ordersService.updateOrderChecks(event.id, { pago_confirmado: true }).toPromise();
      } else if (event.action === 'servir') {
        await this.ordersService.updateOrderChecks(event.id, { envio_confirmado: true }).toPromise();
      } else if (event.action === 'cancelar') {
        await this.ordersService.updateOrderChecks(event.id, { estatus: 3 }).toPromise();
      }
      
      this.snackBar.open('Pedido actualizado correctamente', 'Cerrar', { duration: 3000 });
      await this.loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      this.snackBar.open('Error al actualizar el pedido', 'Cerrar', { duration: 3000 });
    }
  }
  
  onCardClick(orderId: number) {
    this.router.navigate(['/pedidos', orderId]);
  }
  
  private getActionTitle(action: string): string {
    const titles = {
      pagar: 'Confirmar pago',
      servir: 'Marcar como servido',
      cancelar: 'Cancelar pedido'
    };
    return titles[action as keyof typeof titles] || 'Confirmar acción';
  }
  
  private getActionConfirmText(action: string): string {
    const texts = {
      pagar: 'Confirmar pago',
      servir: 'Marcar servido',
      cancelar: 'Cancelar pedido'
    };
    return texts[action as keyof typeof texts] || 'Confirmar';
  }
  
  trackByFolio(_index: number, order: Pedido): number {
    return order.id;
  }
}
