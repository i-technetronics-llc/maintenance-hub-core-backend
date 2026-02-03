# Project Context: Maintenance Frontend

## Overview
`maintenance-frontend` is a comprehensive React-based frontend application for a Maintenance Management System. It is built with **Vite** and **TypeScript**, leveraging **Tailwind CSS** for styling and **Zustand** for state management. The application features a modular architecture supporting various roles (Super Admin, Client, Technician) and functionalities including Asset Management, Work Orders, Inventory, Finance, and Predictive Maintenance.

## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (configured with CSS variables for theming)
- **Routing**: React Router DOM v6
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **PWA**: Service Worker support enabled

## Getting Started

### Prerequisites
- Node.js (Version compatible with Vite/React ecosystem)
- npm or yarn or bun

### Key Commands
- **Development Server**:
  ```bash
  npm run dev
  # Runs on http://localhost:4000
  ```
- **Build for Production**:
  ```bash
  npm run build
  # Typescript check + Vite build
  ```
- **Lint Code**:
  ```bash
  npm run lint
  ```
- **Preview Build**:
  ```bash
  npm run preview
  ```

## Project Structure

- **`src/pages/`**: Application pages organized by feature (e.g., `finance/`, `reports/`, `portal/`).
- **`src/components/`**: Reusable UI components.
  - `charts/`: Visualization components.
  - `portal/`: Components specific to the Customer Portal.
  - `integrations/`: Components for external integrations.
- **`src/store/`**: Global state management using Zustand (e.g., `authStore.ts`, `portalAuthStore.ts`).
- **`src/services/`**: API integration and offline storage logic.
- **`src/utils/`**: Utility functions, including PWA registration.
- **`src/i18n/`**: Internationalization resources.

## Development Conventions

- **Component Style**: Functional components with Hooks.
- **Styling**: Use Tailwind CSS utility classes. The `tailwind.config.js` is set up to use CSS variables (e.g., `bg-background`, `text-primary`), suggesting a design system similar to Shadcn UI.
- **Navigation**: Uses `react-router-dom`. Routes are defined in `App.tsx` and protected via the `ProtectedRoute` wrapper component.
- **Imports**: Path aliases are configured in `tsconfig.json`. Use `@/` to reference the `src/` directory.
- **State**: Prefer local state for UI interactions and Zustand for global application state (User session, Organization context).
- **Forms**: Use `react-hook-form` integrated with `zod` for schema validation.
