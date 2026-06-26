# PharmaDash API

API REST para gestión de inventario farmacéutico. Node.js + TypeScript + Express + PostgreSQL (Prisma) + Microsoft Entra ID.

---

## Por qué PostgreSQL

- Transacciones ACID necesarias para ventas atómicas (stock + sale en una sola transacción).
- Decimal nativo para precios sin pérdida de precisión.
- Amplio soporte en Prisma con migraciones versionadas.

---

## Requisitos

- Docker + Docker Compose (opción recomendada — no necesitás Node.js local)
- O bien: Node.js 20+ si preferís correr sin Docker
- Una app registrada en Microsoft Entra ID (Azure AD)

---

## Setup con Docker (recomendado)

Levanta la API y PostgreSQL en un solo comando. No necesitás instalar Node.js ni configurar la base de datos manualmente.

### 1. Variables de entorno

```bash
cp .env.example .env
# Completar las variables de Entra ID (ver sección siguiente)
```

### 2. Levantar todo

```bash
docker-compose up -d
```

Esto levanta dos contenedores:
- `pharmadash_postgres` — PostgreSQL 16
- `pharmadash_api` — la API en modo desarrollo con hot-reload

La API espera a que PostgreSQL esté saludable antes de arrancar (`depends_on: condition: service_healthy`). Al iniciar, ejecuta `prisma generate` automáticamente.

### 3. Ejecutar migraciones (primera vez)

```bash
docker-compose exec api npx prisma migrate deploy
```

### 4. Cargar datos de prueba

```bash
docker-compose exec api npm run seed
```

### 5. Verificar

```bash
curl http://localhost:3000/health
# { "status": "ok" }
```

### Detener

```bash
docker-compose down          # detiene contenedores, conserva datos
docker-compose down -v       # detiene y borra el volumen de PostgreSQL
```

---

## Setup sin Docker (alternativa)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores reales
```

### 3. Levantar solo PostgreSQL

```bash
docker-compose up -d postgres
```

### 4. Ejecutar migraciones

```bash
npm run prisma:migrate
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
npm test                 # Tests unitarios
npm run test:coverage    # Tests + reporte de cobertura
```

---

## Tests y cobertura

```bash
npm test                 # Ejecuta los tests unitarios
npm run test:coverage    # Genera el reporte de cobertura (carpeta coverage/)
```

La cobertura global se mantiene por encima del **80%** (umbral exigido por `coverageThreshold` en `jest.config.js`; si baja, el comando falla). Se cubren servicios, repositorios, controladores, schemas Zod, middlewares y utilidades compartidas.

El análisis de calidad corre automáticamente en **SonarCloud** vía GitHub Actions (`.github/workflows/ci.yml`) en cada push y pull request.

---

## Control de stock y concurrencia (race conditions)

El stock es un recurso compartido. Si dos ventas del mismo medicamento llegan a la vez, un patrón ingenuo de *leer-luego-escribir* puede vender más unidades de las que existen (stock negativo):

```
Vendedor A lee stock=1 ─┐
Vendedor B lee stock=1 ─┤  ambos ven "disponible"
Vendedor A vende ───────┤  stock=0
Vendedor B vende ───────┘  stock=-1  ❌
```

### Cómo se resuelve

El descuento de stock se hace con un **UPDATE atómico y condicional** dentro de una transacción (`src/modules/sales/repository.ts`):

```sql
UPDATE medications
SET stock = stock - $cantidad
WHERE id = $id AND stock >= $cantidad
```

En Prisma se implementa con `updateMany`, que compila a ese UPDATE. La condición `stock >= cantidad` se evalúa bajo el **lock de fila** que toma el propio UPDATE, así que dos ventas concurrentes nunca pasan la comprobación a la vez. Si `count === 0`, no había stock suficiente → se lanza `422 Unprocessable Entity` y la transacción hace rollback (no se vende nada parcial).

### Cómo probarlo manualmente

Con el servidor corriendo (`npm run dev`) y un medicamento con **stock = 1**, lanza dos ventas simultáneas:

```bash
export TOKEN="<access_token con rol Admin o Vendedor>"
export MED="<id del medicamento con stock 1>"
export URL="http://localhost:3000/api/v1/sales"

curl -s -o /dev/null -w "venta A: %{http_code}\n" -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"items\":[{\"medicationId\":\"$MED\",\"quantity\":1}]}" &
curl -s -o /dev/null -w "venta B: %{http_code}\n" -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"items\":[{\"medicationId\":\"$MED\",\"quantity\":1}]}" &
wait
```

**Resultado esperado:** una venta responde `201` y la otra `422`. El stock final queda en `0`, nunca en `-1`.

> El token debe llevar el claim `roles` (`Admin` o `Vendedor`). Los tokens de `client_credentials` no lo incluyen salvo que el App Role permita miembros de tipo *Application*; usa un token de usuario (flujo interactivo / frontend) para esta prueba.

### Prevención de escasez

Además del control de carrera, el backend expone alertas tempranas para reabastecer antes de llegar a cero:

- `isCriticalStock: true` cuando `stock < 10`
- `isNearExpiry: true` cuando vence en ≤ 30 días
- El dashboard agrega estos como `criticalStockCount` y `nearExpiryCount`

---

## Arquitectura

El proyecto adopta los principios de **Arquitectura Hexagonal (Ports & Adapters)**, adaptados a la escala de una API REST con tres módulos de negocio.

### Concepto central

La regla de oro: **el núcleo de negocio no depende de ningún framework, base de datos ni protocolo HTTP**. Las capas externas (Express, Prisma, Passport) se conectan al núcleo a través de contratos (interfaces), no al revés.

```
┌─────────────────────────────────────────────────────────┐
│                    ADAPTADORES DE ENTRADA               │
│         routes.ts  →  controller.ts  →  middlewares/    │
│              (Express, HTTP, validación Zod)            │
└──────────────────────────┬──────────────────────────────┘
                           │ llama a
┌──────────────────────────▼──────────────────────────────┐
│                     NÚCLEO DE DOMINIO                   │
│                       service.ts                        │
│   - Reglas de negocio (stock crítico, vencimiento)      │
│   - Orquestación de casos de uso                        │
│   - Solo conoce excepciones propias (shared/exceptions) │
│   - NO importa Prisma, Express ni Passport              │
└──────────────────────────┬──────────────────────────────┘
                           │ usa el contrato (puerto)
┌──────────────────────────▼──────────────────────────────┐
│                   ADAPTADORES DE SALIDA                 │
│                      repository.ts                      │
│          (Prisma ORM → PostgreSQL)                      │
│   auth.ts → Passport + Entra ID                        │
│   config/ → variables de entorno, logger               │
└─────────────────────────────────────────────────────────┘
```

### Capas en la práctica

| Capa | Archivos | Responsabilidad |
|------|----------|-----------------|
| **Adaptador entrada (HTTP)** | `routes.ts`, `controller.ts`, `middlewares/` | Recibir HTTP, validar con Zod, devolver respuesta estándar |
| **Núcleo / Casos de uso** | `service.ts` | Lógica de negocio pura: umbrales, unicidad de SKU, enriquecimiento de datos |
| **Puerto de salida (contrato)** | Tipos del `repository.ts` | Define qué operaciones necesita el dominio sin saber cómo se implementan |
| **Adaptador salida (persistencia)** | `repository.ts` con Prisma | Implementa el puerto traduciendo a SQL vía Prisma |
| **Adaptador salida (identidad)** | `middlewares/auth.ts` | Valida tokens Entra ID, sincroniza usuarios en BD |
| **Infraestructura transversal** | `shared/`, `config/` | Excepciones tipadas, respuesta estándar, logger, env |

.
