// backend/scripts/checkGraph.js
// Script để kiểm tra chất lượng graph và tìm vấn đề

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db.js');
const Node = require('../models/nodeModel.js');
const Edge = require('../models/edgeModel.js');

async function checkGraph() {
  try {
    await connectDB();
    console.log(' Connected to MongoDB');

    // 1. Lấy tất cả nodes và edges
    const nodes = await Node.find({}).lean();
    const edges = await Edge.find({}).lean();

    console.log(`\n Graph Statistics:`);
    console.log(`Total Nodes: ${nodes.length}`);
    console.log(`Total Edges: ${edges.length}`);

    // 2. Build adjacency list
    const graph = new Map();
    for (const node of nodes) {
      graph.set(node.id, []);
    }

    for (const edge of edges) {
      if (graph.has(edge.from)) {
        graph.get(edge.from).push(edge.to);
      }
      if (graph.has(edge.to)) {
        graph.get(edge.to).push(edge.from);
      }
    }

    // 3. Phân tích connectivity
    let connectedNodes = 0;
    let isolatedNodes = 0;
    const degreeDistribution = {};

    for (const [nodeId, neighbors] of graph.entries()) {
      const degree = neighbors.length;
      
      if (degree > 0) {
        connectedNodes++;
      } else {
        isolatedNodes++;
      }

      degreeDistribution[degree] = (degreeDistribution[degree] || 0) + 1;
    }

    console.log(`\n Connectivity:`);
    console.log(`Connected Nodes: ${connectedNodes} (${(connectedNodes/nodes.length*100).toFixed(2)}%)`);
    console.log(`Isolated Nodes: ${isolatedNodes} (${(isolatedNodes/nodes.length*100).toFixed(2)}%)`);

    console.log(`\n Degree Distribution (top 10):`);
    const sortedDegrees = Object.entries(degreeDistribution)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .slice(0, 10);
    
    for (const [degree, count] of sortedDegrees) {
      console.log(`  Degree ${degree}: ${count} nodes`);
    }

    // 4. Tìm connected components (sử dụng BFS)
    function findConnectedComponents() {
      const visited = new Set();
      const components = [];

      function bfs(startId) {
        const queue = [startId];
        const component = [];
        visited.add(startId);

        while (queue.length > 0) {
          const nodeId = queue.shift();
          component.push(nodeId);

          const neighbors = graph.get(nodeId) || [];
          for (const neighborId of neighbors) {
            if (!visited.has(neighborId)) {
              visited.add(neighborId);
              queue.push(neighborId);
            }
          }
        }

        return component;
      }

      for (const [nodeId, neighbors] of graph.entries()) {
        if (!visited.has(nodeId) && neighbors.length > 0) {
          const component = bfs(nodeId);
          components.push(component);
        }
      }

      return components;
    }

    console.log(`\n Finding Connected Components...`);
    const components = findConnectedComponents();
    
    console.log(`Total Components: ${components.length}`);
    
    // Sắp xếp components theo kích thước
    components.sort((a, b) => b.length - a.length);
    
    console.log(`\nTop 5 Largest Components:`);
    for (let i = 0; i < Math.min(5, components.length); i++) {
      console.log(`  Component ${i + 1}: ${components[i].length} nodes (${(components[i].length/connectedNodes*100).toFixed(2)}% of connected)`);
    }

    // 5. Kiểm tra tính toàn vẹn của edges
    let validEdges = 0;
    let invalidEdges = 0;

    for (const edge of edges) {
      if (graph.has(edge.from) && graph.has(edge.to)) {
        validEdges++;
      } else {
        invalidEdges++;
      }
    }

    console.log(`\nEdge Integrity:`);
    console.log(`Valid Edges: ${validEdges}`);
    console.log(`Invalid Edges: ${invalidEdges}`);

    // 6. Khuyến nghị
    console.log(`\n Recommendations:`);
    
    if (isolatedNodes > nodes.length * 0.1) {
      console.log(`WARNING: ${(isolatedNodes/nodes.length*100).toFixed(2)}% nodes are isolated!`);
      console.log(`   Suggestion: Check OSM import process or filter out isolated nodes`);
    }

    if (components.length > 10) {
      console.log(` WARNING: Graph has ${components.length} disconnected components!`);
      console.log(`   Suggestion: Users can only navigate within the same component`);
    }

    if (components.length > 0 && components[0].length < connectedNodes * 0.8) {
      console.log(` WARNING: Largest component only contains ${(components[0].length/connectedNodes*100).toFixed(2)}% of connected nodes`);
      console.log(`   Suggestion: Graph is highly fragmented`);
    }

    if (invalidEdges > 0) {
      console.log(`ERROR: Found ${invalidEdges} edges referencing non-existent nodes!`);
      console.log(`   Suggestion: Clean up database`);
    }

    // 7. Sample một vài node để test
    console.log(`\n Sample Nodes for Testing:`);
    const largestComponent = components[0] || [];
    const sampleSize = Math.min(5, largestComponent.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const nodeId = largestComponent[Math.floor(Math.random() * largestComponent.length)];
      const node = nodes.find(n => n.id === nodeId);
      const degree = graph.get(nodeId).length;
      console.log(`  Node ${nodeId}: lat=${node.lat}, lon=${node.lon}, degree=${degree}`);
    }

    console.log(`\n Analysis Complete!`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkGraph();