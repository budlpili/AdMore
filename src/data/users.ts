export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'admin' | 'user';
  lastLogin: string;
  orderCount: number;
  totalSpent: number;
  emailVerified?: number; // 이메일 인증 완료 여부 (0: 미인증, 1: 인증완료)
}

export const defaultUsers: User[] = [
  {
    id: '1',
    name: '김관리자',
    email: 'admin@admore.com',
    phone: '010-1234-5678',
    joinDate: '2024-01-15',
    status: 'active',
    role: 'admin',
    lastLogin: '2024-06-01 14:30',
    orderCount: 5,
    totalSpent: 150000,
    emailVerified: 1
  },
  {
    id: '2',
    name: '이영희',
    email: 'lee@example.com',
    phone: '010-2345-6789',
    joinDate: '2024-02-20',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 09:15',
    orderCount: 3,
    totalSpent: 89000,
    emailVerified: 1
  },
  {
    id: '3',
    name: '박철수',
    email: 'park@example.com',
    phone: '010-3456-7890',
    joinDate: '2024-03-10',
    status: 'inactive',
    role: 'user',
    lastLogin: '2024-05-20 16:45',
    orderCount: 1,
    totalSpent: 45000,
    emailVerified: 0
  },
  {
    id: '4',
    name: '최민수',
    email: 'choi@example.com',
    phone: '010-4567-8901',
    joinDate: '2024-03-25',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 11:20',
    orderCount: 7,
    totalSpent: 210000,
    emailVerified: 1
  },
  {
    id: '5',
    name: '정수진',
    email: 'jung@example.com',
    phone: '010-5678-9012',
    joinDate: '2024-04-05',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 13:45',
    orderCount: 2,
    totalSpent: 67000,
    emailVerified: 0
  },
  {
    id: '6',
    name: '강동원',
    email: 'kang@example.com',
    phone: '010-6789-0123',
    joinDate: '2024-04-18',
    status: 'suspended',
    role: 'user',
    lastLogin: '2024-05-15 10:30',
    orderCount: 0,
    totalSpent: 0,
    emailVerified: 1
  },
  {
    id: '7',
    name: '윤서연',
    email: 'yoon@example.com',
    phone: '010-7890-1234',
    joinDate: '2024-05-02',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 08:15',
    orderCount: 4,
    totalSpent: 120000,
    emailVerified: 1
  },
  {
    id: '8',
    name: '임태호',
    email: 'lim@example.com',
    phone: '010-8901-2345',
    joinDate: '2024-05-12',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 15:20',
    orderCount: 6,
    totalSpent: 180000
  },
  {
    id: '9',
    name: '한미영',
    email: 'han@example.com',
    phone: '010-9012-3456',
    joinDate: '2024-05-25',
    status: 'inactive',
    role: 'user',
    lastLogin: '2024-05-28 14:10',
    orderCount: 1,
    totalSpent: 35000
  },
  {
    id: '10',
    name: '송준호',
    email: 'song@example.com',
    phone: '010-0123-4567',
    joinDate: '2024-06-01',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 16:30',
    orderCount: 2,
    totalSpent: 75000
  },
  {
    id: '11',
    name: '김지영',
    email: 'kimji@example.com',
    phone: '010-1111-2222',
    joinDate: '2024-06-05',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 17:45',
    orderCount: 8,
    totalSpent: 250000
  },
  {
    id: '12',
    name: '박현우',
    email: 'parkhw@example.com',
    phone: '010-2222-3333',
    joinDate: '2024-06-08',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 18:20',
    orderCount: 3,
    totalSpent: 95000
  },
  {
    id: '13',
    name: '이수진',
    email: 'leesj@example.com',
    phone: '010-3333-4444',
    joinDate: '2024-06-10',
    status: 'inactive',
    role: 'user',
    lastLogin: '2024-05-30 12:15',
    orderCount: 1,
    totalSpent: 28000
  },
  {
    id: '14',
    name: '최동현',
    email: 'choidh@example.com',
    phone: '010-4444-5555',
    joinDate: '2024-06-12',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 19:30',
    orderCount: 5,
    totalSpent: 160000
  },
  {
    id: '15',
    name: '정미라',
    email: 'jungmr@example.com',
    phone: '010-5555-6666',
    joinDate: '2024-06-15',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 20:10',
    orderCount: 4,
    totalSpent: 110000
  },
  {
    id: '16',
    name: '강준서',
    email: 'kangjs@example.com',
    phone: '010-6666-7777',
    joinDate: '2024-06-18',
    status: 'suspended',
    role: 'user',
    lastLogin: '2024-05-25 09:45',
    orderCount: 0,
    totalSpent: 0
  },
  {
    id: '17',
    name: '윤민지',
    email: 'yoonmj@example.com',
    phone: '010-7777-8888',
    joinDate: '2024-06-20',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 21:15',
    orderCount: 6,
    totalSpent: 190000
  },
  {
    id: '18',
    name: '임성호',
    email: 'limsh@example.com',
    phone: '010-8888-9999',
    joinDate: '2024-06-22',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 22:00',
    orderCount: 2,
    totalSpent: 65000
  },
  {
    id: '19',
    name: '한소영',
    email: 'hansy@example.com',
    phone: '010-9999-0000',
    joinDate: '2024-06-25',
    status: 'inactive',
    role: 'user',
    lastLogin: '2024-05-28 16:30',
    orderCount: 1,
    totalSpent: 42000
  },
  {
    id: '20',
    name: '송태현',
    email: 'songth@example.com',
    phone: '010-0000-1111',
    joinDate: '2024-06-28',
    status: 'active',
    role: 'user',
    lastLogin: '2024-06-01 23:45',
    orderCount: 3,
    totalSpent: 88000
  }
]; 