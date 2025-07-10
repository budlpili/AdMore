import React from 'react';
import { useParams } from 'react-router-dom';

const dummyProduct = {
  id: 1,
  name: '유튜브 구독자 100명',
  detail: '기본 1일/5,000원',
  price: '50,000원',
  description: '유튜브 채널 구독자를 빠르고 안전하게 늘려드립니다.',
  image: 'https://via.placeholder.com/400x200?text=Product+Image',
};

const ProductPage = () => {
  const { id } = useParams();
  // 실제로는 id로 상품 데이터 fetch
  const product = dummyProduct;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded mb-4" />
      <h2 className="font-bold text-2xl mb-2">{product.name}</h2>
      <div className="text-gray-500 mb-2">{product.detail}</div>
      <div className="text-lg font-bold text-orange-500 mb-4">{product.price}</div>
      <div className="mb-4">{product.description}</div>
      <button className="w-full py-2 rounded bg-orange-500 text-white font-semibold hover:bg-orange-600">
        구매하기
      </button>
    </div>
  );
};

export default ProductPage; 