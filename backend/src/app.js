const express = require('express')
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes')
const foodRoutes = require('./routes/food.routes')
const foodPartnerRoutes = require('./routes/foodPartner.route')
const orderRoutes = require('./routes/order.routes')
const commentRoutes = require('./routes/comment.routes')
const paymentRoutes = require('./routes/payment.routes')
const stripeController = require('./controller/stripe.controller')
const cors = require('cors')
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
// Stripe webhook needs raw body (must be registered before express.json)
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeController.stripeWebhook)
app.use(express.json());
app.use(cookieParser());

//auth api
app.use('/api/auth', authRoutes)
//food API's
app.use('/api/food' , foodRoutes)
//food partner API's
app.use('/api/food-partner' , foodPartnerRoutes)
// orders API's
app.use('/api/orders', orderRoutes)
// comments API's
app.use('/api/comments', commentRoutes)
// payments API's
app.use('/api/payments', paymentRoutes)



module.exports = app;
