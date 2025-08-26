import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser as faUserSolid, faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faRotateLeft, faArrowRight, faCircleExclamation, faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar, faHeart as faSolidHeart, faHeart, faPen, faTrash, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram, IconDefinition } from '@fortawesome/free-brands-svg-icons';
import CouponCard from '../components/CouponCard';
import ProductCard from '../components/ProductCard';
import { useDragScroll } from '../hooks/useDragScroll';
import { ordersAPI, customerServiceAPI, couponsAPI, productAPI } from '../services/api';
import mockReviews from '../data/reviews-list';
import { DUMMY_COUPONS, Coupon } from '../data/coupons';
import { Order } from '../data/orderdata';
import { Notice } from '../types';
import MobileNavBar from '../components/MobileNavBar';

interface UserPageProps {
  setIsChatOpen: (open: boolean) => void;
}

const TABS = [
  { key: 'orders', label: '주문내역' },
  { key: 'payments', label: '결제내역' },
  { key: 'favorits', label: '즐겨찾기한 서비스' },
  { key: 'coupons', label: '쿠폰함' },
  { key: 'settings', label: '환경설정' },
];

const COUPON_TABS = [
  { key: 'available', label: '사용 가능' },
  { key: 'used', label: '사용 완료' },
  { key: 'expiring', label: '만료 임박' },
  { key: 'all', label: '전체 쿠폰' },
];

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
const clearAllFavorites = () => {
  localStorage.removeItem(FAVORITES_KEY);
};

// ReviewButton 컴포넌트 정의 _ 버튼형식
const ReviewButton = ({ order }: { order: any }) => {
  const navigate = useNavigate();
  return (
    <div
      className="text-xs text-white font-semibold bg-orange-500 rounded-full px-2 py-1 shadow-md shadow-orange-200 text-center cursor-pointer hover:bg-orange-600"
      onClick={() => {
        const productId = typeof order.productId === 'object' ? (order.productId as any)._id : order.productId;
        navigate(`/products/${productId}`, { state: { fromOrder: true, orderId: order.orderId } });
      }}
    >
      리뷰 작성
    </div>
  );
};
// ReviewButton 컴포넌트 정의 _ 텍스트형식
const ReviewButtonText = ({ order }: { order: any }) => {
  const navigate = useNavigate();
  const canWriteReview = order.status === '작업완료' || order.status === '구매완료' || order.confirmStatus === '구매확정완료' || order.confirmStatus === '구매완료';
  const isReviewCompleted = order.review && (order.review === '리뷰확인' || order.review === '리뷰보러가기');
  
  // 리뷰 작성 가능한 상태이고 아직 작성하지 않은 경우
  if (canWriteReview && !isReviewCompleted) {
    return (
      <div
        className="flex items-center justify-center gap-1 text-[10px] text-orange-400 font-semibold text-center cursor-pointer 
          border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100 px-2 py-1"
        onClick={() => {
          const productId = typeof order.productId === 'object' ? (order.productId as any)._id : order.productId;
          navigate(`/products/${productId}`, { state: { fromOrder: true, orderId: order.orderId } });
        }}
      >
        리뷰 작성하기 <FontAwesomeIcon icon={faArrowRight} className="w-2 h-2" />
      </div>
    );
  }
  
  // 리뷰 작성 완료된 경우
  if (isReviewCompleted) {
    return (
      <div
        className="flex items-center justify-center gap-1 text-[10px] text-blue-500 font-semibold text-center cursor-pointer 
          border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100 px-2 py-1"
        onClick={() => {
          const productId = typeof order.productId === 'object' ? (order.productId as any)._id : order.productId;
          navigate(`/products/${productId}`, { state: { showReview: true, fromOrder: true, orderId: order.orderId } });
        }}
      >
        리뷰확인 <FontAwesomeIcon icon={faArrowRight} className="w-2 h-2" />
      </div>
    );
  }
  
  // 리뷰 작성 불가능한 경우
  return (
    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-semibold text-center">
      리뷰 작성불가
    </div>
  );
};

// PaymentCancelButton 컴포넌트 정의
const PaymentCancelButton = ({ order, setIsChatOpen }: { order: any; setIsChatOpen: (open: boolean) => void }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelPayment = () => {
    setShowCancelModal(true);
  };

  const handleSubmitCancel = () => {
    if (!cancelReason.trim()) {
      alert('취소사유를 입력해주세요.');
      return;
    }

    // 결제일 포맷팅 함수
    const formatPaymentDateForCancel = (dateString: string): string => {
      if (!dateString || dateString === '-') return '입금전';
      
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
      } catch (error) {
        return dateString;
      }
    };

    // 결제금액 천단위 포맷팅
    const formatPriceForCancel = (price: string | number): string => {
      if (!price) return '0원';
      
      const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : price;
      return numPrice.toLocaleString() + '원';
    };

    const cancelMessage = `결제취소 요청\n\n결제번호: PAY-${order.orderId.replace('-', '')}\n주문번호: ${order.orderId}\n상품명: ${order.product}\n결제금액: ${formatPriceForCancel(order.price)}\n결제방법: ${order.paymentMethod}\n결제일: ${formatPaymentDateForCancel(order.paymentDate)}\n취소사유: ${cancelReason}\n\n위 결제건에 대한 취소를 요청드립니다.`;
    
    // 채팅창을 열고 결제 정보를 localStorage에 저장하여 자동 입력되도록 함
    localStorage.setItem('chatAutoMessage', cancelMessage);
    localStorage.setItem('chatType', 'payment_cancel');
    setIsChatOpen(true);
    
    // 모달 닫기 및 입력값 초기화
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleCloseModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
  };

  return (
    <>
      <div
        className="text-xs text-red-400 font-semibold rounded-full px-2 py-1 text-center cursor-pointer mt-1 hover:underline hover:text-red-500"
        onClick={handleCancelPayment}
      >
        취소요청
      </div>

      {/* 취소사유 입력 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 text-center py-2">
                <h3 className="text-lg font-semibold text-gray-900">결제취소 요청</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-left">결제 정보</label>
              <ol className="text-gray-700 font-base flex flex-col gap-1 justify-start bg-gray-50 rounded-lg p-3 mb-4 
                    list-disc list-inside">
                <li className=' text-left ml-2'>결제번호: PAY-{order.orderId.replace('-', '')}</li>
                <li className=' text-left ml-2'>상품명: {order.product}</li>
                <li className=' text-left ml-2'>결제금액: {(() => {
                  if (!order.price) return '0원';
                  const numPrice = typeof order.price === 'string' ? parseInt(order.price.replace(/[^\d]/g, '')) : order.price;
                  return numPrice.toLocaleString() + '원';
                })()}</li>
                <li className=' text-left ml-2'>결제일: {(() => {
                  if (!order.paymentDate || order.paymentDate === '-') return '입금전';
                  try {
                    const date = new Date(order.paymentDate);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
                  } catch (error) {
                    return order.paymentDate;
                  }
                })()}</li>
              </ol>
              
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                취소사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소사유를 입력해주세요."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 
                    text-xs resize-none mb-4"
                rows={4}
                autoFocus
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmitCancel}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
              >
                취소요청
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const UserPage: React.FC<UserPageProps> = ({ setIsChatOpen }) => {
  const location = useLocation();
  // 쿼리스트링에서 tab 파라미터 추출
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') || 'mypage';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [couponTab, setCouponTab] = useState('all');
  const navigate = useNavigate();
  
  // 날짜 검색 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // 상태 필터 상태
  const [statusFilter, setStatusFilter] = useState('전체 상태');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // paymentsStatusFilter 상태 추가
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('전체');
  
  // 이름 변경 상태
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  
  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // 회원 탈퇴 상태
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [withdrawalAgreed, setWithdrawalAgreed] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // 공지사항 상태
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);

  // 쿠폰함 상태
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleLogout = () => {
    // 모든 인증 관련 데이터 제거
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    
    // 채팅 관련 데이터도 제거
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('chat_messages_') || key.startsWith('chat_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 페이지 새로고침하여 상태 초기화
    window.location.href = '/';
  };

  // 비밀번호 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // 3초 후 성공 메시지 제거
        setTimeout(() => {
          setPasswordSuccess('');
        }, 3000);
      } else {
        setPasswordError(data.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      setPasswordError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 회원 탈퇴
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawalAgreed) {
      setWithdrawalError('안내 사항에 동의해주세요.');
      return;
    }

    if (!withdrawalPassword) {
      setWithdrawalError('비밀번호를 입력해주세요.');
      return;
    }

    if (!window.confirm('정말로 회원 탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsWithdrawing(true);
    setWithdrawalError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: withdrawalPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('회원 탈퇴가 완료되었습니다.');
        handleLogout(); // 로그아웃 처리
      } else {
        setWithdrawalError(data.message || '회원 탈퇴에 실패했습니다.');
      }
    } catch (err) {
      setWithdrawalError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 공지사항 로드
  const loadNotices = async () => {
    try {
      const response = await customerServiceAPI.getNotices();
      console.log('UserPage - 공지사항 데이터:', response);
      
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const transformedNotices = response.map((notice: any) => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        important: notice.important === true || notice.important === 1 || notice.important === '1',
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        author: notice.author || '관리자'
      }));
      
      console.log('UserPage - 변환된 공지사항:', transformedNotices);
      setNotices(transformedNotices);
    } catch (error: any) {
      console.error('UserPage - 공지사항 로드 에러:', error);
      // 기본 공지사항으로 fallback
      const defaultNotices: Notice[] = [
        {
          id: 1,
          title: '서비스 이용약관 개정 안내',
          content: '안녕하세요. 서비스 이용약관이 개정되었습니다. 새로운 약관을 확인해주세요.',
          important: true,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          author: '관리자'
        }
      ];
      setNotices(defaultNotices);
    }
  };

  // 사용자 정보 로드
  const loadUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const userEmail = localStorage.getItem('userEmail');
      
      if (!token) {
        console.log('토큰이 없습니다.');
        return;
      }

      if (!userEmail) {
        console.log('사용자 이메일이 없습니다.');
        return;
      }

      // 사용자 이메일을 기반으로 이름 복원 시도
      if (userEmail === 'namare@kakao.com') {
        const storedName = localStorage.getItem('userName');
        if (!storedName || storedName === '임시 사용자') {
          localStorage.setItem('userName', '나마레');
          setUserName('나마레');
          setNewName('나마레');
          console.log('이메일 기반으로 이름 복원: 나마레');
        }
        
        // 임시 토큰을 실제 사용자 이메일이 포함된 형태로 업데이트
        const currentToken = localStorage.getItem('token');
        if (currentToken && currentToken.startsWith('temp_token_')) {
          const newToken = `temp_token_${Date.now()}_${userEmail}`;
          localStorage.setItem('token', newToken);
          console.log('임시 토큰 업데이트:', newToken);
        }
      }

      console.log('토큰 확인:', token.substring(0, 20) + '...');
      console.log('사용자 이메일:', userEmail);
      
      // 토큰 디코딩 시도 (클라이언트 사이드에서)
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('토큰 페이로드:', payload);
          const expDate = new Date(payload.exp * 1000);
          console.log('토큰 만료 시간:', expDate);
          console.log('현재 시간:', new Date());
          console.log('토큰 만료 여부:', new Date() > expDate);
        }
      } catch (e) {
        console.log('토큰 디코딩 실패:', e);
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('사용자 정보 로드 성공:', userData);
        
        // 사용자 정보가 제대로 반환되었는지 확인
        if (userData && userData.name) {
          // 임시 사용자가 아닌 경우에만 localStorage에 저장
          if (userData.name !== '임시 사용자') {
            localStorage.setItem('userName', userData.name);
            console.log('사용자 이름 설정 완료:', userData.name);
          } else {
            console.log('임시 사용자로 설정됨');
          }
          setUserName(userData.name);
          setNewName(userData.name);
        } else {
          console.warn('사용자 정보에 이름이 없습니다:', userData);
          // localStorage에서 기존 이름 가져오기
          const storedUserName = localStorage.getItem('userName');
          if (storedUserName) {
            setUserName(storedUserName);
            setNewName(storedUserName);
            console.log('localStorage에서 이름 복원:', storedUserName);
          }
        }
      } else if (response.status === 401) {
        console.warn('토큰이 만료되었거나 유효하지 않습니다. 사용자 정보 로드만 건너뜁니다.');
        // localStorage에서 기존 이름 가져오기
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
          setUserName(storedUserName);
          setNewName(storedUserName);
          console.log('토큰 만료로 localStorage에서 이름 복원:', storedUserName);
        }
        return;
      } else {
        console.error('사용자 정보 로드 실패:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('에러 상세:', errorData);
        
        // localStorage에서 기존 이름 가져오기
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
          setUserName(storedUserName);
          setNewName(storedUserName);
          console.log('API 실패로 localStorage에서 이름 복원:', storedUserName);
        }
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
    
    // Promise를 반환하여 .catch() 사용 가능하도록 함
    return Promise.resolve();
  };
  // 상품 데이터 상태
  const [products, setProducts] = useState<any[]>([]);
  
  // 즐겨찾기 상태
  const [favoriteIds, setFavoriteIds] = useState<(string | number)[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  
  // 상품 데이터 로드
  const loadProducts = async () => {
    try {
      const activeProducts = await productAPI.getActiveProducts();
      setProducts(activeProducts);
    } catch (error) {
      console.error('상품 로드 에러:', error);
      setProducts([]);
    }
  };
  
  useEffect(() => {
    // 상품 데이터 로드
    loadProducts();
    
    // 사용자 정보 로드 (실패해도 계속 진행)
    loadUserInfo().catch(() => {
      // 사용자 정보 로드 실패 시 기본값 사용
      const storedUserName = localStorage.getItem('userName');
      if (storedUserName) {
        setUserName(storedUserName);
        setNewName(storedUserName);
      }
    });
    
    // 공지사항 로드
    loadNotices();
    // 쿠폰함 로드
    loadUserCoupons();
  }, []);
  
  // 즐겨찾기 상품 업데이트
  useEffect(() => {
    const favorites = getFavorites();
    setFavoriteIds(favorites);
    const favoriteProductsList = products.filter((product: any) => favorites.includes(product._id || product.id));
    setFavoriteProducts(favoriteProductsList);
  }, [products]);

  // 공지사항 순환 애니메이션
  useEffect(() => {
    if (notices.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentNoticeIndex((prevIndex) => (prevIndex + 1) % notices.length);
    }, 4000); // 4초마다 다음 공지사항으로 변경

    return () => clearInterval(interval);
  }, [notices.length]);

  // 공지사항 수동 변경 함수들
  const handlePrevNotice = () => {
    if (notices.length === 0) return;
    setCurrentNoticeIndex((prevIndex) => 
      prevIndex === 0 ? notices.length - 1 : prevIndex - 1
    );
  };

  const handleNextNotice = () => {
    if (notices.length === 0) return;
    setCurrentNoticeIndex((prevIndex) => (prevIndex + 1) % notices.length);
  };
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setActiveTab(params.get('tab') || 'mypage');
  }, [location.search]);

  // URL 파라미터에서 상태 필터 읽기
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusFromUrl = params.get('status');
    
    if (statusFromUrl) {
      if (activeTab === 'orders') {
        setStatusFilter(statusFromUrl);
      } else if (activeTab === 'payments') {
        setPaymentsStatusFilter(statusFromUrl);
      }
    }
  }, [location.search, activeTab]);

  // 탭 변경 시 필터 초기화 (URL 파라미터로 인한 탭 변경일 때만)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    
    // URL 파라미터로 인한 탭 변경이고, 필터가 명시적으로 설정되지 않은 경우에만 초기화
    if (tabFromUrl === 'orders' && activeTab === 'orders') {
      // URL에 특별한 필터 파라미터가 없으면 전체 상태로 초기화
      if (!params.get('status')) {
        setStatusFilter('전체 상태');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
      }
    } else if (tabFromUrl === 'payments' && activeTab === 'payments') {
      // URL에 특별한 필터 파라미터가 없으면 전체로 초기화
      if (!params.get('status')) {
        setPaymentsStatusFilter('전체');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
      }
    }
  }, [location.search, activeTab]);

  const handleRemoveFavorite = (id: string | number): void => {
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

  // 이름 변경 함수들
  const handleStartEditName = () => {
    setIsEditingName(true);
    setNewName(userName);
    setNameError('');
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setNewName(userName);
    setNameError('');
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      setNameError('이름을 입력해주세요.');
      return;
    }



    if (newName.trim().length < 2) {
      setNameError('이름은 2자 이상 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      console.log('이름 변경 토큰 확인:', token.substring(0, 20) + '...');

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName.trim() })
      });

      if (response.ok) {
        setUserName(newName.trim());
        setIsEditingName(false);
        setNameError('');
        
        // 관리자페이지에 사용자 정보 변경 알림
        window.dispatchEvent(new CustomEvent('userInfoChanged', {
          detail: {
            type: 'name',
            newName: newName.trim(),
            userEmail: localStorage.getItem('userEmail')
          }
        }));
        
        alert('이름이 변경되었습니다.');
      } else if (response.status === 401) {
        console.error('토큰이 만료되었거나 유효하지 않습니다.');
        // 토큰이 만료된 경우 로그아웃 처리
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        setNameError(errorData.message || '이름 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('이름 변경 실패:', error);
      setNameError('이름 변경 중 오류가 발생했습니다.');
    }
  };

  // 쿠폰함 로드 함수
  const loadUserCoupons = async () => {
    try {
      setCouponLoading(true);
      
      // 토큰에서 사용자 ID 추출
      const token = localStorage.getItem('token');
      let userId = '1'; // 기본값
      
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            userId = payload.id.toString();
            console.log('토큰에서 추출한 사용자 ID:', userId);
          }
        } catch (e) {
          console.log('토큰에서 사용자 ID 추출 실패:', e);
        }
      }
      
      const response = await couponsAPI.getUserCoupons(userId);
      
      if (response.success && response.coupons) {
        console.log('유저 쿠폰함 데이터:', response.coupons);
        console.log('첫 번째 쿠폰의 sendId:', response.coupons[0]?.sendId);
        console.log('첫 번째 쿠폰 전체 데이터:', response.coupons[0]);
        setUserCoupons(response.coupons);
      } else {
        console.log('쿠폰함 데이터가 없습니다.');
        setUserCoupons([]);
      }
    } catch (error) {
      console.error('쿠폰함 로드 에러:', error);
      setUserCoupons([]);
    } finally {
      setCouponLoading(false);
    }
  };

  // 쿠폰 사용 처리 함수
const handleUseUserCoupon = async (sendId: string) => {
  try {
    const response = await couponsAPI.useCoupon(sendId);
    if (response.success) {
      alert('쿠폰이 사용되었습니다.');
      // 쿠폰함 다시 로드
      await loadUserCoupons();
    } else {
      alert('쿠폰 사용에 실패했습니다.');
    }
  } catch (error) {
    console.error('쿠폰 사용 에러:', error);
    alert('쿠폰 사용에 실패했습니다.');
  }
};

// 쿠폰 삭제 처리 함수
const handleDeleteUserCoupon = async (sendId: string, couponName: string) => {
  if (!window.confirm(`"${couponName}" 쿠폰을 삭제하시겠습니까?\n\n삭제된 쿠폰은 복구할 수 없습니다.`)) {
    return;
  }

  try {
    const response = await couponsAPI.deleteCoupon(sendId);
    if (response.success) {
      alert('쿠폰이 삭제되었습니다.');
      // 쿠폰함 다시 로드
      await loadUserCoupons();
    } else {
      alert('쿠폰 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('쿠폰 삭제 에러:', error);
    alert('쿠폰 삭제에 실패했습니다.');
  }
};
  const toggleFavorite = (id: string | number) => {
    if (favoriteIds.includes(id)) {
      removeFavorite(id);
      setFavoriteIds(prev => prev.filter(fid => fid !== id));
      setFavoriteProducts(prev => prev.filter(product => (product._id || product.id) !== id));
    } else {
      addFavorite(id);
      setFavoriteIds(prev => [...prev, id]);
      const productToAdd = products.find((p: any) => (p._id || p.id) === id);
      if (productToAdd) {
        setFavoriteProducts(prev => [...prev, productToAdd]);
      }
    }
  };

  // 주문 데이터 로드
  const loadOrders = async () => {
    try {
      // 현재 로그인한 사용자 이메일 가져오기
      const currentUserEmail = localStorage.getItem('userEmail');
      console.log('현재 로그인한 사용자:', currentUserEmail);
      
      if (!currentUserEmail || currentUserEmail === 'guest@example.com') {
        console.log('로그인되지 않은 사용자입니다.');
        setOrderList([]);
        return;
      }
      
      // 백엔드 API에서 주문 데이터 가져오기
      const response = await ordersAPI.getUserOrders();
      console.log('=== 백엔드 주문 데이터 응답 ===');
      console.log('전체 응답:', response);
      
      if (response && response.orders) {
        // 현재 사용자의 주문만 필터링
        const userOrders = response.orders.filter((order: any) => 
          order.userEmail === currentUserEmail
        );
        
        console.log('현재 사용자 주문 목록:', userOrders);
        console.log('첫 번째 주문 데이터:', userOrders[0]);
        setOrderList(userOrders);
        console.log('백엔드에서 주문 데이터 로드 완료:', userOrders);
        
        // 백엔드 데이터를 localStorage에 동기화 (백업용)
        localStorage.setItem('orderList', JSON.stringify(userOrders));
      } else {
        console.log('백엔드에서 주문 데이터를 가져올 수 없습니다.');
        setOrderList([]);
      }
    } catch (error) {
      console.error('주문 데이터 로드 중 오류:', error);
      // 백엔드 실패 시 localStorage에서 폴백 데이터 로드
      try {
        const currentUserEmail = localStorage.getItem('userEmail');
        const savedOrderList = localStorage.getItem('orderList');
        if (savedOrderList && currentUserEmail) {
          const parsedOrders = JSON.parse(savedOrderList);
          // 현재 사용자의 주문만 필터링
          const userOrders = parsedOrders.filter((order: any) => 
            order.userEmail === currentUserEmail
          );
          setOrderList(userOrders);
          console.log('localStorage에서 폴백 데이터 로드:', userOrders);
        } else {
          setOrderList([]);
        }
      } catch (localStorageError) {
        console.error('localStorage 폴백 로드 중 오류:', localStorageError);
        setOrderList([]);
      }
    }
  };

  // 결제내역 데이터 로드 (orderList를 기반으로 처리)
  const loadPayments = async () => {
    try {
      // 현재 로그인한 사용자 이메일 가져오기
      const currentUserEmail = localStorage.getItem('userEmail');
      
      if (!currentUserEmail || currentUserEmail === 'guest@example.com') {
        console.log('로그인되지 않은 사용자입니다.');
        return;
      }
      
      // 백엔드 API에서 주문 데이터 가져오기
      const response = await ordersAPI.getUserOrders();
      if (response && response.orders) {
        // 현재 사용자의 주문만 필터링
        const userOrders = response.orders.filter((order: any) => 
          order.userEmail === currentUserEmail
        );
        
        // 결제내역은 orderList를 기반으로 처리되므로 orderList 업데이트
        setOrderList(userOrders);
        console.log('결제내역 데이터 로드 완료:', userOrders);
      } else {
        console.log('결제내역 데이터는 orderList를 기반으로 처리됩니다.');
      }
    } catch (error) {
      console.error('결제 데이터 로드 중 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadOrders();
    loadPayments();
  }, []);

  // 사용자 이메일 상태 추가
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  // 사용자 이메일 변경 감지
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail !== currentUserEmail) {
      setCurrentUserEmail(userEmail || '');
      if (userEmail && userEmail !== 'guest@example.com') {
        console.log('사용자 변경 감지, 데이터 새로 로드:', userEmail);
        loadOrders();
        loadPayments();
      }
    }
  }, [currentUserEmail]);

  // 주문내역 데이터 배열을 변수로 분리
  const [orderList, setOrderList] = useState<Order[]>([]);

  // 구매확정 처리 함수
  const handleConfirmPurchase = async (orderId: string) => {
    if (window.confirm('구매를 확정하시겠습니까?\n\n구매확정 후에는 되돌릴 수 없습니다.')) {
      try {
        // 백엔드 API 호출하여 구매확정 처리
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/orders/${orderId}/confirm`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ confirmStatus: '구매완료' }),
        });

        if (response.ok) {
          // 백엔드에서 최신 데이터를 다시 로드하여 상태 동기화
          await loadOrders();
          
          alert('구매가 확정되었습니다!');
          console.log(`주문 ${orderId} 구매확정 완료`);
        } else {
          console.error('구매확정 API 호출 실패:', response.status);
          alert('구매확정 처리 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('구매확정 처리 중 오류:', error);
        alert('구매확정 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 주문 상태 업데이트 함수 (관리자 페이지와 동일한 로직)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // 백엔드 API 호출
      await ordersAPI.updateStatus(orderId, newStatus);
      
      // 백엔드에서 최신 데이터를 다시 로드하여 상태 동기화
      await loadOrders();
      
      console.log(`주문 ${orderId} 상태가 ${newStatus}로 업데이트되었습니다.`);
    } catch (error) {
      console.error('주문 상태 업데이트 중 오류:', error);
      alert('주문 상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 날짜 필터링 함수
  const filterByDate = (order: any) => {
    if (!startDate && !endDate) return true;
    
    const orderDate = new Date(order.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      return orderDate >= start && orderDate <= end;
    } else if (start) {
      return orderDate >= start;
    } else if (end) {
      return orderDate <= end;
    }
    
    return true;
  };

  // 상태 필터링 함수
  const filterByStatus = (order: any) => {
    if (statusFilter === '전체 상태') return true;
    if (statusFilter === '가상계좌발급') return order.paymentMethod === '가상계좌' && (!order.paymentDate || order.paymentDate === '-');
    if (statusFilter === '작업완료') return order.status === '작업완료' && order.confirmStatus !== '구매완료';
    if (statusFilter === '구매완료') return order.status === '작업완료' && order.confirmStatus === '구매완료';
    if (statusFilter === '구매확정') return order.status === '작업완료' && order.confirmStatus !== '구매완료';
    if (statusFilter === '리뷰확인') return order.status === '작업완료' && order.confirmStatus === '구매완료' && (order.review === '리뷰확인' || order.review === '리뷰보러가기');
    return order.status === statusFilter;
  };

  // 필터링된 주문 목록
  const filteredOrderList = orderList.filter(filterByDate).filter(filterByStatus);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredOrderList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredOrderList.slice(startIndex, endIndex);

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 날짜 포맷팅 함수 (Date 객체용) - 한국 시간대 고려
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜 포맷팅 함수 (yyyy-mm-dd 형식) - 날짜만 표시
  const formatOrderDate = (dateString: string): string => {
    if (!dateString || dateString === '-') return '입금전';
    
    try {
      const date = new Date(dateString);
      
      // 이미 로컬 시간대의 날짜라면 변환하지 않음
      let displayDate = date;
      
      // ISO 문자열이거나 UTC 시간인 경우에만 한국 시간대로 변환
      if (dateString.includes('T') || dateString.includes('Z') || dateString.includes('+')) {
        // UTC 시간을 한국 시간대로 변환
        displayDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      }
      
      const year = displayDate.getFullYear();
      const month = String(displayDate.getMonth() + 1).padStart(2, '0');
      const day = String(displayDate.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('날짜 포맷 오류:', error, '원본:', dateString);
      return dateString;
    }
  };

  // 가격 천단위 포맷팅 함수
  const formatPrice = (price: string | number): string => {
    if (!price) return '0원';
    
    const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : price;
    return numPrice.toLocaleString() + '원';
  };

  // 주문 상태 뱃지 렌더링 함수 (관리자 페이지와 동일한 스타일)
  const renderOrderStatusBadge = (order: any) => {
    const statusColors = {
      '주문접수': 'bg-blue-100 text-blue-800',
      '대기중': 'bg-gray-100 text-gray-800',
      '진행 중': 'bg-yellow-100 text-yellow-800',
      '작업완료': 'bg-green-100 text-green-800',
      '구매완료': 'bg-purple-100 text-purple-800',
      '작업취소': 'bg-red-100 text-red-800',
      '취소': 'bg-red-100 text-red-800'
    };
    
    // status가 "작업완료"이고 confirmStatus가 "구매완료"인 경우 "구매완료"로 표시
    // status가 "리뷰확인"인 경우 "구매완료"로 표시
    let displayStatus = order.status;
    if (order.status === '작업완료' && order.confirmStatus === '구매완료') {
      displayStatus = '구매완료';
    } else if (order.status === '리뷰확인') {
      displayStatus = '구매완료';
    }
    const color = statusColors[displayStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    
    // 리뷰가 실제로 작성되었는지 확인
    const isReviewCompleted = order.review && (order.review === '리뷰확인' || order.review === '리뷰보러가기');
    
    return (
      <div className="flex flex-col gap-1 items-center">
        {/* 상태 뱃지 - 항상 "작업완료"로 표시 */}
        <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{displayStatus}</span>
        
        {/* 1단계: 작업완료 상태에서 구매확정 버튼 */}
        {order.status === '작업완료' && (!order.confirmStatus || order.confirmStatus === '구매확정 대기 중' || order.confirmStatus === '구매확정전') && (
          <button
            className="text-xs text-white bg-blue-600 rounded-md px-2 py-1 font-semibold hover:bg-blue-700 transition mt-1"
            onClick={() => handleConfirmPurchase(order.orderId)}
          >
            구매확정
          </button>
        )}
        
        {/* 2단계: 구매확정 완료 후 리뷰작성하기 버튼 */}
        {order.status === '작업완료' && (order.confirmStatus === '구매확정완료' || order.confirmStatus === '구매완료') && !isReviewCompleted && (
          <button
            className="text-xs text-orange-500 border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100 px-2 py-1 font-semibold flex items-center gap-1 mt-1"
            onClick={() => handleReviewWriteClick(order)}
          >
            리뷰작성하기 
            <FontAwesomeIcon icon={faArrowRight} className="w-2 h-2 ml-1" />
          </button>
        )}
        
        {/* 3단계: 리뷰 작성 완료 후 리뷰확인 버튼 */}
        {(order.status === '작업완료' || order.status === '리뷰확인') && (order.confirmStatus === '구매확정완료' || order.confirmStatus === '구매완료') && isReviewCompleted && (
          <button
            className="text-xs text-blue-500 border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100 px-2 py-1 font-semibold flex items-center gap-1 mt-1"
            onClick={() => {
              const productId = typeof order.productId === 'object' ? (order.productId as any)._id : order.productId;
              navigate(`/products/${productId}`, { state: { showReview: true, fromOrder: true, orderId: order.orderId, scrollToReviews: true } });
            }}
          >
            리뷰확인 <FontAwesomeIcon icon={faArrowRight} className="w-2 h-2" />
          </button>
        )}
        
        {/* 구매확정 상태 뱃지 - displayStatus에서 이미 "구매완료"로 표시된 경우에는 표시하지 않음 */}
        {order.confirmStatus && 
         order.confirmStatus !== '구매확정 대기 중' && 
         order.confirmStatus !== '구매확정완료' && 
         order.confirmStatus !== '구매확정전' &&
         displayStatus !== '구매완료' &&
         !(order.status === '작업완료' && 
           (order.confirmStatus === '구매확정완료' || order.confirmStatus === '구매완료') && 
           !isReviewCompleted) &&
         !(order.status === '리뷰확인' && 
           (order.confirmStatus === '구매확정완료' || order.confirmStatus === '구매완료') && 
           isReviewCompleted) && (
          <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800 mt-1">
            {order.confirmStatus}
          </span>
        )}
      </div>
    );
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // 이전 달의 마지막 날들
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // 현재 달의 날들
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length; // 6주 * 7일 = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date, selectedDate: string): boolean => {
    return formatDate(date) === selectedDate;
  };

  const isInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDate(date);
    return dateStr >= startDate && dateStr <= endDate;
  };

  const handleDateSelect = (date: Date, isStart: boolean) => {
    // 로컬 시간대의 날짜를 그대로 사용 (시간대 변환 없이)
    const dateStr = formatDate(date);
    console.log('날짜 선택:', { selectedDate: date, formattedString: dateStr, isStart });
    
    if (isStart) {
      setStartDate(dateStr);
      setIsStartDateOpen(false);
    } else {
      setEndDate(dateStr);
      setIsEndDateOpen(false);
    }
  };

  // 커스텀 달력 컴포넌트
  const CustomCalendar = ({ isOpen, onClose, selectedDate, onSelect, isStart }: {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string;
    onSelect: (date: Date, isStart: boolean) => void;
    isStart: boolean;
  }) => {
    const [localMonth, setLocalMonth] = useState(currentMonth);

    if (!isOpen) return null;

    const days = getDaysInMonth(localMonth);
    const monthName = `${localMonth.getFullYear()}년 ${localMonth.getMonth() + 1}월`;

    return (
      <div className={`absolute z-20 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[280px] ${
        !isStart ? 'right-0' : 'left-0'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setLocalMonth(new Date(localMonth.getFullYear(), localMonth.getMonth() - 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-sm">{monthName}</span>
          <button
            onClick={() => setLocalMonth(new Date(localMonth.getFullYear(), localMonth.getMonth() + 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === localMonth.getMonth();
            const isSelectedDate = isSelected(date, selectedDate);
            const isTodayDate = isToday(date);
            
            return (
              <button
                key={index}
                onClick={() => onSelect(date, isStart)}
                className={`w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors ${
                  isSelectedDate
                    ? 'bg-orange-500 text-white'
                    : isTodayDate
                    ? 'bg-orange-100 text-orange-600'
                    : isCurrentMonth
                    ? 'hover:bg-gray-100 text-gray-700'
                    : 'text-gray-300'
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-between mt-4 pt-3 border-t">
          <button
            onClick={() => {
              setLocalMonth(new Date());
              onSelect(new Date(), isStart);
            }}
            className="text-xs text-orange-600 hover:text-orange-700"
          >
            오늘
          </button>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    );
  };

  // 페이지 번호 생성 함수
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // 결제내역용 페이지 번호 생성 함수
  const getPaymentsPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (paymentsTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= paymentsTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (adjustedCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(paymentsTotalPages);
      } else if (adjustedCurrentPage >= paymentsTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = paymentsTotalPages - 3; i <= paymentsTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = adjustedCurrentPage - 1; i <= adjustedCurrentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(paymentsTotalPages);
      }
    }
    
    return pages;
  };

  // 날짜 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter]);

  // 결제내역 상태 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [paymentsStatusFilter]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.status-dropdown')) {
        setIsStatusDropdownOpen(false);
      }
      if (!target.closest('.date-dropdown')) {
        setIsStartDateOpen(false);
        setIsEndDateOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 결제내역 상태 뱃지 렌더링 함수
  const renderPaymentStatusBadge = (order: any) => {
    let label = '';
    let color = '';
    const originalMethod = getOriginalPaymentMethod(order.paymentMethod);
    
    if (order.refundStatus === '카드결제취소') {
      label = '카드결제취소';
      color = 'bg-red-100 text-red-600';
    } else if (order.refundStatus === '계좌입금완료') {
      label = '계좌입금완료';
      color = 'bg-red-100 text-red-600';
    } else if (order.paymentDate === '-' || !order.paymentDate) {
      label = '입금전';
      color = 'bg-yellow-100 text-yellow-600';
    } else if (originalMethod === 'virtual') {
      label = '입금완료';
      color = 'bg-green-100 text-green-600';
    } else if (originalMethod === 'card') {
      label = '결제완료';
      color = 'bg-blue-50 text-blue-500';
    } else {
      label = '결제완료';
      color = 'bg-blue-50 text-blue-500';
    }
    return <span className={`block text-xs font-semibold px-2 py-1 rounded-full w-[80px] mx-auto text-center ${color}`}>{label}</span>;
  };

  // 마이페이지 대시보드 주문 현황 카운트 계산
  const virtualAccountIssued = orderList.filter((o: Order) => o.paymentMethod === '가상계좌' && (!o.paymentDate || o.paymentDate === '-')).length;
  const paymentCompleted = orderList.filter((o: Order) => {
    // 결제완료: 가상계좌가 아닌 결제방법이고 결제일이 있는 경우
    const isCardPaymentCompleted = o.paymentMethod !== '가상계좌' && o.paymentDate && o.paymentDate !== '-';
    // 입금완료: 가상계좌이고 결제일이 있는 경우
    const isVirtualAccountCompleted = o.paymentMethod === '가상계좌' && o.paymentDate && o.paymentDate !== '-';
    return isCardPaymentCompleted || isVirtualAccountCompleted;
  }).length;
  const orderInProgress = orderList.filter((o: Order) => o.status === '진행 중').length;
  const orderWorkCompleted = orderList.filter((o: Order) => o.status === '작업완료' && o.confirmStatus !== '구매완료').length;
  const orderPurchaseCompleted = orderList.filter((o: Order) => o.status === '작업완료' && o.confirmStatus === '구매완료').length;
  const orderCanceled = orderList.filter((o: Order) => o.status === '취소').length;
  const couponCount = DUMMY_COUPONS.length;

  // 결제내역 상태 필터 함수
  const filterByStatusPayments = (order: Order) => {
    if (paymentsStatusFilter === '전체') return true;
    if (paymentsStatusFilter === '입금전') return order.paymentDate === '-' || !order.paymentDate;
    if (paymentsStatusFilter === '입금완료') return order.paymentMethod === '가상계좌' && order.paymentDate && order.paymentDate !== '-';
    if (paymentsStatusFilter === '결제완료') return order.paymentMethod !== '가상계좌' && order.paymentDate && order.paymentDate !== '-';
    if (paymentsStatusFilter === '결제(입금)완료') {
      // 결제완료: 가상계좌가 아닌 결제방법이고 결제일이 있는 경우
      const isCardPaymentCompleted = order.paymentMethod !== '가상계좌' && order.paymentDate && order.paymentDate !== '-';
      // 입금완료: 가상계좌이고 결제일이 있는 경우
      const isVirtualAccountCompleted = order.paymentMethod === '가상계좌' && order.paymentDate && order.paymentDate !== '-';
      return isCardPaymentCompleted || isVirtualAccountCompleted;
    }
    return true;
  };

  // 결제내역 currentItems 계산 시 filterByStatusPayments 적용
  const filteredPaymentsList = orderList.filter(filterByDate).filter(filterByStatusPayments);
  const paymentsTotalPages = Math.ceil(filteredPaymentsList.length / itemsPerPage);
  
  // 현재 페이지가 총 페이지 수를 초과하면 1페이지로 리셋
  const adjustedCurrentPage = currentPage > paymentsTotalPages && paymentsTotalPages > 0 ? 1 : currentPage;
  
  const paymentsStartIndex = (adjustedCurrentPage - 1) * itemsPerPage;
  const paymentsEndIndex = paymentsStartIndex + itemsPerPage;
  const paymentsCurrentItems = filteredPaymentsList.slice(paymentsStartIndex, paymentsEndIndex);

  // 결제내역 입금전 건수 계산 (가상계좌발급과 동일)
  const pendingPayments = orderList.filter((o: Order) => o.paymentDate === '-' || !o.paymentDate).length;

  const [usedCoupons, setUsedCoupons] = useState<{ [id: number]: boolean }>({});
  const [couponCode, setCouponCode] = useState('');
  const [registeredCoupons, setRegisteredCoupons] = useState<Coupon[]>([]);

  const handleUseCoupon = (coupon: Coupon) => {
    if (window.confirm(
      `${coupon.name}\n${coupon.expire}\n${coupon.desc || ''}\n\n이 쿠폰을 사용하시겠습니까?`
    )) {
      setUsedCoupons(prev => ({ ...prev, [coupon.id]: true }));
    }
  };

  const handleRegisterCoupon = () => {
    if (!couponCode.trim()) {
      alert('쿠폰 코드를 입력해주세요.');
      return;
    }
    
    // 쿠폰 코드 유효성 검사 (간단한 예시)
    if (couponCode.length < 8) {
      alert('올바른 쿠폰 코드를 입력해주세요.');
      return;
    }
    
    // 이미 등록된 쿠폰인지 확인
    const isAlreadyRegistered = [...DUMMY_COUPONS, ...registeredCoupons].some(
      coupon => coupon.name.includes(couponCode) || coupon.id.toString() === couponCode
    );
    
    if (isAlreadyRegistered) {
      alert('이미 등록된 쿠폰입니다.');
      return;
    }
    
    // 새로운 쿠폰 생성
    const newCoupon: Coupon = {
      id: Math.max(...DUMMY_COUPONS.map(c => c.id), ...registeredCoupons.map(c => c.id)) + 1,
      name: `쿠폰번호 (${couponCode})`,
      expire: '2025년 12월 31일 23:59 까지',
      desc: '(최대 5,000원 할인)',
      status: '사용 가능',
      percent: 5,
      type: 'available',
      brand: 'REGISTERED COUPON',
    };
    
    setRegisteredCoupons(prev => [...prev, newCoupon]);
    setCouponCode('');
    alert('쿠폰이 성공적으로 등록되었습니다!');
  };

  // 사용 가능한 쿠폰 개수 계산
  const allCoupons = [...DUMMY_COUPONS, ...registeredCoupons];
  const availableCouponCount = allCoupons.filter(c => {
    // 쿠폰 만료일 확인
    const isExpired = () => {
      try {
        const expireDate = new Date(c.expire.replace('년 ', '-').replace('월 ', '-').replace('일 ', ' ').split(' ')[0]);
        const today = new Date();
        return expireDate < today;
      } catch {
        return false;
      }
    };
    return !usedCoupons[c.id] && !isExpired();
  }).length;
  const totalCouponCount = allCoupons.length;

  // 드래그 스크롤 훅 적용
  const dragScroll = useDragScroll<HTMLDivElement>();

  // 탭 바 좌/우 화살표 표시 상태
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const el = dragScroll.ref.current;
    if (!el) return;
    const update = () => {
      setShowLeft(el.scrollLeft > 0);
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [dragScroll.ref]);

  // 결제 방법 변환 함수
  const formatPaymentMethod = (method: string): string => {
    switch (method) {
      case 'card':
        return '신용카드';
      case 'virtual':
        return '가상계좌';
      case '신용카드':
        return '신용카드';
      case '가상계좌':
        return '가상계좌';
      default:
        return method;
    }
  };

  // 결제 방법 원본 값 반환 함수 (상태 판단용)
  const getOriginalPaymentMethod = (method: string): string => {
    switch (method) {
      case '신용카드':
        return 'card';
      case '가상계좌':
        return 'virtual';
      default:
        return method;
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // 새로고침 함수
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setStartDate('');
      setEndDate('');
      // 데이터 새로고침 (loadOrders만 호출하면 됨)
      await loadOrders();
    } catch (error) {
      console.error('새로고침 중 오류:', error);
      alert('새로고침 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 리뷰작성하기 버튼 클릭 핸들러 - 상품 상세페이지로 이동
  const handleReviewWriteClick = (order: any) => {
    console.log('=== 리뷰 작성 클릭 시작 ===');
    console.log('전체 주문 정보:', order);
    console.log('주문 productId:', order.productId);
    console.log('주문 productId 타입:', typeof order.productId);
    console.log('주문 image:', order.image);
    console.log('주문 product:', order.product);
    console.log('주문 detail:', order.detail);
    console.log('주문 orderId:', order.orderId);
    console.log('주문 date:', order.date);
    
    // 상품 상세페이지로 이동
    // productId가 객체인 경우 _id를 사용, 문자열인 경우 직접 사용
    const productId = order.productId && typeof order.productId === 'object' 
      ? order.productId._id 
      : order.productId;
    
    const targetUrl = `/products/${productId}`;
    console.log('이동할 URL:', targetUrl);
    console.log('사용할 productId:', productId);
    
    navigate(targetUrl, { 
      state: { 
        showReview: true,
        fromOrder: true, 
        orderId: order.orderId 
      } 
    });
    
    console.log('=== 리뷰 작성 클릭 완료 ===');
  };

  return (
    <div className="bg-gray-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto flex gap-8 px-4">
        {/* Sidebar */}
        <aside className="min-w-[200px] hidden md:block z-30 relative">
          <div className="bg-white rounded-lg shadow p-4 mb-10 flex flex-col gap-1">
            <div className="font-bold text-sm mb-2">내 주문 현황</div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">진행 중</span>
              <span 
                className="font-semibold text-gray-600 hover:underline hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setActiveTab('orders');
                  setStatusFilter('진행 중');
                  setCurrentPage(1);
                  navigate('/mypage?tab=orders&status=진행 중');
                }}
              >
                {orderInProgress} 건
              </span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">작업완료</span>
              <span 
                className="font-semibold text-gray-600 hover:underline hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setActiveTab('orders');
                  setStatusFilter('작업완료');
                  setCurrentPage(1);
                  navigate('/mypage?tab=orders&status=작업완료');
                }}
              >
                {orderWorkCompleted} 건
              </span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">구매완료</span>
              <span 
                className="font-semibold text-gray-600 hover:underline hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setActiveTab('orders');
                  setStatusFilter('구매완료');
                  setCurrentPage(1);
                  navigate('/mypage?tab=orders&status=구매완료');
                }}
              >
                {orderPurchaseCompleted} 건
              </span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">취소</span>
              <span 
                className="font-semibold text-gray-600 hover:underline hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setActiveTab('orders');
                  setStatusFilter('취소');
                  setCurrentPage(1);
                  navigate('/mypage?tab=orders&status=취소');
                }}
              >
                {orderCanceled} 건
              </span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">쿠폰</span>
              <span 
                className="hidden font-semibold text-gray-600 hover:underline hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setActiveTab('coupons');
                  setCouponTab('available');
                  navigate('/mypage?tab=coupons');
                }}
              >
                {availableCouponCount} 개
              </span>
              <span className="text-xs text-gray-400">준비중</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-600 font-normal ml-2">포인트</span>
              <span className="hidden font-semibold text-gray-600 hover:underline hover:text-gray-700">0 P</span>
              <span className="text-xs text-gray-400">준비중</span>
            </div>
          </div>
          <nav className="text-sm mb-6 pb-20">
            <button onClick={() => {
              setActiveTab('mypage');
              navigate('/mypage');
            }} 
                className={`block w-full text-left px-2 py-2 rounded font-bold mb-1 
                ${activeTab === 'mypage' ? 'bg-orange-50 text-orange-600' : 'text-orange-700 hover:bg-gray-100'}`}>마이페이지</button>
            <button onClick={() => setIsChatOpen(true)} 
                className="block w-full text-left px-2 py-2 rounded font-semibold text-gray-700 hover:bg-gray-100">1:1 상담</button>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  navigate(`/mypage?tab=${tab.key}`);
                }}
                className={`block w-full text-left px-2 py-2 rounded transition font-semibold mb-1 ${
                  activeTab === tab.key
                    ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="border-t border-gray-200 pt-2">
              <button onClick={handleLogout}
                  className="block w-full text-left px-2 py-2 rounded hover:bg-gray-100 font-semibold text-red-500">로그아웃</button>
            </div>
          </nav>
        </aside>
        {/* Main Content */}
        <section className="flex-1 overflow-x-hidden">
          {/* 마이페이지 대시보드(새소식, 주문현황 등): 마이페이지 탭일 때만 보임 */}
          {activeTab === 'mypage' && (
            <div className="bg-white rounded-lg shadow p-6 mb-6 min-h-[600px]">
              <div className="font-bold text-gray-700 mb-2">애드모어 새소식</div>
              {/* 마이프로필 공지사항표시 - 순환 애니메이션 */}
              <div className="bg-gray-100 rounded p-3 text-xs text-gray-600 mb-4 relative" style={{ height: '40px' }}>
                {/* 위쪽 스크롤 버튼 */}
                {notices.length > 1 && (
                  <button
                    onClick={handlePrevNotice}
                    className="absolute top-1 right-0 transform -translate-x-1/2 z-10
                      w-4 h-4 flex items-center justify-center hover:bg-gray-200 transition-colors rounded-full"
                    aria-label="이전 공지사항"
                  >
                    <FontAwesomeIcon icon={faChevronUp} className="text-[10px] text-gray-500 hover:text-gray-700" />
                  </button>
                )}
                
                {/* 아래쪽 스크롤 버튼 */}
                {notices.length > 1 && (
                  <button
                    onClick={handleNextNotice}
                    className="absolute bottom-1 right-0 transform -translate-x-1/2 z-10 
                      w-4 h-4 flex items-center justify-center hover:bg-gray-200 transition-colors rounded-full"
                    aria-label="다음 공지사항"
                  >
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-gray-500 hover:text-gray-700" />
                  </button>
                )}
                
                {notices.length > 0 ? (
                  <div 
                    key={`notice-${currentNoticeIndex}`}
                    className="absolute left-4 right-8 flex justify-start items-center"
                    style={{
                      animation: 'fadeInOut 4s ease-in-out'
                    }}
                  >
                    <span className="text-gray-600 font-semibold min-w-[200px] mr-4">
                      {notices[currentNoticeIndex]?.important && (
                        <span className="inline-block w-[38px] bg-red-500/20 px-2 py-0.5 text-center text-red-500 rounded-full font-bold mr-1">중요</span>
                      )}
                      {notices[currentNoticeIndex]?.title}
                    </span>
                    <span className="text-orange-500 font-bold">
                      {notices[currentNoticeIndex]?.createdAt ? 
                        new Date(notices[currentNoticeIndex].createdAt).toISOString().split('T')[0] 
                        : ''
                      }
                    </span>
                  </div>
                ) : (
                  <div className="absolute left-0 right-0 flex justify-between items-center">
                    <span className="text-gray-600 font-semibold">애드모어 공지사항입니다.</span>
                    <span className="text-orange-500 font-bold"></span>
                  </div>
                )}
              </div>
              {/* 마이프로필 스몰베너 */}
              <div className="bg-teal-400 w-full h-40 rounded-lg p-8 text-center text-white font-bold text-2xl mb-12 flex items-center justify-center">
                지금 애드모어와 함께 나의 소셜미디어를 성장시켜 보세요.
              </div>
              <div className="flex justify-between items-center mb-8">
                <span className="text-gray-700 font-semibold">주문현황</span>
                <Link
                  to="/mypage?tab=orders"
                  className="text-xs text-blue-600"
                  onClick={e => {
                    e.preventDefault();
                    setActiveTab('orders');
                    navigate('/mypage?tab=orders');
                  }}
                >
                  자세히보기 &gt;
                </Link>
              </div>
              {/* 주문현황표 */}
              <div className="flex justify-between items-center mb-4 px-1 sm:flex-row flex-col gap-2 sm:gap-0">
                
                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0 cursor-pointer 
                    transition-all duration-300 hover:transform hover:scale-105 hover:shadow-sm hover:shadow-gray-200 hover:-translate-y-1 
                    sm:hover:transform-none sm:hover:scale-100 sm:hover:shadow-none sm:hover:translate-y-0"
                  onClick={() => {
                    setActiveTab('payments');
                    setPaymentsStatusFilter('입금전');
                    setCurrentPage(1);
                    navigate('/mypage?tab=payments&status=입금전');
                  }}>
                  <span className="text-orange-400 hover:text-orange-500 text-3xl mb-2 
                      hover:scale-105 hover:shadow-md hover:shadow-orange-200 hover:-translate-y-1 hover:transition-all duration-300
                      border  border-orange-200 rounded-full py-5 px-6">📋</span>
                  <span className="text-[13px] mb-1 font-semibold">가상계좌발급</span>
                  <span className="text-xs">{pendingPayments}건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2"></div>
                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0 cursor-pointer 
                    transition-all duration-300 hover:transform hover:scale-105 hover:shadow-sm hover:shadow-gray-200 hover:-translate-y-1 
                    sm:hover:transform-none sm:hover:scale-100 sm:hover:shadow-none sm:hover:translate-y-0"
                  onClick={() => {
                    setActiveTab('payments');
                    setPaymentsStatusFilter('결제(입금)완료');
                    setCurrentPage(1);
                    navigate('/mypage?tab=payments&status=결제(입금)완료');
                  }}>
                  <span className="text-purple-500 text-3xl mb-2 border border-purple-200 rounded-full py-5 px-6 
                      hover:scale-105 hover:shadow-md hover:shadow-purple-200 hover:-translate-y-1 hover:transition-all duration-300">💳</span>
                  <span className="text-xs mb-1 font-semibold">결제완료</span>
                  <span className="text-xs">{paymentCompleted}건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2 sm:mx-0"></div>
                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0 cursor-pointer 
                    transition-all duration-300 hover:transform hover:scale-105 hover:shadow-sm hover:shadow-gray-200 hover:-translate-y-1 
                    sm:hover:transform-none sm:hover:scale-100 sm:hover:shadow-none sm:hover:translate-y-0"
                  onClick={() => {
                    setActiveTab('orders');
                    setStatusFilter('진행 중');
                    setCurrentPage(1);
                    navigate('/mypage?tab=orders&status=진행 중');
                  }}>
                  <span className="text-blue-500 text-3xl mb-2 border border-blue-200 rounded-full py-5 px-6 
                      hover:scale-105 hover:shadow-md hover:shadow-blue-200 hover:-translate-y-1 hover:transition-all duration-300">⏳</span>
                  <span className="text-xs mb-1 font-semibold">진행 중</span>
                  <span className="text-xs">{orderInProgress}건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2"></div>

                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0 cursor-pointer 
                    transition-all duration-300 hover:transform hover:scale-105 hover:shadow-sm hover:shadow-gray-200 hover:-translate-y-1 
                    sm:hover:transform-none sm:hover:scale-100 sm:hover:shadow-none sm:hover:translate-y-0"
                  onClick={() => {
                    setActiveTab('orders');
                    setStatusFilter('구매완료');
                    setCurrentPage(1);
                    navigate('/mypage?tab=orders&status=구매완료');
                  }}>
                  <span className="text-green-500 text-3xl mb-2 border border-green-200 rounded-full py-5 px-6 
                      hover:scale-105 hover:shadow-md hover:shadow-green-200 hover:-translate-y-1 hover:transition-all duration-300">✅</span>
                  <span className="text-xs mb-1 font-semibold">구매완료</span>
                  <span className="text-xs">{orderPurchaseCompleted}건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2 sm:mx-0"></div>
                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0 cursor-pointer 
                    transition-all duration-300 hover:transform hover:scale-105 hover:shadow-sm hover:shadow-gray-200 hover:-translate-y-1 
                    sm:hover:transform-none sm:hover:scale-100 sm:hover:shadow-none sm:hover:translate-y-0"
                  onClick={() => {
                    setActiveTab('orders');
                    setStatusFilter('취소');
                    setCurrentPage(1);
                    navigate('/mypage?tab=orders&status=취소');
                  }}>
                  <span className="text-red-400 text-3xl mb-2 border border-red-200 rounded-full py-5 px-6 
                      hover:scale-105 hover:shadow-md hover:shadow-red-200 hover:-translate-y-1 hover:transition-all duration-300">⛔</span>
                  <span className="text-xs mb-1 font-semibold">취소</span>
                  <span className="text-xs">{orderCanceled}건</span>
                </div>
              </div>
            </div>
          )}
          {/* 탭별 컨텐츠: 마이페이지가 아닐 때만 보여줌 */}
          {activeTab !== 'mypage' && (
            <div className="bg-white rounded-lg shadow p-6 min-h-[600px]">
              {activeTab === 'coupons' && (
                <div>
                  {/* 상단 요약/입력 영역 */}
                  <div className="mb-10 border border-gray-100 rounded-lg bg-gray-50 p-2 sm:p-4">
                    <div className="flex flex-row sm:items-center justify-between mb-4 gap-2">
                      <div className="flex flex-col items-center justify-center gap-2 bg-white rounded-lg px-2 py-4 w-full border border-gray-100">
                        <div className="font-semibold text-xs sm:text-base">사용 가능</div>
                        <div className="text-[16px] sm:text-xl font-bold text-orange-600">
                          {userCoupons.filter(c => !c.usedAt && new Date(c.endDate) > new Date()).length} 
                          <span className="text-gray-400 font-semibold ml-1 text-sm sm:text-base">개</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2 bg-white rounded-lg px-2 py-4 w-full border border-gray-100">
                        <div className="font-semibold text-xs sm:text-base">전체 쿠폰</div>
                        <div className="text-[16px] sm:text-xl font-bold text-orange-600">
                          {userCoupons.length} 
                          <span className="text-gray-400 font-semibold ml-1 text-sm sm:text-base">개</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input 
                        type="text" 
                        className="flex-1 border rounded px-3 py-4 text-xs" 
                        placeholder="보유하신 쿠폰 코드를 입력해 주세요.(8자리)" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleRegisterCoupon()}
                      />
                      <button 
                        className="bg-orange-500 text-white text-xs px-6 py-2 sm:py-2 rounded font-semibold  
                              hover:bg-orange-600 transition-colors"
                        onClick={handleRegisterCoupon}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                  {/* 쿠폰 필터 탭 */}
                  <div className="relative">
                    <button
                      type="button"
                      className={`absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 rounded-full shadow p-1 flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition disabled:opacity-30 ${showLeft ? '' : 'hidden'}`}
                      aria-label="왼쪽으로 스크롤"
                      onClick={() => {
                        if (dragScroll.ref.current) {
                          dragScroll.ref.current.scrollBy({ left: -120, behavior: 'smooth' });
                        }
                      }}
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <div
                      className="flex border-b overflow-x-auto scrollbar-hide bg-white"
                      ref={dragScroll.ref}
                      onMouseDown={dragScroll.onMouseDown}
                      onMouseLeave={dragScroll.onMouseLeave}
                      onMouseUp={dragScroll.onMouseUp}
                      onMouseMove={dragScroll.onMouseMove}
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {COUPON_TABS.map(tab => (
                        <button
                          key={tab.key}
                          className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition-all -mb-px whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-auto active:bg-gray-50 ${
                            couponTab === tab.key ? 'border-orange-600 text-orange-600 bg-orange-50' : 'border-transparent text-gray-400 hover:text-orange-600 hover:bg-gray-50'
                          }`}
                          onClick={() => setCouponTab(tab.key)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className={`absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 rounded-full shadow p-1 flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition disabled:opacity-30 ${showRight ? '' : 'hidden'}`}
                      aria-label="오른쪽으로 스크롤"
                      onClick={() => {
                        if (dragScroll.ref.current) {
                          dragScroll.ref.current.scrollBy({ left: 120, behavior: 'smooth' });
                        }
                      }}
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  {/* 쿠폰 카드 리스트 */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 
                      sm:gap-4 mt-4 py-4 rounded-b-lg">
                    {couponLoading ? (
                      <div className="col-span-full flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      </div>
                    ) : userCoupons.length > 0 ? (
                      userCoupons.filter(coupon => {
                        // 쿠폰 만료일 확인 함수
                        const isCouponExpired = (endDate: string) => {
                          try {
                            const expireDate = new Date(endDate);
                            const today = new Date();
                            return expireDate < today;
                          } catch {
                            return false;
                          }
                        };

                        // 쿠폰 사용 여부 확인 (백엔드에서 계산된 isUsed 필드 사용)
                        const isUsed = coupon.isUsed !== undefined ? coupon.isUsed : coupon.usedAt !== null;

                        // 탭별 필터링
                        switch (couponTab) {
                          case 'available':
                            return !isCouponExpired(coupon.endDate) && !isUsed && coupon.couponStatus === 'active';
                          case 'used':
                            return isUsed;
                          case 'expiring':
                            const today = new Date();
                            const expireDate = new Date(coupon.endDate);
                            const daysUntilExpire = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            return !isUsed && daysUntilExpire <= 7 && daysUntilExpire > 0;
                          case 'all':
                          default:
                            return true;
                        }
                      }).map(coupon => (
                        <div
                          key={coupon.sendId}
                          className="relative transition-all duration-200 hover:z-20 hover:scale-105 w-full"
                        >
                          <CouponCard
                            title={coupon.name}
                            expiry={coupon.endDate}
                            maxDiscount={coupon.maxDiscount || 10000}
                            discountRate={coupon.discountType === 'percentage' ? coupon.discountValue : 0}
                            used={coupon.isUsed !== undefined ? coupon.isUsed : coupon.usedAt !== null}
                            brand={coupon.brand || 'ADMORE'}
                            couponCode={coupon.code}
                            onUse={() => handleUseUserCoupon(coupon.sendId)}
                            onDelete={() => {
                              if (!coupon.sendId) {
                                console.error('쿠폰 삭제 실패: sendId가 undefined입니다.', coupon);
                                alert('쿠폰 삭제에 실패했습니다: sendId가 없습니다.');
                                return;
                              }
                              console.log('쿠폰 삭제 시도:', { sendId: coupon.sendId, name: coupon.name, coupon });
                              handleDeleteUserCoupon(coupon.sendId, coupon.name);
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        {couponTab === 'available' && '사용 가능한 쿠폰이 없습니다.'}
                        {couponTab === 'used' && '사용한 쿠폰이 없습니다.'}
                        {couponTab === 'expiring' && '만료 임박 쿠폰이 없습니다.'}
                        {couponTab === 'all' && '보유한 쿠폰이 없습니다.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'orders' && (
                <div className="flex flex-col">
                  
                  {/* 데스크탑 테이블 */}
                  <div className="hidden md:block">
                    <div className="font-bold mb-4">주문내역</div>

                    <div className="mb-2 flex justify-between items-center">
                      {/* 상태검색 UI */}
                      <div className="relative status-dropdown">
                        <button
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="flex items-center justify-between w-32 px-3 py-2 border border-gray-300 rounded-md bg-white 
                                text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <span>{statusFilter}</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isStatusDropdownOpen && (
                          <div className="absolute z-10 w-32 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {['전체 상태', '진행 중', '취소', '구매확정', '구매완료', '리뷰확인'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setStatusFilter(status);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                                  statusFilter === status ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* 날짜 검색 UI */}
                      <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {/* <label className="text-xs text-gray-600 font-medium">시작일:</label> */}
                            <div className="relative date-dropdown">
                              <button
                                onClick={() => {
                                  setIsStartDateOpen(!isStartDateOpen);
                                  setIsEndDateOpen(false);
                                }}
                                className="flex items-center justify-between w-36 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <span className={startDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                  {startDate ? formatOrderDate(startDate) : '시작일'}
                                </span>
                                <FontAwesomeIcon 
                                  icon={faCalendar} 
                                  className={`w-4 h-4 transition-transform ${isStartDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                                />
                              </button>
                              <CustomCalendar
                                isOpen={isStartDateOpen}
                                onClose={() => setIsStartDateOpen(false)}
                                selectedDate={startDate}
                                onSelect={handleDateSelect}
                                isStart={true}
                              />
                            </div>
                          </div>
                          <div className="h-[2px] w-3 sm:bg-gray-200 mx-2 sm:mx-0"></div>
                          <div className="flex items-center gap-2">
                            {/* <label className="text-xs text-gray-600 font-medium">종료일:</label> */}
                            <div className="relative date-dropdown">
                              <button
                                onClick={() => {
                                  setIsEndDateOpen(!isEndDateOpen);
                                  setIsStartDateOpen(false);
                                }}
                                className="flex items-center justify-between w-36 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <span className={endDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                  {endDate ? formatOrderDate(endDate) : '종료일'}
                                </span>
                                <FontAwesomeIcon 
                                  icon={faCalendar} 
                                  className={`w-4 h-4 transition-transform ${isEndDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                                />
                              </button>
                              <CustomCalendar
                                isOpen={isEndDateOpen}
                                onClose={() => setIsEndDateOpen(false)}
                                selectedDate={endDate}
                                onSelect={handleDateSelect}
                                isStart={false}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ minWidth: 40 }}
                        >
                          <FontAwesomeIcon 
                            icon={faRotateLeft} 
                            className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} 
                          />
                        </button>
                      </div>
                    </div>

                    <div className="w-full max-w-full overflow-x-auto min-h-[360px]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-2 border">주문번호</th>
                            <th className="p-2 border">상태</th>
                            <th className="p-2 border">상품명</th>
                            <th className="p-2 border">수량</th>
                            <th className="p-2 border">가격</th>
                            <th className="p-2 border">주문일</th>
                            <th className="p-2 border">요청사항</th>
                            
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center text-gray-400 py-16">주문내역이 없습니다.</td>
                            </tr>
                          ) : (
                            currentItems.map((order: Order) => (
                            <tr key={order.orderId + order.review}>
                              <td className="text-xs text-gray-600 p-2 min-w-[120px] border">{order.orderId}</td>
                              <td className="text-xs text-gray-600 p-2 min-w-[100px] text-center border">
                                {renderOrderStatusBadge(order)}
                              </td>
                              <td className="text-xs text-gray-600 p-2 min-w-[160px] border">
                                {order.productNumber && (
                                  <div className="text-gray-500 text-[10px] mb-1">상품번호: {order.productNumber}</div>
                                )}
                                <Link
                                  to={`/products/${(order.productId as any)?._id || order.productId}`}
                                  className="text-gray-600 hover:underline font-semibold"
                                >
                                  {order.product}
                                </Link>
                                <br />
                                <span className="text-gray-500 text-[11px]">{order.detail}</span>
                              </td>
                              <td className="text-xs text-gray-600 p-2 min-w-[60px] text-right border">{order.quantity}개</td>
                              <td className="text-xs text-gray-600 p-2 min-w-[100px] max-w-[100px] text-right border">
                                <div className="font-semibold text-red-600">{formatPrice(order.price)}</div>
                              </td>
                              <td className="text-xs text-gray-600 p-2 min-w-[120px] text-center border">{order.date === '-' || !order.date ? '입금전' : formatOrderDate(order.date)}</td>
                              <td className="text-xs text-gray-600 p-2 min-w-[160px] max-w-[240px] border">{order.request}</td>
                              
                            </tr>
                          ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  

                  {/* 데스크탑 카드형 */}
                  {/* 모바일 카드형 */}
                  <div className="block md:hidden">
                    <div className="font-bold mb-2">주문내역</div>
                    
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                      {/* 상태 필터 UI */}
                      <div className="relative status-dropdown mb-2 border-b border-gray-200 pb-2">
                        <button
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <span>{statusFilter}</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isStatusDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {['전체 상태', '진행 중', '취소', '구매확정', '구매완료', '리뷰확인'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setStatusFilter(status);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-xs font-semibold ${
                                  statusFilter === status ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* 날짜 검색 UI */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="relative date-dropdown w-full">
                              <button
                                onClick={() => {
                                  setIsStartDateOpen(!isStartDateOpen);
                                  setIsEndDateOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <span className={startDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                  {startDate ? formatOrderDate(startDate) : '시작일'}
                                </span>
                                <FontAwesomeIcon 
                                  icon={faCalendar} 
                                  className={`w-4 h-4 transition-transform ${isStartDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                                />
                              </button>
                              <CustomCalendar
                                isOpen={isStartDateOpen}
                                onClose={() => setIsStartDateOpen(false)}
                                selectedDate={startDate}
                                onSelect={handleDateSelect}
                                isStart={true}
                              />
                            </div>
                            <div className="h-[2px] w-3 sm:bg-gray-200 mx-2 sm:mx-0 hidden md:block"></div>
                            <div className="relative date-dropdown w-full flex gap-2">
                              <button
                                onClick={() => {
                                  setIsEndDateOpen(!isEndDateOpen);
                                  setIsStartDateOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <span className={endDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                  {endDate ? formatOrderDate(endDate) : '종료일'}
                                </span>
                                <FontAwesomeIcon 
                                  icon={faCalendar} 
                                  className={`w-4 h-4 transition-transform ${isEndDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                                />
                              </button>
                              <CustomCalendar
                                isOpen={isEndDateOpen}
                                onClose={() => setIsEndDateOpen(false)}
                                selectedDate={endDate}
                                onSelect={handleDateSelect}
                                isStart={false}
                              />
                              <button
                                onClick={() => {
                                  setStartDate('');
                                  setEndDate('');
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors flex items-center gap-2"
                              >
                                <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {currentItems.length === 0 ? (
                        <div className="text-center text-gray-400 py-16 border border-gray-100 rounded-lg bg-gray-50 text-sm">주문내역이 없습니다.</div>
                      ) : (
                        currentItems.map((order: Order) => (
                        <div key={order.orderId + order.review} className="bg-white rounded-lg shadow p-4 border">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              {order.productNumber && (
                                <div className="text-gray-500 text-[10px] mb-1">상품번호: {order.productNumber}</div>
                              )}
                              <span
                                className="font-semibold text-sm text-gray-600 hover:underline cursor-pointer"
                                onClick={() => {
                                  const productId = typeof order.productId === 'object' ? (order.productId as any)._id : order.productId;
                                  navigate(`/products/${productId}`);
                                }}
                              >
                                {order.product}
                              </span>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full min-w-[60px] text-center ${
                              order.status === '작업완료' ? 'bg-green-100 text-green-600' :
                              order.status === '진행 중' ? 'bg-yellow-100 text-yellow-600' :
                              order.status === '취소' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>{order.status}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{order.detail}</div>
                          <div className="flex flex-col text-xs text-gray-600 gap-x-4 gap-y-1 mb-2">
                            <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1">
                              <div>수량: <span className="font-medium">{order.quantity}개</span></div>
                              <div>결제방식: <span className="font-medium">{order.paymentMethod}</span></div>
                            </div>
                            <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1">
                              <div>구매일: <span className="font-medium">{order.date}</span></div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div>가격: 
                                <span className="line-through text-gray-400 ml-1">{formatPrice(order.originalPrice)}</span>
                                <span className="font-semibold text-red-600 ml-2">{formatPrice(order.price)}</span>
                                {order.discountPrice !== '0원' && (
                                  <span className="text-green-600 ml-1">(할인: {formatPrice(order.discountPrice)})</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {(order.status === '작업완료' || order.confirmStatus === '구매확정완료') && (
                            <ReviewButtonText order={order} />
                          )}
                        </div>
                      ))
                      )}
                    </div>
                  </div>
                  {/* 페이지네이션 */}
                  <div className="flex justify-between items-center mt-8 gap-4 flex-col md:flex-row">
                    <div className="text-xs text-gray-500 mr-4">
                      총 {filteredOrderList.length}개 중 {filteredOrderList.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredOrderList.length)}개` : '0개'}
                    </div>
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        이전
                      </button>
                      {totalPages === 0 ? (
                        <button className="px-3 py-1 border rounded text-xs bg-orange-500 text-white border-orange-500">1</button>
                      ) : (
                        getPageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={page === '...'}
                            className={`px-3 py-1 border rounded text-xs ${
                              page === currentPage
                                ? 'bg-orange-500 text-white border-orange-500'
                                : page === '...'
                                ? 'border-transparent cursor-default'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      )}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1 border rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg shadow p-4 border mt-10">
                    <h3 className="font-bold mb-2 text-sm text-gray-600 flex items-center gap-2">
                      <FontAwesomeIcon icon={faCircleExclamation} className="text-orange-400 w-4 h-4" />
                      꼭 확인해주세요!
                    </h3>
                    <ol className="list-inside text-gray-600 text-xs pl-2 space-y-1">
                      <li>･ 세금계산서는 구매확정일(거래 완료일)을 기준으로 발행됩니다.</li>
                      <li>･ 쿠폰 및 기타 할인 금액은 할인된 금액이기 때문에 세금계산서에 포함되지 않습니다.</li>
                      <li>･ 현금영수증은 구매확정일(거래 완료일)을 기준으로 발행됩니다.</li>
                    </ol>
                  </div>
                  
                </div>
              )}
              {activeTab === 'payments' && (
                <div>
                  <div className="font-bold mb-4">결제내역</div>
                  
                  {/* 데스크탑 테이블 */}
                  <div className="hidden md:block">
                    {/* 상태 필터 UI */}
                    <div className="mb-2 flex justify-between items-center">
                      <div className="relative status-dropdown">
                        <button
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="flex items-center justify-between w-32 px-3 py-2 border border-gray-300 rounded-md bg-white 
                                text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <span>{paymentsStatusFilter}</span>
                          <svg
                            className="w-4 h-4 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {isStatusDropdownOpen && (
                          <div className="absolute z-10 w-32 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {['전체', '입금전', '입금완료', '결제완료', '결제(입금)완료'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setPaymentsStatusFilter(status);
                                  setIsStatusDropdownOpen(false);
                                  setCurrentPage(1);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                                  paymentsStatusFilter === status ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* 날짜 검색 UI */}
                      <div className="flex gap-2">
                        <div className="flex gap-2 items-center">
                          <div className="relative date-dropdown flex-1">
                            <button
                              onClick={() => {
                                setIsStartDateOpen(!isStartDateOpen);
                                setIsEndDateOpen(false);
                              }}
                              className="flex items-center justify-between w-36 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <span className={startDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                {startDate ? formatOrderDate(startDate) : '시작일'}
                              </span>
                              <FontAwesomeIcon 
                                icon={faCalendar} 
                                className={`w-4 h-4 transition-transform ${isStartDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                              />
                            </button>
                            <CustomCalendar
                              isOpen={isStartDateOpen}
                              onClose={() => setIsStartDateOpen(false)}
                              selectedDate={startDate}
                              onSelect={handleDateSelect}
                              isStart={true}
                            />
                          </div>
                          <div className="h-[2px] w-3 sm:bg-gray-200 mx-2 sm:mx-0 hidden md:block"></div>
                          <div className="relative date-dropdown flex-1">
                            <button
                              onClick={() => {
                                setIsEndDateOpen(!isEndDateOpen);
                                setIsStartDateOpen(false);
                              }}
                              className="flex items-center justify-between w-36 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <span className={endDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                {endDate ? formatOrderDate(endDate) : '종료일'}
                              </span>
                              <FontAwesomeIcon 
                                icon={faCalendar} 
                                className={`w-4 h-4 transition-transform ${isEndDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                              />
                            </button>
                            <CustomCalendar
                              isOpen={isEndDateOpen}
                              onClose={() => setIsEndDateOpen(false)}
                              selectedDate={endDate}
                              onSelect={handleDateSelect}
                              isStart={false}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ minWidth: 40 }}
                        >
                          <FontAwesomeIcon 
                            icon={faRotateLeft} 
                            className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} 
                          />
                        </button>
                      </div>
                    </div>
                    <div className="w-full max-w-full overflow-x-auto min-h-[360px]">
                      <table className="min-w-[700px] w-full text-xs border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-2 border">결제번호</th>
                            <th className="p-2 border">상품명</th>
                            <th className="p-2 border">가격정보</th>
                            <th className="p-2 border">결제방법</th>
                            <th className="p-2 border">결제(입금)일</th>
                            <th className="p-2 border">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentsCurrentItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center text-gray-400 py-16">결제한 내역이 없습니다.</td>
                            </tr>
                          ) : (
                            paymentsCurrentItems.map((order: Order) => {
                              return (
                                <tr key={order.orderId}>
                                  <td className="p-2 border min-w-[100px]">
                                    <div>
                                      <div className="">{order.paymentNumber || `PAY-${order.orderId.replace('-', '')}`}</div>
                                      <div className="text-gray-500 text-[10px]">({order.orderId})</div>
                                    </div>
                                  </td>
                                  <td className="p-2 border min-w-[120px]">
                                    <div>   
                                      {order.productNumber && (
                                        <div className="text-gray-500 text-[10px] mb-1">상품번호: {order.productNumber}</div>
                                      )}
                                      <Link
                                        to={`/products/${order.productId}`}
                                        className="text-gray-600 hover:underline font-semibold"
                                      >
                                        {order.product}
                                      </Link>
                                      <div className="text-gray-500 text-[10px]">({order.detail})</div>
                                    </div>
                                  </td>
                                  <td className="p-2 border min-w-[100px] text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="line-through text-gray-400 text-[10px]">{formatPrice(order.originalPrice)}</span>
                                      {(() => {
                                        // 즉시할인 계산 (originalPrice와 price의 차이)
                                        if (order.originalPrice && order.originalPrice !== order.price) {
                                          const originalPriceNum = typeof order.originalPrice === 'string' ? 
                                            parseInt(order.originalPrice.replace(/[^\d]/g, '')) : order.originalPrice;
                                          const priceNum = typeof order.price === 'string' ? 
                                            parseInt(order.price.replace(/[^\d]/g, '')) : order.price;
                                          const immediateDiscount = originalPriceNum - priceNum;
                                          if (immediateDiscount > 0) {
                                            return (
                                              <span className="text-green-600 text-[10px]">
                                                할인: {immediateDiscount.toLocaleString()}원
                                              </span>
                                            );
                                          }
                                        }
                                        return null;
                                      })()}
                                      {order.discountPrice && order.discountPrice !== '0' && order.discountPrice !== '0원' && (
                                        <span className="text-green-600 text-[10px]">쿠폰할인: {formatPrice(order.discountPrice)}</span>
                                      )}
                                      {order.points && order.points > 0 && (
                                        <span className="text-blue-600 text-[10px]">포인트: {order.points.toLocaleString()}원</span>
                                      )}
                                      <span className="font-semibold text-red-600">{formatPrice(order.price)}</span>
                                    </div>
                                  </td>
                                  <td className="p-2 border min-w-[100px] text-center">{formatPaymentMethod(order.paymentMethod)}</td>
                                  <td className="p-2 border min-w-[100px] text-center">{order.paymentDate === '-' || !order.paymentDate ? '-' : formatOrderDate(order.paymentDate)}</td>
                                  <td className="p-2 border min-w-[100px] text-center">
                                    {renderPaymentStatusBadge(order)}
                                    {!order.refundStatus && order.paymentDate !== '-' && order.paymentDate && (
                                      <PaymentCancelButton order={order} setIsChatOpen={setIsChatOpen} />
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* 모바일 카드형 */}
                  <div className="block md:hidden">
                    {/* 날짜 검색 UI - 모바일 */}
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="relative status-dropdown mb-2 border-b border-gray-200 pb-2">
                        <button
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <span>{paymentsStatusFilter}</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isStatusDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            {['전체', '입금전', '입금완료', '결제완료', '결제(입금)완료'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setPaymentsStatusFilter(status);
                                  setIsStatusDropdownOpen(false);
                                  setCurrentPage(1);
                                }}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-xs font-semibold ${
                                  paymentsStatusFilter === status ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="relative date-dropdown w-full">
                              <button
                                onClick={() => {
                                  setIsStartDateOpen(!isStartDateOpen);
                                  setIsEndDateOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <span className={startDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                  {startDate ? formatOrderDate(startDate) : '시작일'}
                                </span>
                                <FontAwesomeIcon 
                                  icon={faCalendar} 
                                  className={`w-4 h-4 transition-transform ${isStartDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                                />
                              </button>
                              <CustomCalendar
                                isOpen={isStartDateOpen}
                                onClose={() => setIsStartDateOpen(false)}
                                selectedDate={startDate}
                                onSelect={handleDateSelect}
                                isStart={true}
                              />
                            </div>
                            <div className="h-[2px] w-3 sm:bg-gray-200 mx-2 sm:mx-0 hidden md:block"></div>
                            <div className="relative date-dropdown w-full flex gap-2">
                              <button
                                onClick={() => {
                                  setIsEndDateOpen(!isEndDateOpen);
                                  setIsStartDateOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <span className={endDate ? 'text-gray-700 text-xs' : 'text-gray-400 text-xs'}>
                                  {endDate ? formatOrderDate(endDate) : '종료일'}
                                </span>
                                <FontAwesomeIcon 
                                  icon={faCalendar} 
                                  className={`w-4 h-4 transition-transform ${isEndDateOpen ? 'text-orange-500' : 'text-gray-500'}`}
                                />
                              </button>
                              <CustomCalendar
                                isOpen={isEndDateOpen}
                                onClose={() => setIsEndDateOpen(false)}
                                selectedDate={endDate}
                                onSelect={handleDateSelect}
                                isStart={false}
                              />
                              <button
                                onClick={() => {
                                  setStartDate('');
                                  setEndDate('');
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors flex items-center gap-2"
                              >
                                <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {paymentsCurrentItems.length === 0 ? (
                        <div className="text-center text-gray-400 border border-gray-100 rounded-lg bg-gray-50 text-sm py-16">결제한 내역이 없습니다.</div>
                      ) : (
                        paymentsCurrentItems.map((order: Order) => {
                          return (
                            <div key={order.orderId} className="bg-white rounded-lg shadow p-4 border">
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  {order.productNumber && (
                                    <div className="text-gray-500 text-[10px] mb-1">상품번호: {order.productNumber}</div>
                                  )}
                                  <span
                                    className="font-semibold text-sm text-gray-600 hover:underline cursor-pointer"
                                    onClick={() => {
                                      const productId = typeof order.productId === 'object' ? (order.productId as any)._id : order.productId;
                                      navigate(`/products/${productId}`);
                                    }}
                                  >
                                    {order.product}
                                  </span>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full min-w-[60px] text-center ${
                                  order.refundStatus === '카드결제취소' || order.refundStatus === '계좌입금완료' ? 'bg-red-100 text-red-600' :
                                  order.paymentDate === '-' || !order.paymentDate ? 'bg-yellow-100 text-yellow-600' :
                                  getOriginalPaymentMethod(order.paymentMethod) === 'virtual' ? 'bg-green-100 text-green-600' :
                                  getOriginalPaymentMethod(order.paymentMethod) === 'card' ? 'bg-blue-50 text-blue-500' :
                                  'bg-blue-50 text-blue-500'
                                }`}>
                                  {order.refundStatus === '카드결제취소' ? '카드결제취소' :
                                   order.refundStatus === '계좌입금완료' ? '계좌입금완료' :
                                   order.paymentDate === '-' || !order.paymentDate ? '입금전' :
                                   getOriginalPaymentMethod(order.paymentMethod) === 'virtual' ? '입금완료' :
                                   getOriginalPaymentMethod(order.paymentMethod) === 'card' ? '결제완료' :
                                   '결제완료'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">{order.detail}</div>
                              <div className="flex flex-col text-xs text-gray-600 gap-x-4 gap-y-1 mb-2">
                                <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1">
                                  <div>결제번호: <span className="font-medium">{order.paymentNumber || `PAY-${order.orderId.replace('-', '')}`}</span></div>
                                  <div>결제방식: <span className="font-medium">{formatPaymentMethod(order.paymentMethod)}</span></div>
                                </div>
                                <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1">
                                  <div>결제일: <span className="font-medium">{order.paymentDate === '-' || !order.paymentDate ? '입금전' : formatOrderDate(order.paymentDate)}</span></div>
                                  <div>주문번호: <span className="font-medium">{order.orderId}</span></div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div>가격: 
                                    <span className="line-through text-gray-400 ml-1">{formatPrice(order.originalPrice)}</span>
                                    <span className="font-semibold text-red-600 ml-2">{formatPrice(order.price)}</span>
                                    {order.discountPrice !== '0원' && (
                                      <span className="text-green-600 ml-1">(할인: {formatPrice(order.discountPrice)})</span>
                                    )}
                                  </div>
                                </div>
                                {!order.refundStatus && order.paymentDate !== '-' && order.paymentDate && (
                                  <PaymentCancelButton order={order} setIsChatOpen={setIsChatOpen} />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  {/* 페이지네이션 */}
                  <div className="flex justify-between items-center mt-8 gap-4 flex-col md:flex-row">
                    <div className="text-xs text-gray-500 mr-4">
                      총 {filteredPaymentsList.length}개 중 {filteredPaymentsList.length > 0 ? `${paymentsStartIndex + 1}-${Math.min(paymentsEndIndex, filteredPaymentsList.length)}개` : '0개'}
                    </div>
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={() => handlePageChange(adjustedCurrentPage - 1)}
                        disabled={adjustedCurrentPage === 1}
                        className="px-3 py-1 border rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        이전
                      </button>
                      {paymentsTotalPages === 0 ? (
                        <button className="px-3 py-1 border rounded text-xs bg-orange-500 text-white border-orange-500">1</button>
                      ) : (
                        getPaymentsPageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={page === '...'}
                            className={`px-3 py-1 border rounded text-xs ${
                              page === adjustedCurrentPage
                                ? 'bg-orange-500 text-white border-orange-500'
                                : page === '...'
                                ? 'border-transparent cursor-default'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      )}
                      <button
                        onClick={() => handlePageChange(adjustedCurrentPage + 1)}
                        disabled={adjustedCurrentPage === paymentsTotalPages || paymentsTotalPages === 0}
                        className="px-3 py-1 border rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        다음
                      </button>
                    </div>
                    
                  </div>

                  <div className="bg-gray-50 rounded-lg shadow p-4 border mt-10">
                    <h3 className="font-bold mb-2 text-sm text-gray-600 flex items-center gap-2">
                      <FontAwesomeIcon icon={faCircleExclamation} className="text-orange-400 w-4 h-4" />
                      꼭 확인해주세요!
                    </h3>
                    <ol className="list-inside text-gray-600 text-xs pl-2 space-y-1">
                      <li>･ 세금계산서는 구매확정일(거래 완료일)을 기준으로 발행됩니다.</li>
                      <li>･ 쿠폰 및 기타 할인 금액은 할인된 금액이기 때문에 세금계산서에 포함되지 않습니다.</li>
                      <li>･ 현금영수증은 구매확정일(거래 완료일)을 기준으로 발행됩니다.</li>
                    </ol>
                  </div>
                </div>
              )}
              {activeTab === 'favorits' && (
                <div>
                  <div className="font-bold mb-2">즐겨찾기한 서비스</div>
                  {favoriteProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-base">즐겨찾기한 상품이 없습니다.</p>
                      <p className="text-gray-400 text-xs mt-1">상품을 즐겨찾기에 추가해보세요.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={handleRemoveAllFavorites}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          전체 삭제
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    </>
                  )}
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="flex flex-col">
                  {/* <div className="font-bold mb-2">환경설정</div> */}
                  {/* 이름 변경 */}
                  <div className="bg-white rounded-lg border px-6 py-8 mb-8">
                    <div className="font-semibold text-sm mb-4">이름 변경</div>
                    <div className="space-y-4">
                      {isEditingName ? (
                        <>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="새로운 이름을 입력해 주세요"
                            className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                          />
                          {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveName}
                              className="flex-1 py-3 rounded bg-gradient-to-r from-orange-400 to-orange-600 text-sm text-white font-semibold shadow hover:from-orange-500 hover:to-orange-700 transition"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancelEditName}
                              className="flex-1 py-3 rounded bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition"
                            >
                              취소
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="bg-gray-50 rounded border w-full">
                              <p className="text-sm font-semibold text-gray-900 px-4 py-2">
                              {userName || '임시 사용자'}
                            </p>
                            </div>
                            <button
                              onClick={handleStartEditName}
                              className="ml-2 w-1/4 px-4 py-2 text-sm text-orange-600 border border-orange-600 rounded hover:bg-orange-50 transition"
                            >
                              변경
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 비밀번호 변경 */}
                  <div className="bg-white rounded-lg border px-6 py-8 mb-8">
                    <div className="font-semibold text-sm mb-4">비밀번호 변경</div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <input
                        type="password"
                        placeholder="현재 비밀번호를 입력해 주세요"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호를 입력해 주세요"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                      <input
                        type="password"
                        placeholder="비밀번호를 다시 한번 입력해 주세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                      
                      {passwordError && (
                        <div className="text-red-500 text-sm">{passwordError}</div>
                      )}
                      
                      {passwordSuccess && (
                        <div className="text-green-500 text-sm">{passwordSuccess}</div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-3 rounded bg-gradient-to-r from-orange-400 to-orange-600 text-sm text-white font-semibold shadow hover:from-orange-500 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isChangingPassword ? '처리 중...' : '비밀번호 변경'}
                      </button>
                    </form>
                  </div>
                  {/* 회원 탈퇴 */}
                  <div className="bg-white rounded-lg border px-6 py-8">
                    <div className="font-semibold text-sm mb-4">회원 탈퇴</div>
                    <form onSubmit={handleWithdrawal} className="space-y-4">
                      <input
                        type="password"
                        placeholder="비밀번호를 입력해 주세요"
                        value={withdrawalPassword}
                        onChange={(e) => setWithdrawalPassword(e.target.value)}
                        className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                      <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-600">
                        <div className="font-semibold text-xs mb-2">회원 탈퇴 안내 사항</div>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                          <li>회원 탈퇴 시 해당 아이디로는 재가입하실 수 없습니다.</li>
                          <li>보유하고 계신 포인트와 수익금 모두 소멸되며, 복구가 불가능하오니 신중하게 선택해 주십시오.</li>
                        </ul>
                      </div>
                      <label className="flex items-center text-xs">
                        <input 
                          type="checkbox" 
                          checked={withdrawalAgreed}
                          onChange={(e) => setWithdrawalAgreed(e.target.checked)}
                          className="mr-2" 
                        />
                        안내 사항을 모두 확인하였으며, 이에 동의합니다.
                      </label>
                      
                      {withdrawalError && (
                        <div className="text-red-500 text-sm">{withdrawalError}</div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={!withdrawalAgreed || isWithdrawing}
                        className={`w-full py-3 rounded text-sm font-semibold transition ${
                          withdrawalAgreed && !isWithdrawing
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isWithdrawing ? '처리 중...' : '탈퇴 하기'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserPage; 