const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

//user auth routes
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.loginUser);
router.post('/user/logout', authController.logoutUser);
router.post('/user/forgot-password', authController.forgotPasswordUser);
router.post('/user/reset-password', authController.resetPasswordUser);

//foodpartner auth routes
router.post('/foodpartner/register', authController.registerFoodPartner);
router.post('/foodpartner/login', authController.loginFoodPartner);
router.post('/foodpartner/logout', authController.logoutFoodPartner);
router.post('/foodpartner/forgot-password', authController.forgotPasswordFoodPartner);
router.post('/foodpartner/reset-password', authController.resetPasswordFoodPartner);

module.exports = router;

