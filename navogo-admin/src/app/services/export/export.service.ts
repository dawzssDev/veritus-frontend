import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  /**
   * Exporta datos a un archivo Excel (.xlsx)
   * @param data      Array de objetos a exportar
   * @param columns   Definición de columnas { header, key }
   * @param fileName  Nombre del archivo (sin extensión)
   */
  exportToExcel(data: any[], columns: ExportColumn[], fileName: string): void {
    const rows = data.map((row) => {
      const obj: Record<string, any> = {};
      for (const col of columns) {
        obj[col.header] = this.resolveValue(row, col.key);
      }
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Ajustar ancho de columnas automáticamente
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.header.length, ...rows.map((r) => String(r[col.header] ?? '').length)) + 2,
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Exporta datos a un archivo PDF
   * @param data      Array de objetos a exportar
   * @param columns   Definición de columnas { header, key }
   * @param fileName  Nombre del archivo (sin extensión)
   * @param title     Título que aparece en la cabecera del PDF
   */
  exportToPDF(data: any[], columns: ExportColumn[], fileName: string, title: string): void {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Título
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text(title, 14, 16);

    // Fecha de generación
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`,
      14,
      22
    );

    const headers = columns.map((c) => c.header);
    const rows = data.map((row) => columns.map((col) => String(this.resolveValue(row, col.key) ?? '-')));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [45, 106, 79], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 245] },
      tableLineColor: [220, 220, 220],
      tableLineWidth: 0.1,
    });

    doc.save(`${fileName}.pdf`);
  }

  private resolveValue(obj: any, key: string): any {
    // Soporta rutas anidadas: "direccion.calle"
    return key.split('.').reduce((acc, k) => (acc != null ? acc[k] : null), obj);
  }
}
