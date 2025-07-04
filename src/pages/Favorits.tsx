import React, { useState, useEffect } from 'react';
import { Product } from '../types/index';
import ProductCard from '../components/ProductCard';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram, IconDefinition } from '@fortawesome/free-brands-svg-icons';
import { products } from '../data/products';

const categoryIcon: Record<string, { icon: IconDefinition; color: string }> = {
  '페이스북': { icon: faFacebook, color: 'text-blue-600' },
  '인스타그램': { icon: faInstagram, color: 'text-pink-500' },
  '유튜브': { icon: faYoutube, color: 'text-red-600' },
  '블로그': { icon: faBlogger, color: 'text-orange-500' },
  '트위터': { icon: faTwitter, color: 'text-sky-400' },
  '텔레그램': { icon: faTelegram, color: 'text-blue-400' },
  '기타': { icon: faBlogger, color: 'text-gray-400' },
};

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

const clearAllFavorites = () => {
  localStorage.removeItem(FAVORITES_KEY);
};

const Favorits: React.FC = () => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);

  // 컴포넌트 마운트 시 즐겨찾기 로드
  useEffect(() => {
    const favorites = getFavorites();
    setFavoriteIds(favorites);
    
    // 즐겨찾기된 상품들만 필터링
    const favoriteProductsList = products.filter(product => favorites.includes(product.id));
    setFavoriteProducts(favoriteProductsList);
  }, []);

  const handleRemoveFavorite = (id: number): void => {
    removeFavorite(id);
    setFavoriteIds(prev => prev.filter(fid => fid !== id));
    setFavoriteProducts(prev => prev.filter(product => product.id !== id));
    alert('즐겨찾기에서 제거되었습니다.');
  };

  const handleRemoveAllFavorites = (): void => {
    if (window.confirm('모든 즐겨찾기를 삭제하시겠습니까?')) {
      clearAllFavorites();
      setFavoriteIds([]);
      setFavoriteProducts([]);
      alert('모든 즐겨찾기가 삭제되었습니다.');
    }
  };

  const toggleFavorite = (id: number) => {
    if (favoriteIds.includes(id)) {
      removeFavorite(id);
      setFavoriteIds(prev => prev.filter(fid => fid !== id));
      setFavoriteProducts(prev => prev.filter(product => product.id !== id));
    } else {
      addFavorite(id);
      setFavoriteIds(prev => [...prev, id]);
      // 추천 상품에서 즐겨찾기 추가 시 즐겨찾기 목록에도 추가
      const productToAdd = products.find(p => p.id === id);
      if (productToAdd) {
        setFavoriteProducts(prev => [...prev, productToAdd]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Favorites Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">즐겨찾기</h3>
              {favoriteProducts.length > 0 && (
                <button
                  onClick={handleRemoveAllFavorites}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  전체 삭제
                </button>
              )}
            </div>

            {favoriteProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">즐겨찾기한 상품이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">상품을 즐겨찾기에 추가해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {favoriteProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={true}
                    onFavoriteToggle={toggleFavorite}
                    categoryIcon={categoryIcon[product.category] || categoryIcon['기타']}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 상품</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favoriteIds.includes(product.id)}
                onFavoriteToggle={toggleFavorite}
                categoryIcon={categoryIcon[product.category] || categoryIcon['기타']}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Favorits; 