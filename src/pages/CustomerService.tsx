import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Notice, InquiryForm } from '../types/index';

// Add prop type for setIsChatOpen
interface CustomerServiceProps {
  setIsChatOpen?: (open: boolean) => void;
}

const CustomerService: React.FC<CustomerServiceProps> = ({ setIsChatOpen }) => {
  const [activeTab, setActiveTab] = useState<string>('notice');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    category: '',
    subject: '',
    message: ''
  });

  // Mock data for notices
  const notices: Notice[] = [
    {
      id: 1,
      title: '서비스 이용약관 개정 안내',
      date: '2024-01-15',
      important: true
    },
    {
      id: 2,
      title: '개인정보처리방침 개정 안내',
      date: '2024-01-10',
      important: true
    },
    {
      id: 3,
      title: '시스템 점검 안내 (1월 20일)',
      date: '2024-01-08',
      important: false
    },
    {
      id: 4,
      title: '신년 이벤트 안내',
      date: '2024-01-01',
      important: false
    },
    {
      id: 5,
      title: '결제 시스템 업데이트 완료',
      date: '2023-12-28',
      important: false
    }
  ];

  const inquiryCategories: string[] = [
    '서비스 이용 문의',
    '결제 문의',
    '기술 지원',
    '환불 문의',
    '기타'
  ];

  // 페이지네이션 계산
  const totalPages = Math.ceil(notices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotices = notices.slice(startIndex, endIndex);

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleInquirySubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Here you would typically send the inquiry to your backend
    console.log('Inquiry submitted:', inquiryForm);
    alert('문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      category: '',
      subject: '',
      message: ''
    });
  };

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setInquiryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // When tab changes to 'inquiry', open chat if setIsChatOpen is provided
  const handleTabClick = (tab: string) => {
    if (tab === 'inquiry' && setIsChatOpen) {
      // Open chat widget on all screen sizes
      setIsChatOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className=" bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => handleTabClick('notice')}
                className={`px-6 py-4 text-base font-medium ${
                  activeTab === 'notice'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                공지사항
              </button>
              <button
                onClick={() => handleTabClick('faq')}
                className={`px-6 py-4 text-base font-medium ${
                  activeTab === 'faq'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                자주 묻는 질문
              </button>
              <button
                onClick={() => handleTabClick('inquiry')}
                className="px-6 py-4 text-base font-medium text-gray-500 hover:text-gray-700"
              >
                1:1 문의
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[600px]">
            {activeTab === 'notice' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          번호
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제목
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentNotices.map((notice) => (
                        <tr key={notice.id} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {notice.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {notice.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {notice.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {notice.important && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                중요
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    총 {notices.length}개 중 {startIndex + 1}-{Math.min(endIndex, notices.length)}개 표시
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* 이전 버튼 */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    
                    {/* 페이지 번호들 */}
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        disabled={page === '...'}
                        className={`px-2 py-1 font-medium border rounded-md text-xs ${
                          currentPage === page
                            ? 'bg-orange-600 text-white border-orange-600'
                            : page === '...'
                            ? 'text-gray-400 border-gray-300 cursor-default'
                            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    {/* 다음 버튼 */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div>
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Q: 서비스 이용 방법은 어떻게 되나요?</h4>
                    <p className="text-gray-600 px-6 text-sm">회원가입 후 원하는 서비스를 선택하여 결제하시면 됩니다. 결제 완료 후 24시간 내에 서비스가 시작됩니다.</p>
                  </div>
                  <div className="border-b border-gray-100 pb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Q: 환불 정책은 어떻게 되나요?</h4>
                    <p className="text-gray-600 px-6 text-sm">서비스 시작 전까지는 100% 환불이 가능합니다. 서비스 시작 후에는 부분 환불이 불가능합니다.</p>
                  </div>
                  <div className="border-b border-gray-100 pb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Q: 결제 방법은 어떤 것들이 있나요?</h4>
                    <p className="text-gray-600 px-6 text-sm">신용카드, 계좌이체, 휴대폰 결제 등 다양한 결제 방법을 지원합니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerService; 