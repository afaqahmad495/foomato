import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const FoodPartnerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const navigate = useNavigate();

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/foodpartner/login', formData);
      alert(response.data.message);
      navigate('/profile-foodpartner/');
    } catch (err) {
      alert('Invalid email or password');
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Food Partner Login</h2>
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
          Don't have an account? <Link to="/foodpartner/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default FoodPartnerLogin;
