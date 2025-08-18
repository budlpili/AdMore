import { Product, Category, Tag, Order, User } from '../types';

// 백엔드 API URL을 환경변수로 설정
// 임시로 로컬 데이터 사용 (백엔드 연결 문제 해결 시 제거)
const USE_LOCAL_DATA = true; // 이 값을 false로 변경하면 백엔드 사용
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

console.log('API Base URL:', API_BASE_URL);

// API 요청 헬퍼 함수
const apiRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  // 강제로 로컬 데이터 사용 (백엔드 연결 문제 해결 시 제거)
  console.log('로컬 데이터 모드 강제 활성화, 백엔드 요청 건너뜀');
  return getLocalData(endpoint);

  // 아래 코드는 실행되지 않음 (백엔드 연결 문제 해결 시 주석 해제)
  /*
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

  // console.log('=== API 요청 시작 ===');
  // console.log('URL:', url);
  // console.log('Method:', config.method || 'GET');
  // console.log('Headers:', config.headers);
  // console.log('Body:', config.body);

  try {
    const response = await fetch(url, config);
    
    // console.log('=== API 응답 ===');
    // console.log('Status:', response.status);
    // console.log('Status Text:', response.statusText);
    // console.log('Headers:', response.headers);
    
    if (!response.ok) {
      // HTTP 에러 응답을 파싱하여 에러 객체 생성
      let errorData;
      try {
        errorData = await response.json();
        console.log('Error Response Body:', errorData);
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        console.log('Error Response Parse Failed, using default error');
      }
      
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      (error as any).response = { status: response.status, data: errorData };
      console.error('API 요청 실패:', error);
      throw error;
    }
    
    const responseData = await response.json();
    // console.log('Success Response:', responseData);
    return responseData;
  } catch (error) {
    console.error('API 요청 오류:', error);
    
    // 백엔드 연결 실패 시 로컬 데이터 사용
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('NetworkError') ||
        error.message.includes('TypeError')) {
      console.log('백엔드 연결 실패, 로컬 데이터 사용');
      try {
        const localData = await getLocalData(endpoint);
        console.log('로컬 데이터 반환 성공:', localData);
        return localData;
      } catch (localError) {
        console.error('로컬 데이터 로드 실패:', localError);
        throw error; // 원래 에러를 다시 던짐
      }
    }
    
    throw error;
  }
  */
};

// 로컬 데이터 반환 함수
const getLocalData = async (endpoint: string) => {
  console.log('로컬 데이터 사용:', endpoint);
  
  try {
    // 상품 목록
    if (endpoint.includes('/products')) {
      const productsModule = await import('../data/products');
      const products = productsModule.default;
      console.log('로컬 상품 데이터 로드:', products.length);
      return products.filter(product => product.status === 'active');
    }
    
    // 카테고리 목록
    if (endpoint.includes('/categories')) {
      const categoriesModule = await import('../data/categories');
      const categories = categoriesModule.default;
      console.log('로컬 카테고리 데이터 로드:', categories.length);
      return categories;
    }
    
    // 태그 목록
    if (endpoint.includes('/tags')) {
      const tagsModule = await import('../data/tags');
      const tags = tagsModule.default;
      console.log('로컬 태그 데이터 로드:', tags.length);
      return tags;
    }
    
    // 주문 데이터
    if (endpoint.includes('/orders')) {
      const ordersModule = await import('../data/orderdata');
      const orders = ordersModule.default;
      console.log('로컬 주문 데이터 로드:', orders.length);
      return orders;
    }
    
    // 리뷰 데이터
    if (endpoint.includes('/reviews')) {
      const reviewsModule = await import('../data/reviews-list');
      const reviews = reviewsModule.default;
      console.log('로컬 리뷰 데이터 로드:', reviews.length);
      return reviews;
    }
    
    // 기본값
    console.log('로컬 데이터 없음, 빈 배열 반환');
    return [];
  } catch (error) {
    console.error('로컬 데이터 로드 실패:', error);
    return [];
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
  // 인증메일 재발송
  resendVerify: async (email: string) => {
    return apiRequest('/auth/resend-verify', {
      method: 'POST',
      body: JSON.stringify({ email }),
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
    const response = await apiRequest('/orders/user');
    console.log('getUserOrders 응답:', response);
    // 전체 응답을 반환 (response.orders와 response.pagination 포함)
    return response;
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
    return apiRequest(`/orders/order/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // 결제 확인
  confirmPayment: async (orderId: string) => {
    return apiRequest(`/orders/order/${orderId}/confirm`, {
      method: 'PUT',
    });
  },

  // 결제 취소
  cancelPayment: async (orderId: string) => {
    return apiRequest(`/orders/order/${orderId}/cancel`, {
      method: 'PUT',
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

// 리뷰 API
export const reviewsAPI = {
  getAll: () => apiRequest('/reviews'),
  getByProduct: (productId: number) => apiRequest(`/reviews?productId=${productId}`),
  create: (data: any) => apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiRequest(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
  }),
  // 관리자 댓글 API
  addAdminReply: (reviewId: number, adminReply: string) => 
    apiRequest(`/reviews/${reviewId}/admin-reply`, {
      method: 'POST',
      body: JSON.stringify({ adminReply }),
    }),
  updateAdminReply: (reviewId: number, adminReply: string) => 
    apiRequest(`/reviews/${reviewId}/admin-reply`, {
      method: 'PUT',
      body: JSON.stringify({ adminReply }),
    }),
  deleteAdminReply: (reviewId: number) => 
    apiRequest(`/reviews/${reviewId}/admin-reply`, {
      method: 'DELETE',
    }),
};

// 리뷰 관련 API (별칭 추가)
export const reviewAPI = reviewsAPI;

// 사용자 관리 API
export const usersAPI = {
  getAll: () => apiRequest('/users'),
  getById: (id: string) => apiRequest(`/users/${id}`),
  getByEmail: (email: string) => apiRequest(`/users/email/${email}`),
  updateStatus: (id: string, status: 'active' | 'inactive' | 'suspended') => 
    apiRequest(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  updateRole: (id: string, role: 'admin' | 'user') => 
    apiRequest(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  delete: (id: string) => 
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// 쿠폰 관리 API
export const couponsAPI = {
  getAll: () => apiRequest('/coupons'),
  getById: (id: number) => apiRequest(`/coupons/${id}`),
  create: (data: any) => 
    apiRequest('/coupons', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: number, data: any) => 
    apiRequest(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id: number) => 
    apiRequest(`/coupons/${id}`, {
      method: 'DELETE'
    }),
  send: (couponId: number, userIds: string[]) => 
    apiRequest('/coupons/send', {
      method: 'POST',
      body: JSON.stringify({ couponId, userIds })
    }),
  getSends: (couponId: number) => apiRequest(`/coupons/sends/${couponId}`),
  getUserCoupons: (userId: string) => apiRequest(`/coupons/user/${userId}`),
  useCoupon: (sendId: string) => 
    apiRequest(`/coupons/use/${sendId}`, {
      method: 'POST'
    })
};

// 고객센터 API
export const customerServiceAPI = {
  // 공지사항 관련
  getNotices: () => apiRequest('/customer-service/notices'),
  getNotice: (id: number) => apiRequest(`/customer-service/notices/${id}`),
  createNotice: (data: { title: string; content: string; important?: boolean; author?: string }) => 
    apiRequest('/customer-service/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateNotice: (id: number, data: { title: string; content: string; important?: boolean }) => 
    apiRequest(`/customer-service/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteNotice: (id: number) => 
    apiRequest(`/customer-service/notices/${id}`, {
      method: 'DELETE',
    }),

  // 이용약관 관련
  getTerms: () => apiRequest('/customer-service/terms'),
  saveTerms: (content: string) => 
    apiRequest('/customer-service/terms', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateTerms: (content: string) => 
    apiRequest('/customer-service/terms', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deleteTerms: () => 
    apiRequest('/customer-service/terms', {
      method: 'DELETE',
    }),

  // 개인정보취급방침 관련
  getPrivacy: () => apiRequest('/customer-service/privacy'),
  savePrivacy: (content: string) => 
    apiRequest('/customer-service/privacy', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updatePrivacy: (content: string) => 
    apiRequest('/customer-service/privacy', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deletePrivacy: () => 
    apiRequest('/customer-service/privacy', {
      method: 'DELETE',
    }),
};

// 채팅 메시지 API
export const chatAPI = {
  // 채팅 메시지 가져오기
  getMessages: async (userEmail?: string) => {
    const params = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
    return apiRequest(`/chat/messages${params}`);
  },

  // 현재 채팅 중인 유저 목록 가져오기
  getActiveUsers: async () => {
    return apiRequest('/chat/active-users');
  },

  // 메시지 전송
  sendMessage: async (messageData: {
    message: string;
    type: 'user' | 'admin';
    inquiryType?: 'product' | 'payment_cancellation';
    productInfo?: string;
    paymentInfo?: any;
    targetUserEmail?: string;
    file?: string | null;
    fileName?: string;
    fileType?: string;
  }) => {
    return apiRequest('/chat/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // 메시지 삭제
  deleteMessage: async (messageId: string) => {
    return apiRequest(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // 메시지 상태 변경
  updateMessageStatus: async (messageId: string, status: 'pending' | 'answered' | 'closed') => {
    return apiRequest(`/chat/messages/${messageId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  exportMessages: () => apiRequest('/chat/messages/export', {
    method: 'POST',
  }),
  exportUserMessages: (userEmail: string) => apiRequest(`/chat/messages/export/user/${encodeURIComponent(userEmail)}`, {
    method: 'POST',
  }),
  getExports: () => apiRequest('/chat/messages/exports'),
  downloadFile: (filename: string) => {
    const url = `${API_BASE_URL}/chat/messages/download/${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default {
  auth: authAPI,
  products: productsAPI,
  orders: ordersAPI,
  categories: categoriesAPI,
  tags: tagsAPI,
  reviews: reviewsAPI,
  customerService: customerServiceAPI,
}; 