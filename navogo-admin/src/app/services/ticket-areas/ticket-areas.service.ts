import { Injectable } from '@angular/core';

export interface ItemOrden {
  name: string;
  quantity: number;
  nota?: string;
  selections?: unknown;
  categoria?: string;
  area_impresion_id?: number | null;
}

export interface DatosTicketArea {
  numeroOrden: number | string;
  mesa?: string;
  tipoServicio: 'local' | 'recoger' | 'domicilio';
  items: ItemOrden[];
  areas: {
    id: number;
    nombre: string;
  }[];
  mapaCategoriaArea: Record<number, number>;
  mapaCategorias: Record<number, string>;
  horaConfirmacion?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketAreasService {

  imprimirTicketsDeArea(datos: DatosTicketArea): void {
    if (datos.tipoServicio !== 'local') return;

    const itemsPorArea = this.agruparPorArea(datos);
    const areas = Object.entries(itemsPorArea);
    if (areas.length === 0) return;

    areas.forEach(([areaId, { areaNombre, items }], index) => {
      setTimeout(() => {
        this.abrirTicketArea(
          areaNombre,
          items,
          datos.numeroOrden,
          datos.mesa,
          datos.horaConfirmacion
        );
      }, index * 600);
    });
  }

  private agruparPorArea(
    datos: DatosTicketArea
  ): Record<string, { areaNombre: string; items: ItemOrden[] }> {
    const resultado: Record<
      string,
      { areaNombre: string; items: ItemOrden[] }
    > = {};

    for (const item of datos.items) {
      let areaId: number | null = null;
      let areaNombre = '';

      if (item.area_impresion_id) {
        areaId = item.area_impresion_id;
        const area = datos.areas.find(
          a => a.id === areaId
        );
        areaNombre = area?.nombre ?? 'Sin área';
      }

      if (!areaId) continue;

      const key = String(areaId);
      if (!resultado[key]) {
        resultado[key] = {
          areaNombre,
          items: [],
        };
      }
      resultado[key].items.push(item);
    }

    return resultado;
  }

  private abrirTicketArea(
    areaNombre: string,
    items: ItemOrden[],
    numeroOrden: number | string,
    mesa?: string,
    hora?: string
  ): void {
    const ventana = window.open(
      '', '_blank', 'width=380,height=500'
    );
    if (!ventana) return;

    const horaStr = hora
      ? new Date(hora).toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit',
          hour12: true,
        })
      : new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit',
          hour12: true,
        });

    const filasItems = items.map(item => {
      const comps = Array.isArray(item.selections)
        ? item.selections
            .filter((s: any) =>
              s.groupTitle?.toLowerCase() !== 'nota'
            )
            .map((s: any) => s.extra ?? '')
            .filter(Boolean)
            .join(', ')
        : '';

      const nota = Array.isArray(item.selections)
        ? (item.selections.find((s: any) =>
            s.groupTitle?.toLowerCase() === 'nota'
          )?.extra ?? item.nota ?? '')
        : (item.nota ?? '');

      return `
        <tr>
          <td class="qty">${item.quantity}</td>
          <td class="nombre">
            <strong>${item.name}</strong>
            ${comps
              ? `<div class="comps">${comps}</div>`
              : ''}
            ${nota
              ? `<div class="nota">📌 ${nota}</div>`
              : ''}
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${areaNombre} — #${numeroOrden}</title>
        <style>
          * { margin:0; padding:0;
              box-sizing:border-box; }
          body {
            font-family: 'Courier New',
              Courier, monospace;
            font-size: 14px;
            color: #000;
            width: 80mm;
            margin: 0 auto;
            padding: 10px 6px;
            background: white;
          }
          .header {
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 3px solid #000;
            margin-bottom: 10px;
          }
          .area-badge {
            display: inline-block;
            background: #000;
            color: white;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
            padding: 4px 14px;
            border-radius: 3px;
            margin-bottom: 8px;
          }
          .orden-num {
            font-size: 42px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -2px;
          }
          .orden-label {
            font-size: 11px;
            color: #555;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .mesa-info {
            font-size: 16px;
            font-weight: 700;
            margin-top: 4px;
          }
          .hora {
            font-size: 11px;
            color: #555;
          }
          .sep {
            border: none;
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .titulo-cols {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #555;
            padding-bottom: 4px;
            border-bottom: 1px solid #000;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .qty {
            width: 30px;
            font-size: 18px;
            font-weight: 900;
            vertical-align: top;
            padding: 8px 0;
            color: #000;
          }
          .nombre {
            font-size: 14px;
            font-weight: 700;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
            line-height: 1.3;
          }
          .comps {
            font-size: 11px;
            color: #444;
            font-weight: 400;
            margin-top: 2px;
          }
          .nota {
            font-size: 11px;
            color: #854F0B;
            font-style: italic;
            font-weight: 400;
            margin-top: 2px;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 2px dashed #000;
            font-size: 10px;
            color: #888;
            letter-spacing: 0.05em;
          }
          @media print {
            body { width: 80mm; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="area-badge">${areaNombre}</div>
          <p class="orden-label">Orden</p>
          <p class="orden-num">#${numeroOrden}</p>
          ${mesa
            ? `<p class="mesa-info">Mesa ${mesa}</p>`
            : ''}
          <p class="hora">${horaStr}</p>
        </div>

        <div class="titulo-cols">
          <span>CANT</span>
          <span>PRODUCTO</span>
        </div>

        <table>
          <tbody>${filasItems}</tbody>
        </table>

        <div class="footer">
          PREPARAR CON PRIORIDAD
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    ventana.document.write(html);
    ventana.document.close();
  }
}
