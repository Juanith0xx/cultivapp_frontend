# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# 🌿 Cultivapp - Frontend (Sprint 2)

Módulo de Reponedor y Gestión de Tareas. Esta aplicación permite la gestión en terreno de mercaderistas con capacidades offline.

## 🚀 Funcionalidades Sprint 2
- Dashboard dinámico sincronizado con React Query.
- Flujo de visita con validación GPS.
- Captura de evidencia fotográfica (Inicio, Final, Observaciones).
- Escaneo de productos mediante cámara.
- Modo Offline con sincronización automática.

## 🛠️ Tecnologías y Dependencias
- **Core:** React 18 (Vite)
- **Estado y Sync:** TanStack Query (React Query) v5
- **Icons:** React Icons (Fi)
- **Toast:** React Hot Toast
- **Estilos:** Tailwind CSS
- **Licencias:** MIT / Dependencias de código abierto.

## 📦 Instalación y Despliegue
1. Clonar el repositorio.
2. Ejecutar `npm install`.
3. Crear archivo `.env` basado en `.env.example`.
4. Ejecutar en desarrollo: `npm run dev`.
5. Para construcción de producción (Artefacto): `npm run build`.

## 📌 Control de Versiones
Este entregable corresponde al **Tag v2.0.0**.