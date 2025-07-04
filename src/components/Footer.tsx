import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">주식회사 루트라보</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>대표자 : 조병조</p>
              <p>경기도 용인시 기흥구 강남서로 9, 7 703호 K422호(구갈동)</p>
              <p>통신판매업신고 : 2022-서울강남-02565</p>
              <p>사업자등록번호 : 877-87-03261</p>
              <p>chojo@rootlabo.com</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white">
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-white">
                  개인정보취급방침
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">고객센터</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">070-4580-7189</p>
              <p className="text-gray-300">11:00 ~ 17:00</p>
              <p className="text-gray-300">주말, 공휴일 휴무</p>
            </div>
            <div className="mt-4 space-y-2">
              <Link to="/customer-service" className="block text-gray-300 hover:text-white text-sm">
                공지사항
              </Link>
              <Link to="/inquiry" className="block text-gray-300 hover:text-white text-sm">
                1:1 문의
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-300">
          <p>&copy; 2024 주식회사 루트라보. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 