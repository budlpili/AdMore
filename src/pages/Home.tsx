import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram, IconDefinition } from '@fortawesome/free-brands-svg-icons';
import { faChevronLeft, faChevronRight, faHeart as faSolidHeart, faHeart as faRegularHeart, faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar } from '@fortawesome/free-solid-svg-icons';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';

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

const getSlidesToShow = () => {
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 1024) return 2;
  return 4;
};

const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [slideIndex, setSlideIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [slidesToShow, setSlidesToShow] = useState(getSlidesToShow());

  // 슬라이드 트랙 ref 및 컨테이너 width
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const categories: string[] = ['전체', '페이스북', '인스타그램', '유튜브', '블로그', '트위터', '텔레그램', '기타'];

  // 클릭수 내림차순 정렬 후 상위 10개만 사용
  const topProducts = [...products].sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0)).slice(0, 10);

  const filteredProducts: Product[] = selectedCategory === '전체' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  // 컴포넌트 마운트 시 즐겨찾기 로드
  useEffect(() => {
    const savedFavorites = getFavorites();
    setFavorites(savedFavorites);
  }, []);

  // 슬라이드 관련
  useLayoutEffect(() => {
    if (trackRef.current) {
      setContainerWidth(trackRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (trackRef.current) setContainerWidth(trackRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [slidesToShow]);

  const maxIndex = Math.max(0, topProducts.length - slidesToShow);
  const handlePrev = () => setSlideIndex(idx => Math.max(0, idx - 1));
  const handleNext = () => setSlideIndex(idx => Math.min(maxIndex, idx + 1));

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      removeFavorite(id);
      setFavorites(prev => prev.filter(fid => fid !== id));
    } else {
      addFavorite(id);
      setFavorites(prev => [...prev, id]);
    }
  };

  const gapPx = 16; // gap-x-4
  const totalGap = gapPx * (slidesToShow - 1);
  const cardWidthPx = slidesToShow > 0 ? (containerWidth - totalGap) / slidesToShow : 0;
  const moveX = slideIndex * (cardWidthPx + gapPx);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            소셜미디어 마케팅의 새로운 기준
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            애드모어와 함께 당신의 소셜미디어를 성장시키세요
          </p>
          <Link
            to="/products"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition duration-300"
          >
            상품 보기
          </Link>
        </div>
      </div>

      {/* Popular Products Section - 슬라이드 */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 pt-4">인기 상품</h2>
        <div className="relative">
          <button
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 border rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100"
            onClick={handlePrev}
            disabled={slideIndex === 0}
            aria-label="이전"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-2xl text-gray-500" />
          </button>
          <div className="overflow-hidden pb-4">
            <div
              ref={trackRef}
              className="flex transition-transform duration-500 gap-x-4"
              style={{ transform: `translateX(-${moveX}px)` }}
            >
              {topProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  onFavoriteToggle={toggleFavorite}
                  categoryIcon={categoryIcon[product.category]}
                  cardWidthPx={cardWidthPx}
                />
              ))}
            </div>
          </div>
          <button
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 border rounded-full w-12 h-12 flex items-center justify-center shadow hover:bg-gray-100"
            onClick={handleNext}
            disabled={slideIndex === maxIndex}
            aria-label="다음"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-2xl text-gray-500" />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      {/* <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 border border-gray-200 rounded-full p-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-[18px] font-medium transition duration-300 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div> */}

      {/* All Products Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">전체 상품</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.includes(product.id)}
              onFavoriteToggle={toggleFavorite}
              categoryIcon={categoryIcon[product.category]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 