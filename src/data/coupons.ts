export interface Coupon {
  id: number;
  name: string;
  expire: string;
  desc?: string;
  status: string;
  percent: number;
  type: string;
  brand: string;
}

export const DUMMY_COUPONS: Coupon[] = [
  {
    id: 1,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 07월 09일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 10,
    type: 'available',
    brand: 'WELCOME COUPON',
  },
  {
    id: 2,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 10월 09일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 15,
    type: 'available',
    brand: 'THANK YOU COUPON',
  },
  {
    id: 3,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 12월 09일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 10,
    type: 'available',
    brand: 'WELCOME COUPON',
  },
  {
    id: 4,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 07월 09일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 10,
    type: 'available',
    brand: 'WELCOME COUPON',
  },
  {
    id: 5,
    name: '가입 환영 10% 할인 쿠폰',
    expire: '2025년 07월 31일 13:49 까지',
    desc: '(최대 10,000원 할인)',
    status: '사용 가능',
    percent: 10,
    type: 'available',
    brand: 'WELCOME COUPON',
  },
]; 