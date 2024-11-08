import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {product.image && (
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 truncate">{product.title}</h3>
        <p className="text-green-600 font-medium mb-2">{product.price}</p>
        <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-blue-500 hover:text-blue-600"
        >
          View Product →
        </a>
      </div>
    </div>
  );
}