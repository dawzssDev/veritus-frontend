import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { CartService } from '../../../services/cart/cart.service';
import { MenuService } from '../../../services/menu/menu.service';
import { OrderService } from '../../../services/orders/order.service';
import { CreateOrderRequest, PaymentMethod } from '../../../models/checkout.interface';

type PickupPaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

type TipPreset = '0' | '15' | '30' | 'other';

@Component({
  selector: 'app-pickup-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './pickup-checkout-page.component.html',
  styleUrl: './pickup-checkout-page.component.scss',
})
export class PickupCheckoutPageComponent {
  private readonly fb = inject(FormBuilder);

  readonly tipAmount = signal<number>(0);
  readonly submitStatus = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly submitError = signal<string>('');
  readonly lastWhatsAppPhone = signal<string>('');
  readonly lastWhatsAppMessage = signal<string>('');
  readonly copyStatus = signal<'titular' | 'banco' | 'clabe' | null>(null);

  readonly paymentAvailability = signal<{ efectivo: boolean; transferencia: boolean; tarjeta: boolean }>({
    efectivo: true,
    transferencia: true,
    tarjeta: true,
  });

  readonly transferAccount: { titular: string; banco: string; clabe: string } = {
    titular: '—',
    banco: '—',
    clabe: '—',
  };

  readonly form = this.fb.nonNullable.group({
    contact: this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phoneCountry: ['+52', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    }),
    tipPreset: this.fb.nonNullable.control<TipPreset>('0'),
    tipOther: this.fb.control<number | null>(null),
    paymentMethod: this.fb.control<PickupPaymentMethod | null>(null, { validators: [Validators.required] }),
    cashAmount: this.fb.control<number | null>(null),
  });

  readonly subtotal = computed(() => this.cart.total());
  readonly total = computed(() => this.subtotal() + this.tipAmount());

  constructor(
    public cart: CartService,
    private router: Router,
    private menuService: MenuService,
    private orderService: OrderService
  ) {
    if (this.cart.items().length === 0) {
      this.router.navigate(['/carrito']);
      return;
    }

    // Esta vista es para "recoger".
    if (this.cart.shippingType() !== 'recoger') {
      this.cart.setShippingType('recoger');
    }

    this.recomputeTip();
    this.form.controls.tipPreset.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recomputeTip());
    this.form.controls.tipOther.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recomputeTip());

    this.loadEmpresaPaymentInfo();

    effect(() => {
      const method = this.form.controls.paymentMethod.value;
      const cash = this.form.controls.cashAmount;
      const total = this.total();
      const shipping = this.cart.shippingType();

      if (method === 'efectivo' && shipping !== 'recoger') {
        cash.setValidators([Validators.required, Validators.min(Math.max(0, Math.ceil(total)))]);
      } else {
        cash.setValidators([]);
        cash.setValue(null, { emitEvent: false });
      }

      cash.updateValueAndValidity({ emitEvent: false });
    });
  }

  formatPrice(value: number): string {
    return this.menuService.formatPrice(value);
  }

  goBack(): void {
    this.router.navigate(['/carrito']);
  }

  switchToDomicilio(): void {
    this.cart.setShippingType('domicilio');
    this.router.navigate(['/checkout']);
  }

  switchToRecoger(): void {
    this.cart.setShippingType('recoger');
  }

  selectTipPreset(value: TipPreset): void {
    this.form.controls.tipPreset.setValue(value);
    if (value !== 'other') {
      this.form.controls.tipOther.setValue(null);
    }
    this.recomputeTip();
  }

  private recomputeTip(): void {
    const preset = this.form.controls.tipPreset.value;
    if (preset === 'other') {
      const raw = this.form.controls.tipOther.value;
      const value = Number(raw ?? 0);
      this.tipAmount.set(Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
      return;
    }

    this.tipAmount.set(Number(preset));
  }

  copyTransferField(field: 'titular' | 'banco' | 'clabe'): void {
    const value = this.transferAccount[field];
    if (!value || value === '—') return;

    const doSet = () => {
      this.copyStatus.set(field);
      setTimeout(() => {
        if (this.copyStatus() === field) this.copyStatus.set(null);
      }, 1200);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(value)
        .then(doSet)
        .catch(() => undefined);
      return;
    }

    try {
      const el = document.createElement('textarea');
      el.value = value;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      doSet();
    } catch {
      // ignore
    }
  }

  private loadEmpresaPaymentInfo(): void {
    const fromCart = this.cart.empresaId();

    let stored: number | null = null;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const raw = Number(localStorage.getItem('last_menu_empresa_id'));
      stored = Number.isFinite(raw) && raw > 0 ? raw : null;
    }

    const empresaId = (fromCart ?? stored) as number | null;
    if (!empresaId) return;

    this.menuService
      .getEmpresaById(empresaId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (empresa) => {
          const normalize = (v: unknown) => {
            const s = (v ?? '').toString().trim();
            return s.length ? s : '—';
          };

          const rawEfectivo = (empresa as any)?.pago_efectivo;
          const rawTransfer = (empresa as any)?.pago_transferencia;
          const rawTarjeta = (empresa as any)?.pago_tarjeta;
          const hasAnyPaymentFlag = rawEfectivo != null || rawTransfer != null || rawTarjeta != null;

          const nextAvailability = {
            efectivo: hasAnyPaymentFlag ? Number(rawEfectivo ?? 0) === 1 : true,
            transferencia: hasAnyPaymentFlag ? Number(rawTransfer ?? 0) === 1 : true,
            tarjeta: hasAnyPaymentFlag ? Number(rawTarjeta ?? 0) === 1 : true,
          };
          this.paymentAvailability.set(nextAvailability);

          this.transferAccount.titular = normalize((empresa as any)?.titular);
          this.transferAccount.banco = normalize((empresa as any)?.banco);
          this.transferAccount.clabe = normalize((empresa as any)?.clabe);

          const selected = this.form.controls.paymentMethod.value;
          if (
            (selected === 'efectivo' && !nextAvailability.efectivo) ||
            (selected === 'transferencia' && !nextAvailability.transferencia) ||
            (selected === 'tarjeta' && !nextAvailability.tarjeta)
          ) {
            this.form.controls.paymentMethod.setValue(null);
          }
        },
        error: () => {
          // Best-effort
        },
      });
  }

  sendWhatsApp(): void {
    this.submitError.set('');
    this.submitStatus.set('idle');

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const whatsapp = this.cart.businessWhatsapp();
    if (!whatsapp) {
      this.submitError.set('No se encontró el WhatsApp del negocio.');
      this.submitStatus.set('error');
      return;
    }

    const contact = this.form.controls.contact.getRawValue();
    const payment = this.form.controls.paymentMethod.value as PickupPaymentMethod;
    const tip = this.tipAmount();

    const empresaId = this.cart.empresaId();
    if (!empresaId) {
      this.submitError.set('No se pudo identificar el negocio. Regresa al menú e inténtalo de nuevo.');
      return;
    }

    const payment_method = payment as unknown as PaymentMethod;
    const pago_confirmado = payment_method !== 'transferencia';
    const envio_confirmado = false;

    const subtotal = this.subtotal();
    const total = this.total();

    const cashReceivedRaw = this.form.controls.cashAmount.value;
    const cashReceived =
      payment_method === 'efectivo' && cashReceivedRaw != null && Number.isFinite(cashReceivedRaw) && cashReceivedRaw > 0
        ? Number(cashReceivedRaw)
        : null;

    const baseNote = (this.cart.note() ?? '').trim();
    const extraCash = cashReceived != null ? `Pagaré con: ${this.formatPrice(cashReceived)}` : '';
    const note = [baseNote, extraCash].filter((s) => (s ?? '').trim().length > 0).join(' | ') || undefined;

    const payload: CreateOrderRequest = {
      business_id: empresaId,
      customer_name: contact.name.trim(),
      customer_phone: `${contact.phoneCountry.trim()}${contact.phone.trim()}`,
      shipping_type: 'recoger',
      payment_method,
      pago_confirmado: false,
      envio_confirmado,
      subtotal,
      tip,
      shipping_cost: 0,
      total,
      delivery_address: null,
      note: note ?? null,
      items: this.cart.items().map((it) => ({
        product_id: it.productId,
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        selections: (it.selections as unknown[]) ?? null,
      })),
    };

    const lines: string[] = [];
    const businessName = (this.cart.businessName() || 'Hola').trim();

    // Encabezado
    lines.push(`Hola ${businessName}, quiero hacer un pedido para recoger.`);
    lines.push('');

    // Datos del cliente
    lines.push('DATOS DEL CLIENTE');
    lines.push(`Nombre: ${contact.name.trim()}`);
    lines.push(`Teléfono: ${contact.phoneCountry.trim()}${contact.phone.trim()}`);
    lines.push('');

    // Entrega
    lines.push('ENTREGA');
    lines.push('Tipo: Recoger en tienda');
    lines.push('');

    // Items
    lines.push('PEDIDO');
    for (const it of this.cart.items()) {
      lines.push(`${it.quantity} × ${it.name} — ${this.formatPrice(it.unitPrice * it.quantity)}`);
      const selections = (it.selections ?? [])
        .map((s) => `  - ${s.groupTitle}: ${s.extra}`)
        .join('\n');
      if (selections) lines.push(selections);
    }

    // Nota
    if (baseNote) {
      lines.push('');
      lines.push(`Nota: ${baseNote}`);
    }

    lines.push('');

    // Pago
    lines.push('PAGO');
    lines.push(`Método: ${payment}`);
    if (payment === 'transferencia') {
      lines.push('IMPORTANTE: Si el pago es por transferencia, comparte el comprobante por aquí mismo.');
    }
    if (payment === 'efectivo') {
      const cash = this.form.controls.cashAmount.value;
      if (cash != null && Number.isFinite(cash) && cash > 0) {
        lines.push(`Pagaré con: ${this.formatPrice(Number(cash))}`);
      }
    }
    if (tip > 0) lines.push(`Propina: ${this.formatPrice(tip)}`);

    lines.push('');

    // Totales
    lines.push('RESUMEN');
    lines.push(`Total: ${this.formatPrice(this.total())}`);

    const message = lines.join('\n');
    this.lastWhatsAppPhone.set((whatsapp ?? '').toString().trim());
    this.lastWhatsAppMessage.set(message);
    this.submitStatus.set('submitting');

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.menuService.openWhatsApp(whatsapp, message);
        this.submitStatus.set('success');
      },
      error: () => {
        this.submitError.set('No se pudo registrar el pedido en este momento. Intenta de nuevo en unos minutos.');
        this.submitStatus.set('error');
      }
    });
  }

  resendWhatsApp(): void {
    const phone = (this.lastWhatsAppPhone() ?? '').toString().trim();
    const message = (this.lastWhatsAppMessage() ?? '').toString();

    if (!phone) {
      this.submitError.set('No se encontró el número del negocio para WhatsApp.');
      this.submitStatus.set('error');
      return;
    }

    this.submitError.set('');
    this.menuService.openWhatsApp(phone, message);
  }
}
