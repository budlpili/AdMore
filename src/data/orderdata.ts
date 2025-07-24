export interface Order {
  orderId: string;
  productId: number;
  product: string;
  detail: string;
  quantity: number;
  price: string;
  originalPrice: string;
  discountPrice: string;
  finalPrice?: number; // 추가
  request: string;
  date: string;
  paymentDate: string;
  status: string;
  review: string;
  image: string;
  paymentMethod: string;
  refundStatus: string;
  confirmStatus: string;
  paymentNumber?: string;
  userName?: string;
  userEmail?: string;
}

// 기본 주문 데이터
export const defaultOrderList: Order[] = [
  {
    orderId: '20240601-001',
    productId: 1,
    product: '유튜브 마케팅 활성화',
    detail: '기본 1일/5,000원',
    quantity: 10,
    price: '50,000원',
    originalPrice: '60,000원',
    discountPrice: '10,000원',
    request: '기간 만료후 자동연장 합니다.',
    date: '2024-06-01',
    paymentDate: '2024-06-01',
    status: '진행 중',
    review: '리뷰 작성하기',
    image: '/images/product_01.png',
    paymentMethod: '신용카드',
    refundStatus: '',
    confirmStatus: '구매확정전',
    paymentNumber: 'PAY-20240601001',
    userName: '김철수',
    userEmail: 'kim@example.com',
  },
  {
    orderId: '20240601-002',
    productId: 1,
    product: '유튜브 마케팅 활성화',
    detail: '기본 1일/5,000원',
    quantity: 10,
    price: '50,000원',
    originalPrice: '60,000원',
    discountPrice: '10,000원',
    request: '기간 만료후 자동연장 합니다.',
    date: '2024-06-01',
    paymentDate: '2024-06-02',
    status: '작업완료',
    review: '리뷰 작성하기',
    image: '/images/product_01.png',
    paymentMethod: '가상계좌',
    refundStatus: '',
    confirmStatus: '구매확정전',
    paymentNumber: 'PAY-20240601002',
    userName: '이영희',
    userEmail: 'lee@example.com',
  },
  {
    orderId: '20240601-003',
    productId: 2,
    product: '페이스북 팔로워 1000명',
    detail: '기본 1일/5,000원',
    quantity: 2,
    price: '10,000원',
    originalPrice: '12,000원',
    discountPrice: '2,000원',
    request: '계정 공개',
    date: '2024-06-02',
    paymentDate: '2024-06-02',
    status: '작업완료',
    review: '리뷰 작성하기',
    image: '/images/product_02.png',
    paymentMethod: '카카오페이',
    refundStatus: '',
    confirmStatus: '구매확정전',
    paymentNumber: 'PAY-20240601003',
    userName: '박민수',
    userEmail: 'park@example.com',
  },
  {
    orderId: '20240601-004',
    productId: 3,
    product: '페이스북 좋아요 2000개',
    detail: '기본 1일/5,000원',
    quantity: 100,
    price: '500,000원',
    originalPrice: '500,000원',
    discountPrice: '0원',
    request: '없음',
    date: '2024-06-03',
    paymentDate: '2024-06-03',
    status: '취소',
    review: '리뷰 작성불가',
    image: '/images/product_03.png',
    paymentMethod: '신용카드',
    refundStatus: '',
    confirmStatus: '구매확정전',
    paymentNumber: 'PAY-20240601004',
    userName: '최지영',
    userEmail: 'choi@example.com',
  },
  {
    orderId: '20240601-005',
    productId: 4,
    product: '인스타그램 팔로워 500명',
    detail: '기본 1일/5,000원',
    quantity: 5,
    price: '25,000원',
    originalPrice: '30,000원',
    discountPrice: '5,000원',
    request: '없음',
    date: '2024-06-04',
    paymentDate: '2024-06-04',
    status: '작업완료',
    review: '리뷰 작성하기',
    image: '/images/product_04.png',
    paymentMethod: '네이버페이',
    refundStatus: '',
    confirmStatus: '구매완료',
    paymentNumber: 'PAY-20240601005',
    userName: '정수진',
    userEmail: 'jung@example.com',
  },
  {
    orderId: '20240601-006',
    productId: 5,
    product: '인스타그램 팔로워 500명',
    detail: '기본 1일/5,000원',
    quantity: 3,
    price: '15,000원',
    originalPrice: '18,000원',
    discountPrice: '3,000원',
    request: '없음',
    date: '2024-06-05',
    paymentDate: '2024-06-05',
    status: '작업완료',
    review: '리뷰 작성하기',
    image: '/images/product_05.png',
    paymentMethod: '신용카드',
    refundStatus: '',
    confirmStatus: '구매확정전',
    paymentNumber: 'PAY-20240601006',
    userName: '한소희',
    userEmail: 'han@example.com',
  }
]; 