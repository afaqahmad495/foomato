import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import {useLocation, useNavigate} from 'react-router-dom'
import { api } from '../../lib/api';

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
  const location = useLocation();

  const nextPath = (() => {
    const params = new URLSearchParams(location.search || '');
    const next = params.get('next');
    return next && next.startsWith('/') ? next : '/home';
  })();

  const submit = async ()=>{
    try {
      const response = await api.post("/api/auth/user/login",formData)
      const token = response.data?.user?.token;
      const userId = response.data?.user?.id;
      if (token) localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_role', 'user');
      if (userId) localStorage.setItem('userId', String(userId));

      alert(response.data?.message || 'Login successful');
      navigate(nextPath);
    } catch (err) {
      alert(err?.response?.data?.message || 'Invalid email or password');
    }
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
          <Link to="/user/forgot-password">Forgot password?</Link>
        </p>
        <p className="auth-redirect">
          Don't have an account? <Link to="/user/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
