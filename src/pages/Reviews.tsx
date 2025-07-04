import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faStar, faClock } from '@fortawesome/free-solid-svg-icons';

interface Review {
  id: number;
  user: string;
  time: string;
  content: string;
  product: string;
  rating: number;
  reply?: string;
  replyTime?: string;
}

export const mockReviews: Review[] = [
  {
    id: 1,
    user: 'Sol****',
    time: '2시간전',
    content: '진행 과정도 결과도 만족합니다. 그리고 문의에 친절하게 설명해주십니다.',
    product: '유튜브 구독자,조회수,쇼츠,시청시간,수익창출,스트리밍',
    rating: 5,
    reply: '소중한 후기를 남겨주셔서 진심으로 감사드립니다. 애드모어는 최상의 결과를 제공하기 위해 끊임없이 노력하고 있습니다.',
    replyTime: '1시간전'
  },
  {
    id: 2,
    user: '살*****',
    time: '20시간전',
    content: '친절하게 잘 설명해주시고 바로바로 피드백 주셔서 너무 좋습니다!',
    product: '애드모어',
    rating: 5,
    reply: '앞으로도 최고의 서비스를 제공하기 위해 최선을 다하겠습니다.',
    replyTime: '19시간전'
  },
  {
    id: 3,
    user: 'K31***',
    time: '하루전',
    content: '수고하셨습니다. 감사합니다.',
    product: '인스타그램 팔로워,릴스,좋아요,조회수,인기게시물 관리',
    rating: 4,
    reply: '함께해 주셔서 감사합니다.',
    replyTime: '23시간전'
  },
  {
    id: 4,
    user: '방**',
    time: '하루전',
    content: '빠른 대응과 기대이상의 결과물로 매우 만족 합니다.',
    product: '유튜브 구독자,조회수,쇼츠,시청시간,수익창출,스트리밍',
    rating: 5,
    reply: '고객님의 만족이 저희의 목표입니다.',
    replyTime: '22시간전'
  },
  {
    id: 5,
    user: '에*****',
    time: '2025-06-28',
    content: '항상 작업물의 퀄리티, 속도와 처리가 매우 만족을 줍니다. 다음에 또 구매하겠습니다.',
    product: '유튜브 구독자,조회수,쇼츠,시청시간,수익창출,스트리밍',
    rating: 5,
  },
  {
    id: 6,
    user: '민**',
    time: '3일전',
    content: '처음 이용해봤는데 정말 빠르고 친절해서 좋았어요.',
    product: '페이스북 팔로워',
    rating: 5,
    reply: '처음 이용해주셔서 감사합니다!',
    replyTime: '2일전'
  },
  {
    id: 7,
    user: '박***',
    time: '3일전',
    content: '문의에 대한 답변이 빨라서 신뢰가 갑니다.',
    product: '인스타그램 좋아요',
    rating: 4,
  },
  {
    id: 8,
    user: '김**',
    time: '4일전',
    content: '서비스가 기대 이상이었습니다.',
    product: '유튜브 조회수',
    rating: 5,
  },
  {
    id: 9,
    user: '이***',
    time: '4일전',
    content: '재구매 의사 100%입니다.',
    product: '블로그 방문자',
    rating: 5,
    reply: '재구매 감사합니다!',
    replyTime: '3일전'
  },
  {
    id: 10,
    user: '최**',
    time: '5일전',
    content: '가격도 저렴하고 효과도 좋아요.',
    product: '트위터 팔로워',
    rating: 4,
  },
  {
    id: 11,
    user: '정***',
    time: '5일전',
    content: '친구에게 추천하고 싶어요.',
    product: '텔레그램 멤버',
    rating: 5,
  },
  {
    id: 12,
    user: '윤**',
    time: '6일전',
    content: '처음엔 반신반의했는데 결과가 너무 좋아서 놀랐어요.',
    product: '페이스북 좋아요',
    rating: 5,
    reply: '믿고 이용해주셔서 감사합니다.',
    replyTime: '5일전'
  },
  {
    id: 13,
    user: '장***',
    time: '6일전',
    content: '빠른 처리 감사합니다.',
    product: '인스타그램 팔로워',
    rating: 4,
  },
  {
    id: 14,
    user: '임**',
    time: '7일전',
    content: '문의에 친절하게 답변해주셔서 좋았습니다.',
    product: '유튜브 구독자',
    rating: 5,
  },
  {
    id: 15,
    user: '한***',
    time: '7일전',
    content: '서비스가 정말 만족스러워요.',
    product: '블로그 댓글',
    rating: 5,
    reply: '만족해주셔서 감사합니다.',
    replyTime: '6일전'
  },
  {
    id: 16,
    user: '오**',
    time: '8일전',
    content: '다음에도 또 이용할게요.',
    product: '트위터 리트윗',
    rating: 4,
  },
  {
    id: 17,
    user: '서***',
    time: '8일전',
    content: '결과가 빨라서 좋았습니다.',
    product: '텔레그램 뷰',
    rating: 5,
  },
  {
    id: 18,
    user: '문**',
    time: '9일전',
    content: '처음엔 걱정했는데 결과가 너무 좋아요.',
    product: '페이스북 좋아요',
    rating: 5,
  },
  {
    id: 19,
    user: '유***',
    time: '9일전',
    content: '고객센터가 친절해서 좋았습니다.',
    product: '인스타그램 좋아요',
    rating: 5,
    reply: '고객센터를 칭찬해주셔서 감사합니다.',
    replyTime: '8일전'
  },
  {
    id: 20,
    user: '신**',
    time: '10일전',
    content: '서비스가 신속해서 만족합니다.',
    product: '유튜브 조회수',
    rating: 4,
  },
  {
    id: 21,
    user: '배***',
    time: '10일전',
    content: '효과가 바로 나타나서 신기했어요.',
    product: '블로그 방문자',
    rating: 5,
  },
  {
    id: 22,
    user: '조**',
    time: '11일전',
    content: '가격 대비 효과가 좋아요.',
    product: '트위터 팔로워',
    rating: 4,
  },
  {
    id: 23,
    user: '권***',
    time: '11일전',
    content: '다른 곳보다 훨씬 빠르고 정확합니다.',
    product: '텔레그램 멤버',
    rating: 5,
    reply: '빠르고 정확한 서비스 제공을 위해 노력하겠습니다.',
    replyTime: '10일전'
  },
  {
    id: 24,
    user: '송**',
    time: '12일전',
    content: '문의에 대한 답변이 빨라서 좋았어요.',
    product: '페이스북 팔로워',
    rating: 5,
  },
  {
    id: 25,
    user: '노***',
    time: '12일전',
    content: '서비스가 기대 이상이었습니다.',
    product: '인스타그램 좋아요',
    rating: 5,
  },
  {
    id: 26,
    user: '하**',
    time: '13일전',
    content: '재구매 의사 있습니다.',
    product: '유튜브 조회수',
    rating: 4,
  },
  {
    id: 27,
    user: '정***',
    time: '13일전',
    content: '친구에게 추천하고 싶어요.',
    product: '블로그 방문자',
    rating: 5,
    reply: '추천 감사합니다!',
    replyTime: '12일전'
  },
  {
    id: 28,
    user: '최**',
    time: '14일전',
    content: '가격도 저렴하고 효과도 좋아요.',
    product: '트위터 팔로워',
    rating: 4,
  },
  {
    id: 29,
    user: '김***',
    time: '14일전',
    content: '친구 추천으로 이용했는데 만족합니다.',
    product: '텔레그램 멤버',
    rating: 5,
  },
  {
    id: 30,
    user: '이**',
    time: '15일전',
    content: '처음엔 반신반의했는데 결과가 너무 좋아서 놀랐어요.',
    product: '페이스북 좋아요',
    rating: 5,
    reply: '믿고 이용해주셔서 감사합니다.',
    replyTime: '14일전'
  },
  {
    id: 31,
    user: '박***',
    time: '15일전',
    content: '빠른 처리 감사합니다.',
    product: '인스타그램 팔로워',
    rating: 4,
  },
  {
    id: 32,
    user: '민**',
    time: '16일전',
    content: '문의에 친절하게 답변해주셔서 좋았습니다.',
    product: '유튜브 구독자',
    rating: 5,
  },
];

const REVIEWS_PER_PAGE = 5;

const getPageNumbers = (current: number, total: number) => {
  const maxVisible = 5;
  const group = Math.floor((current - 1) / maxVisible);
  const start = group * maxVisible + 1;
  const end = Math.min(start + maxVisible - 1, total);
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
};

const sortOptions = [
  { value: 'high', label: '별점 높은 순', icon: faStar, color: 'text-yellow-400', rotate: false },
  { value: 'low', label: '별점 낮은 순', icon: faStar, color: 'text-gray-400', rotate: true },
  { value: 'latest', label: '최신순', icon: faClock, color: 'text-blue-500', rotate: false },
] as const;

type SortType = typeof sortOptions[number]['value'];

const Reviews: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortType, setSortType] = useState<'rating' | 'date'>('rating');
  const [ratingOrder, setRatingOrder] = useState<'desc' | 'asc'>('desc');
  const [dateOrder, setDateOrder] = useState<'desc' | 'asc'>('desc');

  // 새로고침: 모든 상태 초기화
  const handleRefresh = () => {
    setSearch('');
    setSortType('rating');
    setRatingOrder('desc');
    setDateOrder('desc');
    setCurrentPage(1);
  };

  // 별점 정렬 버튼 클릭
  const handleRatingSort = () => {
    setSortType('rating');
    setRatingOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    setCurrentPage(1);
  };

  // 최신순 정렬 버튼 클릭
  const handleDateSort = () => {
    setSortType('date');
    setDateOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    setCurrentPage(1);
  };

  // 검색 및 정렬 적용
  const filtered = mockReviews.filter(r =>
    r.user.includes(search) ||
    r.content.includes(search) ||
    r.product.includes(search)
  );
  let sorted = [...filtered];
  if (sortType === 'rating') {
    sorted.sort((a, b) => ratingOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating);
  }
  if (sortType === 'date') {
    sorted.sort((a, b) => dateOrder === 'desc' ? b.id - a.id : a.id - b.id);
  }

  const totalPages = Math.ceil(sorted.length / REVIEWS_PER_PAGE);
  const pagedReviews = sorted.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-gray-50 py-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header (NEW) */}
        <div className="mb-8">
          <div className="flex justify-center items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mr-2">리뷰 목록</h1>
            <span className="text-blue-500 text-xl font-bold">({sorted.length.toLocaleString()}+)</span>
          </div>
          <div className="flex justify-center items-center mb-4">
            <span className="text-gray-400 text-base font-semibold">실제로 구매하신 고객님들의 후기를 확인해보세요.</span>
            
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-6">
          <div className="flex justify-end items-center space-x-2">
            {/* 검색창 */}
            <div className="relative">
              <input
                type="text"
                placeholder="검색어를 입력해 주세요."
                className="border border-gray-300 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ width: 200 }}
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              <span className="absolute right-3 top-2 text-gray-400">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </span>
            </div>
            {/* 정렬 버튼 그룹 */}
            <div className="flex items-center space-x-2">
              {/* 별점 정렬 버튼 */}
              <button
                onClick={handleRatingSort}
                className={`w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100 ${sortType === 'rating' ? 'ring-2 ring-yellow-200' : ''}`}
                title={`별점순 (${ratingOrder === 'desc' ? '높은 순' : '낮은 순'})`}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className={`text-lg transition-transform duration-200 ${ratingOrder === 'desc' ? 'text-yellow-400' : 'text-gray-400'}`}
                  style={{ transform: ratingOrder === 'asc' ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {/* 최신순 정렬 버튼 */}
              <button
                onClick={handleDateSort}
                className={`w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100 ${sortType === 'date' ? 'ring-2 ring-blue-200' : ''}`}
                title={`최신순 (${dateOrder === 'desc' ? '최신순' : '오래된순'})`}
              >
                <FontAwesomeIcon
                  icon={faClock}
                  className={`text-lg transition-transform duration-200 ${dateOrder === 'desc' ? 'text-blue-500' : 'text-gray-400'}`}
                  style={{ transform: dateOrder === 'asc' ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {/* 새로고침 버튼 */}
              <button onClick={handleRefresh} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-100" title="새로고침">
                <FontAwesomeIcon icon={faRotateRight} className="text-gray-500 text-lg" />
              </button>
            </div>
          </div>

          {pagedReviews.map(review => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-2">
                <span className="font-semibold text-blue-600 mr-2">{review.user}</span>
                <span className="text-xs text-gray-400">{review.time}</span>
                <span className="ml-3 flex items-center">
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
                </span>
              </div>
              <div className="mb-4 text-gray-900">{review.content}</div>
              {review.reply && (
                <div className="bg-gray-50 border-l-4 border-blue-400 p-3 text-sm text-gray-700 mt-2">
                  <div className="flex items-center mb-1">
                    <span className="font-bold text-blue-600">애드모어</span>
                    <span className="text-xs text-gray-400 ml-2">{review.replyTime}</span>
                  </div>
                  <span>{review.reply}</span>
                </div>
              )}
              <div className="text-sm text-gray-600 mt-4 border border-orange-200 p-2 rounded-lg flex items-center justify-between">
                <span className="text-gray-500 font-semibold text-sm">{review.product}</span>
                <button className="text-sm font-semibold ml-2 px-2 py-1 text-orange-500 hover:text-blue-700">상담받기 →</button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-10 space-x-1">
          <button
            className="text-xs px-3 py-1 rounded bg-white border text-gray-700 disabled:opacity-50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </button>
          {pageNumbers[0] > 1 && (
            <span className="px-2 py-1 text-gray-400">...</span>
          )}
          {pageNumbers.map(page => (
            <button
              key={page}
              className={`text-xs px-3 py-1 font-semibold rounded border ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-300'
              }`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <span className="px-2 py-1 text-gray-400">...</span>
          )}
          <button
            className="text-xs px-3 py-1 rounded bg-white border text-gray-700 disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reviews; 