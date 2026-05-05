const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const foodPartnerController = require('../controller/foodPartner.controller')
const multer = require('multer')

const upload = multer({
    storage: multer.memoryStorage(),
})



router.get('/profile-foodPartner', authMiddleware.authFoodPartnerMiddleware, foodPartnerController.foodPartnerProfile )    
router.get('/profile-foodPartner/:id', authMiddleware.authUserMiddleware, foodPartnerController.getFoodPartnerById )    
router.patch('/profile-photo', authMiddleware.authFoodPartnerMiddleware, upload.single('photo'), foodPartnerController.updateProfilePhoto)

module.exports = router; 
