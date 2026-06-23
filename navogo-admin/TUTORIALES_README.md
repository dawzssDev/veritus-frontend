# Módulo de Tutoriales

## Descripción

Módulo de tutoriales interactivos para ayudar a los usuarios a aprender a usar todas las funcionalidades de Dawz. Incluye videos paso a paso organizados por categorías y niveles de dificultad.

## Ubicación

- **Componente principal**: `src/app/tutoriales/tutoriales.component.ts`
- **Dialog de video**: `src/app/tutoriales/dialogs/tutorial-dialog.component.ts`
- **Ruta**: `/tutoriales`
- **Acceso**: Admin y Empleado (roles 1 y 2)

## Características

✅ **12 tutoriales predefinidos** organizados por módulo  
✅ **Búsqueda en tiempo real** por título, descripción o categoría  
✅ **Filtros por categoría** con contador de tutoriales  
✅ **3 niveles de dificultad**: Básico, Intermedio, Avanzado  
✅ **Preview del video** en modal full-screen  
✅ **Diseño responsive** para desktop y móvil  
✅ **Lazy loading** del componente para mejor rendimiento  
✅ **Placeholder elegante** para videos próximamente  

## Estructura de Archivos

```
src/app/tutoriales/
├── tutoriales.component.ts       # Componente principal standalone
├── tutoriales.component.html     # Template con grid de tarjetas
├── tutoriales.component.scss     # Estilos del módulo
└── dialogs/
    ├── tutorial-dialog.component.ts     # Dialog de video
    ├── tutorial-dialog.component.html   # Template del dialog
    └── tutorial-dialog.component.scss   # Estilos del dialog
```

## Interfaz Tutorial

```typescript
export interface Tutorial {
  id: number;
  titulo: string;
  descripcion: string;
  duracion: string;  // Formato "5:30"
  categoria: string;
  nivel: 'Básico' | 'Intermedio' | 'Avanzado';
  thumbnail: string | null;
  videoUrl: string | null;
  orden: number;
}
```

## Categorías Disponibles

- **Inicio** - Primeros pasos
- **Ventas** - Punto de venta
- **Mesas** - Gestión de mesas y meseros
- **Pedidos** - Dashboard de cocina y domicilio
- **Menú Digital** - Configuración del menú en línea
- **Reportes** - Análisis y exportación de datos
- **Configuración** - Usuarios, roles y multi-empresa
- **Productividad** - Trucos y atajos

## Tutoriales Incluidos

1. **Primeros pasos en Dawz** (5:30) - Básico
2. **Cómo usar el Punto de Venta** (8:15) - Básico
3. **Gestión de Mesas para Meseros** (7:45) - Básico
4. **Levantar Órdenes desde la Mesa** (6:20) - Básico
5. **Dashboard de Pedidos para Cocina** (5:00) - Básico
6. **Configurar el Menú Digital** (9:10) - Intermedio
7. **Códigos QR por Mesa** (4:45) - Intermedio
8. **Reportes y Análisis de Ventas** (6:55) - Intermedio
9. **Gestión de Usuarios y Roles** (5:15) - Avanzado
10. **Multi-Empresa: gestiona varios negocios** (7:00) - Avanzado
11. **Pedidos a Domicilio y Zonas de Envío** (8:30) - Intermedio
12. **Trucos y atajos para usar Dawz más rápido** (4:20) - Avanzado

## Cambios Realizados

### 1. Ruta Agregada (`app.routes.ts`)

```typescript
{
  path: 'tutoriales',
  loadComponent: () =>
    import('./tutoriales/tutoriales.component')
      .then(m => m.TutorialesComponent),
  canActivate: [authGuard, roleGuard],
  data: { roles: [1, 2] }
}
```

### 2. Item en Sidebar (`sidebar.component.ts`)

```typescript
{
  id: 'tutoriales',
  label: 'Tutoriales',
  icon: 'play_circle',
  route: '/tutoriales',
  roles: [1, 2] // Admin y empleado
}
```

Ubicación: Después de "Pedidos" y antes de "Empresa"

## Funcionalidades Implementadas

### Búsqueda

- Input de búsqueda en tiempo real
- Busca en: título, descripción y categoría
- Sin debounce para respuesta inmediata

### Filtros

- Chips de categoría con estilo Material Design
- Botón "Todas" para mostrar todos los tutoriales
- Contador de tutoriales por categoría
- Estado activo destacado en verde #1C8C40

### Estado Vacío

Cuando no hay resultados:
- Icono de búsqueda tachado
- Mensaje descriptivo
- Botón "Limpiar filtros" para resetear

### Tarjetas de Tutorial

Cada tarjeta incluye:
- Thumbnail o placeholder con gradiente verde oscuro
- Badge de duración con icono de reloj
- Overlay hover con icono de play
- Badge de categoría en verde
- Badge de nivel con colores distintivos:
  - Básico: verde claro (#EAF3DE)
  - Intermedio: naranja claro (#FAEEDA)
  - Avanzado: rojo claro (#FCEBEB)
- Título limitado a 2 líneas
- Descripción limitada a 2 líneas
- Footer con "Ver tutorial"

### Dialog de Video

Al hacer clic en una tarjeta:
- Se abre modal con CDK Dialog
- Header con metadata del tutorial
- Zona de video (16:9 aspect ratio)
- Placeholder elegante si no hay video:
  - Icono de biblioteca de videos
  - Mensaje "Video próximamente"
  - Duración estimada
- Descripción detallada
- 3 items de detalles con iconos
- Botón de cerrar en header y footer

## Responsive Design

### Desktop (> 768px)
- Grid de 3-4 columnas (auto-fill minmax(300px))
- Tarjetas con hover effect
- Sidebar visible
- Categorías en una sola línea

### Tablet (≤ 768px)
- Grid de 2-3 columnas (auto-fill minmax(260px))
- Gap reducido
- Tarjetas más pequeñas

### Móvil (≤ 480px)
- Grid de 1 columna
- Full width
- Tarjetas optimizadas para táctil
- Categorías con wrap

## Estilos

### Variables CSS Usadas

- `--color-text-primary`: Texto principal
- `--color-text-secondary`: Texto secundario
- `--color-text-tertiary`: Texto terciario
- `--color-background-primary`: Fondo primario
- `--color-background-secondary`: Fondo secundario
- `--color-background-tertiary`: Fondo terciario
- `--color-border-secondary`: Bordes secundarios
- `--color-border-tertiary`: Bordes terciarios

### Colores Principales

- Verde principal: `#1C8C40`
- Verde oscuro: `#0F4D2A`
- Negro oscuro: `#1A1A11`

## Datos Estáticos

Actualmente todos los tutoriales son datos estáticos dentro del componente. Para agregar videos reales en el futuro:

1. Cambiar `videoUrl: null` por la URL del video embebido
2. Cambiar `thumbnail: null` por la URL de la miniatura
3. Soporta:
   - YouTube embed: `https://www.youtube.com/embed/VIDEO_ID`
   - Vimeo embed: `https://player.vimeo.com/video/VIDEO_ID`
   - Otros servicios con iframe

## Cómo Agregar Nuevos Tutoriales

Editar el array `tutoriales` en `tutoriales.component.ts`:

```typescript
{
  id: 13,
  titulo: 'Título del nuevo tutorial',
  descripcion: 'Descripción detallada...',
  duracion: '6:30',
  categoria: 'Categoría',
  nivel: 'Básico' | 'Intermedio' | 'Avanzado',
  thumbnail: 'URL_DE_LA_MINIATURA' | null,
  videoUrl: 'URL_DEL_VIDEO' | null,
  orden: 13
}
```

## Permisos

- **Admin (roleId: 1)**: Acceso completo ✅
- **Empleado (roleId: 2)**: Acceso completo ✅

Ambos roles pueden acceder porque los tutoriales son educativos y benefician a todo el equipo.

## Dependencias

- `@angular/cdk/dialog`: Para el modal de video
- `@angular/material/icon`: Para los iconos
- `@angular/common`: Para directivas comunes

No se instalaron librerías adicionales, todo usa las dependencias existentes del proyecto.

## Testing

Para probar el módulo:

1. Iniciar sesión como Admin o Empleado
2. Click en "Tutoriales" en el sidebar
3. Buscar tutoriales por nombre
4. Filtrar por categoría
5. Hacer click en una tarjeta
6. Verificar que se abre el modal
7. Cerrar con botón o Escape

## Mejoras Futuras Sugeridas

- [ ] Conectar con backend para gestionar tutoriales dinámicamente
- [ ] Sistema de favoritos
- [ ] Marcar tutoriales como vistos
- [ ] Progreso del usuario (X de Y completados)
- [ ] Comentarios y valoraciones
- [ ] Tutoriales sugeridos según el rol
- [ ] Notificaciones de nuevos tutoriales
- [ ] Búsqueda avanzada con filtros múltiples
- [ ] Ordenar por: fecha, duración, popularidad
- [ ] Modo oscuro específico para videos
- [ ] Transcripciones de los videos
- [ ] Subtítulos opcionales
- [ ] Descargar certificado de completitud

---

**Implementado:** 14 de abril de 2026  
**Versión:** 1.0  
**Módulo:** Tutoriales  
**Estado:** ✅ Funcional - Datos estáticos  
