import { useQuery } from '@tanstack/react-query';
import { getAllProductsApi } from '../api/adminApi/productApi';
import { Link } from 'react-router-dom';
import { Percent } from 'lucide-react';
import { useMemo } from 'react';
import ProductCard from './ProductCard';
import { addToCartApi } from '../api/cartApi';
import { useQueryClient } from '@tanstack/react-query';
import { useCartDrawer } from "./CartDrawerContext";
import { useAuth } from "../Context/AuthContext";

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

const SaleOffGrid = () => {
  const queryClient = useQueryClient();
  const { openDrawer } = useCartDrawer();
  const { user } = useAuth();

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProductsApi,
  });

  // Filter only published products with discount > 0
  const saleProducts: Product[] = useMemo(
    () =>
      Array.isArray(products)
        ? products.filter(
            (product: Product) =>
              product.publish &&
              typeof product.discount === 'number' &&
              product.discount > 0
          )
        : [],
    [products]
  );

  const handleAddToCart = async (product: Product) => {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('guestId', guestId);
    }
    try {
      if (user && user._id) {
        await addToCartApi({ productId: product._id, quantity: 1, userId: user._id });
      } else {
        await addToCartApi({ productId: product._id, quantity: 1, guestId });
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      openDrawer();
    } catch (err) {
      // Optionally handle error
      console.error('Add to cart failed', err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <div className="container mx-auto px-4">
          <div className="h-8 bg-slate-200 rounded-lg w-64 mx-auto animate-pulse mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(Array.isArray([...Array(4)]) ? [...Array(4)] : []).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="w-full h-32 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!saleProducts.length) return null;
  return (
    <section className="w-full py-12 relative rounded-3xl shadow-2xl my-8 overflow-hidden">
      {/* Impressive background gradient and pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-primary-100 via-white via-60% to-red-100 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-200/30 via-transparent to-transparent opacity-60" />
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-red-200 opacity-20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-200 opacity-20 rounded-full blur-2xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Percent size={32} className="text-red-500 drop-shadow-lg animate-bounce" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-red-500 tracking-tight drop-shadow-sm">
              Hot Sale Off
            </h2>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full shadow animate-pulse">
              {saleProducts.length} deals
            </span>
          </div>
          <Link
            to="/sale-off"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white shadow hover:bg-red-600 transition-all duration-200 border border-red-200/40"
          >
            View All
          </Link>
        </div>
        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {(Array.isArray(saleProducts) ? saleProducts.slice(0, 12) : []).map((product) => (
            <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SaleOffGrid;
