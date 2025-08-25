const express = require('express');
const router = express.Router();
const { Notice, Privacy, Terms } = require('../config/database');

// 공지사항 목록 조회
router.get('/notices', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices || []);
  } catch (error) {
    console.error('공지사항 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 상세 조회
router.get('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    
    if (!notice) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }
    
    res.json(notice);
  } catch (error) {
    console.error('공지사항 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 생성
router.post('/notices', async (req, res) => {
  try {
    const { title, content, important, author } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    
    const notice = new Notice({
      title,
      content,
      important: important || false,
      author: author || '관리자',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedNotice = await notice.save();
    res.status(201).json(savedNotice);
  } catch (error) {
    console.error('공지사항 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 수정
router.put('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, important } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    
    const updatedNotice = await Notice.findByIdAndUpdate(
      id,
      {
        title,
        content,
        important: important || false,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedNotice) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }
    
    res.json(updatedNotice);
  } catch (error) {
    console.error('공지사항 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 삭제
router.delete('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotice = await Notice.findByIdAndDelete(id);
    
    if (!deletedNotice) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '공지사항이 삭제되었습니다.' });
  } catch (error) {
    console.error('공지사항 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 이용약관 조회
router.get('/terms', async (req, res) => {
  try {
    const terms = await Terms.findOne().sort({ createdAt: -1 });
    res.json(terms || { title: '이용약관', content: '', version: '1.0' });
  } catch (error) {
    console.error('이용약관 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 이용약관 저장/수정
router.post('/terms', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: '내용은 필수입니다.' });
    }
    
    // 기존 약관 삭제
    await Terms.deleteMany({});
    
    // 새 약관 생성
    const terms = new Terms({
      title: '이용약관',
      content,
      version: '1.0',
      effectiveDate: new Date()
    });
    
    const savedTerms = await terms.save();
    res.json(savedTerms);
  } catch (error) {
    console.error('이용약관 저장 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 이용약관 삭제
router.delete('/terms', async (req, res) => {
  try {
    await Terms.deleteMany({});
    res.json({ message: '이용약관이 삭제되었습니다.' });
  } catch (error) {
    console.error('이용약관 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 개인정보처리방침 조회
router.get('/privacy', async (req, res) => {
  try {
    const privacy = await Privacy.findOne().sort({ createdAt: -1 });
    res.json(privacy || { title: '개인정보처리방침', content: '', version: '1.0' });
  } catch (error) {
    console.error('개인정보처리방침 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 개인정보처리방침 저장/수정
router.post('/privacy', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: '내용은 필수입니다.' });
    }
    
    // 기존 개인정보처리방침 삭제
    await Privacy.deleteMany({});
    
    // 새 개인정보처리방침 생성
    const privacy = new Privacy({
      title: '개인정보처리방침',
      content,
      version: '1.0',
      effectiveDate: new Date()
    });
    
    const savedPrivacy = await privacy.save();
    res.json(savedPrivacy);
  } catch (error) {
    console.error('개인정보처리방침 저장 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 개인정보처리방침 삭제
router.delete('/privacy', async (req, res) => {
  try {
    await Privacy.deleteMany({});
    res.json({ message: '개인정보처리방침이 삭제되었습니다.' });
  } catch (error) {
    console.error('개인정보처리방침 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 