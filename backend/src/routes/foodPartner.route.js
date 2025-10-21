const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const foodPartnerController = require('../controller/foodPartner.controller')



router.get('/profile-foodPartner', authMiddleware.authFoodPartnerMiddleware, foodPartnerController.foodPartnerProfile )    
router.get('/profile-foodPartner/:id', authMiddleware.authUserMiddleware, foodPartnerController.getFoodPartnerById )    

module.exports = router; 