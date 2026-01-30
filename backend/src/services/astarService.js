const { haversineDistance } = require('../utils/geo');
const { performance } = require('perf_hooks');

const Heap = require('heap-js').Heap;

/**
 * PriorityQueue dùng binary min-heap từ heap-js, push or pop: O(log n)
 */
class PriorityQueue {
    constructor() {
        // Comparator: nhỏ hơn → ưu tiên cao hơn (min-heap theo f score)
        this.heap = new Heap((a, b) => a.priority - b.priority);
    }

    enqueue(item, priority) {
        this.heap.push({ item, priority });
    }

    dequeue() {
        return this.heap.pop();
    }

    isEmpty() {
        return this.heap.size() === 0;
    }
}
/**
 * Thuật toán A* tìm đường ngắn nhất giữa 2 node
 * @param {Map<string, Object>} nodes - Map chứa node.id → { lat, lon }
 * @param {Map<string, Map<string, Object>>} graph - Map<NodeId, Map<NeighborId, EdgeData>>
 * @param {string} startId - ID node bắt đầu
 * @param {string} goalId - ID node đích
 * @returns {Object | null} Kết quả tìm kiếm
 */
function aStar(nodes, graph, startId, goalId) {
    const startTime = performance.now();
    if (!graph.has(startId) || !graph.has(goalId)) {
        console.warn(`⚠️ Node không tồn tại trong graph: ${startId} hoặc ${goalId}`);
        return null;
    }

    if (startId === goalId) return { path: [startId], steps: 0 };

    const openSet = new PriorityQueue(); // các node đang chờ khám phá (ưu tiên f nhỏ nhất)
    const closedSet = new Set();        // Set – node đã explore xong (không revisit)
    const cameFrom = new Map();         // Map<nodeId, nodeId> – lưu node cha để reconstruct path
    const gScore = new Map(); // g(n): start -> n : Chi phí thực tế đã đi (distance)

    gScore.set(startId, 0);

    const goalNode = nodes.get(goalId);
    const startNode = nodes.get(startId);

    // Heuristic ban đầu
    const initialH = haversineDistance(startNode.lat, startNode.lon, goalNode.lat, goalNode.lon);     // Heuristic ban đầu (khoảng cách thẳng từ start → goal)
    openSet.enqueue(startId, initialH);    // f(n) = g(n) + h(n) = 0 + h(initial)

    let iterations = 0;
    const maxIterations = 200000;

    while (!openSet.isEmpty() && iterations < maxIterations) {
        iterations++;
        const { item: current } = openSet.dequeue();

        if (current === goalId) {
            //  reconstruct path
            const path = [current];
            let temp = current;
            let totalDistance = 0;
            
            
            // Tính tổng quãng đường khi reconstruct path
            while (cameFrom.has(temp)) {
                const prev = cameFrom.get(temp);
                const edgeData = graph.get(prev).get(temp); // Lấy edge giữa prev và temp
                totalDistance += edgeData.distance; // Tổng khoảng cách (km)
                const speed = getSpeed(edgeData.type); // Lấy tốc độ từ bảng HIGHWAY_SPEED_MAP
    
                const timeOnEdge = (edgeData.distance / speed) * 3600; // Đổi ra giây: (km / (km/h)) * 3600
    
                totalDuration += timeOnEdge; // Cộng dồn thời gian từng đoạn
                temp = prev;
                path.unshift(temp);
            }
            const endTime = performance.now();
            const elapsedTime = endTime - startTime;
            
            console.log(` A* tìm thấy đường sau ${iterations} bước`);
            return {
                path: path,
                steps: path.length - 1, // iterations,
                distance: totalDistance, // Trả về tổng khoảng cách
                elapsedTime: elapsedTime // Thời gian thực thi thuật toán (ms)
                
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
                const h = haversineDistance(neighborNode.lat, neighborNode.lon, goalNode.lat, goalNode.lon);
                const f = tentativeG + h; // f = g(distance) + h(distance)

                openSet.enqueue(neighborId, f);
            }
        }
    }

    console.warn(` A* không tìm thấy đường sau ${iterations} bước`);
    return null;
}

module.exports = {
    name: 'astar',
    findPath: aStar,
};