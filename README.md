# Charcutería Norato

Primera versión web de **Sol y Mesa**, la propuesta pública de Charcutería Norato.

## Estado

Esta versión es una landing estática limpia, preparada para desplegarse en Vercel y convertirse progresivamente en una PWA con catálogo, pedidos y administración. Las otras propuestas visuales permanecen fuera de este repositorio.

## Desarrollo local

No requiere build para esta primera versión. Desde esta carpeta:

```bash
python -m http.server 8766
```

Abrir `http://127.0.0.1:8766/`.

## Rutas

- `/` — Sol y Mesa
- `/picante/` — variedad Picante
- `/jamonado/` — variedad Jamonado
- `/cervecero-ahumado/` — variedad Cervecero ahumado

## Roadmap

1. **Base privada/pública y despliegue:** repositorio limpio, Vercel, dominio de revisión y PWA base.
2. **Catálogo:** productos, variedades, disponibilidad y precios administrables desde Supabase.
3. **Pedidos:** datos del comprador, dirección, teléfono, detalle del pedido y confirmación.
4. **Administración:** autenticación, productos, precios, pedidos, clientes y auditoría.
5. **Producción:** privacidad, RLS, backups, pruebas móviles y dominio definitivo.

## Datos y seguridad

La migración inicial de Supabase está en `supabase/migrations/001_initial.sql`. No se incluyen credenciales, datos reales ni claves de servicio. Las variables locales deben copiarse desde `.env.example` y nunca confirmarse en Git.

Los textos sobre ingredientes, fuego, lotes y proceso deben validarse antes de convertirlos en claims comerciales definitivos.
