const mongoose = require('mongoose');
const { createDummyModel } = require('../db/dummy-db');

if (process.env.DUMMY_DB === '1') {
    const Food = require('./food.model');
    module.exports = createDummyModel('SaveFood', { populate: { foodId: Food } });
} else {

    const saveFoodSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    }, { timestamps: true });

    module.exports = mongoose.model('SaveFood', saveFoodSchema);
}
