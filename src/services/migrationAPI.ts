import { apiRequest } from './api';

// 로컬스토리지 데이터를 MongoDB로 마이그레이션하는 API
export const migrationAPI = {
  // 주문 데이터 마이그레이션
  migrateOrders: async (orders: any[]) => {
    return apiRequest('/migration/orders', {
      method: 'POST',
      body: JSON.stringify({ orders }),
    });
  },

  // 결제 데이터 마이그레이션
  migratePayments: async (payments: any[]) => {
    return apiRequest('/migration/payments', {
      method: 'POST',
      body: JSON.stringify({ payments }),
    });
  },

  // 마이그레이션 상태 확인
  getStatus: async () => {
    return apiRequest('/migration/status', {
      method: 'GET',
    });
  }
};

// 로컬스토리지에서 데이터 추출하는 유틸리티 함수들
export const localStorageUtils = {
  // 주문 데이터 추출
  getOrdersFromLocalStorage: (): any[] => {
    try {
      const ordersData = localStorage.getItem('paymentList');
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        return Array.isArray(orders) ? orders : [];
      }
    } catch (error) {
      console.error('로컬스토리지에서 주문 데이터 추출 실패:', error);
    }
    return [];
  },

  // 결제 데이터 추출
  getPaymentsFromLocalStorage: (): any[] => {
    try {
      // paymentList와 orders 키 모두 확인
      const paymentData = localStorage.getItem('paymentList');
      const ordersData = localStorage.getItem('orders');
      
      let payments: any[] = [];
      
      if (paymentData) {
        const parsed = JSON.parse(paymentData);
        if (Array.isArray(parsed)) {
          payments = parsed;
        }
      }
      
      if (ordersData) {
        const parsed = JSON.parse(ordersData);
        if (Array.isArray(parsed)) {
          payments = [...payments, ...parsed];
        }
      }
      
      return payments;
    } catch (error) {
      console.error('로컬스토리지에서 결제 데이터 추출 실패:', error);
    }
    return [];
  },

  // 사용자 데이터 추출
  getUserFromLocalStorage: (): any => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('로컬스토리지에서 사용자 데이터 추출 실패:', error);
    }
    return null;
  },

  // 즐겨찾기 데이터 추출
  getFavoritesFromLocalStorage: (): any[] => {
    try {
      const favoritesData = localStorage.getItem('favorites');
      if (favoritesData) {
        const favorites = JSON.parse(favoritesData);
        return Array.isArray(favorites) ? favorites : [];
      }
    } catch (error) {
      console.error('로컬스토리지에서 즐겨찾기 데이터 추출 실패:', error);
    }
    return [];
  },

  // 최근 상품 데이터 추출
  getRecentProductsFromLocalStorage: (): any[] => {
    try {
      const recentData = localStorage.getItem('recentProducts');
      if (recentData) {
        const recent = JSON.parse(recentData);
        return Array.isArray(recent) ? recent : [];
      }
    } catch (error) {
      console.error('로컬스토리지에서 최근 상품 데이터 추출 실패:', error);
    }
    return [];
  },

  // 모든 로컬스토리지 데이터 추출
  getAllLocalStorageData: () => {
    return {
      orders: localStorageUtils.getOrdersFromLocalStorage(),
      payments: localStorageUtils.getPaymentsFromLocalStorage(),
      user: localStorageUtils.getUserFromLocalStorage(),
      favorites: localStorageUtils.getFavoritesFromLocalStorage(),
      recentProducts: localStorageUtils.getRecentProductsFromLocalStorage()
    };
  },

  // 로컬스토리지 데이터 정리 (마이그레이션 후)
  clearMigratedData: (dataType: 'orders' | 'payments' | 'all') => {
    try {
      if (dataType === 'orders' || dataType === 'all') {
        localStorage.removeItem('paymentList');
        localStorage.removeItem('orders');
      }
      
      if (dataType === 'payments' || dataType === 'all') {
        localStorage.removeItem('paymentList');
        localStorage.removeItem('orders');
      }
      
      console.log(`${dataType} 데이터가 로컬스토리지에서 정리되었습니다.`);
    } catch (error) {
      console.error('로컬스토리지 데이터 정리 실패:', error);
    }
  }
};



