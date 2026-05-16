import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const ForgotPassword = ({ type }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pageTitle = type === 'foodpartner' ? 'Food Partner' : 'User';
  const loginPath = type === 'foodpartner' ? '/foodpartner/login' : '/user/login';
  const registerPath = type === 'foodpartner' ? '/foodpartner/register' : '/user/register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetLink('');
    setLoading(true);

    try {
      const response = await api.post(`/api/auth/${type}/forgot-password`, { email });
      setMessage(response.data.message || 'If your email exists, a reset link was sent.');
      if (response.data.resetUrl) {
        setResetLink(response.data.resetUrl);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>{pageTitle} Forgot Password</h2>
        <p>Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {message && <p className="auth-success">{message}</p>}
        {resetLink && (
          <div className="auth-info">
            <p>Use this link to reset your password:</p>
            <a href={resetLink} target="_blank" rel="noreferrer">
              {resetLink}
            </a>
          </div>
        )}
        {error && <p className="auth-error">{error}</p>}

        <p className="auth-redirect">
          Remembered your password? <Link to={loginPath}>Login here</Link>
        </p>
        <p className="auth-redirect">
          Need an account? <Link to={registerPath}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
