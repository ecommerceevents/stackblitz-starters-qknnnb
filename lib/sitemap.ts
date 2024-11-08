import axios from 'axios';
import * as cheerio from 'cheerio';

export async function findSitemaps(storeUrl: string): Promise<string[]> {
  try {
    // Try robots.txt first
    const robotsUrl = new URL('/robots.txt', storeUrl).toString();
    const robotsResponse = await axios.get(robotsUrl);
    const sitemapUrls = robotsResponse.data
      .split('\n')
      .filter((line: string) => line.toLowerCase().includes('sitemap:'))
      .map((line: string) => line.split(': ')[1]?.trim())
      .filter(Boolean);

    if (sitemapUrls.length > 0) {
      return sitemapUrls;
    }

    // Try common sitemap locations
    const commonLocations = [
      '/sitemap.xml',
      '/sitemap_products.xml',
      '/sitemap/sitemap.xml',
      '/sitemaps/sitemap.xml'
    ];

    for (const location of commonLocations) {
      try {
        const sitemapUrl = new URL(location, storeUrl).toString();
        await axios.get(sitemapUrl);
        return [sitemapUrl];
      } catch {
        continue;
      }
    }

    return [];
  } catch {
    return [];
  }
}

export async function extractProductUrls(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(sitemapUrl);
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    return $('url loc')
      .map((_, element) => $(element).text())
      .get()
      .filter(url => 
        url.includes('/product/') || 
        url.includes('/products/') || 
        url.includes('/p/')
      );
  } catch {
    return [];
  }
}