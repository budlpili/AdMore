export interface Category {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

const categories: Category[] = [
  {
    id: 1,
    name: '소셜미디어',
    description: '소셜미디어 마케팅 서비스',
    status: 'active'
  },
  {
    id: 2,
    name: '유튜브',
    description: '유튜브 마케팅 서비스',
    status: 'active'
  },
  {
    id: 3,
    name: '인스타그램',
    description: '인스타그램 마케팅 서비스',
    status: 'active'
  },
  {
    id: 4,
    name: '페이스북',
    description: '페이스북 마케팅 서비스',
    status: 'active'
  }
];

export default categories;
