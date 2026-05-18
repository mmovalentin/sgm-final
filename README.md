# SGM — Sistema de Gestión de Materiales

Aplicación web mobile-first para gestión de obras, presupuestos y proveedores de construcción en Córdoba, Argentina. Orientada a constructores, profesionales y clientes que trabajan con Steel Frame.

🌐 **Producción:** [sgm-final.vercel.app](https://sgm-final.vercel.app)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 (JSX inline via Babel Standalone, sin bundler) |
| Backend / API | Vercel Serverless Functions (Node.js) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Google OAuth |
| IA | Claude API (Anthropic) — análisis de presupuestos y chat |
| Mapa | Leaflet.js + Nominatim (geocoding) |
| Dólar | DolarAPI.com (tipo de cambio blue en tiempo real) |
| Deploy | Vercel (CI/CD automático desde GitHub) |

---

## Estructura de carpetas

```
sgm-final/
├── index.html          # App completa (JSX inline, fuente de producción)
├── SGM.jsx             # Fuente de desarrollo (se sincroniza a index.html)
├── sw.js               # Service Worker (PWA)
├── manifest.json       # Web App Manifest
├── vercel.json         # Configuración de Vercel y funciones serverless
├── package.json
│
├── api/                # Serverless Functions (Vercel)
│   ├── claude.js       # Chat IA general
│   ├── cotizar.js      # Cotizador de obras con IA
│   ├── presupuesto.js  # Análisis de presupuestos PDF/imagen con Claude
│   ├── config.js       # Devuelve credenciales Supabase al frontend
│   ├── dolar.js        # Proxy tipo de cambio blue
│   └── init-db.js      # Inicialización de tablas en Supabase (uso único)
│
├── docs/               # Documentación técnica
│   ├── ARQUITECTURA.md
│   ├── ROADMAP.md
│   └── CHANGELOG.md
│
└── sql/
    └── init.sql        # Todos los CREATE TABLE y políticas RLS
```

> **Importante:** `index.html` es el archivo servido en producción con todo el JSX embebido. `SGM.jsx` es el archivo de desarrollo. Después de cada cambio en `SGM.jsx`, sincronizar a `index.html` con el script PowerShell documentado en `docs/ARQUITECTURA.md`.

---

## Variables de entorno

Configurar en Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic (Claude) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave anon pública de Supabase |
| `SUPABASE_ACCESS_TOKEN` | Token de acceso personal (solo para `init-db`) |

---

## Cómo correr en local

```bash
# 1. Clonar el repositorio
git clone https://github.com/mmovalentin/sgm-final.git
cd sgm-final

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
cp .env.example .env.local
# Completar con las variables reales

# 4. Correr en local con Vercel CLI
npx vercel dev
```

La app queda disponible en `http://localhost:3000`.

> Sin `vercel dev`, abrir `index.html` directamente en el browser funciona para el frontend, pero las llamadas a `/api/*` no van a funcionar.

---

## Autenticación

El login usa **Google OAuth via Supabase**. Para configurarlo:

1. Supabase Dashboard → Authentication → Providers → Google → Habilitar
2. Agregar `https://sgm-final.vercel.app` en Redirect URLs
3. Configurar OAuth credentials en Google Cloud Console

---

## Módulos principales

- **Cotizador IA** — genera presupuesto en USD por tipo/m2/sistema/calidad
- **Presupuestos** — sube PDF o foto, Claude extrae ítems y precios
- **Mapa de proveedores** — Leaflet con geocoding Nominatim
- **Rubros** — materiales por categoría, comparador de precios por proveedor
- **Pipeline de clientes** — Kanban con 5 etapas, historial de contactos
- **Asistente IA** — chat + biblioteca de consultas guardadas
- **Historial de compras** — registro de compras efectivas por proveedor
