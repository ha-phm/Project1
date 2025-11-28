const { haversineDistance } = require('../utils/geo');
const { performance } = require('perf_hooks');

/**
 * PriorityQueue đơn giản cho Greedy Best-First Search
 * (Cấu trúc giống A* nhưng chỉ dùng heuristic làm priority)
 */
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    enqueue(item, priority) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }
    dequeue() {
        return this.items.shift();
    }
    isEmpty() {
        return this.items.length === 0;
    }
}

/**
 * Thuật toán Greedy Best-First Search tìm đường ngắn nhất giữa 2 node
 * @param {Map<string, Object>} nodes - Map chứa node.id → { lat, lon }
 * @param {Map<string, Map<string, Object>>} graph - Map<NodeId, Map<NeighborId, EdgeData>>
 * @param {string} startId - ID node bắt đầu
 * @param {string} goalId - ID node đích
 * @returns {Object | null} Kết quả tìm kiếm
 */
function greedyBestFirstSearch(nodes, graph, startId, goalId) {
    const startTime = performance.now();
    if (!graph.has(startId) || !graph.has(goalId)) {
        console.warn(`⚠️ Node không tồn tại trong graph: ${startId} hoặc ${goalId}`);
        return null;
    }

    if (startId === goalId) return { path: [startId], steps: 0 };

    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map(); // Chi phí thực tế đã đi (distance)

    gScore.set(startId, 0);

    const goalNode = nodes.get(goalId);
    const startNode = nodes.get(startId);

    // Heuristic ban đầu
    const initialH = haversineDistance(startNode.lat, startNode.lon, goalNode.lat, goalNode.lon);
    openSet.enqueue(startId, initialH);

    let iterations = 0;
    const maxIterations = 200000;

    while (!openSet.isEmpty() && iterations < maxIterations) {
        iterations++;
        const { item: current } = openSet.dequeue();

        if (current === goalId) {
            // ✅ reconstruct path
            const path = [current];
            let temp = current;
            let totalDistance = 0;
            
            
            // Tính tổng quãng đường khi reconstruct path
            while (cameFrom.has(temp)) {
                const prev = cameFrom.get(temp);
                const edgeData = graph.get(prev).get(temp); // Lấy edge giữa prev và temp
                totalDistance += edgeData.distance; // Tổng khoảng cách (km)
                temp = prev;
                path.unshift(temp);
            }
            const endTime = performance.now();
            const elapsedTime = endTime - startTime;
            
            console.log(`✅ A* tìm thấy đường sau ${iterations} bước`);
            return {
                path: path,
                steps: path.length - 1,
                distance: totalDistance, // Trả về tổng khoảng cách
                elapsedTime: elapsedTime, // Thời gian thực thi thuật toán (ms)
            };
        }

        closedSet.add(current);

        const neighborsMap = graph.get(current) || new Map();
        
        //Lặp qua Map các cạnh đi ra
        for (const [neighborId, edgeData] of neighborsMap.entries()) { 
            if (closedSet.has(neighborId)) continue;

            //Dùng khoảng cách (distance) làm chi phí
            const costToNeighbor = edgeData.distance; 

            const tentativeG = gScore.get(current) + costToNeighbor;

            if (!gScore.has(neighborId) || tentativeG < gScore.get(neighborId)) {
                cameFrom.set(neighborId, current);
                gScore.set(neighborId, tentativeG);

                const neighborNode = nodes.get(neighborId);
                if (!neighborNode) continue;

                // Heuristic (h) vẫn dùng khoảng cách (haversineDistance)
                const h = haversineDistance(neighborNode.lat, neighborNode.lon, goalNode.lat, goalNode.lon)

                openSet.enqueue(neighborId, h); // Chỉ dùng h làm priority
            }
        }
    }

    console.warn(`❌ Greedy Best-First Search không tìm thấy đường sau ${iterations} bước`);
    return null;
}

module.exports = {
    name: 'greedyBestFirstSearch',
    findPath: greedyBestFirstSearch,
};