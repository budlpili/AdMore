export interface Product {
  id: number;
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
  id: number;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
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
  id: number;
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
  id: number;
  name: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
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
  id: number;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  type: 'user' | 'admin';
} 