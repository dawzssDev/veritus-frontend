import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Business, Category, Product } from '../../models/business.interface';
import { Sucursal } from '../../sucursales/sucursal.interface';
import { environment } from '../../../environments/environment';

/**
 * SERVICIO PARA OBTENER DATOS DEL MENÚ PÚBLICO
 * Endpoint esperado: GET /api/menu/{slug}
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = environment.apiUrl; // Cambiar en producción

  constructor(private http: HttpClient) {}

  /**
   * Obtener productos por empresa_id
   */
  getProductosByEmpresa(empresa_id: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/productos/empresa/${empresa_id}`).pipe(
      map(productos => {
        console.log('✅ Productos obtenidos:', productos.length, 'productos');
        return productos;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo productos:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener información de la empresa por slug (nombre convertido a URL-friendly)
   */
  getEmpresaBySlug(slug: string): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/getEmpresas/slug/${slug}`).pipe(
      map(response => {
        console.log('✅ Empresa obtenida por slug:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo empresa por slug:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener información de la empresa
   */
  getEmpresaById(empresa_id: number): Observable<Business> {
    return this.http.get<Business>(`${this.apiUrl}/getEmpresas/${empresa_id}`).pipe(
      map(response => {
        console.log('✅ Empresa obtenida:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo empresa:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener menú completo (empresa + productos sin categorías)
   */
  getMenuByEmpresaId(empresa_id: number): Observable<Business> {
    console.log('🔄 Cargando menú para empresa:', empresa_id);
    return this.getProductosByEmpresa(empresa_id).pipe(
      map(productos => {
        console.log('🔄 Procesando productos...');
        // Agrupar productos por categoría (string)
        const grouped = new Map<string, Product[]>();
        for (const p of productos) {
          const raw = (p as any)?.categoria;
          const name = (raw ?? '').toString().trim() || 'Sin categoría';
          const list = grouped.get(name) ?? [];
          list.push(p);
          grouped.set(name, list);
        }

        const sortedNames = Array.from(grouped.keys()).sort((a, b) =>
          a.localeCompare(b, 'es', { sensitivity: 'base' })
        );

        const categorias: Category[] = sortedNames.map((name, index) => ({
          id: index + 1,
          nombre: name,
          orden: index + 1,
          productos: grouped.get(name) ?? []
        }));

        // Crear objeto Business simplificado
        const business: Business = {
          id: empresa_id,
          slug: `empresa-${empresa_id}`,
          nombre: 'Cargando...', // Se actualizará con getEmpresaById
          descripcion: '',
          estado: 'activo',
          categorias
        };

        console.log('✅ Menú procesado:', business);
        return business;
      }),
      catchError(error => {
        console.error('❌ Error en getMenuByEmpresaId:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener sucursales públicas de una empresa (sin autenticación)
   */
  getSucursalesByEmpresaId(empresaId: number): Observable<Sucursal[]> {
    return this.http.get<{ data: Sucursal[] }>(
      `${this.apiUrl}/sucursales/empresa/${empresaId}`
    ).pipe(
      map(res => res.data ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * Helper para nombres de categorías
   * TODO: Obtener desde un endpoint de categorías
   */
  private getCategoryName(categoria_id: number): string {
    const categoryNames: { [key: number]: string } = {
      1: '🍔 Hamburguesas',
      2: '🥤 Bebidas',
      3: '🍟 Acompañamientos',
      4: '🍕 Pizzas',
      5: '🌮 Tacos',
      6: '🍰 Postres'
    };
    return categoryNames[categoria_id] || `Categoría ${categoria_id}`;
  }

  /**
   * MOCK DATA - Usar mientras se conecta backend
   * Eliminar cuando Laravel esté listo
   */
  getMockBusinessBySlug(slug: string): Observable<Business> {
    // Simular delay de red
    return new Observable(observer => {
      setTimeout(() => {
        const mockData = this.getMockData(slug);
        if (mockData) {
          observer.next(mockData);
          observer.complete();
        } else {
          observer.error({ status: 404, message: 'Negocio no encontrado' });
        }
      }, 800);
    });
  }

  private getMockData(slug: string): Business | null {
    const businesses: { [key: string]: Business } = {
      'munchiesgoodfood': {
        id: 1,
        slug: 'munchiesgoodfood',
        nombre: 'Munchies Good Food',
        descripcion: 'Las mejores hamburguesas y bebidas artesanales de la ciudad. Ingredientes frescos, sabor único.',
        logo: 'https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?w=200',
        banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200',
        telefono: '+52 999 123 4567',
        whatsapp: '5219991234567',
        instagram: '@munchiesgoodfood',
        horarios: 'Lun-Dom: 12:00 PM - 11:00 PM',
        direccion: 'Calle 60 x 51, Centro, Mérida, Yucatán',
        estado: 'activo',
        categorias: [
          {
            id: 1,
            nombre: '🍔 Hamburguesas',
            descripcion: 'Nuestras especialidades',
            orden: 1,
            productos: [
              {
                id: 1,
                categoria_id: 1,
                nombre: 'Classic Burger',
                descripcion: 'Carne 100% res, lechuga, tomate, cebolla, pepinillos y salsa especial',
                precio: 95,
                imagen_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
                estado: 'activo',
                destacado: true
              },
              {
                id: 2,
                categoria_id: 1,
                nombre: 'Bacon Cheese Burger',
                descripcion: 'Doble carne, doble queso cheddar, tocino crujiente y salsa BBQ',
                precio: 125,
                imagen_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
                estado: 'activo',
                destacado: true
              },
              {
                id: 3,
                categoria_id: 1,
                nombre: 'Veggie Delight',
                descripcion: 'Hamburguesa vegetariana de quinoa, espinacas y champiñones',
                precio: 89,
                imagen_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400',
                estado: 'activo'
              }
            ]
          },
          {
            id: 2,
            nombre: '🥤 Bebidas',
            descripcion: 'Refrescantes y naturales',
            orden: 2,
            productos: [
              {
                id: 4,
                categoria_id: 2,
                nombre: 'Limonada Natural',
                descripcion: 'Limón fresco, hierbabuena y un toque de jengibre',
                precio: 35,
                imagen_url: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9f?w=400',
                estado: 'activo'
              },
              {
                id: 5,
                categoria_id: 2,
                nombre: 'Smoothie de Fresa',
                descripcion: 'Fresas frescas, yogurt griego y miel',
                precio: 45,
                imagen_url: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',
                estado: 'activo'
              },
              {
                id: 6,
                categoria_id: 2,
                nombre: 'Café Americano',
                descripcion: 'Café de especialidad 100% arábica',
                precio: 30,
                imagen_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
                estado: 'activo'
              }
            ]
          },
          {
            id: 3,
            nombre: '🍟 Acompañamientos',
            orden: 3,
            productos: [
              {
                id: 7,
                categoria_id: 3,
                nombre: 'Papas Francesas',
                descripcion: 'Crujientes papas fritas con sal de mar',
                precio: 35,
                imagen_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
                estado: 'activo'
              },
              {
                id: 8,
                categoria_id: 3,
                nombre: 'Aros de Cebolla',
                descripcion: 'Aros empanizados con salsa ranch',
                precio: 45,
                imagen_url: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400',
                estado: 'activo'
              }
            ]
          }
        ]
      },
      'testrestaurant': {
        id: 2,
        slug: 'testrestaurant',
        nombre: 'Test Restaurant',
        descripcion: 'Negocio de prueba',
        estado: 'activo',
        categorias: []
      }
    };

    return businesses[slug] || null;
  }

  /**
   * Formatear precio a moneda
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }

  /**
   * Abrir WhatsApp con mensaje predefinido
   */
  openWhatsApp(phone: string, message: string = ''): void {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  }
}
