const algorithmManager = require('../services/algorithmManager');
const graphLoader = require('../services/graphLoader');
const { haversineDistance } = require('../utils/geo');
const NodeModel = require('../models/nodeModel');
// Bảng ưu tiên cho các loại đường (Điểm càng cao càng ưu tiên)
const HIGHWAY_PRIORITY = {
  'motorway': 5, 'trunk': 5, 'primary': 4, 'secondary': 3, 'tertiary': 2,
  'residential': 1, 'unclassified': 1, 'living_street': 1, 'service': 1, 'road': 1, 
  // Loại đường ưu tiên thấp (sẽ bị bỏ qua nếu có lựa chọn tốt hơn)
  'pedestrian': 0, 'footway': 0, 'path': 0, 'steps': 0, 'track': 0,
};


/**
 * --- TÌM KIẾM SỬ DỤNG MONGODB INDEX ---
 * Tìm top N nodes gần nhất sử dụng $near của MongoDB
 * Tận dụng index '2dsphere' đã khai báo trong Model
 */
async function findNearestNodesDB(lat, lon, count = 10) {
  try {
    // MongoDB GeoJSON lưu theo thứ tự [Longitude, Latitude]
    const coordinates = [parseFloat(lon), parseFloat(lat)];

    const foundNodes = await NodeModel.find({
      loc: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates
          }
          // $maxDistance: 500 // Có thể thêm giới hạn bán kính (mét) nếu muốn
        }
      }
    }).limit(count).select('id lat lon'); // Chỉ lấy các trường cần thiết

    // Map kết quả về định dạng cũ để tương thích với hàm getBestSnapNode
    return foundNodes.map(node => ({
      nodeId: node.id,
      node: { lat: node.lat, lon: node.lon }, 
      // Vẫn tính lại dist để phục vụ logic so sánh bên dưới (chi phí cực nhỏ vì N=10)
      dist: haversineDistance(lat, lon, node.lat, node.lon)
    }));
  } catch (error) {
    console.error("Lỗi truy vấn Geo MongoDB:", error);
    return [];
  }
}

/**
 * Chọn node có loại đường ưu tiên cao nhất trong số các node gần đó
 * nearestNodes - Mảng các node gần nhất { nodeId, node, dist }
 * graph - Map biểu diễn đồ thị
 * Trả về nodeId tốt nhất hoặc null nếu không tìm được
 */
function getBestSnapNode(nearestNodes, graph) {
    let bestNodeId = null;
    let maxPriority = -1;
    // Node gần nhất tuyệt đối (dùng làm phương án dự phòng)
    let fallbackNodeId = nearestNodes.length > 0 ? nearestNodes[0].nodeId : null; 

    for (const { nodeId } of nearestNodes) {
        // Lấy Map của các cạnh đi ra từ node này
        const outgoingEdges = graph.get(nodeId);
        
        if (!outgoingEdges || outgoingEdges.size === 0) continue;

        let nodeScore = 0;
        
        // FIX: Sử dụng values() để truy cập trực tiếp dữ liệu cạnh (edgeData)
        for (const edgeData of outgoingEdges.values()) { 
            const edgeType = edgeData.type;
            const edgeScore = HIGHWAY_PRIORITY[edgeType] || -1; 

            if (edgeScore > nodeScore) {
                nodeScore = edgeScore;
            }
        }

        // Ưu tiên node có điểm cao hơn
        if (nodeScore > maxPriority) {
            maxPriority = nodeScore;
            bestNodeId = nodeId;
        } else if (nodeScore === maxPriority && bestNodeId === null) {
            // Nếu điểm bằng nhau và chưa có node nào được chọn
            bestNodeId = nodeId;
        }
    }
    
    // Nếu không tìm thấy node nào có score > 0 (chỉ có footway), 
    // ta chấp nhận node gần nhất tuyệt đối (fallback)
    if (maxPriority <= 0 && fallbackNodeId) {
        return fallbackNodeId;
    }

    return bestNodeId;
}


/**
 * POST /api/route
 */
exports.findRoute = async (req, res) => {
    try {
        let { startId, goalId, algorithm, start, end } = req.body;

        if (!graphLoader.isLoaded()) {
            await graphLoader.loadAll();
        }

        const { nodes, graph } = await graphLoader.getGraph();

       // 1. TÌM NODE TỐT NHẤT CHO ĐIỂM BẮT ĐẦU
        if (start && start.lat && start.lng) {
            // Gọi MongoDB để tìm node gần nhất
            const nearestStartNodes = await findNearestNodesDB(start.lat, start.lng, 10);
            
            // Logic Snap giữ nguyên, nhưng cần check map in-memory để đảm bảo tính liên kết
            // (Vì DB có thể chứa node mà Graph in-memory chưa load hoặc ngược lại nếu không đồng bộ)
            const validStartNodes = nearestStartNodes.filter(n => nodes.has(n.nodeId));
            
            startId = getBestSnapNode(validStartNodes, graph);
        }

        // 2. TÌM NODE TỐT NHẤT CHO ĐIỂM KẾT THÚC
        if (end && end.lat && end.lng) {
            const nearestGoalNodes = await findNearestNodesDB(end.lat, end.lng, 10);
            const validGoalNodes = nearestGoalNodes.filter(n => nodes.has(n.nodeId));
            
            goalId = getBestSnapNode(validGoalNodes, graph);
        }

        if (!startId || !goalId) {
            return res.status(400).json({ error: 'Thiếu node ID cho điểm bắt đầu hoặc kết thúc. Vui lòng thử chọn điểm gần đường hơn.' });
        }

        if (!nodes.has(startId) || !nodes.has(goalId)) {
            return res.status(404).json({ error: 'Không tìm thấy node gần điểm đã chọn' });
        }

        const algo = algorithm || 'astar';
        const routeFinder = algorithmManager.get(algo);
        
        if (!routeFinder) {
            return res.status(400).json({ error: `Thuật toán '${algo}' không tồn tại` });
        }

        console.log(` Finding route: ${startId} → ${goalId} using ${algo}`);
        const result = await algorithmManager.run(algo, { nodes, graph, startId, goalId });

        if (!result || !result.path || result.path.length === 0) {
            return res.status(404).json({ 
                error: 'Không tìm thấy đường đi giữa 2 điểm này. Hai điểm có thể nằm ở 2 khu vực không liên kết. Vui lòng thử chọn điểm khác.'
            });
        }

        const coordinates = result.path.map(nodeId => {  // Chuyển nodeId thành tọa độ
            const node = nodes.get(nodeId);
            return [node.lat, node.lon];
        });

        

        

        console.log(` Found path: ${result.path.length} nodes, ${result.distance.toFixed(2)} km`);

        return res.status(200).json({
            success: true,
            algorithm: algo,
            path: coordinates,
            distance: result.distance * 1000,
            duration: result.totalDuration,
            elapsedTime: result.elapsedTime,
            steps: result.steps,
            startPoint: { lat: nodes.get(startId).lat, lon: nodes.get(startId).lon }, 
            endPoint: { lat: nodes.get(goalId).lat, lon: nodes.get(goalId).lon }
        });

    } catch (err) {
        console.error('Route error:', err);
        res.status(500).json({ error: 'Lỗi máy chủ', message: err.message });
    }
};

/**
 * GET /api/route/algorithms
 */
exports.listAlgorithms = (req, res) => {   
    try {
        const list = algorithmManager.list();
        res.json({ availableAlgorithms: list });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/**
 * POST /api/route/reload
 */
exports.reloadGraph = async (req, res) => {
    try {
        await graphLoader.loadAll();
        res.json({ message: 'Graph reloaded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/**
 * GET /api/route/nodes
 */
exports.getAllNodes = async (req, res) => {
    try {
        if (!graphLoader.isLoaded()) {
            await graphLoader.loadAll();
        }
        const { nodes } = await graphLoader.getGraph();
        const nodesArray = Array.from(nodes.values());
        res.status(200).json(nodesArray);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi máy chủ' });
    }
};


/**
 * GET /api/route/graph-stats
 */
exports.getGraphStats = async (req, res) => {
    try {
        if (!graphLoader.isLoaded()) {
            await graphLoader.loadAll();
        }
        
        const { nodes, graph } = await graphLoader.getGraph();
        
        let connectedNodes = 0;
        let totalEdges = 0;
        
        for (const [nodeId, edges] of graph.entries()) {
            totalEdges += edges.size; 
            if (edges.size > 0) {
                connectedNodes++;
            }
        }
        
        res.json({
            totalNodes: nodes.size,
            connectedNodes,
            isolatedNodes: nodes.size - connectedNodes,
            totalEdges: totalEdges / 2,
            graphLoaded: true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};