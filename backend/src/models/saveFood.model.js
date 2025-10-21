const mongoose = require('mongoose');

const saveFoodSchema = new mongoose.Schema({
    
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
}, { timestamps: true });

module.exports = mongoose.model('SaveFood', saveFoodSchema);