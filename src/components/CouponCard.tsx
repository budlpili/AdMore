import React from "react";

interface CouponCardProps {
  title: string;
  expiry: string;
  maxDiscount: number;
  discountRate: number;
  onUse: () => void;
  used?: boolean; // 추가
  brand?: string;
}

const CouponCard: React.FC<CouponCardProps> = ({
  title,
  expiry,
  maxDiscount,
  discountRate,
  onUse,
  used = false,
  brand = 'WELCOME COUPON',
}) => {
  // 쿠폰 만료일 확인
  const isExpired = () => {
    try {
      const expireDate = new Date(expiry.replace('년 ', '-').replace('월 ', '-').replace('일 ', ' ').split(' ')[0]);
      const today = new Date();
      return expireDate < today;
    } catch {
      return false;
    }
  };

  const expired = isExpired();

  // 카드 전체 클릭 핸들러
  const handleCardClick = () => {
    if (!used && !expired && onUse) onUse();
  };

  return (
    <div
      className="mx-0 my-0 cursor-pointer"
      style={{
        width: "100%",
      }}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-disabled={used || expired}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && !used && !expired) {
          e.preventDefault();
          onUse && onUse();
        }
      }}
    >
      <svg
        viewBox="0 0 200 240"
        width="100%"
        style={{
          borderRadius: 16,
          background: "transparent",
          width: "100%",
          height: "auto",
          display: "block",
          overflow: "visible", // 그림자 잘림 방지
        }}
      >
        {/* Drop shadow filter and mask for holes */}
        <defs>
          <filter id="coupon-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.12" />
          </filter>
          <mask id="coupon-mask">
            <rect x="0" y="0" width="200" height="260" fill="white" />
            <circle cx="0" cy="120" r="12" fill="black" />
            <circle cx="200" cy="120" r="12" fill="black" />
          </mask>
        </defs>
        {/* Coupon body with mask and shadow */}
        <g filter="url(#coupon-shadow)">
          <rect
            x="0"
            y="0"
            width="200"
            height="240"
            rx="16"
            fill="#fff"
            mask="url(#coupon-mask)"
          />
          {/* Top purple area */}
          <rect
            x="0"
            y="0"
            width="200"
            height="120"
            rx="16"
            fill="#552d90"
            mask="url(#coupon-mask)"
          />
        </g>
        {/* Dotted line */}
        <line
          x1="12"
          y1="120"
          x2="188"
          y2="120"
          stroke="#e5e7eb"
          strokeDasharray="6 4"
          strokeWidth="2"
        />
        {/* Content */}
        <foreignObject x="0" y="0" width="200" height="240">
          <div className="flex flex-col items-center w-full h-full">
            {/* Top text */}
            <div className="pt-5 pb-2 text-white text-[12px] font-semibold flex items-center justify-center gap-1 tracking-wide">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="mx-1">{brand}</span>
              <span className="text-yellow-400 text-sm">★</span>
            </div>
            <div className="text-[36px] font-extrabold text-white leading-none">{discountRate}%</div>
            <div className="text-[12px] font-normal text-white tracking-widest mb-1">COUPON</div>
            {/* Bottom text */}
            <div className="mt-[30px] text-[#552d90] text-base font-semibold mb-1">{title}</div>
            <div className="font-semibold text-gray-700 text-[12px]">{expiry}</div>
            <div className="text-gray-500 text-[12px] mb-2">(최대 {maxDiscount.toLocaleString()}원 할인)</div>
            {/* Barcode (원하면 주석 해제) */}
            {/* <div className="flex justify-center mb-4">
              <div className="h-10 w-40 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_6px)]"></div>
            </div> */}
            <button
              className={`w-full text-sm font-semibold mt-1 transition
                ${used || expired
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-orange-600 hover:text-orange-700"}
              `}
              tabIndex={-1}
              type="button"
              disabled={used || expired}
            >
              {used ? "사용 완료" : expired ? "쿠폰 만료" : "사용 가능"}
            </button>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

export default CouponCard; 