import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MenuService } from '../../services/menu/menu.service';
import { Product } from '../../models/business.interface';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) product!: Product;
  @Input() disableAdd = false;
  @Output() select = new EventEmitter<Product>();
  @Output() add = new EventEmitter<Product>();

  private countdownInterval?: number;
  currentTime = new Date();

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    // Actualizar el contador cada segundo si es una promo (solo en navegador)
    if (typeof window !== 'undefined' && this.isPromo()) {
      this.countdownInterval = window.setInterval(() => {
        this.currentTime = new Date();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // Reglas de negocio
  hasDiscount(): boolean {
    if (this.product?.descuento == null || this.product.descuento <= 0) return false;
    if (this.product.is_promo === 1 && Number(this.product.is_recurrente) === 1) {
      const dias: number[] = Array.isArray(this.product.dias_promo) ? this.product.dias_promo : [];
      if (dias.length > 0 && !dias.includes(new Date().getDay())) return false;
    }
    return true;
  }

  hasCombo(): boolean {
    return this.product?.is_combo === 1;
  }

  isPromo(): boolean {
    if (this.product?.is_promo !== 1) return false;
    if (!this.product.fecha_inicio_promo || !this.product.fecha_fin_promo) return false;

    const now = new Date();
    const start = new Date(this.product.fecha_inicio_promo);
    const end = new Date(this.product.fecha_fin_promo);

    if (now < start || now > end) return false;

    if (Number(this.product.is_recurrente) === 1) {
      const dias: number[] = Array.isArray(this.product.dias_promo) ? this.product.dias_promo : [];
      if (dias.length > 0 && !dias.includes(now.getDay())) return false;
    }

    return true;
  }

  getPromoTimeRemaining(): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } | null {
    if (!this.isPromo() || !this.product.fecha_fin_promo) return null;

    const end = new Date(this.product.fecha_fin_promo);
    const diff = end.getTime() - this.currentTime.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  }

  // Cálculos
  getFinalPrice(): number {
    if (this.hasDiscount()) {
      const final = Number(this.product.descuento);
      return Number.isFinite(final) ? final : this.product.precio;
    }
    return this.product.precio;
  }

  getDiscountPercent(): number {
    if (!this.hasDiscount()) return 0;

    const original = Number(this.product.precio);
    const final = this.getFinalPrice();

    if (!Number.isFinite(original) || original <= 0) return 0;
    if (!Number.isFinite(final) || final >= original) return 0;

    return Math.round(((original - final) / original) * 100);
  }

  getDiscountBadgeText(): string {
    const pct = this.getDiscountPercent();
    return pct > 0 ? `-${pct}%` : 'Oferta';
  }

  formatPrice(price: number): string {
    return this.menuService.formatPrice(price);
  }

  onClick(): void {
    this.select.emit(this.product);
  }

  onAddClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disableAdd) return;
    this.add.emit(this.product);
  }

  get imageUrl(): string {
    return this.product?.imagen_url || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
  }
}
