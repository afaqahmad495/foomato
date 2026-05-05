const mongoose = require('mongoose');
const { createDummyModel } = require('../db/dummy-db');

if (process.env.DUMMY_DB === '1') {
    module.exports = createDummyModel('Food');
} else {

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    description: {
        type: String,
        required: true
    },
    video: {
        type: String,
        required: true
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodPartner',
        
    }
});

module.exports = mongoose.model('Food', foodSchema);
}
