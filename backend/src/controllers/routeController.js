const algorithmManager = require('../services/algorithmManager');
const graphLoader = require('../services/graphLoader');
const { haversineDistance } = require('../utils/geo');

// Bảng ưu tiên cho các loại đường (Điểm càng cao càng ưu tiên)
const HIGHWAY_PRIORITY = {
  'motorway': 5, 'trunk': 5, 'primary': 4, 'secondary': 3, 'tertiary': 2,
  'residential': 1, 'unclassified': 1, 'living_street': 1, 'service': 1, 'road': 1, 
  // Loại đường ưu tiên thấp (sẽ bị bỏ qua nếu có lựa chọn tốt hơn)
  'pedestrian': 0, 'footway': 0, 'path': 0, 'steps': 0, 'track': 0,
};


/**
 * Tìm top N nodes gần nhất (Sử dụng JS iteration)
 * nodes - Map của tất cả nodes
 * lat, lon - Tọa độ điểm cần tìm
 * count - Số lượng node cần tìm
 * Trả về mảng các object { nodeId, node, dist }
 */
function findNearestNodes(nodes, lat, lon, count = 10) {
  // Chuyển Map thành mảng để tính khoảng cách
  const distances = Array.from(nodes.entries()).map(([nodeId, node]) => {
    return {
      nodeId,
      node,
      dist: haversineDistance(lat, lon, node.lat, node.lon),
    };
  });

  // Sắp xếp và trả về N kết quả đầu tiên
  distances.sort((a, b) => a.dist - b.dist);
  return distances.slice(0, count);
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
            const nearestStartNodes = findNearestNodes(nodes, start.lat, start.lng, 10);
            startId = getBestSnapNode(nearestStartNodes, graph);
        }

        // 2. TÌM NODE TỐT NHẤT CHO ĐIỂM KẾT THÚC
        if (end && end.lat && end.lng) {
            const nearestGoalNodes = findNearestNodes(nodes, end.lat, end.lng, 10);
            goalId = getBestSnapNode(nearestGoalNodes, graph);
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

        console.log(`🔍 Finding route: ${startId} → ${goalId} using ${algo}`);
        const result = await algorithmManager.run(algo, { nodes, graph, startId, goalId });

        if (!result || !result.path || result.path.length === 0) {
            return res.status(404).json({ 
                error: 'Không tìm thấy đường đi giữa 2 điểm này. Hai điểm có thể nằm ở 2 khu vực không liên kết. Vui lòng thử chọn điểm khác.'
            });
        }

        const coordinates = result.path.map(nodeId => {
            const node = nodes.get(nodeId);
            return [node.lat, node.lon];
        });

        

        const estimatedDuration = (result.distance / 30) * 3600;

        console.log(`✅ Found path: ${result.path.length} nodes, ${result.distance.toFixed(2)} km`);

        return res.status(200).json({
            success: true,
            algorithm: algo,
            path: coordinates,
            distance: result.distance * 1000,
            duration: estimatedDuration,
            elapsedTime: result.elapsedTime,
            steps: result.steps,
            startPoint: { lat: nodes.get(startId).lat, lon: nodes.get(startId).lon }, 
            endPoint: { lat: nodes.get(goalId).lat, lon: nodes.get(goalId).lon }
        });

    } catch (err) {
        console.error('❌ Route error:', err);
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
            totalEdges += edges.size; // Sửa lỗi .length thành .size nếu là Map
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