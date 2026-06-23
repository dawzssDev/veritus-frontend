import { CommonModule } from '@angular/common';
import {
  Component, DestroyRef, OnInit,
  inject, signal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, interval } from 'rxjs';

import { OrderService } from '../../services/orders/order.service';
import { getOrderFolio } from '../../utils/order-folio.util';
import { ConfirmStatusDialogComponent } from '../confirm-status-dialog/confirm-status-dialog.component';

interface EmplatadoItem {
  id: number;
  product_id?: number | null;
  name: string;
  quantity: number;
  unit_price: number | string;
  selections?: any[] | null;
  created_at?: string;
  entregado?: boolean;
  listo_emplatado?: boolean;
}

interface EmplatadoOrder {
  id: number;
  folio?: string | number | null;
  folio_diario?: string | number | null;
  folio_dia?: number | null;
  shipping_type: 'domicilio' | 'recoger' | 'local';
  payment_method: string;
  pago_confirmado: boolean;
  envio_confirmado: boolean;
  estatus?: number;
  customer_name: string;
  customer_phone?: string;
  delivery_address?: any;
  note?: string | null;
  items?: EmplatadoItem[];
  created_at?: string;
  tiempo_entrega_estimado?: string | null;
  total: number | string;
}

interface ItemVista {
  item_id: number;
  item: EmplatadoItem;
  folio: string;
  pedido_id: number;
  shipping_type: string;
  customer_name: string;
  created_at: string;
  pedido: EmplatadoOrder;
}

@Component({
  selector: 'app-emplatado',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './emplatado.component.html',
  styleUrl: './emplatado.component.scss',
})
export class EmplatadoComponent implements OnInit {
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  readonly EN_PROCESO = 2;
  readonly LISTO = 3;
  readonly INTERVALO = 30;

  pedidosEnProceso = signal<EmplatadoOrder[]>([]);

  cargando = signal(false);
  refrescando = signal(false);
  segundos = signal(this.INTERVALO);
  ultimaActualizacion = signal<Date>(new Date());
  relojTick = signal(0);

  procesandoItemId = signal<number | null>(null);

  get itemsVista(): ItemVista[] {
    const resultado: ItemVista[] = [];

    this.pedidosEnProceso().forEach(pedido => {
      (pedido.items ?? [])
        .filter(i => i.listo_emplatado === true && !i.entregado)
        .forEach(item => {
          resultado.push({
            item_id: item.id,
            item,
            folio: this.folioPedido(pedido),
            pedido_id: pedido.id,
            shipping_type: pedido.shipping_type,
            customer_name: pedido.customer_name,
            created_at: item.created_at ?? pedido.created_at ?? '',
            pedido,
          });
        });
    });

    return resultado.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  ngOnInit(): void {
    this.cargar();
    this.iniciarAutoRefresh();
  }

  cargar(): void {
    this.cargando.set(true);
    this.orderService
      .listOrders({ fecha: this.fechaHoy() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const rows: EmplatadoOrder[] = Array.isArray(resp)
            ? resp
            : (resp?.data ?? resp?.orders ?? []);

          this.pedidosEnProceso.set(
            rows.filter(o =>
              (o.estatus === this.EN_PROCESO ||
               o.estatus === this.LISTO) &&
              (o.items ?? []).some(
                i => i.listo_emplatado && !i.entregado
              )
            )
          );

          this.ultimaActualizacion.set(new Date());
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  refrescarSilencioso(): void {
    this.refrescando.set(true);
    this.orderService
      .listOrders({ fecha: this.fechaHoy() })
      .subscribe({
        next: (resp) => {
          const rows: EmplatadoOrder[] = Array.isArray(resp)
            ? resp
            : (resp?.data ?? resp?.orders ?? []);

          this.pedidosEnProceso.set(
            rows.filter(o =>
              (o.estatus === this.EN_PROCESO ||
               o.estatus === this.LISTO) &&
              (o.items ?? []).some(
                i => i.listo_emplatado && !i.entregado
              )
            )
          );

          this.ultimaActualizacion.set(new Date());
          this.refrescando.set(false);
          this.segundos.set(this.INTERVALO);
        },
        error: () => this.refrescando.set(false),
      });
  }

  iniciarAutoRefresh(): void {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.relojTick.update(v => v + 1);
        this.segundos.update(s => (s <= 1 ? this.INTERVALO : s - 1));
      });

    interval(this.INTERVALO * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refrescarSilencioso());
  }

  marcarEntregado(vista: ItemVista, event: Event): void {
    event.stopPropagation();
    if (this.procesandoItemId() !== null) return;

    this.procesandoItemId.set(vista.item_id);

    this.orderService
      .marcarItemEntregado(vista.item_id, true)
      .subscribe({
        next: () => {
          this.procesandoItemId.set(null);

          this.pedidosEnProceso.update(list =>
            list.map(p => {
              if (p.id !== vista.pedido_id) return p;
              return {
                ...p,
                items: (p.items ?? []).map(i =>
                  i.id === vista.item_id
                    ? { ...i, entregado: true }
                    : i
                ),
              };
            })
          );

          const pedido = this.pedidosEnProceso()
            .find(p => p.id === vista.pedido_id);

          const todosEntregados = pedido
            ? (pedido.items ?? []).every(i => i.entregado)
            : false;

          const quitarDeColaEmplatado = () => {
            this.pedidosEnProceso.update(list =>
              list.filter(p =>
                (p.items ?? []).some(
                  i => i.listo_emplatado && !i.entregado
                )
              )
            );
          };

          if (todosEntregados && pedido) {
            if (pedido.shipping_type === 'local') {
              this.orderService
                .updateOrderChecks(vista.pedido_id, {
                  estatus: 4,
                  envio_confirmado: true,
                })
                .subscribe({
                  next: () => {
                    quitarDeColaEmplatado();
                    this.snackBar.open(
                      `${vista.folio} — servido en mesa`,
                      '',
                      {
                        duration: 3000,
                        panelClass: ['snack-ok'],
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                      }
                    );
                  },
                  error: () => quitarDeColaEmplatado(),
                });
              return;
            }

            this.orderService
              .updateOrderChecks(vista.pedido_id, {
                estatus: 6,
                envio_confirmado: true,
              })
              .subscribe({
                next: () => {
                  quitarDeColaEmplatado();

                  this.snackBar.open(
                    `Folio ${vista.folio} — orden finalizada`,
                    '',
                    {
                      duration: 3000,
                      panelClass: ['snack-ok'],
                      horizontalPosition: 'center',
                      verticalPosition: 'top',
                    }
                  );
                },
                error: () => {
                  quitarDeColaEmplatado();
                },
              });
          } else {
            quitarDeColaEmplatado();

            this.snackBar.open(
              `${vista.item.quantity}× ${vista.item.name} — entregado`,
              '',
              {
                duration: 2000,
                panelClass: ['snack-ok'],
                horizontalPosition: 'center',
                verticalPosition: 'top',
              }
            );
          }
        },
        error: () => {
          this.procesandoItemId.set(null);
          this.snackBar.open('Error al marcar como entregado', '', {
            duration: 2500,
            panelClass: ['snack-error'],
          });
        },
      });
  }

  async marcarMerma(
    vista: ItemVista,
    event: Event
  ): Promise<void> {
    event.stopPropagation();
    if (this.procesandoItemId() !== null) return;

    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        kind:        'cancelar',
        icon:        'delete_sweep',
        title:       'Marcar como merma',
        message:     `¿El folio ${vista.folio} no fue recogido o se perdió? Se registrará como merma.`,
        meta:        `${vista.item.quantity}× ${vista.item.name}`,
        confirmText: 'Sí, es merma',
        cancelText:  'No, mantener',
      },
      panelClass: 'confirm-status-dialog-panel',
    });

    const confirmed = Boolean(
      await firstValueFrom(ref.afterClosed())
    );
    if (!confirmed) return;

    this.procesandoItemId.set(vista.item_id);

    this.orderService
      .updateOrderChecks(vista.pedido_id, { estatus: 8 })
      .subscribe({
        next: () => {
          this.procesandoItemId.set(null);

          this.pedidosEnProceso.update(list =>
            list.filter(p => p.id !== vista.pedido_id)
          );

          this.snackBar.open(
            `Folio ${vista.folio} — marcado como merma`,
            '',
            {
              duration:           3000,
              panelClass:         ['snack-error'],
              horizontalPosition: 'center',
              verticalPosition:   'top',
            }
          );
        },
        error: () => {
          this.procesandoItemId.set(null);
          this.snackBar.open(
            'Error al marcar como merma',
            '',
            {
              duration:   2500,
              panelClass: ['snack-error'],
            }
          );
        },
      });
  }

  folioPedido(pedido: EmplatadoOrder): string {
    return getOrderFolio(pedido, { withHash: true });
  }

  formatSelections(item: EmplatadoItem): string {
    if (!item.selections || !Array.isArray(item.selections)) return '';
    return item.selections
      .map((s: any) => s.extra ?? s.adicionales ?? '')
      .filter(Boolean)
      .join(', ');
  }

  getShippingIcon(tipo: string): string {
    if (tipo === 'domicilio') return 'delivery_dining';
    if (tipo === 'local') return 'table_restaurant';
    return 'shopping_bag';
  }

  getShippingLabel(tipo: string): string {
    if (tipo === 'domicilio') return 'Domicilio';
    if (tipo === 'local') return 'Mesa';
    return 'Para llevar';
  }

  getMinutosPedido(pedido: EmplatadoOrder): number {
    const date = this.parseDate(pedido.created_at);
    if (!date) return 0;
    return Math.floor((Date.now() - date.getTime()) / 60000);
  }

  getMinutosListo(created_at?: string): number {
    const date = this.parseDate(created_at);
    if (!date) return 0;
    return Math.floor((Date.now() - date.getTime()) / 60000);
  }

  tiempoTranscurrido(created_at?: string): string {
    const min = this.getMinutosListo(created_at);
    if (min < 1) return '< 1min';
    return `${min}min`;
  }

  getMinutosRestantes(pedido: EmplatadoOrder): number {
    const d = this.parseTiempoEntrega(pedido.tiempo_entrega_estimado);
    if (!d) return -1;
    return Math.round((d.getTime() - Date.now()) / 60000);
  }

  getClaseReloj(pedido: EmplatadoOrder, _tick?: number): string {
    const min = this.getMinutosRestantes(pedido);
    if (min < 0) return 'reloj--vencido';
    if (min <= 5) return 'reloj--critico';
    if (min <= 15) return 'reloj--alerta';
    return 'reloj--ok';
  }

  getTextoReloj(pedido: EmplatadoOrder, _tick?: number): string {
    const min = this.getMinutosRestantes(pedido);
    if (min < 0) {
      const atrasado = Math.abs(min);
      return atrasado < 60
        ? `${atrasado}min tarde`
        : `${Math.floor(atrasado / 60)}h tarde`;
    }
    if (min === 0) return 'Ahora';
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  getIconoReloj(pedido: EmplatadoOrder, _tick?: number): string {
    const min = this.getMinutosRestantes(pedido);
    if (min < 0) return 'alarm_off';
    if (min <= 5) return 'alarm';
    return 'schedule';
  }

  tieneTiempoEntrega(pedido: EmplatadoOrder): boolean {
    return (pedido.shipping_type === 'recoger' ||
            pedido.shipping_type === 'domicilio') &&
           !!pedido.tiempo_entrega_estimado?.trim();
  }

  esUrgente(vista: ItemVista): boolean {
    if (this.getMinutosPedido(vista.pedido) >= 30) return true;
    if (this.getMinutosListo(vista.created_at) >= 10) return true;
    if (this.tieneTiempoEntrega(vista.pedido) &&
        this.getMinutosRestantes(vista.pedido) <= 5) {
      return true;
    }
    return false;
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private parseTiempoEntrega(value?: string | null): Date | null {
    if (!value?.trim()) return null;
    const trimmed = value.trim();
    const normalized = trimmed.includes('T')
      ? trimmed
      : trimmed.replace(' ', 'T');
    return this.parseDate(normalized);
  }

  private fechaHoy(): string {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
