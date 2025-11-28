const { haversineDistance } = require('../utils/geo'); 
const { performance } = require('perf_hooks');

/**
 * PriorityQueue đơn giản cho Dijkstra
 * (Cấu trúc giống A* nhưng dùng gScore làm priority)
 */
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item, priority) {
        this.items.push({ item, priority });
        // Sắp xếp theo priority (chi phí tích lũy gScore)
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
 * Thuật toán Dijkstra tìm đường ngắn nhất (theo chi phí) giữa 2 node
 * {Map} nodes - Map chứa node.id → { lat, lon }
 * {Map} graph - Map<NodeId, Map<NeighborId, EdgeData>> (Danh sách kề)
 * {string} startId - ID node bắt đầu
 * {string} goalId - ID node đích
 */
function dijkstra(nodes, graph, startId, goalId) {
    const startTime = performance.now();
    if (!graph.has(startId) || !graph.has(goalId)) {
        console.warn(`⚠️ Node không tồn tại trong graph: ${startId} hoặc ${goalId}`);
        return null;
    }

    if (startId === goalId) return { path: [startId], steps: 0, timeCost: 0 };

    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map(); // Chi phí thực tế đã đi (g-score)

    gScore.set(startId, 0);

    // Bỏ qua heuristic (h). Trọng số ưu tiên (priority) ban đầu chính là gScore (0)
    openSet.enqueue(startId, 0); 

    let iterations = 0;
    const maxIterations = 200000;

    while (!openSet.isEmpty() && iterations < maxIterations) {
        iterations++;
        // PriorityQueue trả về node có chi phí gScore thấp nhất
        const { item: current } = openSet.dequeue(); 

        if (current === goalId) {
            // Reconstruct path (giống A*)
            const path = [current];
            let temp = current;
            let totalDistance = 0;
            
            while (cameFrom.has(temp)) {
                const prev = cameFrom.get(temp);
                const edgeData = graph.get(prev).get(temp);
                totalDistance += edgeData.distance; 
                temp = prev;
                path.unshift(temp);
            }
            
            const endTime = performance.now();
            const elapsedTime = endTime - startTime;
            
            console.log(`✅ Dijkstra tìm thấy đường sau ${iterations} bước`);
            return {
                path: path,
                steps: path.length - 1,
                distance: totalDistance, // Trả về tổng khoảng cách
                elapsedTime: elapsedTime, // Thời gian thực thi thuật toán (ms)
            };
        }

        closedSet.add(current);

        const neighborsMap = graph.get(current) || new Map();
        
        // Lặp qua tất cả các cạnh đi ra
        for (const [neighborId, edgeData] of neighborsMap.entries()) { 
            if (closedSet.has(neighborId)) continue;

            // Chi phí thực tế là thời gian (cost)
            const costToNeighbor = edgeData.cost; 
            const tentativeG = gScore.get(current) + costToNeighbor;

            // Nếu đây là đường đi tốt hơn (chi phí thấp hơn)
            if (!gScore.has(neighborId) || tentativeG < gScore.get(neighborId)) {
                cameFrom.set(neighborId, current);
                gScore.set(neighborId, tentativeG);

                // TRỌNG SỐ ƯU TIÊN = gScore (chi phí thực tế)
                openSet.enqueue(neighborId, tentativeG); 
            }
        }
    }

    console.warn(`❌ Dijkstra không tìm thấy đường sau ${iterations} bước`);
    return null;
}

module.exports = {
    name: 'dijkstra',
    findPath: dijkstra,
};