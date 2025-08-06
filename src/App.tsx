import './css/index.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import SignUp from './pages/SignUp';
import CustomerService from './pages/CustomerService';
import Reviews from './pages/Reviews';
import About from './pages/About';
import ProductDetail from './pages/ProductDetail';
import ChatWidget from './components/ChatWidget';
import Order from './pages/Order';
import Login from './pages/Login';
import UserPage from './pages/UserPage';
import MobileNavBar from './components/MobileNavBar';
import ReviewWritePage from './pages/ReviewWritePage';
import Admin from './pages/Admin';
import ApiTest from './components/ApiTest';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

const AppRoutes: React.FC<{ isChatOpen: boolean; setIsChatOpen: (open: boolean) => void; userEmail: string }> = ({ isChatOpen, setIsChatOpen, userEmail }) => {
  const location = useLocation();
  const isOrderPage = location.pathname.startsWith('/order');
  const isProductDetailPage = location.pathname.startsWith('/products/') && location.pathname !== '/products';
  const isAdminPage = location.pathname === '/admin';
  const isApiTestPage = location.pathname === '/api-test';
  
  return (
    <>
      {!isAdminPage && !isApiTestPage && (
        <div className="min-h-screen flex flex-col">
          <Header setIsChatOpen={setIsChatOpen} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail setIsChatOpen={setIsChatOpen} />} />
              <Route path="/order" element={<Order />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/customer-service" element={<CustomerService setIsChatOpen={setIsChatOpen} />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/about" element={<About />} />
              <Route path="/mypage" element={<UserPage setIsChatOpen={setIsChatOpen} />} />
              <Route path="/user" element={<UserPage setIsChatOpen={setIsChatOpen} />} />
              <Route path="/review/write" element={<ReviewWritePage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/api-test" element={<ApiTest />} />
            </Routes>
          </main>
          <Footer />
        </div>
      )}
      
      {isAdminPage && (
        <Routes>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      )}

      {isApiTestPage && (
        <Routes>
          <Route path="/api-test" element={<ApiTest />} />
        </Routes>
      )}
      
      {!isAdminPage && !isApiTestPage && <ChatWidget isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} userEmail={userEmail} inquiryType="product" hideFloatingButton={isProductDetailPage} />}
      {!isOrderPage && !isProductDetailPage && !isAdminPage && !isApiTestPage && <MobileNavBar setIsChatOpen={setIsChatOpen} isChatOpen={isChatOpen} type="global" />}
      {isOrderPage && <MobileNavBar setIsChatOpen={setIsChatOpen} isChatOpen={isChatOpen} type="order" />}
    </>
  );
};

const App: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('guest@example.com');
  
  // 사용자 이메일 정보 로드
  React.useEffect(() => {
    const savedUserEmail = localStorage.getItem('userEmail');
    if (savedUserEmail) {
      setUserEmail(savedUserEmail);
    }
  }, []);
  
  // 상담창 열기 이벤트 처리
  React.useEffect(() => {
    const handleOpenChat = () => {
      setIsChatOpen(true);
    };
    
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);
  
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppRoutes isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} userEmail={userEmail} />
    </Router>
  );
};

export default App; 