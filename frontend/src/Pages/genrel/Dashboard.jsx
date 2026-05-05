import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { api } from '../../lib/api';

const FoodBlob = () => (
  <svg className="food-blob" width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <defs>
      <linearGradient id="g1" x1="0" x2="1">
        <stop offset="0" stopColor="#ff9a66" />
        <stop offset="1" stopColor="#ff6e7f" />
      </linearGradient>
    </defs>
    <g>
      <ellipse cx="110" cy="110" rx="100" ry="60" fill="url(#g1)" opacity="0.95" />
      <g transform="translate(24,30)">
        <circle cx="70" cy="40" r="22" fill="#fff" opacity="0.12" />
        <path d="M30 100c20-24 60-20 90 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.12" />
      </g>
    </g>
  </svg>
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (mounted && res?.data) setUser(res.data.user || res.data);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="hero">
          <div className="hero-text">
            <h1 className="brand">Foomato</h1>
            <p className="tagline">Discover home-cooked food and local food partners near you.</p>
            <div className="hero-cta" aria-hidden={loading ? 'true' : 'false'}>
              <Link to="/user/login" className="btn primary">Explore Feed</Link>
              <Link to="/user/login" className="btn ghost">Saved</Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden>
            <FoodBlob />
          </div>
        </div>

        <div className="content">
          {loading ? (
            <div className="dash-loading">Checking session...</div>
          ) : user ? (
            <div className="welcome reveal">
              <h2>Welcome back{user.name ? `, ${user.name}` : ''}!</h2>
              <p>Explore fresh uploads, manage your saved items, and visit your profile.</p>
              <div className="dash-actions">
                <Link to="/home" className="btn primary">View Feed</Link>
                <Link to="/saved" className="btn">Saved</Link>
              </div>
            </div>
          ) : (
            <div className="guest reveal">
              <h2>Get started</h2>
              <p>Sign up or log in to like, save, and comment on food items.</p>

              <ul className="highlights">
                <li><strong>Curated feed</strong> — Short video food items from nearby food partners.</li>
                <li><strong>Save favorites</strong> — Bookmark items to view later.</li>
                <li><strong>Comment & interact</strong> — Share feedback with creators.</li>
              </ul>

              <div className="dash-actions">
                <Link to="/user/login" className="btn primary">Log in</Link>
                <Link to="/user/register" className="btn">Register</Link>
              </div>

              <div className="business-section">
                <h3>Are you a food partner?</h3>
                <p className="small">Create and manage your menu items, upload short food videos, and reach local customers.</p>
                <div className="dash-actions">
                  <Link to="/foodpartner/login" className="btn primary">Business Login</Link>
                  <Link to="/foodpartner/register" className="btn">Partner Register</Link>
                </div>
              </div>

              <p className="note">You can still browse the public feed without an account: <Link to="/home">Explore as guest</Link></p>
            </div>
          )}
        </div>

        <footer className="dash-footer">© {new Date().getFullYear()} Foomato — Local food, made fresh.</footer>
      </div>
    </div>
  );
};

export default Dashboard;
