# Sistema de Inventario - Corporación Municipal de Pudahuel

Sistema completo de gestión de inventario desarrollado para la Corporación Municipal de Pudahuel.

## Características Principales

- Login de acceso con autenticación y roles
- Gestión de artículos (entradas, salidas y edición)
- Categorías de productos
- Carga masiva de productos
- Gestión de proveedores
- Gestión de clientes
- Administración de roles de usuarios
- Personalización de logos
- Temas personalizables
- Carga de imágenes y archivos
- Reportes en PDF y Excel
- Alertas de stock bajo
- Búsqueda avanzada
- Gráficos dinámicos
- Notificaciones por correo
- Interfaz moderna con Material UI

## Requisitos Previos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/inventario-corpo.git
cd inventario-corpo
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
- Copiar el archivo `.env.example` a `.env`
- Modificar las variables según tu entorno

4. Crear la base de datos:
```sql
CREATE DATABASE inventario_corpo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Ejecutar migraciones:
```bash
npm run migrate
```

6. (Opcional) Cargar datos de prueba:
```bash
npm run seed
```

## Estructura del Proyecto

```
inventario-corpo/
├── server/
│   ├── config/         # Configuración de la aplicación
│   ├── controllers/    # Controladores
│   ├── middleware/     # Middleware personalizado
│   ├── models/         # Modelos de la base de datos
│   ├── routes/         # Rutas de la API
│   ├── templates/      # Plantillas de correo
│   └── utils/          # Utilidades y helpers
├── uploads/            # Archivos subidos
├── logs/              # Logs de la aplicación
└── backups/           # Backups de la base de datos
```

## Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

## API Endpoints

### Autenticación
- POST /api/auth/login
- POST /api/auth/recuperar-password
- POST /api/auth/restablecer-password

### Usuarios
- GET /api/usuarios
- POST /api/usuarios
- PUT /api/usuarios/:id
- DELETE /api/usuarios/:id

### Productos
- GET /api/productos
- POST /api/productos
- PUT /api/productos/:id
- DELETE /api/productos/:id
- POST /api/productos/carga-masiva

### Categorías
- GET /api/categorias
- POST /api/categorias
- PUT /api/categorias/:id
- DELETE /api/categorias/:id

### Proveedores
- GET /api/proveedores
- POST /api/proveedores
- PUT /api/proveedores/:id
- DELETE /api/proveedores/:id

### Clientes
- GET /api/clientes
- POST /api/clientes
- PUT /api/clientes/:id
- DELETE /api/clientes/:id

### Movimientos
- GET /api/movimientos
- POST /api/movimientos
- GET /api/movimientos/:id
- PATCH /api/movimientos/:id/anular

## Seguridad

- Protección contra SQL Injection
- Validación de datos con Joi
- Sanitización de entradas
- Rate limiting
- CORS configurado
- Helmet para headers HTTP seguros
- Contraseñas hasheadas
- JWT para autenticación
- Roles y permisos

## Respaldos

El sistema realiza respaldos automáticos diarios de la base de datos (configurable en .env).

## Notificaciones

- Alertas de stock bajo por correo
- Notificaciones de movimientos
- Reportes diarios automáticos

## Personalización

### Temas
El sistema incluye temas claro y oscuro, configurables por usuario.

### Logos
Los logos pueden ser personalizados desde la interfaz de administración.

## Soporte

Para soporte técnico, contactar a:
- Email: eduardo.martinez@corpopudahuel.cl

## Licencia

Este software es propiedad de la Corporación Municipal de Pudahuel.

## Créditos

Diseñado y desarrollado por Eduardo Martinez para la Corporación Municipal de Pudahuel.
