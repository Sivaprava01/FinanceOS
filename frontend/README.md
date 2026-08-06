# FinanceOS Frontend

A premium financial operating system for personal and family finance management.

## Technology Stack

- **React 19** – UI framework
- **TypeScript** – Type-safe development
- **Vite** – Build tool & dev server
- **Tailwind CSS v4** – Styling
- **React Router** – Client-side routing
- **shadcn/ui** – Component foundation
- **Framer Motion** – Animations
- **TanStack Query** – Server state management
- **React Hook Form** – Form management
- **Zod** – Schema validation
- **Axios** – API client
- **Lucide React** – Icons
- **Recharts** – Charts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env from .env.example
cp .env.example .env

# Update VITE_API_URL if backend is on different port
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Production build
npm run build

# Preview build
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format with Prettier
npm run format
```

## Project Structure

```
src/
├── app/                 # Application state
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Input, etc)
│   └── layout/         # Layout components (Sidebar, Navigation)
├── features/           # Feature modules (future)
├── hooks/              # Custom React hooks
├── layouts/            # Page layouts
├── pages/              # Page components
├── routes/             # Route configuration
├── services/           # API services
├── store/              # Global state (Context)
├── styles/             # Global styles
├── types/              # TypeScript types
├── utils/              # Utility functions
├── assets/             # Static assets
├── lib/                # Library utilities
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Design System

### Colors

**Light Theme (Emerald-first)**
- Primary: Emerald
- Background: White
- Foreground: Dark Gray

**Dark Theme (Purple-first)**
- Primary: Purple
- Background: Dark
- Foreground: Light Gray

### Typography

- **Headings**: Cabinet Grotesk
- **Body**: General Sans

### Spacing

Uses Tailwind's standardized scale: 4px, 8px, 12px, 16px, 20px, etc.

### Radius

Medium rounded corners (12px base)

## Features (Phase 01)

✅ Complete project setup  
✅ Routing with React Router  
✅ Theme system (Light/Dark/System)  
✅ Floating sidebar  
✅ Top navigation  
✅ Base components (Button, Input, Card, etc)  
✅ Authentication pages (Login, Register, Forgot Password)  
✅ Error pages (404)  
✅ Responsive layout  
✅ Dark mode support  
✅ ESLint & Prettier configured  

## Future Phases

- **Phase 02**: Core Finance Experience (Dashboard, Transactions, Statements)
- **Phase 03**: Advanced Features (Analytics, Family Finance)
- **Phase 04**: Production Readiness (Performance, Polish)

## Contributing

All code should follow the guidelines in `frontend/docs/FrontendGuidelines.md`.

- Use TypeScript (no JavaScript)
- Follow ESLint rules
- Format with Prettier
- Maintain component library consistency

## License

FinanceOS - All rights reserved
