import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartService } from '../../../services/cart/cart.service';
import { MenuService } from '../../../services/menu/menu.service';
import { OrderService } from '../../../services/orders/order.service';
import { CheckoutDraft, CreateOrderRequest, PaymentMethod } from '../../../models/checkout.interface';
import { LocationPickerDialogComponent } from '../../../components/location-picker-dialog/location-picker-dialog.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LocationPickerDialogComponent],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  private readonly fb = inject(FormBuilder);

  readonly shippingCost = signal<number | null>(null);
  readonly location = signal<{ lat: number; lng: number } | null>(null);
  readonly locationStatus = signal<'idle' | 'loading' | 'ready' | 'denied' | 'unavailable'>('idle');
  readonly locationLabel = signal<string>('');
  readonly locationPickerOpen = signal<boolean>(false);
  readonly submitStatus = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly submitError = signal<string>('');
  readonly validationError = signal<string>(''); // Mensaje de validación general
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

  // Configuración de envío
  private empresaLocation: { lat: number; lng: number } | null = null;
  private shippingConfig = {
    status_envio: false,
    costo_base: 0,
    costo_por_km: 0,
    radio_max_km: null as number | null,
    envio_gratis_km: null as number | null,
    envio_gratis_monto: null as number | null,
  };

  readonly form = this.fb.nonNullable.group({
    contact: this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phoneCountry: ['+52', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    }),
    address: this.fb.nonNullable.group({
      colonia: [''],
      calle: [''],
      numero: [''],
      entreCalles: [''],
      referencias: [''],
    }),
    tipPreset: this.fb.nonNullable.control<'0' | '15' | '30' | 'other'>('0'),
    tipOther: this.fb.control<number | null>(null),
    paymentMethod: this.fb.control<PaymentMethod | null>(null, { validators: [Validators.required] }),
    cashAmount: this.fb.control<number | null>(null),
  });

  readonly subtotal = computed(() => this.cart.total());

  // Reactive Forms no emite señales; sincronizamos a un signal para que computed() se actualice.
  readonly tipAmount = signal<number>(0);

  // Alias callable para templates/chunks que aún usen tip().
  readonly tip = this.tipAmount;

  readonly total = computed(() => this.subtotal() + (this.shippingCost() ?? 0) + this.tipAmount());

  constructor(
    public cart: CartService,
    private router: Router,
    private menuService: MenuService,
    private orderService: OrderService
  ) {
    // Checkout solo aplica para domicilio
    if (this.cart.items().length === 0) {
      this.router.navigate(['/carrito']);
      return;
    }

    if (this.cart.shippingType() !== 'domicilio') {
      this.router.navigate(['/recoleccion']);
      return;
    }

    this.syncAddressValidators();

    this.loadTransferAccount();

    // Inicializar y mantener propina sincronizada
    this.recomputeTip();
    this.form.controls.tipPreset.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recomputeTip());
    this.form.controls.tipOther.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recomputeTip());

    effect(() => {
      const method = this.form.controls.paymentMethod.value;
      const cash = this.form.controls.cashAmount;
      const total = this.total();

      if (method === 'efectivo') {
        cash.setValidators([
          Validators.required,
          Validators.min(Math.max(0, Math.ceil(total))),
        ]);
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
  }

  switchToRecoger(): void {
    this.cart.setShippingType('recoger');
    this.router.navigate(['/recoleccion']);
  }

  selectTipPreset(value: '0' | '15' | '30' | 'other'): void {
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

  // Compat extra (si algún código llama como método)
  tipAsNumber(): number {
    return this.tipAmount();
  }

  useLocation(): void {
    this.locationPickerOpen.set(true);
  }

  onLocationPicked(coords: { lat: number; lng: number }): void {
    this.location.set(coords);
    this.locationStatus.set('loading');
    this.locationLabel.set('');

    // Best-effort: intentar inferir colonia/calle/número desde coordenadas.
    // Si falla, igual marcamos la ubicación como lista.
    void this.autofillAddressFromCoords(coords)
      .catch(() => undefined)
      .finally(() => {
        this.locationStatus.set('ready');
        // Calcular costo de envío automáticamente
        this.calculateShippingCost();
      });
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

  private loadTransferAccount(): void {
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
          const hasAnyPaymentFlag =
            rawEfectivo != null || rawTransfer != null || rawTarjeta != null;

          const nextAvailability = {
            efectivo: hasAnyPaymentFlag ? Number(rawEfectivo ?? 0) === 1 : true,
            transferencia: hasAnyPaymentFlag ? Number(rawTransfer ?? 0) === 1 : true,
            tarjeta: hasAnyPaymentFlag ? Number(rawTarjeta ?? 0) === 1 : true,
          };
          this.paymentAvailability.set(nextAvailability);

          // Llenar campos visibles en "Datos para transferencia"
          this.transferAccount.titular = normalize((empresa as any)?.titular);
          this.transferAccount.banco = normalize((empresa as any)?.banco);
          this.transferAccount.clabe = normalize((empresa as any)?.clabe);

          // Cargar configuración de envío
          this.loadShippingConfig(empresa);

          // Si el negocio no tiene un método activo, evitamos dejarlo seleccionado.
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
          // Best-effort: dejamos placeholders '—'
        },
      });
  }

  private async autofillAddressFromCoords(coords: { lat: number; lng: number }): Promise<void> {
    // Nominatim (OSM) reverse geocoding - best effort.
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(coords.lat));
    url.searchParams.set('lon', String(coords.lng));
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'es');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return;

    const json: any = await res.json();
    const address = json?.address ?? {};

    const colonia =
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      address.quarter ||
      address.residential ||
      '';

    const calle = address.road || address.pedestrian || address.footway || '';
    const numero = address.house_number || '';

    const setIfEmpty = (control: { value: string; setValue: (v: string) => void }, next: string) => {
      const current = (control.value ?? '').trim();
      if (current.length === 0 && next.trim().length > 0) {
        control.setValue(next.trim());
      }
    };

    const addressGroup = this.form.controls.address.controls;
    setIfEmpty(addressGroup.colonia, colonia);
    setIfEmpty(addressGroup.calle, calle);
    setIfEmpty(addressGroup.numero, numero);

    const labelParts = [
      colonia ? `Colonia: ${colonia}` : '',
      calle ? `Calle: ${calle}` : '',
    ].filter(Boolean);

    this.locationLabel.set(labelParts.join(' · '));
  }

  confirmOrder(): void {
    this.submitError.set('');
    this.validationError.set('');
    this.submitStatus.set('idle');

    this.form.markAllAsTouched();
    
    if (this.form.invalid) {
      // Encontrar qué sección tiene errores y mostrar mensaje específico
      const errors: string[] = [];
      
      const contactGroup = this.form.controls.contact;
      if (contactGroup.invalid) {
        if (contactGroup.controls.name.invalid) errors.push('Nombre');
        if (contactGroup.controls.phone.invalid) errors.push('Teléfono');
      }

      const addressGroup = this.form.controls.address;
      if (addressGroup.invalid && this.cart.shippingType() === 'domicilio') {
        if (addressGroup.controls.colonia.invalid) errors.push('Colonia');
        if (addressGroup.controls.calle.invalid) errors.push('Calle');
        if (addressGroup.controls.numero.invalid) errors.push('Número');
      }

      if (this.form.controls.paymentMethod.invalid) {
        errors.push('Método de pago');
      }

      if (this.form.controls.cashAmount.invalid) {
        errors.push('Cantidad con la que pagarás');
      }

      // Mostrar mensaje con los campos faltantes
      if (errors.length > 0) {
        const fieldsList = errors.length === 1 
          ? errors[0]
          : errors.slice(0, -1).join(', ') + ' y ' + errors[errors.length - 1];
        
        this.validationError.set(`Por favor completa: ${fieldsList}`);
      } else {
        this.validationError.set('Por favor completa todos los campos requeridos');
      }

      // Scroll al primer campo inválido
      this.scrollToFirstInvalidField();
      return;
    }

    const empresaId = this.cart.empresaId();
    if (!empresaId) {
      this.submitStatus.set('error');
      this.submitError.set('No se pudo identificar el negocio. Regresa al menú e inténtalo de nuevo.');
      return;
    }

    const contact = this.form.controls.contact.getRawValue();
    const addressRaw = this.form.controls.address.getRawValue();

    const address = {
      colonia: (addressRaw.colonia ?? '').trim(),
      calle: (addressRaw.calle ?? '').trim(),
      numero: (addressRaw.numero ?? '').trim(),
      entreCalles: (addressRaw.entreCalles ?? '').trim() || undefined,
      referencias: (addressRaw.referencias ?? '').trim() || undefined,
      ...(this.location() ? { lat: this.location()!.lat, lng: this.location()!.lng } : {}),
    };

    const paymentMethod = this.form.controls.paymentMethod.value as PaymentMethod;
    const note = this.buildNoteWithPayment();

    const pago_confirmado = paymentMethod !== 'transferencia';
    const envio_confirmado = false;

    const shippingCost = this.shippingCost() ?? 0;
    const subtotal = this.subtotal();
    const tip = this.tipAmount();
    const total = subtotal + shippingCost + tip;

    const draft: CheckoutDraft = {
      businessId: empresaId,
      shippingType: 'domicilio',
      contact: {
        name: contact.name.trim(),
        phoneCountry: contact.phoneCountry.trim(),
        phone: contact.phone.trim(),
      },
      address,
      tip,
      paymentMethod,
      note,
      items: this.cart.items(),
      subtotal,
      shippingCost,
      total,
    };

    const payload: CreateOrderRequest = {
      business_id: draft.businessId,
      customer_name: draft.contact.name,
      customer_phone: `${draft.contact.phoneCountry}${draft.contact.phone}`,
      shipping_type: draft.shippingType,
      payment_method: draft.paymentMethod,
      pago_confirmado : false,
      envio_confirmado,
      subtotal: draft.subtotal,
      tip: draft.tip,
      shipping_cost: draft.shippingCost,
      total: draft.total,
      delivery_address: draft.address ?? null,
      note: draft.note ?? null,
      items: draft.items.map((it) => ({
        product_id: it.productId,
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        selections: (it.selections as unknown[]) ?? null,
      })),
    };

    this.submitStatus.set('submitting');
    this.submitError.set('');

    const whatsapp = this.cart.businessWhatsapp();
    const message = this.buildWhatsAppMessage(draft);
    this.lastWhatsAppPhone.set((whatsapp ?? '').toString().trim());
    this.lastWhatsAppMessage.set(message);

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        // Fallback/confirmación premium: WhatsApp con resumen (si existe)
        if (whatsapp) this.menuService.openWhatsApp(whatsapp, message);

        this.submitStatus.set('success');
      },
      error: () => {
        this.submitStatus.set('error');
        this.submitError.set('No se pudo confirmar el pedido en este momento. Intenta de nuevo en unos minutos.');
      },
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

  private buildWhatsAppMessage(draft: CheckoutDraft): string {
    const businessName = (this.cart.businessName() || 'Hola').trim();
    const lines: string[] = [];

    // Encabezado
    lines.push(`Hola ${businessName}, quiero confirmar mi pedido.`);
    lines.push('');

    // Tipo y contacto
    lines.push('DATOS DEL CLIENTE');
    lines.push(`Nombre: ${draft.contact.name}`);
    lines.push(`Teléfono: ${draft.contact.phoneCountry}${draft.contact.phone}`);
    lines.push('');

    // Entrega
    lines.push('ENTREGA');
    lines.push('Tipo: Domicilio');
    lines.push(`Dirección: ${draft.address?.calle} ${draft.address?.numero}, ${draft.address?.colonia}`);
    if (draft.address?.entreCalles) lines.push(`Entre calles: ${draft.address.entreCalles}`);
    if (draft.address?.referencias) lines.push(`Referencias: ${draft.address.referencias}`);
    
    // Agregar link de Google Maps si las coordenadas están disponibles
    if (draft.address?.lat && draft.address?.lng) {
      const mapsLink = this.generateGoogleMapsLink(draft.address.lat, draft.address.lng);
      lines.push(`📍 Ver en Google Maps: ${mapsLink}`);
    }
    
    lines.push('');

    // Items
    lines.push('PEDIDO');
    for (const it of draft.items) {
      lines.push(`${it.quantity} × ${it.name} — ${this.formatPrice(it.unitPrice * it.quantity)}`);
      const selections = (it.selections ?? [])
        .map((s) => `  - ${s.groupTitle}: ${s.extra}`)
        .join('\n');
      if (selections) lines.push(selections);
    }

    // Nota
    if (draft.note) {
      lines.push('');
      lines.push(`Nota: ${draft.note}`);
    }

    lines.push('');

    // Pago
    lines.push('PAGO');
    lines.push(`Método: ${draft.paymentMethod}`);
    if (draft.paymentMethod === 'transferencia') {
      lines.push('IMPORTANTE: Si el pago es por transferencia, comparte el comprobante por aquí mismo.');
    }
    if (draft.paymentMethod === 'efectivo') {
      const cash = this.form.controls.cashAmount.value;
      if (cash != null && Number.isFinite(cash) && cash > 0) {
        lines.push(`Pagaré con: ${this.formatPrice(Number(cash))}`);
      }
    }
    if (draft.tip > 0) lines.push(`Propina: ${this.formatPrice(draft.tip)}`);

    lines.push('');

    // Totales
    lines.push('RESUMEN');
    lines.push(`Subtotal: ${this.formatPrice(draft.subtotal)}`);
    lines.push(`Envío: ${this.formatPrice(draft.shippingCost)}`);
    lines.push(`Total: ${this.formatPrice(draft.total)}`);

    return lines.join('\n');
  }

  /**
   * Genera un link de Google Maps para las coordenadas proporcionadas
   */
  private generateGoogleMapsLink(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  private buildNoteWithPayment(): string | undefined {
    const base = (this.cart.note() ?? '').trim();
    const payment = this.form.controls.paymentMethod.value;

    let extra = '';

    if (payment === 'efectivo') {
      const cash = this.form.controls.cashAmount.value;
      if (cash != null && Number.isFinite(cash) && cash > 0) {
        extra = `Pagaré con: ${this.formatPrice(Number(cash))}`;
      }
    }

    const parts = [base, extra].filter((s) => (s ?? '').trim().length > 0);
    return parts.length ? parts.join(' | ') : undefined;
  }

  private syncAddressValidators(): void {
    const addressGroup = this.form.controls.address;
    const required = this.cart.shippingType() === 'domicilio';

    const set = (key: 'colonia' | 'calle' | 'numero', validators: any[]) => {
      const control = addressGroup.controls[key];
      control.setValidators(validators);
      control.updateValueAndValidity({ emitEvent: false });
    };

    if (required) {
      set('colonia', [Validators.required, Validators.minLength(2)]);
      set('calle', [Validators.required, Validators.minLength(2)]);
      set('numero', [Validators.required, Validators.minLength(1)]);
    } else {
      set('colonia', []);
      set('calle', []);
      set('numero', []);
    }
  }

  /**
   * Cargar configuración de envío desde la empresa
   */
  private loadShippingConfig(empresa: any): void {
    // Ubicación de la empresa
    const latitud = empresa?.latitud ? parseFloat(empresa.latitud) : (empresa?.lat ? parseFloat(empresa.lat) : null);
    const longitud = empresa?.longitud ? parseFloat(empresa.longitud) : (empresa?.lng ? parseFloat(empresa.lng) : null);
    
    if (latitud && longitud && Number.isFinite(latitud) && Number.isFinite(longitud)) {
      this.empresaLocation = { lat: latitud, lng: longitud };
    }

    // Configuración de costos
    this.shippingConfig = {
      status_envio: Number(empresa?.status_envio ?? 0) === 1,
      costo_base: Number(empresa?.costo_base ?? 0),
      costo_por_km: Number(empresa?.costo_por_km ?? 0),
      radio_max_km: empresa?.radio_max_km ? Number(empresa.radio_max_km) : null,
      envio_gratis_km: empresa?.envio_gratis_km ? Number(empresa.envio_gratis_km) : null,
      envio_gratis_monto: empresa?.envio_gratis_monto ? Number(empresa.envio_gratis_monto) : null,
    };

    // Si ya hay una ubicación seleccionada, recalcular
    if (this.location()) {
      this.calculateShippingCost();
    }
  }

  /**
   * Calcular distancia entre dos puntos usando fórmula de Haversine (en km)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Hacer scroll al primer campo inválido para que el usuario lo vea
   */
  private scrollToFirstInvalidField(): void {
    if (typeof document === 'undefined') return;

    // Pequeño delay para que Angular actualice el DOM
    setTimeout(() => {
      const firstInvalid = document.querySelector('.field input.ng-invalid, .field select.ng-invalid, .payment-method.ng-invalid');
      
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Focus en el campo si es un input
        if (firstInvalid instanceof HTMLInputElement || firstInvalid instanceof HTMLSelectElement) {
          firstInvalid.focus();
        }
      }
    }, 100);
  }

  /**
   * Calcular costo de envío basado en ubicación del cliente
   */
  private calculateShippingCost(): void {
    // Verificar que el servicio está activo
    if (!this.shippingConfig.status_envio) {
      this.shippingCost.set(0);
      return;
    }

    // Verificar que tenemos ambas ubicaciones
    const clientLocation = this.location();
    if (!clientLocation || !this.empresaLocation) {
      this.shippingCost.set(null);
      return;
    }

    // Calcular distancia
    const distance = this.calculateDistance(
      this.empresaLocation.lat,
      this.empresaLocation.lng,
      clientLocation.lat,
      clientLocation.lng
    );

    // Verificar radio máximo
    if (this.shippingConfig.radio_max_km && distance > this.shippingConfig.radio_max_km) {
      this.shippingCost.set(null);
      return;
    }

    // Verificar envío gratis por distancia
    if (this.shippingConfig.envio_gratis_km && distance <= this.shippingConfig.envio_gratis_km) {
      this.shippingCost.set(0);
      return;
    }

    // Verificar envío gratis por monto (solo si ya tenemos un subtotal)
    const subtotal = this.subtotal();
    if (this.shippingConfig.envio_gratis_monto && subtotal >= this.shippingConfig.envio_gratis_monto) {
      this.shippingCost.set(0);
      return;
    }

    // Calcular costo: costo_base + (distancia × costo_por_km)
    const cost = this.shippingConfig.costo_base + (distance * this.shippingConfig.costo_por_km);
    this.shippingCost.set(Math.max(0, Math.round(cost)));
  }
}
