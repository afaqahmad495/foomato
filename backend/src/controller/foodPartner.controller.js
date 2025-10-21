const foodPartnerModel = require('../models/foodPartner.model')
const foodModel = require('../models/food.model')

 
const foodPartnerProfile = async (req, res) =>{

    const FoodPartnerId = req.foodPartner._id;
    console.log(FoodPartnerId);
    const foodPartner = await foodPartnerModel.findById(FoodPartnerId)
    const foodItemsByFoodPartner = await foodModel.find({foodPartner: FoodPartnerId})
    if(!foodPartner){
        return res.status(404).json({
            message: "food partner not found"
        })
    }
    res.status(200).json({
        message: "food partner fetched",
        foodPartner:{
            ...foodPartner.toObject(),
            foodItems: foodItemsByFoodPartner
        }
        
    })
}
const getFoodPartnerById = async (req, res) => {
    const foodPartnerId = req.params.id || req.foodPartner._id;
    console.log(foodPartnerId);
    try {
        const foodPartner = await foodPartnerModel.findById(foodPartnerId);
        const foodItemsByFoodPartner = await foodModel.find({ foodPartner: foodPartnerId });    
        if (!foodPartner) {
            return res.status(404).json({ message: 'Food partner not found' });
        }
        res.status(200).json({
            message: 'Food partner fetched successfully',
            foodPartner: {
                ...foodPartner.toObject(),
                foodItems: foodItemsByFoodPartner
            }
        });
    } catch (error) {
        console.error('Error fetching food partner:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    foodPartnerProfile,
    getFoodPartnerById
}
