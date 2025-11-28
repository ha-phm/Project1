const mongoose = require('mongoose');

const waySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nodes: {
    type: [String], // danh sách id của các node
    required: true
  },
  tags: {
    type: Map,
    of: String, // ví dụ: { highway: 'residential', name: 'Lý Thường Kiệt' }
    default: {}
  }
});

const Way = mongoose.model('Way', waySchema);

module.exports = Way;
