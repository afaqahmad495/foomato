import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const FoodPartnerRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Food Partner Register form submitted:');
    // Add API call for registration here
  };
  const navigate = useNavigate();
  const submit = async ()=>{
    const response = await api.post('/api/auth/foodpartner/register', formData);
   console.log(response.data) 
   navigate('/foodpartner/login')
  } 

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Food Partner Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="restaurantName">FullName</label>
            <input
              type="text"
              id="restaurantName"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactName">Contact Name</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" onClick={submit} className="auth-button">Register</button>
        </form>
        <p className="auth-redirect">
          Already have an account? <Link to="/foodpartner/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default FoodPartnerRegister;
    
