const express = require('express')
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes')
const foodRoutes = require('./routes/food.routes')
const foodPartnerRoutes = require('./routes/foodPartner.route')
const cors = require('cors')
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

//auth api
app.use('/api/auth', authRoutes)
//food API's
app.use('/api/food' , foodRoutes)
//food partner API's
app.use('/api/food-partner' , foodPartnerRoutes)



module.exports = app;
