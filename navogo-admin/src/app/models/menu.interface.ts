/**
 * Interface para definir items del menú del sidebar
 */
export interface MenuItem {
  /** Identificador único del item */
  id: string;
  
  /** Texto visible del menú */
  label: string;
  
  /** Nombre del ícono (Material Icons) */
  icon: string;
  
  /** Ruta de navegación */
  route?: string;
  
  /** Items hijos (para submenús) */
  children?: MenuItem[];
  
  /** Roles permitidos (opcional, para control de acceso) - roleIds: 1 = Admin, 2 = Empleado */
  roles?: number[];
  
  /** Badge o contador (opcional) */
  badge?: number | string;
  
  /** Color del badge */
  badgeColor?: 'primary' | 'accent' | 'warn';
  
  /** Si está deshabilitado */
  disabled?: boolean;

  /** Si está bloqueado (próximamente) */
  locked?: boolean;
  
  /** Si el submenú está expandido (uso interno) */
  expanded?: boolean;
}
