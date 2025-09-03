import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Product } from '../types/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram, IconDefinition } from '@fortawesome/free-brands-svg-icons';
import { faChevronLeft, faChevronRight, faHeart as faSolidHeart, faHeart, faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar } from '@fortawesome/free-solid-svg-icons';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../services/api';

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
const getFavorites = (): (string | number)[] => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
};

const addFavorite = (productId: string | number) => {
  const favorites = getFavorites();
  if (!favorites.includes(productId)) {
    favorites.push(productId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
};

const removeFavorite = (productId: string | number) => {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter(id => id !== productId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
};

const getSlidesToShow = () => {
  const width = window.innerWidth;
  let slides;
  
  if (width < 480) {
    slides = 1.5; // 모바일 - 다음 카드 20% 보임
  } else if (width < 640) {
    slides = 2.5; // 작은 모바일 - 다음 카드 30% 보임
  } else if (width < 768) {
    slides = 3.5; // 태블릿 - 다음 카드 20% 보임
  } else if (width < 1024) {
    slides = 3.5; // 작은 데스크톱 - 다음 카드 20% 보임
  } else if (width < 1280) {
    slides = 4.5; // 데스크톱 - 4개씩 보임
  } else {
    slides = 4.5; // 큰 데스크톱 - 4개씩 보임
  }
  
  console.log(`화면 너비: ${width}px, slidesToShow: ${slides}`);
  return slides;
};

const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [slideIndex, setSlideIndex] = useState(0);
  const [favorites, setFavorites] = useState<(string | number)[]>([]);
  const [slidesToShow, setSlidesToShow] = useState(getSlidesToShow());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // 슬라이드 트랙 ref 및 컨테이너 width
  const trackRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const categories: string[] = ['전체', '페이스북', '인스타그램', '유튜브', '블로그', '트위터', '텔레그램', '기타'];

  // 상품 데이터 로드 (최적화된 전체 상품 로드)
  const loadProducts = async () => {
    try {
      console.log('🔄 상품 데이터 로드 시작...');
      setLoading(true);
      // 최적화된 전체 상품 로드 (활성/비활성 모두 포함, 큰 필드 제외)
      const allProducts = await productAPI.getAllProductsOptimized();
      console.log('✅ 상품 데이터 로드 완료:', allProducts.length, '개');
      console.log('📦 첫 번째 상품 데이터:', allProducts[0]);
      setProducts(allProducts);
    } catch (error) {
      console.error('❌ 상품 로드 에러:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };



  // 활성 상품만 필터링 후 별점 내림차순 정렬하여 상위 10개만 사용
  const topProducts = [...products]
    .filter(product => product.status === 'active') // 활성 상품만 필터링
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 10);

  const filteredProducts: Product[] = selectedCategory === '전체' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  // 컴포넌트 마운트 시 상품 데이터와 즐겨찾기 로드
  useEffect(() => {
    loadProducts();
    const savedFavorites = getFavorites();
    setFavorites(savedFavorites);
    // 초기 slidesToShow 설정
    setSlidesToShow(getSlidesToShow());
  }, []);

  // 상담창 열기 처리
  useEffect(() => {
    if (location.state?.openChat) {
      // 상담 메시지가 있으면 자동으로 입력
      const consultationMessage = localStorage.getItem('consultationMessage');
      if (consultationMessage) {
        localStorage.setItem('chatAutoMessage', consultationMessage);
        localStorage.setItem('chatType', 'consultation');
        // 상담창 열기 (전역 상태로 관리)
        window.dispatchEvent(new CustomEvent('openChat'));
        // 사용 후 localStorage에서 제거
        localStorage.removeItem('consultationMessage');
        localStorage.removeItem('consultationProduct');
      }
    }
  }, [location.state]);

  // 슬라이드 관련
  useLayoutEffect(() => {
    const updateLayout = () => {
      if (trackRef.current) {
        setContainerWidth(trackRef.current.offsetWidth);
        const newSlidesToShow = getSlidesToShow();
        setSlidesToShow(newSlidesToShow);
        // 슬라이드 인덱스가 새로운 slidesToShow를 초과하지 않도록 조정
        const newMaxIndex = Math.max(0, topProducts.length - Math.floor(newSlidesToShow));
        if (slideIndex > newMaxIndex) {
          setSlideIndex(newMaxIndex);
        }
      }
    };

    // 초기 설정
    updateLayout();

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      updateLayout();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [topProducts.length, slideIndex]);

  // 마지막 카드가 완전히 보이도록 maxIndex 계산 수정
  const maxIndex = Math.max(0, topProducts.length - Math.floor(slidesToShow));
  const handlePrev = () => setSlideIndex(idx => Math.max(0, idx - 1));
  const handleNext = () => setSlideIndex(idx => Math.min(maxIndex, idx + 1));

  const toggleFavorite = (id: string | number) => {
    if (favorites.includes(id)) {
      removeFavorite(id);
      setFavorites(prev => prev.filter(fid => fid !== id));
    } else {
      addFavorite(id);
      setFavorites(prev => [...prev, id]);
    }
  };

  const gapPx = 16; // gap-x-4
  const totalGap = gapPx * (Math.floor(slidesToShow) - 1);
  const cardWidthPx = slidesToShow > 0 ? (containerWidth - totalGap) / slidesToShow : 0;
  
  // 마지막 카드가 완전히 보이도록 moveX 계산 수정
  let moveX = slideIndex * (cardWidthPx + gapPx);
  
  // 마지막 슬라이드에서는 전체 콘텐츠가 보이도록 조정
  if (slideIndex === maxIndex && maxIndex > 0) {
    const totalContentWidth = topProducts.length * cardWidthPx + (topProducts.length - 1) * gapPx;
    const maxMoveX = Math.max(0, totalContentWidth - containerWidth + 4); // 4px 여유 공간
    moveX = maxMoveX;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            소셜미디어 마케팅의<br className="sm:hidden" /> 새로운 기준
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-blue-100 px-4">
            애드모어와 함께 당신의 소셜미디어를 성장시키세요
          </p>
          
        </div>
      </div>

      {/* Popular Products Section - 슬라이드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h2 className="text-xl sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 pt-4 text-center sm:text-left">인기 상품</h2>
        <div className="relative">
          {/* 이전 버튼 - 모바일에서는 숨김, 태블릿 이상에서만 표시 */}
          <button
            className="hidden sm:flex absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 border rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
            onClick={handlePrev}
            disabled={slideIndex === 0}
            aria-label="이전"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-lg sm:text-2xl text-gray-500" />
          </button>
          
          <div className="overflow-hidden pb-4">
            <div
              ref={trackRef}
              className="flex transition-transform duration-500 gap-x-2 sm:gap-x-4 pr-8 sm:pr-16"
              style={{ transform: `translateX(-${moveX}px)` }}
            >
              {topProducts.map((product, idx) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  isFavorite={favorites.includes(product._id || product.id || '')}
                  onFavoriteToggle={toggleFavorite}
                  categoryIcon={categoryIcon[product.category]}
                  cardWidthPx={cardWidthPx}
                />
              ))}
            </div>
          </div>
          
          {/* 다음 버튼 - 모바일에서는 숨김, 태블릿 이상에서만 표시 */}
          <button
            className="hidden sm:flex absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 border rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
            onClick={handleNext}
            disabled={slideIndex === maxIndex}
            aria-label="다음"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-lg sm:text-2xl text-gray-500" />
          </button>
          
          {/* 모바일용 스와이프 안내 */}
          <div className="sm:hidden text-center mt-1">
            <p className="text-sm text-gray-500">← 좌우로 스와이프하여 더 많은 상품을 확인하세요</p>
          </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h2 className="text-xl sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center sm:text-left">전체 상품</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              isFavorite={favorites.includes(product._id || product.id || '')}
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