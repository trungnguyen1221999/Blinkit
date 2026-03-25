import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Percent } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllProductsApi } from '../api/adminApi/productApi';
import { Link } from 'react-router-dom';

interface Product {
  _id: string;
  name: string;
  images: Array<{
    url: string;
    public_id: string;
  }>;
  category: Array<{
    _id: string;
    name: string;
  }>;
  SubCategory: Array<{
    _id: string;
    name: string;
  }>;
  unit: string;
  stock: number;
  price: number;
  discount?: number;
  description: string;
  publish: boolean;
  createdAt: string;
  updatedAt: string;
}

const SaleOffSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying] = useState(true);
  const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProductsApi,
  });

  // Filter only published products with discount > 0
  const saleProducts: Product[] = Array.isArray(products)
    ? products.filter((product: Product) => product.publish && typeof product.discount === 'number' && product.discount > 0)
    : [];

  // Responsive slides to show
  const getSlidesToShow = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 2;
      if (window.innerWidth < 1024) return 4;
      return 6;
    }
    return 6;
  };
  const [slidesToShow, setSlidesToShow] = useState(getSlidesToShow());
  useEffect(() => {
    const handleResize = () => setSlidesToShow(getSlidesToShow());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate total pages needed
  const totalSlides = Math.ceil(saleProducts.length / slidesToShow);
  const canSlide = saleProducts.length > slidesToShow;

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && canSlide && totalSlides > 0) {
      slideIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 4000);
    }
    return () => {
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    };
  }, [isAutoPlaying, canSlide, totalSlides]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

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

  if (!saleProducts.length) {
    return null;
  }

  return (
    <section className="w-full py-12 bg-gradient-to-br from-pink-50 to-yellow-50 rounded-3xl shadow-2xl my-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Percent size={32} className="text-pink-500 drop-shadow-lg animate-bounce" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-pink-600 tracking-tight drop-shadow-sm">
              Hot Sale Off
            </h2>
            <span className="bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-full shadow animate-pulse">
              {saleProducts.length} deals
            </span>
          </div>
          <Link
            to="/sale-off"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-pink-500 text-white shadow hover:bg-pink-600 transition-all duration-200 border border-pink-200/40"
          >
            View All
          </Link>
        </div>

        {/* Slideshow */}
        <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md border border-pink-100 shadow-xl">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {(Array.isArray(Array.from({ length: totalSlides })) ? Array.from({ length: totalSlides }) : []).map((_, pageIndex) => {
              const startIndex = pageIndex * slidesToShow;
              const pageItems = saleProducts.slice(startIndex, startIndex + slidesToShow);
              return (
                <div
                  key={pageIndex}
                  className={`grid shrink-0 w-full gap-4 px-6 py-4 ${
                    slidesToShow === 2
                      ? 'grid-cols-2'
                      : slidesToShow === 4
                      ? 'grid-cols-4'
                      : 'grid-cols-6'
                  }`}
                >
                  {(Array.isArray(pageItems) ? pageItems : []).map((product) => {
                    const originalPrice = product.price;
                    const discount = typeof product.discount === 'number' ? product.discount : 0;
                    const discountedPrice = originalPrice * (1 - discount / 100);
                    return (
                      <Link
                        key={product._id}
                        to={`/product/${product._id}`}
                        className="group block h-full"
                      >
                        <div className="relative bg-white rounded-xl p-2 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden h-full flex flex-col border-2 border-pink-100 hover:border-pink-300">
                          {/* Discount Badge */}
                          <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg animate-bounce">
                            -{discount}%
                          </div>
                          {/* Image */}
                          <div className="relative mb-2 flex items-center justify-center overflow-hidden rounded-md bg-pink-50 min-h-[120px]" style={{ height: '140px' }}>
                            <img
                              src={product.images?.[0]?.url || '/images/placeholder-product.jpg'}
                              alt={product.name}
                              className="max-h-[120px] w-auto h-auto object-contain mx-auto group-hover:scale-110 transition-transform duration-500"
                              style={{ maxHeight: '120px', width: 'auto', height: 'auto' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&crop=center';
                              }}
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-2 bg-pink-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                              <div className="bg-white shadow-lg rounded-full p-2 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                <ShoppingCart size={16} className="text-pink-400" />
                              </div>
                            </div>
                          </div>
                          {/* Content */}
                          <div className="text-center grow flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-800 text-xs group-hover:text-pink-500 transition-colors duration-300 line-clamp-1 mb-1">
                                {product.name}
                              </h3>
                              <p className="text-xs text-slate-500 mb-1 line-clamp-1">
                                {product.unit}
                              </p>
                            </div>
                            {/* Price */}
                            <div className="mb-1">
                              <span className="text-sm font-bold text-pink-500">
                                ${discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-slate-400 line-through ml-1">
                                ${originalPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="inline-flex items-center justify-center bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold mt-1">
                              <span>Add to Cart</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* Navigation Arrows */}
          {canSlide && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-pink-200 hover:bg-pink-300 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group z-10"
              >
                <ChevronLeft size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-200 hover:bg-pink-300 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group z-10"
              >
                <ChevronRight size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default SaleOffSlideshow;
