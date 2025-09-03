import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faStar, faClock, faPen, faComments } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Review } from '../data/reviews-list';
import mockReviews from '../data/reviews-list';
import products from '../data/products';
import { reviewsAPI, ordersAPI, productAPI } from '../services/api';

// 상품 이미지 로더 컴포넌트
const ProductImageLoader: React.FC<{ review: any; className: string }> = ({ review, className }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      console.log('🖼️ ProductImageLoader 시작:', {
        productName: review.product,
        productId: review.productId,
        productIdForImage: review.productIdForImage,
        hasProductImage: !!review.productImage,
        hasImage: !!review.image,
        hasBackground: !!review.background
      });

      // 이미지 우선순위: productImage > image > background
      let source = review.productImage || review.image || review.background;
      
      if (source) {
        console.log('✅ 기존 이미지 사용:', source.substring(0, 50) + '...');
        setImageSrc(source);
        setImageLoaded(true);
        return;
      }
      
      // 이미지가 없고 상품 ID가 있는 경우 별도 API로 로드
      const productId = review.productIdForImage || review.productId;
      if (productId) {
        console.log('🔄 별도 API로 이미지 로드 시도:', productId);
        try {
          const response = await fetch(`https://port-0-admore-me83wyv0a5a64d5a.sel5.cloudtype.app/api/products/${productId}/images`);
          console.log('📡 이미지 API 응답 상태:', response.status);
          
          if (response.ok) {
            const imageData = await response.json();
            console.log('📦 이미지 데이터:', {
              hasImage: !!imageData.image,
              imageLength: imageData.image?.length || 0
            });
            
            if (imageData.image) {
              console.log('✅ 이미지 로드 성공:', review.product);
              setImageSrc(imageData.image);
              setImageLoaded(true);
              return;
            }
          } else {
            console.error('❌ 이미지 API 오류:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('❌ 상품 이미지 로드 실패:', review.product, error);
        }
      } else {
        console.log('⚠️ 상품 ID가 없음:', review.product);
      }
      
      console.log('❌ 이미지 로드 실패, 폴백 아이콘 사용');
      setLoadError(true);
    };

    loadImage();
  }, [review.productImage, review.image, review.background, review.productIdForImage, review.productId]);

  const handleImageError = () => {
    console.log('❌ 이미지 렌더링 실패:', review.product);
    setLoadError(true);
    setImageLoaded(false);
  };

  return (
    <div className={className}>
      {imageSrc && !loadError ? (
        <img 
          src={imageSrc}
          alt={review.product}
          className="w-full h-full object-cover"
          onError={handleImageError}
          onLoad={() => {
            console.log('✅ 이미지 렌더링 성공:', review.product);
            setImageLoaded(true);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};

// 이메일 마스킹 함수
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const maskedLocalPart = localPart.slice(0, -2) + '**';
  return `${maskedLocalPart}@${domain}`;
};

const REVIEWS_PER_PAGE = 5;

const getPageNumbers = (current: number, total: number) => {
  const maxVisible = 5;
  const group = Math.floor((current - 1) / maxVisible);
  const start = group * maxVisible + 1;
  const end = Math.min(start + maxVisible - 1, total);
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
};

const sortOptions = [
  { value: 'high', label: '별점 높은 순', icon: faStar, color: 'text-yellow-400', rotate: false },
  { value: 'low', label: '별점 낮은 순', icon: faStar, color: 'text-gray-400', rotate: true },
  { value: 'latest', label: '최신순', icon: faClock, color: 'text-blue-500', rotate: false },
] as const;

type SortType = typeof sortOptions[number]['value'];

const Reviews: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortType, setSortType] = useState<'rating' | 'date'>('date');
  const [ratingOrder, setRatingOrder] = useState<'desc' | 'asc'>('desc');
  const [dateOrder, setDateOrder] = useState<'desc' | 'asc'>('desc');
  const [showReviews, setShowReviews] = useState(true);
  const [showReviewableDropdown, setShowReviewableDropdown] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // localStorage에서 리뷰 로드
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await reviewsAPI.getAll();
        console.log('백엔드 리뷰 응답:', response);
        
        // 백엔드 응답 구조에 따라 데이터 추출
        let reviewsData;
        if (response && response.success && Array.isArray(response.reviews)) {
          // {success: true, reviews: [...]} 형태
          reviewsData = response.reviews;
        } else if (Array.isArray(response)) {
          // 직접 배열 형태
          reviewsData = response;
        } else {
          console.warn('예상하지 못한 리뷰 응답 구조:', response);
          reviewsData = [];
        }
        
        // 백엔드 데이터를 Review 인터페이스에 맞게 변환
        const formattedReviews = reviewsData.map((review: any) => {
          // 상품 데이터에서 매칭되는 상품 찾기
          let matchingProduct = null;
          if (review.productId && availableProducts.length > 0) {
            matchingProduct = availableProducts.find((p: any) => 
              p._id === review.productId || 
              p.id === review.productId || 
              p.name === review.product ||
              p.name === review.productName
            );
          }
          
          return {
            id: review.id || review._id,
            user: review.userEmail || review.userId || review.user || '익명',
            time: (() => {
              const date = review.createdAt || review.time || new Date();
              const d = new Date(date);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day} ${hours}:${minutes}`;
            })(),
            content: review.content,
            product: review.productName || review.product || '상품명 없음',
            productDescription: matchingProduct?.content || matchingProduct?.description || null,
            rating: review.rating,
            reply: review.adminReply || review.reply,
            replyTime: (() => {
              const replyDate = review.adminReplyTime || review.replyTime;
              if (replyDate) {
                const d = new Date(replyDate);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}`;
              }
              return undefined;
            })(),
            productId: review.productId,
            category: matchingProduct?.category || review.category,
            tags: matchingProduct?.tags || review.tags,
            image: matchingProduct?.image || review.image,
            background: matchingProduct?.background || review.background,
            // 상품 이미지 우선순위: 1. 매칭된 상품의 image, 2. 매칭된 상품의 background, 3. 리뷰의 productImage
            productImage: matchingProduct?.image || matchingProduct?.background || review.productImage || null,
            // 상품 이미지 로드를 위한 상품 ID 저장
            productIdForImage: matchingProduct?._id || matchingProduct?.id
          };
        });
        
        console.log('포맷된 리뷰:', formattedReviews);
        console.log('상품 데이터:', availableProducts);
        // 이미지 매칭 디버깅
        formattedReviews.forEach((review: any, index: number) => {
          if (index < 3) { // 처음 3개만 로그
            console.log(`리뷰 ${index + 1}:`, {
              productId: review.productId,
              productName: review.product,
              productImage: review.productImage,
              image: review.image,
              background: review.background
            });
          }
        });
        setReviews(formattedReviews);
      } catch (error) {
        console.error('리뷰 로드 중 오류:', error);
        // 백엔드 실패 시 mock 데이터 사용
        setReviews(mockReviews);
      }
    };
    loadReviews();
    
    // 상품 데이터 로드 (최적화된 API 사용)
    const loadProducts = async () => {
      try {
        const response = await productAPI.getAllProductsOptimized();
        console.log('상품 데이터 응답:', response);
        
        let productsData;
        if (response && typeof response === 'object' && 'success' in response && response.success && 'products' in response && Array.isArray(response.products)) {
          productsData = response.products;
        } else if (Array.isArray(response)) {
          productsData = response;
        } else {
          console.warn('예상하지 못한 상품 응답 구조:', response);
          productsData = [];
        }
        
        setAvailableProducts(productsData);
      } catch (error) {
        console.error('상품 로드 중 오류:', error);
        setAvailableProducts([]);
      }
    };
    
    loadProducts();
    
    // 페이지 포커스 시 데이터 재로드 제거 - 데이터 일관성 유지를 위해
    // window.addEventListener('focus', loadReviews);
    // return () => window.removeEventListener('focus', loadReviews);
  }, [availableProducts]);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!showReviewableDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowReviewableDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReviewableDropdown]);

  // 리뷰 작성 가능한 주문내역 가져오기 (백엔드에서)
  const [reviewableOrders, setReviewableOrders] = useState<any[]>([]);
  useEffect(() => {
    const loadOrders = async () => {
      try {
        // 백엔드에서 주문 데이터 가져오기
        const response = await ordersAPI.getUserOrders();
        if (response.success && response.orders) {
          const reviewables = response.orders.filter((o: any) => {
            const isEligible = (o.status === '작업완료' || o.status === '구매완료') && o.review === '리뷰 작성하기';
            return isEligible;
          });
          setReviewableOrders(reviewables);
        } else {
          // 백엔드 실패 시 localStorage에서 폴백
          const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
          const reviewables = orderList.filter((o: any) => {
            const isEligible = (o.status === '작업완료' || o.status === '구매완료') && o.review === '리뷰 작성하기';
            return isEligible;
          });
          setReviewableOrders(reviewables);
        }
      } catch (error) {
        console.error('주문 로드 에러:', error);
        // 에러 시 localStorage에서 폴백
        try {
          const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
          const reviewables = orderList.filter((o: any) => {
            const isEligible = (o.status === '작업완료' || o.status === '구매완료') && o.review === '리뷰 작성하기';
            return isEligible;
          });
          setReviewableOrders(reviewables);
        } catch (localStorageError) {
          console.error('localStorage 폴백 로드 중 오류:', localStorageError);
          setReviewableOrders([]);
        }
      }
    };
    loadOrders();
    // 페이지 포커스 시 데이터 재로드 제거 - 데이터 일관성 유지를 위해
    // window.addEventListener('focus', loadOrders);
    // return () => window.removeEventListener('focus', loadOrders);
  }, []);

  // 새로고침: 모든 상태 초기화 및 데이터 재로드
  const handleRefresh = () => {
    // UI 상태 초기화
    setSearch('');
    setSortType('date');
    setRatingOrder('desc');
    setDateOrder('desc');
    setCurrentPage(1);
    
    // 리뷰 데이터 재로드
    const loadReviews = async () => {
      try {
        const response = await reviewsAPI.getAll();
        console.log('새로고침 - 백엔드 리뷰 응답:', response);
        
        // 백엔드 응답 구조에 따라 데이터 추출
        let reviewsData;
        if (response && response.success && Array.isArray(response.reviews)) {
          // {success: true, reviews: [...]} 형태
          reviewsData = response.reviews;
        } else if (Array.isArray(response)) {
          // 직접 배열 형태
          reviewsData = response;
        } else {
          console.warn('새로고침 - 예상하지 못한 리뷰 응답 구조:', response);
          reviewsData = [];
        }
        
        // 백엔드 데이터를 Review 인터페이스에 맞게 변환
        const formattedReviews = reviewsData.map((review: any) => {
          // 상품 데이터에서 매칭되는 상품 찾기
          let matchingProduct = null;
          if (review.productId && availableProducts.length > 0) {
            matchingProduct = availableProducts.find((p: any) => 
              p._id === review.productId || 
              p.id === review.productId || 
              p.name === review.product ||
              p.name === review.productName
            );
          }
          
          return {
            id: review.id || review._id,
            user: review.userEmail || review.userId || review.user || '익명',
            time: (() => {
              const date = review.createdAt || review.time || new Date();
              const d = new Date(date);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day} ${hours}:${minutes}`;
            })(),
            content: review.content,
            product: review.productName || review.product || '상품명 없음',
            productDescription: matchingProduct?.content || matchingProduct?.description || null,
            rating: review.rating,
            reply: review.adminReply || review.reply,
            replyTime: (() => {
              const replyDate = review.adminReplyTime || review.replyTime;
              if (replyDate) {
                const d = new Date(replyDate);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}`;
              }
              return undefined;
            })(),
            productId: review.productId,
            category: matchingProduct?.category || review.category,
            tags: matchingProduct?.tags || review.tags,
            image: matchingProduct?.image || review.image,
            background: matchingProduct?.background || review.background,
            // 상품 이미지 우선순위: 1. 매칭된 상품의 image, 2. 매칭된 상품의 background, 3. 리뷰의 productImage
            productImage: matchingProduct?.image || matchingProduct?.background || review.productImage || null,
            // 상품 이미지 로드를 위한 상품 ID 저장
            productIdForImage: matchingProduct?._id || matchingProduct?.id
          };
        });
        
        console.log('새로고침 - 포맷된 리뷰:', formattedReviews);
        setReviews(formattedReviews);
      } catch (error) {
        console.error('리뷰 로드 중 오류:', error);
        // 백엔드 실패 시 mock 데이터 사용
        setReviews(mockReviews);
      }
    };
    
    // 주문 데이터 재로드
    const loadOrders = async () => {
      try {
        // 백엔드에서 주문 데이터 가져오기
        const response = await ordersAPI.getUserOrders();
        if (response.success && response.orders) {
          const reviewables = response.orders.filter((o: any) => {
            const isEligible = (o.status === '작업완료' || o.status === '구매완료') && o.review === '리뷰 작성하기';
            return isEligible;
          });
          setReviewableOrders(reviewables);
        } else {
          // 백엔드 실패 시 localStorage에서 폴백
          const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
          const reviewables = orderList.filter((o: any) => {
            const isEligible = (o.status === '작업완료' || o.status === '구매완료') && o.review === '리뷰 작성하기';
            return isEligible;
          });
          setReviewableOrders(reviewables);
        }
      } catch (error) {
        console.error('주문 로드 에러:', error);
        // 에러 시 localStorage에서 폴백
        try {
          const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
          const reviewables = orderList.filter((o: any) => {
            const isEligible = (o.status === '작업완료' || o.status === '구매완료') && o.review === '리뷰 작성하기';
            return isEligible;
          });
          setReviewableOrders(reviewables);
        } catch (localStorageError) {
          console.error('localStorage 폴백 로드 중 오류:', localStorageError);
          setReviewableOrders([]);
        }
      }
    };
    
    // 데이터 재로드 실행
    loadReviews();
    loadOrders();
  };

  // 별점 정렬 버튼 클릭
  const handleRatingSort = () => {
    setSortType('rating');
    setRatingOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    setCurrentPage(1);
  };

  // 최신순 정렬 버튼 클릭
  const handleDateSort = () => {
    setSortType('date');
    setDateOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    setCurrentPage(1);
  };

  // 상품 페이지로 이동
  const handleProductClick = (review: Review) => {
    if (review.productId) {
      navigate(`/products/${review.productId}`);
    }
  };

  // 상담하기 기능
  const handleConsultation = (review: Review) => {
    const product = products.find(p => p.id === review.productId);
    if (product) {
      const message = `안녕하세요! 상품에 대해 문의드립니다.\n\n상품명: ${product.name}\n카테고리: ${product.category}\n\n 빠른 답변 부탁드립니다.`;
      
      // localStorage에 상담 메시지 저장
      localStorage.setItem('chatAutoMessage', message);
      localStorage.setItem('chatType', 'consultation');
      localStorage.setItem('consultationProduct', JSON.stringify(product));
      
      // 채팅창 열기 (전역 이벤트로 열기)
      window.dispatchEvent(new CustomEvent('openChat'));
    }
  };

  // 상품 정보 가져오기
  const getProductInfo = (review: Review) => {
    return (products || []).find(p => p.id === review.productId);
  };

  // 검색 및 정렬 적용
  const filtered = (reviews || []).filter(r =>
    (r.user || '').includes(search) ||
    (r.content || '').includes(search) ||
    (r.product || '').includes(search)
  );
  let sorted = [...filtered];
  if (sortType === 'rating') {
    sorted.sort((a, b) => ratingOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating);
  }
  if (sortType === 'date') {
    sorted.sort((a, b) => {
      // 날짜 파싱 함수
      const parseDate = (dateStr: string) => {
        // dateStr이 undefined나 null인 경우 기본값 반환
        if (!dateStr) return new Date(0);
        
        // 형식 1: "25-07-15 16:42" (mockReviews)
        if (dateStr.match(/^\d{2}-\d{2}-\d{2}/)) {
          return new Date(dateStr.replace(/(\d{2})-(\d{2})-(\d{2})/, '20$1-$2-$3'));
        }
        // 형식 2: "2025. 7. 15. 오후 3:52:21" (저장된 리뷰)
        if (dateStr.includes('오후') || dateStr.includes('오전')) {
          const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
          if (match) {
            const [, year, month, day, ampm, hour, minute, second] = match;
            let hour24 = parseInt(hour);
            if (ampm === '오후' && hour24 !== 12) hour24 += 12;
            if (ampm === '오전' && hour24 === 12) hour24 = 0;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
          }
        }
        // 기본 파싱 시도
        return new Date(dateStr);
      };
      
      const dateA = parseDate(a.time);
      const dateB = parseDate(b.time);
      return dateOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });
  }

  const totalPages = Math.ceil(sorted.length / REVIEWS_PER_PAGE);
  const pagedReviews = sorted.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-gray-50 py-12 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header (NEW) */}
        <div className="mb-8 flex flex-row justify-between items-end">
          <div className="flex flex-col justify-start items-start gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mr-2">리뷰 목록</h1>
              <span className="text-blue-500 text-lg sm:text-xl font-bold">({sorted.length.toLocaleString()}+)</span>
            </div>
            <span className="text-gray-400 text-sm sm:text-base font-semibold">실제로 구매하신 고객님들의 후기를 확인해보세요.</span>
          </div>
          
        </div>

        {/* Review List */}
        {showReviews && (
          <div id="review-list-section" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {/* 작성가능한리뷰 - 비활성화됨 */}
              {/* 
              <div
                ref={dropdownRef}
                className="flex flex-col border border-gray-300 ring-2 ring-orange-200 rounded-xl bg-white 
                  min-w-[200px] sm:max-w-[240px] relative w-full"
              >
                <button
                  type="button"
                  className="flex items-center justify-between px-3 py-2 text-left transition-colors group w-full"
                  onClick={() => setShowReviewableDropdown(v => !v)}
                  aria-expanded={showReviewableDropdown}
                >
                  <span className="text-gray-700 text-sm font-semibold flex items-center group-hover:text-orange-500 transition-colors">
                    <FontAwesomeIcon
                      icon={faPen}
                      className="text-gray-500 mr-2 text-xs group-hover:text-orange-500 transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        setShowReviewableDropdown(false);
                      }}
                    />
                    작성 가능한 리뷰:
                    <span className="text-orange-500 text-sm font-bold ml-2 group-hover:text-orange-600 transition-colors">
                      {reviewableOrders.length}개
                    </span>
                  </span>
                  <span className="ml-2 group-hover:text-orange-500 transition-colors">
                    {showReviewableDropdown ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </button>
                {showReviewableDropdown && reviewableOrders.length > 0 && (
                  <div className="mt-[1px] bg-white absolute top-full left-0 w-full shadow-xl shadow-gray-300 border border-gray-200 rounded-xl py-2">
                    <div className="flex flex-col">
                      {reviewableOrders.map((order, idx) => (
                        <button
                          key={order.orderId}
                          className={`flex flex-col items-center justify-start text-left gap-1 py-2 px-4 hover:bg-orange-50
                            transition-colors border-b border-gray-200 ${idx === reviewableOrders.length - 1 ? 'border-b-0' : ''}`}
                          onClick={() => navigate(`/products/${order.productId}`, { 
                            state: { 
                              fromOrder: true,
                              orderId: order.orderId 
                            } 
                          })}
                        >
                          <span className="text-sm font-medium text-gray-700 block w-full">{order.product}</span>
                          <span className="text-xs text-orange-500 font-semibold text-right block w-full hover:underline">리뷰 작성 →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {showReviewableDropdown && reviewableOrders.length === 0 && (
                  <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <span className="text-sm text-gray-500">작성 가능한 리뷰가 없습니다.</span>
                  </div>
                )}
              </div>
              */}
              <div className="flex flex-col xs:flex-row justify-end items-center gap-4 xs:gap-0 w-full">
                {/* 검색창 */}
                <div className="relative w-full flex justify-end items-center">
                  <input
                    type="text"
                    placeholder="검색어를 입력해 주세요."
                    className="border border-gray-300 rounded-xl px-3 py-2 pr-10 text-sm 
                      focus:outline-none focus:ring-2 focus:ring-orange-200 min-w-[160px] sm:max-w-[240px] w-full"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                  <span className="absolute right-3 top-2 text-gray-400">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                  </span>
                </div>
                {/* 정렬 버튼 그룹 */}
                <div className="flex items-center space-x-2 ml-0 xs:ml-2">
                  {/* 별점 정렬 버튼 */}
                  <button
                    onClick={handleRatingSort}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100 ${sortType === 'rating' ? 'ring-2 ring-yellow-200' : ''}`}
                    title={`별점순 (${ratingOrder === 'desc' ? '높은 순' : '낮은 순'})`}
                  >
                    <FontAwesomeIcon
                      icon={faStar}
                      className={`text-lg transition-transform duration-200 ${ratingOrder === 'desc' ? 'text-yellow-400' : 'text-gray-400'}`}
                      style={{ transform: ratingOrder === 'asc' ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>
                  {/* 최신순 정렬 버튼 */}
                  <button
                    onClick={handleDateSort}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100 ${sortType === 'date' ? 'ring-2 ring-blue-200' : ''}`}
                    title={`최신순 (${dateOrder === 'desc' ? '최신순' : '오래된순'})`}
                  >
                    <FontAwesomeIcon
                      icon={faClock}
                      className={`text-lg transition-transform duration-200 ${dateOrder === 'desc' ? 'text-blue-500' : 'text-gray-400'}`}
                      style={{ transform: dateOrder === 'asc' ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>
                  {/* 새로고침 버튼 */}
                  <button onClick={handleRefresh} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100" title="새로고침">
                    <FontAwesomeIcon icon={faRotateRight} className="text-gray-500 text-lg" />
                  </button>
                </div>
              </div>
            </div>
            

            {pagedReviews.map(review => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col xs:flex-row xs:items-center mb-2 gap-1 sm:gap-0">
                  <div className="flex items-center">
                    <span className="font-semibold text-blue-600 mr-2">{maskEmail(review.user)}</span>
                    <span className="flex items-center mr-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                        </svg>
                      ))}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{review.time}</span>
                </div>
                <div className="text-sm mb-4 text-gray-900 font-normal">{review.content}</div>
                {review.reply && (
                  <div className="bg-gray-50 border-l-4 border-blue-400 p-3 text-sm text-gray-700 mt-2 ml-6">
                    <div className="flex xxs:items-center xxs:flex-row flex-col mb-1">
                      <span className="font-bold text-blue-600 mr-2">애드모어</span>
                      <span className="text-xs text-gray-400">{review.replyTime}</span>
                    </div>
                    <span>{review.reply}</span>
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-4 border border-orange-200 p-2 rounded-lg">
                  <div className="flex items-center justify-between gap-2 flex-col sm:flex-row">
                    <div className="flex items-center gap-3">
                      {/* 상품 이미지 */}
                      <ProductImageLoader 
                        review={review}
                        className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                      />
                      
                      {/* 상품 정보 */}
                      <div className="flex flex-col gap-1">
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleProductClick(review)}
                        >
                          <span className="text-gray-700 font-semibold text-sm hover:text-orange-600">{review.product}</span>
                        </div>
                        
                        {(review.category || review.tags) && (
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition-colors"
                            onClick={() => handleProductClick(review)}
                          >
                            <span className="text-xs text-gray-500 hover:text-orange-600">
                              {review.category && review.tags ? `${review.category} | ${review.tags}` : review.category || review.tags}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      className="text-sm font-semibold px-3 py-2 text-white w-full sm:max-w-[86px] sm:flex-row flex-col
                        bg-orange-500 hover:bg-orange-600 hover:text-white rounded-md transition-colors flex items-center gap-1"
                      onClick={() => handleConsultation(review)}
                    >
                      <FontAwesomeIcon icon={faComments} className="text-xs sm:block hidden" />
                      <span className="text-xs ">상담하기</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {showReviews && (
          <div className="flex justify-center mt-10 space-x-1">
            <button
              className="text-xs px-3 py-1 rounded bg-white border text-gray-700 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </button>
            {pageNumbers[0] > 1 && (
              <span className="px-2 py-1 text-gray-400">...</span>
            )}
            {pageNumbers.map(page => (
              <button
                key={page}
                className={`text-xs px-3 py-1 font-semibold rounded border ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-300'
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <span className="px-2 py-1 text-gray-400">...</span>
            )}
            <button
              className="text-xs px-3 py-1 rounded bg-white border text-gray-700 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews; 