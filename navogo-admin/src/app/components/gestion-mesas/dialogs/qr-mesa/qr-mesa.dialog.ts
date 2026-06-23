import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Mesa, QrData } from '../../../../models/mesa.interface';
import { MesaService } from '../../../../services/mesas/mesa.service';
import * as QRCode from 'qrcode';
import { environment } from '../../../../../environments/environment';
import { jsPDF } from 'jspdf';

interface DialogData {
  mesa: Mesa;
}

@Component({
  selector: 'app-qr-mesa-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './qr-mesa.dialog.html',
  styleUrl: './qr-mesa.dialog.scss'
})
export class QrMesaDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<QrMesaDialogComponent>);
  private data = inject<DialogData>(MAT_DIALOG_DATA);
  private mesaService = inject(MesaService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  mesa = this.data.mesa;
  qrDataUrl = signal<string>('');
  qrData = signal<QrData | null>(null);
  cargando = signal(true);
  error = signal('');
  regenerando = signal(false);

  ngOnInit() {
    this.cargarQr();
  }

  /** Reemplaza el origen del qr_url (API) por el dominio del frontend */
  private fixQrUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      const frontend = new URL(environment.frontendUrl);
      parsed.protocol = frontend.protocol;
      parsed.host = frontend.host;
      return parsed.toString();
    } catch {
      return rawUrl;
    }
  }

  cargarQr() {
    this.cargando.set(true);
    this.error.set('');

    this.mesaService.obtenerQr(this.mesa.id).subscribe({
      next: async (res) => {
        this.qrData.set(res.data);
        try {
          // Corregir dominio: backend devuelve URL del API, no del frontend
          const qrUrl = await QRCode.toDataURL(this.fixQrUrl(res.data.qr_url), {
            width: 300,
            margin: 2,
            color: {
              dark: '#1c8f46',
              light: '#ffffff'
            }
          });
          this.qrDataUrl.set(qrUrl);
          this.cargando.set(false);
        } catch (err) {
          this.error.set('Error al generar el código QR');
          this.cargando.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar el código QR');
        this.cargando.set(false);
      }
    });
  }

  async regenerarQr() {
    const confirmar = confirm(
      '¿Estás seguro de regenerar el código QR?\n\n' +
      'Los códigos QR impresos previamente dejarán de funcionar.'
    );

    if (!confirmar) return;

    this.regenerando.set(true);

    this.mesaService.regenerarQr(this.mesa.id).subscribe({
      next: async (res) => {
        this.qrData.set(res.data);
        try {
          const qrUrl = await QRCode.toDataURL(this.fixQrUrl(res.data.qr_url), {
            width: 300,
            margin: 2,
            color: {
              dark: '#1c8f46',
              light: '#ffffff'
            }
          });
          this.qrDataUrl.set(qrUrl);
          this.regenerando.set(false);
          this.snackBar.open('QR regenerado exitosamente', 'Cerrar', { duration: 3000 });
          
          // Retornar los datos actualizados al cerrar
          this.dialogRef.close(res.data);
        } catch (err) {
          this.error.set('Error al generar el nuevo código QR');
          this.regenerando.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al regenerar el código QR');
        this.regenerando.set(false);
      }
    });
  }

  async descargarPdf() {
    if (!this.qrDataUrl() || !this.qrData()) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6' // 105 x 148 mm
      });

      const pageWidth = 105;
      const pageHeight = 148;

      // Nombre del restaurante
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const restaurantName = 'Navogo Restaurant';
      const nameWidth = doc.getTextWidth(restaurantName);
      doc.text(restaurantName, (pageWidth - nameWidth) / 2, 15);

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(15, 20, pageWidth - 15, 20);

      // QR Code (centrado)
      const qrSize = 70;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 30;
      doc.addImage(this.qrDataUrl(), 'PNG', qrX, qrY, qrSize, qrSize);

      // Nombre de la mesa
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const mesaText = `Mesa ${this.mesa.identificador}`;
      const mesaWidth = doc.getTextWidth(mesaText);
      doc.text(mesaText, (pageWidth - mesaWidth) / 2, qrY + qrSize + 8);

      // Instrucción
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const instruction = 'Escanea para ver nuestro menú';
      const instructionWidth = doc.getTextWidth(instruction);
      doc.text(instruction, (pageWidth - instructionWidth) / 2, qrY + qrSize + 15);

      // URL al fondo
      doc.setFontSize(8);
      doc.setTextColor(100);
      const url = this.qrData()!.qr_url;
      const urlWidth = doc.getTextWidth(url);
      const urlText = urlWidth > (pageWidth - 20) ? url.substring(0, 50) + '...' : url;
      const finalUrlWidth = doc.getTextWidth(urlText);
      doc.text(urlText, (pageWidth - finalUrlWidth) / 2, pageHeight - 10);

      // Guardar PDF
      doc.save(`Mesa-${this.mesa.identificador}.pdf`);
      
      this.snackBar.open('PDF descargado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (err) {
      this.snackBar.open('Error al generar el PDF', 'Cerrar', { duration: 3000 });
    }
  }

  getTruncatedUrl(): string {
    const url = this.qrData()?.qr_url || '';
    return url.length > 40 ? url.substring(0, 40) + '...' : url;
  }

  cerrar() {
    this.dialogRef.close();
  }
}
