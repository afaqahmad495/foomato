const foodModel = require('../models/food.model')
const storageServices = require('../Services/storage.service')
const {v4: uuidv4} = require('uuid');
const FavouriteFoodModel = require('../models/favourite.model');
const saveFoodModel = require('../models/saveFood.model');
const CommentModel = require('../models/comment.model');

const createFood = async (req, res) =>{
    try {
        if (!req.body || !req.body.name || !req.body.description) {
            return res.status(400).json({ message: 'name and description are required' });
        }

        const priceRaw = req.body.price;
        const price = Number(priceRaw);
        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).json({ message: 'price is required and must be a valid number' });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'video file is required' });
        }

        const fileUploadResult = await storageServices.uploadFile(req.file.buffer, uuidv4());

        const foodItem = await foodModel.create({
            name: req.body.name,
            price,
            description: req.body.description,
            video: fileUploadResult.url,
            foodPartner: req.foodPartner._id
        });

        return res.status(201).json({
            message: "food item created",
            food: foodItem
        });
    } catch (err) {
        console.error('createFood error:', { code: err?.code, message: err?.message });
        const details = err && err.message ? String(err.message) : undefined;
        const detailsLower = details ? details.toLowerCase() : '';
        const isStorageIssue =
            err?.code === 'IMAGEKIT_NOT_CONFIGURED' ||
            err?.code === 'IMAGEKIT_UPLOAD_FAILED' ||
            detailsLower.includes('imagekit') ||
            detailsLower.includes('authenticated') ||
            detailsLower.includes('authentication') ||
            detailsLower.includes('privatekey') ||
            detailsLower.includes('publickey') ||
            detailsLower.includes('urlendpoint') ||
            detailsLower.includes('credentials') ||
            detailsLower.includes('not configured');

        return res.status(isStorageIssue ? 502 : 500).json({
            message: isStorageIssue ? 'Storage upload failed (check ImageKit credentials in backend/.env)' : 'Internal server error',
            ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
        });
    }
}

const getUserFood = async (req, res) =>{
    try {
        const foodItems = await foodModel.find().lean();

        // For each food item fetch counts for favourites (likes), saves and comments
        const enriched = await Promise.all(foodItems.map(async fi => {
            const id = fi._id;
            const [likesCount, savesCount, commentsCount] = await Promise.all([
                FavouriteFoodModel.countDocuments({ foodId: id }),
                saveFoodModel.countDocuments({ foodId: id }),
                CommentModel.countDocuments({ foodId: id }),
            ]);

            return {
                ...fi,
                likesCount,
                savesCount,
                commentsCount,
            };
        }));

        return res.status(200).json({ message: "food items fetched", foodItems: enriched });
    } catch (err) {
        console.error('getUserFood error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const addFavouriteFood = async (req, res) => {
    try {
        // req.user is set by auth middleware and is the user document
        const userId = req.user._id;
        // food id comes from route params
        const foodId = req.params.id;

        if (!foodId) {
            return res.status(400).json({ message: 'Missing food id' });
        }

        // Check if the food item is already in favourites
        const existingFavourite = await FavouriteFoodModel.findOne({ userId, foodId });
        if (existingFavourite) {
            return res.status(400).json({ message: 'Food item is already in favourites' });
        }

        const favourite = new FavouriteFoodModel({ userId, foodId });
        await favourite.save();
        return res.status(200).json({ message: 'Food item added to favourites', favourite });
    } catch (error) {
        console.error('addFavouriteFood error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const removeFavouriteFood = async (req, res) => {
    try {
        const userId = req.user._id;
        const foodId = req.params.id;
        if (!foodId) {
            return res.status(400).json({ message: 'Missing food id' });
        }
        const deleted = await FavouriteFoodModel.findOneAndDelete({ userId, foodId });
        if (!deleted) {
            return res.status(404).json({ message: 'Favourite not found' });
        }
        return res.status(200).json({ message: 'Favourite removed' });
    } catch (error) {
        console.error('removeFavouriteFood error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getFavourites = async (req, res) => {
    try {
        const userId = req.user._id;
        const favs = await FavouriteFoodModel.find({ userId }).select('foodId -_id');
        // Return array of foodIds
        const favourites = favs.map(f => String(f.foodId));
        return res.status(200).json({ favourites });
    } catch (error) {
        console.error('getFavourites error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const saveFood = async (req, res) =>{
    const userId = req.user._id;
    const foodId = req.params.id

    const isSaveFood = await saveFoodModel.findOne({
        userId,
        foodId
    });
    if(isSaveFood){
        const deleted = await saveFoodModel.findOneAndDelete({ userId, foodId });
        if (!deleted) {
            return res.status(404).json({ message: 'Saved food item not found' });
        }
        return res.status(200).json({ message: 'Food item unsaved' });
    }

    
    const saveFoodCreate = new saveFoodModel({ userId, foodId });
    await saveFoodCreate.save();
    return res.status(200).json({ message: 'Food item saved', saveFoodCreate });


}

const getSavedFoods = async (req, res) => {
    try {
        const userId = req.user._id;
        const saved = await saveFoodModel.find({ userId }).populate({ path: 'foodId' });
        // Map to actual food documents (foodId may be null if deleted)
        const foods = saved
            .map(s => s.foodId)
            .filter(Boolean);
        return res.status(200).json({ savedFoods: foods });
    } catch (error) {
        console.error('getSavedFoods error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = {
    createFood,
    getUserFood,
    addFavouriteFood,
    removeFavouriteFood,
    getFavourites,
    saveFood
    ,getSavedFoods
}
