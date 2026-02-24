# 🌐 AdminWISP — Sistema de Gestión para ISP

Panel de administración completo para proveedores de internet (ISP).

## 🚀 Requisitos previos

- Node.js 18+
- PostgreSQL 14+

## ⚙️ Instalación local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar PostgreSQL
```sql
CREATE DATABASE "DBWisp";
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE "DBWisp" TO admin;
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Edita `.env` con tus datos. Para generar claves secretas:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
> `ENCRYPTION_KEY` debe tener exactamente **64 caracteres hex** (32 bytes). Se usa para cifrar las contraseñas PPPoE con AES-256-GCM.

### 4. Aplicar migraciones y seed
```bash
npm run db:migrate
npm run db:seed
```

### 5. Ejecutar
```bash
npm run dev
```

Abre http://localhost:3000

## 🔑 Credenciales iniciales



## 🔐 Seguridad implementada

- **Middleware RBAC**: protege todas las rutas del dashboard por rol
- **PPPoE cifrado**: AES-256-GCM con IV aleatorio por registro
- **Contraseñas de usuarios**: bcrypt con salt

## 📁 Estructura
```
src/
├── app/dashboard/
│   ├── page.tsx              # Dashboard con estadísticas
│   └── clientes/             # CRUD completo
│       ├── page.tsx          # Lista + búsqueda + filtros
│       ├── nuevo/page.tsx    # Crear cliente
│       └── [id]/
│           ├── page.tsx      # Detalle cliente
│           └── editar/       # Editar cliente
├── components/features/clientes/
│   ├── ClienteForm.tsx       # Formulario create/edit
│   ├── ClientesTable.tsx     # Tabla con acciones
│   ├── ClientesSearch.tsx    # Buscador y filtros
│   ├── CambiarEstadoCliente.tsx  # Dropdown cambio de estado
│   └── UbicacionesPanel.tsx  # CRUD ubicaciones instalación
├── server/actions/
│   ├── clientes.ts           # Actions: CRUD clientes + ubicaciones
│   └── configuracionOnt.ts   # Actions: CRUD ONT con cifrado
└── lib/
    ├── crypto.ts             # AES-256-GCM helper
    └── auth.ts               # NextAuth config
```

## 🛠️ Scripts
```bash
npm run dev           # Desarrollo
npm run build         # Build producción
npm run db:migrate    # Aplicar migraciones
npm run db:seed       # Poblar BD
npm run db:studio     # Explorador visual BD
npm run db:reset      # Resetear BD
```