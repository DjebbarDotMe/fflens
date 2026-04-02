

# Affiliate Product Database Platform

## Overview
Build a functional affiliate platform focused on managing a database of retail products from different brands. Each brand/network has its own logic for injecting affiliate parameters into product URLs. The platform starts with a dashboard and analytics view, with product/brand management at the core.

## Architecture

```text
┌─────────────────────────────────────────────┐
│  App Shell (Sidebar + Top Nav)              │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Main Content Area              │
│          │                                  │
│ Dashboard│  - Dashboard (stats + charts)    │
│ Products │  - Product catalog (CRUD)        │
│ Brands   │  - Brand/Network management     │
│ Links    │  - Affiliate link generator      │
│ Settings │  - Settings                      │
└──────────┴──────────────────────────────────┘
```

## Data Model (Supabase)

- **brands** — id, name, slug, logo_url, base_url, affiliate_param_template (e.g. `?tag={affiliate_id}&utm_source=...`), network_type (Amazon, ShareASale, CJ, custom), created_at
- **products** — id, brand_id (FK), name, description, image_url, original_url, price, currency, category, is_active, created_at
- **affiliate_links** — id, product_id (FK), short_code, affiliate_url (generated), clicks, conversions, revenue, created_at
- **link_clicks** — id, link_id (FK), timestamp, referrer, country, device

## Pages & Components

### 1. Dashboard (`/`)
- Summary cards: Total Products, Active Brands, Total Clicks, Estimated Revenue
- Line chart: clicks over time (last 30 days) using Recharts
- Top performing products table
- Recent activity feed

### 2. Products (`/products`)
- Searchable, filterable data table (by brand, category, status)
- Add/Edit product dialog with form
- Bulk import placeholder (for future CSV/API import)
- Each row shows product name, brand, price, affiliate link status

### 3. Brands (`/brands`)
- Card grid of brands with logo, product count, network type
- Add/Edit brand dialog with affiliate parameter template config
- Template supports placeholders like `{affiliate_id}`, `{sub_id}`

### 4. Link Generator (`/links`)
- Select product, auto-generates affiliate URL using brand's template
- Copy-to-clipboard, QR code generation
- Click tracking stats per link

### 5. Settings (`/settings`)
- Affiliate ID configuration per network
- Default UTM parameters

## Implementation Steps

1. **App shell & routing** — Sidebar layout with react-router routes for all pages
2. **Supabase setup** — Tables, RLS policies, TypeScript types
3. **Dashboard page** — Stats cards + Recharts charts with mock data initially
4. **Brands management** — CRUD with affiliate URL template configuration
5. **Products management** — Data table with search/filter, CRUD dialogs
6. **Affiliate link engine** — URL generation logic that applies brand templates to product URLs
7. **Link tracking** — Click counter, basic analytics per link

## Tech Decisions
- **Recharts** for dashboard charts (already compatible with shadcn)
- **Supabase** for database + auth (via Lovable Cloud)
- **shadcn/ui data table** pattern for products/links lists
- **Affiliate URL logic** lives client-side as a utility function, templating brand params onto product URLs

## Affiliate URL Template System
Each brand stores a template like:
```
{original_url}?tag={affiliate_id}&linkCode=ll1&ref_=as_li_ss_tl
```
The link generator replaces placeholders with the user's configured IDs.

