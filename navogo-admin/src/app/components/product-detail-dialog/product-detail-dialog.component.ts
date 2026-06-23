import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, finalize } from 'rxjs';

import {
  ProductAdicionalGroup,
  ProductDetail,
} from '../../models/business.interface';
import { Productos } from '../../services/productos/productos';
import { MenuService } from '../../services/menu/menu.service';
import { CartItemSelection } from '../../models/cart.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './product-detail-dialog.component.html',
  styleUrl: './product-detail-dialog.component.scss',
})
export class ProductDetailDialogComponent implements OnChanges, OnDestroy, OnInit {
  @Input() open = false;
  @Input() productId: number | null = null;
  @Input() canAdd = true;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<{ product: ProductDetail; quantity: number; selections: CartItemSelection[] }>();

  @ViewChild('dialog', { static: false }) dialogRef?: ElementRef<HTMLElement>;
  @ViewChild('closeButton', { static: false }) closeButtonRef?: ElementRef<HTMLButtonElement>;

  loading = false;
  errorMessage: string | null = null;
  product: ProductDetail | null = null;

  quantity = 1;
  customUnitPrice: number | null = null;
  priceInputError = '';

  attemptedAdd = false;
  selectionError = '';

  // Control de imagen expandida
  imageExpanded = false;

  // Cambio: ahora almacena arrays para permitir múltiples selecciones
  selectedByGroup: Record<string, string[]> = {};

  // Control de contador de promoción
  private countdownInterval?: number;
  currentTime = new Date();

  private previousBodyOverflow: string | null = null;
  private restoreFocusTo: HTMLElement | null = null;
  private fetchSub: Subscription | null = null;

  constructor(
    private productos: Productos,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Iniciar contador si es promo
    this.startCountdownIfPromo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.onOpen();
      } else {
        this.onCloseSideEffects();
      }
    }

    // Cargar al abrir o cuando cambia el producto, pero evitando doble request.
    const justOpened = !!changes['open'] && this.open;
    const productChanged = !!changes['productId'] && changes['productId'].currentValue !== changes['productId'].previousValue;
    
    if (this.open && (justOpened || productChanged)) {
      this.loadProduct();
    }
  }

  ngOnDestroy(): void {
    this.fetchSub?.unsubscribe();
    if (typeof window !== 'undefined' && this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.onCloseSideEffects();
    // Asegurar que el overflow se restaure al destruir el componente
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  close(): void {
    // Cancelar cualquier petición en curso
    this.fetchSub?.unsubscribe();
    this.fetchSub = null;

    // Resetear estado
    this.loading = false;
    this.errorMessage = null;
    this.product = null;
    this.quantity = 1;
    this.customUnitPrice = null;
    this.priceInputError = '';
    this.attemptedAdd = false;
    this.selectionError = '';
    this.selectedByGroup = {};
    this.imageExpanded = false;

    // Primero restaurar los side effects (overflow, etc)
    this.onCloseSideEffects();
    
    // Luego cambiar el estado y emitir eventos
    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  onOverlayClick(): void {
    this.close();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.imageExpanded) {
        this.closeImageExpanded();
      } else {
        this.close();
      }
      return;
    }

    if (event.key === 'Tab' && !this.imageExpanded) {
      this.trapFocus(event);
    }
  }

  expandImage(): void {
    this.imageExpanded = true;
  }

  closeImageExpanded(): void {
    this.imageExpanded = false;
  }

  formatPrice(price: number): string {
    return this.menuService.formatPrice(price);
  }

  isPrecioVariable(): boolean {
    return Number(this.product?.precio_variable) === 1;
  }

  isCustomPriceValid(): boolean {
    if (!this.isPrecioVariable()) return true;
    const v = Number(this.customUnitPrice);
    return Number.isFinite(v) && v > 0;
  }

  onCustomPriceChange(raw: string): void {
    const n = parseFloat(raw);
    this.customUnitPrice = Number.isFinite(n) ? n : null;

    if (!this.isCustomPriceValid()) {
      this.priceInputError = 'Ingresa un precio válido mayor a 0.';
    } else {
      this.priceInputError = '';
    }

    this.cdr.detectChanges();
  }

  hasDiscount(): boolean {
    if (this.isPrecioVariable()) return false;
    if (this.product?.descuento == null || this.product.descuento <= 0) return false;
    if ((this.product as any).is_promo === 1 && Number((this.product as any).is_recurrente) === 1) {
      const dias: number[] = Array.isArray((this.product as any).dias_promo) ? (this.product as any).dias_promo : [];
      if (dias.length > 0 && !dias.includes(new Date().getDay())) return false;
    }
    return true;
  }

  hasCombo(): boolean {
    return this.product?.is_combo === 1;
  }

  isPromo(): boolean {
    if (!this.product || (this.product as any).is_promo !== 1) return false;
    if (!(this.product as any).fecha_inicio_promo || !(this.product as any).fecha_fin_promo) return false;

    const now = new Date();
    const start = new Date((this.product as any).fecha_inicio_promo);
    const end = new Date((this.product as any).fecha_fin_promo);

    if (now < start || now > end) return false;

    if (Number((this.product as any).is_recurrente) === 1) {
      const dias: number[] = Array.isArray((this.product as any).dias_promo) ? (this.product as any).dias_promo : [];
      if (dias.length > 0 && !dias.includes(now.getDay())) return false;
    }

    return true;
  }

  getPromoTimeRemaining(): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } | null {
    if (!this.isPromo() || !(this.product as any).fecha_fin_promo) return null;

    const end = new Date((this.product as any).fecha_fin_promo);
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

  private startCountdownIfPromo(): void {
    if (typeof window !== 'undefined' && this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    if (typeof window !== 'undefined' && this.isPromo()) {
      this.countdownInterval = window.setInterval(() => {
        this.currentTime = new Date();
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  getFinalPrice(): number {
    if (!this.product) return 0;
    if (this.isPrecioVariable()) {
      const v = Number(this.customUnitPrice);
      return Number.isFinite(v) ? v : Number(this.product.precio);
    }
    if (this.hasDiscount()) {
      const final = Number(this.product.descuento);
      return Number.isFinite(final) ? final : Number(this.product.precio);
    }
    return Number(this.product.precio);
  }

  private getSelectedOverridePrice(): number | null {
    const groups = this.adicionales;
    if (!groups.length) return null;

    // Nueva lógica: "precio" reemplaza el precio base del producto.
    // Si hay más de uno con precio, usamos el mayor (caso típico: tamaños).
    let best: number | null = null;

    for (const g of groups) {
      const selectedExtras = this.selectedByGroup[g.titulo];
      if (!selectedExtras || selectedExtras.length === 0) continue;

      const activeOptions = this.getActiveOptions(g);
      
      // Iterar sobre todas las selecciones
      for (const selectedExtra of selectedExtras) {
        const opt = activeOptions.find((o) => o.extra === selectedExtra);
        const precio = opt && (opt as any).precio != null ? Number((opt as any).precio) : NaN;
        if (!Number.isFinite(precio)) continue;

        if (best == null || precio > best) best = precio;
      }
    }

    return best;
  }

  getSelectedExtraTotal(): number {
    const groups = this.adicionales;
    if (!groups.length) return 0;

    // "precio-extra" se suma al precio base del producto
    let total = 0;

    for (const g of groups) {
      const selectedExtras = this.selectedByGroup[g.titulo];
      if (!selectedExtras || selectedExtras.length === 0) continue;

      const activeOptions = this.getActiveOptions(g);
      
      // Iterar sobre todas las selecciones y sumar
      for (const selectedExtra of selectedExtras) {
        const opt = activeOptions.find((o) => o.extra === selectedExtra);
        const precioExtra = opt && (opt as any)['precio-extra'] != null ? Number((opt as any)['precio-extra']) : NaN;
        if (Number.isFinite(precioExtra)) {
          total += precioExtra;
        }
      }
    }

    return total;
  }

  getEffectiveUnitPrice(): number {
    // 1. Determinar precio base: si hay "precio" en opciones -> usar ese, sino precio del producto
    const override = this.getSelectedOverridePrice();
    const basePrice = override != null ? override : this.getFinalPrice();

    // 2. SIEMPRE sumar precio-extra de todas las opciones
    const extraTotal = this.getSelectedExtraTotal();
    const finalPrice = basePrice + extraTotal;
    
    return finalPrice;
  }

  getOptionPrice(groupTitle: string, extra: string): number | null {
    const group = this.adicionales.find((g) => g.titulo === groupTitle);
    if (!group) return null;
    const activeOptions = this.getActiveOptions(group);
    const opt = activeOptions.find((o) => o.extra === extra);
    const precio = opt && (opt as any).precio != null ? Number((opt as any).precio) : NaN;
    return Number.isFinite(precio) ? precio : null;
  }

  getOptionExtraPrice(groupTitle: string, extra: string): number | null {
    const group = this.adicionales.find((g) => g.titulo === groupTitle);
    if (!group) return null;
    const activeOptions = this.getActiveOptions(group);
    const opt = activeOptions.find((o) => o.extra === extra);
    const precioExtra = opt && (opt as any)['precio-extra'] != null ? Number((opt as any)['precio-extra']) : NaN;
    return Number.isFinite(precioExtra) ? precioExtra : null;
  }

  getDiscountPercent(): number {
    if (!this.product || !this.hasDiscount()) return 0;

    const original = Number(this.product.precio);
    const final = this.getFinalPrice();

    if (!Number.isFinite(original) || original <= 0) return 0;
    if (!Number.isFinite(final) || final >= original) return 0;

    return Math.round(((original - final) / original) * 100);
  }

  get imageUrl(): string {
    const p = this.product;
    if (!p) return 'https://via.placeholder.com/600x400?text=Producto';

    if (p.imagen_url) return p.imagen_url;
    if (p.imagen) return `${environment.storageUrl}/${p.imagen}`;

    return 'https://via.placeholder.com/600x400?text=Producto';
  }

  get adicionales(): ProductAdicionalGroup[] {
    return this.product?.adicionales || [];
  }

  getActiveOptions(group: ProductAdicionalGroup) {
    return group.opciones?.filter(opt => opt.estatus !== false) || [];
  }

  /**
   * Determinar si un grupo es tipo "precio" (radio único) o "precio-extra" (checkbox múltiple)
   */
  isGroupMultiSelect(group: ProductAdicionalGroup): boolean {
    const activeOptions = this.getActiveOptions(group);
    if (activeOptions.length === 0) return false;
    
    // Si todas las opciones activas tienen precio-extra, es multi-select
    return activeOptions.every(opt => (opt as any)['precio-extra'] != null);
  }

  isSelected(groupTitle: string, extra: string): boolean {
    const selections = this.selectedByGroup[groupTitle] || [];
    return selections.includes(extra);
  }

  selectOption(groupTitle: string, extra: string): void {
    const group = this.adicionales.find(g => g.titulo === groupTitle);
    if (!group) return;

    const isMulti = this.isGroupMultiSelect(group);
    const currentSelections = this.selectedByGroup[groupTitle] || [];

    if (isMulti) {
      // Checkbox: toggle la selección
      if (currentSelections.includes(extra)) {
        this.selectedByGroup = {
          ...this.selectedByGroup,
          [groupTitle]: currentSelections.filter(e => e !== extra),
        };
      } else {
        this.selectedByGroup = {
          ...this.selectedByGroup,
          [groupTitle]: [...currentSelections, extra],
        };
      }
    } else {
      // Radio: reemplazar la selección
      this.selectedByGroup = {
        ...this.selectedByGroup,
        [groupTitle]: [extra],
      };
    }

    if (this.selectionError) this.selectionError = '';
    
    // Forzar detección de cambios para actualizar el precio en el botón
    this.cdr.detectChanges();
  }

  isGroupMissing(groupTitle: string): boolean {
    // Los complementos ya no son obligatorios
    return false;
  }

  private getMissingGroupTitles(): string[] {
    // Los complementos ya no son obligatorios
    return [];
  }

  incrementQty(): void {
    this.quantity = Math.max(1, this.quantity + 1);
    this.cdr.detectChanges();
  }

  decrementQty(): void {
    this.quantity = Math.max(1, this.quantity - 1);
    this.cdr.detectChanges();
  }

  onAddToCart(): void {
    if (!this.product) return;
    if (!this.canAdd) return;

    this.attemptedAdd = true;

    if (this.isPrecioVariable() && !this.isCustomPriceValid()) {
      this.priceInputError = 'Ingresa un precio válido mayor a 0.';
      this.cdr.detectChanges();
      return;
    }
    
    // Ya no validamos complementos obligatorios
    const selections: CartItemSelection[] = [];
    
    // Construir selecciones desde selectedByGroup
    for (const [groupTitle, extras] of Object.entries(this.selectedByGroup)) {
      for (const extra of extras) {
        const precio = this.getOptionPrice(groupTitle, extra);
        const precioExtra = this.getOptionExtraPrice(groupTitle, extra);
        
        const selection: any = {
          groupTitle,
          extra,
          precio: precio == null ? null : precio,
        };
        
        // Solo incluir precio-extra si existe
        if (precioExtra != null) {
          selection['precio-extra'] = precioExtra;
        }
        
        selections.push(selection);
      }
    }

    const productToAdd: ProductDetail = this.isPrecioVariable()
      ? { ...this.product, precio: Number(this.customUnitPrice) }
      : this.product;

    this.addToCart.emit({
      product: productToAdd,
      quantity: this.quantity,
      selections,
    });

    this.close();
  }

  get addButtonLabel(): string {
    const unit = this.getEffectiveUnitPrice();
    const total = unit * Math.max(1, this.quantity);
    return `Agregar producto ${this.formatPrice(total)}`;
  }

  private onOpen(): void {
    if (typeof document === 'undefined') return;

    this.restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Solo guardar el overflow si no lo habíamos guardado antes
    if (this.previousBodyOverflow === null) {
      this.previousBodyOverflow = document.body.style.overflow;
    }
    document.body.style.overflow = 'hidden';

    queueMicrotask(() => {
      this.closeButtonRef?.nativeElement?.focus();
    });
  }

  private onCloseSideEffects(): void {
    if (typeof document !== 'undefined') {
      if (this.previousBodyOverflow !== null) {
        document.body.style.overflow = this.previousBodyOverflow;
        this.previousBodyOverflow = null;
      } else {
        // Fallback: asegurar que se restaure el overflow
        document.body.style.overflow = '';
      }
    }

    if (this.restoreFocusTo) {
      queueMicrotask(() => this.restoreFocusTo?.focus());
      this.restoreFocusTo = null;
    }
  }

  private loadProduct(): void {
    if (!this.open) return;
    if (this.productId == null) return;

    this.loading = true;
    this.errorMessage = null;
    this.product = null;
    this.selectedByGroup = {};
    this.quantity = 1;
    this.customUnitPrice = null;
    this.priceInputError = '';
    this.attemptedAdd = false;
    this.selectionError = '';

    this.fetchSub?.unsubscribe();
    this.fetchSub = this.productos
      .getById(this.productId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
      next: (res) => {
        this.product = res;
        this.customUnitPrice = Number(res?.precio ?? 0);
        this.initSelections();
        this.startCountdownIfPromo();
        this.cdr.detectChanges();
      },
      error: (err) => {
        const status = (err && typeof err.status === 'number') ? err.status : null;
        if (status === 404) {
          this.errorMessage = 'Producto no encontrado.';
        } else {
          this.errorMessage = 'No se pudo cargar el producto. Intenta más tarde.';
        }
        this.cdr.detectChanges();
      },
    });
  }

  private initSelections(): void {
    const p = this.product;
    if (!p?.adicionales || p.adicionales.length === 0) return;

    const initial: Record<string, string[]> = {};

    // Ya no pre-seleccionamos nada, los complementos son opcionales
    // Inicializar con arrays vacíos
    for (const group of p.adicionales) {
      initial[group.titulo] = [];
    }

    this.selectedByGroup = initial;
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialogRef?.nativeElement;
    if (!root) return;

    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
