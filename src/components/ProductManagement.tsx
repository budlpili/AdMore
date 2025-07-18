import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faSearch, faUpload, faTimes, faArrowLeft, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { Product } from '../types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import '../css/ProductManagement.css';

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
  const [productsPerPage] = useState(5);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTagManagementModalOpen, setIsTagManagementModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.status-dropdown') && !target.closest('.category-dropdown')) {
        setIsStatusDropdownOpen(false);
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Underline,
      Blockquote,
      CodeBlock,
      HorizontalRule,
    ],
    content: formData.detailedDescription,
    onUpdate: ({ editor }) => {
      setFormData({...formData, detailedDescription: editor.getHTML()});
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // Update editor content when formData changes
  useEffect(() => {
    if (editor && formData.detailedDescription !== editor.getHTML()) {
      editor.commands.setContent(formData.detailedDescription);
    }
  }, [formData.detailedDescription, editor]);

  // HTML editing functions
  const openHtmlEditor = () => {
    setHtmlCode(editor?.getHTML() || '');
    setIsHtmlModalOpen(true);
  };

  const applyHtmlCode = () => {
    if (editor) {
      editor.commands.setContent(htmlCode);
      setFormData({...formData, detailedDescription: htmlCode});
    }
    setIsHtmlModalOpen(false);
  };

  const cancelHtmlEdit = () => {
    setIsHtmlModalOpen(false);
    setHtmlCode('');
  };

  const [imagePreview, setImagePreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');

  // Calculate discount rate function
  const calculateDiscountRate = (originalPrice: number, sellingPrice: number): number => {
    if (originalPrice === 0 || sellingPrice === 0) return 0;
    if (sellingPrice >= originalPrice) return 0;
    
    return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
  };

  // Format number with thousand separators
  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return num.toLocaleString('ko-KR');
  };

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // Get unique categories from products and custom categories
  const productCategories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean))), 
    [products]
  );
  const categories = useMemo(() => 
    [...productCategories, ...customCategories], 
    [productCategories, customCategories]
  );

  // Get unique tags from products and custom tags
  const productTags = useMemo(() => 
    Array.from(new Set(products.flatMap(p => p.tags || []).filter(Boolean))), 
    [products]
  );
  const allTags = useMemo(() => 
    [...productTags, ...customTags], 
    [productTags, customTags]
  );

  // Calculate discount rate based on original price and selling price
  const calculatedDiscountRate = useMemo(() => {
    const originalPrice = parseFloat(formData.originalPrice) || 0;
    const sellingPrice = parseFloat(formData.price) || 0;
    return calculateDiscountRate(originalPrice, sellingPrice);
  }, [formData.originalPrice, formData.price]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isCategoryDropdownOpen && !target.closest('.category-dropdown')) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

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
    setImagePreview('');
    setBackgroundPreview('');
    setSelectedTags([]);
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
      setSelectedTags(product.tags || []);
    } else {
      setEditingProduct(null);
      resetForm();
    }
    setIsFormOpen(true);
    onFormStateChange?.(true, product || null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    resetForm();
    onFormStateChange?.(false, null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'image') {
          setImagePreview(result);
        } else {
          setBackgroundPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      const updatedProducts = products.map(p => 
        p.id === editingProduct.id ? { 
          ...p, 
          name: formData.name,
          description: formData.description,
          detailedDescription: formData.detailedDescription,
          price: parseFloat(formData.price),
          originalPrice: parseFloat(formData.originalPrice),
          discountRate: calculatedDiscountRate,
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          status: formData.status,
          tags: selectedTags,
          specifications: formData.specifications,
          image: imagePreview,
          background: backgroundPreview
        } : p
      );
      onProductsChange(updatedProducts);
    } else {
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        name: formData.name,
        description: formData.description,
        detailedDescription: formData.detailedDescription,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice),
        discountRate: calculatedDiscountRate,
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        status: formData.status,
        tags: selectedTags,
        specifications: formData.specifications,
        image: imagePreview,
        background: backgroundPreview,
        createdAt: new Date().toISOString()
      };
      onProductsChange([...products, newProduct]);
    }
    
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
      p.id === productId ? { ...p, status: (p.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' } : p
    );
    onProductsChange(updatedProducts);
  };

  const addNewCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      setCustomCategories(prev => [...prev, trimmedCategory]);
      setFormData({...formData, category: trimmedCategory});
      setNewCategory('');
      setIsAddCategoryModalOpen(false);
    }
  };

  const addNewTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !allTags.includes(trimmedTag)) {
      setCustomTags(prev => [...prev, trimmedTag]);
      setSelectedTags(prev => [...prev, trimmedTag]);
      setNewTag('');
      setIsAddTagModalOpen(false);
    }
  };

  const editTag = (oldTag: string, newTag: string) => {
    const trimmedNewTag = newTag.trim();
    if (trimmedNewTag && trimmedNewTag !== oldTag && !allTags.includes(trimmedNewTag)) {
      // Update custom tags
      setCustomTags(prev => prev.map(tag => tag === oldTag ? trimmedNewTag : tag));
      // Update selected tags
      setSelectedTags(prev => prev.map(tag => tag === oldTag ? trimmedNewTag : tag));
      setEditingTag('');
      setIsEditingTag(false);
    }
  };

  const deleteTag = (tagToDelete: string) => {
    if (window.confirm(`태그 "${tagToDelete}"를 삭제하시겠습니까?`)) {
      // Remove from custom tags
      setCustomTags(prev => prev.filter(tag => tag !== tagToDelete));
      // Remove from selected tags
      setSelectedTags(prev => prev.filter(tag => tag !== tagToDelete));
    }
  };

  const startEditTag = (tag: string) => {
    setEditingTag(tag);
    setIsEditingTag(true);
  };

  const cancelEditTag = () => {
    setEditingTag('');
    setIsEditingTag(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const resetData = () => {
    if (window.confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('products');
      localStorage.removeItem('customCategories');
      localStorage.removeItem('customTags');
      window.location.reload();
    }
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
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                {/* Category Dropdown */}
                <div className="relative category-dropdown w-full sm:w-auto sm:min-w-[160px]">
                  <div
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer bg-white flex items-center justify-between w-full"
                  >
                    <span className={`truncate ${categoryFilter === 'all' ? 'text-gray-500' : 'text-gray-900'}`}>
                      {categoryFilter === 'all' ? '전체 카테고리' : categoryFilter}
                    </span>
                    <FontAwesomeIcon 
                      icon={faCaretDown} 
                      className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''} text-xs ml-2 flex-shrink-0`}
                    />
                  </div>
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      <div
                        onClick={() => {
                          setCategoryFilter('all');
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 first:rounded-t-lg"
                      >
                        전체 카테고리
                      </div>
                      {categories.map((category) => (
                        <div
                          key={category}
                          onClick={() => {
                            setCategoryFilter(category);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 truncate"
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="relative status-dropdown w-full sm:w-auto sm:min-w-[120px]">
                  <div
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer bg-white flex items-center justify-between w-full"
                  >
                    <span className={`truncate ${statusFilter === 'all' ? 'text-gray-500' : 'text-gray-900'}`}>
                      {statusFilter === 'all' ? '전체 상태' : (statusFilter === 'active' ? '활성' : '비활성')}
                    </span>
                    <FontAwesomeIcon 
                      icon={faCaretDown} 
                      className={`text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''} text-xs ml-2 flex-shrink-0`}
                    />
                  </div>
                  
                  {isStatusDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div
                        onClick={() => {
                          setStatusFilter('all');
                          setIsStatusDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 first:rounded-t-lg"
                      >
                        전체 상태
                      </div>
                      <div
                        onClick={() => {
                          setStatusFilter('active');
                          setIsStatusDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100"
                      >
                        활성
                      </div>
                      <div
                        onClick={() => {
                          setStatusFilter('inactive');
                          setIsStatusDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 last:rounded-b-lg"
                      >
                        비활성
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Input */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="상품명을 입력해주세요."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs
                        focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:items-center">
              <button
                onClick={resetData}
                className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
                title="개발 중에만 사용 - 모든 데이터 초기화"
              >
                데이터 초기화
              </button>
              <button
                onClick={() => openForm()}
                className="bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="hidden sm:inline">상품 등록하기</span>
                <span className="sm:hidden">등록</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">카테고리</th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">상품</th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">태그</th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">가격</th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">할인율</th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">상태</th>
                  <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">
                      {product.category}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-[100px] h-[100px] sm:w-[120px] sm:h-[100px] rounded-lg object-cover mr-2 sm:mr-3"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEM0Q3RDAiLz4KPHN2ZyB4PSIzNSIgeT0iMzUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTkgM0g1QzMuOSAzIDMgMy45IDMgNVYxOUMzIDIwLjEgMy45IDIxIDUgMjFIMTlDMjAuMSAyMSAyMSAyMC4xIDIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzWk0xOSAxOUg1VjVIMTlWMTlaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNCAxNEgxMFYxMEgxNFYxNFpNMTQgMThIMFYxN0gxNFYxOFoiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</div>
                          <div 
                            className="text-xs text-gray-500 min-w-[160px] max-w-[280px] pr-2 product-description"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: '1.4',
                              wordBreak: 'break-word',
                              maxHeight: '4.2em',
                              whiteSpace: 'normal'
                            }}
                          >
                            {product.description || '설명이 없습니다.'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">태그 없음</span>
                        )}
                        {product.tags && product.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            +{product.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-green-600">{Number(product.price).toLocaleString()}원</div>
                        {product.originalPrice && product.originalPrice > Number(product.price) && (
                          <div className="text-xs text-gray-400 line-through">
                            {product.originalPrice.toLocaleString()}원
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      {product.discountRate && product.discountRate > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {product.discountRate}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => openForm(product)}
                          className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                          title="수정"
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
                          title={product.status === 'active' ? '비활성화' : '활성화'}
                        >
                          {product.status === 'active' ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                          title="삭제"
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
          <div className="bg-white px-3 sm:px-6 py-6 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between w-full gap-2">
              <div className="text-xs text-gray-500 order-2 sm:order-1">
                총 {filteredProducts.length}개 중 {filteredProducts.length === 0 ? 0 : indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)}개 표시
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  이전
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 sm:px-3 py-1 rounded border text-xs font-medium transition-colors ${
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
      
      {/* Product Form */}
      <div className="bg-white rounded-lg border p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-row gap-4 justify-between items-center mb-6 border-b border-gray-300 pb-6">
            {/* 뒤로가기 */}
            <div className="flex items-center justify-between gap-4 w-full">
              <button
                type="button"
                onClick={closeForm}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 bg-white shadow hover:bg-gray-50
                    transition-colors text-sm border rounded-full w-10 h-10"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>
            {/* Form Buttons */}
            <div className="flex justify-end space-x-3 w-full">
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700"
              >
                {editingProduct ? '수정' : '등록'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4 h-full">
              <div className="flex flex-row gap-4">
                {/* Image Upload */}
                <div className="w-full h-full max-w-[240px] min-w-[160px] flex flex-col">
                  <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center 
                      flex flex-col justify-center items-center min-h-[200px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'image')}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer w-full h-full flex flex-col justify-center items-center">
                      {imagePreview ? (
                        <div className="w-full h-full flex flex-col justify-center items-center">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover rounded-lg max-h-[280px]"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              alert('이미지를 불러올 수 없습니다.');
                            }}
                          />
                          <div className="mt-2 text-xs text-gray-500">
                            클릭하여 이미지 변경
                          </div>
                        </div>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-4" />
                          <p className="text-xs text-gray-600">이미지를 선택하거나 드래그하세요</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full h-full min-h-[200px]">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      {/* 상품명 <span className="text-red-500">*</span> */}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="상품명을 입력해주세요 (필수)"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-semibold text-gray-700">
                      {/* 간단 설명 */}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      placeholder="간단 설명을 입력해주세요 (필수)"
                      className="flex-1 resize-none w-full px-3 py-3 border border-gray-300 rounded-lg text-xs 
                      focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing and Status */}
            <div className="space-y-2 h-full">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    {/* 카테고리 <span className="text-red-500">*</span> */}
                  </label>
                  <div className="relative category-dropdown">
                    <div
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer bg-white flex items-center justify-between"
                    >
                      <span className={formData.category ? 'text-gray-900 text-xs' : 'text-gray-500 text-xs'}>
                        {formData.category || '카테고리를 선택하세요'}
                      </span>
                      <FontAwesomeIcon 
                        icon={faCaretDown} 
                        className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''} text-xs`}
                      />
                    </div>
                    
                    {isCategoryDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {productCategories.length > 0 && (
                          <>
                            {productCategories.map((category) => (
                              <div
                                key={category}
                                onClick={() => {
                                  setFormData({...formData, category});
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 first:rounded-t-lg"
                              >
                                {category}
                              </div>
                            ))}
                            {customCategories.length > 0 && (
                              <div className=""></div>
                            )}
                          </>
                        )}
                        
                        {customCategories.map((category) => (
                          <div
                            key={category}
                            onClick={() => {
                              setFormData({...formData, category});
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 text-blue-600"
                          >
                            {category}
                          </div>
                        ))}
                        
                        <div className="border-t border-gray-200">
                          <div
                            onClick={() => {
                              setIsAddCategoryModalOpen(true);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="px-3 py-3 text-xs cursor-pointer hover:bg-gray-100 text-orange-600 font-bold last:rounded-b-lg"
                          >
                            + 새 카테고리 추가
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    {/* 상태 */}
                  </label>
                  <div className="relative status-dropdown">
                    <div
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer bg-white flex justify-between items-center"
                    >
                      <span className={formData.status === 'active' ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
                        {formData.status === 'active' ? '활성' : '비활성'}
                      </span>
                      <FontAwesomeIcon 
                        icon={faCaretDown} 
                        className={`text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''} text-xs`}
                      />
                    </div>
                    {isStatusDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        <div
                          onClick={() => {
                            setFormData({...formData, status: 'active'});
                            setIsStatusDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 text-green-600"
                        >
                          활성
                        </div>
                        <div
                          onClick={() => {
                            setFormData({...formData, status: 'inactive'});
                            setIsStatusDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 text-red-600"
                        >
                          비활성
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                {/* <label className="block text-xs font-semibold text-gray-700 mb-2">태그 선택</label> */}
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="space-y-2 relative min-h-[72px]">
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <label
                          key={tag}
                          className={`inline-flex items-center text-xs gap-2 px-3 py-2 border rounded-full cursor-pointer transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-orange-100 border-orange-300 text-orange-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => toggleTag(tag)}
                            className="sr-only"
                          />
                          <span className="text-xs">{tag}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTagManagementModalOpen(true)}
                      className="absolute right-0 bottom-0 inline-flex items-center gap-2 transition-colors text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={faEdit} className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    {/* 원가 <span className="text-red-500">*</span> */}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.originalPrice ? formatNumber(formData.originalPrice) : ''}
                    onChange={(e) => {
                      const rawValue = parseFormattedNumber(e.target.value);
                      if (rawValue === '' || /^\d*$/.test(rawValue)) {
                        setFormData({...formData, originalPrice: rawValue});
                      }
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="원가를 입력하세요"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    {/* 판매가 <span className="text-red-500">*</span> */}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price ? formatNumber(formData.price) : ''}
                    onChange={(e) => {
                      const rawValue = parseFormattedNumber(e.target.value);
                      if (rawValue === '' || /^\d*$/.test(rawValue)) {
                        setFormData({...formData, price: rawValue});
                      }
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="판매가를 입력하세요"
                  />
                </div>
                <div className="">
                  <label className="block text-xs font-semibold text-gray-700">
                    {/* 할인율 (%) */}
                    </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={calculatedDiscountRate}
                      readOnly
                      className="w-full px-3 py-3 text-right pr-3 border border-gray-300 rounded-lg text-xs bg-gray-50 text-gray-700 cursor-not-allowed"
                      placeholder="자동 계산"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">상세 설명</label>
            <div className="quill-container">
              {/* Simple Toolbar */}
              {editor && (
                <div className="editor-toolbar">
                  {/* Text Formatting */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                      title="굵게"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                      title="기울임"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                      title="밑줄"
                    >
                      <u>U</u>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                      title="취소선"
                    >
                      <s>S</s>
                    </button>
                  </div>

                  <div className="toolbar-divider"></div>

                  {/* Headings */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                      title="제목 1"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                      title="제목 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                      title="제목 3"
                    >
                      H3
                    </button>
                  </div>

                  <div className="toolbar-divider"></div>

                  {/* Lists */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                      title="글머리 기호 목록"
                    >
                      •
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                      title="번호 매기기 목록"
                    >
                      1.
                    </button>
                  </div>

                  <div className="toolbar-divider"></div>

                  {/* Alignment */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign('left').run()}
                      className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                      title="왼쪽 정렬"
                    >
                      ⬅️
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign('center').run()}
                      className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                      title="가운데 정렬"
                    >
                      ↔️
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign('right').run()}
                      className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                      title="오른쪽 정렬"
                    >
                      ➡️
                    </button>
                  </div>

                  <div className="toolbar-divider"></div>

                  {/* Block Elements */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                      title="인용구"
                    >
                      "
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setHorizontalRule().run()}
                      className="toolbar-btn"
                      title="구분선"
                    >
                      —
                    </button>
                  </div>

                  <div className="toolbar-divider"></div>

                  {/* Links and Media */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt('URL을 입력하세요:');
                        if (url) {
                          editor.chain().focus().setLink({ href: url }).run();
                        }
                      }}
                      className={`toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
                      title="링크"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt('이미지 URL을 입력하세요:');
                        if (url) {
                          editor.chain().focus().setImage({ src: url }).run();
                        }
                      }}
                      className="toolbar-btn"
                      title="이미지"
                    >
                      🖼️
                    </button>
                  </div>

                  <div className="toolbar-divider"></div>

                  {/* Advanced Features */}
                  <div className="toolbar-group">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="toolbar-btn"
                      title="실행 취소"
                    >
                      ↩️
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="toolbar-btn"
                      title="다시 실행"
                    >
                      ↪️
                    </button>
                    <button
                      type="button"
                      onClick={openHtmlEditor}
                      className="toolbar-btn"
                      title="HTML 편집"
                    >
                      &lt;/&gt;
                    </button>
                  </div>
                </div>
              )}
              <EditorContent 
                editor={editor}
                className="tiptap-editor"
              />
            </div>
          </div>

          
        </form>
      </div>

      {/* 새 카테고리 추가 모달 */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">새 카테고리 추가</h3>
              <button
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setNewCategory('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  카테고리명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="새 카테고리명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addNewCategory();
                    }
                  }}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsAddCategoryModalOpen(false);
                    setNewCategory('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={addNewCategory}
                  disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새 태그 추가 모달 */}
      {isAddTagModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">새 태그 추가</h3>
              <button
                onClick={() => {
                  setIsAddTagModalOpen(false);
                  setNewTag('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  태그명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="새 태그명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addNewTag();
                    }
                  }}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsAddTagModalOpen(false);
                    setNewTag('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={addNewTag}
                  disabled={!newTag.trim() || allTags.includes(newTag.trim())}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 태그 관리 모달 */}
      {isTagManagementModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">태그 관리</h3>
              <button
                onClick={() => {
                  setIsTagManagementModalOpen(false);
                  setNewTag('');
                  setEditingTag('');
                  setIsEditingTag(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 새 태그 추가 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  새 태그 추가
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="새 태그명을 입력하세요"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNewTag();
                      }
                    }}
                  />
                  <button
                    onClick={addNewTag}
                    disabled={!newTag.trim() || allTags.includes(newTag.trim())}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* 기존 태그 목록 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  등록된 태그 ({allTags.length}개)
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                  {allTags.length > 0 ? (
                    <div className="space-y-2">
                      {allTags.map((tag) => (
                        <div key={tag} className="flex items-center justify-between p-2 bg-white rounded border">
                          {isEditingTag && editingTag === tag ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingTag}
                                onChange={(e) => setEditingTag(e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    editTag(tag, editingTag);
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => editTag(tag, editingTag)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelEditTag}
                                className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm text-gray-700">{tag}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEditTag(tag)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => deleteTag(tag)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                >
                                  삭제
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-4">
                      등록된 태그가 없습니다
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsTagManagementModalOpen(false);
                    setNewTag('');
                    setEditingTag('');
                    setIsEditingTag(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HTML 편집 모달 */}
      {isHtmlModalOpen && (
        <div className="html-editor-modal">
          <div className="html-editor-content">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">HTML 편집</h3>
              <button
                onClick={cancelHtmlEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML 코드를 직접 편집하세요
                </label>
                <textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="html-editor-textarea w-full"
                  placeholder="HTML 코드를 입력하세요..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelHtmlEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={applyHtmlCode}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 