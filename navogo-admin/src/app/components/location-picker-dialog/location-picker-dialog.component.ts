import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

type LatLng = { lat: number; lng: number };

@Component({
  selector: 'app-location-picker-dialog',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './location-picker-dialog.component.html',
  styleUrl: './location-picker-dialog.component.scss',
})
export class LocationPickerDialogComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() open = false;
  @Input() initialLat: number | null = null;
  @Input() initialLng: number | null = null;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<LatLng>();

  @ViewChild('map', { static: false }) mapRef?: ElementRef<HTMLDivElement>;
  @ViewChild('closeButton', { static: false }) closeButtonRef?: ElementRef<HTMLButtonElement>;

  private readonly platformId = inject(PLATFORM_ID);

  status: 'idle' | 'locating' | 'denied' | 'unavailable' = 'idle';

  private map: any | null = null;
  private leaflet: any | null = null;
  private isInitializing = false;
  private previousBodyOverflow: string | null = null;
  private restoreFocusTo: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.onOpen();
      } else {
        this.onCloseSideEffects();
      }
    }

    if ((changes['initialLat'] || changes['initialLng']) && this.open) {
      this.setViewFromInitial();
    }
  }

  ngAfterViewInit(): void {
    if (this.open) {
      this.initMapIfNeeded();
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
    this.onCloseSideEffects();
  }

  close(): void {
    this.destroyMap();
    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
    this.onCloseSideEffects();
  }

  onOverlayClick(): void {
    this.close();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  async locate(): Promise<void> {
    if (!('geolocation' in navigator)) {
      this.status = 'unavailable';
      return;
    }

    this.status = 'locating';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.status = 'idle';
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.setView(lat, lng, 17);
      },
      () => {
        this.status = 'denied';
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }

  save(): void {
    const center = this.getCenter();
    if (!center) return;

    this.saved.emit(center);
    this.close();
  }

  private onOpen(): void {
    this.restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    queueMicrotask(() => {
      this.closeButtonRef?.nativeElement?.focus();
    });

    // El contenedor del mapa vive dentro de un *ngIf, así que puede no existir aún
    // en el mismo tick en que open cambia a true.
    setTimeout(() => this.initMapIfNeeded(), 0);
  }

  private async initMapIfNeeded(): Promise<void> {
    if (!this.open) return;
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.map || !this.mapRef?.nativeElement) return;
    if (this.isInitializing) return;

    this.isInitializing = true;

    try {
      const leafletModule = await import('leaflet');

      // Normalizar: en producción el módulo viene
      // como { default: L }, en desarrollo como L directamente
      const L = (leafletModule as any).default ?? leafletModule;

      if (!this.open) return;
      if (this.map || !this.mapRef?.nativeElement) return;

      this.leaflet = L;

      // Nota: usamos el centro del mapa como "pin" para seleccionar
      const start = this.getInitialOrDefault();

      this.map = L.map(this.mapRef.nativeElement, {
        zoomControl: true,
        attributionControl: false,
        center: [start.lat, start.lng],
        zoom: 15,
      });

      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        crossOrigin: true,
        keepBuffer: 4,
      }).addTo(this.map);

      // Fallback: si los tiles no cargan en 5 segundos,
      // cambiar a CartoDB (más permisivo en CSP)
      const fallbackTimer = setTimeout(() => {
        const mapContainer = this.mapRef?.nativeElement;
        if (!mapContainer) return;

        const tiles = mapContainer.querySelectorAll('.leaflet-tile-loaded');

        if (tiles.length === 0 && this.map) {
          tileLayer.remove();
          L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            {
              maxZoom: 19,
              subdomains: 'abcd',
              crossOrigin: true,
            }
          ).addTo(this.map);
        }
      }, 5000);

      // Limpiar timer si el componente se destruye
      const originalDestroy = this.destroyMap.bind(this);
      this.destroyMap = () => {
        clearTimeout(fallbackTimer);
        originalDestroy();
      };

      // En caso de que el contenedor se renderice como bottom sheet, forzar recalculo
      queueMicrotask(() => this.map?.invalidateSize?.());
      requestAnimationFrame(() => this.map?.invalidateSize?.());
      setTimeout(() => this.map?.invalidateSize?.(), 250);
    } finally {
      this.isInitializing = false;
    }
  }

  private destroyMap(): void {
    try {
      this.map?.remove?.();
    } catch {
      // ignore
    }
    this.map = null;
    this.leaflet = null;
  }

  private setViewFromInitial(): void {
    const next = this.getInitialOrDefault();
    this.setView(next.lat, next.lng, 15);
  }

  private setView(lat: number, lng: number, zoom: number): void {
    if (!this.map) return;
    this.map.setView([lat, lng], zoom, { animate: true });
  }

  private getCenter(): LatLng | null {
    if (!this.map) return null;
    const c = this.map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  private getInitialOrDefault(): LatLng {
    if (this.initialLat != null && this.initialLng != null) {
      return { lat: this.initialLat, lng: this.initialLng };
    }
    // Mérida por defecto (neutral MX)
    return { lat: 20.96737, lng: -89.59259 };
  }

  private onCloseSideEffects(): void {
    if (this.previousBodyOverflow !== null) {
      document.body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = null;
    }

    if (this.restoreFocusTo) {
      queueMicrotask(() => this.restoreFocusTo?.focus());
      this.restoreFocusTo = null;
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = (this.mapRef?.nativeElement?.closest('.modal-content') as HTMLElement | null) ?? null;
    if (!root) return;

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first) {
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
