import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { trigger, state, style, transition, animate } from '@angular/animations';

export type TipoPedido = 'local' | 'domicilio' | 'recoger';
export type EstadoPedido = 'en-proceso' | 'pago-pendiente' | 'pendiente-servir' | 'finalizado' | 'cancelado';

export interface ItemPedido {
  cantidad: number;
  nombre: string;
  precio: number;
  modificadores?: string[];
}

export interface Pedido {
  folio: string | number;
  id: number;
  creadoEn: string;
  tipo: TipoPedido;
  estado: EstadoPedido;
  mesa?: string;
  telefono?: string;
  nombreCliente: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta';
  items: ItemPedido[];
  notas?: string;
  total: number;
  pagoConfirmado: boolean;
  envioConfirmado: boolean;
  delivery_address?: any;
}

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss',
  animations: [
    trigger('cardEntry', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('urgentPulse', [
      state('safe', style({ transform: 'scale(1)' })),
      state('warning', style({ transform: 'scale(1)' })),
      state('danger', style({ transform: 'scale(1)' })),
      transition('* => warning', [
        animate('1s ease-in-out', style({ transform: 'scale(1.02)' })),
        animate('1s ease-in-out', style({ transform: 'scale(1)' }))
      ]),
      transition('* => danger', [
        animate('0.6s ease-in-out', style({ transform: 'scale(1.03)' })),
        animate('0.6s ease-in-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class OrderCardComponent {
  // Inputs usando el nuevo API de signals
  order = input.required<Pedido>();
  
  // Outputs usando el nuevo API
  statusChange = output<{ id: number; action: 'pagar' | 'servir' | 'cancelar' }>();
  cardClick = output<number>();
  
  // Computed signals para lógica reactiva
  minutosTranscurridos = computed(() => {
    const createdAt = new Date(this.order().creadoEn);
    const now = new Date();
    return Math.floor((now.getTime() - createdAt.getTime()) / 60000);
  });
  
  timerClass = computed(() => {
    const mins = this.minutosTranscurridos();
    if (mins >= 20) return 'danger';
    if (mins >= 10) return 'warning';
    return 'safe';
  });
  
  timerColor = computed(() => {
    const mins = this.minutosTranscurridos();
    if (mins >= 20) return 'var(--timer-peligro)';
    if (mins >= 10) return 'var(--timer-advertencia)';
    return 'var(--timer-seguro)';
  });
  
  tipoConfig = computed(() => {
    const tipo = this.order().tipo;
    const configs = {
      'local': {
        color: 'var(--color-pedido-local)',
        icono: 'restaurant',
        texto: 'Comer aquí',
        emoji: '🍽'
      },
      'domicilio': {
        color: 'var(--color-pedido-domicilio)',
        icono: 'delivery_dining',
        texto: 'Domicilio',
        emoji: '🛵'
      },
      'recoger': {
        color: 'var(--color-pedido-llevar)',
        icono: 'shopping_bag',
        texto: 'Para llevar',
        emoji: '🛍'
      }
    };
    return configs[tipo] || configs['local'];
  });
  
  estadoConfig = computed(() => {
    const estado = this.order().estado;
    const configs = {
      'en-proceso': {
        color: 'var(--color-estado-proceso)',
        icono: 'autorenew',
        texto: 'En proceso'
      },
      'pago-pendiente': {
        color: 'var(--color-estado-pago)',
        icono: 'schedule',
        texto: 'Pago pendiente'
      },
      'pendiente-servir': {
        color: 'var(--color-estado-servir)',
        icono: 'room_service',
        texto: 'Pendiente servir'
      },
      'finalizado': {
        color: 'var(--color-estado-finalizado)',
        icono: 'check_circle',
        texto: 'Finalizado'
      },
      'cancelado': {
        color: 'var(--color-estado-cancelado)',
        icono: 'cancel',
        texto: 'Cancelado'
      }
    };
    return configs[estado] || configs['en-proceso'];
  });
  
  mostrarTimerPulse = computed(() => {
    return this.minutosTranscurridos() >= 10 && 
           this.order().estado !== 'finalizado' && 
           this.order().estado !== 'cancelado';
  });
  
  totalItems = computed(() => {
    return this.order().items.reduce((sum, item) => sum + item.cantidad, 0);
  });
  
  // Acciones
  onMarcarPagado() {
    this.statusChange.emit({ id: this.order().id, action: 'pagar' });
  }
  
  onServir() {
    this.statusChange.emit({ id: this.order().id, action: 'servir' });
  }
  
  onCancelar() {
    this.statusChange.emit({ id: this.order().id, action: 'cancelar' });
  }
  
  onCardClick() {
    this.cardClick.emit(this.order().id);
  }
  
  formatDeliveryAddress(addr: any): string {
    if (!addr) return '';
    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch {
        return addr.trim();
      }
    }
    if (typeof addr !== 'object') return '';
    const calle = (addr.calle ?? '').toString().trim();
    const numero = (addr.numero ?? '').toString().trim();
    const colonia = (addr.colonia ?? '').toString().trim();
    const ciudad = (addr.ciudad ?? '').toString().trim();
    const parts = [`${calle} ${numero}`.trim(), colonia, ciudad].filter((p) => p.length > 0);
    return parts.join(', ');
  }

  getDeliveryReferencia(addr: any): string {
    if (addr == null) return '';

    if (typeof addr === 'string') {
      const text = addr.trim();
      if (!text) return '';
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          addr = parsed;
        } else {
          return text;
        }
      } catch {
        return text;
      }
    }

    if (typeof addr !== 'object') return '';

    const ref = addr.referencias ?? addr.referencia ?? '';
    return ref.toString().trim();
  }

  formatMoney(value: number): string {
    return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
  
  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }
  
  formatTimerDisplay(): string {
    const mins = this.minutosTranscurridos();
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  }
  
  canMarcarPagado(): boolean {
    return !this.order().pagoConfirmado && 
           this.order().estado !== 'finalizado' && 
           this.order().estado !== 'cancelado';
  }
  
  canServir(): boolean {
    return this.order().tipo !== 'recoger' &&
           !this.order().envioConfirmado &&
           this.order().estado !== 'finalizado' && 
           this.order().estado !== 'cancelado';
  }
  
  canCancelar(): boolean {
    return this.order().estado !== 'finalizado' && 
           this.order().estado !== 'cancelado';
  }
}
