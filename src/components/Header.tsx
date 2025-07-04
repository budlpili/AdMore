import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types/index';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

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
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/recent" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              최근 본 상품
            </Link>
            <Link to="/favorits" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              즐겨찾기
            </Link>
            
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              회원가입
            </Link>
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
              <Link to="/recent" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                최근 본
              </Link>
              <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                회원가입
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 