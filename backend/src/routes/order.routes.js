const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const orderController = require('../controller/order.controller');

// user: place order + list own
router.post('/', authMiddleware.authUserMiddleware, orderController.createOrder);
router.get('/my', authMiddleware.authUserMiddleware, orderController.getMyOrders);
router.patch('/:id/cancel', authMiddleware.authUserMiddleware, orderController.cancelMyOrder);

// food partner: list incoming orders for their items
router.get('/partner', authMiddleware.authFoodPartnerMiddleware, orderController.getFoodPartnerOrders);
router.patch('/partner/:id/cancel', authMiddleware.authFoodPartnerMiddleware, orderController.cancelPartnerOrder);

// user: fetch single order (keep after /partner routes to avoid conflicts)
router.get('/:id', authMiddleware.authUserMiddleware, orderController.getMyOrderById);

module.exports = router;
