import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as QRCode from 'qrcode';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';
import { EmpresaNuevo } from './empresa-nuevo/empresa-nuevo';
import { Empresas } from '../../services/empresas/empresas';
import { AuthService } from '../../services/auth/auth.service';
import { Business } from '../../models/business.interface';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-empresa-listing',
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './empresa-listing.html',
  styleUrl: './empresa-listing.scss',
})
export class EmpresaListing {
  readonly dialog = inject(MatDialog);
  readonly router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  empresa: Business | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  menuLink = '';
  tvLink = '';
  menuQrDataUrl = '';
  empresaImageUrl = '';
  resolvedMapUrl: SafeResourceUrl | null = null;
  resolvedExternalUrl: string | null = null;
  displayAddress: string = '';
  isResolvingMap = false;
  
  // Coordenadas actuales
  currentLatitude: number | null = null;
  currentLongitude: number | null = null;

  constructor(
    private empresaService: Empresas,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadEmpresa();
  }

  private loadEmpresa(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.empresa = null;

    const empresaId = this.auth.getEmpresaId();
    if (!empresaId) {
      this.isLoading = false;
      this.errorMessage = 'No se encontró la empresa asociada a tu usuario.';
      return;
    }

    this.empresaService.getById(empresaId).subscribe({
      next: (res: any) => {
        const empresa = Array.isArray(res) ? res[0] : res;
        this.empresa = (empresa ?? null) as Business | null;

        const id = Number((this.empresa as any)?.id ?? empresaId);
        const nombre = this.empresa?.nombre || '';
        this.menuLink = this.buildMenuLink(nombre, id);
        this.tvLink = this.buildTvLink(id);
        this.generateMenuQr();
        this.empresaImageUrl = this.buildImageUrl(this.empresa?.imagen);
        this.isLoading = false;

        if (this.empresa) {
          this.resolveMapIfNeeded(this.empresa);
        }
      },
      error: (err) => {
        console.error('Error al obtener empresa:', err);
        this.isLoading = false;
        this.errorMessage = 'No se pudo cargar la información de tu empresa.';
      }
    });
  }

  openById(id: number): void {
    this.router.navigate(['/empresas', id, 'editar']);
  }

  private buildTvLink(empresaId: number): string {
    if (!Number.isFinite(empresaId) || empresaId <= 0) return '';
    if (typeof window === 'undefined') return `/tv?empresa=${empresaId}`;
    return `${window.location.origin}/tv?empresa=${empresaId}`;
  }

  openTv(): void {
    if (this.tvLink) window.open(this.tvLink, '_blank');
  }

  async copyTvLink(): Promise<void> {
    if (!this.tvLink) return;
    try {
      const canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText;
      if (canUseClipboard) {
        await navigator.clipboard.writeText(this.tvLink);
      } else {
        this.fallbackCopy(this.tvLink);
      }
      Swal.fire({
        title: 'Copiado',
        text: 'El link de la pantalla TV se copió al portapapeles.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error('Error al copiar link TV:', e);
      Swal.fire({
        title: 'No se pudo copiar',
        text: 'Copia el link manualmente desde el campo.',
        icon: 'error',
      });
    }
  }

  openEnvioConfig(): void {
    this.router.navigate(['/empresas/envio/config']);
  }

  private generateSlug(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Eliminar guiones múltiples
      .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
  }

  private buildMenuLink(empresaNombre: string, empresaId: number): string {
    const slug = this.generateSlug(empresaNombre);
    if (!slug || !Number.isFinite(empresaId) || empresaId <= 0) return '';
    if (typeof window === 'undefined') return `/menu/${empresaId}/${slug}`;
    return `${window.location.origin}/menu/${empresaId}/${slug}`;
  }

  private async generateMenuQr(): Promise<void> {
    if (!this.menuLink) return;
    try {
      this.menuQrDataUrl = await QRCode.toDataURL(this.menuLink, {
        width: 220,
        margin: 2,
        color: { dark: '#1a3a2a', light: '#ffffff' },
      });
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error generando QR:', e);
    }
  }

  downloadMenuQr(): void {
    if (!this.menuQrDataUrl) return;
    const a = document.createElement('a');
    a.href = this.menuQrDataUrl;
    a.download = 'menu-qr.png';
    a.click();
  }

  async copyMenuLink(): Promise<void> {
    if (!this.menuLink) return;

    try {
      const canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText;
      if (canUseClipboard) {
        await navigator.clipboard.writeText(this.menuLink);
      } else {
        this.fallbackCopy(this.menuLink);
      }

      Swal.fire({
        title: 'Copiado',
        text: 'El link del menú se copió al portapapeles.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error('Error al copiar link:', e);
      Swal.fire({
        title: 'No se pudo copiar',
        text: 'Copia el link manualmente desde el campo.',
        icon: 'error',
      });
    }
  }

  private fallbackCopy(value: string): void {
    if (typeof document === 'undefined') return;

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private buildImageUrl(imagen: string | undefined): string {
    if (!imagen) return '';
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen;
    const baseUrl = environment.storageUrl + '/';
    return baseUrl + imagen;
  }

  private resolveMapIfNeeded(empresa: Business): void {
    this.resolvedMapUrl = null;
    this.resolvedExternalUrl = null;
    this.displayAddress = '';

    // 1. Prioridad: nuevos campos latitud/longitud
    const latitud = empresa.latitud != null ? Number(empresa.latitud) : NaN;
    const longitud = empresa.longitud != null ? Number(empresa.longitud) : NaN;
    if (Number.isFinite(latitud) && Number.isFinite(longitud)) {
      this.currentLatitude = latitud;
      this.currentLongitude = longitud;
      const q = `${latitud},${longitud}`;
      this.resolvedMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
      );
      this.resolvedExternalUrl = `https://www.google.com/maps?q=${q}`;
      this.displayAddress = empresa.direccion || `Coordenadas: ${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
      return;
    }

    // 2. Fallback: coordenadas antiguas (lat/lng)
    const lat = empresa.lat != null ? Number(empresa.lat) : NaN;
    const lng = empresa.lng != null ? Number(empresa.lng) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.currentLatitude = lat;
      this.currentLongitude = lng;
      const q = `${lat},${lng}`;
      this.resolvedMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
      );
      this.resolvedExternalUrl = `https://www.google.com/maps?q=${q}`;
      this.displayAddress = empresa.direccion || `Coordenadas: ${lat}, ${lng}`;
      return;
    }

    const raw = (empresa.direccion || '').trim();
    if (!raw) return;

    if (/^https?:\/\//i.test(raw)) {
      // 2a. URL larga con @lat,lng embebido
      const coordMatch = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (coordMatch) {
        const q = `${coordMatch[1]},${coordMatch[2]}`;
        this.resolvedMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
        );
        this.resolvedExternalUrl = raw;
        // Extraer nombre del lugar si está en la URL
        this.displayAddress = this.extractLocationName(raw) || `Coordenadas: ${coordMatch[1]}, ${coordMatch[2]}`;
        return;
      }

      // 2b. URL larga con parámetro q= o query=
      try {
        const u = new URL(raw);
        const q = u.searchParams.get('q') || u.searchParams.get('query');
        if (q) {
          this.resolvedMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
          );
          this.resolvedExternalUrl = raw;
          this.displayAddress = decodeURIComponent(q);
          return;
        }
      } catch { /* ignorar */ }

      // 2c. URL corta (goo.gl / maps.app.goo.gl) → resolver via API
      if (/https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(raw)) {
        this.isResolvingMap = true;
        this.http
          .get<{ finalUrl: string }>('/api/maps/resolve', { params: { url: raw } })
          .subscribe({
            next: (data) => {
              const finalUrl = (data?.finalUrl || '').trim();
              this.resolvedExternalUrl = finalUrl || raw;
              if (!finalUrl) return;

              const coords = finalUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
              if (coords) {
                const q = `${coords[1]},${coords[2]}`;
                this.resolvedMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                  `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
                );
                this.displayAddress = this.extractLocationName(finalUrl) || `Coordenadas: ${coords[1]}, ${coords[2]}`;
                return;
              }
              try {
                const u = new URL(finalUrl);
                const q = u.searchParams.get('q') || u.searchParams.get('query');
                if (q) {
                  this.resolvedMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                    `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
                  );
                  this.displayAddress = decodeURIComponent(q);
                }
              } catch { /* ignorar */ }
            },
            error: () => { this.resolvedExternalUrl = raw; },
            complete: () => { this.isResolvingMap = false; },
          });
        return;
      }

      // URL que no se pudo parsear ni es corta → al menos mostrar link externo
      this.resolvedExternalUrl = raw;
      this.displayAddress = this.extractLocationName(raw) || 'Ver ubicación en el mapa';
      return;
    }

    // 3. Dirección textual → búsqueda por texto
    this.resolvedMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${encodeURIComponent(raw)}&output=embed`
    );
    this.resolvedExternalUrl = `https://www.google.com/maps?q=${encodeURIComponent(raw)}`;
    this.displayAddress = raw;
  }

  private extractLocationName(url: string): string {
    try {
      // Extraer el nombre del lugar de URLs de Google Maps
      // Formato: /place/Nombre+del+Lugar/
      const placeMatch = url.match(/\/place\/([^\/\?@]+)/);
      if (placeMatch && placeMatch[1]) {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }

      // Formato alternativo: /maps/place/Nombre+del+Lugar
      const mapsPlaceMatch = url.match(/\/maps\/place\/([^\/\?@]+)/);
      if (mapsPlaceMatch && mapsPlaceMatch[1]) {
        return decodeURIComponent(mapsPlaceMatch[1].replace(/\+/g, ' '));
      }

      // Intentar extraer del parámetro q
      const urlObj = new URL(url);
      const q = urlObj.searchParams.get('q');
      if (q) {
        return decodeURIComponent(q);
      }
    } catch (e) {
      console.error('Error extrayendo nombre de ubicación:', e);
    }
    return '';
  }

  getHorarios(): Array<{dia: string, horario: string}> {
    if (!this.empresa?.horarios) return [];
    
    const horarios = typeof this.empresa.horarios === 'string' 
      ? JSON.parse(this.empresa.horarios) 
      : this.empresa.horarios;

    const dias: Array<{key: string, label: string}> = [
      { key: 'lunes', label: 'Lunes' },
      { key: 'martes', label: 'Martes' },
      { key: 'miercoles', label: 'Miércoles' },
      { key: 'jueves', label: 'Jueves' },
      { key: 'viernes', label: 'Viernes' },
      { key: 'sabado', label: 'Sábado' },
      { key: 'domingo', label: 'Domingo' },
    ];

    return dias.map(d => {
      const info = horarios[d.key];
      if (!info || !info.is_open) {
        return { dia: d.label, horario: 'Cerrado' };
      }
      return { dia: d.label, horario: `${info.open} - ${info.close}` };
    });
  }

  openMapLocation(): void {
    if (this.currentLatitude && this.currentLongitude) {
      const url = `https://www.google.com/maps?q=${this.currentLatitude},${this.currentLongitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Swal.fire({
        title: 'Sin ubicación',
        text: 'No hay coordenadas guardadas para esta empresa.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  hasCoordinates(): boolean {
    return !!(this.currentLatitude && this.currentLongitude);
  }
}
