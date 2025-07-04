import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types/index';
import { products as allProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram, IconDefinition } from '@fortawesome/free-brands-svg-icons';

const FAVORITES_KEY = 'favorites';

// 즐겨찾기 관련 유틸리티 함수들
const getFavorites = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
};

const addFavorite = (productId: number) => {
  const favorites = getFavorites();
  if (!favorites.includes(productId)) {
    favorites.push(productId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
};

const removeFavorite = (productId: number) => {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter(id => id !== productId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
};

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const categories: string[] = ['전체', '페이스북', '인스타그램', '유튜브', '블로그', '트위터', '텔레그램', '기타'];

  const categoryIcon: Record<string, { icon: IconDefinition; color: string }> = {
    '페이스북': { icon: faFacebook, color: 'text-blue-600' },
    '인스타그램': { icon: faInstagram, color: 'text-pink-500' },
    '유튜브': { icon: faYoutube, color: 'text-red-600' },
    '블로그': { icon: faBlogger, color: 'text-orange-500' },
    '트위터': { icon: faTwitter, color: 'text-sky-400' },
    '텔레그램': { icon: faTelegram, color: 'text-blue-400' },
    '기타': { icon: faBlogger, color: 'text-gray-400' },
  };

  const [favorites, setFavorites] = useState<number[]>([]);

  // 컴포넌트 마운트 시 즐겨찾기 로드
  useEffect(() => {
    const savedFavorites = getFavorites();
    setFavorites(savedFavorites);
  }, []);

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      removeFavorite(id);
      setFavorites(prev => prev.filter(fid => fid !== id));
    } else {
      addFavorite(id);
      setFavorites(prev => [...prev, id]);
    }
  };

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      const categoryMap: { [key: string]: string } = {
        'facebook': '페이스북',
        'instagram': '인스타그램',
        'youtube': '유튜브',
        'blog': '블로그',
        'twitter': '트위터',
        'telegram': '텔레그램',
        'other': '기타'
      };
      setSelectedCategory(categoryMap[category] || '전체');
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdownOpen]);

  const filteredProducts: Product[] = selectedCategory === '전체' 
    ? allProducts 
    : allProducts.filter(product => product.category === selectedCategory);

  const sortedProducts: Product[] = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.price as number) - (b.price as number);
      case 'price-high':
        return (b.price as number) - (a.price as number);
      case 'popular':
        return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      default:
        return 0;
    }
  });

  const handleCategoryChange = (category: string): void => {
    setSelectedCategory(category);
    if (category === '전체') {
      setSearchParams({});
    } else {
      const categoryMap: { [key: string]: string } = {
        '페이스북': 'facebook',
        '인스타그램': 'instagram',
        '유튜브': 'youtube',
        '블로그': 'blog',
        '트위터': 'twitter',
        '텔레그램': 'telegram',
        '기타': 'other'
      };
      setSearchParams({ category: categoryMap[category] });
    }
  };

  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'price-low', label: '가격 낮은순' },
    { value: 'price-high', label: '가격 높은순' },
  ];
  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || '정렬';

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">상품</h1>
          <p className="text-gray-600">다양한 소셜미디어 마케팅 서비스를 만나보세요</p>
        </div> */}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 hidden md:block">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filter */}
            <div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-300 ${
                      selectedCategory === category
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="relative" ref={sortRef}>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-50 w-32 border border-gray-300 text-gray-700 justify-between
                      flex items-center gap-2 shadow-sm hover:bg-gray-50 transition"
                onClick={() => setSortDropdownOpen(v => !v)}
                type="button"
              >
                {currentSortLabel}
                <svg className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {sortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === opt.value ? 'bg-orange-100 text-orange-600 font-semibold' : 'text-gray-700'}`}
                      onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.includes(product.id)}
              onFavoriteToggle={toggleFavorite}
              categoryIcon={categoryIcon[product.category] || categoryIcon['기타']}
            />
          ))}
        </div>

        {/* No Products Message */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">해당 카테고리의 상품이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products; 