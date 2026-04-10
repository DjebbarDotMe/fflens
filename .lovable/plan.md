

## Integrate Affiliate.com Product Search API

### Context

Affiliate.com provides a RESTful Product Search API with JSON body-based queries. From their blog and docs, the API supports 30+ filterable fields (name, brand, barcode, ASIN, price, availability, on_sale, etc.) and returns normalized product data with commission URLs. Authentication uses an API token (team-based token management). Their public docs don't expose the exact base URL — you get that when you sign up at affiliate.com/pricing.

### What we'll build

An edge function that proxies requests to the Affiliate.com Product Search API, and a frontend "Product Search" panel on the Products page that lets you search their catalog and import results into your local `products` table.

### Architecture

```text
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Products   │────▶│  Edge Function       │────▶│  Affiliate.com  │
│  Page UI    │     │  affiliate-search    │     │  Product API    │
│  (search    │◀────│  (proxies + injects  │◀────│                 │
│   panel)    │     │   API key server-    │     │                 │
│             │     │   side)              │     │                 │
└─────────────┘     └──────────────────────┘     └─────────────────┘
       │
       ▼ "Import" button
  ┌──────────┐
  │ products │  (upsert using network_id + merchant_id + sku dedup index)
  │  table   │
  └──────────┘
```

### Steps

**1. Store the API key as a secret**
- Use `add_secret` to request `AFFILIATE_COM_API_KEY` from you
- You'll get this token from your Affiliate.com dashboard under API settings

**2. Create edge function `affiliate-search`**
- Accepts POST with a search body: `{ keyword, brand, category, barcode, asin, price_min, price_max, in_stock, on_sale, limit }`
- Validates input with Zod
- Authenticates the caller (JWT check)
- Forwards to Affiliate.com Product Search API with your API key server-side
- Returns normalized results

**3. Add "Search Affiliate.com" UI to Products page**
- A collapsible panel at the top with search fields: keyword, brand, barcode/ASIN, price range, in-stock toggle, on-sale toggle
- Results table showing: name, brand, price, sale price, merchant, network, availability
- "Import" button per row (or bulk) that upserts into `products` table, mapping fields to your schema including `asin`, `barcode`, `sale_price`, `commission_rate`, `feed_source = 'affiliate.com'`

**4. Map Affiliate.com response fields to your products schema**

| Affiliate.com field | Your column |
|---------------------|-------------|
| name | title |
| brand | brand (lookup/create) |
| barcode | barcode |
| asin | asin |
| sku / mpn | sku, mpn |
| regular_price | price |
| final_price / sale_price | sale_price |
| commission_url | affiliate_url_template |
| merchant_id | merchant_id |
| network_name | network_id (lookup) |
| in_stock | availability_status |
| sale_discount | (derived) |

### Prerequisite from you

You need an Affiliate.com account and API token. Sign up at [affiliate.com/pricing](https://www.affiliate.com/pricing) if you haven't already. Once you have the token, I'll prompt you to enter it as a secret.

### Technical details

- The edge function keeps your API key server-side (never exposed to the browser)
- Upserts use the existing unique index `idx_products_network_merchant_sku` to avoid duplicates
- `feed_source` is set to `'affiliate.com'` and `feed_synced_at` is set on import
- The Affiliate.com API base URL will need to be confirmed from your account — their docs reference a Product Search endpoint but the exact URL is provided after signup

