import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface Tutorial {
  id: number;
  titulo: string;
  descripcion: string;
  duracion: string;
  categoria: string;
  nivel: 'Básico' | 'Intermedio' | 'Avanzado';
  thumbnail: string | null;
  videoUrl: string | null;
  orden: number;
}

@Component({
  selector: 'app-tutoriales',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './tutoriales.component.html',
  styleUrl: './tutoriales.component.scss',
})
export class TutorialesComponent {
  readonly modulos = [
    { icon: 'point_of_sale',    label: 'Punto de Venta'   },
    { icon: 'table_restaurant', label: 'Gestión de Mesas' },
    { icon: 'receipt_long',     label: 'Pedidos'          },
    { icon: 'bar_chart',        label: 'Ventas y Reportes' },
    { icon: 'tv',               label: 'Menú Digital TV'  },
    { icon: 'event_available',  label: 'Reservas'         },
    { icon: 'point_of_sale',    label: 'Corte de Caja'   },
    { icon: 'settings',         label: 'Configuración'   },
  ];
}
