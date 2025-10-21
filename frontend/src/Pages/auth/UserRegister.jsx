import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';



const UserRegister = () => {

   

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: ''
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

    
      
  
    const handleSubmit =async (e) => {
      e.preventDefault();
      console.log("form submitted")
    }
     const navigate = useNavigate();
    const submit = async () => {
      try {
        const response = await axios.post('http://localhost:3000/api/auth/user/register', formData,
          {withCredentials: true}
        )
        console.log(response.data.message)
        navigate('/user/login');
        if(response.data.success){
          alert('Registration successful');
        }else{
          alert(response.data.message);
        }
      } catch (error) {
        console.log(error)
      }
    }

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>User Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="username"
              value={formData.username}
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
          Already have an account? <Link to="/user/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default UserRegister;