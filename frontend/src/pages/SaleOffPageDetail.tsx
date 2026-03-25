import { useQuery } from '@tanstack/react-query';
import { getAllProductsApi } from '../api/adminApi/productApi';
import ProductCard from '../components/ProductCard';

interface Product {
  _id: string;
  name: string;
  images: Array<{
    url: string;
    public_id: string;
  }>;
  unit: string;
  price: number;
  discount?: number;
  publish: boolean;
}

const SaleOffPageDetail = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProductsApi,
  });

  const saleProducts: Product[] = Array.isArray(products)
    ? products.filter((product: Product) => product.publish && typeof product.discount === 'number' && product.discount > 0)
    : [];

  if (isLoading) {
    return <div className="text-center py-12 text-lg">Loading sale products...</div>;
  }

  if (!saleProducts.length) {
    return <div className="text-center py-12 text-lg">No sale products found.</div>;
  }

  return (
    <section className="w-full min-h-screen bg-gradient-to-br from-red-50 via-white to-primary-50 pb-16">
      {/* Hero Section */}
      <div className="relative w-full mb-10 overflow-visible min-h-[113px] md:min-h-[227px] flex flex-col items-center">
        {/* Hero Image with aspect ratio */}
        <div className="w-full aspect-[1690/524] bg-white rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center">
          <img
            src="/images/sale.png"
            alt="Sale Off Hero"
            className="w-full h-full object-cover"
            style={{ aspectRatio: '1690/524' }}
          />
        </div>
        {/* Text Content below image */}
        <div className="flex flex-col items-center text-centerrounded-2xl  px-6 py-8 mx-auto mt-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-red-600  tracking-tight mb-3">
            Big Sale Off
          </h1>
          <p className="text-base md:text-lg text-slate-700 font-medium mb-3">
            Hunt for shocking deals and deep discounts! Don’t miss out on the hottest products at unbeatable prices, only at Blinkit.
          </p>
          <span className="bg-red-100 text-red-700 text-sm font-bold px-4 py-2 rounded-full shadow animate-pulse mt-2">
            {saleProducts.length} products on sale
          </span>
        </div>
      </div>
      {/* Product Grid */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {(Array.isArray(saleProducts) ? saleProducts : []).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SaleOffPageDetail;
