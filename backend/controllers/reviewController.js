const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// 모든 리뷰 조회
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('productId', 'name category tags image background')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('리뷰 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '리뷰 목록 조회에 실패했습니다.' });
  }
};

// 상품별 리뷰 조회
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ 
      productId, 
      status: 'approved' 
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('상품 리뷰 조회 오류:', error);
    res.status(500).json({ success: false, message: '상품 리뷰 조회에 실패했습니다.' });
  }
};

// 리뷰 생성
const createReview = async (req, res) => {
  try {
    const { userId, productId, product, content, rating, productImage, userEmail } = req.body;

    // 필수 필드 검증
    if (!userId || !productId || !product || !content || !rating || !userEmail) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    // 평점 범위 검증
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: '평점은 1-5 사이여야 합니다.' });
    }

    // 새로운 리뷰 생성
    const newReview = new Review({
      userId,
      userEmail,
      productId,
      product,
      content,
      rating,
      productImage, // 상품 이미지 추가
      status: 'approved' // 자동으로 승인 상태로 설정
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      message: '리뷰가 성공적으로 생성되었습니다.',
      review: savedReview
    });
  } catch (error) {
    console.error('리뷰 생성 오류:', error);
    res.status(500).json({ message: '리뷰 생성 중 오류가 발생했습니다.' });
  }
};

// 리뷰 수정
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();

    const review = await Review.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '리뷰가 수정되었습니다.' });
  } catch (error) {
    console.error('리뷰 수정 오류:', error);
    res.status(500).json({ success: false, message: '리뷰 수정에 실패했습니다.' });
  }
};

// 리뷰 삭제
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    res.status(500).json({ success: false, message: '리뷰 삭제에 실패했습니다.' });
  }
};

// 리뷰 상태 변경
const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '리뷰 상태가 변경되었습니다.' });
  } catch (error) {
    console.error('리뷰 상태 변경 오류:', error);
    res.status(500).json({ success: false, message: '리뷰 상태 변경에 실패했습니다.' });
  }
};

// 관리자 댓글 추가
const addAdminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, adminReply, adminEmail } = req.body;

    // content 또는 adminReply 중 하나라도 있으면 사용
    const replyContent = content || adminReply;

    if (!replyContent || !replyContent.trim()) {
      return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { 
        adminReply: replyContent.trim(),
        adminReplyTime: new Date(),
        adminEmail: adminEmail || 'admin@admore.com'
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '관리자 댓글이 추가되었습니다.', review });
  } catch (error) {
    console.error('관리자 댓글 추가 오류:', error);
    res.status(500).json({ success: false, message: '관리자 댓글 추가에 실패했습니다.' });
  }
};

// 관리자 댓글 수정
const updateAdminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, adminReply, adminEmail } = req.body;

    // content 또는 adminReply 중 하나라도 있으면 사용
    const replyContent = content || adminReply;

    if (!replyContent || !replyContent.trim()) {
      return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { 
        adminReply: replyContent.trim(),
        adminReplyTime: new Date(),
        adminEmail: adminEmail || 'admin@admore.com'
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '관리자 댓글이 수정되었습니다.', review });
  } catch (error) {
    console.error('관리자 댓글 수정 오류:', error);
    res.status(500).json({ success: false, message: '관리자 댓글 수정에 실패했습니다.' });
  }
};

// 관리자 댓글 삭제
const deleteAdminReply = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { 
        adminReply: undefined,
        adminReplyTime: undefined
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '관리자 댓글이 삭제되었습니다.', review });
  } catch (error) {
    console.error('관리자 댓글 삭제 오류:', error);
    res.status(500).json({ success: false, message: '관리자 댓글 삭제에 실패했습니다.' });
  }
};

module.exports = {
  getAllReviews,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus,
  addAdminReply,
  updateAdminReply,
  deleteAdminReply
};
