import { NextResponse } from 'next/server';
import { supabase } from '@/lib/database';
import { ShopifyClient } from '@/lib/shopify';
import { syncChangesToShopify } from '@/lib/sync';

export async function POST(req: Request) {
  try {
    const { data: settings } = await supabase
      .from('shopify_settings')
      .select()
      .single();

    if (!settings) {
      return NextResponse.json(
        { error: 'Shopify settings not configured' },
        { status: 400 }
      );
    }

    const shopifyClient = new ShopifyClient(
      settings.shop_name,
      settings.access_token,
      settings.api_version
    );

    await syncChangesToShopify(shopifyClient);

    return NextResponse.json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync with Shopify' },
      { status: 500 }
    );
  }
}