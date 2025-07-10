import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ReviewWritePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 상품 정보는 location.state로 전달받는다고 가정
  const order = location.state?.order || {};

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 서버에 리뷰 등록 요청
    alert('리뷰가 등록되었습니다!');
    navigate('/mypage?tab=orders');
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="font-bold text-lg mb-4">리뷰 작성</h2>
      <div className="mb-4">
        <div className="font-semibold">{order.product}</div>
        <div className="text-xs text-gray-500">{order.detail}</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={e => setImage(e.target.files?.[0] || null)}
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