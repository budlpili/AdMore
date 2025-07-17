import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faSolidHeart, faHeart as faRegularHeart, faStar as faSolidStar, faStarHalfAlt, faStar as faRegularStar, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-brands-svg-icons';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onFavoriteToggle: (id: number) => void;
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
  return (
    <Link
      to={linkTo || `/products/${product.id}`}
      className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 flex-1 cursor-pointer group"
      style={cardWidthPx ? { minWidth: `${cardWidthPx}px`, maxWidth: `${cardWidthPx}px` } : {}}
    >
      {/* 즐겨찾기 버튼 */}
      <button
        className="absolute top-4 right-4 z-10"
        onClick={e => { e.preventDefault(); onFavoriteToggle(product.id); }}
      >
        <FontAwesomeIcon
          icon={isFavorite ? faSolidHeart : faRegularHeart}
          className={`text-2xl ${isFavorite ? 'text-red-500' : 'text-gray-300'}`}
        />
      </button>
      {/* 카드 상품 이미지 */}
      <div
        className="flex justify-center items-center h-40 p-6 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundImage: product.background ? `url(${product.background})` : undefined,
          backgroundColor: !product.background ? '#FFF7ED' : undefined
        }}
      >
        <FontAwesomeIcon
          icon={safeCategoryIcon.icon}
          className={`text-5xl ${safeCategoryIcon.color}`}
        />
      </div>
      {/* 카드 내용 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-gray-500 text-xs mb-2 truncate">{product.description}</p>
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-end mb-1">
            {product.discountRate && (
              <span className="text-blue-600 font-bold text-sm mr-2">{product.discountRate}%</span>
            )}
            {product.originalPrice && (
              <span className="text-gray-400 line-through text-sm mr-2">{product.originalPrice.toLocaleString()}원</span>
            )}
            <span className="text-gray-900 font-bold text-sm">{typeof product.price === 'number' ? product.price.toLocaleString() : product.price}원</span>
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
    </Link>
  );
};

export default ProductCard; 