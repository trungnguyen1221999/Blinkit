import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategoriesApi } from '../api/categoryApi/categoryApi';
import { getProductsByCategoryApi } from '../api/adminApi/productApi';
import { getSubCategoriesByCategoryApi } from '../api/subCategoryApi/subCategoryApi';
import ProductCard from '../components/ProductCard';
import { Package, Star } from 'lucide-react';
import { customCategoryData } from '../data/customCategoryData';

const CategoryPage = () => {
  const params = useParams();
  // Lấy id robust: nếu categoryId dài hơn 24 ký tự, tách 24 ký tự cuối (sau dấu - cuối cùng)
  let categoryId = params.categoryId;
  if (categoryId && categoryId.length > 24) {
    const match = categoryId.match(/([a-f0-9]{24})$/);
    if (match) categoryId = match[1];
  }
  // Fetch all categories to get the specific one
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategoriesApi,
  });
  // Find the current category by id only
  const currentCategory = categories.find((cat: any) => cat._id === categoryId);

  // Fetch products for this category — use categoryId from URL directly (no waterfall)
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-by-category', categoryId],
    queryFn: () => getProductsByCategoryApi(categoryId!),
    enabled: !!categoryId,
  });

  // Fetch subcategories for this category — use categoryId from URL directly (no waterfall)
  const { data: subCategories = [] } = useQuery({
    queryKey: ['subcategories-by-category', categoryId],
    queryFn: () => getSubCategoriesByCategoryApi(categoryId!),
    enabled: !!categoryId,
  });

  // Get custom data for this category
  const custom = customCategoryData.find((c) => c._id === categoryId);
  const CustomIcon = custom?.icon;
  const bgColor = custom?.bgColor || 'bg-white';

  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-200 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Category Not Found</h1>
            <p className="text-slate-600 text-lg">The category you're looking for doesn't exist or has been moved.</p>
          </div>
        </div>
      </div>
    );
  }

  // HERO SECTION (style giống CategorySlideshow, lấy hết custom)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white mt-15">
      <main className="container mx-auto px-0 md:px-4 pb-12">
        <div className={`${bgColor} rounded-t-3xl overflow-hidden mb-0`}>
          <div className="flex flex-col md:flex-row items-center min-h-[400px] gap-8 md:gap-12 p-6 md:p-12">
            {/* Image Side */}
            <div className="flex-1 flex justify-center items-center">
              <img
                src={currentCategory.image?.url || '/images/placeholder-product.jpg'}
                alt={currentCategory.name}
                className="h-auto max-h-80 w-auto object-contain hover:scale-105 transition-transform duration-700 bg-transparent"
              />
            </div>
            {/* Content Side */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                {CustomIcon && (
                  <span className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl ring-2 ring-primary-200/60 mb-1 ${bgColor}`}>
                    <CustomIcon size={38} strokeWidth={2.2} className="text-primary-600 drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]" style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.10))' }} />
                  </span>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">{custom?.title || currentCategory.name}</h1>
              </div>
              <p className="text-lg text-slate-600 mb-4 leading-relaxed">{custom?.desc || currentCategory.description}</p>
              <div className="flex flex-wrap gap-3 mb-4 justify-center md:justify-start">
                <span className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-bold px-4 py-1.5 rounded-2xl shadow border border-primary-200/30">
                  <Package size={18} className="text-primary-400 drop-shadow-sm" />
                  <span className="tracking-wide">{products.length} products</span>
                </span>
                <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-bold px-4 py-1.5 rounded-2xl shadow border border-green-200/30">
                  <Star size={18} className="text-green-500 drop-shadow-sm" />
                  <span className="tracking-wide">{custom?.authenticityLabel || '100% Authentic'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Subcategory Grid */}
        {subCategories.length > 0 && (
          <div className="mb-12 mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 px-4">
              {(Array.isArray(subCategories) ? subCategories : []).map((sub: any) => (
                <Link
                  key={sub._id || sub}
                  to={`/subcategory/${slugify(sub.name)}-${sub._id}`}
                  className="flex flex-col items-center bg-white rounded-xl shadow border border-slate-100 p-4 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-50 flex items-center justify-center mb-2">
                    <img src={sub.image?.url || '/images/placeholder-product.jpg'} alt={sub.name || sub} className="object-contain w-full h-full" />
                  </div>
                  <span className="text-base font-semibold text-slate-800 text-center line-clamp-2">{sub.name || sub}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* Product Grid */}
        <h2 className="text-2xl font-bold text-primary-700 mb-4 px-4">Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center text-slate-500 text-lg py-12">No products found in this category.</div>
          ) : (
            products.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

// Helper: slugify string (safe)
function slugify(str: any) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default CategoryPage;