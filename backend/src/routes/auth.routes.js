const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

//user auth routes
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.loginUser);
router.post('/user/logout', authController.logoutUser);

//foodpartner auth routes
router.post('/foodpartner/register', authController.registerFoodPartner);
router.post('/foodpartner/login', authController.loginFoodPartner);
router.post('/foodpartner/logout', authController.logoutFoodPartner);



module.exports = router;

