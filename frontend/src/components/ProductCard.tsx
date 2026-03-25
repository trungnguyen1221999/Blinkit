import { Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { addToCartApi } from "../api/cartApi";
import { useQueryClient } from "@tanstack/react-query";
import { useCartDrawer } from "./CartDrawerContext";
import { getProductByIdApi } from "../api/adminApi/productApi";

// Helper: slugify string (safe)
function slugify(str: any) {
  if (!str || typeof str !== 'string') return 'unknown';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// Helper: get category/subcategory name (safe)
function getCategoryName(cat: any) {
  if (!cat) return 'unknown';
  if (typeof cat === 'string') return slugify(cat);
  if (typeof cat === 'object' && typeof cat.name === 'string') return slugify(cat.name);
  return 'unknown';
}
function getSubCategoryName(sub: any) {
  if (!sub) return 'unknown';
  if (typeof sub === 'string') return slugify(sub);
  if (typeof sub === 'object' && typeof sub.name === 'string') return slugify(sub.name);
  return 'unknown';
}

interface ProductCardProps {
  product: any;
  onAddToCart?: (product: any) => void;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const discount = typeof product.discount === 'number' ? product.discount : 0;
  const discountedPrice = product.price * (1 - discount / 100);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openDrawer } = useCartDrawer();

  // Build SEO url (safe)
  const category = product.category && product.category[0] ? getCategoryName(product.category[0]) : 'unknown';
  const subcategory = product.SubCategory && product.SubCategory[0] ? getSubCategoryName(product.SubCategory[0]) : 'unknown';
  const nameSlug = slugify(product.name);
  const slug = `${nameSlug}-${product._id}`;
  const productUrl = `/products/${category}/${subcategory}/${slug}`;

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['product', product._id],
      queryFn: () => getProductByIdApi(product._id),
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleAddToCart = async () => {
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

  return (
    <div className="flex flex-col bg-white rounded-lg shadow p-4 hover:shadow-lg relative" onMouseEnter={handleMouseEnter}>
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg animate-bounce">
          Sale
        </div>
      )}
      <Link to={productUrl}>
        <div className="w-full aspect-square mb-2 flex items-center justify-center overflow-hidden">
          <img src={product.images?.[0]?.url || "/images/placeholder-product.jpg"} alt={product.name} className="object-contain w-full h-full" />
        </div>
      </Link>
      <div className="font-semibold text-slate-800 line-clamp-1 mb-1">{product.name}</div>
      {product.more_details && (
        <div className="mb-1 flex flex-row gap-2 flex-wrap">
          {product.more_details["Country of origin/country of manufacture"] && (
            <div className="inline-flex items-center bg-slate-100 rounded-full px-2 py-0.5 text-xs text-slate-700 font-medium border border-slate-200">
              <span className="mr-1 text-slate-400">Origin:</span>
              <span>{product.more_details["Country of origin/country of manufacture"]}</span>
            </div>
          )}
          {product.more_details["EAN code"] && (
            <div className="inline-flex items-center bg-slate-100 rounded-full px-2 py-0.5 text-xs text-slate-700 font-mono border border-slate-200">
              <span className="mr-1 text-slate-400">EAN:</span>
              <span>{product.more_details["EAN code"]}</span>
            </div>
          )}
        </div>
      )}
      <div className="mb-2">
        {discount > 0 ? (
          <>
            <span className="text-primary-600 font-bold text-base mr-1">
              <span className="mr-0.5">€</span>{discountedPrice.toFixed(2)}<span className="text-xs text-slate-700 font-normal">/{product.unit}</span>
            </span>
            <span className="text-xs text-slate-400 line-through">
              <span className="mr-0.5">€</span>{product.price.toFixed(2)}<span className="text-xs text-slate-400 font-normal">/{product.unit}</span>
            </span>
            <span className="ml-2 text-xs text-red-500 font-bold">-{discount}%</span>
          </>
        ) : (
          <span className="text-primary-600 font-bold text-base">
            <span className="mr-0.5">€</span>{product.price.toFixed(2)}<span className="text-xs text-slate-700 font-normal">/{product.unit}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        className="mt-auto px-3 py-1.5 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 text-sm font-semibold transition-all"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
