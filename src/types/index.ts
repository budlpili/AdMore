export interface Product {
  id: number;
  name: string;
  description?: string;
  discountRate?: number;
  originalPrice?: number;
  price: string | number;
  category: string;
  image: string;
  background?: string;
  clickCount?: number;
  popular?: boolean;
  addedDate?: string;
  viewedDate?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Notice {
  id: number;
  title: string;
  date: string;
  important: boolean;
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
  name: string;
  phone: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

export interface FormErrors {
  [key: string]: string;
}

export interface Category {
  name: string;
  path: string;
} 