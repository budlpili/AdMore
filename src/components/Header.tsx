import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUser, 
  faShoppingCart, 
  faHeart, 
  faBars, 
  faTimes, 
  faChevronDown,
  faComments,
  faClipboardList,
  faCreditCard,
  faTicketAlt,
  faCog,
  faBuilding,
  faBoxOpen,
  faStar,
  faSignOutAlt,
  faUserPlus,
  faCommentDots,
  faHeadset
} from '@fortawesome/free-solid-svg-icons';
import { Category, NavigationCategory } from '../types';
import { faEye as faEyeRegular, faHeart as faHeartRegular, faUser as faUserSolid } from '@fortawesome/free-regular-svg-icons';
import { getRecentProducts, clearRecentProducts } from '../utils/recentProducts';

const mockRecentProducts = [
  {
    id: 1,
    name: '유튜브 마케팅 활성화',
    price: 5000,
    image: '/images/product_01.png',
  },
  {
    id: 2,
    name: '페이스북 팔로워 1000명',
    price: 50000,
    image: '/images/product_02.png',
  },
  {
    id: 3,
    name: '인스타그램 팔로워 500명',
    price: 30000,
    image: '/images/product_04.png',
  },
];

interface HeaderProps {
  setIsChatOpen?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsChatOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const navigate = useNavigate();
  const [recentDrawerOpen, setRecentDrawerOpen] = useState(false);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const categories: NavigationCategory[] = [
    { name: '페이스북', path: '/products?category=facebook' },
    { name: '인스타그램', path: '/products?category=instagram' },
    { name: '유튜브', path: '/products?category=youtube' },
    { name: '블로그', path: '/products?category=blog' },
    { name: '트위터', path: '/products?category=twitter' },
    { name: '텔레그램', path: '/products?category=telegram' },
    { name: '기타', path: '/products?category=other' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (recentDrawerOpen) {
      setRecentProducts(getRecentProducts());
    }
  }, [recentDrawerOpen]);

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };
    
    // localStorage 변경 감지
    window.addEventListener('storage', handleStorage);
    
    // 커스텀 이벤트 리스너 추가 (같은 탭에서의 변경 감지)
    window.addEventListener('loginStateChanged', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('loginStateChanged', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const menu = document.getElementById('user-menu-dropdown');
      if (menu && !menu.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    
    // 커스텀 이벤트 발생
    window.dispatchEvent(new Event('loginStateChanged'));
    
    navigate('/');
  };

  // 페이지 맨 위로 스크롤하는 함수
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 네비게이션 클릭 핸들러
  const handleNavigation = (path: string) => {
    navigate(path);
    scrollToTop();
  };

  return (
    <header className={`bg-white shadow-md transition-all duration-300 ${
      isScrolled ? 'fixed top-0 left-0 right-0 z-50' : 'relative'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center h-16">
           {/* Mobile menu button */}
           <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img src="/images/icon_admore.png" alt="애드모어" className="w-6 h-6" />
            <button 
              onClick={() => handleNavigation('/')} 
              className="text-xl font-semibold text-gray-600 font-noto ml-2"
            >
              애드모어
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            
            <div className="relative">
              <button
                onMouseEnter={() => setIsCategoryOpen(true)}
                onMouseLeave={() => setIsCategoryOpen(false)}
                onClick={() => handleNavigation('/products')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[16px] font-semibold"
              >
                상품
              </button>
            </div>

            <button 
              onClick={() => handleNavigation('/reviews')} 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[16px] font-semibold"
            >
              리뷰
            </button>
            <button 
              onClick={() => handleNavigation('/customer-service')} 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[16px] font-semibold"
            >
              고객센터
            </button>
            
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center">
              {/* 최근 본 상품 */}
              <button
                type="button"
                className=" text-gray-400 hover:text-gray-900 px-3 py-2 rounded-md font-medium flex items-center gap-1 focus:outline-none"
                onClick={() => setRecentDrawerOpen(true)}
              >
                <FontAwesomeIcon icon={faEyeRegular} className="text-[16px]" />
              </button>
              {/* 즐겨찾기 */}
              <button 
                onClick={() => handleNavigation('/mypage?tab=favorits')} 
                className="text-gray-400 hover:text-gray-900 px-3 py-2 rounded-md font-medium flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faHeartRegular} className="text-[16px]" />
              </button>
            </div>
            <div className="text-gray-400 px-1 text-[8px] font-semibold hidden md:block">|</div>
        
            <div className="flex items-center">
              {isLoggedIn ? (
                <div
                  className="relative"
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    className="px-3 py-4 rounded-md text-sm font-medium text-gray-500 hover:text-orange-500 flex items-center gap-1 focus:outline-none"
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                  >
                    <FontAwesomeIcon icon={faUserSolid} className="text-[16px]" />
                  </button>

                  {/* 유저메뉴 드롭다운 */}
                  {userMenuOpen && (
                    <div
                      id="user-menu-dropdown"
                      className="absolute -right-4 mt-0 p-2 w-[240px] bg-white rounded-lg shadow-lg border z-50"
                    >

                      <div className="flex items-center gap-2 px-0 py-2">
                          <FontAwesomeIcon icon={faUserSolid} className="border px-2 py-2 rounded-full text-2xl text-gray-400 bg-gray-100" />
                          <span className="font-semibold text-gray-800 text-[14px]">{localStorage.getItem('userEmail') || ''}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 px-4 py-4 rounded-md bg-gray-100 text-xs">
                        <span className="font-semibold">쿠폰 <span className="text-blue-600 font-bold ml-2">3개</span></span>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <span className="font-semibold">포인트 <span className="text-blue-600 font-bold ml-2">0P</span></span>
                      </div>
                      <ul className="py-2 space-y-1 text-gray-600">
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); navigate('/mypage?tab=mypage'); }}>
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400 w-4 h-4" />
                            마이페이지
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); setIsChatOpen?.(true); }}>
                            <FontAwesomeIcon icon={faComments} className="mr-2 text-gray-400 w-4 h-4" />
                            1:1 상담
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); navigate('/mypage?tab=orders'); }}>
                            <FontAwesomeIcon icon={faClipboardList} className="mr-2 text-gray-400 w-4 h-4" />
                            주문내역
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); navigate('/mypage?tab=payments'); }}>
                            <FontAwesomeIcon icon={faCreditCard} className="mr-2 text-gray-400 w-4 h-4" />
                            결제내역
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); navigate('/mypage?tab=favorits'); }}>
                            <FontAwesomeIcon icon={faHeart} className="mr-2 text-gray-400 w-4 h-4" />
                            즐겨찾기
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); navigate('/mypage?tab=coupons'); }}>
                            <FontAwesomeIcon icon={faTicketAlt} className="mr-2 text-gray-400 w-4 h-4" />
                            쿠폰함
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); navigate('/mypage?tab=settings'); }}>
                            <FontAwesomeIcon icon={faCog} className="mr-2 text-gray-400 w-4 h-4" />
                            환경설정
                          </button>
                        </li>
                        <li>
                          <button className="text-sm w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={() => { setUserMenuOpen(false); navigate('/admin'); }}>
                            <FontAwesomeIcon icon={faBuilding} className="mr-2 text-gray-400 w-4 h-4" />
                            관리자 페이지
                          </button>
                        </li>
                        <li>
                          <button
                            className="text-sm w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50 flex items-center font-semibold"
                            onClick={handleLogout}
                          >
                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 w-4 h-4" />
                            로그아웃
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-orange-500 flex items-center gap-1"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => handleNavigation('/signup')}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-orange-500 flex items-center gap-1"
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <>
            {/* 오버레이 */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* 왼쪽 사이드바 */}
            <div
              className="fixed top-0 left-0 h-full w-64 max-w-full bg-white shadow-2xl z-[100] transition-transform duration-300 md:hidden"
              style={{ transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <img src="/images/icon_admore.png" alt="애드모어" className="w-6 h-6" />
                  <span className="font-bold text-lg">에드모어</span>
                </div>
                
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              <div className="px-2 pt-2 pb-3 space-y-8">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 font-semibold px-2 pt-2">About</label>
                  <button 
                    onClick={() => {
                      handleNavigation('/about');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faBuilding} className="mr-2 text-gray-400 w-4 h-4" />
                    회사소개
                  </button>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 font-semibold px-2 pt-2">Menu</label>
                  <button 
                    onClick={() => {
                      handleNavigation('/products');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faBoxOpen} className="mr-2 text-gray-400 w-4 h-4" />
                    상품
                  </button>

                  <button 
                    onClick={() => {
                      handleNavigation('/reviews');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faStar} className="mr-2 text-gray-400 w-4 h-4" />
                    리뷰 보기
                  </button>
                </div>
                
                {/* 유저메뉴 */}
                <div className="flex flex-col">
                <label className="text-xs text-gray-400 font-semibold px-2 py-2">My Page</label>

                  {isLoggedIn ? (
                    <>
                      <button 
                        onClick={() => {
                          handleNavigation('/mypage');
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                      >
                        <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400 w-4 h-4" />
                        내정보
                      </button>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-gray-50 flex items-center"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 w-4 h-4" />
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          handleNavigation('/login');
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                      >
                        <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400 w-4 h-4" />
                        로그인
                      </button>
                      <button 
                        onClick={() => {
                          handleNavigation('/signup');
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-gray-50 flex items-center"
                      >
                        <FontAwesomeIcon icon={faUserPlus} className="mr-2 text-blue-600 w-4 h-4" />
                        회원가입
                      </button>
                    </>
                  )}
                </div>
                
                {/* 고객센터 */}
                <div className="flex flex-col">
                <label className="text-xs text-gray-400 font-semibold px-2 py-2">Customer Service</label>

                  <button 
                    onClick={() => {
                      setIsChatOpen?.(true);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faCommentDots} className="mr-2 text-gray-400 w-4 h-4" />
                    문의하기
                  </button>
                  <button 
                    onClick={() => {
                      handleNavigation('/customer-service');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faHeadset} className="mr-2 text-gray-400 w-4 h-4" />
                    고객센터
                  </button>
                </div>


              </div>
            </div>
          </>
        )}

        {/* 최근 본 상품 드로어 */}
        {recentDrawerOpen && (
          <>
            {/* 오버레이 */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => setRecentDrawerOpen(false)}
            />
            {/* 드로어 패널 (오른쪽에서 슬라이드) */}
            <div
              className="fixed top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl z-50 transition-transform duration-300"
              style={{ transform: recentDrawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <span className="font-bold text-sm">최근 본 상품 <span className="text-blue-600 ml-1">{recentProducts.length}</span></span>
                <div className="flex items-center gap-2">
                  {recentProducts.length > 0 && (
                    <button
                      onClick={() => { clearRecentProducts(); setRecentProducts([]); }}
                      className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 border border-gray-200"
                    >
                      전체 삭제
                    </button>
                  )}
                  <button onClick={() => setRecentDrawerOpen(false)} className="text-2xl text-gray-500 hover:text-gray-700">&times;</button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
                {recentProducts.length === 0 ? (
                  <div className="text-gray-400 text-center mt-10">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-gray-400 text-center mt-5">최근 본 상품이 없습니다.</div>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recentProducts.map((item) => (
                      <li key={item.id} className="flex items-start gap-3 border-b pb-3 last:border-b-0">
                        <img src={item.background || item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-gray-900 truncate">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate mb-1">{item.description}</div>
                          <div className="flex items-end gap-1">
                            {item.discountRate && (
                              <span className="text-blue-600 font-bold text-xs">{item.discountRate}%</span>
                            )}
                            {item.originalPrice && (
                              <span className="text-gray-400 line-through text-xs">{item.originalPrice.toLocaleString()}원</span>
                            )}
                            <span className="text-gray-900 font-bold text-xs">{typeof item.price === 'number' ? item.price.toLocaleString() : item.price}원</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header; 