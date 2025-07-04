import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Category } from '../types/index';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const navigate = useNavigate();
  const [recentDrawerOpen, setRecentDrawerOpen] = useState(false);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true');

  const categories: Category[] = [
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
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className={`bg-white shadow-md transition-all duration-300 ${
      isScrolled ? 'fixed top-0 left-0 right-0 z-50' : 'relative'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img src="/images/icon_admore.png" alt="애드모어" className="w-6 h-6" />
            <Link to="/" className="text-xl font-semibold text-gray-600 font-noto ml-2">
              애드모어
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsCategoryOpen(true)}
                onMouseLeave={() => setIsCategoryOpen(false)}
                onClick={() => navigate('/products')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[16px] font-semibold"
              >
                상품
              </button>
              {isCategoryOpen && (
                <div
                  onMouseEnter={() => setIsCategoryOpen(true)}
                  onMouseLeave={() => setIsCategoryOpen(false)}
                  className="absolute z-10 mt-0 w-48 bg-white rounded-md shadow-lg py-1"
                >
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      to={category.path}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/reviews" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[16px] font-semibold">
              리뷰
            </Link>
            <Link to="/customer-service" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[16px] font-semibold">
              고객센터
            </Link>
            
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center">
              {/* 최근 본 상품 */}
              <button
                type="button"
                className="text-gray-400 hover:text-gray-900 px-3 py-2 rounded-md font-medium flex items-center gap-1 focus:outline-none"
                onClick={() => setRecentDrawerOpen(true)}
              >
                <FontAwesomeIcon icon={faEyeRegular} className="text-[16px]" />
              </button>
              {/* 즐겨찾기 */}
              <Link to="/favorits" className="text-gray-400 hover:text-gray-900 px-3 py-2 rounded-md font-medium flex items-center gap-1">
                <FontAwesomeIcon icon={faHeartRegular} className="text-[16px]" />
              </Link>
            </div>
            <div className="text-gray-400 px-1 text-[8px] font-semibold">|</div>
        
            <div className="flex items-center">
              {/* 로그인되었을때보여짐 */}
              <Link
                    to=""
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-orange-500 flex items-center gap-1"
                  >
                <FontAwesomeIcon icon={faUserSolid} className="text-[16px]" />
              </Link>
              {/* 로그인되지 않았을때보여짐 */}
              <Link
                to="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-orange-500 flex items-center gap-1"
              >
                  로그인
                </Link>
                
                <Link
                  to="/signup"
                  className="px-3 py-2 rounded-md text-sm font-medium text-orange-500 hover:text-orange-700"
                >
                  회원가입
              </Link>
            </div>
          </div>

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
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                홈
              </Link>
              <div className="px-3 py-2">
                <div className="text-base font-medium text-gray-700 mb-2">상품</div>
                <div className="pl-4 space-y-1">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      to={category.path}
                      className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/customer-service" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                문의
              </Link>
              <Link to="/reviews" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                즐겨찾기
              </Link>
              <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                회원가입
              </Link>
            </div>
          </div>
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