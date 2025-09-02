import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faSolidHeart, faHeart, faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar, faPlayCircle, faGift } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-brands-svg-icons';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onFavoriteToggle: (id: string | number) => void;
  categoryIcon: { icon: IconDefinition; color: string };
  cardWidthPx?: number;
  linkTo?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  onFavoriteToggle,
  categoryIcon,
  cardWidthPx,
  linkTo
}) => {
  // categoryIcon이 undefined일 때 기본값 사용
  const safeCategoryIcon = categoryIcon || { icon: faPlayCircle, color: 'text-gray-400' };
  
  // 준비중 상태 확인
  const isPreparing = product.status === 'inactive';
  
  // 준비중이 아닌 경우에만 Link 컴포넌트 사용
  const CardContent = () => (
    <div
      className={`relative bg-white rounded-lg shadow-md overflow-hidden transition duration-300 flex-1 group ${
        isPreparing 
          ? 'cursor-not-allowed opacity-75' 
          : 'cursor-pointer hover:shadow-lg'
      }`}
      style={cardWidthPx ? { minWidth: `${cardWidthPx}px`, maxWidth: `${cardWidthPx}px` } : {}}
      onClick={(e) => {
        if (isPreparing) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        console.log('상품 카드 클릭:', product._id || product.id, product.name);
        console.log('상품 전체 정보:', product);
        console.log('이동할 경로:', linkTo || `/products/${product._id || product.id}`);
      }}
    >

      

      {/* 즐겨찾기 버튼 */}
      <button
        className="absolute top-4 right-4 z-10 bg-black/30 rounded-full w-8 h-8 border border-gray-50
          flex items-center justify-center"
        onClick={e => { e.preventDefault(); onFavoriteToggle(product._id || product.id || ''); }}
      >
        <FontAwesomeIcon
          icon={isFavorite ? faSolidHeart : faHeart}
          className={`text-lg ${isFavorite ? 'text-red-500' : 'text-gray-100'}`}
        />
      </button>
      {/* 카드 상품 이미지 - 4:3 비율 유지 */}
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <div
          className="absolute inset-0 flex justify-center items-center bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundImage: product.background ? 
              (product.background.startsWith('data:') ? 
                `url(${product.background})` : 
                product.background.startsWith('/') ? 
                  `url(${product.background})` : 
                  `url(/${product.background})`
              ) : undefined,
            backgroundColor: !product.background ? '#FFF7ED' : undefined
          }}
        >
          {/* 준비중 오버레이 효과 - 이미지 영역에만 적용 */}
          {isPreparing && (
            <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
              <div className="rounded-lg px-4 py-3 shadow-lg flex flex-col items-center gap-2">
                <FontAwesomeIcon
                  icon={faGift}
                  className="text-[32px] text-gray-200"
                />
                <span className="text-gray-200 font-semibold text-sm">준비중입니다.</span>
              </div>
            </div>
          )}
          {product.image ? (
            <img 
              src={product.image.startsWith('data:') ? 
                product.image : 
                product.image.startsWith('/') ? 
                  product.image : 
                  `/${product.image}`
              } 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 이미지 로드 실패 시 카테고리 아이콘 표시
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const iconElement = parent.querySelector('.category-icon') as HTMLElement;
                  if (iconElement) {
                    iconElement.style.display = 'flex';
                  }
                }
              }}
            />
          ) : null}
          <FontAwesomeIcon
            icon={safeCategoryIcon.icon}
            className={`text-5xl ${safeCategoryIcon.color} category-icon`}
            style={{ display: product.image ? 'none' : 'flex' }}
          />
        </div>
      </div>
      {/* 카드 내용 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">
          {product.status && product.status !== 'active' && (
            <span className="inline-block mr-2 text-yellow-600 text-xs font-bold align-middle">[준비중]</span>
          )}
          <span className="align-middle">{product.name}</span>
        </h3>
        <p className="text-gray-500 text-xs mb-2 truncate">{product.description}</p>
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-end mb-1">
            {/* 기간별 가격 표시 */}
            <span className="text-gray-900 font-bold text-sm">
              {(() => {
                // 1일 가격을 기본으로 표시
                let price = 0;
                let period = '1일';
                
                if (product.price1Day) {
                  price = typeof product.price1Day === 'number' ? product.price1Day : parseFloat(product.price1Day);
                  period = '1일';
                } else if (typeof product.price === 'number') {
                  price = product.price;
                  period = '1일';
                }
                
                return `${period} ${price.toLocaleString()}원`;
              })()}
            </span>
          </div>
          <div className="flex items-center justify-end">
            {/* 별점 표시 */}
            {(() => {
              const stars = [];
              const rating = product.rating ?? 0;
              for (let i = 1; i <= 5; i++) {
                if (rating >= i) {
                  stars.push(<FontAwesomeIcon key={i} icon={faSolidStar} className="text-yellow-400 text-xs" />);
                } else if (rating >= i - 0.5) {
                  stars.push(<FontAwesomeIcon key={i} icon={faStarHalfAlt} className="text-yellow-400 text-xs" />);
                } else {
                  stars.push(<FontAwesomeIcon key={i} icon={faRegularStar} className="text-gray-300 text-xs" />);
                }
              }
              return stars;
            })()}
            <span className="text-gray-700 font-medium ml-2 mr-1 text-xs">{product.rating?.toFixed(1)}</span>
            <span className="text-gray-400 text-[10px] font-semibold">({product.reviewCount?.toLocaleString()})</span>
          </div>
        </div>
        
      </div>
    </div>
  );
  
  // 준비중이 아닌 경우에만 Link로 감싸기
  if (isPreparing) {
    return <CardContent />;
  }
  
  return (
    <Link to={linkTo || `/products/${product._id || product.id}`}>
      <CardContent />
    </Link>
  );
};

export default ProductCard; 