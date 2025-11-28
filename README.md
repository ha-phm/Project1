
### Introduce
A pathfinding website based on ai algorithms of IT3160 HUST.

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-mern-app
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Configuration

1. Create a `.env` file in the `backend` directory include:
```
DATABASE_URL=<Your MongoDB String>
PORT
NODE_ENV=development
```

### Running the Application
0. If your database has no data yet:
   ```
   cd backend/src/config
   node addMapToDB.js
   ```

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend application:
   ```
   cd frontend
   npm start
   ```

### Usage

- The backend API is available at `http://localhost:5000`.
- The frontend application is available at `http://localhost:3000`.

### Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

### Structure
```
my-mern-app/backend/src/
├── server.js
├── config/
│   |── addMapToDB.js        #Chuyển file .osm vào trong MongoDB  
|   |── db.js                #Kết nối với MongoDB
|   └── haibatrung.osm       #File .osm lấy từ open street map
├── controllers/
│   └── routeController.js   #Nhận request từ frontend -> chạy thuật toán -> trả route kết quả
├── models/
│   ├── nodeModel.js         #Lược đồ Node
│   ├── wayModel.js          #Lược đồ Way
│   └── edgeModel.js         #Lược đồ Edge
├── routes/
│   └── routeRoutes.js       #Khai báo endpoint api/route
├── services/
│   ├── algorithmManager.js  #Quản lý danh sách thuật toán
│   ├── astarService.js      #Triển khai thuật toán A*
│   └── graphLoader.js       #Tải toàn bộ nodes graph về RAM để thuật toán truy cập nhanh
|── middleware/  
|   └── rateLimiter          #Giới hạn request gửi về máy chủ trong một phút
└── utils/
    └── geo.js               #Chứa hàm tiện ích toán học

my-mern-app/frontend/src/    #Đang xây dựng
```