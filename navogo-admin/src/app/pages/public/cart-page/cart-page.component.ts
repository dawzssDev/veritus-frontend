import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router } from '@angular/router';

import { CartService } from '../../../services/cart/cart.service';
import { MenuService } from '../../../services/menu/menu.service';
import { ShippingType } from '../../../models/checkout.interface';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  constructor(public cart: CartService, private menuService: MenuService, private router: Router) {}

  formatPrice(price: number): string {
    return this.menuService.formatPrice(price);
  }

  goBack(): void {
    const fromCart = this.cart.empresaId();

    let storedSlug: string | null = null;
    let storedId: number | null = null;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      storedSlug = localStorage.getItem('last_menu_empresa_slug');
      const raw = Number(localStorage.getItem('last_menu_empresa_id'));
      storedId = Number.isFinite(raw) && raw > 0 ? raw : null;
    }

    const empresaId = (fromCart ?? storedId) as number | null;
    const empresaSlug = storedSlug;

    // Preferir /menu/:empresaId/:slug cuando ambos existen
    if (empresaSlug && empresaId && empresaId > 0) {
      this.router.navigate(['/menu', empresaId, empresaSlug]);
      return;
    }

    // Compatibilidad: /menu/:slug (o /menu/:id si el slug es numérico)
    if (empresaSlug) {
      this.router.navigate(['/menu', empresaSlug]);
      return;
    }

    if (empresaId && empresaId > 0) {
      this.router.navigate(['/menu', String(empresaId)]);
      return;
    }

    // Fallback: si no hay empresaId/slug, evita caer a rutas admin (que redirigen a login).
    // Mantener al usuario en una ruta pública conocida.
    this.router.navigate(['/carrito']);
  }

  remove(key: string): void {
    this.cart.removeByKey(key);
  }

  onNoteInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? '';
    this.cart.setNote(value);
  }

  setShippingType(type: ShippingType): void {
    this.cart.setShippingType(type);
  }

  continue(): void {
    if (this.cart.shippingType() === 'domicilio') {
      this.router.navigate(['/checkout']);
      return;
    }

    this.router.navigate(['/recoleccion']);
  }
}
