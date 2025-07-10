import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser as faUserSolid } from '@fortawesome/free-regular-svg-icons';
import CouponCard from '../components/CouponCard';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';
import { faFacebook, faInstagram, faYoutube, faBlogger, faTwitter, faTelegram, IconDefinition } from '@fortawesome/free-brands-svg-icons';

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
  { key: 'all', label: '전체 쿠폰' },
];

const DUMMY_COUPONS = [
  {
    id: 1,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 07월 09일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 10,
    type: 'available',
  },
  {
    id: 2,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 07월 09일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 10,
    type: 'available',
  },
  {
    id: 3,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 07월 09일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 10,
    type: 'available',
  },
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

const UserPage: React.FC<UserPageProps> = ({ setIsChatOpen }) => {
  const location = useLocation();
  // 쿼리스트링에서 tab 파라미터 추출
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') || 'mypage';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [couponTab, setCouponTab] = useState('all');
  const navigate = useNavigate();
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
  const orderList = [
    {
      orderId: '20240601-001',
      product: '유튜브 구독자 100명',
      detail: '기본 1일/5,000원',
      quantity: 10,
      price: '50,000원',
      request: 'ASAP',
      date: '2024-06-01',
      status: '완료',
      review: '리뷰 작성하기',
    },
    {
      orderId: '20240601-001',
      product: '유튜브 구독자 100명',
      detail: '기본 1일/5,000원',
      quantity: 10,
      price: '50,000원',
      request: 'ASAP',
      date: '2024-06-01',
      status: '완료',
      review: '리뷰 작성완료',
    },
    {
      orderId: '20240601-002',
      product: '인스타그램 좋아요 500개',
      detail: '기본 1일/5,000원',
      quantity: 2,
      price: '10,000원',
      request: '계정 공개',
      date: '2024-06-02',
      status: '진행 중',
      review: '리뷰 작성하기',
    },
    {
      orderId: '20240601-003',
      product: '트위터 팔로워 200명',
      detail: '기본 1일/5,000원',
      quantity: 100,
      price: '500,000원',
      request: '없음',
      date: '2024-06-03',
      status: '취소',
      review: '리뷰 작성불가',
    },
  ];
  return (
    <div className="bg-gray-50 py-8 pb-20">
      <div className="max-w-5xl mx-auto flex gap-8 px-4">
        {/* Sidebar */}
        <aside className="min-w-[200px] hidden md:block z-50 relative">
          <div className="bg-white rounded-lg shadow p-4 mb-10 flex flex-col gap-1">
            <div className="font-bold text-sm mb-2">내 주문 현황</div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">진행 중</span>
              <span className="font-semibold text-gray-600 hover:underline hover:text-gray-700">0 건</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">완료</span>
              <span className="font-semibold text-gray-600 hover:underline hover:text-gray-700">0 건</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-gray-600 font-normal ml-2">쿠폰</span>
              <span className="font-semibold text-gray-600 hover:underline hover:text-gray-700">3 개</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-600 font-normal ml-2">포인트</span>
              <span className="font-semibold text-gray-600 hover:underline hover:text-gray-700">0 P</span>
            </div>
          </div>
          <nav className="text-sm mb-6 pb-20">
            <button onClick={() => setActiveTab('mypage')} 
                className={`block w-full text-left px-2 py-2 rounded font-bold mb-1 
                ${activeTab === 'mypage' ? 'bg-orange-50 text-orange-600' : 'text-orange-700 hover:bg-gray-100'}`}>마이페이지</button>
            <button onClick={() => setIsChatOpen(true)} 
                className="block w-full text-left px-2 py-2 rounded font-semibold text-gray-700 hover:bg-gray-100">1:1 상담</button>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
                <span className="text-gray-700 font-semibold">주문 현황</span>
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
                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0">
                  <span className="text-orange-400 text-3xl mb-2 border border-orange-200 rounded-full
                        py-5 px-6">📋</span>
                  <span className="text-[13px] mb-1 font-semibold">가상 계좌 발급</span>
                  <span className="text-xs">0건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2 sm:mx-0"></div>
                
                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0">
                  <span className="text-purple-500 text-3xl mb-2 border border-purple-200 rounded-full
                        py-5 px-6 ">💳</span>
                  <span className="text-xs mb-1 font-semibold">결제 완료</span>
                  <span className="text-xs">0건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2"></div>

                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0">
                  <span className="text-blue-500 text-3xl mb-2 border border-blue-200 rounded-full
                        py-5 px-6 ">⏳</span>
                  <span className="text-xs mb-1 font-semibold">진행 중</span>
                  <span className="text-xs">0건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2 sm:mx-0"></div>

                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0">
                  <span className="text-green-500 text-3xl mb-2 border border-green-200 rounded-full
                        py-5 px-6 ">✅</span>
                  <span className="text-xs mb-1 font-semibold">완료</span>
                  <span className="text-xs">0건</span>
                </div>
                <div className=" h-[2px] w-full sm:bg-gray-200 mx-2 sm:mx-0"></div>

                <div className="flex flex-col items-center flex-1 w-full border border-gray-200 sm:border-none rounded-lg p-4 sm:p-0">
                  <span className="text-red-400 text-3xl mb-2 border border-red-200 rounded-full
                        py-5 px-6 ">⛔</span>
                  <span className="text-xs mb-1 font-semibold">취소</span>
                  <span className="text-xs">0건</span>
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
                  <div className="bg-white rounded-lg border p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-lg">사용 가능한 쿠폰</span>
                        <span className="text-2xl font-bold text-orange-600">3</span>
                        <span className="text-gray-400">개</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-lg">전체 쿠폰</span>
                        <span className="text-2xl font-bold text-orange-600">3</span>
                        <span className="text-gray-400">개</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input type="text" className="flex-1 border rounded px-3 py-2 text-sm" placeholder="보유하신 쿠폰 코드를 입력해 주세요." />
                      <button className="bg-orange-500 text-white px-6 py-2 rounded font-semibold hover:bg-orange-600">등록</button>
                    </div>
                  </div>
                  {/* 쿠폰 필터 탭 */}
                  <div className="flex border-b mb-6">
                    {COUPON_TABS.map(tab => (
                      <button
                        key={tab.key}
                        className={`px-6 py-2 font-semibold text-sm border-b-2 transition-all -mb-px ${
                          couponTab === tab.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-400 hover:text-orange-600'
                        }`}
                        onClick={() => setCouponTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {/* 쿠폰 카드 리스트 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DUMMY_COUPONS.filter(c => couponTab === 'all' || c.type === couponTab).length === 0 ? (
                      <div className="col-span-3 text-center text-gray-400 py-12">쿠폰이 없습니다.</div>
                    ) : (
                      DUMMY_COUPONS.filter(c => couponTab === 'all' || c.type === couponTab).map(coupon => (
                        <CouponCard
                          key={coupon.id}
                          title={coupon.name}
                          expiry={coupon.expire}
                          maxDiscount={10000}
                          discountRate={coupon.percent}
                          onUse={() => alert(`${coupon.name} 사용!`)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'orders' && (
                <div className="">
                  {/* 데스크탑 테이블 */}
                  <div className="hidden md:block">
                    <div className="font-bold mb-2">주문내역</div>
                    <div className="w-full max-w-full overflow-x-auto">
                      <table className="w-full text-xs border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-2 border">주문번호</th>
                            <th className="p-2 border">상품명</th>
                            <th className="p-2 border">수량</th>
                            <th className="p-2 border">가격</th>
                            <th className="p-2 border">요청사항</th>
                            <th className="p-2 border">구매일</th>
                            <th className="p-2 border">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderList.map((order) => (
                            <tr key={order.orderId + order.review}>
                              <td className="text-[11px] text-gray-600 p-2 min-w-[60px] border">{order.orderId}</td>
                              <td className="text-[11px] text-gray-600 p-2 min-w-[100px] border">
                                {order.product}<br/>
                                <span className="text-gray-500 text-[10px]">({order.detail})</span>
                              </td>
                              <td className="text-[11px] text-gray-600 p-2 min-w-[48px] text-right border">{order.quantity}개</td>
                              <td className="text-[11px] text-gray-600 p-2 min-w-[80px] text-right border">{order.price}</td>
                              <td className="text-[11px] text-gray-600 p-2 min-w-[100px] border">{order.request}</td>
                              <td className="text-[11px] text-gray-600 p-2 min-w-[80px] text-center border">{order.date}</td>
                              <td className="text-[11px] text-gray-600 p-2 min-w-[80px] text-center border">
                                <div className={`text-[10px] px-2 py-1 rounded-full ${
                                  order.status === '완료' ? 'bg-green-100 text-green-600' :
                                  order.status === '진행 중' ? 'bg-yellow-100 text-yellow-600' :
                                  order.status === '취소' ? 'bg-red-100 text-red-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{order.status}
                                </div>
                                <div className="text-gray-500 text-[10px] border border-gray-100 rounded-full px-2 py-1 mt-1">
                                  {order.review}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* 모바일 카드형 */}
                  <div className="block md:hidden">
                    <div className="font-bold mb-2">주문내역</div>
                    <div className="flex flex-col gap-3">
                      {orderList.map((order) => (
                        <div key={order.orderId + order.review} className="bg-white rounded-lg shadow p-4 border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-sm">{order.product}</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full min-w-[60px] text-center ${
                              order.status === '완료' ? 'bg-green-100 text-green-600' :
                              order.status === '진행 중' ? 'bg-yellow-100 text-yellow-600' :
                              order.status === '취소' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>{order.status}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{order.detail}</div>
                          <div className="flex flex-col text-xs text-gray-600 gap-x-4 gap-y-1">
                            <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1">
                              <div>수량: <span className="font-medium">{order.quantity}개</span></div>
                              <div>가격: <span className="font-medium">{order.price}</span></div>
                              <div>구매일: <span className="font-medium">{order.date}</span></div>
                            </div>
                            <div>요청: <span className="font-medium">{order.request}</span></div>
                          </div>
                          {order.status === '완료' && (
                            <div className="mt-2 text-xs text-white font-semibold bg-orange-500 rounded-lg px-2 py-2 shadow-md shadow-orange-200
                                  text-center cursor-pointer hover:bg-orange-600">리뷰 작성하기</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'payments' && (
                <div>
                  <div className="font-bold mb-2">결제내역</div>
                  <div className="w-full max-w-full overflow-x-auto">
                    <table className="min-w-[600px] w-full text-xs border">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 border">주문번호</th>
                          <th className="p-2 border">결제금액</th>
                          <th className="p-2 border">결제방법</th>
                          <th className="p-2 border">결제(입금)일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            orderId: '20240601-001',
                            amount: '10,000원',
                            method: '카드',
                            date: '2024-06-01',
                          },
                          {
                            orderId: '20240601-002',
                            amount: '20,000원',
                            method: '무통장',
                            date: '2024-06-02',
                          },
                          {
                            orderId: '20240601-003',
                            amount: '15,000원',
                            method: '카카오페이',
                            date: '2024-06-03',
                          },
                        ].map((payment) => (
                          <tr key={payment.orderId}>
                            <td className="p-2 border">{payment.orderId}</td>
                            <td className="p-2 border">{payment.amount}</td>
                            <td className="p-2 border">{payment.method}</td>
                            <td className="p-2 border">{payment.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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