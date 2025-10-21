import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'
import '../../App.css';
import {useNavigate} from 'react-router-dom'

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    console.log('Login form submitted:');
    // Add API call for login here
  };
  const navigate = useNavigate();
  const submit = async ()=>{
    const response = await  axios.post("http://localhost:3000/api/auth/user/login",formData,{withCredentials: true})
    console.log(response.data)
    if(response.data.success){
      alert('Login successful');
    }else{
      alert(response.data.message);
    }
    navigate('/home');
  }

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>User Login</h2>
        <form onSubmit={handleSubmit}>
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
          <button type="submit" onClick={submit} className="auth-button">Login</button>
        </form>
        <p className="auth-redirect">
          Don't have an account? <Link to="/user/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;