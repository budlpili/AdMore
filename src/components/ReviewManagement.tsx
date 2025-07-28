import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faTrash, faRefresh, faClock, faImage, faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { reviewsAPI } from '../services/api';

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
}

interface ReviewManagementProps {
  reviews: Review[];
  onReviewsChange: (reviews: Review[]) => void;
}

const maskEmail = (email: string): string => {
  if (!email) return '익명';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;
  return `${maskedLocal}@${domain}`;
};

const ReviewManagement: React.FC<ReviewManagementProps> = ({ reviews, onReviewsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(10);
  const [sortType, setSortType] = useState<'date' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // 페이지 번호 계산
  const getPageNumbers = (current: number, total: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

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
          background: review.background
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
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">고객 리뷰 관리</h3>
          <button
            onClick={handleRefreshReviews}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faRefresh} />
            <span>새로고침</span>
          </button>
        </div>

        {/* 검색 및 정렬 컨트롤 */}
        <div className="mb-6 space-y-4">
          {/* 검색 */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="작성자, 내용, 상품명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 정렬 버튼 */}
          <div className="flex space-x-2">
            <button
              onClick={handleRatingSort}
              className={`px-4 py-2 rounded-lg border transition-colors duration-200 flex items-center space-x-2 ${
                sortType === 'rating'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faStar} />
              <span>별점순</span>
              {sortType === 'rating' && (
                <FontAwesomeIcon 
                  icon={sortOrder === 'asc' ? faCaretUp : faCaretDown} 
                  className="text-xs" 
                />
              )}
            </button>
            <button
              onClick={handleDateSort}
              className={`px-4 py-2 rounded-lg border transition-colors duration-200 flex items-center space-x-2 ${
                sortType === 'date'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faClock} />
              <span>최신순</span>
              {sortType === 'date' && (
                <FontAwesomeIcon 
                  icon={sortOrder === 'asc' ? faCaretUp : faCaretDown} 
                  className="text-xs" 
                />
              )}
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
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{maskEmail(review.user)}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{review.time}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon
                          key={i}
                          icon={i < review.rating ? faStar : faStarRegular}
                          className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                    title="리뷰 삭제"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-700 leading-relaxed">{review.content}</p>
                </div>

                {/* 구매한 상품 정보 */}
                <div className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
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
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{review.product}</p>
                    {review.category && (
                      <p className="text-sm text-gray-600">{review.category}</p>
                    )}
                    {review.tags && (
                      <p className="text-xs text-gray-500">{review.tags}</p>
                    )}
                  </div>
                </div>

                {/* 관리자 댓글 */}
                {review.reply && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-orange-700">관리자</span>
                        <span className="text-sm text-orange-600">•</span>
                        <span className="text-sm text-orange-600">{review.replyTime}</span>
                      </div>
                    </div>
                    <p className="text-orange-800">{review.reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              
              {pageNumbers.map((pageNum, index) => (
                <button
                  key={index}
                  onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : null}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </nav>
          </div>
        )}

        {/* 페이지 정보 */}
        <div className="mt-4 text-center text-sm text-gray-500">
          총 {filteredReviews.length}개의 리뷰 중 {indexOfFirstReview + 1}-{Math.min(indexOfLastReview, filteredReviews.length)}번째
        </div>
      </div>
    </div>
  );
};

export default ReviewManagement; 