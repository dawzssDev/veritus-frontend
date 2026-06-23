# 🔧 Configuración Backend Laravel - Menú Público

## 📋 Endpoints Necesarios

### ✅ 1. Productos por Empresa (Ya existe)
```php
// Ya tienes esto implementado ✓
Route::get('/productos/empresa/{empresa_id}', 'App\Http\Controllers\ProductoController@productosPorEmpresa');
```

### ⚠️ 2. Información de Empresa (Necesario agregar)

Agrega este endpoint en tu `routes/api.php`:

```php
Route::get('/empresas/{id}', 'App\Http\Controllers\EmpresaController@show');
```

Y en tu `EmpresaController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    /**
     * Display the specified empresa
     */
    public function show($id)
    {
        $empresa = Empresa::find($id);

        if (!$empresa) {
            return response()->json(['error' => 'Empresa no encontrada'], 404);
        }

        // Agregar URL completa de la imagen
        $empresa->imagen_url = $empresa->imagen ? asset('storage/'.$empresa->imagen) : null;

        return response()->json([
            'success' => true,
            'data' => $empresa
        ]);
    }
}
```

---

## 🔄 Flujo de Datos

### Frontend hace 2 llamadas:

1. **GET `/api/productos/empresa/{empresa_id}`**
   - Devuelve array de productos
   - Frontend los agrupa por `categoria_id`

2. **GET `/api/empresas/{id}`**
   - Devuelve información de la empresa
   - Nombre, logo, banner, contacto, etc.

---

## 📊 Estructura Esperada de Respuestas

### Productos (Ya funciona ✓)
```json
[
  {
    "id": 1,
    "empresa_id": 1,
    "categoria_id": 1,
    "nombre": "Hamburguesa Clásica",
    "descripcion": "Carne 100% res con queso...",
    "precio": 95.00,
    "imagen": "productos/hamburguesa.jpg",
    "imagen_url": "http://localhost:8000/storage/productos/hamburguesa.jpg",
    "estado": "activo"
  },
  // ... más productos
]
```

### Empresa (Necesita implementarse)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Munchies Good Food",
    "descripcion": "Las mejores hamburguesas de la ciudad",
    "imagen": "empresas/logo.jpg",
    "imagen_url": "http://localhost:8000/storage/empresas/logo.jpg",
    "telefono": "+52 999 123 4567",
    "whatsapp": "5219991234567",
    "instagram": "@munchiesgoodfood",
    "direccion": "Calle 60 x 51, Centro",
    "horarios": "Lun-Dom: 12:00 PM - 11:00 PM",
    "estado": "activo"
  }
}
```

---

## 🎯 URLs del Menú Público

### Formato de URL
```
http://localhost:4200/menu/{empresa_id}
```

### Ejemplos
```
http://localhost:4200/menu/1   → Menú de empresa con ID 1
http://localhost:4200/menu/2   → Menú de empresa con ID 2
http://localhost:4200/menu/5   → Menú de empresa con ID 5
```

---

## 🔐 CORS (Si frontend y backend están en dominios diferentes)

En tu `config/cors.php`:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:4200',
        'https://tu-dominio-frontend.com'
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

---

## 🚀 Testing

### Test en Postman/Thunder Client

**1. Productos por empresa**
```
GET http://localhost:8000/api/productos/empresa/1
```

**2. Información de empresa**
```
GET http://localhost:8000/api/empresas/1
```

---

## 📝 Modelo Empresa (Verificar campos)

Asegúrate que tu modelo `Empresa` tenga estos campos en la migración:

```php
Schema::create('empresas', function (Blueprint $table) {
    $table->id();
    $table->string('nombre');
    $table->text('descripcion')->nullable();
    $table->string('imagen')->nullable(); // Logo/Banner
    $table->string('telefono')->nullable();
    $table->string('whatsapp')->nullable();
    $table->string('email')->nullable();
    $table->string('instagram')->nullable();
    $table->string('facebook')->nullable();
    $table->string('direccion')->nullable();
    $table->string('horarios')->nullable();
    $table->enum('estado', ['activo', 'inactivo'])->default('activo');
    $table->timestamps();
});
```

---

## ✅ Checklist de Implementación

- [ ] Crear endpoint `GET /api/empresas/{id}` en Laravel
- [ ] Verificar que devuelve `imagen_url` con la URL completa
- [ ] Probar endpoint con Postman
- [ ] Verificar que CORS está configurado
- [ ] Verificar que productos tienen `categoria_id`
- [ ] Frontend automáticamente usará estos endpoints

---

## 🎨 Nombres de Categorías (Opcional)

Si quieres mejorar los nombres de categorías, puedes:

### Opción 1: Agregar endpoint de categorías
```php
Route::get('/categorias', 'App\Http\Controllers\CategoriaController@index');
```

### Opción 2: Incluir nombre de categoría en productos
Modificar el query de productos:

```php
public function productosPorEmpresa($empresa_id)
{
    $productos = Producto::with('categoria')
        ->where('empresa_id', $empresa_id)
        ->get()
        ->map(function ($producto) {
            $producto->imagen_url = $producto->imagen ? asset('storage/'.$producto->imagen) : null;
            $producto->categoria_nombre = $producto->categoria->nombre ?? 'Sin categoría';
            return $producto;
        });

    if ($productos->isEmpty()) {
        return response()->json(['error' => 'No hay productos para esta empresa'], 404);
    }

    return response()->json($productos);
}
```

---

## 🔗 Integración desde Dashboard Admin

Para agregar links al menú público desde tu panel admin:

```typescript
// En empresa-listing.component.html
<button 
  mat-icon-button 
  [matMenuTriggerFor]="menu"
  [matTooltip]="'Ver menú público'">
  <mat-icon>visibility</mat-icon>
</button>

<mat-menu #menu="matMenu">
  <a mat-menu-item [href]="'/menu/' + empresa.id" target="_blank">
    <mat-icon>restaurant_menu</mat-icon>
    <span>Ver menú público</span>
  </a>
  <button mat-menu-item (click)="copyMenuLink(empresa.id)">
    <mat-icon>link</mat-icon>
    <span>Copiar link</span>
  </button>
</mat-menu>
```

---

## 📱 Compartir Menú con Clientes

Una vez implementado, puedes compartir:

```
WhatsApp: "Mira nuestro menú: https://tuapp.com/menu/1"
Instagram Bio: "📱 Menú digital: tuapp.com/menu/1"
Código QR: Genera QR que apunte a la URL del menú
```

---

## 🎯 Siguiente Paso

1. **Implementa el endpoint de empresa** (5 minutos)
2. **Prueba en Postman** que devuelve los datos correctos
3. **Abre el navegador**: `http://localhost:4200/menu/1`
4. **¡Listo!** Tu menú público funcionará automáticamente

---

¿Necesitas ayuda con algún paso? 🚀
