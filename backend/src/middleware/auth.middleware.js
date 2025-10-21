const jwt = require('jsonwebtoken');
const foodPartnerModel = require('../models/foodPartner.model')
const User = require('../models/user.model');

const authFoodPartnerMiddleware = async (req, res, next) => {

    const token = req.cookies.token
    if(!token) {
      return res.status(401).json({ message: 'please login first' });
    }

  try {
    

    const decoded = jwt.verify(token, process.env.jwtSecret);
    const foodPartner = await foodPartnerModel.findById(decoded.id);
    if (!foodPartner) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.foodPartner = foodPartner;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Internal server error' });
  }
};

const authUserMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const decoded = jwt.verify(token, process.env.jwtSecret);
        //console.log(decoded)
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = user;   
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Internal server error 1' });
    }
}

module.exports = { 
    authFoodPartnerMiddleware,
    authUserMiddleware,
    };
