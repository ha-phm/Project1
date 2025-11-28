const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db.js');
const cors = require('cors');
const routeRoutes = require('./routes/routeRoutes');
const algorithmManager = require('./services/algorithmManager');
const limiter = require('./middleware/rateLimiter');
const graphLoader = require('./services/graphLoader');

// Nạp các thuật toán tìm đường
const astarService = require('./services/astarService');
// Nếu sau này có thêm thuật toán khác, chỉ cần require ở đây
const dijkstraService = require('./services/dijkstraService');
const greedyBestFirstSearchService = require('./services/greedyBestFirstSearchService');

// Đăng ký vào algorithmManager
algorithmManager.register(astarService);
algorithmManager.register(dijkstraService);
algorithmManager.register(greedyBestFirstSearchService);


// =============================
// Khởi tạo Express App
// =============================


const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter); // giới hạn tần suất gọi API


// Kết nối Database
connectDB();



// Routes
app.use('/api', routeRoutes);


// Nạp dữ liệu vào ram
graphLoader.loadAll().catch((err) => {
  console.error('Lỗi khi load graph lúc khởi động:', err);
});

// =============================
// Serve Frontend (Static Files)
// =============================

//const frontendPath = path.join(__dirname, '..', 'frontend');
//app.use(express.static(frontendPath));

// Nếu người dùng nhập URL khác, vẫn trả về index.html
//app.use((req, res) => {
  //res.sendFile(path.join(frontendPath, 'index.html'));
//});


// =============================
// Khởi động Server
// =============================
app.listen(PORT, () => {
  console.log(`✅ App running at http://localhost:${PORT}`);
});

