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
  faRefresh,
  faCaretUp,
  faCaretDown
} from '@fortawesome/free-solid-svg-icons';
import { reviewsAPI, productAPI } from '../services/api';
import Pagination from './Pagination';

interface Review {
  id: number;
  _id?: string; // MongoDB 원본 ID 추가
  user: string;
  rating: number;
  content: string;
  time: string;
  product: string;
  productId?: string;
  reply?: string;
  replyTime?: string;
  category?: string;
  tags?: string;
  image?: string;
  background?: string;
  orderId?: string;
  orderDate?: string;
  quantity?: number;
  productImage?: string; // 추가된 필드
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
  
  // 관리자 댓글 관련 상태 - 각 리뷰별로 독립적으로 관리
  const [replyingTo, setReplyingTo] = useState<{ [key: number]: boolean }>({});
  const [replyContents, setReplyContents] = useState<{ [key: number]: string }>({});
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
  const [selectedReviews, setSelectedReviews] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // 컴포넌트 마운트 시 리뷰 데이터 새로고침
  useEffect(() => {
    handleRefreshReviews();
    loadAvailableProducts();
  }, []);

  // replyingTo 상태 변경 시 디버깅
  useEffect(() => {
    console.log('replyingTo 상태 변경됨:', replyingTo);
  }, [replyingTo]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.product-dropdown')) {
        setIsProductDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 체크박스 선택/해제 함수들
  const handleSelectReview = (reviewId: number) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAllReviews = () => {
    if (selectedReviews.length === currentReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(currentReviews.map(review => review.id));
    }
  };

  const handleDeleteSelectedReviews = async () => {
    if (selectedReviews.length === 0) {
      alert('삭제할 리뷰를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택된 ${selectedReviews.length}개의 리뷰를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // 선택된 리뷰들의 실제 ID를 찾기
      const reviewsToDelete = reviews.filter(review => 
        selectedReviews.includes(review.id)
      );
      
      console.log('삭제할 리뷰들:', reviewsToDelete);
      
      const deletePromises = reviewsToDelete.map(review => {
        if (!review._id) {
          console.error(`리뷰 ${review.id}의 MongoDB _id가 없습니다. 리뷰 데이터:`, review);
          throw new Error(`리뷰 ${review.id}의 MongoDB _id가 없습니다.`);
        }
        console.log(`리뷰 ${review.id} 삭제 시도, 사용할 MongoDB _id:`, review._id);
        return reviewsAPI.delete(review._id);
      });
      
      await Promise.all(deletePromises);
      
      // 삭제된 리뷰들을 제외한 새로운 리뷰 목록 생성
      const updatedReviews = reviews.filter(review => 
        !selectedReviews.includes(review.id)
      );
      
      onReviewsChange(updatedReviews);
      setSelectedReviews([]);
      alert(`${selectedReviews.length}개의 리뷰가 삭제되었습니다.`);
    } catch (error) {
      console.error('리뷰 일괄 삭제 오류:', error);
      alert('리뷰 삭제 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

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

  // 사용 가능한 상품 목록 로드 (모든 상품 - 활성/비활성)
  const loadAvailableProducts = async () => {
    try {
      const productList = await productAPI.getAllProductsForAdmin();
      console.log('로드된 상품 데이터:', productList);
      
      // 응답 구조에 따라 상품 데이터 추출
      const products = productList || [];
      
      // 첫 번째 상품의 구조 확인
      if (products.length > 0) {
        console.log('첫 번째 상품 구조:', products[0]);
        console.log('첫 번째 상품의 id 타입:', typeof products[0].id);
        console.log('첫 번째 상품의 _id:', products[0]._id);
      }
      
      // id 또는 _id가 있는 상품만 필터링 (MongoDB _id도 고려)
      const validProducts = products.filter((product: any) => product && (product.id || product._id));
      console.log('유효한 상품 데이터:', validProducts);
      
      // 상품 이미지 정보 확인
      validProducts.forEach((product: any) => {
        console.log(`상품 "${product.name}" 이미지 정보:`, {
          id: product.id || product._id,
          image: product.image,
          background: product.background,
          status: product.status
        });
      });
      
      // 상품 데이터에 id 필드 추가 (원본 ID 유지)
      const productsWithId = validProducts.map((product: any, index: number) => {
        // 원본 ID를 그대로 유지 (문자열 또는 숫자)
        const originalId = product.id || product._id || `product-${index}`;
        
        return {
          ...product,
          id: originalId
        };
      });
      
      setAvailableProducts(productsWithId);
    } catch (error) {
      console.error('상품 목록 로드 중 오류:', error);
      setAvailableProducts([]);
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
      console.log('리뷰 새로고침 응답:', response);
      
      let reviewsData = [];
      if (response && Array.isArray(response)) {
        // 직접 배열인 경우
        reviewsData = response;
      } else if (response && response.success && Array.isArray(response.reviews)) {
        // {success: true, reviews: [...]} 형태인 경우
        reviewsData = response.reviews;
      } else {
        console.warn('예상하지 못한 리뷰 응답 구조:', response);
        return;
      }
      
      const formattedReviews = reviewsData.map((review: any, index: number) => {
        // MongoDB _id를 기반으로 고유한 숫자 ID 생성
        let uniqueId: number;
        if (review._id) {
          // MongoDB _id의 마지막 8자리를 숫자로 변환
          const idStr = review._id.toString();
          uniqueId = parseInt(idStr.slice(-8), 16);
        } else if (review.id) {
          uniqueId = parseInt(review.id.toString());
        } else {
          // fallback: 현재 시간 + 인덱스
          uniqueId = Date.now() + index;
        }
        
        // _id가 없는 경우 경고 로그 출력
        if (!review._id) {
          console.warn(`리뷰 ${index}에 _id가 없습니다:`, review);
        }
        
        return {
          id: uniqueId,
          _id: review._id || review.id, // MongoDB 원본 ID 저장 (fallback으로 id 사용)
          user: review.userEmail || review.userId || review.user || '익명',
          time: (() => {
            const date = review.createdAt || review.time || new Date();
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
          })(),
          content: review.content,
          product: review.productName || review.product || '상품명 없음',
          rating: review.rating,
          reply: review.adminReply || review.reply,
          replyTime: (() => {
            const replyDate = review.adminReplyTime || review.replyTime;
            if (replyDate) {
              const d = new Date(replyDate);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day} ${hours}:${minutes}`;
            }
            return undefined;
          })(),
          productId: review.productId,
          category: review.category,
          tags: review.tags,
          image: review.image,
          background: review.background,
          orderId: review.orderId,
          orderDate: review.orderDate,
          quantity: review.quantity,
          productImage: review.productImage || review.image || review.background || null
        };
      });
      
      console.log('포맷된 리뷰 데이터:', formattedReviews);
      onReviewsChange(formattedReviews);
    } catch (error) {
      console.error('리뷰 새로고침 중 오류:', error);
    }
  };

  // 리뷰 삭제
  const deleteReview = async (reviewId: number) => {
    if (window.confirm('이 리뷰를 삭제하시겠습니까?')) {
      try {
        // 해당 리뷰의 MongoDB _id 찾기
        const review = reviews.find(r => r.id === reviewId);
        if (!review) {
          console.error(`리뷰 ID ${reviewId}를 찾을 수 없습니다. 현재 리뷰 목록:`, reviews.map(r => ({ id: r.id, _id: r._id })));
          alert('리뷰를 찾을 수 없습니다.');
          return;
        }
        if (!review._id) {
          console.error(`리뷰 ${reviewId}의 MongoDB _id가 없습니다. 리뷰 데이터:`, review);
          alert('리뷰 ID 정보가 없습니다.');
          return;
        }
        
        console.log(`리뷰 삭제 시도, MongoDB _id:`, review._id);
        await reviewsAPI.delete(review._id);
        
        // 삭제된 리뷰를 제외한 새로운 리뷰 목록 생성
        const updatedReviews = reviews.filter(r => r.id !== reviewId);
        onReviewsChange(updatedReviews);
        
        alert('리뷰가 삭제되었습니다.');
      } catch (error) {
        console.error('리뷰 삭제 중 오류:', error);
        alert('리뷰 삭제에 실패했습니다. 자세한 내용은 콘솔을 확인해주세요.');
      }
    }
  };

  // 관리자 댓글 작성
  const handleAddReply = async (reviewId: number) => {
    console.log('댓글 작성 시도 - reviewId:', reviewId);
    console.log('댓글 내용:', replyContents[reviewId]);
    console.log('현재 reviews 상태:', reviews);
    
    // 해당 리뷰의 MongoDB _id 찾기
    const review = reviews.find(r => r.id === reviewId);
    if (!review) {
      alert('리뷰를 찾을 수 없습니다.');
      return;
    }
    
    console.log('찾은 리뷰 객체:', review);
    console.log('리뷰의 _id:', review._id);
    console.log('리뷰의 id:', review.id);
    
    if (!replyContents[reviewId]?.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingReply(true);
    try {
      // MongoDB _id를 사용하여 API 호출
      const mongoId = review._id || review.id;
      if (!mongoId) {
        throw new Error('리뷰의 MongoDB ID를 찾을 수 없습니다.');
      }
      
      console.log('API 호출 전 - MongoDB _id:', mongoId, 'adminReply:', replyContents[reviewId]);
      const response = await reviewsAPI.addAdminReply(mongoId, replyContents[reviewId] || '');
      console.log('API 응답:', response);
      
      // 성공 시 로컬 상태 즉시 업데이트
      const currentTime = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      })();
      const updatedReviews = reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            reply: replyContents[reviewId],
            replyTime: currentTime
          };
        }
        return review;
      });
      
      onReviewsChange(updatedReviews);
      
      // 폼 상태 초기화
      setReplyContents(prev => ({ ...prev, [reviewId]: '' }));
      setReplyingTo(prev => ({ ...prev, [reviewId]: false }));
      
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
      // 해당 리뷰의 MongoDB _id 찾기
      const review = reviews.find(r => r.id === reviewId);
      if (!review || !review._id) {
        alert('리뷰를 찾을 수 없습니다.');
        return;
      }
      
      const response = await reviewsAPI.updateAdminReply(review._id, newContent);
      
      // 성공 시 로컬 상태 즉시 업데이트
      const currentTime = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      })();
      const updatedReviews = reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            reply: newContent,
            replyTime: currentTime
          };
        }
        return review;
      });
      
      onReviewsChange(updatedReviews);
      
      // 폼 상태 초기화
      setReplyContents(prev => ({ ...prev, [reviewId]: '' }));
      setReplyingTo(prev => ({ ...prev, [reviewId]: false }));
      
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
        // 해당 리뷰의 MongoDB _id 찾기
        const review = reviews.find(r => r.id === reviewId);
        if (!review || !review._id) {
          alert('리뷰를 찾을 수 없습니다.');
          return;
        }
        
        await reviewsAPI.deleteAdminReply(review._id);
        
        // 성공 시 로컬 상태 즉시 업데이트
        const updatedReviews = reviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              reply: undefined,
              replyTime: undefined
            };
          }
          return review;
        });
        
        onReviewsChange(updatedReviews);
        
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
      // 선택된 상품 정보 찾기
      const selectedProduct = availableProducts.find(p => 
        p && (p.id || p._id) && (p.id || p._id).toString() === newReviewData.productId
      );
      
      if (!selectedProduct) {
        throw new Error('선택된 상품을 찾을 수 없습니다.');
      }

      const reviewData = {
        userId: newReviewData.userEmail.trim(), // 이메일을 userId로 사용
        userEmail: newReviewData.userEmail.trim(), // userEmail 필드 추가
        productId: newReviewData.productId, // 문자열 그대로 사용
        product: selectedProduct.name || '상품명 없음', // 상품명 추가
        content: newReviewData.content.trim(),
        rating: newReviewData.rating
      };

      console.log('전송할 리뷰 데이터:', reviewData);

      const response = await reviewsAPI.create(reviewData);
      console.log('리뷰 생성 응답:', response);
      
              // 새로 생성된 리뷰를 즉시 목록에 추가
        if (response && response.review) {
          // MongoDB _id를 기반으로 고유한 숫자 ID 생성
          let uniqueId: number;
          if (response.review._id) {
            const idStr = response.review._id.toString();
            uniqueId = parseInt(idStr.slice(-8), 16);
          } else if (response.review.id) {
            uniqueId = parseInt(response.review.id.toString());
          } else {
            uniqueId = Date.now();
          }
          
          const newReview: Review = {
            id: uniqueId,
            user: newReviewData.userEmail.trim(),
            time: (() => {
              const d = new Date();
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day} ${hours}:${minutes}`;
            })(),
            content: newReviewData.content.trim(),
            product: selectedProduct.name || '상품명 없음',
            rating: newReviewData.rating,
            productId: newReviewData.productId,
            orderId: newReviewData.orderId || undefined,
            productImage: selectedProduct.image || selectedProduct.background || null
          };
          
          // 기존 리뷰 목록에 새 리뷰 추가
          const updatedReviews = [newReview, ...reviews];
          onReviewsChange(updatedReviews);
          
          console.log('새 리뷰가 목록에 추가됨:', newReview);
        }
      
      // 폼 초기화
      setNewReviewData({
        userEmail: '',
        rating: 0,
        content: '',
        productId: '',
        orderId: ''
      });
      setShowNewReviewForm(false);
      
      alert('리뷰가 성공적으로 작성되었습니다.');
    } catch (error) {
      console.error('리뷰 작성 중 오류:', error);
      alert(`리뷰 작성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
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
    setIsProductDropdownOpen(false);
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
            <div className="relative product-dropdown">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상품 선택 *
              </label>
              <div
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer bg-white hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className={newReviewData.productId ? 'text-gray-900' : 'text-gray-500'}>
                  {newReviewData.productId && availableProducts && availableProducts.length > 0
                    ? availableProducts.find(p => p && (p.id || p._id) && (p.id || p._id).toString() === newReviewData.productId)?.name || '상품을 선택하세요'
                    : '상품을 선택하세요'
                  }
                </span>
                <FontAwesomeIcon 
                  icon={isProductDropdownOpen ? faCaretUp : faCaretDown} 
                  className="text-gray-400 text-sm transition-transform duration-200"
                />
              </div>
              
              {/* 드롭다운 메뉴 */}
              {isProductDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  <div
                    onClick={() => {
                      setNewReviewData(prev => ({ ...prev, productId: '' }));
                      setIsProductDropdownOpen(false);
                    }}
                    className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                  >
                    상품을 선택하세요
                  </div>
                  {availableProducts && availableProducts.length > 0 ? (
                    availableProducts.filter(product => product && (product.id || product._id)).map((product) => {
                      const productId = product.id || product._id;
                      const isInactive = product.status === 'inactive';
                      
                      return (
                        <div
                          key={productId}
                          onClick={() => {
                            if (productId && !isInactive) {
                              // 상품의 실제 ID 사용 (_id 우선, 없으면 id 사용) - ProductDetail.tsx와 동일한 로직
                              const actualProductId = product._id || product.id || productId;
                              setNewReviewData(prev => ({ ...prev, productId: actualProductId.toString() }));
                              setIsProductDropdownOpen(false);
                            }
                          }}
                          className={`px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
                            isInactive 
                              ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                              : 'text-gray-700 hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{product.name || '상품명 없음'}</span>
                            {isInactive && (
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                준비중
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 italic">
                      로딩 중...
                    </div>
                  )}
                </div>
              )}
              

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

      {/* 일괄 삭제 및 전체 선택 기능 */}
      {currentReviews.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 mb-2 h-10">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedReviews.length === currentReviews.length && currentReviews.length > 0}
              onChange={handleSelectAllReviews}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 font-medium">
              전체 선택
            </span>
            {selectedReviews.length > 0 && (
              <span className="text-sm text-orange-600 font-medium ml-2">
                • {selectedReviews.length}개 선택됨
              </span>
            )}
          </div>
          {selectedReviews.length > 0 && (
            <button
              onClick={handleDeleteSelectedReviews}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {isDeleting ? '삭제 중...' : `삭제하기`}
            </button>
          )}
        </div>
      )}

      {/* 리뷰 목록 */}
      <div className="space-y-4">
        
        {currentReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-white p-4">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 리뷰가 없습니다.'}
          </div>
        ) : (
          currentReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              {/* 작성자 정보 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(review.id)}
                    onChange={() => handleSelectReview(review.id)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mr-2"
                  />
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
                              setReplyingTo(prev => ({ ...prev, [review.id]: true }));
                              setReplyContents(prev => ({ ...prev, [review.id]: review.reply || '' }));
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
              {(() => {
                const isFormOpen = replyingTo[review.id];
                console.log(`리뷰 ${review.id} 댓글 폼 상태:`, isFormOpen, '전체 상태:', replyingTo);
                return isFormOpen;
              })() && (
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
                        value={replyContents[review.id] || ''}
                        onChange={(e) => setReplyContents(prev => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder={review.reply ? "댓글을 수정하세요..." : "고객님의 리뷰에 답변을 남겨주세요..."}
                        className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                        rows={3}
                        maxLength={300}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {(replyContents[review.id] || '').length}/300
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              console.log('취소 버튼 클릭:', review.id);
                              setReplyingTo(prev => {
                                const newState = { ...prev, [review.id]: false };
                                console.log('취소 후 replyingTo 상태:', newState);
                                return newState;
                              });
                              setReplyContents(prev => ({ ...prev, [review.id]: '' }));
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => review.reply ? handleEditReply(review.id, replyContents[review.id] || '') : handleAddReply(review.id)}
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
              {!review.reply && !replyingTo[review.id] && (
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => {
                      console.log('댓글 작성 버튼 클릭 - review.id:', review.id);
                      console.log('review 객체 전체:', review);
                      console.log('현재 replyingTo 상태:', replyingTo);
                      setReplyingTo(prev => {
                        const newState = { ...prev, [review.id]: true };
                        console.log('새로운 replyingTo 상태:', newState);
                        return newState;
                      });
                      // 기존 댓글이 있다면 내용을 불러옴
                      if (review.reply) {
                        setReplyContents(prev => ({ ...prev, [review.id]: review.reply || '' }));
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                    title="댓글 작성"
                  >
                    <FontAwesomeIcon icon={faComment} className="text-xs" />
                    관리자 댓글 작성
                  </button>
                </div>
              )}

              {/* 구매한 상품 정보 */}
              {review.product && (
                <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-2 mt-4">
                  {(() => {
                    // 상품 이미지 찾기: 먼저 review.productImage, 없으면 availableProducts에서 찾기
                    let imageSrc = review.productImage;
                    if (!imageSrc && availableProducts.length > 0) {
                      const product = availableProducts.find(p => 
                        p.name === review.product || 
                        (p.id && p.id.toString() === review.productId?.toString()) ||
                        (p._id && p._id.toString() === review.productId?.toString())
                      );
                      if (product) {
                        imageSrc = product.image || product.background;
                      }
                    }
                    
                    return imageSrc ? (
                      <img 
                        src={imageSrc} 
                        alt={`${review.product} 이미지`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // 이미지 로드 실패 시 기본 아이콘 표시
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null;
                  })()}
                  
                  {/* 이미지가 없거나 로드 실패 시에만 기본 아이콘 표시 */}
                  {(() => {
                    // 상품 이미지 찾기: 먼저 review.productImage, 없으면 availableProducts에서 찾기
                    let imageSrc = review.productImage;
                    if (!imageSrc && availableProducts.length > 0) {
                      const product = availableProducts.find(p => 
                        p.name === review.product || 
                        (p.id && p.id.toString() === review.productId?.toString()) ||
                        (p._id && p._id.toString() === review.productId?.toString())
                      );
                      if (product) {
                        imageSrc = product.image || product.background;
                      }
                    }
                    return !imageSrc; // 이미지가 없을 때만 true 반환
                  })() && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                      <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xl" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{review.product}</div>
                    {review.orderId && (
                      <div className="text-xs text-gray-500">주문번호: {review.orderId}</div>
                    )}
                    {review.orderDate && (
                      <div className="text-xs text-gray-500">주문일: {new Date(review.orderDate).toLocaleDateString('ko-KR')}</div>
                    )}
                    {review.quantity && (
                      <div className="text-xs text-gray-500">수량: {review.quantity} 일</div>
                    )}
                  </div>
                </div>
              )}
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