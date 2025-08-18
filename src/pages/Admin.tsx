import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  faHome, faCog, faBox, faStar, faComments, faUser, faSignOutAlt, faBell, faSearch, 
  faCaretDown, faCaretUp, faEdit, faTrash, faCheck, faTimes, faEye, faPlus, faMinus,
  faChevronLeft, faChevronRight, faBars, faTimes as faTimesIcon, faSync, faHeadset, faFileAlt, faShieldAlt,
  faTicketAlt, faCoins, faChartPie, faTasks, faListUl, faHistory
} from '@fortawesome/free-solid-svg-icons';
import { authAPI, productAPI, categoryAPI, tagAPI, reviewsAPI, usersAPI } from '../services/api';
import ProductManagement from '../components/ProductManagement';
import ReviewManagement from '../components/ReviewManagement';
import CustomerServiceManagement from '../components/CustomerServiceManagement';
import InquiryManagement from '../components/InquiryManagement';
import CouponManagement from '../components/CouponManagement';
import PointManagement from '../components/PointManagement';
import Pagination from '../components/Pagination';
import products, { getProducts, saveProducts, resetProducts } from '../data/products';
import mockReviews from '../data/reviews-list';
import { defaultUsers, User } from '../data/users';
import defaultOrderList, { Order as OrderData } from '../data/orderdata';
import { Product } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Order {
  orderId: string;
  productId: number;
  product: string;
  date: string;
  quantity: number;
  status: string;
  review: string;
  price: string;
  originalPrice?: string;
  discountPrice?: string;
  finalPrice?: number;
  paymentMethod?: string;
  paymentDate?: string;
  refundStatus?: string;
  confirmStatus?: string;
  detail?: string;
  request?: string;
  image?: string;
  paymentNumber?: string;
  userName?: string;
  userEmail?: string;
  points?: number;
  productNumber?: string;
}

interface Review {
  id: number;
  user: string;
  rating: number;
  content: string;
  time: string;
  product: string;
  productId?: number;
  reply?: string;
  replyTime?: string;
  category?: string;
  tags?: string;
  image?: string;
  background?: string;
  orderId?: string;
  orderDate?: string;
  quantity?: number;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'user' | 'admin';
  productInfo?: string;
  status?: 'pending' | 'answered' | 'closed';
  isCompleted?: boolean; // 채팅 완료 상태 추가
}

interface Notification {
  id: string;
  type: 'order' | 'review' | 'chat' | 'user' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  orderId?: string;
  userId?: string;
  productId?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  count?: number;
  action?: () => void;
  subItems?: SidebarItem[];
}

// 이메일 마스킹 함수
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const maskedLocalPart = localPart.slice(0, -2) + '**';
  return `${maskedLocalPart}@${domain}`;
};

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 관리자 인증 체크
  useEffect(() => {
    const checkAdminAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userRole = localStorage.getItem('userRole');
      const userEmail = localStorage.getItem('userEmail');
      const token = localStorage.getItem('token');

      // 로그인 상태가 아니거나 관리자가 아니면 로그인 페이지로 리다이렉트
      if (!isLoggedIn || userRole !== 'admin' || !userEmail || !token) {
        console.log('관리자 권한이 없습니다. 로그인 페이지로 이동합니다.');
        alert('관리자 권한이 필요합니다. 로그인해주세요.');
        navigate('/login', { replace: true });
        return false;
      }

      // 관리자 권한 체크 (userRole이 'admin'이면 접근 허용)
      if (userRole !== 'admin') {
        console.log('관리자 권한이 없습니다. 로그인 페이지로 이동합니다.');
        alert('관리자 권한이 필요합니다. 로그인해주세요.');
        navigate('/login', { replace: true });
        return false;
      }

      return true;
    };

    // 페이지 로드 시 인증 체크
    if (!checkAdminAuth()) {
      return;
    }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'reviews' | 'coupons' | 'points' | 'customerService' | 'inquiries' | 'users'>('dashboard');
  const [customerServiceTab, setCustomerServiceTab] = useState<'notices' | 'terms' | 'privacy'>('notices');
  const [isCustomerServiceExpanded, setIsCustomerServiceExpanded] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  // 최근 주문내용 필터 (결제완료 | 입금전)
  const [recentOrdersFilter, setRecentOrdersFilter] = useState<'paid' | 'unpaid'>('paid');
  const filteredRecentOrders = useMemo(() => {
    if (recentOrdersFilter === 'paid') {
      return orders.filter(o => (
        ((o.paymentMethod === 'card' || o.paymentMethod === '신용카드') && o.paymentDate && o.paymentDate !== '-') ||
        ((o.paymentMethod === 'virtual' || o.paymentMethod === '가상계좌') && o.paymentDate && o.paymentDate !== '-')
      ));
    }
    // unpaid: 가상계좌 입금전만
    return orders.filter(o => (
      (o.paymentMethod === 'virtual' || o.paymentMethod === '가상계좌') && (!o.paymentDate || o.paymentDate === '-')
    ));
  }, [orders, recentOrdersFilter]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const recentActivityRef = useRef<HTMLDivElement | null>(null);
  const [completedChats, setCompletedChats] = useState<string[]>([]); // 완료된 채팅 추적

  // WebSocket 훅 사용
  const {
    isConnected,
    messages: wsMessages,
    sendMessage,
    updateMessageStatus,
    loadMessages
  } = useWebSocket({
    isAdmin: true,
    onNewMessage: (message) => {
      console.log('관리자 페이지: 새로운 메시지 수신', message);
      // 새로운 메시지가 도착하면 chatMessages에 추가
      setChatMessages(prev => {
        const isDuplicate = prev.some(msg => msg.id === message.id);
        if (isDuplicate) {
          console.log('관리자 페이지: 중복 메시지 무시');
          return prev;
        }
        
        // 완료 메시지가 도착하면 해당 사용자의 채팅을 완료 상태로 표시
        if ((message.message.includes('상담이 완료되었습니다') || message.message.includes('유저가 채팅종료를 하였습니다')) && message.type === 'admin') {
          console.log('관리자 페이지: 채팅 완료 메시지 감지, 채팅 완료 상태로 표시');
          // 해당 사용자의 채팅을 완료 상태로 표시
          setCompletedChats(prev => [...prev, message.user]);
          return []; // 채팅 내용은 숨김
        }
        
        // 완료된 사용자의 새로운 메시지는 무시
        if (completedChats.includes(message.user)) {
          console.log('관리자 페이지: 완료된 사용자의 새로운 메시지 무시');
          return prev;
        }
        
        console.log('관리자 페이지: 새 메시지 추가됨');
        return [...prev, message];
      });
    },
    onStatusUpdate: (data) => {
      // 메시지 상태 업데이트
      setChatMessages(prev => 
        prev.map(msg => 
          msg.user === data.userEmail 
            ? { ...msg, status: data.status as 'pending' | 'answered' | 'closed' }
            : msg
        )
      );
    }
  });

  // wsMessages를 chatMessages와 동기화 - 완료된 채팅은 목록에 유지하되 상태만 표시
  useEffect(() => {
    if (wsMessages) {
      console.log('관리자 페이지: wsMessages 업데이트됨', wsMessages.length);
      
      if (wsMessages.length > 0) {
        // 모든 메시지 표시 (완료된 채팅은 InquiryManagement에서 상태로 표시)
        console.log('관리자 페이지: 모든 메시지 표시', wsMessages.length);
        setChatMessages(wsMessages);
        localStorage.setItem('chatMessages', JSON.stringify(wsMessages));
      } else {
        // wsMessages가 비어있으면 빈 배열로 설정
        console.log('관리자 페이지: wsMessages가 비어있음');
        setChatMessages([]);
        localStorage.setItem('chatMessages', JSON.stringify([]));
      }
    }
  }, [wsMessages]);

  // 최근 활동 자동 스크롤 (하나씩 위로 이동)
  useEffect(() => {
    const container = recentActivityRef.current;
    if (!container) return;

    let currentIndex = 0;

    const getItems = () => Array.from(container.querySelectorAll<HTMLElement>('.recent-activity-item'));

    const scrollOne = () => {
      const items = getItems();
      if (items.length === 0) return;

      // 현재 인덱스의 아이템 높이 만큼 스크롤
      const targetIndex = Math.min(currentIndex, items.length - 1);
      const item = items[targetIndex];
      if (!item) return;

      const gapBetweenItemsPx = 8; // Tailwind space-y-2 = 0.5rem = 8px
      const step = item.offsetHeight + gapBetweenItemsPx;

      const maxScroll = container.scrollHeight - container.clientHeight;
      const nextTop = Math.min(container.scrollTop + step, maxScroll);
      container.scrollTo({ top: nextTop, behavior: 'smooth' });

      currentIndex += 1;

      // 끝까지 스크롤되면 처음으로 리셋
      if (nextTop >= maxScroll) {
        // 부드러운 스크롤 종료 후 살짝 대기하고 맨 위로 순간이동
        setTimeout(() => {
          container.scrollTo({ top: 0, behavior: 'auto' });
          currentIndex = 0;
        }, 600);
      }
    };

    const intervalId = window.setInterval(scrollOne, 3000);
    return () => window.clearInterval(intervalId);
  }, [orders, reviews, chatMessages]);

  // chatMessages 상태를 localStorage에 저장하는 함수
  const updateChatMessages = (newMessages: ChatMessage[]) => {
    setChatMessages(newMessages);
    localStorage.setItem('chatMessages', JSON.stringify(newMessages));
  };
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // 알림 관련 상태
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 정보 상태
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
  }>({
    name: localStorage.getItem('userName') || '관리자',
    email: localStorage.getItem('userEmail') || 'admin@admore.com'
  });

  // 상품 관리 관련 상태
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 회원 관리 관련 상태
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSortBy, setUserSortBy] = useState<'name' | 'email' | 'joinDate' | 'status' | 'role'>('joinDate');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isOrderStatusDropdownOpen, setIsOrderStatusDropdownOpen] = useState(false);
  const [isBatchStatusDropdownOpen, setIsBatchStatusDropdownOpen] = useState(false);
  const [isBatchRoleDropdownOpen, setIsBatchRoleDropdownOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAllUsers, setSelectAllUsers] = useState(false);

  // 주문 관리 페이지네이션 관련 상태
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // 주문 삭제 관련 상태
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // 리뷰 관리 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(10);
  const [sortType, setSortType] = useState<'date' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showReviews, setShowReviews] = useState(true);

  // 반응형 사이드바 상태 관리
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint 미만 - 모바일
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false); // 모바일에서는 사이드바 닫기
      } else if (window.innerWidth < 1024) { // lg breakpoint 미만 - 태블릿
        setIsSidebarCollapsed(true); // 아이콘만 보이도록
        setIsMobileSidebarOpen(false); // 모바일 사이드바 닫기
      } else { // lg 이상 - 데스크톱
        setIsSidebarCollapsed(false); // 전체 사이드바 표시
        setIsMobileSidebarOpen(false); // 모바일 사이드바 닫기
      }
    };

    // 초기 로드 시 체크
    handleResize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // 인증 체크
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userRole = localStorage.getItem('userRole');
        const userEmail = localStorage.getItem('userEmail');
        const token = localStorage.getItem('token');

        if (!isLoggedIn || userRole !== 'admin' || !userEmail || !token) {
          console.log('관리자 권한이 없어 데이터를 로드하지 않습니다.');
          return;
        }

        // 모든 데이터 로드
        await Promise.all([
          loadProducts(),
          loadOrders(),
          loadReviews(),
          loadChatMessages(),
          loadUsers()
        ]);
      } catch (error) {
        console.error('데이터 초기화 에러:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []); // 컴포넌트 마운트 시에만 실행

  // 사용자 정보 변경 이벤트 리스너
  useEffect(() => {
    const handleUserInfoChanged = (event: CustomEvent) => {
      const { type, newName, userEmail } = event.detail;
      
      if (type === 'name' && userEmail) {
        // 사용자 목록에서 해당 사용자의 이름 업데이트
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.email === userEmail 
              ? { ...user, name: newName }
              : user
          )
        );
        
        // 현재 로그인한 사용자의 정보가 변경된 경우 currentUser 상태도 업데이트
        if (userEmail === currentUser.email) {
          setCurrentUser(prev => ({
            ...prev,
            name: newName
          }));
        }
        
        // 필터링된 사용자 목록은 users 상태가 업데이트되면 자동으로 재계산됨
        
        console.log(`사용자 ${userEmail}의 이름이 ${newName}으로 변경되었습니다.`);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('userInfoChanged', handleUserInfoChanged as EventListener);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('userInfoChanged', handleUserInfoChanged as EventListener);
    };
  }, []);

  // localStorage에서 사용자 정보 실시간 감지
  useEffect(() => {
    const checkUserInfo = () => {
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');
      
      if (userName && userEmail) {
        setCurrentUser({
          name: userName,
          email: userEmail
        });
      }
    };

    // 초기 체크
    checkUserInfo();

    // storage 이벤트 리스너 (다른 탭에서 변경된 경우)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userName' || e.key === 'userEmail') {
        checkUserInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 알림 카운트 실시간 업데이트
  useEffect(() => {
    const unreadNotifications = notifications.filter(notification => !notification.isRead);
    setUnreadCount(unreadNotifications.length);
  }, [notifications]);

  // URL 파라미터와 location.state 변경 처리
  useEffect(() => {
    // URL 파라미터에서 탭 설정
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['dashboard', 'products', 'orders', 'reviews', 'customerService', 'inquiries', 'users'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    
    // location.state에서 새로운 주문 정보 확인
    if (location.state?.newOrder) {
      console.log('새로운 주문이 감지되었습니다:', location.state.newOrder);
      // 새로운 주문이 있으면 주문 탭으로 이동
      setActiveTab('orders');
    }
  }, [location.search, location.state]);

  const loadProducts = async () => {
    try {
      // 타임아웃 설정 (5초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('요청 시간 초과')), 5000);
      });

      // 백엔드에서 모든 상품 가져오기
      const productPromise = productAPI.getAllProducts();
      
      const productList = await Promise.race([productPromise, timeoutPromise]) as Product[];
      
      if (productList && productList.length > 0) {
        setProducts(productList);
      } else {
        // 백엔드에 데이터가 없으면 기본 데이터 사용
        console.log('백엔드에 상품 데이터가 없어 기본 데이터를 사용합니다.');
        setProducts(products);
      }
    } catch (error) {
      console.error('상품 로드 에러:', error);
      // 에러 발생 시 기본 데이터 사용
              setProducts(products);
    }
  };

  const handleProductsChange = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    // 백엔드 API를 사용하므로 localStorage 저장은 제거
  };

  // 상품 폼 상태 변경 핸들러
  const handleProductFormStateChange = (isFormOpen: boolean, editingProduct: Product | null) => {
    setIsProductFormOpen(isFormOpen);
    setEditingProduct(editingProduct);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 알림 드롭다운 외부 클릭 시 닫기
      if (isNotificationDropdownOpen && !target.closest('.notification-dropdown')) {
        setIsNotificationDropdownOpen(false);
      }
      
      // 프로필 드롭다운 외부 클릭 시 닫기
      if (isProfileDropdownOpen && !target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }

      // 주문 상태 드롭다운 외부 클릭 시 닫기
      if (isOrderStatusDropdownOpen && !target.closest('.order-status-dropdown')) {
        setIsOrderStatusDropdownOpen(false);
      }

      // 상태 변경 드롭다운 외부 클릭 시 닫기
      if (isStatusDropdownOpen && !target.closest('.status-dropdown')) {
        setIsStatusDropdownOpen(false);
      }

      // 역할 변경 드롭다운 외부 클릭 시 닫기
      if (isRoleDropdownOpen && !target.closest('.role-dropdown')) {
        setIsRoleDropdownOpen(false);
      }

      // 일괄 관리 상태 변경 드롭다운 외부 클릭 시 닫기
      if (isBatchStatusDropdownOpen && !target.closest('.status-dropdown')) {
        setIsBatchStatusDropdownOpen(false);
      }

      // 일괄 관리 역할 변경 드롭다운 외부 클릭 시 닫기
      if (isBatchRoleDropdownOpen && !target.closest('.role-dropdown')) {
        setIsBatchRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationDropdownOpen, isProfileDropdownOpen, isOrderStatusDropdownOpen, isStatusDropdownOpen, isRoleDropdownOpen, isBatchStatusDropdownOpen, isBatchRoleDropdownOpen]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentUserPage(1);
  }, [userSearchTerm, userRoleFilter, userStatusFilter, usersPerPage]);

  const loadOrders = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        console.log('백엔드에서 주문 데이터 로드 완료:', data.orders);
      } else {
        console.error('주문 데이터 로드 실패:', response.status);
        setOrders([]);
      }
    } catch (error) {
      console.error('주문 데이터 로드 중 오류:', error);
      setOrders([]);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await reviewsAPI.getAll();
      if (response && Array.isArray(response)) {
        const formattedReviews = response.map((review: any) => ({
          id: review.id,
          user: review.userEmail || review.user || '익명',
          time: review.createdAt || review.time || new Date().toLocaleString(),
          content: review.content,
          product: review.productName || review.product || '상품명 없음',
          rating: review.rating,
          reply: review.adminReply || review.reply,
          replyTime: review.adminReplyTime || review.replyTime,
          productId: review.productId,
          category: review.category,
          tags: review.tags,
          image: review.image,
          background: review.background,
          orderId: review.orderId,
          orderDate: review.orderDate,
          quantity: review.quantity
        }));
        setReviews(formattedReviews);
      }
    } catch (error) {
      console.error('리뷰 로드 중 오류:', error);
      setReviews([]);
    }
  };

  const loadChatMessages = () => {
    // WebSocket에서 메시지 로드
    loadMessages();
  };

  // 리뷰 새로고침 함수
  const handleRefreshReviews = () => {
    loadReviews();
  };

  // 리뷰 검색 및 필터링
  const filteredReviews = reviews.filter(review =>
    review.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 리뷰 정렬
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortType === 'date') {
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
    }
  });

  // 페이지네이션
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = sortedReviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);



  // 정렬 함수들
  const handleRatingSort = () => {
    setSortType('rating');
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleDateSort = () => {
    setSortType('date');
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };



  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      if (response && response.users) {
        setUsers(response.users);
        console.log('백엔드에서 회원 데이터 로드 완료:', response.users);
      } else {
        console.error('회원 데이터 로드 실패: 응답 데이터 없음');
        setUsers([]);
      }
    } catch (error) {
      console.error('회원 데이터 로드 중 오류:', error);
      setUsers([]);
    }
  };

  // 주문 상태 변경
  const updateOrderStatus = async (orderId: string, newStatus: string, confirmStatus?: string) => {
    if (window.confirm(`주문 상태를 "${newStatus}"로 변경하시겠습니까?`)) {
      try {
        // 백엔드 API 호출
        const response = await fetch(`http://localhost:5001/api/orders/order/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            confirmStatus: confirmStatus
          })
        });

        if (response.ok) {
          // 성공 시 주문 목록 다시 로드
          await loadOrders();
          alert(`주문 상태가 "${newStatus}"로 변경되었습니다.`);
          
          // 주문 상태 변경 알림 추가
          addNotification({
            type: 'order',
            title: '주문 상태 변경',
            message: `주문 ${orderId}의 상태가 "${newStatus}"로 변경되었습니다.`,
            orderId
          });
        } else {
          console.error('주문 상태 업데이트 실패:', response.status);
          alert('주문 상태 업데이트에 실패했습니다.');
        }
      } catch (error) {
        console.error('주문 상태 업데이트 중 오류:', error);
        alert('주문 상태 업데이트 중 오류가 발생했습니다.');
      }
    }
  };

  // 한국 시간대의 현재 날짜를 ISO 문자열로 변환하는 함수
  const getKoreanTimeISOString = () => {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime.toISOString();
  };

  // 입금 확인 함수
  const confirmPayment = async (orderId: string) => {
    if (window.confirm('입금을 확인하시겠습니까?\n\n입금 확인 후에는 취소할 수 있습니다.')) {
      try {
        // 백엔드 API 호출
        const response = await fetch(`http://localhost:5001/api/orders/order/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentDate: getKoreanTimeISOString()
          })
        });

        if (response.ok) {
          // 성공 시 주문 목록 다시 로드
          await loadOrders();
          alert('입금 확인이 완료되었습니다.');
          
          // 입금 확인 알림 추가
          addNotification({
            type: 'order',
            title: '입금 확인',
            message: `주문 ${orderId}의 입금이 확인되었습니다.`,
            orderId
          });
        } else {
          console.error('입금 확인 실패:', response.status);
          alert('입금 확인에 실패했습니다.');
        }
      } catch (error) {
        console.error('입금 확인 중 오류:', error);
        alert('입금 확인 중 오류가 발생했습니다.');
      }
    }
  };

  // 입금완료 취소 함수
  const cancelPayment = async (orderId: string) => {
    if (window.confirm('입금완료를 취소하시겠습니까?\n\n입금확인전 상태로 되돌립니다.')) {
      try {
        // 백엔드 API 호출
        const response = await fetch(`http://localhost:5001/api/orders/order/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentDate: '-'
          })
        });

        if (response.ok) {
          // 성공 시 주문 목록 다시 로드
          await loadOrders();
          alert('입금완료가 취소되었습니다.');
        } else {
          console.error('입금완료 취소 실패:', response.status);
          alert('입금완료 취소에 실패했습니다.');
        }
      } catch (error) {
        console.error('입금완료 취소 중 오류:', error);
        alert('입금완료 취소 중 오류가 발생했습니다.');
      }
    }
  };

  // 리뷰 삭제
  const deleteReview = async (reviewId: number) => {
    if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      try {
        // 백엔드 API 호출
        const response = await fetch(`http://localhost:5001/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          // 성공 시 리뷰 목록 다시 로드
          await loadReviews();
          alert('리뷰가 성공적으로 삭제되었습니다.');
          
          // 리뷰 삭제 알림 추가
          addNotification({
            type: 'review',
            title: '리뷰 삭제',
            message: `리뷰 ID ${reviewId}가 삭제되었습니다.`,
            productId: reviewId.toString()
          });
        } else {
          console.error('리뷰 삭제 실패:', response.status);
          alert('리뷰 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('리뷰 삭제 중 오류:', error);
        alert('리뷰 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 채팅 메시지 삭제

  // 회원 상태 변경
  const updateUserStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    const statusText = {
      'active': '활성',
      'inactive': '비활성',
      'suspended': '정지'
    };
    
    const confirmMessage = `정말로 이 회원의 상태를 "${statusText[newStatus]}"로 변경하시겠습니까?\n\n이 작업은 되돌릴 수 있습니다.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // 백엔드 API 호출
        await usersAPI.updateStatus(userId, newStatus);
        
        // 성공 시 회원 목록 다시 로드
        await loadUsers();
        alert(`회원 상태가 "${statusText[newStatus]}"로 변경되었습니다.`);
        
        // 회원 상태 변경 알림 추가
        addNotification({
          type: 'user',
          title: '회원 상태 변경',
          message: `회원 ${userId}의 상태가 "${statusText[newStatus]}"로 변경되었습니다.`,
          userId
        });
      } catch (error) {
        console.error('회원 상태 업데이트 에러:', error);
        alert('회원 상태 업데이트에 실패했습니다.');
      }
    }
  };

  // 회원 삭제
  const deleteUser = async (userId: string) => {
    const confirmMessage = `정말로 이 회원을 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.\n회원의 모든 데이터가 영구적으로 삭제됩니다.`;
    
    if (window.confirm(confirmMessage)) {
      // 한 번 더 확인
      if (window.confirm('정말로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
        try {
          // 백엔드 API 호출
          await usersAPI.delete(userId);
          
          // 성공 시 회원 목록 다시 로드
          await loadUsers();
          alert('회원이 성공적으로 삭제되었습니다.');
        } catch (error) {
          console.error('회원 삭제 에러:', error);
          alert('회원 삭제에 실패했습니다.');
        }
      }
    }
  };

  // 회원 정렬 함수
  const sortUsers = (users: User[]) => {
    return users.sort((a, b) => {
      let aValue: any = a[userSortBy];
      let bValue: any = b[userSortBy];
      
      // 날짜 정렬을 위한 변환
      if (userSortBy === 'joinDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // 문자열 정렬을 위한 소문자 변환
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (userSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // 정렬 방향 토글
  const toggleSortOrder = (field: 'name' | 'email' | 'joinDate' | 'status' | 'role') => {
    if (userSortBy === field) {
      setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortBy(field);
      setUserSortOrder('asc');
    }
  };

  // 필터링된 주문
  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.product?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (order.orderId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // 상태 필터링 로직 (업데이트된 드롭다운 라벨 대응)
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case '입금완료':
          // 가상계좌 + 입금 완료
          matchesStatus = (order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') &&
                          !!order.paymentDate && order.paymentDate !== '-';
          break;
        case '결제완료':
          // 신용카드 결제 완료
          matchesStatus = (order.paymentMethod === 'card' || order.paymentMethod === '신용카드') &&
                          !!order.paymentDate && order.paymentDate !== '-';
          break;
        case '결제취소':
          // 결제 취소(주문 상태가 '취소')
          matchesStatus = order.status === '취소';
          break;
        case '작업완료':
        case '대기중':
        case '진행 중':
        case '작업취소':
        case '취소':
          matchesStatus = order.status === statusFilter;
          break;
        default:
          matchesStatus = true;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  // 주문 관리 페이지네이션 계산
  const indexOfLastOrder = currentOrderPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // 필터링된 회원
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase() || '').includes(userSearchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(userSearchTerm.toLowerCase()) ||
                         (user.phone || '').includes(userSearchTerm);
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // 정렬된 회원 목록
  const sortedUsers = sortUsers([...filteredUsers]);

  // 페이지네이션 계산
  const indexOfLastUser = currentUserPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  // 통계 데이터
  const totalOrders = orders.length;
  const totalUsers = users.length;

  const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', label: '대시보드', icon: faHome, count: undefined, action: undefined },
    { id: 'products', label: '상품관리', icon: faCog, count: products.length, action: undefined },
    { id: 'orders', label: '주문관리', icon: faBox, count: totalOrders, action: undefined },
    { id: 'reviews', label: '리뷰관리', icon: faStar, count: reviews.length, action: undefined },
    { id: 'coupons', label: '쿠폰관리', icon: faTicketAlt, count: undefined, action: undefined },
    { id: 'points', label: '포인트관리', icon: faCoins, count: undefined, action: undefined },
    { id: 'customerService', label: '고객센터', icon: faComments, count: undefined, action: undefined, subItems: [
      { id: 'notices', label: '공지사항', icon: faBell, count: unreadCount, action: undefined },
      { id: 'terms', label: '이용약관', icon: faFileAlt, count: undefined, action: undefined },
      { id: 'privacy', label: '개인정보취급방침', icon: faShieldAlt, count: undefined, action: undefined }
    ] },
    { id: 'inquiries', label: '1:1문의', icon: faHeadset, count: chatMessages.length, action: undefined },
    { id: 'users', label: '회원관리', icon: faUser, count: totalUsers, action: undefined },
  ];

  // 로그아웃 함수
  // 알림 관련 함수들
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    
    // 알림 타입에 따른 페이지 이동
    switch (notification.type) {
      case 'order':
        setActiveTab('orders');
        break;
      case 'review':
        setActiveTab('reviews');
        break;
      case 'chat':
        setActiveTab('inquiries');
        break;
      case 'user':
        setActiveTab('users');
        break;
      default:
        break;
    }
    
    setIsNotificationDropdownOpen(false);
  };

  // 테스트용 알림 추가 함수
  const addTestNotification = () => {
    const testNotifications = [
      {
        type: 'order' as const,
        title: '새로운 주문 접수',
        message: '새로운 주문이 접수되었습니다. 주문번호: TEST-001',
        orderId: 'TEST-001'
      },
      {
        type: 'review' as const,
        title: '새로운 리뷰 작성',
        message: '새로운 리뷰가 작성되었습니다. 상품: 테스트 상품',
        productId: '1'
      },
      {
        type: 'chat' as const,
        title: '고객 문의 접수',
        message: '새로운 고객 문의가 접수되었습니다.',
        userId: 'user1'
      }
    ];

    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    addNotification(randomNotification);
  };

  const handleLogout = async () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      try {
        // 백엔드에 로그아웃 요청
        await authAPI.logout();
        console.log('백엔드 로그아웃 성공');
      } catch (error) {
        console.error('백엔드 로그아웃 실패:', error);
        // 백엔드 로그아웃이 실패해도 프론트엔드 로그아웃은 진행
      }

      // localStorage에서 모든 로그인 정보 제거
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('token');
      
      // 채팅 관련 데이터도 제거
      localStorage.removeItem('chat_messages');
      localStorage.removeItem('current_session');
      localStorage.removeItem('recentProducts');
      
      // 기타 세션 데이터 제거
      sessionStorage.clear();
      
      // 로그아웃 완료 알림
      alert('로그아웃이 완료되었습니다.');
      
      // 로그인 페이지로 이동
      navigate('/login', { replace: true });
    }
  };

  const homeItem: SidebarItem = { id: 'home', label: '홈으로', icon: faHome, action: () => navigate('/'), count: undefined };
  const logoutItem: SidebarItem = { id: 'logout', label: '로그아웃', icon: faSignOutAlt, action: handleLogout, count: undefined };

  // 회원 선택 관련 함수들
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAllUsers = () => {
    if (selectAllUsers) {
      setSelectedUsers([]);
      setSelectAllUsers(false);
    } else {
      setSelectedUsers(currentUsers.map(user => user.id));
      setSelectAllUsers(true);
    }
  };

  // 선택된 사용자들의 상태 변경
  const updateSelectedUsersStatus = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (selectedUsers.length === 0) {
      alert('선택된 사용자가 없습니다.');
      return;
    }

    const statusText = {
      'active': '활성',
      'inactive': '비활성',
      'suspended': '정지'
    };

    const confirmMessage = `선택된 ${selectedUsers.length}명의 사용자 상태를 "${statusText[newStatus]}"로 변경하시겠습니까?\n\n이 작업은 되돌릴 수 있습니다.`;

    if (window.confirm(confirmMessage)) {
      try {
        // 모든 선택된 사용자에 대해 API 호출
        const promises = selectedUsers.map(userId => 
          usersAPI.updateStatus(userId, newStatus)
        );
        
        await Promise.all(promises);
        
        // 성공 시 회원 목록 다시 로드
        await loadUsers();
        setSelectedUsers([]);
        setSelectAllUsers(false);
        alert(`선택된 ${selectedUsers.length}명의 사용자 상태가 "${statusText[newStatus]}"로 변경되었습니다.`);
      } catch (error) {
        console.error('사용자 상태 일괄 업데이트 에러:', error);
        alert('사용자 상태 일괄 업데이트에 실패했습니다.');
      }
    }
  };

  // 선택된 사용자들의 역할 변경
  const updateSelectedUsersRole = async (newRole: 'admin' | 'user') => {
    if (selectedUsers.length === 0) {
      alert('선택된 사용자가 없습니다.');
      return;
    }

    const roleText = {
      'admin': '관리자',
      'user': '일반회원'
    };

    const confirmMessage = `선택된 ${selectedUsers.length}명의 사용자 역할을 "${roleText[newRole]}"로 변경하시겠습니까?\n\n이 작업은 되돌릴 수 있습니다.`;

    if (window.confirm(confirmMessage)) {
      try {
        // 모든 선택된 사용자에 대해 API 호출
        const promises = selectedUsers.map(userId => 
          usersAPI.updateRole(userId, newRole)
        );
        
        await Promise.all(promises);
        
        // 성공 시 회원 목록 다시 로드
        await loadUsers();
        setSelectedUsers([]);
        setSelectAllUsers(false);
        alert(`선택된 ${selectedUsers.length}명의 사용자 역할이 "${roleText[newRole]}"로 변경되었습니다.`);
      } catch (error) {
        console.error('사용자 역할 일괄 업데이트 에러:', error);
        alert('사용자 역할 일괄 업데이트에 실패했습니다.');
      }
    }
  };

  // 선택된 사용자들 삭제
  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('선택된 사용자가 없습니다.');
      return;
    }

    const confirmMessage = `선택된 ${selectedUsers.length}명의 사용자를 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.\n선택된 사용자들의 모든 데이터가 영구적으로 삭제됩니다.`;

    if (window.confirm(confirmMessage)) {
      // 한 번 더 확인
      if (window.confirm('정말로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
        try {
          // 모든 선택된 사용자에 대해 API 호출
          const promises = selectedUsers.map(userId => 
            usersAPI.delete(userId)
          );
          
          await Promise.all(promises);
          
          // 성공 시 회원 목록 다시 로드
          await loadUsers();
          setSelectedUsers([]);
          setSelectAllUsers(false);
          alert(`선택된 ${selectedUsers.length}명의 사용자가 성공적으로 삭제되었습니다.`);
        } catch (error) {
          console.error('사용자 일괄 삭제 에러:', error);
          alert('사용자 일괄 삭제에 실패했습니다.');
        }
      }
    }
  };

  // 회원 역할 변경
  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    const roleText = {
      'admin': '관리자',
      'user': '일반회원'
    };
    
    const confirmMessage = `정말로 이 회원의 역할을 "${roleText[newRole]}"로 변경하시겠습니까?\n\n이 작업은 되돌릴 수 있습니다.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // 백엔드 API 호출
        await usersAPI.updateRole(userId, newRole);
        
        // 성공 시 회원 목록 다시 로드
        await loadUsers();
        alert(`회원 역할이 "${roleText[newRole]}"로 변경되었습니다.`);
      } catch (error) {
        console.error('회원 역할 업데이트 에러:', error);
        alert('회원 역할 업데이트에 실패했습니다.');
      }
    }
  };

  // 상품관리 탭 클릭 시 무조건 목록으로 이동
  const handleSidebarTabClick = (tabId: string) => {
    if (tabId === 'products') {
      setActiveTab('products');
      setIsProductFormOpen(false);
      setEditingProduct(null);
      setIsMobileSidebarOpen(false); // 모바일에서도 닫기
    } else if (tabId === 'customerService') {
      setActiveTab('customerService');
      setIsCustomerServiceExpanded(!isCustomerServiceExpanded);
      setIsMobileSidebarOpen(false); // 모바일에서도 닫기
    } else if (['dashboard', 'orders', 'reviews', 'coupons', 'points', 'inquiries', 'users'].includes(tabId)) {
      setActiveTab(tabId as any);
      setIsMobileSidebarOpen(false); // 모바일에서도 닫기
    }
  };

  // 환불처리 함수
  const handleRefund = (orderId: string) => {
    if (window.confirm('환불을 처리하시겠습니까?\n\n환불 처리 후에는 되돌릴 수 없습니다.')) {
      const updatedOrders = orders.map(order => {
        if (order.orderId === orderId) {
          let refundStatus = '카드결제취소';
          if (order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') {
            refundStatus = '계좌환불완료';
          }
          return { 
            ...order, 
            refundStatus,
            status: '취소'
          };
        }
        return order;
      });
      setOrders(updatedOrders);
      localStorage.setItem('orderList', JSON.stringify(updatedOrders));
      
      // paymentList도 함께 업데이트
      try {
        const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
        const updatedPayments = existingPayments.map((payment: any) => {
          if (payment.orderId === orderId) {
            let refundStatus = '카드결제취소';
            if (payment.paymentMethod === 'virtual' || payment.paymentMethod === '가상계좌') {
              refundStatus = '계좌환불완료';
            }
            return { 
              ...payment, 
              refundStatus,
              status: '취소'
            };
          }
          return payment;
        });
        localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
      } catch (error) {
        console.error('결제내역 업데이트 중 오류:', error);
      }
      
      alert('환불 처리가 완료되었습니다.');
    }
  };

  // 환불요청 거절 함수
  const rejectRefund = (orderId: string) => {
    if (window.confirm('환불요청을 거절하시겠습니까?')) {
      const updatedOrders = orders.map(order => 
        order.orderId === orderId ? { ...order, refundStatus: '환불거절' } : order
      );
      setOrders(updatedOrders);
      localStorage.setItem('orderList', JSON.stringify(updatedOrders));
      
      // paymentList도 함께 업데이트
      try {
        const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
        const updatedPayments = existingPayments.map((payment: any) => {
          if (payment.orderId === orderId) {
            return { ...payment, refundStatus: '환불거절' };
          }
          return payment;
        });
        localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
      } catch (error) {
        console.error('결제내역 업데이트 중 오류:', error);
      }
      
      alert('환불요청이 거절되었습니다.');
    }
  };

  // 작업시작 함수
  const startWork = async (orderId: string) => {
    if (window.confirm('작업을 시작하시겠습니까?\n\n작업시작 후에는 상태가 "진행 중"으로 변경됩니다.')) {
      try {
        await updateOrderStatus(orderId, '진행 중');
        alert('작업이 시작되었습니다.');
      } catch (error) {
        console.error('작업 시작 중 오류:', error);
        alert('작업 시작 중 오류가 발생했습니다.');
      }
    }
  };

  // 요청사항 수정 시작
  const startEditRequest = (orderId: string, currentRequest: string) => {
    setEditingRequestOrderId(orderId);
    setEditingRequestText(currentRequest || '');
  };

  // 요청사항 수정 취소
  const cancelEditRequest = () => {
    setEditingRequestOrderId(null);
    setEditingRequestText('');
    setExpandedRequestOrderId(null);
  };

  // 요청사항 저장
  const saveRequest = async (orderId: string) => {
    try {
      // 백엔드 API 호출
      const response = await fetch(`http://localhost:5001/api/orders/order/${orderId}/request`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: editingRequestText
        })
      });

      if (response.ok) {
        // orderList 업데이트
        const updatedOrders = orders.map(order => 
          order.orderId === orderId ? { ...order, request: editingRequestText } : order
        );
        setOrders(updatedOrders);
        localStorage.setItem('orderList', JSON.stringify(updatedOrders));
        
        // paymentList도 함께 업데이트
        try {
          const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
          const updatedPayments = existingPayments.map((payment: any) => {
            if (payment.orderId === orderId) {
              return { ...payment, request: editingRequestText };
            }
            return payment;
          });
          localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
        } catch (error) {
          console.error('결제내역 업데이트 중 오류:', error);
        }
        
        setEditingRequestOrderId(null);
        setEditingRequestText('');
        setExpandedRequestOrderId(null);
        alert('요청사항이 저장되었습니다.');
      } else {
        console.error('요청사항 저장 실패:', response.status);
        alert('요청사항 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('요청사항 저장 중 오류:', error);
      alert('요청사항 저장 중 오류가 발생했습니다.');
    }
  };

  // 요청사항 수정 관련 상태
  const [editingRequestOrderId, setEditingRequestOrderId] = useState<string | null>(null);
  const [editingRequestText, setEditingRequestText] = useState('');
  const [expandedRequestOrderId, setExpandedRequestOrderId] = useState<string | null>(null);

  // 주문 삭제 함수
  const deleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      alert('삭제할 주문을 선택해주세요.');
      return;
    }

    if (window.confirm(`선택된 ${selectedOrders.length}개의 주문을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      try {
        // 백엔드에서 선택된 주문들 삭제
        const deletePromises = selectedOrders.map(async (orderId) => {
          try {
            const response = await fetch(`http://localhost:5001/api/orders/order/${orderId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (!response.ok) {
              throw new Error(`주문 ${orderId} 삭제 실패: ${response.status}`);
            }
            
            return { orderId, success: true };
          } catch (error) {
            console.error(`주문 ${orderId} 삭제 중 오류:`, error);
            return { orderId, success: false, error };
          }
        });

        const results = await Promise.all(deletePromises);
        const successfulDeletes = results.filter(result => result.success);
        const failedDeletes = results.filter(result => !result.success);

        if (successfulDeletes.length > 0) {
          // 성공적으로 삭제된 주문들만 로컬 상태에서 제거
          const successfulOrderIds = successfulDeletes.map(result => result.orderId);
          const updatedOrders = orders.filter(order => !successfulOrderIds.includes(order.orderId));
          setOrders(updatedOrders);
          localStorage.setItem('orderList', JSON.stringify(updatedOrders));
          
          // paymentList에서도 성공적으로 삭제된 주문들 제거
          try {
            const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
            const updatedPayments = existingPayments.filter((payment: any) => !successfulOrderIds.includes(payment.orderId));
            localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
          } catch (error) {
            console.error('결제내역 삭제 중 오류:', error);
          }
          
          // 선택 상태 초기화
          setSelectedOrders([]);
          setSelectAll(false);
          
          if (failedDeletes.length > 0) {
            alert(`${successfulDeletes.length}개의 주문이 삭제되었습니다.\n${failedDeletes.length}개의 주문 삭제에 실패했습니다.`);
          } else {
            alert(`${successfulDeletes.length}개의 주문이 삭제되었습니다.`);
          }
        } else {
          alert('모든 주문 삭제에 실패했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('주문 삭제 중 오류:', error);
        alert('주문 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 개별 주문 선택/해제
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
      setSelectAll(false);
    } else {
      setSelectedOrders(currentOrders.map(order => order.orderId));
      setSelectAll(true);
    }
  };

  // 필터링된 주문이 변경될 때 전체 선택 상태 업데이트
  useEffect(() => {
    if (selectedOrders.length === currentOrders.length && currentOrders.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedOrders, currentOrders]);

  // 페이지가 변경될 때 선택된 주문들 초기화
  useEffect(() => {
    setSelectedOrders([]);
    setSelectAll(false);
  }, [currentOrderPage]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 왼쪽 사이드바 - 데스크톱 */}
      <div className={`hidden md:block rounded-r-lg bg-white shadow-lg transition-all duration-500-in-out ${
        isSidebarCollapsed ? 'w-16' : 'w-[200px]'
      }`}>
        
        <div className='flex flex-row justify-between h-[68px]'>
          {/* 로고 영역 */}
          <div className="px-4 py-4 w-full">
            {!isSidebarCollapsed ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src="/images/icon_admore.png" alt="애드모어 로고" className="w-8 h-8" />
                    <div className="transition-all duration-500 ease-in-out">
                      <h1 className="text-[20px] font-semibold text-orange-600">ADMORE</h1>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <img src="/images/icon_admore.png" alt="애드모어 로고" className="w-6 h-6 transition-all duration-500" />
              </div>
            )}
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="py-4 space-y-2 flex flex-col h-[calc(100vh-68px)]">
          {/* 메인 네비게이션 아이템들 */}
          <div className="">
            {sidebarItems.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleSidebarTabClick(item.id)}
                  className={`w-full h-12 flex items-center px-6 py-2 transition-all duration-500 ease-in-out ${
                    activeTab === item.id 
                      ? 'bg-orange-100 text-orange-600 border-r-2 border-orange-600 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className="text-sm mr-3 flex-shrink-0 transition-all duration-300" 
                  />
                  <div className={`flex-1 flex flex-row items-center text-left transition-all duration-500 ease-in-out ${
                    isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden' : 'opacity-100 max-w-full'
                  }`}>
                    <div className="whitespace-nowrap text-sm font-semibold">{item.label}</div>
                    {item.count !== undefined && (
                      <div className="bg-orange-500 text-white text-[9px] leading-4 text-center w-4 h-4 rounded-full ml-2 
                        px-[1px] whitespace-nowrap">
                        {typeof item.count === 'number' && item.count > 99 ? '99+' : item.count}
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && item.subItems && (
                    <FontAwesomeIcon 
                      icon={faCaretDown} 
                      className={`text-xs transition-transform duration-200 ${
                        isCustomerServiceExpanded ? 'rotate-180 text-orange-600' : 'text-gray-400'
                      }`} 
                    />
                  )}
                </button>
                
                {/* 접힌 상태에서 호버 툴팁 */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-3 border-b-3 border-r-3 border-transparent border-r-gray-900"></div>
                  </div>
                )}

                {/* 서브메뉴 */}
                {!isSidebarCollapsed && item.subItems && isCustomerServiceExpanded && (
                  <div className="bg-gray-100">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          setActiveTab('customerService');
                          setCustomerServiceTab(subItem.id as 'notices' | 'terms' | 'privacy');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full h-9 flex items-center px-12 py-2 rounded text-sm transition-all duration-200 hover:bg-gray-200"
                      >
                        <span className="whitespace-nowrap text-xs font-medium text-gray-700">{subItem.label}</span>
                        {subItem.count !== undefined && (
                          <span className="bg-orange-500 text-white font-bold text-[8px] leading-4 text-center min-w-[14px] h-[14px] rounded-full ml-2 px-[3px] whitespace-nowrap">
                            {typeof subItem.count === 'number' && subItem.count > 99 ? '99+' : subItem.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 하단 홈, 로그아웃 버튼 */}
          <div className="flex flex-col justify-end mt-auto pt-4 h-full">
            <div className="relative group">
              <button
                onClick={homeItem.action}
                className="w-full h-12 flex items-center px-6 py-2 rounded-lg transition-all duration-500 ease-in-out text-gray-700 hover:bg-gray-100"
                title={isSidebarCollapsed ? homeItem.label : undefined}
              >
                <FontAwesomeIcon 
                  icon={homeItem.icon} 
                  className="text-sm mr-3 flex-shrink-0 transition-all duration-300" 
                />
                <div className={`flex-1 text-left transition-all duration-500 ease-in-out ${
                  isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden' : 'opacity-100 max-w-full'
                }`}>
                  <span className="whitespace-nowrap text-sm font-semibold">{homeItem.label}</span>
                </div>
              </button>
              
              {/* 접힌 상태에서 호버 툴팁 */}
              {isSidebarCollapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out pointer-events-none whitespace-nowrap z-50">
                  {homeItem.label}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-3 border-b-3 border-r-3 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
            <div className="relative group mt-2">
              <button
                onClick={handleLogout}
                className="w-full h-12 flex items-center px-6 py-2 rounded-lg transition-all duration-500 ease-in-out text-red-600 hover:bg-gray-100"
                title={isSidebarCollapsed ? logoutItem.label : undefined}
              >
                <FontAwesomeIcon 
                  icon={logoutItem.icon} 
                  className="text-sm mr-3 flex-shrink-0 transition-all duration-300" 
                />
                <div className={`flex-1 text-left transition-all duration-500 ease-in-out ${
                  isSidebarCollapsed ? 'opacity-0 max-w-0 overflow-hidden' : 'opacity-100 max-w-full'
                }`}>
                  <span className="whitespace-nowrap text-sm font-semibold">{logoutItem.label}</span>
                </div>
              </button>
              
              {/* 접힌 상태에서 호버 툴팁 */}
              {isSidebarCollapsed && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out pointer-events-none whitespace-nowrap z-50">
                  {logoutItem.label}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-3 border-b-3 border-r-3 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {/* 배경 오버레이 */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-40 md:hidden ${
          isMobileSidebarOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      {/* 모바일 사이드바 */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className='flex flex-row justify-between h-[68px]'>
          {/* 로고 영역 */}
          <div className="px-4 py-4 w-full">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src="/images/icon_admore.png" alt="애드모어 로고" className="w-8 h-8" />
                  <div className="transition-all duration-500 ease-in-out">
                    <h1 className="text-[20px] font-semibold text-orange-600">ADMORE</h1>
                  </div>
                </div>
                {/* 모바일 닫기 버튼 */}
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faTimesIcon} className="text-gray-600 text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="py-4 space-y-2 flex flex-col h-[calc(100vh-68px)]">
          {/* 메인 네비게이션 아이템들 */}
          <div className="">
            {sidebarItems.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleSidebarTabClick(item.id)}
                  className={`w-full h-12 flex items-center px-6 py-2 transition-all duration-500 ease-in-out ${
                    activeTab === item.id 
                      ? 'bg-orange-100 text-orange-600 border-r-2 border-orange-600 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className="text-sm mr-3 flex-shrink-0 transition-all duration-300" 
                  />
                  <div className="flex-1 flex flex-row items-center text-left">
                    <div className="whitespace-nowrap text-sm font-semibold">{item.label}</div>
                    {item.count !== undefined && (
                      <div className="bg-orange-500 text-white font-bold text-[8px] leading-4 text-center w-[14px] h-[14px] rounded-full ml-2 
                          whitespace-nowrap">
                        {item.count}
                      </div>
                    )}
                  </div>
                  {item.subItems && (
                    <FontAwesomeIcon 
                      icon={faCaretDown} 
                      className={`text-xs transition-transform duration-200 ${
                        isCustomerServiceExpanded ? 'rotate-180 text-orange-600' : 'text-gray-400'
                      }`} 
                    />
                  )}
                </button>

                {/* 서브메뉴 */}
                {item.subItems && activeTab === item.id && (
                  <div className="bg-gray-100">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          setActiveTab('customerService');
                          setCustomerServiceTab(subItem.id as 'notices' | 'terms' | 'privacy');
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full h-9 flex items-center px-12 py-2 rounded text-sm transition-all duration-200 hover:bg-gray-200"
                      >
                        <span className="whitespace-nowrap text-xs font-medium text-gray-700">{subItem.label}</span>
                        {subItem.count !== undefined && (
                          <span className="bg-orange-500 text-white font-bold text-[8px] leading-4 text-center w-[14px] h-[14px] rounded-full ml-2 
                          whitespace-nowrap">
                            {subItem.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 하단 홈, 로그아웃 버튼 */}
          <div className="flex flex-col justify-end mt-auto pt-4 h-full">
            <div className="relative group">
              <button
                onClick={() => {
                  homeItem.action?.();
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full h-12 flex items-center px-6 py-2 rounded-lg transition-all duration-500 ease-in-out text-gray-700 hover:bg-gray-100"
              >
                <FontAwesomeIcon 
                  icon={homeItem.icon} 
                  className="text-sm mr-3 flex-shrink-0 transition-all duration-300" 
                />
                <div className="flex-1 text-left">
                  <span className="whitespace-nowrap text-sm font-semibold">{homeItem.label}</span>
                </div>
              </button>
            </div>
            <div className="relative group mt-2">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full h-12 flex items-center px-6 py-2 rounded-lg transition-all duration-500 ease-in-out text-red-600 hover:bg-gray-100"
              >
                <FontAwesomeIcon 
                  icon={logoutItem.icon} 
                  className="text-sm mr-3 flex-shrink-0 transition-all duration-300" 
                />
                <div className="flex-1 text-left">
                  <span className="whitespace-nowrap text-sm font-semibold">{logoutItem.label}</span>
                </div>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        )}
        
        {/* 관리자 헤더 */}
        <header className="relative bg-white shadow-none border-b border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 사이드바 토글 버튼 */}
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 flex items-center">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    // 모바일에서는 모바일 사이드바 토글
                    setIsMobileSidebarOpen(!isMobileSidebarOpen);
                  } else {
                    // 태블릿/데스크톱에서는 일반 사이드바 토글
                    setIsSidebarCollapsed(!isSidebarCollapsed);
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 mr-4 h-[40px] w-[40px]"
                title={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              >
                <FontAwesomeIcon 
                  icon={isSidebarCollapsed ? faBars : faChevronLeft}
                  className="text-gray-600 text-sm transition-transform duration-300"
                />
              </button>
            </div>

            {/* 오른쪽: 검색, 알림, 프로필 */}
            <div className="flex items-center space-x-4 ml-auto">
              {/* 검색 */}
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="검색어를 입력하세요(전체)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-[200px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none
                      focus:ring-2 focus:ring-orange-200 focus:border-transparent"
                />
              </div>

              {/* 알림 */}
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                  className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faBell} className="text-lg" />
                  <span className="absolute top-[2px] -right-1 bg-red-500 text-white text-[10px] rounded-full 
                    min-w-4 h-4 px-1 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </button>

                {/* 알림 드롭다운 */}
                {isNotificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">알림</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-orange-600 hover:text-orange-700"
                        >
                          모두 읽음 처리
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="text-sm">알림이 없습니다</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div 
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.timestamp).toLocaleString('ko-KR')}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-red-500 text-xs ml-2"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200">
                        <button 
                          onClick={() => {
                            setNotifications([]);
                            setUnreadCount(0);
                            setIsNotificationDropdownOpen(false);
                          }}
                          className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          모든 알림 지우기
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 관리자 프로필 */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-600 rounded-full hover:bg-orange-700 flex items-center justify-center 
                      transition-colors">
                    <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
                  </div>
                  {/* <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">관리자</p>
                    <p className="text-xs text-gray-500">admin@admore.com</p>
                  </div> */}
                  {/* <FontAwesomeIcon icon={faCaretDown} className="text-gray-400 text-sm" /> */}
                </button>

                {/* 프로필 드롭다운 */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>
                    <div className="hidden py-2">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        프로필 설정
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        계정 설정
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        도움말
                      </button>
                    </div>
                    <div className="py-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* breadcrumb */}
            {activeTab !== 'dashboard' && (
              <div className="mb-6">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li>
                      <div className="flex items-center">
                        <a href="/admin" className="flex items-center">
                        <FontAwesomeIcon icon={faHome} className="text-[10px] text-gray-500 md:mr-2" />
                        </a>
                        <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-gray-400" />
                        <span className="ml-1 text-xs font-medium text-gray-500 md:ml-2">
                          {/* {activeTab === 'dashboard' && '대시보드'} */}
                          {activeTab === 'products' && '상품 관리'}
                          {activeTab === 'orders' && '주문 관리'}
                          {activeTab === 'reviews' && '리뷰 관리'}
                          {activeTab === 'coupons' && '쿠폰 관리'}
                          {activeTab === 'points' && '포인트 관리'}
                          {activeTab === 'customerService' && '고객센터'}
                          {activeTab === 'inquiries' && '1:1문의'}
                          {activeTab === 'users' && '회원 관리'}
                        </span>
                      </div>
                    </li>
                    {activeTab === 'customerService' && (
                      <li aria-current="page">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-gray-400" />
                          <span className="ml-2 text-xs font-medium text-gray-500">
                            {customerServiceTab === 'notices' && '공지사항'}
                            {customerServiceTab === 'terms' && '이용약관'}
                            {customerServiceTab === 'privacy' && '개인정보취급방침'}
                          </span>
                        </div>
                      </li>
                    )}
                    {activeTab === 'products' && isProductFormOpen && (
                      <li aria-current="page">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-gray-400" />
                          <span className="ml-2 text-xs font-medium text-gray-500">
                            {editingProduct ? '상품 수정' : '상품 등록'}
                          </span>
                        </div>
                      </li>
                    )}
                  </ol>
                </nav>
                
              </div>
            )}

            {/* 대시보드 탭 */}
            {activeTab === 'dashboard' && (

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* 대쉬보드 좌측 */}
                <div className="w-full"> 
                  {/* 통계 카드 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center">
                          <FontAwesomeIcon icon={faBox} className="text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">전체 주문</p>
                          <p className="text-xl font-bold">{totalOrders} 
                            <span className="text-xs text-gray-400 ml-1">건</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* 결제완료후 작업시작전 대기중 상태 */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg w-10 h-10 flex items-center justify-center">
                          <FontAwesomeIcon icon={faEye} className="text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">대기중</p>
                          <p className="text-xl font-bold">{orders.filter(o => o.status === '대기중').length} 
                            <span className="text-xs text-gray-400 ml-1">건</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 작업완료 상태 */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg w-10 h-10 flex items-center justify-center">
                          <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">작업완료</p>
                          <p className="text-xl font-bold">{orders.filter(o => o.status === '작업완료').length}
                            <span className="text-xs text-gray-400 ml-1">건</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 작업취소 상태 */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg w-10 h-10 flex items-center justify-center">
                          <FontAwesomeIcon icon={faTimes} className="text-red-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">작업취소</p>
                          <p className="text-xl font-bold">{orders.filter(o => o.status === '작업취소').length}
                            <span className="text-xs text-gray-400 ml-1">건</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 상세 통계 */}
                  <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <div className="bg-white rounded-lg shadow p-4 flex flex-row gap-4 justify-between w-full">
                      <div className="w-full">
                        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                          <FontAwesomeIcon icon={faChartPie} className="text-gray-600 w-4 h-4" />
                          주문 통계
                        </h3>
                        <div className="space-y-2 text-sm px-2 max-w-[80%]">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">전체 주문</span>
                            <span className="font-semibold">{totalOrders}건</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">신용카드</span>
                            <span className="font-semibold text-blue-600">{orders.filter(o => o.paymentMethod === 'card').length}건</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">가상계좌</span>
                            <span className="font-semibold text-yellow-600">{orders.filter(o => o.paymentMethod === 'virtual').length}건</span>
                          </div>
                          
                          
                        </div>
                      </div>
                      {/* 차트 */}
                      <div className="flex items-center justify-center">
                        <div className="p-2 w-48 h-32">
                          <Bar
                            data={{
                              labels: ['신용카드', '가상계좌'],
                              datasets: [{
                                label: '주문 수',
                                data: [
                                  orders.filter(o => o.paymentMethod === 'card').length,
                                  orders.filter(o => o.paymentMethod === 'virtual').length,
                                ],
                                backgroundColor: [
                                  '#3B82F6', // blue
                                  '#FCD34D', // yellow
                                ],
                                borderColor: [
                                  '#2563EB', // darker blue
                                  '#F59E0B', // darker yellow
                                ],
                                borderWidth: 1,
                                borderRadius: 4,
                                borderSkipped: false,
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `${context.parsed.y}건`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                      return value + '건';
                                    }
                                  },
                                  grid: {
                                    color: '#E5E7EB'
                                  }
                                },
                                x: {
                                  grid: {
                                    display: false
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-4 flex flex-row gap-4 justify-between w-full">
                      <div className="w-full">
                        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                          <FontAwesomeIcon icon={faTasks} className="text-gray-600 w-4 h-4" />
                          작업현황
                        </h3>
                        <div className="space-y-2 text-sm px-2 max-w-[80%]">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">대기중</span>
                            <span className="font-semibold text-yellow-600">
                              {orders.filter(o => o.status === '대기중').length}건
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">진행 중</span>
                            <span className="font-semibold text-orange-600">
                              {orders.filter(o => o.status === '진행 중').length}건
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">작업완료</span>
                            <span className="font-semibold text-green-600">{orders.filter(o => o.status === '작업완료').length}건</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">구매확정</span>
                            <span className="font-semibold text-purple-600">{orders.filter(o => o.confirmStatus === '구매확정완료' || o.confirmStatus === '구매완료').length}건</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">작업취소</span>
                            <span className="font-semibold text-red-600">{orders.filter(o => o.status === '작업취소').length}건</span>
                          </div>
                        </div>
                      </div>
                      {/* 차트 */}
                      <div className="flex items-center justify-center">
                        <div className="p-2 w-40 h-40">
                          <Doughnut
                            data={{
                              labels: ['대기중', '진행 중', '작업완료', '리뷰확인', '구매확정', '작업취소'],
                              datasets: [{
                                data: [
                                  orders.filter(o => o.status === '대기중').length,
                                  orders.filter(o => o.status === '진행 중').length,
                                  orders.filter(o => o.status === '작업완료').length,
                                  orders.filter(o => o.status === '리뷰확인').length,
                                  orders.filter(o => o.confirmStatus === '구매확정완료' || o.confirmStatus === '구매완료').length,
                                  orders.filter(o => o.status === '작업취소').length
                                ],
                                backgroundColor: [
                                  '#FCD34D', // yellow (대기중)
                                  '#F59E0B', // orange (진행 중)
                                  '#10B981', // green (작업완료)
                                  '#3B82F6', // blue (리뷰확인)
                                  '#8B5CF6', // purple (구매확정)
                                  '#EF4444'  // red (작업취소)
                                ],
                                borderWidth: 2,
                                borderColor: '#fff'
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: false
                                }
                              },
                              cutout: '60%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 최근 주문내용 */}
                  <div className="bg-white rounded-lg shadow py-6 px-6 mb-4 ">
                    <div className="flex flex-row gap-2 justify-between mb-4">
                      <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faListUl} className="text-gray-600 w-4 h-4" />
                        최근 주문내용
                      </h3>
                      {/* 최근 주문내용 필터 */}
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          className={`px-2 py-1 ${recentOrdersFilter === 'paid' ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}
                          onClick={() => setRecentOrdersFilter('paid')}
                        >
                          결제완료
                        </button>
                        <span className="text-gray-400 text-xs w-0.5 h-0.5 bg-gray-400 rounded-full"></span>
                        <button
                          className={`px-2 py-1 ${recentOrdersFilter === 'unpaid' ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}
                          onClick={() => setRecentOrdersFilter('unpaid')}
                        >
                          입금전
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-sm" style={{ minWidth: '400px' }}>
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-2 px-2 font-medium text-gray-700" style={{ minWidth: '100px' }}>주문일시</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-700" style={{ minWidth: '120px' }}>주문번호</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-700" style={{ minWidth: '100px' }}>주문자</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-700" style={{ minWidth: '120px' }}>상품정보</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-700" style={{ minWidth: '60px' }}>수량</th>
                            <th className="text-right py-2 px-2 font-medium text-gray-700" style={{ minWidth: '80px' }}>결제금액</th>
                            <th className="text-center py-2 px-2 font-medium text-gray-700" style={{ minWidth: '80px' }}>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecentOrders.slice(0, 10).map((order) => (
                            <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-2 text-xs text-gray-600">
                                {order.date ? new Date(order.date).toLocaleString('ko-KR', { 
                                  year: '2-digit', 
                                  month: '2-digit', 
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }).replace(/\. /g, '.').replace(/\.(\d{2}:\d{2})/, '. $1') : '날짜 없음'}
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-600">
                                <div>
                                  <div>{order.orderId}</div>
                                  <span className="text-gray-500 text-xs">(PAY-{order.orderId.replace('-', '')})</span>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-600">
                                <div>
                                  <div className="text-xs text-gray-500 font-medium">
                                    {(() => {
                                      // users 데이터가 로드된 후에만 사용자 이름 찾기
                                      if (users.length > 0) {
                                        const user = users.find(u => u.email === order.userEmail);
                                        console.log('주문자 정보:', {
                                          orderEmail: order.userEmail,
                                          foundUser: user,
                                          allUsers: users.length
                                        });
                                        return user ? user.name : (order.userName || '이름 없음');
                                      } else {
                                        // users 데이터가 아직 로드되지 않은 경우
                                        return order.userName || '로딩 중...';
                                      }
                                    })()}
                                  </div>
                                  <div className="text-xs text-gray-400">{order.userEmail || '이메일 없음'}</div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-800">
                                <div>
                                  {order.productNumber && (
                                    <div className="text-[10px] text-gray-500 mb-1">상품번호: {order.productNumber}</div>
                                  )}
                                  <div className="font-medium">{order.product}</div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-600">
                                {order.quantity}일
                              </td>
                              <td className="py-2 px-2 text-xs text-blue-600 font-semibold text-right">
                                <div>
                                  <div>{typeof order.price === 'string' ? 
                                    order.price.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 
                                    String(order.price || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
                                  {order.originalPrice && order.originalPrice !== order.price && (
                                    <div className="text-gray-400 line-through text-[10px]">
                                      {typeof order.originalPrice === 'string' ? 
                                        order.originalPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 
                                        String(order.originalPrice || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  (() => {
                                    // 신용카드 주문시 결제완료 표시
                                    if ((order.paymentMethod === 'card' || order.paymentMethod === '신용카드') && 
                                        order.paymentDate && order.paymentDate !== '-') {
                                      return 'bg-green-100 text-green-800';
                                    }
                                    // 가상계좌 주문시 입금여부에 따라 표시
                                    if ((order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌')) {
                                      if (!order.paymentDate || order.paymentDate === '-') {
                                        return 'bg-yellow-100 text-yellow-800'; // 입금전
                                      } else {
                                        return 'bg-green-100 text-green-800'; // 입금완료
                                      }
                                    }
                                    // 기본 상태 표시
                                    return order.status === '대기중' ? 'bg-yellow-100 text-yellow-800' :
                                           order.status === '진행 중' ? 'bg-orange-100 text-orange-800' :
                                           order.status === '작업완료' ? 'bg-green-100 text-green-800' :
                                           order.status === '구매확정' ? 'bg-blue-100 text-blue-800' :
                                           order.status === '작업취소' ? 'bg-red-100 text-red-800' :
                                           'bg-gray-100 text-gray-800';
                                  })()
                                }`}>
                                  {(() => {
                                    // 신용카드 주문시 결제완료 표시
                                    if ((order.paymentMethod === 'card' || order.paymentMethod === '신용카드') && 
                                        order.paymentDate && order.paymentDate !== '-') {
                                      return '결제완료';
                                    }
                                    // 가상계좌 주문시 입금여부에 따라 표시
                                    if ((order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌')) {
                                      if (!order.paymentDate || order.paymentDate === '-') {
                                        return '입금전';
                                      } else {
                                        return '입금완료';
                                      }
                                    }
                                    // 기본 상태 표시
                                    return order.status;
                                  })()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
                {/* 대쉬보드 우측 */}
                <div className=" min-w-[300px] flex flex-col gap-6">
                  {/* 가입회원수 */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col">
                      <div className="flex items-center mb-4 gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400 w-3 h-3" />
                        <p className="text-sm text-gray-600">가입회원 수</p>
                      </div>
                      <div className="flex flex-row gap-2 items-center justify-start">
                        <div className="flex items-center justify-center">
                          <p className="text-xs font-semibold text-gray-800 mr-2">일반회원</p>
                          <p className="text-sm font-semibold text-orange-600">{totalUsers}</p>
                          <p className="text-xs text-gray-500 ml-1">명</p>
                        </div>
                        <span className="text-gray-400 text-xs">|</span>
                        <div className="flex items-center justify-center">
                          <p className="text-xs font-semibold text-gray-800 mr-2">관리자</p>
                          <p className="text-sm font-semibold text-orange-600">{users.filter(u => u.role === 'admin').length}</p>
                          <p className="text-xs text-gray-500 ml-1">명</p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* 최근 활동 */}
                  <div className="bg-white rounded-lg shadow py-4 px-4 overflow-hidden">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faHistory} className="text-gray-600 w-4 h-4" />
                      최근 활동
                    </h3>
                    <div ref={recentActivityRef} className="space-y-2 min-h-[100px] max-h-[330px] overflow-y-hidden pr-1">
                      {/* 최근 주문 활동 */}
                      {orders.slice(0, 5).map((order, index) => (
                        <div 
                          key={order.orderId} 
                          className="recent-activity-item flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faBox} className="text-blue-500 text-xs" />
                              <p className="font-medium text-sm text-gray-800">{order.product}</p>
                              <span className={`px-2 py-1 text-[10px] rounded-full ${
                                order.status === '대기중' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === '진행 중' ? 'bg-orange-100 text-orange-800' :
                                order.status === '작업완료' ? 'bg-green-100 text-green-800' :
                                order.status === '리뷰확인' ? 'bg-blue-100 text-blue-800' :
                                order.status === '작업취소' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-1 ">
                              <p className="text-xs text-gray-500">주문번호: {order.orderId}</p>
                              <p className="text-xs text-gray-400">
                                {order.date ? new Date(order.date).toLocaleString('ko-KR', { 
                                  month: '2-digit', 
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }).replace(/\. /g, '.').replace(/\.(\d{2}:\d{2})/, '. $1') : ''}
                              </p>
                            </div>
                          </div>
                          
                        </div>
                      ))}
                      
                      {/* 최근 리뷰 활동 */}
                      {reviews.slice(0, 3).map((review, index) => (
                        <div 
                          key={review.id} 
                          className="recent-activity-item flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-xs" />
                              <p className="font-medium text-sm text-gray-800">{review.product}</p>
                              <div className="flex items-center gap-0">
                                {[...Array(5)].map((_, i) => (
                                  <FontAwesomeIcon 
                                    key={i} 
                                    icon={i < review.rating ? faStar : faStar} 
                                    className={`text-[10px] ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-1">
                              <p className="text-xs text-gray-500">작성자: {review.user}</p>
                              <p className="text-xs text-gray-400">
                                {review.time ? new Date(review.time).toLocaleString('ko-KR', { 
                                  month: '2-digit', 
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }).replace(/\. /g, '.').replace(/\.(\d{2}:\d{2})/, '. $1') : ''}
                              </p>
                            </div>
                          </div>
                          
                        </div>
                      ))}
                      
                      {/* 최근 문의 활동 */}
                      {chatMessages.slice(0, 2).map((message, index) => (
                        <div 
                          key={message.id} 
                          className="recent-activity-item flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faComments} className="text-purple-500 text-xs" />
                              <p className="font-medium text-sm text-gray-800">1:1 문의</p>
                              <span className={`px-2 py-1 text-[10px] rounded-full ${
                                message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                message.status === 'answered' ? 'bg-green-100 text-green-800' :
                                message.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {message.status === 'pending' ? '대기중' :
                                message.status === 'answered' ? '답변완료' :
                                message.status === 'closed' ? '종료' : '문의'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-1">
                              <p className="text-xs text-gray-500">사용자: {(() => {
                                // 세션아이디(공백 포함 슬래시/괄호 등) 제거하고 이메일만 남김
                                const emailMatch = (message.user || '').match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
                                return emailMatch ? emailMatch[0] : message.user;
                              })()}</p>
                              <p className="text-xs text-gray-400">
                                {message.timestamp ? new Date(message.timestamp).toLocaleString('ko-KR', { 
                                  month: '2-digit', 
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                }).replace(/\. /g, '.').replace(/\.(\d{2}:\d{2})/, '. $1') : ''}
                              </p>
                            </div>
                          </div>
                          
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 리뷰 & 문의 통계 */}
                  <div className="bg-white rounded-lg shadow p-4">
                      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                        리뷰 & 문의
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">전체 리뷰</span>
                            <span className="font-semibold">{reviews.length}건</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">평균 평점</span>
                            <span className="font-semibold text-orange-600">
                              {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}점
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">문의내역</span>
                            <span className="font-semibold">{chatMessages.length}건</span>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                </div>
                
              </div>
            )}

            {/* 주문 관리 탭 */}
            {activeTab === 'orders' && (
              <div className="pb-12">
                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FontAwesomeIcon icon={faBox} className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">전체 주문</p>
                        <p className="text-xl font-bold">{totalOrders}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <FontAwesomeIcon icon={faEye} className="text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">가상계좌발급</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.paymentMethod === '가상계좌' && (!o.paymentDate || o.paymentDate === '-')).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">작업완료</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '작업완료' && o.confirmStatus !== '구매완료').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FontAwesomeIcon icon={faStar} className="text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">구매완료</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '작업완료' && o.confirmStatus === '구매완료').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 검색 및 필터 */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex items-center gap-2">
                      <div className="relative order-status-dropdown">
                        <button
                          onClick={() => setIsOrderStatusDropdownOpen(!isOrderStatusDropdownOpen)}
                          className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-gray-500
                          focus:ring-orange-500 focus:border-transparent bg-white text-left min-w-[140px] 
                          flex items-center justify-between"
                        >
                          <span className="truncate">
                            {statusFilter === 'all' ? '전체 상태' : statusFilter}
                          </span>
                          <FontAwesomeIcon 
                            icon={faCaretDown} 
                            className={`text-gray-400 transition-transform ${isOrderStatusDropdownOpen ? 'rotate-180' : ''} text-xs ml-2 flex-shrink-0`}
                          />
                        </button>
                        
                        {isOrderStatusDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                            <div className="py-1">
                              <button
                                onClick={() => { setStatusFilter('all'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                전체 상태
                              </button>
                              <button
                                onClick={() => { setStatusFilter('입금완료'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                입금완료
                              </button>
                              <button
                                onClick={() => { setStatusFilter('결제완료'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                결제완료
                              </button>
                              <button
                                onClick={() => { setStatusFilter('결제취소'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                결제취소
                              </button>
                              <button
                                onClick={() => { setStatusFilter('대기중'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                대기중
                              </button>
                              <button
                                onClick={() => { setStatusFilter('진행 중'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                진행 중
                              </button>
                              <button
                                onClick={() => { setStatusFilter('작업완료'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                작업완료
                              </button>
                              <button
                                onClick={() => { setStatusFilter('작업취소'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                작업취소
                              </button>
                              <button
                                onClick={() => { setStatusFilter('취소'); setIsOrderStatusDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="검색어를 입력하세요."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="text-sm w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none 
                              max-w-[300px] min-w-[200px]
                              focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      
                    </div>
                    {/* 새로고침 버튼 */}
                    <button
                        onClick={loadOrders}
                        className="text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 flex items-center gap-2"
                        title="주문 목록 새로고침"
                      >
                        <FontAwesomeIcon icon={faSync} className="text-gray-400" />
                      </button>
                    {/* 선택된 주문 삭제 버튼 */}
                    {selectedOrders.length > 0 && (
                      <button
                        onClick={deleteSelectedOrders}
                        className="text-sm px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 transition-colors duration-200 flex items-center gap-2"
                        title={`선택된 ${selectedOrders.length}개 주문 삭제`}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-red-400" />
                        삭제 ({selectedOrders.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* 주문 테이블 */}
                <div className="overflow-hidden">
                  <div className="bg-white rounded-lg border overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="rounded-t-lg border-b border-gray-300">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                          </th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">주문번호(결제번호)</th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">주문자</th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">상품정보</th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">가격정보</th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">주문일</th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">결제방법</th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">상태</th>
                          <th className="px-3 sm:px-6 py-4 text-left text-xs text-gray-600 font-semibold uppercase tracking-wider">관리</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentOrders.map((order) => (
                          <tr key={order.orderId} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order.orderId)}
                                onChange={() => toggleOrderSelection(order.orderId)}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                              {order.orderId}
                              <br />
                              <span className="text-gray-500 text-xs">(PAY-{order.orderId.replace('-', '')})</span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-900">
                              <div>
                                <div className="text-xs text-gray-500">{order.userEmail || '이메일 없음'}</div>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 min-w-[250px] max-w-[300px]">
                              {order.productNumber && (
                                <div className="text-[10px] text-gray-500 mb-1">상품번호: {order.productNumber}</div>
                              )}
                              <Link
                                to={`/products/${order.productId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-800 hover:underline font-medium"
                                title="상품 상세 페이지로 이동 (새 창)"
                              >
                                {order.product}
                              </Link>
                              <br />
                              <span className="text-xs text-gray-500">{order.detail}</span>
                              <br />
                              <span className="text-xs text-gray-500 font-semibold">수량: {order.quantity}일</span>
                              <div className="mt-1 p-2 bg-white border border-gray-300 rounded text-xs flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                  <span className="block font-semibold text-gray-700 text-xs">요청사항</span>
                                  {editingRequestOrderId === order.orderId ? (
                                    <div className="flex gap-1">
                                      
                                      <button
                                        onClick={cancelEditRequest}
                                        className="text-[10px] text-gray-600 px-2 py-1 rounded hover:text-gray-700 flex items-center gap-1"
                                      >
                                        <FontAwesomeIcon icon={faTimes} className="w-2 h-2" />
                                      </button>
                                      <button
                                        onClick={() => saveRequest(order.orderId)}
                                        className="text-[10px] text-green-600 px-2 py-1 rounded hover:text-green-700 flex items-center gap-1"
                                      >
                                        <FontAwesomeIcon icon={faCheck} className="w-2 h-2" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEditRequest(order.orderId, order.request || '')}
                                      className="text-[10px] text-gray-500 px-2 py-1 rounded hover:text-gray-700 flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faEdit} className="w-2 h-2" />
                                    </button>
                                  )}
                                </div>
                                {editingRequestOrderId === order.orderId ? (
                                  <textarea
                                    value={editingRequestText}
                                    onChange={(e) => setEditingRequestText(e.target.value)}
                                    className="w-full p-2 border border-blue-300 rounded text-xs resize-none"
                                    rows={3}
                                    placeholder="고객의 요청사항을 입력하세요."
                                    autoFocus
                                  />
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <div className={`${expandedRequestOrderId === order.orderId ? 'max-h-none' : 'max-h-4 overflow-hidden'} transition-all duration-300 ease-in-out`}>
                                      <span className={`block ${order.request ? 'text-gray-500' : 'text-gray-400 italic'}`}>
                                        {order.request || '요청사항 없음'}
                                      </span>
                                    </div>
                                    {order.request && order.request.length > 30 && (
                                      <button
                                        onClick={() => setExpandedRequestOrderId(expandedRequestOrderId === order.orderId ? null : order.orderId)}
                                        className="text-[10px] text-gray-500 hover:text-gray-700 self-start transition-colors duration-200"
                                      >
                                        {expandedRequestOrderId === order.orderId ? '접기' : '더보기'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>                                                        
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div 
                                className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                                onClick={() => {
                                  const originalPrice = order.originalPrice || order.price;
                                  const finalPrice = order.finalPrice || order.price;
                                  
                                  // 할인 내역 분석
                                  let discountDetails = '';
                                  
                                  // 즉시할인 (기간별 할인) - originalPrice와 price의 차이
                                  if (order.originalPrice && order.originalPrice !== order.price) {
                                    const originalPriceNum = typeof order.originalPrice === 'string' ? 
                                      parseInt(order.originalPrice.replace(/[^\d]/g, '')) : order.originalPrice;
                                    const priceNum = typeof order.price === 'string' ? 
                                      parseInt(order.price.replace(/[^\d]/g, '')) : order.price;
                                    const immediateDiscount = originalPriceNum - priceNum;
                                    if (immediateDiscount > 0) {
                                      discountDetails += `즉시 할인: ${immediateDiscount.toLocaleString()}원\n`;
                                    }
                                  }
                                  
                                  // 쿠폰할인
                                  if (order.discountPrice && order.discountPrice !== '0' && order.discountPrice !== '0원') {
                                    discountDetails += `쿠폰 할인: ${order.discountPrice}\n`;
                                  }
                                  
                                  // 포인트 사용
                                  if (order.points && order.points > 0) {
                                    discountDetails += `포인트 사용: ${order.points.toLocaleString()}원\n`;
                                  }
                                  
                                  if (!discountDetails) {
                                    discountDetails = '할인 없음';
                                  }
                                  
                                  const discountInfo = `
  할인 내역

  원가: ${typeof originalPrice === 'string' ? 
    parseInt(originalPrice).toLocaleString() + '원' : 
    (originalPrice as number)?.toLocaleString() + '원'}
  ${discountDetails}
  최종가격: ${typeof finalPrice === 'number' ? finalPrice.toLocaleString() + '원' : finalPrice}

  수량: ${order.quantity}일
                                  `.trim();
                                  
                                  alert(discountInfo);
                                }}
                                title="할인 내역 보기"
                              >
                                <div className="flex flex-col items-end">
                                  {order.originalPrice && order.originalPrice !== order.price && (
                                    <span className="line-through text-gray-400 text-xs">
                                      {typeof order.originalPrice === 'string' ? 
                                        parseInt(order.originalPrice).toLocaleString() + '원' : 
                                        (order.originalPrice as number)?.toLocaleString() + '원'}
                                    </span>
                                  )}
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
                                          <span className="text-green-600 text-xs">
                                            할인: {immediateDiscount.toLocaleString()}원
                                          </span>
                                        );
                                      }
                                    }
                                    return null;
                                  })()}
                                  {order.discountPrice && order.discountPrice !== '0' && order.discountPrice !== '0원' && (
                                    <span className="text-green-600 text-xs">
                                      쿠폰할인: {order.discountPrice}
                                    </span>
                                  )}
                                  {order.points && order.points > 0 && (
                                    <span className="text-blue-600 text-xs">
                                      포인트: {order.points.toLocaleString()}원
                                    </span>
                                  )}
                                  <span className="font-semibold text-red-600">
                                    {(() => {
                                      const priceValue = order.finalPrice || order.price;
                                      if (typeof priceValue === 'number') {
                                        return priceValue.toLocaleString() + '원';
                                      } else if (typeof priceValue === 'string') {
                                        const priceNumber = parseInt(priceValue.replace(/[^\d]/g, '')) || 0;
                                        return priceNumber.toLocaleString() + '원';
                                      }
                                      return '0원';
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                              {(() => {
                                try {
                                  // null, undefined, 빈 문자열 처리
                                  if (!order.date || order.date === '') {
                                    const now = new Date();
                                    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
                                    return koreanTime.toLocaleString('ko-KR', {
                                      year: '2-digit',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false
                                    });
                                  }
                                  
                                  // 이미 포맷된 한국어 날짜 문자열인지 확인
                                  if (typeof order.date === 'string' && (order.date.includes('오전') || order.date.includes('오후') || order.date.includes('년'))) {
                                    return order.date;
                                  }
                                  
                                  // ISO 형식이나 다른 형식의 날짜인 경우 파싱
                                  let date = new Date(order.date);
                                  
                                  // 파싱이 실패한 경우 현재 시간 사용
                                  if (isNaN(date.getTime())) {
                                    date = new Date();
                                  }
                                  
                                  // 한국 시간대로 변환 (UTC+9)
                                  const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
                                  
                                  return koreanTime.toLocaleString('ko-KR', {
                                    year: '2-digit',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  });
                                } catch (error) {
                                  // 에러 발생 시 현재 시간으로 표시
                                  const now = new Date();
                                  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
                                  return koreanTime.toLocaleString('ko-KR', {
                                    year: '2-digit',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  });
                                }
                              })()}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500 min-w-[80px]">
                              {order.paymentMethod === 'card' ? '신용카드' : 
                               order.paymentMethod === 'virtual' ? '가상계좌' : 
                               order.paymentMethod || '신용카드'}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                {/* 결제상태 */}
                                <div>
                                  {(() => {
                                    let label = '';
                                    let color = '';
                                    if (order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') {
                                      if (order.paymentDate && order.paymentDate !== '-' && order.paymentDate !== order.date) {
                                        label = '입금완료';
                                        color = 'bg-green-100 text-green-600';
                                      } else {
                                        label = '입금전';
                                        color = 'bg-yellow-100 text-yellow-600';
                                      }
                                    } else if (order.paymentMethod === 'card' || order.paymentMethod === '신용카드') {
                                      label = '결제완료';
                                      color = 'bg-blue-50 text-blue-500';
                                    } else {
                                      label = '결제완료';
                                      color = 'bg-blue-50 text-blue-500';
                                    }
                                    return (
                                      <span className={`inline-flex text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
                                        {label}
                                      </span>
                                    );
                                  })()}
                                </div>
                                {/* 주문상태 */}
                                <div>
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    order.status === '작업완료' || order.status === '리뷰확인' ? 'bg-green-100 text-green-800' :
                                    order.status === '진행 중' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === '작업취소' ? 'bg-red-100 text-red-800' :
                                    order.status === '취소' ? 'bg-red-100 text-red-800' :
                                    order.status === '대기중' ? 'bg-gray-100 text-gray-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status === '리뷰확인' ? '작업완료' : order.status}
                                  </span>
                                </div>
                                
                                
                              </div>
                            </td>
                            {/* 테이블 관리 */}
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium min-w-[200px]">
                              <div className="flex flex-col gap-1">
                                {/* 결제내역 버튼 - 항상 표시 */}
                                <button
                                  onClick={() => setSelectedPaymentOrder(order)}
                                  className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                                >
                                  결제내역
                                </button>
                                
                                {/* 입금확인전 상태일 때 입금확인 버튼 */}
                                {((order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') && 
                                  (!order.paymentDate || order.paymentDate === '-')) && (
                                  <button
                                    onClick={() => confirmPayment(order.orderId)}
                                    className="text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                                  >
                                    입금확인
                                  </button>
                                )}
                                
                                {/* 입금완료 상태일 때 입금취소 버튼 */}
                                {((order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') && 
                                  order.paymentDate && order.paymentDate !== '-') && (
                                  <button
                                    onClick={() => cancelPayment(order.orderId)}
                                    className="text-orange-600 hover:text-orange-900 text-xs px-2 py-1 rounded border border-orange-300 hover:bg-orange-50"
                                  >
                                    입금취소
                                  </button>
                                )}
                                
                                {/* 작업 관련 버튼들 */}
                                <div className="flex flex-row gap-1">
                                  {/* 입금완료/결제완료 상태이고 대기중이거나 작업취소일 때 작업시작 버튼 */}
                                  {(() => {
                                    const isPaymentCompleted = 
                                      ((order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') && 
                                       order.paymentDate && order.paymentDate !== '-') ||
                                      ((order.paymentMethod === 'card' || order.paymentMethod === '신용카드') && 
                                       order.paymentDate && order.paymentDate !== '-');
                                    
                                    return isPaymentCompleted && (order.status === '대기중' || order.status === '작업취소');
                                  })() && (
                                    <button
                                      onClick={() => startWork(order.orderId)}
                                      className="flex-1 text-white bg-orange-600 hover:bg-orange-700 text-xs px-2 py-1 rounded border border-orange-600"
                                    >
                                      작업시작
                                    </button>
                                  )}
                                  
                                  {/* 진행 중 상태일 때 작업완료, 작업취소 버튼 */}
                                  {order.status === '진행 중' && (
                                    <>
                                      <button
                                        onClick={() => updateOrderStatus(order.orderId, '작업완료', '구매확정 대기 중')}
                                        className="flex-1 text-white bg-green-600 hover:bg-green-700 text-xs px-2 py-1 rounded border border-green-600"
                                      >
                                        작업완료
                                      </button>
                                      <button
                                        onClick={() => updateOrderStatus(order.orderId, '작업취소')}
                                        className="flex-1 text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                                      >
                                        작업취소
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* 작업완료/리뷰확인 상태일 때 작업완료취소 버튼 */}
                                  {(order.status === '작업완료' || order.status === '리뷰확인') && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm('작업완료를 취소하시겠습니까?\n\n진행 중 상태로 되돌립니다.')) {
                                          const updatedOrders = orders.map(o => 
                                            o.orderId === order.orderId ? { ...o, status: '진행 중' } : o
                                          );
                                          setOrders(updatedOrders);
                                          localStorage.setItem('orderList', JSON.stringify(updatedOrders));
                                          
                                          try {
                                            const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
                                            const updatedPayments = existingPayments.map((payment: any) => {
                                              if (payment.orderId === order.orderId) {
                                                return { ...payment, status: '진행 중' };
                                              }
                                              return payment;
                                            });
                                            localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
                                          } catch (error) {
                                            console.error('결제내역 업데이트 중 오류:', error);
                                          }
                                          
                                          alert('작업완료가 취소되었습니다.');
                                        }
                                      }}
                                      className="flex-1 text-orange-600 hover:text-orange-900 bg-orange-0 hover:bg-orange-100 text-xs px-2 py-1 rounded border border-orange-600"
                                    >
                                      작업완료취소
                                    </button>
                                  )}
                                </div>
                                {/* 구매확정 상태 텍스트 */}
                                {(order.status === '작업완료' || order.status === '리뷰확인') && order.confirmStatus !== '구매완료' && order.confirmStatus !== '구매확정완료' && (
                                  <div className="text-xs text-gray-400 px-2 py-1 text-center">
                                    구매확정 대기 중
                                  </div>
                                )}
                                {(order.status === '작업완료' || order.status === '리뷰확인') && (order.confirmStatus === '구매확정완료' || order.confirmStatus === '구매완료') && (
                                  <div className="text-xs text-green-600 px-2 py-1 text-center font-semibold">
                                    구매확정 완료
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 주문 관리 페이지네이션 */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentOrderPage}
                      totalPages={totalOrderPages}
                      onPageChange={setCurrentOrderPage}
                      totalItems={filteredOrders.length}
                      itemsPerPage={ordersPerPage}
                      className="justify-between"
                      showInfo={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 리뷰 관리 탭 */}
            {activeTab === 'reviews' && (
              <ReviewManagement 
                reviews={reviews} 
                onReviewsChange={setReviews}
              />
            )}

            {/* 쿠폰 관리 탭 */}
            {activeTab === 'coupons' && (
              <CouponManagement />
            )}

            {/* 포인트 관리 탭 */}
            {activeTab === 'points' && (
              <PointManagement />
            )}

            {/* 상품 관리 탭 */}
            {activeTab === 'products' && (
              <ProductManagement 
                products={products} 
                onProductsChange={handleProductsChange}
                onFormStateChange={handleProductFormStateChange}
              />
            )}

            {/* 고객센터 탭 */}
            {activeTab === 'customerService' && (
              <CustomerServiceManagement 
                chatMessages={chatMessages}
                onChatMessagesChange={setChatMessages}
                initialTab={customerServiceTab}
              />
            )}

            {/* 1:1문의 탭 */}
            {activeTab === 'inquiries' && (
              <InquiryManagement 
                chatMessages={chatMessages}
                onChatMessagesChange={updateChatMessages}
                users={users}
                sendMessage={sendMessage}
              />
            )}

            {/* 회원 관리 탭 */}
            {activeTab === 'users' && (
              <div>
                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">전체 회원</p>
                        <p className="text-xl font-bold">{users.length} 명</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FontAwesomeIcon icon={faUser} className="text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">관리자</p>
                        <p className="text-xl font-bold">{users.filter(u => u.role === 'admin').length} 명</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">활성 회원</p>
                        <p className="text-xl font-bold">{users.filter(u => u.status === 'active').length} 명</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <FontAwesomeIcon icon={faEye} className="text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">일반회원</p>
                        <p className="text-xl font-bold">{users.filter(u => u.role === 'user').length} 명</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 검색 및 필터 */}
                <div className="mb-2">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* 검색 */}
                    <div className="flex-1">
                      <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="검색어를 입력해주세요."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm max-w-[200px]
                            focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    
                    {/* 역할 필터 */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                          className="flex items-center justify-between px-3 py-2 pr-4 border border-gray-300 rounded-lg
                              bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer w-[120px]"
                        >
                          <span className="text-gray-700 block text-sm">
                            {userRoleFilter === 'all' ? '회원구분' : userRoleFilter === 'admin' ? '관리자' : '일반회원'}
                          </span>
                          <FontAwesomeIcon icon={faCaretDown} 
                              className={`text-gray-400 text-sm transition-transform 
                                          ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isRoleDropdownOpen && (
                          <div 
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10"
                            onMouseLeave={() => setIsRoleDropdownOpen(false)}
                          >
                            <div
                              onClick={() => { setUserRoleFilter('admin'); setIsRoleDropdownOpen(false); }}
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              관리자
                            </div>
                            <div
                              onClick={() => { setUserRoleFilter('user'); setIsRoleDropdownOpen(false); }}
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              일반회원
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 상태 필터 */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                          className="flex items-center justify-between px-3 py-2 pr-4 border border-gray-300 rounded-lg text-sm
                              bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer w-[120px]"
                        >
                          <span className="text-gray-700">
                            {userStatusFilter === 'all' ? '전체상태' : userStatusFilter === 'active' ? '활성' : userStatusFilter === 'inactive' ? '비활성' : '정지'}
                          </span>
                          <FontAwesomeIcon icon={faCaretDown} className={`text-gray-400 text-xs transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isStatusDropdownOpen && (
                          <div 
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10"
                            onMouseLeave={() => setIsStatusDropdownOpen(false)}
                          >
                            <div
                              onClick={() => { setUserStatusFilter('active'); setIsStatusDropdownOpen(false); }}
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              활성
                            </div>
                            <div
                              onClick={() => { setUserStatusFilter('inactive'); setIsStatusDropdownOpen(false); }}
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              비활성
                            </div>
                            <div
                              onClick={() => { setUserStatusFilter('suspended'); setIsStatusDropdownOpen(false); }}
                              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              정지
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    
                  </div>
                </div>

                {/* 일괄 관리 드롭다운 */}
                {selectedUsers.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-blue-800">
                        <span className="font-semibold">{selectedUsers.length}명</span>의 사용자가 선택되었습니다.
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* 상태 변경 드롭다운 */}
                        <div className="relative status-dropdown">
                          <button
                            onClick={() => setIsBatchStatusDropdownOpen(!isBatchStatusDropdownOpen)}
                            className="text-xs px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
                          >
                            <span>상태 변경</span>
                            <FontAwesomeIcon icon={faCaretDown} className="text-xs" />
                          </button>
                          {isBatchStatusDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-20 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                onClick={() => { updateSelectedUsersStatus('active'); setIsBatchStatusDropdownOpen(false); }}
                                className="block w-full text-left px-3 py-2 text-xs text-green-600 hover:bg-green-50"
                              >
                                활성화
                              </button>
                              <button
                                onClick={() => { updateSelectedUsersStatus('inactive'); setIsBatchStatusDropdownOpen(false); }}
                                className="block w-full text-left px-3 py-2 text-xs text-yellow-600 hover:bg-yellow-50"
                              >
                                비활성화
                              </button>
                              <button
                                onClick={() => { updateSelectedUsersStatus('suspended'); setIsBatchStatusDropdownOpen(false); }}
                                className="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                정지
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 역할 변경 드롭다운 */}
                        <div className="relative role-dropdown">
                          <button
                            onClick={() => setIsBatchRoleDropdownOpen(!isBatchRoleDropdownOpen)}
                            className="text-xs px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
                          >
                            <span>역할 변경</span>
                            <FontAwesomeIcon icon={faCaretDown} className="text-xs" />
                          </button>
                          {isBatchRoleDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-20 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                onClick={() => { updateSelectedUsersRole('admin'); setIsBatchRoleDropdownOpen(false); }}
                                className="block w-full text-left px-3 py-2 text-xs text-purple-600 hover:bg-purple-50"
                              >
                                관리자로
                              </button>
                              <button
                                onClick={() => { updateSelectedUsersRole('user'); setIsBatchRoleDropdownOpen(false); }}
                                className="block w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
                              >
                                일반회원으로
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={deleteSelectedUsers}
                          className="text-xs px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 회원 테이블 */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-300">
                        <tr>
                          <th className="min-w-[50px] max-w-[50px] px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectAllUsers}
                              onChange={toggleSelectAllUsers}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="min-w-[72px] max-w-[72px] px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">번호</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => toggleSortOrder('name')}
                              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                            >
                              <span>이름</span>
                              <FontAwesomeIcon 
                                icon={userSortBy === 'name' ? (userSortOrder === 'asc' ? faCaretDown : faCaretDown) : faCaretDown} 
                                className={`text-xs ${userSortBy === 'name' ? 'text-orange-600' : 'text-gray-400'}`}
                              />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => toggleSortOrder('email')}
                              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                            >
                              <span>이메일</span>
                              <FontAwesomeIcon 
                                icon={userSortBy === 'email' ? (userSortOrder === 'asc' ? faCaretDown : faCaretDown) : faCaretDown} 
                                className={`text-xs ${userSortBy === 'email' ? 'text-orange-600' : 'text-gray-400'}`}
                              />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">전화번호</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => toggleSortOrder('joinDate')}
                              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                            >
                              <span>가입일</span>
                              <FontAwesomeIcon 
                                icon={userSortBy === 'joinDate' ? (userSortOrder === 'asc' ? faCaretDown : faCaretDown) : faCaretDown} 
                                className={`text-xs ${userSortBy === 'joinDate' ? 'text-orange-600' : 'text-gray-400'}`}
                              />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => toggleSortOrder('role')}
                              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                            >
                              <span>회원구분</span>
                              <FontAwesomeIcon 
                                icon={userSortBy === 'role' ? (userSortOrder === 'asc' ? faCaretDown : faCaretDown) : faCaretDown} 
                                className={`text-xs ${userSortBy === 'role' ? 'text-orange-600' : 'text-gray-400'}`}
                              />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => toggleSortOrder('status')}
                              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                            >
                              <span>상태</span>
                              <FontAwesomeIcon 
                                icon={userSortBy === 'status' ? (userSortOrder === 'asc' ? faCaretDown : faCaretDown) : faCaretDown} 
                                className={`text-xs ${userSortBy === 'status' ? 'text-orange-600' : 'text-gray-400'}`}
                              />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentUsers.map((user, idx) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500 flex justify-center">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500 text-center">
                              {indexOfFirstUser + idx + 1}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                              <span className="ml-2">{user.name}</span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <span>{user.email}</span>
                                {user.emailVerified === 1 && (
                                  <span className="w-5 h-5 inline-flex items-center px-1 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">{user.phone}</td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">{user.joinDate}</td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-500">
                              {user.role === 'admin' ? '관리자' : '일반회원'}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs">
                              <span className={`block px-2 text-xs text-center leading-5 font-semibold rounded-full ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' :
                                user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {user.status === 'active' ? '활성' : user.status === 'inactive' ? '비활성' : '정지'}
                              </span>
                            </td>
                            
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                </div>
                  {/* 회원관리 페이지네이션 */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentUserPage}
                      totalPages={totalUserPages}
                      onPageChange={setCurrentUserPage}
                      totalItems={filteredUsers.length}
                      itemsPerPage={usersPerPage}
                      className="justify-between"
                      showInfo={true}
                    />
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">주문 상세</h3>
              <div className="space-y-2">
                <p><strong>주문번호:</strong> {selectedOrder.orderId}</p>
                <p><strong>상품:</strong> {selectedOrder.product}</p>
                <p><strong>주문일:</strong> {selectedOrder.date}</p>
                <p><strong>수량:</strong> {selectedOrder.quantity}개</p>
                <p><strong>상태:</strong> {selectedOrder.status}</p>
                <p><strong>가격:</strong> {(() => {
                  const priceNumber = parseInt(selectedOrder.price.replace(/[^\d]/g, '')) || 0;
                  const quantity = selectedOrder.quantity || 1;
                  return (priceNumber * quantity).toLocaleString() + '원';
                })()}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">리뷰 상세</h3>
              <div className="space-y-2">
                <p><strong>작성자:</strong> {selectedReview.user}</p>
                <p><strong>별점:</strong> {selectedReview.rating}/5</p>
                <p><strong>작성일:</strong> {selectedReview.time}</p>
                <p><strong>상품:</strong> {selectedReview.product}</p>
                <p><strong>내용:</strong></p>
                <p className="text-gray-700 bg-gray-50 p-2 rounded">{selectedReview.content}</p>
                {selectedReview.reply && (
                  <>
                    <p><strong>관리자 답변:</strong></p>
                    <p className="text-gray-700 bg-blue-50 p-2 rounded">{selectedReview.reply}</p>
                    <p className="text-sm text-gray-500">{selectedReview.replyTime}</p>
                  </>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 결제내역 모달 */}
      {selectedPaymentOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">결제내역 상세</h3>
              <div className="space-y-3">
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">주문번호</p>
                  <p className="text-sm text-gray-900">{selectedPaymentOrder.orderId}</p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">결제번호</p>
                  <p className="text-sm text-gray-900">
                    {selectedPaymentOrder.paymentNumber || `PAY-${selectedPaymentOrder.orderId.replace('-', '')}`}
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">이메일</p>
                  <p className="text-sm text-gray-900">{selectedPaymentOrder.userEmail || 'customer@example.com'}</p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">상품명</p>
                  <p className="text-sm text-gray-900">{selectedPaymentOrder.product}</p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">주문일</p>
                  <p className="text-sm text-gray-900">
                    {(() => {
                      try {
                        if (!selectedPaymentOrder.date || selectedPaymentOrder.date === '') {
                          const now = new Date();
                          const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
                          return koreanTime.toLocaleString('ko-KR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });
                        }
                        
                        const date = new Date(selectedPaymentOrder.date);
                        if (isNaN(date.getTime())) {
                          return selectedPaymentOrder.date;
                        }
                        
                        const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
                        return koreanTime.toLocaleString('ko-KR', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                      } catch (error) {
                        return selectedPaymentOrder.date;
                      }
                    })()}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">수량</p>
                  <p className="text-sm text-gray-900">{selectedPaymentOrder.quantity}일</p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">결제방법</p>
                  <p className="text-sm text-gray-900">
                    {selectedPaymentOrder.paymentMethod === 'card' ? '신용카드' : 
                     selectedPaymentOrder.paymentMethod === 'virtual' ? '가상계좌' : 
                     selectedPaymentOrder.paymentMethod || '신용카드'}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">결제일</p>
                  <p className="text-sm text-gray-900">
                    {(() => {
                      if (selectedPaymentOrder.paymentDate === '-' || !selectedPaymentOrder.paymentDate) {
                        return '입금전';
                      }
                      
                      try {
                        const date = new Date(selectedPaymentOrder.paymentDate);
                        if (isNaN(date.getTime())) {
                          return selectedPaymentOrder.paymentDate;
                        }
                        
                        const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
                        return koreanTime.toLocaleString('ko-KR', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                      } catch (error) {
                        return selectedPaymentOrder.paymentDate;
                      }
                    })()}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">결제상태</p>
                  <p className="text-sm">
                    {(() => {
                      let label = '';
                      let color = '';
                      if (selectedPaymentOrder.refundStatus === '카드결제취소') {
                        label = '카드결제취소';
                        color = 'text-red-600';
                      } else if (selectedPaymentOrder.paymentMethod === 'virtual' || selectedPaymentOrder.paymentMethod === '가상계좌') {
                        if (selectedPaymentOrder.paymentDate && selectedPaymentOrder.paymentDate !== '-') {
                          label = '입금완료';
                          color = 'text-green-600';
                        } else {
                          label = '입금확인전';
                          color = 'text-yellow-600';
                        }
                      } else if (selectedPaymentOrder.paymentMethod === 'card' || selectedPaymentOrder.paymentMethod === '신용카드') {
                        label = '결제완료';
                        color = 'text-blue-600';
                      } else {
                        label = '결제완료';
                        color = 'text-blue-600';
                      }
                      return <span className={color}>{label}</span>;
                    })()}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">주문상태</p>
                  <p className="text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedPaymentOrder.status === '작업완료' ? 'bg-green-100 text-green-800' :
                      selectedPaymentOrder.status === '진행 중' ? 'bg-blue-100 text-blue-800' :
                      selectedPaymentOrder.status === '취소' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPaymentOrder.status}
                    </span>
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">단가</p>
                  <p className="text-sm text-gray-900">{selectedPaymentOrder.price}</p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-medium text-gray-600">총 결제금액</p>
                  <p className="text-sm font-semibold text-red-600">
                    {(() => {
                      const priceNumber = parseInt(selectedPaymentOrder.price.replace(/[^\d]/g, '')) || 0;
                      const quantity = selectedPaymentOrder.quantity || 1;
                      return (priceNumber * quantity).toLocaleString() + '원';
                    })()}
                  </p>
                </div>
                {selectedPaymentOrder.originalPrice && selectedPaymentOrder.originalPrice !== selectedPaymentOrder.price && (
                  <div className="border-b border-gray-200 pb-2">
                    <p className="text-sm font-medium text-gray-600">할인정보</p>
                    <p className="text-sm text-gray-900">
                      <span className="line-through text-gray-400">{selectedPaymentOrder.originalPrice}</span>
                      {selectedPaymentOrder.discountPrice && selectedPaymentOrder.discountPrice !== '0원' && (
                        <span className="text-green-600 ml-2">(할인: {selectedPaymentOrder.discountPrice})</span>
                      )}
                    </p>
                  </div>
                )}
                {selectedPaymentOrder.request && (
                  <div className="border-b border-gray-200 pb-2">
                    <p className="text-sm font-medium text-gray-600">요청사항</p>
                    <p className="text-sm text-gray-900">{selectedPaymentOrder.request}</p>
                  </div>
                )}
                {selectedPaymentOrder.refundStatus && (
                  <div className="border-b border-gray-200 pb-2">
                    <p className="text-sm font-medium text-gray-600">환불상태</p>
                    <p className="text-sm text-red-600">{selectedPaymentOrder.refundStatus}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                {/* 입금확인전 상태일 때 입금 확인 버튼 표시 */}
                {((selectedPaymentOrder.paymentMethod === 'virtual' || selectedPaymentOrder.paymentMethod === '가상계좌') && 
                  (!selectedPaymentOrder.paymentDate || selectedPaymentOrder.paymentDate === '-')) && (
                  <button
                    onClick={() => {
                      confirmPayment(selectedPaymentOrder.orderId);
                      setSelectedPaymentOrder(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    입금확인
                  </button>
                )}
                {/* 입금완료 상태일 때 입금완료취소 버튼 표시 */}
                {((selectedPaymentOrder.paymentMethod === 'virtual' || selectedPaymentOrder.paymentMethod === '가상계좌') && 
                  selectedPaymentOrder.paymentDate && selectedPaymentOrder.paymentDate !== '-') && (
                  <button
                    onClick={() => {
                      cancelPayment(selectedPaymentOrder.orderId);
                      setSelectedPaymentOrder(null);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    입금취소
                  </button>
                )}
                {/* 환불요청 상태일 때 환불처리 버튼들 표시 */}
                {selectedPaymentOrder.refundStatus === '환불요청' && (
                  <>
                    <button
                      onClick={() => {
                        handleRefund(selectedPaymentOrder.orderId);
                        setSelectedPaymentOrder(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      환불승인
                    </button>
                    <button
                      onClick={() => {
                        rejectRefund(selectedPaymentOrder.orderId);
                        setSelectedPaymentOrder(null);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      환불거절
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedPaymentOrder(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 