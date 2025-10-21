import React, { useState } from 'react';
import './CreateFood.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateFood = () => {

  const navigate = useNavigate();

  const [food, setFood] = useState({
    name: '',
    description: '',
    video: null
  });
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'video') {
      setFood({ ...food, video: files[0] });
      setVideoPreview(URL.createObjectURL(files[0]));
    } else {
      setFood({ ...food, [name]: value });
    }
  };

  const handleSubmit =async (e) => {
    e.preventDefault();
    // Add submit logic here (e.g., send food data and video file to backend)
    const formData = new FormData();
    formData.append('name', food.name);
    formData.append('description', food.description);
    formData.append('video', food.video);

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3000/api/food', formData, { withCredentials: true });
      console.log(response.data);
      alert('Food item created successfully!');
      navigate('/profile-foodpartner');
      setVideoPreview(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to create food item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-food-container">
      <h2>Add New Food Item</h2>
      <form className="create-food-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={food.name}
            onChange={handleChange}
            required
            placeholder="Enter food name"
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={food.description}
            onChange={handleChange}
            required
            placeholder="Enter description"
          />
        </label>
        <label>
          Video
          <input
            type="file"
            name="video"
            accept="video/*"
            onChange={handleChange}
            required
          />
        </label>
        {videoPreview && (
          <video
            src={videoPreview}
            controls
            width="100%"
            style={{ marginBottom: '16px', borderRadius: '8px' }}
          />
        )}
        <button type="submit" disabled={loading} className={loading ? 'disabled' : ''}>
          {loading ? 'Uploading...' : 'Add Food'}
        </button>
      
        {loading && (
          <div className="loader-overlay">
            <div className="loader" />
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateFood;