import { CommonModule } from '@angular/common';
import {
  Component, DestroyRef, OnInit,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom, interval } from 'rxjs';

import { OrderService } from '../../services/orders/order.service';
import { ConfirmStatusDialogComponent } from '../confirm-status-dialog/confirm-status-dialog.component';
import {
  ConfirmarPagoDialogComponent,
  ConfirmarPagoDialogResult,
} from '../gestion-mesas/confirmar-pago-dialog.component';

@Component({
  selector: 'app-caja-entregas',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    ConfirmStatusDialogComponent,
    ConfirmarPagoDialogComponent,
  ],
  templateUrl: './caja-entregas.component.html',
  styleUrl: './caja-entregas.component.scss',
})
export class CajaEntregasComponent implements OnInit {
  private orderService = inject(OrderService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  private destroyRef   = inject(DestroyRef);

  readonly INTERVALO = 30;

  filtro = signal<string>('todos');

  pedidos        = signal<any[]>([]);
  cargando       = signal(false);
  refrescando    = signal(false);
  segundos       = signal(this.INTERVALO);
  ultimaAct      = signal<Date>(new Date());
  procesando     = signal<number | null>(null);

  pedidosFiltrados = computed(() => {
    const f = this.filtro();
    if (f === 'todos') return this.pedidos();
    return this.pedidos().filter(
      p => p.shipping_type === f
    );
  });

  totalRecoger   = computed(() =>
    this.pedidos().filter(
      p => p.shipping_type === 'recoger'
    ).length
  );
  totalDomicilio = computed(() =>
    this.pedidos().filter(
      p => p.shipping_type === 'domicilio'
    ).length
  );
  pendientesPago = computed(() =>
    this.pedidos().filter(
      p => !p.pago_confirmado
    ).length
  );

  ngOnInit(): void {
    this.cargar();
    this.iniciarAutoRefresh();
  }

  cargar(): void {
    this.cargando.set(true);
    const hoy = this.fechaHoy();

    this.orderService.listOrders({ fecha: hoy })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const rows = Array.isArray(resp)
            ? resp
            : (resp?.data ?? resp?.orders ?? []);

          this.pedidos.set(this.filtrarPedidosCaja(rows));
          this.ultimaAct.set(new Date());
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  refrescarSilencioso(): void {
    this.refrescando.set(true);
    const hoy = this.fechaHoy();

    this.orderService.listOrders({ fecha: hoy })
      .subscribe({
        next: (resp) => {
          const rows = Array.isArray(resp)
            ? resp
            : (resp?.data ?? resp?.orders ?? []);

          this.pedidos.set(this.filtrarPedidosCaja(rows));
          this.ultimaAct.set(new Date());
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
        this.segundos.update(s =>
          s <= 1 ? this.INTERVALO : s - 1
        );
      });

    interval(this.INTERVALO * 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refrescarSilencioso());
  }

  async confirmarPago(pedido: any): Promise<void> {
    if (this.procesando() !== null) return;
    if (pedido.pago_confirmado) return;

    const folio = pedido.folio_dia ?? pedido.id;
    const ref = this.dialog.open(ConfirmarPagoDialogComponent, {
      width: '100%',
      maxWidth: '400px',
      maxHeight: '90vh',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      panelClass: 'confirmar-pago-dialog-panel',
      disableClose: false,
      data: {
        total: Number(pedido.total) || 0,
        mesaNumero: `#${folio}`,
        contextoLabel: 'Folio',
        metodoPagoActual: pedido.payment_method,
        esAdicional: false,
      },
    });

    const result = await firstValueFrom(
      ref.afterClosed()
    ) as ConfirmarPagoDialogResult | undefined;
    if (!result) return;

    this.procesando.set(pedido.id);

    const payload: any = {
      payment_method: result.metodoPago,
      pago_confirmado: true,
    };

    if (result.metodoPago === 'combinado' && result.pagoCombinado) {
      const p = result.pagoCombinado;
      const partes: string[] = [];
      if (p.efectivo > 0) partes.push(`Efectivo: $${p.efectivo.toFixed(2)}`);
      if (p.tarjeta > 0) partes.push(`Tarjeta: $${p.tarjeta.toFixed(2)}`);
      if (p.transferencia > 0) {
        partes.push(`Transferencia: $${p.transferencia.toFixed(2)}`);
      }
      if (partes.length > 0) {
        payload.note = `Pago combinado: ${partes.join(', ')}`;
      }
    }

    if (pedido.envio_confirmado) {
      payload.estatus = 6;
    }

    this.orderService
      .actualizarOrden(pedido.id, payload)
      .subscribe({
        next: () => {
          this.procesando.set(null);
          this.pedidos.update(list =>
            list.map(p =>
              p.id === pedido.id
                ? {
                    ...p,
                    ...payload,
                    payment_method: result.metodoPago,
                  }
                : p
            ).filter(p => this.esOrdenVisibleEnCaja(p))
          );
          this.snackBar.open(
            `Folio #${folio} — pago confirmado`,
            '', {
              duration:           2500,
              panelClass:         ['snack-ok'],
              horizontalPosition: 'center',
              verticalPosition:   'top',
            }
          );
        },
        error: () => this.procesando.set(null),
      });
  }

  async confirmarEnvio(pedido: any): Promise<void> {
    if (this.procesando() !== null) return;

    const folio = pedido.folio_dia ?? pedido.id;
    const ref = this.dialog.open(
      ConfirmStatusDialogComponent, {
        data: {
          kind:        'envio',
          icon:        'delivery_dining',
          title:       'Confirmar envío',
          message:     `¿El folio #${folio} ya fue enviado a domicilio?`,
          meta:        pedido.delivery_address
                         ? this.formatDir(
                             pedido.delivery_address
                           )
                         : `$${pedido.total}`,
          confirmText: 'Sí, ya fue enviado',
        },
        panelClass: 'confirm-status-dialog-panel',
      }
    );

    const ok = Boolean(
      await firstValueFrom(ref.afterClosed())
    );
    if (!ok) return;

    this.procesando.set(pedido.id);

    const payload: any = { envio_confirmado: true };
    if (pedido.pago_confirmado) {
      payload.estatus = 6;
    }

    this.orderService
      .updateOrderChecks(pedido.id, payload)
      .subscribe({
        next: () => {
          this.procesando.set(null);
          this.pedidos.update(list =>
            list.map(p =>
              p.id === pedido.id
                ? { ...p, ...payload }
                : p
            ).filter(p => this.esOrdenVisibleEnCaja(p))
          );
          this.snackBar.open(
            `Folio #${folio} — envío confirmado`,
            '', {
              duration:           2500,
              panelClass:         ['snack-ok'],
              horizontalPosition: 'center',
              verticalPosition:   'top',
            }
          );
        },
        error: () => this.procesando.set(null),
      });
  }

  async confirmarRecogido(pedido: any): Promise<void> {
    if (this.procesando() !== null) return;

    const folio = pedido.folio_dia ?? pedido.id;

    const ref = this.dialog.open(
      ConfirmStatusDialogComponent, {
        data: {
          kind:        'envio',
          icon:        'shopping_bag',
          title:       'Confirmar recogida',
          message:     `¿El cliente ya recogió el folio #${folio}?`,
          meta:        `${pedido.customer_name} · $${pedido.total}`,
          confirmText: 'Sí, ya lo recogió',
        },
        panelClass: 'confirm-status-dialog-panel',
      }
    );

    const ok = Boolean(
      await firstValueFrom(ref.afterClosed())
    );
    if (!ok) return;

    this.procesando.set(pedido.id);

    const payload: any = { envio_confirmado: true };
    if (pedido.pago_confirmado) {
      payload.estatus = 6;
    }

    this.orderService
      .updateOrderChecks(pedido.id, payload)
      .subscribe({
        next: () => {
          this.procesando.set(null);

          this.pedidos.update(list =>
            list.map(p =>
              p.id === pedido.id ? { ...p, ...payload } : p
            ).filter(p => this.esOrdenVisibleEnCaja(p))
          );

          this.snackBar.open(
            pedido.pago_confirmado
              ? `Folio #${folio} — recogido y finalizado`
              : `Folio #${folio} — recogido (pago pendiente)`,
            '', {
              duration:           2500,
              panelClass:         ['snack-ok'],
              horizontalPosition: 'center',
              verticalPosition:   'top',
            }
          );
        },
        error: () => this.procesando.set(null),
      });
  }

  async cancelarPedido(pedido: any): Promise<void> {
    if (this.procesando() !== null) return;

    const folio = pedido.folio_dia ?? pedido.id;

    const ref = this.dialog.open(
      ConfirmStatusDialogComponent, {
        data: {
          kind:        'cancelar',
          icon:        'cancel',
          title:       'Cancelar pedido',
          message:     `¿Estás seguro de cancelar el folio #${folio}? Esta acción no se puede deshacer.`,
          meta:        `${pedido.customer_name} · $${pedido.total}`,
          confirmText: 'Sí, cancelar',
          cancelText:  'No, mantener',
        },
        panelClass: 'confirm-status-dialog-panel',
      }
    );

    const ok = Boolean(
      await firstValueFrom(ref.afterClosed())
    );
    if (!ok) return;

    this.procesando.set(pedido.id);

    this.orderService
      .updateOrderChecks(pedido.id, { estatus: 7 })
      .subscribe({
        next: () => {
          this.procesando.set(null);
          this.pedidos.update(list =>
            list.filter(p => p.id !== pedido.id)
          );
          this.snackBar.open(
            `Folio #${folio} cancelado`,
            '', {
              duration:           2500,
              panelClass:         ['snack-error'],
              horizontalPosition: 'center',
              verticalPosition:   'top',
            }
          );
        },
        error: () => this.procesando.set(null),
      });
  }

  async marcarMerma(pedido: any): Promise<void> {
    if (this.procesando() !== null) return;

    const folio = pedido.folio_dia ?? pedido.id;

    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      data: {
        kind:        'cancelar',
        icon:        'delete_sweep',
        title:       'Marcar como merma',
        message:     `¿El folio #${folio} no fue recogido o el domicilio no se pudo entregar?`,
        meta:        `${pedido.customer_name} · $${pedido.total}`,
        confirmText: 'Sí, marcar merma',
        cancelText:  'No, mantener',
      },
      panelClass: 'confirm-status-dialog-panel',
    });

    const ok = Boolean(
      await firstValueFrom(ref.afterClosed())
    );
    if (!ok) return;

    this.procesando.set(pedido.id);

    this.orderService
      .updateOrderChecks(pedido.id, { estatus: 8 })
      .subscribe({
        next: () => {
          this.procesando.set(null);

          this.pedidos.update(list =>
            list.filter(p => p.id !== pedido.id)
          );

          this.snackBar.open(
            `Folio #${folio} — registrado como merma`,
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
          this.procesando.set(null);
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

  formatDir(addr: any): string {
    if (!addr) return '';
    if (typeof addr === 'string') {
      try { addr = JSON.parse(addr); } catch {
        return addr;
      }
    }
    const c = (addr.calle   ?? '').trim();
    const n = (addr.numero  ?? '').trim();
    const col = (addr.colonia ?? '').trim();
    return [`${c} ${n}`.trim(), col]
      .filter(Boolean).join(', ');
  }

  getMetodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      efectivo:      'Efectivo',
      tarjeta:       'Tarjeta',
      transferencia: 'Transferencia',
    };
    return map[m] ?? m;
  }

  getMetodoPagoIcon(m: string): string {
    if (m === 'tarjeta')       return 'credit_card';
    if (m === 'transferencia') return 'account_balance';
    return 'payments';
  }

  tiempoTranscurrido(created_at: string): string {
    const diff = Math.floor(
      (Date.now() - new Date(created_at).getTime())
      / 60000
    );
    if (diff < 1) return '< 1min';
    return `${diff}min`;
  }

  private filtrarPedidosCaja(rows: any[]): any[] {
    return rows.filter(o => this.esOrdenVisibleEnCaja(o));
  }

  /** Visible mientras no esté pagada (aunque ya esté recogida/enviada). */
  private esOrdenVisibleEnCaja(o: any): boolean {
    if (o.shipping_type !== 'recoger'
        && o.shipping_type !== 'domicilio') {
      return false;
    }
    if (o.estatus === 7) return false;
    return o.pago_confirmado !== true;
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
