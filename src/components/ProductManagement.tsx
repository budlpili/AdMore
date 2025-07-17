import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faSearch, faFilter, faUpload, faTimes, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Product } from '../types';

interface ProductManagementProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  onFormStateChange?: (isFormOpen: boolean, editingProduct: Product | null) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ products, onProductsChange, onFormStateChange }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailedDescription: '',
    originalPrice: '',
    price: '',
    discountRate: '',
    category: '',
    stock: '',
    status: 'active' as 'active' | 'inactive',
    tags: '',
    specifications: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    // 최신 상품을 맨 앞에 정렬 (createdAt 기준)
    const dateA = new Date(a.createdAt || '2024-01-01').getTime();
    const dateB = new Date(b.createdAt || '2024-01-01').getTime();
    return dateB - dateA; // 내림차순 정렬 (최신순)
  });

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      detailedDescription: '',
      originalPrice: '',
      price: '',
      discountRate: '',
      category: '',
      stock: '',
      status: 'active',
      tags: '',
      specifications: ''
    });
    setImageFile(null);
    setImagePreview('');
    setBackgroundFile(null);
    setBackgroundPreview('');
  };

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        detailedDescription: product.detailedDescription || '',
        originalPrice: product.originalPrice?.toString() || '',
        price: product.price.toString(),
        discountRate: product.discountRate?.toString() || '',
        category: product.category,
        stock: product.stock?.toString() || '',
        status: product.status || 'active',
        tags: product.tags?.join(', ') || '',
        specifications: product.specifications || ''
      });
      setImagePreview(product.image);
      setBackgroundPreview(product.background || '');
    } else {
      setEditingProduct(null);
      resetForm();
    }
    setIsFormOpen(true);
    // 부모 컴포넌트에 상태 변경 알림
    onFormStateChange?.(true, product || null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    resetForm();
    // 부모 컴포넌트에 상태 변경 알림
    onFormStateChange?.(false, null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'image') {
          setImageFile(file);
          setImagePreview(result);
        } else {
          setBackgroundFile(file);
          setBackgroundPreview(result);
        }
      };
      reader.onerror = () => {
        alert('이미지 파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      id: editingProduct?.id || Date.now(),
      name: formData.name,
      description: formData.description,
      detailedDescription: formData.detailedDescription,
      originalPrice: parseInt(formData.originalPrice) || 0,
      price: parseInt(formData.price) || 0,
      discountRate: parseInt(formData.discountRate) || 0,
      category: formData.category,
      image: imagePreview,
      background: backgroundPreview,
      stock: parseInt(formData.stock) || 0,
      status: formData.status,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      specifications: formData.specifications,
      clickCount: editingProduct?.clickCount || 0,
      rating: editingProduct?.rating || 0,
      reviewCount: editingProduct?.reviewCount || 0,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedProducts: Product[];
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? newProduct : p);
    } else {
      updatedProducts = [...products, newProduct];
    }

    onProductsChange(updatedProducts);
    closeForm();
  };

  const deleteProduct = (productId: number) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      onProductsChange(updatedProducts);
    }
  };

  const toggleProductStatus = (productId: number) => {
    const updatedProducts = products.map(p => 
      p.id === productId 
        ? { ...p, status: (p.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        : p
    );
    onProductsChange(updatedProducts);
  };

  // 상품 목록 화면
  if (!isFormOpen) {
    return (
      <div className="space-y-6">
        

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FontAwesomeIcon icon={faEye} className="text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">전체 상품</p>
                <p className="text-xl font-bold">{products.length}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FontAwesomeIcon icon={faEye} className="text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">활성 상품</p>
                <p className="text-xl font-bold">{products.filter(p => p.status === 'active').length}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FontAwesomeIcon icon={faEye} className="text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">비활성 상품</p>
                <p className="text-xl font-bold">{products.filter(p => p.status === 'inactive').length}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FontAwesomeIcon icon={faEye} className="text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">카테고리</p>
                <p className="text-xl font-bold">{categories.length}개</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="all">전체 카테고리</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="all">전체 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="상품명을 입력해주세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
          </div>

          <div className="flex justify-end items-center">
          <button
            onClick={() => openForm()}
            className="bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            상품 등록하기
          </button>
        </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">상품</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">가격</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">재고</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-12 h-12 rounded-lg object-cover mr-3"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEM0Q3RDAiLz4KPHN2ZyB4PSIzNSIgeT0iMzUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxN0gxNFYxOFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cjwvc3ZnPgo='; // 기본 이미지로 대체
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{product.price.toLocaleString()}원</div>
                        {product.originalPrice && typeof product.price === 'number' && product.originalPrice > product.price && (
                          <div className="text-xs text-gray-400 line-through">
                            {product.originalPrice.toLocaleString()}원
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock || 0}개</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => openForm(product)}
                          className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            product.status === 'active' 
                              ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50' 
                              : 'text-green-600 border-green-300 hover:bg-green-50'
                          }`}
                        >
                          {product.status === 'active' ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex items-center justify-between w-full">
              <div className="text-xs text-gray-500">
                총 {filteredProducts.length}개 중 {filteredProducts.length === 0 ? 0 : indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)}개 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  이전
                </button>
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-orange-500 text-white border-orange-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${(currentPage === totalPages || totalPages === 0) ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 상품 등록/수정 폼 화면
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center justify-between gap-4 w-full">
          <button
            onClick={closeForm}
            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 bg-white shadow hover:bg-gray-50
                transition-colors text-sm border rounded-full w-10 h-10"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700"
            >
              {editingProduct ? '수정' : '등록'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">상품명 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">간단 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                  className="resize-none w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">상세 설명</label>
                <textarea
                  value={formData.detailedDescription}
                  onChange={(e) => setFormData({...formData, detailedDescription: e.target.value})}
                  rows={6}
                  className="resize-none w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="상품의 상세한 설명을 입력하세요..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">카테고리 *</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">태그</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="쉼표로 구분하여 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              
            </div>
            
            {/* Pricing and Status */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">원가</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">판매가 *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">할인율 (%)</label>
                  <input
                    type="number"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({...formData, discountRate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
                
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Image Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">상품 이미지</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'image')}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-2" />
                  <p className="text-sm text-gray-600">이미지를 선택하거나 드래그하세요</p>
                </label>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      alert('이미지를 불러올 수 없습니다.');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          
        </form>
      </div>
    </div>
  );
};

export default ProductManagement; 