import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBoxOpen, faCommentDots, faHeart, faStar } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faRegularHeart } from '@fortawesome/free-regular-svg-icons';

interface MobileNavBarProps {
  setIsChatOpen: (open: boolean) => void;
  isChatOpen: boolean;
  type?: 'global' | 'order' | 'product-detail';
  product?: any;
  quantity?: number;
  favorites?: number[];
  toggleFavorite?: (id: number) => void;
}

const navs = [
  { key: 'home', label: '홈', icon: faHome, path: '/' },
  { key: 'products', label: '상품', icon: faBoxOpen, path: '/products' },
  { key: 'inquiry', label: '문의', icon: faCommentDots },
  { key: 'favorits', label: '즐겨찾기', icon: faHeart, path: '/mypage?tab=favorits' },
  { key: 'reviews', label: '리뷰', icon: faStar, path: '/reviews' },
];

const orderNavs = [
  { key: 'order', label: '주문', icon: faBoxOpen },
];

const MobileNavBar: React.FC<MobileNavBarProps> = ({ 
  setIsChatOpen, 
  isChatOpen, 
  type = 'global',
  product,
  quantity = 1,
  favorites = [],
  toggleFavorite
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 페이지 맨 위로 스크롤하는 함수
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 네비게이션 클릭 핸들러
  const handleNavigation = (path: string) => {
    setIsChatOpen(false);
    navigate(path);
    scrollToTop();
  };

  if (type === 'order') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow flex md:hidden items-center justify-between px-2 py-1">
        {orderNavs.map(nav => (
          <button
            key={nav.key}
            className="flex-1 flex flex-col items-center py-2 text-xs font-semibold focus:outline-none text-orange-500"
            disabled
          >
            <FontAwesomeIcon icon={nav.icon} className="text-lg mb-1" />
            {nav.label}
          </button>
        ))}
      </nav>
    );
  }

  if (type === 'product-detail') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow 
            flex md:hidden items-center justify-center gap-2 px-2 py-3">
        <button
          className="border border-orange-500 text-orange-600 font-semibold rounded px-4 py-3 text-sm flex-1 max-w-[120px]
              hover:bg-orange-50 transition"
          onClick={() => setIsChatOpen(true)}
        >
          문의
        </button>
        <button
          className="bg-orange-600 text-white font-semibold rounded px-8 py-3 flex-1 min-w-[160px]
                hover:bg-orange-700 transition text-sm"
          onClick={() => {
            navigate('/order', {
              state: {
                order: {
                  product: {
                    ...product,
                    quantity,
                  },
                },
              },
            });
            scrollToTop();
          }}
        >
          주문하기
        </button>
        <button
          className="text-xl border border-gray-200 rounded px-2 py-2 flex-1 max-w-[120px]"
          onClick={() => toggleFavorite && product && toggleFavorite(product.id)}
        >
          <FontAwesomeIcon
            icon={product && favorites.includes(product.id) ? faHeart : faRegularHeart}
            className={product && favorites.includes(product.id) ? 'text-red-500' : 'text-gray-300'}
          />
        </button>
      </div>
    );
  }

  // 기존 글로벌 nav 렌더링 (아래 기존 코드 유지)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow flex md:hidden items-center justify-between px-2 py-1">
      {navs.map(nav => {
        // 문의 nav
        if (nav.key === 'inquiry') {
          return (
            <button
              key={nav.key}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-semibold focus:outline-none ${isChatOpen ? 'text-orange-500' : 'text-gray-400'}`}
              onClick={() => setIsChatOpen(true)}
            >
              <FontAwesomeIcon icon={nav.icon} className="text-lg mb-1" />
              {nav.label}
            </button>
          );
        }
        // 문의 nav가 열려있으면 나머지는 무조건 회색
        if (isChatOpen) {
          return (
            <button
              key={nav.key}
              className="flex-1 flex flex-col items-center py-2 text-xs font-semibold focus:outline-none text-gray-400"
              onClick={() => {
                setIsChatOpen(false);
                if (nav.path) {
                  handleNavigation(nav.path);
                }
              }}
            >
              <FontAwesomeIcon icon={nav.icon} className="text-lg mb-1" />
              {nav.label}
            </button>
          );
        }
        // 평소에는 기존 활성화 로직
        const isFavoritsActive = nav.key === 'favorits' && location.pathname === '/mypage' && location.search.includes('tab=favorits');
        const isActive = nav.key !== 'favorits' && location.pathname === nav.path;
        const shouldHighlight = isFavoritsActive || isActive;
        return (
          <button
            key={nav.key}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-semibold focus:outline-none ${shouldHighlight ? 'text-orange-500' : 'text-gray-400'}`}
            onClick={() => {
              if (nav.path) {
                handleNavigation(nav.path);
              }
            }}
          >
            <FontAwesomeIcon icon={nav.icon} className="text-lg mb-1" />
            {nav.label}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNavBar; 