import { IoIosSearch } from "react-icons/io";
import { TypeAnimation } from "react-type-animation";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAllProductsApi } from "../api/adminApi/productApi";

const Search = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchPage, setIsSearchPage] = useState(false);
  const location = useLocation().pathname;

  useEffect(() => {
    const isSearch = location === "/search";
    setIsSearchPage(isSearch);
  }, [location]);

  const redirectToSearchPage = () => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    } else {
      navigate("/search");
    }
  };

  // Only fetch products when user is actively searching
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getAllProductsApi,
    enabled: isFocused && value.trim().length > 0,
  });

  // Filter products by value
  const filteredSuggestions =
    value.trim() && Array.isArray(products)
      ? products.filter((p) =>
          p.name.toLowerCase().includes(value.trim().toLowerCase())
        )
      : [];

  return (
    <form
      onSubmit={(e) => {
        redirectToSearchPage();
        e.preventDefault();
      }}
      className="relative w-full max-w-2xl"
    >
      <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:border-primary-200 focus-within:border-primary-200 focus-within:ring-4 focus-within:ring-primary-200/20 transition-all duration-200">
        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoFocus={isSearchPage}
          className="w-full px-4 py-3 md:py-3.5 outline-none bg-transparent relative z-10 font-inter text-slate-800 placeholder-slate-400 text-sm md:text-base"
          placeholder={
            isFocused || isSearchPage ? "What are you looking for?" : ""
          }
        />

        {/* Type animation as placeholder */}
        {value === "" && !isFocused && !isSearchPage && (
          <div className="absolute left-4 text-slate-400 pointer-events-none font-inter">
            <TypeAnimation
              sequence={[
                'Search for "milk"',
                1500,
                'Search for "sugar"',
                1500,
                'Search for "bread"',
                1500,
                'Search for "eggs"',
                1500,
                'Search for "fruits"',
                1500,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </div>
        )}

        {/* Suggestion Dropdown */}
        {isFocused && value.trim() && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-80 overflow-y-auto">
            {(Array.isArray(filteredSuggestions) ? filteredSuggestions.slice(0, 8) : []).map((product) => {
              const discount =
                typeof product.discount === "number" ? product.discount : 0;
              const discountedPrice = product.price * (1 - discount / 100);
              return (
                <a
                  key={product._id}
                  href={`/product/${product._id}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition-all cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <img
                    src={
                      product.images?.[0]?.url ||
                      "/images/placeholder-product.jpg"
                    }
                    alt={product.name}
                    className="w-12 h-12 object-contain rounded bg-slate-50 border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {product.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    {discount > 0 ? (
                      <>
                        <span className="text-primary-600 font-bold text-sm mr-1">
                          ${discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          ${product.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-primary-600 font-bold text-sm">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 text-xs font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Add to cart", product);
                    }}
                  >
                    Add
                  </button>
                </a>
              );
            })}
          </div>
        )}

        {/* Search Icon */}
        <button
          type="submit"
          className="absolute right-2 p-2 flex justify-center items-center cursor-pointer z-20 bg-gradient-to-r from-primary-200 to-primary-100 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          <IoIosSearch className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
    </form>
  );
};

export default Search;
