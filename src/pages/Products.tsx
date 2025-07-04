import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types/index';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<string>('popular');

  const categories: string[] = ['전체', '페이스북', '인스타그램', '유튜브', '블로그', '트위터', '텔레그램', '기타'];

  // Mock data for products
  const allProducts: Product[] = [
    { id: 1, name: '페이스북 팔로워 1000명', price: 50000, category: '페이스북', image: 'https://via.placeholder.com/200x150?text=Facebook', popular: true },
    { id: 2, name: '인스타그램 팔로워 500명', price: 30000, category: '인스타그램', image: 'https://via.placeholder.com/200x150?text=Instagram', popular: true },
    { id: 3, name: '유튜브 구독자 1000명', price: 100000, category: '유튜브', image: 'https://via.placeholder.com/200x150?text=YouTube', popular: true },
    { id: 4, name: '블로그 방문자 5000명', price: 80000, category: '블로그', image: 'https://via.placeholder.com/200x150?text=Blog', popular: true },
    { id: 5, name: '트위터 팔로워 300명', price: 20000, category: '트위터', image: 'https://via.placeholder.com/200x150?text=Twitter', popular: true },
    { id: 6, name: '텔레그램 멤버 200명', price: 15000, category: '텔레그램', image: 'https://via.placeholder.com/200x150?text=Telegram', popular: true },
    { id: 7, name: '페이스북 좋아요 2000개', price: 40000, category: '페이스북', image: 'https://via.placeholder.com/200x150?text=Facebook', popular: true },
    { id: 8, name: '인스타그램 좋아요 1000개', price: 25000, category: '인스타그램', image: 'https://via.placeholder.com/200x150?text=Instagram', popular: true },
    { id: 9, name: '유튜브 조회수 10000회', price: 60000, category: '유튜브', image: 'https://via.placeholder.com/200x150?text=YouTube', popular: true },
    { id: 10, name: '블로그 댓글 100개', price: 35000, category: '블로그', image: 'https://via.placeholder.com/200x150?text=Blog', popular: true },
    { id: 11, name: '트위터 리트윗 500개', price: 45000, category: '트위터', image: 'https://via.placeholder.com/200x150?text=Twitter', popular: true },
    { id: 12, name: '텔레그램 뷰 1000회', price: 30000, category: '텔레그램', image: 'https://via.placeholder.com/200x150?text=Telegram', popular: true },
    { id: 13, name: '페이스북 팔로워 500명', price: 25000, category: '페이스북', image: 'https://via.placeholder.com/200x150?text=Facebook', popular: false },
    { id: 14, name: '인스타그램 팔로워 1000명', price: 60000, category: '인스타그램', image: 'https://via.placeholder.com/200x150?text=Instagram', popular: false },
    { id: 15, name: '유튜브 구독자 500명', price: 50000, category: '유튜브', image: 'https://via.placeholder.com/200x150?text=YouTube', popular: false },
    { id: 16, name: '블로그 방문자 10000명', price: 150000, category: '블로그', image: 'https://via.placeholder.com/200x150?text=Blog', popular: false },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">상품</h1>
          <p className="text-gray-600">다양한 소셜미디어 마케팅 서비스를 만나보세요</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">카테고리</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-300 ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">정렬</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="popular">인기순</option>
                <option value="price-low">가격 낮은순</option>
                <option value="price-high">가격 높은순</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
              <div className="relative">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                {product.popular && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    인기
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-blue-600 font-bold text-lg">
                  {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}원
                </p>
                <div className="mt-4 space-y-2">
                  <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300">
                    구매하기
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition duration-300">
                    장바구니
                  </button>
                </div>
              </div>
            </div>
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