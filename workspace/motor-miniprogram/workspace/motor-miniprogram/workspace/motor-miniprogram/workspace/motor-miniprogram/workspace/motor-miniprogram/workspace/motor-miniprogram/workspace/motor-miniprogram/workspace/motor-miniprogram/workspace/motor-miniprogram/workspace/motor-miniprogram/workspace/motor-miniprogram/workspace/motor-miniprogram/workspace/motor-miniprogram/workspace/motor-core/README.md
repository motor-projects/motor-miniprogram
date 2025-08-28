# Motor Projects Core Monorepo

This monorepo contains the core components of the Motor Projects system.

## Structure

- `apps/backend` - Node.js API server
- `apps/web` - React web frontend
- `packages/shared` - Shared TypeScript types and utilities
- `packages/design-system` - UI component library

## Development

```bash
# Install dependencies
npm install

# Start all services in development
npm run dev

# Build all packages
npm run build

# Run tests
npm run test
```

## Individual Services

```bash
# Backend only
npm run backend:dev

# Web frontend only
npm run web:dev

# Build shared package
npm run shared:build
```
