const Product = require('../models/Product');

// 모든 상품 조회 (관리자용으로 변경 - 모든 상태 포함)
const getAllProducts = async (req, res) => {
  try {
    // 모든 데이터 포함하여 조회 (이미지 포함)
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('상품 조회 오류:', error);
    res.status(500).json({ message: '상품 조회에 실패했습니다.' });
  }
};

// 관리자용 모든 상품 조회 (활성/비활성 모두)
const getAllProductsForAdmin = async (req, res) => {
  try {
    // 모든 데이터 포함하여 조회 (이미지 포함)
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('관리자 상품 조회 오류:', error);
    res.status(500).json({ message: '상품 조회에 실패했습니다.' });
  }
};

// 상품 상세 조회 (이미지 포함)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    res.status(500).json({ message: '상품 조회에 실패했습니다.' });
  }
};

// 상품 이미지만 조회 (캐싱 최적화)
const getProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id, { image: 1, background: 1, _id: 1 });
    
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    
    res.json({
      _id: product._id,
      image: product.image,
      background: product.background
    });
  } catch (error) {
    console.error('상품 이미지 조회 오류:', error);
    res.status(500).json({ message: '상품 이미지 조회에 실패했습니다.' });
  }
};

// 상품 썸네일 이미지 조회 (압축된 이미지)
const getProductThumbnails = async (req, res) => {
  try {
    const products = await Product.find({}, { 
      _id: 1, 
      name: 1, 
      image: 1, 
      background: 1,
      category: 1,
      status: 1,
      price: 1,
      originalPrice: 1,
      rating: 1
    }).sort({ createdAt: -1 });
    
    // 이미지 압축 로직 (더 정교한 압축)
    const compressedProducts = products.map(product => {
      const compressedProduct = { ...product.toObject() };
      
      // 이미지 압축 (base64 데이터 크기 제한)
      if (product.image && product.image.length > 50000) {
        // 큰 이미지는 썸네일용으로 압축
        compressedProduct.image = product.image.substring(0, 30000) + '...';
        compressedProduct.hasFullImage = true; // 전체 이미지가 있음을 표시
      }
      
      if (product.background && product.background.length > 50000) {
        compressedProduct.background = product.background.substring(0, 30000) + '...';
        compressedProduct.hasFullBackground = true;
      }
      
      return compressedProduct;
    });
    
    res.json(compressedProducts);
  } catch (error) {
    console.error('상품 썸네일 조회 오류:', error);
    res.status(500).json({ message: '상품 썸네일 조회에 실패했습니다.' });
  }
};

// 상품 생성 (관리자용)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      detailedDescription,
      price,
      originalPrice,
      price1Day,
      price7Days,
      price30Days,
      discountRate,
      category,
      stock,
      status,
      tags,
      specifications,
      image,
      background,
      productNumber,
      startDate
    } = req.body;

    console.log('상품 생성 요청 데이터:', req.body);
    console.log('상품번호 확인:', productNumber);
    console.log('상품번호 타입:', typeof productNumber);

    // 가격을 숫자로 변환
    const numericPrice = typeof price === 'string' ? 
      (price ? parseFloat(price.replace(/[^\d.]/g, '')) || 0 : 0) : 
      (parseFloat(price) || 0);
    const numericOriginalPrice = typeof originalPrice === 'string' ? 
      (originalPrice ? parseFloat(originalPrice.replace(/[^\d.]/g, '')) || 0 : 0) : 
      (parseFloat(originalPrice) || 0);
    const numericPrice1Day = parseFloat(price1Day) || 0;
    const numericPrice7Days = parseFloat(price7Days) || 0;
    const numericPrice30Days = parseFloat(price30Days) || 0;
    const numericStock = parseInt(stock) || 0;
    const numericDiscountRate = parseFloat(discountRate) || 0;

    // 이미지 경로 정리
    let processedImage = image;
    if (image && image.startsWith('data:image/')) {
      // base64 이미지는 그대로 유지
      processedImage = image;
    } else if (image && !image.startsWith('/') && !image.startsWith('http')) {
      // 파일명만 있는 경우 경로 추가
      processedImage = `/uploads/${image}`;
    }

    // 태그 처리
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag && tag.trim());
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').filter(tag => tag.trim());
      }
    }

    // startDate 처리
    let parsedStartDate = undefined;
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) parsedStartDate = d;
    }

    // 상품 생성
    const product = new Product({
      name,
      description,
      detailedDescription,
      price: numericPrice,
      originalPrice: numericOriginalPrice,
      price1Day: numericPrice1Day,
      price7Days: numericPrice7Days,
      price30Days: numericPrice30Days,
      discountRate: numericDiscountRate,
      category,
      stock: numericStock,
      status: status || 'active',
      tags: processedTags,
      specifications,
      image: processedImage,
      background,
      productNumber,
      startDate: parsedStartDate
    });

    await product.save();
    
    console.log('상품 생성 성공:', product._id);
    res.status(201).json({
      message: '상품이 성공적으로 생성되었습니다.',
      product: product
    });
  } catch (error) {
    console.error('상품 생성 오류:', error);
    
    if (error.code === 11000 && error.keyPattern?.productNumber) {
      return res.status(400).json({ message: '이미 존재하는 상품번호입니다.' });
    }
    
    res.status(500).json({ message: '상품 생성에 실패했습니다.' });
  }
};

// 상품 수정 (관리자용)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, detailedDescription, price, originalPrice,
      price1Day, price7Days, price30Days, discountRate, category,
      stock, status, tags, specifications, image, background, productNumber, startDate
    } = req.body;

    console.log('상품 수정 요청:', req.body, id);
    console.log('상품번호 확인:', productNumber);
    console.log('상품번호 타입:', typeof productNumber);

    // 기존 상품 확인
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 업데이트할 데이터 준비
    const updateData = {
      name: name !== undefined ? name : existingProduct.name,
      description: description !== undefined ? description : existingProduct.description,
      detailedDescription: detailedDescription !== undefined ? detailedDescription : existingProduct.detailedDescription,
      price: price !== undefined ? parseFloat(price) || 0 : existingProduct.price,
      originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) || 0 : existingProduct.originalPrice,
      price1Day: price1Day !== undefined ? parseFloat(price1Day) || 0 : existingProduct.price1Day,
      price7Days: price7Days !== undefined ? parseFloat(price7Days) || 0 : existingProduct.price7Days,
      price30Days: price30Days !== undefined ? parseFloat(price30Days) || 0 : existingProduct.price30Days,
      discountRate: discountRate !== undefined ? parseFloat(discountRate) || 0 : existingProduct.discountRate,
      category: category !== undefined ? category : existingProduct.category,
      stock: stock !== undefined ? parseInt(stock) || 0 : existingProduct.stock,
      status: status !== undefined ? status : existingProduct.status,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : tags.split(',').filter(tag => tag.trim())) : existingProduct.tags,
      specifications: specifications !== undefined ? specifications : existingProduct.specifications,
      image: image !== undefined ? image : existingProduct.image,
      background: background !== undefined ? background : existingProduct.background,
      productNumber: productNumber !== undefined ? productNumber : existingProduct.productNumber,
      startDate: startDate !== undefined ? (isNaN(new Date(startDate).getTime()) ? existingProduct.startDate : new Date(startDate)) : existingProduct.startDate
    };

    // 이미지 경로 정리
    if (updateData.image && !updateData.image.startsWith('data:image/') && !updateData.image.startsWith('/') && !updateData.image.startsWith('http')) {
      updateData.image = `/uploads/${updateData.image}`;
    }

    if (updateData.background && !updateData.background.startsWith('data:image/') && !updateData.background.startsWith('/') && !updateData.background.startsWith('http')) {
      updateData.background = `/uploads/${updateData.background}`;
    }

    // 상품 업데이트
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: '상품 업데이트에 실패했습니다.' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('상품 수정 오류:', error);
    res.status(500).json({ message: '상품 수정에 실패했습니다.' });
  }
};

// 상품 삭제 (관리자용)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ message: '상품이 삭제되었습니다.' });
  } catch (error) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({ message: '상품 삭제에 실패했습니다.' });
  }
};

// 상품 상태 변경 (관리자용)
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: '유효하지 않은 상태입니다.' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ message: '상품 상태가 변경되었습니다.', product: updatedProduct });
  } catch (error) {
    console.error('상품 상태 변경 오류:', error);
    res.status(500).json({ message: '상품 상태 변경에 실패했습니다.' });
  }
};

// 인기 상품 조회
const getPopularProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = await Product.find({ 
      status: 'active' 
    })
    .sort({ rating: -1, reviewCount: -1 })
    .limit(parseInt(limit));
    
    res.json(products);
  } catch (error) {
    console.error('인기 상품 조회 오류:', error);
    res.status(500).json({ message: '인기 상품 조회 중 오류가 발생했습니다.' });
  }
};

// 카테고리별 상품 조회
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const products = await Product.find({ 
      category, 
      status: 'active' 
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
    
    res.json(products);
  } catch (error) {
    console.error('카테고리별 상품 조회 오류:', error);
    res.status(500).json({ message: '카테고리별 상품 조회 중 오류가 발생했습니다.' });
  }
};

// 이미지 압축 함수
const compressImage = (base64String, quality = 0.7) => {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return base64String;
  }
  
  try {
    // base64에서 이미지 데이터 추출
    const base64Data = base64String.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 간단한 압축: base64 문자열을 70%로 줄임 (실제로는 더 정교한 압축이 필요)
    const compressedData = base64Data.substring(0, Math.floor(base64Data.length * quality));
    return `data:image/jpeg;base64,${compressedData}`;
  } catch (error) {
    console.error('이미지 압축 오류:', error);
    return base64String;
  }
};

// 활성 상품만 조회 (이미지 압축 포함)
const getActiveProducts = async (req, res) => {
  try {
    // 인덱스를 활용한 최적화된 쿼리
    const products = await Product.find({ status: 'active' })
      .select('name description price originalPrice price1Day price7Days price30Days category status rating reviewCount productNumber createdAt image')
      .select('-detailedDescription -background -specifications') // detailedDescription만 제외
      .sort({ createdAt: -1 })
      .lean(); // lean()으로 성능 최적화
    
    // 이미지 압축 적용
    const compressedProducts = products.map(product => ({
      ...product,
      image: product.image ? compressImage(product.image, 0.5) : null // 50% 압축
    }));
    
    res.json(compressedProducts);
  } catch (error) {
    console.error('활성 상품 조회 오류:', error);
    res.status(500).json({ message: '상품 조회에 실패했습니다.' });
  }
};

module.exports = {
  getAllProducts,
  getAllProductsForAdmin,
  getProductById,
  getProductImages,
  getProductThumbnails,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getPopularProducts,
  getProductsByCategory,
  getActiveProducts
}; 