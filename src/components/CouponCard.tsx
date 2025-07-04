import React from 'react';

interface CouponCardProps {
  title: string;
  expiry: string;
  maxDiscount: number;
  discountRate: number;
  onUse: () => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ title, expiry, maxDiscount, discountRate, onUse }) => {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-gray-500">{expiry} 까지</div>
          <div className="text-xs text-gray-400">(최대 {maxDiscount.toLocaleString()}원 할인)</div>
          <div className="text-blue-600 font-bold mt-2">사용 가능</div>
        </div>
        <div className="text-blue-600 font-bold text-2xl">{discountRate}%</div>
      </div>
      <button
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        onClick={onUse}
      >
        쿠폰 사용
      </button>
    </div>
  );
};

export default CouponCard; 