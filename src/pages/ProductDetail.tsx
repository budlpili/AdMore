import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar, faHeart as faSolidHeart, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faRegularHeart } from '@fortawesome/free-regular-svg-icons';
import { mockReviews } from '../data/reviews-list';
import { products } from '../data/products';
import { addRecentProduct } from '../utils/recentProducts';
import MobileNavBar from '../components/MobileNavBar';
import { productAPI } from '../services/api';
import { Product } from '../types';

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

// 문의 폼 타입
interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
}

const getProducts = () => {
  // Home 컴포넌트에서 popularProducts를 가져오는 대신, 실제로는 별도 데이터 파일로 분리하는 것이 좋음
  // 여기서는 Home에서 export한 popularProducts를 사용한다고 가정
  // @ts-ignore
  return Home?.prototype?.props?.popularProducts || [];
};

interface ProductDetailProps {
  setIsChatOpen: (open: boolean) => void;
}

// 시간 형식 변환 유틸리티 함수
const formatDateTime = (date: Date, isModified: boolean = false): string => {
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
  
  const formattedTime = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return isModified ? `${formattedDate} ${formattedTime} (수정됨)` : `${formattedDate} ${formattedTime}`;
};

// 이메일 마스킹 함수
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const maskedLocalPart = localPart.slice(0, -2) + '**';
  return `${maskedLocalPart}@${domain}`;
};

const ProductDetail: React.FC<ProductDetailProps> = ({ setIsChatOpen }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // 리뷰 더보기 상태
  const [visibleReviews, setVisibleReviews] = useState(3);

  // 서비스 평가 섹션 ref 추가
  const serviceReviewRef = useRef<HTMLDivElement>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'admin', text: '애드칩 반갑습니다!\n상담 운영 시간 안내\n· 평일 11:00 ~ 17:00\n· 주말, 공휴일 휴무\n순차적으로 확인하여 답변드리도록 하겠습니다.' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(msgs => [...msgs, { from: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: 'admin', text: '상담 운영팀이 곧 답변드리겠습니다.' }]);
    }, 1200);
  };

  // quantity 상태 관리를 위한 reducer
  type QuantityAction = 
    | { type: 'SET_QUANTITY'; payload: number }
    | { type: 'TOGGLE_DROPDOWN' };

  const quantityReducer = (state: { quantity: number; dropdownOpen: boolean }, action: QuantityAction) => {
    switch (action.type) {
      case 'SET_QUANTITY':
        console.log('quantityReducer SET_QUANTITY:', action.payload);
        return { quantity: action.payload, dropdownOpen: false };
      case 'TOGGLE_DROPDOWN':
        console.log('quantityReducer TOGGLE_DROPDOWN');
        return { ...state, dropdownOpen: !state.dropdownOpen };
      default:
        return state;
    }
  };

  const [quantity, setQuantity] = useState(1);
  const [quantityDropdownOpen, setQuantityDropdownOpen] = useState(false);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    console.log('handleQuantityChange 호출됨:', newQuantity);
    setQuantity(newQuantity);
    setQuantityDropdownOpen(false);
  }, []);

  const toggleQuantityDropdown = useCallback(() => {
    console.log('toggleQuantityDropdown 호출됨');
    setQuantityDropdownOpen(prev => !prev);
  }, []);

  // quantity 변경 추적
  useEffect(() => {
    console.log('quantity 변경됨:', quantity);
  }, [quantity]);

  // 가격 계산 함수
  const calculatePrice = (selectedQuantity: number) => {
    if (!product) return 0;
    
    console.log('가격 계산 함수 호출됨:', { selectedQuantity, product });
    
    let price = 0;
    
    // 기간별 가격 사용
    if (selectedQuantity === 1 && product.price1Day) {
      price = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(product.price1Day);
      console.log('1일 가격 사용:', price);
    } else if (selectedQuantity === 7 && product.price7Days) {
      price = typeof product.price7Days === 'number' ? product.price7Days : parseFloat(product.price7Days);
      console.log('7일 가격 사용:', price);
    } else if (selectedQuantity === 30 && product.price30Days) {
      price = typeof product.price30Days === 'number' ? product.price30Days : parseFloat(product.price30Days);
      console.log('30일 가격 사용:', price);
    } else {
      // 기간별 가격이 없으면 1일 가격을 기준으로 계산
      let basePrice = 0;
      if (product.price1Day) {
        basePrice = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(product.price1Day);
      } else if (product.price) {
        basePrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
      }
      
      price = basePrice * selectedQuantity;
      console.log('기본 가격 * 기간 사용:', { basePrice, selectedQuantity, price });
    }
    
    console.log('최종 가격:', price);
    return Math.round(price);
  };

  // 원가 계산 함수 (1일 가격을 기준으로 기간별 계산)
  const calculateOriginalPrice = (selectedQuantity: number) => {
    if (!product || !product.price1Day) return 0;
    
    // 1일 가격을 기준으로 기간별 원가 계산
    const basePrice = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
    const originalPrice = basePrice * selectedQuantity;
    
    return Math.round(originalPrice);
  };

  // 할인율 계산 함수
  const calculateDiscountRate = (selectedQuantity: number) => {
    if (!product || !product.price1Day) return 0;
    
    // 1일 가격을 기준으로 원가 계산
    const basePrice = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
    const originalPrice = basePrice * selectedQuantity;
    
    // 선택된 기간의 실제 가격
    let actualPrice = 0;
    if (selectedQuantity === 1) {
      actualPrice = basePrice;
    } else if (selectedQuantity === 7 && product.price7Days) {
      actualPrice = typeof product.price7Days === 'number' ? product.price7Days : parseFloat(String(product.price7Days));
    } else if (selectedQuantity === 30 && product.price30Days) {
      actualPrice = typeof product.price30Days === 'number' ? product.price30Days : parseFloat(String(product.price30Days));
    } else {
      actualPrice = originalPrice; // 할인 없음
    }
    
    // 할인율 계산 (1일은 할인 없음)
    if (selectedQuantity === 1) {
      return 0;
    }
    
    const discountRate = ((originalPrice - actualPrice) / originalPrice) * 100;
    return Math.round(discountRate);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.quantity-dropdown')) {
        setQuantityDropdownOpen(false);
      }
    };

    if (quantityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quantityDropdownOpen]);

  useEffect(() => {
    if (product) addRecentProduct(product);
  }, [product]);

  // 서비스 평가로 스크롤하는 함수
  const scrollToReviews = () => {
    if (serviceReviewRef.current) {
      serviceReviewRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 리뷰 작성 상태
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [productReviews, setProductReviews] = useState<any[]>([]);
  
  // 관리자 댓글 상태
  const [adminReplyInputs, setAdminReplyInputs] = useState<{ [reviewId: number]: string }>({});
  const [showReplyForms, setShowReplyForms] = useState<{ [reviewId: number]: boolean }>({});
  const [editingReply, setEditingReply] = useState<{ [reviewId: number]: boolean }>({});
  
  // 사용자 리뷰 수정 상태
  const [editingUserReview, setEditingUserReview] = useState<{ [reviewId: number]: boolean }>({});
  const [userReviewInputs, setUserReviewInputs] = useState<{ [reviewId: number]: { content: string; rating: number } }>({});
  
  // 주문내역 상태 확인
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [hasWrittenReview, setHasWrittenReview] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  // 문의 폼 상태
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    category: '상품 문의',
    subject: '',
    message: ''
  });

  // 상품이 로드되면 문의 폼 제목 업데이트
  useEffect(() => {
    if (product) {
      setInquiryForm(prev => ({
        ...prev,
        subject: `[상품문의] ${product.name}`
      }));
    }
  }, [product]);

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInquiryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInquirySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      category: '상품 문의',
      subject: product ? `[상품문의] ${product.name}` : '',
      message: ''
    });
  };

  // localStorage에서 리뷰 데이터 로드
  useEffect(() => {
    const loadReviews = () => {
      try {
        const savedReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
        // 현재 상품에 대한 리뷰만 필터링
        const currentProductReviews = savedReviews.filter((review: any) => 
          review.productId === product?.id
        );
        // mockReviews에서 현재 상품의 리뷰만 필터링
        const currentMockReviews = mockReviews.filter((mock: any) => 
          mock.productId === product?.id
        );
        // 모든 리뷰를 합치고 날짜 순으로 정렬 (최신이 맨 위)
        const allReviews = [...currentProductReviews, ...currentMockReviews];
        const sortedReviews = allReviews.sort((a: any, b: any) => {
          // 날짜 파싱 함수
          const parseDate = (dateStr: string) => {
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
          return dateB.getTime() - dateA.getTime(); // 최신이 맨 위
        });
        setProductReviews(sortedReviews);
      } catch (error) {
        console.error('리뷰 로드 중 오류:', error);
        setProductReviews(mockReviews.filter((mock: any) => mock.productId === product?.id));
      }
    };

    if (product?.id) {
      loadReviews();
    }
    
    // 페이지 포커스 시 리뷰 재로드
    const handleFocus = () => {
      if (product?.id) {
        loadReviews();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [product?.id]);

  // 현재 상품에 대한 리뷰 작성 여부 확인
  useEffect(() => {
    const checkReviewEligibility = () => {
      try {
        const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
        // 현재 상품에 대한 주문만 확인
        const hasWritableReview = orderList.some((order: any) => {
          return order.productId === product?.id && 
                 (order.status === '작업완료' || order.status === '구매완료') && 
                 order.review === '리뷰 작성하기';
        });
        
        // 리뷰가 이미 작성되었는지 확인
        const hasWrittenReview = orderList.some((order: any) => {
          return order.productId === product?.id && 
                 (order.status === '작업완료' || order.status === '구매완료') && 
                 (order.review === '리뷰확인' || order.review === '리뷰보러가기');
        });
        
        setCanWriteReview(hasWritableReview);
        setHasWrittenReview(hasWrittenReview);
      } catch (error) {
        console.error('주문내역 확인 중 오류:', error);
        setCanWriteReview(false);
        setHasWrittenReview(false);
      }
    };

    checkReviewEligibility();
    
    // 페이지 포커스 시 주문내역 재확인
    const handleFocus = () => {
      checkReviewEligibility();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [product?.id]); // location.state?.fromOrder 의존성 제거

  // 주문에서 리뷰 작성하기로 온 경우 리뷰 작성 폼 자동 열기
  useEffect(() => {
    if (location.state?.fromOrder && product) {
      try {
        const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
        const orderId = location.state?.orderId;
        
        // orderId가 있으면 해당 주문을 찾고, 없으면 현재 상품의 첫 번째 작성 가능한 주문을 찾음
        let currentOrder;
        if (orderId) {
          currentOrder = orderList.find((order: any) => {
            return order.productId === product.id && 
                   order.orderId === orderId &&
                   (order.status === '작업완료' || order.status === '구매완료') && 
                   order.review === '리뷰 작성하기';
          });
        } else {
          // orderId가 없으면 현재 상품의 첫 번째 작성 가능한 주문을 찾음
          currentOrder = orderList.find((order: any) => {
            return order.productId === product.id && 
                   (order.status === '작업완료' || order.status === '구매완료') && 
                   order.review === '리뷰 작성하기';
          });
        }
        
        if (currentOrder) {
          setOrderInfo(currentOrder);
          setCanWriteReview(true); // 주문에서 온 경우 강제로 true 설정
          setHasWrittenReview(false); // 주문에서 온 경우 리뷰 작성 상태 강제 초기화
          setShowReviewForm(true); // 리뷰 작성 폼 강제 열기
          
          // 리뷰 섹션으로 스크롤 (더 위쪽으로)
          setTimeout(() => {
            if (serviceReviewRef.current) {
              const element = serviceReviewRef.current;
              const elementPosition = element.offsetTop;
              const offset = 100; // 상단에서 100px 여백
              window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
              });
            }
          }, 300);
        }
      } catch (error) {
        console.error('주문내역 확인 중 오류:', error);
      }
    }
  }, [location.state, product]);

  // 리뷰 확인을 위해 온 경우 리뷰 섹션으로 스크롤
  useEffect(() => {
    if (location.state?.showReview && serviceReviewRef.current) {
      setTimeout(() => {
        serviceReviewRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.state]);

  // 리뷰 작성 핸들러
  const handleSubmitReview = () => {
    if (reviewRating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    if (!reviewContent.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    // 로그인 상태 확인
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('리뷰를 작성하려면 로그인이 필요합니다.');
      return;
    }

    // 현재 로그인한 유저의 이메일 가져오기
    const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
    console.log('리뷰 작성자 이메일:', userEmail);

    const newReview = {
      id: Date.now(),
      user: userEmail, // 현재 로그인한 유저의 이메일 사용
      rating: reviewRating,
      content: reviewContent.trim(),
      time: formatDateTime(new Date()),
      product: product?.name || '애드모어',
      productId: product?.id // 상품 ID 추가
    };

    // Reviews 페이지의 mockReviews에 추가
    try {
      const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
      const updatedReviews = [newReview, ...existingReviews];
      localStorage.setItem('mockReviews', JSON.stringify(updatedReviews));
      
      // 현재 상품에 대한 리뷰만 필터링해서 업데이트
      const currentProductReviews = updatedReviews.filter((review: any) => 
        review.productId === product?.id
      );
      // 최근 등록한 리뷰가 맨 위에 오도록 정렬
      const sortedCurrentProductReviews = currentProductReviews.sort((a: any, b: any) => b.id - a.id);
      // 저장된 리뷰를 먼저 표시하고, 그 다음에 mockReviews 표시
      const allReviews = [...sortedCurrentProductReviews, ...mockReviews];
      setProductReviews(allReviews);
      
      // 상품의 평균 별점 계산 및 업데이트
      const allProductReviews = allReviews.filter((review: any) => review.productId === product?.id);
      console.log('평균 별점 계산 - 모든 리뷰:', allProductReviews);
      
      if (allProductReviews.length > 0) {
        const totalRating = allProductReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        const averageRating = totalRating / allProductReviews.length;
        
        console.log('평균 별점 계산 결과:', { totalRating, averageRating, reviewCount: allProductReviews.length });
        
        // 상품 정보 업데이트
        setProduct(prevProduct => {
          if (prevProduct) {
            const updatedProduct = {
              ...prevProduct,
              rating: Math.round(averageRating * 10) / 10 // 소수점 첫째 자리까지 반올림
            };
            console.log('상품 별점 업데이트:', { before: prevProduct.rating, after: updatedProduct.rating });
            return updatedProduct;
          }
          return prevProduct;
        });
        
        // localStorage에 상품 정보 업데이트
        try {
          const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
          const updatedProducts = savedProducts.map((savedProduct: any) => {
            if (savedProduct.id === product?.id) {
              return {
                ...savedProduct,
                rating: Math.round(averageRating * 10) / 10
              };
            }
            return savedProduct;
          });
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } catch (error) {
          console.error('상품 정보 업데이트 중 오류:', error);
        }
      }
    } catch (error) {
      console.error('리뷰 저장 중 오류:', error);
    }

    setReviewRating(0);
    setReviewContent('');
    setShowReviewForm(false);
    
    // 주문내역의 리뷰 상태 업데이트
    try {
      // orderList 업데이트 (UserPage와 동기화)
      const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
      const orderId = location.state?.orderId;
      const updatedOrderList = orderList.map((order: any) => {
        if (order.productId === product?.id && 
            (orderId ? order.orderId === orderId : true) && // orderId가 있으면 해당 주문만, 없으면 모든 해당 상품 주문
            (order.status === '작업완료' || order.status === '구매완료') && 
            order.review === '리뷰 작성하기') {
          return {
            ...order,
            review: '리뷰확인'
          };
        }
        return order;
      });
      localStorage.setItem('orderList', JSON.stringify(updatedOrderList));
      
      // 리뷰 작성 가능 여부 재확인
      setCanWriteReview(false);
      setHasWrittenReview(true); // 리뷰 작성 후에만 state 초기화
      setShowReviewForm(false); // 리뷰 작성 폼 닫기
      // 주문에서 온 경우의 상태 정리
      if (location.state?.fromOrder) {
        navigate(location.pathname, { replace: true });
      }
    } catch (error) {
      console.error('주문내역 업데이트 중 오류:', error);
    }
    
    alert('리뷰가 성공적으로 등록되었습니다!');
    
    // 리뷰 작성 완료 후 Reviews 페이지로 이동할지 묻기
    if (window.confirm('리뷰가 성공적으로 등록되었습니다!\n\n리뷰 목록 페이지로 이동하시겠습니까?')) {
      navigate('/reviews');
    }
  };

  // 관리자 댓글 등록 핸들러
  const handleAddAdminReply = (reviewId: number) => {
    const replyContent = adminReplyInputs[reviewId]?.trim();
    if (!replyContent) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const updatedReviews = productReviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          reply: replyContent,
          replyTime: formatDateTime(new Date(), true)
        };
      }
      return review;
    });

    setProductReviews(updatedReviews);

    // localStorage 업데이트
    try {
      const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
      const updatedLocalReviews = existingReviews.map((review: any) => {
        if (review.id === reviewId) {
          return {
            ...review,
            reply: replyContent,
            replyTime: formatDateTime(new Date(), true)
          };
        }
        return review;
      });
      localStorage.setItem('mockReviews', JSON.stringify(updatedLocalReviews));
    } catch (error) {
      console.error('댓글 저장 중 오류:', error);
    }

    setAdminReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
    setShowReplyForms(prev => ({ ...prev, [reviewId]: false }));
    setEditingReply(prev => ({ ...prev, [reviewId]: false })); // 수정 폼 닫기
    
    alert('댓글이 성공적으로 등록되었습니다!');
  };

  // 관리자 댓글 수정 핸들러
  const handleEditAdminReply = (reviewId: number) => {
    const replyContent = adminReplyInputs[reviewId]?.trim();
    if (!replyContent) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const updatedReviews = productReviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          reply: replyContent,
          replyTime: new Date().toLocaleString() + ' (수정됨)'
        };
      }
      return review;
    });

    setProductReviews(updatedReviews);

    // localStorage 업데이트
    try {
      const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
      const updatedLocalReviews = existingReviews.map((review: any) => {
        if (review.id === reviewId) {
          return {
            ...review,
            reply: replyContent,
            replyTime: new Date().toLocaleString() + ' (수정됨)'
          };
        }
        return review;
      });
      localStorage.setItem('mockReviews', JSON.stringify(updatedLocalReviews));
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
    }

    setAdminReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
    setEditingReply(prev => ({ ...prev, [reviewId]: false }));
    
    alert('댓글이 성공적으로 수정되었습니다!');
  };

  // 관리자 댓글 삭제 핸들러
  const handleDeleteAdminReply = (reviewId: number) => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      const updatedReviews = productReviews.map(review => {
        if (review.id === reviewId) {
          const { reply, replyTime, ...rest } = review;
          return rest;
        }
        return review;
      });

      setProductReviews(updatedReviews);

      // localStorage 업데이트
      try {
        const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
        const updatedLocalReviews = existingReviews.map((review: any) => {
          if (review.id === reviewId) {
            const { reply, replyTime, ...rest } = review;
            return rest;
          }
          return review;
        });
        localStorage.setItem('mockReviews', JSON.stringify(updatedLocalReviews));
      } catch (error) {
        console.error('댓글 삭제 중 오류:', error);
      }
      
      alert('댓글이 삭제되었습니다.');
    }
  };

  // 관리자 댓글 폼 토글
  const toggleReplyForm = (reviewId: number) => {
    setShowReplyForms(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
    if (!showReplyForms[reviewId]) {
      setAdminReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
    }
  };

  // 관리자 댓글 수정 폼 토글
  const toggleEditReplyForm = (reviewId: number, currentReply: string) => {
    setEditingReply(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
    if (!editingReply[reviewId]) {
      setAdminReplyInputs(prev => ({ ...prev, [reviewId]: currentReply }));
    } else {
      setAdminReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
    }
  };

  // 사용자 리뷰 수정 핸들러
  const handleEditUserReview = (reviewId: number) => {
    const reviewInput = userReviewInputs[reviewId];
    if (!reviewInput || !reviewInput.content.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }
    if (reviewInput.rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    // 현재 로그인한 유저의 이메일 가져오기
    const userEmail = localStorage.getItem('userEmail');
    const currentReview = productReviews.find(review => review.id === reviewId);
    
    // 리뷰 작성자와 현재 로그인한 유저가 같은지 확인
    if (currentReview && currentReview.user !== userEmail) {
      alert('자신이 작성한 리뷰만 수정할 수 있습니다.');
      return;
    }

    const updatedReviews = productReviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          content: reviewInput.content.trim(),
          rating: reviewInput.rating,
          time: formatDateTime(new Date(), true)
        };
      }
      return review;
    });

    setProductReviews(updatedReviews);

    // localStorage 업데이트
    try {
      const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
      const updatedLocalReviews = existingReviews.map((review: any) => {
        if (review.id === reviewId) {
          return {
            ...review,
            content: reviewInput.content.trim(),
            rating: reviewInput.rating,
            time: formatDateTime(new Date(), true)
          };
        }
        return review;
      });
      localStorage.setItem('mockReviews', JSON.stringify(updatedLocalReviews));
      
      // 상품의 평균 별점 계산 및 업데이트
      const allProductReviews = updatedReviews.filter((review: any) => review.productId === product?.id);
      if (allProductReviews.length > 0) {
        const totalRating = allProductReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        const averageRating = totalRating / allProductReviews.length;
        
        // 상품 정보 업데이트
        setProduct(prevProduct => {
          if (prevProduct) {
            return {
              ...prevProduct,
              rating: Math.round(averageRating * 10) / 10
            };
          }
          return prevProduct;
        });
        
        // localStorage에 상품 정보 업데이트
        try {
          const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
          const updatedProducts = savedProducts.map((savedProduct: any) => {
            if (savedProduct.id === product?.id) {
              return {
                ...savedProduct,
                rating: Math.round(averageRating * 10) / 10
              };
            }
            return savedProduct;
          });
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } catch (error) {
          console.error('상품 정보 업데이트 중 오류:', error);
        }
      } else {
        // 리뷰가 없으면 별점을 0으로 설정
        setProduct(prevProduct => {
          if (prevProduct) {
            return {
              ...prevProduct,
              rating: 0
            };
          }
          return prevProduct;
        });
        
        // localStorage에 상품 정보 업데이트
        try {
          const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
          const updatedProducts = savedProducts.map((savedProduct: any) => {
            if (savedProduct.id === product?.id) {
              return {
                ...savedProduct,
                rating: 0
              };
            }
            return savedProduct;
          });
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } catch (error) {
          console.error('상품 정보 업데이트 중 오류:', error);
        }
      }
      
      // 주문내역에서 해당 상품의 리뷰 상태를 '리뷰 작성하기'로 변경
      const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
      const updatedOrderList = orderList.map((order: any) => {
        if (order.productId === product?.id && 
            (order.status === '작업완료' || order.status === '구매완료') && 
            (order.review === '리뷰확인' || order.review === '리뷰보러가기')) {
          return { ...order, review: '리뷰 작성하기' };
        }
        return order;
      });
      localStorage.setItem('orderList', JSON.stringify(updatedOrderList));
      
      // 리뷰 작성 상태 업데이트
      setHasWrittenReview(false);
      setCanWriteReview(true);
    } catch (error) {
      console.error('리뷰 수정 중 오류:', error);
    }

    setUserReviewInputs(prev => ({ ...prev, [reviewId]: { content: '', rating: 0 } }));
    setEditingUserReview(prev => ({ ...prev, [reviewId]: false }));
    
    alert('리뷰가 성공적으로 수정되었습니다!');
  };

  // 사용자 리뷰 삭제 핸들러
  const handleDeleteUserReview = (reviewId: number) => {
    // 현재 로그인한 유저의 이메일 가져오기
    const userEmail = localStorage.getItem('userEmail');
    const currentReview = productReviews.find(review => review.id === reviewId);
    
    // 리뷰 작성자와 현재 로그인한 유저가 같은지 확인
    if (currentReview && currentReview.user !== userEmail) {
      alert('자신이 작성한 리뷰만 삭제할 수 있습니다.');
      return;
    }

    if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      const updatedReviews = productReviews.filter(review => review.id !== reviewId);
      setProductReviews(updatedReviews);

      // localStorage 업데이트
      try {
        const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
        const updatedLocalReviews = existingReviews.filter((review: any) => review.id !== reviewId);
        localStorage.setItem('mockReviews', JSON.stringify(updatedLocalReviews));
        
        // 상품의 평균 별점 계산 및 업데이트
        const allProductReviews = updatedReviews.filter((review: any) => review.productId === product?.id);
        if (allProductReviews.length > 0) {
          const totalRating = allProductReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
          const averageRating = totalRating / allProductReviews.length;
          
          // 상품 정보 업데이트
          setProduct(prevProduct => {
            if (prevProduct) {
              return {
                ...prevProduct,
                rating: Math.round(averageRating * 10) / 10
              };
            }
            return prevProduct;
          });
          
          // localStorage에 상품 정보 업데이트
          try {
            const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
            const updatedProducts = savedProducts.map((savedProduct: any) => {
              if (savedProduct.id === product?.id) {
                return {
                  ...savedProduct,
                  rating: Math.round(averageRating * 10) / 10
                };
              }
              return savedProduct;
            });
            localStorage.setItem('products', JSON.stringify(updatedProducts));
          } catch (error) {
            console.error('상품 정보 업데이트 중 오류:', error);
          }
        } else {
          // 리뷰가 없으면 별점을 0으로 설정
          setProduct(prevProduct => {
            if (prevProduct) {
              return {
                ...prevProduct,
                rating: 0
              };
            }
            return prevProduct;
          });
          
          // localStorage에 상품 정보 업데이트
          try {
            const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
            const updatedProducts = savedProducts.map((savedProduct: any) => {
              if (savedProduct.id === product?.id) {
                return {
                  ...savedProduct,
                  rating: 0
                };
              }
              return savedProduct;
            });
            localStorage.setItem('products', JSON.stringify(updatedProducts));
          } catch (error) {
            console.error('상품 정보 업데이트 중 오류:', error);
          }
        }
        
        // 주문내역에서 해당 상품의 리뷰 상태를 '리뷰 작성하기'로 변경
        const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
        const updatedOrderList = orderList.map((order: any) => {
          if (order.productId === product?.id && 
              (order.status === '작업완료' || order.status === '구매완료') && 
              (order.review === '리뷰확인' || order.review === '리뷰보러가기')) {
            return { ...order, review: '리뷰 작성하기' };
          }
          return order;
        });
        localStorage.setItem('orderList', JSON.stringify(updatedOrderList));
        
        // 리뷰 작성 상태 업데이트
        setHasWrittenReview(false);
        setCanWriteReview(true);
      } catch (error) {
        console.error('리뷰 삭제 중 오류:', error);
      }

      alert('리뷰가 삭제되었습니다.');
    }
  };

  // 사용자 리뷰 수정 폼 토글
  const toggleEditUserReview = (reviewId: number, currentContent: string, currentRating: number) => {
    setEditingUserReview(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
    if (!editingUserReview[reviewId]) {
      setUserReviewInputs(prev => ({ 
        ...prev, 
        [reviewId]: { content: currentContent, rating: currentRating } 
      }));
    } else {
      setUserReviewInputs(prev => ({ 
        ...prev, 
        [reviewId]: { content: '', rating: 0 } 
      }));
    }
  };

  // 주문내역에서 리뷰 작성 가능 여부 확인
  useEffect(() => {
    const checkReviewEligibility = () => {
      try {
        const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
        // 현재 상품에 대한 주문만 확인
        const hasWritableReview = orderList.some((order: any) => {
          return order.productId === product?.id && 
                 (order.status === '작업완료' || order.status === '구매완료') && 
                 order.review === '리뷰 작성하기';
        });
        
        // 리뷰가 이미 작성되었는지 확인
        const hasWrittenReview = orderList.some((order: any) => {
          return order.productId === product?.id && 
                 (order.status === '작업완료' || order.status === '구매완료') && 
                 (order.review === '리뷰확인' || order.review === '리뷰보러가기');
        });
        
        setCanWriteReview(hasWritableReview);
        setHasWrittenReview(hasWrittenReview);
      } catch (error) {
        console.error('주문내역 확인 중 오류:', error);
        setCanWriteReview(false);
        setHasWrittenReview(false);
      }
    };

    checkReviewEligibility();
    
    // 페이지 포커스 시 주문내역 재확인
    const handleFocus = () => {
      checkReviewEligibility();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [product?.id]); // location.state?.fromOrder 의존성 제거

  // 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // 백엔드에서 활성 상품을 가져와서 찾기
        const activeProducts = await productAPI.getActiveProducts();
        const foundProduct = activeProducts.find(p => p.id === Number(id));
        
        if (foundProduct) {
          setProduct(foundProduct);
          console.log('로드된 상품 데이터:', foundProduct);
          console.log('상품 ID:', foundProduct.id);
          console.log('상품명:', foundProduct.name);
          console.log('상품 설명:', foundProduct.description);
          console.log('상품 이미지:', foundProduct.image);
          console.log('상품 배경:', foundProduct.background);
          console.log('이미지 타입:', typeof foundProduct.image);
          console.log('배경 타입:', typeof foundProduct.background);
          console.log('상세 설명:', foundProduct.detailedDescription);
          console.log('상세 설명 타입:', typeof foundProduct.detailedDescription);
          console.log('상세 설명 길이:', foundProduct.detailedDescription?.length);
        } else {
          // 백엔드에서 상품을 찾을 수 없는 경우, 로컬 상품 데이터에서 찾기
          console.log('백엔드에서 상품을 찾을 수 없음, 로컬 데이터에서 검색');
          const localProduct = products.find(p => p.id === Number(id));
          if (localProduct) {
            setProduct(localProduct);
            console.log('로컬에서 상품 데이터 로드:', localProduct);
          } else {
            // 상품을 찾을 수 없는 경우
            navigate('/products', { replace: true });
          }
        }
      } catch (error) {
        console.error('상품 로드 에러:', error);
        navigate('/products', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  if (loading) {
    return <div className="text-center py-20">상품을 불러오는 중입니다...</div>;
  }

  if (!product) {
    return <div className="text-center py-20">상품을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 pb-20 flex flex-row gap-8">
      {/* 왼쪽: 서비스 설명/평가 탭 */}
      <div className="flex-1 min-w-0">
        <div className="flex border-b mb-6">
          <button
            className="px-6 py-3 font-semibold border-b-2 border-orange-600 text-orange-600"
          > 상품 설명</button>
          <button
            className="px-6 py-3 font-semibold border-b-2 border-transparent text-gray-500 hover:text-orange-500 hover:border-orange-300 transition-colors duration-200"
            onClick={scrollToReviews}
          > 리뷰보기</button>
        </div>
        
        {/* 서비스 설명 섹션 */}
        <div className="mb-8">
          
          {/* 간단설명 */}
          <div className="text-sm text-gray-700 mb-4">
            {product.description || '상품 설명이 없습니다.'}
          </div>
          
          {/* 상세설명 */}
          <div className="mt-8">
            <h3 className="text-base font-bold mb-4 text-gray-800">상세 설명</h3>
            {(() => {
              console.log('렌더링 시 상세 설명:', product.detailedDescription);
              console.log('렌더링 시 상세 설명 타입:', typeof product.detailedDescription);
              console.log('렌더링 시 상세 설명 길이:', product.detailedDescription?.length);
              
              if (product.detailedDescription && product.detailedDescription.trim() !== '') {
                return (
                  <div 
                    className="text-base text-gray-700 prose prose-base max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.detailedDescription }}
                  />
                );
              } else {
                return <div className="text-gray-500 text-sm">상세 설명이 없습니다.</div>;
              }
            })()}
          </div>
          
        </div>

        <div className="border-b border-gray-200 mb-8"></div>
        
        {/* 서비스 평가 섹션 */}
        <div className="" ref={serviceReviewRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold">서비스 평가</h2>
            {canWriteReview && !showReviewForm && !hasWrittenReview && (
              <button
                className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                onClick={() => setShowReviewForm(true)}
              >
                리뷰 남기기
              </button>
            )}
          </div>

          {/* 리뷰 작성 폼 */}
          {canWriteReview && showReviewForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              {/* <h3 className="font-semibold text-gray-800 mb-3 text-sm">내 리뷰 작성</h3> */}
              
              {/* 주문한 상품 정보 표시 */}
              <div className="flex flex-row justify-between bg-white border border-gray-200 rounded-lg p-3 mb-4">
                {/* <h4 className="font-semibold text-gray-800 mb-2 text-sm">주문 상품 정보</h4> */}
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {(() => {
                      console.log('리뷰 작성 폼 - 상품 이미지 정보:', {
                        productId: product?.id,
                        productName: product?.name,
                        image: product?.image,
                        background: product?.background,
                        orderInfo: orderInfo
                      });
                      
                      if (product?.image) {
                        // 이미지 경로 처리 개선
                        let imageSrc = product.image;
                        if (product.image.startsWith('data:')) {
                          // base64 이미지
                          imageSrc = product.image;
                        } else if (product.image.startsWith('http')) {
                          // 외부 URL
                          imageSrc = product.image;
                        } else if (product.image.startsWith('/')) {
                          // 절대 경로
                          imageSrc = product.image;
                        } else {
                          // 상대 경로
                          imageSrc = `/images/${product.image}`;
                        }
                        
                        console.log('이미지 소스:', imageSrc);
                        return (
                          <img 
                            src={imageSrc}
                            alt={orderInfo?.product || product?.name || '상품 이미지'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('이미지 로드 실패:', imageSrc);
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                            onLoad={() => {
                              console.log('이미지 로드 성공:', imageSrc);
                            }}
                          />
                        );
                      } else if (product?.background) {
                        // 배경 이미지 경로 처리 개선
                        let backgroundSrc = product.background;
                        if (product.background.startsWith('data:')) {
                          // base64 이미지
                          backgroundSrc = product.background;
                        } else if (product.background.startsWith('http')) {
                          // 외부 URL
                          backgroundSrc = product.background;
                        } else if (product.background.startsWith('/')) {
                          // 절대 경로
                          backgroundSrc = product.background;
                        } else {
                          // 상대 경로
                          backgroundSrc = `/images/${product.background}`;
                        }
                        
                        console.log('배경 이미지 소스:', backgroundSrc);
                        return (
                          <img 
                            src={backgroundSrc}
                            alt={orderInfo?.product || product?.name || '상품 이미지'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('배경 이미지 로드 실패:', backgroundSrc);
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                            onLoad={() => {
                              console.log('배경 이미지 로드 성공:', backgroundSrc);
                            }}
                          />
                        );
                      } else {
                        console.log('이미지 없음 - 폴백 표시');
                        // 기본 이미지 표시
                        return (
                          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                            <div className="text-orange-600 text-xs font-bold">
                              {product?.name?.charAt(0) || 'A'}
                            </div>
                          </div>
                        );
                      }
                    })()}
                    <div className={`w-full h-full bg-orange-100 rounded-lg items-center justify-center text-orange-600 text-xs font-bold ${(product?.image || product?.background) ? 'hidden' : 'flex'}`}>
                      {product?.name?.charAt(0) || 'A'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{product?.name || '애드모어'}</div>
                    <div className="text-gray-500 text-xs">{product?.description || '서비스 상품'}</div>
                    <div className="text-orange-600 text-xs font-semibold mt-1">
                      {orderInfo ? (
                        `주문일: ${orderInfo.date} | 수량: ${orderInfo.quantity}개`
                      ) : (
                        `상품: ${product?.name || '애드모어'}`
                      )}
                    </div>
                  </div>
                </div>
                {/* 별점 선택 */}
                <div className="flex flex-row items-center space-x-2 justify-center">
                  <div className="flex items-center space-x-1 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-xl hover:scale-110 transition-transform"
                      >
                        <FontAwesomeIcon
                          icon={star <= reviewRating ? faSolidStar : faRegularStar}
                          className={star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                    <span className="text-xs text-gray-600 font-normal">
                      {reviewRating > 0 ? `${reviewRating}점` : '(필수)*'}
                    </span>
                </div>
                
              </div>
              
              

              {/* 리뷰 내용 */}
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">상세 리뷰</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="서비스 이용 후기를 작성해주세요."
                  className="w-full p-3 border border-gray-300 rounded-md text-xs resize-none"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-right text-[10px] text-gray-500">
                  {reviewContent.length}/500
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewRating(0);
                    setReviewContent('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md min-w-[80px] hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-md hover:bg-orange-700"
                >
                  리뷰 등록
                </button>
              </div>
            </div>
          )}

          {productReviews.length === 0 ? (
            <div className="text-gray-400">아직 후기가 없습니다.</div>
          ) : (
            <>
              <div className="flex flex-col items-center rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex items-center mb-2">
                  {/* 평균 별점 5개 표시 */}
                  <span className="flex items-center mr-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const rating = product.rating ?? 0;
                      if (rating >= i + 1) {
                        return <FontAwesomeIcon key={i} icon={faSolidStar} className="text-yellow-400" />;
                      } else if (rating >= i + 0.5) {
                        return <FontAwesomeIcon key={i} icon={faStarHalfAlt} className="text-yellow-400" />;
                      } else {
                        return <FontAwesomeIcon key={i} icon={faRegularStar} className="text-gray-300" />;
                      }
                    })}
                  </span>
                  <span className="font-semibold text-base mr-2">{product.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-600 text-sm"><span className="text-gray-700 font-bold">{productReviews.length}</span>개의 후기</span>
                </div>
                <div className="text-xs text-gray-500">실제 마케팅을 통해 구매한 이용자들이 남긴 후기입니다.</div>
              </div>

              {productReviews.slice(0, visibleReviews).map((review: any) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 mb-4 last:border-b-0 last:mb-0">
                  <div className="flex items-center pt-2 mb-2">
                    <span className="font-semibold text-blue-600 mr-2 text-xs">{maskEmail(review.user)}</span>
                    <span className="flex items-center text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FontAwesomeIcon
                        key={i}
                        icon={i < review.rating ? faSolidStar : faRegularStar}
                        className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    <span className="text-xs text-gray-400 ml-2 mr-2">{review.time}</span>
                    </span>
                  </div>
                  
                  {/* 사용자 리뷰 내용 - 수정 모드일 때는 편집 폼으로 변경 */}
                  {editingUserReview[review.id] ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      {/* 주문한 상품 정보 표시 */}
                      <div className="flex flex-row justify-between bg-white border border-gray-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {(() => {
                              console.log('리뷰 작성 폼 - 상품 이미지 정보:', {
                                productId: product?.id,
                                productName: product?.name,
                                image: product?.image,
                                background: product?.background,
                                orderInfo: orderInfo
                              });
                              
                              if (product?.image) {
                                // 이미지 경로 처리 개선
                                let imageSrc = product.image;
                                if (product.image.startsWith('data:')) {
                                  // base64 이미지
                                  imageSrc = product.image;
                                } else if (product.image.startsWith('http')) {
                                  // 외부 URL
                                  imageSrc = product.image;
                                } else if (product.image.startsWith('/')) {
                                  // 절대 경로
                                  imageSrc = product.image;
                                } else {
                                  // 상대 경로
                                  imageSrc = `/images/${product.image}`;
                                }
                                
                                console.log('이미지 소스:', imageSrc);
                                return (
                                  <img 
                                    src={imageSrc}
                                    alt={orderInfo?.product || product?.name || '상품 이미지'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.log('이미지 로드 실패:', imageSrc);
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log('이미지 로드 성공:', imageSrc);
                                    }}
                                  />
                                );
                              } else if (product?.background) {
                                // 배경 이미지 경로 처리 개선
                                let backgroundSrc = product.background;
                                if (product.background.startsWith('data:')) {
                                  // base64 이미지
                                  backgroundSrc = product.background;
                                } else if (product.background.startsWith('http')) {
                                  // 외부 URL
                                  backgroundSrc = product.background;
                                } else if (product.background.startsWith('/')) {
                                  // 절대 경로
                                  backgroundSrc = product.background;
                                } else {
                                  // 상대 경로
                                  backgroundSrc = `/images/${product.background}`;
                                }
                                
                                console.log('배경 이미지 소스:', backgroundSrc);
                                return (
                                  <img 
                                    src={backgroundSrc}
                                    alt={orderInfo?.product || product?.name || '상품 이미지'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.log('배경 이미지 로드 실패:', backgroundSrc);
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log('배경 이미지 로드 성공:', backgroundSrc);
                                    }}
                                  />
                                );
                              } else {
                                console.log('이미지 없음 - 폴백 표시');
                                // 기본 이미지 표시
                                return (
                                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                                    <div className="text-orange-600 text-xs font-bold">
                                      {product?.name?.charAt(0) || 'A'}
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                            <div className={`w-full h-full bg-orange-100 rounded-lg items-center justify-center text-orange-600 text-xs font-bold ${(product?.image || product?.background) ? 'hidden' : 'flex'}`}>
                              {product?.name?.charAt(0) || 'A'}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{product?.name || '애드모어'}</div>
                            <div className="text-gray-500 text-xs">{product?.description || '서비스 상품'}</div>
                            <div className="text-orange-600 text-xs font-semibold mt-1">
                              {(() => {
                                try {
                                  const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
                                  const relatedOrder = orderList.find((order: any) => 
                                    order.productId === product?.id && order.review === '리뷰 확인'
                                  );
                                  if (relatedOrder) {
                                    return `주문일: ${relatedOrder.date} | 수량: ${relatedOrder.quantity}개`;
                                  }
                                } catch (error) {
                                  console.error('주문 정보 로드 중 오류:', error);
                                }
                                return `주문일: ${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')} | 수량: 1개`;
                              })()}
                            </div>
                          </div>
                        </div>
                        {/* 별점 선택 */}
                        <div className="flex flex-row items-center space-x-2 justify-center">
                          <div className="flex items-center space-x-1 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setUserReviewInputs(prev => ({
                                  ...prev,
                                  [review.id]: { ...prev[review.id], rating: star }
                                }))}
                                className="text-xl hover:scale-110 transition-transform"
                              >
                                <FontAwesomeIcon
                                  icon={star <= (userReviewInputs[review.id]?.rating || 0) ? faSolidStar : faRegularStar}
                                  className={star <= (userReviewInputs[review.id]?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 font-normal">
                            {(userReviewInputs[review.id]?.rating || 0) > 0 ? `${userReviewInputs[review.id]?.rating}점` : '(필수)*'}
                          </span>
                        </div>
                      </div>

                      {/* 리뷰 내용 */}
                      <div className="mb-4">
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">상세 리뷰</label>
                        <textarea
                          value={userReviewInputs[review.id]?.content || ''}
                          onChange={(e) => setUserReviewInputs(prev => ({
                            ...prev,
                            [review.id]: { ...prev[review.id], content: e.target.value }
                          }))}
                          placeholder="서비스 이용 후기를 작성해주세요."
                          className="w-full p-3 border border-gray-300 rounded-md text-xs resize-none"
                          rows={4}
                          maxLength={500}
                          autoFocus
                        />
                        <div className="text-right text-[10px] text-gray-500">
                          {(userReviewInputs[review.id]?.content || '').length}/500
                        </div>
                      </div>

                      {/* 버튼 */}
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => toggleEditUserReview(review.id, review.content, review.rating)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md min-w-[80px] hover:bg-gray-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleEditUserReview(review.id)}
                          className="flex-1 px-4 py-2 bg-orange-600 text-white text-white text-xs font-semibold rounded-md hover:bg-orange-700"
                        >
                          리뷰 수정
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2 text-gray-900 text-xs">{review.content}</div>
                  )}
                  
                  {/* 사용자 리뷰 버튼들 - 수정 모드가 아닐 때만 표시 */}
                  {!editingUserReview[review.id] && (
                    <div className="mt-2 flex space-x-3">
                      {/* 현재 로그인한 유저의 리뷰인 경우에만 편집/삭제 버튼 표시 */}
                      {review.user === localStorage.getItem('userEmail') && (
                        <>
                          <button
                            onClick={() => toggleEditUserReview(review.id, review.content, review.rating)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <FontAwesomeIcon icon={faPen} className="mr-1 text-xs" />
                            수정하기
                          </button>
                          <button
                            onClick={() => handleDeleteUserReview(review.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-1 text-xs" />
                            삭제하기
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* 관리자 댓글 표시 */}
                  {review.reply && (
                    <div className="bg-gray-50 border-l-4 border-blue-400 p-3 text-xs text-gray-700 mt-2 ml-4">
                      <div className="flex items-center mb-1">
                        <span className="font-bold text-blue-600 text-xs">애드모어</span>
                        <span className="text-xs text-gray-400 ml-2">{review.replyTime}</span>
                      </div>
                      
                      {/* 관리자 댓글 내용 - 수정 모드일 때는 textarea로 변경 */}
                      {editingReply[review.id] ? (
                        <div className="mb-2">
                          <textarea
                            value={adminReplyInputs[review.id] || ''}
                            onChange={(e) => setAdminReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="댓글을 수정해주세요..."
                            className="w-full p-2 border border-blue-300 rounded text-xs resize-none"
                            rows={3}
                            maxLength={300}
                            autoFocus
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              {(adminReplyInputs[review.id] || '').length}/300
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleEditReplyForm(review.id, review.reply || '')}
                                className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => handleEditAdminReply(review.id)}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                수정 완료
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs">{review.reply}</span>
                      )}
                      
                      {/* 관리자 댓글 버튼들 - 수정 모드가 아닐 때만 표시 */}
                      {!editingReply[review.id] && (
                        <div className="mt-2 flex space-x-3">
                          <button
                            onClick={() => toggleEditReplyForm(review.id, review.reply || '')}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <FontAwesomeIcon icon={faPen} className="mr-1 text-xs" />
                            수정하기
                          </button>
                          <button
                            onClick={() => handleDeleteAdminReply(review.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-1 text-xs" />
                            삭제하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 관리자 댓글 작성 폼 */}
                  {showReplyForms[review.id] && (
                    <div className="mt-3 ml-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="font-bold text-blue-600 text-xs">애드모어</span>
                        <span className="text-xs text-gray-500 ml-2">관리자 댓글</span>
                      </div>
                      <textarea
                        value={adminReplyInputs[review.id] || ''}
                        onChange={(e) => setAdminReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder="고객님의 리뷰에 답변을 남겨주세요..."
                        className="w-full p-2 border border-blue-300 rounded text-xs resize-none"
                        rows={3}
                        maxLength={300}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {(adminReplyInputs[review.id] || '').length}/300
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleReplyForm(review.id)}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleAddAdminReply(review.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            댓글 등록
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 관리자 댓글 남기기 버튼 (댓글이 없을 때만) */}
                  {!review.reply && (
                    <div className="mt-2 ml-4">
                      <button
                        onClick={() => toggleReplyForm(review.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showReplyForms[review.id] ? '댓글 작성 취소' : '댓글 남기기'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {productReviews.length > visibleReviews ? (
                <div className="text-center mt-4">
                  <button
                    className="px-4 py-2 border rounded hover:border-orange-300 text-gray-600 hover:bg-orange-50 text-xs w-full hover:text-orange-600"
                    onClick={() => setVisibleReviews(v => v + 3)}
                  >
                    더보기
                  </button>
                </div>
              ) : productReviews.length > 3 && visibleReviews > 3 ? (
                <div className="text-center mt-4">
                  <button
                    className="px-4 py-2 border rounded hover:border-orange-300 text-gray-600 hover:bg-orange-50 text-xs w-full hover:text-orange-600"
                    onClick={() => setVisibleReviews(3)}
                  >
                    접기
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      {/* 오른쪽: 상품 정보 카드 */}
      <div className="w-[280px] flex-shrink-0 hidden md:block">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-28 border border-gray-200">
          {/* 이미지/배경 */}
          <div className="flex justify-end pb-1">
            <button
              className="text-base"
              onClick={() => toggleFavorite(product.id)}
            >
              <FontAwesomeIcon
                icon={favorites.includes(product.id) ? faSolidHeart : faRegularHeart}
                className={`text-base ${favorites.includes(product.id) ? 'text-red-500' : 'text-gray-300'}`}
              />
            </button>
          </div>
            
          <div className="w-full h-48 rounded-lg bg-cover bg-center flex items-center justify-center mb-4 relative overflow-hidden">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : product.background ? (
              <img 
                src={product.background} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 text-2xl font-bold">
                {product.name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          {/* 상품정보내용 */}
          <div className="flex flex-col justify-between items-end mb-4">
            <div className="flex flex-col w-full">
              <h1 className="text-[18px] font-bold mb-1">{product.name}</h1>
              <div className="text-gray-500 text-sm mb-2">{product.description}</div>
              {/* 별점/리뷰수 */}
              <div className="flex items-center mb-2 text-xs">
                {(() => {
                  const stars = [];
                  const rating = product.rating ?? 0;
                  for (let i = 1; i <= 5; i++) {
                    if (rating >= i) {
                      stars.push(<FontAwesomeIcon key={i} icon={faSolidStar} className="text-yellow-400" />);
                    } else if (rating >= i - 0.5) {
                      stars.push(<FontAwesomeIcon key={i} icon={faStarHalfAlt} className="text-yellow-400" />);
                    } else {
                      stars.push(<FontAwesomeIcon key={i} icon={faRegularStar} className="text-gray-300" />);
                    }
                  }
                  return stars;
                })()}
                <span className="text-gray-700 font-medium ml-2 mr-1">{product.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-400 text-xs">({productReviews.length})</span>
              </div>
            </div>
            {/* 수량 */}
            <div className="flex items-center relative">
              <div 
                className="border rounded px-2 py-1 text-sm cursor-pointer flex items-center justify-between min-w-[80px] quantity-dropdown"
                onClick={toggleQuantityDropdown}
              >
                <span className="text-sm min-w-[48px] text-right mr-2">{quantity === 1 ? '1일' : quantity === 7 ? '7일' : '30일'}</span>
                <svg className={`w-3 h-3 ml-1 transition-transform ${quantityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {quantityDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10">
                  <div 
                    className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer text-right pr-8"
                    onMouseDown={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('1일 선택됨 - onMouseDown 이벤트');
                      setQuantity(1); 
                      setQuantityDropdownOpen(false);
                      console.log('드롭다운 닫기 시도: 1일');
                    }}
                  >
                    1일
                  </div>
                  <div 
                    className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer text-right pr-8"
                    onMouseDown={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('7일 선택됨 - onMouseDown 이벤트');
                      setQuantity(7); 
                      setQuantityDropdownOpen(false);
                      console.log('드롭다운 닫기 시도: 7일');
                    }}
                  >
                    7일
                  </div>
                  <div 
                    className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer text-right pr-8"
                    onMouseDown={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('30일 선택됨 - onMouseDown 이벤트');
                      setQuantity(30); 
                      setQuantityDropdownOpen(false);
                      console.log('드롭다운 닫기 시도: 30일');
                    }}
                  >
                    30일
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 가격 */}
          <div className="flex flex-row items-end justify-end mb-4 w-full" key={`price-section-${quantity}`}>
            {/* 할인율 표시 */}
            {(() => {
              const discountRate = calculateDiscountRate(quantity);
              console.log('할인율 체크:', { quantity, discountRate, hasDiscount: discountRate > 0 });
              return discountRate > 0 ? (
                <div className="flex items-center mb-1">
                  <span className="text-blue-500 font-bold text-sm mr-2">
                    {discountRate}%
                  </span>
                </div>
              ) : null;
            })()}
            
            {/* 원가 표시 (할인율이 있을 때만, 선택된 기간 기준) */}
            {(() => {
              const discountRate = calculateDiscountRate(quantity);
              const originalPrice = calculateOriginalPrice(quantity);
              console.log('원가 체크:', { 
                quantity, 
                discountRate, 
                originalPrice,
                hasOriginalPrice: originalPrice > 0 && discountRate > 0
              });
              return discountRate > 0 && originalPrice > 0 ? (
                <div className="flex items-center mb-1">
                  <span className="text-gray-400 line-through text-sm mr-2">
                    {originalPrice.toLocaleString()}원
                  </span>
                </div>
              ) : null;
            })()}
            
            {/* 결제 금액 표시 */}
            <div className="flex items-center" key={`price-${quantity}`}>
              <span className="text-gray-900 font-bold text-lg">
                {(() => {
                  console.log('가격 렌더링 - quantity:', quantity);
                  const finalPrice = calculatePrice(quantity);
                  console.log('최종 가격:', finalPrice);
                  return `${finalPrice.toLocaleString()}원`;
                })()}
              </span>
            </div>
          </div>
          
          {/* 수량/주문 버튼 (md 미만에서만 보임) */}
          <button className="w-full bg-orange-600 text-white py-3 rounded-md 
              hover:bg-orange-700 transition duration-300 text-base font-semibold mb-4"
            onClick={() => navigate('/order', {
              state: {
                order: {
                  product: {
                    ...product,
                    quantity,
                  },
                },
              },
            })}
          >
            주문하기
          </button>
          {/* 환불 규정 */}
          <div className="text-xs text-gray-500 border border-gray-200 pt-3 bg-gray-50 p-3 rounded-lg">
            <div className="font-bold mb-1">취소 및 환불 규정</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>서비스 요청 전에는 100% 환불 가능합니다.</li>
              <li>서비스 요청 후에는 중단 및 수정이 불가하여, 환불이 불가합니다.</li>
              <li>애드모어 서비스 문제로 인한 지연 및 진행이 불가한 경우 협의하여 환불이 가능합니다.</li>
              <li>모든 서비스는 요청 후 24시간 이내로 평균 시작됩니다.</li>
              <li>환불은 기본적으로 동일 결제수단 환불로 진행됩니다.</li>
            </ul>
          </div>
          {/* 상품 문의 버튼 */}
          <div
            className="mt-4 text-xs text-orange-600 font-semibold flex items-center border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors duration-300 cursor-pointer"
            onClick={() => {
              const message = `안녕하세요! 상품에 대해 문의드립니다.\n\n상품명: ${product.name}\n카테고리: ${product.category}\n\n빠른 답변 부탁드립니다.`;
              
              // localStorage에 상담 메시지 저장
              localStorage.setItem('chatAutoMessage', message);
              localStorage.setItem('chatType', 'consultation');
              localStorage.setItem('consultationProduct', JSON.stringify(product));
              
              // 채팅창 열기
              setIsChatOpen(true);
            }}
          >
            <span className="mr-2">ⓘ</span> 상품 문의 혹은 커스텀 문의도 가능해요!
          </div>
        </div>
      </div>
      {/* 하단 고정 바를 MobileNavBar로 대체 */}
      <MobileNavBar 
        setIsChatOpen={setIsChatOpen} 
        isChatOpen={false} 
        type="product-detail"
        product={product}
        quantity={quantity}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default ProductDetail; 