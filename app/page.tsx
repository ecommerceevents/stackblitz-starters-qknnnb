import ProductScraper from '@/components/ProductScraper';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Store Product Scraper
        </h1>
        <ProductScraper />
      </div>
    </main>
  );
}