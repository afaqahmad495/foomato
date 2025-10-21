import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/auth/me', { withCredentials: true });
        if (mounted && res?.data) setUser(res.data.user || res.data);
      } catch (err) {
        // not logged in or endpoint unavailable -> treat as guest
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
        <h1>Foomato</h1>
        <p className="tagline">Discover home-cooked food and local food partners near you.</p>

        {loading ? (
          <div className="dash-loading">Checking session...</div>
        ) : user ? (
          <div className="welcome">
            <h2>Welcome back{user.name ? `, ${user.name}` : ''}!</h2>
            <p>Explore fresh uploads, manage your saved items, and visit your profile.</p>
            <div className="dash-actions">
              <Link to="/home" className="btn primary">View Feed</Link>
              <Link to="/saved" className="btn">Saved</Link>
            </div>
          </div>
        ) : (
          <div className="guest">
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

        <footer className="dash-footer">© {new Date().getFullYear()} Foomato — Local food, made fresh.</footer>
      </div>
    </div>
  );
};

export default Dashboard;
