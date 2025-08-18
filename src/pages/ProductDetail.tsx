import React, { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar, faHeart as faSolidHeart, faHeart, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import mockReviews from '../data/reviews-list';
import products from '../data/products';
import { addRecentProduct, updateRecentProduct } from '../utils/recentProducts';
import MobileNavBar from '../components/MobileNavBar';
import { productAPI, reviewsAPI, ordersAPI } from '../services/api';
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
    
    // 할인율 계산 (1일도 포함)
    const discountRate = ((originalPrice - actualPrice) / originalPrice) * 100;
    return Math.round(discountRate);
  };

  // 1일 선택 시에도 할인율을 표시하기 위한 함수 (1일 가격 기준 원가 대비 할인율)
  const calculateDisplayDiscountRate = (selectedQuantity: number) => {
    if (!product || !product.price1Day) return 0;
    
    // 1일 선택 시 할인율 0% (1일 가격이 기준이므로 할인 없음)
    if (selectedQuantity === 1) {
      return 0;
    }
    
    // 7일 또는 30일 선택 시 할인율 계산
    const price1Day = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
    
    if (selectedQuantity === 7 && product.price7Days) {
      const price7Days = typeof product.price7Days === 'number' ? product.price7Days : parseFloat(String(product.price7Days));
      const originalPrice = price1Day * 7; // 7일 원가
      const discountRate = ((originalPrice - price7Days) / originalPrice) * 100;
      return Math.round(discountRate);
    }
    
    if (selectedQuantity === 30 && product.price30Days) {
      const price30Days = typeof product.price30Days === 'number' ? product.price30Days : parseFloat(String(product.price30Days));
      const originalPrice = price1Day * 30; // 30일 원가
      const discountRate = ((originalPrice - price30Days) / originalPrice) * 100;
      return Math.round(discountRate);
    }
    
    return 0;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // 리뷰 로드 함수
  const loadReviews = async () => {
    if (!product?.id) return;
    
    try {
      console.log('=== loadReviews 시작 ===');
      console.log('상품 ID:', product.id);
      console.log('상품명:', product.name);
      
      const response = await reviewsAPI.getAll();
      console.log('전체 리뷰 데이터:', response);
      
      // 현재 상품에 대한 리뷰만 필터링하고 데이터 매핑
      const currentProductReviews = response.filter((review: any) => 
        review.productId === product.id
      ).map((review: any) => ({
        ...review,
        // 백엔드 필드를 프론트엔드 필드로 매핑
        reply: review.adminReply || review.reply,
        replyTime: review.adminReplyTime || review.replyTime,
        user: review.userEmail || review.user,
        time: review.createdAt || review.time
      }));
      
      console.log('현재 상품 리뷰:', currentProductReviews);
      
      // 날짜 순으로 정렬 (최신이 맨 위)
      const sortedReviews = currentProductReviews.sort((a: any, b: any) => {
        const parseDate = (dateStr: string) => {
          if (!dateStr) return new Date(0);
          return new Date(dateStr);
        };
        
        const dateA = parseDate(a.createdAt || a.time);
        const dateB = parseDate(b.createdAt || b.time);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('정렬된 리뷰:', sortedReviews);
      setProductReviews(sortedReviews);
      
      // 상품 평균 별점 업데이트
      if (sortedReviews.length > 0) {
        const totalRating = sortedReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        const averageRating = totalRating / sortedReviews.length;
        
        setProduct(prevProduct => {
          if (prevProduct) {
            return {
              ...prevProduct,
              rating: Math.round(averageRating * 10) / 10,
              reviewCount: sortedReviews.length
            };
          }
          return prevProduct;
        });
      }
      
      console.log('=== loadReviews 완료 ===');
    } catch (error) {
      console.error('리뷰 로드 중 오류:', error);
      setProductReviews([]);
    }
  };

  // 리뷰 로드
  useEffect(() => {
    if (product?.id) {
      loadReviews();
    }
    
    // 페이지 포커스 시 리뷰 재로드 제거 - 데이터 일관성 유지를 위해
    // const handleFocus = () => {
    //   if (product?.id) {
    //     loadReviews();
    //   }
    // };
    
    // window.addEventListener('focus', handleFocus);
    // return () => window.removeEventListener('focus', handleFocus);
  }, [product?.id]);

  // 주문내역에서 리뷰 작성 가능 여부 확인
  useEffect(() => {
    const checkReviewEligibility = async () => {
      try {
        console.log('=== checkReviewEligibility 시작 ===');
        const userOrders = await ordersAPI.getUserOrders();
        console.log('userOrders:', userOrders);
        console.log('userOrders 타입:', typeof userOrders);
        console.log('userOrders가 배열인가?', Array.isArray(userOrders));
        
        // userOrders가 배열인지 확인
        if (!userOrders.orders || !Array.isArray(userOrders.orders)) {
          console.error('userOrders.orders가 배열이 아닙니다:', userOrders.orders);
          throw new Error('userOrders.orders is not an array');
        }
        
        // 현재 상품에 대한 주문만 확인
        const hasWritableReview = userOrders.orders.some((order: any) => {
          return order.productId === product?.id && 
                 (order.status === '작업완료' || order.status === '구매완료') && 
                 order.review === '리뷰 작성하기';
        });
        
        // 리뷰가 이미 작성되었는지 확인
        const hasWrittenReview = userOrders.orders.some((order: any) => {
          return order.productId === product?.id && 
                 (order.status === '작업완료' || order.status === '구매완료') && 
                 (order.review === '리뷰확인' || order.review === '리뷰보러가기');
        });
        
        console.log('리뷰 작성 가능 여부:', hasWritableReview);
        console.log('리뷰 작성 완료 여부:', hasWrittenReview);
        
        setCanWriteReview(hasWritableReview);
        setHasWrittenReview(hasWrittenReview);
      } catch (error) {
        console.error('주문내역 확인 중 오류:', error);
        // 백엔드 API 실패 시 localStorage 폴백
        try {
          const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
          const hasWritableReview = orderList.some((order: any) => {
            return order.productId === product?.id && 
                   (order.status === '작업완료' || order.status === '구매완료') && 
                   order.review === '리뷰 작성하기';
          });
          
          const hasWrittenReview = orderList.some((order: any) => {
            return order.productId === product?.id && 
                   (order.status === '작업완료' || order.status === '구매완료') && 
                   (order.review === '리뷰확인' || order.review === '리뷰보러가기');
          });
          
          setCanWriteReview(hasWritableReview);
          setHasWrittenReview(hasWrittenReview);
        } catch (localStorageError) {
          console.error('localStorage 확인 중 오류:', localStorageError);
          setCanWriteReview(false);
          setHasWrittenReview(false);
        }
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
      const checkOrderForReview = async () => {
        try {
          console.log('=== checkOrderForReview 시작 ===');
          // 백엔드에서 사용자 주문 목록 가져오기
          const userOrders = await ordersAPI.getUserOrders();
          console.log('userOrders:', userOrders);
          console.log('userOrders 타입:', typeof userOrders);
          console.log('userOrders가 배열인가?', Array.isArray(userOrders));
          
          // userOrders가 배열인지 확인
          if (!userOrders.orders || !Array.isArray(userOrders.orders)) {
            console.error('userOrders.orders가 배열이 아닙니다:', userOrders.orders);
            throw new Error('userOrders.orders is not an array');
          }
          
          const orderId = location.state?.orderId;
          let currentOrder;
          
          if (orderId) {
            currentOrder = userOrders.orders.find((order: any) => {
              return order.productId === product.id && order.orderId === orderId;
            });
          } else {
            currentOrder = userOrders.orders.find((order: any) => {
              return order.productId === product.id;
            });
          }
          
          console.log('찾은 currentOrder:', currentOrder);
          
          if (currentOrder) {
            setOrderInfo(currentOrder);
            // 이미 리뷰를 작성한 경우에는 폼을 열지 않음
            if (currentOrder.review === '리뷰확인' || currentOrder.review === '리뷰보러가기') {
              setCanWriteReview(false);
              setHasWrittenReview(true);
              setShowReviewForm(false);
            } else {
              setCanWriteReview(true);
              setHasWrittenReview(false);
              setShowReviewForm(true);
            }
          } else {
            setCanWriteReview(true);
            setHasWrittenReview(false);
            setShowReviewForm(true);
          }
        } catch (error) {
          console.error('백엔드 주문 확인 중 오류:', error);
          // 백엔드 API 실패 시 localStorage 폴백
          try {
            const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
            const orderId = location.state?.orderId;
            let currentOrder;
            if (orderId) {
              currentOrder = orderList.find((order: any) => {
                return order.productId === product.id && order.orderId === orderId;
              });
            } else {
              currentOrder = orderList.find((order: any) => {
                return order.productId === product.id;
              });
            }
            if (currentOrder) {
              setOrderInfo(currentOrder);
              if (currentOrder.review === '리뷰확인' || currentOrder.review === '리뷰보러가기') {
                setCanWriteReview(false);
                setHasWrittenReview(true);
                setShowReviewForm(false);
              } else {
                setCanWriteReview(true);
                setHasWrittenReview(false);
                setShowReviewForm(true);
              }
            } else {
              setCanWriteReview(true);
              setHasWrittenReview(false);
              setShowReviewForm(true);
            }
          } catch (localStorageError) {
            console.error('localStorage 확인 중 오류:', localStorageError);
            setCanWriteReview(true);
            setHasWrittenReview(false);
            setShowReviewForm(true);
          }
        }
      };
      
      checkOrderForReview();
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

  // 리뷰확인을 위해 온 경우 해당 리뷰를 강조 표시
  const [highlightedReviewId, setHighlightedReviewId] = useState<number | null>(null);
  
  useEffect(() => {
    if (location.state?.showReview && location.state?.orderId) {
      // 해당 주문의 리뷰를 찾아서 강조 표시
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail && productReviews.length > 0) {
        const userReview = productReviews.find((review: any) => 
          review.user === userEmail && review.productId === product?.id
        );
        if (userReview) {
          setHighlightedReviewId(userReview.id);
          // 3초 후 강조 표시 제거
          setTimeout(() => {
            setHighlightedReviewId(null);
          }, 3000);
        }
      }
    }
  }, [location.state, productReviews, product?.id]);

  // 리뷰 작성 핸들러
  const handleSubmitReview = async () => {
    // 중복 제출 방지
    if (isSubmitting) {
      console.log('리뷰 제출 중입니다. 잠시만 기다려주세요.');
      return;
    }

    // 필수 입력 검증
    if (reviewRating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (!reviewContent.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 현재 로그인한 유저의 이메일 가져오기
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail || userEmail === 'guest@example.com') {
        alert('리뷰를 작성하려면 로그인이 필요합니다.');
        return;
      }

      console.log('=== 리뷰 제출 시작 ===');
      console.log('상품 ID:', product?.id);
      console.log('상품명:', product?.name);
      console.log('사용자 이메일:', userEmail);
      console.log('평점:', reviewRating);
      console.log('내용:', reviewContent.trim());

      // 상품 ID 검증
      if (!product?.id) {
        console.error('상품 ID가 없습니다!');
        alert('상품 정보를 찾을 수 없습니다.');
        return;
      }

      // 1. 백엔드에 리뷰 저장
      const reviewData = {
        productId: product.id,
        userEmail: userEmail,
        rating: reviewRating,
        content: reviewContent.trim(),
        orderId: location.state?.orderId || null
      };

      console.log('리뷰 데이터 전송:', reviewData);
      console.log('API_BASE_URL:', process.env.REACT_APP_API_URL || 'http://localhost:5001/api');
      
      console.log('=== 리뷰 API 호출 시작 ===');
      const createResponse = await reviewsAPI.create(reviewData);
      console.log('=== 리뷰 API 호출 완료 ===');
      console.log('리뷰 저장 응답:', createResponse);

      // 2. 저장된 리뷰 확인
      console.log('=== 리뷰 확인 시작 ===');
      const verifyResponse = await fetch('http://localhost:5001/api/reviews');
      if (!verifyResponse.ok) {
        throw new Error(`리뷰 확인 API 호출 실패: ${verifyResponse.status}`);
      }
      const allReviews = await verifyResponse.json();
      console.log('전체 리뷰 목록:', allReviews);
      
      const savedReview = allReviews.find((r: any) => 
        r.productId === product.id && 
        r.userEmail === userEmail && 
        r.content === reviewContent.trim()
      );

      if (savedReview) {
        console.log('✅ 리뷰 저장 성공:', savedReview);
      } else {
        console.log('❌ 리뷰 저장 확인 실패');
        console.log('찾으려는 리뷰 조건:', {
          productId: product.id,
          userEmail: userEmail,
          content: reviewContent.trim()
        });
        throw new Error('리뷰 저장 확인 실패');
      }

      // 3. 리뷰 목록 즉시 업데이트
      await loadReviews();

      // 4. 주문 상태 업데이트
      const userOrders = await ordersAPI.getUserOrders();
      const orderId = location.state?.orderId;
      
      const targetOrder = userOrders.orders.find((order: any) => 
        order.productId === product.id && 
        (orderId ? order.orderId === orderId : true) &&
        (order.status === '작업완료' || order.status === '구매완료') && 
        order.review === '리뷰 작성하기'
      );

      if (targetOrder) {
        // 주문 상태 업데이트
        await ordersAPI.updateStatus(targetOrder.orderId, '리뷰확인');
        
        // 리뷰 상태도 업데이트
        const reviewUpdateResponse = await fetch(`http://localhost:5001/api/orders/order/${targetOrder.orderId}/review`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review: '리뷰확인' }),
        });

        if (reviewUpdateResponse.ok) {
          console.log('주문 상태 업데이트 완료');
        }
      }

      // 5. 리뷰 목록 새로고침
      await loadReviews();

      // 6. 성공 메시지
      alert('리뷰가 성공적으로 등록되었습니다!');
      
      // 리뷰 섹션으로 자동 스크롤하여 작성된 리뷰 확인
      setTimeout(() => {
        serviceReviewRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // 7. 페이지 새로고침 방지
      if (location.state?.fromOrder) {
        navigate(location.pathname, { replace: true });
      }

      console.log('=== 리뷰 제출 완료 ===');

    } catch (error) {
      console.error('리뷰 저장 중 오류:', error);
      alert('리뷰 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      // UI 상태 업데이트 - 항상 실행되도록 finally 블록으로 이동
      setCanWriteReview(false);
      setHasWrittenReview(true);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewContent('');
      setIsSubmitting(false);
    }
  };

  // 관리자 댓글 등록 핸들러
  const handleAddAdminReply = async (reviewId: number) => {
    const replyContent = adminReplyInputs[reviewId]?.trim();
    if (!replyContent) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      // 백엔드 API 호출
      await reviewsAPI.addAdminReply(reviewId, replyContent);
      
      // 성공 후 리뷰 데이터 다시 로드
      await loadReviews();
      
      // UI 상태 초기화
      setAdminReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
      setShowReplyForms(prev => ({ ...prev, [reviewId]: false }));
      setEditingReply(prev => ({ ...prev, [reviewId]: false }));
      
      alert('댓글이 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('댓글 등록 중 오류:', error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  };

  // 관리자 댓글 수정 핸들러
  const handleEditAdminReply = async (reviewId: number) => {
    const replyContent = adminReplyInputs[reviewId]?.trim();
    if (!replyContent) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      // 백엔드 API 호출
      await reviewsAPI.updateAdminReply(reviewId, replyContent);
      
      // 성공 후 리뷰 데이터 다시 로드
      await loadReviews();
      
      // UI 상태 초기화
      setAdminReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
      setEditingReply(prev => ({ ...prev, [reviewId]: false }));
      
      alert('댓글이 성공적으로 수정되었습니다!');
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  };

  // 관리자 댓글 삭제 핸들러
  const handleDeleteAdminReply = async (reviewId: number) => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      try {
        // 백엔드 API 호출
        await reviewsAPI.deleteAdminReply(reviewId);
        
        // 성공 후 리뷰 데이터 다시 로드
        await loadReviews();
        
        alert('댓글이 삭제되었습니다.');
      } catch (error) {
        console.error('댓글 삭제 중 오류:', error);
        alert('댓글 삭제 중 오류가 발생했습니다.');
      }
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
  const handleEditUserReview = async (reviewId: number) => {
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
    if (currentReview && (currentReview.userEmail || currentReview.user) !== userEmail) {
      alert('자신이 작성한 리뷰만 수정할 수 있습니다.');
      return;
    }

    try {
      // 백엔드 API 호출
      await reviewsAPI.update(reviewId, {
        rating: reviewInput.rating,
        content: reviewInput.content.trim()
      });

      // 성공 후 리뷰 데이터 다시 로드
      await loadReviews();
      
      // UI 상태 초기화
      setUserReviewInputs(prev => ({ ...prev, [reviewId]: { content: '', rating: 0 } }));
      setEditingUserReview(prev => ({ ...prev, [reviewId]: false }));
      
      alert('리뷰가 성공적으로 수정되었습니다!');
    } catch (error) {
      console.error('리뷰 수정 중 오류:', error);
      alert('리뷰 수정 중 오류가 발생했습니다.');
    }
  };

  // 사용자 리뷰 삭제 핸들러
  const handleDeleteUserReview = async (reviewId: number) => {
    // 현재 로그인한 유저의 이메일 가져오기
    const userEmail = localStorage.getItem('userEmail');
    const currentReview = productReviews.find(review => review.id === reviewId);
    
    // 리뷰 작성자와 현재 로그인한 유저가 같은지 확인
    if (currentReview && (currentReview.userEmail || currentReview.user) !== userEmail) {
      alert('자신이 작성한 리뷰만 삭제할 수 있습니다.');
      return;
    }

    if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      try {
        // 백엔드 API 호출
        await reviewsAPI.delete(reviewId);

        // 성공 후 리뷰 데이터 다시 로드
        await loadReviews();
        
        alert('리뷰가 삭제되었습니다.');
        
        // UserPage에서 온 경우 UserPage로 돌아가기 옵션 제공
        if (location.state?.fromOrder) {
          const goToUserPage = window.confirm('주문내역 페이지로 돌아가시겠습니까?');
          if (goToUserPage) {
            navigate('/mypage?tab=orders');
          }
        }
      } catch (error) {
        console.error('리뷰 삭제 중 오류:', error);
        alert('리뷰 삭제 중 오류가 발생했습니다.');
      }
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
          // 최근 본 상품에 추가 (이미지 필드 정규화)
          const productForRecent = {
            ...foundProduct,
            // 이미지 경로 정규화
            image: foundProduct.image ? 
              (foundProduct.image.startsWith('data:') ? 
                foundProduct.image : 
                foundProduct.image.startsWith('/') ? 
                  foundProduct.image : 
                  `/${foundProduct.image}`
              ) : undefined,
            background: foundProduct.background ? 
              (foundProduct.background.startsWith('data:') ? 
                foundProduct.background : 
                foundProduct.background.startsWith('/') ? 
                  foundProduct.background : 
                  `/${foundProduct.background}`
              ) : undefined
          };
          addRecentProduct(productForRecent);
          // 최근 본 상품 목록에서 해당 상품을 최신 데이터로 업데이트
          updateRecentProduct(foundProduct.id, productForRecent);
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
            // 최근 본 상품에 추가 (이미지 필드 정규화)
            const productForRecent = {
              ...localProduct,
              // 이미지 경로 정규화
              image: localProduct.image ? 
                (localProduct.image.startsWith('data:') ? 
                  localProduct.image : 
                  localProduct.image.startsWith('/') ? 
                    localProduct.image : 
                    `/${localProduct.image}`
                ) : undefined,
              background: localProduct.background ? 
                (localProduct.background.startsWith('data:') ? 
                  localProduct.background : 
                  localProduct.background.startsWith('/') ? 
                    localProduct.background : 
                    `/${localProduct.background}`
                ) : undefined
            };
            addRecentProduct(productForRecent);
            // 최근 본 상품 목록에서 해당 상품을 최신 데이터로 업데이트
            updateRecentProduct(localProduct.id, productForRecent);
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

  // 리뷰확인(리뷰확인 버튼 클릭)으로 들어온 경우, 리뷰작성 폼이 절대 뜨지 않도록 안전장치
  useEffect(() => {
    if (location.state?.showReview) {
      setShowReviewForm(false);
      setCanWriteReview(false);
    }
  }, [location.state]);

  // 리뷰확인 버튼으로 들어온 경우 리뷰 섹션으로 자동 스크롤
  useEffect(() => {
    if (location.state?.scrollToReviews && serviceReviewRef.current) {
      setTimeout(() => {
        serviceReviewRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.state?.scrollToReviews]);

  // 리뷰확인 버튼으로 들어온 경우 필터링된 리뷰 목록 생성
  const filteredReviews = useMemo(() => {
    if (location.state?.showReview && location.state?.orderId) {
      // 리뷰확인 버튼으로 들어온 경우, 현재 사용자가 작성한 해당 상품의 리뷰만 필터링
      const currentUserEmail = localStorage.getItem('userEmail');
      return productReviews.filter((review: any) => 
        (review.userEmail || review.user) === currentUserEmail && 
        review.productId === product?.id
      );
    }
    return productReviews;
  }, [productReviews, location.state?.showReview, location.state?.orderId, product?.id]);

  // 리뷰확인으로 들어온 경우 해당 사용자의 리뷰 ID 찾기
  const userReviewId = useMemo(() => {
    if (location.state?.showReview && location.state?.orderId) {
      const currentUserEmail = localStorage.getItem('userEmail');
      const userReview = productReviews.find((review: any) => 
        (review.userEmail || review.user) === currentUserEmail && 
        review.productId === product?.id &&
        review.orderId === location.state?.orderId
      );
      return userReview?.id;
    }
    return null;
  }, [productReviews, location.state?.showReview, location.state?.orderId, product?.id]);

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
            <div className={`border-2 rounded-lg p-6 mb-6 ${
              location.state?.fromOrder 
                ? 'bg-orange-50 border-orange-200 shadow-lg' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              {/* 주문에서 온 경우 안내 메시지 */}
              {location.state?.fromOrder && (
                <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 text-sm font-semibold">📝 리뷰 작성</span>
                    <span className="text-orange-700 text-xs">
                      주문하신 상품에 대한 리뷰를 작성해주세요.
                    </span>
                  </div>
                </div>
              )}
              
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
                      }
                      
                      // 기본 아이콘
                      return (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">
                      {orderInfo?.product || product?.name || '상품명'}
                    </span>
                    {orderInfo?.orderId && (
                      <span className="text-xs text-gray-500">
                        주문번호: {orderInfo.orderId}
                      </span>
                    )}
                    {orderInfo?.date && (
                      <span className="text-xs text-gray-500">
                        주문일: {orderInfo.date}
                      </span>
                    )}
                    {orderInfo?.quantity && (
                      <span className="text-xs text-gray-500">
                        수량: {orderInfo.quantity}일
                      </span>
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
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-xs font-semibold rounded-md ${
                    isSubmitting 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isSubmitting ? '등록 중...' : '리뷰 등록'}
                </button>
              </div>
            </div>
          )}

          {productReviews.length === 0 ? (
            <div className="text-gray-400">아직 후기가 없습니다.</div>
          ) : (
            <>
              
              <div className="flex flex-col items-center rounded-lg p-4 mb-4 bg-gray-50 border">
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
                  <span className="text-gray-600 text-sm">
                    <span className="text-gray-700 font-bold">{productReviews.length}</span>
                    개의 후기
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  실제 마케팅을 통해 구매한 이용자들이 남긴 후기입니다.
                </div>
              </div>

              {productReviews.slice(0, visibleReviews).map((review: any) => (
                <div 
                  key={review.id} 
                  id={`review-${review.id}`}
                  className={`border-b border-gray-100 pb-6 mb-4 last:border-b-0 last:mb-0 transition-all duration-500 ${
                    (location.state?.showReview && review.id === userReviewId) 
                      ? 'bg-blue-50 border-blue-200 rounded-lg p-4 shadow-md' 
                      : ''
                  }`}
                >
                  {(location.state?.showReview && review.id === userReviewId) && (
                    <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800 font-semibold text-center">
                      내가 작성한 리뷰입니다 ✨
                    </div>
                  )}
                  <div className="flex items-center pt-2 mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center pt-2 mb-2">
                      <div className="flex flex-row sm:items-center">
                        <span className="font-semibold text-blue-600 mr-2 text-xs">{maskEmail(review.userEmail || review.user)}</span>
                        <span className="flex items-center text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FontAwesomeIcon
                            key={i}
                            icon={i < review.rating ? faSolidStar : faRegularStar}
                            className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </span>
                      </div>
                      <div className="flex flex-row items-center">
                        <span className="text-xs text-gray-400 sm:ml-2 sm:mr-2 mt-1 sm:mt-0">{review.createdAt || review.time}</span>
                        {/* 사용자 리뷰 버튼들 - 수정 모드가 아닐 때만 표시 */}
                        {!editingUserReview[review.id] && (
                          <div className="flex space-x-3 ml-2">
                            {/* 리뷰확인으로 들어온 경우 해당 리뷰에만, 또는 현재 로그인한 유저의 리뷰인 경우에만 편집/삭제 버튼 표시 */}
                            {(() => {
                              const currentUserEmail = localStorage.getItem('userEmail');
                              const isCurrentUserReview = (review.userEmail || review.user) === currentUserEmail;
                              
                              // 리뷰확인으로 들어온 경우: 해당 리뷰에만 버튼 표시 (주문번호도 확인)
                              if (location.state?.showReview) {
                                return review.id === userReviewId;
                              }
                              
                              // 일반적인 경우: 현재 사용자의 리뷰이면서 주문번호가 일치하는 경우에만 수정/삭제 가능
                              // location.state?.orderId가 있으면 해당 주문번호의 리뷰만, 없으면 모든 사용자 리뷰
                              if (location.state?.orderId) {
                                return isCurrentUserReview && review.orderId === location.state.orderId;
                              }
                              
                              // 일반적인 경우: 현재 사용자의 리뷰이면 수정/삭제 가능
                              return isCurrentUserReview;
                            })() && (
                              <>
                                <button
                                  onClick={() => toggleEditUserReview(review.id, review.content, review.rating)}
                                  className="text-xs text-gray-400 hover:text-orange-800 hover:underline font-medium flex items-center
                                      "
                                >
                                  <FontAwesomeIcon icon={faPen} className="mr-1 text-[10px]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUserReview(review.id)}
                                  className="hidden text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="mr-1 text-xs" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 사용자 리뷰 내용 - 수정 모드일 때는 편집 폼으로 변경 */}
                  {editingUserReview[review.id] ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      {/* 주문한 상품 정보 표시 */}
                      <div className="flex flex-col sm:flex-row justify-between bg-white border border-gray-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-[92px] h-[69px] bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
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
                            <div className="text-xs mt-1">
                              {(() => {
                                // 리뷰의 주문 정보 표시
                                if (review.orderId) {
                                  try {
                                    const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
                                    const relatedOrder = orderList.find((order: any) => 
                                      order.orderId === review.orderId
                                    );
                                    if (relatedOrder) {
                                      return (
                                        <div className="flex flex-col">
                                          <span className="text-gray-600 text-xs">주문번호: {relatedOrder.orderId}</span>
                                          <div className="flex flex-row space-x-1">
                                            <span className="text-gray-600 text-xs">주문일: {relatedOrder.date} |</span>
                                            <span className="text-gray-600 text-xs">수량: {relatedOrder.quantity}일</span>
                                          </div>
                                        </div>
                                      );
                                    }
                                  } catch (error) {
                                    console.error('주문 정보 로드 중 오류:', error);
                                  }
                                }
                                // 주문 정보가 없는 경우 기본값
                                return (
                                  <div className="flex flex-row space-x-1">
                                    <span className="text-gray-600 text-xs">주문일: {new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')} |</span>
                                    <span className="text-gray-600 text-xs">수량: 1일</span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        {/* 별점 선택 */}
                        <div className="flex flex-row items-center space-x-2 justify-end">
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
                          className="flex-1 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-md hover:bg-orange-700"
                        >
                          리뷰 수정
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2 text-gray-900 text-xs">{review.content}</div>
                  )}
                  
                  
                  
                  {/* 관리자 댓글 표시 */}
                  {review.reply && (
                    <div className="bg-gray-50 border-l-4 border-blue-400 p-3 text-xs text-gray-700 mt-2 ml-4">
                      <div className="flex items-center mb-1 space-x-3">
                        <div className="flex items-center">
                          <span className="font-bold text-blue-600 text-xs">애드모어</span>
                          <span className="text-xs text-gray-400 ml-2">{review.replyTime}</span>
                        </div>
                        
                        {/* 관리자 댓글 버튼들 - 수정 모드가 아닐 때만 표시 */}
                        {!editingReply[review.id] && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleEditReplyForm(review.id, review.reply || '')}
                              className="text-xs text-gray-400 hover:text-orange-800 font-medium flex items-center"
                            >
                              <FontAwesomeIcon icon={faPen} className="mr-1 text-[10px]" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdminReply(review.id)}
                              className="hidden text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-1 text-xs" />
                            </button>
                          </div>
                        )}
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
                icon={favorites.includes(product.id) ? faSolidHeart : faHeart}
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
              const discountRate = calculateDisplayDiscountRate(quantity);
              const originalPrice = calculateOriginalPrice(quantity);
              console.log('할인율 체크:', { quantity, discountRate, hasDiscount: discountRate >= 0 });
              return (
                <div className="flex items-center mb-1">
                  <span className="text-blue-500 font-bold text-sm mr-2">
                    {discountRate || 0}%
                  </span>
                </div>
              );
            })()}
            
            {/* 원가 표시 (1일 가격 기준으로 계산) */}
            {(() => {
              const price1Day = product.price1Day || 0;
              let originalPrice = 0;
              
              if (price1Day > 0) {
                if (quantity === 1) {
                  originalPrice = price1Day; // 1일 원가 (1일 가격과 동일)
                } else if (quantity === 7) {
                  originalPrice = price1Day * 7; // 7일 원가
                } else if (quantity === 30) {
                  originalPrice = price1Day * 30; // 30일 원가
                }
              }
              
              console.log('원가 체크:', { 
                quantity, 
                price1Day,
                originalPrice,
                hasOriginalPrice: originalPrice > 0
              });
              
              return originalPrice > 0 ? (
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