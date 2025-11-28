const mongoose = require('mongoose');

const edgeSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    index: true // giúp truy vấn nhanh các cạnh xuất phát từ node
  },
  to: {
    type: String,
    required: true,
    index: true // giúp truy vấn nhanh các cạnh đến node
  },
  distance: {
    type: Number,
    required: true // khoảng cách giữa hai node (km)
  },
  wayId: {
    type: String,
    required: true,
    index: true // liên kết với id của way
  }
});

const Edge = mongoose.model('Edge', edgeSchema);
module.exports = Edge;