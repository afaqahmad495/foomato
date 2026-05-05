const mongoose = require('mongoose');
const { createDummyModel } = require('../db/dummy-db');

if (process.env.DUMMY_DB === '1') {
  module.exports = createDummyModel('Comment');
} else {
  const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    text: { type: String, required: true },
  }, { timestamps: true });

  module.exports = mongoose.model('Comment', commentSchema);
}
