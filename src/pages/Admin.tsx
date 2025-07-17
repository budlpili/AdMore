import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faStar, faChartLine, faCog, faSearch, faFilter, faEdit, faTrash, faCheck, faTimes, faEye, faHome, faSignOutAlt, faBars, faChevronLeft, faComments, faBell, faUser, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { mockReviews } from '../data/reviews-list';

interface Order {
  orderId: string;
  productId: number;
  product: string;
  date: string;
  quantity: number;
  status: string;
  review: string;
  price: number;
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
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'user' | 'admin';
  productInfo?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  count?: number;
  action?: () => void;
  subItems?: SidebarItem[];
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'reviews' | 'customerService'>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<'notices' | 'faq' | 'inquiries'>('notices');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  // 반응형 사이드바 상태 관리
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint 미만
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false); // lg 이상에서는 자동으로 펼쳐진 상태
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

  // 데이터 로드
  useEffect(() => {
    loadOrders();
    loadReviews();
    loadChatMessages();
  }, []);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationDropdownOpen, isProfileDropdownOpen]);

  const loadOrders = () => {
    try {
      const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
      setOrders(orderList);
    } catch (error) {
      console.error('주문 로드 에러:', error);
      setOrders([]);
    }
  };

  const loadReviews = () => {
    try {
      const savedReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
      const allReviews = [...savedReviews, ...mockReviews];
      setReviews(allReviews);
    } catch (error) {
      console.error('리뷰 로드 에러:', error);
      setReviews([]);
    }
  };

  const loadChatMessages = () => {
    try {
      const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
      setChatMessages(messages);
    } catch (error) {
      console.error('채팅 메시지 로드 에러:', error);
      setChatMessages([]);
    }
  };

  // 주문 상태 변경
  const updateOrderStatus = (orderId: string, newStatus: string) => {
    try {
      const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
      const updatedOrderList = orderList.map((order: Order) => {
        if (order.orderId === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      });
      localStorage.setItem('orderList', JSON.stringify(updatedOrderList));
      setOrders(updatedOrderList);
    } catch (error) {
      console.error('주문 상태 업데이트 에러:', error);
    }
  };

  // 리뷰 삭제
  const deleteReview = (reviewId: number) => {
    if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      try {
        const savedReviews = JSON.parse(localStorage.getItem('mockReviews') || '[]');
        const updatedReviews = savedReviews.filter((review: Review) => review.id !== reviewId);
        localStorage.setItem('mockReviews', JSON.stringify(updatedReviews));
        loadReviews();
      } catch (error) {
        console.error('리뷰 삭제 에러:', error);
      }
    }
  };

  // 채팅 메시지 삭제
  const deleteChatMessage = (messageId: string) => {
    if (window.confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
      try {
        const updatedMessages = chatMessages.filter(msg => msg.id !== messageId);
        localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
        setChatMessages(updatedMessages);
      } catch (error) {
        console.error('채팅 메시지 삭제 에러:', error);
      }
    }
  };

  // 필터링된 주문
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 통계 데이터
  const totalOrders = orders.length;

  const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', label: '대시보드', icon: faChartLine, count: undefined, action: undefined },
    { id: 'products', label: '상품관리', icon: faCog, count: products.length, action: undefined },
    { id: 'orders', label: '주문관리', icon: faBox, count: totalOrders, action: undefined },
    { id: 'reviews', label: '리뷰관리', icon: faStar, count: reviews.length, action: undefined },
    { id: 'customerService', label: '고객센터', icon: faComments, count: undefined, action: undefined, subItems: [
      { id: 'notices', label: '공지사항', icon: faBell, count: undefined, action: undefined },
      { id: 'faq', label: '자주묻는 질문', icon: faComments, count: undefined, action: undefined },
      { id: 'inquiries', label: '1:1문의', icon: faComments, count: chatMessages.length, action: undefined }
    ] },
  ];

  const homeItem: SidebarItem = { id: 'home', label: '홈으로', icon: faHome, action: () => navigate('/'), count: undefined };
  const logoutItem: SidebarItem = { id: 'logout', label: '로그아웃', icon: faSignOutAlt, action: () => navigate('/login'), count: undefined };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 왼쪽 사이드바 - 데스크톱 */}
      <div className={`rounded-r-lg bg-white shadow-lg transition-all duration-500-in-out ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
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
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (['dashboard', 'products', 'orders', 'reviews', 'customerService'].includes(item.id)) {
                      if (item.id === 'customerService') {
                        // 고객센터 클릭 시 서브메뉴 토글
                        if (activeTab === 'customerService') {
                          setActiveTab('dashboard'); // 서브메뉴 닫기
                        } else {
                          setActiveTab(item.id as 'dashboard' | 'products' | 'orders' | 'reviews' | 'customerService');
                          setActiveSubTab('notices');
                        }
                      } else {
                        setActiveTab(item.id as 'dashboard' | 'products' | 'orders' | 'reviews' | 'customerService');
                      }
                    }
                  }}
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
                      <div className="bg-orange-500 text-white font-bold text-[8px] leading-4 text-center w-[14px] h-[14px] rounded-full ml-2 
                          whitespace-nowrap">
                        {item.count}
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && item.subItems && (
                    <FontAwesomeIcon 
                      icon={faCaretDown} 
                      className={`text-xs transition-transform duration-200 ${
                        activeTab === item.id ? 'rotate-180 text-orange-600' : 'text-gray-400'
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
                {!isSidebarCollapsed && item.subItems && activeTab === item.id && (
                  <div className="">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveSubTab(subItem.id as 'notices' | 'faq' | 'inquiries')}
                        className={`w-full h-10 flex items-center px-12 py-2 rounded text-sm transition-all duration-200 ${
                          activeSubTab === subItem.id 
                            ? 'bg-orange-50 text-orange-600' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="whitespace-nowrap text-sm font-semibold">{subItem.label}</span>
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
                onClick={() => navigate('/login')}
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

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 관리자 헤더 */}
        <header className="relative bg-none shadow-none border-b border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 사이드바 토글 버튼 */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 mr-4 h-[40px] w-[40px]"
                title={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              >
                <FontAwesomeIcon 
                  icon={isSidebarCollapsed ? faBars : faChevronLeft}
                  className="text-gray-600 text-lg transition-transform duration-300"
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
                  placeholder="전체 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* 알림 */}
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faBell} className="text-lg" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* 알림 드롭다운 */}
                {isNotificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">알림</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-3 hover:bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">새로운 주문이 접수되었습니다</p>
                        <p className="text-xs text-gray-500 mt-1">주문번호: 20240601-004</p>
                        <p className="text-xs text-gray-400">2분 전</p>
                      </div>
                      <div className="p-3 hover:bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">새로운 리뷰가 작성되었습니다</p>
                        <p className="text-xs text-gray-500 mt-1">상품: 프리미엄 디자인 서비스</p>
                        <p className="text-xs text-gray-400">15분 전</p>
                      </div>
                      <div className="p-3 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">고객 문의가 접수되었습니다</p>
                        <p className="text-xs text-gray-500 mt-1">문의자: 김고객</p>
                        <p className="text-xs text-gray-400">1시간 전</p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <button className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium">
                        모든 알림 보기
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 관리자 프로필 */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">관리자</p>
                    <p className="text-xs text-gray-500">admin@admore.com</p>
                  </div>
                  <FontAwesomeIcon icon={faCaretDown} className="text-gray-400 text-sm" />
                </button>

                {/* 프로필 드롭다운 */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">관리자</p>
                      <p className="text-xs text-gray-500">admin@admore.com</p>
                    </div>
                    <div className="py-2">
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
                    <div className="border-t border-gray-200 py-2">
                      <button 
                        onClick={() => navigate('/login')}
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
            {/* 페이지 제목 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'dashboard' && '대시보드'}
                {activeTab === 'products' && '상품 관리'}
                {activeTab === 'orders' && '주문 관리'}
                {activeTab === 'reviews' && '리뷰 관리'}
                {activeTab === 'customerService' && '고객 서비스'}
              </h1>
              <p className="text-gray-600 mt-2">
                {activeTab === 'dashboard' && '전체 현황을 한눈에 확인하세요.'}
                {activeTab === 'products' && '상품 정보를 관리하세요.'}
                {activeTab === 'orders' && '주문 현황을 확인하고 상태를 관리하세요.'}
                {activeTab === 'reviews' && '고객 리뷰를 확인하고 관리하세요.'}
                {activeTab === 'customerService' && '고객 서비스 관리 페이지입니다.'}
              </p>
            </div>

            {/* 대시보드 탭 */}
            {activeTab === 'dashboard' && (
              <div>
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
                        <p className="text-sm text-gray-600">대기중</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '대기중').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">완료</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '완료').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FontAwesomeIcon icon={faTimes} className="text-red-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">취소</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '취소').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 추가 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FontAwesomeIcon icon={faStar} className="text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">전체 리뷰</p>
                        <p className="text-xl font-bold">{reviews.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FontAwesomeIcon icon={faComments} className="text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">문의내역</p>
                        <p className="text-xl font-bold">{chatMessages.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FontAwesomeIcon icon={faCog} className="text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">상품 수</p>
                        <p className="text-xl font-bold">{products.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 최근 활동 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.orderId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{order.product}</p>
                          <p className="text-sm text-gray-500">주문번호: {order.orderId}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === '완료' ? 'bg-green-100 text-green-800' :
                          order.status === '대기중' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 상세 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">주문 통계</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">전체 주문</span>
                        <span className="font-semibold">{totalOrders}건</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">완료</span>
                        <span className="font-semibold text-green-600">{orders.filter(o => o.status === '완료').length}건</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">대기중</span>
                        <span className="font-semibold text-yellow-600">{orders.filter(o => o.status === '대기중').length}건</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">취소</span>
                        <span className="font-semibold text-red-600">{orders.filter(o => o.status === '취소').length}건</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">리뷰 통계</h3>
                    <div className="space-y-3">
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
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">상품 수</span>
                        <span className="font-semibold">{products.length}개</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 주문 관리 탭 */}
            {activeTab === 'orders' && (
              <div>
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
                        <p className="text-sm text-gray-600">대기중</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '대기중').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">완료</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '완료').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FontAwesomeIcon icon={faTimes} className="text-red-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">취소</p>
                        <p className="text-xl font-bold">{orders.filter(o => o.status === '취소').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 검색 및 필터 */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="주문 검색..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="all">전체 상태</option>
                        <option value="대기중">대기중</option>
                        <option value="완료">완료</option>
                        <option value="취소">취소</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 주문 테이블 */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문번호</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                          <tr key={order.orderId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.product}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === '완료' ? 'bg-green-100 text-green-800' :
                                order.status === '대기중' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => updateOrderStatus(order.orderId, '완료')}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                완료
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.orderId, '취소')}
                                className="text-red-600 hover:text-red-900"
                              >
                                취소
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 리뷰 관리 탭 */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">고객 리뷰</h3>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{review.user}</p>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <FontAwesomeIcon
                                  key={i}
                                  icon={i < review.rating ? faStar : faStarRegular}
                                  className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                        <p className="text-gray-700">{review.content}</p>
                        <p className="text-sm text-gray-500 mt-2">{review.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 상품 관리 탭 */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">상품 목록</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                        <p className="text-lg font-bold text-orange-600">{product.price.toLocaleString()}원</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 고객센터 탭 */}
            {activeTab === 'customerService' && (
              <div>
                {/* 서브메뉴 탭 네비게이션 */}
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      <button
                        onClick={() => setActiveSubTab('notices')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeSubTab === 'notices'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        공지사항
                      </button>
                      <button
                        onClick={() => setActiveSubTab('faq')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeSubTab === 'faq'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        자주묻는 질문
                      </button>
                      <button
                        onClick={() => setActiveSubTab('inquiries')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                          activeSubTab === 'inquiries'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        1:1문의
                      </button>
                    </nav>
                  </div>
                </div>

                {/* 공지사항 서브탭 */}
                {activeSubTab === 'notices' && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">공지사항</h3>
                      <div className="space-y-4">
                        {/* 공지사항 데이터는 여기에 추가되어야 합니다. */}
                        <p>공지사항 관리 기능은 아직 구현되지 않았습니다.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 자주묻는 질문 서브탭 */}
                {activeSubTab === 'faq' && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">자주묻는 질문</h3>
                      <div className="space-y-4">
                        {/* 자주묻는 질문 데이터는 여기에 추가되어야 합니다. */}
                        <p>자주묻는 질문 관리 기능은 아직 구현되지 않았습니다.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1:1문의 서브탭 */}
                {activeSubTab === 'inquiries' && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">1:1문의</h3>
                      <div className="space-y-4">
                        {chatMessages.map((message) => (
                          <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{message.user}</p>
                                <p className="text-sm text-gray-500">{message.timestamp}</p>
                              </div>
                              <button
                                onClick={() => deleteChatMessage(message.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                            <p className="text-gray-700">{message.message}</p>
                            {message.productInfo && (
                              <p className="text-sm text-gray-500 mt-2">상품: {message.productInfo}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
                <p><strong>가격:</strong> {(selectedOrder.price * selectedOrder.quantity).toLocaleString()}원</p>
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
    </div>
  );
};

export default Admin; 