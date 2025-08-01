import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CouponCard from '../components/CouponCard';
import { productAPI, ordersAPI } from '../services/api';

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
  const [selectedCoupon, setSelectedCoupon] = useState<null | typeof coupons[0]>(null);

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
            setProduct(foundProduct);
          } else {
            setProduct(orderInfo.product);
          }
        } else {
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

  // 예시 쿠폰 데이터
  const coupons = [
    {
      title: '가입 환영 10% 할인 쿠폰',
      expiry: '2025년 07월 09일 13:49',
      maxDiscount: 10000,
      discountRate: 10,
    },
    {
      title: '가입 환영 10% 할인 쿠폰',
      expiry: '2025년 07월 09일 13:49',
      maxDiscount: 10000,
      discountRate: 10,
    },
    {
      title: '가입 환영 10% 할인 쿠폰',
      expiry: '2025년 07월 09일 13:49',
      maxDiscount: 10000,
      discountRate: 10,
    },
  ];

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
    
    // 1일 가격을 기준으로 원가 계산
    const basePrice = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(String(product.price1Day));
    const originalPrice = basePrice * selectedQuantity;
    
    // 선택된 기간의 실제 가격
    let actualPrice = 0;
    if (selectedQuantity === 1) {
      actualPrice = basePrice;
    } else if (selectedQuantity === 7 && product.price7Days) {
      actualPrice = typeof product.price7Days === 'number' ? product.price7Days : parseFloat(String(product.price7Days));
    } else if (selectedQuantity === 30 && product.price30Days) {
      actualPrice = typeof product.price30Days === 'number' ? product.price30Days : parseFloat(String(product.price30Days));
    } else {
      actualPrice = originalPrice; // 할인 없음
    }
    
    // 할인율 계산 (1일은 할인 없음)
    if (selectedQuantity === 1) {
      return 0;
    }
    
    const discountRate = ((originalPrice - actualPrice) / originalPrice) * 100;
    return Math.round(discountRate);
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
  // 쿠폰 할인 금액 계산 (쿠폰 사용 비활성화)
  const couponDiscount = 0;
  const finalPrice = totalPrice - couponDiscount;

  // 주문 처리 함수
  const handleOrder = async () => {
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
        productId: product.id.toString(),
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

      // 백엔드 성공 시 로컬스토리지에도 저장
      const existingOrders = JSON.parse(localStorage.getItem('orderList') || '[]');
      const updatedOrders = [orderData, ...existingOrders];
      localStorage.setItem('orderList', JSON.stringify(updatedOrders));
      
      // localStorage에 결제내역 저장
      const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
      const updatedPayments = [paymentData, ...existingPayments];
      localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
      
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
      
      // 백엔드 실패 시에도 로컬스토리지에 저장 (폴백)
      try {
        const existingOrders = JSON.parse(localStorage.getItem('orderList') || '[]');
        const updatedOrders = [orderData, ...existingOrders];
        localStorage.setItem('orderList', JSON.stringify(updatedOrders));
        
        const existingPayments = JSON.parse(localStorage.getItem('paymentList') || '[]');
        const updatedPayments = [paymentData, ...existingPayments];
        localStorage.setItem('paymentList', JSON.stringify(updatedPayments));
        
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
        <div className="flex items-center mb-4">
          <img src={product.background || product.image} alt="product" className="w-28 h-20 rounded-lg object-cover mr-4" />
          <div className="flex-1">
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
              {discountRate > 0 && (
                <span className="text-blue-600 font-bold mr-2">{discountRate}%</span>
              )}
              {discountRate > 0 && (
                <span className="line-through text-gray-400 mr-4">{totalOriginal.toLocaleString()}원</span>
              )}
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
          <div className="text-xs text-gray-500 mb-2">사용 가능한 쿠폰: 0개</div>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 border rounded px-3 py-2 bg-gray-100 text-gray-400 text-xs"
              placeholder="사용할 쿠폰을 선택해 주세요."
              value=""
              readOnly
              disabled
            />
            <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded font-semibold text-xs" disabled>쿠폰 선택</button>
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
              {coupons.map((coupon, idx) => (
                <div key={idx} className="w-full sm:w-[calc(50%-6px)]">
                  <CouponCard
                    title={coupon.title}
                    expiry={coupon.expiry}
                    maxDiscount={coupon.maxDiscount}
                    discountRate={coupon.discountRate}
                    onUse={() => {
                      setSelectedCoupon(coupon);
                      setCouponModalOpen(false);
                    }}
                  />
                </div>
              ))}
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
            <span className="text-gray-400 text-xs">
              0 원
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