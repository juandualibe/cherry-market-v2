# 🍒 Cherry App — Sistema de Gestión Comercial Integrado (ERP & E-Logistics)
 
Cherry App es una plataforma web e-logística modular e integral diseñada bajo un enfoque **Mobile-First** como una **PWA (Progressive Web App)**. El sistema resuelve problemáticas reales de negocio en el sector de retail y distribución: administración de catálogos maestros multietiqueta, control transaccional de órdenes de compra mediante escaneo de códigos de barra en tiempo real, gestión de cuentas corrientes (clientes y proveedores) y auditoría financiera de márgenes netos.
 
---
 
## 🚀 Arquitectura General del Sistema
 
El sistema está desacoplado por completo en tres capas principales utilizando un stack **MERN** optimizado para despliegues Serverless y de alta velocidad de lectura:
 
```
[ Cliente PWA: React 19 + Vite ]
       │ Peticiones HTTP (Fetch API + JWT)
       ▼
[ Servidor API: Node.js + Express ]
       │ ODM (Mongoose)
       ▼
[ Capa de Datos: MongoDB Atlas Cluster ]
```
 
---
 
## 🛠️ Tecnologías y Dependencias Core
 
### Frontend (Client)
 
| Tecnología | Rol |
|---|---|
| **React 19** (SPA) | Interfaz declarativa, reactiva y modular |
| **Vite** | Herramienta de construcción y empaquetado ultra rápido (compilación con SWC) |
| **React Router Dom v7** | Sistema de enrutamiento dinámico con protección de layouts |
| **Vite Plugin PWA** | Automatización del Service Worker y Manifest para comportamiento nativo en móviles |
| **XLSX (SheetJS)** | Procesamiento, parseo y generación de archivos Excel binarios en el cliente |
| **Html5-Qrcode** | Inicialización y captura de flujo de video para escaneo de códigos de barra |
 
### Backend (API)
 
| Tecnología | Rol |
|---|---|
| **Node.js & Express** | Entorno de ejecución asincrónico y microframework para la API REST |
| **Mongoose (ODM)** | Modelado físico de objetos y control de esquemas para MongoDB |
| **JSON Web Tokens (JWT)** | Generación y validación de tokens firmados para la seguridad de sesión |
| **Bcrypt** | Algoritmo de hashing criptográfico para la protección de contraseñas |
| **Cors** | Middleware para habilitar el intercambio de recursos de origen cruzado de forma segura |
 
---
 
## 🗄️ Modelado de Datos (Estrategia NoSQL)
 
La base de datos utiliza un clúster en la nube en **MongoDB Atlas**. A diferencia de las bases relacionales (SQL), se optó por un modelo **denormalizado en documentos** para priorizar la velocidad de respuesta en consultas pesadas.
 
### Modelos Clave del Sistema
 
**`Producto` — Catálogo Maestro**
- `codigosDeBarras`: Array de Strings con índices `unique` y `sparse` para soportar múltiples códigos alternativos por artículo físico.
- `preciosProveedores`: Array embebido de subdocumentos que mapea relaciones comerciales de precios indexados por `proveedorId`, evitando lookups costosos.
**`ProductoOrden` — Denormalización Estratégica**
- Contiene referencias a `OrdenCompra` y `Producto` maestro.
- Estrategia de Caché: almacena los campos `nombre` y `codigoBarrasPrincipal` de forma estática en el documento de la orden, optimizando el rendimiento al evitar operaciones `$lookup` masivas al listar ítems.
**`User` — Seguridad Perimetral**
- Maneja colecciones con estados jerárquicos (`pendiente`, `aprobado`, `rechazado`) y roles de acceso.
- Implementa un hook asincrónico `pre('save')` para interceptar la persistencia de datos y automatizar el hasheo criptográfico de contraseñas con sales variables de `bcrypt`.
**`Mes`, `Venta`, `GastoFijo` — Módulo Financiero**
- Estructura relacional embebida por `mesId` (formato `YYYY-MM`).
- Calcula el margen neto deduciendo costos, gastos variables diarios y prorrateando gastos fijos basados en porcentajes dinámicos de asignación.
---
 
## 🔒 Flujos Técnicos Críticos
 
### A. Autenticación y Guardias de Rutas (JWT)
 
El acceso al sistema está protegido por un flujo híbrido entre el Frontend y el Backend:
 
1. Al enviar credenciales a `/api/auth/login`, el backend verifica la identidad y aplica un filtro temprano de estado (`user.estado !== 'aprobado'`). Si no está aprobado, bloquea el flujo devolviendo un `403 Forbidden`.
2. Si es exitoso, genera un token firmado (`jwt.sign`) con un payload básico (ID, rol, nombre) y expiración de **24 horas**.
3. En el frontend, un `AuthProvider` expone el contexto de sesión. Los componentes `ProtectedLayout` y `PublicLayout` interceptan la navegación de React Router, validando la presencia del token antes de permitir la carga de los componentes de negocio.
### B. Algoritmo Reactivo de Escaneo y Recepción de Stock
 
El procesamiento del escáner ejecuta una lógica distribuida de alta performance en el endpoint `/api/ordenes/:ordenId/escanear`:
 
1. **Búsqueda en Catálogo Maestro:** el cliente envía el código capturado por la cámara. La API ejecuta un `findOne` buscando el código dentro del array dinámico `codigosDeBarras`.
2. **Validación de Orden:** verifica si ese `productoMaestroId` específico pertenece a los ítems solicitados en esa `OrdenCompra`.
3. **Mutación Atómica de Estado:** incrementa de forma reactiva la propiedad `cantidadRecibida` en `+1`. Si iguala la cantidad solicitada, muta la bandera `recibido` a `true`.
4. **Recálculo de Negocio:** la API ejecuta un reducer asincrónico sobre los productos de la orden para actualizar la propiedad `total` de la `OrdenCompra` y actualiza automáticamente el estado global del pedido (`pendiente → recibiendo → completada`).
---
 
## 📱 Implementación de la Progressive Web App (PWA)
 
La aplicación aprovecha las capacidades del navegador mediante `vite-plugin-pwa` para ofrecer una experiencia idéntica a una app nativa sin la fricción de distribución de las tiendas oficiales:
 
**Web App Manifest** (`vite.config.js`)
Archivo JSON de metadatos que instruye al sistema operativo del dispositivo móvil sobre el comportamiento visual. Define el modo `display: 'standalone'` que remueve por completo la interfaz del navegador (barra de direcciones, botones de navegación) para ejecutar a pantalla completa en modo nativo.
 
**Service Worker** (`registerType: 'autoUpdate'`)
Script en background que intercepta el tráfico de red de la aplicación. Cachea de forma local e inteligente el App Shell (HTML, CSS, JS, bundles e imágenes), permitiendo velocidades de carga instantáneas en dispositivos móviles con independencia de la velocidad de red celular.
 
**Ciclo de Vida de Actualización**
Configurada en modo de actualización automática. Cuando el frontend recibe despliegues en producción (Vercel), el Service Worker instala la nueva versión en segundo plano y la aplica transparentemente en la siguiente sesión del usuario.
 
---
 
## 📥 Mecanismo de Importación / Exportación y Backup Local
 
Para evitar la saturación del servidor con procesamiento de archivos binarios pesados, la lógica de parseo de planillas se descentralizó hacia el procesador del cliente:
 
**Importación**
El frontend utiliza un `FileReader` asincrónico para leer archivos `.xlsx` o `.xls`. La librería `xlsx` transforma las hojas binarias de Excel en colecciones estructuradas de objetos JSON en memoria, que luego son inyectadas en ráfagas controladas (payloads optimizados de hasta 50 MB) hacia la API para su inserción rápida en MongoDB.
 
**Backups Completos**
El Dashboard implementa un despachador que descarga en paralelo colecciones enteras desde Atlas (Clientes, Deudas, Proveedores, Facturas, Ventas y Gastos), unifica la información en celdas formateadas dinámicamente con estilos de moneda local (`"$"#,##0.00`) y genera un archivo consolidado de backup descargable al instante.
 
---
 
## 💻 Instalación y Configuración Local
 
### Requisitos Previos
 
- Node.js versión 18 o superior
- Cuenta en MongoDB Atlas (o instancia local de MongoDB)
### Configuración del Servidor (Backend)
 
1. Navegar a la carpeta del backend.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear un archivo `.env` en la raíz del backend con las siguientes variables:
   ```env
   PORT=5000
   MONGODB_URI=tu_cadena_de_conexion_de_mongodb_atlas
   JWT_SECRET=tu_clave_secreta_super_segura_para_los_tokens
   ```
4. Iniciar servidor de desarrollo local:
   ```bash
   npm start
   ```
 
### Configuración del Cliente (Frontend)
 
1. Navegar a la carpeta del frontend.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar servidor de desarrollo local de Vite:
   ```bash
   npm run dev
   ```
 
La aplicación abrirá por defecto en `http://localhost:5173`. El archivo `vite.config.js` tiene preconfigurado un **proxy inverso** para redirigir automáticamente todas las peticiones `/api` al puerto `5000` del backend.
