import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar, faHeart as faSolidHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faRegularHeart } from '@fortawesome/free-regular-svg-icons';
import { mockReviews } from './Reviews';
import Home from './Home';
import { products } from '../data/products';
import { addRecentProduct } from '../utils/recentProducts';

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

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // 실제로는 product 데이터를 context나 별도 파일에서 import하는 것이 좋음
  // 여기서는 Home에서 popularProducts를 가져온다고 가정
  const product = products.find(p => p.id === Number(id));

  // 문의 폼 상태
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    category: '상품 문의',
    subject: product ? `[상품문의] ${product.name}` : '',
    message: ''
  });

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

  const [tab, setTab] = useState<'desc' | 'review'>('desc');

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

  if (!product) {
    return <div className="text-center py-20">상품을 찾을 수 없습니다.</div>;
  }

  // 해당 상품에 대한 리뷰만 필터링
  const productReviews = mockReviews.filter((r: any) => r.product.includes(product.name));

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 flex flex-col lg:flex-row gap-8">
      {/* 왼쪽: 서비스 설명/평가 탭 */}
      <div className="flex-1 min-w-0">
        <div className="flex border-b mb-6">
          <button
            className={`px-6 py-3 font-semibold border-b-2 transition-colors duration-200 ${tab === 'desc' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setTab('desc')}
          >서비스 설명</button>
          <button
            className={`px-6 py-3 font-semibold border-b-2 transition-colors duration-200 ${tab === 'review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setTab('review')}
          >서비스 평가</button>
        </div>
        {tab === 'desc' ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">서비스 설명</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description || '상품에 대한 상세 설명이 준비 중입니다.'}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">서비스 평가</h2>
            {productReviews.length === 0 ? (
              <div className="text-gray-400">아직 후기가 없습니다.</div>
            ) : (
              <div className="space-y-6">
                {productReviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="border-b pb-4 mb-4 last:border-b-0 last:mb-0">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-blue-600 mr-2">{review.user}</span>
                      <span className="text-xs text-gray-400">{review.time}</span>
                      <span className="ml-3 flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FontAwesomeIcon
                            key={i}
                            icon={i < review.rating ? faSolidStar : faRegularStar}
                            className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </span>
                    </div>
                    <div className="mb-2 text-gray-900">{review.content}</div>
                    {review.reply && (
                      <div className="bg-gray-50 border-l-4 border-blue-400 p-3 text-sm text-gray-700 mt-2">
                        <div className="flex items-center mb-1">
                          <span className="font-bold text-blue-600">애드모어</span>
                          <span className="text-xs text-gray-400 ml-2">{review.replyTime}</span>
                        </div>
                        <span>{review.reply}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* 오른쪽: 상품 정보 카드 */}
      <div className="w-full lg:w-[380px] flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-28">
          {/* 이미지/배경 */}
          <div className="flex justify-end pb-2">
            <button
              className="text-xl"
              onClick={() => toggleFavorite(product.id)}
            >
              <FontAwesomeIcon
                icon={favorites.includes(product.id) ? faSolidHeart : faRegularHeart}
                className={`text-xl ${favorites.includes(product.id) ? 'text-red-500' : 'text-gray-300'}`}
              />
            </button>
          </div>
            
          <div
            className="w-full h-40 rounded-lg bg-cover bg-center flex items-center justify-center mb-4 relative"
            style={{
              backgroundImage: product.background ? `url(${product.background})` : undefined,
              backgroundColor: !product.background ? '#FFF7ED' : undefined
            }}
          >
          </div>
          {/* 상품정보내용 */}
          <div className="flex flex-row justify-between items-end mb-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold mb-1">{product.name}</h1>
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
              <button className="w-8 h-8 border rounded text-lg" onClick={handleDecrease} disabled={quantity === 1}>-</button>
              <span className="mx-3">{quantity}</span>
              <button className="w-8 h-8 border rounded text-lg" onClick={handleIncrease} disabled={quantity === 99}>+</button>
            </div>
          </div>
          
          {/* 가격 */}
          <div className="flex items-center mb-6 w-full justify-end">
            {product.discountRate && (
              <span className="text-blue-600 font-bold text-lg mr-2">{product.discountRate}%</span>
            )}
            {product.originalPrice && (
              <span className="text-gray-400 line-through text-sm mr-4">{(product.originalPrice * quantity).toLocaleString()}원</span>
            )}
            <span className="text-gray-900 font-bold text-2xl">{typeof product.price === 'number' ? (product.price * quantity).toLocaleString() : product.price}원</span>
          </div>
          
          {/* 수량/주문 버튼 */}
          <button className="w-full bg-orange-600 text-white py-3 rounded-md hover:bg-orange-700 transition duration-300 text-lg font-semibold mb-4"
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
          <div className="text-xs text-gray-500 border-t pt-3">
            <div className="font-bold mb-1">취소 및 환불 규정</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>서비스 요청 전에는 100% 환불 가능합니다.</li>
              <li>서비스 요청 후에는 중단 및 수정이 불가하여, 환불이 불가합니다.</li>
              <li>애드모어 서비스 문제로 인한 지연 및 진행이 불가한 경우 협의하여 환불이 가능합니다.</li>
              <li>모든 서비스는 요청 후 24시간 이내로 평균 시작됩니다.</li>
              <li>환불은 기본적으로 동일 결제수단 환불로 진행됩니다.</li>
            </ul>
          </div>
          <div className="mt-4 text-xs text-blue-600 font-semibold flex items-center">
            <span className="mr-2">ⓘ</span> 상품 문의 혹은 커스텀 문의도 가능해요!
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ProductDetail; 