import React, { useState, useEffect } from 'react';
import { couponsAPI, ordersAPI } from '../services/api';

interface CollectionData {
  users: any[];
  coupons: any[];
  couponSends: any[];
  orders: any[];
}

const DataViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'coupons' | 'couponSends' | 'orders'>('users');
  const [data, setData] = useState<CollectionData>({
    users: [],
    coupons: [],
    couponSends: [],
    orders: []
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 데이터 로드 함수
  const loadData = async (collection: keyof CollectionData) => {
    try {
      setLoading(true);
      let response;
      
      switch (collection) {
        case 'users':
          // 사용자 데이터는 별도 API가 필요할 수 있음
          response = { success: true, users: [] };
          break;
        case 'coupons':
          response = await couponsAPI.getAllCoupons();
          break;
        case 'couponSends':
          // 모든 사용자의 쿠폰 발송 데이터 (관리자용)
          response = await couponsAPI.getAllCouponSends();
          break;
        case 'orders':
          response = await ordersAPI.getAllOrders();
          break;
        default:
          response = { success: false };
      }

      if (response.success) {
        setData(prev => ({
          ...prev,
          [collection]: response[collection] || response.coupons || response.orders || []
        }));
      }
    } catch (error) {
      console.error(`${collection} 데이터 로드 에러:`, error);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  // 검색 필터링
  const filteredData = data[activeTab].filter((item: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  });

  // 데이터 렌더링 함수
  const renderData = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      );
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          데이터가 없습니다.
        </div>
      );
    }

    const firstItem = filteredData[0];
    const columns = Object.keys(firstItem).filter(key => 
      !['_id', '__v', 'password'].includes(key)
    );

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(column => (
                <th key={column} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map(column => (
                  <td key={column} className="px-4 py-3 text-sm text-gray-900 border-b">
                    {(() => {
                      const value = item[column];
                      if (value === null || value === undefined) return '-';
                      if (typeof value === 'object') return JSON.stringify(value);
                      if (typeof value === 'boolean') return value ? '예' : '아니오';
                      if (column.includes('Date') || column.includes('At')) {
                        try {
                          return new Date(value).toLocaleString('ko-KR');
                        } catch {
                          return value;
                        }
                      }
                      return String(value);
                    })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MongoDB 데이터 뷰어</h1>
        <p className="text-gray-600">데이터베이스의 컬렉션 내용을 확인할 수 있습니다.</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'users', label: '사용자', count: data.users.length },
            { key: 'coupons', label: '쿠폰', count: data.coupons.length },
            { key: 'couponSends', label: '쿠폰 발송', count: data.couponSends.length },
            { key: 'orders', label: '주문', count: data.orders.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as keyof CollectionData)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 검색 및 새로고침 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="검색어를 입력하세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          onClick={() => loadData(activeTab)}
          className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          새로고침
        </button>
      </div>

      {/* 데이터 표시 */}
      <div className="bg-white rounded-lg shadow">
        {renderData()}
      </div>

      {/* 데이터 요약 */}
      <div className="mt-6 text-sm text-gray-600">
        <p>총 {filteredData.length}개 항목 (전체 {data[activeTab].length}개)</p>
      </div>
    </div>
  );
};

export default DataViewer;
