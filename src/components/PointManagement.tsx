import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faMinus, faSearch, faFilter, faCalendarAlt, faCoins,
  faUser, faGift, faShoppingCart, faTimes, faCheck, faCaretUp, faCaretDown
} from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';

interface PointTransaction {
  id: number;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'earn' | 'spend' | 'expire' | 'adjust';
  amount: number;
  balance: number;
  description: string;
  orderId?: string;
  createdAt: string;
  expiresAt?: string;
}

interface UserPoint {
  userId: string;
  userEmail: string;
  userName: string;
  currentPoints: number;
  totalEarned: number;
  totalSpent: number;
  totalExpired: number;
  lastTransactionDate: string;
}

const PointManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoint[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PointTransaction[]>([]);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPoint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'users'>('transactions');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 포인트 조정 폼 상태
  const [adjustForm, setAdjustForm] = useState({
    type: 'earn' as 'earn' | 'spend',
    amount: 0,
    description: ''
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 필터링 적용
  useEffect(() => {
    let filtered = transactions;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 타입 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    // 사용자 필터링
    if (userFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.userId === userFilter);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [transactions, searchTerm, typeFilter, userFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: API 호출로 변경
      const mockTransactions: PointTransaction[] = [
        {
          id: 1,
          userId: '1',
          userEmail: 'user1@example.com',
          userName: '김철수',
          type: 'earn',
          amount: 1000,
          balance: 1000,
          description: '주문 적립 (주문번호: ORD001)',
          orderId: 'ORD001',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          userId: '1',
          userEmail: 'user1@example.com',
          userName: '김철수',
          type: 'spend',
          amount: -500,
          balance: 500,
          description: '쿠폰 구매',
          createdAt: '2024-01-16T14:20:00Z'
        },
        {
          id: 3,
          userId: '2',
          userEmail: 'user2@example.com',
          userName: '이영희',
          type: 'earn',
          amount: 2000,
          balance: 2000,
          description: '주문 적립 (주문번호: ORD002)',
          orderId: 'ORD002',
          createdAt: '2024-01-14T09:15:00Z'
        }
      ];

      const mockUserPoints: UserPoint[] = [
        {
          userId: '1',
          userEmail: 'user1@example.com',
          userName: '김철수',
          currentPoints: 500,
          totalEarned: 1500,
          totalSpent: 1000,
          totalExpired: 0,
          lastTransactionDate: '2024-01-16T14:20:00Z'
        },
        {
          userId: '2',
          userEmail: 'user2@example.com',
          userName: '이영희',
          currentPoints: 2000,
          totalEarned: 2000,
          totalSpent: 0,
          totalExpired: 0,
          lastTransactionDate: '2024-01-14T09:15:00Z'
        }
      ];

      setTransactions(mockTransactions);
      setUserPoints(mockUserPoints);
    } catch (error) {
      console.error('데이터 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = (user: UserPoint) => {
    setSelectedUser(user);
    setAdjustForm({
      type: 'earn',
      amount: 0,
      description: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      const newTransaction: PointTransaction = {
        id: Date.now(),
        userId: selectedUser.userId,
        userEmail: selectedUser.userEmail,
        userName: selectedUser.userName,
        type: adjustForm.type,
        amount: adjustForm.type === 'earn' ? adjustForm.amount : -adjustForm.amount,
        balance: selectedUser.currentPoints + (adjustForm.type === 'earn' ? adjustForm.amount : -adjustForm.amount),
        description: adjustForm.description,
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // 사용자 포인트 업데이트
      setUserPoints(prev => prev.map(user => {
        if (user.userId === selectedUser.userId) {
          return {
            ...user,
            currentPoints: user.currentPoints + (adjustForm.type === 'earn' ? adjustForm.amount : -adjustForm.amount),
            totalEarned: user.totalEarned + (adjustForm.type === 'earn' ? adjustForm.amount : 0),
            totalSpent: user.totalSpent + (adjustForm.type === 'spend' ? adjustForm.amount : 0),
            lastTransactionDate: new Date().toISOString()
          };
        }
        return user;
      }));

      alert('포인트가 조정되었습니다.');
      setIsAdjustModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('포인트 조정 에러:', error);
      alert('포인트 조정에 실패했습니다.');
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      earn: { color: 'bg-green-100 text-green-800', text: '적립', icon: faPlus },
      spend: { color: 'bg-red-100 text-red-800', text: '사용', icon: faMinus },
      expire: { color: 'bg-gray-100 text-gray-800', text: '만료', icon: faTimes },
      adjust: { color: 'bg-blue-100 text-blue-800', text: '조정', icon: faCheck }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.adjust;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} flex items-center gap-1`}>
        <FontAwesomeIcon icon={config.icon} className="text-xs" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const year = koreanTime.getUTCFullYear();
      const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(koreanTime.getUTCDate()).padStart(2, '0');
      const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
      const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return dateString;
    }
  };

  const formatAmount = (amount: number) => {
    return amount > 0 ? `+${amount.toLocaleString()}` : amount.toLocaleString();
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

      {/* 탭 */}
      <div className="bg-white rounded-lg shadow px-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            포인트 내역
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            사용자별 포인트
          </button>
        </nav>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* 검색 및 필터 */}
          <div className="flex gap-4 bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="사용자 이메일, 이름 또는 설명으로 검색해주세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {/* 타입 필터 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="flex items-center justify-between w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <span className="text-gray-700">
                  {typeFilter === 'all' && '전체 타입'}
                  {typeFilter === 'earn' && '적립'}
                  {typeFilter === 'spend' && '사용'}
                  {typeFilter === 'expire' && '만료'}
                  {typeFilter === 'adjust' && '조정'}
                </span>
                <FontAwesomeIcon 
                  icon={isTypeDropdownOpen ? faCaretUp : faCaretDown} 
                  className="text-gray-400 ml-2" 
                />
              </button>
              
              {isTypeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setTypeFilter('all');
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    전체 타입
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setTypeFilter('earn');
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    적립
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setTypeFilter('spend');
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    사용
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setTypeFilter('expire');
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    만료
                  </div>
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setTypeFilter('adjust');
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    조정
                  </div>
                </div>
              )}
            </div>

            {/* 사용자 필터 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center justify-between w-56 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <span className="text-gray-700">
                  {userFilter === 'all' && '전체 사용자'}
                  {userFilter !== 'all' && userPoints.find(user => user.userId === userFilter)?.userName}
                </span>
                <FontAwesomeIcon 
                  icon={isUserDropdownOpen ? faCaretUp : faCaretDown} 
                  className="text-gray-400 ml-2" 
                />
              </button>
              
              {isUserDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setUserFilter('all');
                      setIsUserDropdownOpen(false);
                    }}
                  >
                    전체 사용자
                  </div>
                  {userPoints.map(user => (
                    <div 
                      key={user.userId}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setUserFilter(user.userId);
                        setIsUserDropdownOpen(false);
                      }}
                    >
                      {user.userName} ({user.userEmail})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 포인트 내역 테이블 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="border-b border-gray-300">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      포인트
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      잔액
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      날짜
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{transaction.userName}</div>
                          <div className="text-sm text-gray-500">{transaction.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(transaction.type)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {transaction.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{transaction.description}</div>
                        {transaction.orderId && (
                          <div className="text-xs text-gray-500">주문번호: {transaction.orderId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          {filteredTransactions.length > 0 && (
            <div className="">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredTransactions.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {/* 사용자별 포인트 테이블 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      현재 포인트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 적립
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 사용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 만료
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      마지막 거래
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userPoints.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                          <div className="text-sm text-gray-500">{user.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-blue-600">
                          {user.currentPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-green-600">
                          +{user.totalEarned.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-red-600">
                          -{user.totalSpent.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          -{user.totalExpired.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(user.lastTransactionDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleAdjustPoints(user)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faCoins} />
                          포인트 조정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 포인트 조정 모달 */}
      {isAdjustModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">포인트 조정</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">사용자: {selectedUser.userName}</div>
              <div className="text-sm text-gray-600 mb-2">이메일: {selectedUser.userEmail}</div>
              <div className="text-sm font-medium text-blue-600">
                현재 포인트: {selectedUser.currentPoints.toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  조정 유형 *
                </label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as 'earn' | 'spend' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="earn">적립</option>
                  <option value="spend">차감</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  포인트 *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사유 *
                </label>
                <textarea
                  required
                  value={adjustForm.description}
                  onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="포인트 조정 사유를 입력하세요"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  조정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointManagement; 