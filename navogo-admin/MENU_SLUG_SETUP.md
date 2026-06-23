# Configuración de Rutas por Slug para Menú Público

## 📋 Resumen de Cambios

Se ha actualizado el sistema de rutas del menú público para usar **slugs** (nombres de empresa URL-friendly) en lugar de solo IDs numéricos.

### URLs Anteriores vs Nuevas

**Antes:**
```
https://tudominio.com/menu/123
```

**Ahora:**
```
https://tudominio.com/menu/restaurante-el-buen-sazon
```

## 🔄 Flujo de Funcionamiento

### 1. Frontend - Generación de URLs

El componente `empresa-listing.ts` ahora genera URLs basadas en el nombre de la empresa:

```typescript
// Método que convierte nombres a slugs
private generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '')    // Solo letras, números, espacios, guiones
    .replace(/\s+/g, '-')             // Espacios a guiones
    .replace(/-+/g, '-')              // Evitar guiones múltiples
    .replace(/^-+|-+$/g, '');        // Eliminar guiones al inicio/final
}

// Ejemplos de conversión:
// "Restaurante El Buen Sazón" → "restaurante-el-buen-sazon"
// "Pizzería Don José" → "pizzeria-don-jose"
// "Café & Té Express" → "cafe-te-express"
```

### 2. Frontend - Enrutamiento

**Archivo:** `src/app/app.routes.ts`

```typescript
{
  path: 'menu/:slug',  // Acepta tanto IDs como slugs
  component: MenuPageComponent
}
```

### 3. Frontend - Componente MenuPage

**Archivo:** `src/app/pages/public/menu-page/menu-page.component.ts`

El componente ahora:
1. Lee el parámetro `:slug` de la URL
2. Detecta si es un número (ID) o texto (slug)
3. Llama al servicio apropiado

```typescript
ngOnInit(): void {
  this.route.params.subscribe(params => {
    const slugParam = params['slug'];
    this.empresaSlug = slugParam;
    
    // Si es número, usar como ID (compatibilidad backwards)
    const parsedId = Number(slugParam);
    if (!isNaN(parsedId) && parsedId > 0) {
      this.empresaId = parsedId;
    }
    
    this.loadMenu();
  });
}
```

### 4. Frontend - Servicio MenuService

**Archivo:** `src/app/services/menu/menu.service.ts`

Nuevos métodos agregados:

```typescript
/**
 * GET /api/getEmpresas/slug/{slug}
 * Buscar empresa por nombre (slug)
 */
getEmpresaBySlug(slug: string): Observable<Business> {
  return this.http.get<Business>(`${this.apiUrl}/getEmpresas/slug/${slug}`);
}
```

## 🚀 Backend - Endpoints Requeridos (Laravel)

### Endpoint Principal: Buscar Empresa por Slug

**Ruta:** `GET /api/getEmpresas/slug/{slug}`

**Descripción:** Busca una empresa por su nombre convertido a slug

**Ejemplo de Implementación (Laravel):**

```php
// routes/api.php
Route::get('/getEmpresas/slug/{slug}', [EmpresaController::class, 'findBySlug']);

// app/Http/Controllers/EmpresaController.php
public function findBySlug($slug)
{
    // Normalizar el slug de búsqueda
    $normalizedSlug = $this->generateSlug($slug);
    
    // Buscar empresa cuyo nombre coincida con el slug
    $empresas = Empresa::where('estatus', 1)->get();
    
    foreach ($empresas as $empresa) {
        $empresaSlug = $this->generateSlug($empresa->nombre);
        if ($empresaSlug === $normalizedSlug) {
            return response()->json([
                'id' => $empresa->id,
                'nombre' => $empresa->nombre,
                'descripcion' => $empresa->descripcion,
                'imagen' => $empresa->imagen,
                'imagen_url' => $empresa->imagen ? asset('storage/' . $empresa->imagen) : null,
                'telefono' => $empresa->telefono,
                'whatsapp' => $empresa->whatsapp,
                'instagram' => $empresa->instagram,
                'direccion' => $empresa->direccion,
                'horarios' => $empresa->horarios,
                'estatus' => $empresa->estatus,
                'pago_efectivo' => $empresa->pago_efectivo,
                'pago_tarjeta' => $empresa->pago_tarjeta,
                'pago_transferencia' => $empresa->pago_transferencia,
                'titular' => $empresa->titular,
                'banco' => $empresa->banco,
                'clabe' => $empresa->clabe,
            ]);
        }
    }
    
    return response()->json(['error' => 'Empresa no encontrada'], 404);
}

private function generateSlug($text)
{
    $text = mb_strtolower($text, 'UTF-8');
    $text = preg_replace('/[áàäâ]/u', 'a', $text);
    $text = preg_replace('/[éèëê]/u', 'e', $text);
    $text = preg_replace('/[íìïî]/u', 'i', $text);
    $text = preg_replace('/[óòöô]/u', 'o', $text);
    $text = preg_replace('/[úùüû]/u', 'u', $text);
    $text = preg_replace('/[ñ]/u', 'n', $text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/\s+/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    $text = trim($text, '-');
    return $text;
}
```

### Optimización: Agregar Campo `slug` a la Base de Datos (Opcional)

Para mejor rendimiento, puedes agregar un campo `slug` a la tabla `empresas`:

```sql
ALTER TABLE empresas ADD COLUMN slug VARCHAR(255) UNIQUE AFTER nombre;
```

```php
// Al crear/actualizar empresa, generar slug automáticamente
class Empresa extends Model
{
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($empresa) {
            if ($empresa->isDirty('nombre')) {
                $empresa->slug = static::generateSlug($empresa->nombre);
            }
        });
    }
    
    private static function generateSlug($text)
    {
        // ... mismo código de generateSlug
    }
}

// Entonces la búsqueda sería más eficiente:
public function findBySlug($slug)
{
    $empresa = Empresa::where('slug', $slug)
                      ->where('estatus', 1)
                      ->firstOrFail();
    
    return response()->json($empresa);
}
```

## 📝 Casos de Uso

### 1. Usuario comparte link del menú

```javascript
// Admin copia link desde dashboard
Link copiado: "https://tudominio.com/menu/restaurante-el-buen-sazon"

// Cliente hace clic en el link
→ Llega a MenuPageComponent
→ Lee slug: "restaurante-el-buen-sazon"
→ Llama a getEmpresaBySlug("restaurante-el-buen-sazon")
→ Backend busca empresa con nombre "Restaurante El Buen Sazón"
→ Retorna datos + ID
→ Carga productos usando ID
```

### 2. Compatibilidad con IDs antiguos

```javascript
// Links antiguos siguen funcionando
Link antiguo: "https://tudominio.com/menu/123"

→ Llega a MenuPageComponent
→ Detecta que "123" es número
→ Usa getEmpresaById(123)
→ Carga normalmente
```

### 3. Navegación desde carrito

```javascript
// Usuario regresa del carrito al menú
→ CartPage lee localStorage: "last_menu_empresa_slug"
→ Navega a /menu/{slug}
→ Menú se carga correctamente
```

## ✅ Ventajas del Sistema por Slug

1. **URLs amigables**: Fáciles de recordar y compartir
2. **SEO mejorado**: Los buscadores indexan mejor URLs descriptivas
3. **Branding**: El nombre de la empresa visible en la URL
4. **Compatibilidad**: Los IDs antiguos siguen funcionando
5. **Experiencia de usuario**: URLs más profesionales

## 🧪 Testing

### Frontend

```bash
# Probar con slug
http://localhost:4200/menu/restaurante-el-buen-sazon

# Probar con ID (compatibilidad)
http://localhost:4200/menu/1

# Probar desde dashboard → copiar link → pegar en navegador
```

### Backend

```bash
# Endpoint por slug
curl http://localhost:8000/api/getEmpresas/slug/restaurante-el-buen-sazon

# Endpoint por ID (existente)
curl http://localhost:8000/api/getEmpresas/1
```

## 🔧 Configuración Necesaria

### 1. Frontend (Ya implementado ✅)

- [x] Actualizar `app.routes.ts` para usar `:slug`
- [x] Actualizar `MenuPageComponent` para manejar slugs
- [x] Agregar método `getEmpresaBySlug()` en `MenuService`
- [x] Actualizar `empresa-listing.ts` con método `generateSlug()`
- [x] Actualizar `CartPageComponent` para usar slugs

### 2. Backend (Pendiente ⚠️)

- [ ] Crear endpoint `GET /api/getEmpresas/slug/{slug}`
- [ ] Implementar método `findBySlug()` en `EmpresaController`
- [ ] Agregar función `generateSlug()` en PHP
- [ ] (Opcional) Agregar columna `slug` a tabla `empresas`
- [ ] (Opcional) Crear índice único en columna `slug`

### 3. Testing

- [ ] Probar búsqueda por slug en backend
- [ ] Verificar que IDs antiguos sigan funcionando
- [ ] Probar flujo completo: dashboard → copiar link → abrir menú
- [ ] Probar caracteres especiales (acentos, ñ, símbolos)

## 📌 Notas Importantes

1. **Normalización consistente**: El mismo algoritmo de slug debe usarse en frontend y backend
2. **Unicidad**: Dos empresas con nombres similares podrían generar el mismo slug
3. **Cache**: Considera cachear la relación slug → empresa_id para mejorar performance
4. **Migración**: Los links antiguos con IDs seguirán funcionando (backwards compatibility)

## 🆘 Troubleshooting

### Problema: Empresa no encontrada por slug

**Solución**: Verificar que el algoritmo de `generateSlug()` en PHP sea idéntico al de TypeScript

### Problema: Slugs duplicados

**Solución**: Implementar lógica para agregar sufijos numéricos:
- "restaurante-1", "restaurante-2", etc.

### Problema: Performance lento en búsqueda

**Solución**: Agregar columna `slug` indexada en la base de datos
