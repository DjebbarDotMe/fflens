export type NetworkType = 'amazon' | 'impact' | 'shareasale' | 'cj' | 'rakuten' | 'custom';
export type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'unknown';
export type AuthType = 'oauth2' | 'api_key' | 'hmac';

export interface Network {
  id: string;
  name: string;
  api_base_url: string;
  auth_type: AuthType;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  base_url: string;
  affiliate_param_template: string;
  network_id: string;
  network_type: NetworkType;
  product_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  brand_name: string;
  sku: string;
  name: string;
  description: string;
  image_url: string;
  original_url: string;
  price: number;
  currency: string;
  category: string;
  availability_status: AvailabilityStatus;
  merchant_id: string;
  is_active: boolean;
  has_affiliate_link: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  product_id: string;
  product_name: string;
  short_code: string;
  affiliate_url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  health_status: 'healthy' | 'broken' | 'unknown';
  health_status_code?: number;
  health_last_checked?: string;
  health_error?: string;
  created_at: string;
}

export interface ClickData {
  date: string;
  clicks: number;
  conversions: number;
}

export interface UserCredential {
  id: string;
  network_id: string;
  network_name: string;
  affiliate_id: string;
  has_api_token: boolean;
}

export const mockNetworks: Network[] = [
  { id: 'n1', name: 'Amazon Associates', api_base_url: 'https://webservices.amazon.com/paapi5', auth_type: 'hmac', created_at: '2024-01-01' },
  { id: 'n2', name: 'Impact', api_base_url: 'https://api.impact.com', auth_type: 'oauth2', created_at: '2024-01-01' },
  { id: 'n3', name: 'CJ Affiliate', api_base_url: 'https://commissionjunction.com/api', auth_type: 'api_key', created_at: '2024-01-01' },
  { id: 'n4', name: 'Rakuten Advertising', api_base_url: 'https://api.rakutenadvertising.com', auth_type: 'oauth2', created_at: '2024-01-01' },
  { id: 'n5', name: 'ShareASale', api_base_url: 'https://api.shareasale.com', auth_type: 'api_key', created_at: '2024-01-01' },
];

export const mockBrands: Brand[] = [
  { id: '1', name: 'Amazon', slug: 'amazon', logo_url: '', base_url: 'https://amazon.com', affiliate_param_template: '{original_url}?tag={affiliate_id}&linkCode=ll1', network_id: 'n1', network_type: 'amazon', product_count: 45, created_at: '2024-01-15' },
  { id: '2', name: 'Nike', slug: 'nike', logo_url: '', base_url: 'https://nike.com', affiliate_param_template: '{original_url}?clickId={affiliate_id}&utm_source=affiliate', network_id: 'n2', network_type: 'impact', product_count: 23, created_at: '2024-02-01' },
  { id: '3', name: 'Best Buy', slug: 'bestbuy', logo_url: '', base_url: 'https://bestbuy.com', affiliate_param_template: '{original_url}?ref={affiliate_id}&irclickid={sub_id}', network_id: 'n4', network_type: 'rakuten', product_count: 18, created_at: '2024-02-15' },
  { id: '4', name: 'Walmart', slug: 'walmart', logo_url: '', base_url: 'https://walmart.com', affiliate_param_template: '{original_url}?affiliates_ad_id={affiliate_id}&campaign_id={sub_id}', network_id: 'n5', network_type: 'shareasale', product_count: 31, created_at: '2024-03-01' },
  { id: '5', name: 'Etsy', slug: 'etsy', logo_url: '', base_url: 'https://etsy.com', affiliate_param_template: '{original_url}?click_key={affiliate_id}&click_sum={sub_id}', network_id: 'n3', network_type: 'cj', product_count: 12, created_at: '2024-03-10' },
];

export const mockProducts: Product[] = [
  { id: '1', brand_id: '1', brand_name: 'Amazon', sku: 'B09XS7JWHH', name: 'Sony WH-1000XM5 Headphones', description: 'Premium noise-canceling wireless headphones', image_url: '', original_url: 'https://amazon.com/dp/B09XS7JWHH', price: 348, currency: 'USD', category: 'Electronics', availability_status: 'in_stock', merchant_id: 'amz-sony', is_active: true, has_affiliate_link: true, created_at: '2024-01-20', updated_at: '2024-03-15' },
  { id: '2', brand_id: '1', brand_name: 'Amazon', sku: 'B08KTZ8249', name: 'Kindle Paperwhite', description: '6.8" display, adjustable warm light', image_url: '', original_url: 'https://amazon.com/dp/B08KTZ8249', price: 139.99, currency: 'USD', category: 'Electronics', availability_status: 'in_stock', merchant_id: 'amz-kindle', is_active: true, has_affiliate_link: true, created_at: '2024-01-22', updated_at: '2024-03-10' },
  { id: '3', brand_id: '2', brand_name: 'Nike', sku: 'NK-AM90-001', name: 'Air Max 90', description: 'Classic sneakers with visible Air cushioning', image_url: '', original_url: 'https://nike.com/air-max-90', price: 130, currency: 'USD', category: 'Footwear', availability_status: 'in_stock', merchant_id: 'nike-direct', is_active: true, has_affiliate_link: false, created_at: '2024-02-05', updated_at: '2024-03-12' },
  { id: '4', brand_id: '3', brand_name: 'Best Buy', sku: 'BB-MBP14-M3', name: 'MacBook Pro 14"', description: 'M3 Pro chip, 18GB RAM', image_url: '', original_url: 'https://bestbuy.com/macbook-pro-14', price: 1999, currency: 'USD', category: 'Electronics', availability_status: 'in_stock', merchant_id: 'bb-apple', is_active: true, has_affiliate_link: true, created_at: '2024-02-18', updated_at: '2024-03-08' },
  { id: '5', brand_id: '4', brand_name: 'Walmart', sku: 'WM-IP-DUO7', name: 'Instant Pot Duo 7-in-1', description: 'Multi-use pressure cooker', image_url: '', original_url: 'https://walmart.com/instant-pot', price: 89.99, currency: 'USD', category: 'Kitchen', availability_status: 'out_of_stock', merchant_id: 'wm-instantpot', is_active: true, has_affiliate_link: false, created_at: '2024-03-05', updated_at: '2024-03-14' },
  { id: '6', brand_id: '5', brand_name: 'Etsy', sku: 'ETSY-LW-12345', name: 'Handmade Leather Wallet', description: 'Personalized genuine leather bifold wallet', image_url: '', original_url: 'https://etsy.com/listing/12345', price: 45, currency: 'USD', category: 'Accessories', availability_status: 'unknown', merchant_id: 'etsy-leathercraft', is_active: false, has_affiliate_link: false, created_at: '2024-03-12', updated_at: '2024-03-12' },
];

export const mockAffiliateLinks: AffiliateLink[] = [
  { id: '1', product_id: '1', product_name: 'Sony WH-1000XM5 Headphones', short_code: 'sony-xm5', affiliate_url: 'https://amazon.com/dp/B09XS7JWHH?tag=mystore-20&linkCode=ll1', clicks: 1243, conversions: 87, revenue: 2610, health_status: 'healthy', health_status_code: 200, health_last_checked: '2024-03-15T10:30:00Z', created_at: '2024-01-21' },
  { id: '2', product_id: '2', product_name: 'Kindle Paperwhite', short_code: 'kindle-pw', affiliate_url: 'https://amazon.com/dp/B08KTZ8249?tag=mystore-20&linkCode=ll1', clicks: 892, conversions: 45, revenue: 630, health_status: 'healthy', health_status_code: 200, health_last_checked: '2024-03-15T10:30:00Z', created_at: '2024-01-23' },
  { id: '3', product_id: '4', product_name: 'MacBook Pro 14"', short_code: 'mbp-14', affiliate_url: 'https://bestbuy.com/macbook-pro-14?ref=aff123&irclickid=sub1', clicks: 567, conversions: 12, revenue: 1440, health_status: 'broken', health_status_code: 404, health_last_checked: '2024-03-15T10:30:00Z', health_error: 'Product page returned 404', created_at: '2024-02-19' },
];

export const mockUserCredentials: UserCredential[] = [
  { id: 'uc1', network_id: 'n1', network_name: 'Amazon Associates', affiliate_id: 'mystore-20', has_api_token: true },
  { id: 'uc2', network_id: 'n4', network_name: 'Rakuten Advertising', affiliate_id: 'rak-12345', has_api_token: false },
];

