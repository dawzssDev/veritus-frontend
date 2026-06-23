import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA, MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { CommonModule, DecimalPipe, DatePipe, TitleCasePipe }
  from '@angular/common';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule }   from '@angular/material/chips';
import { Venta }            from '../ventas.interface';
import { formatearNota }    from '../../utils/order-note.util';

@Component({
  selector:   'app-venta-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, DatePipe, TitleCasePipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatChipsModule,
  ],
  template: `
<div class="vd-dialog">

  <!-- Header -->
  <div class="vd-header">
    <div class="vd-header__izq">
      <div class="vd-folio-badge">
        <mat-icon>receipt</mat-icon>
        <span>#{{ data.venta.folio }}</span>
      </div>
      <div>
        <p class="vd-fecha">
          {{ data.venta.created_at | date:'d MMM yyyy · HH:mm' }}
        </p>
        @if (data.venta.sucursal) {
          <p class="vd-sucursal">
            <mat-icon>store</mat-icon>
            {{ data.venta.sucursal.nombre }}
          </p>
        }
      </div>
    </div>
    <button mat-icon-button mat-dialog-close>
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <!-- Barra de estatus -->
  <div [class]="'vd-estatus-bar vd-estatus-bar--e'
                + data.venta.estatus">
    <mat-icon>{{ getIconoEstatus(data.venta.estatus) }}</mat-icon>
    <span>{{ getEtiquetaEstatus(data.venta.estatus) }}</span>
  </div>

  <mat-dialog-content class="vd-body">

    <!-- Info general en grid -->
    <div class="vd-info-grid">

      <!-- Cliente -->
      <div class="vd-info-card">
        <p class="vd-info-card__label">
          <mat-icon>person</mat-icon> Cliente
        </p>
        <p class="vd-info-card__valor">
          {{ data.venta.customer_name || 'Sin nombre' }}
        </p>
        @if (data.venta.customer_phone) {
          <a class="vd-whatsapp"
             [href]="getWhatsAppLink(data.venta.customer_phone)"
             target="_blank">
            <mat-icon>chat</mat-icon>
            {{ data.venta.customer_phone }}
          </a>
        }
      </div>

      <!-- Tipo de servicio -->
      <div class="vd-info-card">
        <p class="vd-info-card__label">
          <mat-icon>{{ getTipoIcono(data.venta.shipping_type) }}</mat-icon>
          Tipo de servicio
        </p>
        <p class="vd-info-card__valor">
          {{ getTipoLabel(data.venta.shipping_type) }}
        </p>
        @if (data.venta.delivery_address) {
          <p class="vd-info-card__sub">
            <mat-icon>location_on</mat-icon>
            {{ data.venta.delivery_address }}
          </p>
        }
      </div>

      <!-- Pago -->
      <div class="vd-info-card"
           [class.vd-info-card--ok]="data.venta.pago_confirmado">
        <p class="vd-info-card__label">
          <mat-icon>payments</mat-icon> Pago
        </p>
        <p class="vd-info-card__valor">
          {{ data.venta.payment_method | titlecase }}
        </p>
        <div class="vd-confirmacion"
             [class.vd-confirmacion--ok]="data.venta.pago_confirmado">
          <mat-icon>
            {{ data.venta.pago_confirmado
               ? 'check_circle' : 'radio_button_unchecked' }}
          </mat-icon>
          {{ data.venta.pago_confirmado
             ? 'Confirmado' : 'Pendiente' }}
        </div>
      </div>

      <!-- Entrega -->
      @if (data.venta.shipping_type !== 'local'
           && data.venta.shipping_type !== 'mesa') {
        <div class="vd-info-card"
             [class.vd-info-card--ok]="data.venta.envio_confirmado">
          <p class="vd-info-card__label">
            <mat-icon>local_shipping</mat-icon> Entrega
          </p>
          <p class="vd-info-card__valor">
            {{ data.venta.envio_confirmado
               ? 'Entregado' : 'Pendiente' }}
          </p>
          <div class="vd-confirmacion"
               [class.vd-confirmacion--ok]="data.venta.envio_confirmado">
            <mat-icon>
              {{ data.venta.envio_confirmado
                 ? 'check_circle' : 'radio_button_unchecked' }}
            </mat-icon>
            {{ data.venta.envio_confirmado
               ? 'Confirmado' : 'Pendiente' }}
          </div>
        </div>
      }

    </div>

    <!-- Productos -->
    <div class="vd-seccion">
      <p class="vd-seccion__titulo">
        <mat-icon>restaurant_menu</mat-icon>
        Productos
        <span class="vd-count">
          {{ data.venta.items?.length ?? 0 }}
        </span>
      </p>

      @if (data.venta.items?.length) {
        <div class="vd-items">
          @for (item of data.venta.items!;
                track item.id; let i = $index) {
            <div class="vd-item"
                 [class.vd-item--par]="i % 2 === 0">
              <div class="vd-item__qty">{{ item.quantity }}</div>
              <p class="vd-item__nombre">{{ item.name }}</p>
              <p class="vd-item__precio">
                \${{ (+item.unit_price * item.quantity)
                    | number:'1.2-2' }}
              </p>
            </div>
          }
        </div>
      } @else {
        <p class="vd-sin-items">Sin detalle de productos</p>
      }
    </div>

    <!-- Nota -->
    @if (formatearNota(data.venta.note)) {
      <div class="vd-nota">
        <mat-icon>sticky_note_2</mat-icon>
        <div>
          <p class="vd-nota__label">Nota del pedido</p>
          <p class="vd-nota__texto">{{ formatearNota(data.venta.note) }}</p>
        </div>
      </div>
    }

    <!-- Desglose de totales -->
    <div class="vd-desglose">
      <div class="vd-desglose__fila">
        <span>Subtotal</span>
        <span>\${{ data.venta.subtotal | number:'1.2-2' }}</span>
      </div>
      @if (+data.venta.tip > 0) {
        <div class="vd-desglose__fila">
          <span>Propina</span>
          <span class="vd-propina">
            +\${{ data.venta.tip | number:'1.2-2' }}
          </span>
        </div>
      }
      @if (+data.venta.shipping_cost > 0) {
        <div class="vd-desglose__fila">
          <span>Envío</span>
          <span>
            \${{ data.venta.shipping_cost | number:'1.2-2' }}
          </span>
        </div>
      }
      <div class="vd-desglose__separador"></div>
      <div class="vd-desglose__fila vd-desglose__fila--total">
        <span>TOTAL</span>
        <span>\${{ data.venta.total | number:'1.2-2' }} MXN</span>
      </div>
    </div>

  </mat-dialog-content>

  <mat-divider></mat-divider>

  <mat-dialog-actions align="end" class="vd-footer">
    <button mat-button mat-dialog-close>Cerrar</button>
  </mat-dialog-actions>

</div>
  `,
  styles: [`
    .vd-dialog { display: flex; flex-direction: column; min-width: 0; }

    .vd-header {
      display: flex; align-items: flex-start;
      justify-content: space-between;
      padding: 16px 16px 12px 20px; gap: 12px;
    }
    .vd-header__izq { display: flex; align-items: flex-start; gap: 12px; }

    .vd-folio-badge {
      display: flex; align-items: center; gap: 6px;
      background: #F8F9F8; border-radius: 10px;
      padding: 8px 12px; flex-shrink: 0;
    }
    .vd-folio-badge mat-icon { font-size:18px; width:18px; height:18px; color:#1C8C40; }
    .vd-folio-badge span { font-size:18px; font-weight:900; color:#1A1A11; }

    .vd-fecha { font-size: 13px; color: #6b7280; margin: 0 0 3px; }
    .vd-sucursal {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #9ca3af; margin: 0;
    }
    .vd-sucursal mat-icon { font-size:13px; width:13px; height:13px; }

    .vd-estatus-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; font-size: 13px; font-weight: 700;
    }
    .vd-estatus-bar mat-icon { font-size:16px; width:16px; height:16px; }
    .vd-estatus-bar--e1 { background:#f3f4f6; color:#6b7280; }
    .vd-estatus-bar--e2 { background:rgba(133,79,11,0.08); color:#854F0B; }
    .vd-estatus-bar--e3 { background:rgba(28,140,64,0.08); color:#1C8C40; }
    .vd-estatus-bar--e4 { background:rgba(24,95,165,0.08); color:#185FA5; }
    .vd-estatus-bar--e5 { background:rgba(124,58,237,0.08); color:#7c3aed; }
    .vd-estatus-bar--e6 { background:#1A1A11; color:white; }
    .vd-estatus-bar--e7 { background:rgba(220,38,38,0.08); color:#dc2626; }

    .vd-body {
      padding: 16px 20px; display: flex; flex-direction: column;
      gap: 16px; max-height: 60vh; overflow-y: auto;
    }

    .vd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    .vd-info-card {
      background: #F8F9F8; border-radius: 10px;
      padding: 12px 14px; border: 1px solid transparent;
    }
    .vd-info-card--ok {
      border-color: rgba(28,140,64,0.2);
      background: rgba(28,140,64,0.03);
    }
    .vd-info-card__label {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight:700; text-transform:uppercase;
      letter-spacing:0.06em; color:#9ca3af; margin: 0 0 6px;
    }
    .vd-info-card__label mat-icon { font-size:14px; width:14px; height:14px; }
    .vd-info-card__valor {
      font-size: 14px; font-weight: 600;
      color: #1A1A11; margin: 0 0 4px;
    }
    .vd-info-card__sub {
      display: flex; align-items: flex-start; gap: 4px;
      font-size: 12px; color: #6b7280; margin: 0;
    }
    .vd-info-card__sub mat-icon {
      font-size:13px; width:13px; height:13px; margin-top:1px;
    }

    .vd-whatsapp {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(37,211,102,0.1); color: #128C7E;
      border-radius: 6px; padding: 4px 10px;
      font-size: 12px; font-weight: 600; text-decoration: none;
    }
    .vd-whatsapp mat-icon { font-size:13px; width:13px; height:13px; }

    .vd-confirmacion {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; color: #9ca3af;
    }
    .vd-confirmacion mat-icon { font-size:14px; width:14px; height:14px; }
    .vd-confirmacion--ok { color: #1C8C40; }
    .vd-confirmacion--ok mat-icon { color: #1C8C40; }

    .vd-seccion { display: flex; flex-direction: column; gap: 10px; }
    .vd-seccion__titulo {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: #9ca3af; margin: 0;
    }
    .vd-seccion__titulo mat-icon { font-size:15px; width:15px; height:15px; }

    .vd-count {
      background: #1C8C40; color: white; border-radius: 20px;
      padding: 1px 8px; font-size: 11px;
    }

    .vd-items {
      background: white; border: 1px solid rgba(0,0,0,0.07);
      border-radius: 10px; overflow: hidden;
    }

    .vd-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    }
    .vd-item:not(:last-child) { border-bottom: 1px solid rgba(0,0,0,0.06); }
    .vd-item--par { background: #FAFAFA; }
    .vd-item__qty {
      width: 28px; height: 28px; border-radius: 7px;
      background: #0F4D2A; color: white;
      font-size: 13px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .vd-item__nombre {
      flex: 1; font-size: 14px; font-weight: 500;
      color: #1A1A11; margin: 0;
    }
    .vd-item__precio {
      font-size: 14px; font-weight: 700;
      color: #1A1A11; margin: 0; white-space: nowrap;
    }

    .vd-sin-items {
      text-align: center; font-size: 13px;
      color: #9ca3af; padding: 20px; margin: 0;
    }

    .vd-nota {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(133,79,11,0.06);
      border: 1px solid rgba(133,79,11,0.2);
      border-radius: 10px; padding: 12px 14px;
    }
    .vd-nota mat-icon {
      font-size:18px; width:18px; height:18px;
      color:#854F0B; flex-shrink:0;
    }
    .vd-nota__label {
      font-size:11px; font-weight:700; text-transform:uppercase;
      letter-spacing:0.06em; color:#854F0B; margin:0 0 3px;
    }
    .vd-nota__texto {
      font-size:13px; color:#854F0B; margin:0; line-height:1.5;
    }

    .vd-desglose {
      background: #F8F9F8; border-radius: 10px; padding: 14px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .vd-desglose__fila {
      display: flex; justify-content: space-between;
      align-items: center; font-size: 13px; color: #6b7280;
    }
    .vd-desglose__fila--total {
      font-size: 16px; font-weight: 900; color: #1C8C40;
      padding-top: 8px;
    }
    .vd-desglose__separador {
      height: 1px; background: rgba(0,0,0,0.08); margin: 2px 0;
    }

    .vd-propina { color: #d97706; font-weight: 600; }

    .vd-footer { padding: 10px 16px; }
  `],
  styleUrls: []
})
export class VentaDetalleDialogComponent {
  readonly formatearNota = formatearNota;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { venta: Venta; folioEmpresa?: number }) {}

  getEtiquetaEstatus(e: number): string {
    const m: Record<number,string> = {
      1:'Sin iniciar', 2:'En proceso', 3:'Listo',
      4:'Entregado', 5:'Pagado', 6:'Finalizado', 7:'Cancelado'
    };
    return m[e] ?? String(e);
  }

  getIconoEstatus(e: number): string {
    const m: Record<number,string> = {
      1:'pending', 2:'restaurant', 3:'check_circle',
      4:'delivery_dining', 5:'payments', 6:'task_alt', 7:'cancel'
    };
    return m[e] ?? 'help';
  }

  getTipoLabel(tipo: string): string {
    const m: Record<string,string> = {
      mesa:'Mesa', local:'Comer aquí', recoger:'Comer aquí',
      llevar:'Para llevar', domicilio:'Domicilio'
    };
    return m[tipo] ?? tipo;
  }

  getTipoIcono(tipo: string): string {
    const m: Record<string,string> = {
      mesa:'table_restaurant', local:'storefront',
      recoger:'storefront', llevar:'shopping_bag',
      domicilio:'delivery_dining'
    };
    return m[tipo] ?? 'help';
  }

  getWhatsAppLink(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  }
}
