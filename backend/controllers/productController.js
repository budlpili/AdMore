const Product = require('../models/Product');

// 모든 상품 조회
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findActive();
    
    // 태그는 이미 배열 형태로 저장됨
    res.json(products);
  } catch (error) {
    console.error('상품 조회 오류:', error);
    res.status(500).json({ message: '상품 조회에 실패했습니다.' });
  }
};

// 상품 상세 조회
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
      productNumber
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
      productNumber
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
const updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name, description, detailedDescription, price, originalPrice,
    price1Day, price7Days, price30Days, discountRate, category,
    stock, status, tags, specifications, image, background, productNumber
  } = req.body;

  console.log('상품 수정 요청:', req.body, id);
  console.log('상품번호 확인:', productNumber);
  console.log('상품번호 타입:', typeof productNumber);

  // 먼저 기존 상품 데이터를 조회
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, existingProduct) => {
    if (err) {
      console.error('기존 상품 조회 에러:', err);
      return res.status(500).json({ message: '기존 상품 조회에 실패했습니다.' });
    }

    if (!existingProduct) {
      console.error('상품 수정: 해당 id의 상품이 없습니다.', id);
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 기존 데이터와 새 데이터를 병합
    const updatedData = {
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
      tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : existingProduct.tags,
      specifications: specifications !== undefined ? specifications : existingProduct.specifications,
      image: image !== undefined ? image : existingProduct.image,
      background: background !== undefined ? background : existingProduct.background,
      productNumber: productNumber !== undefined ? (productNumber || '') : existingProduct.productNumber
    };

    // 이미지 경로 정리
    let processedImage = updatedData.image;
    if (updatedData.image && updatedData.image.startsWith('data:image/')) {
      processedImage = updatedData.image;
    } else if (updatedData.image && !updatedData.image.startsWith('/') && !updatedData.image.startsWith('http')) {
      processedImage = `/images/${updatedData.image}`;
    }

    let processedBackground = updatedData.background;
    if (updatedData.background && updatedData.background.startsWith('data:image/')) {
      processedBackground = updatedData.background;
    } else if (updatedData.background && !updatedData.background.startsWith('/') && !updatedData.background.startsWith('http')) {
      processedBackground = `/images/${updatedData.background}`;
    }

    const sql = `
      UPDATE products SET 
        name = ?, description = ?, detailedDescription = ?, price = ?, originalPrice = ?, price1Day = ?, price7Days = ?, price30Days = ?,
        discountRate = ?, category = ?, stock = ?, status = ?, tags = ?, specifications = ?,
        image = ?, background = ?, productNumber = ?, updatedAt = datetime('now', '+9 hours')
      WHERE id = ?
    `;

    const params = [
      updatedData.name,
      updatedData.description,
      updatedData.detailedDescription,
      updatedData.price,
      updatedData.originalPrice,
      updatedData.price1Day,
      updatedData.price7Days,
      updatedData.price30Days,
      updatedData.discountRate,
      updatedData.category,
      updatedData.stock,
      updatedData.status,
      updatedData.tags,
      updatedData.specifications,
      processedImage,
      processedBackground,
      updatedData.productNumber || '',
      id
    ];

    console.log('상품 수정 파라미터:', params);
    console.log('productNumber 파라미터 위치:', params.length - 2); // productNumber는 17번째 파라미터

    db.run(sql, params, function(err) {
      if (err) {
        console.error('상품 수정 에러:', err);
        return res.status(500).json({ message: '상품 수정에 실패했습니다.' });
      }

      if (this.changes === 0) {
        console.error('상품 수정: 해당 id의 상품이 없습니다.', id);
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
      }

      // 수정된 상품의 전체 데이터를 조회하여 반환
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err) {
          console.error('수정된 상품 조회 에러:', err);
          return res.status(500).json({ message: '수정된 상품 조회에 실패했습니다.' });
        }
        if (!product) {
          console.error('수정된 상품 조회: 상품이 없습니다.', id);
          return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
        }
        // 태그를 배열로 변환
        const processedProduct = {
          ...product,
          tags: product.tags ? product.tags.split(',').filter(tag => tag.trim()) : []
        };
        res.json(processedProduct);
      });
    });
  });
};

// 상품 삭제 (관리자용)
const deleteProduct = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '상품 삭제에 실패했습니다.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ message: '상품이 삭제되었습니다.' });
  });
};

// 상품 상태 변경 (관리자용)
const updateProductStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: '유효하지 않은 상태입니다.' });
  }

  db.run('UPDATE products SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ message: '상품 상태 변경에 실패했습니다.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ message: '상품 상태가 변경되었습니다.' });
  });
};

// 인기 상품 조회
const getPopularProducts = (req, res) => {
  const { limit = 10 } = req.query;

  const sql = 'SELECT * FROM products WHERE popular = 1 ORDER BY clickCount DESC LIMIT ?';
  
  db.all(sql, [limit], (err, products) => {
    if (err) {
      return res.status(500).json({ message: '인기 상품 조회 중 오류가 발생했습니다.' });
    }

    res.json(products);
  });
};

// 카테고리별 상품 조회
const getProductsByCategory = (req, res) => {
  const { category } = req.params;
  const { limit = 20 } = req.query;

  const sql = 'SELECT * FROM products WHERE category = ? AND status = "active" ORDER BY createdAt DESC LIMIT ?';
  
  db.all(sql, [category, limit], (err, products) => {
    if (err) {
      return res.status(500).json({ message: '카테고리별 상품 조회 중 오류가 발생했습니다.' });
    }

    res.json(products);
  });
};

// 활성 상품만 조회
const getActiveProducts = (req, res) => {
  const sql = 'SELECT * FROM products WHERE status = "active" ORDER BY createdAt DESC';
  
  db.all(sql, [], (err, products) => {
    if (err) {
      return res.status(500).json({ message: '상품 조회에 실패했습니다.' });
    }
    
    // 태그를 배열로 변환
    const processedProducts = products.map(product => ({
      ...product,
      tags: product.tags ? product.tags.split(',').filter(tag => tag.trim()) : []
    }));
    
    res.json(processedProducts);
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getPopularProducts,
  getProductsByCategory,
  getActiveProducts
}; 