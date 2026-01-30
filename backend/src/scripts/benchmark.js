const mongoose = require('mongoose');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const graphLoader = require('../services/graphLoader');
const algorithmManager = require('../services/algorithmManager');
const astarModule = require('../services/astarService');       
const dijkstraModule = require('../services/dijkstraService');

const OUTPUT_FILE = 'benchmark_results.csv';
const TOTAL_PAIRS = 100;

async function runBenchmark() {
    try {
        await connectDB();
        await graphLoader.loadAll();
        const { nodes, graph } = await graphLoader.getGraph();
        
        algorithmManager.register(astarModule); 
        algorithmManager.register(dijkstraModule);

        const allNodeIds = Array.from(nodes.keys());
        const csvWriter = createCsvWriter({
            path: OUTPUT_FILE,
            header: [
                { id: 'pair', title: 'STT' },
                { id: 'distance', title: 'QUÃNG ĐƯỜNG (KM)' },
                { id: 'astar_time', title: 'A* TIME (MS)' },
                { id: 'dijkstra_time', title: 'DIJKSTRA TIME (MS)' },
                { id: 'astar_steps', title: 'A* STEPS (NODES)' },      // Mới
                { id: 'dijkstra_steps', title: 'DIJKSTRA STEPS (NODES)' }, // Mới
                { id: 'step_reduction', title: 'TIẾT KIỆM BƯỚC (%)' }    // Mới
            ]
        });

        const results = [];
        for (let i = 1; i <= TOTAL_PAIRS; i++) {
            const startId = allNodeIds[Math.floor(Math.random() * allNodeIds.length)];
            const goalId = allNodeIds[Math.floor(Math.random() * allNodeIds.length)];

            if (startId === goalId) { i--; continue; }

            const resAStar = await algorithmManager.run('astar', { nodes, graph, startId, goalId });
            const resDijkstra = await algorithmManager.run('dijkstra', { nodes, graph, startId, goalId });

            if (!resAStar || !resDijkstra || !resAStar.path) {
                i--; continue;
            }

            // Tính toán tỷ lệ tiết kiệm bước duyệt
            const reduction = ((resDijkstra.steps) / resAStar.steps).toFixed(2);

            results.push({
                pair: i,
                distance: resAStar.distance.toFixed(3),
                astar_time: resAStar.elapsedTime.toFixed(4),
                dijkstra_time: resDijkstra.elapsedTime.toFixed(4),
                astar_steps: resAStar.steps,        // Lấy từ kết quả trả về của thuật toán
                dijkstra_steps: resDijkstra.steps,  // Lấy từ kết quả trả về của thuật toán
                step_reduction: reduction 
            });
                if (i % 10 === 0) console.log(` Xong ${i}/${TOTAL_PAIRS} cặp`);
            
        }

        await csvWriter.writeRecords(results);
        console.log(`\n HOÀN THÀNH! Kết quả lưu tại: ${OUTPUT_FILE}`);
        process.exit(0);
    } catch (error) {
        console.error(' Lỗi:', error);
        process.exit(1);
    }
}

runBenchmark();
