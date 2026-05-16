const jwt = require('jsonwebtoken');
const foodPartnerModel = require('../models/foodPartner.model')
const User = require('../models/user.model');

function extractBearerToken(req) {
    const header = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (!header) return null;
    const value = String(header).trim();
    if (!value.toLowerCase().startsWith('bearer ')) return null;
    const token = value.slice(7).trim();
    return token || null;
}

const authFoodPartnerMiddleware = async (req, res, next) => {

    const token = req.cookies.foodpartner_token || extractBearerToken(req);
    if(!token) {
      return res.status(401).json({ message: 'please login first' });
    }

  try {
    

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && decoded.role && decoded.role !== 'foodPartner') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const foodPartner = await foodPartnerModel.findById(decoded.id);
    if (!foodPartner) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.foodPartner = foodPartner;
    next();
  } catch (error) {
    if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('authFoodPartnerMiddleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const authUserMiddleware = async (req, res, next) => {
    const token = req.cookies.user_token || extractBearerToken(req);
    
    if (!token) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.role && decoded.role !== 'user') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        //console.log(decoded)
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = user;   
        next();
    } catch (error) {
        if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        console.error('authUserMiddleware error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { 
    authFoodPartnerMiddleware,
    authUserMiddleware,
    };
