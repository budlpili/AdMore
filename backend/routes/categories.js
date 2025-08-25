const express = require('express');
const router = express.Router();
const { Category, Product } = require('../config/database');

// 모든 카테고리 조회
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories || []);
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    res.status(500).json({ message: '카테고리 조회 중 오류가 발생했습니다.' });
  }
});

// 새 카테고리 추가
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: '카테고리명을 입력해주세요.' });
    }
    
    const trimmedName = name.trim();
    
    // 중복 확인
    const existing = await Category.findOne({ name: trimmedName });
    if (existing) {
      return res.status(400).json({ message: '이미 존재하는 카테고리명입니다.' });
    }
    
    // 새 카테고리 추가
    const category = new Category({
      name: trimmedName,
      type: 'custom'
    });
    
    await category.save();
    
    res.status(201).json({ 
      message: '카테고리가 성공적으로 추가되었습니다.',
      id: category._id,
      name: trimmedName
    });
  } catch (error) {
    console.error('카테고리 추가 오류:', error);
    res.status(500).json({ message: '카테고리 추가 중 오류가 발생했습니다.' });
  }
});

// 카테고리 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: '카테고리명을 입력해주세요.' });
    }
    
    const trimmedName = name.trim();
    
    // 기존 카테고리 확인
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    
    // 중복 확인 (자기 자신 제외)
    const existing = await Category.findOne({ name: trimmedName, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: '이미 존재하는 카테고리명입니다.' });
    }
    
    // 카테고리 수정
    category.name = trimmedName;
    await category.save();
    
    res.json({ 
      message: '카테고리가 성공적으로 수정되었습니다.',
      id: category._id,
      name: trimmedName
    });
  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    res.status(500).json({ message: '카테고리 수정 중 오류가 발생했습니다.' });
  }
});

// 카테고리 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 카테고리 사용 여부 확인
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({ message: '이 카테고리를 사용하는 상품이 있어 삭제할 수 없습니다.' });
    }
    
    // 카테고리 삭제
    await Category.findByIdAndDelete(id);
    
    res.json({ message: '카테고리가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    res.status(500).json({ message: '카테고리 삭제 중 오류가 발생했습니다.' });
  }
});

// 상품에서 사용 중인 카테고리 목록 조회
router.get('/product-categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const categoryNames = categories
      .filter(cat => cat && cat.trim() !== '')
      .sort();
    
    const categoryObjects = categoryNames.map(name => ({ name }));
    res.json(categoryObjects || []);
  } catch (error) {
    console.error('상품 카테고리 조회 오류:', error);
    res.status(500).json({ message: '상품 카테고리 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 