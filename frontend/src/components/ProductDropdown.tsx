import  { useState, useRef, useEffect } from 'react';
import { ChevronDown, Package, Grid3X3, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategoriesApi } from '../api/categoryApi/categoryApi';
import { getSubCategoriesByCategoryApi } from '../api/subCategoryApi/subCategoryApi';
import { getProductsByCategoryApi } from '../api/adminApi/productApi';

interface Category {
  _id: string;
  name: string;
  image?: {
    url: string;
    public_id: string;
  };
}

interface SubCategory {
  _id: string;
  name: string;
  image: {
    url: string;
    public_id: string;
  };
  category: Array<{
    _id: string;
    name: string;
  }>;
}

interface ProductDropdownProps {
  mobile?: boolean;
}

const ProductDropdown = ({ mobile = false }: ProductDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<{ [key: string]: SubCategory[] }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategoriesApi,
  });

  // Sort categories A-Z
  const categories = categoriesData.sort((a: Category, b: Category) => 
    a.name.localeCompare(b.name)
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle category hover/click to expand subcategories
  const handleCategoryInteraction = async (categoryId: string) => {
    setExpandedCategory(categoryId);

    // Prefetch into React Query cache (used by CategoryPage on navigation)
    queryClient.prefetchQuery({
      queryKey: ['subcategories-by-category', categoryId],
      queryFn: () => getSubCategoriesByCategoryApi(categoryId),
      staleTime: 0,
    });
    queryClient.prefetchQuery({
      queryKey: ['products-by-category', categoryId],
      queryFn: () => getProductsByCategoryApi(categoryId),
      staleTime: 0,
    });

    // Also populate local state for dropdown display
    if (!subCategories[categoryId]) {
      try {
        const cached = queryClient.getQueryData<SubCategory[]>(['subcategories-by-category', categoryId]);
        if (cached) {
          const sorted = [...cached].sort((a, b) => a.name.localeCompare(b.name));
          setSubCategories(prev => ({ ...prev, [categoryId]: sorted }));
        } else {
          const subs = await getSubCategoriesByCategoryApi(categoryId);
          const sortedSubs = subs.sort((a: SubCategory, b: SubCategory) => a.name.localeCompare(b.name));
          setSubCategories(prev => ({ ...prev, [categoryId]: sortedSubs }));
        }
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
      }
    }
  };

  // Handle mouse enter/leave for smooth interaction
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setExpandedCategory(null);
    }, 200); // Reduced delay for faster response
  };

  if (mobile) {
    // Hamburger menu for mobile
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-primary-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-200"
        >
          <Menu size={24} />
        </button>
        {/* Mobile Drawer */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex" onClick={() => { setIsOpen(false); setExpandedCategory(null); }}>
            <div className="bg-white w-4/5 max-w-xs h-full shadow-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold text-primary-700">Categories</span>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-primary-600 p-1">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {categoriesLoading ? (
                  <div className="space-y-3">
                    {(Array.isArray([...Array(8)]) ? [...Array(8)] : []).map((_, i) => (
                      <div key={i} className="h-8 bg-slate-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(Array.isArray(categories) ? categories : []).map((category: Category) => (
                      <li key={category._id}>
                        <button
                          className="flex items-center w-full text-left px-2 py-2 rounded hover:bg-primary-50 text-slate-700 font-medium"
                          onClick={async () => {
                            await handleCategoryInteraction(category._id);
                            setExpandedCategory(expandedCategory === category._id ? null : category._id);
                          }}
                        >
                          <span className="mr-2 w-7 h-7 flex items-center justify-center bg-primary-50 rounded-lg">
                            {category.image?.url ? (
                              <img src={category.image.url} alt={category.name} className="w-6 h-6 object-cover rounded" />
                            ) : (
                              <span className="text-primary-700 font-bold text-base">{category.name.charAt(0).toUpperCase()}</span>
                            )}
                          </span>
                          <span className="flex-1 truncate">{category.name}</span>
                          <ChevronDown size={16} className={`ml-1 transition-transform ${expandedCategory === category._id ? 'rotate-180' : ''}`} />
                        </button>
                        {/* Subcategories */}
                        {expandedCategory === category._id && subCategories[category._id] && (
                          <ul className="ml-7 mt-1 space-y-1">
                            {(Array.isArray(subCategories[category._id]) ? subCategories[category._id] : []).map((subCategory: SubCategory) => (
                              <li key={subCategory._id}>
                                <Link
                                  to={`/subcategory/${subCategory._id}`}
                                  className="block px-2 py-1 text-sm text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                                  onClick={() => setIsOpen(false)}
                                >
                                  {subCategory.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-6">
                <Link
                  to="/products"
                  className="block w-full text-center py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Browse All Products
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop/Tablet dropdown (original)
  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Products Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-all duration-200 group"
      >
        <Package size={20} className="group-hover:text-primary-600" />
        <span className='text-lg'>Shop by Category</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } group-hover:text-primary-600`}
        />
      </button>

      {/* Modern Mega Menu Dropdown */}
      {isOpen && (
        <div 
          className="fixed top-[72px] left-0 right-0 z-50 bg-white/20 backdrop-blur-md"
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            // Close if clicking on the overlay background (not the content)
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              setExpandedCategory(null);
            }
          }}
        >
          <div className="container mx-auto px-4 py-3">
            <div 
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
              onMouseEnter={handleMouseEnter}
            >
              {categoriesLoading ? (
                <div className="p-8">
                  <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {(Array.isArray([...Array(10)]) ? [...Array(10)] : []).map((_, i) => (
                      <div key={i} className="bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl p-4 h-32 flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                        <div className="h-3 bg-slate-200 rounded-full w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">Shop by Category</h2>
                    <p className="text-slate-500">Explore our wide range of products</p>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {categories.map((category: Category) => (
                      <div key={category._id} className="group relative">
                        {/* Category Card */}
                        <Link 
                          to={`/category/${category._id}`}
                          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-white via-slate-50 to-slate-100/50 border border-slate-100 hover:border-primary-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 p-4 h-32 flex flex-col items-center justify-center"
                          onMouseEnter={() => handleCategoryInteraction(category._id)}
                          onClick={() => setIsOpen(false)}
                        >
                          {/* Background Pattern */}
                          <div className="absolute inset-0 bg-linear-to-br from-primary-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Category Image */}
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-12 h-12 rounded-xl overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-lg bg-linear-to-br from-slate-100 to-slate-200">
                              {category.image?.url ? (
                                <img
                                  src={category.image.url}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-linear-to-br from-primary-100 via-primary-200 to-primary-300 flex items-center justify-center">
                                  <span className="text-primary-700 font-bold text-lg">
                                    {category.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <h3 className="font-medium text-xs text-center text-slate-700 group-hover:text-primary-700 transition-colors duration-300 leading-tight px-1">
                            {category.name}
                          </h3>

                          {/* Animated Border */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-primary-400 via-primary-500 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></div>
                        </Link>

                        {/* Subcategories Floating Popup */}
                        {expandedCategory === category._id && subCategories[category._id] && subCategories[category._id].length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-60 min-w-[220px] backdrop-blur-sm">
                            <div className="space-y-1">
                              {subCategories[category._id].slice(0, 6).map((subCategory: SubCategory) => (
                                <Link
                                  key={subCategory._id}
                                  to={`/subcategory/${subCategory._id}`}
                                  className="flex items-center px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-primary-600 hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100/50 rounded-xl transition-all duration-200 group"
                                  onClick={() => setIsOpen(false)}
                                >
                                  <div className="w-2 h-2 rounded-full bg-primary-400 mr-3 opacity-0 group-hover:opacity-100 transition-opacity scale-0 group-hover:scale-100 transform duration-200"></div>
                                  <span className="truncate flex-1">{subCategory.name}</span>
                                  <div className="w-1 h-4 bg-linear-to-b from-primary-400 to-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ml-2"></div>
                                </Link>
                              ))}
                              {subCategories[category._id].length > 6 && (
                                <Link
                                  to={`/category/${category._id}`}
                                  className="block px-3 py-2 text-xs text-primary-600 hover:bg-linear-to-r hover:from-primary-50 hover:to-primary-100 rounded-xl transition-all font-medium border-t border-slate-100 mt-2 pt-3"
                                  onClick={() => setIsOpen(false)}
                                >
                                  <span className="flex items-center justify-center">
                                    View all {subCategories[category._id].length} items
                                    <span className="ml-1 text-primary-400">→</span>
                                  </span>
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Enhanced Footer */}
                  <div className="mt-10 pt-8 border-t border-gradient-to-r from-transparent via-slate-200 to-transparent">
                    <div className="flex items-center justify-center">
                      <Link
                        to="/products"
                        className="inline-flex items-center space-x-3 py-4 px-8 bg-linear-to-r from-primary-600 via-primary-700 to-primary-800 text-white rounded-2xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 font-semibold relative overflow-hidden group"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Grid3X3 size={20} className="relative z-10" />
                        <span className="relative z-10">Browse All Products</span>
                        <div className="w-2 h-2 bg-white rounded-full opacity-75 animate-pulse relative z-10"></div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDropdown;