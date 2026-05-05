const mongoose = require('mongoose');
const { createDummyModel } = require('../db/dummy-db');

if (process.env.DUMMY_DB === '1') {
    module.exports = createDummyModel('FoodPartner');
} else {

const foodPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        
    },
    contactName:{
        type: String,
        required: true,
    },
    phone:{
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        
    },
    password: {
        type: String,
        required: true,
        
    },
    profilePic: {
        type: String,
        default: '',
    }
}, {
    timestamps: true
});

const FoodPartner = mongoose.model('FoodPartner', foodPartnerSchema);

module.exports = FoodPartner;
}
