export interface Product {
  id?: number;
  _id?: string;
  name: string;
  description?: string;
  discountRate?: number;
  originalPrice?: number;
  price: number;
  price1Day?: number;
  price7Days?: number;
  price30Days?: number;
  category: string;
  image?: string;
  background?: string;
  clickCount?: number;
  popular?: boolean;
  addedDate?: string;
  viewedDate?: string;
  rating?: number;
  reviewCount?: number;
  status?: string;
  stock?: number;
  tags?: string[];
  detailedDescription?: string;
  specifications?: string;
  createdAt?: string;
  updatedAt?: string;
  productNumber?: string;
}

export interface Notice {
  id?: number;
  _id?: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
  status?: number | string;
}

export interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
}

export interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

export interface FormErrors {
  [key: string]: string;
}

export interface Category {
  id?: number;
  _id?: string;
  name: string;
  description?: string;
  path?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavigationCategory {
  name: string;
  path: string;
}

export interface Tag {
  id?: number;
  _id?: string;
  name: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id?: number;
  _id?: string;
  orderId?: string;
  productId: string;
  quantity: number;
  paymentMethod: string;
  status: string;
  confirmStatus?: string;
  userInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id?: number;
  _id?: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  status?: string;
  joinDate?: string;
  emailVerified?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'user' | 'admin';
  status?: 'pending' | 'answered' | 'closed';
  inquiryType?: 'product' | 'payment_cancellation';
  productInfo?: string;
  paymentInfo?: {
    paymentNumber: string;
    productName: string;
    amount: string;
  };
}

// MongoDB 호환 Coupon 인터페이스
export interface Coupon {
  id?: number;
  _id?: string;
  code: string;
  name: string;
  description: string;
  brand: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount?: number;
  status: 'active' | 'inactive' | 'expired';
  createdAt?: string;
  updatedAt?: string;
}

// MongoDB에서 사용되는 Coupon 타입
export interface MongoDBCoupon extends Omit<Coupon, 'id'> {
  _id: string;
}

// SQLite에서 사용되는 Coupon 타입
export interface SQLiteCoupon extends Omit<Coupon, '_id'> {
  id: number;
}

// 쿠폰 발송 이력 인터페이스
export interface CouponSend {
  id?: number;
  _id?: string;
  couponId: string | number;
  userId: string | number;
  userEmail: string;
  userName: string;
  sentAt: string;
  usedAt?: string;
  status: 'sent' | 'used' | 'expired';
  couponCode: string;
  couponName: string;
}

 