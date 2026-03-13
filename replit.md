# HelpChain

A social-help coordination platform connecting individuals in need with trusted helpers.

## Stack

- **Frontend**: React 19 + Vite 7 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **State**: Zustand + TanStack React Query
- **Routing**: Wouter
- **Backend/Auth**: Supabase + Firebase
- **Blockchain**: Solana (spl-token)
- **Forms**: React Hook Form + Zod

## Project Layout

```
/
├── client/           # Frontend source
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── utils/
│   └── public/
├── index.html        # Root HTML entry
├── vite.config.ts    # Vite configuration
├── supabase/         # Supabase config and migrations
└── dist/             # Build output
```

## Development

- Dev server runs on port 5000 (0.0.0.0)
- `npm run dev` — start development server
- `npm run build` — production build

## Deployment

- Configured as a **static** deployment
- Build command: `npm run build`
- Public directory: `dist`
