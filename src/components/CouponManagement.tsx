import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faCheck, faTimes, faSearch, faFilter,
  faCalendarAlt, faPercentage, faTicketAlt, faTicket, faCaretUp, faCaretDown,
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
  const [showNewMembersOnly, setShowNewMembersOnly] = useState(false);
  
  // 쿠폰을 받은 유저 목록 상태
  const [usersWithCoupon, setUsersWithCoupon] = useState<Set<string>>(new Set());
  
  // 쿠폰 발송 이력 관련 상태
  const [couponSends, setCouponSends] = useState<CouponSend[]>([]);
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
    
    if (showNewMembersOnly) {
      // 신규회원만 필터링 (가입일이 최근 30일 이내인 사용자)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const newUsers = users.filter((user: any) => {
        if (!user.createdAt) return false;
        
        const userDate = new Date(user.createdAt);
        const isNewUser = userDate > thirtyDaysAgo;
        
        console.log(`사용자 ${user.name}: 가입일 ${userDate.toISOString()}, 신규회원 여부: ${isNewUser}`);
        
        return isNewUser;
      });
      
      console.log('신규회원 필터링 결과:', newUsers);
      setFilteredUsers(newUsers);
    } else {
      setFilteredUsers(users);
    }
  }, [users, showNewMembersOnly]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponsAPI.getAll();
      if (response.success && response.coupons) {
        setCoupons(response.coupons);
        setFilteredCoupons(response.coupons);
        
        // 모든 쿠폰의 발송 이력을 자동으로 로드하여 usedCount 업데이트
        console.log('모든 쿠폰의 발송 이력 자동 로드 시작...');
        for (const coupon of response.coupons) {
          try {
            await loadCouponSendsForUpdate(coupon._id || coupon.id || 0);
          } catch (error) {
            console.error(`쿠폰 ${coupon.name} 발송 이력 로드 실패:`, error);
          }
        }
        console.log('모든 쿠폰의 발송 이력 자동 로드 완료');
      } else {
        setCoupons([]);
        setFilteredCoupons([]);
      }
    } catch (error) {
      console.error('쿠폰 로드 에러:', error);
      // 에러 발생 시 빈 배열로 설정
      setCoupons([]);
      setFilteredCoupons([]);
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
        
        // 모든 활성 사용자 표시
        const activeUsers = response.users
          .filter((user: any) => user.status === 'active')
          .map((user: any) => ({
            id: (user._id || user.id || '').toString(),
            email: user.email,
            name: user.name,
            status: user.status,
            createdAt: user.createdAt || user.registeredAt || user.joinDate
          }));
        
        console.log('활성 유저 목록:', activeUsers);
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

  // 쿠폰 발송 이력 로드 (usedCount 업데이트용)
  const loadCouponSendsForUpdate = async (couponId: string | number) => {
    try {
      const response = await couponsAPI.getCouponSends(couponId.toString());
      
      if (response.success && response.couponSends) {
        const actualUsedCount = response.couponSends.length;
        setCoupons(prevCoupons => 
          prevCoupons.map(coupon => {
            if ((coupon._id || coupon.id || 0).toString() === couponId.toString()) {
              return { ...coupon, usedCount: actualUsedCount };
            }
            return coupon;
          })
        );
      } else if (response.success && response.sends) {
        const actualUsedCount = response.sends.length;
        setCoupons(prevCoupons => 
          prevCoupons.map(coupon => {
            if ((coupon._id || coupon.id || 0).toString() === couponId.toString()) {
              return { ...coupon, usedCount: actualUsedCount };
            }
            return coupon;
          })
        );
      }
    } catch (error) {
      console.error(`쿠폰 ${couponId} 발송 이력 로드 에러:`, error);
    }
  };

  // 쿠폰 발송 이력 로드
  const loadCouponSends = async (couponId: string | number) => {
    try {
      setHistoryLoading(true);
      console.log('쿠폰 발송 이력 로드 시작, couponId:', couponId);
      const response = await couponsAPI.getCouponSends(couponId.toString());
      console.log('쿠폰 발송 이력 응답:', response);
      
      if (response.success && response.couponSends) {
        console.log('couponSends 필드 사용:', response.couponSends);
        setCouponSends(response.couponSends);
        
        // 쿠폰의 usedCount를 발송 이력 수로 업데이트
        const actualUsedCount = response.couponSends.length;
        console.log('실제 발송된 쿠폰 수:', actualUsedCount);
        
        // 현재 쿠폰 목록에서 해당 쿠폰의 usedCount 업데이트
        setCoupons(prevCoupons => 
          prevCoupons.map(coupon => {
            if ((coupon._id || coupon.id || 0).toString() === couponId.toString()) {
              console.log(`쿠폰 ${coupon.name}의 usedCount를 ${actualUsedCount}로 업데이트`);
              return { ...coupon, usedCount: actualUsedCount };
            }
            return coupon;
          })
        );
      } else if (response.success && response.sends) {
        console.log('sends 필드 사용:', response.sends);
        setCouponSends(response.sends);
        
        // 쿠폰의 usedCount를 발송 이력 수로 업데이트
        const actualUsedCount = response.sends.length;
        console.log('실제 발송된 쿠폰 수:', actualUsedCount);
        
        // 현재 쿠폰 목록에서 해당 쿠폰의 usedCount 업데이트
        setCoupons(prevCoupons => 
          prevCoupons.map(coupon => {
            if ((coupon._id || coupon.id || 0).toString() === couponId.toString()) {
              console.log(`쿠폰 ${coupon.name}의 usedCount를 ${actualUsedCount}로 업데이트`);
              return { ...coupon, usedCount: actualUsedCount };
            }
            return coupon;
          })
        );
      } else {
        console.log('응답에 발송 이력 데이터가 없음:', response);
        console.log('couponSends 상태 업데이트: []');
        setCouponSends([]);
      }
      
      // 상태 업데이트 후 확인
      setTimeout(() => {
        console.log('couponSends 상태 업데이트 후:', couponSends);
      }, 100);
    } catch (error) {
      console.error('쿠폰 발송 이력 로드 에러:', error);
      setCouponSends([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 쿠폰을 받은 유저 목록 로드
  const loadUsersWithCoupon = async (couponId: string | number) => {
    try {
      console.log('쿠폰을 받은 유저 목록 로드 시작, couponId:', couponId);
      const response = await couponsAPI.getCouponSends(couponId.toString());
      console.log('쿠폰 발송 이력 응답:', response);
      
      if (response.success && response.couponSends) {
        const userIds = response.couponSends.map((send: any) => 
          (send.userId || send._id || '').toString()
        );
        console.log('쿠폰을 받은 유저 ID 목록:', userIds);
        setUsersWithCoupon(new Set(userIds));
      } else if (response.success && response.sends) {
        // API 응답 구조가 다른 경우 (sends 필드 사용)
        console.log('API 응답의 sends 필드 상세:', response.sends);
        const userIds: string[] = [];
        response.sends.forEach((send: any) => {
          console.log('개별 send 객체 전체:', JSON.stringify(send, null, 2));
          
          // 다양한 ID 필드 시도
          let userId = '';
          if (send.userId && typeof send.userId === 'object' && send.userId._id) {
            // userId가 객체인 경우 (예: {_id: '...', name: '...', email: '...'})
            userId = send.userId._id;
          } else if (send.userId && typeof send.userId === 'string') {
            // userId가 문자열인 경우
            userId = send.userId;
          } else if (send._id) userId = send._id;
          else if (send.user && send.user.id) userId = send.user.id;
          else if (send.user && send.user._id) userId = send.user._id;
          
          console.log('추출된 userId:', userId);
          
          // userId가 비어있지 않으면 배열에 추가
          if (userId) {
            userIds.push(userId.toString());
          } else {
            console.log('userId가 비어있음, 이 항목은 제외');
          }
        });
        console.log('쿠폰을 받은 유저 ID 목록 (sends 필드):', userIds);
        setUsersWithCoupon(new Set(userIds));
      } else {
        console.log('쿠폰 발송 이력이 없음, 응답:', response);
        setUsersWithCoupon(new Set());
      }
    } catch (error) {
      console.error('쿠폰을 받은 유저 목록 로드 에러:', error);
      setUsersWithCoupon(new Set());
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

  // 쿠폰 발송 이력 표시/숨기기
  const handleShowHistory = async (coupon: Coupon) => {
    if (selectedCouponForHistory && (selectedCouponForHistory._id || selectedCouponForHistory.id) === (coupon._id || coupon.id)) {
      // 같은 쿠폰이면 숨기기
      setSelectedCouponForHistory(null);
      setCouponSends([]);
    } else {
      // 다른 쿠폰이면 표시
      setSelectedCouponForHistory(coupon);
      await loadCouponSends(coupon._id || coupon.id || 0);
    }
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
    console.log('선택된 쿠폰:', coupon);
    setSelectedCoupon(coupon);
    setSelectedUsers([]);
    setUserSearchTerm('');
    
    // 모달을 열 때 최신 유저 목록을 다시 로드
    try {
      console.log('유저 목록 다시 로드 시작...');
      await loadUsers();
      console.log('유저 목록 로드 완료');
      
      // 쿠폰을 받은 유저 목록 로드
      console.log('쿠폰을 받은 유저 목록 로드 시작...');
      await loadUsersWithCoupon(coupon._id || coupon.id || 0);
      console.log('쿠폰을 받은 유저 목록 로드 완료');
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

  const toggleNewMembersOnly = () => {
    setShowNewMembersOnly(!showNewMembersOnly);
    setSelectedUsers([]); // 선택 해제
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
        
        // 쿠폰 목록 새로고침하여 발송 현황 업데이트
        await loadCoupons();
        
        setIsSendModalOpen(false);
        setSelectedCoupon(null);
        setSelectedUsers([]);
      } else {
        // 중복 발송인 경우 현재 발송 수 업데이트
        if (response.alreadySent && response.totalSentCount !== undefined) {
          alert(`이미 발송된 쿠폰입니다. 현재 총 ${response.totalSentCount}명에게 발송되었습니다.`);
          // 쿠폰 목록 새로고침하여 발송 현황 업데이트
          await loadCoupons();
        } else {
          alert('쿠폰 발송에 실패했습니다.');
        }
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

      {/* 검색 및 필터 */}
      <div className="flex gap-4 bg-white rounded-lg shadow p-4 mb-6">
        <button
          onClick={handleAddCoupon}
          className="bg-orange-100 text-orange-700 text-sm px-4 py-2 rounded-lg hover:bg-orange-200 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          쿠폰 추가
        </button>
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
                      {coupon.usedCount || 0}명 / {coupon.usageLimit > 0 ? coupon.usageLimit : users.length}명
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${coupon.usageLimit > 0 ? ((coupon.usedCount || 0) / coupon.usageLimit) * 100 : ((coupon.usedCount || 0) / users.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span>발송: {coupon.usedCount || 0}명</span>
                      <button
                        onClick={() => handleShowHistory(coupon)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline hover:no-underline"
                      >
                        내역보기
                      </button>
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

      {/* 쿠폰 발송 이력 */}
      {selectedCouponForHistory && (
        <div className="mt-8 bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* <h3 className="text-lg font-semibold text-gray-900">
                  쿠폰 발송 이력
                </h3> */}
                <FontAwesomeIcon icon={faTicket} className="text-gray-400" />
                <h3 className="text-gray-600 font-semibold text-base">
                  쿠폰명 : {selectedCouponForHistory.name} <span className="text-gray-400 text-sm">({selectedCouponForHistory.code})</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedCouponForHistory(null);
                  setCouponSends([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} className="text-base" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">발송 이력을 불러오는 중...</p>
              </div>
            ) : couponSends.length > 0 ? (
              <div>
                <div className="mb-4">
                  <div className="flex gap-4 text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">발송됨: {couponSends.length}명</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">사용됨: {couponSends.filter(send => send.status === 'used').length}명</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">미사용: {couponSends.filter(send => send.status === 'sent').length}명</span>
                    </div>
                  </div>
                </div>
                
                <div className="max-h-[500px] overflow-x-auto border border-gray-200 rounded-lg">
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
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-300">
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
                총 {filteredUsers.length}명 중 <span className="text-green-600">{selectedUsers.length}명</span> 선택됨
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={toggleSelectAllUsers}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedUsers.length === filteredUsers.length ? '전체 해제' : '전체 선택'}
                  </button>
                  <button
                    onClick={toggleNewMembersOnly}
                    className={`text-sm px-2 py-1 rounded ${
                      showNewMembersOnly 
                        ? 'bg-green-600 text-white' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    신규회원
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const userId = (user._id || user.id || '').toString();
                    const hasCoupon = usersWithCoupon.has(userId);
                    const isSelected = selectedUsers.includes(userId);
                    
                    console.log(`사용자 ${user.name} (${userId}): hasCoupon=${hasCoupon}, isSelected=${isSelected}`);
                    
                    return (
                      <div
                        key={user.id}
                        className={`flex flex-row items-center p-3 gap-2 border-b border-gray-200 last:border-b-0 ${
                          hasCoupon ? 'bg-gray-100 cursor-not-allowed opacity-60' : 
                          isSelected ? 'bg-blue-50 hover:bg-gray-50 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => !hasCoupon && toggleUserSelection(userId)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !hasCoupon && toggleUserSelection(userId)}
                          disabled={hasCoupon}
                          className={`mr-3 ${hasCoupon ? 'opacity-50' : ''}`}
                        />
                        <div className="flex flex-row items-center justify-between w-[60%]">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          {user.createdAt && (
                            <div className="text-xs text-gray-400">
                              가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-[40%] justify-end">
                          <div className="text-xs text-gray-400">
                            {user.status === 'active' ? '활성' : '비활성'}
                          </div>
                          {hasCoupon && (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                              발송됨
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
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
                className="text-sm px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSendCouponsToUsers}
                disabled={selectedUsers.length === 0}
                className="text-sm px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedUsers.length}명에게 쿠폰 발송
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CouponManagement; 