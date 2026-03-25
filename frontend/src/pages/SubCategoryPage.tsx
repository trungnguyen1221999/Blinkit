import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSubCategoriesApi } from '../api/subCategoryApi/subCategoryApi';
import { getProductsBySubCategoryApi } from '../api/adminApi/productApi';
import ProductCard from '../components/ProductCard';

// --- Helper: slugify ---
function slugify(str: string = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- Helper: extract Mongo ID ---
function extractId(rawId: string | undefined) {
  if (!rawId) return '';
  const match = rawId.match(/([a-f0-9]{24})$/);
  return match ? match[1] : rawId;
}

const SubCategoryPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const subCategoryId = extractId(params.subCategoryId);

  // Fetch subcategories
  const { data: subCategories = [], isLoading } = useQuery({
    queryKey: ['subcategories'],
    queryFn: getSubCategoriesApi,
  });

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', subCategoryId],
    queryFn: () => getProductsBySubCategoryApi(subCategoryId),
    enabled: !!subCategoryId,
  });

  const currentSubCategory = subCategories.find(
    (sub: any) => sub._id === subCategoryId
  );

  // Build SEO URL
  const seoSlug = currentSubCategory ? slugify(currentSubCategory.name) : '';
  const seoUrl = currentSubCategory
    ? `/subcategory/${seoSlug}-${currentSubCategory._id}`
    : '';

  // Redirect if URL not SEO-friendly
  useEffect(() => {
    if (currentSubCategory && location.pathname !== seoUrl) {
      navigate(seoUrl, { replace: true });
    }
  }, [location.pathname, seoUrl, currentSubCategory, navigate]);

  // Loading UI — only block on products, subcategories load in background for display
  if (isLoadingProducts) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not found
  if (!currentSubCategory) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Subcategory Not Found</h1>
        <p className="text-slate-500">The subcategory you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative flex flex-col md:flex-row items-center md:items-stretch gap-10 mb-16 bg-gradient-to-br from-primary-50 to-white rounded-3xl shadow-xl border border-primary-100/40 overflow-hidden">
        {/* --- IMAGE --- */}
        <div className="flex items-center justify-center w-full md:w-1/2 bg-white/80 p-8 md:p-12 lg:p-16">
          <img
            src={currentSubCategory.image?.url || '/images/placeholder-category.jpg'}
            alt={currentSubCategory.name}
            className="object-contain w-full h-64 md:h-80 lg:h-96 rounded-2xl bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/placeholder-category.jpg';
            }}
          />
        </div>
        {/* --- TEXT --- */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-0 py-8 md:py-0 text-left">
          <div className="w-fit bg-primary-100/60 font-semibold px-4 py-1 rounded-full text-xs mb-4 border border-primary-100 shadow flex items-center gap-2">
            {(Array.isArray(currentSubCategory.category) ? currentSubCategory.category : []).map((cat: any, index: number) => (
              <span key={cat._id}>
                {index > 0 && ' / '}
                <Link
                  to={`/category/${slugify(cat.name)}-${cat._id}`}
                  className="text-green-800 hover:underline font-semibold transition-colors"
                >
                  {cat.name}
                </Link>
              </span>
            ))}
            {' / '}
            <span className="text-primary-600 font-semibold">
              {currentSubCategory.name}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 leading-tight">
            {currentSubCategory.name}
          </h1>
          <span className="w-fit bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
            {products.length} products
          </span>
        </div>
      </div>
      {/* --- PRODUCT GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {(Array.isArray(products) ? products : []).map((product: any) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      {/* EMPTY STATE */}
      {products.length === 0 && (
        <div className="bg-slate-50 rounded-xl p-8 max-w-md mx-auto mt-12 text-center text-slate-500 shadow border border-primary-100">
          No products to display.
        </div>
      )}
    </div>
  );
};

export default SubCategoryPage;
