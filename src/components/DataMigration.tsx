import React, { useState, useEffect } from 'react';
import { migrationAPI, localStorageUtils } from '../services/migrationAPI';

interface MigrationStatus {
  totalOrders: number;
  recentOrders: any[];
}

interface MigrationResult {
  id: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

const DataMigration: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [localData, setLocalData] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 로컬스토리지 데이터 로드
  useEffect(() => {
    loadLocalData();
    loadMigrationStatus();
  }, []);

  const loadLocalData = () => {
    const data = localStorageUtils.getAllLocalStorageData();
    setLocalData(data);
    console.log('로컬스토리지 데이터:', data);
  };

  const loadMigrationStatus = async () => {
    try {
      const response = await migrationAPI.getStatus();
      if (response.success) {
        setMigrationStatus(response.data);
      }
    } catch (error) {
      console.error('마이그레이션 상태 로드 실패:', error);
    }
  };

  const handleMigrateOrders = async () => {
    if (!localData?.orders || localData.orders.length === 0) {
      alert('마이그레이션할 주문 데이터가 없습니다.');
      return;
    }

    setIsMigrating(true);
    setShowResults(false);
    setMigrationResults([]);

    try {
      console.log('주문 데이터 마이그레이션 시작:', localData.orders);
      const response = await migrationAPI.migrateOrders(localData.orders);
      
      if (response.success) {
        setMigrationResults(response.results);
        setShowResults(true);
        alert(`주문 데이터 마이그레이션이 완료되었습니다!\n성공: ${response.summary.success}개\n실패: ${response.summary.error}개\n건너뜀: ${response.summary.skipped}개`);
        
        // 마이그레이션 상태 새로고침
        loadMigrationStatus();
        
        // 성공적으로 마이그레이션된 데이터는 로컬스토리지에서 정리
        if (response.summary.success > 0) {
          localStorageUtils.clearMigratedData('orders');
          loadLocalData(); // 로컬 데이터 새로고침
        }
      } else {
        alert('주문 데이터 마이그레이션에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 데이터 마이그레이션 실패:', error);
      alert('주문 데이터 마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigratePayments = async () => {
    if (!localData?.payments || localData.payments.length === 0) {
      alert('마이그레이션할 결제 데이터가 없습니다.');
      return;
    }

    setIsMigrating(true);
    setShowResults(false);
    setMigrationResults([]);

    try {
      console.log('결제 데이터 마이그레이션 시작:', localData.payments);
      const response = await migrationAPI.migratePayments(localData.payments);
      
      if (response.success) {
        setMigrationResults(response.results);
        setShowResults(true);
        alert(`결제 데이터 마이그레이션이 완료되었습니다!\n성공: ${response.summary.success}개\n실패: ${response.summary.error}개\n건너뜀: ${response.summary.skipped}개`);
        
        // 마이그레이션 상태 새로고침
        loadMigrationStatus();
        
        // 성공적으로 마이그레이션된 데이터는 로컬스토리지에서 정리
        if (response.summary.success > 0) {
          localStorageUtils.clearMigratedData('payments');
          loadLocalData(); // 로컬 데이터 새로고침
        }
      } else {
        alert('결제 데이터 마이그레이션에 실패했습니다.');
      }
    } catch (error) {
      console.error('결제 데이터 마이그레이션 실패:', error);
      alert('결제 데이터 마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigrateAll = async () => {
    if ((!localData?.orders || localData.orders.length === 0) && 
        (!localData?.payments || localData.payments.length === 0)) {
      alert('마이그레이션할 데이터가 없습니다.');
      return;
    }

    setIsMigrating(true);
    setShowResults(false);
    setMigrationResults([]);

    try {
      let allResults: MigrationResult[] = [];
      let totalSuccess = 0;
      let totalError = 0;
      let totalSkipped = 0;

      // 주문 데이터 마이그레이션
      if (localData?.orders && localData.orders.length > 0) {
        const orderResponse = await migrationAPI.migrateOrders(localData.orders);
        if (orderResponse.success) {
          allResults = [...allResults, ...orderResponse.results];
          totalSuccess += orderResponse.summary.success;
          totalError += orderResponse.summary.error;
          totalSkipped += orderResponse.summary.skipped;
        }
      }

      // 결제 데이터 마이그레이션
      if (localData?.payments && localData.payments.length > 0) {
        const paymentResponse = await migrationAPI.migratePayments(localData.payments);
        if (paymentResponse.success) {
          allResults = [...allResults, ...paymentResponse.results];
          totalSuccess += paymentResponse.summary.success;
          totalError += paymentResponse.summary.error;
          totalSkipped += paymentResponse.summary.skipped;
        }
      }

      setMigrationResults(allResults);
      setShowResults(true);
      alert(`전체 데이터 마이그레이션이 완료되었습니다!\n성공: ${totalSuccess}개\n실패: ${totalError}개\n건너뜀: ${totalSkipped}개`);
      
      // 마이그레이션 상태 새로고침
      loadMigrationStatus();
      
      // 성공적으로 마이그레이션된 데이터는 로컬스토리지에서 정리
      if (totalSuccess > 0) {
        localStorageUtils.clearMigratedData('all');
        loadLocalData(); // 로컬 데이터 새로고침
      }
    } catch (error) {
      console.error('전체 데이터 마이그레이션 실패:', error);
      alert('전체 데이터 마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setIsMigrating(false);
    }
  };

  const refreshData = () => {
    loadLocalData();
    loadMigrationStatus();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">데이터 마이그레이션</h2>
      
      {/* 현재 상태 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">현재 상태</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800">MongoDB 주문 수</h4>
            <p className="text-2xl font-bold text-blue-600">
              {migrationStatus?.totalOrders || 0}개
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800">로컬스토리지 데이터</h4>
            <p className="text-2xl font-bold text-green-600">
              {((localData?.orders?.length || 0) + (localData?.payments?.length || 0))}개
            </p>
          </div>
        </div>
      </div>

      {/* 로컬스토리지 데이터 요약 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">로컬스토리지 데이터 요약</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">주문:</span> {localData?.orders?.length || 0}개
            </div>
            <div>
              <span className="font-medium">결제:</span> {localData?.payments?.length || 0}개
            </div>
            <div>
              <span className="font-medium">즐겨찾기:</span> {localData?.favorites?.length || 0}개
            </div>
            <div>
              <span className="font-medium">최근 상품:</span> {localData?.recentProducts?.length || 0}개
            </div>
          </div>
        </div>
      </div>

      {/* 마이그레이션 버튼들 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">마이그레이션 실행</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleMigrateOrders}
            disabled={isMigrating || !localData?.orders || localData.orders.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isMigrating ? '마이그레이션 중...' : '주문 데이터 마이그레이션'}
          </button>
          
          <button
            onClick={handleMigratePayments}
            disabled={isMigrating || !localData?.payments || localData.payments.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isMigrating ? '마이그레이션 중...' : '결제 데이터 마이그레이션'}
          </button>
          
          <button
            onClick={handleMigrateAll}
            disabled={isMigrating || ((!localData?.orders || localData.orders.length === 0) && (!localData?.payments || localData.payments.length === 0))}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isMigrating ? '마이그레이션 중...' : '전체 데이터 마이그레이션'}
          </button>
          
          <button
            onClick={refreshData}
            disabled={isMigrating}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 마이그레이션 결과 */}
      {showResults && migrationResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">마이그레이션 결과</h3>
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {migrationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    result.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : result.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{result.id}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'success'
                        ? 'bg-green-200 text-green-800'
                        : result.status === 'error'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {result.status === 'success' ? '성공' : result.status === 'error' ? '실패' : '건너뜀'}
                    </span>
                  </div>
                  <p className="mt-1">{result.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 최근 주문 목록 */}
      {migrationStatus?.recentOrders && migrationStatus.recentOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">최근 주문 목록 (MongoDB)</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              {migrationStatus.recentOrders.map((order, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{order.orderId}</span>
                    <span className="text-sm text-gray-600">{order.status}</span>
                  </div>
                  <p className="text-sm text-gray-700">{order.product}</p>
                  <p className="text-xs text-gray-500">
                    {order.userName} ({order.userEmail}) - {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMigration;






