import { Component, OnInit, OnDestroy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuService } from '../../../services/menu/menu.service';
import { Business, Category, Product } from '../../../models/business.interface';
import { Sucursal } from '../../../sucursales/sucursal.interface';
import { LocationDialogComponent } from '../../../components/location-dialog/location-dialog.component';
import { ScheduleDialogComponent } from '../../../components/schedule-dialog/schedule-dialog.component';
import { ProductCardComponent } from '../../../components/product-card/product-card.component';
import { ProductDetailDialogComponent } from '../../../components/product-detail-dialog/product-detail-dialog.component';
import { CartService } from '../../../services/cart/cart.service';
import { CartItemSelection } from '../../../models/cart.interface';
import { ProductDetail } from '../../../models/business.interface';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

/**
 * PÁGINA PRINCIPAL DEL MENÚ PÚBLICO
 * Vista mobile-first para clientes finales
 */
@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    LocationDialogComponent,
    ScheduleDialogComponent,
    ProductCardComponent,
    ProductDetailDialogComponent,
  ],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss'
})
export class MenuPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  empresaId: number = 0;
  empresaSlug: string = '';
  business: Business | null = null;
  loading: boolean = true;
  error: boolean = false;
  errorMessage: string = '';

  // Categoría seleccionada para scroll
  selectedCategory: number | string | null = null;
  
  // Control del modal de horarios
  showHorariosModal: boolean = false;

  // Control del modal de ubicación
  showLocationModal: boolean = false;

  // Control del modal de detalle de producto
  showProductModal: boolean = false;
  selectedProductId: number | null = null;

  // Sucursales
  sucursales: Sucursal[] = [];
  selectedSucursal: Sucursal | null = null;
  showSucursalModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    public cart: CartService
  ) {}

  ngOnInit(): void {
    // Obtener slug e ID desde URL: /menu/:empresaId/:slug (y compatibilidad con /menu/:slug/:empresaId)
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const slugParam = params['slug'];
      this.empresaSlug = slugParam;

      // Si viene empresaId, usarlo (preferido). Si no, fallback a slug numérico.
      const idParam = Number(params['empresaId']);
      if (Number.isFinite(idParam) && idParam > 0) {
        this.empresaId = idParam;
      } else {
        const parsedId = Number(slugParam);
        if (!isNaN(parsedId) && parsedId > 0) {
          this.empresaId = parsedId;
        } else {
          this.empresaId = 0;
        }
      }

      // Al entrar/re-entrar al menú, asegurar que no quede ningún modal abierto
      // (y evitar overlays/scroll-lock que impidan interactuar).
      this.resetOverlays();

      // Persistir empresa actual (para redirects seguros en modo cliente)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('last_menu_empresa_slug', this.empresaSlug);
        if (this.empresaId > 0) {
          localStorage.setItem('last_menu_empresa_id', String(this.empresaId));
        }
      }

      this.loadMenu();
    });
  }

  ngOnDestroy(): void {
    // Por seguridad, si el usuario navega fuera con algún modal abierto.
    this.resetOverlays();
  }

  private resetOverlays(): void {
    this.showHorariosModal = false;
    this.showLocationModal = false;
    this.showProductModal = false;
    this.selectedProductId = null;

    if (typeof document !== 'undefined') {
      // Si algún modal dejó el body bloqueado, lo liberamos.
      document.body.style.overflow = '';
    }
  }

  /**
   * Cargar datos del menú usando el endpoint real
   */
  loadMenu(): void {
    console.log('🚀 Iniciando carga de menú para:', { slug: this.empresaSlug, id: this.empresaId });
    this.loading = true;
    this.error = false;

    // Preferir ID para cargar productos; slug sirve para URL amigable
    const empresaObservable = this.empresaId > 0 
      ? this.menuService.getEmpresaById(this.empresaId)
      : this.menuService.getEmpresaBySlug(this.empresaSlug);

    empresaObservable.subscribe({
      next: (empresaData) => {
        console.log('✅ EmpresaData recibido:', empresaData);
        
        // Guardar el ID de la empresa para cargar productos
        const empresaIdFromData = Number(empresaData.id);
        if (empresaIdFromData > 0 && this.empresaId === 0) {
          this.empresaId = empresaIdFromData;
        }

        // Cargar productos usando el ID de la empresa
        this.menuService.getMenuByEmpresaId(this.empresaId).subscribe({
          next: (menuData) => {
            console.log('✅ MenuData recibido:', menuData);
            
            // Mantener horarios como objeto para el modal
            let horarios = empresaData.horarios;
            if (typeof empresaData.horarios === 'string') {
              try {
                horarios = JSON.parse(empresaData.horarios);
              } catch {
                horarios = empresaData.horarios;
              }
            }

            // Combinar datos
            this.business = {
              ...menuData,
              nombre: empresaData.nombre || menuData.nombre,
              descripcion: empresaData.descripcion || '',
              logo: empresaData.imagen ? `${environment.storageUrl}/${empresaData.imagen}` : undefined,
              banner: empresaData.imagen ? `${environment.storageUrl}/${empresaData.imagen}` : undefined,
              imagen_url: empresaData.imagen ? `${environment.storageUrl}/${empresaData.imagen}` : undefined,
              telefono: empresaData.telefono,
              whatsapp: empresaData.whatsapp,
              instagram: empresaData.instagram,
              horarios: horarios,
              direccion: empresaData.direccion,
              // Normalizar coordenadas: usar latitud/longitud del backend y mapear a lat/lng
              lat: empresaData.latitud ? (typeof empresaData.latitud === 'string' ? parseFloat(empresaData.latitud) : empresaData.latitud) : undefined,
              lng: empresaData.longitud ? (typeof empresaData.longitud === 'string' ? parseFloat(empresaData.longitud) : empresaData.longitud) : undefined,
              latitud: empresaData.latitud,
              longitud: empresaData.longitud,
              estado: empresaData.estatus === 1 ? 'activo' : 'inactivo'
            };

            // Contexto requerido para checkout/pedido
            this.cart.setBusinessContext({
              empresaId: this.empresaId,
              businessName: this.business?.nombre ?? null,
              businessWhatsapp: this.business?.whatsapp ?? null,
              businessPhone: this.business?.telefono ?? null,
            });
            console.log('✅ Business final:', this.business);
            console.log('� Coordenadas mapeadas:', { 
              lat: this.business.lat, 
              lng: this.business.lng,
              latitud: empresaData.latitud,
              longitud: empresaData.longitud 
            });
            console.log('�📊 Loading status:', this.loading);
            this.loading = false;
            this.cdr.detectChanges(); // Forzar detección de cambios
            console.log('✅ Loading cambiado a false');

            // Cargar sucursales en paralelo (sin bloquear la UI)
            this.menuService.getSucursalesByEmpresaId(this.empresaId).subscribe({
              next: (sucursales) => {
                this.sucursales = sucursales.filter(s => s.estatus);
                if (this.sucursales.length === 1) {
                  this.selectSucursal(this.sucursales[0]);
                }
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error('❌ Error cargando productos:', err);
            this.error = true;
            this.errorMessage = err.status === 404 
              ? 'No hay productos disponibles para este negocio' 
              : 'Error al cargar los productos';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('❌ Error obteniendo empresa:', err);
        this.error = true;
        this.errorMessage = err.status === 404 
          ? 'Empresa no encontrada' 
          : 'Error al cargar la información de la empresa';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Obtener texto resumido de horarios
   */
  getHorariosResumen(): string {
    if (!this.business?.horarios) return 'Ver horarios';
    
    if (typeof this.business.horarios === 'string') {
      return this.business.horarios;
    }
    
    const horarios = this.business.horarios;
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasAbiertos = dias.filter(dia => horarios[dia]?.is_open);
    
    if (diasAbiertos.length === 0) return 'Cerrado';
    if (diasAbiertos.length === 7) {
      const primerDia = horarios['lunes'];
      return `${this.formatTime(primerDia.open)} - ${this.formatTime(primerDia.close)}`;
    }
    
    return 'Ver horarios';
  }

  /**
   * Obtener horario de hoy
   */
  getTodaySchedule(): { day: string; isOpen: boolean; hours: string } | null {
    if (!this.business?.horarios || typeof this.business.horarios !== 'object') {
      return null;
    }

    const now = new Date();
    const currentDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    const todaySchedule = this.business.horarios[currentDay];

    const dayNames: { [key: string]: string } = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };

    if (!todaySchedule || !todaySchedule.is_open) {
      return {
        day: dayNames[currentDay] || 'Hoy',
        isOpen: false,
        hours: 'Cerrado'
      };
    }

    return {
      day: dayNames[currentDay] || 'Hoy',
      isOpen: true,
      hours: `${this.formatTime(todaySchedule.open)} - ${this.formatTime(todaySchedule.close)}`
    };
  }

  /**
   * Formatear hora a formato 12 horas
   */
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  /**
   * Obtener horarios detallados para el modal
   */
  getHorariosDetallados(): any {
    if (!this.business?.horarios || typeof this.business.horarios !== 'object') {
      return null;
    }
    return this.business.horarios;
  }

  openSucursalModal(): void {
    this.showSucursalModal = true;
  }

  closeSucursalModal(): void {
    this.showSucursalModal = false;
  }

  selectSucursal(sucursal: Sucursal): void {
    this.selectedSucursal = sucursal;
    this.showSucursalModal = false;
    this.cart.setSucursal(sucursal.id);
    this.cdr.detectChanges();
  }

  /**
   * Abrir modal de horarios
   */
  openHorariosModal(): void {
    this.showHorariosModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Cerrar modal de horarios
   */
  closeHorariosModal(): void {
    this.showHorariosModal = false;
    this.cdr.detectChanges();
  }

  /**
   * Abrir modal de ubicación
   */
  openLocationModal(): void {
    this.showLocationModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Cerrar modal de ubicación
   */
  closeLocationModal(): void {
    this.showLocationModal = false;
    this.cdr.detectChanges();
  }

  /**
   * Formatear nombre del día
   */
  formatDayName(day: string): string {
    const days: { [key: string]: string } = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'domingo': 'Domingo'
    };
    return days[day] || day;
  }

  /**
   * Verificar si es el día actual
   */
  isToday(day: string): boolean {
    const now = new Date();
    const currentDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    return day === currentDay;
  }

  /**
   * Verificar si el negocio está abierto en este momento
   */
  isBusinessOpen(): boolean {
    if (!this.business?.horarios || typeof this.business.horarios !== 'object') {
      return true; // Si no hay horarios, asumimos que está abierto
    }

    const now = new Date();
    const currentDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todaySchedule = this.business.horarios[currentDay];
    
    if (!todaySchedule || !todaySchedule.is_open) {
      return false;
    }

    const [openHour, openMin] = todaySchedule.open.split(':').map(Number);
    const [closeHour, closeMin] = todaySchedule.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    // Manejar casos donde el cierre es después de medianoche
    if (closeTime < openTime) {
      // El negocio cierra después de medianoche
      return currentTime >= openTime || currentTime <= closeTime;
    }

    return currentTime >= openTime && currentTime <= closeTime;
  }

  /**
   * Obtener hora de próxima apertura
   */
  getNextOpeningTime(): string {
    if (!this.business?.horarios || typeof this.business.horarios !== 'object') {
      return '';
    }

    const now = new Date();
    const currentDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    const todaySchedule = this.business.horarios[currentDay];

    // Si hoy abre y aún no ha llegado la hora
    if (todaySchedule?.is_open) {
      const [openHour, openMin] = todaySchedule.open.split(':').map(Number);
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const openTime = openHour * 60 + openMin;

      if (currentTime < openTime) {
        return `Abrimos hoy a las ${this.formatTime(todaySchedule.open)} 🍽`;
      }
    }

    // Buscar el próximo día que abre
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const currentDayIndex = days.indexOf(currentDay);
    
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      const nextSchedule = this.business.horarios[nextDay];
      
      if (nextSchedule?.is_open) {
        const dayName = this.formatDayName(nextDay);
        return `Abrimos ${i === 1 ? 'mañana' : dayName} a las ${this.formatTime(nextSchedule.open)} 🍽`;
      }
    }

    return 'Horarios no disponibles';
  }

  /**
   * Scroll suave a categoría
   */
  scrollToCategory(categoryId: number | string): void {
    this.selectedCategory = categoryId;
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Formatear precio
   */
  formatPrice(price: number): string {
    return this.menuService.formatPrice(price);
  }

  /**
   * Contactar por WhatsApp
   */
  contactWhatsApp(): void {
    if (this.business?.whatsapp) {
      const message = `Hola ${this.business.nombre}, me gustaría hacer un pedido`;
      this.menuService.openWhatsApp(this.business.whatsapp, message);
    }
  }

  /**
   * Compartir en redes
   */
  shareOnSocial(platform: string): void {
    const url = window.location.href;
    const text = `Mira el menú de ${this.business?.nombre}`;
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  }

  /**
   * Ver producto (preparado para modal de carrito)
   */
  viewProduct(product: Product): void {
    // Forzar cierre si estaba abierto para asegurar que se detecte el cambio
    if (this.showProductModal) {
      this.showProductModal = false;
      this.selectedProductId = null;
      this.cdr.detectChanges();
      
      // Pequeño delay para asegurar que el cambio se procese completamente
      setTimeout(() => {
        this.selectedProductId = product?.id ?? null;
        this.showProductModal = this.selectedProductId != null;
        this.cdr.detectChanges();
      }, 50);
    } else {
      this.selectedProductId = product?.id ?? null;
      this.showProductModal = this.selectedProductId != null;
      this.cdr.detectChanges();
    }
  }

  addFromCard(product: Product): void {
    if (!this.isBusinessOpen()) return;
    // Si el producto tiene complementos, se requiere abrir el dialog para seleccionarlos.
    // Como el modelo Product no garantiza traer "adicionales", usamos un fallback seguro:
    // - Si viene `adicionales: []` -> se puede agregar directo.
    // - Si no viene el campo o viene con items -> abrir dialog.
    const maybeAddons = (product as any)?.adicionales;
    const canDetermineNoAddons = Array.isArray(maybeAddons) && maybeAddons.length === 0;

    if (!canDetermineNoAddons) {
      this.viewProduct(product);
      return;
    }

    const unitPrice = (product.descuento != null && product.descuento > 0) ? Number(product.descuento) : Number(product.precio);
    this.cart.addItem({
      productId: product.id,
      name: product.nombre,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : Number(product.precio),
      imageUrl: product.imagen_url,
      quantity: 1,
    });
  }

  onAddFromDetail(event: { product: ProductDetail; quantity: number; selections: CartItemSelection[] }): void {
    if (!this.isBusinessOpen()) return;
    
    const p = event.product;
    const base = (p.descuento != null && p.descuento > 0) ? Number(p.descuento) : Number(p.precio);
    const baseSafe = Number.isFinite(base) ? base : Number(p.precio);

    // Nueva lógica de precios:
    // 1. Si hay "precio" en alguna selección -> REEMPLAZA el precio base (usar el mayor)
    // 2. Si hay "precio-extra" en selecciones -> SE SUMA al precio base
    
    // Buscar "precio" (precio total que reemplaza)
    const priceOverride = (event.selections ?? []).reduce((best: number | null, s) => {
      const v = s && (s as any).precio != null ? Number((s as any).precio) : NaN;
      if (!Number.isFinite(v)) return best;
      if (best == null || v > best) return v;
      return best;
    }, null);

    // 1. Determinar precio base: si hay override -> usar ese, sino precio del producto
    const basePrice = priceOverride != null ? priceOverride : baseSafe;

    // 2. SIEMPRE sumar precio-extra de todas las opciones
    const extraTotal = (event.selections ?? []).reduce((sum: number, s) => {
      const extra = s && (s as any)['precio-extra'] != null ? Number((s as any)['precio-extra']) : NaN;
      if (Number.isFinite(extra)) {
        return sum + extra;
      }
      return sum;
    }, 0);

    // Precio final = precio base + suma de precio-extra
    const unitPrice = basePrice + extraTotal;

    this.cart.addItem({
      productId: p.id,
      name: p.nombre,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : Number(p.precio),
      imageUrl: p.imagen_url || (p.imagen ? `${environment.storageUrl}/${p.imagen}` : undefined),
      quantity: event.quantity,
      selections: event.selections,
    });
  }

  goToCart(): void {
    this.resetOverlays();
    this.router.navigate(['/carrito']);
  }

  cartCount(): number {
    return this.cart.count();
  }

  cartTotal(): number {
    return this.cart.total();
  }

  /**
   * Obtener productos en promoción activa
   */
  getActivePromos(): Product[] {
    if (!this.business?.categorias) return [];
    
    const now = new Date();
    const allProducts: Product[] = [];
    
    // Recolectar todos los productos de todas las categorías
    for (const category of this.business.categorias) {
      if (category.productos && Array.isArray(category.productos)) {
        allProducts.push(...category.productos);
      }
    }
    
    // Filtrar productos con promoción activa
    return allProducts.filter(product => {
      if (!product || (product as any).is_promo !== 1) return false;
      
      const fechaInicio = (product as any).fecha_inicio_promo;
      const fechaFin = (product as any).fecha_fin_promo;
      
      if (!fechaInicio || !fechaFin) return false;
      
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      return now >= inicio && now <= fin;
    });
  }

  /**
   * Verificar si un producto está en promoción activa
   */
  isProductInActivePromo(product: Product): boolean {
    if (!product || (product as any).is_promo !== 1) return false;
    
    const fechaInicio = (product as any).fecha_inicio_promo;
    const fechaFin = (product as any).fecha_fin_promo;
    
    if (!fechaInicio || !fechaFin) return false;
    
    const now = new Date();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    return now >= inicio && now <= fin;
  }

  /**
   * Filtrar productos de una categoría excluyendo los que están en promoción
   */
  getProductsWithoutPromos(products: Product[]): Product[] {
    if (!products || !Array.isArray(products)) return [];
    // Devolver todos los productos, incluidos los que tienen promo activa
    // Los productos con promo mostrarán su badge y contador automáticamente
    return products;
  }

  /**
   * Calcular tiempo restante de una promoción
   */
  getPromoTimeRemaining(product: Product): { days: number; hours: number; minutes: number; expired: boolean } {
    const fechaFin = (product as any).fecha_fin_promo;
    
    if (!fechaFin) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }
    
    const now = new Date();
    const end = new Date(fechaFin);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, expired: false };
  }

  /**
   * Formatear fecha de fin de promoción
   */
  formatPromoEndDate(product: Product): string {
    const fechaFin = (product as any).fecha_fin_promo;
    if (!fechaFin) return '';
    
    const date = new Date(fechaFin);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }
}
