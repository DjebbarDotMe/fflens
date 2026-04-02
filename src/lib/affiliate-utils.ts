export function generateAffiliateUrl(
  template: string,
  originalUrl: string,
  params: Record<string, string>
): string {
  let result = template.replace('{original_url}', originalUrl);
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

export function generateShortCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);
}

export const networkTypeLabels: Record<string, string> = {
  amazon: 'Amazon Associates',
  shareasale: 'ShareASale',
  cj: 'CJ Affiliate',
  rakuten: 'Rakuten',
  custom: 'Custom',
};

export const networkTypeColors: Record<string, string> = {
  amazon: 'bg-amber-100 text-amber-800',
  shareasale: 'bg-emerald-100 text-emerald-800',
  cj: 'bg-blue-100 text-blue-800',
  rakuten: 'bg-purple-100 text-purple-800',
  custom: 'bg-muted text-muted-foreground',
};
