import { NextResponse } from 'next/server';
import { findSitemaps, extractProductUrls } from '@/lib/sitemap';
import { createVendor, createScrapingJob } from '@/lib/database';
import { processVendorProducts } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const { url, vendorName } = await req.json();
    
    if (!url || !vendorName) {
      return NextResponse.json(
        { error: 'URL and vendor name are required' },
        { status: 400 }
      );
    }

    // Create vendor
    const vendor = await createVendor({
      name: vendorName,
      url,
      active: true
    });

    // Find sitemaps
    const sitemaps = await findSitemaps(url);
    if (sitemaps.length === 0) {
      return NextResponse.json({ error: 'No sitemaps found' }, { status: 404 });
    }

    // Extract product URLs from all sitemaps
    const productUrlsPromises = sitemaps.map(sitemap => extractProductUrls(sitemap));
    const productUrlsArrays = await Promise.all(productUrlsPromises);
    const productUrls = [...new Set(productUrlsArrays.flat())];

    if (productUrls.length === 0) {
      return NextResponse.json({ error: 'No product URLs found' }, { status: 404 });
    }

    // Create scraping job
    const job = await createScrapingJob(vendor.id);

    // Start processing in the background
    processVendorProducts(productUrls, vendorName, job.id);

    return NextResponse.json({
      message: 'Scraping job started',
      jobId: job.id,
      vendorId: vendor.id,
      totalProducts: productUrls.length
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping job' },
      { status: 500 }
    );
  }
}