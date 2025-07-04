import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Order: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // For demo, get product/order info from location.state or use mock
  const order = location.state?.order || {
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
  const [quantity, setQuantity] = useState(order.product.quantity);
  const [requirements, setRequirements] = useState('');
  const [payment, setPayment] = useState('card');

  const totalPrice = order.product.price * quantity;
  const totalOriginal = order.product.originalPrice * quantity;
  const discount = totalOriginal - totalPrice;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <img src={order.product.background || order.product.image} alt="product" className="w-20 h-20 rounded-lg object-cover mr-4" />
          <div className="flex-1">
            <div className="font-bold text-lg mb-1">{order.product.name}</div>
            <div className="text-gray-500 text-sm">{order.product.description}</div>
            
          </div>
        </div>
        <div className="flex justify-between items-start mt-2 text-xs text-gray-400 border-b border-gray-200 pb-2 mb-4">
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center">
              <span className="text-gray-700 font-bold">기본</span>
              <span className="text-gray-600 ml-2"> (30일 / {order.product.originalPrice.toLocaleString()}원)</span>
            </div>
            <div className="flex items-center justify-end min-w-20">
              <span className="text-gray-600 font-bold">{quantity}개</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex flex-row justify-between items-center">
              <span className="text-blue-600 font-bold mr-2">{order.product.discountRate}%</span>
              <span className="line-through text-gray-400 mr-4">{totalOriginal.toLocaleString()}원</span>
              <span className="text-blue-600 font-bold text-lg">{totalPrice.toLocaleString()}원</span>
            </div>
            <span className="text-gray-600 text-sm mt-1">예상 작업기간 {order.product.period}일</span>
          </div>
          
        </div>

        <div className="mb-4 bg-gray-50 p-4 rounded-lg">
          <div className="font-semibold mb-2 text-sm">요구사항</div>
          <textarea
            className="w-full border rounded p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="요구사항에 대한 답변을 입력해 주세요."
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="font-semibold mb-2">포인트 사용</div>
          <div className="text-xs text-gray-400 mb-2">잔여 포인트: 0 P</div>
          <div className="flex gap-2 mb-2">
            <input className="flex-1 border rounded px-3 py-2 text-sm" placeholder="사용할 포인트를 입력해 주세요." disabled />
            <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded font-semibold text-xs" disabled>전액 사용</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="font-semibold mb-2">쿠폰 사용</div>
          <div className="text-xs text-gray-400 mb-2">사용 가능한 쿠폰: 3개</div>
          <div className="flex gap-2 mb-2">
            <input className="flex-1 border rounded px-3 py-2 text-sm" placeholder="사용할 쿠폰을 선택해 주세요." disabled />
            <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded font-semibold text-xs" disabled>쿠폰 선택</button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="font-semibold mb-2">결제 방법</div>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="payment" value="card" checked={payment === 'card'} onChange={() => setPayment('card')} />
            <span>신용카드</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="payment" value="virtual" checked={payment === 'virtual'} onChange={() => setPayment('virtual')} />
            <span>가상계좌</span>
          </label>
        </div>
        <div className="border-t pt-4 mt-4 text-sm">
          <div className="flex justify-between mb-1">
            <span>선택 상품 금액</span>
            <span>{totalOriginal.toLocaleString()} 원</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>즉시 할인</span>
            <span className="text-red-500">-{discount.toLocaleString()} 원</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>쿠폰 할인</span>
            <span>0 원</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>포인트 사용</span>
            <span>0 P</span>
          </div>
          <div className="flex justify-between mt-3 text-lg font-bold">
            <span>총 결제 금액</span>
            <span className="text-blue-600">{totalPrice.toLocaleString()} 원</span>
          </div>
        </div>
      </div>
      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition">주문하기</button>
    </div>
  );
};

export default Order; 