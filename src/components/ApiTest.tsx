import React, { useState, useEffect } from 'react';
import { productsAPI, authAPI } from '../services/api';

const ApiTest: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testProductsAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsAPI.getAll();
      setProducts(result);
      console.log('상품 API 테스트 성공:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      console.error('상품 API 테스트 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const testAuthAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.login('admin@admore.com', 'admin123');
      console.log('인증 API 테스트 성공:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      console.error('인증 API 테스트 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">백엔드 API 연결 테스트</h2>
      
      <div className="space-y-4">
        <button
          onClick={testProductsAPI}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '테스트 중...' : '상품 API 테스트'}
        </button>
        
        <button
          onClick={testAuthAPI}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 ml-2"
        >
          {loading ? '테스트 중...' : '인증 API 테스트'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>오류:</strong> {error}
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">상품 목록 ({products.length}개)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 6).map((product: any) => (
              <div key={product.id} className="border p-4 rounded">
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-gray-600">{product.description}</p>
                <p className="text-blue-600 font-bold">{product.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTest; 