const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  verifyToken: {
    type: String
  },
  verifyExpires: {
    type: Date
  },
  resetToken: {
    type: String
  },
  resetExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// 이메일로 사용자 찾기
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// 인증 토큰으로 사용자 찾기
userSchema.statics.findByVerifyToken = function(token) {
  return this.findOne({ verifyToken: token });
};

// 사용자 상태 업데이트
userSchema.methods.updateStatus = function(status) {
  this.status = status;
  return this.save();
};

// 이메일 인증 상태 업데이트
userSchema.methods.verifyEmail = function() {
  this.emailVerified = true;
  this.verifyToken = undefined;
  this.verifyExpires = undefined;
  return this.save();
};

// 인증 토큰 업데이트
userSchema.statics.updateVerifyToken = function(userId, token, expires) {
  return this.findByIdAndUpdate(userId, {
    verifyToken: token,
    verifyExpires: expires
  });
};

// 이메일 인증 완료
userSchema.statics.updateEmailVerified = function(userId) {
  return this.findByIdAndUpdate(userId, {
    emailVerified: true,
    verifyToken: undefined,
    verifyExpires: undefined
  });
};

// 마지막 로그인 시간 업데이트
userSchema.statics.updateLastLogin = function(userId) {
  return this.findByIdAndUpdate(userId, {
    lastLogin: new Date()
  });
};

// 비밀번호 업데이트
userSchema.statics.updatePassword = function(userId, hashedPassword) {
  return this.findByIdAndUpdate(userId, {
    password: hashedPassword
  });
};

// 비밀번호 재설정 토큰으로 사용자 찾기
userSchema.statics.findByResetToken = function(token) {
  return this.findOne({ resetToken: token });
};

// 비밀번호 재설정 토큰 업데이트
userSchema.statics.updateResetToken = function(userId, token, expires) {
  return this.findByIdAndUpdate(userId, {
    resetToken: token,
    resetExpires: expires
  });
};

// 비밀번호 업데이트 및 재설정 토큰 제거
userSchema.statics.updatePasswordAndClearResetToken = function(userId, hashedPassword) {
  return this.findByIdAndUpdate(userId, {
    password: hashedPassword,
    resetToken: undefined,
    resetExpires: undefined
  });
};

module.exports = mongoose.model('User', userSchema);
