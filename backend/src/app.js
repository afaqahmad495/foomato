const express = require('express')
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes')
const foodRoutes = require('./routes/food.routes')
const foodPartnerRoutes = require('./routes/foodPartner.route')
const orderRoutes = require('./routes/order.routes')
const commentRoutes = require('./routes/comment.routes')
const paymentRoutes = require('./routes/payment.routes')
const aiRoutes = require('./routes/ai.routes')
const stripeController = require('./controller/stripe.controller')
const cors = require('cors')
const app = express();

function isAllowedOrigin(origin) {
    if (!origin) return true; // allow curl/postman/mobile native without Origin

    const allowList = new Set([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'capacitor://localhost',
        'ionic://localhost',
    ]);
    if (allowList.has(origin)) return true;

    // Allow local LAN access during development (Android device on same Wi‑Fi).
    // Matches http(s)://192.168.x.x(:port) and http(s)://10.x.x.x(:port) and http(s)://172.16-31.x.x(:port)
    const lanPattern =
        /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
    if (lanPattern.test(origin)) return true;

    const envFrontend = process.env.FRONTEND_URL;
    if (envFrontend && origin === envFrontend) return true;

    return false;
}

app.use(cors({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
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
// AI services API's
app.use('/api/ai', aiRoutes)



module.exports = app;
