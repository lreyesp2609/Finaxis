# Documentación de Estructura - Finaxis

Esta guía detalla la organización del proyecto y la ubicación de los componentes clave para facilitar la navegación y el desarrollo.

## 🛠 Stack Tecnológico
- **Frontend**: React + TypeScript + Vite.
- **Estilos**: Tailwind CSS + CSS Modules.
- **Componentes**: shadcn/ui.
- **Backend**: Supabase (Auth, DB PostgreSQL, Storage).

## 📁 Estructura de Carpetas (`/src`)

### 📄 `pages/` (Vistas principales)
Donde residen las páginas completas de la aplicación.
- `Dashboard.tsx`: Panel principal con sidebar responsiva y navegación de salas.
- `MisAnalisis.tsx`: Gestión de estados financieros y catálogos (usa pestañas e inline forms, adaptado a móvil).
- `MisSalas.tsx`: Gestión de salas de colaboración creadas por el usuario.
- `UnirseSala.tsx`: Interfaz para unirse a salas existentes mediante código (layout optimizado).
- `Login.tsx` / `Register.tsx`: Flujos de autenticación (optimizados con replace y popups).
- `AuthCallback.tsx`: Manejador de retorno de OAuth (Google).

### 🧩 `components/` (UI Reutilizable)
- `ProtectedRoute.tsx` / `PublicRoute.tsx`: Guardias de navegación para proteger rutas.
- `OtpInput.tsx`: Componente especializado para la validación de registro.

### 🔐 `context/` (Gestión de Estado Global)
- `AuthContext.tsx`: Maneja el estado de la sesión, el usuario actual y el perfil activo de Supabase.

### 📚 `lib/` (Utilidades y Clientes)
- `supabaseClient.ts`: Configuración e inicialización del cliente de Supabase.
- `errors.ts`: Mapeo y traducción de errores de Supabase al español.

### 🎨 `assets/`
Imágenes, logos y recursos estáticos.

## 🔄 Flujos Clave

### 1. Autenticación (Login/Registro)
Ubicado en `pages/Login.tsx` y `pages/Register.tsx`. Utiliza `window.location.replace()` para limpiar el historial y `BroadcastChannel` para la comunicación con el popup de Google.

### 3. Salas de Colaboración
Ubicado en `pages/MisSalas.tsx` y `pages/UnirseSala.tsx`.
- **Mis Salas**: Permite crear salas con configuraciones de tiempo, fechas y catálogo específico. Genera códigos únicos `FIN-XXXX`.
- **Unirse a Sala**: Validación de códigos en tiempo real. Incluye restricción para que el creador no pueda unirse a su propia sala.
- **Back Button**: Ambas páginas incluyen lógica de bloqueo del botón atrás para mantener la integridad de la sesión.

### 4. Navegación Unificada y Responsividad
Implementado en todas las páginas mediante `useNavigate` y `useLocation`.
- **Sidebar Responsiva**: Se oculta automáticamente en dispositivos móviles (<768px).
- **Menú Hamburguesa**: Botón (☰) para desplegar el menú lateral ocupando el 100% como overlay.
- **Layout Adaptable**: Grids, formularios y componentes de texto (`word-break`) optimizados para pantallas pequeñas (360px+).

## 📝 Convenciones de Código
- **Estilos**: Se prefiere CSS Modules (`.module.css`) para componentes complejos para evitar colisiones.
- **Tipado**: TypeScript estricto (0 errores permitidos).
- **Archivos de información**: 
  - `INFO.txt`: Resumen técnico del negocio y avances.
  - `ESTRUCTURA_PROYECTO.md`: Esta guía de navegación.
