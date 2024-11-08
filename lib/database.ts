import { createClient } from '@supabase/supabase-js';
import { Product, Vendor, ProductChange, ScrapingJob } from './types';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function createVendor(vendor: Omit<Vendor, 'id' | 'lastScraped' | 'productCount'>): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert([{ ...vendor, lastScraped: new Date(), productCount: 0 }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVendor(id: string): Promise<Vendor | null> {
  const { data } = await supabase
    .from('vendors')
    .select()
    .eq('id', id)
    .single();

  return data;
}

export async function createScrapingJob(vendorId: string): Promise<ScrapingJob> {
  const { data, error } = await supabase
    .from('scraping_jobs')
    .insert([{
      vendorId,
      status: 'pending',
      startedAt: new Date(),
      totalProducts: 0,
      processedProducts: 0,
      changes: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateScrapingJob(
  id: string,
  update: Partial<ScrapingJob>
): Promise<void> {
  const { error } = await supabase
    .from('scraping_jobs')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

export async function compareAndUpdateProduct(
  newProduct: Omit<Product, 'id' | 'lastChecked' | 'hash'>,
  jobId: string
): Promise<ProductChange[]> {
  const changes: ProductChange[] = [];
  const productHash = generateProductHash(newProduct);

  // Check if product exists
  const { data: existingProduct } = await supabase
    .from('products')
    .select()
    .eq('url', newProduct.url)
    .single();

  if (!existingProduct) {
    // New product
    await supabase.from('products').insert([{
      ...newProduct,
      lastChecked: new Date(),
      hash: productHash
    }]);
    return [];
  }

  // Compare fields and record changes
  const fieldsToCompare: (keyof Product)[] = ['price', 'title', 'description', 'image', 'inStock'];
  
  for (const field of fieldsToCompare) {
    if (newProduct[field] !== existingProduct[field]) {
      changes.push({
        productId: existingProduct.id,
        field,
        oldValue: existingProduct[field],
        newValue: newProduct[field],
        detectedAt: new Date()
      });
    }
  }

  if (changes.length > 0) {
    // Update product
    await supabase
      .from('products')
      .update({
        ...newProduct,
        lastChecked: new Date(),
        hash: productHash
      })
      .eq('id', existingProduct.id);

    // Record changes
    await supabase
      .from('product_changes')
      .insert(changes.map(change => ({
        ...change,
        jobId
      })));
  }

  return changes;
}

function generateProductHash(product: Partial<Product>): string {
  const relevantData = {
    title: product.title,
    price: product.price,
    description: product.description,
    image: product.image,
    inStock: product.inStock
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(relevantData))
    .digest('hex');
}