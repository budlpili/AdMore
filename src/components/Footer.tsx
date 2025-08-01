import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone, 
  faClock, 
  faCalendarTimes,
  faBullhorn,
  faComments
} from '@fortawesome/free-solid-svg-icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">주식회사 일마레</h3>
            <div className="space-y-0 text-xs text-gray-300">
              <p>대표자 : 전민수</p>
              <p>전북특별자치도 군산시 나운동 805 1번지 동아26센터빌딩</p>
              <p>통신판매업신고 : 2025-전북군산-00000</p>
              <p>사업자등록번호 : 681-88-02902</p>
              <a href="mailto:info@ilmare.com" className="text-gray-300 hover:text-white transition-colors duration-200">
                info@ilmare.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-xs">
              {/* <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  회사 소개
                </Link>
              </li> */}
              <li>
                <button 
                  onClick={() => window.open('/terms', '_blank')}
                  className="text-gray-300 hover:text-white cursor-pointer"
                >
                  이용약관
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.open('/privacy', '_blank')}
                  className="text-gray-300 hover:text-white cursor-pointer"
                >
                  개인정보취급방침
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold mb-4">고객센터</h3>
            <div className="space-y-2 text-xs bg-gray-700 rounded-md p-4 flex flex-col border border-gray-600 shadow-inner">
              <p className="text-gray-300 flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="w-3 h-3 text-gray-400" />
                070-4580-7189
              </p>
              <p className="text-gray-300 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-gray-400" />
                10:00 ~ 17:00 <span className="text-[10px]">(주말, 공휴일 휴무)</span>
              </p>
            </div>
            <div className="flex flex-row justify-start items-center gap-2 mt-2">
              <Link to="/customer-service" className="block text-gray-300 hover:text-white text-sm flex items-center gap-1">
                {/* <FontAwesomeIcon icon={faBullhorn} className="w-3 h-3" /> */}
                공지사항
              </Link>
              <div className="w-px h-2 bg-gray-500 mx-2"></div>
              <Link to="/inquiry" className="block text-gray-300 hover:text-white text-sm flex items-center gap-1">
                {/* <FontAwesomeIcon icon={faComments} className="w-3 h-3" /> */}
                1:1 문의
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-300">
          <p>&copy; 2025 주식회사 일마레. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 