# Arquitectura SGM

## Diagrama de alto nivel

```
Browser (index.html)
  │
  ├── /api/config          → devuelve SUPABASE_URL + SUPABASE_ANON_KEY
  ├── /api/claude          → chat IA general (Claude Sonnet)
  ├── /api/cotizar         → cotizador de obra con IA
  ├── /api/presupuesto     → análisis PDF/imagen con Claude (max 60s)
  └── /api/dolar           → proxy dólar blue (DolarAPI.com)
  
  Supabase (PostgreSQL)
  ├── auth.users           → usuarios Google OAuth
  ├── proveedores
  ├── presupuestos
  ├── materiales
  ├── compras
  ├── clientes
  └── consultas_guardadas
```

---

## Tablas de Supabase

### `proveedores`
Proveedores de materiales registrados en el mapa.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Generado automáticamente |
| nombre | TEXT NOT NULL | Nombre del proveedor |
| rubro | TEXT | Especialidad o rubro principal |
| lat / lng | DOUBLE PRECISION | Coordenadas GPS (Nominatim) |
| contacto | TEXT | Teléfono, email, dirección concatenados |
| verificado | BOOLEAN | Proveedor verificado por SGM |
| created_at | TIMESTAMPTZ | Timestamp automático |

### `presupuestos`
Presupuestos analizados por la IA y guardados.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| proveedor_id | UUID → proveedores | |
| archivo_nombre | TEXT | Nombre del archivo original |
| total_usd | NUMERIC | Total en USD calculado por Claude |
| fecha | DATE | Fecha del presupuesto |
| vigencia_dias | INTEGER DEFAULT 30 | Días hasta considerarse vencido |
| created_at | TIMESTAMPTZ | Fecha de carga (usado para badge vigencia) |

**Badges de vigencia** (calculados en frontend):
- `created_at < vigencia_dias` → 🟢 Vigente
- `vigencia_dias` a `vigencia_dias + 15` días → 🟡 Por vencer
- `> vigencia_dias + 15` días → 🔴 Desactualizado

### `materiales`
Ítems individuales de cada presupuesto.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| proveedor_id | UUID → proveedores | |
| presupuesto_id | UUID → presupuestos CASCADE | |
| rubro | TEXT | Categoría (Estructura, Cerramiento, etc.) |
| item | TEXT | Descripción del material |
| precio_pesos / precio_usd | NUMERIC | Precios actuales |
| precio_anterior_usd | NUMERIC | Precio anterior (para tracking de variación) |
| created_at | TIMESTAMPTZ | |

### `compras`
Registro de compras efectivas realizadas.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| proveedor_id | UUID → proveedores | |
| proveedor_nombre | TEXT | Nombre (desnormalizado para historial) |
| material | TEXT | Nombre del ítem comprado |
| rubro | TEXT | Categoría |
| precio_usd / precio_pesos | NUMERIC | Precio al momento de la compra |
| fecha | TIMESTAMPTZ DEFAULT NOW() | |

### `clientes`
Pipeline de clientes para constructores.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| nombre | TEXT NOT NULL | |
| telefono / email | TEXT | |
| modelo | TEXT | Modelo de casa de interés |
| monto_usd | NUMERIC DEFAULT 0 | Monto cotizado |
| etapa | TEXT DEFAULT 'Interesado' | Interesado / Cotizado / En negociación / Cerrado / Perdido |
| notas | JSONB DEFAULT '[]' | Array `[{fecha, texto}]` — historial de contactos |
| ultimo_contacto | TIMESTAMPTZ | Se actualiza al agregar nota |
| created_at | TIMESTAMPTZ | |

### `consultas_guardadas`
Biblioteca de respuestas del asistente IA.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| pregunta | TEXT NOT NULL | Texto del usuario |
| respuesta | TEXT NOT NULL | Respuesta de Claude |
| tags | TEXT[] DEFAULT '{}' | Para categorización futura |
| fecha | TIMESTAMPTZ DEFAULT NOW() | |

---

## Flujo de datos principales

### Análisis de presupuesto
```
Usuario sube PDF/imagen
  → Frontend convierte a base64
  → POST /api/presupuesto {b64, mime_type, tc}
  → Claude Sonnet analiza y extrae JSON {proveedor, items[], total_usd}
  → Frontend normaliza datos
  → INSERT presupuestos + INSERT/UPDATE materiales en Supabase
  → Muestra resultado con badge de vigencia
```

### Geocodificación de proveedor
```
Dirección extraída por Claude
  → GET nominatim.openstreetmap.org/search?q=...&countrycodes=ar
  → Si falla: reintenta con solo ciudad
  → Si falla: guarda proveedor sin coordenadas GPS (aparece en lista lateral)
```

### Cotizador IA
```
Usuario completa tipo/m2/sistema/calidad
  → POST /api/cotizar
  → Claude genera desglose por rubros en USD
  → Frontend renderiza tarjeta con totales y posibilidad de PDF
```

### Google OAuth
```
Usuario toca "Continuar con Google"
  → supa.auth.signInWithOAuth({provider:'google', redirectTo: URL})
  → Redirect a Google → autenticación
  → Redirect back con hash #access_token=...
  → Supabase JS detecta el hash → dispara onAuthStateChange(SIGNED_IN)
  → Frontend setea user, setLoggedIn(true), setPhase('app')
```

---

## Módulos del frontend (SGM.jsx / index.html)

| Componente | Función |
|---|---|
| `SGMApp` | Root: fases splash/login/onboarding/app, auth, routing |
| `Topbar` | Header: nombre usuario, dólar blue, acciones |
| `BottomNav` | Navegación principal (5 tabs) |
| `MoreMenu` | Menú secundario (Rubros, Mapa, Agenda, Presupuestos, Clientes...) |
| `HomeScreen` | Dashboard con métricas y accesos rápidos |
| `CotizadorScreen` | Cotizador IA por tipo/m2/sistema |
| `ModelosScreen` | Galería de modelos con renders |
| `PresupScreen` | Upload + análisis + lista de presupuestos guardados + historial compras |
| `MapaScreen` | Mapa Leaflet con proveedores |
| `RubrosScreen` | Materiales por rubro + comparador de precios |
| `ChatScreen` | Chat con Claude + Biblioteca de consultas guardadas |
| `ClientesScreen` | Pipeline Kanban con 5 etapas |
| `AgendaScreen` | Agenda de obra |
| `StatsScreen` | Panel de estadísticas |
| `FAQScreen` | Preguntas frecuentes |

---

## Workflow de desarrollo

### Sincronizar SGM.jsx → index.html

Después de modificar `SGM.jsx`, ejecutar en PowerShell desde la raíz del proyecto:

```powershell
$html = Get-Content "index.html" -Raw -Encoding UTF8
$jsx  = Get-Content "SGM.jsx"    -Raw -Encoding UTF8
$jsx  = $jsx.TrimStart([char]0xFEFF)
$jsx  = $jsx -replace 'import\s*\{[^}]+\}\s*from\s*"react";\s*', ''
$jsx  = 'const { useState, useEffect, useRef } = React;' + "`n" + $jsx.TrimStart()
$jsx  = $jsx -replace 'export default function SGMApp', 'function SGMApp'
$renderCall = "`nReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><SGMApp /></ErrorBoundary>);"
$tag  = '<script type="text/babel">'
$idx  = $html.IndexOf($tag)
$pre  = $html.Substring(0, $idx)
$newHtml = $pre + $tag + $jsx + $renderCall + "`n</script>`n</body>`n</html>"
Set-Content "index.html" $newHtml -Encoding UTF8
```

### Por qué dos archivos

`index.html` usa React vía CDN con Babel Standalone (sin bundler). El JSX se embebe inline en un `<script type="text/babel">` usando globals (`React`, `ReactDOM`) en lugar de ESM imports. `SGM.jsx` usa la sintaxis ESM estándar (`import from "react"`) para mejor soporte de editores y linting. El script de sincronización traduce entre los dos formatos.
