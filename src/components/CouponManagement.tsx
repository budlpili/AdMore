import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faCheck, faTimes, faSearch, faFilter,
  faCalendarAlt, faPercentage, faTicketAlt, faCaretUp, faCaretDown,
  faGift, faUser
} from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';
import { usersAPI, couponsAPI } from '../services/api';
import { Coupon, User, CouponSend } from '../types';

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isStatusFilterDropdownOpen, setIsStatusFilterDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 쿠폰 발송 관련 상태
  const [users, setUsers] = useState<User[]>([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<(string | number)[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // 쿠폰 발송 이력 관련 상태
  const [couponSends, setCouponSends] = useState<CouponSend[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCouponForHistory, setSelectedCouponForHistory] = useState<Coupon | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 할인 유형 드롭다운 상태
  const [isDiscountTypeDropdownOpen, setIsDiscountTypeDropdownOpen] = useState(false);
  const [isFormStatusDropdownOpen, setIsFormStatusDropdownOpen] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    brand: 'ADMORE',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: 0,
    startDate: new Date().toISOString().split('T')[0], // 오늘 날짜로 자동 설정
    endDate: '',
    usageLimit: 0,
    status: 'active' as 'active' | 'inactive' | 'expired'
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadCoupons();
    loadUsers();
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
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [coupons, searchTerm, statusFilter]);

  // 유저 목록이 변경될 때 filteredUsers 업데이트
  useEffect(() => {
    console.log('유저 목록 변경됨, filteredUsers 업데이트:', users);
    setFilteredUsers(users);
  }, [users]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponsAPI.getAll();
      if (response.success && response.coupons) {
        setCoupons(response.coupons);
      }
    } catch (error) {
      console.error('쿠폰 로드 에러:', error);
      // 에러 발생 시 빈 배열로 설정
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('유저 목록 로드 시작...');
      const response = await usersAPI.getAll();
      console.log('유저 API 응답:', response); // 디버깅용 로그
      
      // API 응답 구조에 맞게 수정
      if (response && response.users) {
        console.log('원본 유저 데이터:', response.users);
        const activeUsers = response.users
          .filter((user: any) => user.status === 'active')
          .map((user: any) => ({
            id: (user._id || user.id || '').toString(),
            email: user.email,
            name: user.name,
            status: user.status
          }));
        console.log('활성 유저 목록:', activeUsers); // 디버깅용 로그
        console.log('활성 유저 수:', activeUsers.length);
        setUsers(activeUsers);
        setFilteredUsers(activeUsers);
      } else {
        console.log('유저 데이터가 없습니다:', response);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('사용자 로드 에러:', error);
      // 에러 발생 시 빈 배열로 설정
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  // 쿠폰 발송 이력 로드
  const loadCouponSends = async (couponId: string | number) => {
    try {
      setHistoryLoading(true);
      const response = await couponsAPI.getCouponSends(couponId.toString());
      if (response.success && response.couponSends) {
        setCouponSends(response.couponSends);
      } else {
        setCouponSends([]);
      }
    } catch (error) {
      console.error('쿠폰 발송 이력 로드 에러:', error);
      setCouponSends([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      brand: 'ADMORE',
      discountType: 'percentage',
      discountValue: 0,
      minAmount: 0,
      maxDiscount: 0,
      startDate: new Date().toISOString().split('T')[0], // 오늘 날짜로 자동 설정
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
      brand: (coupon as any).brand || 'ADMORE',
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

  const handleDeleteCoupon = async (couponId: string | number) => {
    if (window.confirm('정말로 이 쿠폰을 삭제하시겠습니까?')) {
      try {
        const response = await couponsAPI.delete(couponId.toString());
        if (response.success) {
          setCoupons(prev => prev.filter(coupon => (coupon._id || coupon.id || 0) !== couponId));
          alert('쿠폰이 삭제되었습니다.');
        } else {
          alert('쿠폰 삭제에 실패했습니다.');
        }
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
        const response = await couponsAPI.update((editingCoupon._id || editingCoupon.id || 0).toString(), formData);
        if (response.success) {
          setCoupons(prev => prev.map(coupon => 
            (coupon._id || coupon.id || 0) === (editingCoupon._id || editingCoupon.id || 0) ? { ...coupon, ...formData } : coupon
          ));
          alert('쿠폰이 수정되었습니다.');
        } else {
          alert('쿠폰 수정에 실패했습니다.');
        }
      } else {
        // 추가
        const response = await couponsAPI.create(formData);
        if (response.success) {
          const newCoupon: Coupon = {
            id: response.id,
            ...formData,
            usedCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          };
          setCoupons(prev => [newCoupon, ...prev]);
          alert('쿠폰이 추가되었습니다.');
        } else {
          alert('쿠폰 추가에 실패했습니다.');
        }
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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCoupons = filteredCoupons.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 숫자 입력 처리 함수들
  const formatNumberInput = (value: string): number => {
    // 숫자가 아닌 문자 제거하고 앞의 0 제거
    const cleanValue = value.replace(/[^0-9]/g, '').replace(/^0+/, '');
    return cleanValue ? parseInt(cleanValue, 10) : 0;
  };

  const formatNumberDisplay = (value: number): string => {
    return value.toLocaleString();
  };

  const handleNumberInputChange = (field: 'discountValue' | 'minAmount' | 'maxDiscount' | 'usageLimit', value: string) => {
    const numericValue = formatNumberInput(value);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
  };

  // 쿠폰 발송 이력 모달 열기
  const handleShowHistory = async (coupon: Coupon) => {
    setSelectedCouponForHistory(coupon);
    setIsHistoryModalOpen(true);
    await loadCouponSends(coupon._id || coupon.id || 0);
  };

  // 쿠폰 발송 이력 모달 닫기
  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
    setSelectedCouponForHistory(null);
    setCouponSends([]);
  };

  const handleDiscountTypeChange = (type: 'percentage' | 'fixed') => {
    setFormData(prev => ({ ...prev, discountType: type }));
    setIsDiscountTypeDropdownOpen(false);
  };

  const handleQuickDateSet = (months: number) => {
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + months);
    
    setFormData(prev => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  // 쿠폰 발송 관련 함수들
  const handleSendCoupon = async (coupon: Coupon) => {
    console.log('쿠폰 발송 모달 열기, 현재 유저 목록:', users); // 디버깅용 로그
    setSelectedCoupon(coupon);
    setSelectedUsers([]);
    setUserSearchTerm('');
    
    // 모달을 열 때 최신 유저 목록을 다시 로드
    try {
      console.log('유저 목록 다시 로드 시작...');
      await loadUsers();
      console.log('유저 목록 로드 완료');
    } catch (error) {
      console.error('유저 목록 로드 실패:', error);
    }
    
    setIsSendModalOpen(true);
  };

  const handleUserSearch = (searchTerm: string) => {
    setUserSearchTerm(searchTerm);
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const toggleUserSelection = (userId: string | number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => (user._id || user.id || '').toString()));
    }
  };

  const handleSendCouponsToUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('선택된 사용자가 없습니다.');
      return;
    }

    if (!selectedCoupon) {
      alert('선택된 쿠폰이 없습니다.');
      return;
    }

    try {
      const response = await couponsAPI.send(selectedCoupon._id || selectedCoupon.id || 0, selectedUsers);
      if (response.success) {
        const selectedUserNames = users
          .filter(user => selectedUsers.includes((user._id || user.id || '').toString()))
          .map(user => user.name)
          .join(', ');

        alert(`"${selectedCoupon.name}" 쿠폰을 ${selectedUsers.length}명의 사용자에게 발송했습니다.\n\n선택된 사용자: ${selectedUserNames}`);
        
        setIsSendModalOpen(false);
        setSelectedCoupon(null);
        setSelectedUsers([]);
      } else {
        alert('쿠폰 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('쿠폰 발송 에러:', error);
      alert('쿠폰 발송에 실패했습니다.');
    }
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
        {/* <h2 className="text-2xl font-bold text-gray-900">쿠폰 관리</h2> */}
        <button
          onClick={handleAddCoupon}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          쿠폰 추가
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-4 bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="쿠폰 코드 또는 이름으로 검색하세요."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {/* 상태 필터 드롭다운 */}
        <div className="relative">
                      <button
              onClick={() => setIsStatusFilterDropdownOpen(!isStatusFilterDropdownOpen)}
              className="flex items-center justify-between w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm
              focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <span className="text-gray-700">
                {statusFilter === 'all' && '전체 상태'}
                {statusFilter === 'active' && '활성'}
                {statusFilter === 'inactive' && '비활성'}
                {statusFilter === 'expired' && '만료'}
              </span>
              <FontAwesomeIcon 
                icon={isStatusFilterDropdownOpen ? faCaretUp : faCaretDown} 
                className="text-gray-400 ml-2" 
              />
            </button>
            
            {isStatusFilterDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                              <div 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setStatusFilter('all');
                    setIsStatusFilterDropdownOpen(false);
                  }}
                >
                  전체 상태
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setStatusFilter('active');
                    setIsStatusFilterDropdownOpen(false);
                  }}
                >
                  활성
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setStatusFilter('inactive');
                    setIsStatusFilterDropdownOpen(false);
                  }}
                >
                  비활성
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setStatusFilter('expired');
                    setIsStatusFilterDropdownOpen(false);
                  }}
                >
                  만료
                </div>
            </div>
          )}
        </div>
      </div>

      {/* 쿠폰 목록 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="border-b border-gray-300">
              <tr>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  쿠폰 정보
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  할인 정보
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  사용 기간
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  사용 현황
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentCoupons.map((coupon) => (
                <tr key={coupon._id || coupon.id || Math.random()} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{coupon.brand}</div>
                      <div className="text-sm font-medium text-gray-700">{coupon.name}</div>
                      <div className="text-xs text-gray-700">{coupon.code}</div>
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
                        {/* <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" /> */}
                        {formatDate(coupon.startDate)}
                      </div>
                      <div className="text-xs text-gray-500">~ {formatDate(coupon.endDate)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {coupon.usedCount || 0} / {coupon.usageLimit || '무제한'}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${coupon.usageLimit > 0 ? ((coupon.usedCount || 0) / coupon.usageLimit) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      발송: {coupon.usedCount || 0}개
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(coupon.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendCoupon(coupon)}
                        className="text-green-600 hover:text-green-900"
                        title="쿠폰 발송"
                      >
                        <FontAwesomeIcon icon={faGift} />
                      </button>
                      <button
                        onClick={() => handleShowHistory(coupon)}
                        className="text-purple-600 hover:text-purple-900"
                        title="발송 이력"
                      >
                        <FontAwesomeIcon icon={faUser} />
                      </button>
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-blue-600 hover:text-blue-900"
                        title="수정"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon._id || coupon.id || 0)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
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

      {/* 페이지네이션 */}
      {filteredCoupons.length > 0 && (
        <div className="">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={filteredCoupons.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

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
                    브랜드명 *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="예: ADMORE"
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
                    className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="예: 신규 가입 쿠폰"
                  />
                </div>
                
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  쿠폰 코드 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none 
                  focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="예: WELCOME10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md resize-none
                    focus:ring-2 focus:ring-orange-500 outline-none  focus:border-transparent"
                  rows={2}
                  placeholder="쿠폰에 대한 설명을 입력하세요"
                />
              </div>

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
                    className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                {/* 빠른 날짜 설정 */}
                <div className="pt-6">
                  
                  <div className="flex gap-1 justify-between">
                    
                    <button
                      type="button"
                      onClick={() => handleQuickDateSet(3)}
                      className="w-[32%] text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      3개월
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDateSet(6)}
                      className="w-[32%] text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      6개월
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDateSet(12)}
                      className="w-[32%] text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      1년
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFormStatusDropdownOpen(!isFormStatusDropdownOpen)}
                    className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {formData.status === 'active' && '활성'}
                      {formData.status === 'inactive' && '비활성'}
                      {formData.status === 'expired' && '만료'}
                    </span>
                    <FontAwesomeIcon 
                      icon={isFormStatusDropdownOpen ? faCaretUp : faCaretDown} 
                      className="text-gray-400" 
                    />
                  </button>
                  
                  {isFormStatusDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 text-sm bg-white border border-gray-300 rounded-md shadow-lg z-10">
                      <div 
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData({ ...formData, status: 'active' });
                          setIsFormStatusDropdownOpen(false);
                        }}
                      >
                        활성
                      </div>
                      <div 
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData({ ...formData, status: 'inactive' });
                          setIsFormStatusDropdownOpen(false);
                        }}
                      >
                        비활성
                      </div>
                      <div 
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData({ ...formData, status: 'expired' });
                          setIsFormStatusDropdownOpen(false);
                        }}
                      >
                        만료
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인 유형 *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDiscountTypeDropdownOpen(!isDiscountTypeDropdownOpen)}
                      className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                    >
                      <span className="text-gray-700">
                        {formData.discountType === 'percentage' ? '퍼센트 할인' : '정액 할인'}
                      </span>
                      <FontAwesomeIcon 
                        icon={isDiscountTypeDropdownOpen ? faCaretUp : faCaretDown} 
                        className="text-gray-400" 
                      />
                    </button>
                    
                    {isDiscountTypeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 text-sm bg-white border border-gray-300 rounded-md shadow-lg z-10">
                        <div 
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleDiscountTypeChange('percentage')}
                        >
                          퍼센트 할인
                        </div>
                        <div 
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleDiscountTypeChange('fixed')}
                        >
                          정액 할인
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    할인 값 *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.discountValue ? formatNumberDisplay(formData.discountValue) : ''}
                      onChange={(e) => handleNumberInputChange('discountValue', e.target.value)}
                      className="text-sm w-full px-3 py-2 pr-8 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={formData.discountType === 'percentage' ? '10' : '5,000'}
                    />
                    {formData.discountType === 'percentage' && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        %
                      </span>
                    )}
                  </div>
                </div>
                
              </div>

              {formData.discountType === 'percentage' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      최소 구매 금액
                    </label>
                    <input
                      type="text"
                      value={formData.minAmount ? formatNumberDisplay(formData.minAmount) : ''}
                      onChange={(e) => handleNumberInputChange('minAmount', e.target.value)}
                      className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      최대 할인 금액
                    </label>
                    <input
                      type="text"
                      value={formData.maxDiscount ? formatNumberDisplay(formData.maxDiscount) : ''}
                      onChange={(e) => handleNumberInputChange('maxDiscount', e.target.value)}
                      className="text-sm w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-sm px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="text-sm px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  {editingCoupon ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 쿠폰 발송 모달 */}
      {isSendModalOpen && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                쿠폰 발송 - {selectedCoupon.name}
              </h3>
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* 선택된 쿠폰 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">쿠폰 코드:</span>
                  <span className="ml-2 text-gray-900">{selectedCoupon.code}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">할인:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedCoupon.discountType === 'percentage' 
                      ? `${selectedCoupon.discountValue}%` 
                      : `${selectedCoupon.discountValue.toLocaleString()}원`}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">사용 기간:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(selectedCoupon.startDate)} ~ {formatDate(selectedCoupon.endDate)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">사용 제한:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedCoupon.usedCount} / {selectedCoupon.usageLimit}
                  </span>
                </div>
              </div>
            </div>

            {/* 사용자 검색 */}
            <div className="mb-4">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="사용자 이름 또는 이메일로 검색하세요."
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 사용자 선택 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  사용자 선택 ({selectedUsers.length}명 선택됨) - 총 {filteredUsers.length}명
                </h4>
                <button
                  onClick={toggleSelectAllUsers}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedUsers.length === filteredUsers.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              
              <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                        selectedUsers.includes((user._id || user.id || '').toString()) ? 'bg-blue-50' : ''
                      }`}
                                              onClick={() => toggleUserSelection((user._id || user.id || '').toString())}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes((user._id || user.id || '').toString())}
                        onChange={() => toggleUserSelection((user._id || user.id || '').toString())}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.status === 'active' ? '활성' : '비활성'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {userSearchTerm ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                    <div className="text-xs mt-2">
                      (filteredUsers 길이: {filteredUsers.length}, users 길이: {users.length})
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 발송 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSendCouponsToUsers}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedUsers.length}명에게 쿠폰 발송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 쿠폰 발송 이력 모달 */}
      {isHistoryModalOpen && selectedCouponForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  쿠폰 발송 이력
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCouponForHistory.name} ({selectedCouponForHistory.code})
                </p>
              </div>
              <button
                onClick={handleCloseHistory}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">발송 이력을 불러오는 중...</p>
                </div>
              ) : couponSends.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      총 {couponSends.length}명에게 발송됨
                    </h4>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            회원 정보
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            발송일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            사용일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {couponSends.map((send) => (
                          <tr key={send._id || send.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{send.userName}</div>
                                <div className="text-xs text-gray-500">{send.userEmail}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDate(send.sentAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {send.usedAt ? formatDate(send.usedAt) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {send.status === 'used' ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  사용됨
                                </span>
                              ) : send.status === 'expired' ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  만료됨
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  발송됨
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-500">아직 발송된 쿠폰이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseHistory}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement; 