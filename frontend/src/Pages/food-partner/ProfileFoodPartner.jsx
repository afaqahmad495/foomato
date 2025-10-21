import React, { useState, useEffect } from 'react';
import '../../App.css';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Link }  from 'react-router-dom'

const ProfileFoodPartner = (req,res) => {
  
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); 
  
  useEffect(() => {
    // Fetch food partner profile data
    const fetchProfile = async () => {
      // Check if id exists
      
      
      try {
        const response = await axios.get(`http://localhost:3000/api/food-partner/profile-foodPartner`, {
          withCredentials: true
        });
        
        setProfile(response.data.foodPartner);
        setVideos(response.data.foodPartner.foodItems);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response && error.response.status === 401) {
          setError('Please log in to view this profile');
        } else if (error.response && error.response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Failed to load profile. Please try again.');
        }
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);
  console.log(videos);
  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="login-redirect-button"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-header-top">
          <div className="profile-logo">
            {/* Restaurant logo will go here */}
          </div>
          <div className="profile-info">
            <h2 className="business-name">{profile?.name || 'Tasty Delights'}</h2>
            <p className="business-address">{profile?.address || '123 Food Street, Cuisine City'}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-value">43</div>
            <div className="stat-label">Total Meals</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">15K</div>
            <div className="stat-label">Customers Served</div>
          </div>
        </div>
      </div>
      
      <div className="profile-content">
        <h3 className="gallery-title">Food Gallery</h3>
        <div className="video-grid">
          
          {videos?.map((v) => (
            <div className="gallery-item" key={v._id}>
              <div className="gallery-item-content">
                <video 
                  src={v.video} 
                  alt={`Video ${v._id}`} 
                  className="gallery-image" muted autoPlay
                />
                <div className="gallery-overlay">
                  <span className="gallery-item-title">{v.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="profile-footer">
        <Link className="action-button primary" to="/create-food">Add New Item</Link>
        <Link className="action-button secondary"   to="/edit-profile">Edit Profile</Link>
      </div>
    </div>
  );
};

export default ProfileFoodPartner;