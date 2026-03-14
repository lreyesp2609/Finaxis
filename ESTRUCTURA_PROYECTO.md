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
- `Dashboard.tsx`: Panel principal con sidebar y navegación de salas.
- `MisAnalisis.tsx`: Gestión de estados financieros y catálogos (usa pestañas e inline forms).
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

### 2. Gestión de Análisis
Ubicado en `pages/MisAnalisis.tsx`.
- **Tabs**: Cambia entre 'estados' y 'catalogos'.
- **Inline Forms**: Los formularios de creación reemplazan la lista de tarjetas para evitar distracciones.
- **Estado Local**: Actualmente utiliza mocks y `useState` para demostrar la funcionalidad antes de la integración final con Supabase.

## 📝 Convenciones de Código
- **Estilos**: Se prefiere CSS Modules (`.module.css`) para componentes complejos para evitar colisiones.
- **Tipado**: TypeScript estricto (0 errores permitidos).
- **Archivos de información**: 
  - `INFO.txt`: Resumen técnico del negocio y avances.
  - `ESTRUCTURA_PROYECTO.md`: Esta guía de navegación.
