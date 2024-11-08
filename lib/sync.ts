import { supabase } from './database';
import { ShopifyClient } from './shopify';
import { Product, ProductChange } from './types';

export async function syncChangesToShopify(shopifyClient: ShopifyClient): Promise<void> {
  // Get unsynced changes
  const { data: changes } = await supabase
    .from('product_changes')
    .select(`
      *,
      products (*)
    `)
    .eq('synced_to_shopify', false)
    .order('detected_at', { ascending: true });

  if (!changes) return;

  for (const change of changes) {
    try {
      const product = change.products as Product;

      if (!product.shopify_id) {
        // New product
        const shopifyProduct = await shopifyClient.createProduct(product);
        
        await supabase
          .from('products')
          .update({
            shopify_id: shopifyProduct.id,
            shopify_synced: true
          })
          .eq('id', product.id);
      } else {
        // Update existing product
        await shopifyClient.updateProduct(product.shopify_id, {
          [change.field]: change.new_value
        });
      }

      // Mark change as synced
      await supabase
        .from('product_changes')
        .update({ synced_to_shopify: true })
        .eq('id', change.id);
    } catch (error) {
      console.error(`Failed to sync change ${change.id}:`, error);
    }
  }
}