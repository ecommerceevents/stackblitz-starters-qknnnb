import axios from 'axios';
import { Product } from './types';

interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  variants: Array<{
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    src: string;
  }>;
}

export class ShopifyClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(shopName: string, accessToken: string, apiVersion: string = '2023-07') {
    this.baseUrl = `https://${shopName}.myshopify.com/admin/api/${apiVersion}`;
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.accessToken,
    };
  }

  async createProduct(product: Product): Promise<ShopifyProduct> {
    const response = await axios.post(
      `${this.baseUrl}/products.json`,
      {
        product: {
          title: product.title,
          body_html: product.description,
          vendor: product.vendor,
          variants: [
            {
              price: product.price,
              sku: product.sku,
              inventory_management: 'shopify',
              inventory_quantity: product.inStock ? 1 : 0,
            },
          ],
          images: [
            {
              src: product.image,
            },
          ],
        },
      },
      { headers: this.headers }
    );

    return response.data.product;
  }

  async updateProduct(shopifyId: string, updates: Partial<Product>): Promise<ShopifyProduct> {
    const response = await axios.put(
      `${this.baseUrl}/products/${shopifyId}.json`,
      {
        product: {
          id: shopifyId,
          title: updates.title,
          body_html: updates.description,
          variants: [
            {
              price: updates.price,
              inventory_quantity: updates.inStock ? 1 : 0,
            },
          ],
          images: updates.image
            ? [
                {
                  src: updates.image,
                },
              ]
            : undefined,
        },
      },
      { headers: this.headers }
    );

    return response.data.product;
  }

  async deleteProduct(shopifyId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/products/${shopifyId}.json`, {
      headers: this.headers,
    });
  }
}