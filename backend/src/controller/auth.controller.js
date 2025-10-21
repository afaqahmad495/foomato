const userModel = require('../models/user.model');
const foodPartnerModel = require('../models/foodPartner.model')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

//user auth APIs
const registerUser = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        const isUserExisit = await userModel.findOne({ email });
        if (isUserExisit) {
            return res.status(400).json({ message: 'User already exist' })
        }


        if (!username || !email || !password || !phone) {
            return res.status(400).json({ message: 'Please fill all the fields ' })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            username,
            email,
            password: hashedPassword,
            phone       

        })
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.jwtSecret, { expiresIn: '1h' });
        res.cookie("token", token)

        res.status(201).json({
            message: 'User register successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone
            }
        })
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' })
    }
}
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' })
        }
        
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "invalid email or password " })
        }

        const token = jwt.sign({ id: user._id }, process.env.jwtSecret, { expiresIn: '1h' });
        res.cookie("token", token)

        return res.json({
            message: 'user login successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                token: token
            }
        })


    } catch (err) {
        return res.status(500).json({ message: 'Internal server error', err })
    }
}
const logoutUser = async (req, res) =>{
    res.clearCookie("token");
    return res.json({ message: 'User logout successfully' });
}

//foodPartner auth APIs
const registerFoodPartner = async (req,res) =>{
    try {
        const { name, contactName, email, password, phone, address } = req.body;
        const isFoodPartnerExists = await foodPartnerModel.findOne({ email });
        if (isFoodPartnerExists) {
            return res.status(400).json({ message: 'FoodPartner already exist' })
        }

        if (!name || !contactName || !email || !password || !phone || !address) {
            return res.status(400).json({ message: 'Please fill all the fields ' })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const foodPartner = new foodPartnerModel({
            name,
            contactName,
            email,
            password: hashedPassword,
            phone,
            address

        })
        await foodPartner.save();
        const token = jwt.sign({ id: foodPartner._id }, process.env.jwtSecret, { expiresIn: '1h' });
        res.cookie("token", token)

        res.status(201).json({
            message: 'foodPartner register successfully',
            foodPartner: {
                id: foodPartner._id,
                name: foodPartner.name,
                contactName: foodPartner.contactName,
                email: foodPartner.email,
                phone: foodPartner.phone,
                address: foodPartner.address
            }
        })
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' })
    }
}
const loginFoodPartner = async (req, res) =>{
    try {
        const { email, password } = req.body
        const foodPartner = await foodPartnerModel.findOne({ email });
        if (!foodPartner) {
            return res.status(400).json({ message: 'FoodPartner not found' })
        }
        const isPasswordValid = await bcrypt.compare(password, foodPartner.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "invalid email or password " })
        }

        const token = jwt.sign({ id: foodPartner._id }, process.env.jwtSecret);
        res.cookie("token", token)

        return res.json({
            message: 'foodPartner login successfully',
            foodPartner: {
                id: foodPartner._id,
                name: foodPartner.name,
                email: foodPartner.email,
                
            }
        })


    } catch (err) {
        return res.status(500).json({ message: 'Internal server error', err })
    }
}

const logoutFoodPartner = (req, res) =>{
    res.clearCookie("token");
    return res.json({message: "foodPartner logout successfully"})
}


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner
};

