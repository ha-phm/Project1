class AlgorithmManager {
  constructor() {
    // Lưu các thuật toán đã đăng ký: { name: serviceObject }
    this.algorithms = {};
  }

  /**
   * Đăng ký một thuật toán mới
   * @param {object} service - module có { name, findPath } 
   */
  register(service) {
    if (!service?.name || typeof service.findPath !== 'function') {
      throw new Error('Thuật toán không hợp lệ: cần có name và hàm findPath(graph, startId, endId)');
    }
    this.algorithms[service.name] = service;
    console.log(`✅ Đã đăng ký thuật toán: ${service.name}`);
  }

  /**
   * Lấy danh sách các thuật toán hiện có
   */
  list() {
    return Object.keys(this.algorithms);
  }

  /**
   * Lấy thuật toán theo tên
   * @param {string} name - tên thuật toán (vd: 'astar', 'dijkstra')
   */
  get(name) {
    return this.algorithms[name] || null;
  }

  /**
   * Gọi thuật toán theo tên
   * @param {string} name - tên thuật toán (vd: 'astar', 'dijkstra')
   * @param {object} params - { graph, startId, endId }
   */
  async run(name, params) {
    const algo = this.algorithms[name];
    if (!algo) throw new Error(`Thuật toán '${name}' chưa được đăng ký`);

    const {nodes, graph, startId, goalId } = params;
    if (!nodes || !graph || !startId || !goalId) {
      throw new Error('Thiếu tham số nodes, graph, startId hoặc goalId');
    }

    console.log(`Đang chạy thuật toán ${name} từ ${startId} → ${goalId}`);
    const result = await algo.findPath(nodes, graph, startId, goalId);
    return result;
  }
}

// Xuất ra một singleton
module.exports = new AlgorithmManager();
