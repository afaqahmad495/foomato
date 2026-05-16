import React from 'react'
import UserRegister from '../auth/UserRegister';
import UserLogin from '../auth/UserLogin';
import FoodPartnerRegister from '../auth/FoodPartnerRegister';
import FoodPartnerLogin from '../auth/FoodPartnerLogin';
import ForgotPassword from '../auth/ForgotPassword';
import ResetPassword from '../auth/ResetPassword';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Home from '../genrel/Home';
import Saved from '../genrel/Saved';
import CreateFood from '../food-partner/CreateFood';
import ProfileFoodPartner from '../food-partner/ProfileFoodPartner';
import FoodPartnerProfileForUser from '../components/FoodPartnerProfileForUser';
import Dashboard from '../genrel/Dashboard';
import Checkout from '../genrel/Checkout';
import OrderSuccess from '../genrel/OrderSuccess';
import Orders from '../genrel/Orders';
import PartnerOrders from '../food-partner/PartnerOrders';
import Comments from '../genrel/Comments';

const AppRoute = () => {
  return (
    <Router>
        <Routes>
            <Route path='/user/register' element={<UserRegister/>} />
            <Route path='/user/login' element={<UserLogin/>} />
            <Route path='/user/forgot-password' element={<ForgotPassword type='user' />} />
            <Route path='/user/reset-password/:token' element={<ResetPassword type='user' />} />
            <Route path='/foodpartner/register' element={<FoodPartnerRegister/>} />
            <Route path='/foodpartner/login' element={<FoodPartnerLogin/>} />
            <Route path='/foodpartner/forgot-password' element={<ForgotPassword type='foodpartner' />} />
            <Route path='/foodpartner/reset-password/:token' element={<ResetPassword type='foodpartner' />} />
            <Route path='/home' element={<Home/>} />
            <Route path='/saved' element={<Saved/>} />
            <Route path='/create-food' element={<CreateFood/>} />
            <Route path='/profile-foodpartner' element={<ProfileFoodPartner/>} />
            <Route path='/profile-foodpartner/:id' element={<FoodPartnerProfileForUser/>} />
            <Route path='/checkout/:foodId' element={<Checkout/>} />
            <Route path='/order-success' element={<OrderSuccess/>} />
            <Route path='/orders' element={<Orders/>} />
            <Route path='/partner-orders' element={<PartnerOrders/>} />
            <Route path='/comments/:foodId' element={<Comments/>} />
            <Route path='/' element={<Dashboard/>} />
           
        </Routes>

    </Router> 
  )
}

export default AppRoute
