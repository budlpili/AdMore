import React, { useState, useEffect } from 'react';
import { customerServiceAPI } from '../services/api';

const Terms: React.FC = () => {
  const [termsContent, setTermsContent] = useState('');

  useEffect(() => {
    loadTerms();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">이용약관</h1>
          <div 
            className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 font-sans"
            style={{ fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}
            dangerouslySetInnerHTML={{ __html: termsContent }}
          />
        </div>
      </div>
    </div>
  );
};

export default Terms; 