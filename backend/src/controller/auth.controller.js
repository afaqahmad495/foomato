const crypto = require('crypto');
const userModel = require('../models/user.model');
const foodPartnerModel = require('../models/foodPartner.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function getCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000,
    };
}

function createResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    return { resetToken, hashedToken };
}

function getFrontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
}

function buildResetUrl(type, token) {
    return `${getFrontendUrl()}/${type}/reset-password/${token}`;
}

async function handleForgotPassword(model, type, email, res) {
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const account = await model.findOne({ email });
    const genericMessage = 'If the email exists, a password reset link has been sent.';

    if (!account) {
        return res.json({ message: genericMessage });
    }

    const { resetToken, hashedToken } = createResetToken();
    account.passwordResetToken = hashedToken;
    account.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await account.save({ validateBeforeSave: false });

    const resetUrl = buildResetUrl(type, resetToken);
    console.log(`[Password Reset] ${type} password reset for ${email}: ${resetUrl}`);

    const response = { message: genericMessage };
    if (process.env.NODE_ENV !== 'production') {
        response.resetUrl = resetUrl;
    }

    return res.json(response);
}

async function handleResetPassword(model, token, password, res) {
    if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const account = await model.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!account) {
        return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    account.password = await bcrypt.hash(password, 10);
    account.passwordResetToken = undefined;
    account.passwordResetExpires = undefined;

    await account.save();

    return res.json({ message: 'Password reset successfully' });
}

//user auth APIs
const registerUser = async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        if (!username || !email || !password || !phone) {
            return res.status(400).json({ message: 'Please fill all the fields ' });
        }

        const isUserExisit = await userModel.findOne({ email });
        if (isUserExisit) {
            return res.status(400).json({ message: 'User already exist' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            username,
            email,
            password: hashedPassword,
            phone,
        });
        await user.save();
        const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('user_token', token, getCookieOptions());

        res.status(201).json({
            message: 'User register successfully',
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                token,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'invalid email or password ' });
        }

        const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('user_token', token, getCookieOptions());

        return res.json({
            message: 'user login successfully',
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                token: token,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error', err });
    }
};
const logoutUser = async (req, res) => {
    res.clearCookie('token');
    res.clearCookie('user_token');
    return res.json({ message: 'User logout successfully' });
};

const forgotPasswordUser = async (req, res) => {
    try {
        return await handleForgotPassword(userModel, 'user', req.body.email, res);
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const resetPasswordUser = async (req, res) => {
    try {
        return await handleResetPassword(userModel, req.body.token, req.body.password, res);
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

//foodPartner auth APIs
const registerFoodPartner = async (req, res) => {
    try {
        const { name, contactName, email, password, phone, address } = req.body;
        if (!name || !contactName || !email || !password || !phone || !address) {
            return res.status(400).json({ message: 'Please fill all the fields ' });
        }

        const isFoodPartnerExists = await foodPartnerModel.findOne({ email });
        if (isFoodPartnerExists) {
            return res.status(400).json({ message: 'FoodPartner already exist' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const foodPartner = new foodPartnerModel({
            name,
            contactName,
            email,
            password: hashedPassword,
            phone,
            address,
        });
        await foodPartner.save();
        const token = jwt.sign({ id: foodPartner._id, role: 'foodPartner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('foodpartner_token', token, getCookieOptions());

        res.status(201).json({
            message: 'foodPartner register successfully',
            success: true,
            foodPartner: {
                id: foodPartner._id,
                name: foodPartner.name,
                contactName: foodPartner.contactName,
                email: foodPartner.email,
                phone: foodPartner.phone,
                address: foodPartner.address,
                token,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const loginFoodPartner = async (req, res) => {
    try {
        const { email, password } = req.body;
        const foodPartner = await foodPartnerModel.findOne({ email });
        if (!foodPartner) {
            return res.status(400).json({ message: 'FoodPartner not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, foodPartner.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'invalid email or password ' });
        }

        const token = jwt.sign({ id: foodPartner._id, role: 'foodPartner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('foodpartner_token', token, getCookieOptions());

        return res.json({
            message: 'foodPartner login successfully',
            success: true,
            foodPartner: {
                id: foodPartner._id,
                name: foodPartner.name,
                email: foodPartner.email,
                token,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error', err });
    }
};

const forgotPasswordFoodPartner = async (req, res) => {
    try {
        return await handleForgotPassword(foodPartnerModel, 'foodpartner', req.body.email, res);
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const resetPasswordFoodPartner = async (req, res) => {
    try {
        return await handleResetPassword(foodPartnerModel, req.body.token, req.body.password, res);
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const logoutFoodPartner = (req, res) => {
    res.clearCookie('token');
    res.clearCookie('foodpartner_token');
    return res.json({ message: 'foodPartner logout successfully' });
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    forgotPasswordUser,
    resetPasswordUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner,
    forgotPasswordFoodPartner,
    resetPasswordFoodPartner,
};
