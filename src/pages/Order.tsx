import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CouponCard from '../components/CouponCard';
import { productAPI, ordersAPI, couponsAPI } from '../services/api';

const Order: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  
  // 주문 정보를 location.state에서 가져오거나 기본값 사용
  const orderInfo = location.state?.order || {
    product: {
      id: 1,
      name: '유튜브 수익창출(애드센스) 활성화 관리 해드립니다.',
      image: '/images/product_01.png',
      description: '유튜브 수익창출 애드센스 활성화 도와드립니다.',
      discountRate: 8,
      originalPrice: 600000,
      price: 550000,
      quantity: 1,
      period: 30,
    },
    requirements: '',
    points: 0,
    coupon: '',
    payment: 'card',
  };

  const [quantity, setQuantity] = useState(orderInfo.product.quantity);
  const [requirements, setRequirements] = useState('');
  const [payment, setPayment] = useState('card');
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  // 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        if (orderInfo.product.id) {
          // 백엔드에서 상품 정보 가져오기
          const allProducts = await productAPI.getAllProducts();
          const foundProduct = allProducts.find(p => p.id === orderInfo.product.id);
          if (foundProduct) {
            console.log('백엔드에서 가져온 상품 데이터:', foundProduct);
            setProduct(foundProduct);
          } else {
            console.log('백엔드에서 상품을 찾을 수 없음, 전달받은 데이터 사용:', orderInfo.product);
            setProduct(orderInfo.product);
          }
        } else {
          console.log('상품 ID가 없음, 전달받은 데이터 사용:', orderInfo.product);
          setProduct(orderInfo.product);
        }
      } catch (error) {
        console.error('상품 로드 에러:', error);
        setProduct(orderInfo.product);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [orderInfo.product.id]);

  // 사용자 쿠폰 로드
  useEffect(() => {
    const loadUserCoupons = async () => {
      try {
        setCouponLoading(true);
        
        // 토큰에서 사용자 ID 추출
        const token = localStorage.getItem('token');
        let userId = '';
        
        if (token) {
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userId = payload.id.toString();
            }
          } catch (e) {
            console.log('토큰에서 사용자 ID 추출 실패:', e);
          }
        }
        
        if (userId) {
          const response = await couponsAPI.getUserCoupons(userId);
          if (response.success && response.coupons) {
            // 사용 가능한 쿠폰만 필터링
            const availableCoupons = response.coupons.filter((coupon: any) => !coupon.isUsed);
            setUserCoupons(availableCoupons);
            console.log('사용 가능한 쿠폰:', availableCoupons);
          }
        }
      } catch (error) {
        console.error('사용자 쿠폰 로드 에러:', error);
        setUserCoupons([]);
      } finally {
        setCouponLoading(false);
      }
    };

    loadUserCoupons();
  }, []);

  // 사용자 쿠폰 상태
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  // 가격 계산 함수 (ProductDetail과 동일)
  const calculatePrice = (selectedQuantity: number) => {
    if (!product) return 0;
    
    let price = 0;
    
    // 기간별 가격 사용
    if (selectedQuantity === 1 && product.price1Day) {
      price = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
    } else if (selectedQuantity === 7 && product.price7Days) {
      price = typeof product.price7Days === 'number' ? product.price7Days : parseFloat(String(product.price7Days));
    } else if (selectedQuantity === 30 && product.price30Days) {
      price = typeof product.price30Days === 'number' ? product.price30Days : parseFloat(String(product.price30Days));
    } else {
      // 기간별 가격이 없으면 1일 가격을 기준으로 계산
      let basePrice = 0;
      if (product.price1Day) {
        basePrice = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
      } else if (product.price) {
        basePrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
      }
      
      price = basePrice * selectedQuantity;
    }
    
    return Math.round(price);
  };

  // 원가 계산 함수 (1일 가격을 기준으로 기간별 계산)
  const calculateOriginalPrice = (selectedQuantity: number) => {
    if (!product || !product.price1Day) return 0;
    
    // 1일 가격을 기준으로 기간별 원가 계산
    const basePrice = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
    const originalPrice = basePrice * selectedQuantity;
    
    return Math.round(originalPrice);
  };

  // 할인율 계산 함수
  const calculateDiscountRate = (selectedQuantity: number) => {
    if (!product || !product.price1Day) return 0;
    
    // 1일 선택 시 할인율 0% (1일 가격이 기준이므로 할인 없음)
    if (selectedQuantity === 1) {
      return 0;
    }
    
    // 7일 또는 30일 선택 시 할인율 계산
    const price1Day = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
    
    if (selectedQuantity === 7 && product.price7Days) {
      const price7Days = typeof product.price7Days === 'number' ? product.price7Days : parseFloat(String(product.price7Days));
      const originalPrice = price1Day * 7; // 7일 원가
      const discountRate = ((originalPrice - price7Days) / originalPrice) * 100;
      return Math.round(discountRate);
    }
    
    if (selectedQuantity === 30 && product.price30Days) {
      const price30Days = typeof product.price30Days === 'number' ? product.price30Days : parseFloat(String(product.price30Days));
      const originalPrice = price1Day * 30; // 30일 원가
      const discountRate = ((originalPrice - price30Days) / originalPrice) * 100;
      return Math.round(discountRate);
    }
    
    return 0;
  };

  if (loading) {
    return <div className="text-center py-20">주문 정보를 불러오는 중입니다...</div>;
  }

  if (!product) {
    return <div className="text-center py-20">상품 정보를 찾을 수 없습니다.</div>;
  }

  // 새로운 가격 계산 로직 사용
  const totalPrice = calculatePrice(quantity);
  const totalOriginal = calculateOriginalPrice(quantity);
  const discountRate = calculateDiscountRate(quantity);
  const discount = totalOriginal - totalPrice;
  // 쿠폰 할인 계산
  const couponDiscount = selectedCoupon ? (() => {
    if (selectedCoupon.discountType === 'percentage') {
      const discountAmount = (totalPrice * selectedCoupon.discountValue) / 100;
      return Math.min(discountAmount, selectedCoupon.maxDiscount || 10000);
    } else {
      return Math.min(selectedCoupon.discountValue || 0, selectedCoupon.maxDiscount || 10000);
    }
  })() : 0;

  const finalPrice = totalPrice - couponDiscount;

  // 인증 상태 복구 함수
  const restoreAuthState = () => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    if (!token || !userEmail) {
      console.warn('인증 정보가 누락되어 로그인 페이지로 이동합니다.');
      // 인증 정보가 없으면 로그인 페이지로 이동
      navigate('/login');
      return false;
    }
    
    return true;
  };

  // 주문 처리 함수
  const handleOrder = async () => {
    // 인증 상태 확인
    if (!restoreAuthState()) {
      return;
    }
    
    // 현재 로그인된 사용자 정보 가져오기
    const userEmail = localStorage.getItem('userEmail') || 'guest@example.com';
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find((user: any) => user.email === userEmail);
    const userName = currentUser ? currentUser.name || '고객' : '고객';

    // 한국 시간대의 현재 날짜를 ISO 문자열로 변환하는 함수
    const getKoreanTimeISOString = () => {
      const now = new Date();
      const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      return koreanTime.toISOString();
    };

    // 주문 데이터
    const orderData = {
      orderId: `ORDER-${Date.now()}`,
      productId: product.id,
      product: product.name,
      productName: product.name, // 관리자 페이지 호환성을 위해 추가
      productImage: product.image || product.background,
      quantity: quantity,
      originalPrice: totalOriginal,
      price: totalPrice,
      discountRate: discountRate,
      finalPrice: finalPrice,
      requirements: requirements,
      request: requirements,
      payment: payment,
      paymentMethod: payment === 'card' ? 'card' : 'virtual',
      coupon: selectedCoupon,
      couponDiscount: couponDiscount,
      status: '주문접수',
      date: getKoreanTimeISOString(),
      review: '리뷰 작성하기',
      detail: product.description || product.name,
      // 관리자 페이지에서 필요한 추가 필드들
      refundStatus: '환불대기',
      confirmStatus: '확인대기',
      paymentDate: payment === 'card' ? getKoreanTimeISOString() : '-',
      paymentNumber: `PAY-${Date.now()}`,
      userName: userName,
      userEmail: userEmail
    };

    // 결제내역 데이터
    const paymentData = {
      orderId: orderData.orderId,
      productId: product.id,
      product: product.name, // productName -> product로 변경
      productName: product.name, // 호환성을 위해 유지
      productImage: product.image || product.background,
      quantity: quantity,
      originalPrice: totalOriginal,
      price: totalPrice,
      finalPrice: finalPrice,
      paymentMethod: payment === 'card' ? 'card' : 'virtual',
      paymentDate: getKoreanTimeISOString(),
      status: '결제완료',
      couponDiscount: couponDiscount,
      requirements: requirements,
      request: requirements, // request 추가
      detail: product.description || product.name // detail 추가
    };

    // localStorage에 주문 정보 저장
    try {
      // 백엔드 API에 주문 생성 요청
      const orderRequestData = {
        productId: (product._id || product.id).toString(),
        product: product.name,
        price: totalPrice,
        originalPrice: totalOriginal,
        discountPrice: couponDiscount,
        quantity: quantity,
        paymentMethod: payment === 'card' ? 'card' : 'virtual',
        request: requirements,
        detail: product.description || product.name,
        userName: userName,
        userEmail: userEmail,
        userInfo: {
          name: userName,
          email: userEmail,
          phone: currentUser?.phone || ''
        }
      };

      const apiResponse = await ordersAPI.create(orderRequestData);
      console.log('백엔드 주문 생성 응답:', apiResponse);

      // 주문 성공 시 선택된 쿠폰 사용 처리
      if (apiResponse.success && selectedCoupon) {
        try {
          console.log('쿠폰 사용 처리 시작:', selectedCoupon);
          
          // 쿠폰 사용 API 호출
          const couponResponse = await couponsAPI.useCoupon(selectedCoupon.sendId);
          
          if (couponResponse.success) {
            console.log('쿠폰 사용 성공:', selectedCoupon.name);
            alert(`주문이 완료되었습니다!\n\n사용된 쿠폰: ${selectedCoupon.name}\n할인 금액: ${couponDiscount.toLocaleString()}원`);
          } else {
            console.error('쿠폰 사용 실패:', couponResponse.message);
            alert(`주문은 완료되었지만 쿠폰 사용에 실패했습니다.\n\n${couponResponse.message}`);
          }
          
          // 쿠폰 사용 후 상태 정리
          setSelectedCoupon(null);
          
          // 사용자 쿠폰 목록 새로고침 (사용 완료된 쿠폰 제거)
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const userId = payload.id.toString();
                const response = await couponsAPI.getUserCoupons(userId);
                if (response.success && response.coupons) {
                  const availableCoupons = response.coupons.filter((coupon: any) => !coupon.isUsed);
                  setUserCoupons(availableCoupons);
                }
              }
            } catch (e) {
              console.log('쿠폰 목록 새로고침 실패:', e);
            }
          }
        } catch (couponError) {
          console.error('쿠폰 사용 처리 중 오류:', couponError);
          alert(`주문은 완료되었지만 쿠폰 사용 처리 중 오류가 발생했습니다.`);
        }
      } else if (apiResponse.success) {
        alert('주문이 완료되었습니다!');
      }

      // 백엔드 성공 시 로컬스토리지에도 저장 (인증 정보 보존)
      try {
        const existingOrders = JSON.parse(localStorage.getItem('orderList') || '[]');
        const updatedOrders = [orderData, ...existingOrders];
        localStorage.setItem('orderList', JSON.stringify(updatedOrders));
        
        // localStorage에 결제내역 저장
        const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
        const updatedPayments = [paymentData, ...existingPayments];
        localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
        
        // 인증 상태 확인 및 유지
        const currentToken = localStorage.getItem('token');
        const currentUserEmail = localStorage.getItem('userEmail');
        const currentUserRole = localStorage.getItem('userRole');
        const currentUserName = localStorage.getItem('userName');
        
        if (currentToken && currentUserEmail) {
          console.log('인증 상태 유지됨:', { currentUserEmail, currentUserRole });
        } else {
          console.warn('인증 상태가 누락됨');
        }
      } catch (localError) {
        console.error('로컬 저장 중 오류:', localError);
      }
      
              // 주문 완료 후 인증 상태 재확인
        if (!restoreAuthState()) {
          return;
        }
        
        // 주문 완료 후 사용자 페이지로 이동
        alert('주문이 성공적으로 완료되었습니다!');
        
        // 바로 사용자 페이지로 이동
        navigate('/user?tab=orders', { 
          state: { 
            showOrders: true,
            newOrder: orderData,
            newPayment: paymentData
          } 
        });
    } catch (error) {
      console.error('주문 처리 중 오류:', error);
      
      // 주문 실패 시 에러 메시지 표시
      if (error instanceof Error) {
        alert(`주문 처리 중 오류가 발생했습니다:\n\n${error.message}`);
      } else {
        alert('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
      
      // 백엔드 실패 시에도 로컬스토리지에 저장 (폴백, 인증 정보 보존)
      try {
        const existingOrders = JSON.parse(localStorage.getItem('orderList') || '[]');
        const updatedOrders = [orderData, ...existingOrders];
        localStorage.setItem('orderList', JSON.stringify(updatedOrders));
        
        const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
        const updatedPayments = [paymentData, ...existingPayments];
        localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
        
        // 인증 상태 확인 및 유지
        const currentToken = localStorage.getItem('token');
        const currentUserEmail = localStorage.getItem('userEmail');
        const currentUserRole = localStorage.getItem('userRole');
        
        if (currentToken && currentUserEmail) {
          console.log('폴백 저장 후 인증 상태 유지됨:', { currentUserEmail, currentUserRole });
        } else {
          console.warn('폴백 저장 후 인증 상태가 누락됨');
        }
        
        // 폴백 저장 후 인증 상태 재확인
        if (!restoreAuthState()) {
          return;
        }
        
        alert('주문이 완료되었습니다! (로컬 저장)');
        navigate('/user?tab=orders', { 
          state: { 
            showOrders: true,
            newOrder: orderData,
            newPayment: paymentData
          } 
        });
      } catch (localError) {
        console.error('로컬 저장 중 오류:', localError);
        alert('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 pb-20">
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-row justify-between items-center mb-4">
          <span className="text-gray-700 font-semibold text-base" >주문내역</span>
        </div>
        <div className="flex items-start mb-4">
          <img 
            src={(() => {
              // 이미지 경로 처리 - 상품 이미지를 우선적으로 사용
              console.log('상품 이미지 정보:', { 
                image: product.image, 
                background: product.background,
                name: product.name 
              });
              
              if (product.image) {
                const imagePath = product.image.startsWith('data:') ? 
                  product.image : 
                  product.image.startsWith('/') ? 
                    product.image : 
                    `/${product.image}`;
                console.log('사용할 이미지 경로 (image):', imagePath);
                return imagePath;
              } else if (product.background) {
                const backgroundPath = product.background.startsWith('data:') ? 
                  product.background : 
                  product.background.startsWith('/') ? 
                    product.background : 
                    `/${product.background}`;
                console.log('사용할 이미지 경로 (background):', backgroundPath);
                return backgroundPath;
              }
              console.log('기본 이미지 사용');
              return '/images/default-product.png'; // 기본 이미지
            })()} 
            alt={product.name} 
            className="w-28 h-24 rounded-lg object-cover mr-4"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지로 대체
              console.log('이미지 로드 실패, 기본 이미지로 대체');
              const target = e.currentTarget as HTMLImageElement;
              target.src = '/images/default-product.png';
            }}
          />
          <div className="flex-1 mt-1">
            <div className="font-bold text-lg mb-1">{product.name}</div>
            <div className="text-gray-500 text-sm">{product.description}</div>
            
          </div>
        </div>
        <div className="flex flex-row justify-between w-full items-start text-xs text-gray-400 border-b border-gray-200 py-4 mb-4">
          
          <div className="flex flex-row items-center w-full justify-between">
            <div className="flex items-center">
              <span className="text-gray-700 font-bold">기본</span>
              <span className="text-gray-600 ml-2"> (1일 / {(() => {
                const basePrice = product.price1Day || product.price || 0;
                const price = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;
                return typeof price === 'number' ? price.toLocaleString() : basePrice;
              })()}원)</span>
            </div>
            <div className="flex items-center justify-end min-w-20">
              <span className="text-gray-600 font-bold">{quantity}일</span>
            </div>
          </div>
          <div className="flex flex-col items-end w-full">
            <div className="flex flex-row justify-between items-center">
              <span className="text-blue-600 font-bold mr-2">{discountRate}%</span>
              {(() => {
                // 원가 표시: 1일 가격 기준으로 계산
                const price1Day = product.price1Day || 0;
                let originalPrice = 0;
                
                if (price1Day > 0) {
                  if (quantity === 1) {
                    originalPrice = price1Day; // 1일 원가 (1일 가격과 동일)
                  } else if (quantity === 7) {
                    originalPrice = price1Day * 7; // 7일 원가
                  } else if (quantity === 30) {
                    originalPrice = price1Day * 30; // 30일 원가
                  }
                }
                
                return originalPrice > 0 ? (
                  <span className="line-through text-gray-400 mr-4">{originalPrice.toLocaleString()}원</span>
                ) : null;
              })()}
              <span className="text-blue-600 font-bold text-lg">{totalPrice.toLocaleString()}원</span>
            </div>
            <span className="text-gray-600 text-xs mt-1">예상 작업기간 
              <span className="text-blue-600 font-bold ml-1">{quantity}</span>일
            </span>
          </div>
          
        </div>

        <div className="mb-4 bg-gray-50 p-4 rounded-lg">
          <div className="font-semibold mb-2 text-sm">요구사항</div>
          <textarea
            className="w-full border rounded p-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="요구사항에 대한 답변을 입력해 주세요."
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="font-semibold mb-2">포인트 사용</div>
          <div className="text-xs text-gray-500 mb-2">잔여 포인트: 0 P</div>
          <div className="flex gap-2 mb-2">
            <input className="flex-1 border rounded px-3 py-2 text-gray-500 text-xs" placeholder="사용할 포인트를 입력해 주세요." disabled />
            <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded font-semibold text-xs" disabled>전액 사용</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="font-semibold mb-2">쿠폰 사용</div>
          <div className="text-xs text-gray-500 mb-2">
            사용 가능한 쿠폰: {couponLoading ? '로딩 중...' : userCoupons.length}개
          </div>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-xs"
              placeholder={selectedCoupon ? selectedCoupon.name : "사용할 쿠폰을 선택해 주세요."}
              value={selectedCoupon ? selectedCoupon.name : ""}
              readOnly
            />
            <button 
              className={`px-4 py-2 rounded font-semibold text-xs ${
                userCoupons.length > 0 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-gray-100 text-gray-400'
              }`}
              onClick={() => userCoupons.length > 0 && setCouponModalOpen(true)}
              disabled={userCoupons.length === 0}
            >
              쿠폰 선택
            </button>
            {selectedCoupon && (
              <button 
                className="px-4 py-2 rounded font-semibold text-xs bg-gray-500 text-white hover:bg-gray-600"
                onClick={() => setSelectedCoupon(null)}
              >
                선택 해제
              </button>
            )}
          </div>
        </div>
      </div>
      {/* 쿠폰 선택 모달 */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-lg">쿠폰 선택</span>
              <button onClick={() => setCouponModalOpen(false)} className="text-2xl">&times;</button>
            </div>
            <div className="flex flex-wrap gap-3 max-h-[60vh] overflow-y-auto">
              {userCoupons.length > 0 ? (
                userCoupons.map((coupon, idx) => (
                  <div key={idx} className="w-full sm:w-[calc(50%-6px)]">
                    <CouponCard
                      title={coupon.name}
                      expiry={coupon.endDate}
                      maxDiscount={coupon.maxDiscount || 10000}
                      discountRate={coupon.discountType === 'percentage' ? coupon.discountValue : 0}
                      brand={coupon.brand || 'ADMORE'}
                      couponCode={coupon.code}
                    />
                    <button
                      className="w-full mt-2 bg-orange-600 text-white py-2 rounded text-sm hover:bg-orange-700 transition"
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setCouponModalOpen(false);
                      }}
                    >
                      이 쿠폰 사용하기
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-8 text-gray-500">
                  사용 가능한 쿠폰이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="font-semibold mb-2">결제 방법</div>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="payment" value="card" checked={payment === 'card'} onChange={() => setPayment('card')} />
            <span className="text-gray-700 text-sm" >신용카드</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="payment" value="virtual" checked={payment === 'virtual'} onChange={() => setPayment('virtual')} />
            <span className="text-gray-700 text-sm" >가상계좌</span>
          </label>
        </div>
        <div className="border-t pt-4 mt-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-700 text-xs" >선택 상품 금액</span>
            <span className="text-gray-700 text-xs" >{(() => {
              const price = typeof totalOriginal === 'string' ? parseFloat(totalOriginal) : totalOriginal;
              return typeof price === 'number' ? price.toLocaleString() : totalOriginal;
            })()} 원</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-700 text-xs" >즉시 할인</span>
            <span className="text-red-500 text-xs">-{(() => {
              const price = typeof discount === 'string' ? parseFloat(discount) : discount;
              return typeof price === 'number' ? price.toLocaleString() : discount;
            })()} 원</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-700 text-xs" >쿠폰 할인</span>
            <span className="text-red-500 text-xs">
              -{couponDiscount.toLocaleString()} 원
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-700 text-xs" >포인트 사용</span>
            <span className="text-gray-700 text-xs" >0 P</span>
          </div>
          <div className="flex justify-between mt-3 text-lg font-bold">
            <span className="text-gray-700 text-lg" >총 결제 금액</span>
            <span className="text-blue-600 text-lg">{(() => {
              const price = typeof finalPrice === 'string' ? parseFloat(finalPrice) : finalPrice;
              return typeof price === 'number' ? price.toLocaleString() : finalPrice;
            })()} 원</span>
          </div>
        </div>
      </div>
      <button 
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-orange-700 transition"
        onClick={handleOrder}
      >
        주문하기
      </button>
    </div>
  );
};

export default Order; 