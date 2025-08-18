import { Product } from '../types';

const products: Product[] = [
  {
    id: 1,
    name: '유튜브 마케팅 활성화',
    description: '유튜브 구독자,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리 해드립니다.',
    discountRate: 16,
    originalPrice: 6000,
    price: 5000,
    price1Day: 5000,
    price7Days: 30000,
    price30Days: 100000,
    category: '유튜브',
    image: 'youtube.png',
    background: '/images/product_01.png',
    clickCount: 1800,
    rating: 4.7,
    reviewCount: 2671,
    status: 'active',
    stock: 100,
    tags: ['유튜브 구독자', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '유튜브 채널의 구독자 수, 조회수, 좋아요, 수익창출, 스트리밍 시청 활성화를 종합적으로 관리해드리는 서비스입니다.',
    specifications: '서비스 기간: 30일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    name: '페이스북 팔로워 1000명',
    description: '진짜 팔로워로 페이지 신뢰도 상승!',
    discountRate: 10,
    originalPrice: 55000,
    price: 50000,
    price1Day: 8000,
    price7Days: 45000,
    price30Days: 150000,
    category: '페이스북',
    image: 'facebook.png',
    background: '/images/product_02.png',
    clickCount: 1200,
    rating: 4.5,
    reviewCount: 1200,
    status: 'active',
    stock: 50,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '페이스북 페이지의 팔로워를 1000명 증가시켜 페이지의 신뢰도와 영향력을 높여드립니다.',
    specifications: '서비스 기간: 7일\n처리 시간: 12-24시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 3,
    name: '페이스북 좋아요 2000개',
    description: '페이지/게시물 좋아요 빠른 증가!',
    discountRate: 20,
    originalPrice: 50000,
    price: 40000,
    price1Day: 7000,
    price7Days: 35000,
    price30Days: 120000,
    category: '페이스북',
    image: 'facebook.png',
    background: '/images/product_03.png',
    clickCount: 1100,
    rating: 4.3,
    reviewCount: 800,
    status: 'active',
    stock: 75,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '페이스북 페이지나 게시물에 좋아요를 2000개 증가시켜 인기도를 높여드립니다.',
    specifications: '서비스 기간: 5일\n처리 시간: 6-12시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 4,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_04.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 200,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 5,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_05.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 150,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 6,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_06.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 120,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 7,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_07.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 80,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 8,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_08.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 90,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 9,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_09.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 60,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 10,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_10.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 70,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 11,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_11.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 85,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 12,
    name: '인스타그램 팔로워 500명',
    description: '실제 유저 기반 팔로워 증가!',
    discountRate: 25,
    originalPrice: 40000,
    price: 30000,
    price1Day: 6000,
    price7Days: 30000,
    price30Days: 100000,
    category: '인스타그램',
    image: 'instagram.png',
    background: '/images/product_04.png',
    clickCount: 950,
    rating: 4.8,
    reviewCount: 1500,
    status: 'active',
    stock: 95,
    tags: ['팔로워', '조회수', '좋아요', '수익창출', '스트리밍 시청 활성화 관리'],
    detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
    specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
];

// default export 추가
export default products;

// localStorage 연동 함수들
export const getProducts = (): Product[] => {
  try {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts);
      // blob URL이 있는지 확인하고 기본 이미지로 교체
      const cleanedProducts = parsedProducts.map((product: Product) => ({
        ...product,
        image: product.image && product.image.startsWith('blob:') ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEM0Q3RDAiLz4KPHN2ZyB4PSIzNSIgeT0iMzUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxN0gxNFYxOFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cjwvc3ZnPgo=' : product.image,
        background: product.background && product.background.startsWith('blob:') ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEM0Q3RDAiLz4KPHN2ZyB4PSIzNSIgeT0iMzUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxN0gxNFYxOFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cjwvc3ZnPgo=' : product.background
      }));
      localStorage.setItem('products', JSON.stringify(cleanedProducts));
      return cleanedProducts;
    }
    // 초기 데이터 저장
    localStorage.setItem('products', JSON.stringify(products));
    return products;
  } catch (error) {
    console.error('상품 데이터 로드 에러:', error);
    // localStorage 초기화
    localStorage.removeItem('products');
    localStorage.setItem('products', JSON.stringify(products));
    return products;
  }
};

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem('products', JSON.stringify(products));
  } catch (error) {
    console.error('상품 데이터 저장 에러:', error);
  }
};

// localStorage 초기화 함수
export const resetProducts = (): void => {
  try {
    localStorage.removeItem('products');
    localStorage.setItem('products', JSON.stringify(products));
  } catch (error) {
    console.error('상품 데이터 초기화 에러:', error);
  }
}; 