import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faCheck, faTimes, faSearch, faFilter,
  faCalendarAlt, faPercentage, faTicketAlt
} from '@fortawesome/free-solid-svg-icons';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // 폼 상태
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 0,
    status: 'active' as 'active' | 'inactive' | 'expired'
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadCoupons();
  }, []);

  // 필터링 적용
  useEffect(() => {
    let filtered = coupons;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(coupon => coupon.status === statusFilter);
    }

    setFilteredCoupons(filtered);
  }, [coupons, searchTerm, statusFilter]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      // TODO: API 호출로 변경
      const mockCoupons: Coupon[] = [
        {
          id: 1,
          code: 'WELCOME10',
          name: '신규 가입 쿠폰',
          description: '신규 회원 가입 시 사용 가능한 10% 할인 쿠폰',
          discountType: 'percentage',
          discountValue: 10,
          minAmount: 10000,
          maxDiscount: 5000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          usageLimit: 1000,
          usedCount: 150,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        {
          id: 2,
          code: 'SAVE5000',
          name: '5,000원 할인 쿠폰',
          description: '5만원 이상 구매 시 5,000원 할인',
          discountType: 'fixed',
          discountValue: 5000,
          minAmount: 50000,
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          usageLimit: 500,
          usedCount: 89,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ];
      setCoupons(mockCoupons);
    } catch (error) {
      console.error('쿠폰 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minAmount: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 0,
      status: 'active'
    });
    setIsFormOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount || 0,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      usageLimit: coupon.usageLimit,
      status: coupon.status === 'expired' ? 'inactive' : coupon.status
    });
    setIsFormOpen(true);
  };

  const handleDeleteCoupon = async (couponId: number) => {
    if (window.confirm('정말로 이 쿠폰을 삭제하시겠습니까?')) {
      try {
        // TODO: API 호출로 변경
        setCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
        alert('쿠폰이 삭제되었습니다.');
      } catch (error) {
        console.error('쿠폰 삭제 에러:', error);
        alert('쿠폰 삭제에 실패했습니다.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCoupon) {
        // 수정
        const updatedCoupon = { ...editingCoupon, ...formData };
        setCoupons(prev => prev.map(coupon => 
          coupon.id === editingCoupon.id ? updatedCoupon : coupon
        ));
        alert('쿠폰이 수정되었습니다.');
      } else {
        // 추가
        const newCoupon: Coupon = {
          id: Date.now(),
          ...formData,
          usedCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        };
        setCoupons(prev => [...prev, newCoupon]);
        alert('쿠폰이 추가되었습니다.');
      }
      
      setIsFormOpen(false);
      setEditingCoupon(null);
    } catch (error) {
      console.error('쿠폰 저장 에러:', error);
      alert('쿠폰 저장에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: '활성' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: '비활성' },
      expired: { color: 'bg-red-100 text-red-800', text: '만료' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">쿠폰 관리</h2>
        <button
          onClick={handleAddCoupon}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          쿠폰 추가
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="쿠폰 코드 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="expired">만료</option>
        </select>
      </div>

      {/* 쿠폰 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  쿠폰 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  할인 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용 기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용 현황
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      <div className="text-sm text-gray-500">{coupon.name}</div>
                      <div className="text-xs text-gray-400">{coupon.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {coupon.discountType === 'percentage' ? (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faPercentage} className="text-blue-600" />
                          {coupon.discountValue}% 할인
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faTicketAlt} className="text-green-600" />
                          {coupon.discountValue.toLocaleString()}원 할인
                        </span>
                      )}
                      {coupon.minAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          최소 {coupon.minAmount.toLocaleString()}원 이상
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        {formatDate(coupon.startDate)}
                      </div>
                      <div className="text-xs text-gray-500">~ {formatDate(coupon.endDate)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {coupon.usedCount} / {coupon.usageLimit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(coupon.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 쿠폰 추가/수정 모달 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCoupon ? '쿠폰 수정' : '쿠폰 추가'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    쿠폰 코드 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: WELCOME10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    쿠폰명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 신규 가입 쿠폰"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="쿠폰에 대한 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인 유형 *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">퍼센트 할인</option>
                    <option value="fixed">정액 할인</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인 값 *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.discountType === 'percentage' ? '10' : '5000'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최소 구매 금액
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대 할인 금액
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사용 제한 *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'expired' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="expired">만료</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCoupon ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement; 