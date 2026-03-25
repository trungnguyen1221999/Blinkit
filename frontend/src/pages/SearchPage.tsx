import { useLocation, Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllProductsApi } from "../api/adminApi/productApi";
import { getCategoriesApi } from "../api/categoryApi/categoryApi";
import { getSubCategoriesApi } from "../api/subCategoryApi/subCategoryApi";
import ProductCard from "../components/ProductCard";

const SearchPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q")?.toLowerCase() || "";

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: getAllProductsApi,
  });
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: getCategoriesApi,
  });
  const { data: subCategories = [], isLoading: loadingSubCategories } = useQuery({
    queryKey: ["subCategories", "all"],
    queryFn: getSubCategoriesApi,
  });

  const filteredProducts = useMemo(() =>
    Array.isArray(products)
      ? products.filter((p) => p.name.toLowerCase().includes(query))
      : []
  , [products, query]);

  const filteredCategories = useMemo(() =>
    Array.isArray(categories)
      ? categories.filter((c) => c.name.toLowerCase().includes(query))
      : []
  , [categories, query]);

  const filteredSubCategories = useMemo(() =>
    Array.isArray(subCategories)
      ? subCategories.filter((s) => s.name.toLowerCase().includes(query))
      : []
  , [subCategories, query]);

 


  if (loadingProducts || loadingCategories || loadingSubCategories) {
    return <div className="text-center py-12 text-lg">Loading search results...</div>;
  }

  if (!query) {
    return <div className="text-center py-12 text-lg">Please enter a search term.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search results for "{query}"</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Products</h2>
        {filteredProducts.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(Array.isArray(filteredProducts) ? filteredProducts : []).map((product) => {
              return (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={() => console.log('Add to cart', product)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-slate-400">No products found.</div>
        )}
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Categories</h2>
        {filteredCategories.length ? (
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(filteredCategories) ? filteredCategories : []).map((cat) => (
              <Link key={cat._id} to={`/category/${cat._id}`} className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full font-semibold shadow hover:bg-primary-200">
                {cat.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-slate-400">No categories found.</div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Subcategories</h2>
        {filteredSubCategories.length ? (
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(filteredSubCategories) ? filteredSubCategories : []).map((sub) => (
              <Link key={sub._id} to={`/subcategory/${sub._id}`} className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold shadow hover:bg-green-200">
                {sub.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-slate-400">No subcategories found.</div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
