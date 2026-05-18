# Changelog SGM

## [2.6.0] — 2026-05-17
### Agregado
- Login Google OAuth via Supabase (`signInWithOAuth`)
- Pantalla de login con botón "Continuar con Google" y opción "sin cuenta"
- Auto-login: si hay sesión activa al abrir la app, salta directo a la app
- `onAuthStateChange` listener captura redirect OAuth automáticamente
- Avatar y nombre real del usuario de Google en el Topbar
- Botón "Salir" (`signOut`) en el header
- Biblioteca de consultas guardadas en ChatScreen (tab 📚)
- Botón "📌 Guardar respuesta" en cada mensaje del asistente IA
- Búsqueda por texto en la biblioteca, expansión de respuestas, eliminar
- Renderizado básico de Markdown en respuestas IA (`**bold**`, `##`, `- bullets`)

## [2.5.0] — 2026-05-17
### Agregado
- Pipeline de clientes Kanban con 5 etapas (Interesado/Cotizado/En negociación/Cerrado/Perdido)
- Tab bar por etapa con badge de cantidad, cards con borde de color
- Panel de detalle por cliente: notas, mover etapa, WhatsApp directo
- Formulario de nuevo cliente con etapa y nota inicial
- Acceso desde menú Más → "👥 Clientes"

### Corregido
- `MoreMenu` ahora muestra todos los ítems (overflow con `maxHeight: 70vh`)
- Persistencia de perfil en `localStorage` (antes se perdía en navegación interna)
- `supa` se inicializa correctamente antes de las operaciones de auth

## [2.4.0] — 2026-05-17
### Corregido
- `index.html` (fuente de producción) sincronizado con `SGM.jsx` — todas las mejoras previas no se reflejaban en deploy porque Vercel sirve el HTML inline

### Agregado
- Script PowerShell de sincronización `SGM.jsx → index.html`

## [2.3.0] — 2026-05-17
### Agregado
- Registro de compra efectiva: botón "Compré acá" en modal Comparar proveedores
- Tabla `compras` en Supabase con proveedor, material, rubro y precios
- Historial de compras en PresupScreen

## [2.2.0] — 2026-05-17
### Agregado
- Vigencia de presupuestos: badge verde/amarillo/rojo según antigüedad
- Campo `vigencia_dias INTEGER DEFAULT 30` en tabla `presupuestos`
- Lista de presupuestos guardados en PresupScreen con fecha y total

## [2.1.0] — 2026-05-17
### Agregado
- Geocodificación real con Nominatim al agregar proveedor al mapa
- Fallback a lista lateral cuando no hay coordenadas GPS
- Prompt mejorado para extracción de dirección en análisis de presupuestos

## [2.0.0] — 2026-05-17
### Agregado
- Modal "Comparar proveedores" en RubrosScreen con precios ordenados
- Badge "Incluido" en ítems del cotizador
- ErrorBoundary para capturar errores de React en producción
- MapaScreen: fetch one-shot, refresh al insertar proveedor
- Fetch de materiales desde Supabase en RubrosScreen

## [1.0.0] — inicial
### Base
- React 18 + Babel Standalone (sin bundler)
- Supabase (tablas: proveedores, presupuestos, materiales)
- Cotizador IA con Claude Sonnet
- Análisis de presupuestos PDF/imagen
- Mapa con Leaflet
- Chat IA básico
- PWA con Service Worker
- Deploy en Vercel
