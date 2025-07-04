import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import SignUp from './pages/SignUp';
import CustomerService from './pages/CustomerService';
import Reviews from './pages/Reviews';
import About from './pages/About';
import Favorits from './pages/Favorits';
import ProductDetail from './pages/ProductDetail';
import ChatWidget from './components/ChatWidget';
import Order from './pages/Order';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/order" element={<Order />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/customer-service" element={<CustomerService />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/favorits" element={<Favorits />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ChatWidget />
    </Router>
  );
};

export default App; 