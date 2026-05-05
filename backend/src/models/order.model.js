const mongoose = require('mongoose');
const { createDummyModel } = require('../db/dummy-db');

if (process.env.DUMMY_DB === '1') {
  module.exports = createDummyModel('Order');
} else {
  const addressSchema = new mongoose.Schema({
    addressLine: { type: String, required: true },
    cityArea: { type: String, required: true },
    landmark: { type: String },
  }, { _id: false });

  const itemSnapshotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    video: { type: String },
    foodPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPartner' },
  }, { _id: false });

  const userSnapshotSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    phone: { type: String },
  }, { _id: false });

  const foodPartnerSnapshotSchema = new mongoose.Schema({
    name: { type: String },
    address: { type: String },
    phone: { type: String },
  }, { _id: false });

  const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    foodPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodPartner', required: true },
    quantity: { type: Number, required: true, min: 1, max: 50 },
    deliveryMode: { type: String, enum: ['pickup', 'delivery'], required: true },
    address: { type: addressSchema, default: null },
    phone: { type: String, required: true },
    note: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['COD', 'STRIPE'], required: true },
    paymentStatus: { type: String, enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED'], default: 'UNPAID' },
    paidAt: { type: Date, default: null },
    stripeSessionId: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['PLACED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'], default: 'PLACED' },
    itemSnapshot: { type: itemSnapshotSchema, required: true },
    userSnapshot: { type: userSnapshotSchema, default: null },
    foodPartnerSnapshot: { type: foodPartnerSnapshotSchema, default: null },
  }, { timestamps: true });

  module.exports = mongoose.model('Order', orderSchema);
}
