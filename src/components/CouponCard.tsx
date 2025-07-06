import React from "react";

interface CouponCardProps {
  title: string;
  expiry: string;
  maxDiscount: number;
  discountRate: number;
  onUse: () => void;
}

const CouponCard: React.FC<CouponCardProps> = ({
  title,
  expiry,
  maxDiscount,
  discountRate,
  onUse,
}) => {
  return (
    <div
      className="relative bg-white text-center rounded-xl shadow-lg border border-dashed border-gray-400 overflow-hidden 
          transition-transform duration-200 hover:scale-105 hover:shadow-xl"
    >
      {/* 왼쪽 구멍 */}
      {/* <div className="absolute top-[120px] -left-4 w-8 h-8 bg-gray-200 rounded-full z-10 -translate-y-1/2"></div> */}
      {/* 오른쪽 구멍 */}
      {/* <div className="absolute top-[120px] -right-4 w-8 h-8 bg-gray-200 rounded-full z-10 -translate-y-1/2"></div> */}
      {/* 점선 */}
      {/* <div className="absolute left-0 right-0 top-[106px] h-4 border-b-2 border-dashed border-gray-300 z-0"></div> */}


      <div className="flex flex-col items-center justify-center">
        <div className="px-4 pt-4 flex flex-col w-full ">
          <h2 className="text-[16px] font-bold text-gray-800 text-left">{title}</h2>
          <p className="text-gray-600 text-[12px] text-left mt-2">
            {expiry}
            <br />
            (최대 {maxDiscount.toLocaleString()}원 할인)
          </p>
        </div>
        <div className="px-4 flex flex-row items-center justify-between w-full">
          <div className="mt-2 text-gray-600 font-semibold text-[14px]">사용 가능</div>
          <div className="mt-2 text-blue-600 font-bold text-[14px]">{discountRate}%</div>
        </div>
        <button
          className="mt-4 w-full text-sm font-semibold px-4 py-3 bg-orange-600 text-white rounded-b-lg hover:bg-orange-700 transition"
          onClick={onUse}
        >
          쿠폰 사용하기
        </button>
      </div>
    </div>
  );
};

export default CouponCard; 