import { Product, Category, Tag, Order, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// API 요청 헬퍼 함수
const apiRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // 토큰이 있으면 헤더에 추가
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 요청 오류:', error);
    throw error;
  }
};

// 인증 API에 관리자 로그인 추가
export const authAPI = {
  // 로그인
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // 관리자 로그인
  adminLogin: async (email: string, password: string) => {
    return apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // 회원가입
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 로그아웃
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // 사용자 정보 조회
  getProfile: async () => {
    return apiRequest('/auth/profile');
  },
};

// 상품 관련 API
export const productsAPI = {
  // 모든 상품 조회
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return apiRequest<Product[]>(endpoint);
  },

  // 모든 상품 조회 (별칭)
  getAllProducts: async (): Promise<Product[]> => {
    return apiRequest<Product[]>('/products');
  },

  // 활성 상품만 조회
  getActiveProducts: async (): Promise<Product[]> => {
    return apiRequest<Product[]>('/products?status=active');
  },

  // 상품 상세 조회
  getById: async (id: string): Promise<Product> => {
    return apiRequest<Product>(`/products/${id}`);
  },

  // 상품 생성 (관리자용)
  create: async (productData: FormData) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/products`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: productData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // 상품 생성 (별칭)
  createProduct: async (productData: any) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/products`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // 상품 수정 (관리자용)
  update: async (id: string, productData: FormData) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/products/${id}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: productData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // 상품 수정 (별칭)
  updateProduct: async (id: number, productData: Partial<Product>): Promise<Product> => {
    return apiRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // 상품 삭제 (관리자용)
  delete: async (id: string) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // 상품 삭제 (별칭)
  deleteProduct: async (id: number): Promise<boolean> => {
    return apiRequest<boolean>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // 상품 상태 토글 (별칭)
  toggleProductStatus: async (id: number, status: string): Promise<boolean> => {
    return apiRequest<boolean>(`/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// 상품 관련 API (별칭 추가)
export const productAPI = productsAPI;

// 주문 관련 API
export const ordersAPI = {
  // 주문 생성
  create: async (orderData: {
    productId: string;
    quantity: number;
    paymentMethod: string;
    userInfo: {
      name: string;
      email: string;
      phone: string;
    };
  }) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // 사용자 주문 목록 조회
  getUserOrders: async () => {
    return apiRequest('/orders/user');
  },

  // 관리자용 모든 주문 조회
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    
    return apiRequest(endpoint);
  },

  // 주문 상태 업데이트 (관리자용)
  updateStatus: async (orderId: string, status: string) => {
    return apiRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // 주문 상세 조회
  getById: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}`);
  },
};

// 카테고리 관련 API
export const categoriesAPI = {
  // 모든 카테고리 조회
  getAll: async (): Promise<Category[]> => {
    return apiRequest<Category[]>('/categories');
  },

  // 모든 카테고리 조회 (별칭)
  getAllCategories: async (): Promise<Category[]> => {
    return apiRequest<Category[]>('/categories');
  },

  // 상품 카테고리 조회
  getProductCategories: async (): Promise<Category[]> => {
    return apiRequest<Category[]>('/categories?type=product');
  },

  // 카테고리 생성 (관리자용)
  create: async (categoryData: { name: string; description?: string }) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // 카테고리 생성 (별칭)
  createCategory: async (name: string) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // 카테고리 수정 (관리자용)
  update: async (id: string, categoryData: { name: string; description?: string }) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // 카테고리 수정 (별칭)
  updateCategory: async (id: number, categoryData: Partial<Category>): Promise<Category> => {
    return apiRequest<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // 카테고리 삭제 (관리자용)
  delete: async (id: string) => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // 카테고리 삭제 (별칭)
  deleteCategory: async (id: number): Promise<boolean> => {
    return apiRequest<boolean>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// 카테고리 관련 API (별칭 추가)
export const categoryAPI = categoriesAPI;

// 태그 관련 API
export const tagsAPI = {
  // 모든 태그 조회
  getAll: async (): Promise<Tag[]> => {
    return apiRequest<Tag[]>('/tags');
  },

  // 모든 태그 조회 (별칭)
  getAllTags: async (): Promise<Tag[]> => {
    return apiRequest<Tag[]>('/tags');
  },

  // 상품 태그 조회
  getProductTags: async (): Promise<Tag[]> => {
    return apiRequest<Tag[]>('/tags?type=product');
  },

  // 태그 생성 (관리자용)
  create: async (tagData: { name: string; color?: string }) => {
    return apiRequest('/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
  },

  // 태그 생성 (별칭)
  createTag: async (tagData: { name: string; color?: string }): Promise<Tag> => {
    return apiRequest<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
  },

  // 태그 수정 (관리자용)
  update: async (id: string, tagData: { name: string; color?: string }) => {
    return apiRequest(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tagData),
    });
  },

  // 태그 수정 (별칭)
  updateTag: async (id: number, tagData: Partial<Tag>): Promise<Tag> => {
    return apiRequest<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tagData),
    });
  },

  // 태그 삭제 (관리자용)
  delete: async (id: string) => {
    return apiRequest(`/tags/${id}`, {
      method: 'DELETE',
    });
  },

  // 태그 삭제 (별칭)
  deleteTag: async (id: number): Promise<boolean> => {
    return apiRequest<boolean>(`/tags/${id}`, {
      method: 'DELETE',
    });
  },
};

// 태그 관련 API (별칭 추가)
export const tagAPI = tagsAPI;

export default {
  auth: authAPI,
  products: productsAPI,
  orders: ordersAPI,
  categories: categoriesAPI,
  tags: tagsAPI,
}; 