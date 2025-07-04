import React, { useState } from 'react';
import { Product } from '../types/index';

const Favorits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('favorites');
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  // Mock data for favorites
  const favorites: Product[] = [
    {
      id: 1,
      name: '페이스북 팔로워 1000명',
      price: '50,000원',
      category: '페이스북',
      image: 'https://via.placeholder.com/200x150?text=Facebook',
      addedDate: '2024-01-15'
    },
    {
      id: 2,
      name: '인스타그램 팔로워 500명',
      price: '30,000원',
      category: '인스타그램',
      image: 'https://via.placeholder.com/200x150?text=Instagram',
      addedDate: '2024-01-10'
    },
    {
      id: 3,
      name: '유튜브 구독자 1000명',
      price: '100,000원',
      category: '유튜브',
      image: 'https://via.placeholder.com/200x150?text=YouTube',
      addedDate: '2024-01-08'
    },
    {
      id: 4,
      name: '블로그 방문자 5000명',
      price: '80,000원',
      category: '블로그',
      image: 'https://via.placeholder.com/200x150?text=Blog',
      addedDate: '2024-01-05'
    }
  ];

  const handleRemoveFavorite = (id: number): void => {
    // Here you would typically remove the item from favorites
    console.log('Removing favorite:', id);
    alert('즐겨찾기에서 제거되었습니다.');
  };

  const handleRemoveAllFavorites = (): void => {
    if (window.confirm('모든 즐겨찾기를 삭제하시겠습니까?')) {
      // Here you would typically clear all favorites
      console.log('Clearing all favorites');
      alert('모든 즐겨찾기가 삭제되었습니다.');
    }
  };

  const handleRemoveAllRecent = (): void => {
    if (window.confirm('모든 최근 본 상품을 삭제하시겠습니까?')) {
      // Here you would typically clear all recent products
      console.log('Clearing all recent products');
      alert('모든 최근 본 상품이 삭제되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">리뷰</h1>
          <p className="text-gray-600">즐겨찾기와 최근 본 상품을 관리하세요</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'favorites'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                즐겨찾기
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'recent'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                최근 본
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'favorites' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">즐겨찾기</h3>
                  {favorites.length > 0 && (
                    <button
                      onClick={handleRemoveAllFavorites}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {favorites.length === 0 ? (
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
                    {favorites.map((product) => (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition duration-300">
                        <div className="relative">
                          <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                          <button
                            onClick={() => handleRemoveFavorite(product.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition duration-300"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {product.category}
                            </span>
                            <span className="text-xs text-gray-500">{product.addedDate}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                          <p className="text-blue-600 font-bold">{product.price}</p>
                          <div className="mt-3 space-y-2">
                            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 text-sm">
                              구매하기
                            </button>
                            <button className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition duration-300 text-sm">
                              장바구니
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recent' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">최근 본 상품</h3>
                  {recentProducts.length > 0 && (
                    <button
                      onClick={handleRemoveAllRecent}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {recentProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">최근 본 상품이 없습니다.</p>
                    <p className="text-gray-400 text-sm mt-2">상품을 둘러보시면 여기에 표시됩니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recentProducts.map((product) => (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition duration-300">
                        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {product.category}
                            </span>
                            <span className="text-xs text-gray-500">{product.viewedDate}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                          <p className="text-blue-600 font-bold">{product.price}</p>
                          <div className="mt-3 space-y-2">
                            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 text-sm">
                              구매하기
                            </button>
                            <button className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition duration-300 text-sm">
                              장바구니
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 상품</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.slice(0, 4).map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-blue-600 font-bold">{product.price}</p>
                  <div className="mt-3 space-y-2">
                    <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 text-sm">
                      구매하기
                    </button>
                    <button className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition duration-300 text-sm">
                      장바구니
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Favorits; 