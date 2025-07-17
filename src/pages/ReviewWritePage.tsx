import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { products } from '../data/products';

const ReviewWritePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order || {};
  const product = products.find(p => p.id === order.productId);
  
  // 이미지 우선순위: order.image > product.background > product.image > placeholder
  const image = order.image || 
                product?.background || 
                (product?.image ? `/images/${product.image}` : null) ||
                'https://via.placeholder.com/400x200?text=Product+Image';

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // localStorage에서 orderList 가져오기
    const orderList = JSON.parse(localStorage.getItem('orderList') || '[]');
    
    // 해당 주문 찾기 및 review 상태 업데이트
    const updatedOrderList = orderList.map((o: any) => {
      if (o.orderId === order.orderId) {
        return { ...o, review: '리뷰 작성 완료' };
      }
      return o;
    });
    
    // localStorage에 업데이트된 orderList 저장
    localStorage.setItem('orderList', JSON.stringify(updatedOrderList));
    
    alert('리뷰가 등록되었습니다!');
    navigate('/mypage?tab=orders');
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="font-bold text-lg mb-4">리뷰 작성</h2>
      <div className="mb-4 flex flex-col md:flex-row gap-6 items-start">
        <img
          src={image}
          alt={order.product || product?.name || '상품 이미지'}
          className="w-full md:w-60 h-40 object-cover rounded border cursor-pointer hover:opacity-80 transition"
          onClick={() => product && navigate(`/products/${product.id}`)}
          title="상품 상세페이지로 이동"
        />
        <div className="flex-1">
          <div className="font-semibold">{order.product || product?.name}</div>
          <div className="text-xs text-gray-500 mb-2">{order.detail || product?.description}</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1">별점</label>
          <div className="flex gap-1">
            {[1,2,3,4,5].map((star) => (
              <button
                type="button"
                key={star}
                className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                onClick={() => setRating(star)}
              >★</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">리뷰 내용</label>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={4}
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">사진 첨부 (선택)</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded bg-orange-500 text-white font-semibold hover:bg-orange-600"
        >
          리뷰 등록
        </button>
      </form>
    </div>
  );
};

export default ReviewWritePage; 