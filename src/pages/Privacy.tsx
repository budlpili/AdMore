import React, { useState, useEffect } from 'react';
import { customerServiceAPI } from '../services/api';

const Privacy: React.FC = () => {
  const [privacyContent, setPrivacyContent] = useState('');

  useEffect(() => {
    loadPrivacy();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">개인정보처리방침</h1>
          <div 
            className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 font-sans"
            style={{ fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}
            dangerouslySetInnerHTML={{ __html: privacyContent }}
          />
        </div>
      </div>
    </div>
  );
};

export default Privacy; 