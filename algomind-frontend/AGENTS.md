# Frontend AGENTS.md

## Commands
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Code Style

### Formatting
- Tab Width: 4 spaces
- Print Width: 80 chars
- Quotes: Single
- Trailing Commas: All
- Semicolons: No
- Run `npm run lint` before committing; Prettier handles most formatting

### Imports (enforced by eslint-plugin-simple-import-sort)
1. React packages (`^react`)
2. External packages (`^@?\\w`)
3. Internal packages (`^(@|components)(/.*|$)`)
4. Side effect imports (`^\\u0000`)
5. Parent imports (`^\\.\\.(?!/?$)`, `^\\.\\./?$`)
6. Relative imports (`^\\./(?=.*/)(?!/?$)`, `^\\.(?!/?$)`, `^\\./?$`)
7. Style imports (`.css`)

### Naming
- Components: PascalCase (`SiteHeader`, `Button`)
- Hooks: camelCase with `use` prefix (`useAuthQuery`)
- Types/Interfaces: PascalCase (`Problem`, `ReviewState`)
- Files: kebab-case for non-components (`api-client.ts`)

### React Patterns
- Use `"use client"` directive for client components
- Named exports for components
- Zod for runtime validation
- TanStack Query for server state
- Zustand for client state
- Path alias: `@/*` maps to frontend root

### Component Structure
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

function ComponentName({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("base-classes", className)} {...props} />
}

export { ComponentName }
```

## Tech Stack
- Next.js 16 (App Router), React 19
- Tailwind CSS v4, shadcn/ui (new-york style)
- TanStack Query, Zustand
- React Hook Form + Zod
- Clerk (@clerk/nextjs)
- Lucide React, Tabler Icons

## Feature Structure
```
features/<feature-name>/
├── api/           # useGetX, useCreateX hooks
├── components/    # Feature-specific components
├── types/         # TypeScript types
├── store/         # Zustand stores
└── index.ts       # Public exports
```

## Key Patterns
```typescript
// API client usage
import { api } from '@/lib/api-client'
const response = await api.get<T>('/endpoint')

// Authenticated query
import { useAuthQuery } from '@/features/useAuthQuery'
const { data } = useAuthQuery({
    queryKey: ['key'],
    queryFn: async () => { /* ... */ }
})

// Adding shadcn components
npx shadcn@latest add <component-name>
```

## Theming
- CSS variables with oklch color space
- Dark mode via `class` strategy
- Use `cn()` utility for class merging
