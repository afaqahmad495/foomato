import React, { useState, useEffect } from 'react';
import '../../App.css';
import { useParams, useNavigate } from 'react-router-dom';
import { Link }  from 'react-router-dom'
import { api } from '../../lib/api';

function formatCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.trunc(n));
  if (abs < 1_000_000) return `${Math.round((n / 1000) * 10) / 10}K`.replace('.0K', 'K');
  if (abs < 1_000_000_000) return `${Math.round((n / 1_000_000) * 10) / 10}M`.replace('.0M', 'M');
  return `${Math.round((n / 1_000_000_000) * 10) / 10}B`.replace('.0B', 'B');
}

const ProfileFoodPartner = () => {
  
  const {id} = useParams();  
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
        const response = await api.get(`/api/food-partner/profile-foodPartner/${id}`);
        
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
  }, [id]);
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

  const stats = profile?.stats || {};
  const statsItems = [
    { label: 'Reels', value: stats.reelsCount ?? (videos?.length || 0) },
    { label: 'Total Meals', value: stats.totalMeals ?? 0 },
    { label: 'Customers Served', value: stats.customersServed ?? 0 },
  ];
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-header-top">
          <div className="profile-logo">
            {profile?.profilePic ? (
              <img src={profile.profilePic} alt={`${profile?.name || 'Store'} profile`} />
            ) : null}
          </div>
          <div className="profile-info">
            <h2 className="business-name">{profile?.name || 'Tasty Delights'}</h2>
            <p className="business-address">{profile?.address || '123 Food Street, Cuisine City'}</p>
          </div>
        </div>
        <div className="profile-stats">
          {statsItems.map((s, idx) => (
            <React.Fragment key={s.label}>
              <div className="stat-item">
                <div className="stat-value">{formatCompact(s.value)}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              {idx !== statsItems.length - 1 ? <div className="stat-divider" /> : null}
            </React.Fragment>
          ))}
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
                  <span className="gallery-item-title">{v.name || 'Food Item'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      
    </div>
  );
};

export default ProfileFoodPartner;
