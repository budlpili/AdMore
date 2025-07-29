import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faStar as faSolidStar, 
  faStar as faRegularStar, 
  faTrash, 
  faEdit, 
  faComment,
  faPlus,
  faTimes,
  faImage,
  faClock,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { reviewsAPI } from '../services/api';
import Pagination from './Pagination';

interface Review {
  id: number;
  user: string;
  rating: number;
  content: string;
  time: string;
  product: string;
  productId?: number;
  reply?: string;
  replyTime?: string;
  category?: string;
  tags?: string;
  image?: string;
  background?: string;
  orderId?: string;
  orderDate?: string;
  quantity?: number;
}

interface ReviewManagementProps {
  reviews: Review[];
  onReviewsChange: (reviews: Review[]) => void;
}

const ReviewManagement: React.FC<ReviewManagementProps> = ({ reviews, onReviewsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<'date' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(10);
  
  // 관리자 댓글 관련 상태
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // 새 리뷰 작성 관련 상태
  const [showNewReviewForm, setShowNewReviewForm] = useState(false);
  const [newReviewData, setNewReviewData] = useState({
    userEmail: '',
    rating: 0,
    content: '',
    productId: '',
    orderId: ''
  });
  const [isSubmittingNewReview, setIsSubmittingNewReview] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // 컴포넌트 마운트 시 리뷰 데이터 새로고침
  useEffect(() => {
    handleRefreshReviews();
    loadAvailableProducts();
  }, []);

  // 리뷰 통계 계산
  const calculateReviewStats = () => {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
      : '0.0';
    const reviewsWithAdminReply = reviews.filter(review => review.reply).length;
    
    // 오늘 작성된 리뷰 수 계산
    const today = new Date();
    const todayReviews = reviews.filter(review => {
      const reviewDate = new Date(review.time);
      return reviewDate.toDateString() === today.toDateString();
    }).length;

    // 별점별 리뷰 수 계산
    const ratingCounts = {
      5: reviews.filter(review => review.rating === 5).length,
      4: reviews.filter(review => review.rating === 4).length,
      3: reviews.filter(review => review.rating === 3).length,
      2: reviews.filter(review => review.rating === 2).length,
      1: reviews.filter(review => review.rating === 1).length,
    };

    return {
      totalReviews,
      averageRating,
      reviewsWithAdminReply,
      todayReviews,
      ratingCounts
    };
  };

  const stats = calculateReviewStats();

  // 사용 가능한 상품 목록 로드
  const loadAvailableProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/products?status=active');
      if (response.ok) {
        const products = await response.json();
        setAvailableProducts(products);
      }
    } catch (error) {
      console.error('상품 목록 로드 중 오류:', error);
    }
  };

  // 검색 및 필터링
  const filteredReviews = reviews.filter(review =>
    review.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 정렬
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortType === 'date') {
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
    }
  });

  // 페이지네이션
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = sortedReviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);

  // 리뷰 새로고침
  const handleRefreshReviews = async () => {
    try {
      const response = await reviewsAPI.getAll();
      if (response && Array.isArray(response)) {
        const formattedReviews = response.map((review: any) => ({
          id: review.id,
          user: review.userEmail || review.user || '익명',
          time: review.createdAt || review.time || new Date().toLocaleString(),
          content: review.content,
          product: review.productName || review.product || '상품명 없음',
          rating: review.rating,
          reply: review.adminReply || review.reply,
          replyTime: review.adminReplyTime || review.replyTime,
          productId: review.productId,
          category: review.category,
          tags: review.tags,
          image: review.image,
          background: review.background,
          orderId: review.orderId,
          orderDate: review.orderDate,
          quantity: review.quantity
        }));
        onReviewsChange(formattedReviews);
      }
    } catch (error) {
      console.error('리뷰 새로고침 중 오류:', error);
    }
  };

  // 리뷰 삭제
  const deleteReview = async (reviewId: number) => {
    if (window.confirm('이 리뷰를 삭제하시겠습니까?')) {
      try {
        await reviewsAPI.delete(reviewId);
        await handleRefreshReviews();
        alert('리뷰가 삭제되었습니다.');
      } catch (error) {
        console.error('리뷰 삭제 중 오류:', error);
        alert('리뷰 삭제에 실패했습니다.');
      }
    }
  };

  // 관리자 댓글 작성
  const handleAddReply = async (reviewId: number) => {
    if (!replyContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingReply(true);
    try {
      await reviewsAPI.addAdminReply(reviewId, replyContent);
      setReplyContent('');
      setReplyingTo(null);
      await handleRefreshReviews();
      alert('댓글이 작성되었습니다.');
    } catch (error) {
      console.error('댓글 작성 중 오류:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // 관리자 댓글 수정
  const handleEditReply = async (reviewId: number, newContent: string) => {
    if (!newContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await reviewsAPI.updateAdminReply(reviewId, newContent);
      await handleRefreshReviews();
      alert('댓글이 수정되었습니다.');
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  // 관리자 댓글 삭제
  const handleDeleteReply = async (reviewId: number) => {
    if (window.confirm('이 댓글을 삭제하시겠습니까?')) {
      try {
        await reviewsAPI.deleteAdminReply(reviewId);
        await handleRefreshReviews();
        alert('댓글이 삭제되었습니다.');
      } catch (error) {
        console.error('댓글 삭제 중 오류:', error);
        alert('댓글 삭제에 실패했습니다.');
      }
    }
  };

  // 새 리뷰 작성 핸들러
  const handleSubmitNewReview = async () => {
    if (!newReviewData.userEmail.trim()) {
      alert('고객 이메일을 입력해주세요.');
      return;
    }
    if (newReviewData.rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    if (!newReviewData.content.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }
    if (!newReviewData.productId) {
      alert('상품을 선택해주세요.');
      return;
    }

    setIsSubmittingNewReview(true);
    try {
      const reviewData = {
        productId: parseInt(newReviewData.productId),
        userEmail: newReviewData.userEmail.trim(),
        rating: newReviewData.rating,
        content: newReviewData.content.trim(),
        orderId: newReviewData.orderId || null
      };

      await reviewsAPI.create(reviewData);
      
      // 폼 초기화
      setNewReviewData({
        userEmail: '',
        rating: 0,
        content: '',
        productId: '',
        orderId: ''
      });
      setShowNewReviewForm(false);
      
      // 리뷰 목록 새로고침
      await handleRefreshReviews();
      
      alert('리뷰가 성공적으로 작성되었습니다.');
    } catch (error) {
      console.error('리뷰 작성 중 오류:', error);
      alert('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingNewReview(false);
    }
  };

  // 새 리뷰 폼 초기화
  const resetNewReviewForm = () => {
    setNewReviewData({
      userEmail: '',
      rating: 0,
      content: '',
      productId: '',
      orderId: ''
    });
    setShowNewReviewForm(false);
  };

  // 정렬 함수들
  const handleRatingSort = () => {
    setSortType('rating');
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleDateSort = () => {
    setSortType('date');
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="rounded-lg pb-12">
      <div className="flex justify-between items-center">
        {/* <h2 className="text-xl font-bold text-gray-800">리뷰 관리</h2> */}
        
      </div>

      {/* 새 리뷰 작성 폼 */}
      {showNewReviewForm && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800">새 리뷰 작성</h3>
            <button
              onClick={resetNewReviewForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 고객 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객 이메일 *
              </label>
              <input
                type="email"
                value={newReviewData.userEmail}
                onChange={(e) => setNewReviewData(prev => ({ ...prev, userEmail: e.target.value }))}
                placeholder="고객 이메일을 입력하세요"
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* 상품 선택 */}
            <div>
              
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상품 선택 *
              </label>
              <select
                value={newReviewData.productId}
                onChange={(e) => setNewReviewData(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">상품을 선택하세요</option>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 주문번호 (선택사항) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주문번호 (선택사항)
              </label>
              <input
                type="text"
                value={newReviewData.orderId}
                onChange={(e) => setNewReviewData(prev => ({ ...prev, orderId: e.target.value }))}
                placeholder="주문번호를 입력하세요"
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* 별점 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                별점 *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReviewData(prev => ({ ...prev, rating: star }))}
                    className="text-xl hover:scale-110 transition-transform"
                  >
                    <FontAwesomeIcon
                      icon={star <= newReviewData.rating ? faSolidStar : faRegularStar}
                      className={star <= newReviewData.rating ? 'text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  {newReviewData.rating > 0 ? `${newReviewData.rating}점` : '별점을 선택하세요'}
                </span>
              </div>
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              리뷰 내용 *
            </label>
            <textarea
              value={newReviewData.content}
              onChange={(e) => setNewReviewData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="리뷰 내용을 입력하세요..."
              className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {newReviewData.content.length}/500
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={resetNewReviewForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmitNewReview}
              disabled={isSubmittingNewReview}
              className={`px-4 py-2 text-sm rounded-md ${
                isSubmittingNewReview 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmittingNewReview ? '작성 중...' : '리뷰 작성'}
            </button>
          </div>
        </div>
      )}

      {/* 리뷰 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 총 리뷰 수 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 리뷰 수</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faComment} className="text-blue-600 text-lg" />
            </div>
          </div>
        </div>

        {/* 평균 별점 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 별점</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 mr-2">{stats.averageRating}</p>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FontAwesomeIcon
                      key={i}
                      icon={i < Math.floor(parseFloat(stats.averageRating)) ? faSolidStar : faRegularStar}
                      className={i < Math.floor(parseFloat(stats.averageRating)) ? 'text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FontAwesomeIcon icon={faSolidStar} className="text-yellow-600 text-lg" />
            </div>
          </div>
        </div>

        {/* 관리자 댓글 수 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">관리자 댓글</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reviewsWithAdminReply}</p>
              <p className="text-xs text-gray-500">
                {stats.totalReviews > 0 ? `${((stats.reviewsWithAdminReply / stats.totalReviews) * 100).toFixed(1)}%` : '0%'} 응답률
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faEdit} className="text-green-600 text-lg" />
            </div>
          </div>
        </div>

        {/* 오늘 작성된 리뷰 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">오늘 작성</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayReviews}</p>
              <p className="text-xs text-gray-500">새로운 리뷰</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <FontAwesomeIcon icon={faPlus} className="text-orange-600 text-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 별점별 분포 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">별점별 분포</h3>
        <div className="grid grid-cols-5 gap-4">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="text-sm font-medium text-gray-600 mr-1">{rating}점</span>
                <FontAwesomeIcon icon={faSolidStar} className="text-yellow-400 text-xs" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.ratingCounts[rating as keyof typeof stats.ratingCounts]}</div>
              <div className="text-xs text-gray-500">
                {stats.totalReviews > 0 
                  ? `${((stats.ratingCounts[rating as keyof typeof stats.ratingCounts] / stats.totalReviews) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 검색 및 정렬 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <button
          onClick={() => setShowNewReviewForm(true)}
          className="min-w-[120px] px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          새 리뷰 작성
        </button>
        {/* 검색창 */}
        <div className="relative w-full flex justify-end items-center">
          <input
            type="text"
            placeholder="검색어를 입력해 주세요."
            className="border border-gray-300 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 min-w-[200px] sm:max-w-[240px] w-full"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <span className="absolute right-3 top-2 text-gray-400">
            <FontAwesomeIcon icon={faSearch} />
          </span>
        </div>
        {/* 정렬/새로고침 버튼 그룹 */}
        <div className="flex items-center space-x-2">
          {/* 별점순 */}
          <button
            onClick={handleRatingSort}
            className={`w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100 ${sortType === 'rating' ? 'ring-2 ring-yellow-200' : ''}`}
            title={`별점순 (${sortOrder === 'desc' ? '높은 순' : '낮은 순'})`}
          >
            <FontAwesomeIcon
              icon={faSolidStar}
              className={`text-lg transition-transform duration-200 ${sortType === 'rating' ? 'text-yellow-400' : 'text-gray-400'}`}
              style={{ transform: sortOrder === 'asc' ? 'rotate(180deg)' : 'none' }}
            />
          </button>
          {/* 최신순 */}
          <button
            onClick={handleDateSort}
            className={`w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100 ${sortType === 'date' ? 'ring-2 ring-blue-200' : ''}`}
            title={`최신순 (${sortOrder === 'desc' ? '최신순' : '오래된순'})`}
          >
            <FontAwesomeIcon
              icon={faClock}
              className={`text-lg transition-transform duration-200 ${sortType === 'date' ? 'text-blue-500' : 'text-gray-400'}`}
              style={{ transform: sortOrder === 'asc' ? 'rotate(180deg)' : 'none' }}
            />
          </button>
          {/* 새로고침 */}
          <button
            onClick={handleRefreshReviews}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100"
            title="새로고침"
          >
            <FontAwesomeIcon icon={faRefresh} className="text-gray-500 text-lg" />
          </button>
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div className="space-y-4">
        {currentReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 리뷰가 없습니다.'}
          </div>
        ) : (
          currentReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              {/* 작성자 정보 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-blue-600 mr-2">{review.user}</span>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{review.time}</span>
                </div>
                {/* 삭제 버튼 */}
                <button
                    onClick={() => deleteReview(review.id)}
                    className="text-xs text-gray-400 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    title="리뷰 삭제"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
              </div>
              
              <div className="text-sm mb-4 text-gray-900 font-normal">{review.content}</div>

              {/* 관리자 댓글 표시 */}
              {review.reply && (
                <div className="bg-gray-50 border-l-4 border-blue-400 p-3 text-sm text-gray-700 mt-2 ml-6">
                  <div className="flex xxs:items-center xxs:flex-row flex-col mb-1">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <span className="font-bold text-blue-600 mr-2">애드모어</span>
                        <span className="text-xs text-gray-400">{review.replyTime}</span>
                      </div>
                      
                      {/* 관리자 댓글 버튼들 */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setReplyingTo(review.id);
                            setReplyContent(review.reply || '');
                          }}
                          className="text-xs text-gray-400 hover:text-orange-800 font-medium flex items-center"
                          title="댓글 수정"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1 text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleDeleteReply(review.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                          title="댓글 삭제"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1 text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <span>{review.reply}</span>
                </div>
              )}

              {/* 관리자 댓글 작성/수정 폼 */}
              {replyingTo === review.id && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="font-bold text-blue-600 text-xs">애드모어</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {review.reply ? '댓글 수정' : '관리자 댓글'}
                        </span>
                      </div>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={review.reply ? "댓글을 수정하세요..." : "고객님의 리뷰에 답변을 남겨주세요..."}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                        rows={3}
                        maxLength={300}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {replyContent.length}/300
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => review.reply ? handleEditReply(review.id, replyContent) : handleAddReply(review.id)}
                            disabled={isSubmittingReply}
                            className={`px-3 py-1 text-xs rounded ${
                              isSubmittingReply 
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isSubmittingReply ? '처리중...' : (review.reply ? '수정 완료' : '댓글 등록')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 관리자 댓글 작성 버튼 (댓글이 없을 때만) */}
              {!review.reply && replyingTo !== review.id && (
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                    title="댓글 작성"
                  >
                    <FontAwesomeIcon icon={faComment} className="text-xs" />
                    관리자 댓글 작성
                  </button>
                </div>
              )}

              {/* 구매한 상품 정보 */}
              <div className="text-sm text-gray-600 mt-4 border border-orange-200 p-2 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* 상품 이미지 */}
                    <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {review.image ? (
                        <img 
                          src={review.image} 
                          alt={review.product} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : review.background ? (
                        <img 
                          src={review.background} 
                          alt={review.product} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className="hidden w-8 h-8 text-gray-400">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                    </div>
                    
                    {/* 상품 정보 */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 font-semibold text-sm">{review.product}</span>
                      </div>
                      {(review.category || review.tags) && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {review.category && review.tags ? `${review.category} | ${review.tags}` : review.category || review.tags}
                          </span>
                        </div>
                      )}
                      {/* 주문 정보 */}
                      <div className="flex flex-col sm:flex-row gap-1 text-xs text-gray-600 font-semibold">
                        <span>주문번호: {review.orderId || '없음'}</span>
                        <span className="text-gray-400 text-[10px] sm:block hidden">|</span>
                        <div className="flex items-center gap-1">
                          <span>주문일: {review.orderDate ? new Date(review.orderDate).toLocaleDateString() : '없음'}</span>
                          <span className="text-gray-400 text-[10px]">|</span>
                          <span>수량: {review.quantity || '없음'}일</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={sortedReviews.length}
            itemsPerPage={reviewsPerPage}
            className="justify-center"
            showInfo={true}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewManagement; 