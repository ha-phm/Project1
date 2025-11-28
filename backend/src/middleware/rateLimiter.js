const rateLimit = require('express-rate-limit');

/**
 * Middleware giới hạn tần suất gọi API
 * Ngăn người dùng gửi quá nhiều request trong thời gian ngắn.
 */
const limiter = rateLimit({
  windowMs: 60 * 1000,          // 1 phút
  max: 60,                      // Tối đa 60 request / phút / IP
  standardHeaders: true,        // Trả thông tin giới hạn trong header (RateLimit-*)
  legacyHeaders: false,         // Ẩn header cũ X-RateLimit-*
  message: {
    error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
  },
});

module.exports = limiter;
