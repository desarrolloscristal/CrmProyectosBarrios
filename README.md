# Cristal Desarrollos · Sistema de gestión de lotes

Sistema SaaS para la comercialización de lotes en emprendimientos inmobiliarios. Versión inicial con **Nuevo San Vicente** (28 manzanas, 644 lotes).

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Tailwind CSS** + **lucide-react**
- **Vercel** para hosting

## Requisitos

- Node.js 18+
- Cuenta gratuita en [Supabase](https://supabase.com)
- Cuenta gratuita en [Vercel](https://vercel.com)
- Cuenta de [GitHub](https://github.com)

---

## Setup local

### 1) Clonar e instalar
```bash
git clone https://github.com/TU-USUARIO/cristal-desarrollos.git
cd cristal-desarrollos
npm install
```

### 2) Crear proyecto en Supabase
1. Entrá a https://supabase.com → **New project**.
2. Elegí región **South America (São Paulo)** (más cerca de Argentina).
3. Anotá el password de la BD.
4. Cuando esté listo, ir a **Settings → API** y copiar:
   - `Project URL`
   - `anon public` key
   - `service_role` key

### 3) Cargar el schema
1. En Supabase, ir a **SQL Editor → New query**.
2. Pegar todo el contenido de `supabase/schema.sql`.
3. Ejecutar (Run). Crea tablas, RLS, vista y siembra las 28 manzanas con 644 lotes.

### 4) Configurar variables de entorno
```bash
cp .env.example .env.local
```
Editar `.env.local` con los datos de Supabase.

### 5) Crear el primer admin
En Supabase: **Authentication → Users → Add user → Create new user**.
- Email: `admin@cristal.com`
- Password: la que quieras
- ✅ Auto Confirm User

Después en **SQL Editor**:
```sql
UPDATE profiles SET role = 'admin', full_name = 'Admin Cristal' WHERE email = 'admin@cristal.com';
```

### 6) Levantar el server local
```bash
npm run dev
```
Abrir http://localhost:3000 → te redirige a `/login`. Ingresá con el admin.

---

## Deploy a producción (Vercel)

### 1) Subir a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create cristal-desarrollos --private --push
```
(o creá el repo manualmente en GitHub y `git push`)

### 2) Conectar con Vercel
1. https://vercel.com/new → importar el repo de GitHub.
2. Framework: **Next.js** (auto-detectado).
3. En **Environment Variables** agregar las 3 de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Deploy**.

En 2 minutos tenés la URL pública (ej: `cristal-desarrollos.vercel.app`).

### 3) Cada cambio futuro
```bash
git add . && git commit -m "..." && git push
```
Vercel detecta el push y redeploya automáticamente.

---

## Estructura de carpetas

```
src/
├── app/
│   ├── api/
│   │   ├── lots/[id]/route.ts    # PATCH para cambiar estado de lote
│   │   └── logout/route.ts
│   ├── dashboard/page.tsx         # Vista principal del vendedor
│   ├── login/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                   # Redirige a /dashboard
│   └── globals.css
├── components/
│   ├── Header.tsx                 # Header con logo y user
│   ├── Masterplan.tsx             # SVG interactivo del plano
│   └── LotDetail.tsx              # Panel de detalle del lote
├── lib/
│   ├── blocks.ts                  # Definición geométrica de las 28 manzanas
│   ├── supabase-client.ts
│   ├── supabase-server.ts
│   └── types.ts
└── middleware.ts                  # Auth guard
supabase/
└── schema.sql                     # Schema completo + seed
```

## Funcionalidades implementadas

- ✅ Login con email/password (Supabase Auth)
- ✅ Masterplan interactivo SVG con 28 manzanas, 644 lotes numerados
- ✅ Vista por etapa (Etapa 1, Etapa 2, Todo)
- ✅ Cambiar estado de lote (Disponible / Reservado / Vendido)
- ✅ Reserva con datos del cliente (vencimiento automático en 7 días)
- ✅ Venta con precio final y comisión
- ✅ Historial de cambios de estado
- ✅ Realtime: si otro vendedor modifica un lote, se ve al instante en tu pantalla
- ✅ Diseño responsive con paleta de marca (verde/negro/blanco)

## Próximas funcionalidades sugeridas

- Panel admin: gestión de usuarios, métricas, configuración
- Listado de reservas activas y vencimientos próximos
- Reportes de ventas y comisiones por vendedor
- Carga de planos/imágenes de cada lote
- Generación de boletos de reserva en PDF
- Notificaciones por email al cliente

## Roles

- **admin**: gestión total
- **manager**: ver todo, modificar lotes y ventas
- **seller**: modificar lotes (reservar, vender)
- **viewer**: solo lectura

Para cambiar el rol de un usuario, en Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'usuario@cristal.com';
```

## Licencia

Privado © Cristal Desarrollos
