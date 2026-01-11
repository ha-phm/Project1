const { haversineDistance } = require('../utils/geo'); 
const { performance } = require('perf_hooks');

const Heap = require('heap-js').Heap;

/**
 * PriorityQueue dùng binary min-heap từ heap-js
 * Ưu tiên theo gScore (chi phí thực tế tích lũy – giờ dùng distance)
 */
class PriorityQueue {
    constructor() {
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
 * Thuật toán Dijkstra tìm đường ngắn nhất THEO KHOẢNG CÁCH (distance)
 * Giống A* nhưng KHÔNG dùng heuristic (h = 0)
 * @param {Map<string, Object>} nodes - Map chứa node.id → { lat, lon }
 * @param {Map<string, Map<string, Object>>} graph - Map<NodeId, Map<NeighborId, EdgeData>>
 * @param {string} startId - ID node bắt đầu
 * @param {string} goalId - ID node đích
 */
function dijkstra(nodes, graph, startId, goalId) {
    const startTime = performance.now();
    if (!graph.has(startId) || !graph.has(goalId)) {
        console.warn(`⚠️ Node không tồn tại trong graph: ${startId} hoặc ${goalId}`);
        return null;
    }

    if (startId === goalId) return { path: [startId], steps: 0, distance: 0 };

    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map(); // Chi phí thực tế đã đi (tổng distance)

    gScore.set(startId, 0);

    // Priority ban đầu = gScore = 0 (không có heuristic)
    openSet.enqueue(startId, 0); 

    let iterations = 0;
    const maxIterations = 200000;

    while (!openSet.isEmpty() && iterations < maxIterations) {
        iterations++;
        const { item: current } = openSet.dequeue(); 

        if (current === goalId) {
            // Reconstruct path
            const path = [current];
            let temp = current;
            let totalDistance = 0;
            
            while (cameFrom.has(temp)) {
                const prev = cameFrom.get(temp);
                const edgeData = graph.get(prev).get(temp);
                totalDistance += edgeData.distance; // Tổng khoảng cách (km)
                temp = prev;
                path.unshift(temp);
            }
            
            const endTime = performance.now();
            const elapsedTime = endTime - startTime;
            
            console.log(` Dijkstra tìm thấy đường sau ${iterations} bước`);
            return {
                path: path,
                steps: path.length - 1,
                distance: totalDistance, // Tổng khoảng cách (km)
                elapsedTime: elapsedTime,
            };
        }

        closedSet.add(current);

        const neighborsMap = graph.get(current) || new Map();
        
        for (const [neighborId, edgeData] of neighborsMap.entries()) { 
            if (closedSet.has(neighborId)) continue;

            // SỬA: Dùng distance thay vì cost
            const costToNeighbor = edgeData.distance; 
            const tentativeG = gScore.get(current) + costToNeighbor;

            if (!gScore.has(neighborId) || tentativeG < gScore.get(neighborId)) {
                cameFrom.set(neighborId, current);
                gScore.set(neighborId, tentativeG);

                // Priority = tentativeG (chi phí tích lũy distance)
                openSet.enqueue(neighborId, tentativeG); 
            }
        }
    }

    console.warn(` Dijkstra không tìm thấy đường sau ${iterations} bước`);
    return null;
}

module.exports = {
    name: 'dijkstra',
    findPath: dijkstra,
};