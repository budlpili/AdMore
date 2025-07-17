export interface Review {
  id: number;
  user: string;
  time: string;
  content: string;
  product: string;
  rating: number;
  reply?: string;
  replyTime?: string;
  productId?: number; // 상품 ID 추가
}

export const mockReviews: Review[] = [
  {
    id: 1,
    user: 'Sol****',
    time: '24-01-15 14:30',
    content: '진행 과정도 결과도 만족합니다. 그리고 문의에 친절하게 설명해주십니다.',
    product: '유튜브 구독자,조회수,쇼츠,시청시간,수익창출,스트리밍',
    rating: 5,
    reply: '소중한 후기를 남겨주셔서 진심으로 감사드립니다. 애드모어는 최상의 결과를 제공하기 위해 끊임없이 노력하고 있습니다.',
    replyTime: '24-01-15 15:30',
    productId: 1
  },
  {
    id: 2,
    user: '살*****',
    time: '24-01-14 18:45',
    content: '친절하게 잘 설명해주시고 바로바로 피드백 주셔서 너무 좋습니다!',
    product: '애드모어',
    rating: 5,
    reply: '앞으로도 최고의 서비스를 제공하기 위해 최선을 다하겠습니다.',
    replyTime: '24-01-14 19:45',
    productId: 2
  },
  {
    id: 3,
    user: 'K31***',
    time: '24-01-14 10:20',
    content: '수고하셨습니다. 감사합니다.',
    product: '인스타그램 팔로워,릴스,좋아요,조회수,인기게시물 관리',
    rating: 4,
    reply: '함께해 주셔서 감사합니다.',
    replyTime: '24-01-14 11:20',
    productId: 3
  },
  {
    id: 4,
    user: '방**',
    time: '24-01-14 09:15',
    content: '빠른 대응과 기대이상의 결과물로 매우 만족 합니다.',
    product: '유튜브 구독자,조회수,쇼츠,시청시간,수익창출,스트리밍',
    rating: 5,
    reply: '고객님의 만족이 저희의 목표입니다.',
    replyTime: '24-01-14 10:15',
    productId: 4
  },
  {
    id: 5,
    user: '에*****',
    time: '24-01-13 16:30',
    content: '항상 작업물의 퀄리티, 속도와 처리가 매우 만족을 줍니다. 다음에 또 구매하겠습니다.',
    product: '유튜브 구독자,조회수,쇼츠,시청시간,수익창출,스트리밍',
    rating: 5,
    productId: 5
  },
  {
    id: 6,
    user: '민**',
    time: '24-01-12 14:20',
    content: '처음 이용해봤는데 정말 빠르고 친절해서 좋았어요.',
    product: '페이스북 팔로워',
    rating: 5,
    reply: '처음 이용해주셔서 감사합니다!',
    replyTime: '24-01-12 15:20',
    productId: 6
  },
  {
    id: 7,
    user: '박***',
    time: '24-01-12 11:45',
    content: '문의에 대한 답변이 빨라서 신뢰가 갑니다.',
    product: '인스타그램 좋아요',
    rating: 4,
    productId: 7
  },
  {
    id: 8,
    user: '김**',
    time: '24-01-11 13:10',
    content: '서비스가 기대 이상이었습니다.',
    product: '유튜브 조회수',
    rating: 5,
    productId: 8
  },
  {
    id: 9,
    user: '이***',
    time: '24-01-11 10:30',
    content: '재구매 의사 100%입니다.',
    product: '블로그 방문자',
    rating: 5,
    reply: '재구매 감사합니다!',
    replyTime: '24-01-11 11:30',
    productId: 9
  },
  {
    id: 10,
    user: '최**',
    time: '24-01-10 15:45',
    content: '가격도 저렴하고 효과도 좋아요.',
    product: '트위터 팔로워',
    rating: 4,
    productId: 10
  },
  {
    id: 11,
    user: '정***',
    time: '24-01-10 12:20',
    content: '친구에게 추천하고 싶어요.',
    product: '텔레그램 멤버',
    rating: 5,
    productId: 11
  },
  {
    id: 12,
    user: '윤**',
    time: '24-01-09 16:15',
    content: '처음엔 반신반의했는데 결과가 너무 좋아서 놀랐어요.',
    product: '페이스북 좋아요',
    rating: 5,
    reply: '믿고 이용해주셔서 감사합니다.',
    replyTime: '24-01-09 17:15',
    productId: 12
  },
  {
    id: 13,
    user: '장***',
    time: '24-01-09 14:30',
    content: '빠른 처리 감사합니다.',
    product: '인스타그램 팔로워',
    rating: 4,
    productId: 13
  },
  {
    id: 14,
    user: '임**',
    time: '24-01-08 11:45',
    content: '문의에 친절하게 답변해주셔서 좋았습니다.',
    product: '유튜브 구독자',
    rating: 5,
    productId: 14
  },
  {
    id: 15,
    user: '한***',
    time: '24-01-08 09:20',
    content: '서비스가 정말 만족스러워요.',
    product: '페이스북 팔로워',
    rating: 5,
    productId: 15
  }
]; 