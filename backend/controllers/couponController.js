const Coupon = require('../models/Coupon');
const CouponSend = require('../models/CouponSend');
const User = require('../models/User');

// 쿠폰 목록 조회
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('쿠폰 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '쿠폰 목록 조회에 실패했습니다.' });
  }
};

// 쿠폰 생성
const createCoupon = async (req, res) => {
  try {
    const {
      code, name, description, discountType, discountValue, minAmount, maxDiscount,
      startDate, endDate, usageLimit, status, brand
    } = req.body;

    const coupon = new Coupon({
      code,
      name,
      description,
      discountType,
      discountValue,
      minAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      status: status || 'active',
      brand: brand || 'ADMORE'
    });

    const savedCoupon = await coupon.save();
    res.json({ success: true, id: savedCoupon._id, message: '쿠폰이 생성되었습니다.' });
  } catch (error) {
    console.error('쿠폰 생성 오류:', error);
    res.status(500).json({ success: false, message: '쿠폰 생성에 실패했습니다.' });
  }
};

// 쿠폰 수정
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '쿠폰이 수정되었습니다.' });
  } catch (error) {
    console.error('쿠폰 수정 오류:', error);
    res.status(500).json({ success: false, message: '쿠폰 수정에 실패했습니다.' });
  }
};

// 쿠폰 삭제
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '쿠폰이 삭제되었습니다.' });
  } catch (error) {
    console.error('쿠폰 삭제 오류:', error);
    res.status(500).json({ success: false, message: '쿠폰 삭제에 실패했습니다.' });
  }
};

// 사용자별 쿠폰 목록 조회
const getUserCoupons = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // CouponSend에서 해당 사용자에게 발송된 쿠폰 조회
    const userCouponSends = await CouponSend.find({ 
      userId: userId,
      expiresAt: { $gt: new Date() } // 만료되지 않은 쿠폰만
    }).populate('couponId'); // 쿠폰 상세 정보 포함
    
    // 사용자별 쿠폰 데이터 구성
    const userCoupons = userCouponSends.map(send => ({
      sendId: send._id,
      couponId: send.couponId._id,
      name: send.couponId.name,
      description: send.couponId.description,
      discountType: send.couponId.discountType,
      discountValue: send.couponId.discountValue,
      maxDiscount: send.couponId.maxDiscount,
      minPurchase: send.couponId.minPurchase,
      startDate: send.couponId.startDate,
      endDate: send.couponId.endDate,
      brand: send.couponId.brand,
      code: send.couponId.code,
      usedAt: send.usedAt,
      expiresAt: send.expiresAt,
      status: send.couponId.status
    }));
    
    res.json({ success: true, coupons: userCoupons });
  } catch (error) {
    console.error('사용자 쿠폰 조회 오류:', error);
    res.status(500).json({ success: false, message: '사용자 쿠폰 조회에 실패했습니다.' });
  }
};

// 쿠폰 발송
const sendCoupon = async (req, res) => {
  try {
    const { couponId, userIds } = req.body;
    
    if (!couponId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '쿠폰 ID와 사용자 ID 목록이 필요합니다.' 
      });
    }

    // 쿠폰 존재 확인
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ 
        success: false, 
        message: '쿠폰을 찾을 수 없습니다.' 
      });
    }

    // 쿠폰이 활성 상태인지 확인
    if (coupon.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: '비활성 상태의 쿠폰은 발송할 수 없습니다.' 
      });
    }

    // 사용자들 존재 확인
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({ 
        success: false, 
        message: '일부 사용자를 찾을 수 없습니다.' 
      });
    }

    // 쿠폰 만료일 계산 (쿠폰의 endDate 사용)
    const expiresAt = new Date(coupon.endDate);
    
    // 이미 발송된 쿠폰이 있는지 확인하고 중복 발송 방지
    const existingSends = await CouponSend.find({
      couponId,
      userId: { $in: userIds }
    });

    if (existingSends.length > 0) {
      const existingUserIds = existingSends.map(send => send.userId.toString());
      const newUserIds = userIds.filter(id => !existingUserIds.includes(id.toString()));
      
      if (newUserIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '선택된 모든 사용자에게 이미 해당 쿠폰이 발송되었습니다.' 
        });
      }
      
      // 중복되지 않는 사용자만 필터링
      userIds.splice(0, userIds.length, ...newUserIds);
    }

    // 쿠폰 발송 이력 생성
    const couponSends = userIds.map(userId => {
      const user = users.find(u => u._id.toString() === userId.toString());
      return {
        couponId,
        userId,
        userEmail: user.email,
        userName: user.name || user.email,
        expiresAt
      };
    });

    const savedSends = await CouponSend.insertMany(couponSends);

    console.log(`쿠폰 "${coupon.name}" 발송 완료: ${savedSends.length}명`);

    res.json({ 
      success: true, 
      message: `${savedSends.length}명의 사용자에게 쿠폰이 발송되었습니다.`,
      sentCount: savedSends.length
    });

  } catch (error) {
    console.error('쿠폰 발송 오류:', error);
    
    // 중복 키 에러 처리
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: '일부 사용자에게 이미 해당 쿠폰이 발송되었습니다.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '쿠폰 발송에 실패했습니다.' 
    });
  }
};

// 쿠폰 발송 이력 조회
const getCouponSends = async (req, res) => {
  try {
    const { couponId } = req.params;
    
    const sends = await CouponSend.findByCouponId(couponId);
    
    res.json({ 
      success: true, 
      sends 
    });
  } catch (error) {
    console.error('쿠폰 발송 이력 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '쿠폰 발송 이력 조회에 실패했습니다.' 
    });
  }
};

// 사용자 쿠폰 삭제 (CouponSend에서 삭제)
const deleteUserCoupon = async (req, res) => {
  try {
    const { sendId } = req.params;
    
    // CouponSend에서 해당 발송 기록 삭제
    const deletedSend = await CouponSend.findByIdAndDelete(sendId);
    
    if (!deletedSend) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자 쿠폰을 찾을 수 없습니다.' 
      });
    }

    console.log(`사용자 쿠폰 삭제 완료: sendId=${sendId}`);
    
    res.json({ 
      success: true, 
      message: '사용자 쿠폰이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('사용자 쿠폰 삭제 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '사용자 쿠폰 삭제에 실패했습니다.' 
    });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getUserCoupons,
  sendCoupon,
  getCouponSends,
  deleteUserCoupon
};



