const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// Tìm đường
router.post('/route', routeController.findRoute);

// Lấy danh sách thuật toán
router.get('/algorithms', routeController.listAlgorithms);

// Reload graph
router.post('/reload', routeController.reloadGraph);

// Lấy tất cả nodes
router.get('/nodes', routeController.getAllNodes);

// Lấy thống kê graph
router.get('/graph-stats', routeController.getGraphStats);

module.exports = router;