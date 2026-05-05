const foodPartnerModel = require('../models/foodPartner.model')
const foodModel = require('../models/food.model')
const Order = require('../models/order.model')
const storageServices = require('../Services/storage.service')
const { v4: uuidv4 } = require('uuid');

function computeStats(foodItems, orders) {
    const reelsCount = Array.isArray(foodItems) ? foodItems.length : 0;
    const allowed = new Set(['PLACED', 'ACCEPTED', 'COMPLETED']);
    let totalMeals = 0;
    const customers = new Set();

    for (const o of orders || []) {
        if (!allowed.has(o.status)) continue;
        const qty = Number(o.quantity);
        if (Number.isFinite(qty) && qty > 0) totalMeals += qty;
        if (o.userId != null) customers.add(String(o.userId));
    }

    return {
        reelsCount,
        totalMeals,
        customersServed: customers.size,
    };
}

const foodPartnerProfile = async (req, res) =>{

    const FoodPartnerId = req.foodPartner._id;
    const foodPartner = await foodPartnerModel.findById(FoodPartnerId)
    const foodItemsByFoodPartner = await foodModel.find({foodPartner: FoodPartnerId})
    if(!foodPartner){
        return res.status(404).json({
            message: "food partner not found"
        })
    }
    const orders = await Order.find({ foodPartnerId: FoodPartnerId }).lean();
    const stats = computeStats(foodItemsByFoodPartner, orders);
    res.status(200).json({
        message: "food partner fetched",
        foodPartner:{
            ...foodPartner.toObject(),
            foodItems: foodItemsByFoodPartner,
            stats,
        }
        
    })
}
const getFoodPartnerById = async (req, res) => {
    const foodPartnerId = req.params.id || req.foodPartner._id;
    try {
        const foodPartner = await foodPartnerModel.findById(foodPartnerId);
        const foodItemsByFoodPartner = await foodModel.find({ foodPartner: foodPartnerId });    
        if (!foodPartner) {
            return res.status(404).json({ message: 'Food partner not found' });
        }
        const orders = await Order.find({ foodPartnerId }).lean();
        const stats = computeStats(foodItemsByFoodPartner, orders);
        res.status(200).json({
            message: 'Food partner fetched successfully',
            foodPartner: {
                ...foodPartner.toObject(),
                foodItems: foodItemsByFoodPartner,
                stats,
            }
        });
    } catch (error) {
        console.error('Error fetching food partner:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfilePhoto = async (req, res) => {
    try {
        const foodPartnerId = req.foodPartner?._id;
        if (!foodPartnerId) return res.status(401).json({ message: 'please login first' });

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'photo file is required' });
        }

        const fileUploadResult = await storageServices.uploadFile(req.file.buffer, `fp-${uuidv4()}`);
        const url = fileUploadResult && fileUploadResult.url ? String(fileUploadResult.url) : '';
        if (!url) return res.status(502).json({ message: 'Storage upload failed' });

        const fp = await foodPartnerModel.findById(foodPartnerId);
        if (!fp) return res.status(404).json({ message: 'Food partner not found' });

        fp.profilePic = url;
        await fp.save();

        return res.status(200).json({ message: 'Profile photo updated', foodPartner: fp });
    } catch (err) {
        console.error('updateProfilePhoto error:', { code: err?.code, message: err?.message });
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

module.exports = {
    foodPartnerProfile,
    getFoodPartnerById,
    updateProfilePhoto,
}
