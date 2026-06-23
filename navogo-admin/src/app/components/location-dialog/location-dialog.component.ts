import {
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
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-location-dialog',
  standalone: true,
  imports: [CommonModule, NgIf, HttpClientModule],
  templateUrl: './location-dialog.component.html',
  styleUrl: './location-dialog.component.scss',
})
export class LocationDialogComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() address: string | null = null;
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialog', { static: false }) dialogRef?: ElementRef<HTMLElement>;
  @ViewChild('closeButton', { static: false }) closeButtonRef?: ElementRef<HTMLButtonElement>;

  mapUrl: SafeResourceUrl | null = null;
  externalMapUrl: string | null = null;
  embedWarning: string | null = null;
  isResolvingShortUrl = false;

  private previousBodyOverflow: string | null = null;
  private restoreFocusTo: HTMLElement | null = null;
  private resolveSub: Subscription | null = null;

  constructor(private sanitizer: DomSanitizer, private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.onOpen();
      } else {
        this.onCloseSideEffects();
      }
    }

    if (changes['address'] || changes['lat'] || changes['lng']) {
      console.log('🗺️ Location dialog recibió cambios:', {
        address: this.address,
        lat: this.lat,
        lng: this.lng,
        latType: typeof this.lat,
        lngType: typeof this.lng,
        latIsFinite: Number.isFinite(this.lat),
        lngIsFinite: Number.isFinite(this.lng)
      });
      this.mapUrl = this.buildMapUrl();
      if (this.open) {
        this.resolveShortUrlIfNeeded();
      }
    }
  }

  ngOnDestroy(): void {
    this.resolveSub?.unsubscribe();
    this.onCloseSideEffects();
  }

  close(): void {
    this.resolveSub?.unsubscribe();
    this.resolveSub = null;
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

  private onOpen(): void {
    this.restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Importante: el modal se muestra/animación en el mismo ciclo.
    // Diferimos el armado del iframe al siguiente frame para asegurar DOM listo.
    requestAnimationFrame(() => {
      if (!this.open) return;
      this.mapUrl = this.buildMapUrl();
      this.resolveShortUrlIfNeeded();
    });

    queueMicrotask(() => {
      this.closeButtonRef?.nativeElement?.focus();
    });
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

  private buildMapUrl(): SafeResourceUrl | null {
    const { queryForEmbed, externalUrl, warning } = this.getMapContext();
    this.externalMapUrl = externalUrl;
    this.embedWarning = warning;

    console.log('🗺️ buildMapUrl resultado:', { 
      queryForEmbed, 
      externalUrl, 
      warning,
      hasMapUrl: !!queryForEmbed 
    });

    if (!queryForEmbed) return null;

    const src = `https://www.google.com/maps?q=${encodeURIComponent(queryForEmbed)}&output=embed`;
    console.log('🗺️ URL del mapa embedido:', src);
    return this.sanitizer.bypassSecurityTrustResourceUrl(src);
  }

  private resolveShortUrlIfNeeded(): void {
    // Si ya hay coords o la dirección no es shortlink, nada que resolver.
    if (this.lat != null && this.lng != null) return;
    const raw = (this.address || '').trim();
    if (!raw) return;
    if (!this.isShortGoogleMapsUrl(raw)) return;

    // Evitar múltiples requests
    if (this.isResolvingShortUrl) return;

    this.isResolvingShortUrl = true;
    this.embedWarning = null;

    this.resolveSub?.unsubscribe();
    this.resolveSub = this.http
      .get<{ finalUrl: string }>(`/api/maps/resolve`, { params: { url: raw } })
      .subscribe({
        next: (data) => {
          const finalUrl = (data?.finalUrl || '').trim();
          if (!finalUrl) {
            this.embedWarning =
              'No se pudo resolver el enlace para mostrar el mapa embebido. Intenta más tarde.';
            this.mapUrl = this.buildMapUrl();
            return;
          }

          // Intentar extraer coords o query desde la URL final.
          const coords = this.extractLatLngFromUrl(finalUrl);
          if (coords) {
            const src = `https://www.google.com/maps?q=${encodeURIComponent(
              `${coords.lat},${coords.lng}`
            )}&output=embed`;
            this.externalMapUrl = finalUrl;
            this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
            this.embedWarning = null;
            return;
          }

          const extractedQuery = this.extractQueryParam(finalUrl);
          if (extractedQuery) {
            const src = `https://www.google.com/maps?q=${encodeURIComponent(extractedQuery)}&output=embed`;
            this.externalMapUrl = finalUrl;
            this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
            this.embedWarning = null;
            return;
          }

          // Si no hay nada embebible, al menos mantenemos el link final para el CTA.
          this.externalMapUrl = finalUrl;
          this.embedWarning =
            'No fue posible obtener una ubicación embebible desde este enlace. Para verlo, es necesario guardar latitud/longitud.';
          this.mapUrl = null;
        },
        error: () => {
          this.embedWarning =
            'No se pudo resolver el enlace para mostrar el mapa embebido. Para mostrarlo dentro del modal, guarda latitud/longitud.';
          this.mapUrl = this.buildMapUrl();
        },
        complete: () => {
          this.isResolvingShortUrl = false;
        },
      });
  }

  openExternalMap(): void {
    if (!this.externalMapUrl) return;
    window.open(this.externalMapUrl, '_blank', 'noopener,noreferrer');
  }

  private getMapContext(): {
    queryForEmbed: string | null;
    externalUrl: string | null;
    warning: string | null;
  } {
    // Preferir coordenadas si existen: el embed funciona consistente
    if (this.lat != null && this.lng != null && Number.isFinite(this.lat) && Number.isFinite(this.lng)) {
      const coords = `${this.lat},${this.lng}`;
      return {
        queryForEmbed: coords,
        externalUrl: `https://www.google.com/maps?q=${encodeURIComponent(coords)}`,
        warning: null,
      };
    }

    const raw = (this.address || '').trim();
    if (!raw) {
      return { queryForEmbed: null, externalUrl: null, warning: null };
    }

    // Si viene una URL (p.ej. maps.app.goo.gl), NO la usamos como query de embed.
    // Ese patrón suele renderizar un mapa genérico o falla en iframe.
    if (this.isProbablyUrl(raw)) {
      const externalUrl = raw;

      // Intentar extraer coords desde URLs largas de Google Maps (google.com/maps/...@lat,lng,...)
      const coords = this.extractLatLngFromUrl(raw);
      if (coords) {
        return {
          queryForEmbed: `${coords.lat},${coords.lng}`,
          externalUrl,
          warning: null,
        };
      }

      // Intentar extraer query (?q=... / ?query=...)
      const extractedQuery = this.extractQueryParam(raw);
      if (extractedQuery) {
        return {
          queryForEmbed: extractedQuery,
          externalUrl,
          warning: null,
        };
      }

      const warning = this.isShortGoogleMapsUrl(raw)
        ? 'Este enlace es un acceso directo y no se puede mostrar dentro del mapa embebido. Abre la ubicación en Google Maps.'
        : 'No se pudo obtener una ubicación embebible desde la URL. Abre la ubicación en Google Maps.';

      return {
        queryForEmbed: null,
        externalUrl,
        warning,
      };
    }

    // Dirección textual: embed por búsqueda
    return {
      queryForEmbed: raw,
      externalUrl: `https://www.google.com/maps?q=${encodeURIComponent(raw)}`,
      warning: null,
    };
  }

  private isProbablyUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private isShortGoogleMapsUrl(url: string): boolean {
    return /https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(url);
  }

  private extractLatLngFromUrl(url: string): { lat: number; lng: number } | null {
    // Match: .../@19.4326077,-99.133208,17z
    const match = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (!match) return null;

    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  private extractQueryParam(url: string): string | null {
    try {
      const u = new URL(url);
      const q = u.searchParams.get('q') || u.searchParams.get('query');
      return q ? q.trim() : null;
    } catch {
      return null;
    }
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
