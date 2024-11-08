import PQueue from 'p-queue';
import { scrapeProduct } from './scraper';
import { compareAndUpdateProduct, updateScrapingJob } from './database';
import { Product, ScrapingJob } from './types';

const queue = new PQueue({ concurrency: 5 });

export async function processVendorProducts(
  urls: string[],
  vendorName: string,
  jobId: string
): Promise<void> {
  const total = urls.length;
  let processed = 0;
  let changes = 0;

  await updateScrapingJob(jobId, {
    status: 'processing',
    totalProducts: total
  });

  const tasks = urls.map(url => async () => {
    try {
      const product = await scrapeProduct(url, vendorName);
      const productChanges = await compareAndUpdateProduct(product, jobId);
      
      processed++;
      changes += productChanges.length;

      // Update job progress
      await updateScrapingJob(jobId, {
        processedProducts: processed,
        changes
      });
    } catch (error) {
      console.error(`Failed to process ${url}:`, error);
    }
  });

  await queue.addAll(tasks);

  await updateScrapingJob(jobId, {
    status: 'completed',
    completedAt: new Date(),
    processedProducts: processed,
    changes
  });
}