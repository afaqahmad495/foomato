const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const foodController = require('../controller/food.controller');
const FavouriteFoodModel = require('../models/favourite.model');
const multer = require('multer')

    const upload = multer({
        storage: multer.memoryStorage(), 
    })
     //create food route [protected]
    router.post('/', authMiddleware.authFoodPartnerMiddleware,upload.single("video"), foodController.createFood );

    //user fatch food data [protected]
    router.get('/get-food-item', authMiddleware.authUserMiddleware, foodController.getUserFood);

    // favourites: add (POST), remove (DELETE), list (GET)
    router.post('/favourite/:id', authMiddleware.authUserMiddleware, foodController.addFavouriteFood);
    router.delete('/favourite/:id', authMiddleware.authUserMiddleware, foodController.removeFavouriteFood);
    router.get('/favourites', authMiddleware.authUserMiddleware, foodController.getFavourites);

    // save food 
    router.post('/save/:id', authMiddleware.authUserMiddleware, foodController.saveFood);
    // get saved foods for user
    router.get('/save', authMiddleware.authUserMiddleware, foodController.getSavedFoods);

module.exports = router; 