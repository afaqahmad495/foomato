import React, { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegComment, FaBookmark, FaHome, FaReceipt } from 'react-icons/fa';
import SaveButton from '../components/SaveButton';
import {useNavigate} from 'react-router-dom'
import {Link} from 'react-router-dom'
import { useParams, useLocation } from 'react-router-dom';
import './Home.css';
import { api } from '../../lib/api';
import CommentsSheet from './CommentsSheet';


const Home = () => {
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeFoodId, setActiveFoodId] = useState(null);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoContainerRef = useRef(null);
  const videoRefs = useRef([]);
  const navigate = useNavigate();

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get('/api/food/get-food-item');
        setVideos(response.data.foodItems);
      } catch (error) {
        
        console.error('Error fetching videos:', error);
      }
    };
    fetchVideos();
  }, [location.key]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await api.get('/api/food/favourites');
        // response.data.favourites should be an array of foodItem IDs (strings)
        const favs = {};
        if (response.data && Array.isArray(response.data.favourites)) {
          response.data.favourites.forEach(id => {
            favs[id] = true;
          });
        }
        console.log('favourites fetched', response.data.favourites)
        setFavorites(favs);
      } catch (error) {
        console.error('Error fetching favourites:', error);
      } finally {
        setLoadingFavorites(false);
      }
    };
    fetchFavorites();
  }, []);

  // Handle scroll snapping
  useEffect(() => {
    const handleScroll = () => {
      if (videoContainerRef.current) {
        const containerHeight = videoContainerRef.current.clientHeight;
        const scrollPosition = videoContainerRef.current.scrollTop;
        const index = Math.round(scrollPosition / containerHeight);
        if (index !== currentVideoIndex) {
          setCurrentVideoIndex(index);
        }
      }
    };

    const container = videoContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentVideoIndex]);

  // Play current video and pause others
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideoIndex) {
          video.play().catch(error => console.log("Autoplay prevented:", error));
        } else {
          video.pause();
        }
      }
    });
  }, [currentVideoIndex]);

  // Truncate description to 2 lines
  const truncateDescription = (text) => {
    return text.length > 70 ? text.substring(0, 70) + '...' : text;
  };

  // Toggle favorite status using API
  const toggleFavorite = async (foodId) => {
    try {
      if (favorites[foodId]) {
        // Remove from favorites
        await api.delete(`/api/food/favourite/${foodId}`);
        setFavorites(prev => {
          const copy = { ...prev };
          delete copy[foodId];
          return copy;
        });
        // optimistic decrement of likesCount in local state
        setVideos(prev => prev.map(v => v._id === foodId ? { ...v, likesCount: Math.max(0, (v.likesCount||0) - 1) } : v));
      } else {
        // Add to favorites
        await api.post(`/api/food/favourite/${foodId}`);
        setFavorites(prev => ({ ...prev, [foodId]: true }));
        // optimistic increment of likesCount in local state
        setVideos(prev => prev.map(v => v._id === foodId ? { ...v, likesCount: (v.likesCount||0) + 1 } : v));
      }
    } catch (error) {
      console.error('Error updating favourite:', error);
    }
  };

  const openComments = (foodId) => {
    setActiveFoodId(foodId);
    setCommentsOpen(true);
  };

  const closeComments = () => {
    setCommentsOpen(false);
    setTimeout(() => setActiveFoodId(null), 280);
  };

  return (
    <div
      ref={videoContainerRef}
      style={{
        height: '100vh',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
      }}
    >
      {videos.map((item, index) => (
        <div
          key={item._id}
          style={{
            position: 'relative',
            height: '100vh',
            width: '100%',
            scrollSnapAlign: 'start',
            backgroundColor: '#000',
            color: '#fff',
          }}
        >
          <video
            ref={el => videoRefs.current[index] = el}
            src={item.video}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loop
            playsInline
            muted
          />

          {/* Right action column (likes, save, comment) */}
          <div className="action-column">
            <div style={{ textAlign: 'center' }}>
              <FaHeart
                onClick={() => toggleFavorite(item._id)}
                style={{ fontSize: '30px', cursor: loadingFavorites ? 'not-allowed' : 'pointer', color: favorites[item._id] ? '#ff476f' : 'rgba(255,255,255,0.9)' }}
                title={favorites[item._id] ? 'Remove from favorites' : 'Add to favorites'}
              />
              <div style={{ fontSize: '14px', marginTop: '6px' }}>{item.likesCount ?? 0}</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '6px' }}>
                <SaveButton
                  initialSaved={false}
                  disabled={loadingFavorites}
                  foodId={item._id}
                  onToggle={(isSaved) => {
                    // optimistic update of savesCount on parent
                    setVideos(prev => prev.map(v => v._id === item._id ? { ...v, savesCount: isSaved ? (v.savesCount||0) + 1 : Math.max(0, (v.savesCount||0) - 1) } : v));
                  }}
                />
              </div>
              <div style={{ fontSize: '14px' }}>{item.savesCount ?? 0}</div>
            </div>

            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => openComments(item._id)}>
              <FaRegComment style={{ fontSize: '30px', color: 'rgba(255,255,255,0.9)' }} />
              <div style={{ fontSize: '14px', marginTop: '6px' }}>{item.commentsCount ?? 0}</div>
            </div>
          </div>

          {/* Bottom-left description + Visit Store */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '16px',
            zIndex: 2,
            maxWidth: '65%',
            color: '#fff',
          }}>
            {typeof item.price === 'number' && !Number.isNaN(item.price) && (
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                Rs {item.price}
              </div>
            )}
            <div style={{ fontSize: '16px', marginBottom: '10px' }}>{truncateDescription(item.description)}</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                style={{
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/profile-foodpartner/${item.foodPartner}`)}
              >
                Visit store
              </button>

              <button
                style={{
                  backgroundColor: '#ff476f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/checkout/${item._id}`, { state: { item } })}
              >
                Order Now
              </button>
            </div>
          </div>

          {/* Bottom divider and nav icons */}
          <div style={{ position: 'absolute', bottom: '0', left: 0, width: '100%', zIndex: 2 }}>
            <div style={{ height: '6px', background: 'transparent' }} />
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.6)', margin: '0 10px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 22px', alignItems: 'center' }}>
              <FaHome onClick={() => navigate('/home')} style={{ fontSize: '26px', color: 'rgba(255,255,255,0.95)', cursor: 'pointer' }} />
              <FaReceipt onClick={() => navigate('/orders')} style={{ fontSize: '24px', color: 'rgba(255,255,255,0.95)', cursor: 'pointer' }} />
              <FaBookmark onClick={() => navigate('/saved')} style={{ fontSize: '26px', color: 'rgba(255,255,255,0.95)', cursor: 'pointer' }} />
            </div>
          </div>
        </div>
      ))}

      <CommentsSheet
        open={commentsOpen && !!activeFoodId}
        foodId={activeFoodId}
        onClose={closeComments}
        onCommentAdded={(foodId) => {
          setVideos(prev => prev.map(v => v._id === foodId ? { ...v, commentsCount: (v.commentsCount || 0) + 1 } : v));
        }}
      />
    </div>
  );
};

export default Home;
