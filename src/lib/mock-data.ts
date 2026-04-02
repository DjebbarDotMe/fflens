export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  base_url: string;
  affiliate_param_template: string;
  network_type: 'amazon' | 'shareasale' | 'cj' | 'rakuten' | 'custom';
  product_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  brand_name: string;
  name: string;
  description: string;
  image_url: string;
  original_url: string;
  price: number;
  currency: string;
  category: string;
  is_active: boolean;
  has_affiliate_link: boolean;
  created_at: string;
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
  created_at: string;
}

export interface ClickData {
  date: string;
  clicks: number;
  conversions: number;
}

export const mockBrands: Brand[] = [
  { id: '1', name: 'Amazon', slug: 'amazon', logo_url: '', base_url: 'https://amazon.com', affiliate_param_template: '{original_url}?tag={affiliate_id}&linkCode=ll1', network_type: 'amazon', product_count: 45, created_at: '2024-01-15' },
  { id: '2', name: 'Nike', slug: 'nike', logo_url: '', base_url: 'https://nike.com', affiliate_param_template: '{original_url}?clickId={affiliate_id}&utm_source=affiliate', network_type: 'cj', product_count: 23, created_at: '2024-02-01' },
  { id: '3', name: 'Best Buy', slug: 'bestbuy', logo_url: '', base_url: 'https://bestbuy.com', affiliate_param_template: '{original_url}?ref={affiliate_id}&irclickid={sub_id}', network_type: 'rakuten', product_count: 18, created_at: '2024-02-15' },
  { id: '4', name: 'Walmart', slug: 'walmart', logo_url: '', base_url: 'https://walmart.com', affiliate_param_template: '{original_url}?affiliates_ad_id={affiliate_id}&campaign_id={sub_id}', network_type: 'shareasale', product_count: 31, created_at: '2024-03-01' },
  { id: '5', name: 'Etsy', slug: 'etsy', logo_url: '', base_url: 'https://etsy.com', affiliate_param_template: '{original_url}?click_key={affiliate_id}&click_sum={sub_id}', network_type: 'custom', product_count: 12, created_at: '2024-03-10' },
];

export const mockProducts: Product[] = [
  { id: '1', brand_id: '1', brand_name: 'Amazon', name: 'Sony WH-1000XM5 Headphones', description: 'Premium noise-canceling wireless headphones', image_url: '', original_url: 'https://amazon.com/dp/B09XS7JWHH', price: 348, currency: 'USD', category: 'Electronics', is_active: true, has_affiliate_link: true, created_at: '2024-01-20' },
  { id: '2', brand_id: '1', brand_name: 'Amazon', name: 'Kindle Paperwhite', description: '6.8" display, adjustable warm light', image_url: '', original_url: 'https://amazon.com/dp/B08KTZ8249', price: 139.99, currency: 'USD', category: 'Electronics', is_active: true, has_affiliate_link: true, created_at: '2024-01-22' },
  { id: '3', brand_id: '2', brand_name: 'Nike', name: 'Air Max 90', description: 'Classic sneakers with visible Air cushioning', image_url: '', original_url: 'https://nike.com/air-max-90', price: 130, currency: 'USD', category: 'Footwear', is_active: true, has_affiliate_link: false, created_at: '2024-02-05' },
  { id: '4', brand_id: '3', brand_name: 'Best Buy', name: 'MacBook Pro 14"', description: 'M3 Pro chip, 18GB RAM', image_url: '', original_url: 'https://bestbuy.com/macbook-pro-14', price: 1999, currency: 'USD', category: 'Electronics', is_active: true, has_affiliate_link: true, created_at: '2024-02-18' },
  { id: '5', brand_id: '4', brand_name: 'Walmart', name: 'Instant Pot Duo 7-in-1', description: 'Multi-use pressure cooker', image_url: '', original_url: 'https://walmart.com/instant-pot', price: 89.99, currency: 'USD', category: 'Kitchen', is_active: true, has_affiliate_link: false, created_at: '2024-03-05' },
  { id: '6', brand_id: '5', brand_name: 'Etsy', name: 'Handmade Leather Wallet', description: 'Personalized genuine leather bifold wallet', image_url: '', original_url: 'https://etsy.com/listing/12345', price: 45, currency: 'USD', category: 'Accessories', is_active: false, has_affiliate_link: false, created_at: '2024-03-12' },
];

export const mockAffiliateLinks: AffiliateLink[] = [
  { id: '1', product_id: '1', product_name: 'Sony WH-1000XM5 Headphones', short_code: 'sony-xm5', affiliate_url: 'https://amazon.com/dp/B09XS7JWHH?tag=mystore-20&linkCode=ll1', clicks: 1243, conversions: 87, revenue: 2610, created_at: '2024-01-21' },
  { id: '2', product_id: '2', product_name: 'Kindle Paperwhite', short_code: 'kindle-pw', affiliate_url: 'https://amazon.com/dp/B08KTZ8249?tag=mystore-20&linkCode=ll1', clicks: 892, conversions: 45, revenue: 630, created_at: '2024-01-23' },
  { id: '3', product_id: '4', product_name: 'MacBook Pro 14"', short_code: 'mbp-14', affiliate_url: 'https://bestbuy.com/macbook-pro-14?ref=aff123&irclickid=sub1', clicks: 567, conversions: 12, revenue: 1440, created_at: '2024-02-19' },
];

export const mockClicksOverTime: ClickData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: Math.floor(Math.random() * 150) + 30,
    conversions: Math.floor(Math.random() * 15) + 2,
  };
});
