import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Notice, InquiryForm } from '../types/index';

const CustomerService: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('notice');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">고객센터</h1>
          <p className="text-gray-600">궁금한 점이 있으시면 언제든 문의해주세요</p>
        </div>

        {/* Contact Info */}
        <div className="bg-blue-600 text-white rounded-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">고객센터 070-4580-7189</h2>
            <p className="text-blue-100">11:00 ~ 17:00</p>
            <p className="text-blue-100">주말, 공휴일 휴무</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('notice')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'notice'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                공지사항
              </button>
              <button
                onClick={() => setActiveTab('inquiry')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'inquiry'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                1:1 문의
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'notice' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">공지사항</h3>
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div key={notice.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {notice.important && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                              중요
                            </span>
                          )}
                          <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                            {notice.title}
                          </h4>
                        </div>
                        <span className="text-sm text-gray-500">{notice.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'inquiry' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">1:1 문의</h3>
                <form onSubmit={handleInquirySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        이름 *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={inquiryForm.name}
                        onChange={handleInquiryChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이름을 입력해주세요"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={inquiryForm.email}
                        onChange={handleInquiryChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="example@email.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        전화번호
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={inquiryForm.phone}
                        onChange={handleInquiryChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="010-1234-5678"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        문의 유형 *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={inquiryForm.category}
                        onChange={handleInquiryChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">문의 유형을 선택해주세요</option>
                        {inquiryCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      제목 *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={inquiryForm.subject}
                      onChange={handleInquiryChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="문의 제목을 입력해주세요"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      문의 내용 *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={inquiryForm.message}
                      onChange={handleInquiryChange}
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="문의 내용을 자세히 입력해주세요"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300"
                    >
                      문의하기
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">자주 묻는 질문</h3>
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Q: 서비스 이용 방법은 어떻게 되나요?</h4>
              <p className="text-gray-600">회원가입 후 원하는 서비스를 선택하여 결제하시면 됩니다. 결제 완료 후 24시간 내에 서비스가 시작됩니다.</p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Q: 환불 정책은 어떻게 되나요?</h4>
              <p className="text-gray-600">서비스 시작 전까지는 100% 환불이 가능합니다. 서비스 시작 후에는 부분 환불이 불가능합니다.</p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Q: 결제 방법은 어떤 것들이 있나요?</h4>
              <p className="text-gray-600">신용카드, 계좌이체, 휴대폰 결제 등 다양한 결제 방법을 지원합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerService; 