# Affiliate Link Manager

A full-stack affiliate marketing dashboard built with React, TypeScript, and Lovable Cloud (Supabase). Manage products, brands, affiliate links, and track performance — all in one place.

## Features

- **Authentication** — Email/password signup & login
- **Brand Management** — Add and organize affiliate brands
- **Product Catalog** — Manual entry or bulk CSV import
- **Affiliate Link Generator** — Create tracked short links per product
- **Link Health Monitoring** — Track link status (healthy / broken / unknown)
- **Click Tracking** — Log clicks with referrer and user-agent data
- **Dashboard** — Overview of revenue, clicks, conversions, and active links
- **Settings** — Manage network credentials (Amazon, Impact, CJ, Rakuten, ShareASale)

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Lovable Cloud (Supabase) — Postgres, Auth, Edge Functions
- **State:** TanStack React Query
- **Routing:** React Router v6
- **Charts:** Recharts

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

## Getting Started

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <your-repo-name>

# 2. Install dependencies
npm install
# or
bun install

# 3. Set up environment variables
#    Create a .env file in the project root:
cp .env.example .env

#    Required variables:
#    VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
#    VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:8080`.

## CSV Import Format

To bulk-import products, prepare a CSV file with at least these columns:

| Column | Required | Description |
|--------|----------|-------------|
| `sku` | ✅ | Unique product identifier |
| `title` | ✅ | Product name |
| `description` | | Product description |
| `price` | | Numeric price |
| `category` | | Product category |
| `image_url` | | URL to product image |
| `currency` | | ISO currency code (default: USD) |

## Project Structure

```
src/
├── components/       # UI components (sidebar, dialogs, shared)
│   └── ui/           # shadcn/ui primitives
├── hooks/            # Custom hooks (auth, data fetching)
├── integrations/     # Supabase client & generated types
├── lib/              # Utilities
├── pages/            # Route pages (Dashboard, Products, Brands, Links, Settings, Auth)
└── main.tsx          # App entry point
supabase/
├── config.toml       # Supabase project config
└── migrations/       # Database migrations (auto-applied)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## License

Private — all rights reserved.
