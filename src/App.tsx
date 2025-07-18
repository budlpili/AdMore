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

const AppRoutes: React.FC<{ isChatOpen: boolean; setIsChatOpen: (open: boolean) => void }> = ({ isChatOpen, setIsChatOpen }) => {
  const location = useLocation();
  const isOrderPage = location.pathname.startsWith('/order');
  const isProductDetailPage = location.pathname.startsWith('/products/') && location.pathname !== '/products';
  const isAdminPage = location.pathname === '/admin';
  
  return (
    <>
      {!isAdminPage && (
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
              <Route path="/review/write" element={<ReviewWritePage />} />
              <Route path="/admin" element={<Admin />} />
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
      
      {!isAdminPage && <ChatWidget isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />}
      {!isOrderPage && !isProductDetailPage && !isAdminPage && <MobileNavBar setIsChatOpen={setIsChatOpen} isChatOpen={isChatOpen} type="global" />}
      {isOrderPage && <MobileNavBar setIsChatOpen={setIsChatOpen} isChatOpen={isChatOpen} type="order" />}
    </>
  );
};

const App: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
      <AppRoutes isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
    </Router>
  );
};

export default App; 