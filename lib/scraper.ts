import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from './types';
import { compareAndUpdateProduct } from './database';

export async function scrapeProduct(url: string, vendor: string): Promise<Omit<Product, 'id' | 'lastChecked' | 'hash'>> {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  
  const sku = extractSku($) || generateSkuFromUrl(url);
  
  return {
    title: extractTitle($),
    price: extractPrice($),
    description: extractDescription($),
    image: extractImage($),
    url,
    vendor,
    sku,
    inStock: checkInStock($)
  };
}

function extractTitle($: cheerio.CheerioAPI): string {
  return (
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    ''
  );
}

function extractPrice($: cheerio.CheerioAPI): string {
  const price = 
    $('.price, [class*="price"]').first().text().trim() ||
    $('meta[property="product:price:amount"]').attr('content') ||
    '';
  
  // Clean up price string
  return price.replace(/[^\d.,]/g, '');
}

function extractDescription($: cheerio.CheerioAPI): string {
  return (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('.product-description').text().trim() ||
    ''
  );
}

function extractImage($: cheerio.CheerioAPI): string {
  const image = 
    $('meta[property="og:image"]').attr('content') ||
    $('.product-image img').first().attr('src') ||
    $('img').first().attr('src') ||
    '';
    
  return image.startsWith('//') ? `https:${image}` : image;
}

function extractSku($: cheerio.CheerioAPI): string | null {
  return (
    $('[data-sku]').attr('data-sku') ||
    $('meta[property="product:sku"]').attr('content') ||
    null
  );
}

function generateSkuFromUrl(url: string): string {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  return pathSegments[pathSegments.length - 1];
}

function checkInStock($: cheerio.CheerioAPI): boolean {
  const outOfStockIndicators = [
    '.out-of-stock',
    '[data-availability="out-of-stock"]',
    '#out-of-stock',
    '.sold-out'
  ];

  const hasOutOfStockElement = outOfStockIndicators.some(selector => $(selector).length > 0);
  if (hasOutOfStockElement) return false;

  const availabilityMeta = $('meta[property="product:availability"]').attr('content');
  if (availabilityMeta?.toLowerCase().includes('out')) return false;

  return true;
}