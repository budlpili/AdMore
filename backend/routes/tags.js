const express = require('express');
const router = express.Router();
const { Tag } = require('../config/database');

// 모든 태그 조회
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags || []);
  } catch (error) {
    console.error('태그 조회 오류:', error);
    res.status(500).json({ message: '태그 조회 중 오류가 발생했습니다.' });
  }
});

// 새 태그 추가
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: '태그명을 입력해주세요.' });
    }
    
    const trimmedName = name.trim();
    
    // 중복 확인
    const existing = await Tag.findOne({ name: trimmedName });
    if (existing) {
      return res.status(400).json({ message: '이미 존재하는 태그명입니다.' });
    }
    
    // 새 태그 추가
    const tag = new Tag({
      name: trimmedName
    });
    
    await tag.save();
    
    res.status(201).json({ 
      message: '태그가 성공적으로 추가되었습니다.',
      id: tag._id,
      name: trimmedName
    });
  } catch (error) {
    console.error('태그 추가 오류:', error);
    res.status(500).json({ message: '태그 추가 중 오류가 발생했습니다.' });
  }
});

// 태그 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: '태그명을 입력해주세요.' });
    }
    
    const trimmedName = name.trim();
    
    // 기존 태그 확인
    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({ message: '태그를 찾을 수 없습니다.' });
    }
    
    // 중복 확인 (자기 자신 제외)
    const existing = await Tag.findOne({ name: trimmedName, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: '이미 존재하는 태그명입니다.' });
    }
    
    // 태그 수정
    tag.name = trimmedName;
    await tag.save();
    
    res.json({ 
      message: '태그가 성공적으로 수정되었습니다.',
      id: tag._id,
      name: trimmedName
    });
  } catch (error) {
    console.error('태그 수정 오류:', error);
    res.status(500).json({ message: '태그 수정 중 오류가 발생했습니다.' });
  }
});

// 태그 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 태그 확인
    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({ message: '태그를 찾을 수 없습니다.' });
    }
    
    // 태그 삭제
    await Tag.findByIdAndDelete(id);
    
    res.json({ message: '태그가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('태그 삭제 오류:', error);
    res.status(500).json({ message: '태그 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 