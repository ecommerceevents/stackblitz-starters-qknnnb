export interface Product {
  id: string;
  title: string;
  price: string;
  description: string;
  image: string;
  url: string;
  vendor: string;
  sku: string;
  inStock: boolean;
  lastChecked: Date;
  hash: string;
}

export interface Vendor {
  id: string;
  name: string;
  url: string;
  lastScraped: Date;
  productCount: number;
  active: boolean;
}

export interface ProductChange {
  productId: string;
  field: string;
  oldValue: string;
  newValue: string;
  detectedAt: Date;
}

export interface ScrapingJob {
  id: string;
  vendorId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  totalProducts: number;
  processedProducts: number;
  changes: number;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  priority?: string;
}