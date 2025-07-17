import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser as faUserSolid, faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faRotateLeft, faArrowRight, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import CouponCard from '../components/CouponCard';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';
import { DUMMY_COUPONS, Coupon } from '../data/coupons';
import { Order, defaultOrderList } from '../data/orderdata';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram, IconDefinition } from '@fortawesome/free-brands-svg-icons';
import { useDragScroll } from '../hooks/useDragScroll';

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

// ReviewButton 컴포넌트 정의 _ 버튼형식
const ReviewButton = ({ order }: { order: any }) => {
  const navigate = useNavigate();
  return (
    <div
      className="text-xs text-white font-semibold bg-orange-500 rounded-full px-2 py-1 shadow-md shadow-orange-200 text-center cursor-pointer hover:bg-orange-600"
      onClick={() => navigate(`/products/${order.productId}`, { state: { fromOrder: true, orderId: order.orderId } })}
    >
      리뷰 작성
    </div>
  );
};
// ReviewButton 컴포넌트 정의 _ 텍스트형식
const ReviewButtonText = ({ order }: { order: any }) => {
  const navigate = useNavigate();
  const canWriteReview = order.status === '작업완료' || order.status === '구매완료';
  const isReviewCompleted = order.review === '리뷰 확인';
  
  // 리뷰 작성 가능한 상태이고 아직 작성하지 않은 경우
  if (canWriteReview && !isReviewCompleted) {
    return (
      <div
        className="flex items-center justify-center gap-1 text-[10px] text-orange-400 font-semibold text-center cursor-pointer 
          border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100 px-2 py-1"
        onClick={() => navigate(`/products/${order.productId}`, { state: { fromOrder: true, orderId: order.orderId } })}
      >
        리뷰 작성하기 <FontAwesomeIcon icon={faArrowRight} className="w-2 h-2" />
      </div>
    );
  }
  
  // 리뷰 작성 완료된 경우
  if (isReviewCompleted) {
    return (
      <div
        className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-semibold text-center cursor-pointer 
          border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 px-2 py-1"
        onClick={() => navigate(`/products/${order.productId}`, { state: { showReview: true } })}
      >
        리뷰 확인 <FontAwesomeIcon icon={faArrowRight} className="w-2 h-2" />
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

    const cancelMessage = `결제취소 요청\n\n결제번호: PAY-${order.orderId.replace('-', '')}\n주문번호: ${order.orderId}\n상품명: ${order.product}\n결제금액: ${order.price}\n결제방법: ${order.paymentMethod}\n결제일: ${order.paymentDate === '-' || !order.paymentDate ? '입금전' : order.paymentDate}\n취소사유: ${cancelReason}\n\n위 결제건에 대한 취소를 요청드립니다.`;
    
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
                <li className=' text-left ml-2'>결제금액: {order.price}</li>
                <li className=' text-left ml-2'>결제일: {order.paymentDate === '-' || !order.paymentDate ? '입금전' : order.paymentDate}</li>
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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    navigate('/');
  };
  // 즐겨찾기 상태
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  useEffect(() => {
    const favorites = getFavorites();
    setFavoriteIds(favorites);
    const favoriteProductsList = products.filter(product => favorites.includes(product.id));
    setFavoriteProducts(favoriteProductsList);
  }, []);
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
      const productToAdd = products.find(p => p.id === id);
      if (productToAdd) {
        setFavoriteProducts(prev => [...prev, productToAdd]);
      }
    }
  };

  // 주문내역 데이터 배열을 변수로 분리
  const [orderList, setOrderList] = useState<Order[]>(() => {
    // localStorage에서 기존 주문 데이터가 있으면 불러오기
    try {
      const savedOrderList = localStorage.getItem('orderList');
      if (savedOrderList) {
        return JSON.parse(savedOrderList);
      }
    } catch (error) {
      console.error('저장된 주문 데이터 로드 실패:', error);
    }
    
    // 기본 주문 데이터
    return defaultOrderList;
  });

  // orderList가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('orderList', JSON.stringify(orderList));
  }, [orderList]);

  // 구매확정 처리 함수
  const handleConfirmPurchase = (orderId: string) => {
    setOrderList((prev: Order[]) => prev.map((order: Order) =>
      order.orderId === orderId ? { ...order, confirmStatus: '구매완료' } : order
    ));
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

  // 날짜 포맷팅 함수
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
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
    const dateStr = formatDate(date);
    if (isStart) {
      setStartDate(dateStr);
      setIsStartDateOpen(false);
      if (endDate && dateStr > endDate) {
        setEndDate('');
      }
    } else {
      if (startDate && dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(startDate);
      } else {
        setEndDate(dateStr);
      }
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
    if (order.refundStatus === '카드결제취소') {
      label = '카드결제취소';
      color = 'bg-red-100 text-red-600';
    } else if (order.refundStatus === '계좌입금완료') {
      label = '계좌입금완료';
      color = 'bg-red-100 text-red-600';
    } else if (order.paymentDate === '-' || !order.paymentDate) {
      label = '입금전';
      color = 'bg-yellow-100 text-yellow-600';
    } else if (order.paymentMethod === '가상계좌') {
      label = '입금완료';
      color = 'bg-green-100 text-green-600';
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

  useEffect(() => {
    // 리뷰 작성 후 돌아왔을 때 최신 주문내역 반영
    const handleFocus = () => {
      try {
        const savedOrderList = localStorage.getItem('orderList');
        if (savedOrderList) {
          setOrderList(JSON.parse(savedOrderList));
        }
      } catch (error) {
        // 무시
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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
                className="font-semibold text-gray-600 hover:underline hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setActiveTab('coupons');
                  setCouponTab('available');
                  navigate('/mypage?tab=coupons');
                }}
              >
                {availableCouponCount} 개
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-600 font-normal ml-2">포인트</span>
              <span className="font-semibold text-gray-600 hover:underline hover:text-gray-700">0 P</span>
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
              <div className="bg-gray-100 rounded p-3 text-xs text-gray-600 mb-4">애드모어 런칭 <span className="text-orange-500 font-bold ml-2">2023-02-22</span></div>
              <div className="bg-teal-400 w-full h-40 rounded-lg p-8 text-center text-white font-bold text-2xl mb-12 flex items-center justify-center">
                지금 애드모어를 이용하시면, 최대 10프로 할인
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
                          {availableCouponCount} 
                          <span className="text-gray-400 font-semibold ml-1 text-sm sm:text-base">개</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2 bg-white rounded-lg px-2 py-4 w-full border border-gray-100">
                        <div className="font-semibold text-xs sm:text-base">전체 쿠폰</div>
                        <div className="text-[16px] sm:text-xl font-bold text-orange-600">
                          {totalCouponCount} 
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
                  <div className="grid grid-cols-1 xxs:grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 
                      sm:gap-4 mt-4 py-4 rounded-b-lg">
                    {allCoupons.filter(c => {
                      // 쿠폰 만료일 확인 함수
                      const isCouponExpired = (expiry: string) => {
                        try {
                          const expireDate = new Date(expiry.replace('년 ', '-').replace('월 ', '-').replace('일 ', ' ').split(' ')[0]);
                          const today = new Date();
                          return expireDate < today;
                        } catch {
                          return false;
                        }
                      };
                      
                      if (couponTab === 'all') return true;
                      if (couponTab === 'available') return !usedCoupons[c.id] && !isCouponExpired(c.expire);
                      if (couponTab === 'used') return !!usedCoupons[c.id];
                      if (couponTab === 'expiring') {
                        // 만료일이 1달 이하인 쿠폰 필터링
                        const expireDate = new Date(c.expire.replace('년 ', '-').replace('월 ', '-').replace('일 ', ' ').split(' ')[0]);
                        const today = new Date();
                        const oneMonthFromNow = new Date();
                        oneMonthFromNow.setMonth(today.getMonth() + 1);
                        return !usedCoupons[c.id] && !isCouponExpired(c.expire) && expireDate <= oneMonthFromNow && expireDate >= today;
                      }
                      return true;
                    }).length === 0 ? (
                      <div className="w-full col-span-full text-center text-gray-400 py-12 min-h-[320px] text-sm flex flex-col items-center justify-center bg-gray-50 rounded-lg h-full">
                        <div className="text-4xl mb-2">🎫</div>
                        <div className="text-sm font-medium text-gray-500 mb-1">
                          {couponTab === 'available' && '사용 가능한 쿠폰이 없습니다.'}
                          {couponTab === 'used' && '사용한 쿠폰이 없습니다.'}
                          {couponTab === 'expiring' && '만료 임박 쿠폰이 없습니다.'}
                          {couponTab === 'all' && '쿠폰이 없습니다.'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {couponTab === 'available' && '새로운 쿠폰을 등록해보세요!'}
                          {couponTab === 'used' && '쿠폰을 사용해보세요!'}
                          {couponTab === 'expiring' && '곧 만료되는 쿠폰이 없습니다.'}
                          {couponTab === 'all' && '쿠폰을 등록해보세요!'}
                        </div>
                      </div>
                    ) : (
                      allCoupons.filter(c => {
                        // 쿠폰 만료일 확인 함수
                        const isCouponExpired = (expiry: string) => {
                          try {
                            const expireDate = new Date(expiry.replace('년 ', '-').replace('월 ', '-').replace('일 ', ' ').split(' ')[0]);
                            const today = new Date();
                            return expireDate < today;
                          } catch {
                            return false;
                          }
                        };
                        
                        if (couponTab === 'all') return true;
                        if (couponTab === 'available') return !usedCoupons[c.id] && !isCouponExpired(c.expire);
                        if (couponTab === 'used') return !!usedCoupons[c.id];
                        if (couponTab === 'expiring') {
                          // 만료일이 1달 이하인 쿠폰 필터링
                          const expireDate = new Date(c.expire.replace('년 ', '-').replace('월 ', '-').replace('일 ', ' ').split(' ')[0]);
                          const today = new Date();
                          const oneMonthFromNow = new Date();
                          oneMonthFromNow.setMonth(today.getMonth() + 1);
                          return !usedCoupons[c.id] && !isCouponExpired(c.expire) && expireDate <= oneMonthFromNow && expireDate >= today;
                        }
                        return true;
                      }).map((coupon, idx, arr) => (
                        <div
                          key={coupon.id}
                          className="relative transition-all duration-200 hover:z-20 hover:scale-105 w-full"
                        >
                          <CouponCard
                            title={coupon.name}
                            expiry={coupon.expire}
                            maxDiscount={10000}
                            discountRate={coupon.percent}
                            used={!!usedCoupons[coupon.id]}
                            brand={coupon.brand}
                            onUse={() => handleUseCoupon(coupon)}
                          />
                        </div>
                      ))
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
                            {['전체 상태', '진행 중', '취소', '작업완료', '구매확정', '구매완료'].map((status) => (
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
                                  {startDate ? formatDisplayDate(startDate) : '시작일'}
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
                                  {endDate ? formatDisplayDate(endDate) : '종료일'}
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
                              <td colSpan={7} className="text-center text-gray-400 py-16">주문내역이 없습니다.</td>
                            </tr>
                          ) : (
                            currentItems.map((order: Order) => (
                            <tr key={order.orderId + order.review}>
                              <td className="text-xs text-gray-600 p-2 min-w-[100px] border">{order.orderId}</td>
                              <td className="text-xs text-gray-600 p-2 min-w-[80px] text-center border">
                                {order.status === '작업완료' && order.confirmStatus === '구매완료' ? null : (
                                  <div className="text-xs text-gray-600 font-semibold p-2 min-w-[80px] text-center">{order.status}</div>
                                )}
                                {order.status === '작업완료' && (
                                  order.confirmStatus === '구매완료' ? (
                                    <>
                                      <span className="block text-xs text-green-600 font-bold mb-1 py-1">구매완료</span>
                                      <ReviewButtonText order={order} />
                                    </>
                                  ) : (
                                    <button
                                      className="text-xs text-white bg-blue-500 rounded-full px-2 py-1 font-semibold hover:bg-blue-600 transition"
                                      onClick={() => handleConfirmPurchase(order.orderId)}
                                    >
                                      구매확정
                                    </button>
                                  )
                                )}
                              </td>
                              <td className="text-xs text-gray-600 p-2 min-w-[160px] border">
                                <Link
                                  to={`/products/${order.productId}`}
                                  className="text-gray-600 hover:underline font-semibold"
                                >
                                  {order.product}
                                </Link>
                                <br />
                                <span className="text-gray-500 text-[11px]">({order.detail})</span>
                              </td>
                              <td className="text-xs text-gray-600 p-2 min-w-[60px] text-right border">{order.quantity}개</td>
                              <td className="text-xs text-gray-600 p-2 min-w-[100px] max-w-[100px] text-right border">
                                <div className="font-semibold text-red-600">{order.price}</div>
                              </td>
                              <td className="text-xs text-gray-600 p-2 min-w-[100px] text-center border">{order.date === '-' || !order.date ? '입금전' : order.date}</td>
                              <td className="text-xs text-gray-600 p-2 min-w-[160px] border">{order.request}</td>
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
                            {['전체 상태', '진행 중', '취소', '작업완료', '구매확정', '구매완료'].map((status) => (
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
                                  {startDate ? formatDisplayDate(startDate) : '시작일'}
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
                                  {endDate ? formatDisplayDate(endDate) : '종료일'}
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
                            <span
                              className="font-semibold text-sm text-gray-600 hover:underline cursor-pointer"
                              onClick={() => navigate(`/products/${order.productId}`)}
                            >
                              {order.product}
                            </span>
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
                              <div>가격: <span className="font-semibold text-red-600">{order.price}</span></div>
                              <div>요청: <span className="font-medium">{order.request}</span></div>
                            </div>
                          </div>
                          {order.status === '작업완료' && (
                            <ReviewButton order={order} />
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
                                {startDate ? formatDisplayDate(startDate) : '시작일'}
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
                                {endDate ? formatDisplayDate(endDate) : '종료일'}
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
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors flex items-center gap-2"
                          style={{ minWidth: 40 }}
                        >
                          <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3" />
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
                                      <div className="">PAY-{order.orderId.replace('-', '')}</div>
                                      <div className="text-gray-500 text-[10px]">({order.orderId})</div>
                                    </div>
                                  </td>
                                  <td className="p-2 border min-w-[120px]">
                                    <div>
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
                                      <span className="line-through text-gray-400 text-[10px]">{order.originalPrice}</span>
                                      {order.discountPrice !== '0원' && (
                                        <span className="text-green-600 text-[10px]">할인: {order.discountPrice}</span>
                                      )}
                                      <span className="font-semibold text-red-600">{order.price}</span>
                                    </div>
                                  </td>
                                  <td className="p-2 border min-w-[100px] text-center">{order.paymentMethod}</td>
                                  <td className="p-2 border min-w-[100px] text-center">{order.paymentDate === '-' || !order.paymentDate ? '-' : order.paymentDate}</td>
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
                                  {startDate ? formatDisplayDate(startDate) : '시작일'}
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
                                  {endDate ? formatDisplayDate(endDate) : '종료일'}
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
                                <span
                                  className="font-semibold text-sm text-gray-600 hover:underline cursor-pointer"
                                  onClick={() => navigate(`/products/${order.productId}`)}
                                >
                                  {order.product}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full min-w-[60px] text-center ${
                                  order.status === '작업완료' ? 'bg-green-100 text-green-600' :
                                  order.status === '진행 중' ? 'bg-yellow-100 text-yellow-600' :
                                  order.status === '취소' ? 'bg-red-100 text-red-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {order.status === '작업완료' ? 
                                    (order.paymentMethod === '가상계좌' ? '입금완료' : '결제완료') : 
                                   order.status === '취소' ? '환불완료' : 
                                   order.status === '진행 중' ? 
                                    (order.paymentMethod === '가상계좌' ? '입금완료' : '결제완료') : 
                                    (order.paymentMethod === '가상계좌' ? '입금완료' : '결제완료')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">{order.detail}</div>
                              <div className="flex flex-col text-xs text-gray-600 gap-x-4 gap-y-1 mb-2">
                                <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1">
                                  <div>결제번호: <span className="font-medium">PAY-{order.orderId.replace('-', '')}</span></div>
                                  <div>결제방식: <span className="font-medium">{order.paymentMethod}</span></div>
                                </div>
                                <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1">
                                  <div>결제일: <span className="font-medium">{order.paymentDate === '-' || !order.paymentDate ? '입금전' : order.paymentDate}</span></div>
                                  <div>주문번호: <span className="font-medium">{order.orderId}</span></div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div>가격: 
                                    <span className="line-through text-gray-400 ml-1">{order.originalPrice}</span>
                                    <span className="font-semibold text-red-600 ml-2">{order.price}</span>
                                    {order.discountPrice !== '0원' && (
                                      <span className="text-green-600 ml-1">(할인: {order.discountPrice})</span>
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
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg">즐겨찾기한 상품이 없습니다.</p>
                      <p className="text-gray-400 text-sm mt-2">상품을 즐겨찾기에 추가해보세요.</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {/* 비밀번호 변경 */}
                  <div className="bg-white rounded-lg border px-6 py-8 mb-8">
                    <div className="font-semibold text-sm mb-4">비밀번호 변경</div>
                    <form className="space-y-4">
                      <input
                        type="password"
                        placeholder="현재 비밀번호를 입력해 주세요"
                        className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호를 입력해 주세요"
                        className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                      <input
                        type="password"
                        placeholder="비밀번호를 다시 한번 입력해 주세요"
                        className="w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                      />
                      <button
                        type="submit"
                        className="w-full py-3 rounded bg-gradient-to-r from-orange-400 to-orange-600 text-sm text-white font-semibold shadow hover:from-orange-500 hover:to-orange-700 transition"
                      >
                        비밀번호 변경
                      </button>
                    </form>
                  </div>
                  {/* 회원 탈퇴 */}
                  <div className="bg-white rounded-lg border px-6 py-8">
                    <div className="font-semibold text-sm mb-4">회원 탈퇴</div>
                    <form className="space-y-4">
                      <input
                        type="password"
                        placeholder="비밀번호를 입력해 주세요"
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
                        <input type="checkbox" className="mr-2" />
                        안내 사항을 모두 확인하였으며, 이에 동의합니다.
                      </label>
                      <button
                        type="submit"
                        className="w-full py-3 rounded bg-gray-200 text-gray-400 font-semibold cursor-not-allowed text-sm"
                        disabled
                      >
                        탈퇴 하기
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