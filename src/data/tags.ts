export interface Tag {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

const tags: Tag[] = [
  {
    id: 1,
    name: '마케팅',
    description: '마케팅 관련 서비스',
    status: 'active'
  },
  {
    id: 2,
    name: '소셜미디어',
    description: '소셜미디어 관련 서비스',
    status: 'active'
  },
  {
    id: 3,
    name: '팔로워',
    description: '팔로워 증가 서비스',
    status: 'active'
  },
  {
    id: 4,
    name: '좋아요',
    description: '좋아요 증가 서비스',
    status: 'active'
  },
  {
    id: 5,
    name: '관리',
    description: '계정 관리 서비스',
    status: 'active'
  },
  {
    id: 6,
    name: '활성화',
    description: '계정 활성화 서비스',
    status: 'active'
  }
];

export default tags;
