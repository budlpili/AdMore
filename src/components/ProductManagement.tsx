import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faEye, 
  faEyeSlash, 
  faSearch, 
  faFilter,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faCog,
  faTags,
  faFolder,
  faSave,
  faUndo,
  faRedo,
  faCode,
  faGlobe,
  faHashtag,
  faCaretDown,
  faArrowLeft,
  faUpload,
  faEye as faEyeSolid,
  faEyeSlash as faEyeSlashSolid
} from '@fortawesome/free-solid-svg-icons';
import { 
  faYoutube as faYoutubeBrand,
  faFacebook as faFacebookBrand,
  faInstagram as faInstagramBrand,
  faTwitter as faTwitterBrand,
  faTiktok as faTiktokBrand,
  faLinkedin as faLinkedinBrand,
  faXTwitter as faXTwitterBrand
} from '@fortawesome/free-brands-svg-icons';
import { Product, Category, Tag } from '../types';
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
import { productAPI, categoryAPI, tagAPI } from '../services/api';
import Pagination from './Pagination';
import '../css/ProductManagement.css';

interface ProductManagementProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  onFormStateChange?: (isFormOpen: boolean, editingProduct: Product | null) => void;
}

// 카테고리별 아이콘 매핑 함수
const getCategoryIcon = (category: string) => {
  switch (category) {
    case '유튜브':
      return faYoutubeBrand;
    case '페이스북':
      return faFacebookBrand;
    case '인스타그램':
      return faInstagramBrand;
    case '트위터':
    case 'X (트위터)':
    case 'X':
      return faXTwitterBrand;
    case '틱톡':
      return faTiktokBrand;
    case '링크드인':
      return faLinkedinBrand;
    case '기타':
      return faGlobe;
    default:
      return faHashtag;
  }
};

// 카테고리별 색상 매핑 함수
const getCategoryColor = (category: string) => {
  switch (category) {
    case '유튜브':
      return 'text-red-600';
    case '페이스북':
      return 'text-blue-600';
    case '인스타그램':
      return 'text-pink-600';
    case '트위터':
    case 'X (트위터)':
    case 'X':
      return 'text-black';
    case '틱톡':
      return 'text-black';
    case '링크드인':
      return 'text-blue-700';
    case '기타':
      return 'text-gray-600';
    default:
      return 'text-gray-500';
  }
};

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
  const [backendCategories, setBackendCategories] = useState<Category[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [isCategoryManagementModalOpen, setIsCategoryManagementModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string | number; name: string } | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [newTag, setNewTag] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [backendTags, setBackendTags] = useState<Tag[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTagManagementModalOpen, setIsTagManagementModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string>('');
  const [editingTagValue, setEditingTagValue] = useState<string>('');
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [editingBackendTag, setEditingBackendTag] = useState<{ id: string | number; name: string } | null>(null);
  const [editingBackendTagValue, setEditingBackendTagValue] = useState('');
  

  // localStorage 키 상수
  const CUSTOM_TAGS_KEY = 'custom_tags';

  // 컴포넌트 초기화 시 카테고리 데이터 로드
  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  // 카테고리 데이터 로드 함수
  const loadCategories = async () => {
    try {
      // 커스텀 카테고리 로드
      const customCats = await categoryAPI.getAllCategories();
      setBackendCategories(customCats);
      setCustomCategories(customCats.map(cat => cat.name));
      
      // 상품 카테고리 로드
      const productCats = await categoryAPI.getProductCategories();
      setProductCategories(productCats.map(cat => cat.name));
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  // 태그 데이터 로드 함수
  const loadTags = async () => {
    try {
      // 백엔드 태그 로드
      const backendTags = await tagAPI.getAllTags();
      setBackendTags(backendTags);
      
      // 상품 태그 로드
      const productTags = await tagAPI.getProductTags();
      setProductTags(productTags.map(tag => tag.name));
    } catch (error) {
      console.error('태그 로드 실패:', error);
    }
  };

  // 컴포넌트 초기화 시 localStorage에서 customTags 복원
  useEffect(() => {
    try {
      const savedTags = localStorage.getItem(CUSTOM_TAGS_KEY);
      if (savedTags) {
        setCustomTags(JSON.parse(savedTags));
      }
    } catch (error) {
      console.error('커스텀 태그 복원 실패:', error);
    }
  }, []);

  // customTags가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(customTags));
    } catch (error) {
      console.error('커스텀 태그 저장 실패:', error);
    }
  }, [customTags]);

  // 컴포넌트 초기화 시 폼 데이터 자동 복원 (새로고침 대응)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draftData = JSON.parse(saved);
        // 새로고침 시에도 폼 데이터 복원
        setFormData({
          name: draftData.name || '',
          description: draftData.description || '',
          detailedDescription: draftData.detailedDescription || '',
          price1Day: draftData.price1Day || '',
          price7Days: draftData.price7Days || '',
          price30Days: draftData.price30Days || '',
          discountRate: draftData.discountRate || '',
          category: draftData.category || '',
          stock: draftData.stock || '',
          status: draftData.status || 'active',
          tags: draftData.tags || '',
          specifications: draftData.specifications || '',
          productNumber: draftData.productNumber || '',
          startDate: draftData.startDate || ''
        });
        setImagePreview(draftData.imagePreview || '');
        setBackgroundPreview(draftData.backgroundPreview || '');
        setSelectedTags(draftData.selectedTags || []);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('폼 데이터 자동 복원 실패:', error);
    }
  }, []);

  // Close dropdown when clicking outside
  /*
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown') && !target.closest('.status-dropdown')) {
        setIsCategoryDropdownOpen(false);
        setIsStatusDropdownOpen(false);
      }
    };

    // 약간의 지연을 두고 이벤트 리스너 추가
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isCategoryDropdownOpen, isStatusDropdownOpen]);
  */

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailedDescription: '',
    price1Day: '',
    price7Days: '',
    price30Days: '',
    discountRate: '',
    category: '',
    stock: '',
    status: 'active' as 'active' | 'inactive',
    tags: '',
    specifications: '',
    productNumber: '',
    startDate: ''
  });

  // Image preview states
  const [imagePreview, setImagePreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');

  // 임시 저장 관련 상태
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const STORAGE_KEY = 'product_form_draft';

  // 폼 데이터를 localStorage에 저장
  const saveFormDraft = (data: any) => {
    try {
      const draftData = {
        ...data,
        imagePreview,
        backgroundPreview,
        selectedTags,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('임시 저장 실패:', error);
    }
  };

  // localStorage에서 폼 데이터 복원
  const loadFormDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draftData = JSON.parse(saved);
        setFormData({
          name: draftData.name || '',
          description: draftData.description || '',
          detailedDescription: draftData.detailedDescription || '',
          price1Day: draftData.price1Day || '',
          price7Days: draftData.price7Days || '',
          price30Days: draftData.price30Days || '',
          discountRate: draftData.discountRate || '',
          category: draftData.category || '',
          stock: draftData.stock || '',
          status: draftData.status || 'active',
          tags: draftData.tags || '',
          specifications: draftData.specifications || '',
          productNumber: draftData.productNumber || ''
        });
        setImagePreview(draftData.imagePreview || '');
        setBackgroundPreview(draftData.backgroundPreview || '');
        setSelectedTags(draftData.selectedTags || []);
        setHasUnsavedChanges(true);
        return true;
      }
    } catch (error) {
      console.error('임시 저장 데이터 복원 실패:', error);
    }
    return false;
  };

  // 임시 저장 데이터 삭제
  const clearFormDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('임시 저장 데이터 삭제 실패:', error);
    }
  };

  // 페이지 이탈 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !editingProduct) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, editingProduct]);

  // 폼 데이터 변경 시 자동 저장
  useEffect(() => {
    if (isFormOpen && !editingProduct) {
      const timer = setTimeout(() => {
        saveFormDraft(formData);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formData, imagePreview, backgroundPreview, selectedTags, isFormOpen, editingProduct]);

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에서 중복되는 확장들 비활성화
        link: false,
        underline: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
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

  // Calculate discount rate function
  const calculateDiscountRate = (originalPrice: number, sellingPrice: number): number => {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
  };

  // 1일 가격 기준 할인율 계산 함수 추가
  const calculatePeriodDiscountRate = (basePrice: number, periodPrice: number): number => {
    if (basePrice <= 0) return 0;
    const dailyRate = periodPrice / basePrice;
    const discountRate = (1 - dailyRate) * 100;
    return Math.round(discountRate);
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
  // const productCategories = useMemo(() => 
  //   Array.from(new Set(products.map(p => p.category).filter(Boolean))), 
  //   [products]
  // );
  
  // customCategories와 productCategories를 합치되, 중복 제거
  const categories = useMemo(() => {
    const allCategories = [...customCategories, ...productCategories];
    return Array.from(new Set(allCategories));
  }, [customCategories, productCategories]);

  // Get unique tags from products and custom tags
  // const productTags = useMemo(() => 
  //   Array.from(new Set(products.flatMap(p => p.tags || []).filter(Boolean))), 
  //   [products]
  // );
  const allTags = useMemo(() => {
    const backendTagNames = backendTags.map(tag => tag.name);
    const allTagNames = [...productTags, ...backendTagNames];
    return Array.from(new Set(allTagNames)); // 중복 제거
  }, [productTags, backendTags]);

  // Calculate discount rate based on original price and selling price
  const calculatedDiscountRate = useMemo(() => {
    const originalPrice = parseFloat(formData.price1Day) || 0;
    const sellingPrice = parseFloat(formData.price1Day) || 0;
    return calculateDiscountRate(originalPrice, sellingPrice);
  }, [formData.price1Day]);

  // isCategoryDropdownOpen 상태 변경 추적
  /*
  useEffect(() => {
    // console.log('isCategoryDropdownOpen 상태 변경됨:', isCategoryDropdownOpen);
  }, [isCategoryDropdownOpen]);
  */

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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
      price1Day: '',
      price7Days: '',
      price30Days: '',
      discountRate: '',
      category: '',
      stock: '',
      status: 'active',
      tags: '',
      specifications: '',
      productNumber: '',
      startDate: ''
    });
    setImagePreview('');
    setBackgroundPreview('');
    setSelectedTags([]);
    clearFormDraft(); // 임시 저장 데이터 삭제
  };

  const openForm = (product?: Product) => {
    setShowPasswordModal(false); // 폼 열 때마다 비밀번호 모달 닫기
    if (product) {
      setEditingProduct(product);
      
      // tags 처리: 문자열이면 쉼표로 분리, 배열이면 그대로 사용
      let tagsArray: string[] = [];
      if (product.tags) {
        if (typeof product.tags === 'string') {
          tagsArray = (product.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        } else if (Array.isArray(product.tags)) {
          tagsArray = product.tags as string[];
        }
      }
      
      setFormData({
        name: product.name,
        description: product.description || '',
        detailedDescription: product.detailedDescription || '',
        price1Day: product.price1Day?.toString() || '',
        price7Days: product.price7Days?.toString() || '',
        price30Days: product.price30Days?.toString() || '',
        discountRate: product.discountRate?.toString() || '',
        category: product.category,
        stock: product.stock?.toString() || '',
        status: (product.status as 'active' | 'inactive') || 'active',
        tags: tagsArray.join(', '),
        specifications: product.specifications || '',
        productNumber: product.productNumber || '',
        startDate: product.startDate || ''
      });
      if (product.image) {
        const isDataUrl = product.image.startsWith('data:image');
        setImagePreview(isDataUrl ? product.image : `data:image/png;base64,${product.image}`);
      } else {
        setImagePreview('');
      }
      setBackgroundPreview(product.background || '');
      setSelectedTags(tagsArray);
      clearFormDraft(); // 편집 모드에서는 임시 저장 데이터 삭제
    } else {
      setEditingProduct(null);
      // 새 상품 등록 시 임시 저장 데이터 확인
      const hasDraft = loadFormDraft();
      if (!hasDraft) {
        resetForm();
      }
      setImagePreview('');
    }
    setIsFormOpen(true);
    onFormStateChange?.(true, product || null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    clearFormDraft(); // 폼 닫기 시 임시 저장 데이터 삭제
    resetForm();
    onFormStateChange?.(false, null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, type);
    }
  };

  // 이미지 파일 처리 함수
  const processImageFile = (file: File, type: 'image' | 'background') => {
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
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, type: 'image' | 'background') => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'image' | 'background') => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImageFile(files[0], type);
    }
  };

  // 파일 첨부 관련 함수들





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 가격 필수 입력값 검증
    if (!formData.price1Day || !formData.price7Days || !formData.price30Days ||
        parseFloat(formData.price1Day) <= 0 ||
        parseFloat(formData.price7Days) <= 0 ||
        parseFloat(formData.price30Days) <= 0) {
      alert('1일, 7일, 30일 가격을 모두 0보다 큰 값으로 입력해주세요.');
      return;
    }

    // price, originalPrice가 비어있으면 price1Day로 자동 세팅
    const priceValue = formData.price1Day;

    try {
      
      if (editingProduct) {
        // 상품 수정
        const updateData = {
          name: formData.name,
          description: formData.description,
          detailedDescription: formData.detailedDescription,
          price: parseFloat(priceValue) || 0,
          // 기간별 가격 추가
          price1Day: parseFloat(formData.price1Day) || 0,
          price7Days: parseFloat(formData.price7Days) || 0,
          price30Days: parseFloat(formData.price30Days) || 0,
          discountRate: calculatedDiscountRate,
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          status: formData.status,
          tags: selectedTags,
          specifications: formData.specifications,
          image: imagePreview,
          background: backgroundPreview,
          productNumber: formData.productNumber,
          startDate: formData.startDate
        };
        
        console.log('상품 수정 데이터:', updateData);
        console.log('상세 설명 확인:', updateData.detailedDescription);
        console.log('상세 설명 타입:', typeof updateData.detailedDescription);
        console.log('상세 설명 길이:', updateData.detailedDescription?.length);
        
        const updatedProduct = await productAPI.updateProduct(editingProduct._id || editingProduct.id || 0, updateData);
        
        if (updatedProduct) {
          console.log('수정된 상품:', updatedProduct);
          // 백엔드에서 최신 데이터 다시 가져오기
          const latestProducts = await productAPI.getAllProducts();
          onProductsChange(latestProducts);
          clearFormDraft(); // 임시 저장 데이터 삭제
          setCurrentPage(1); // 첫 번째 페이지로 이동
          closeForm();
        } else {
          alert('상품 수정에 실패했습니다.');
        }
      } else {
        // 상품 등록
        const newProductData = {
          name: formData.name,
          description: formData.description,
          detailedDescription: formData.detailedDescription,
          price: parseFloat(priceValue) || 0,
          // 기간별 가격 추가
          price1Day: parseFloat(formData.price1Day) || 0,
          price7Days: parseFloat(formData.price7Days) || 0,
          price30Days: parseFloat(formData.price30Days) || 0,
          discountRate: calculatedDiscountRate,
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          status: formData.status,
          tags: selectedTags,
          specifications: formData.specifications,
          image: imagePreview,
          background: backgroundPreview,
          productNumber: formData.productNumber,
          startDate: formData.startDate
        };
        
        console.log('상품 등록 데이터:', newProductData);
        console.log('상세 설명 확인:', newProductData.detailedDescription);
        console.log('상세 설명 타입:', typeof newProductData.detailedDescription);
        console.log('상세 설명 길이:', newProductData.detailedDescription?.length);
        
        const newProduct = await productAPI.createProduct(newProductData);
        
        if (newProduct) {
          console.log('생성된 상품:', newProduct);
          // 백엔드에서 최신 데이터 다시 가져오기
          const latestProducts = await productAPI.getAllProducts();
          onProductsChange(latestProducts);
          clearFormDraft(); // 임시 저장 데이터 삭제
          setCurrentPage(1); // 첫 번째 페이지로 이동
          closeForm();
        } else {
          alert('상품 등록에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('상품 저장 에러:', error);
      alert('상품 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteProduct = async (productId: string | number) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      try {
        const success = await productAPI.deleteProduct(productId);
        if (success) {
          // 백엔드에서 최신 데이터 다시 가져오기
          const latestProducts = await productAPI.getAllProducts();
          onProductsChange(latestProducts);
        } else {
          alert('상품 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('상품 삭제 에러:', error);
        alert('상품 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const toggleProductStatus = async (productId: string | number) => {
    try {
              const product = products.find(p => (p._id || p.id) === productId);
      if (!product) return;
      
      const newStatus = product.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive';
      
      // 비활성화할 때 확인 알림창 표시
      if (newStatus === 'inactive') {
        const confirmed = window.confirm(`"${product.name}" 상품을 비활성화하시겠습니까?\n\n비활성화된 상품은 Products 페이지에서 보이지 않게 됩니다.`);
        if (!confirmed) return;
      }
      
      const success = await productAPI.toggleProductStatus(productId, newStatus);
      
      if (success) {
        // 백엔드에서 최신 데이터 다시 가져오기
        const latestProducts = await productAPI.getAllProducts();
        onProductsChange(latestProducts);
        
        // 성공 메시지 표시
        if (newStatus === 'inactive') {
          alert(`"${product.name}" 상품이 비활성화되었습니다.\n\n이제 Products 페이지에서 보이지 않습니다.`);
        } else {
          alert(`"${product.name}" 상품이 활성화되었습니다.\n\n이제 Products 페이지에서 보입니다.`);
        }
      } else {
        alert('상품 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상품 상태 변경 에러:', error);
      alert('상품 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const addNewCategory = async () => {
    const trimmedCategory = newCategory.trim();
    
    if (!trimmedCategory) {
      alert('카테고리명을 입력해주세요.');
      return;
    }
    
    try {
      // 백엔드에 새 카테고리 추가
      const result = await categoryAPI.createCategory(trimmedCategory);
      
      if (result) {
        // 성공적으로 추가된 경우 카테고리 목록 새로고침
        await loadCategories();
        
        // 폼 데이터에 새 카테고리 설정
        setFormData({...formData, category: trimmedCategory});
        setNewCategory('');
        setIsAddCategoryModalOpen(false);
        
        // 드롭다운을 다시 열어서 새로 추가된 카테고리가 보이도록 함
        setTimeout(() => {
          setIsCategoryDropdownOpen(true);
        }, 100);
      }
    } catch (error: any) {
      alert(error.message || '카테고리 추가에 실패했습니다.');
    }
  };

  const addNewTag = async (tagName?: string) => {
    const tagToAdd = tagName || newTag.trim();
    
    if (!tagToAdd) {
      alert('태그명을 입력해주세요.');
      return;
    }
    
    try {
      // 백엔드에 새 태그 추가
      const result = await tagAPI.createTag({ name: tagToAdd });
      
      if (result) {
        // 성공적으로 추가된 경우 태그 목록 새로고침
        await loadTags();
        
        // 선택된 태그에도 추가
        setSelectedTags(prev => [...prev, tagToAdd]);
        if (!tagName) {
          setNewTag(''); // 입력 필드 초기화
        }
      }
    } catch (error: any) {
      alert(error.message || '태그 추가에 실패했습니다.');
    }
  };

  const removeProductTag = async (tagToRemove: string) => {
    try {
      // 상품에서 해당 태그 제거
      const updatedProducts = products.map(product => {
        if (product.tags) {
          let tagsArray: string[];
          if (typeof product.tags === 'string') {
            tagsArray = (product.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => Boolean(tag));
          } else {
            tagsArray = Array.isArray(product.tags) ? product.tags : [];
          }
          
          const filteredTags = tagsArray.filter(tag => tag !== tagToRemove);
          
          // 상품 데이터 직접 업데이트
          return {
            ...product,
            tags: filteredTags
          };
        }
        return product;
      });
      
      // 상품 목록 업데이트
      onProductsChange(updatedProducts);
      
      // 태그 목록 새로고침
      await loadTags();
      
      alert(`태그 "${tagToRemove}"가 상품에서 제거되었습니다.`);
    } catch (error) {
      console.error('태그 제거 실패:', error);
      alert('태그 제거에 실패했습니다.');
    }
  };

  const editTag = (oldTag: string, newTag: string) => {
    const trimmedNewTag = newTag.trim();
    if (trimmedNewTag && trimmedNewTag !== oldTag && !allTags.filter(tag => tag !== oldTag).includes(trimmedNewTag)) {
      setCustomTags(prev => prev.map(tag => tag === oldTag ? trimmedNewTag : tag));
      setSelectedTags(prev => prev.map(tag => tag === oldTag ? trimmedNewTag : tag));
      const updatedProducts = products.map(product => {
        if (product.tags) {
          let tagsArray: string[] = [];
          if (typeof product.tags === 'string') {
            tagsArray = (product.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
          } else if (Array.isArray(product.tags)) {
            tagsArray = product.tags as string[];
          }
          const updatedTags = tagsArray.map(tag => tag === oldTag ? trimmedNewTag : tag);
          return {
            ...product,
            tags: updatedTags
          };
        }
        return product;
      });
      onProductsChange(updatedProducts);
      setEditingTag('');
      setEditingTagValue('');
      setIsEditingTag(false);
    } else {
      if (!trimmedNewTag) {
        alert('태그명을 입력해주세요.');
      } else if (trimmedNewTag === oldTag) {
        alert('기존 태그명과 동일합니다.');
      } else {
        alert('이미 존재하는 태그명입니다.');
      }
    }
  };

  const deleteTag = (tagToDelete: string) => {
    if (window.confirm(`태그 "${tagToDelete}"를 삭제하시겠습니까?\n\n이 태그는 모든 상품에서도 제거됩니다.`)) {
      // Remove from custom tags
      setCustomTags(prev => prev.filter(tag => tag !== tagToDelete));
      // Remove from selected tags
      setSelectedTags(prev => prev.filter(tag => tag !== tagToDelete));
      
      // 모든 상품에서 해당 태그 제거
      const updatedProducts = products.map(product => {
        if (product.tags) {
          let tagsArray: string[] = [];
          if (typeof product.tags === 'string') {
            tagsArray = (product.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
          } else if (Array.isArray(product.tags)) {
            tagsArray = product.tags as string[];
          }
          
          // 해당 태그 제거
          const filteredTags = tagsArray.filter(tag => tag !== tagToDelete);
          
          return {
            ...product,
            tags: filteredTags
          };
        }
        return product;
      });
      
      // 상품 목록 업데이트
      onProductsChange(updatedProducts);
    }
  };

  const startEditTag = (tag: string) => {
    setEditingTag(tag);
    setEditingTagValue(tag);
    setIsEditingTag(true);
  };

  const cancelEditTag = () => {
    setEditingTag('');
    setEditingTagValue('');
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
    console.log('resetData called');
    setShowPasswordModal(true);
  };

  const verifyAdminPassword = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // 비밀번호가 확인되면 실제 데이터 초기화 실행
        await performDataReset();
        setShowPasswordModal(false);
        setAdminPassword('');
        setPasswordError('');
      } else {
        setPasswordError(data.message || '비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      setPasswordError('서버 오류가 발생했습니다.');
    }
  };

  const performDataReset = async () => {
    try {
      // 모든 상품 삭제
      const deletePromises = products.map(product => 
        fetch(`${process.env.REACT_APP_API_BASE_URL}/products/${product.id}`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      
      // 상품 목록 초기화
      onProductsChange([]);
      alert('모든 데이터가 초기화되었습니다.');
    } catch (error) {
      alert('데이터 초기화 중 오류가 발생했습니다.');
    }
  };

  // 카테고리 수정 시작
  const startEditCategory = (category: { id: string | number; name: string }) => {
    setEditingCategory(category);
    setEditingCategoryValue(category.name);
    setIsCategoryManagementModalOpen(true);
  };

  // 카테고리 수정 취소
  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryValue('');
    setIsCategoryManagementModalOpen(false);
  };

  // 카테고리 수정 저장
  const saveEditCategory = async () => {
    if (!editingCategory) return;
    
    const trimmedName = editingCategoryValue.trim();
    if (!trimmedName) {
      alert('카테고리명을 입력해주세요.');
      return;
    }
    
    try {
      const result = await categoryAPI.updateCategory(editingCategory.id, { name: trimmedName });
      
      if (result) {
        // 성공적으로 수정된 경우 카테고리 목록 새로고침
        await loadCategories();
        
        // 폼 데이터의 카테고리도 업데이트
        if (formData.category === editingCategory.name) {
          setFormData({...formData, category: trimmedName});
        }
        
        cancelEditCategory();
      }
    } catch (error: any) {
      alert(error.message || '카테고리 수정에 실패했습니다.');
    }
  };

  // 카테고리 삭제
  const deleteCategory = async (category: { id: string | number; name: string }) => {
    if (!window.confirm(`카테고리 "${category.name}"를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      await categoryAPI.deleteCategory(category.id);
      
      // 성공적으로 삭제된 경우 카테고리 목록 새로고침
      await loadCategories();
      
      // 폼 데이터의 카테고리도 초기화
      if (formData.category === category.name) {
        setFormData({...formData, category: ''});
      }
    } catch (error: any) {
      alert(error.message || '카테고리 삭제에 실패했습니다.');
    }
  };

  // 백엔드 태그 수정 시작
  const startEditBackendTag = (tag: { id: string | number; name: string }) => {
    setEditingBackendTag(tag);
    setEditingBackendTagValue(tag.name);
    setIsTagManagementModalOpen(true);
  };

  // 백엔드 태그 수정 취소
  const cancelEditBackendTag = () => {
    setEditingBackendTag(null);
    setEditingBackendTagValue('');
    setIsTagManagementModalOpen(false);
  };

  // 백엔드 태그 수정 저장
  const saveEditBackendTag = async () => {
    if (!editingBackendTag) return;
    
    const trimmedName = editingBackendTagValue.trim();
    if (!trimmedName) {
      alert('태그명을 입력해주세요.');
      return;
    }
    
    try {
      const result = await tagAPI.updateTag(editingBackendTag.id, { name: trimmedName });
      
      if (result) {
        // 성공적으로 수정된 경우 태그 목록 새로고침
        await loadTags();
        
        // 선택된 태그도 업데이트
        setSelectedTags(prev => prev.map(tag => tag === editingBackendTag.name ? trimmedName : tag));
        
        cancelEditBackendTag();
      }
    } catch (error: any) {
      alert(error.message || '태그 수정에 실패했습니다.');
    }
  };

  // 백엔드 태그 삭제
  const deleteBackendTag = async (tag: { id: string | number; name: string }) => {
    if (!window.confirm(`태그 "${tag.name}"를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      await tagAPI.deleteTag(tag.id);
      
      // 성공적으로 삭제된 경우 태그 목록 새로고침
      await loadTags();
      
      // 선택된 태그에서도 제거
      setSelectedTags(prev => prev.filter(t => t !== tag.name));
    } catch (error: any) {
      alert(error.message || '태그 삭제에 실패했습니다.');
    }
  };

  // 상품 목록 화면
  if (!isFormOpen) {
    return (
      <>
        <div className="space-y-6 pb-12">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
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
            <div className="bg-white p-4 rounded-lg shadow">
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
            <div className="bg-white p-4 rounded-lg shadow">
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
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FontAwesomeIcon icon={faEye} className="text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">카테고리</p>
                  <p className="text-xl font-bold">{customCategories.length}개</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col xl:flex-row gap-4">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Dropdowns */}
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  {/* Category Dropdown */}
                  <div className="relative category-dropdown w-full sm:w-auto sm:min-w-[160px]">
                    <div
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer bg-white flex items-center justify-between w-full"
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
                        {/* 전체 카테고리 옵션 */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryFilter('all');
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-600 font-medium"
                        >
                          전체 카테고리
                        </div>
                        
                        {/* customCategories만 표시 (상품등록/수정에서 사용하는 카테고리) */}
                        {customCategories.length > 0 && (
                          <>
                            <div className="border-t border-gray-200 my-1"></div>
                            {customCategories.map((category) => (
                              <div
                                key={`filter-${category}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCategoryFilter(category);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-900"
                              >
                                {category}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative status-dropdown w-full sm:w-auto sm:min-w-[120px]">
                    <div
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer bg-white flex items-center justify-between w-full"
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
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 first:rounded-t-lg"
                        >
                          전체 상태
                        </div>
                        <div
                          onClick={() => {
                            setStatusFilter('active');
                            setIsStatusDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                        >
                          활성
                        </div>
                        <div
                          onClick={() => {
                            setStatusFilter('inactive');
                            setIsStatusDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 last:rounded-b-lg"
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
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="상품명을 입력해주세요."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm
                          focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:items-center">
                <button
                  onClick={resetData}
                  className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
                  title="개발 중에만 사용 - 모든 데이터 초기화"
                >
                  데이터 초기화
                </button>
                <button
                  onClick={() => openForm()}
                  className="bg-orange-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
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
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">카테고리</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">상품</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">태그</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">기간별 가격</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">상태</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">등록일(수정일)</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProducts.map((product) => (
                    <tr key={product._id || product.id || Math.random()} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">
                        <div className="flex flex-col items-center gap-2">
                          <FontAwesomeIcon 
                            icon={getCategoryIcon(product.category)} 
                            className={`w-4 h-4 ${getCategoryColor(product.category)}`}
                          />
                          <span>{product.category}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap min-w-[300px]">
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
                            {product.productNumber && (
                              <div className="text-xs text-gray-400 mb-1">
                                상품번호: {product.productNumber}
                              </div>
                            )}
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
                          {(() => {
                            // tags 처리: 문자열이면 쉼표로 분리, 배열이면 그대로 사용, null이면 빈 배열
                            let tagsArray: string[] = [];
                            if (product.tags) {
                              if (typeof product.tags === 'string') {
                                tagsArray = (product.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
                              } else if (Array.isArray(product.tags)) {
                                tagsArray = product.tags as string[];
                              }
                            }
                            
                            return tagsArray.length > 0 ? (
                              <>
                                {tagsArray.slice(0, 3).map((tag: string, index: number) => (
                                  <span key={`${tag}-${index}-${Math.random()}`} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {tagsArray.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                    +{tagsArray.length - 3}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">태그 없음</span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <div className="space-y-1">
                          {product.price1Day && (
                            <div className="font-medium text-green-600">
                              1일: {product.price1Day.toLocaleString()}원
                            </div>
                          )}
                          {product.price7Days && product.price1Day && (
                            <div className="font-medium text-blue-600">
                              7일: {product.price7Days.toLocaleString()}원
                              {product.price1Day > 0 && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                  {calculatePeriodDiscountRate(product.price1Day * 7, product.price7Days)}% 할인
                                </span>
                              )}
                            </div>
                          )}
                          {product.price30Days && product.price1Day && (
                            <div className="font-medium text-purple-600">
                              30일: {product.price30Days.toLocaleString()}원
                              {product.price1Day > 0 && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">
                                  {calculatePeriodDiscountRate(product.price1Day * 30, product.price30Days)}% 할인
                                </span>
                              )}
                            </div>
                          )}
                          {!product.price1Day && !product.price7Days && !product.price30Days && (
                            <div className="font-medium text-green-600">
                              {Number(product.price).toLocaleString()}원
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500">
                          {product.updatedAt && product.updatedAt !== product.createdAt && product.createdAt ?
                            <div>
                              <div>
                                <span>{new Date(product.createdAt ?? '').toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.')}</span>
                                <span className="ml-2">{new Date(product.createdAt ?? '').toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                              </div>
                              <div className="text-blue-600">
                                <span>({new Date(product.updatedAt ?? '').toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.')}</span>
                                <span className="ml-2">{new Date(product.updatedAt ?? '').toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })})</span>
                              </div>
                            </div>
                            :
                            product.createdAt ?
                              <div>
                                <span>{new Date(product.createdAt ?? '').toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.')}</span>
                                <span className="ml-2">{new Date(product.createdAt ?? '').toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                              </div>
                              : '-'
                          }
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
                            onClick={() => toggleProductStatus(product._id || product.id || 0)}
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
                            onClick={() => deleteProduct(product._id || product.id || 0)}
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
          </div>
          {/* Pagination */}
          <div className="">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredProducts.length}
              itemsPerPage={productsPerPage}
              className="justify-between"
              showInfo={true}
            />
          </div>
        </div>
        {/* Admin 비밀번호 확인 모달 */}
        {showPasswordModal && (
          <div style={{position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999}}>
            <div style={{background: 'white', borderRadius: '16px', padding: '32px', width: '384px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>
              <h3 className="text-lg font-semibold mb-4">관리자 비밀번호 확인</h3>
              <p className="text-sm text-gray-600 mb-4">
                데이터 초기화를 위해 관리자 비밀번호를 입력해주세요.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && verifyAdminPassword()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="관리자 비밀번호 입력"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setAdminPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={verifyAdminPassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 상품 등록/수정 폼 화면
  return (
    <>
      <div className="space-y-6">
        {/* 임시 저장 상태 알림 */}
        {hasUnsavedChanges && !editingProduct && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  임시 저장된 데이터가 있습니다. 페이지를 새로고침하거나 브라우저를 닫아도 데이터가 보존됩니다.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={clearFormDraft}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  임시 저장 삭제
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                {editingProduct ? '수정' : '등록'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Basic Information */}
            <div className="grid lg:grid-cols-5 grid-cols-1 lg:gap-4 gap-0 space-y-4 lg:space-y-0 h-full 
                border border-gray-200 rounded-lg p-4 bg-white">
              <div className="col-span-3">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* 이미지, 상품명, 상품설명 */}
                  <div className="">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center transition-colors duration-200 image-upload-area 
                          bg-gray-50 w-full max-w-[320px] min-w-[200px] aspect-[4/3]"
                      style={{
                        width: '100%',
                        maxWidth: '600px',
                        minWidth: '280px',
                        aspectRatio: '4 / 3',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, 'image')}
                      onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'image')}
                      onDragEnter={(e: React.DragEvent<HTMLDivElement>) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-over');
                      }}
                      onDragLeave={(e: React.DragEvent<HTMLDivElement>) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-over');
                      }}
                    >
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
                            <div style={{
                              width: '100%', 
                              height: '100%', 
                              position: 'relative',
                              aspectRatio: '4 / 3'
                            }}>
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="object-cover rounded-lg"
                                style={{
                                  width: '100%', 
                                  height: '100%', 
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  alert('이미지를 불러올 수 없습니다.');
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-4 upload-icon" />
                            <p className="text-xs text-gray-600 mb-2 drag-text">상품 이미지를 선택하거나 드래그하세요</p>
                            <p className="text-xs text-gray-400">클릭하여 파일 선택</p>
                          </>
                        )}
                      </label>
                    </div>
                    
                    {/* 이미지 밖에 텍스트 표시 */}
                    {imagePreview && (
                      <div className="text-xs text-gray-500 text-center mt-2">
                        클릭하여 이미지 변경 또는 드래그하여 업로드
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 w-full">
                    {/* Product Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상품명 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="상품명을 입력하세요"
                        required
                      />
                    </div>

                    {/* Product Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상품번호
                      </label>
                      <input
                        type="text"
                        value={formData.productNumber || ''}
                        onChange={(e) => setFormData({...formData, productNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="상품번호를 입력하세요 (선택사항)"
                      />
                    </div>

                    {/* Product Description */}
                    <div className="">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        간단설명 *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="w-full h-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                        placeholder="상품에 대한 간단한 설명을 입력하세요"
                      />
                    </div>
                  </div>
                </div>
                
              </div>

              {/* Product Information */}
              <div className="col-span-2 w-full">
                
                <div className="space-y-4 w-full">
                  {/* Category and Status */}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {/* Category Dropdown */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        카테고리 *
                      </label>
                      <div
                        onClick={(e) => {
                          e.stopPropagation(); // 이벤트 버블링 방지
                          const newState = !isCategoryDropdownOpen;
                          setIsCategoryDropdownOpen(newState);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer flex items-center justify-between"
                      >
                        <span className={formData.category ? 'text-gray-900 text-sm' : 'text-gray-500 text-sm'}>
                          {formData.category || '카테고리를 선택하세요'}
                        </span>
                        <FontAwesomeIcon 
                          icon={faCaretDown} 
                          className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''} text-xs`}
                        />
                      </div>
                      
                      {isCategoryDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {/* customCategories를 항상 먼저 보여줌 */}
                          {customCategories.length > 0 && (
                            <>
                              {customCategories.map((category) => (
                                <div
                                  key={`custom-${category}`}
                                  onClick={(e) => {
                                    e.stopPropagation(); // 이벤트 버블링 방지
                                    setFormData({...formData, category});
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-600 font-medium"
                                >
                                  {category}
                                </div>
                              ))}
                              {productCategories.filter(c => !customCategories.includes(c)).length > 0 && (
                                <div className="border-t border-gray-200 my-1"></div>
                              )}
                            </>
                          )}
                          {/* productCategories는 customCategories에 없는 것만 보여줌 */}
                          {productCategories.filter(c => !customCategories.includes(c)).map((category) => (
                            <div
                              key={`product-${category}`}
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 버블링 방지
                                setFormData({...formData, category});
                                setIsCategoryDropdownOpen(false);
                              }}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-900"
                            >
                              {category}
                            </div>
                          ))}
                          
                          {/* 새 카테고리 추가 */}
                          <div className="border-t border-gray-200 my-1"></div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // 이벤트 버블링 방지
                              setIsAddCategoryModalOpen(true);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-blue-600 font-medium last:rounded-b-lg"
                          >
                            + 새 카테고리 추가
                          </div>
                          
                          {/* 카테고리 관리 */}
                          <div className="border-t border-gray-200 my-1"></div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation(); // 이벤트 버블링 방지
                              setIsCategoryManagementModalOpen(true);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-green-600 font-medium last:rounded-b-lg"
                          >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                            카테고리 관리
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative status-dropdown">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상태
                      </label>
                      <div
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer bg-white flex items-center justify-between"
                      >
                        <span className={formData.status === 'active' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
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
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-green-600"
                          >
                            활성
                          </div>
                          <div
                            onClick={() => {
                              setFormData({...formData, status: 'inactive'});
                              setIsStatusDropdownOpen(false);
                            }}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 text-red-600"
                          >
                            비활성
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      개시일 (선택)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">개시일 이전에는 상품 카드에 "준비중" 배지가 표시됩니다.</p>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      태그 *
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-2 border rounded-full text-xs transition-all duration-200 ${
                              selectedTags.includes(tag)
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md transform scale-105'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                            }`}
                            title={selectedTags.includes(tag) ? '선택 해제' : '선택'}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      {/* 태그 관리 버튼 */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          총 {allTags.length}개의 태그 중 {selectedTags.length}개 선택됨
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsTagManagementModalOpen(true)}
                          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                        </button>
                      </div>

                    </div>
                  </div>
                  
                </div>

                

                
              </div>
            </div>
            
            {/* Pricing and Details */}
            <div className="space-y-4">
              {/* Pricing */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-base font-semibold mb-4">가격 설정</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      1일 가격 *
                    </label>
                    <input
                      type="text"
                      value={formatNumber(formData.price1Day)}
                      onChange={(e) => setFormData({...formData, price1Day: parseFormattedNumber(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      7일 가격 *
                    </label>
                    <input
                      type="text"
                      value={formatNumber(formData.price7Days)}
                      onChange={(e) => setFormData({...formData, price7Days: parseFormattedNumber(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      30일 가격 *
                    </label>
                    <input
                      type="text"
                      value={formatNumber(formData.price30Days)}
                      onChange={(e) => setFormData({...formData, price30Days: parseFormattedNumber(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-base font-semibold mb-4">상세 설명</h3>
                <div className="border border-gray-300 rounded-lg">
                  {showHtmlEditor && (
                    <div className="border-b border-gray-300 p-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">HTML 편집 모드</span>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={applyHtmlCode}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            적용
                          </button>
                          <button
                            type="button"
                            onClick={cancelHtmlEdit}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {showHtmlEditor ? (
                    <textarea
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      className="w-full h-64 p-3 text-sm border-0 outline-none resize-none"
                      placeholder="HTML 코드를 입력하세요..."
                    />
                  ) : (
                    <>
                      {/* Toolbar */}
                      {editor && (
                        <div className="border-b border-gray-300 p-2 bg-gray-50 flex flex-wrap items-center gap-1">
                          {/* Text Formatting */}
                          <div className="toolbar-group">
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleBold().run()}
                              className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                              title="굵게"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleItalic().run()}
                              className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                              title="기울임"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleUnderline().run()}
                              className={`toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                              title="밑줄"
                            >
                              U
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().toggleStrike().run()}
                              className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                              title="취소선"
                            >
                              S
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
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setTextAlign('center').run()}
                              className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                              title="가운데 정렬"
                            >
                              ↔
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setTextAlign('right').run()}
                              className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                              title="오른쪽 정렬"
                            >
                              →
                            </button>
                            <button
                              type="button"
                              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                              className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}`}
                              title="양쪽 정렬"
                            >
                              ⇔
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* Admin 비밀번호 확인 모달 */}
      {showPasswordModal && (
        <div style={{position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999}}>
          <div style={{background: 'white', borderRadius: '16px', padding: '32px', width: '384px', maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>
            <h3 className="text-lg font-semibold mb-4">관리자 비밀번호 확인</h3>
            <p className="text-sm text-gray-600 mb-4">
              데이터 초기화를 위해 관리자 비밀번호를 입력해주세요.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && verifyAdminPassword()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="관리자 비밀번호 입력"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setAdminPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={verifyAdminPassword}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 추가 모달 */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-semibold mb-4">새 카테고리 추가</h3>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addNewCategory();
                }
              }}
              className="w-full border px-3 py-2 rounded mb-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder="카테고리명 입력"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setNewCategory('');
                }} 
                className="px-3 py-1 rounded border hover:bg-gray-50"
              >
                취소
              </button>
              <button 
                onClick={addNewCategory} 
                className="px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 관리 모달 */}
      {isCategoryManagementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">카테고리 관리</h3>
            
            {/* 카테고리 수정 */}
            {editingCategory && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">카테고리 수정</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingCategoryValue}
                    onChange={e => setEditingCategoryValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                    className="flex-1 border px-3 py-2 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="카테고리명 입력"
                    autoFocus
                  />
                  <button 
                    onClick={saveEditCategory} 
                    className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    저장
                  </button>
                  <button 
                    onClick={cancelEditCategory} 
                    className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 카테고리 목록 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">커스텀 카테고리 목록</h4>
              {backendCategories.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">커스텀 카테고리가 없습니다.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {backendCategories.map(category => (
                    <div key={category._id || category.id || Math.random()} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{category.name}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => startEditCategory({ id: category._id || category.id || 0, name: category.name })} 
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => deleteCategory({ id: category._id || category.id || 0, name: category.name })} 
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 닫기 버튼 */}
            <div className="flex justify-end">
              <button 
                onClick={() => setIsCategoryManagementModalOpen(false)} 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 태그 관리/수정 모달 */}
      {isTagManagementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">태그 관리</h3>
            
            {/* 백엔드 태그 수정 */}
            {editingBackendTag && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">태그 수정</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingBackendTagValue}
                    onChange={e => setEditingBackendTagValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEditBackendTag()}
                    className="flex-1 border px-3 py-2 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="태그명 입력"
                    autoFocus
                  />
                  <button 
                    onClick={saveEditBackendTag} 
                    className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    저장
                  </button>
                  <button 
                    onClick={cancelEditBackendTag} 
                    className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 새 태그 추가 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">새 태그 추가</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
                  className="flex-1 border px-3 py-2 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="태그명 입력"
                />
                <button 
                  onClick={() => addNewTag()} 
                  className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                >
                  추가
                </button>
              </div>
            </div>

            {/* 통합 태그 목록 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">태그 목록</h4>
              {backendTags.length === 0 && productTags.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">태그가 없습니다.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {/* 백엔드 태그들 */}
                  {backendTags.map(tag => (
                    <div key={`backend-${tag._id || tag.id || Math.random()}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{tag.name}</span>
                      <div className="flex gap-1">
                        <button 
                                                      onClick={() => startEditBackendTag({ id: tag._id || tag.id || 0, name: tag.name })} 
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          수정
                        </button>
                        <button 
                                                      onClick={() => deleteBackendTag({ id: tag._id || tag.id || 0, name: tag.name })} 
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* 상품 태그들 (백엔드에 저장되지 않은 태그들) */}
                  {productTags.filter(tag => !backendTags.some(backendTag => backendTag.name === tag)).map(tag => (
                    <div key={`product-${tag}-${Math.random()}`} className="flex items-center justify-between p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <span className="text-sm text-gray-900">{tag} <span className="text-xs text-yellow-600">(상품 태그)</span></span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            if (window.confirm(`태그 "${tag}"를 백엔드에 추가하시겠습니까?`)) {
                              addNewTag(tag);
                            }
                          }} 
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          백엔드에 추가
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`태그 "${tag}"를 상품에서 제거하시겠습니까?`)) {
                              removeProductTag(tag);
                            }
                          }} 
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          제거
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 닫기 버튼 */}
            <div className="flex justify-end">
              <button 
                onClick={() => setIsTagManagementModalOpen(false)} 
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      
    </>
  );
};

export default ProductManagement; 