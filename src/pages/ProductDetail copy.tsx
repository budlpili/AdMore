import React, { useState, useEffect, useRef } from 'react';
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

  const [quantity, setQuantity] = useState(1);
  const handleDecrease = () => setQuantity(q => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity(q => Math.min(99, q + 1));

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
    const checkIfReviewWritten = () => {
      // 주문에서 온 경우에는 리뷰 작성 여부를 확인하지 않음
      if (location.state?.fromOrder) {
        setHasWrittenReview(false);
        return;
      }
      
      try {
        const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
        const hasReview = existingReviews.some((review: any) => 
          review.productId === product?.id && review.user === '나'
        );
        setHasWrittenReview(hasReview);
      } catch (error) {
        console.error('리뷰 작성 여부 확인 중 오류:', error);
        setHasWrittenReview(false);
      }
    };

    checkIfReviewWritten();
  }, [product?.id, location.state?.fromOrder]);

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

    const newReview = {
      id: Date.now(),
      user: '나',
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
            review: '리뷰 확인'
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
    } catch (error) {
      console.error('리뷰 수정 중 오류:', error);
    }

    setUserReviewInputs(prev => ({ ...prev, [reviewId]: { content: '', rating: 0 } }));
    setEditingUserReview(prev => ({ ...prev, [reviewId]: false }));
    
    alert('리뷰가 성공적으로 수정되었습니다!');
  };

  // 사용자 리뷰 삭제 핸들러
  const handleDeleteUserReview = (reviewId: number) => {
    if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      const updatedReviews = productReviews.filter(review => review.id !== reviewId);
      setProductReviews(updatedReviews);

      // localStorage 업데이트
      try {
        const existingReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
        const updatedLocalReviews = existingReviews.filter((review: any) => review.id !== reviewId);
        localStorage.setItem('mockReviews', JSON.stringify(updatedLocalReviews));
        
        // 주문내역에서 해당 상품의 리뷰 상태를 '리뷰 작성하기'로 변경
        const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
        const updatedOrderList = orderList.map((order: any) => {
          if (order.productId === product?.id) {
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
        setCanWriteReview(hasWritableReview);
      } catch (error) {
        console.error('주문내역 확인 중 오류:', error);
        setCanWriteReview(false);
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
        // 먼저 로컬 데이터에서 찾기
        let foundProduct = products.find(p => p.id === Number(id));
        
        if (!foundProduct) {
          // 로컬에 없으면 백엔드에서 모든 상품을 가져와서 찾기
          const allProducts = await productAPI.getAllProducts();
          foundProduct = allProducts.find(p => p.id === Number(id));
        }
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          // 상품을 찾을 수 없는 경우
          navigate('/products', { replace: true });
        }
      } catch (error) {
        console.error('상품 로드 에러:', error);
        // 에러 발생 시 로컬 데이터에서 다시 찾기
        const localProduct = products.find(p => p.id === Number(id));
        if (localProduct) {
          setProduct(localProduct);
        } else {
          navigate('/products', { replace: true });
        }
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
          <div className="text-sm text-gray-700">
            {product.description || '상품 설명이 없습니다.'}
          </div>
          {/* 상세설명 */}
          <div>
            {product.detailedDescription ? (
              <div className="mt-8">
                <h3 className="text-base font-bold mb-4 text-gray-800">상세 설명</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {product.detailedDescription}
                </div>
              </div>
            ) : null}
            
            {/* 서비스 진행과정 */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4 text-gray-800">1. 서비스 진행과정</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>유입을 원하시는 스토어, 오픈마켓, 쇼핑몰 주소를 보내주시면 참여 유입이 진행됩니다.</p>
                <p>키워드를 전달해 주시면 키워드 검색 참여 유입이 진행됩니다.</p>
                <p className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  IP를 변경하는 방식의 불법 프로그램 등은 웹 엔진에 의해 모두 발각되어, 저품질의 원인이 됩니다. 하지만 저희는 이런 서비스와는 매우 다른 성격을 갖고 있으며, 실제 방문자를 통해 진행되며, 기계적인 어뷰징 작업이 아닌, 실제 PC와 모바일에서 진행되는 작업이며, 저품질 상승 및 최적화 특화를 목표로 진행하고 있는 상품입니다. 지금까지 그만큼 견고하고 정확하게 답답한 부분을 직접 경험하고 해결했습니다.
                </p>
              </div>
            </div>

            {/* 서비스 안내 */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4 text-gray-800">2. 서비스 안내</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-600 mb-2 text-sm">한국 방문자</h4>
                  <p className="text-sm text-gray-700">기본적인 유입은 한국 트래픽(방문자)로 유입됩니다. 원하시는 국가가 있다면 최대한 맞춰드립니다.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-600 mb-2 text-sm">맞춤 키워드 방문자</h4>
                  <p className="text-sm text-gray-700">프로그램이 아닌, 실제 유저들이 전달해 주신 키워드로 참여 유입이 진행되어 검색 최적화(SEO)에 도움을 줍니다</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-600 mb-2 text-sm">다양한 애널리틱스에 적용되는 실제 방문자</h4>
                  <p className="text-sm text-gray-700">구글 또는 네이버 등 포털에서 제공하는 애널리틱스에서 정확한 분석 확인이 가능합니다. *애널리틱스마다 통계수치 체크 로직이 달라 결과치는 달라질 수 있습니다</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-600 mb-2 text-sm">지속적인 관리 상담 피드백</h4>
                  <p className="text-sm text-gray-700">진행 참여 후 종료되는 서비스가 아닌, 언제든 문의를 주시면 지속적인 관리 상담 피드백이 가능합니다.</p>
                </div>
              </div>
            </div>

            {/* 상품 상세 안내 */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4 text-gray-800">3.상품 상세 안내</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800 font-semibold">*작업 진행 이전 메세지를 통한 상담으로 맞춤진행이 됩니다.</p>
                <p className="text-sm text-orange-700 mt-1">언제든 메세지 보내주시면 빠르고 친절한 상담 도와 드리겠습니다</p>
              </div>
              
              <div className="space-y-4">
                {/* 스탠다드 패키지 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800">스탠다드 패키지</h4>
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">10일</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-4">10,000원</div>
                  <p className="text-sm text-gray-700 mb-4 font-semibold">10일간 검색최적화 트래픽(방문자) 유입관리 진행 됩니다.</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SEO최적화를 통해 검색시 노출 증가효과</li>
                    <li>• 방문자 관리를 통해 블로그, 카페, 포털웹사이트 검색최적화</li>
                    <li>• 키워드 추가금액 있습니다.</li>
                    <li>• 키워드 추가시 문의메세지 보내주세요.</li>
                  </ul>
                </div>

                {/* 디럭스 패키지 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800">디럭스 패키지</h4>
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">20일</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-4">18,000원</div>
                  <p className="text-sm text-gray-700 mb-4 font-semibold">20일간 검색최적화 트래픽(방문자) 유입관리 진행 됩니다.</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SEO최적화를 통해 검색시 노출 증가효과</li>
                    <li>• 방문자 관리를 통해 블로그, 카페, 포털웹사이트 검색최적화</li>
                    <li>• 키워드 추가금액 있습니다.</li>
                    <li>• 키워드 추가시 문의메세지 보내주세요.</li>
                  </ul>
                </div>

                {/* 프리미엄 패키지 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800">프리미엄 패키지</h4>
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">30일</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-4">25,000원</div>
                  <p className="text-sm text-gray-700 mb-4 font-semibold">30일간 검색최적화 트래픽(방문자) 유입관리 진행 됩니다.</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SEO최적화를 통해 검색시 노출 증가효과</li>
                    <li>• 방문자 관리를 통해 블로그, 카페, 포털웹사이트 검색최적화</li>
                    <li>• 키워드 추가금액 있습니다.</li>
                    <li>• 키워드 추가시 문의메세지 보내주세요.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">- 그 외 다양한 검색포털, 스토어, 오픈마켓 등의 전용 트래픽(방문자) 관리도 가능합니다.</p>
                <p className="text-sm text-gray-700 mt-2">언제든 문의 메시지 보내주세요</p>
                <p className="text-sm text-gray-700">문의 메시지를 보내주시면 보다 상세한 안내 상담 가능합니다.</p>
              </div>
            </div>

            {/* 최적화 상품 상세 안내 */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4 text-gray-800">4. 최적화 상품 상세 안내</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-semibold">* 작업 진행 이전 메시지를 통한 상담으로 맞춤 진행이 됩니다.</p>
                <p className="text-sm text-blue-700 mt-1">언제든 메시지 보내주시면 빠르고 친절한 상담 도와드리겠습니다</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-semibold"># 블로그, 카페, 포털 전용 최적화 전용 최적화 키워드 검색 방문자 참여 상품</p>
                <p className="text-sm text-yellow-700 mt-1">*해당 서비스는 블록,카페,포털 검색후 방문자를 참여시켜 블로그,카페,포털 활성화에 많은 도움을 줍니다.</p>
                <p className="text-sm text-yellow-700">추가 참여도 가능합니다.</p>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">* 키워드 1개</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">30일관리</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">블로그, 카페, 포털 전용 최적화 전용 최적화 키워드 검색 방문자 참여</p>
                  <div className="text-xl font-bold text-blue-600">330,000원</div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">* 키워드 2개</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">30일관리</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">블로그, 카페, 포털 전용 최적화 전용 최적화 키워드 검색 방문자 참여</p>
                  <div className="text-xl font-bold text-blue-600">660,000원</div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">* 키워드 3개</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">30일관리</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">블로그, 카페, 포털 전용 최적화 전용 최적화 키워드 검색 방문자 참여</p>
                  <div className="text-xl font-bold text-blue-600">990,000원</div>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-xs text-gray-700 font-semibold">*키워드 관리가 가장 적합합니다.</p>
              </div>
            </div>

            {/* 작업 문의사항 */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4 text-gray-800">5. 작업 문의사항</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm">A. 어떻게 진행하면 될까요?</h4>
                  <p className="text-xs text-gray-700">작업 진행 이전에 미리 메시지를 통해 문의를 주시면 고객님의 상황에 맞게 저희가 패키지 안내를 드리고 있습니다.</p>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm">B. 저품질의 위험은 없을까요?</h4>
                  <p className="text-xs text-gray-700">매크로 서비스가 아닌 다양한 마케팅 방식을 통해 참여 유입 진행되기 때문에 지수 향상에 도움을 줍니다.</p>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm">C. 요청 후 언제 트래픽(방문자) 유입 되나요?</h4>
                  <p className="text-xs text-gray-700">하루에도 정말 많은 블로그와 카페 트래픽(방문자) 진행을 받고 있기 때문에 요청 후 평균 24시간 이내로트래픽(방문자) 유입 반영이 시작됩니다.</p>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1 text-sm">D. 세금계산서 발행도 가능한가요?</h4>
                  <p className="text-xs text-gray-700">네 저희는 법인사업자로 세금계산서 발행 가능합니다. 주문 전문의하세요.</p>
                </div>
              </div>
            </div>

            {/* 주문방법 */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4 text-gray-800">6. 주문방법</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-700 mb-2">원하시는 패키지 상품을 결제하시거나 진행한 문의 메시지를 보내주시면 보다 상세한 설명 진행이 가능합니다.</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• 메시지를 주시면 결제 요청을 드릴 수 있습니다.</li>
                  <li>• 목표에 따라 견적이 달라질 수 있으므로 결제 전 문의 메세지로 정확한 견적 상담을 받으시길 권장 드립니다.</li>
                </ul>
              </div>
            </div>

            {/* 주의 사항 및 보상 규정 안내 */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4 text-gray-800">7. 주의 사항 및 보상 규정 안내</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="text-xs text-red-800 space-y-2">
                  <li>• 서비스 거래 전 또는 결제 후, 반드시 문의 메시지를 주셔서 조아요 전문가와 목표에 대한 합의 진행을 해주세요.</li>
                  <li>• 조아요는 의뢰인이 요청한 목표치 달성을 위해 취선의 노력을 하겠습니다.</li>
                  <li>• 조아요는 의뢰인과 합의한 요청 목표 수치에 도달하지못할 경우에는, 협의를 통해 전액 환불 또는 추가 서비스 진행을 해드리고 있습니다.</li>
                  <li>• 의뢰인의 잘못된 피드백으로 인해 원치 않으시는 서비스 요청이 들어간 경우 환불 진행이 되지 않습니다.</li>
                </ul>
              </div>
            </div>
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
                    {product?.background ? (
                      <img 
                        src={product.background} 
                        alt={orderInfo?.product || product?.name || '상품 이미지'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-orange-100 rounded-lg items-center justify-center text-orange-600 text-xs font-bold ${product?.background ? 'hidden' : 'flex'}`}>
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
                    <span className="font-semibold text-blue-600 mr-2 text-xs">{review.user}</span>
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
                            {product?.background ? (
                              <img 
                                src={product.background} 
                                alt={orderInfo?.product || product?.name || '상품 이미지'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-orange-100 rounded-lg items-center justify-center text-orange-600 text-xs font-bold ${product?.background ? 'hidden' : 'flex'}`}>
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
            
          <div
            className="w-full h-48 rounded-lg bg-cover bg-center flex items-center justify-center mb-4 relative"
            style={{
              backgroundImage: product.background ? `url(${product.background})` : undefined,
              backgroundColor: !product.background ? '#FFF7ED' : undefined
            }}
          >
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
                <span className="text-gray-700 font-medium ml-2 mr-1">{product.rating?.toFixed(1)}</span>
                <span className="text-gray-400 text-xs">({product.reviewCount?.toLocaleString()})</span>
              </div>
            </div>
            {/* 수량 */}
            <div className="flex items-center">
              <button className="w-6 h-6 border rounded text-sm" onClick={handleDecrease} disabled={quantity === 1}>-</button>
              <span className="mx-3 text-sm">{quantity}</span>
              <button className="w-6 h-6 border rounded text-sm" onClick={handleIncrease} disabled={quantity === 99}>+</button>
            </div>
          </div>
          
          {/* 가격 */}
          <div className="flex items-center mb-4 w-full justify-end">
            {product.discountRate && (
              <span className="text-blue-600 font-bold text-lg mr-2">{product.discountRate}%</span>
            )}
            {product.originalPrice && (
              <span className="text-gray-400 line-through text-sm mr-4">{(product.originalPrice * quantity).toLocaleString()}원</span>
            )}
            <span className="text-gray-900 font-bold text-xl">{typeof product.price === 'number' ? (product.price * quantity).toLocaleString() : product.price}원</span>
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