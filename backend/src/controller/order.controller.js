const { v4: uuidv4 } = require('uuid');
const Order = require('../models/order.model');
const Food = require('../models/food.model');
const FoodPartner = require('../models/foodPartner.model');

const CANCELLABLE_STATUSES = new Set(['PLACED', 'ACCEPTED']);
const ALLOWED_PAYMENT_METHODS = new Set(['COD', 'STRIPE']);

function makeOrderId() {
  return `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function parseQuantity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  return int === n ? int : int;
}

const createOrder = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Please login first' });

    const {
      foodId,
      quantity,
      deliveryMode,
      address,
      phone,
      note,
      paymentMethod,
    } = req.body || {};

    if (!foodId) return res.status(400).json({ message: 'foodId is required' });

    const qty = parseQuantity(quantity);
    if (!qty || qty < 1 || qty > 50) {
      return res.status(400).json({ message: 'quantity must be between 1 and 50' });
    }

    if (deliveryMode !== 'pickup' && deliveryMode !== 'delivery') {
      return res.status(400).json({ message: 'deliveryMode must be pickup or delivery' });
    }

    const pm = String(paymentMethod || 'COD').toUpperCase();
    if (!ALLOWED_PAYMENT_METHODS.has(pm)) {
      return res.status(400).json({ message: 'paymentMethod must be COD or STRIPE' });
    }

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ message: 'phone is required' });
    }

    let normalizedAddress = null;
    if (deliveryMode === 'delivery') {
      const addressLine = address?.addressLine || address?.address_line || address?.line1;
      const cityArea = address?.cityArea || address?.city_area || address?.city;
      const landmark = address?.landmark || '';
      if (!addressLine || !String(addressLine).trim()) return res.status(400).json({ message: 'addressLine is required for delivery' });
      if (!cityArea || !String(cityArea).trim()) return res.status(400).json({ message: 'cityArea is required for delivery' });
      normalizedAddress = {
        addressLine: String(addressLine).trim(),
        cityArea: String(cityArea).trim(),
        landmark: String(landmark || '').trim(),
      };
    }

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: 'Food item not found' });

    const price = Number(food.price);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: 'Food item price is not set' });
    }

    const total = price * qty;

    let foodPartnerSnapshot = null;
    try {
      const fp = await FoodPartner.findById(food.foodPartner);
      if (fp) {
        foodPartnerSnapshot = {
          name: fp.name,
          address: fp.address,
          phone: fp.phone,
        };
      }
    } catch {
      // ignore snapshot failures
    }

    const order = await Order.create({
      orderId: makeOrderId(),
      userId,
      foodId: food._id,
      foodPartnerId: food.foodPartner,
      quantity: qty,
      deliveryMode,
      address: normalizedAddress,
      phone: String(phone).trim(),
      note: String(note || '').trim(),
      paymentMethod: pm,
      paymentStatus: pm === 'STRIPE' ? 'PENDING' : 'UNPAID',
      unitPrice: price,
      total,
      status: 'PLACED',
      itemSnapshot: {
        name: food.name,
        price,
        video: food.video,
        foodPartner: food.foodPartner,
      },
      userSnapshot: {
        username: req.user?.username,
        email: req.user?.email,
        phone: req.user?.phone,
      },
      foodPartnerSnapshot,
    });

    return res.status(201).json({ message: 'Order placed', order });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyOrderById = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Please login first' });

    const id = req.params?.id;
    if (!id) return res.status(400).json({ message: 'order id is required' });

    let order = await Order.findOne({ _id: id, userId }).lean();
    if (!order) order = await Order.findOne({ orderId: id, userId }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    return res.status(200).json({ order });
  } catch (err) {
    console.error('getMyOrderById error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Please login first' });

    const orders = await Order.find({ userId }).lean();
    // newest first (dummy db has no sort; do simple fallback)
    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('getMyOrders error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getFoodPartnerOrders = async (req, res) => {
  try {
    const foodPartnerId = req.foodPartner?._id;
    if (!foodPartnerId) return res.status(401).json({ message: 'please login first' });

    const orders = await Order.find({ foodPartnerId }).lean();
    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('getFoodPartnerOrders error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Please login first' });

    const id = req.params?.id;
    if (!id) return res.status(400).json({ message: 'order id is required' });

    let order = await Order.findOne({ _id: id, userId });
    if (!order) order = await Order.findOne({ orderId: id, userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!CANCELLABLE_STATUSES.has(order.status)) {
      return res.status(400).json({ message: `Order cannot be cancelled (current status: ${order.status})` });
    }

    order.status = 'CANCELLED';
    await order.save();

    return res.status(200).json({ message: 'Order cancelled', order });
  } catch (err) {
    console.error('cancelMyOrder error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const cancelPartnerOrder = async (req, res) => {
  try {
    const foodPartnerId = req.foodPartner?._id;
    if (!foodPartnerId) return res.status(401).json({ message: 'please login first' });

    const id = req.params?.id;
    if (!id) return res.status(400).json({ message: 'order id is required' });

    let order = await Order.findOne({ _id: id, foodPartnerId });
    if (!order) order = await Order.findOne({ orderId: id, foodPartnerId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!CANCELLABLE_STATUSES.has(order.status)) {
      return res.status(400).json({ message: `Order cannot be cancelled (current status: ${order.status})` });
    }

    order.status = 'CANCELLED';
    await order.save();

    return res.status(200).json({ message: 'Order cancelled', order });
  } catch (err) {
    console.error('cancelPartnerOrder error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getFoodPartnerOrders,
  cancelMyOrder,
  cancelPartnerOrder,
};
