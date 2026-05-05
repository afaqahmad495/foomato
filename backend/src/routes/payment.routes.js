const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const stripeController = require('../controller/stripe.controller');

router.post('/stripe/checkout-session', authMiddleware.authUserMiddleware, stripeController.createCheckoutSession);

module.exports = router;

