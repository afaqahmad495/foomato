import React from 'react'
import UserRegister from '../auth/UserRegister';
import UserLogin from '../auth/UserLogin';
import FoodPartnerRegister from '../auth/FoodPartnerRegister';
import FoodPartnerLogin from '../auth/FoodPartnerLogin';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Home from '../genrel/Home';
import Saved from '../genrel/Saved';
import CreateFood from '../food-partner/CreateFood';
import ProfileFoodPartner from '../food-partner/ProfileFoodPartner';
import FoodPartnerProfileForUser from '../components/FoodPartnerProfileForUser';
import Dashboard from '../genrel/Dashboard';

const AppRoute = () => {
  return (
    <Router>
        <Routes>
            <Route path='/user/register' element={<UserRegister/>} />
            <Route path='/user/login' element={<UserLogin/>} />
            <Route path='/foodpartner/register' element={<FoodPartnerRegister/>} />
            <Route path='/foodpartner/login' element={<FoodPartnerLogin/>} />
            <Route path='/home' element={<Home/>} />
            <Route path='/saved' element={<Saved/>} />
            <Route path='/create-food' element={<CreateFood/>} />
            <Route path='/profile-foodpartner' element={<ProfileFoodPartner/>} />
            <Route path='/profile-foodpartner/:id' element={<FoodPartnerProfileForUser/>} />
            <Route path='/' element={<Dashboard/>} />
           
        </Routes>

    </Router> 
  )
}

export default AppRoute