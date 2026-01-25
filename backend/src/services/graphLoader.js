const Node = require('../models/nodeModel');
const Edge = require('../models/edgeModel');

class GraphLoader {
    constructor (){
        this.graph = new Map();
        this.nodes = new Map();
    }

    async loadAll(){
        const [nodes, edges] = await Promise.all([
            Node.find({}).lean(),
            Edge.find({}).lean()
        ]);

        for (const n of nodes) { this.nodes.set(n.id, n); }
        for (const e of edges) {
            if (!this.graph.has(e.from)) {
                this.graph.set(e.from, new Map());
            }
            
            this.graph.get(e.from).set(e.to, e);
        }
        console.log(`Graph loaded: ${this.nodes.size} nodes, ${edges.length} edges.`);
        console.log(' Graph is ready.');
    }

    isLoaded() {     // kiểm tra xem trong RAM đã có dữ liệu chưa. Nếu server vừa khởi động lại mà dữ liệu chưa kịp nạp, hàm này sẽ báo để tránh gây lỗi cho thuật toán.
        return this.graph.size > 0;
    }

    async getGraph() {
        return {
            nodes: this.nodes,
            graph: this.graph
        };
    }
}

module.exports =  new GraphLoader();