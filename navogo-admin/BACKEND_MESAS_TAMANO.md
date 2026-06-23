# Actualización del Backend para soporte de dimensiones dinámicas de mesa

## 1. Migración de MySQL

Ejecuta este script SQL para reemplazar la columna `tamano` por `ancho` y `alto`:

```sql
-- Si ya existe la columna tamano, eliminarla
ALTER TABLE mesas DROP COLUMN IF EXISTS tamano;

-- Agregar columnas ancho y alto
ALTER TABLE mesas 
ADD COLUMN ancho INT NOT NULL DEFAULT 120 AFTER capacidad,
ADD COLUMN alto INT NOT NULL DEFAULT 120 AFTER ancho;
```

## 2. Migración de Laravel

Si usas Laravel migrations, crea una nueva migración:

```bash
php artisan make:migration update_mesas_table_add_dimensiones
```

Y agrega este código:

```php
public function up()
{
    Schema::table('mesas', function (Blueprint $table) {
        // Eliminar columna tamano si existe
        if (Schema::hasColumn('mesas', 'tamano')) {
            $table->dropColumn('tamano');
        }
        
        // Agregar dimensiones dinámicas
        $table->integer('ancho')->default(120)->after('capacidad');
        $table->integer('alto')->default(120)->after('ancho');
    });
}

public function down()
{
    Schema::table('mesas', function (Blueprint $table) {
        $table->dropColumn(['ancho', 'alto']);
        $table->string('tamano', 20)->default('mediana')->after('capacidad');
    });
}
```

## 3. Modelo Mesa (app/Models/Mesa.php)

Actualiza el array `$fillable` para incluir `ancho` y `alto`, y quita `tamano`:

```php
protected $fillable = [
    'identificador',
    'capacidad',
    'ancho',        // ← nuevo campo
    'alto',         // ← nuevo campo
    'zona',
    'estado',
    'posicion_x',
    'posicion_y',
    'nombreCliente',
    'tiempo_ocupada',
    'hora_reserva',
];
```

## 4. Controlador (app/Http/Controllers/MesaController.php)

### Método store()
```php
public function store(Request $request)
{
    $validated = $request->validate([
        'identificador' => 'required|string|max:50|unique:mesas',
        'capacidad' => 'required|integer|min:1|max:12',
        'ancho' => 'nullable|integer|min:80|max:300',  // ← nueva validación
        'alto' => 'nullable|integer|min:80|max:300',   // ← nueva validación
        'zona' => 'nullable|string|max:100',
        'posicion_x' => 'nullable|numeric',
        'posicion_y' => 'nullable|numeric',
    ]);

    // Valores por defecto
    $validated['ancho'] = $validated['ancho'] ?? 120;
    $validated['alto'] = $validated['alto'] ?? 120;
    $validated['estado'] = 'libre';
    $validated['posicion_x'] = $validated['posicion_x'] ?? 0;
    $validated['posicion_y'] = $validated['posicion_y'] ?? 0;

    $mesa = Mesa::create($validated);

    return response()->json([
        'data' => $mesa,
        'message' => 'Mesa creada exitosamente'
    ]);
}
```

### Método update()
```php
public function update(Request $request, $id)
{
    $mesa = Mesa::findOrFail($id);

    $validated = $request->validate([
        'identificador' => 'sometimes|string|max:50|unique:mesas,identificador,' . $id,
        'capacidad' => 'sometimes|integer|min:1|max:12',
        'ancho' => 'nullable|integer|min:80|max:300',
        'alto' => 'nullable|integer|min:80|max:300',
        'zona' => 'nullable|string|max:100',
        'nombreCliente' => 'nullable|string|max:100',
    ]);

    $mesa->update($validated);

    return response()->json([
        'data' => $mesa,
        'message' => 'Mesa actualizada exitosamente'
    ]);
}
```

### Nuevo método actualizarTamano()

Agrega este nuevo endpoint para actualizar dimensiones y posición simultáneamente:

```php
public function actualizarTamano(Request $request, $id)
{
    $mesa = Mesa::findOrFail($id);

    $validated = $request->validate([
        'ancho' => 'required|integer|min:80|max:300',
        'alto' => 'required|integer|min:80|max:300',
        'posicion_x' => 'required|numeric',
        'posicion_y' => 'required|numeric',
    ]);

    $mesa->update($validated);

    return response()->json([
        'data' => $mesa,
        'message' => 'Tamaño actualizado exitosamente'
    ]);
}
```

## 5. Rutas (routes/api.php)

Agrega la nueva ruta para actualizar tamaño:

```php
Route::patch('/mesas/{id}/tamano', [MesaController::class, 'actualizarTamano']);
```

## 6. Migrar datos existentes

Si ya tienes mesas con el campo `tamano`, ejecuta este script para convertirlas:

```sql
-- Convertir tamaños predefinidos a dimensiones
UPDATE mesas SET ancho = 90, alto = 90 WHERE tamano = 'pequena';
UPDATE mesas SET ancho = 120, alto = 120 WHERE tamano = 'mediana';
UPDATE mesas SET ancho = 160, alto = 160 WHERE tamano = 'grande';

-- Luego eliminar la columna tamano
ALTER TABLE mesas DROP COLUMN tamano;
```

## 7. Verificación

Prueba la API con estos payloads:

### Crear mesa con dimensiones por defecto (120x120)
```json
{
  "identificador": "Mesa 1",
  "capacidad": 4,
  "zona": "Interior",
  "posicion_x": 100,
  "posicion_y": 100
}
```

### Crear mesa con dimensiones personalizadas
```json
{
  "identificador": "Mesa VIP",
  "capacidad": 8,
  "ancho": 200,
  "alto": 150,
  "zona": "VIP",
  "posicion_x": 400,
  "posicion_y": 100
}
```

### Actualizar tamaño y posición
```http
PATCH /api/mesas/1/tamano
Content-Type: application/json

{
  "ancho": 160,
  "alto": 160,
  "posicion_x": 120,
  "posicion_y": 140
}
```

## Notas importantes

- **ancho** y **alto** son valores en píxeles (80-300px)
- El tamaño se ajusta en múltiplos de 20px debido al snap a cuadrícula
- El frontend ahora permite redimensionar mesas arrastrando las esquinas
- Los handles de redimensionado solo aparecen en modo edición
- El drag & drop y resize funcionan independientemente
- Las dimensiones se validan tanto en cliente como en servidor (min: 80px, max: 300px)

