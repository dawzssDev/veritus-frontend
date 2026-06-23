import { Injectable, computed, signal } from '@angular/core';
import { CartItem, CartItemSelection } from '../../models/cart.interface';
import { ShippingType } from '../../models/checkout.interface';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  private readonly _note = signal<string>('');
  private readonly _shippingType = signal<ShippingType>('domicilio');
  private readonly _empresaId = signal<number | null>(null);
  private readonly _sucursalId = signal<number | null>(null);
  private readonly _businessName = signal<string>('');
  private readonly _businessWhatsapp = signal<string>('');

  readonly items = computed(() => this._items());
  readonly note = computed(() => this._note());
  readonly shippingType = computed(() => this._shippingType());
  readonly empresaId = computed(() => this._empresaId());
  readonly sucursalId = computed(() => this._sucursalId());
  readonly businessName = computed(() => this._businessName());
  readonly businessWhatsapp = computed(() => this._businessWhatsapp());
  readonly count = computed(() => this._items().reduce((acc, it) => acc + it.quantity, 0));
  readonly total = computed(() => this._items().reduce((acc, it) => acc + it.unitPrice * it.quantity, 0));

  setShippingType(type: ShippingType): void {
    this._shippingType.set(type);
  }

  setSucursal(sucursalId: number | null): void {
    this._sucursalId.set(sucursalId);
  }

  setBusinessContext(input: {
    empresaId: number;
    businessName?: string | null;
    businessWhatsapp?: string | null;
    businessPhone?: string | null;
  }): void {
    const prevId = this._empresaId();
    const nextId = Number(input.empresaId);

    if (Number.isFinite(nextId) && prevId != null && prevId !== nextId && this._items().length > 0) {
      // Evitar mezclar items de distintos negocios.
      this.clear();
    }

    this._empresaId.set(Number.isFinite(nextId) ? nextId : null);
    this._businessName.set((input.businessName ?? '').toString().trim());

    // El envío por WhatsApp debe poder funcionar aunque el backend no tenga un campo
    // específico de whatsapp; usamos telefono como fallback.
    const whatsapp = (input.businessWhatsapp ?? '').toString().trim();
    const phone = (input.businessPhone ?? '').toString().trim();
    this._businessWhatsapp.set((whatsapp || phone).trim());
  }

  setNote(note: string): void {
    const normalized = (note ?? '').toString().trim();
    this._note.set(normalized.length > 300 ? normalized.slice(0, 300) : normalized);
  }

  addItem(input: {
    productId: number;
    name: string;
    unitPrice: number;
    imageUrl?: string;
    quantity?: number;
    selections?: CartItemSelection[];
  }): void {
    const qty = Math.max(1, Math.floor(input.quantity ?? 1));
    const selections = input.selections ?? [];
    const key = this.buildKey(input.productId, selections);

    const current = this._items();
    const idx = current.findIndex((it) => it.key === key);

    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
      this._items.set(updated);
      return;
    }

    this._items.set([
      ...current,
      {
        key,
        productId: input.productId,
        name: input.name,
        imageUrl: input.imageUrl,
        unitPrice: Number(input.unitPrice),
        quantity: qty,
        selections: selections.length ? selections : undefined,
      },
    ]);
  }

  removeByKey(key: string): void {
    this._items.set(this._items().filter((it) => it.key !== key));
  }

  setQuantity(key: string, quantity: number): void {
    const qty = Math.max(1, Math.floor(quantity));
    this._items.set(
      this._items().map((it) => (it.key === key ? { ...it, quantity: qty } : it))
    );
  }

  increment(key: string): void {
    this._items.set(
      this._items().map((it) => (it.key === key ? { ...it, quantity: it.quantity + 1 } : it))
    );
  }

  decrement(key: string): void {
    this._items.set(
      this._items().map((it) => {
        if (it.key !== key) return it;
        return { ...it, quantity: Math.max(1, it.quantity - 1) };
      })
    );
  }

  clear(): void {
    this._items.set([]);
    this._note.set('');
  }

  private buildKey(productId: number, selections: CartItemSelection[]): string {
    const normalized = [...selections]
      .sort((a, b) => a.groupTitle.localeCompare(b.groupTitle))
      .map((s) => `${s.groupTitle}:${s.extra}`)
      .join('|');

    return normalized ? `${productId}::${normalized}` : String(productId);
  }
}
