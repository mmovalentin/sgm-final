# Roadmap SGM

## Prioridad Alta

### Autenticación
- [ ] Asociar datos de Supabase al `user_id` de auth (presupuestos, clientes, compras, consultas)
- [ ] Políticas RLS por usuario (actualmente los grants son abiertos a `anon`)
- [ ] Página de perfil de usuario con datos de Google + perfil SGM

### Pipeline de clientes
- [ ] Editar datos de un cliente existente (nombre, teléfono, monto)
- [ ] Filtro por etapa en la vista de lista
- [ ] Exportar lista de clientes a CSV

### Presupuestos
- [ ] Reenviar presupuesto por WhatsApp directo desde la app
- [ ] Comparar dos presupuestos del mismo rubro side-by-side
- [ ] Notificación cuando un presupuesto pasa a "Por vencer"

---

## Prioridad Media

### Mapa de proveedores
- [ ] Filtro por rubro en el mapa
- [ ] Calificación de proveedores (1-5 estrellas)
- [ ] Foto del local / foto de producto

### Cotizador IA
- [ ] Guardar cotizaciones en Supabase asociadas al usuario
- [ ] Historial de cotizaciones con comparación de precios
- [ ] Exportar cotización como PDF con logo SGM

### Asistente IA / Biblioteca
- [ ] Tags funcionales para categorizar consultas guardadas
- [ ] Filtro por tag en la biblioteca
- [ ] Compartir respuesta por WhatsApp

### Rubros
- [ ] Agregar material manualmente (sin subir presupuesto)
- [ ] Editar precio de un material
- [ ] Historial de variación de precios por ítem

---

## Prioridad Baja / Ideas

### General
- [ ] Modo oscuro
- [ ] Notificaciones push (PWA)
- [ ] Agenda con recordatorios reales (integración calendario)
- [ ] Panel de estadísticas con datos reales de Supabase (actualmente placeholders)

### Expansión
- [ ] Multi-obra: asociar presupuestos y clientes a una obra específica
- [ ] Módulo de proveedores verificados con suscripción
- [ ] App nativa (React Native) usando la misma API

---

## Completado

- [x] Análisis de presupuestos PDF/imagen con Claude
- [x] Geocodificación de proveedores con Nominatim
- [x] Mapa interactivo con Leaflet
- [x] Comparador de precios por rubro y proveedor
- [x] Vigencia de presupuestos con badges (verde/amarillo/rojo)
- [x] Registro de compras efectivas ("Compré acá")
- [x] Historial de compras en PresupScreen
- [x] Pipeline de clientes Kanban (5 etapas)
- [x] Historial de contactos con notas por cliente
- [x] Chat IA con Claude + biblioteca de consultas guardadas
- [x] Renderizado markdown en respuestas IA
- [x] Login Google OAuth con Supabase
- [x] Persistencia de sesión (auto-login)
- [x] Avatar y nombre de Google en el header
