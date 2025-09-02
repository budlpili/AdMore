import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, faHeadset, faFileAlt, faShieldAlt 
} from '@fortawesome/free-solid-svg-icons';
import { Notice, InquiryForm } from '../types/index';
import { customerServiceAPI } from '../services/api';
import Pagination from '../components/Pagination';

// Add prop type for setIsChatOpen
interface CustomerServiceProps {
  setIsChatOpen?: (open: boolean) => void;
}

const CustomerService: React.FC<CustomerServiceProps> = ({ setIsChatOpen }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('notice');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    category: '',
    subject: '',
    message: ''
  });

  // URL 파라미터에서 탭 확인
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'terms' || tab === 'privacy') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 공지사항 로드
  useEffect(() => {
    loadNotices();
    loadTerms();
    loadPrivacy(); // 개인정보취급방침 로드
  }, []);

  const loadNotices = async () => {
    try {
      const response = await customerServiceAPI.getNotices();
      console.log('공지사항 데이터:', response);
      console.log('첫 번째 공지사항 상세:', response[0]);
      console.log('첫 번째 공지사항의 모든 키:', Object.keys(response[0] || {}));
      
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const transformedNotices = response.map((notice: any) => {
        console.log('개별 공지사항:', notice);
        console.log('important 값:', notice.important, '타입:', typeof notice.important);
        
        return {
          id: notice.id,
          title: notice.title,
          content: notice.content,
          important: notice.important === true || notice.important === 1 || notice.important === '1',
          createdAt: notice.createdAt,
          updatedAt: notice.updatedAt,
          author: notice.author || '관리자'
        };
      });
      
      console.log('변환된 공지사항:', transformedNotices);
      setNotices(transformedNotices);
    } catch (error) {
      console.error('Failed to load notices:', error);
      // Fallback to default notices if API fails
      const defaultNotices: Notice[] = [
        {
          id: 1,
          title: '서비스 이용약관 개정 안내',
          content: '안녕하세요. 서비스 이용약관이 개정되었습니다. 새로운 약관을 확인해주세요.',
          important: true,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          author: '관리자'
        },
        {
          id: 2,
          title: '개인정보처리방침 개정 안내',
          content: '개인정보처리방침이 개정되었습니다. 변경사항을 확인해주세요.',
          important: true,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
          author: '관리자'
        },
        {
          id: 3,
          title: '시스템 점검 안내 (1월 20일)',
          content: '1월 20일 오전 2시부터 4시까지 시스템 점검이 예정되어 있습니다.',
          important: false,
          createdAt: '2024-01-08',
          updatedAt: '2024-01-08',
          author: '관리자'
        },
        {
          id: 4,
          title: '신년 이벤트 안내',
          content: '새해를 맞이하여 다양한 이벤트를 준비했습니다. 많은 참여 부탁드립니다.',
          important: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          author: '관리자'
        },
        {
          id: 5,
          title: '결제 시스템 업데이트 완료',
          content: '결제 시스템 업데이트가 완료되었습니다. 더욱 안전하고 편리한 결제 서비스를 이용하실 수 있습니다.',
          important: false,
          createdAt: '2023-12-28',
          updatedAt: '2023-12-28',
          author: '관리자'
        }
      ];
      setNotices(defaultNotices);
    }
  };

  const loadTerms = async () => {
    try {
      const response = await customerServiceAPI.getTerms();
      setTermsContent(response.content || '');
    } catch (error) {
      console.error('Failed to load terms:', error);
      // Fallback to default terms
      setTermsContent(`제1조 (목적)
이 약관은 ADMore(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"라 함은 회사가 제공하는 모든 서비스를 의미합니다.
2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.`);
    }
  };

  const loadPrivacy = async () => {
    try {
      const response = await customerServiceAPI.getPrivacy();
      setPrivacyContent(response.content || '');
    } catch (error) {
      console.error('Failed to load privacy:', error);
      // Fallback to default privacy
      setPrivacyContent(`1. 개인정보의 수집 및 이용목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

2. 개인정보의 처리 및 보유기간
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

3. 개인정보의 제3자 제공
회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.`);
    }
  };

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setShowNoticeModal(true);
  };

  const closeNoticeModal = () => {
    setShowNoticeModal(false);
    setSelectedNotice(null);
  };

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
            <nav className="flex space-x-8 px-6 justify-center flex-wrap">
              <button
                onClick={() => handleTabClick('notice')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'notice'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faBell} className="text-sm" />
                공지사항
              </button>
              <button
                onClick={() => handleTabClick('inquiry')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'inquiry'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faHeadset} className="text-sm" />
                1:1 문의
              </button>
              <button
                onClick={() => handleTabClick('faq')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'faq'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faFileAlt} className="text-sm" />
                이용약관
              </button>
              <button
                onClick={() => handleTabClick('privacy')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === 'privacy'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faShieldAlt} className="text-sm" />
                개인정보취급방침
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[600px]">
            {activeTab === 'notice' && (
              <div>
                <div className="overflow-x-auto min-h-[500px] border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-16 sm:w-20 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          번호
                        </th>
                        <th className="min-w-[150px] sm:min-w-[200px] px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제목
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="w-16 sm:w-20 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentNotices.map((notice, index) => (
                        <tr 
                          key={notice.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleNoticeClick(notice)}
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {notices.length - (startIndex + index)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900">
                            <div className="truncate sm:whitespace-normal">
                              {notice.title}
                            </div>
                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                              {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                timeZone: 'Asia/Seoul'
                              })} 00:00
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              timeZone: 'Asia/Seoul'
                            })} 00:00
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            {(() => {
                              console.log('렌더링 - 공지사항 ID:', notice.id, 'important:', notice.important);
                              return null;
                            })()}
                            {notice.important && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                중요
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={notices.length}
                    itemsPerPage={itemsPerPage}
                    className=""
                  />
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div>
                <div className="space-y-4 min-h-[640px]">
                  <div className="p-6">
                    <div 
                    
                      className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 font-sans"
                      style={{ fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}
                      dangerouslySetInnerHTML={{ __html: termsContent }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <div className="space-y-4 min-h-[500px]">
                  <div className="p-6">
                    <div 
                      className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 font-sans"
                      style={{ fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}
                      dangerouslySetInnerHTML={{ __html: privacyContent }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 공지사항 상세 모달 */}
      {showNoticeModal && selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedNotice.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>작성자: {selectedNotice.author}</span>
                    <span>작성일: {selectedNotice.createdAt}</span>
                    {selectedNotice.important && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        중요
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeNoticeModal}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap min-h-[200px]">
                    {selectedNotice.content}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeNoticeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerService; 