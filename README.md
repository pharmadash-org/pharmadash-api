# PharmaDash API

API REST para gestión de inventario farmacéutico. Node.js + TypeScript + Express + PostgreSQL (Prisma) + Microsoft Entra ID.

---

## Por qué PostgreSQL

- Transacciones ACID necesarias para ventas atómicas (stock + sale en una sola transacción).
- Decimal nativo para precios sin pérdida de precisión.
- Amplio soporte en Prisma con migraciones versionadas.

---

## Requisitos

- Node.js 20+
- Docker + Docker Compose
- Una app registrada en Microsoft Entra ID (Azure AD)

---

## Setup

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores reales
```

### 3. Levantar PostgreSQL

```bash
docker-compose up -d
```

### 4. Ejecutar migraciones

```bash
npm run prisma:migrate
# Nombre sugerido: "init"
```

### 5. Cargar datos de prueba

```bash
npm run seed
```

### 6. Iniciar servidor

```bash
npm run dev        # desarrollo con hot-reload
npm run build && npm start  # producción
```

---

## Registrar la aplicación en Microsoft Entra ID

### Paso 1 — Registrar la app

1. Portal Azure → **Microsoft Entra ID** → **Registros de aplicaciones** → **Nuevo registro**.
2. Nombre: `PharmaDash API`.
3. Tipo de cuenta: **Solo esta organización**.
4. URI de redirección: dejar vacío (es una API, no tiene frontend).
5. Guardar. Copiar **Application (client) ID** y **Directory (tenant) ID**.

### Paso 2 — Exponer la API

1. En el registro → **Exponer una API** → **Establecer** el URI de aplicación: `api://<client-id>`.
2. Agregar un ámbito (scope): `access_as_user` (o el nombre que prefieras).

### Paso 3 — Crear App Roles

1. En el registro → **Roles de aplicación** → **Crear rol de aplicación**.
2. Crear dos roles:
   - Nombre para mostrar: `Admin` | Valor: `Admin` | Tipos permitidos: `Usuarios/Grupos`
   - Nombre para mostrar: `Vendedor` | Valor: `Vendedor` | Tipos permitidos: `Usuarios/Grupos`

### Paso 4 — Asignar roles a usuarios

1. **Aplicaciones empresariales** → buscar `PharmaDash API` → **Usuarios y grupos** → **Agregar usuario/grupo**.
2. Seleccionar usuario → seleccionar rol (`Admin` o `Vendedor`) → **Asignar**.

### Paso 5 — Crear secreto de cliente (opcional, para flujo confidencial)

1. En el registro → **Certificados y secretos** → **Nuevo secreto de cliente**.
2. Copiar el valor inmediatamente (no se vuelve a mostrar).

### Paso 6 — Completar `.env`

```env
AZURE_TENANT_ID=<Directory (tenant) ID>
AZURE_CLIENT_ID=<Application (client) ID>
AZURE_CLIENT_SECRET=<secreto, si aplica>
AZURE_AUDIENCE=api://<Application (client) ID>
```

---

## Obtener un token de prueba

### Opción A — Flujo de credenciales de cliente (M2M, rápido para pruebas)

```bash
curl -X POST \
  "https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=<CLIENT_ID>" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "scope=api://<CLIENT_ID>/.default"
```

> **Nota:** Los tokens de client_credentials no contienen el claim `roles` con los App Roles de usuario. Para obtener roles de usuario debes usar el flujo interactivo (Opción B).

### Opción B — Flujo de código de autorización con MSAL

Usa [MSAL Browser](https://github.com/AzureAD/microsoft-authentication-library-for-js) en un cliente SPA o herramienta como [Postman](https://learning.postman.com/docs/sending-requests/authorization/oauth-20/) con:

- **Auth URL:** `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/authorize`
- **Token URL:** `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token`
- **Scope:** `api://<CLIENT_ID>/.default`
- **Grant type:** Authorization Code

### Usar el token

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/v1/medications
```

---

## Endpoints

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | /health | Público | Estado del servidor |
| GET | /api/v1/medications | Todos | Listar con paginación y filtros |
| GET | /api/v1/medications/search?q= | Todos | Autocomplete |
| GET | /api/v1/medications/:id | Todos | Detalle |
| POST | /api/v1/medications | Admin | Crear |
| PUT | /api/v1/medications/:id | Admin | Actualizar |
| DELETE | /api/v1/medications/:id | Admin | Eliminar |
| POST | /api/v1/sales | Admin, Vendedor | Registrar venta |
| GET | /api/v1/dashboard/kpis | Admin | KPIs diarios |
| GET | /api/v1/dashboard/top-sold | Admin | Top 5 más vendidos |

---

## Respuesta estándar

```json
// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": null } }
```

## Campos calculados en medicamentos

- `isCriticalStock: true` cuando `stock < 10`
- `isNearExpiry: true` cuando la fecha de vencimiento es ≤ 30 días

---

## Scripts disponibles

```bash
npm run dev              # Hot-reload
npm run build            # Compilar TypeScript
npm start                # Producción
npm run prisma:generate  # Regenerar cliente Prisma
npm run prisma:migrate   # Nueva migración
npm run prisma:studio    # GUI de base de datos
npm run seed             # 20 medicamentos de ejemplo
```
